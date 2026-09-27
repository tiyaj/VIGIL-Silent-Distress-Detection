from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Alert
from app.models.call import Call
from app.schemas.alert import AlertResponse

router = APIRouter(prefix="/alerts", tags=["alerts"])


def format_duration(seconds: int = None) -> str:
    if not seconds:
        return "1m 45s"
    minutes = seconds // 60
    rem_seconds = seconds % 60
    return f"{minutes}m {rem_seconds}s" if minutes else f"{rem_seconds}s"


@router.get("", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.dispatched_at.desc()).all()
    results = []
    for alert in alerts:
        call = db.query(Call).filter(Call.id == alert.call_id).first() if alert.call_id else None
        call_with = call.participant_name if call and call.participant_name else "Unknown Participant"
        duration = format_duration(call.duration_seconds if call else None)
        formatted_signals = []
        for s in (alert.top_signals or []):
            if isinstance(s, dict):
                contrib = f" ({s['contribution']})" if s.get("contribution") else ""
                formatted_signals.append(f"{s.get('name', 'Vocal Anomaly')}{contrib}")
            else:
                formatted_signals.append(str(s))

        results.append(
            AlertResponse(
                id=alert.id,
                date=alert.dispatched_at.isoformat() if alert.dispatched_at else "",
                callWith=call_with,
                duration=duration,
                peakScore=alert.peak_score,
                riskLevel=alert.risk_level,
                status=alert.status,
                codewordTriggered=alert.codeword_triggered,
                topSignals=formatted_signals,
            )
        )
    return results
