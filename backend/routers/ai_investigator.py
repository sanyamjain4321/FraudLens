import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from backend.services.ai_agent import ai_agent
from backend.config import settings
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/ai", tags=["AI Investigator"])


class InvestigateRequest(BaseModel):
    transaction_id: str
    message: Optional[str] = None


@router.get("/status")
def ai_status():
    return {
        "status": "online" if settings.ANTHROPIC_API_KEY else "demo_mode",
        "model": "claude-3-5-haiku-20241022",
        "tools_available": 10,
        "mode": "live" if settings.ANTHROPIC_API_KEY else "demo",
    }


@router.post("/investigate")
async def investigate(req: InvestigateRequest):
    async def event_stream():
        async for event in ai_agent.investigate(req.transaction_id, req.message):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/demo-scenarios")
def demo_scenarios():
    return [
        {"id": "TXN-TAKEOVER", "label": "Account Takeover", "risk": "CRITICAL", "desc": "New device, location change, 4 failed attempts, ₹84,500"},
        {"id": "TXN-HIGHVALUE", "label": "High Value Anomaly", "risk": "HIGH", "desc": "₹2,45,000 — 12.4x customer average"},
        {"id": "TXN-VELOCITY", "label": "Velocity Attack", "risk": "HIGH", "desc": "14 transactions in 1 hour — UPI rapid-fire pattern"},
        {"id": "TXN-DEVICE", "label": "Device Anomaly", "risk": "HIGH", "desc": "Unknown device not in customer device registry"},
        {"id": "TXN-TRUSTED", "label": "Trusted Transaction", "risk": "LOW", "desc": "Known device, usual location, normal amount"},
    ]
