from datetime import date
from apps.api.models import (
    Base,
    Patient,
    Provider,
    Payer,
    InsurancePlan,
    Encounter,
    Claim,
    ClaimLine,
)


def test_table_metadata_registration():
    """Verify all 15 expected database tables are properly registered in SQLAlchemy metadata."""
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


def test_entity_creation(db_session):
    """Verify creating canonical patient, provider, payer, encounter, and claim entities."""
    patient = Patient(
        first_name="Jane",
        last_name="Doe",
        date_of_birth=date(1985, 6, 15),
        gender="FEMALE",
        member_id="BCBS-11223344",
    )
    provider = Provider(
        npi="1234567890",
        name="Dr. Sarah Connor, MD",
        taxonomy_code="207Q00000X",
        tax_id="12-3456789",
        in_network=True,
    )
    payer = Payer(
        name="Blue Cross Blue Shield",
        payer_id="00123",
        timely_filing_days=90,
    )
    db_session.add_all([patient, provider, payer])
    db_session.commit()

    encounter = Encounter(
        patient_id=patient.id,
        provider_id=provider.id,
        service_date=date(2026, 8, 1),
        primary_diagnosis_code="M54.5",
    )
    db_session.add(encounter)
    db_session.commit()

    claim = Claim(
        claim_number="CLM-TEST-001",
        patient_id=patient.id,
        provider_id=provider.id,
        payer_id=payer.id,
        encounter_id=encounter.id,
        status="DRAFT",
        total_billed_amount=450.00,
        service_date=date(2026, 8, 1),
        filing_deadline=date(2026, 11, 1),
    )
    db_session.add(claim)
    db_session.commit()

    line = ClaimLine(
        claim_id=claim.id,
        line_number=1,
        cpt_code="99214",
        units=1,
        unit_price=450.00,
        total_amount=450.00,
    )
    db_session.add(line)
    db_session.commit()

    # Query back
    queried_claim = db_session.query(Claim).filter_by(claim_number="CLM-TEST-001").first()
    assert queried_claim is not None
    assert queried_claim.patient.first_name == "Jane"
    assert queried_claim.provider.name == "Dr. Sarah Connor, MD"
    assert len(queried_claim.lines) == 1
    assert queried_claim.lines[0].cpt_code == "99214"
