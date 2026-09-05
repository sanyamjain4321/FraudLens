import datetime, uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from backend.database import get_db
from backend.models.case import Case
from backend.models.transaction import Transaction
from backend.models.customer import Customer
from backend.models.audit import AuditEntry
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/cases", tags=["Cases"])


class CaseCreate(BaseModel):
    transaction_id: str
    severity: str
    title: str
    description: str
    ai_recommendation: Optional[str] = None
    ai_confidence: Optional[float] = None


class CaseUpdate(BaseModel):
    status: Optional[str] = None
    analyst_decision: Optional[str] = None
    analyst_notes: Optional[str] = None


class DecisionRequest(BaseModel):
    decision: str
    notes: str = ""


@router.get("")
async def list_cases(page: int = 1, per_page: int = 20, status: str = None, severity: str = None, db: AsyncSession = Depends(get_db)):
    q = select(Case)
    if status:
        q = q.where(Case.status == status)
    if severity:
        q = q.where(Case.severity == severity)
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    q = q.order_by(desc(Case.created_at)).offset((page - 1) * per_page).limit(per_page)
    res = await db.execute(q)
    cases = res.scalars().all()
    items = []
    for c in cases:
        tr = await db.execute(select(Transaction.amount, Transaction.risk_score, Transaction.risk_level).where(Transaction.id == c.transaction_id))
        txn_row = tr.first()
        cu = await db.execute(select(Customer.name).where(Customer.id == c.customer_id)) if c.customer_id else None
        cname = cu.scalar_one_or_none() if cu else None
        items.append({
            "id": c.id, "transaction_id": c.transaction_id, "customer_id": c.customer_id,
            "customer_name": cname, "status": c.status, "severity": c.severity,
            "title": c.title, "description": c.description,
            "ai_recommendation": c.ai_recommendation, "ai_confidence": c.ai_confidence,
            "analyst_decision": c.analyst_decision, "assigned_to": c.assigned_to,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            "transaction_amount": txn_row[0] if txn_row else None,
            "transaction_risk_score": txn_row[1] if txn_row else None,
            "transaction_risk_level": txn_row[2] if txn_row else None,
        })
    return {"items": items, "total": total or 0, "page": page, "per_page": per_page,
            "total_pages": max(1, ((total or 0) + per_page - 1) // per_page)}


@router.get("/{id}")
async def get_case(id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Case).where(Case.id == id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Case not found")
    tr = await db.execute(select(Transaction).where(Transaction.id == c.transaction_id))
    txn = tr.scalar_one_or_none()
    cu = None
    if c.customer_id:
        cur = await db.execute(select(Customer).where(Customer.id == c.customer_id))
        cu = cur.scalar_one_or_none()
    return {"case": c, "transaction": txn, "customer": cu}


@router.post("")
async def create_case(req: CaseCreate, db: AsyncSession = Depends(get_db)):
    case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    txn_res = await db.execute(select(Transaction).where(Transaction.id == req.transaction_id))
    txn = txn_res.scalar_one_or_none()
    cust_id = txn.customer_id if txn else ""
    new_case = Case(
        id=case_id, transaction_id=req.transaction_id, customer_id=cust_id,
        status="open", severity=req.severity, title=req.title, description=req.description,
        ai_recommendation=req.ai_recommendation, ai_confidence=req.ai_confidence,
        assigned_to="Sanyam Jain",
        created_at=datetime.datetime.utcnow(), updated_at=datetime.datetime.utcnow()
    )
    db.add(new_case)
    audit = AuditEntry(action="case_created", entity_type="case", entity_id=case_id,
                       details=f"Case created for transaction {req.transaction_id}", timestamp=datetime.datetime.utcnow())
    db.add(audit)
    await db.commit()
    return {"id": case_id, "status": "created"}


@router.patch("/{id}")
async def update_case(id: str, req: CaseUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Case).where(Case.id == id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Case not found")
    if req.status:
        c.status = req.status
    if req.analyst_decision:
        c.analyst_decision = req.analyst_decision
    if req.analyst_notes:
        c.analyst_notes = req.analyst_notes
    c.updated_at = datetime.datetime.utcnow()
    audit = AuditEntry(action="case_updated", entity_type="case", entity_id=id,
                       details=f"Status: {req.status}, Decision: {req.analyst_decision}", timestamp=datetime.datetime.utcnow())
    db.add(audit)
    await db.commit()
    return {"status": "updated"}


@router.post("/{id}/decision")
async def case_decision(id: str, req: DecisionRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Case).where(Case.id == id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Case not found")
    c.analyst_decision = req.decision
    c.analyst_notes = req.notes
    c.status = "resolved" if req.decision in ("approved", "false_positive") else "under_review"
    c.updated_at = datetime.datetime.utcnow()
    if req.decision in ("approved", "false_positive"):
        c.resolved_at = datetime.datetime.utcnow()
    # Update transaction status
    if c.transaction_id:
        tr = await db.execute(select(Transaction).where(Transaction.id == c.transaction_id))
        txn = tr.scalar_one_or_none()
        if txn:
            txn.status = req.decision
    audit = AuditEntry(action=f"analyst_{req.decision}", entity_type="case", entity_id=id,
                       details=f"Analyst decision: {req.decision}. Notes: {req.notes}", timestamp=datetime.datetime.utcnow())
    db.add(audit)
    await db.commit()
    return {"status": "decision_recorded", "decision": req.decision}
