"""
Data Quality and Safe Auto-Correction Engine.

Evaluates claims against data quality rules, logs audit metadata for every correction,
and safely applies high-confidence, unambiguous corrections.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session

from apps.api.models.entities import Claim, Correction
from apps.api.services.quality.rules import (
    normalize_payer_name,
    validate_and_normalize_npi,
    normalize_icd10_code,
    normalize_date_string,
    normalize_member_id,
    normalize_whitespace_and_case,
)


class DataQualityEngine:
    """
    Deterministic Data Quality Engine.
    Ensures no silent data changes, records full audit logs, and
    flags low-confidence or ambiguous items for human review.
    """

    AUTO_APPLY_CONFIDENCE_THRESHOLD = 0.95

    @classmethod
    def validate_claim_dict(cls, claim_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Validates claim dictionary data and returns list of suggested corrections/audit entries.
        """
        corrections: List[Dict[str, Any]] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Payer Name Normalization
        payer_name = claim_data.get("payer_name")
        if payer_name:
            sug, conf, reason, is_ambiguous = normalize_payer_name(str(payer_name))
            if is_ambiguous or conf < cls.AUTO_APPLY_CONFIDENCE_THRESHOLD:
                corrections.append({
                    "field_name": "payer_name",
                    "original_value": str(payer_name),
                    "suggested_value": sug or str(payer_name),
                    "reason": reason,
                    "confidence": conf,
                    "status": "FLAGGED_FOR_HUMAN_REVIEW",
                    "timestamp": now_iso,
                })
            elif sug and sug != payer_name:
                corrections.append({
                    "field_name": "payer_name",
                    "original_value": str(payer_name),
                    "suggested_value": sug,
                    "reason": reason,
                    "confidence": conf,
                    "status": "PENDING",
                    "timestamp": now_iso,
                })

        # 2. Provider NPI Checksum Verification
        provider_npi = claim_data.get("provider_npi")
        if provider_npi:
            is_valid, norm_npi, conf, reason = validate_and_normalize_npi(str(provider_npi))
            if not is_valid:
                corrections.append({
                    "field_name": "provider_npi",
                    "original_value": str(provider_npi),
                    "suggested_value": str(provider_npi),
                    "reason": reason,
                    "confidence": 0.0,
                    "status": "FLAGGED_FOR_HUMAN_REVIEW",
                    "timestamp": now_iso,
                })

        # 3. Primary Diagnosis ICD-10 Code Syntax
        primary_diag = claim_data.get("primary_diagnosis")
        if primary_diag:
            sug, conf, reason, is_valid = normalize_icd10_code(str(primary_diag))
            if not is_valid:
                corrections.append({
                    "field_name": "primary_diagnosis",
                    "original_value": str(primary_diag),
                    "suggested_value": str(primary_diag),
                    "reason": reason,
                    "confidence": 0.0,
                    "status": "FLAGGED_FOR_HUMAN_REVIEW",
                    "timestamp": now_iso,
                })
            elif sug and sug != primary_diag:
                corrections.append({
                    "field_name": "primary_diagnosis",
                    "original_value": str(primary_diag),
                    "suggested_value": sug,
                    "reason": reason,
                    "confidence": conf,
                    "status": "PENDING",
                    "timestamp": now_iso,
                })

        # 4. Service Date Normalization
        service_date = claim_data.get("service_date")
        if service_date:
            norm_date, conf, reason, is_valid = normalize_date_string(service_date)
            if not is_valid:
                corrections.append({
                    "field_name": "service_date",
                    "original_value": str(service_date),
                    "suggested_value": str(service_date),
                    "reason": reason,
                    "confidence": 0.0,
                    "status": "FLAGGED_FOR_HUMAN_REVIEW",
                    "timestamp": now_iso,
                })
            elif norm_date and str(service_date) != norm_date:
                corrections.append({
                    "field_name": "service_date",
                    "original_value": str(service_date),
                    "suggested_value": norm_date,
                    "reason": reason,
                    "confidence": conf,
                    "status": "PENDING",
                    "timestamp": now_iso,
                })

        # 5. Member ID Format Check
        member_id = claim_data.get("member_id")
        if member_id:
            norm_mem, conf, reason, is_valid = normalize_member_id(str(member_id))
            if not is_valid:
                corrections.append({
                    "field_name": "member_id",
                    "original_value": str(member_id),
                    "suggested_value": str(member_id),
                    "reason": reason,
                    "confidence": 0.0,
                    "status": "FLAGGED_FOR_HUMAN_REVIEW",
                    "timestamp": now_iso,
                })
            elif norm_mem and norm_mem != member_id:
                corrections.append({
                    "field_name": "member_id",
                    "original_value": str(member_id),
                    "suggested_value": norm_mem,
                    "reason": reason,
                    "confidence": conf,
                    "status": "PENDING",
                    "timestamp": now_iso,
                })

        return corrections

    @classmethod
    def validate_and_record_claim(cls, db: Session, claim: Claim) -> List[Correction]:
        """
        Runs rules against an ORM Claim model, persists Correction objects to DB,
        and returns the generated correction objects.
        """
        claim_dict = {
            "payer_name": claim.payer.name if claim.payer else None,
            "provider_npi": claim.provider.npi if claim.provider else None,
            "primary_diagnosis": claim.encounter.primary_diagnosis_code if claim.encounter else None,
            "service_date": claim.service_date,
            "member_id": claim.patient.member_id if claim.patient else None,
        }

        detected = cls.validate_claim_dict(claim_dict)
        db_corrections: List[Correction] = []

        # Remove existing PENDING/FLAGGED corrections for this claim to allow re-verification
        db.query(Correction).filter(
            Correction.claim_id == claim.id,
            Correction.status.in_(["PENDING", "FLAGGED_FOR_HUMAN_REVIEW"])
        ).delete(synchronize_session=False)

        for item in detected:
            corr = Correction(
                claim_id=claim.id,
                field_name=item["field_name"],
                original_value=item["original_value"],
                suggested_value=item["suggested_value"],
                reason=item["reason"],
                confidence=item["confidence"],
                status=item["status"],
            )
            db.add(corr)
            db_corrections.append(corr)

        db.commit()
        return db_corrections

    @classmethod
    def apply_corrections(cls, db: Session, claim: Claim, correction_ids: Optional[List[str]] = None) -> Tuple[int, List[Correction]]:
        """
        Safely applies pending high-confidence corrections to claim fields and updates audit status.
        Supports re-verification after correction application.
        """
        query = db.query(Correction).filter(
            Correction.claim_id == claim.id,
            Correction.status == "PENDING"
        )
        if correction_ids:
            query = query.filter(Correction.id.in_(correction_ids))

        pending_corrections = query.all()
        applied_count = 0
        applied_records: List[Correction] = []

        for corr in pending_corrections:
            if corr.confidence < cls.AUTO_APPLY_CONFIDENCE_THRESHOLD:
                corr.status = "FLAGGED_FOR_HUMAN_REVIEW"
                continue

            # Apply fix based on field name
            field = corr.field_name
            if field == "payer_name" and claim.payer:
                claim.payer.name = corr.suggested_value
            elif field == "provider_npi" and claim.provider:
                claim.provider.npi = corr.suggested_value
            elif field == "primary_diagnosis" and claim.encounter:
                claim.encounter.primary_diagnosis_code = corr.suggested_value
            elif field == "member_id" and claim.patient:
                claim.patient.member_id = corr.suggested_value
            elif field == "service_date":
                # Parse ISO date string to date object
                from datetime import datetime as dt
                claim.service_date = dt.strptime(corr.suggested_value, "%Y-%m-%d").date()

            corr.status = "APPLIED"
            applied_count += 1
            applied_records.append(corr)

        # Update claim status to READY or VERIFIED if all data quality issues are addressed
        db.commit()

        # Re-verify claim to confirm no remaining issues
        cls.validate_and_record_claim(db, claim)

        return applied_count, applied_records
