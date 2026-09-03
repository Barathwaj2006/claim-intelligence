"""
Deterministic Service Coverage Verification Engine.
Evaluates payer/plan configuration, procedure code, exclusions, effective dates,
demographic restrictions, frequency caps, and medical necessity rules.
"""

from datetime import datetime, date, timezone
from typing import Dict, Any, Optional
from apps.api.schemas.canonical import CoverageResultSchema, CoverageVerificationRequest
from apps.api.services.coverage.rules import (
    SYNTHETIC_CPT_CATALOG,
    SYNTHETIC_EXCLUSIONS,
    check_medical_necessity,
)


class CoverageEngine:
    """
    Deterministic rule engine for evaluating service coverage under synthetic payer/plan guidelines.
    """

    @staticmethod
    def evaluate(
        cpt_code: str,
        diagnosis_code: Optional[str] = None,
        service_date: Optional[date] = None,
        effective_date: Optional[date] = None,
        termination_date: Optional[date] = None,
        is_active: bool = True,
        patient_gender: Optional[str] = None,
        patient_dob: Optional[date] = None,
        payer_id: Optional[str] = None,
        payer_name: Optional[str] = None,
        plan_id: Optional[str] = None,
        plan_type: Optional[str] = "PPO",
        prior_occurrences_count: int = 0,
        has_prior_auth: bool = False,
        auth_status: Optional[str] = None,
        claim_id: Optional[str] = None,
    ) -> CoverageResultSchema:
        now = datetime.now(timezone.utc)
        s_date = service_date or date.today()

        evidence: Dict[str, Any] = {
            "cpt_code": cpt_code,
            "diagnosis_code": diagnosis_code,
            "service_date": s_date.isoformat(),
            "payer_id": payer_id,
            "payer_name": payer_name,
            "plan_type": plan_type,
            "patient_gender": patient_gender,
            "is_active": is_active,
        }

        # 1. Unknown Service Check
        if cpt_code not in SYNTHETIC_CPT_CATALOG and not (cpt_code in SYNTHETIC_EXCLUSIONS):
            # If CPT is unknown / invalid format
            if len(cpt_code) != 5 or not cpt_code.isalnum() or cpt_code == "99999":
                return CoverageResultSchema(
                    claim_id=claim_id,
                    coverage_status="not_covered",
                    reason=f"Unknown or unmapped procedure code: {cpt_code}.",
                    rule="RULE-CPT-UNKNOWN",
                    evidence=evidence,
                    verification_timestamp=now,
                    medical_necessity_met=False,
                    frequency_limits_exceeded=False,
                    policy_notes="Procedure code not found in synthetic payer master fee schedule.",
                )

        catalog_entry = SYNTHETIC_CPT_CATALOG.get(cpt_code, {})

        # 2. Expired / Inactive Coverage Check
        if not is_active:
            return CoverageResultSchema(
                claim_id=claim_id,
                coverage_status="not_covered",
                reason=f"Coverage was expired or inactive on the service date ({s_date.isoformat()}).",
                rule="RULE-ELIG-EXPIRED",
                evidence=evidence,
                verification_timestamp=now,
                medical_necessity_met=True,
                frequency_limits_exceeded=False,
                policy_notes="Patient policy was terminated or inactive on service date.",
            )

        if effective_date and s_date < effective_date:
            return CoverageResultSchema(
                claim_id=claim_id,
                coverage_status="not_covered",
                reason=f"Service date {s_date.isoformat()} precedes plan effective date {effective_date.isoformat()}.",
                rule="RULE-ELIG-EXPIRED",
                evidence={**evidence, "effective_date": effective_date.isoformat()},
                verification_timestamp=now,
                medical_necessity_met=True,
                frequency_limits_exceeded=False,
                policy_notes="Coverage effective date criteria not met.",
            )

        if termination_date and s_date > termination_date:
            return CoverageResultSchema(
                claim_id=claim_id,
                coverage_status="not_covered",
                reason=f"Service date {s_date.isoformat()} is after plan termination date {termination_date.isoformat()}.",
                rule="RULE-ELIG-EXPIRED",
                evidence={**evidence, "termination_date": termination_date.isoformat()},
                verification_timestamp=now,
                medical_necessity_met=True,
                frequency_limits_exceeded=False,
                policy_notes="Coverage was terminated prior to service date.",
            )

        # 3. Explicit Exclusion Check
        if cpt_code in SYNTHETIC_EXCLUSIONS or catalog_entry.get("is_excluded"):
            return CoverageResultSchema(
                claim_id=claim_id,
                coverage_status="not_covered",
                reason=f"Procedure CPT {cpt_code} ({catalog_entry.get('name', 'Service')}) is explicitly excluded under plan policy.",
                rule="RULE-EXCL-POLICY",
                evidence=evidence,
                verification_timestamp=now,
                medical_necessity_met=False,
                frequency_limits_exceeded=False,
                policy_notes="Service falls under excluded cosmetic, experimental, or non-covered plan category.",
            )

        # 4. Demographic Restriction Check (Gender/Age)
        gender_req = catalog_entry.get("gender_restriction")
        if gender_req and patient_gender:
            p_gender_norm = patient_gender.upper().strip()
            if p_gender_norm != gender_req and p_gender_norm != "UNKNOWN":
                return CoverageResultSchema(
                    claim_id=claim_id,
                    coverage_status="not_covered",
                    reason=f"Procedure CPT {cpt_code} gender requirement ({gender_req}) is incompatible with patient gender ({patient_gender}).",
                    rule="RULE-DEMO-GENDER",
                    evidence={**evidence, "gender_restriction": gender_req},
                    verification_timestamp=now,
                    medical_necessity_met=False,
                    frequency_limits_exceeded=False,
                    policy_notes="Demographic restriction failed: Patient gender incompatible with billed service.",
                )

        # 5. Frequency Limits Check
        max_freq = catalog_entry.get("max_frequency_per_year")
        if max_freq is not None and prior_occurrences_count >= max_freq:
            return CoverageResultSchema(
                claim_id=claim_id,
                coverage_status="conditional",
                reason=f"Annual frequency limit exceeded for CPT {cpt_code} (Max {max_freq} per year, found {prior_occurrences_count}).",
                rule="RULE-FREQ-LIMIT",
                evidence={**evidence, "max_frequency": max_freq, "prior_occurrences": prior_occurrences_count},
                verification_timestamp=now,
                medical_necessity_met=True,
                frequency_limits_exceeded=True,
                policy_notes="Benefit cap reached. Exceeding frequency cap requires peer-to-peer or prior authorization exception.",
            )

        # 6. Medical Necessity Crosswalk Check
        necessity_met, necessity_reason = check_medical_necessity(cpt_code, diagnosis_code)
        if not necessity_met:
            return CoverageResultSchema(
                claim_id=claim_id,
                coverage_status="not_covered",
                reason=necessity_reason,
                rule="RULE-MED-NECESSITY-FAIL",
                evidence=evidence,
                verification_timestamp=now,
                medical_necessity_met=False,
                frequency_limits_exceeded=False,
                policy_notes="Medical necessity crosswalk failure between ICD-10 diagnosis and CPT procedure.",
            )

        # 7. Conditional Service Check (Prior Authorization / Guidelines)
        requires_auth = catalog_entry.get("requires_auth", False)
        auth_approved = has_prior_auth or (auth_status == "APPROVED")

        if requires_auth and not auth_approved:
            return CoverageResultSchema(
                claim_id=claim_id,
                coverage_status="conditional",
                reason=f"Service CPT {cpt_code} ({catalog_entry.get('name', 'Service')}) is covered conditionally subject to prior authorization and clinical guidelines.",
                rule="RULE-COND-AUTH-REQUIRED",
                evidence={**evidence, "requires_auth": True, "auth_status": auth_status},
                verification_timestamp=now,
                medical_necessity_met=True,
                frequency_limits_exceeded=False,
                policy_notes="Covered under policy subject to prior authorization and medical necessity documentation.",
            )

        # 8. Fully Covered Service
        return CoverageResultSchema(
            claim_id=claim_id,
            coverage_status="covered",
            reason=f"Service CPT {cpt_code} ({catalog_entry.get('name', 'Service')}) is fully covered under plan benefits.",
            rule="RULE-COVERED-STANDARD",
            evidence=evidence,
            verification_timestamp=now,
            medical_necessity_met=True,
            frequency_limits_exceeded=False,
            policy_notes="Service satisfies all benefit availability, medical necessity, and active plan criteria.",
        )


def evaluate_coverage(request: CoverageVerificationRequest) -> CoverageResultSchema:
    """Helper wrapper for CoverageVerificationRequest."""
    return CoverageEngine.evaluate(
        cpt_code=request.cpt_code,
        diagnosis_code=request.diagnosis_code,
        service_date=request.service_date,
        effective_date=request.effective_date,
        termination_date=request.termination_date,
        is_active=request.is_active,
        patient_gender=request.patient_gender,
        patient_dob=request.patient_dob,
        payer_id=request.payer_id,
        payer_name=request.payer_name,
        plan_id=request.plan_id,
        plan_type=request.plan_type,
    )
