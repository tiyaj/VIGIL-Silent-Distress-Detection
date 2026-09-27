from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Codeword(Base):
    __tablename__ = "codewords"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, nullable=True, index=True)
    distress_codeword = Column(String, nullable=False)
    cancellation_phrase = Column(String, nullable=False)
    allow_cancellation = Column(Boolean, default=True)
