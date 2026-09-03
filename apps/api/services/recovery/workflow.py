from datetime import datetime
from typing import Dict, Any, List, Optional

SUPPORTED_RECOVERY_STATES = [
    "IDENTIFIED",
    "ANALYZING",
    "ACTION_REQUIRED",
    "ASSIGNED",
    "IN_PROGRESS",
    "CORRECTED",
    "RESUBMITTED",
    "PAYER_REVIEW",
    "RECOVERED",
    "PARTIALLY_RECOVERED",
    "UNSUCCESSFUL",
    "ESCALATED",
]

VALID_TRANSITIONS: Dict[str, List[str]] = {
    "IDENTIFIED": ["ANALYZING", "ACTION_REQUIRED", "ASSIGNED", "IN_PROGRESS", "CORRECTED", "RESUBMITTED", "PAYER_REVIEW", "ESCALATED"],
    "ANALYZING": ["ACTION_REQUIRED", "ASSIGNED", "IN_PROGRESS", "CORRECTED", "RESUBMITTED", "PAYER_REVIEW", "ESCALATED"],
    "ACTION_REQUIRED": ["ASSIGNED", "IN_PROGRESS", "CORRECTED", "RESUBMITTED", "PAYER_REVIEW", "ESCALATED"],
    "ASSIGNED": ["IN_PROGRESS", "CORRECTED", "RESUBMITTED", "PAYER_REVIEW", "ESCALATED"],
    "IN_PROGRESS": ["CORRECTED", "RESUBMITTED", "PAYER_REVIEW", "RECOVERED", "PARTIALLY_RECOVERED", "UNSUCCESSFUL", "ESCALATED"],
    "CORRECTED": ["RESUBMITTED", "PAYER_REVIEW", "RECOVERED", "PARTIALLY_RECOVERED", "UNSUCCESSFUL", "ESCALATED"],
    "RESUBMITTED": ["PAYER_REVIEW", "RECOVERED", "PARTIALLY_RECOVERED", "UNSUCCESSFUL", "ESCALATED"],
    "PAYER_REVIEW": ["RECOVERED", "PARTIALLY_RECOVERED", "UNSUCCESSFUL", "ESCALATED"],
    "RECOVERED": ["ESCALATED", "IN_PROGRESS"],
    "PARTIALLY_RECOVERED": ["IN_PROGRESS", "RESUBMITTED", "ESCALATED"],
    "UNSUCCESSFUL": ["ESCALATED", "IN_PROGRESS", "RESUBMITTED"],
    "ESCALATED": ["IN_PROGRESS", "RESUBMITTED", "UNSUCCESSFUL"],
}


def validate_transition(current_state: str, target_state: str) -> bool:
    """
    Validates if transitioning from current_state to target_state is allowed.
    """
    current_upper = (current_state or "IDENTIFIED").upper()
    target_upper = (target_state or "").upper()

    if target_upper not in SUPPORTED_RECOVERY_STATES:
        return False

    if current_upper == target_upper:
        return True

    allowed = VALID_TRANSITIONS.get(current_upper, SUPPORTED_RECOVERY_STATES)
    return target_upper in allowed


def transition_case_state(
    current_status: str,
    target_status: str,
    actor: str = "Human User",
    notes: Optional[str] = None,
    audit_trail: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Transitions recovery case workflow state and records audit event.
    """
    target_upper = target_status.upper()
    current_upper = (current_status or "IDENTIFIED").upper()

    if not validate_transition(current_upper, target_upper):
        raise ValueError(f"Invalid workflow state transition from '{current_upper}' to '{target_upper}'")

    trail = list(audit_trail) if audit_trail else []
    now_str = datetime.utcnow().isoformat() + "Z"

    audit_entry = {
        "timestamp": now_str,
        "action": "STATE_TRANSITION",
        "from_status": current_upper,
        "to_status": target_upper,
        "actor": actor,
        "notes": notes or f"Transitioned workflow state to {target_upper}",
    }
    trail.append(audit_entry)

    return {
        "status": target_upper,
        "audit_trail": trail,
        "updated_at": now_str,
    }


def record_simulated_outcome(
    revenue_at_risk: float,
    recovered_amount: float,
    notes: Optional[str] = None,
    current_audit_trail: Optional[List[Dict[str, Any]]] = None,
    actor: str = "Human User (Simulated Action)",
) -> Dict[str, Any]:
    """
    Records outcome of a simulated recovery action (human approval / action).
    Calculates remaining revenue at risk and determines final outcome status.
    """
    rec_amount = round(max(0.0, float(recovered_amount)), 2)
    at_risk = round(max(0.0, float(revenue_at_risk)), 2)
    remaining_amount = round(max(0.0, at_risk - rec_amount), 2)

    if remaining_amount == 0.0 and rec_amount > 0:
        new_status = "RECOVERED"
    elif rec_amount > 0 and remaining_amount > 0:
        new_status = "PARTIALLY_RECOVERED"
    else:
        new_status = "UNSUCCESSFUL"

    trail = list(current_audit_trail) if current_audit_trail else []
    now_str = datetime.utcnow().isoformat() + "Z"

    audit_entry = {
        "timestamp": now_str,
        "action": "SIMULATED_RECOVERY_OUTCOME",
        "recovered_amount": rec_amount,
        "remaining_amount": remaining_amount,
        "status": new_status,
        "actor": actor,
        "notes": notes or f"Recorded simulated recovery of ${rec_amount:,.2f}",
    }
    trail.append(audit_entry)

    return {
        "recovered_amount": rec_amount,
        "remaining_amount": remaining_amount,
        "status": new_status,
        "audit_trail": trail,
        "updated_at": now_str,
    }
