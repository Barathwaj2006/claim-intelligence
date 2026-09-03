from datetime import date, datetime
from apps.api.models import (
    Base,
    Patient,
    Provider,
    Payer,
    InsurancePlan,
    Encounter,
    Claim,
    ClaimLine,
    EligibilityCheck,
    PriorAuthorization,
    RiskScore,
    RiskFactor,
    Correction,
    Adjudication,
    AdjudicationLine,
    RecoveryCase,
    AppealDocument,
)


def test_table_metadata_registration():
    """Verify all 16 expected database tables are properly registered in SQLAlchemy metadata."""
    expected_tables = {
        "patients",
        "providers",
        "payers",
        "insurance_plans",
        "encounters",
        "claims",
        "claim_lines",
        "eligibility_checks",
        "prior_authorizations",
        "risk_scores",
        "risk_factors",
        "corrections",
        "adjudications",
        "adjudication_lines",
        "recovery_cases",
        "appeal_documents",
    }
    registered_tables = set(Base.metadata.tables.keys())
    for table in expected_tables:
        assert table in registered_tables, f"Table '{table}' missing from SQLAlchemy metadata"


def test_full_domain_model_and_relationships(db_session):
    """Verify entity creation, foreign keys, and bidirectional navigation across all 16 entities."""
    # 1. Patient, Provider, Payer, InsurancePlan
    patient = Patient(
        first_name="Eleanor",
        last_name="Vance",
        date_of_birth=date(1980, 4, 12),
        gender="FEMALE",
        member_id="BCBS-982310",
        group_number="GRP-99",
        address="123 Hill House, Boston, MA",
    )
    provider = Provider(
        npi="1098765432",
        name="Dr. John Montague, MD",
        taxonomy_code="207R00000X",
        tax_id="98-7654321",
        in_network=True,
    )
    payer = Payer(
        name="Blue Cross Blue Shield",
        payer_id="00123",
        timely_filing_days=180,
        requires_auth_for_advanced_imaging=True,
    )
    db_session.add_all([patient, provider, payer])
    db_session.commit()

    plan = InsurancePlan(
        payer_id=payer.id,
        plan_name="Silver Choice PPO",
        plan_type="PPO",
        annual_deductible=1500.00,
        copay_specialist=40.00,
        coinsurance_percentage=20.00,
    )
    db_session.add(plan)
    db_session.commit()

    # 2. Encounter
    encounter = Encounter(
        patient_id=patient.id,
        provider_id=provider.id,
        service_date=date(2026, 8, 15),
        place_of_service="11",
        primary_diagnosis_code="M25.561",
        secondary_diagnosis_codes=["M54.5"],
        clinical_notes="Patient presents with persistent right knee pain.",
    )
    db_session.add(encounter)
    db_session.commit()

    # 3. Claim
    claim = Claim(
        claim_number="CLM-2026-00491",
        patient_id=patient.id,
        provider_id=provider.id,
        payer_id=payer.id,
        encounter_id=encounter.id,
        status="DRAFT",
        total_billed_amount=1450.00,
        service_date=date(2026, 8, 15),
        filing_deadline=date(2026, 11, 15),
    )
    db_session.add(claim)
    db_session.commit()

    # 4. ClaimLine
    line = ClaimLine(
        claim_id=claim.id,
        line_number=1,
        cpt_code="72148",
        modifiers=["LT"],
        diagnosis_pointers=[1],
        units=1,
        unit_price=1450.00,
        total_amount=1450.00,
    )
    db_session.add(line)
    db_session.commit()

    # 5. EligibilityCheck
    eligibility = EligibilityCheck(
        patient_id=patient.id,
        payer_id=payer.id,
        is_active=True,
        effective_date=date(2026, 1, 1),
        deductible_total=1500.00,
        deductible_met=1200.00,
        copay_amount=35.00,
        raw_response={"status": "active"},
    )
    db_session.add(eligibility)
    db_session.commit()

    # 6. PriorAuthorization
    prior_auth = PriorAuthorization(
        claim_id=claim.id,
        cpt_code="72148",
        authorization_number="AUTH-72148-99A",
        status="APPROVED",
        approved_units=1,
        valid_from=date(2026, 8, 1),
        valid_to=date(2026, 10, 31),
    )
    db_session.add(prior_auth)
    db_session.commit()

    # 7. RiskScore & RiskFactor
    risk_score = RiskScore(
        claim_id=claim.id,
        overall_score=82,
        risk_level="HIGH",
        eligibility_subscore=0,
        authorization_subscore=95,
        coverage_subscore=40,
        quality_subscore=60,
    )
    db_session.add(risk_score)
    db_session.commit()

    risk_factor = RiskFactor(
        risk_score_id=risk_score.id,
        impact_points=35,
        category="AUTHORIZATION",
        title="Missing Prior Authorization",
        description="Payer policy requires prior authorization for MRI Lumbar Spine.",
        likely_carc_code="CO-197",
    )
    db_session.add(risk_factor)
    db_session.commit()

    # 8. Correction
    correction = Correction(
        claim_id=claim.id,
        field_name="payer_name",
        original_value="BlueShild",
        suggested_value="Blue Cross Blue Shield",
        reason="Normalized common typo",
        confidence=0.98,
        status="PENDING",
    )
    db_session.add(correction)
    db_session.commit()

    # 9. Adjudication & AdjudicationLine
    adjudication = Adjudication(
        claim_id=claim.id,
        status="DENIED",
        billed_amount=1450.00,
        allowed_amount=0.00,
        contractual_adjustment=0.00,
        payer_paid_amount=0.00,
        patient_responsibility=0.00,
    )
    db_session.add(adjudication)
    db_session.commit()

    adj_line = AdjudicationLine(
        adjudication_id=adjudication.id,
        claim_line_id=line.id,
        paid_amount=0.00,
        carc_code="CO-197",
        carc_description="Precertification/authorization absent.",
        rarc_code="N56",
    )
    db_session.add(adj_line)
    db_session.commit()

    # 10. RecoveryCase & AppealDocument
    recovery_case = RecoveryCase(
        claim_id=claim.id,
        adjudication_id=adjudication.id,
        revenue_at_risk=1450.00,
        recoverability_score=85,
        priority="HIGH",
        status="NEW",
        recommended_action="FIRST_LEVEL_APPEAL",
        filing_deadline=date(2026, 11, 15),
    )
    db_session.add(recovery_case)
    db_session.commit()

    appeal_doc = AppealDocument(
        recovery_case_id=recovery_case.id,
        document_type="APPEAL_LETTER",
        content="Formal reconsideration request for claim CLM-2026-00491...",
    )
    db_session.add(appeal_doc)
    db_session.commit()

    # --- Assert Navigation and Relationships ---
    q_patient = db_session.query(Patient).filter_by(id=patient.id).first()
    assert len(q_patient.encounters) == 1
    assert len(q_patient.claims) == 1
    assert len(q_patient.eligibility_checks) == 1
    assert q_patient.eligibility_checks[0].payer.name == "Blue Cross Blue Shield"

    q_payer = db_session.query(Payer).filter_by(id=payer.id).first()
    assert len(q_payer.plans) == 1
    assert q_payer.plans[0].plan_name == "Silver Choice PPO"

    q_claim = db_session.query(Claim).filter_by(id=claim.id).first()
    assert q_claim.patient.first_name == "Eleanor"
    assert q_claim.provider.name == "Dr. John Montague, MD"
    assert q_claim.payer.name == "Blue Cross Blue Shield"
    assert q_claim.encounter.primary_diagnosis_code == "M25.561"
    assert len(q_claim.lines) == 1
    assert len(q_claim.authorizations) == 1
    assert len(q_claim.risk_scores) == 1
    assert len(q_claim.corrections) == 1
    assert len(q_claim.adjudications) == 1
    assert len(q_claim.recovery_cases) == 1

    assert len(q_claim.risk_scores[0].factors) == 1
    assert q_claim.risk_scores[0].factors[0].likely_carc_code == "CO-197"

    assert len(q_claim.adjudications[0].lines) == 1
    assert q_claim.adjudications[0].lines[0].claim_line.cpt_code == "72148"

    assert q_claim.recovery_cases[0].adjudication.status == "DENIED"
    assert len(q_claim.recovery_cases[0].appeal_documents) == 1


def test_claim_cascading_deletes(db_session):
    """Verify deleting a claim cascades to child records (lines, risk_scores, etc.)."""
    patient = Patient(first_name="Jane", last_name="Doe", date_of_birth=date(1990, 1, 1), member_id="M123")
    provider = Provider(npi="1111111111", name="Dr. Smith", taxonomy_code="207Q00000X", tax_id="11-1111111")
    payer = Payer(name="Medicare", payer_id="00001")
    db_session.add_all([patient, provider, payer])
    db_session.commit()

    encounter = Encounter(patient_id=patient.id, provider_id=provider.id, service_date=date(2026, 1, 1), primary_diagnosis_code="I10")
    db_session.add(encounter)
    db_session.commit()

    claim = Claim(
        claim_number="CLM-DEL-001",
        patient_id=patient.id,
        provider_id=provider.id,
        payer_id=payer.id,
        encounter_id=encounter.id,
        service_date=date(2026, 1, 1),
        filing_deadline=date(2026, 4, 1),
    )
    db_session.add(claim)
    db_session.commit()

    line = ClaimLine(claim_id=claim.id, line_number=1, cpt_code="99213", total_amount=100.00)
    risk_score = RiskScore(claim_id=claim.id, overall_score=10, risk_level="LOW")
    db_session.add_all([line, risk_score])
    db_session.commit()

    risk_factor = RiskFactor(risk_score_id=risk_score.id, impact_points=5, category="QUALITY", title="Minor", description="Desc")
    db_session.add(risk_factor)
    db_session.commit()

    # Delete claim
    db_session.delete(claim)
    db_session.commit()

    # Verify orphan records were deleted
    assert db_session.query(ClaimLine).filter_by(claim_id=claim.id).first() is None
    assert db_session.query(RiskScore).filter_by(claim_id=claim.id).first() is None
    assert db_session.query(RiskFactor).filter_by(risk_score_id=risk_score.id).first() is None
