import pytest
from datetime import date
from sqlalchemy.orm import Session

from apps.api.models.entities import Patient, Provider, Payer, Encounter, Claim, Correction
from apps.api.services.quality.rules import (
    normalize_payer_name,
    validate_and_normalize_npi,
    normalize_icd10_code,
    normalize_date_string,
    normalize_zip_code,
    normalize_member_id,
    normalize_whitespace_and_case,
)
from apps.api.services.quality.engine import DataQualityEngine


def test_safe_normalization_functions():
    # Whitespace and case
    assert normalize_whitespace_and_case("  Blue   Cross  ") == "Blue Cross"
    assert normalize_whitespace_and_case(None) == ""

    # ICD-10 dot syntax normalization
    sug, conf, reason, valid = normalize_icd10_code("m545")
    assert valid is True
    assert sug == "M54.5"
    assert conf >= 0.95

    sug, conf, reason, valid = normalize_icd10_code("M25.561")
    assert valid is True
    assert sug == "M25.561"
    assert conf == 1.0

    # Invalid ICD-10 format
    sug, conf, reason, valid = normalize_icd10_code("INVALID_CODE_12345")
    assert valid is False
    assert conf == 0.0

    # NPI Luhn Checksum Validation
    valid_npi = "1982736450"
    is_valid, norm_npi, conf, reason = validate_and_normalize_npi(valid_npi)
    assert is_valid is True
    assert norm_npi == valid_npi

    invalid_npi = "1234567890"  # Fails Luhn check
    is_valid, norm_npi, conf, reason = validate_and_normalize_npi(invalid_npi)
    assert is_valid is False

    # ZIP Code normalization
    zip_norm, conf, reason, valid = normalize_zip_code("90210")
    assert valid is True
    assert zip_norm == "90210"

    zip_norm, conf, reason, valid = normalize_zip_code("902101234")
    assert valid is True
    assert zip_norm == "90210-1234"


def test_payer_alias_mapping():
    # Payer Alias: BlueShild -> Blue Cross Blue Shield
    sug, conf, reason, is_ambiguous = normalize_payer_name("BlueShild")
    assert is_ambiguous is False
    assert sug == "Blue Cross Blue Shield"
    assert conf >= 0.95

    # UHC -> UnitedHealthcare
    sug, conf, reason, is_ambiguous = normalize_payer_name("UHC")
    assert is_ambiguous is False
    assert sug == "UnitedHealthcare"
    assert conf >= 0.95

    # Atna -> Aetna
    sug, conf, reason, is_ambiguous = normalize_payer_name("Atna")
    assert is_ambiguous is False
    assert sug == "Aetna"
    assert conf >= 0.95

    # Cignaa -> Cigna
    sug, conf, reason, is_ambiguous = normalize_payer_name("Cignaa")
    assert is_ambiguous is False
    assert sug == "Cigna"
    assert conf >= 0.95


def test_invalid_date_normalization():
    # Valid date string format
    norm_date, conf, reason, valid = normalize_date_string("08/15/2026")
    assert valid is True
    assert norm_date == "2026-08-15"
    assert conf >= 0.95

    # Invalid / impossible date string (2026-02-31) must fail safely without guessing
    norm_date, conf, reason, valid = normalize_date_string("2026-02-31")
    assert valid is False
    assert conf == 0.0
    assert norm_date is None

    # Completely unparseable string
    norm_date, conf, reason, valid = normalize_date_string("not-a-date")
    assert valid is False
    assert conf == 0.0


def test_ambiguous_correction_flagged():
    # Ambiguous alias like "BC" or "HEALTH" must be flagged for human review
    sug, conf, reason, is_ambiguous = normalize_payer_name("BC")
    assert is_ambiguous is True
    assert conf < 0.95

    corrections = DataQualityEngine.validate_claim_dict({
        "payer_name": "BC",
        "provider_npi": "1982736450",
    })
    payer_corr = next((c for c in corrections if c["field_name"] == "payer_name"), None)
    assert payer_corr is not None
    assert payer_corr["status"] == "FLAGGED_FOR_HUMAN_REVIEW"


def test_failed_correction_audit_logging(db_session: Session):
    # Setup test entities with invalid NPI checksum
    patient = Patient(first_name="John", last_name="Doe", date_of_birth=date(1990, 1, 1), member_id="MEM123")
    provider = Provider(npi="1111111111", name="Invalid Provider", taxonomy_code="207Q00000X", tax_id="123456789")
    payer = Payer(name="Blue Cross Blue Shield", payer_id="00123")
    db_session.add_all([patient, provider, payer])
    db_session.commit()

    encounter = Encounter(patient_id=patient.id, provider_id=provider.id, service_date=date(2026, 8, 15), primary_diagnosis_code="M54.5")
    db_session.add(encounter)
    db_session.commit()

    claim = Claim(
        claim_number="CLM-TEST-QUALITY-01",
        patient_id=patient.id,
        provider_id=provider.id,
        payer_id=payer.id,
        encounter_id=encounter.id,
        service_date=date(2026, 8, 15),
        filing_deadline=date(2026, 11, 15),
    )
    db_session.add(claim)
    db_session.commit()

    # Validate claim
    corrections = DataQualityEngine.validate_and_record_claim(db_session, claim)
    assert len(corrections) == 1
    corr = corrections[0]
    assert corr.field_name == "provider_npi"
    assert corr.status == "FLAGGED_FOR_HUMAN_REVIEW"
    assert corr.confidence == 0.0


def test_apply_corrections_and_reverification(db_session: Session):
    # Setup test entities with typos
    patient = Patient(first_name="Jane", last_name="Smith", date_of_birth=date(1985, 5, 12), member_id="  uhc-992211  ")
    provider = Provider(npi="1982736450", name="Dr. Test", taxonomy_code="207Q00000X", tax_id="987654321")
    payer = Payer(name="BlueShild", payer_id="00124")  # Typo in payer name
    db_session.add_all([patient, provider, payer])
    db_session.commit()

    encounter = Encounter(patient_id=patient.id, provider_id=provider.id, service_date=date(2026, 8, 15), primary_diagnosis_code="M545") # Typo in diagnosis code
    db_session.add(encounter)
    db_session.commit()

    claim = Claim(
        claim_number="CLM-TEST-QUALITY-02",
        patient_id=patient.id,
        provider_id=provider.id,
        payer_id=payer.id,
        encounter_id=encounter.id,
        service_date=date(2026, 8, 15),
        filing_deadline=date(2026, 11, 15),
    )
    db_session.add(claim)
    db_session.commit()

    # Validate claim initially
    corrections = DataQualityEngine.validate_and_record_claim(db_session, claim)
    assert len(corrections) >= 2

    # Apply high confidence corrections
    applied_count, applied_records = DataQualityEngine.apply_corrections(db_session, claim)
    assert applied_count >= 2

    # Verify updated values on database entities
    assert claim.payer.name == "Blue Cross Blue Shield"
    assert claim.encounter.primary_diagnosis_code == "M54.5"
    assert claim.patient.member_id == "UHC-992211"

    # Verify re-verification cleared remaining pending corrections
    remaining = db_session.query(Correction).filter(Correction.claim_id == claim.id, Correction.status == "PENDING").all()
    assert len(remaining) == 0


def test_quality_api_endpoints(client, db_session: Session):
    # Test POST /api/v1/claims/clm-001/validate
    response = client.post("/api/v1/claims/clm-001/validate")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "corrections" in res_data

    # Test POST /api/v1/claims/clm-001/corrections/apply
    response = client.post("/api/v1/claims/clm-001/corrections/apply")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["status"] == "APPLIED"
