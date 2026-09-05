import asyncio
import json
import datetime
import uuid

from anthropic import AsyncAnthropic
from backend.config import settings
from backend.database import AsyncSessionLocal
from backend.models.transaction import Transaction
from backend.models.customer import Customer
from backend.models.device import Device
from backend.models.case import Case
from sqlalchemy.future import select
from sqlalchemy import desc

TOOLS = [
    {"name": "get_transaction", "description": "Get full transaction details by ID.", "input_schema": {"type": "object", "properties": {"transaction_id": {"type": "string"}}, "required": ["transaction_id"]}},
    {"name": "get_customer_profile", "description": "Get customer profile including trust score, chargebacks, account age.", "input_schema": {"type": "object", "properties": {"customer_id": {"type": "string"}}, "required": ["customer_id"]}},
    {"name": "get_customer_transaction_history", "description": "Get recent transaction history for a customer.", "input_schema": {"type": "object", "properties": {"customer_id": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["customer_id"]}},
    {"name": "get_device_history", "description": "Get device details and trust status.", "input_schema": {"type": "object", "properties": {"device_id": {"type": "string"}}, "required": ["device_id"]}},
    {"name": "get_location_history", "description": "Get usual vs current location for a customer.", "input_schema": {"type": "object", "properties": {"customer_id": {"type": "string"}}, "required": ["customer_id"]}},
    {"name": "get_related_transactions", "description": "Find related transactions by payment method and amount.", "input_schema": {"type": "object", "properties": {"transaction_id": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["transaction_id"]}},
    {"name": "get_risk_score", "description": "Run the ML risk engine to get risk score and signals.", "input_schema": {"type": "object", "properties": {"transaction_id": {"type": "string"}}, "required": ["transaction_id"]}},
    {"name": "get_model_explanation", "description": "Get SHAP-based model explanation for a transaction.", "input_schema": {"type": "object", "properties": {"transaction_id": {"type": "string"}}, "required": ["transaction_id"]}},
    {"name": "get_account_risk", "description": "Get account-level risk summary including fraud history.", "input_schema": {"type": "object", "properties": {"customer_id": {"type": "string"}}, "required": ["customer_id"]}},
    {"name": "create_review_case", "description": "Create a formal review case in the case management system.", "input_schema": {"type": "object", "properties": {"transaction_id": {"type": "string"}, "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]}, "title": {"type": "string"}, "description": {"type": "string"}}, "required": ["transaction_id", "severity", "title", "description"]}},
]


async def _execute_tool(tool_name: str, tool_input: dict) -> dict:
    """Execute tool by querying real database / ML services."""
    async with AsyncSessionLocal() as db:
        if tool_name == "get_transaction":
            res = await db.execute(select(Transaction).where(Transaction.id == tool_input["transaction_id"]))
            txn = res.scalar_one_or_none()
            if not txn:
                return {"error": f"Transaction {tool_input['transaction_id']} not found"}
            return {
                "id": txn.id, "timestamp": str(txn.timestamp), "amount": txn.amount,
                "currency": txn.currency, "payment_method": txn.payment_method,
                "merchant_category": txn.merchant_category, "merchant_name": txn.merchant_name,
                "status": txn.status, "risk_score": txn.risk_score, "risk_level": txn.risk_level,
                "customer_id": txn.customer_id, "device_id": txn.device_id,
                "ip_address": txn.ip_address, "location_city": txn.location_city,
                "location_state": txn.location_state, "is_flagged": txn.is_flagged,
                "is_fraud": txn.is_fraud, "fraud_type": txn.fraud_type,
                "failed_attempts": txn.failed_attempts, "velocity_1h": txn.velocity_1h,
                "amount_deviation": txn.amount_deviation, "is_new_device": txn.is_new_device,
                "primary_signal": txn.primary_signal,
            }

        elif tool_name == "get_customer_profile":
            res = await db.execute(select(Customer).where(Customer.id == tool_input["customer_id"]))
            c = res.scalar_one_or_none()
            if not c:
                return {"error": "Customer not found"}
            return {
                "id": c.id, "name": c.name, "email": c.email,
                "account_age_days": c.account_age_days, "trust_score": c.trust_score,
                "total_transactions": c.total_transactions,
                "avg_transaction_amount": c.avg_transaction_amount,
                "chargeback_count": c.chargeback_count, "chargeback_rate": c.chargeback_rate,
                "usual_city": c.usual_city, "usual_state": c.usual_state,
                "risk_category": c.risk_category,
            }

        elif tool_name == "get_customer_transaction_history":
            limit = tool_input.get("limit", 10)
            res = await db.execute(
                select(Transaction).where(Transaction.customer_id == tool_input["customer_id"])
                .order_by(desc(Transaction.timestamp)).limit(limit)
            )
            txns = res.scalars().all()
            return {"transactions": [{"id": t.id, "timestamp": str(t.timestamp), "amount": t.amount,
                "payment_method": t.payment_method, "status": t.status, "risk_level": t.risk_level,
                "risk_score": t.risk_score, "location_city": t.location_city, "is_new_device": t.is_new_device}
                for t in txns]}

        elif tool_name == "get_device_history":
            device_id = tool_input.get("device_id", "")
            res = await db.execute(select(Device).where(Device.id == device_id))
            dev = res.scalar_one_or_none()
            if not dev:
                count = await db.execute(select(Transaction).where(Transaction.device_id == device_id))
                txns = count.scalars().all()
                return {"device_id": device_id, "transaction_count": len(txns),
                        "is_known": len(txns) > 0, "is_trusted": False,
                        "note": "Device not in trusted device registry — treat as unknown."}
            return {"id": dev.id, "device_type": dev.device_type, "os": dev.os,
                    "browser": dev.browser, "first_seen": str(dev.first_seen),
                    "last_seen": str(dev.last_seen), "transaction_count": dev.transaction_count,
                    "is_trusted": dev.is_trusted, "risk_score": dev.risk_score}

        elif tool_name == "get_location_history":
            res = await db.execute(select(Customer).where(Customer.id == tool_input["customer_id"]))
            c = res.scalar_one_or_none()
            recent_res = await db.execute(
                select(Transaction).where(Transaction.customer_id == tool_input["customer_id"])
                .order_by(desc(Transaction.timestamp)).limit(5)
            )
            recent = recent_res.scalars().all()
            return {
                "usual_city": getattr(c, 'usual_city', 'Unknown'),
                "usual_state": getattr(c, 'usual_state', 'Unknown'),
                "recent_locations": [{"city": t.location_city, "state": t.location_state, "timestamp": str(t.timestamp)} for t in recent],
            }

        elif tool_name == "get_related_transactions":
            txn_res = await db.execute(select(Transaction).where(Transaction.id == tool_input["transaction_id"]))
            txn = txn_res.scalar_one_or_none()
            if not txn:
                return {"error": "Transaction not found"}
            min_amt, max_amt = txn.amount * 0.5, txn.amount * 1.5
            related_res = await db.execute(
                select(Transaction).where(
                    Transaction.id != txn.id,
                    Transaction.payment_method == txn.payment_method,
                    Transaction.amount >= min_amt,
                    Transaction.amount <= max_amt,
                ).order_by(desc(Transaction.risk_score)).limit(tool_input.get("limit", 5))
            )
            related = related_res.scalars().all()
            return {"related": [{"id": r.id, "amount": r.amount, "risk_score": r.risk_score,
                                  "risk_level": r.risk_level, "status": r.status,
                                  "timestamp": str(r.timestamp)} for r in related]}

        elif tool_name == "get_risk_score":
            txn_res = await db.execute(select(Transaction).where(Transaction.id == tool_input["transaction_id"]))
            txn = txn_res.scalar_one_or_none()
            if not txn:
                return {"error": "Transaction not found"}
            cust_res = await db.execute(select(Customer).where(Customer.id == txn.customer_id))
            cust = cust_res.scalar_one_or_none()
            from backend.services.risk_engine import risk_engine
            return risk_engine.score_transaction(txn, cust)

        elif tool_name == "get_model_explanation":
            txn_res = await db.execute(select(Transaction).where(Transaction.id == tool_input["transaction_id"]))
            txn = txn_res.scalar_one_or_none()
            if not txn:
                return {"error": "Transaction not found"}
            cust_res = await db.execute(select(Customer).where(Customer.id == txn.customer_id))
            cust = cust_res.scalar_one_or_none()
            from backend.services.shap_explainer import shap_explainer
            result = shap_explainer.explain_transaction(txn, cust)
            feats = result.get('features', [])
            return {
                "available": result.get('available', False),
                "top_risk_factors": [{"feature": f['display_name'], "impact": f['shap_value']} for f in feats if f['contribution'] == 'positive'][:5],
                "top_mitigating": [{"feature": f['display_name'], "impact": f['shap_value']} for f in feats if f['contribution'] == 'negative'][:3],
            }

        elif tool_name == "get_account_risk":
            cust_res = await db.execute(select(Customer).where(Customer.id == tool_input["customer_id"]))
            c = cust_res.scalar_one_or_none()
            fraud_res = await db.execute(select(Transaction).where(
                Transaction.customer_id == tool_input["customer_id"],
                Transaction.is_fraud == True
            ))
            fraud_txns = fraud_res.scalars().all()
            return {
                "customer_id": tool_input["customer_id"],
                "risk_category": getattr(c, 'risk_category', 'unknown'),
                "trust_score": getattr(c, 'trust_score', 0),
                "chargeback_count": getattr(c, 'chargeback_count', 0),
                "confirmed_fraud_count": len(fraud_txns),
                "account_age_days": getattr(c, 'account_age_days', 0),
            }

        elif tool_name == "create_review_case":
            case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"
            new_case = Case(
                id=case_id,
                transaction_id=tool_input["transaction_id"],
                customer_id="",
                status="open",
                severity=tool_input["severity"],
                title=tool_input["title"],
                description=tool_input["description"],
                assigned_to="Sanyam Jain",
                created_at=datetime.datetime.utcnow(),
                updated_at=datetime.datetime.utcnow(),
            )
            db.add(new_case)
            await db.commit()
            return {"case_id": case_id, "status": "created", "message": f"Case {case_id} opened."}

    return {"error": f"Unknown tool: {tool_name}"}


class AIAgent:
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.client = AsyncAnthropic(api_key=self.api_key) if self.api_key else None

    async def investigate(self, transaction_id: str, user_message: str = None):
        if not self.client:
            async for event in self._demo_investigate(transaction_id):
                yield event
            return

        system_prompt = (
            "You are RazorShield Intelligence, an expert AI fraud investigator. "
            "Use the provided tools to gather ALL evidence before making assessments. "
            "Never invent facts — only cite retrieved evidence. "
            "After investigation, output a JSON block: "
            "{\"assessment\":\"HIGH_RISK|MEDIUM_RISK|LOW_RISK\","
            "\"risk_score\":0-100,\"confidence\":0.0-1.0,"
            "\"summary\":\"...\",\"evidence\":[\"...\"],"
            "\"risk_factors\":[\"...\"],"
            "\"recommendation\":\"HOLD_FOR_MANUAL_REVIEW|APPROVE|ESCALATE_TO_COMPLIANCE\"}"
        )
        messages = [{"role": "user", "content": f"Investigate transaction {transaction_id}. {user_message or ''}"}]
        yield {"type": "status", "content": "Investigation started", "status": "running"}

        for _ in range(10):
            try:
                response = await self.client.messages.create(
                    model="claude-3-5-haiku-20241022",
                    max_tokens=4096,
                    system=system_prompt,
                    messages=messages,
                    tools=TOOLS,
                )
                if response.stop_reason == "end_turn":
                    for block in response.content:
                        if hasattr(block, 'text'):
                            yield {"type": "message", "content": block.text}
                    break

                if response.stop_reason == "tool_use":
                    tool_calls = [b for b in response.content if b.type == "tool_use"]
                    messages.append({"role": "assistant", "content": response.content})
                    tool_results_msg = []
                    for tc in tool_calls:
                        yield {"type": "tool_call", "tool": tc.name, "status": "running"}
                        result = await _execute_tool(tc.name, tc.input)
                        yield {"type": "tool_result", "tool": tc.name, "result": result, "status": "complete"}
                        tool_results_msg.append({"type": "tool_result", "tool_use_id": tc.id, "content": json.dumps(result)})
                    messages.append({"role": "user", "content": tool_results_msg})
            except Exception as e:
                yield {"type": "error", "message": str(e)}
                return

        # Extract recommendation
        import re
        for msg in reversed(messages):
            if msg.get('role') == 'assistant':
                content = msg.get('content', [])
                for block in (content if isinstance(content, list) else []):
                    text = getattr(block, 'text', '')
                    m = re.search(r'\{[\s\S]*"recommendation"[\s\S]*\}', text)
                    if m:
                        try:
                            data = json.loads(m.group())
                            yield {"type": "recommendation",
                                   "action": data.get("recommendation", "HOLD_FOR_MANUAL_REVIEW"),
                                   "confidence": f"{int(data.get('confidence', 0.75)*100)}%",
                                   "reason": data.get("summary", ""),
                                   "evidence": data.get("evidence", [])}
                            return
                        except Exception:
                            pass
        yield {"type": "recommendation", "action": "HOLD_FOR_MANUAL_REVIEW",
               "confidence": "75%", "reason": "Investigation complete.", "evidence": []}

    async def _demo_investigate(self, transaction_id: str):
        """Evidence-based demo investigation using real DB data."""
        yield {"type": "status", "content": "Demo Mode — Real evidence collected from database", "status": "demo"}

        steps = [
            ("get_transaction", {"transaction_id": transaction_id}),
            ("get_risk_score", {"transaction_id": transaction_id}),
        ]
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
            txn = res.scalar_one_or_none()
            if txn:
                steps += [
                    ("get_customer_profile", {"customer_id": txn.customer_id}),
                    ("get_customer_transaction_history", {"customer_id": txn.customer_id, "limit": 8}),
                    ("get_location_history", {"customer_id": txn.customer_id}),
                    ("get_model_explanation", {"transaction_id": transaction_id}),
                    ("get_related_transactions", {"transaction_id": transaction_id, "limit": 3}),
                    ("get_account_risk", {"customer_id": txn.customer_id}),
                ]
                if txn.device_id:
                    steps.insert(3, ("get_device_history", {"device_id": txn.device_id}))

        evidence = {}
        for tool_name, tool_input in steps:
            yield {"type": "tool_call", "tool": tool_name, "status": "running"}
            await asyncio.sleep(0.3)
            result = await _execute_tool(tool_name, tool_input)
            evidence[tool_name] = result
            yield {"type": "tool_result", "tool": tool_name, "result": result, "status": "complete"}
            await asyncio.sleep(0.15)

        # Build evidence-based assessment from real data
        txn_data = evidence.get("get_transaction", {})
        risk_data = evidence.get("get_risk_score", {})
        score = risk_data.get("risk_score", txn_data.get("risk_score", 50))
        level = risk_data.get("risk_level", txn_data.get("risk_level", "medium"))

        ev_list = []
        if txn_data.get("failed_attempts", 0) > 1:
            ev_list.append(f"{txn_data['failed_attempts']} failed payment attempts detected before this transaction.")
        if txn_data.get("is_new_device"):
            ev_list.append("Transaction originated from a device not previously associated with this customer account.")
        if txn_data.get("amount_deviation", 0) > 2:
            ev_list.append(f"Transaction amount is {txn_data['amount_deviation']:.1f}x the customer historical average.")
        if txn_data.get("velocity_1h", 0) > 4:
            ev_list.append(f"Velocity anomaly: {txn_data['velocity_1h']} transactions detected within the last hour.")
        cust = evidence.get("get_customer_profile", {})
        if cust.get("chargeback_count", 0) > 0:
            ev_list.append(f"Customer has {cust['chargeback_count']} prior chargeback(s) on record.")
        if not ev_list:
            ev_list.append("Transaction pattern is consistent with customer historical behavior and known device/location.")

        recommendation = "HOLD_FOR_MANUAL_REVIEW" if level in ("critical", "high") else ("HOLD_FOR_MANUAL_REVIEW" if level == "medium" else "APPROVE")
        summary = (f"Investigation of {transaction_id} complete. Risk score: {score:.0f}/100 ({level.upper()}). "
                   + " ".join(ev_list))

        yield {"type": "message", "content": summary}
        yield {
            "type": "recommendation",
            "action": recommendation,
            "confidence": f"{min(97, max(55, int(score) + 5))}%" if score > 50 else "71%",
            "reason": summary,
            "evidence": ev_list,
        }


ai_agent = AIAgent()
