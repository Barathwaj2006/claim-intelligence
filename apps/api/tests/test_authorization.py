from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient

from apps.api.main import app
from apps.api.services.authorization.engine import (
    evaluate_authorization_details,
    evaluate_claim_authorization,
)
from apps.api.services.authorization.rules import cpt_requires_authorization

client = TestClient(app)


def test_authorization_not_required():
    """Test routine E&M code returns NOT_REQUIRED with no warnings or CARC code."""
    result = evaluate_authorization_details(
        claim_id="test-clm-not-req",
        payer_id="pyr-001",
        payer_name="Blue Cross Blue Shield",
        requires_auth_for_imaging=True,
        service_date=date(2026, 8, 15),
        lines=[{"cpt_code": "99213", "units": 1}],
        authorizations=[],
    )

    assert result.requires_auth is False
    assert result.auth_status == "NOT_REQUIRED"
    assert result.authorization_number is None
    assert result.authorized_cpt_codes == []
    assert result.likely_carc is None
    assert len(result.warnings) == 0


def test_medicare_imaging_authorization_not_required():
    """Test Traditional Medicare Part B does not require prior auth for MRI lumbar spine."""
    assert cpt_requires_authorization("72148", payer_id="pyr-003", payer_name="Traditional Medicare Part B") is False

    result = evaluate_authorization_details(
        claim_id="test-clm-medicare",
        payer_id="pyr-003",
        payer_name="Traditional Medicare Part B",
        requires_auth_for_imaging=False,
        service_date=date(2026, 8, 15),
        lines=[{"cpt_code": "72148", "units": 1}],
        authorizations=[],
    )

    assert result.requires_auth is False
    assert result.auth_status == "NOT_REQUIRED"


def test_authorization_required_and_valid():
    """Test advanced imaging with valid attached authorization returns APPROVED."""
    auth_record = {
        "authorization_number": "AUTH-72148-99A",
        "cpt_code": "72148",
        "status": "APPROVED",
        "approved_units": 1,
        "valid_from": date(2026, 8, 1),
        "valid_to": date(2026, 8, 30),
    }

    result = evaluate_authorization_details(
        claim_id="test-clm-valid",
        payer_id="pyr-002",
        payer_name="UnitedHealthcare",
        requires_auth_for_imaging=True,
        service_date=date(2026, 8, 20),
        lines=[{"cpt_code": "72148", "units": 1}],
        authorizations=[auth_record],
    )

    assert result.requires_auth is True
    assert result.auth_status == "APPROVED"
    assert result.authorization_number == "AUTH-72148-99A"
    assert "72148" in result.authorized_cpt_codes
    assert result.valid_through == date(2026, 8, 30)
    assert result.likely_carc is None
    assert len(result.warnings) == 0


def test_authorization_required_but_missing():
    """Test advanced imaging under commercial payer without authorization returns MISSING and CO-197."""
    result = evaluate_authorization_details(
        claim_id="test-clm-missing",
        payer_id="pyr-002",
        payer_name="UnitedHealthcare",
        requires_auth_for_imaging=True,
        service_date=date(2026, 8, 20),
        lines=[{"cpt_code": "72148", "units": 1}],
        authorizations=[],
    )

    assert result.requires_auth is True
    assert result.auth_status == "MISSING"
    assert result.likely_carc == "CO-197"
    assert len(result.warnings) > 0
    assert "Missing required prior authorization" in result.warnings[0]


def test_expired_authorization():
    """Test prior authorization with valid_to prior to service date returns EXPIRED and CO-197."""
    expired_auth = {
        "authorization_number": "AUTH-OLD-123",
        "cpt_code": "72148",
        "status": "APPROVED",
        "approved_units": 1,
        "valid_from": date(2026, 1, 1),
        "valid_to": date(2026, 6, 30),
    }

    result = evaluate_authorization_details(
        claim_id="test-clm-expired",
        payer_id="pyr-002",
        payer_name="UnitedHealthcare",
        requires_auth_for_imaging=True,
        service_date=date(2026, 8, 20),
        lines=[{"cpt_code": "72148", "units": 1}],
        authorizations=[expired_auth],
    )

    assert result.requires_auth is True
    assert result.auth_status == "EXPIRED"
    assert result.likely_carc == "CO-197"
    assert any("expired" in w.lower() for w in result.warnings)


def test_invalid_authorization_units_exceeded():
    """Test billed units exceeding approved units returns INVALID status and CO-197."""
    auth_insufficient_units = {
        "authorization_number": "AUTH-UNITS-001",
        "cpt_code": "29881",
        "status": "APPROVED",
        "approved_units": 1,
        "valid_from": date(2026, 8, 1),
        "valid_to": date(2026, 8, 30),
    }

    result = evaluate_authorization_details(
        claim_id="test-clm-units",
        payer_id="pyr-001",
        payer_name="Blue Cross Blue Shield",
        requires_auth_for_imaging=True,
        service_date=date(2026, 8, 15),
        lines=[{"cpt_code": "29881", "units": 2}],
        authorizations=[auth_insufficient_units],
    )

    assert result.requires_auth is True
    assert result.auth_status == "INVALID"
    assert result.likely_carc == "CO-197"
    assert any("exceed" in w.lower() for w in result.warnings)


def test_authorization_api_endpoint():
    """Test HTTP POST /api/v1/claims/{id}/authorization endpoint."""
    response = client.post("/api/v1/claims/clm-002/authorization")
    assert response.status_code == 200
    data = response.json()
    assert data["claim_id"] == "clm-002"
    assert data["requires_auth"] is True
    assert data["auth_status"] == "MISSING"
    assert data["likely_carc"] == "CO-197"

    response_clean = client.post("/api/v1/claims/clm-001/authorization")
    assert response_clean.status_code == 200
    data_clean = response_clean.json()
    assert data_clean["requires_auth"] is False
    assert data_clean["auth_status"] == "NOT_REQUIRED"
