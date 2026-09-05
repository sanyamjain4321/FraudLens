import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, default="")
    email = Column(String, default="")
    phone = Column(String, default="")
    account_age_days = Column(Integer, default=365)
    trust_score = Column(Float, default=80.0)
    total_transactions = Column(Integer, default=0)
    successful_transactions = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    avg_transaction_amount = Column(Float, default=1000.0)
    chargeback_count = Column(Integer, default=0)
    chargeback_rate = Column(Float, default=0.0)
    usual_city = Column(String, default="Mumbai")
    usual_state = Column(String, default="Maharashtra")
    usual_country = Column(String, default="India")
    usual_latitude = Column(Float, nullable=True)
    usual_longitude = Column(Float, nullable=True)
    risk_category = Column(String, default="low")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transactions = relationship("Transaction", back_populates="customer")
