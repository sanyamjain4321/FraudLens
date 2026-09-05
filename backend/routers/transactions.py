import datetime
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, or_
from backend.database import get_db
from backend.models.transaction import Transaction
from backend.models.customer import Customer
from backend.models.device import Device
from backend.models.audit import AuditEntry
from backend.models.case import Case
from backend.services.risk_engine import risk_engine
from backend.services.shap_explainer import shap_explainer
from pydantic import BaseModel

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


class ActionRequest(BaseModel):
    action: str
    reason: str = ""


def _txn_dict(t, cname=None):
    return {
        "id": t.id, "timestamp": t.timestamp.isoformat() if t.timestamp else None,
        "customer_id": t.customer_id, "customer_name": cname,
        "amount": t.amount, "currency": t.currency, "payment_method": t.payment_method,
        "card_bin": t.card_bin, "payment_instrument_id": t.payment_instrument_id,
        "merchant_category": t.merchant_category, "merchant_name": t.merchant_name,
        "status": t.status, "decision": t.decision,
        "risk_score": t.risk_score, "risk_level": t.risk_level,
        "fraud_probability": t.fraud_probability, "anomaly_score": t.anomaly_score,
        "velocity_score": t.velocity_score, "network_score": t.network_score,
        "rule_score": t.rule_score, "evidence": json.loads(t.evidence) if t.evidence else [],
        "primary_signal": t.primary_signal, "device_id": t.device_id, "ip_address": t.ip_address,
        "location_city": t.location_city, "location_state": t.location_state,
        "location_country": t.location_country, "latitude": t.latitude, "longitude": t.longitude,
        "is_flagged": t.is_flagged, "is_fraud": t.is_fraud, "fraud_type": t.fraud_type,
        "failed_attempts": t.failed_attempts, "velocity_1h": t.velocity_1h,
        "amount_deviation": t.amount_deviation, "is_new_device": t.is_new_device,
    }


@router.get("")
async def list_transactions(
    page: int = 1, per_page: int = 20, search: str = None,
    risk_level: str = None, payment_method: str = None, status: str = None, decision: str = None,
    min_amount: float = None, max_amount: float = None,
    date_from: str = None, date_to: str = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(Transaction)
    if search:
        q = q.where(or_(Transaction.id.contains(search), Transaction.customer_id.contains(search), Transaction.merchant_name.contains(search)))
    if risk_level:
        q = q.where(Transaction.risk_level == risk_level)
    if payment_method:
        q = q.where(Transaction.payment_method == payment_method)
    if status:
        q = q.where(Transaction.status == status)
    if decision:
        q = q.where(Transaction.decision == decision)
    if min_amount is not None:
        q = q.where(Transaction.amount >= min_amount)
    if max_amount is not None:
        q = q.where(Transaction.amount <= max_amount)
    if date_from:
        try: q = q.where(Transaction.timestamp >= datetime.datetime.fromisoformat(date_from))
        except: pass
    if date_to:
        try: q = q.where(Transaction.timestamp <= datetime.datetime.fromisoformat(date_to))
        except: pass

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    q = q.order_by(desc(Transaction.timestamp)).offset((page - 1) * per_page).limit(per_page)
    res = await db.execute(q)
    txns = res.scalars().all()

    items = []
    for t in txns:
        cr = await db.execute(select(Customer.name).where(Customer.id == t.customer_id))
        cname = cr.scalar_one_or_none()
        items.append(_txn_dict(t, cname))

    return {"items": items, "total": total or 0, "page": page, "per_page": per_page,
            "total_pages": max(1, ((total or 0) + per_page - 1) // per_page)}


@router.get("/{id}")
async def get_transaction(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Transaction).where(Transaction.id == id))
    txn = res.scalar_one_or_none()
    if not txn:
        raise HTTPException(404, "Transaction not found")

    cust_res = await db.execute(select(Customer).where(Customer.id == txn.customer_id))
    customer = cust_res.scalar_one_or_none()

    dev_res = await db.execute(select(Device).where(Device.id == txn.device_id)) if txn.device_id else None
    device = (dev_res.scalar_one_or_none() if dev_res else None)

    risk_data = await risk_engine.score_transaction(txn, customer, db)
    shap_data = shap_explainer.explain_transaction(txn, customer)

    # Related transactions
    related_res = await db.execute(
        select(Transaction).where(
            Transaction.id != txn.id,
            Transaction.payment_method == txn.payment_method,
            Transaction.amount >= txn.amount * 0.5,
            Transaction.amount <= txn.amount * 1.5,
        ).order_by(desc(Transaction.risk_score)).limit(5)
    )
    related = [_txn_dict(r) for r in related_res.scalars().all()]

    # Customer timeline (recent 10 transactions)
    tl_res = await db.execute(
        select(Transaction).where(Transaction.customer_id == txn.customer_id)
        .order_by(desc(Transaction.timestamp)).limit(10)
    )
    timeline = [_txn_dict(t) for t in tl_res.scalars().all()]

    cust_dict = None
    if customer:
        cust_dict = {
            "id": customer.id, "name": customer.name, "email": customer.email, "phone": customer.phone,
            "account_age_days": customer.account_age_days, "trust_score": customer.trust_score,
            "total_transactions": customer.total_transactions,
            "successful_transactions": customer.successful_transactions,
            "total_amount": customer.total_amount, "avg_transaction_amount": customer.avg_transaction_amount,
            "chargeback_count": customer.chargeback_count, "chargeback_rate": customer.chargeback_rate,
            "usual_city": customer.usual_city, "usual_state": customer.usual_state,
            "risk_category": customer.risk_category,
        }

    dev_dict = None
    if device:
        dev_dict = {
            "id": device.id, "device_type": device.device_type, "os": device.os,
            "browser": device.browser, "first_seen": str(device.first_seen),
            "last_seen": str(device.last_seen), "transaction_count": device.transaction_count,
            "is_trusted": device.is_trusted, "risk_score": device.risk_score,
        }

    return {
        "transaction": _txn_dict(txn, customer.name if customer else None),
        "customer": cust_dict,
        "device": dev_dict,
        "risk_signals": risk_data,
        "shap_explanation": shap_data,
        "related": related,
        "timeline": timeline,
    }


@router.post("/{id}/decision")
async def action_transaction(id: str, req: ActionRequest, db: AsyncSession = Depends(get_db)):
    # req.action should be one of: allow, step_up, hold, decline
    res = await db.execute(select(Transaction).where(Transaction.id == id))
    txn = res.scalar_one_or_none()
    if not txn:
        raise HTTPException(404, "Not found")
        
    old_decision = txn.decision
    txn.decision = req.action
    if req.action in ("decline", "hold"):
        txn.status = "failed" if req.action == "decline" else "pending"
        txn.is_flagged = True
        
        # Create a case if held or declined (and not already exist)
        if req.action == "hold":
            case_res = await db.execute(select(Case).where(Case.transaction_id == txn.id))
            if not case_res.scalar_one_or_none():
                case = Case(
                    id=f"CASE-{txn.id}",
                    transaction_id=txn.id,
                    customer_id=txn.customer_id,
                    status="open",
                    severity="high" if txn.risk_score > 70 else "medium",
                    title=f"Manual Hold: {txn.id}",
                    description=req.reason,
                    risk_score=txn.risk_score,
                    evidence=txn.evidence
                )
                db.add(case)
    elif req.action == "allow":
        txn.status = "success"
        txn.is_flagged = False

    audit = AuditEntry(
        actor="Analyst",
        action=f"ANALYST_{req.action.upper()}",
        entity="transaction", 
        entity_id=id,
        risk_score=txn.risk_score,
        details=req.reason or f"Changed decision from {old_decision} to {req.action}",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit)
    await db.commit()
    return {"status": "success", "new_decision": req.action, "new_status": txn.status}
