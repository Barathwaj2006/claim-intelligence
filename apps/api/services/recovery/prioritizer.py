from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional
from apps.api.schemas.canonical import (
    AdjudicationSchema,
    ClaimDetailSchema,
    RecoveryCaseSchema,
    ExplanationEvidenceSchema,
    AuditTrailEntrySchema,
)


class RecoveryPrioritizer:
    """
    Revenue Recovery Prioritization Engine.

    Ingests claims and adjudication results (DENIED or UNDERPAID),
    evaluates recoverability score, expected recovery, priority, root cause,
    evidence, and recommended recovery action.
    """

    @staticmethod
    def calculate_recoverability(carc_code: str) -> int:
        carc = (carc_code or "").upper().strip()
        if carc in ("CO-16", "16"):
            return 90  # Missing/Incomplete Information - High Recoverability
        elif carc in ("CO-197", "197"):
            return 60  # Precertification/Auth Absent - Medium-High Recoverability
        elif carc in ("CO-50", "50"):
            return 45  # Non-covered/Medical Necessity - Medium Recoverability
        elif carc in ("CO-29", "29"):
            return 15  # Timely Filing Limit Expired - Low Recoverability
        return 50  # Default moderate recoverability

    @staticmethod
    def determine_priority(revenue_at_risk: float, days_remaining: int) -> str:
        if revenue_at_risk > 5000.0 or days_remaining < 14:
            return "URGENT"
        elif revenue_at_risk >= 1000.0:
            return "HIGH"
        return "MEDIUM"

    @staticmethod
    def determine_root_cause_and_action(carc_code: str, carc_desc: Optional[str] = None) -> tuple[str, str]:
        carc = (carc_code or "").upper().strip()
        if carc in ("CO-197", "197"):
            root_cause = "Missing or unverified Prior Authorization for procedure line."
            recommended_action = "Submit Formal First-Level Medical Necessity & Retro-Auth Appeal Packet."
        elif carc in ("CO-16", "16"):
            root_cause = "Claim missing required demographic, NPI, or clinical information."
            recommended_action = "Submit Corrected Claim with updated provider details and attached medical records."
        elif carc in ("CO-29", "29"):
            root_cause = "Timely filing window expired prior to adjudication."
            recommended_action = "File Reconsideration Request with proof of initial timely submission / clearinghouse acceptance trace."
        elif carc in ("CO-50", "50"):
            root_cause = "Procedure declared non-covered / medical necessity not established."
            recommended_action = "Submit Formal Clinical Appeal with treating physician attestation and operative notes."
        else:
            root_cause = carc_desc or f"Payer adjudication denial code {carc}."
            recommended_action = "Review ERA details and file reconsideration request with payer."

        return root_cause, recommended_action


def create_recovery_case(
    claim: ClaimDetailSchema,
    adjudication: AdjudicationSchema,
) -> RecoveryCaseSchema:
    # Identify primary denial CARC code from lines or default
    primary_carc = "CO-197"
    primary_carc_desc = "Precertification/authorization absent."
    if adjudication.lines:
        for line in adjudication.lines:
            if line.carc_code:
                primary_carc = line.carc_code
                primary_carc_desc = line.carc_description or primary_carc_desc
                break

    revenue_at_risk = round(adjudication.billed_amount - adjudication.payer_paid_amount, 2)
    if revenue_at_risk <= 0:
        revenue_at_risk = claim.total_billed_amount

    recoverability_score = RecoveryPrioritizer.calculate_recoverability(primary_carc)
    expected_recovery = round(revenue_at_risk * (recoverability_score / 100.0), 2)

    today = date.today()
    filing_deadline = claim.filing_deadline or (today + timedelta(days=60))
    days_remaining = max((filing_deadline - today).days, 0)

    priority = RecoveryPrioritizer.determine_priority(revenue_at_risk, days_remaining)
    root_cause, recommended_action = RecoveryPrioritizer.determine_root_cause_and_action(
        primary_carc, primary_carc_desc
    )

    # Collect Evidence
    evidence = [
        ExplanationEvidenceSchema(
            type="FACT",
            description=f"835 ERA Adjudication state: {adjudication.status}. Billed: ${adjudication.billed_amount:,.2f}, Paid: ${adjudication.payer_paid_amount:,.2f}.",
            source_field="adjudication.payer_paid_amount",
        ),
        ExplanationEvidenceSchema(
            type="FACT",
            description=f"Payer Denial Code {primary_carc}: {primary_carc_desc}",
            source_field="adjudication.lines.carc_code",
        ),
        ExplanationEvidenceSchema(
            type="INFERENCE",
            description=f"Recoverability estimated at {recoverability_score}% based on historical benchmark rules for {primary_carc}.",
            source_field="recoverability_score",
        ),
    ]

    # Initial Audit Trail
    audit_trail = [
        AuditTrailEntrySchema(
            id=f"aud-{claim.id[:8]}-1",
            timestamp=datetime.now(timezone.utc),
            action="CASE_CREATED",
            actor="SYSTEM_AUTO_INGEST",
            details=f"Ingested denied claim {claim.claim_number}. Revenue at risk: ${revenue_at_risk:,.2f}, Recoverability: {recoverability_score}%.",
            previous_status=None,
            new_status="NEW",
        )
    ]

    return RecoveryCaseSchema(
        id=f"rec-{claim.id}",
        claim_id=claim.id,
        claim_number=claim.claim_number,
        patient_name=claim.patient_name,
        payer_name=claim.payer_name,
        denial_carc=primary_carc,
        denial_reason=primary_carc_desc,
        revenue_at_risk=revenue_at_risk,
        expected_recovery=expected_recovery,
        recoverability_score=recoverability_score,
        priority=priority,
        status="NEW",
        root_cause=root_cause,
        evidence=evidence,
        recommended_action=recommended_action,
        filing_deadline=filing_deadline,
        days_remaining=days_remaining,
        audit_trail=audit_trail,
    )
