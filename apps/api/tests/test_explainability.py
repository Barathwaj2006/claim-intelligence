from datetime import date, datetime
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.schemas.canonical import (
    ClaimDetailSchema,
    ClaimLineSchema,
    RiskScoreSchema,
    RiskFactorSchema,
    RiskSubscoresSchema,
)
from apps.api.services.explainability import generate_claim_explanation, ExplainabilityEngine


def test_high_risk_claim_explanation():
    claim = ClaimDetailSchema(
        id="clm-high",
        claim_number="CLM-TEST-HIGH",
        patient_id="pat-01",
        patient_name="John Doe",
        patient_dob=date(1980, 1, 1),
        member_id="MEM-123",
        provider_id="prv-01",
        provider_name="Dr. Smith",
        provider_npi="1234567890",
        payer_id="pyr-01",
        payer_name="Aetna",
        status="DRAFT",
        total_billed_amount=2500.00,
        service_date=date(2026, 8, 1),
        filing_deadline=date(2026, 11, 1),
        primary_diagnosis="M54.5",
        lines=[
            ClaimLineSchema(
                id="l1",
                claim_id="clm-high",
                line_number=1,
                cpt_code="72148",
                units=1,
                unit_price=2500.00,
                total_amount=2500.00,
            )
        ],
        risk_score=80,
        risk_level="HIGH",
    )

    risk_score = RiskScoreSchema(
        claim_id="clm-high",
        overall_score=80,
        risk_level="HIGH",
        subscores=RiskSubscoresSchema(
            eligibility=0,
            authorization=50,
            coverage=20,
            data_quality=10,
            timely_filing=0,
            provider_network=0,
        ),
        factors=[
            RiskFactorSchema(
                id="rf-1",
                category="AUTHORIZATION",
                impact_points=50,
                title="Missing Prior Auth",
                description="CPT 72148 requires prior authorization under Aetna policy.",
                likely_carc_code="CO-197",
                recommended_fix="Obtain prior authorization number.",
            )
        ],
        calculated_at=datetime.utcnow(),
    )

    explanation = generate_claim_explanation(claim, risk_score)

    assert explanation.risk_score == 80
    assert explanation.risk_tier == "HIGH"
    assert "High Denial Risk" in explanation.summary
    assert len(explanation.factors) == 1
    assert explanation.factors[0].contribution == 50
    assert explanation.factors[0].severity == "HIGH"
    assert "Obtain prior authorization number." in explanation.recommendation

    # Distinguish FACT vs INFERENCE in factor evidence
    evidence_types = {ev.type for factor in explanation.factors for ev in factor.evidence}
    assert "FACT" in evidence_types
    assert "INFERENCE" in evidence_types


def test_low_risk_claim_explanation():
    claim = ClaimDetailSchema(
        id="clm-low",
        claim_number="CLM-TEST-LOW",
        patient_id="pat-02",
        patient_name="Jane Doe",
        patient_dob=date(1990, 5, 12),
        member_id="MEM-456",
        provider_id="prv-01",
        provider_name="Dr. Smith",
        provider_npi="1234567890",
        payer_id="pyr-02",
        payer_name="BCBS",
        status="VERIFIED",
        total_billed_amount=150.00,
        service_date=date(2026, 8, 15),
        filing_deadline=date(2026, 11, 15),
        primary_diagnosis="Z00.00",
        lines=[],
        risk_score=10,
        risk_level="LOW",
    )

    explanation = generate_claim_explanation(claim)

    assert explanation.risk_score == 10
    assert explanation.risk_tier == "LOW"
    assert "Low Denial Risk" in explanation.summary
    assert explanation.confidence >= 0.7


def test_grounding_no_unsupported_facts():
    claim = ClaimDetailSchema(
        id="clm-grounded",
        claim_number="CLM-TEST-GROUND",
        patient_id="pat-03",
        patient_name="Alice Blue",
        patient_dob=date(1985, 3, 20),
        member_id="MEM-789",
        provider_id="prv-02",
        provider_name="Dr. Jones",
        provider_npi="9876543210",
        payer_id="pyr-03",
        payer_name="UnitedHealthcare",
        status="DRAFT",
        total_billed_amount=450.00,
        service_date=date(2026, 8, 10),
        filing_deadline=date(2026, 11, 10),
        primary_diagnosis="M25.561",
        lines=[],
        risk_score=20,
        risk_level="LOW",
    )

    explanation = generate_claim_explanation(claim)

    # Ensure facts only reference actual fields present in payload
    for ev in explanation.evidence:
        if ev.type == "FACT":
            assert any(
                token in ev.description
                for token in ["Alice Blue", "UnitedHealthcare", "9876543210", "$450.00", "clm-grounded"]
            )


def test_explain_endpoint_integration():
    client = TestClient(app)
    response = client.get("/api/v1/claims/clm-002/explain")
    assert response.status_code == 200

    data = response.json()
    assert "summary" in data
    assert "risk_score" in data
    assert "risk_tier" in data
    assert "factors" in data
    assert "recommendation" in data
    assert "evidence" in data
    assert "confidence" in data
    assert "generated_at" in data
