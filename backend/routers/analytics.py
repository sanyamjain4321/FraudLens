import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, extract
from backend.database import get_db
from backend.models.transaction import Transaction

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/risk-by-hour")
async def risk_by_hour(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(extract('hour', Transaction.timestamp).label('hour'),
               Transaction.risk_level, func.count(Transaction.id))
        .group_by('hour', Transaction.risk_level)
    )
    data = {}
    for hour, level, cnt in res.all():
        h = int(hour)
        if h not in data:
            data[h] = {"hour": h, "low": 0, "medium": 0, "high": 0, "critical": 0}
        data[h][level] = cnt
    return sorted(data.values(), key=lambda x: x['hour'])


@router.get("/risk-by-method")
async def risk_by_method(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Transaction.payment_method, Transaction.risk_level, func.count(Transaction.id))
        .group_by(Transaction.payment_method, Transaction.risk_level)
    )
    data = {}
    for method, level, cnt in res.all():
        if method not in data:
            data[method] = {"method": method, "low": 0, "medium": 0, "high": 0, "critical": 0, "total": 0}
        data[method][level] = cnt
        data[method]["total"] += cnt
    return list(data.values())


@router.get("/risk-by-category")
async def risk_by_category(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Transaction.merchant_category, Transaction.risk_level, func.count(Transaction.id))
        .group_by(Transaction.merchant_category, Transaction.risk_level)
    )
    data = {}
    for cat, level, cnt in res.all():
        if cat not in data:
            data[cat] = {"category": cat, "low": 0, "medium": 0, "high": 0, "critical": 0, "total": 0}
        data[cat][level] = cnt
        data[cat]["total"] += cnt
    return list(data.values())


@router.get("/risk-by-location")
async def risk_by_location(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Transaction.location_city, func.count(Transaction.id).label('fraud_count'))
        .where(Transaction.is_fraud == True)
        .group_by(Transaction.location_city)
        .order_by(func.count(Transaction.id).desc())
        .limit(10)
    )
    return [{"city": row[0], "fraud_count": row[1]} for row in res.all()]


@router.get("/amount-vs-risk")
async def amount_vs_risk(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Transaction.amount, Transaction.risk_score, Transaction.risk_level)
        .order_by(func.random()).limit(300)
    )
    return [{"amount": row[0], "risk_score": row[1], "risk_level": row[2]} for row in res.all()]


@router.get("/fraud-rate")
async def fraud_rate(db: AsyncSession = Depends(get_db)):
    now = datetime.datetime.utcnow()
    result = []
    for i in range(29, -1, -1):
        day = now - datetime.timedelta(days=i)
        start = day.replace(hour=0, minute=0, second=0)
        end = start + datetime.timedelta(days=1)
        total = await db.scalar(select(func.count(Transaction.id)).where(Transaction.timestamp >= start, Transaction.timestamp < end)) or 0
        fraud = await db.scalar(select(func.count(Transaction.id)).where(Transaction.timestamp >= start, Transaction.timestamp < end, Transaction.is_fraud == True)) or 0
        result.append({"date": day.strftime("%b %d"), "total": total, "fraud": fraud,
                       "rate": round((fraud / max(total, 1)) * 100, 2)})
    return result


@router.get("/device-anomalies")
async def device_anomalies(db: AsyncSession = Depends(get_db)):
    now = datetime.datetime.utcnow()
    result = []
    for i in range(29, -1, -1):
        day = now - datetime.timedelta(days=i)
        start = day.replace(hour=0, minute=0, second=0)
        end = start + datetime.timedelta(days=1)
        cnt = await db.scalar(select(func.count(Transaction.id)).where(Transaction.timestamp >= start, Transaction.timestamp < end, Transaction.is_new_device == True)) or 0
        result.append({"date": day.strftime("%b %d"), "count": cnt})
    return result


@router.get("/velocity-anomalies")
async def velocity_anomalies(db: AsyncSession = Depends(get_db)):
    now = datetime.datetime.utcnow()
    result = []
    for i in range(29, -1, -1):
        day = now - datetime.timedelta(days=i)
        start = day.replace(hour=0, minute=0, second=0)
        end = start + datetime.timedelta(days=1)
        cnt = await db.scalar(select(func.count(Transaction.id)).where(Transaction.timestamp >= start, Transaction.timestamp < end, Transaction.velocity_1h >= 5)) or 0
        result.append({"date": day.strftime("%b %d"), "count": cnt})
    return result


@router.get("/emerging-patterns")
async def emerging_patterns(db: AsyncSession = Depends(get_db)):
    from backend.routers.dashboard import get_patterns
    return await get_patterns(db)


@router.get("/risk-distribution")
async def risk_distribution(db: AsyncSession = Depends(get_db)):
    from backend.routers.dashboard import get_risk_distribution
    return await get_risk_distribution(db)


@router.get("/risk-activity")
async def risk_activity(timeframe: str = '24h', db: AsyncSession = Depends(get_db)):
    from backend.routers.dashboard import get_risk_activity
    return await get_risk_activity(timeframe, db)
