import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, or_
from backend.database import get_db
from backend.models.customer import Customer
from backend.models.transaction import Transaction
from backend.models.device import Device

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("")
async def list_customers(page: int = 1, per_page: int = 20, search: str = None, db: AsyncSession = Depends(get_db)):
    q = select(Customer)
    if search:
        q = q.where(or_(Customer.id.contains(search), Customer.name.contains(search), Customer.email.contains(search)))
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    q = q.order_by(desc(Customer.created_at)).offset((page - 1) * per_page).limit(per_page)
    res = await db.execute(q)
    customers = res.scalars().all()
    return {"items": [{"id": c.id, "name": c.name, "email": c.email, "trust_score": c.trust_score,
                       "total_transactions": c.total_transactions, "chargeback_count": c.chargeback_count,
                       "avg_transaction_amount": c.avg_transaction_amount, "usual_city": c.usual_city,
                       "risk_category": c.risk_category, "account_age_days": c.account_age_days}
                      for c in customers],
            "total": total or 0, "page": page, "per_page": per_page,
            "total_pages": max(1, ((total or 0) + per_page - 1) // per_page)}


@router.get("/{id}")
async def get_customer(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Customer).where(Customer.id == id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Customer not found")
    return c


@router.get("/{id}/transactions")
async def get_customer_transactions(id: str, page: int = 1, per_page: int = 20, db: AsyncSession = Depends(get_db)):
    q = select(Transaction).where(Transaction.customer_id == id).order_by(desc(Transaction.timestamp))
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    res = await db.execute(q.offset((page - 1) * per_page).limit(per_page))
    return {"items": res.scalars().all(), "total": total or 0, "page": page, "per_page": per_page}


@router.get("/{id}/devices")
async def get_customer_devices(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Device).where(Device.customer_id == id))
    return res.scalars().all()


@router.get("/{id}/timeline")
async def get_customer_timeline(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Transaction).where(Transaction.customer_id == id)
        .order_by(desc(Transaction.timestamp)).limit(15)
    )
    txns = res.scalars().all()
    events = []
    for t in txns:
        events.append({
            "id": t.id, "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "type": "transaction", "amount": t.amount, "currency": t.currency,
            "status": t.status, "risk_level": t.risk_level, "risk_score": t.risk_score,
            "location_city": t.location_city, "payment_method": t.payment_method,
            "merchant_name": t.merchant_name, "is_new_device": t.is_new_device,
            "is_flagged": t.is_flagged,
        })
    return events
