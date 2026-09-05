import datetime
from sqlalchemy.future import select
from sqlalchemy import func
from backend.models.transaction import Transaction

class NetworkEngine:
    async def evaluate(self, txn: Transaction, db_session) -> dict:
        score = 0.0
        evidence = []
        
        if not txn.device_id:
            return {"score": 0.0, "evidence": evidence}

        # Check abuse rings: Many customers on the same device
        # Number of unique customers using this device in the last 24 hours
        twenty_four_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
        
        result = await db_session.execute(
            select(func.count(func.distinct(Transaction.customer_id))).where(
                Transaction.device_id == txn.device_id,
                Transaction.timestamp >= twenty_four_hours_ago
            )
        )
        unique_customers_on_device = result.scalar() or 0

        # Adding the current customer if they haven't used this device before
        # For simplicity, we just look at the count
        if unique_customers_on_device >= 3:
            score += 50.0
            evidence.append(f"Device linked to {unique_customers_on_device} different customer accounts in the last 24 hours.")
            
        if unique_customers_on_device >= 5:
            score += 40.0 # Push it higher

        return {
            "score": min(score, 100.0),
            "evidence": evidence,
            "details": {
                "unique_customers_on_device": unique_customers_on_device
            }
        }

network_engine = NetworkEngine()
