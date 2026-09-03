from datetime import date
import pytest

from apps.api.services.eligibility.engine import EligibilityEngine, verify_eligibility


def test_active_policy():
    patient = {"first_name": "Eleanor", "last_name": "Vance", "member_id": "BCBS-98231011"}
    payer = {"id": "pyr-001", "name": "Blue Cross Blue Shield", "payer_id": "00123"}
    plan = {"effective_date": date(2026, 1, 1), "annual_deductible": 2000.0, "deductible_met": 1500.0, "copay_specialist": 40.0}
    claim = {"id": "clm-001", "payer_id": "pyr-001", "payer_name": "Blue Cross Blue Shield", "service_date": date(2026, 8, 15)}

    res = verify_eligibility(patient, payer, plan, claim)

    assert res.is_active is True
    assert res.status == "VERIFIED"
    assert res.deductible_remaining == 500.0
    assert res.copay_amount == 40.0
    assert res.source == "simulated payer database"
    assert "member_id_format" in res.matched_fields
    assert "effective_date" in res.matched_fields


def test_expired_policy():
    patient = {"first_name": "Marcus", "last_name": "Thorne", "member_id": "UHC-44912033"}
    payer = {"id": "pyr-002", "name": "UnitedHealthcare", "payer_id": "00430"}
    plan = {"effective_date": date(2025, 1, 1), "termination_date": date(2025, 12, 31)}
    claim = {"id": "clm-002", "payer_id": "pyr-002", "payer_name": "UnitedHealthcare", "service_date": date(2026, 8, 20)}

    res = verify_eligibility(patient, payer, plan, claim)

    assert res.is_active is False
    assert res.status == "INACTIVE"
    assert "termination_date" in res.failed_fields
    assert "CO-27" in res.reason or "terminated" in res.reason


def test_future_policy():
    patient = {"first_name": "Sarah", "last_name": "Jenkins", "member_id": "MED-1EG4-TE9-MK72"}
    payer = {"id": "pyr-003", "name": "Traditional Medicare Part B", "payer_id": "00020"}
    plan = {"effective_date": date(2027, 1, 1)}
    claim = {"id": "clm-003", "payer_id": "pyr-003", "payer_name": "Traditional Medicare Part B", "service_date": date(2026, 8, 10)}

    res = verify_eligibility(patient, payer, plan, claim)

    assert res.is_active is False
    assert res.status == "INACTIVE"
    assert "effective_date" in res.failed_fields
    assert "CO-27" in res.reason or "prior to coverage effective date" in res.reason


def test_payer_mismatch():
    patient = {"first_name": "Jane", "last_name": "Doe", "member_id": "BCBS-123456789"}
    payer = {"id": "pyr-001", "name": "Blue Cross Blue Shield", "payer_id": "00123"}
    claim = {"id": "clm-mismatch", "payer_id": "pyr-002", "payer_name": "UnitedHealthcare", "service_date": date(2026, 8, 15)}

    res = verify_eligibility(patient, payer, None, claim)

    assert res.is_active is False
    assert "payer_match" in res.failed_fields
    assert "Payer mismatch" in res.reason


def test_patient_mismatch():
    engine = EligibilityEngine()
    patient = {"first_name": "", "last_name": "", "member_id": ""}
    payer = {"id": "pyr-001", "name": "Blue Cross Blue Shield"}
    claim = {"id": "clm-pt-mismatch", "service_date": date(2026, 8, 15)}

    res = engine.evaluate(patient, payer, claim_context=claim)

    assert "patient_identifiers" in res.failed_fields
    assert "Patient identifiers incomplete or mismatch" in res.reason


def test_invalid_insurance_id():
    patient = {"first_name": "Alex", "last_name": "Smith", "member_id": "INVALID_ID_123"}
    payer = {"id": "pyr-001", "name": "Blue Cross Blue Shield", "payer_id": "00123"}
    claim = {"id": "clm-inv-id", "payer_id": "pyr-001", "payer_name": "Blue Cross Blue Shield", "service_date": date(2026, 8, 15)}

    res = verify_eligibility(patient, payer, None, claim)

    assert "member_id_format" in res.failed_fields
    assert any("Invalid member ID format" in w for w in res.warnings)


def test_successful_verification_api_endpoint(client):
    response = client.post("/api/v1/claims/clm-001/eligibility")
    assert response.status_code == 200

    data = response.json()
    assert data["claim_id"] == "clm-001"
    assert data["is_active"] is True
    assert data["source"] == "simulated payer database"
    assert "deductible_remaining" in data
    assert "matched_fields" in data
    assert "failed_fields" in data
    assert "verification_timestamp" in data
