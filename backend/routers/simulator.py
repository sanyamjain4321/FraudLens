import datetime
import random
import uuid
import json
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.models.transaction import Transaction
from backend.services.risk_engine import risk_engine
import asyncio

router = APIRouter(prefix="/api/simulator", tags=["Simulator"])

# Global simulator state
simulator_state = {
    "is_running": False,
    "rate": 1,
    "mode": "NORMAL TRAFFIC",
    "task": None
}

async def generate_transaction(db: AsyncSession, mode: str):
    # Base normal transaction
    txn_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    txn = Transaction(
        id=txn_id,
        customer_id=f"CUST-{random.randint(1000, 9999)}",
        amount=random.uniform(10.0, 5000.0),
        currency="INR",
        payment_method=random.choice(["upi", "credit_card", "debit_card"]),
        card_bin=str(random.randint(400000, 499999)),
        device_id=f"DEV-{random.randint(100, 999)}",
        timestamp=datetime.datetime.utcnow()
    )

    if mode == "CARD TESTING":
        # Force same device, different cards, small amounts
        txn.device_id = "DEV-ATTACK-01"
        txn.amount = random.uniform(1.0, 5.0)
        txn.card_bin = str(random.randint(400000, 499999))
    elif mode == "ABUSE RING":
        # Same device, different customers
        txn.device_id = "DEV-RING-99"
    elif mode == "IMPOSSIBLE TRAVEL":
        # Force a large amount anomaly and different location
        txn.amount_deviation = 10.0
        txn.is_new_device = True

    # Evaluate with risk engine
    # In a real app we'd fetch the customer from DB, but we pass None for simulator
    risk_res = await risk_engine.score_transaction(txn, None, db)
    
    txn.risk_score = risk_res["risk_score"]
    txn.risk_level = risk_res["risk_level"]
    txn.fraud_probability = risk_res["fraud_probability"]
    txn.anomaly_score = risk_res["anomaly_score"]
    txn.velocity_score = risk_res["velocity_score"]
    txn.network_score = risk_res["network_score"]
    txn.rule_score = risk_res["rule_score"]
    txn.evidence = json.dumps(risk_res["evidence"])
    
    if txn.risk_level in ["high", "critical"]:
        txn.decision = "hold"
        txn.status = "pending"
    else:
        txn.decision = "allow"
        txn.status = "success"

    db.add(txn)
    await db.commit()
    return txn


async def simulator_loop():
    from backend.database import AsyncSessionLocal
    while simulator_state["is_running"]:
        async with AsyncSessionLocal() as db:
            # Generate based on rate
            for _ in range(simulator_state["rate"]):
                await generate_transaction(db, simulator_state["mode"])
        await asyncio.sleep(1.0)

@router.post("/start")
async def start_simulator(rate: int = 1, mode: str = "NORMAL TRAFFIC"):
    simulator_state["rate"] = rate
    simulator_state["mode"] = mode
    if not simulator_state["is_running"]:
        simulator_state["is_running"] = True
        # Start background task (in real app, use proper task manager, here we just use asyncio.create_task)
        simulator_state["task"] = asyncio.create_task(simulator_loop())
    return {"status": "started", "state": simulator_state["is_running"], "mode": mode, "rate": rate}

@router.post("/stop")
async def stop_simulator():
    simulator_state["is_running"] = False
    if simulator_state["task"]:
        simulator_state["task"].cancel()
        simulator_state["task"] = None
    return {"status": "stopped"}

@router.post("/inject")
async def inject_threat(threat_type: str, db: AsyncSession = Depends(get_db)):
    # Immediately inject 5 transactions of the given threat type
    for _ in range(5):
        await generate_transaction(db, threat_type)
    return {"status": "injected", "threat": threat_type}

@router.get("/status")
async def get_simulator_status():
    return {
        "is_running": simulator_state["is_running"],
        "mode": simulator_state["mode"],
        "rate": simulator_state["rate"]
    }
