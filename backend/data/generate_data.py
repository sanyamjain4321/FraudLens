"""
RazorShield AI - Synthetic Data Generator
Generates 50,000 realistic payment transactions with fraud patterns.
Run: python -m backend.data.generate_data
"""
import datetime
import random
import string
import uuid
import sys
import os

import numpy as np
from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.database import Base
from backend.models.transaction import Transaction
from backend.models.customer import Customer
from backend.models.device import Device
from backend.models.case import Case
from backend.models.audit import AuditEntry

fake = Faker('en_IN')
random.seed(42)
np.random.seed(42)

DB_URL = "sqlite:///./razorshield.db"

CITIES = [
    ("Mumbai", "Maharashtra", 19.076, 72.877),
    ("Delhi", "Delhi", 28.704, 77.102),
    ("Bangalore", "Karnataka", 12.972, 77.594),
    ("Chennai", "Tamil Nadu", 13.083, 80.270),
    ("Hyderabad", "Telangana", 17.385, 78.487),
    ("Pune", "Maharashtra", 18.520, 73.856),
    ("Kolkata", "West Bengal", 22.572, 88.364),
    ("Ahmedabad", "Gujarat", 23.023, 72.572),
    ("Jaipur", "Rajasthan", 26.913, 75.787),
    ("Surat", "Gujarat", 21.170, 72.831),
    ("Lucknow", "Uttar Pradesh", 26.847, 80.947),
    ("Kanpur", "Uttar Pradesh", 26.449, 80.331),
    ("Nagpur", "Maharashtra", 21.145, 79.082),
    ("Indore", "Madhya Pradesh", 22.718, 75.855),
    ("Bhopal", "Madhya Pradesh", 23.259, 77.413),
]

PAYMENT_METHODS = ["upi", "credit_card", "debit_card", "net_banking", "wallet"]
PAYMENT_WEIGHTS = [0.40, 0.25, 0.20, 0.10, 0.05]

MERCHANT_CATEGORIES = ["electronics", "travel", "food", "fashion", "gaming", "general", "luxury", "digital_services", "healthcare", "education"]

MERCHANT_NAMES = {
    "electronics": ["TechZone", "ElectroMart", "GadgetHub", "DigitalWorld"],
    "travel": ["MakeMyTrip", "GoIbibo", "Yatra", "IRCTC"],
    "food": ["Swiggy", "Zomato", "DineinDash", "QuickBite"],
    "fashion": ["Myntra", "Ajio", "FashionHub", "StyleStreet"],
    "gaming": ["GameZone", "PlayStore", "SteamIN", "GamingArena"],
    "general": ["Amazon", "Flipkart", "Snapdeal", "Meesho"],
    "luxury": ["Tanishq", "LuxuryBazaar", "PremiumGoods", "EliteStore"],
    "digital_services": ["Netflix", "Hotstar", "Spotify", "AmazonPrime"],
    "healthcare": ["PharmEasy", "1MG", "HealthMart", "MedPlus"],
    "education": ["Coursera", "Unacademy", "BYJU'S", "Vedantu"],
}

DEVICE_TYPES = ["mobile", "desktop", "tablet"]
OS_LIST = ["Android", "iOS", "Windows", "macOS"]
BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Samsung Browser"]


def random_id(prefix, n=6):
    return f"{prefix}-{str(uuid.uuid4().int)[:n].zfill(6)}"


def generate_customers(session, n=2000):
    print(f"Generating {n} customers...")
    customers = []
    for i in range(1, n + 1):
        city_data = random.choice(CITIES)
        age_days = random.randint(30, 2000)
        trust = round(random.uniform(40, 99), 1)
        avg_amt = round(np.random.lognormal(mean=8.5, sigma=1.2), 2)  # ~5000 INR typical
        avg_amt = max(200, min(avg_amt, 200000))
        chargeback = random.choices([0, 1, 2, 3], weights=[0.88, 0.08, 0.03, 0.01])[0]
        total = random.randint(5, 500)

        cust = Customer(
            id=f"CUST-{str(i).zfill(5)}",
            name=fake.name(),
            email=fake.email(),
            phone=fake.phone_number()[:15],
            account_age_days=age_days,
            trust_score=trust,
            total_transactions=total,
            successful_transactions=int(total * random.uniform(0.85, 0.99)),
            total_amount=round(avg_amt * total, 2),
            avg_transaction_amount=avg_amt,
            chargeback_count=chargeback,
            chargeback_rate=round(chargeback / max(total, 1), 4),
            usual_city=city_data[0],
            usual_state=city_data[1],
            usual_country="India",
            usual_latitude=city_data[2] + random.uniform(-0.1, 0.1),
            usual_longitude=city_data[3] + random.uniform(-0.1, 0.1),
            risk_category="low" if trust > 75 else ("medium" if trust > 55 else "high"),
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=age_days),
        )
        customers.append(cust)
        if i % 500 == 0:
            session.add_all(customers)
            session.commit()
            customers = []
            print(f"  {i} customers committed")

    if customers:
        session.add_all(customers)
        session.commit()
    print(f"  Done: {n} customers")


def generate_devices(session, customers, n=3000):
    print(f"Generating {n} devices...")
    devices = []
    cust_sample = random.choices(customers, k=n)
    for i, cust in enumerate(cust_sample):
        first_seen = datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 400))
        dev = Device(
            id=f"DEV-{str(uuid.uuid4().int)[:8]}",
            customer_id=cust.id,
            device_type=random.choice(DEVICE_TYPES),
            os=random.choice(OS_LIST),
            browser=random.choice(BROWSERS),
            device_fingerprint=uuid.uuid4().hex,
            first_seen=first_seen,
            last_seen=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(1, 72)),
            transaction_count=random.randint(1, 50),
            is_trusted=random.random() > 0.3,
            risk_score=round(random.uniform(0, 30), 2),
        )
        devices.append(dev)

    session.add_all(devices)
    session.commit()
    print(f"  Done: {len(devices)} devices")
    return devices


def make_transaction(txn_id, customer, device_id, city_data, ts, fraud_type="none"):
    """Create a transaction dict based on fraud type."""
    avg = customer.avg_transaction_amount or 1000
    method = random.choices(PAYMENT_METHODS, weights=PAYMENT_WEIGHTS)[0]
    cat = random.choice(MERCHANT_CATEGORIES)
    merchant = random.choice(MERCHANT_NAMES.get(cat, ["GenericStore"]))

    # Base values
    amount = round(np.random.lognormal(mean=np.log(avg), sigma=0.4), 2)
    amount = max(50, min(amount, 500000))
    failed = 0
    velocity = random.randint(1, 3)
    is_new_device = False
    city = city_data[0]
    state = city_data[1]
    lat = city_data[2] + random.uniform(-0.05, 0.05)
    lon = city_data[3] + random.uniform(-0.05, 0.05)
    amount_dev = round(amount / max(avg, 1), 2)
    risk_score = round(np.random.beta(1.5, 10) * 30, 2)  # mostly low
    risk_level = "low"
    is_fraud = False
    is_flagged = False
    primary_signal = "Normal Transaction"
    status = random.choices(["approved", "pending"], weights=[0.9, 0.1])[0]

    # Modify based on fraud type
    if fraud_type == "account_takeover":
        other_city = random.choice([c for c in CITIES if c[0] != customer.usual_city])
        city, state, lat, lon = other_city[0], other_city[1], other_city[2], other_city[3]
        amount = round(avg * random.uniform(3, 10), 2)
        amount = min(amount, 500000)
        failed = random.randint(2, 5)
        velocity = random.randint(2, 5)
        is_new_device = True
        amount_dev = round(amount / max(avg, 1), 2)
        risk_score = round(random.uniform(75, 99), 2)
        risk_level = "critical"
        is_fraud = True
        is_flagged = True
        primary_signal = "Account Takeover Detected"
        status = "flagged"
        method = random.choice(["credit_card", "net_banking"])

    elif fraud_type == "high_value_anomaly":
        amount = round(avg * random.uniform(5, 15), 2)
        amount = min(amount, 500000)
        amount_dev = round(amount / max(avg, 1), 2)
        risk_score = round(random.uniform(65, 88), 2)
        risk_level = "high"
        is_fraud = True
        is_flagged = True
        primary_signal = "High Value Anomaly"
        status = "flagged"

    elif fraud_type == "velocity_attack":
        velocity = random.randint(8, 20)
        amount = round(avg * random.uniform(0.5, 2), 2)
        amount_dev = round(amount / max(avg, 1), 2)
        risk_score = round(random.uniform(60, 85), 2)
        risk_level = "high"
        is_fraud = True
        is_flagged = True
        primary_signal = "Velocity Attack"
        status = "flagged"

    elif fraud_type == "device_anomaly":
        is_new_device = True
        risk_score = round(random.uniform(55, 75), 2)
        risk_level = "high"
        is_flagged = True
        primary_signal = "New Device"
        status = "flagged"

    elif fraud_type == "geo_anomaly":
        other_city = random.choice([c for c in CITIES if c[0] != customer.usual_city])
        city, state, lat, lon = other_city[0], other_city[1], other_city[2], other_city[3]
        risk_score = round(random.uniform(50, 70), 2)
        risk_level = "medium" if risk_score < 60 else "high"
        is_flagged = risk_score > 60
        primary_signal = "Location Anomaly"
        status = "flagged" if is_flagged else "pending"

    elif fraud_type == "multiple_failures":
        failed = random.randint(3, 6)
        risk_score = round(random.uniform(55, 80), 2)
        risk_level = "high"
        is_flagged = True
        primary_signal = "Multiple Failed Attempts"
        status = "flagged"

    elif fraud_type == "payment_testing":
        amount = round(random.uniform(1, 10), 2)
        velocity = random.randint(5, 15)
        risk_score = round(random.uniform(45, 70), 2)
        risk_level = "medium" if risk_score < 60 else "high"
        is_flagged = True
        primary_signal = "Payment Testing"
        status = "flagged"

    # Risk level
    if risk_score < 30:
        risk_level = "low"
    elif risk_score < 60:
        risk_level = "medium"
    elif risk_score < 85:
        risk_level = "high"
    else:
        risk_level = "critical"

    return Transaction(
        id=txn_id,
        timestamp=ts,
        customer_id=customer.id,
        amount=amount,
        currency="INR",
        payment_method=method,
        merchant_category=cat,
        merchant_name=merchant,
        status=status,
        risk_score=risk_score,
        risk_level=risk_level,
        primary_signal=primary_signal,
        device_id=device_id,
        ip_address=fake.ipv4(),
        location_city=city,
        location_state=state,
        location_country="India",
        latitude=lat,
        longitude=lon,
        is_flagged=is_flagged,
        is_fraud=is_fraud,
        fraud_type=fraud_type,
        failed_attempts=failed,
        velocity_1h=velocity,
        amount_deviation=amount_dev,
        is_new_device=is_new_device,
        created_at=ts,
    )


def generate_transactions(session, customers, devices, n=50000):
    print(f"Generating {n} transactions...")
    now = datetime.datetime.utcnow()
    start = now - datetime.timedelta(days=30)

    cust_list = customers
    dev_ids = [d.id for d in devices]
    # Map customer -> their devices
    cust_dev_map = {}
    for d in devices:
        cust_dev_map.setdefault(d.customer_id, []).append(d.id)

    # Fraud type distribution
    fraud_types = [
        "none", "none", "none", "none", "none",
        "none", "none", "none", "none", "none",
        "none", "none", "none", "none", "none",
        "none", "none", "none",             # 18x none = ~85%
        "account_takeover", "account_takeover", "account_takeover",  # ~5%
        "high_value_anomaly", "high_value_anomaly",                   # ~4%
        "velocity_attack", "velocity_attack",                         # ~4%
        "device_anomaly",                                             # ~2%
        "geo_anomaly",                                                # ~2%
        "multiple_failures",                                          # ~2%
        "payment_testing",                                            # ~2%
    ]

    batch = []
    for i in range(n):
        cust = random.choice(cust_list)
        city_data = next((c for c in CITIES if c[0] == cust.usual_city), CITIES[0])
        fraud_type = random.choice(fraud_types)

        # Device selection
        my_devs = cust_dev_map.get(cust.id, [])
        if fraud_type == "account_takeover" or fraud_type == "device_anomaly":
            device_id = f"DEV-NEW-{uuid.uuid4().hex[:8]}"
        elif my_devs:
            device_id = random.choice(my_devs)
        else:
            device_id = random.choice(dev_ids)

        ts = start + datetime.timedelta(seconds=random.randint(0, int((now - start).total_seconds())))
        txn_id = f"TXN-{str(uuid.uuid4().int)[:9]}"

        txn = make_transaction(txn_id, cust, device_id, city_data, ts, fraud_type)
        batch.append(txn)

        if (i + 1) % 5000 == 0:
            session.add_all(batch)
            session.commit()
            batch = []
            print(f"  Generated {i+1} transactions...")

    if batch:
        session.add_all(batch)
        session.commit()
    print(f"  Done: {n} transactions")


def add_demo_transactions(session, customers):
    """Add 5 specific demo transactions for hackathon presentation."""
    print("Adding demo transactions...")
    cust_map = {c.id: c for c in customers[:10]}

    demos = [
        {
            "id": "TXN-TAKEOVER",
            "customer_id": "CUST-00001",
            "amount": 84500.0,
            "payment_method": "net_banking",
            "merchant_category": "electronics",
            "merchant_name": "TechZone",
            "status": "flagged",
            "risk_score": 91.0,
            "risk_level": "critical",
            "primary_signal": "Account Takeover Detected",
            "device_id": "DEV-NEW-TAKEOVER",
            "ip_address": "185.220.101.45",
            "location_city": "Jaipur",
            "location_state": "Rajasthan",
            "is_flagged": True,
            "is_fraud": True,
            "fraud_type": "account_takeover",
            "failed_attempts": 4,
            "velocity_1h": 3,
            "amount_deviation": 8.2,
            "is_new_device": True,
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=3),
        },
        {
            "id": "TXN-HIGHVALUE",
            "customer_id": "CUST-00002",
            "amount": 245000.0,
            "payment_method": "credit_card",
            "merchant_category": "luxury",
            "merchant_name": "LuxuryBazaar",
            "status": "flagged",
            "risk_score": 78.0,
            "risk_level": "high",
            "primary_signal": "High Value Anomaly",
            "device_id": "DEV-HV-001",
            "ip_address": "103.21.244.10",
            "location_city": "Mumbai",
            "location_state": "Maharashtra",
            "is_flagged": True,
            "is_fraud": True,
            "fraud_type": "high_value_anomaly",
            "failed_attempts": 0,
            "velocity_1h": 1,
            "amount_deviation": 12.4,
            "is_new_device": False,
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=5),
        },
        {
            "id": "TXN-VELOCITY",
            "customer_id": "CUST-00003",
            "amount": 4500.0,
            "payment_method": "upi",
            "merchant_category": "gaming",
            "merchant_name": "GameZone",
            "status": "flagged",
            "risk_score": 72.0,
            "risk_level": "high",
            "primary_signal": "Velocity Attack",
            "device_id": "DEV-VEL-001",
            "ip_address": "45.148.10.92",
            "location_city": "Delhi",
            "location_state": "Delhi",
            "is_flagged": True,
            "is_fraud": True,
            "fraud_type": "velocity_attack",
            "failed_attempts": 0,
            "velocity_1h": 14,
            "amount_deviation": 1.2,
            "is_new_device": False,
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=1),
        },
        {
            "id": "TXN-DEVICE",
            "customer_id": "CUST-00004",
            "amount": 12000.0,
            "payment_method": "debit_card",
            "merchant_category": "travel",
            "merchant_name": "MakeMyTrip",
            "status": "flagged",
            "risk_score": 61.0,
            "risk_level": "high",
            "primary_signal": "New Device",
            "device_id": "DEV-NEW-ANOMALY",
            "ip_address": "202.88.130.11",
            "location_city": "Bangalore",
            "location_state": "Karnataka",
            "is_flagged": True,
            "is_fraud": False,
            "fraud_type": "device_anomaly",
            "failed_attempts": 0,
            "velocity_1h": 1,
            "amount_deviation": 1.8,
            "is_new_device": True,
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=2),
        },
        {
            "id": "TXN-TRUSTED",
            "customer_id": "CUST-00005",
            "amount": 2500.0,
            "payment_method": "upi",
            "merchant_category": "food",
            "merchant_name": "Swiggy",
            "status": "approved",
            "risk_score": 8.0,
            "risk_level": "low",
            "primary_signal": "Normal Transaction",
            "device_id": "DEV-TRUSTED-001",
            "ip_address": "49.36.85.22",
            "location_city": "Mumbai",
            "location_state": "Maharashtra",
            "is_flagged": False,
            "is_fraud": False,
            "fraud_type": "none",
            "failed_attempts": 0,
            "velocity_1h": 1,
            "amount_deviation": 0.8,
            "is_new_device": False,
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=0, minutes=30),
        },
    ]

    for d in demos:
        ts = d.pop("timestamp")
        existing = session.get(Transaction, d["id"])
        if existing:
            session.delete(existing)
            session.commit()
        txn = Transaction(**d, timestamp=ts, currency="INR", location_country="India",
                          latitude=19.076, longitude=72.877, created_at=ts)
        session.add(txn)

    session.commit()
    print("  Demo transactions added")


def main():
    engine = create_engine(DB_URL)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Clear existing data
        print("Clearing existing data...")
        session.query(AuditEntry).delete()
        session.query(Case).delete()
        session.query(Transaction).delete()
        session.query(Device).delete()
        session.query(Customer).delete()
        session.commit()

        customers = []
        generate_customers(session, 2000)
        customers = session.query(Customer).all()
        devices = generate_devices(session, customers, 3000)
        generate_transactions(session, customers, devices, 50000)
        add_demo_transactions(session, customers)

        # Summary
        print("\n=== GENERATION SUMMARY ===")
        print(f"Customers:    {session.query(Customer).count()}")
        print(f"Devices:      {session.query(Device).count()}")
        print(f"Transactions: {session.query(Transaction).count()}")
        from sqlalchemy import func
        risk_dist = session.query(Transaction.risk_level, func.count(Transaction.id)).group_by(Transaction.risk_level).all()
        for lvl, cnt in risk_dist:
            print(f"  {lvl:10s}: {cnt}")
        fraud_dist = session.query(Transaction.fraud_type, func.count(Transaction.id)).group_by(Transaction.fraud_type).filter(Transaction.fraud_type != 'none').all()
        print("Fraud types:")
        for ft, cnt in fraud_dist:
            print(f"  {ft:25s}: {cnt}")
        print("Done!")
    finally:
        session.close()


if __name__ == "__main__":
    main()
