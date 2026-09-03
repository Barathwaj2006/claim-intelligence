from datetime import date
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.services.coverage import CoverageEngine, evaluate_coverage
from apps.api.schemas.canonical import CoverageVerificationRequest

client = TestClient(app)


def test_covered_service_engine():
    """Test standard covered service returns covered status."""
    res = CoverageEngine.evaluate(
        cpt_code="99213",
        diagnosis_code="Z00.00",
        is_active=True,
    )
    assert res.coverage_status == "covered"
    assert res.medical_necessity_met is True
    assert res.frequency_limits_exceeded is False
    assert res.rule == "RULE-COVERED-STANDARD"


def test_excluded_service_engine():
    """Test explicitly excluded service returns not_covered status."""
    res = CoverageEngine.evaluate(
        cpt_code="15780",
        diagnosis_code="L70.0",
        is_active=True,
    )
    assert res.coverage_status == "not_covered"
    assert res.rule == "RULE-EXCL-POLICY"
    assert "excluded" in res.reason.lower()


def test_conditional_service_engine():
    """Test procedure requiring prior auth or subject to guidelines returns conditional status."""
    res = CoverageEngine.evaluate(
        cpt_code="72148",
        diagnosis_code="M54.5",
        is_active=True,
        has_prior_auth=False,
    )
    assert res.coverage_status == "conditional"
    assert res.rule == "RULE-COND-AUTH-REQUIRED"
    assert res.medical_necessity_met is True


def test_expired_coverage_engine():
    """Test inactive or expired plan returns not_covered status."""
    res = CoverageEngine.evaluate(
        cpt_code="99214",
        diagnosis_code="M54.5",
        is_active=False,
    )
    assert res.coverage_status == "not_covered"
    assert res.rule == "RULE-ELIG-EXPIRED"

    res_effective = CoverageEngine.evaluate(
        cpt_code="99214",
        diagnosis_code="M54.5",
        service_date=date(2026, 8, 15),
        effective_date=date(2026, 9, 1),
    )
    assert res_effective.coverage_status == "not_covered"
    assert res_effective.rule == "RULE-ELIG-EXPIRED"


def test_unknown_service_engine():
    """Test unknown or unmapped CPT code returns not_covered status."""
    res = CoverageEngine.evaluate(
        cpt_code="99999",
        diagnosis_code="Z00.00",
        is_active=True,
    )
    assert res.coverage_status == "not_covered"
    assert res.rule == "RULE-CPT-UNKNOWN"
    assert res.medical_necessity_met is False


def test_gender_restriction_demographic():
    """Test demographic gender restriction mismatch."""
    res = CoverageEngine.evaluate(
        cpt_code="59400",
        diagnosis_code="Z34.00",
        patient_gender="MALE",
        is_active=True,
    )
    assert res.coverage_status == "not_covered"
    assert res.rule == "RULE-DEMO-GENDER"


def test_frequency_limit_exceeded():
    """Test frequency limit cap exceeded."""
    res = CoverageEngine.evaluate(
        cpt_code="99395",
        diagnosis_code="Z00.00",
        prior_occurrences_count=1,
        is_active=True,
    )
    assert res.coverage_status == "conditional"
    assert res.frequency_limits_exceeded is True
    assert res.rule == "RULE-FREQ-LIMIT"


def test_medical_necessity_mismatch():
    """Test incompatible ICD-10 and CPT combination."""
    res = CoverageEngine.evaluate(
        cpt_code="72148",
        diagnosis_code="J02.9",  # Acute pharyngitis
        is_active=True,
    )
    assert res.coverage_status == "not_covered"
    assert res.medical_necessity_met is False
    assert res.rule == "RULE-MED-NECESSITY-FAIL"


def test_api_verify_claim_coverage_endpoint():
    """Test POST /api/v1/claims/{id}/coverage API router endpoint."""
    response = client.post("/api/v1/claims/clm-001/coverage")
    assert response.status_code == 200
    data = response.json()
    assert data["claim_id"] == "clm-001"
    assert data["coverage_status"] == "covered"

    response_002 = client.post("/api/v1/claims/clm-002/coverage")
    assert response_002.status_code == 200
    data_002 = response_002.json()
    assert data_002["claim_id"] == "clm-002"
    assert data_002["coverage_status"] == "conditional"


def test_api_verify_coverage_direct_endpoint():
    """Test POST /api/v1/coverage/verify API router endpoint."""
    payload = {
        "cpt_code": "99213",
        "diagnosis_code": "Z00.00",
        "is_active": True,
    }
    response = client.post("/api/v1/coverage/verify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["coverage_status"] == "covered"
    assert data["rule"] == "RULE-COVERED-STANDARD"
