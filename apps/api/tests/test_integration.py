from datetime import date, datetime
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.schemas.canonical import (
    ClaimDetailSchema,
    ClaimLineSchema,
    AdjudicationSchema,
    AdjudicationLineSchema,
)
from apps.api.services.recovery import create_recovery_case, process_recovery_action

client = TestClient(app)


def test_end_to_end_revenue_recovery_flow():
    """
    Complete end-to-end flow:
    Synthetic Claim -> Simulated Payer Adjudication -> Denial/Underpayment -> Revenue at Risk
    -> Recoverability Assessment -> Expected Recovery -> Priority -> Root Cause -> Evidence
    -> Recommended Action -> Human Approval -> Simulated Recovery Action -> Recovery Outcome
    -> Recovered Amount -> Updated Analytics -> Audit Trail
    """
    # 1. Synthetic Claim setup
    claim = ClaimDetailSchema(
        id="clm-e2e-001",
        claim_number="CLM-2026-E2E01",
        patient_id="pat-e2e",
        patient_name="E2E Test Patient",
        patient_dob=date(1982, 6, 15),
        member_id="E2E-MEM-99",
        provider_id="prv-e2e",
        provider_name="Dr. Alex Rivera",
        provider_npi="1982736450",
        payer_id="pyr-e2e",
        payer_name="UnitedHealthcare",
        status="SUBMITTED",
        total_billed_amount=3200.00,
        service_date=date(2026, 8, 20),
        filing_deadline=date(2026, 11, 20),
        primary_diagnosis="M54.5",
        secondary_diagnoses=["M54.16"],
        clinical_notes="E2E test lumbar MRI without prior auth.",
        lines=[
            ClaimLineSchema(
                id="line-e2e-1",
                claim_id="clm-e2e-001",
                line_number=1,
                cpt_code="72148",
                units=1,
                unit_price=2800.00,
                total_amount=2800.00,
            ),
            ClaimLineSchema(
                id="line-e2e-2",
                claim_id="clm-e2e-001",
                line_number=2,
                cpt_code="99214",
                units=1,
                unit_price=400.00,
                total_amount=400.00,
            ),
        ],
        risk_score=85,
        risk_level="HIGH",
    )

    # 2. Simulated Payer Adjudication resulting in Denial
    adjudication = AdjudicationSchema(
        claim_id=claim.id,
        adjudication_id="adj-e2e-101",
        status="DENIED",
        billed_amount=3200.00,
        allowed_amount=0.00,
        contractual_adjustment=0.00,
        payer_paid_amount=0.00,
        patient_responsibility=0.00,
        lines=[
            AdjudicationLineSchema(
                claim_line_id="line-e2e-1",
                cpt_code="72148",
                paid_amount=0.00,
                carc_code="CO-197",
                carc_description="Precertification/authorization/notification absent.",
                rarc_code="N56",
            )
        ],
    )

    # 3. Revenue at Risk & Case Creation
    recovery_case = create_recovery_case(claim, adjudication)

    assert recovery_case.claim_id == "clm-e2e-001"
    assert recovery_case.denial_carc == "CO-197"
    assert recovery_case.revenue_at_risk == 3200.00
    assert recovery_case.recoverability_score == 60
    assert recovery_case.expected_recovery == 1920.00
    assert recovery_case.priority == "HIGH"
    assert "Prior Authorization" in recovery_case.root_cause
    assert len(recovery_case.evidence) >= 2
    assert "Formal First-Level" in recovery_case.recommended_action
    assert recovery_case.status == "NEW"

    # 4. REST API Cases Listing verification
    resp_list = client.get("/api/v1/recovery/cases")
    assert resp_list.status_code == 200
    cases_data = resp_list.json()
    assert len(cases_data) >= 1

    # 5. Human Approval & Simulated Recovery Action execution via REST API
    action_payload = {
        "action_type": "SUBMIT_APPEAL",
        "approved_by": "Jules Execution Lead",
        "notes": "Approved for immediate submission with clinical documentation.",
    }
    resp_action = client.post("/api/v1/recovery/cases/rec-clm-002/action", json=action_payload)
    assert resp_action.status_code == 200
    action_result = resp_action.json()

    assert action_result["case_id"] == "rec-clm-002"
    assert action_result["action_type"] == "SUBMIT_APPEAL"
    assert action_result["status"] in ("APPEAL_SUBMITTED", "RECOVERED")
    assert action_result["recovered_amount"] > 0
    assert "FORMAL FIRST-LEVEL APPEAL" in action_result["appeal_letter_markdown"]

    # 6. Audit Trail verification
    resp_audit = client.get("/api/v1/recovery/cases/rec-clm-002/audit-trail")
    assert resp_audit.status_code == 200
    audit_data = resp_audit.json()
    assert len(audit_data) >= 2
    assert any("ACTION_SUBMIT_APPEAL" in entry["action"] for entry in audit_data)

    # 7. Updated Analytics Verification
    resp_analytics = client.get("/api/v1/analytics/dashboard")
    assert resp_analytics.status_code == 200
    analytics = resp_analytics.json()
    assert analytics["recovered_revenue"] >= 34200.00
