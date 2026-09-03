import pytest
from datetime import date, datetime
import apps.api.schemas.canonical as canonical


def test_standard_response_and_error():
    res = canonical.StandardResponse[dict](
        success=True,
        data={"claim_id": "CLM-001"},
        message="Operation successful"
    )
    assert res.success is True
    assert res.data["claim_id"] == "CLM-001"
    assert res.message == "Operation successful"

    err = canonical.StandardError(
        code="RESOURCE_NOT_FOUND",
        message="Claim CLM-001 not found",
        details=[]
    )
    assert err.code == "RESOURCE_NOT_FOUND"
    err_res = canonical.StandardResponse[dict](
        success=False,
        error=err
    )
    assert err_res.success is False
    assert err_res.error.code == "RESOURCE_NOT_FOUND"


def test_patient_and_provider_schemas():
    patient = canonical.PatientSchema(
        id="pat-1",
        first_name="Eleanor",
        last_name="Vance",
        date_of_birth=date(1985, 4, 12),
        gender="FEMALE",
        member_id="BCBS-982310",
        group_number="GRP-1234",
        address="123 Main St, Boston, MA"
    )
    assert patient.first_name == "Eleanor"
    assert patient.gender == "FEMALE"

    provider = canonical.ProviderSchema(
        id="prov-1",
        npi="1234567890",
        name="Dr. Jane Doe",
        taxonomy_code="207Q00000X",
        tax_id="12-3456789",
        in_network=True
    )
    assert provider.npi == "1234567890"
    assert provider.in_network is True


def test_payer_and_plan_schemas():
    payer = canonical.PayerSchema(
        id="pyr-1",
        name="Blue Cross Blue Shield",
        payer_id="00123",
        timely_filing_days=90,
        requires_auth_for_advanced_imaging=True
    )
    assert payer.payer_id == "00123"

    plan = canonical.InsurancePlanSchema(
        id="plan-1",
        payer_id="pyr-1",
        plan_name="Gold PPO",
        plan_type="PPO",
        annual_deductible=1500.00,
        copay_specialist=35.00,
        coinsurance_percentage=20.00
    )
    assert plan.plan_type == "PPO"
    assert plan.annual_deductible == 1500.00


def test_claim_schemas():
    line = canonical.ClaimLineSchema(
        id="line-1",
        claim_id="clm-1",
        line_number=1,
        cpt_code="72148",
        modifiers=["LT"],
        diagnosis_pointers=[1],
        units=1,
        unit_price=1450.00,
        total_amount=1450.00
    )
    assert line.cpt_code == "72148"
    assert line.total_amount == 1450.00

    detail = canonical.ClaimDetailSchema(
        id="clm-1",
        claim_number="CLM-2026-00101",
        patient_id="pat-1",
        patient_name="Eleanor Vance",
        patient_dob=date(1985, 4, 12),
        member_id="BCBS-982310",
        provider_id="prov-1",
        provider_name="Dr. Jane Doe",
        provider_npi="1234567890",
        payer_id="pyr-1",
        payer_name="Blue Cross Blue Shield",
        status="READY_FOR_SUBMISSION",
        total_billed_amount=1450.00,
        service_date=date(2026, 8, 15),
        filing_deadline=date(2026, 11, 15),
        primary_diagnosis="M54.5",
        secondary_diagnoses=["M54.16"],
        clinical_notes="Patient experiencing persistent lower back pain.",
        lines=[line],
        risk_score=18,
        risk_level="LOW"
    )
    assert detail.claim_number == "CLM-2026-00101"
    assert len(detail.lines) == 1


def test_intelligence_schemas():
    eligibility = canonical.EligibilityResultSchema(
        claim_id="clm-1",
        is_active=True,
        effective_date=date(2026, 1, 1),
        termination_date=None,
        copay_amount=35.00,
        deductible_total=1500.00,
        deductible_met=1200.00,
        deductible_remaining=300.00,
        payer_name="Blue Cross Blue Shield",
        status="VERIFIED",
        warnings=[]
    )
    assert eligibility.is_active is True

    auth = canonical.AuthorizationResultSchema(
        claim_id="clm-1",
        requires_auth=True,
        auth_status="APPROVED",
        authorization_number="AUTH-72148-99A",
        authorized_cpt_codes=["72148"],
        valid_through=date(2026, 10, 30),
        warnings=[]
    )
    assert auth.requires_auth is True

    coverage = canonical.CoverageResultSchema(
        claim_id="clm-1",
        coverage_status="COVERED",
        medical_necessity_met=True,
        frequency_limits_exceeded=False,
        policy_notes="L-Spine MRI indicated for chronic radiculopathy"
    )
    assert coverage.coverage_status == "COVERED"


def test_risk_and_correction_schemas():
    factor = canonical.RiskFactorSchema(
        id="rf-1",
        category="AUTHORIZATION",
        impact_points=35,
        title="Missing Prior Authorization",
        description="Prior authorization is required for MRI Lumbar Spine.",
        likely_carc_code="CO-197",
        recommended_fix="Obtain authorization before submission."
    )
    subscores = canonical.RiskSubscoresSchema(
        eligibility=0,
        authorization=95,
        coverage=40,
        data_quality=60,
        timely_filing=10,
        provider_network=0
    )
    risk = canonical.RiskScoreSchema(
        claim_id="clm-1",
        overall_score=82,
        risk_level="HIGH",
        subscores=subscores,
        factors=[factor],
        calculated_at=datetime(2026, 9, 3, 12, 30, 0)
    )
    assert risk.overall_score == 82
    assert risk.risk_level == "HIGH"

    corr = canonical.CorrectionSchema(
        id="corr-1",
        claim_id="clm-1",
        field_name="payer_name",
        original_value="BlueShild",
        suggested_value="Blue Cross Blue Shield",
        reason="Normalized common typo",
        confidence=0.98,
        status="PENDING"
    )
    assert corr.confidence == 0.98


def test_adjudication_and_recovery_schemas():
    adj_line = canonical.AdjudicationLineSchema(
        claim_line_id="line-1",
        cpt_code="72148",
        paid_amount=0.00,
        carc_code="CO-197",
        carc_description="Precertification absent",
        rarc_code="N56"
    )
    adj = canonical.AdjudicationSchema(
        claim_id="clm-1",
        adjudication_id="adj-9912",
        status="DENIED",
        billed_amount=1450.00,
        allowed_amount=0.00,
        contractual_adjustment=0.00,
        payer_paid_amount=0.00,
        patient_responsibility=0.00,
        lines=[adj_line]
    )
    assert adj.status == "DENIED"

    rec = canonical.RecoveryCaseSchema(
        id="rec-101",
        claim_id="clm-1",
        claim_number="CLM-2026-00101",
        patient_name="Eleanor Vance",
        payer_name="Blue Cross Blue Shield",
        denial_carc="CO-197",
        denial_reason="Missing prior auth",
        revenue_at_risk=1450.00,
        recoverability_score=85,
        priority="HIGH",
        status="NEW",
        recommended_action="FIRST_LEVEL_APPEAL",
        filing_deadline=date(2026, 11, 15),
        days_remaining=73
    )
    assert rec.revenue_at_risk == 1450.00

    appeal = canonical.AppealDocumentSchema(
        id="app-1",
        recovery_case_id="rec-101",
        document_type="APPEAL_LETTER",
        content="Formal reconsideration request...",
        created_at=datetime(2026, 9, 3, 12, 40, 0)
    )
    assert appeal.document_type == "APPEAL_LETTER"
