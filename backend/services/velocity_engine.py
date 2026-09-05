import datetime
from sqlalchemy.future import select
from sqlalchemy import func
from backend.models.transaction import Transaction

class VelocityEngine:
    async def evaluate(self, txn: Transaction, db_session) -> dict:
        score = 0.0
        evidence = []
        
        if not txn.device_id or not txn.card_bin:
            return {"score": 0.0, "evidence": evidence}

        # Example check: Transactions per device per minute
        # We assume txn is not yet committed, so we check past ones
        one_minute_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
        
        result = await db_session.execute(
            select(func.count(Transaction.id)).where(
                Transaction.device_id == txn.device_id,
                Transaction.timestamp >= one_minute_ago
            )
        )
        txns_per_device_per_min = result.scalar() or 0

        # Card testing scenario logic
        if txns_per_device_per_min > 5:
            score += 40.0
            evidence.append(f"{txns_per_device_per_min} payment attempts detected from the same device within 60 seconds.")

        # Check transactions per card per minute
        result_card = await db_session.execute(
            select(func.count(Transaction.id)).where(
                Transaction.card_bin == txn.card_bin,
                Transaction.timestamp >= one_minute_ago
            )
        )
        txns_per_card_per_min = result_card.scalar() or 0

        if txns_per_card_per_min > 3:
            score += 30.0
            evidence.append(f"{txns_per_card_per_min} payment attempts on the same card within 60 seconds.")

        return {
            "score": min(score, 100.0),
            "evidence": evidence,
            "details": {
                "txns_per_device_per_min": txns_per_device_per_min,
                "txns_per_card_per_min": txns_per_card_per_min
            }
        }

velocity_engine = VelocityEngine()
