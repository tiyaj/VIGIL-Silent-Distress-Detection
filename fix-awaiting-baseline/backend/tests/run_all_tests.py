import asyncio
import base64
import json
import os
import sys
import urllib.request
import urllib.error
import websockets

from app.config import (
    DATABASE_URL,
    CORS_ORIGINS,
    RISK_THRESHOLD_ELEVATED,
    RISK_THRESHOLD_CRITICAL,
    CALIBRATION_SECONDS,
)
from app.database import SessionLocal, init_db, engine
from app.models import TrustedContact, Codeword, Call, RiskEvent, Alert
from app.risk.engine import fuse_risk
from app.risk.state_machine import EscalationStateMachine
from app.risk.calibration import CalibrationTimer
from app.risk.codeword import CodewordMatcher
from app.services.ml_bridge import process_audio_chunk, analyze_audio_chunk
from sqlalchemy import inspect

BACKEND_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws/telemetry"


def print_step(num: int, title: str):
    print(f"\n{'='*60}\n[STEP {num}] {title}\n{'='*60}")


# --- STEP 1: Main FastAPI App & Root Endpoint ---
def test_step_1():
    print_step(1, "FastAPI App & Root Endpoint (GET /)")
    req = urllib.request.Request(f"{BACKEND_URL}/")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        body = json.loads(resp.read().decode())
        assert body == {"status": "ok"}, f"Unexpected body: {body}"
        print(f"PASS: GET / returned {body}")


# --- STEP 2: Config & Environment Variables ---
def test_step_2():
    print_step(2, "Config & Environment Variables (app/config.py)")
    assert "http://localhost:5173" in CORS_ORIGINS
    assert RISK_THRESHOLD_ELEVATED == 40
    assert RISK_THRESHOLD_CRITICAL == 70
    assert CALIBRATION_SECONDS == 15
    print(f"PASS: Loaded CORS_ORIGINS={CORS_ORIGINS}")
    print(f"PASS: Thresholds Elevated={RISK_THRESHOLD_ELEVATED}, Critical={RISK_THRESHOLD_CRITICAL}, CalibrationSeconds={CALIBRATION_SECONDS}")


# --- STEP 3: Database & Models (5 tables) ---
def test_step_3():
    print_step(3, "Database & Models (5 tables per Section G)")
    init_db()
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    expected = {"trusted_contacts", "codewords", "calls", "risk_events", "alerts"}
    assert expected.issubset(tables), f"Missing tables: {expected - tables}"
    print(f"PASS: All 5 tables verified in DB: {sorted(list(tables))}")


# --- STEP 4: REST API Endpoints & Validations ---
def test_step_4():
    print_step(4, "REST API Endpoints (/api/v1/settings* & /api/v1/alerts)")
    
    # 4a. GET /api/v1/settings
    with urllib.request.urlopen(f"{BACKEND_URL}/api/v1/settings") as resp:
        assert resp.status == 200
        settings = json.loads(resp.read().decode())
        assert "trustedContact" in settings and "codewords" in settings
        print("PASS: GET /api/v1/settings returned valid shape")

    # 4b. POST /api/v1/settings/trusted-contact (Success)
    contact_data = json.dumps({
        "name": "Sarah Connor",
        "phone": "+1 (555) 382-9011",
        "relationship": "Family Member",
        "autoSms": True,
        "pushNotification": True
    }).encode()
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/settings/trusted-contact",
        data=contact_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        assert res["success"] is True
        assert res["trustedContact"]["name"] == "Sarah Connor"
        print("PASS: POST /api/v1/settings/trusted-contact succeeded")

    # 4c. POST /api/v1/settings/trusted-contact (Validation 422)
    req_bad = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/settings/trusted-contact",
        data=json.dumps({"name": "", "phone": "+123", "relationship": "Friend"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req_bad)
        assert False, "Expected 422 for empty name"
    except urllib.error.HTTPError as e:
        assert e.code == 422
        print("PASS: Validation 422 returned for invalid contact input")

    # 4d. POST /api/v1/settings/codewords
    cw_data = json.dumps({
        "distressCodeword": "Silver Willow",
        "cancellationPhrase": "Status Clear Blue",
        "allowCancellation": True
    }).encode()
    req_cw = urllib.request.Request(
        f"{BACKEND_URL}/api/v1/settings/codewords",
        data=cw_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_cw) as resp:
        res = json.loads(resp.read().decode())
        assert res["success"] is True
        print("PASS: POST /api/v1/settings/codewords succeeded")

    # 4e. GET /api/v1/alerts
    with urllib.request.urlopen(f"{BACKEND_URL}/api/v1/alerts") as resp:
        assert resp.status == 200
        alerts = json.loads(resp.read().decode())
        assert isinstance(alerts, list)
        print("PASS: GET /api/v1/alerts returned JSON array")


# --- STEP 5: WebSocket Connection & Envelope ---
async def test_step_5():
    print_step(5, "WebSocket Connection & Envelope Handling")
    async with websockets.connect(f"{WS_URL}?call_id=step5_test") as ws:
        msg = {"type": "ping", "payload": {"status": "alive"}}
        await ws.send(json.dumps(msg))
        
        # Drain potential calibration event and find ping response
        found = False
        for _ in range(3):
            reply = json.loads(await asyncio.wait_for(ws.recv(), timeout=2.0))
            if reply.get("type") == "ping":
                assert reply["payload"] == {"status": "alive"}
                found = True
                break
        assert found, "WebSocket ping/pong envelope verification failed"
        print("PASS: WebSocket connected and preserved {type, payload} envelope")


# --- STEP 6: WebRTC Relay Logic ---
async def test_step_6():
    print_step(6, "WebRTC Signaling Relay (offer/answer/ice_candidate)")
    room = "step6_relay_room"
    uri = f"{WS_URL}?call_id={room}"

    async with websockets.connect(uri) as ws_caller, websockets.connect(uri) as ws_callee:
        # Drain calibration events
        await asyncio.sleep(0.1)

        # 1. Caller sends offer
        offer = {"type": "offer", "payload": {"sdp": "v=0\r\no=caller..."}}
        await ws_caller.send(json.dumps(offer))
        
        received_offer = False
        for _ in range(3):
            msg = json.loads(await asyncio.wait_for(ws_callee.recv(), timeout=2.0))
            if msg.get("type") == "offer":
                assert msg["payload"] == offer["payload"]
                received_offer = True
                break
        assert received_offer, "Callee did not receive relayed offer"
        print("PASS: Relayed 'offer' from Caller to Callee")

        # 2. Callee sends answer
        answer = {"type": "answer", "payload": {"sdp": "v=0\r\no=callee..."}}
        await ws_callee.send(json.dumps(answer))

        received_answer = False
        for _ in range(3):
            msg = json.loads(await asyncio.wait_for(ws_caller.recv(), timeout=2.0))
            if msg.get("type") == "answer":
                assert msg["payload"] == answer["payload"]
                received_answer = True
                break
        assert received_answer, "Caller did not receive relayed answer"
        print("PASS: Relayed 'answer' from Callee to Caller")

        # 3. Caller sends ICE candidate
        ice = {"type": "ice_candidate", "payload": {"candidate": "candidate:1..."}}
        await ws_caller.send(json.dumps(ice))

        received_ice = False
        for _ in range(3):
            msg = json.loads(await asyncio.wait_for(ws_callee.recv(), timeout=2.0))
            if msg.get("type") == "ice_candidate":
                assert msg["payload"] == ice["payload"]
                received_ice = True
                break
        assert received_ice, "Callee did not receive relayed ICE candidate"
        print("PASS: Relayed 'ice_candidate' successfully")


# --- STEP 7: Audio Chunk Handling & ML Bridge ---
def test_step_7():
    print_step(7, "Audio Chunk Handling & ML Bridge Stub")
    raw = b"fake_opus_audio_bytes"
    b64 = base64.b64encode(raw).decode()
    features = process_audio_chunk(b64, "audio/webm;codecs=opus")
    assert "pitch" in features and "speaking_rate" in features and "pause_duration" in features
    print(f"PASS: process_audio_chunk returned acoustic features: {features}")


# --- STEP 8: Risk Fusion Engine ---
def test_step_8():
    print_step(8, "Risk Fusion Engine (risk/engine.py)")
    norm = fuse_risk({"pitch_deviation": 0.01, "speech_rate_deviation": 0.01, "pause_deviation": 0.01, "energy_deviation": 0.01})
    assert norm["score"] <= 25 and norm["level"] == "NORMAL"
    print(f"PASS: Normal acoustic tier (0-25) -> Score={norm['score']}, Level={norm['level']}")

    elev = fuse_risk({"pitch_deviation": 0.40, "speech_rate_deviation": 0.40, "pause_deviation": 0.35, "energy_deviation": 0.35})
    assert 26 <= elev["score"] <= 50 and elev["level"] == "ELEVATED TENSION"
    print(f"PASS: Suspicious/Elevated tier (26-50) -> Score={elev['score']}, Level={elev['level']}")

    crit = fuse_risk({"pitch_deviation": 0.80, "speech_rate_deviation": 0.80, "pause_deviation": 0.75, "energy_deviation": 0.75})
    assert crit["score"] > 75 and crit["level"] == "CRITICAL DISTRESS"
    print(f"PASS: Critical distress tier (>75) -> Score={crit['score']}, Level={crit['level']}")

    cw = fuse_risk({}, codeword_detected=True)
    assert cw["score"] >= 75 and cw["level_code"] in (2, 3)
    print(f"PASS: Codeword override -> Score={cw['score']}, Level={cw['level']}, Code={cw['level_code']}")


# --- STEP 9: Escalation State Machine ---
def test_step_9():
    print_step(9, "Escalation State Machine (risk/state_machine.py)")
    sm = EscalationStateMachine("step9_test")
    assert sm.alert_status == "idle"

    # Escalation to critical
    ev = sm.update(85, "CRITICAL DISTRESS")
    assert ev is not None and ev["status"] == "alert_dispatched"
    print("PASS: Transitioned to 'alert_dispatched'")

    # Cancellation
    cancel_ev = sm.cancel()
    assert cancel_ev["status"] == "cancelled_by_user"
    assert sm.current_score == 15
    print("PASS: Transitioned to 'cancelled_by_user' and reset score to 15")


# --- STEP 10: Calibration Timer ---
async def test_step_10():
    print_step(10, "Calibration Timer (risk/calibration.py)")
    events = []
    timer = CalibrationTimer(
        call_id="step10_test",
        total_seconds=2,
        on_progress=lambda e: events.append(e) or asyncio.sleep(0),
    )
    timer.start()
    await timer.task
    assert timer.is_complete is True
    assert events[0]["payload"]["progress"] == 0
    assert events[-1]["payload"]["progress"] == 100
    print(f"PASS: Calibration timer completed with {len(events)} events (0% -> 100%)")


# --- STEP 11: Codeword & Cancellation Spotter ---
def test_step_11():
    print_step(11, "Codeword & Cancellation Spotter (risk/codeword.py)")
    matcher = CodewordMatcher("Silver Willow", "Status Clear Blue")
    assert matcher.check_text("Look at that silver willow tree") == "distress"
    assert matcher.check_text("All safe status clear blue") == "cancellation"
    assert matcher.check_text("General conversational text") is None
    print("PASS: Spoken keyword spotter accurately identified distress and cancellation")


# --- STEP 12: Live Session Orchestration & Database Persistence ---
async def test_step_12():
    print_step(12, "Full Live Session Orchestration & DB Persistence")
    call_id = "step12_verification_call"
    uri = f"{WS_URL}?call_id={call_id}"

    async with websockets.connect(uri) as ws:
        # Initial calibration
        c_msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=2.0))
        assert c_msg["type"] == "calibration_progress"
        print("PASS: Received live calibration_progress from backend")

        # Audio chunk
        b64 = base64.b64encode(b"live_audio_data").decode()
        await ws.send(json.dumps({"type": "audio_chunk", "payload": {"chunk": b64}}))

        got_risk = False
        for _ in range(4):
            m = json.loads(await asyncio.wait_for(ws.recv(), timeout=2.0))
            if m.get("type") == "risk_update":
                got_risk = True
                print(f"PASS: Received real-time risk_update: score={m['payload']['score']}, level={m['payload']['level']}")
                break
        assert got_risk

        # Codeword trigger
        await ws.send(json.dumps({"type": "transcript", "payload": {"text": "I see a Silver Willow"}}))
        got_cw = False
        got_alert = False
        for _ in range(6):
            m = json.loads(await asyncio.wait_for(ws.recv(), timeout=2.0))
            if m.get("type") == "codeword_detected":
                got_cw = True
            elif m.get("type") == "alert_status" and m["payload"]["status"] == "alert_dispatched":
                got_alert = True
            if got_cw and got_alert:
                break
        assert got_cw and got_alert
        print("PASS: Transcript distress triggered 'codeword_detected' and 'alert_dispatched'")

        # Cancellation phrase
        await ws.send(json.dumps({"type": "transcript", "payload": {"text": "Status Clear Blue"}}))
        got_cancel = False
        for _ in range(6):
            m = json.loads(await asyncio.wait_for(ws.recv(), timeout=2.0))
            if m.get("type") == "alert_status" and m["payload"]["status"] == "cancelled_by_user":
                got_cancel = True
                break
        assert got_cancel
        print("PASS: Transcript cancellation phrase neutralized alert to 'cancelled_by_user'")

    # Disconnect & verify DB records
    await asyncio.sleep(0.5)
    with SessionLocal() as db:
        call = db.query(Call).filter(Call.id == call_id).first()
        assert call is not None, "Call not saved in DB"
        events = db.query(RiskEvent).filter(RiskEvent.call_id == call_id).all()
        assert len(events) >= 2, "Risk events not saved in DB"
        alerts = db.query(Alert).filter(Alert.call_id == call_id).all()
        assert len(alerts) >= 1, "Alert not saved in DB"
        cw_alert = next((a for a in alerts if a.codeword_triggered), alerts[0])
        assert cw_alert.status == "cancelled_by_user"
        assert any(a.codeword_triggered for a in alerts)
        print(f"PASS: Database verified: Call(id={call.id}), RiskEvents(count={len(events)}), Alert(id={cw_alert.id}, status={cw_alert.status}, codeword={cw_alert.codeword_triggered})")

        # Cleanup test records
        db.query(Alert).filter(Alert.call_id == call_id).delete()
        db.query(RiskEvent).filter(RiskEvent.call_id == call_id).delete()
        db.query(Call).filter(Call.id == call_id).delete()
        db.commit()
        print("PASS: Test records cleaned up cleanly")


async def main():
    print("\n============================================================")
    print("   RUNNING COMPLETE VIGIL BACKEND TEST SUITE (STEPS 1-12)   ")
    print("============================================================")
    test_step_1()
    test_step_2()
    test_step_3()
    test_step_4()
    await test_step_5()
    await test_step_6()
    test_step_7()
    test_step_8()
    test_step_9()
    await test_step_10()
    test_step_11()
    await test_step_12()
    print("\n" + "="*60)
    print("  ALL 12 STEPS PASSED VERIFICATION WITH 100% SUCCESS RATE  ")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
