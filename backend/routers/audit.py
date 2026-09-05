import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, or_
from backend.database import get_db
from backend.models.audit import AuditEntry
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/audit", tags=["Audit"])


class AuditCreate(BaseModel):
    action: str
    entity: str = "system"
    entity_id: str = ""
    actor: Optional[str] = "system"
    details: str = ""
    risk_score: Optional[float] = None


@router.get("")
async def list_audit(page: int = 1, per_page: int = 50, search: str = None,
                     entity: str = None, action: str = None, db: AsyncSession = Depends(get_db)):
    q = select(AuditEntry)
    if search:
        q = q.where(or_(AuditEntry.action.contains(search), AuditEntry.entity_id.contains(search)))
    if entity:
        q = q.where(AuditEntry.entity == entity)
    if action:
        q = q.where(AuditEntry.action.contains(action))
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    q = q.order_by(desc(AuditEntry.timestamp)).offset((page - 1) * per_page).limit(per_page)
    res = await db.execute(q)
    entries = res.scalars().all()
    return {
        "items": [
            {
                "id": e.id,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "actor": e.actor,
                "action": e.action,
                "entity": e.entity,
                "entity_id": e.entity_id,
                "risk_score": e.risk_score,
                "details": e.details,
            }
            for e in entries
        ],
        "total": total or 0,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, ((total or 0) + per_page - 1) // per_page),
    }


@router.post("")
async def create_audit(req: AuditCreate, db: AsyncSession = Depends(get_db)):
    entry = AuditEntry(
        actor=req.actor or "system",
        action=req.action,
        entity=req.entity,
        entity_id=req.entity_id,
        risk_score=req.risk_score,
        details=req.details,
        timestamp=datetime.datetime.utcnow(),
    )
    db.add(entry)
    await db.commit()
    return {"status": "created"}

