import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.services.recovery import (
    calculate_recoverability,
    calculate_financial_impact,
    determine_priority,
    determine_recommended_action,
    evaluate_recovery_opportunity,
    generate_appeal_dossier,
    transition_case_state,
    record_simulated_outcome,
)

client = TestClient(app)


def test_recoverability_calculation():
    res_co16 = calculate_recoverability("CO-16", has_evidence=True, days_remaining=60)
    assert res_co16["recoverability_score"] == 100  # 90 + 10 = 100

    res_co197 = calculate_recoverability("CO-197", has_evidence=True, days_remaining=60)
    assert res_co197["recoverability_score"] == 70  # 60 + 10 = 70

    res_co29 = calculate_recoverability("CO-29", has_evidence=False, days_remaining=5)
    # 15 - 15 (no evidence) - 20 (urgent deadline) = 0
    assert res_co29["recoverability_score"] == 0


def test_financial_impact_calculation():
    impact = calculate_financial_impact(billed_amount=4850.00, paid_amount=0.00, recoverability_score=75)
    assert impact["revenue_at_risk"] == 4850.00
    assert impact["expected_recovery"] == 3637.50
    assert impact["remaining_amount"] == 4850.00

    underpaid = calculate_financial_impact(billed_amount=2000.00, paid_amount=500.00, recoverability_score=80)
    assert underpaid["revenue_at_risk"] == 1500.00
    assert underpaid["expected_recovery"] == 1200.00


def test_priority_matrix():
    assert determine_priority(revenue_at_risk=6000.00, days_remaining=60, expected_recovery=4500.00, recoverability_score=75) == "URGENT"
    assert determine_priority(revenue_at_risk=500.00, days_remaining=10, expected_recovery=300.00, recoverability_score=60) == "URGENT"
    assert determine_priority(revenue_at_risk=2500.00, days_remaining=40, expected_recovery=2000.00, recoverability_score=80) == "HIGH"
    assert determine_priority(revenue_at_risk=500.00, days_remaining=40, expected_recovery=300.00, recoverability_score=60) == "MEDIUM"
    assert determine_priority(revenue_at_risk=100.00, days_remaining=60, expected_recovery=50.00, recoverability_score=50) == "LOW"


def test_recommended_action_and_why():
    action_197, why_197 = determine_recommended_action("CO-197", 70)
    assert action_197 == "FIRST_LEVEL_APPEAL"
    assert "CO-197" in why_197 and "70%" in why_197

    action_16, why_16 = determine_recommended_action("CO-16", 95)
    assert action_16 == "CORRECTED_CLAIM"
    assert "CO-16" in why_16 and "95%" in why_16


def test_workflow_state_transitions():
    res = transition_case_state("ACTION_REQUIRED", "IN_PROGRESS", actor="Dr. Watson")
    assert res["status"] == "IN_PROGRESS"
    assert len(res["audit_trail"]) == 1
    assert res["audit_trail"][0]["actor"] == "Dr. Watson"

    with pytest.raises(ValueError):
        transition_case_state("ACTION_REQUIRED", "INVALID_STATE_XYZ")


def test_outcome_recording():
    outcome = record_simulated_outcome(revenue_at_risk=4850.00, recovered_amount=4850.00)
    assert outcome["recovered_amount"] == 4850.00
    assert outcome["remaining_amount"] == 0.00
    assert outcome["status"] == "RECOVERED"

    partial = record_simulated_outcome(revenue_at_risk=4850.00, recovered_amount=2000.00)
    assert partial["recovered_amount"] == 2000.00
    assert partial["remaining_amount"] == 2850.00
    assert partial["status"] == "PARTIALLY_RECOVERED"


def test_recovery_api_endpoints():
    # 1. List cases
    res = client.get("/api/v1/recovery/cases")
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) >= 3

    # 2. Get specific case
    case_id = cases[0]["id"]
    res_detail = client.get(f"/api/v1/recovery/cases/{case_id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["id"] == case_id

    # 3. Generate appeal
    res_appeal = client.post(f"/api/v1/recovery/cases/{case_id}/appeal")
    assert res_appeal.status_code == 200
    assert "FORMAL" in res_appeal.json()["content"]

    # 4. Transition state
    res_trans = client.post(
        f"/api/v1/recovery/cases/{case_id}/transition",
        json={"status": "IN_PROGRESS", "actor": "Test Specialist", "notes": "Moving to in progress"},
    )
    assert res_trans.status_code == 200
    assert res_trans.json()["status"] == "IN_PROGRESS"

    # 5. Record simulated outcome
    res_outcome = client.post(
        f"/api/v1/recovery/cases/{case_id}/outcome",
        json={"recovered_amount": 4850.00, "notes": "Simulated full payout"},
    )
    assert res_outcome.status_code == 200
    assert res_outcome.json()["status"] == "RECOVERED"
    assert res_outcome.json()["remaining_amount"] == 0.00

    # 6. Check analytics endpoint
    res_analytics = client.get("/api/v1/recovery/analytics")
    assert res_analytics.status_code == 200
    analytics = res_analytics.json()
    assert analytics["total_recovered_amount"] >= 4850.00
