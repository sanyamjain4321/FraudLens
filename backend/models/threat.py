import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON
from backend.database import Base


class Threat(Base):
    __tablename__ = "threats"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, index=True) # CARD_TESTING, ABUSE_RING, IMPOSSIBLE_TRAVEL, VELOCITY_SPIKE
    severity = Column(String, default="high", index=True) # low, medium, high, critical
    detected_time = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    status = Column(String, default="active", index=True) # active, resolved, false_positive
    risk_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    
    # Store affected entities as JSON (e.g., list of transaction IDs, device IDs, etc.)
    affected_transactions = Column(JSON, default=[])
    affected_entities = Column(JSON, default={}) # e.g. {"devices": [...], "customers": [...]}
    
    evidence = Column(Text, nullable=True) # Explanation
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
