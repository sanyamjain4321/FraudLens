import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    transaction_id = Column(String, nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True, index=True)
    merchant_id = Column(String, nullable=True, index=True)
    merchant_name = Column(String, default="")
    merchant_category = Column(String, default="general")
    amount = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    payment_method = Column(String, default="upi")
    card_bin = Column(String, nullable=True, index=True)
    payment_instrument_id = Column(String, nullable=True, index=True)
    device_id = Column(String, nullable=True, index=True)
    ip_address = Column(String, nullable=True)
    country = Column(String, default="India")
    city = Column(String, default="")
    location_city = Column(String, default="")
    location_state = Column(String, default="")
    location_country = Column(String, default="India")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String, default="pending", index=True)
    decision = Column(String, default="allow", index=True) # allow, step_up, hold, decline
    
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="low", index=True)
    fraud_probability = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    velocity_score = Column(Float, default=0.0)
    network_score = Column(Float, default=0.0)
    rule_score = Column(Float, default=0.0)
    evidence = Column(Text, nullable=True) # JSON string
    
    threat_type = Column(String, nullable=True, index=True)
    ground_truth_label = Column(Integer, default=0) # 0 = legitimate, 1 = fraud
    source = Column(String, default="SIMULATOR") # SIMULATOR or LIVE_EVENT
    
    primary_signal = Column(String, nullable=True)
    is_flagged = Column(Boolean, default=False, index=True)
    is_fraud = Column(Boolean, default=False, index=True)
    fraud_type = Column(String, nullable=True, index=True)
    failed_attempts = Column(Integer, default=0)
    velocity_1h = Column(Integer, default=0)
    amount_deviation = Column(Float, default=0.0)
    is_new_device = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="transactions")
