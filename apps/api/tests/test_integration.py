import pytest
from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)


def test_e2e_denied_claim_recovery_lifecycle():
    """
    End-to-End Integration Test demonstrating the complete Claim Intelligence Revenue Recovery flow:

    DENIED
    → $ REVENUE AT RISK
    → RECOVERABILITY
    → PRIORITY
    → RECOMMENDED ACTION
    → HUMAN APPROVAL
    → SIMULATED RECOVERY
    → RECOVERED
    → DASHBOARD UPDATE
    """
    claim_id = "clm-integration-001"
    billed_amount = 3500.00

    # Step 1: Adjudicate Claim as DENIED with CARC CO-197
    adj_resp = client.post(
        f"/api/v1/claims/{claim_id}/adjudicate",
        params={
            "outcome": "DENIED",
            "carc_code": "CO-197",
            "billed_amount": billed_amount,
            "paid_amount": 0.00,
        },
    )
    assert adj_resp.status_code == 200
    adj_data = adj_resp.json()
    assert adj_data["status"] == "DENIED"
    assert adj_data["billed_amount"] == billed_amount
    assert adj_data["payer_paid_amount"] == 0.00
    assert adj_data["lines"][0]["carc_code"] == "CO-197"

    # Step 2: Verify Claim Denial auto-converted into a Recovery Case with Risk & Priority
    rec_cases_resp = client.get("/api/v1/recovery/cases")
    assert rec_cases_resp.status_code == 200
    cases = rec_cases_resp.json()

    # Find case for this claim
    case = next((c for c in cases if c["claim_id"] == claim_id), None)
    assert case is not None, "Auto-ingested recovery case not found!"

    # Step 3: Validate Revenue at Risk, Recoverability, Priority, & Recommended Action WHY
    assert case["revenue_at_risk"] == billed_amount
    assert case["recoverability_score"] > 0
    assert case["priority"] in ["URGENT", "HIGH", "MEDIUM", "LOW"]
    assert case["recommended_action"] == "FIRST_LEVEL_APPEAL"
    assert "CO-197" in case["explanation_why"]

    case_id = case["id"]

    # Step 4: Generate Appeal Dossier
    appeal_resp = client.post(f"/api/v1/recovery/cases/{case_id}/appeal")
    assert appeal_resp.status_code == 200
    appeal_data = appeal_resp.json()
    assert "FORMAL" in appeal_data["content"]
    assert claim_id in appeal_data["content"] or case["claim_number"] in appeal_data["content"]

    # Step 5: Human Approval & Workflow Transition
    transition_resp = client.post(
        f"/api/v1/recovery/cases/{case_id}/transition",
        json={
            "status": "RESUBMITTED",
            "actor": "Human Claims Specialist",
            "notes": "Approved appeal letter and resubmitted to payer",
        },
    )
    assert transition_resp.status_code == 200
    assert transition_resp.json()["status"] == "RESUBMITTED"

    # Step 6: Simulated Recovery Action (Payer pays 100% of revenue at risk)
    outcome_resp = client.post(
        f"/api/v1/recovery/cases/{case_id}/outcome",
        json={
            "recovered_amount": billed_amount,
            "notes": "Simulated remittance receipt of $3,500.00 following successful appeal",
        },
    )
    assert outcome_resp.status_code == 200
    outcome_data = outcome_resp.json()
    assert outcome_data["status"] == "RECOVERED"
    assert outcome_data["recovered_amount"] == billed_amount
    assert outcome_data["remaining_amount"] == 0.00

    # Step 7: Verify Dashboard Analytics Updates Dynamically
    dash_resp = client.get("/api/v1/analytics/dashboard")
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["recovered_revenue"] >= billed_amount


def test_e2e_underpaid_claim_recovery_lifecycle():
    """
    End-to-End Test demonstrating underpayment outcome conversion to recovery case.
    """
    claim_id = "clm-integration-underpaid"
    billed_amount = 2500.00
    paid_amount = 1000.00
    shortfall = billed_amount - paid_amount  # $1,500.00

    # Adjudicate as UNDERPAID
    adj_resp = client.post(
        f"/api/v1/claims/{claim_id}/adjudicate",
        params={
            "outcome": "UNDERPAID",
            "carc_code": "CO-45",
            "billed_amount": billed_amount,
            "paid_amount": paid_amount,
        },
    )
    assert adj_resp.status_code == 200
    assert adj_resp.json()["status"] == "UNDERPAID"

    # Verify recovery case
    cases_resp = client.get("/api/v1/recovery/cases")
    case = next((c for c in cases_resp.json() if c["claim_id"] == claim_id), None)
    assert case is not None
    assert case["revenue_at_risk"] == shortfall
    assert case["recommended_action"] == "RECONSIDERATION"

    # Simulate Partial Recovery Outcome ($1,000 recovered out of $1,500 shortfall)
    case_id = case["id"]
    outcome_resp = client.post(
        f"/api/v1/recovery/cases/{case_id}/outcome",
        json={
            "recovered_amount": 1000.00,
            "notes": "Partial fee schedule adjustment granted by payer",
        },
    )
    assert outcome_resp.status_code == 200
    res = outcome_resp.json()
    assert res["status"] == "PARTIALLY_RECOVERED"
    assert res["recovered_amount"] == 1000.00
    assert res["remaining_amount"] == 500.00
