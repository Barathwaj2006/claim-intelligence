"""
Deterministic Claim Lifecycle State Machine and Transition Engine.

Enforces valid state transitions for U.S. provider-side healthcare claims,
logs audit events, and checks prerequisite invariants.
"""

from enum import Enum
from typing import List, Dict, Set, Optional, Any
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel, ConfigDict, Field
from fastapi import HTTPException, status


class ClaimStatus(str, Enum):
    DRAFT = "DRAFT"
    VERIFIED = "VERIFIED"
    READY_FOR_SUBMISSION = "READY_FOR_SUBMISSION"
    SUBMITTED = "SUBMITTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    ADJUDICATED = "ADJUDICATED"
    PAID = "PAID"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    DENIED = "DENIED"
    UNDERPAID = "UNDERPAID"
    RECOVERY = "RECOVERY"
    APPEAL_IN_PROGRESS = "APPEAL_IN_PROGRESS"
    CLOSED = "CLOSED"


VALID_TRANSITIONS: Dict[ClaimStatus, Set[ClaimStatus]] = {
    ClaimStatus.DRAFT: {
        ClaimStatus.VERIFIED,
        ClaimStatus.READY_FOR_SUBMISSION,
        ClaimStatus.REJECTED,
        ClaimStatus.DRAFT,
    },
    ClaimStatus.VERIFIED: {
        ClaimStatus.READY_FOR_SUBMISSION,
        ClaimStatus.DRAFT,
    },
    ClaimStatus.READY_FOR_SUBMISSION: {
        ClaimStatus.SUBMITTED,
        ClaimStatus.DRAFT,
        ClaimStatus.VERIFIED,
    },
    ClaimStatus.SUBMITTED: {
        ClaimStatus.ACCEPTED,
        ClaimStatus.REJECTED,
        ClaimStatus.ADJUDICATED,
    },
    ClaimStatus.ACCEPTED: {
        ClaimStatus.ADJUDICATED,
        ClaimStatus.REJECTED,
    },
    ClaimStatus.REJECTED: {
        ClaimStatus.DRAFT,
        ClaimStatus.READY_FOR_SUBMISSION,
        ClaimStatus.CLOSED,
    },
    ClaimStatus.ADJUDICATED: {
        ClaimStatus.PAID,
        ClaimStatus.PARTIALLY_PAID,
        ClaimStatus.DENIED,
        ClaimStatus.UNDERPAID,
        ClaimStatus.APPEAL_IN_PROGRESS,
        ClaimStatus.RECOVERY,
        ClaimStatus.CLOSED,
    },
    ClaimStatus.PAID: {
        ClaimStatus.CLOSED,
        ClaimStatus.RECOVERY,
    },
    ClaimStatus.PARTIALLY_PAID: {
        ClaimStatus.RECOVERY,
        ClaimStatus.APPEAL_IN_PROGRESS,
        ClaimStatus.CLOSED,
    },
    ClaimStatus.DENIED: {
        ClaimStatus.RECOVERY,
        ClaimStatus.APPEAL_IN_PROGRESS,
        ClaimStatus.DRAFT,
        ClaimStatus.READY_FOR_SUBMISSION,
        ClaimStatus.CLOSED,
    },
    ClaimStatus.UNDERPAID: {
        ClaimStatus.RECOVERY,
        ClaimStatus.APPEAL_IN_PROGRESS,
        ClaimStatus.CLOSED,
    },
    ClaimStatus.RECOVERY: {
        ClaimStatus.APPEAL_IN_PROGRESS,
        ClaimStatus.SUBMITTED,
        ClaimStatus.ADJUDICATED,
        ClaimStatus.CLOSED,
    },
    ClaimStatus.APPEAL_IN_PROGRESS: {
        ClaimStatus.ADJUDICATED,
        ClaimStatus.PAID,
        ClaimStatus.PARTIALLY_PAID,
        ClaimStatus.DENIED,
        ClaimStatus.CLOSED,
    },
    ClaimStatus.CLOSED: {
        ClaimStatus.DRAFT,
    },
}


class InvalidTransitionError(HTTPException):
    """Raised when an illegal or invariant-violating state transition is attempted."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_STATE_TRANSITION",
                "message": message,
                "details": details or {},
            },
        )


class ClaimAuditEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    claim_id: str
    previous_status: str
    new_status: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    actor: str = "system"
    source: str = "lifecycle_engine"
    reason: Optional[str] = None
    force_override: bool = False
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ClaimLifecycleEngine:
    """
    Deterministic rule engine governing claim status transitions,
    enforcing preconditions, and producing audit records.
    """

    @staticmethod
    def get_valid_transitions(current_status: str) -> List[str]:
        """Returns list of permitted destination statuses from current_status."""
        try:
            status_enum = ClaimStatus(current_status.upper())
            allowed = VALID_TRANSITIONS.get(status_enum, set())
            return [s.value for s in allowed]
        except ValueError:
            return []

    @classmethod
    def validate_transition(
        cls,
        current_status: str,
        target_status: str,
        eligibility_checked: bool = True,
        risk_score_calculated: bool = True,
        risk_level: Optional[str] = None,
        force_override: bool = False,
    ) -> bool:
        """
        Validates if target_status is allowable from current_status and meets all invariants.
        Raises InvalidTransitionError if transition is illegal or invariant failed.
        """
        try:
            curr_enum = ClaimStatus(current_status.upper())
        except ValueError:
            raise InvalidTransitionError(f"Unknown current claim status: '{current_status}'")

        try:
            target_enum = ClaimStatus(target_status.upper())
        except ValueError:
            raise InvalidTransitionError(f"Unknown target claim status: '{target_status}'")

        allowed_targets = VALID_TRANSITIONS.get(curr_enum, set())
        if target_enum not in allowed_targets:
            raise InvalidTransitionError(
                f"Illegal status transition from '{curr_enum.value}' to '{target_enum.value}'. "
                f"Valid next states: {[s.value for s in allowed_targets]}"
            )

        # Invariant 1: Transitioning to VERIFIED requires eligibility check
        if target_enum == ClaimStatus.VERIFIED and not eligibility_checked and not force_override:
            raise InvalidTransitionError(
                "Transition to 'VERIFIED' requires an eligibility check to have been completed."
            )

        # Invariant 2: Transitioning to READY_FOR_SUBMISSION requires risk score calculation
        if target_enum == ClaimStatus.READY_FOR_SUBMISSION and not risk_score_calculated and not force_override:
            raise InvalidTransitionError(
                "Transition to 'READY_FOR_SUBMISSION' requires risk score calculation to have been performed."
            )

        # Invariant 3: Transitioning to SUBMITTED blocks HIGH risk claims without force_override
        if target_enum == ClaimStatus.SUBMITTED and risk_level and risk_level.upper() == "HIGH" and not force_override:
            raise InvalidTransitionError(
                "Cannot submit claim with 'HIGH' risk level without explicit force_override=True."
            )

        return True

    @classmethod
    def transition_claim(
        cls,
        claim_id: str,
        current_status: str,
        target_status: str,
        actor: str = "system",
        source: str = "api",
        reason: Optional[str] = None,
        eligibility_checked: bool = True,
        risk_score_calculated: bool = True,
        risk_level: Optional[str] = None,
        force_override: bool = False,
        clearinghouse_trace_id: Optional[str] = None,
        additional_metadata: Optional[Dict[str, Any]] = None,
    ) -> ClaimAuditEvent:
        """
        Validates state transition and constructs an immutable ClaimAuditEvent.
        """
        cls.validate_transition(
            current_status=current_status,
            target_status=target_status,
            eligibility_checked=eligibility_checked,
            risk_score_calculated=risk_score_calculated,
            risk_level=risk_level,
            force_override=force_override,
        )

        metadata = additional_metadata or {}
        if clearinghouse_trace_id:
            metadata["clearinghouse_trace_id"] = clearinghouse_trace_id

        curr_clean = ClaimStatus(current_status.upper()).value
        target_clean = ClaimStatus(target_status.upper()).value

        return ClaimAuditEvent(
            claim_id=claim_id,
            previous_status=curr_clean,
            new_status=target_clean,
            actor=actor,
            source=source,
            reason=reason,
            force_override=force_override,
            metadata=metadata,
        )
