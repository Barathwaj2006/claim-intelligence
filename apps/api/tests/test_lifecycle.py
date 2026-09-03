"""
Comprehensive state transition and claim lifecycle unit & integration tests.
"""

import pytest
from datetime import datetime, date
from apps.api.services.lifecycle.state_machine import (
    ClaimLifecycleEngine,
    ClaimStatus,
    InvalidTransitionError,
    ClaimAuditEvent,
)


def test_valid_lifecycle_transitions():
    """Test standard legal lifecycle paths and state transitions."""
    # DRAFT -> VERIFIED
    event1 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-1",
        current_status="DRAFT",
        target_status="VERIFIED",
        eligibility_checked=True,
    )
    assert event1.previous_status == "DRAFT"
    assert event1.new_status == "VERIFIED"

    # VERIFIED -> READY_FOR_SUBMISSION
    event2 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-1",
        current_status="VERIFIED",
        target_status="READY_FOR_SUBMISSION",
        risk_score_calculated=True,
    )
    assert event2.previous_status == "VERIFIED"
    assert event2.new_status == "READY_FOR_SUBMISSION"

    # READY_FOR_SUBMISSION -> SUBMITTED
    event3 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-1",
        current_status="READY_FOR_SUBMISSION",
        target_status="SUBMITTED",
        risk_level="LOW",
    )
    assert event3.previous_status == "READY_FOR_SUBMISSION"
    assert event3.new_status == "SUBMITTED"

    # SUBMITTED -> ACCEPTED -> ADJUDICATED -> PAID
    event4 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-1",
        current_status="SUBMITTED",
        target_status="ACCEPTED",
    )
    assert event4.new_status == "ACCEPTED"

    event5 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-1",
        current_status="ACCEPTED",
        target_status="ADJUDICATED",
    )
    assert event5.new_status == "ADJUDICATED"

    event6 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-1",
        current_status="ADJUDICATED",
        target_status="PAID",
    )
    assert event6.new_status == "PAID"

    # PAID -> CLOSED
    event7 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-1",
        current_status="PAID",
        target_status="CLOSED",
    )
    assert event7.new_status == "CLOSED"


def test_denial_and_recovery_flow():
    """Test adjudication denial, revenue recovery, appeal and re-adjudication path."""
    # ADJUDICATED -> DENIED
    event1 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-2",
        current_status="ADJUDICATED",
        target_status="DENIED",
    )
    assert event1.new_status == "DENIED"

    # DENIED -> RECOVERY
    event2 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-2",
        current_status="DENIED",
        target_status="RECOVERY",
    )
    assert event2.new_status == "RECOVERY"

    # RECOVERY -> APPEAL_IN_PROGRESS
    event3 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-2",
        current_status="RECOVERY",
        target_status="APPEAL_IN_PROGRESS",
    )
    assert event3.new_status == "APPEAL_IN_PROGRESS"

    # APPEAL_IN_PROGRESS -> ADJUDICATED -> PAID
    event4 = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-TEST-2",
        current_status="APPEAL_IN_PROGRESS",
        target_status="ADJUDICATED",
    )
    assert event4.new_status == "ADJUDICATED"


def test_invalid_state_transitions():
    """Test that arbitrary status changes and illegal jumps raise InvalidTransitionError."""
    # DRAFT directly to SUBMITTED
    with pytest.raises(InvalidTransitionError) as exc_info:
        ClaimLifecycleEngine.validate_transition(
            current_status="DRAFT",
            target_status="SUBMITTED",
        )
    assert "Illegal status transition" in exc_info.value.detail["message"]

    # ADJUDICATED directly back to DRAFT
    with pytest.raises(InvalidTransitionError) as exc_info:
        ClaimLifecycleEngine.validate_transition(
            current_status="ADJUDICATED",
            target_status="DRAFT",
        )
    assert "Illegal status transition" in exc_info.value.detail["message"]

    # CLOSED to SUBMITTED
    with pytest.raises(InvalidTransitionError) as exc_info:
        ClaimLifecycleEngine.validate_transition(
            current_status="CLOSED",
            target_status="SUBMITTED",
        )
    assert "Illegal status transition" in exc_info.value.detail["message"]


def test_precondition_invariants():
    """Test state machine precondition invariant assertions."""
    # VERIFIED requires eligibility_checked=True
    with pytest.raises(InvalidTransitionError) as exc_info:
        ClaimLifecycleEngine.validate_transition(
            current_status="DRAFT",
            target_status="VERIFIED",
            eligibility_checked=False,
        )
    assert "eligibility check" in exc_info.value.detail["message"]

    # READY_FOR_SUBMISSION requires risk_score_calculated=True
    with pytest.raises(InvalidTransitionError) as exc_info:
        ClaimLifecycleEngine.validate_transition(
            current_status="VERIFIED",
            target_status="READY_FOR_SUBMISSION",
            risk_score_calculated=False,
        )
    assert "risk score calculation" in exc_info.value.detail["message"]

    # SUBMITTED blocks HIGH risk level without force_override=True
    with pytest.raises(InvalidTransitionError) as exc_info:
        ClaimLifecycleEngine.validate_transition(
            current_status="READY_FOR_SUBMISSION",
            target_status="SUBMITTED",
            risk_level="HIGH",
            force_override=False,
        )
    assert "HIGH" in exc_info.value.detail["message"]

    # SUBMITTED allows HIGH risk level with force_override=True
    assert ClaimLifecycleEngine.validate_transition(
        current_status="READY_FOR_SUBMISSION",
        target_status="SUBMITTED",
        risk_level="HIGH",
        force_override=True,
    ) is True


def test_audit_event_generation():
    """Test that transitions generate accurate audit log events."""
    event = ClaimLifecycleEngine.transition_claim(
        claim_id="CLM-AUDIT-100",
        current_status="DRAFT",
        target_status="VERIFIED",
        actor="biller_jane",
        source="claim_cockpit_ui",
        reason="Eligibility verified via 270",
        eligibility_checked=True,
    )
    assert isinstance(event, ClaimAuditEvent)
    assert event.claim_id == "CLM-AUDIT-100"
    assert event.previous_status == "DRAFT"
    assert event.new_status == "VERIFIED"
    assert event.actor == "biller_jane"
    assert event.source == "claim_cockpit_ui"
    assert event.reason == "Eligibility verified via 270"
    assert isinstance(event.timestamp, datetime)


def test_api_transition_and_history_endpoints(client):
    """Integration test for HTTP transition and audit history API endpoints."""
    claim_id = "test-api-lifecycle-01"

    # Transition DRAFT -> VERIFIED
    res = client.post(
        f"/api/v1/claims/{claim_id}/transition",
        json={
            "target_status": "VERIFIED",
            "actor": "dr_smith",
            "source": "api_test",
            "eligibility_checked": True,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["previous_status"] == "DRAFT"
    assert data["status"] == "VERIFIED"

    # Transition VERIFIED -> READY_FOR_SUBMISSION
    res2 = client.post(
        f"/api/v1/claims/{claim_id}/transition",
        json={
            "target_status": "READY_FOR_SUBMISSION",
            "actor": "dr_smith",
            "risk_score_calculated": True,
        },
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "READY_FOR_SUBMISSION"

    # Try invalid transition READY_FOR_SUBMISSION -> DRAFT is valid, but READY_FOR_SUBMISSION -> ADJUDICATED is illegal
    res_invalid = client.post(
        f"/api/v1/claims/{claim_id}/transition",
        json={
            "target_status": "ADJUDICATED",
        },
    )
    assert res_invalid.status_code == 400
    assert res_invalid.json()["detail"]["code"] == "INVALID_STATE_TRANSITION"

    # Verify audit history retrieval
    res_hist = client.get(f"/api/v1/claims/{claim_id}/history")
    assert res_hist.status_code == 200
    history = res_hist.json()
    assert len(history) == 2
    assert history[0]["previous_status"] == "DRAFT"
    assert history[0]["new_status"] == "VERIFIED"
    assert history[1]["previous_status"] == "VERIFIED"
    assert history[1]["new_status"] == "READY_FOR_SUBMISSION"
