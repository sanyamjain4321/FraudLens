import datetime
from sqlalchemy import Column, String, Float, Text, DateTime
from backend.database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    transaction_id = Column(String, index=True)
    customer_id = Column(String, index=True)
    status = Column(String, default="open", index=True)
    severity = Column(String, default="medium")
    title = Column(String, default="")
    description = Column(Text, default="")
    risk_score = Column(Float, nullable=True)
    threat_type = Column(String, nullable=True)
    evidence = Column(Text, nullable=True)
    ai_recommendation = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    analyst_decision = Column(String, nullable=True)
    analyst_notes = Column(Text, nullable=True)
    assigned_to = Column(String, default="unassigned")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
