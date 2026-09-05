import asyncio
import json
from fastapi.testclient import TestClient
from backend.main import app

def test_full_flow():
    client = TestClient(app)
    print("\n--- STARTING END-TO-END VERIFICATION TEST ---")

    # 1. Health Check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health Check:", res.json()["status"])

    # 2. Auth - Signup
    signup_payload = {
        "name": "E2E Test Analyst",
        "email": "e2e_analyst@razorshield.ai",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
        "organization": "RazorShield QA"
    }
    res = client.post("/api/auth/signup", json=signup_payload)
    if res.status_code == 400 and "already exists" in res.text:
        print("[PASS] Auth Signup: User already exists")
    else:
        assert res.status_code == 200, f"Signup failed: {res.text}"
        print("[PASS] Auth Signup: Created new user")

    # 3. Auth - Login
    login_payload = {
        "email": "e2e_analyst@razorshield.ai",
        "password": "testpassword123"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Auth Login: JWT acquired")

    # 4. Auth - Me
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200, f"Auth Me failed: {res.text}"
    print("[PASS] Auth Me Endpoint:", res.json()["name"])

    # 5. Traffic Lab - Inject Scenario
    res = client.post("/api/simulator/inject?threat_type=CARD%20TESTING")
    assert res.status_code == 200, f"Inject failed: {res.text}"
    print("[PASS] Traffic Lab Inject (Card Testing Burst)")

    # 6. Transactions List
    res = client.get("/api/transactions")
    assert res.status_code == 200, f"List transactions failed: {res.text}"
    items = res.json()["items"]
    assert len(items) > 0, "No transactions found!"
    target_txn = items[0]
    txn_id = target_txn["id"]
    print(f"[PASS] Transactions Ingested ({len(items)} items, target: {txn_id}, score: {target_txn['risk_score']})")

    # 7. Analyst Decision (HOLD)
    decision_payload = {"action": "hold", "reason": "E2E Automated Hold Decision"}
    res = client.post(f"/api/transactions/{txn_id}/decision", json=decision_payload, headers=headers)
    assert res.status_code == 200, f"Decision endpoint failed: {res.text}"
    print(f"[PASS] Analyst Decision (HOLD for {txn_id}):", res.json())

    # 8. Verify Case Creation
    res = client.get("/api/cases")
    assert res.status_code == 200, f"Cases endpoint failed: {res.text}"
    cases = res.json()["items"]
    assert len(cases) > 0, "Case was not created after HOLD!"
    print(f"[PASS] Automatic Case Creation: ({len(cases)} cases found)")

    # 9. Verify Audit Trail Entry
    res = client.get("/api/audit")
    assert res.status_code == 200, f"Audit endpoint failed: {res.text}"
    audit_items = res.json()["items"]
    assert len(audit_items) > 0, "Audit log empty!"
    print(f"[PASS] Immutable Audit Logging: ({len(audit_items)} audit entries)")

    # 10. Dashboard Summary
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200, f"Dashboard summary failed: {res.text}"
    summary = res.json()
    print("[PASS] Dashboard Summary: Total =", summary["total_transactions"], ", Flagged =", summary["flagged_count"])

    # 11. Model Info
    res = client.get("/api/model/info")
    assert res.status_code == 200, f"Model info failed: {res.text}"
    print("[PASS] Model Performance Info: Precision =", res.json().get("precision"))

    print("\n==================================================")
    print("ALL END-TO-END SYSTEM TESTS PASSED SUCCESSFULLY!")
    print("==================================================\n")

if __name__ == "__main__":
    test_full_flow()
