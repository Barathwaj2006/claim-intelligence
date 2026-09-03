from typing import List, Dict, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.core.database import get_db
from apps.api.schemas.canonical import (
    RecoveryCaseSchema,
    RecoveryActionRequestSchema,
    RecoveryActionResponseSchema,
    AuditTrailEntrySchema,
    AdjudicationSchema,
    AdjudicationLineSchema,
)
from apps.api.routers.claims import get_claim_detail
from apps.api.services.recovery import create_recovery_case, process_recovery_action, generate_appeal_letter

router = APIRouter(prefix="/recovery", tags=["Revenue Recovery"])

# In-memory store for recovery cases to support dynamic workflow progression & analytics updates
_RECOVERY_CASES_DB: Dict[str, RecoveryCaseSchema] = {}


def _get_or_seed_case(case_id: str, db: Session) -> RecoveryCaseSchema:
    if case_id in _RECOVERY_CASES_DB:
        return _RECOVERY_CASES_DB[case_id]

    claim_id = case_id.replace("rec-", "")
    claim = get_claim_detail(claim_id, db)

    # Seed mock adjudication for denied claim
    mock_adj = AdjudicationSchema(
        claim_id=claim_id,
        adjudication_id=f"adj-{claim_id}",
        status="DENIED",
        billed_amount=claim.total_billed_amount,
        allowed_amount=0.00,
        contractual_adjustment=0.00,
        payer_paid_amount=0.00,
        patient_responsibility=0.00,
        lines=[
            AdjudicationLineSchema(
                claim_line_id=line.id,
                cpt_code=line.cpt_code,
                paid_amount=0.00,
                carc_code="CO-197",
                carc_description="Precertification/authorization/notification absent.",
                rarc_code="N56",
            )
            for line in claim.lines
        ],
    )

    case = create_recovery_case(claim, mock_adj)
    case.appeal_letter_markdown = generate_appeal_letter(claim, case)
    _RECOVERY_CASES_DB[case_id] = case
    return case


@router.get("/cases", response_model=List[RecoveryCaseSchema])
def list_recovery_cases(
    priority: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List prioritized revenue recovery cases sorted by revenue at risk and priority."""
    # Ensure default demo case is seeded
    demo_case_ids = ["rec-clm-002", "rec-clm-001"]
    for cid in demo_case_ids:
        _get_or_seed_case(cid, db)

    cases = list(_RECOVERY_CASES_DB.values())
    if priority:
        cases = [c for c in cases if c.priority == priority.upper()]
    if status:
        cases = [c for c in cases if c.status == status.upper()]

    # Sort by priority order (URGENT -> HIGH -> MEDIUM) and revenue at risk
    priority_order = {"URGENT": 0, "HIGH": 1, "MEDIUM": 2}
    cases.sort(key=lambda c: (priority_order.get(c.priority, 3), -c.revenue_at_risk))

    return cases[offset : offset + limit]


@router.get("/cases/{case_id}", response_model=RecoveryCaseSchema)
def get_recovery_case(case_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed record for a specific recovery case."""
    return _get_or_seed_case(case_id, db)


@router.post("/cases/{case_id}/action", response_model=RecoveryActionResponseSchema)
def execute_recovery_action(
    case_id: str,
    request: RecoveryActionRequestSchema,
    db: Session = Depends(get_db),
):
    """Process human approval and execute simulated recovery action (e.g., SUBMIT_APPEAL)."""
    case = _get_or_seed_case(case_id, db)
    claim = get_claim_detail(case.claim_id, db)

    response = process_recovery_action(case, claim, request)
    _RECOVERY_CASES_DB[case_id] = case
    return response


@router.get("/cases/{case_id}/audit-trail", response_model=List[AuditTrailEntrySchema])
def get_case_audit_trail(case_id: str, db: Session = Depends(get_db)):
    """Retrieve complete audit trail log for a recovery case."""
    case = _get_or_seed_case(case_id, db)
    return case.audit_trail
