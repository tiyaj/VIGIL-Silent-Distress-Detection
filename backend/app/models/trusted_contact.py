from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class TrustedContact(Base):
    __tablename__ = "trusted_contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relationship = Column(String, nullable=False)
    auto_sms = Column(Boolean, default=True)
    push_notification = Column(Boolean, default=True)
