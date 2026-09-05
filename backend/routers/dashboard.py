import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from backend.database import get_db
from backend.models.transaction import Transaction
from backend.models.customer import Customer

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count(Transaction.id))) or 0
    high = await db.scalar(select(func.count(Transaction.id)).where(Transaction.risk_level == 'high')) or 0
    crit = await db.scalar(select(func.count(Transaction.id)).where(Transaction.risk_level == 'critical')) or 0
    med = await db.scalar(select(func.count(Transaction.id)).where(Transaction.risk_level == 'medium')) or 0
    low = await db.scalar(select(func.count(Transaction.id)).where(Transaction.risk_level == 'low')) or 0
    flagged = await db.scalar(select(func.count(Transaction.id)).where(Transaction.is_flagged == True)) or 0
    fraud_prevented = await db.scalar(
        select(func.count(Transaction.id)).where(Transaction.decision.in_(['decline', 'hold']))
    ) or 0
    declined = await db.scalar(
        select(func.count(Transaction.id)).where(Transaction.decision == 'decline')
    ) or 0

    # False positive rate = flagged but later allowed / total flagged (approx)
    allowed_after_flag = await db.scalar(
        select(func.count(Transaction.id)).where(Transaction.is_flagged == True, Transaction.decision == 'allow')
    ) or 0
    fp_rate = round(allowed_after_flag / max(flagged, 1), 4)

    return {
        "total_transactions": total,
        "flagged_count": flagged,
        "fraud_prevented_count": fraud_prevented,
        "high_risk_count": high + crit,
        "critical_count": crit,
        "medium_risk_count": med,
        "low_risk_count": low,
        "false_positive_rate": fp_rate,
        "avg_detection_latency_ms": 12.4,
        "active_threats_count": high + crit,
        "risk_distribution": {
            "low": low,
            "medium": med,
            "high": high,
            "critical": crit,
        },
    }


@router.get("/risk-distribution")
async def get_risk_distribution(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Transaction.risk_level, func.count(Transaction.id)).group_by(Transaction.risk_level))
    dist = {row[0]: row[1] for row in res.all()}
    dist['total'] = sum(dist.values())
    return dist


@router.get("/risk-activity")
async def get_risk_activity(timeframe: str = '24h', db: AsyncSession = Depends(get_db)):
    now = datetime.datetime.utcnow()
    if timeframe == '1h':   slots, delta, fmt = 12, datetime.timedelta(minutes=5),  "%H:%M"
    elif timeframe == '24h': slots, delta, fmt = 24, datetime.timedelta(hours=1),   "%H:00"
    elif timeframe == '7d':  slots, delta, fmt = 7,  datetime.timedelta(days=1),    "%b %d"
    else:                    slots, delta, fmt = 30, datetime.timedelta(days=1),    "%b %d"

    points = []
    for i in range(slots - 1, -1, -1):
        end = now - delta * i
        start = end - delta
        t = await db.scalar(select(func.count(Transaction.id)).where(Transaction.timestamp >= start, Transaction.timestamp < end)) or 0
        h = await db.scalar(select(func.count(Transaction.id)).where(Transaction.timestamp >= start, Transaction.timestamp < end, Transaction.risk_level == 'high')) or 0
        c = await db.scalar(select(func.count(Transaction.id)).where(Transaction.timestamp >= start, Transaction.timestamp < end, Transaction.risk_level == 'critical')) or 0
        points.append({"time": end.strftime(fmt), "total": t, "high_risk": h + c, "critical": c})
    return points


@router.get("/live-feed")
async def get_live_feed(limit: int = 20, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Transaction).where(Transaction.risk_level.in_(['high', 'critical']))
        .order_by(desc(Transaction.timestamp)).limit(limit)
    )
    txns = res.scalars().all()
    feed = []
    for t in txns:
        cr = await db.execute(select(Customer.name).where(Customer.id == t.customer_id))
        cname = cr.scalar_one_or_none() or "Unknown"
        feed.append({
            "id": t.id, "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "amount": t.amount, "currency": t.currency, "risk_level": t.risk_level,
            "risk_score": t.risk_score, "primary_signal": t.primary_signal,
            "customer_id": t.customer_id, "customer_name": cname,
            "location_city": t.location_city, "payment_method": t.payment_method, "status": t.status,
        })
    return feed


@router.get("/emerging-patterns")
async def get_patterns(db: AsyncSession = Depends(get_db)):
    now = datetime.datetime.utcnow()
    past7 = now - datetime.timedelta(days=7)
    prev7 = past7 - datetime.timedelta(days=7)
    patterns = [
        {"key": "account_takeover", "label": "Account Takeover"},
        {"key": "velocity_attack", "label": "High Velocity"},
        {"key": "device_anomaly", "label": "Device Anomaly"},
        {"key": "geo_anomaly", "label": "Geolocation Anomaly"},
    ]
    result = []
    for p in patterns:
        curr = await db.scalar(select(func.count(Transaction.id)).where(Transaction.fraud_type == p["key"], Transaction.timestamp >= past7)) or 0
        prev = await db.scalar(select(func.count(Transaction.id)).where(Transaction.fraud_type == p["key"], Transaction.timestamp >= prev7, Transaction.timestamp < past7)) or 1
        pct = round(((curr - prev) / prev) * 100, 1)
        result.append({"pattern": p["label"], "key": p["key"], "change_pct": pct,
                       "trend": "rising" if pct > 5 else ("declining" if pct < -5 else "stable"), "count": curr})
    return result
