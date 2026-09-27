from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Call(Base):
    __tablename__ = "calls"

    id = Column(String, primary_key=True, index=True)
    participant_name = Column(String, nullable=True)
    participant_number = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    final_risk_level = Column(String, nullable=True)

    risk_events = relationship("RiskEvent", back_populates="call", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="call")
