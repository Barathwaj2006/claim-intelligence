from typing import Dict, Any, Tuple, List
from datetime import date


def calculate_recoverability(
    carc_code: str,
    has_evidence: bool = True,
    days_remaining: int = 60,
    previous_attempts: int = 0,
) -> Dict[str, Any]:
    """
    Deterministically computes recoverability score (0-100) based on CARC code,
    evidence availability, filing window, and previous recovery attempts.
    """
    carc_upper = (carc_code or "").upper().strip()
    factors: List[str] = []

    # Base score by CARC code
    if carc_upper == "CO-16":
        base_score = 90
        factors.append("CO-16 (Missing/incorrect info) has high correction success rate (+90)")
    elif carc_upper == "CO-197":
        base_score = 60
        factors.append("CO-197 (Missing prior auth) requires retroactive clinical appeal (+60)")
    elif carc_upper == "CO-45":
        base_score = 75
        factors.append("CO-45 (Contractual underpayment) is verifiable against fee schedule (+75)")
    elif carc_upper == "CO-29":
        base_score = 15
        factors.append("CO-29 (Timely filing) has low recoverability without EDI proof (+15)")
    elif carc_upper == "CO-97":
        base_score = 40
        factors.append("CO-97 (Procedure bundling) requires CCI modifier review (+40)")
    elif carc_upper == "CO-50":
        base_score = 50
        factors.append("CO-50 (Medical necessity) requires clinical note submission (+50)")
    else:
        base_score = 50
        factors.append(f"Standard denial code {carc_upper or 'UNKNOWN'} baseline (+50)")

    score = base_score

    # Evidence adjustment
    if has_evidence:
        score += 10
        factors.append("Supporting clinical documentation/evidence available (+10)")
    else:
        score -= 15
        factors.append("Missing supporting clinical evidence (-15)")

    # Filing window urgency adjustment
    if days_remaining < 7:
        score -= 20
        factors.append(f"Filing deadline extremely close ({days_remaining} days left) (-20)")
    elif days_remaining < 14:
        score -= 10
        factors.append(f"Filing deadline approaching ({days_remaining} days left) (-10)")

    # Previous attempts penalty
    if previous_attempts > 0:
        penalty = 15 * previous_attempts
        score -= penalty
        factors.append(f"{previous_attempts} previous recovery attempt(s) failed (-{penalty})")

    clamped_score = max(0, min(100, score))

    return {
        "recoverability_score": clamped_score,
        "base_score": base_score,
        "contributing_factors": factors,
    }


def calculate_financial_impact(
    billed_amount: float,
    paid_amount: float,
    recoverability_score: int,
) -> Dict[str, float]:
    """
    Computes deterministic financial impact metrics.
    Revenue at risk = billed_amount - paid_amount.
    Expected recovery = Revenue at risk * (recoverability_score / 100).
    """
    revenue_at_risk = round(max(0.0, float(billed_amount) - float(paid_amount)), 2)
    expected_recovery = round(revenue_at_risk * (recoverability_score / 100.0), 2)

    return {
        "revenue_at_risk": revenue_at_risk,
        "expected_recovery": expected_recovery,
        "recovered_amount": 0.0,
        "remaining_amount": revenue_at_risk,
    }


def determine_priority(
    revenue_at_risk: float,
    days_remaining: int,
    expected_recovery: float,
    recoverability_score: int,
) -> str:
    """
    Determines priority classification (URGENT, HIGH, MEDIUM, LOW).
    """
    if revenue_at_risk >= 5000.0 or days_remaining < 14 or expected_recovery >= 4000.0:
        return "URGENT"
    elif revenue_at_risk >= 1000.0 or expected_recovery >= 1000.0 or days_remaining < 30:
        return "HIGH"
    elif revenue_at_risk >= 250.0:
        return "MEDIUM"
    else:
        return "LOW"


def determine_recommended_action(carc_code: str, recoverability_score: int) -> Tuple[str, str]:
    """
    Returns recommended action type and human-readable explanation WHY.
    """
    carc_upper = (carc_code or "").upper().strip()

    if carc_upper == "CO-16":
        action = "CORRECTED_CLAIM"
        why = (
            f"CARC CO-16 indicates demographic or billing line data missing. "
            f"High recoverability ({recoverability_score}%). Correct missing field and resubmit claim."
        )
    elif carc_upper == "CO-197":
        action = "FIRST_LEVEL_APPEAL"
        why = (
            f"CARC CO-197 indicates missing prior authorization. "
            f"Recoverability is {recoverability_score}%. Generate formal retro-authorization appeal with operative notes."
        )
    elif carc_upper == "CO-45":
        action = "RECONSIDERATION"
        why = (
            f"CARC CO-45 indicates fee schedule underpayment discrepancy. "
            f"Recoverability is {recoverability_score}%. Request formal contract reconsideration and fee schedule reconciliation."
        )
    elif carc_upper == "CO-50":
        action = "PEER_TO_PEER"
        why = (
            f"CARC CO-50 indicates clinical medical necessity denial. "
            f"Recoverability is {recoverability_score}%. Request peer-to-peer physician discussion or submit detailed clinical summary."
        )
    elif carc_upper == "CO-29":
        action = "FIRST_LEVEL_APPEAL"
        why = (
            f"CARC CO-29 indicates timely filing limit issue. "
            f"Recoverability is {recoverability_score}%. Submit appeal with original 837P EDI clearinghouse transmission confirmation."
        )
    else:
        action = "FIRST_LEVEL_APPEAL"
        why = (
            f"Adverse payer outcome ({carc_upper or 'DENIED'}). "
            f"Recoverability is {recoverability_score}%. Review documentation and submit first-level appeal packet."
        )

    return action, why


def evaluate_recovery_opportunity(
    billed_amount: float,
    paid_amount: float,
    carc_code: str,
    carc_description: str = "",
    filing_deadline: date = None,
    has_evidence: bool = True,
    previous_attempts: int = 0,
) -> Dict[str, Any]:
    """
    Master evaluation engine for converting a claim adjudication into a structured recovery case.
    """
    today = date.today()
    if filing_deadline:
        days_remaining = max(0, (filing_deadline - today).days)
    else:
        days_remaining = 60

    recoverability_res = calculate_recoverability(
        carc_code=carc_code,
        has_evidence=has_evidence,
        days_remaining=days_remaining,
        previous_attempts=previous_attempts,
    )
    score = recoverability_res["recoverability_score"]

    financial = calculate_financial_impact(
        billed_amount=billed_amount,
        paid_amount=paid_amount,
        recoverability_score=score,
    )

    priority = determine_priority(
        revenue_at_risk=financial["revenue_at_risk"],
        days_remaining=days_remaining,
        expected_recovery=financial["expected_recovery"],
        recoverability_score=score,
    )

    action, why = determine_recommended_action(carc_code, score)

    evidence_list = [
        {"name": "Operative Report / Clinical Notes", "available": has_evidence},
        {"name": "Original EDI 837P Submission Log", "available": True},
        {"name": "Payer Remittance 835 ERA Record", "available": True},
    ]
    if carc_code.upper() == "CO-197":
        evidence_list.append({"name": "Prior Authorization Attestation", "available": True})
    elif carc_code.upper() == "CO-45":
        evidence_list.append({"name": "Contracted Payer Fee Schedule", "available": True})

    return {
        "revenue_at_risk": financial["revenue_at_risk"],
        "expected_recovery": financial["expected_recovery"],
        "recovered_amount": 0.0,
        "remaining_amount": financial["revenue_at_risk"],
        "recoverability_score": score,
        "priority": priority,
        "recommended_action": action,
        "explanation_why": why,
        "contributing_factors": recoverability_res["contributing_factors"],
        "days_remaining": days_remaining,
        "evidence": evidence_list,
    }
