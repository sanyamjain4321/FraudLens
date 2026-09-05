import datetime
from sqlalchemy import Column, String, Integer, DateTime, Float, Text
from backend.database import Base


class AuditEntry(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    actor = Column(String, default="system")
    action = Column(String, default="")
    entity = Column(String, default="")
    entity_id = Column(String, default="")
    risk_score = Column(Float, nullable=True)
    details = Column(Text, default="")
    ip_address = Column(String, nullable=True)
