import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from backend.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), index=True)
    device_type = Column(String, default="mobile")
    os = Column(String, default="Android")
    browser = Column(String, default="Chrome")
    device_fingerprint = Column(String, default="")
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    transaction_count = Column(Integer, default=0)
    is_trusted = Column(Boolean, default=False)
    risk_score = Column(Float, default=0.0)
