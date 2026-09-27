import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


def generate_alert_id():
    return f"ALT-{uuid.uuid4().hex[:8].upper()}"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_alert_id, index=True)
    call_id = Column(String, ForeignKey("calls.id", ondelete="SET NULL"), nullable=True, index=True)
    peak_score = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)
    status = Column(String, default="alert_dispatched")
    codeword_triggered = Column(Boolean, default=False)
    top_signals = Column(JSON, nullable=True)
    dispatched_at = Column(DateTime, default=datetime.utcnow)

    call = relationship("Call", back_populates="alerts")
