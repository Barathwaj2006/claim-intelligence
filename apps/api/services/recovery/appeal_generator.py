from datetime import datetime, date
from typing import Dict, Any


def generate_appeal_dossier(
    claim_id: str,
    claim_number: str,
    patient_name: str,
    member_id: str,
    patient_dob: str,
    payer_name: str,
    service_date: str,
    billed_amount: float,
    carc_code: str,
    carc_description: str,
    recommended_action: str,
    cpt_codes: list = None,
    provider_name: str = "Memorial Health System",
    provider_npi: str = "1982736450",
) -> Dict[str, Any]:
    """
    Generates a professional formal U.S. health insurance appeal or reconsideration dossier.
    """
    today_str = date.today().strftime("%B %d, %Y")
    cpt_str = ", ".join(cpt_codes) if cpt_codes else "Billed Procedures"

    if carc_code == "CO-197":
        subject = f"Formal Retro-Authorization Appeal for Claim #{claim_number}"
        clinical_rationale = (
            f"Procedure ({cpt_str}) performed on {service_date} was clinically necessary for "
            f"acute symptom management. The clinical urgency prevented pre-procedure authorization. "
            f"Enclosed please find the complete operative notes and clinical documentation demonstrating medical necessity."
        )
    elif carc_code == "CO-45":
        subject = f"Contractual Underpayment Reconciliation Request for Claim #{claim_number}"
        clinical_rationale = (
            f"The adjudicated payment for claim #{claim_number} reflects an unsupported contractual reduction "
            f"(CARC CO-45). Service line billed procedures ({cpt_str}) were rendered according to our "
            f"participating provider agreement. Please audit the allowed amount against the contracted fee schedule."
        )
    elif carc_code == "CO-16":
        subject = f"Corrected Claim Submission & Reconsideration for Claim #{claim_number}"
        clinical_rationale = (
            f"Claim #{claim_number} was originally rejected under CARC CO-16 for missing line item detail. "
            f"We have corrected the requested billing attributes and attached the verified patient record."
        )
    else:
        subject = f"Formal First-Level Reconsideration Appeal for Claim #{claim_number}"
        clinical_rationale = (
            f"This letter serves as a formal appeal regarding the adverse adjudication ({carc_code}: {carc_description}) "
            f"for services rendered on {service_date}. The medical record supports full coverage and payment."
        )

    letter_content = f"""# FORMAL APPEAL & RECONSIDERATION REQUEST

**DATE:** {today_str}
**TO:** {payer_name} Appeals & Grievances Department
**FROM:** {provider_name} (NPI: {provider_npi})
**SUBJECT:** {subject}

---

### PATIENT & CLAIM IDENTIFICATION
* **Patient Name:** {patient_name}
* **Member ID:** {member_id}
* **Date of Birth:** {patient_dob}
* **Claim Number:** {claim_number} (System ID: {claim_id})
* **Date of Service:** {service_date}
* **Total Billed Amount:** ${billed_amount:,.2f}
* **Procedure Code(s):** {cpt_str}
* **Adverse Payer Outcome:** {carc_code} - {carc_description}

---

### STATEMENT OF APPEAL & CLINICAL JUSTIFICATION
Dear Appeals Committee,

We are writing to formally appeal the denial / payment adjustment for the above-referenced claim.

{clinical_rationale}

### ENCLOSED EVIDENCE & ATTACHMENTS
1. Physician Operative Report & Encounter Notes
2. Original Electronic Claim Form (CMS-1500 / 837P EDI Log)
3. Payer Remittance Advice (835 ERA)
4. Signed Patient Consent & Coverage Assignment

We respectfully request immediate review and re-adjudication of this claim for full payment of ${billed_amount:,.2f}.

Sincerely,

**Revenue Cycle Management & Appeals Unit**
*{provider_name}*
NPI: {provider_npi}
"""

    return {
        "document_type": "APPEAL_LETTER" if "APPEAL" in recommended_action else "CORRECTED_CLAIM_FORM",
        "subject": subject,
        "content": letter_content,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
