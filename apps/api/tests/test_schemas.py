from datetime import date, datetime
from apps.api.schemas.canonical import (
    StandardResponse,
    StandardError,
    PatientSchema,
    PayerSchema,
    ClaimDetailSchema,
    ClaimLineSchema,
    EligibilityResultSchema,
    AuthorizationResultSchema,
    RiskScoreSchema,
    RiskSubscoresSchema,
    RiskFactorSchema,
    AdjudicationSchema,
    AdjudicationLineSchema,
    RecoveryCaseSchema,
    DashboardAnalyticsSchema,
    TopDenialReasonSchema,
)


def test_standard_response_envelopes():
    """Verify standard success and error response envelopes."""
    success_resp = StandardResponse[str](success=True, data="OK", message="Operation successful")
    assert success_resp.success is True
    assert success_resp.data == "OK"
    assert success_resp.error is None

    err = StandardError(code="NOT_FOUND", message="Resource not found")
    error_resp = StandardResponse[dict](success=False, error=err)
    assert error_resp.success is False
    assert error_resp.error.code == "NOT_FOUND"


def test_patient_and_payer_schemas():
    """Verify Patient and Payer schema validation."""
    patient = PatientSchema(
        id="p1",
        first_name="Eleanor",
        last_name="Vance",
        date_of_birth=date(1990, 5, 12),
        gender="FEMALE",
        member_id="BCBS-123456",
        group_number=None,
        address=None,
    )
    assert patient.first_name == "Eleanor"
    assert patient.group_number is None

    payer = PayerSchema(
        id="pay1",
        name="Blue Cross Blue Shield",
        payer_id="00123",
        timely_filing_days=90,
        requires_auth_for_advanced_imaging=True,
    )
    assert payer.timely_filing_days == 90


def test_claim_detail_schema():
    """Verify ClaimDetail schema and nested ClaimLine schemas."""
    line = ClaimLineSchema(
        id="line1",
        claim_id="c1",
        line_number=1,
        cpt_code="72148",
        modifiers=["LT"],
        diagnosis_pointers=[1],
        units=1,
        unit_price=1450.00,
        total_amount=1450.00,
    )
    claim = ClaimDetailSchema(
        id="c1",
        claim_number="CLM-2026-00101",
        patient_id="p1",
        patient_name="Eleanor Vance",
        patient_dob=date(1990, 5, 12),
        member_id="BCBS-123456",
        provider_id="prov1",
        provider_name="Dr. Smith",
        provider_npi="1234567890",
        payer_id="pay1",
        payer_name="Blue Cross Blue Shield",
        status="DRAFT",
        total_billed_amount=1450.00,
        service_date=date(2026, 8, 15),
        filing_deadline=date(2026, 11, 15),
        primary_diagnosis="M54.5",
        secondary_diagnoses=[],
        lines=[line],
    )
    assert claim.claim_number == "CLM-2026-00101"
    assert len(claim.lines) == 1
    assert claim.lines[0].cpt_code == "72148"


def test_intelligence_schemas():
    """Verify Eligibility, Authorization, and Risk schemas."""
    elig = EligibilityResultSchema(
        claim_id="c1",
        is_active=True,
        effective_date=date(2026, 1, 1),
        copay_amount=35.00,
        deductible_total=1500.00,
        deductible_met=1200.00,
        deductible_remaining=300.00,
        payer_name="BCBS",
        status="VERIFIED",
    )
    assert elig.is_active is True
    assert elig.deductible_remaining == 300.00

    auth = AuthorizationResultSchema(
        claim_id="c1",
        requires_auth=True,
        auth_status="APPROVED",
        authorization_number="AUTH-123",
        authorized_cpt_codes=["72148"],
    )
    assert auth.auth_status == "APPROVED"

    subscores = RiskSubscoresSchema(
        eligibility=0,
        authorization=95,
        coverage=40,
        data_quality=60,
        timely_filing=10,
        provider_network=0,
    )
    factor = RiskFactorSchema(
        id="rf1",
        category="AUTHORIZATION",
        impact_points=35,
        title="Missing Auth",
        description="Prior authorization required",
        likely_carc_code="CO-197",
    )
    risk = RiskScoreSchema(
        claim_id="c1",
        overall_score=82,
        risk_level="HIGH",
        subscores=subscores,
        factors=[factor],
        calculated_at=datetime(2026, 9, 3, 12, 0, 0),
    )
    assert risk.overall_score == 82
    assert risk.risk_level == "HIGH"


def test_adjudication_recovery_and_analytics_schemas():
    """Verify Adjudication, Recovery, and Analytics schemas."""
    adj_line = AdjudicationLineSchema(
        claim_line_id="line1",
        cpt_code="72148",
        paid_amount=0.00,
        carc_code="CO-197",
        carc_description="Authorization absent",
    )
    adj = AdjudicationSchema(
        claim_id="c1",
        adjudication_id="adj1",
        status="DENIED",
        billed_amount=1450.00,
        allowed_amount=0.00,
        contractual_adjustment=0.00,
        payer_paid_amount=0.00,
        patient_responsibility=0.00,
        lines=[adj_line],
    )
    assert adj.status == "DENIED"

    rec = RecoveryCaseSchema(
        id="rec1",
        claim_id="c1",
        claim_number="CLM-2026-00101",
        patient_name="Eleanor Vance",
        payer_name="BCBS",
        denial_carc="CO-197",
        denial_reason="Precertification/authorization absent",
        revenue_at_risk=1450.00,
        recoverability_score=85,
        priority="HIGH",
        status="NEW",
        recommended_action="FIRST_LEVEL_APPEAL",
        filing_deadline=date(2026, 11, 15),
        days_remaining=73,
    )
    assert rec.priority == "HIGH"

    analytics = DashboardAnalyticsSchema(
        total_claims=100,
        clean_claim_rate=85.0,
        total_billed_value=100000.00,
        revenue_at_risk=15000.00,
        recovered_revenue=5000.00,
        risk_distribution={"low": 70, "medium": 20, "high": 10},
        top_denial_reasons=[
            TopDenialReasonSchema(carc="CO-197", description="Auth absent", count=5, amount=7250.00)
        ],
    )
    assert analytics.total_claims == 100
