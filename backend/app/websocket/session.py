import logging
from datetime import datetime
from typing import Optional, Dict

from app.database import SessionLocal
from app.models.call import Call
from app.models.risk_event import RiskEvent
from app.models.alert import Alert
from app.risk.engine import fuse_risk
from app.risk.state_machine import EscalationStateMachine
from app.risk.calibration import CalibrationTimer
from app.risk.codeword import get_active_codeword_matcher
from app.services.ml_bridge import audio_buffer_manager, process_audio_chunk
from app.websocket.manager import room_manager

logger = logging.getLogger("vigil.session")


class CallSession:
    def __init__(self, call_id: str):
        self.call_id = call_id
        self.state_machine = EscalationStateMachine(call_id)
        self.started_at = datetime.utcnow()
        self.active_alert_id: Optional[str] = None
        self.is_monitoring = False

        with SessionLocal() as db:
            self.codeword_matcher = get_active_codeword_matcher(db)
            # Ensure Call entry exists in DB
            call = db.query(Call).filter(Call.id == call_id).first()
            if not call:
                call = Call(
                    id=call_id,
                    participant_name="Emergency Channel",
                    participant_number="+1 (555) 728-1920",
                    started_at=self.started_at,
                    final_risk_level="NORMAL",
                )
                db.add(call)
                db.commit()

        # Calibration timer
        self.calibration_timer = CalibrationTimer(
            call_id=call_id,
            on_progress=self._on_calibration_progress,
            on_complete=self._on_calibration_complete,
        )

    async def _on_calibration_progress(self, event: dict):
        await room_manager.broadcast(self.call_id, event)

    async def _on_calibration_complete(self):
        self.is_monitoring = True
        logger.info(f"Calibration completed for call '{self.call_id}'. Live monitoring active.")

    def start_calibration(self):
        self.calibration_timer.start()

    async def handle_audio_chunk(self, chunk_b64: str, mime_type: str = "audio/webm;codecs=opus"):
        """Decodes chunk, appends to the session's growing raw buffer, and processes acoustic features."""
        features = process_audio_chunk(chunk_b64, mime_type=mime_type, call_id=self.call_id)
        if features:
            await self.handle_audio_features(features)

    async def handle_audio_features(self, features: dict):
        """Fuses audio features, evaluates escalation, broadcasts telemetry, and persists to DB."""
        is_cw = self.state_machine.codeword_triggered
        fusion = fuse_risk(features, codeword_detected=is_cw)
        score = fusion["score"]
        level = fusion["level"]
        signals_dict = fusion["signals"]
        ui_signals = fusion.get("ui_signals", [])

        # 1. Broadcast live risk update
        risk_event = {
            "type": "risk_update",
            "payload": {
                "score": score,
                "level": level,
                "level_code": fusion.get("level_code", 0),
                "signals": signals_dict,
                "contributing_signals": ui_signals,
            },
        }
        await room_manager.broadcast(self.call_id, risk_event)

        # 2. Check escalation
        alert_event = self.state_machine.update(score, level, codeword_detected=False)
        if alert_event:
            await room_manager.broadcast(self.call_id, {"type": "alert_status", "payload": alert_event})

        # 3. Persist to DB
        with SessionLocal() as db:
            re = RiskEvent(
                call_id=self.call_id,
                score=score,
                level=level,
                signals=signals_dict,
            )
            db.add(re)

            if alert_event and not self.active_alert_id:
                al = Alert(
                    call_id=self.call_id,
                    peak_score=score,
                    risk_level=level,
                    status=alert_event["status"],
                    codeword_triggered=False,
                    top_signals=ui_signals if ui_signals else [signals_dict],
                )
                db.add(al)
                db.commit()
                db.refresh(al)
                self.active_alert_id = al.id
            else:
                db.commit()

    async def trigger_codeword(self, codeword: Optional[str] = None):
        """Handles distress codeword detection (spoken or transcript)."""
        cw = codeword or self.codeword_matcher.distress_codeword
        logger.warning(f"Distress codeword '{cw}' detected in call '{self.call_id}'!")
        self.state_machine.codeword_triggered = True

        # 1. Broadcast codeword_detected
        await room_manager.broadcast(
            self.call_id,
            {"type": "codeword_detected", "payload": {"codeword": cw}},
        )

        # 2. Risk update
        fusion = fuse_risk({}, codeword_detected=True)
        await room_manager.broadcast(
            self.call_id,
            {
                "type": "risk_update",
                "payload": {
                    "score": fusion["score"],
                    "level": fusion["level"],
                    "level_code": fusion.get("level_code", 3),
                    "signals": fusion["signals"],
                    "contributing_signals": fusion.get("ui_signals", []),
                },
            },
        )

        # 3. Alert escalation
        alert_event = self.state_machine.update(fusion["score"], fusion["level"], codeword_detected=True)
        if alert_event:
            await room_manager.broadcast(self.call_id, {"type": "alert_status", "payload": alert_event})

        # 4. Persist to DB
        with SessionLocal() as db:
            re = RiskEvent(
                call_id=self.call_id,
                score=fusion["score"],
                level=fusion["level"],
                signals=fusion["signals"],
            )
            db.add(re)

            al = Alert(
                call_id=self.call_id,
                peak_score=fusion["score"],
                risk_level=fusion["level"],
                status="alert_dispatched",
                codeword_triggered=True,
                top_signals=fusion.get("ui_signals", []),
            )
            db.add(al)
            db.commit()
            db.refresh(al)
            self.active_alert_id = al.id

    async def trigger_cancellation(self):
        """Handles safety cancellation phrase."""
        logger.info(f"Cancellation phrase verified for call '{self.call_id}'")
        cancel_event = self.state_machine.cancel()

        # 1. Broadcast alert_status cancelled
        await room_manager.broadcast(
            self.call_id,
            {"type": "alert_status", "payload": cancel_event},
        )

        # 2. Broadcast reset risk score
        await room_manager.broadcast(
            self.call_id,
            {
                "type": "risk_update",
                "payload": {
                    "score": self.state_machine.current_score,
                    "level": self.state_machine.current_level,
                    "signals": [],
                },
            },
        )

        # 3. Update DB
        with SessionLocal() as db:
            alerts = db.query(Alert).filter(Alert.call_id == self.call_id, Alert.status == "alert_dispatched").all()
            for al in alerts:
                al.status = "cancelled_by_user"
            db.commit()

    async def handle_transcript(self, text: str):
        """Evaluates spoken speech transcript for keywords."""
        match = self.codeword_matcher.check_text(text)
        if match == "distress":
            await self.trigger_codeword()
        elif match == "cancellation":
            await self.trigger_cancellation()

    def close(self):
        """Finalizes call in DB and cleans up resources."""
        self.calibration_timer.stop()
        audio_buffer_manager.clear(self.call_id)
        ended_at = datetime.utcnow()
        duration_seconds = int((ended_at - self.started_at).total_seconds())

        with SessionLocal() as db:
            call = db.query(Call).filter(Call.id == self.call_id).first()
            if call:
                call.ended_at = ended_at
                call.duration_seconds = duration_seconds
                call.final_risk_level = self.state_machine.current_level
                db.commit()
        logger.info(f"CallSession '{self.call_id}' finalized (duration: {duration_seconds}s).")


# Active sessions registry
sessions: Dict[str, CallSession] = {}


def get_or_create_session(call_id: str) -> CallSession:
    if call_id not in sessions:
        sessions[call_id] = CallSession(call_id)
        sessions[call_id].start_calibration()
    return sessions[call_id]


def cleanup_session_if_empty(call_id: str):
    peers = room_manager.rooms.get(call_id, set())
    if not peers and call_id in sessions:
        session = sessions.pop(call_id)
        session.close()
