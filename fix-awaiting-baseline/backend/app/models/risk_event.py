from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    call_id = Column(String, ForeignKey("calls.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    level = Column(String, nullable=False)
    signals = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    call = relationship("Call", back_populates="risk_events")
