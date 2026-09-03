from datetime import datetime, timezone
from typing import Optional
from apps.api.schemas.canonical import (
    ClaimDetailSchema,
    RecoveryCaseSchema,
    RecoveryActionRequestSchema,
    RecoveryActionResponseSchema,
    AuditTrailEntrySchema,
)


def generate_appeal_letter(claim: ClaimDetailSchema, case: RecoveryCaseSchema) -> str:
    """
    Synthesizes a formal, professional U.S. health insurance formal appeal dossier letter.
    """
    lines_summary = ", ".join([line.cpt_code for line in claim.lines]) if claim.lines else "Billed Procedures"

    return f"""# FORMAL FIRST-LEVEL APPEAL / RECONSIDERATION REQUEST

**TO:** {claim.payer_name} Appeals & Grievances Department
**DATE:** {datetime.now(timezone.utc).strftime('%B %d, %Y')}
**RE:** Formal Appeal for Claim Denial ({case.denial_carc})

---

### PATIENT & CLAIM IDENTIFICATION
- **Patient Name:** {claim.patient_name}
- **Member ID:** {claim.member_id}
- **Claim Number:** {claim.claim_number}
- **Date of Service:** {claim.service_date}
- **Rendering Provider:** {claim.provider_name} (NPI: {claim.provider_npi})
- **Billed Amount:** ${claim.total_billed_amount:,.2f}
- **Billed Procedure(s):** CPT/HCPCS {lines_summary}
- **Primary Diagnosis:** {claim.primary_diagnosis}

---

### STATEMENT OF APPEAL & REASON FOR RECONSIDERATION
This letter serves as a formal First-Level Appeal regarding the denial of the above-referenced claim under denial reason **{case.denial_carc} ({case.denial_reason})**.

**Clinical & Administrative Justification:**
{case.root_cause}

The care provided on {claim.service_date} was medically necessary, indicated by clinical guidelines, and rendered in full accordance with standard medical practice.

Clinical Encounter Notes Excerpt:
> "{claim.clinical_notes or 'Patient evaluated and treated per standard clinical protocol.'}"

---

### REQUESTED ACTION
We respectfully request immediate reconsideration and re-adjudication of this claim in the amount of **${claim.total_billed_amount:,.2f}**.

Sincerely,
**Appeals & Revenue Recovery Department**
{claim.provider_name}
"""


def process_recovery_action(
    case: RecoveryCaseSchema,
    claim: ClaimDetailSchema,
    request: RecoveryActionRequestSchema,
) -> RecoveryActionResponseSchema:
    """
    Processes human approval and simulates recovery action execution,
    updating recovery status, determining outcome, calculating recovered amount,
    and recording audit trail log.
    """
    action_type = request.action_type.upper()
    previous_status = case.status
    now = datetime.now(timezone.utc)

    if action_type == "WRITE_OFF":
        new_status = "CLOSED_WRITTEN_OFF"
        outcome = "WRITTEN_OFF"
        recovered_amount = 0.00
        appeal_letter = None
        details = f"Action WRITTEN_OFF approved by {request.approved_by}. Notes: {request.notes or 'None'}"
    elif action_type in ("SUBMIT_APPEAL", "SUBMIT_CORRECTED_CLAIM"):
        new_status = "RECOVERED" if case.recoverability_score >= 80 else "APPEAL_SUBMITTED"
        outcome = "FULLY_RECOVERED" if new_status == "RECOVERED" else "PENDING_PAYER_REVIEW"
        recovered_amount = case.revenue_at_risk if outcome == "FULLY_RECOVERED" else case.expected_recovery

        if request.appeal_text_override:
            appeal_letter = request.appeal_text_override
        else:
            appeal_letter = generate_appeal_letter(claim, case)

        details = f"Action {action_type} executed & approved by {request.approved_by}. Outcome: {outcome}, Recovered Amount: ${recovered_amount:,.2f}."
    else:
        new_status = "ACTION_TAKEN"
        outcome = "COMPLETED"
        recovered_amount = case.expected_recovery
        appeal_letter = generate_appeal_letter(claim, case)
        details = f"Action {action_type} processed by {request.approved_by}."

    # Update case status
    case.status = new_status
    case.appeal_letter_markdown = appeal_letter

    # Append Audit Trail entry
    new_audit = AuditTrailEntrySchema(
        id=f"aud-{case.id[:8]}-{len(case.audit_trail) + 1}",
        timestamp=now,
        action=f"ACTION_{action_type}",
        actor=request.approved_by,
        details=details,
        previous_status=previous_status,
        new_status=new_status,
    )
    case.audit_trail.append(new_audit)

    return RecoveryActionResponseSchema(
        case_id=case.id,
        claim_id=claim.id,
        action_type=action_type,
        status=new_status,
        outcome=outcome,
        recovered_amount=recovered_amount,
        appeal_letter_markdown=appeal_letter,
        executed_at=now,
        audit_trail=case.audit_trail,
    )
