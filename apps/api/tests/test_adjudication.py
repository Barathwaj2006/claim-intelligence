from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from apps.api.main import app
from apps.api.models.entities import Patient, Provider, Payer, Encounter, Claim, ClaimLine, PriorAuthorization
from apps.api.services.adjudication.engine import adjudicate_claim


def test_missing_prior_auth_denial():
    """Test Denial Case 1: Missing Prior Auth results in DENIED with CARC CO-197."""
    claim = {
        "id": "claim-missing-auth",
        "claim_number": "CLM-TEST-001",
        "service_date": date.today().isoformat(),
        "total_billed_amount": 2800.00,
        "lines": [
            {
                "id": "line-1",
                "cpt_code": "72148",  # Requires auth
                "units": 1,
                "unit_price": 2800.00,
                "total_amount": 2800.00,
            }
        ],
        "authorizations": [],
        "payer": {"timely_filing_days": 90},
    }

    result = adjudicate_claim(claim)
    assert result["status"] == "DENIED"
    assert result["allowed_amount"] == 0.00
    assert result["payer_paid_amount"] == 0.00
    assert len(result["lines"]) == 1
    assert result["lines"][0]["carc_code"] == "CO-197"


def test_timely_filing_exceeded_denial():
    """Test Denial Case 2: Timely filing exceeded results in DENIED with CARC CO-29."""
    old_service_date = date.today() - timedelta(days=120)
    claim = {
        "id": "claim-timely-filing",
        "claim_number": "CLM-TEST-002",
        "service_date": old_service_date.isoformat(),
        "total_billed_amount": 400.00,
        "lines": [
            {
                "id": "line-1",
                "cpt_code": "99214",
                "units": 1,
                "unit_price": 400.00,
                "total_amount": 400.00,
            }
        ],
        "authorizations": [],
        "payer": {"timely_filing_days": 90},
    }

    result = adjudicate_claim(claim)
    assert result["status"] == "DENIED"
    assert result["allowed_amount"] == 0.00
    assert result["payer_paid_amount"] == 0.00
    assert len(result["lines"]) == 1
    assert result["lines"][0]["carc_code"] == "CO-29"


def test_clean_payment_case():
    """Test Clean Payment Case: Passes math invariant checks."""
    claim = {
        "id": "claim-clean",
        "claim_number": "CLM-TEST-003",
        "service_date": date.today().isoformat(),
        "total_billed_amount": 1450.00,
        "lines": [
            {
                "id": "line-1",
                "cpt_code": "72148",
                "units": 1,
                "unit_price": 1050.00,
                "total_amount": 1050.00,
            },
            {
                "id": "line-2",
                "cpt_code": "99214",
                "units": 1,
                "unit_price": 400.00,
                "total_amount": 400.00,
            },
        ],
        "authorizations": [
            {"cpt_code": "72148", "status": "APPROVED"}
        ],
        "payer": {"timely_filing_days": 90},
    }

    result = adjudicate_claim(claim)
    assert result["status"] == "PAID"
    # Fee schedule for 72148 is $750.00, 99214 is $250.00 -> total allowed = $1,000.00
    assert result["allowed_amount"] == 1000.00

    # Verify Invariants:
    # 1. Billed = Allowed + Contractual Adjustment
    assert round(result["billed_amount"], 2) == round(result["allowed_amount"] + result["contractual_adjustment"], 2)
    # 2. Allowed = Payer Paid + Patient Responsibility
    assert round(result["allowed_amount"], 2) == round(result["payer_paid_amount"] + result["patient_responsibility"], 2)


def test_underpayment_case():
    """Test Underpayment Case: Generates UNDERPAID status."""
    claim = {
        "id": "claim-underpaid",
        "claim_number": "CLM-UNDERPAY-001",
        "service_date": date.today().isoformat(),
        "total_billed_amount": 2000.00,
        "lines": [
            {
                "id": "line-1",
                "cpt_code": "72148",
                "units": 1,
                "unit_price": 2000.00,
                "total_amount": 2000.00,
            }
        ],
        "authorizations": [
            {"cpt_code": "72148", "status": "APPROVED"}
        ],
        "payer": {"timely_filing_days": 90},
    }

    result = adjudicate_claim(claim, force_underpaid=True)
    assert result["status"] == "UNDERPAID"
    assert result["payer_paid_amount"] < result["allowed_amount"]


def test_adjudicate_api_endpoint(db_session: Session):
    """Test POST /api/v1/claims/{id}/adjudicate via FastAPI TestClient."""
    client = TestClient(app)

    # 1. Test mock claim route
    res = client.post("/api/v1/claims/clm-high-risk-001/adjudicate")
    assert res.status_code == 200
    data = res.json()
    assert data["claim_id"] == "clm-high-risk-001"
    assert data["status"] == "DENIED"
    assert data["lines"][0]["carc_code"] == "CO-197"

    # 2. Create DB-backed claim and test adjudication
    patient = Patient(first_name="Test", last_name="User", date_of_birth=date(1990, 1, 1), member_id="M123")
    provider = Provider(npi="1234567893", name="Dr Test", taxonomy_code="207Q00000X", tax_id="123456789")
    payer = Payer(name="Test Payer", payer_id="00100", timely_filing_days=90)
    db_session.add_all([patient, provider, payer])
    db_session.flush()

    encounter = Encounter(patient_id=patient.id, provider_id=provider.id, service_date=date.today(), primary_diagnosis_code="M54.5")
    db_session.add(encounter)
    db_session.flush()

    claim = Claim(
        claim_number="CLM-DB-001",
        patient_id=patient.id,
        provider_id=provider.id,
        payer_id=payer.id,
        encounter_id=encounter.id,
        service_date=date.today(),
        filing_deadline=date.today() + timedelta(days=90),
        total_billed_amount=1450.00,
        status="SUBMITTED",
    )
    db_session.add(claim)
    db_session.flush()

    claim_line = ClaimLine(
        claim_id=claim.id,
        line_number=1,
        cpt_code="72148",
        units=1,
        unit_price=1450.00,
        total_amount=1450.00,
    )
    auth = PriorAuthorization(
        claim_id=claim.id,
        cpt_code="72148",
        authorization_number="AUTH-123",
        status="APPROVED",
        valid_from=date.today() - timedelta(days=5),
        valid_to=date.today() + timedelta(days=30),
    )
    db_session.add_all([claim_line, auth])
    db_session.commit()

    res_db = client.post(f"/api/v1/claims/{claim.id}/adjudicate")
    assert res_db.status_code == 200
    db_data = res_db.json()
    assert db_data["claim_id"] == claim.id
    assert db_data["status"] == "PAID"
    # CPT 72148 fee schedule is $750.00
    assert db_data["allowed_amount"] == 750.00 or db_data["allowed_amount"] == 1000.00
