import uuid
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple, Union
from sqlalchemy.orm import Session

from apps.api.models.entities import (
    Claim,
    RiskScore as RiskScoreEntity,
    RiskFactor as RiskFactorEntity,
)
from apps.api.schemas.canonical import (
    RiskScoreSchema,
    RiskSubscoresSchema,
    RiskFactorSchema,
)

# Default Subscore Weights (sum to 1.0)
DEFAULT_WEIGHTS = {
    "prior_auth": 0.25,
    "eligibility": 0.25,
    "coverage": 0.20,
    "data_quality": 0.10,
    "timely_filing": 0.10,
    "network_status": 0.10,
}

# Default Risk Tier Thresholds
# LOW: 0 - 29
# MEDIUM: 30 - 69
# HIGH: 70 - 84
# CRITICAL: 85 - 100
DEFAULT_THRESHOLDS = {
    "low_max": 29,
    "medium_max": 69,
    "high_max": 84,
}


def categorize_risk_level(score: int, thresholds: Optional[Dict[str, int]] = None) -> str:
    """
    Classifies composite 0-100 risk score into deterministic risk tier.
    Tiers: LOW (0-29), MEDIUM (30-69), HIGH (70-84), CRITICAL (85-100).
    Note: Both HIGH and CRITICAL tier checks satisfy requirements (score >= 70 is HIGH/CRITICAL).
    """
    t = thresholds or DEFAULT_THRESHOLDS
    low_max = t.get("low_max", 29)
    medium_max = t.get("medium_max", 69)
    high_max = t.get("high_max", 84)

    if score <= low_max:
        return "LOW"
    elif score <= medium_max:
        return "MEDIUM"
    elif score <= high_max:
        return "HIGH"
    else:
        return "CRITICAL"


class RiskScorer:
    """
    Deterministic & Configurable Denial Risk Scoring Engine.
    Evaluates claims across 6 explicit dimensions:
    - Prior Authorization (25% default weight)
    - Eligibility & Coverage (25% default weight)
    - Medical Necessity / Coverage (20% default weight)
    - Data Quality (10% default weight)
    - Timely Filing Horizon (10% default weight)
    - Provider Network Status (10% default weight)
    """

    def __init__(
        self,
        claim: Union[Claim, Dict[str, Any], Any],
        weights: Optional[Dict[str, float]] = None,
        thresholds: Optional[Dict[str, int]] = None,
    ):
        self.claim = claim
        self.weights = {**DEFAULT_WEIGHTS, **(weights or {})}
        self.thresholds = {**DEFAULT_THRESHOLDS, **(thresholds or {})}
        self._extract_fields()

    def _extract_fields(self):
        """Extracts claim attributes safely regardless of input type (ORM entity, dict, Pydantic model)."""
        if isinstance(self.claim, dict):
            get_val = lambda k, default=None: self.claim.get(k, default)
        else:
            get_val = lambda k, default=None: getattr(self.claim, k, default)

        self.claim_id = get_val("id", str(uuid.uuid4()))
        self.service_date = get_val("service_date")
        self.filing_deadline = get_val("filing_deadline")
        self.status = get_val("status", "DRAFT")

        # Nested/related objects or fields
        self.authorizations = get_val("authorizations", [])
        self.eligibility_checks = get_val("eligibility_checks", [])
        self.corrections = get_val("corrections", [])
        self.lines = get_val("lines", [])
        self.provider = get_val("provider")
        self.patient = get_val("patient")
        self.payer = get_val("payer")

        # Scalar attribute fallbacks
        self.is_active_eligibility = get_val("is_active_eligibility")
        self.requires_auth = get_val("requires_auth")
        self.auth_status = get_val("auth_status")
        self.medical_necessity_met = get_val("medical_necessity_met")
        self.has_quality_issues = get_val("has_quality_issues")
        self.in_network = get_val("in_network")

    def evaluate_prior_auth(self) -> Tuple[int, List[RiskFactorSchema]]:
        """
        Prior Authorization (Weight: 25%)
        - Missing required auth = 100 subscore (+25 composite impact)
        - Expired auth / invalid dates = 80 subscore (+20 composite impact)
        - Valid auth / Not required = 0 subscore
        """
        factors = []
        cpt_codes = []

        if isinstance(self.lines, list):
            for line in self.lines:
                cpt = line.get("cpt_code") if isinstance(line, dict) else getattr(line, "cpt_code", None)
                if cpt:
                    cpt_codes.append(cpt)

        # Advanced imaging CPTs commonly requiring auth
        advanced_imaging = {"72148", "70551", "71250", "74177", "78815"}
        has_advanced_imaging = any(cpt in advanced_imaging for cpt in cpt_codes)

        # Check explicit prior auth records if present
        auth_found = False
        auth_expired = False

        if self.authorizations:
            auth_found = True
            for auth in self.authorizations:
                status = auth.get("status") if isinstance(auth, dict) else getattr(auth, "status", None)
                valid_to = auth.get("valid_to") if isinstance(auth, dict) else getattr(auth, "valid_to", None)
                if status == "EXPIRED" or (valid_to and isinstance(valid_to, date) and valid_to < date.today()):
                    auth_expired = True

        if self.auth_status == "EXPIRED":
            auth_expired = True
        elif self.auth_status == "MISSING":
            auth_found = False

        # Determine subscore
        if self.requires_auth is False:
            return 0, []

        if auth_expired:
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="AUTHORIZATION",
                    impact_points=round(80 * self.weights["prior_auth"]),
                    title="Expired Prior Authorization",
                    description="Prior authorization record is expired for the requested service date.",
                    likely_carc_code="CO-197",
                    recommended_fix="Obtain an updated or retroactive prior authorization approval from the payer.",
                )
            )
            return 80, factors

        if not auth_found and (has_advanced_imaging or self.requires_auth is True or self.auth_status == "MISSING"):
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="AUTHORIZATION",
                    impact_points=round(100 * self.weights["prior_auth"]),
                    title="Missing Required Prior Authorization",
                    description="Payer policy requires prior authorization for procedure(s). No valid authorization found.",
                    likely_carc_code="CO-197",
                    recommended_fix="Obtain prior authorization or attach valid authorization number prior to claim submission.",
                )
            )
            return 100, factors

        return 0, factors

    def evaluate_eligibility(self) -> Tuple[int, List[RiskFactorSchema]]:
        """
        Eligibility & Coverage (Weight: 25%)
        - Terminated or inactive member = 100 subscore (+25 composite impact)
        - Active member coverage = 0 subscore
        """
        factors = []
        is_active = self.is_active_eligibility

        if is_active is None and self.eligibility_checks:
            check = self.eligibility_checks[0]
            is_active = check.get("is_active") if isinstance(check, dict) else getattr(check, "is_active", True)

        if is_active is False:
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="ELIGIBILITY",
                    impact_points=round(100 * self.weights["eligibility"]),
                    title="Inactive Patient Eligibility",
                    description="Patient member coverage was terminated or inactive on the date of service.",
                    likely_carc_code="CO-27",
                    recommended_fix="Verify patient primary coverage effective dates with payer or collect active insurance info.",
                )
            )
            return 100, factors

        return 0, factors

    def evaluate_coverage(self) -> Tuple[int, List[RiskFactorSchema]]:
        """
        Medical Necessity / Coverage Crosswalk (Weight: 20%)
        - Incompatible CPT / ICD-10 crosswalk or frequency limit exceeded = 100 subscore (+20 composite impact)
        - Valid medical necessity = 0 subscore
        """
        factors = []
        necessity_met = self.medical_necessity_met

        if necessity_met is False:
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="COVERAGE",
                    impact_points=round(100 * self.weights["coverage"]),
                    title="Medical Necessity / Coverage Policy Mismatch",
                    description="Diagnosis code does not satisfy payer local coverage determination (LCD) policy for billed procedure.",
                    likely_carc_code="CO-50",
                    recommended_fix="Ensure primary diagnosis code meets payer medical necessity requirements for the procedure.",
                )
            )
            return 100, factors

        return 0, factors

    def evaluate_data_quality(self) -> Tuple[int, List[RiskFactorSchema]]:
        """
        Data Quality & Format (Weight: 10%)
        - Uncorrected NPI / typo / format issues present = 70 subscore (+7 composite impact)
        - Clean data quality = 0 subscore
        """
        factors = []
        has_issues = self.has_quality_issues

        if has_issues is None and self.corrections:
            pending_corrs = [
                c for c in self.corrections
                if (c.get("status") if isinstance(c, dict) else getattr(c, "status", None)) == "PENDING"
            ]
            has_issues = len(pending_corrs) > 0

        if has_issues:
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="DATA_QUALITY",
                    impact_points=round(70 * self.weights["data_quality"]),
                    title="Data Quality / Formatting Issues Detected",
                    description="Claim contains data quality anomalies (e.g., NPI format, payer typo, or missing required fields).",
                    likely_carc_code="CO-16",
                    recommended_fix="Review and apply pending automated data quality corrections before submitting.",
                )
            )
            return 70, factors

        return 0, factors

    def evaluate_timely_filing(self) -> Tuple[int, List[RiskFactorSchema]]:
        """
        Timely Filing Horizon (Weight: 10%)
        - Past deadline: 100 subscore (+10 impact)
        - < 7 days remaining: 90 subscore (+9 impact)
        - 7 - 14 days remaining: 60 subscore (+6 impact)
        - 15 - 30 days remaining: 40 subscore (+4 impact)
        - > 30 days remaining: 0 subscore (0 impact)
        """
        factors = []

        if not self.filing_deadline:
            return 0, factors

        deadline = self.filing_deadline
        if isinstance(deadline, str):
            deadline = date.fromisoformat(deadline)

        ref_date = self.service_date
        if isinstance(ref_date, str):
            ref_date = date.fromisoformat(ref_date)
        if not ref_date or not isinstance(ref_date, date):
            ref_date = date.today()

        days_remaining = (deadline - ref_date).days

        w = self.weights["timely_filing"]

        if days_remaining < 0:
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="TIMELY_FILING",
                    impact_points=round(100 * w),
                    title="Past Timely Filing Deadline",
                    description=f"Claim is past the payer's timely filing deadline ({days_remaining} days remaining).",
                    likely_carc_code="CO-29",
                    recommended_fix="Attach proof of timely filing or initiate appeal with proof of timely submission.",
                )
            )
            return 100, factors
        elif days_remaining < 7:
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="TIMELY_FILING",
                    impact_points=round(90 * w),
                    title="Critical Timely Filing Horizon (< 7 Days)",
                    description=f"Claim has only {days_remaining} days remaining before timely filing expiration.",
                    likely_carc_code="CO-29",
                    recommended_fix="Expedite claim review and submission immediately to prevent timely filing denial.",
                )
            )
            return 90, factors
        elif days_remaining <= 14:
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="TIMELY_FILING",
                    impact_points=round(60 * w),
                    title="Urgent Timely Filing Horizon (7 - 14 Days)",
                    description=f"Claim has {days_remaining} days remaining before timely filing deadline.",
                    likely_carc_code="CO-29",
                    recommended_fix="Prioritize claim for submission within the current billing cycle.",
                )
            )
            return 60, factors
        elif days_remaining <= 30:
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="TIMELY_FILING",
                    impact_points=round(40 * w),
                    title="Approaching Timely Filing Horizon (15 - 30 Days)",
                    description=f"Claim has {days_remaining} days remaining before timely filing deadline.",
                    likely_carc_code="CO-29",
                    recommended_fix="Monitor claim timeline to ensure timely processing.",
                )
            )
            return 40, factors

        return 0, factors

    def evaluate_network_status(self) -> Tuple[int, List[RiskFactorSchema]]:
        """
        Provider Network Status (Weight: 10%)
        - Out of network without pre-approval: 60 subscore (+6 composite impact)
        - In network: 0 subscore
        """
        factors = []
        in_network = self.in_network

        if in_network is None and self.provider:
            in_network = getattr(self.provider, "in_network", True)

        if in_network is False:
            factors.append(
                RiskFactorSchema(
                    id=str(uuid.uuid4()),
                    category="NETWORK_STATUS",
                    impact_points=round(60 * self.weights["network_status"]),
                    title="Out-of-Network Provider",
                    description="Rendering provider is out-of-network for patient plan without documented out-of-network referral.",
                    likely_carc_code="CO-242",
                    recommended_fix="Verify out-of-network benefits or secure network exception authorization.",
                )
            )
            return 60, factors

        return 0, factors

    def calculate(self, db: Optional[Session] = None) -> RiskScoreSchema:
        """Computes multi-dimensional risk score and returns canonical schema."""
        auth_subscore, auth_factors = self.evaluate_prior_auth()
        eligibility_subscore, eligibility_factors = self.evaluate_eligibility()
        coverage_subscore, coverage_factors = self.evaluate_coverage()
        quality_subscore, quality_factors = self.evaluate_data_quality()
        filing_subscore, filing_factors = self.evaluate_timely_filing()
        network_subscore, network_factors = self.evaluate_network_status()

        # Composite weighted formula using configured weights
        composite = (
            (auth_subscore * self.weights["prior_auth"])
            + (eligibility_subscore * self.weights["eligibility"])
            + (coverage_subscore * self.weights["coverage"])
            + (quality_subscore * self.weights["data_quality"])
            + (filing_subscore * self.weights["timely_filing"])
            + (network_subscore * self.weights["network_status"])
        )

        overall_score = min(100, max(0, round(composite)))
        risk_level = categorize_risk_level(overall_score, thresholds=self.thresholds)

        all_factors = (
            auth_factors
            + eligibility_factors
            + coverage_factors
            + quality_factors
            + filing_factors
            + network_factors
        )

        subscores_schema = RiskSubscoresSchema(
            eligibility=eligibility_subscore,
            authorization=auth_subscore,
            coverage=coverage_subscore,
            data_quality=quality_subscore,
            timely_filing=filing_subscore,
            provider_network=network_subscore,
        )

        calculated_at = datetime.utcnow()

        result = RiskScoreSchema(
            claim_id=self.claim_id,
            overall_score=overall_score,
            risk_level=risk_level,
            subscores=subscores_schema,
            factors=all_factors,
            calculated_at=calculated_at,
        )

        # Persist entity in DB if session is available
        if db is not None:
            db_score = (
                db.query(RiskScoreEntity)
                .filter(RiskScoreEntity.claim_id == self.claim_id)
                .first()
            )
            if not db_score:
                db_score = RiskScoreEntity(
                    id=str(uuid.uuid4()),
                    claim_id=self.claim_id,
                    overall_score=overall_score,
                    risk_level=risk_level,
                    eligibility_subscore=eligibility_subscore,
                    authorization_subscore=auth_subscore,
                    coverage_subscore=coverage_subscore,
                    quality_subscore=quality_subscore,
                    calculated_at=calculated_at,
                )
                db.add(db_score)
            else:
                db_score.overall_score = overall_score
                db_score.risk_level = risk_level
                db_score.eligibility_subscore = eligibility_subscore
                db_score.authorization_subscore = auth_subscore
                db_score.coverage_subscore = coverage_subscore
                db_score.quality_subscore = quality_subscore
                db_score.calculated_at = calculated_at

            db.commit()
            db.refresh(db_score)

        return result


def calculate_claim_risk_score(
    claim: Union[Claim, Dict[str, Any], Any],
    weights: Optional[Dict[str, float]] = None,
    thresholds: Optional[Dict[str, int]] = None,
    db: Optional[Session] = None,
) -> RiskScoreSchema:
    """Convenience function to calculate denial risk score for a claim."""
    scorer = RiskScorer(claim, weights=weights, thresholds=thresholds)
    return scorer.calculate(db=db)
