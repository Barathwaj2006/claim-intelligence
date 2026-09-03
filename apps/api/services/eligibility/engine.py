import re
from datetime import date, datetime, timezone
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from apps.api.schemas.canonical import EligibilityResultSchema


class DetailedEligibilityResult(EligibilityResultSchema):
    matched_fields: List[str] = Field(default_factory=list)
    failed_fields: List[str] = Field(default_factory=list)
    reason: str = "Active policy verified."
    verification_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: str = "simulated payer database"


class EligibilityEngine:
    """
    Deterministic real-time insurance eligibility verification engine.
    Given patient, payer, insurance plan, and claim context, determines policy status,
    date validity, field matching, deductible/copay breakdown, and canonical result.
    """

    @staticmethod
    def validate_member_id_format(member_id: str, payer_name: str) -> bool:
        if not member_id:
            return False

        clean_id = member_id.strip()
        p_name = payer_name.lower()

        if "blue cross" in p_name or "bcbs" in p_name:
            # BCBS: 3 or 4 alpha prefix + digits/alnum (e.g. BCBS-98231011 or XYZ123456789)
            pattern = r"^[A-Za-z]{3,4}-?\d{8,10}$"
            return bool(re.match(pattern, clean_id))
        elif "medicare" in p_name:
            # Medicare MBI format: 11 alphanumeric characters (e.g., MED-1EG4-TE9-MK72 or 1EG4-TE9-MK72 or 11 chars)
            # Remove hyphens for length check
            stripped = clean_id.replace("-", "")
            if len(stripped) == 11 and stripped.isalnum():
                return True
            if clean_id.startswith("MED-"):
                return True
            pattern = r"^[1-9][A-Za-z][0-9A-Za-z][0-9]-?[A-Za-z][0-9A-Za-z][0-9]-?[A-Za-z]{2}[0-9]{2}$"
            return bool(re.match(pattern, clean_id)) or len(stripped) >= 10
        elif any(p in p_name for p in ["unitedhealthcare", "uhc", "aetna", "cigna", "humana"]):
            # UHC/Aetna/Cigna/Humana: 8-12 numeric digits or prefix + 8-10 digits (e.g., UHC-44912033)
            pattern = r"^(?:[A-Za-z]{2,5}-?)?\d{8,12}$"
            return bool(re.match(pattern, clean_id))
        else:
            # General fallback: non-empty alphanumeric identifier
            return len(clean_id) >= 5

    def evaluate(
        self,
        patient_context: Dict[str, Any],
        payer_context: Dict[str, Any],
        plan_context: Optional[Dict[str, Any]] = None,
        claim_context: Optional[Dict[str, Any]] = None,
        effective_date: Optional[date] = None,
        termination_date: Optional[date] = None,
        deductible_total: Optional[float] = None,
        deductible_met: Optional[float] = None,
        copay_amount: Optional[float] = None,
    ) -> DetailedEligibilityResult:
        matched_fields: List[str] = []
        failed_fields: List[str] = []
        warnings: List[str] = []
        reasons: List[str] = []

        patient_member_id = patient_context.get("member_id", "")
        patient_first = patient_context.get("first_name", "")
        patient_last = patient_context.get("last_name", "")
        patient_dob = patient_context.get("date_of_birth") or patient_context.get("dob")

        payer_id = payer_context.get("id") or payer_context.get("payer_id", "")
        payer_name = payer_context.get("name") or payer_context.get("payer_name", "Unknown Payer")

        claim_id = claim_context.get("id", "clm-simulated") if claim_context else "clm-simulated"
        claim_payer_id = claim_context.get("payer_id") if claim_context else None
        claim_payer_name = claim_context.get("payer_name") if claim_context else None
        service_date = claim_context.get("service_date") if claim_context else None

        if isinstance(service_date, str):
            service_date = date.fromisoformat(service_date)
        elif not service_date:
            service_date = date.today()

        if plan_context:
            effective_date = effective_date or plan_context.get("effective_date", date(2026, 1, 1))
            termination_date = termination_date or plan_context.get("termination_date")
            deductible_total = deductible_total if deductible_total is not None else plan_context.get("annual_deductible", 1500.0)
            deductible_met = deductible_met if deductible_met is not None else plan_context.get("deductible_met", 0.0)
            copay_amount = copay_amount if copay_amount is not None else plan_context.get("copay_specialist", 35.0)
        else:
            effective_date = effective_date or date(2026, 1, 1)
            deductible_total = deductible_total if deductible_total is not None else 1500.0
            deductible_met = deductible_met if deductible_met is not None else 0.0
            copay_amount = copay_amount if copay_amount is not None else 35.0

        if isinstance(effective_date, str):
            effective_date = date.fromisoformat(effective_date)
        if isinstance(termination_date, str):
            termination_date = date.fromisoformat(termination_date)

        # 1. Validate Member ID Structure
        valid_member_id = self.validate_member_id_format(patient_member_id, payer_name)
        if valid_member_id:
            matched_fields.append("member_id_format")
        else:
            failed_fields.append("member_id_format")
            warnings.append(f"Invalid member ID format '{patient_member_id}' for payer '{payer_name}'")
            reasons.append("Invalid member ID format")

        # 2. Patient identifiers match
        if patient_member_id and (patient_first or patient_last):
            matched_fields.append("patient_identifiers")
        else:
            failed_fields.append("patient_identifiers")
            reasons.append("Patient identifiers incomplete or mismatch")

        # 3. Payer match
        if claim_payer_id or claim_payer_name:
            payer_match = False
            if claim_payer_id and payer_id and (claim_payer_id == payer_id or claim_payer_id == payer_context.get("payer_id")):
                payer_match = True
            elif claim_payer_name and payer_name and (claim_payer_name.lower() in payer_name.lower() or payer_name.lower() in claim_payer_name.lower()):
                payer_match = True

            if payer_match:
                matched_fields.append("payer_match")
            else:
                failed_fields.append("payer_match")
                warnings.append(f"Claim payer ('{claim_payer_name or claim_payer_id}') does not match subscriber policy payer ('{payer_name}')")
                reasons.append("Payer mismatch")
        else:
            matched_fields.append("payer_match")

        # 4. Plan match
        if plan_context:
            matched_fields.append("plan_match")

        # 5. Policy effective date and active date range verification
        is_active = True
        if service_date < effective_date:
            is_active = False
            failed_fields.append("effective_date")
            warnings.append(f"Service date {service_date} is prior to coverage effective date {effective_date}")
            reasons.append("Service date prior to coverage effective date (CO-27)")
        else:
            matched_fields.append("effective_date")

        if termination_date and service_date > termination_date:
            is_active = False
            failed_fields.append("termination_date")
            warnings.append(f"Service date {service_date} is after coverage termination date {termination_date}")
            reasons.append("Coverage terminated prior to service date (CO-27)")
        elif termination_date:
            matched_fields.append("termination_date")

        # Override active status if member ID or payer mismatch critical issues occur
        if "Payer mismatch" in reasons:
            is_active = False

        deductible_remaining = max(0.0, float(deductible_total) - float(deductible_met))

        status_str = "VERIFIED" if (is_active and not failed_fields) else ("WARN" if is_active else "INACTIVE")
        reason_str = "; ".join(reasons) if reasons else "Active coverage verified. All identifiers matched."

        return DetailedEligibilityResult(
            claim_id=claim_id,
            is_active=is_active,
            effective_date=effective_date,
            termination_date=termination_date,
            copay_amount=float(copay_amount),
            deductible_total=float(deductible_total),
            deductible_met=float(deductible_met),
            deductible_remaining=deductible_remaining,
            payer_name=payer_name,
            status=status_str,
            warnings=warnings,
            matched_fields=matched_fields,
            failed_fields=failed_fields,
            reason=reason_str,
            verification_timestamp=datetime.now(timezone.utc),
            source="simulated payer database",
        )


def verify_eligibility(
    patient: Dict[str, Any],
    payer: Dict[str, Any],
    plan: Optional[Dict[str, Any]] = None,
    claim: Optional[Dict[str, Any]] = None,
    **kwargs,
) -> DetailedEligibilityResult:
    engine = EligibilityEngine()
    return engine.evaluate(
        patient_context=patient,
        payer_context=payer,
        plan_context=plan,
        claim_context=claim,
        **kwargs,
    )
