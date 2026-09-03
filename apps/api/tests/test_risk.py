from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient

from apps.api.main import app
from apps.api.services.risk.scorer import calculate_claim_risk_score, RiskScorer, categorize_risk_level

client = TestClient(app)


def test_pristine_clean_claim_low_risk():
    """Pristine clean claim should yield score < 30 (LOW tier)."""
    claim = {
        "id": "clm-pristine-001",
        "service_date": date.today().isoformat(),
        "filing_deadline": (date.today() + timedelta(days=90)).isoformat(),
        "status": "DRAFT",
        "lines": [{"cpt_code": "99214"}],
        "requires_auth": False,
        "is_active_eligibility": True,
        "medical_necessity_met": True,
        "has_quality_issues": False,
        "in_network": True,
    }

    result = calculate_claim_risk_score(claim)

    assert result.overall_score < 30
    assert result.risk_level == "LOW"
    assert len(result.factors) == 0
    assert result.subscores.authorization == 0
    assert result.subscores.eligibility == 0
    assert result.subscores.coverage == 0
    assert result.subscores.data_quality == 0
    assert result.subscores.timely_filing == 0
    assert result.subscores.provider_network == 0


def test_missing_prior_auth_mri_high_or_critical_risk():
    """Claim missing prior authorization for MRI should yield high/critical risk score (>= 70)."""
    claim = {
        "id": "clm-mri-002",
        "service_date": date.today().isoformat(),
        "filing_deadline": (date.today() + timedelta(days=90)).isoformat(),
        "status": "DRAFT",
        "lines": [{"cpt_code": "72148"}],  # Lumbar Spine MRI
        "requires_auth": True,
        "auth_status": "MISSING",
        "is_active_eligibility": False,  # Also inactive eligibility
        "medical_necessity_met": False,
        "has_quality_issues": True,
        "in_network": False,
    }

    result = calculate_claim_risk_score(claim)

    # 100*0.25 (auth) + 100*0.25 (elig) + 100*0.20 (cov) + 70*0.10 (qual) + 0*0.10 (filing) + 60*0.10 (net) = 83
    assert result.overall_score >= 70
    assert result.risk_level in ("HIGH", "CRITICAL")
    assert result.subscores.authorization == 100
    assert result.subscores.eligibility == 100
    assert result.subscores.coverage == 100
    assert result.subscores.data_quality == 70
    assert result.subscores.provider_network == 60

    # Ensure contributing factors are populated with expected fields
    auth_factors = [f for f in result.factors if f.category == "AUTHORIZATION"]
    assert len(auth_factors) == 1
    assert auth_factors[0].likely_carc_code == "CO-197"
    assert auth_factors[0].impact_points == 25


def test_risk_level_tier_classification():
    """Test risk tier classification for LOW, MEDIUM, HIGH, and CRITICAL levels."""
    assert categorize_risk_level(15) == "LOW"
    assert categorize_risk_level(29) == "LOW"
    assert categorize_risk_level(30) == "MEDIUM"
    assert categorize_risk_level(69) == "MEDIUM"
    assert categorize_risk_level(70) == "HIGH"
    assert categorize_risk_level(84) == "HIGH"
    assert categorize_risk_level(85) == "CRITICAL"
    assert categorize_risk_level(100) == "CRITICAL"


def test_configurable_weights_and_thresholds():
    """Tests custom weights and custom thresholds configuration."""
    claim = {
        "id": "clm-custom-001",
        "service_date": date.today().isoformat(),
        "filing_deadline": (date.today() + timedelta(days=90)).isoformat(),
        "requires_auth": True,
        "auth_status": "MISSING",  # Auth subscore = 100
        "is_active_eligibility": True,
        "medical_necessity_met": True,
        "has_quality_issues": False,
        "in_network": True,
    }

    # Custom weight: prior auth = 50%
    custom_weights = {"prior_auth": 0.50, "eligibility": 0.50}
    result = calculate_claim_risk_score(claim, weights=custom_weights)

    # 100 * 0.50 = 50 overall score
    assert result.overall_score == 50
    assert result.risk_level == "MEDIUM"


def test_timely_filing_horizon_boundaries():
    """Tests timely filing horizon subscore boundaries."""
    today = date.today()

    base_claim = {
        "id": "clm-filing",
        "service_date": today.isoformat(),
        "requires_auth": False,
        "is_active_eligibility": True,
        "medical_necessity_met": True,
        "has_quality_issues": False,
        "in_network": True,
    }

    # > 30 days remaining -> subscore = 0
    claim_60 = {**base_claim, "filing_deadline": (today + timedelta(days=60)).isoformat()}
    res_60 = calculate_claim_risk_score(claim_60)
    assert res_60.subscores.timely_filing == 0

    # 15 - 30 days remaining -> subscore = 40
    claim_20 = {**base_claim, "filing_deadline": (today + timedelta(days=20)).isoformat()}
    res_20 = calculate_claim_risk_score(claim_20)
    assert res_20.subscores.timely_filing == 40

    # 7 - 14 days remaining -> subscore = 60
    claim_10 = {**base_claim, "filing_deadline": (today + timedelta(days=10)).isoformat()}
    res_10 = calculate_claim_risk_score(claim_10)
    assert res_10.subscores.timely_filing == 60

    # < 7 days remaining -> subscore = 90
    claim_5 = {**base_claim, "filing_deadline": (today + timedelta(days=5)).isoformat()}
    res_5 = calculate_claim_risk_score(claim_5)
    assert res_5.subscores.timely_filing == 90

    # Past deadline -> subscore = 100
    claim_past = {**base_claim, "filing_deadline": (today - timedelta(days=5)).isoformat()}
    res_past = calculate_claim_risk_score(claim_past)
    assert res_past.subscores.timely_filing == 100


def test_mathematical_range_invariants_and_determinism():
    """Ensures composite score is strictly within 0..100 and completely deterministic."""
    claim = {
        "id": "clm-det-001",
        "service_date": date.today().isoformat(),
        "filing_deadline": (date.today() - timedelta(days=10)).isoformat(),  # past deadline
        "lines": [{"cpt_code": "72148"}],
        "requires_auth": True,
        "auth_status": "MISSING",
        "is_active_eligibility": False,
        "medical_necessity_met": False,
        "has_quality_issues": True,
        "in_network": False,
    }

    res1 = calculate_claim_risk_score(claim)
    res2 = calculate_claim_risk_score(claim)

    # Invariant
    assert 0 <= res1.overall_score <= 100

    # Determinism
    assert res1.overall_score == res2.overall_score
    assert res1.risk_level == res2.risk_level
    assert res1.subscores == res2.subscores
    assert len(res1.factors) == len(res2.factors)
    for f1, f2 in zip(res1.factors, res2.factors):
        assert f1.category == f2.category
        assert f1.impact_points == f2.impact_points
        assert f1.likely_carc_code == f2.likely_carc_code


def test_risk_score_api_endpoint(client):
    """Test POST /api/v1/claims/{id}/risk-score API endpoint."""
    response = client.post("/api/v1/claims/clm-test-api/risk-score")
    assert response.status_code == 200
    data = response.json()

    assert data["claim_id"] == "clm-test-api"
    assert "overall_score" in data
    assert "risk_level" in data
    assert "subscores" in data
    assert "factors" in data
    assert 0 <= data["overall_score"] <= 100
