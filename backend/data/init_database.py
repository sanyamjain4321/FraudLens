import asyncio
import os
import datetime
import hashlib
from backend.database import engine, Base
import backend.models
from backend.models.user import User
from backend.models.customer import Customer
from backend.models.device import Device
from backend.models.audit import AuditEntry

def hash_password(password: str) -> str:
    salt = "paysentinel_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

async def reset_and_seed_db():
    db_path = os.path.join(os.path.dirname(__file__), "..", "..", "razorshield.db")
    db_path = os.path.abspath(db_path)
    
    print(f"Recreating database schema at: {db_path}")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    print("Database tables created cleanly!")
    
    from backend.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        default_user = User(
            id="USR-DEMO-01",
            name="Risk Analyst",
            email="analyst@razorshield.ai",
            password_hash=hash_password("password123"),
            organization="Pay Sentinel Risk Ops",
            role="Senior Risk Analyst",
            created_at=datetime.datetime.utcnow(),
            last_login=datetime.datetime.utcnow()
        )
        session.add(default_user)
        
        cust1 = Customer(
            id="CUST-1001",
            name="Rahul Sharma",
            email="rahul.s@example.com",
            phone="+919876543210",
            account_age_days=180,
            trust_score=85.0,
            total_transactions=24,
            successful_transactions=23,
            total_amount=45000.0,
            avg_transaction_amount=1875.0,
            chargeback_count=0,
            chargeback_rate=0.0,
            usual_city="Mumbai",
            usual_state="Maharashtra",
            risk_category="low"
        )
        cust2 = Customer(
            id="CUST-1002",
            name="Priya Patel",
            email="priya.p@example.com",
            phone="+919812345678",
            account_age_days=30,
            trust_score=60.0,
            total_transactions=5,
            successful_transactions=3,
            total_amount=12000.0,
            avg_transaction_amount=2400.0,
            chargeback_count=1,
            chargeback_rate=0.2,
            usual_city="Bengaluru",
            usual_state="Karnataka",
            risk_category="medium"
        )
        session.add(cust1)
        session.add(cust2)
        
        dev1 = Device(
            id="DEV-901",
            device_type="mobile",
            os="Android 14",
            browser="Chrome 122",
            transaction_count=12,
            is_trusted=True,
            risk_score=15.0
        )
        session.add(dev1)
        
        session.add(AuditEntry(
            actor="system",
            action="SYSTEM_INIT",
            entity="system",
            entity_id="SYS-001",
            risk_score=0.0,
            details="Pay Sentinel AI database schema initialized cleanly.",
            timestamp=datetime.datetime.utcnow()
        ))
        
        await session.commit()
        print("Database seeded with default user: analyst@razorshield.ai / password123")

if __name__ == "__main__":
    asyncio.run(reset_and_seed_db())
