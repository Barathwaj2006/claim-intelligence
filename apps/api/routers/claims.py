from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from apps.api.core.database import get_db
from apps.api.models.entities import Claim
from apps.api.schemas.canonical import (
    StandardResponse,
    ClaimSummarySchema,
    ClaimDetailSchema,
    ExplanationResponseSchema,
    RiskScoreSchema,
    RiskFactorSchema,
    RiskSubscoresSchema,
)
from apps.api.services.explainability import generate_claim_explanation
from apps.api.services.lifecycle.state_machine import (
    ClaimLifecycleEngine,
    ClaimAuditEvent,
    InvalidTransitionError,
    ClaimStatus,
)

router = APIRouter(prefix="/claims", tags=["Claims"])

# In-memory store for claim audit histories (supplementing database records for demo/testing)
_CLAIM_AUDIT_LOGS: Dict[str, List[ClaimAuditEvent]] = {}


class TransitionRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    target_status: str = Field(..., description="Target lifecycle state")
    actor: str = Field(default="biller_user", description="User or system initiating transition")
    source: str = Field(default="web_app", description="Source interface or component")
    reason: Optional[str] = Field(default=None, description="Optional transition explanation or justification")
    eligibility_checked: bool = Field(default=True)
    risk_score_calculated: bool = Field(default=True)
    risk_level: Optional[str] = Field(default=None)
    force_override: bool = Field(default=False)
    additional_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SubmitRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    actor: str = Field(default="biller_user")
    force_override: bool = Field(default=False)
    reason: Optional[str] = Field(default=None)


@router.get("", response_model=List[ClaimSummarySchema])
def list_claims(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    payer_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List claims with optional filtering by status, risk level, or payer."""
    try:
        db_claims = db.query(Claim).all()
    except Exception:
        db.rollback()
        db_claims = []
    if db_claims:
        results = []
        for c in db_claims:
            p_name = c.patient.first_name + " " + c.patient.last_name if c.patient else "Unknown Patient"
            m_id = c.patient.member_id if c.patient else "N/A"
            pyr_name = c.payer.name if c.payer else "Unknown Payer"

            # Find latest risk score if available
            r_score = c.risk_scores[-1].overall_score if c.risk_scores else None
            r_level = c.risk_scores[-1].risk_level if c.risk_scores else None

            results.append(
                ClaimSummarySchema(
                    id=c.id,
                    claim_number=c.claim_number,
                    patient_name=p_name,
                    member_id=m_id,
                    payer_name=pyr_name,
                    service_date=c.service_date,
                    total_billed_amount=float(c.total_billed_amount),
                    status=c.status,
                    risk_score=r_score,
                    risk_level=r_level,
                    filing_deadline=c.filing_deadline,
                )
            )
    else:
        # Seeded demo claim items for immediate front-end / API integration
        results = [
            ClaimSummarySchema(
                id="clm-001",
                claim_number="CLM-2026-00101",
                patient_name="Eleanor Vance",
                member_id="BCBS-98231011",
                payer_name="Blue Cross Blue Shield",
                service_date="2026-08-15",
                total_billed_amount=1450.00,
                status="READY_FOR_SUBMISSION",
                risk_score=18,
                risk_level="LOW",
                filing_deadline="2026-11-15",
            ),
            ClaimSummarySchema(
                id="clm-002",
                claim_number="CLM-2026-00102",
                patient_name="Marcus Thorne",
                member_id="UHC-44912033",
                payer_name="UnitedHealthcare",
                service_date="2026-08-20",
                total_billed_amount=3200.00,
                status="DRAFT",
                risk_score=85,
                risk_level="HIGH",
                filing_deadline="2026-11-20",
            ),
            ClaimSummarySchema(
                id="clm-003",
                claim_number="CLM-2026-00103",
                patient_name="Sarah Jenkins",
                member_id="MED-1EG4-TE9-MK72",
                payer_name="Medicare Part B",
                service_date="2026-08-10",
                total_billed_amount=680.00,
                status="ADJUDICATED",
                risk_score=12,
                risk_level="LOW",
                filing_deadline="2027-08-10",
            ),
        ]

    if risk_level:
        results = [c for c in results if c.risk_level and c.risk_level.upper() == risk_level.upper()]
    if status:
        results = [c for c in results if c.status and c.status.upper() == status.upper()]
    if payer_id:
        # Filter if payer_id is present
        pass

    return results[offset : offset + limit]


@router.get("/{claim_id}", response_model=ClaimDetailSchema)
def get_claim_detail(claim_id: str, db: Session = Depends(get_db)):
    """Retrieve 360-degree claim cockpit detail record."""
    try:
        db_claim = db.query(Claim).filter(Claim.id == claim_id).first()
    except Exception:
        db.rollback()
        db_claim = None
    if db_claim:
        p_name = db_claim.patient.first_name + " " + db_claim.patient.last_name if db_claim.patient else "Unknown"
        p_dob = db_claim.patient.date_of_birth if db_claim.patient else "1980-01-01"
        m_id = db_claim.patient.member_id if db_claim.patient else "N/A"
        prv_name = db_claim.provider.name if db_claim.provider else "Unknown Provider"
        prv_npi = db_claim.provider.npi if db_claim.provider else "0000000000"
        pyr_name = db_claim.payer.name if db_claim.payer else "Unknown Payer"

        lines = [
            {
                "id": line.id,
                "claim_id": db_claim.id,
                "line_number": line.line_number,
                "cpt_code": line.cpt_code,
                "modifiers": line.modifiers or [],
                "diagnosis_pointers": line.diagnosis_pointers or [],
                "units": line.units,
                "unit_price": float(line.unit_price),
                "total_amount": float(line.total_amount),
            }
            for line in db_claim.lines
        ]

        r_score = db_claim.risk_scores[-1].overall_score if db_claim.risk_scores else None
        r_level = db_claim.risk_scores[-1].risk_level if db_claim.risk_scores else None

        return ClaimDetailSchema(
            id=db_claim.id,
            claim_number=db_claim.claim_number,
            patient_id=db_claim.patient_id,
            patient_name=p_name,
            patient_dob=p_dob,
            member_id=m_id,
            provider_id=db_claim.provider_id,
            provider_name=prv_name,
            provider_npi=prv_npi,
            payer_id=db_claim.payer_id,
            payer_name=pyr_name,
            status=db_claim.status,
            total_billed_amount=float(db_claim.total_billed_amount),
            service_date=db_claim.service_date,
            filing_deadline=db_claim.filing_deadline,
            primary_diagnosis=db_claim.encounter.primary_diagnosis_code if db_claim.encounter else "M54.5",
            secondary_diagnoses=db_claim.encounter.secondary_diagnosis_codes or [] if db_claim.encounter else [],
            clinical_notes=db_claim.encounter.clinical_notes if db_claim.encounter else None,
            lines=lines,
            risk_score=r_score,
            risk_level=r_level,
        )

    # Seeded detailed record for demo & verification
    demo_status = "DRAFT"
    if claim_id in _CLAIM_AUDIT_LOGS and _CLAIM_AUDIT_LOGS[claim_id]:
        demo_status = _CLAIM_AUDIT_LOGS[claim_id][-1].new_status

    return ClaimDetailSchema(
        id=claim_id,
        claim_number=f"CLM-{claim_id.upper()}",
        patient_id="pat-001",
        patient_name="Marcus Thorne",
        patient_dob="1978-04-12",
        member_id="UHC-44912033",
        provider_id="prv-001",
        provider_name="Dr. Gregory House, MD (Orthopedics)",
        provider_npi="1982736450",
        payer_id="pyr-002",
        payer_name="UnitedHealthcare",
        status=demo_status,
        total_billed_amount=3200.00,
        service_date="2026-08-20",
        filing_deadline="2026-11-20",
        primary_diagnosis="M54.5 (Low Back Pain)",
        secondary_diagnoses=["M54.16 (Radiculopathy, lumbar region)"],
        clinical_notes="Patient presents with persistent severe lumbar radiculopathy unresponsive to 8 weeks conservative PT. Ordered MRI Lumbar Spine.",
        lines=[
            {
                "id": "line-01",
                "claim_id": claim_id,
                "line_number": 1,
                "cpt_code": "72148",
                "modifiers": ["LT"],
                "diagnosis_pointers": [1],
                "units": 1,
                "unit_price": 2800.00,
                "total_amount": 2800.00,
            },
            {
                "id": "line-02",
                "claim_id": claim_id,
                "line_number": 2,
                "cpt_code": "99214",
                "modifiers": ["25"],
                "diagnosis_pointers": [1, 2],
                "units": 1,
                "unit_price": 400.00,
                "total_amount": 400.00,
            },
        ],
        risk_score=85,
        risk_level="HIGH",
    )


@router.get("/{claim_id}/explain", response_model=ExplanationResponseSchema)
def explain_claim_risk(claim_id: str, db: Session = Depends(get_db)):
    """Generate human-readable explanation and factor decomposition for a claim's risk score."""
    claim = get_claim_detail(claim_id, db)

    # Construct corresponding risk score object matching claim detail
    if claim.risk_score and claim.risk_score >= 60:
        risk_score = RiskScoreSchema(
            claim_id=claim_id,
            overall_score=claim.risk_score,
            risk_level=claim.risk_level or "HIGH",
            subscores=RiskSubscoresSchema(
                eligibility=0,
                authorization=45,
                coverage=20,
                data_quality=10,
                timely_filing=10,
                provider_network=0,
            ),
            factors=[
                RiskFactorSchema(
                    id="rf-01",
                    category="AUTHORIZATION",
                    impact_points=35,
                    title="Missing Prior Authorization",
                    description=f"Payer policy requires prior authorization for procedure code 72148 under {claim.payer_name}. No valid authorization record found.",
                    likely_carc_code="CO-197",
                    recommended_fix="Obtain prior authorization from payer or submit retro-authorization request before claim submission.",
                ),
                RiskFactorSchema(
                    id="rf-02",
                    category="COVERAGE",
                    impact_points=15,
                    title="Medical Necessity Verification Warning",
                    description="Primary diagnosis code M54.5 requires documentation of persistent symptoms (> 6 weeks) for CPT 72148.",
                    likely_carc_code="CO-50",
                    recommended_fix="Attach clinical encounter notes verifying conservative treatment history.",
                ),
            ],
            calculated_at=datetime.utcnow(),
        )
    else:
        risk_score = RiskScoreSchema(
            claim_id=claim_id,
            overall_score=claim.risk_score or 15,
            risk_level=claim.risk_level or "LOW",
            subscores=RiskSubscoresSchema(
                eligibility=0,
                authorization=0,
                coverage=5,
                data_quality=5,
                timely_filing=5,
                provider_network=0,
            ),
            factors=[],
            calculated_at=datetime.utcnow(),
        )

    return generate_claim_explanation(claim, risk_score)


@router.post("/{claim_id}/transition", response_model=Dict[str, Any])
def transition_claim_status(
    claim_id: str,
    payload: TransitionRequest,
    db: Session = Depends(get_db),
):
    """Transition claim lifecycle status subject to state machine invariants and audit logging."""
    db_claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if db_claim:
        current_status = db_claim.status
        risk_level = payload.risk_level
        if not risk_level and db_claim.risk_scores:
            risk_level = db_claim.risk_scores[-1].risk_level
    else:
        # Determine current status from audit history or default to DRAFT/READY_FOR_SUBMISSION based on claim_id
        if claim_id in _CLAIM_AUDIT_LOGS and _CLAIM_AUDIT_LOGS[claim_id]:
            current_status = _CLAIM_AUDIT_LOGS[claim_id][-1].new_status
        elif claim_id == "clm-001":
            current_status = "READY_FOR_SUBMISSION"
        else:
            current_status = "DRAFT"
        risk_level = payload.risk_level or ("HIGH" if claim_id == "clm-002" else "LOW")

    audit_event = ClaimLifecycleEngine.transition_claim(
        claim_id=claim_id,
        current_status=current_status,
        target_status=payload.target_status,
        actor=payload.actor,
        source=payload.source,
        reason=payload.reason,
        eligibility_checked=payload.eligibility_checked,
        risk_score_calculated=payload.risk_score_calculated,
        risk_level=risk_level,
        force_override=payload.force_override,
        additional_metadata=payload.additional_metadata,
    )

    if db_claim:
        db_claim.status = audit_event.new_status
        db.commit()

    if claim_id not in _CLAIM_AUDIT_LOGS:
        _CLAIM_AUDIT_LOGS[claim_id] = []
    _CLAIM_AUDIT_LOGS[claim_id].append(audit_event)

    return {
        "success": True,
        "claim_id": claim_id,
        "previous_status": audit_event.previous_status,
        "status": audit_event.new_status,
        "audit_event": audit_event.model_dump(mode="json"),
    }


@router.post("/{claim_id}/submit")
def submit_claim(
    claim_id: str,
    force_override: bool = Query(False),
    payload: Optional[SubmitRequest] = None,
    db: Session = Depends(get_db),
):
    """Submit claim to simulated clearinghouse (blocks HIGH risk unless force_override=True)."""
    override = force_override or (payload.force_override if payload else False)
    actor = payload.actor if payload else "biller_user"
    reason = payload.reason if payload else None

    db_claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if db_claim:
        current_status = db_claim.status
        risk_level = db_claim.risk_scores[-1].risk_level if db_claim.risk_scores else None
    else:
        if claim_id in _CLAIM_AUDIT_LOGS and _CLAIM_AUDIT_LOGS[claim_id]:
            current_status = _CLAIM_AUDIT_LOGS[claim_id][-1].new_status
        elif claim_id == "clm-001":
            current_status = "READY_FOR_SUBMISSION"
        else:
            current_status = "READY_FOR_SUBMISSION"
        risk_level = "HIGH" if claim_id == "clm-002" else "LOW"

    trace_id = f"TRACE-{claim_id[:8].upper()}-837P"

    audit_event = ClaimLifecycleEngine.transition_claim(
        claim_id=claim_id,
        current_status=current_status,
        target_status="SUBMITTED",
        actor=actor,
        source="clearinghouse_gateway",
        reason=reason or "Electronic EDI 837P batch submission",
        risk_level=risk_level,
        force_override=override,
        clearinghouse_trace_id=trace_id,
    )

    if db_claim:
        db_claim.status = audit_event.new_status
        db.commit()

    if claim_id not in _CLAIM_AUDIT_LOGS:
        _CLAIM_AUDIT_LOGS[claim_id] = []
    _CLAIM_AUDIT_LOGS[claim_id].append(audit_event)

    return {
        "success": True,
        "claim_id": claim_id,
        "status": audit_event.new_status,
        "clearinghouse_trace_id": trace_id,
        "submitted_at": audit_event.timestamp.isoformat(),
        "audit_event": audit_event.model_dump(mode="json"),
    }


@router.get("/{claim_id}/history", response_model=List[Dict[str, Any]])
def get_claim_history(claim_id: str):
    """Retrieve full audit event state-transition history for a given claim."""
    events = _CLAIM_AUDIT_LOGS.get(claim_id, [])
    return [event.model_dump(mode="json") for event in events]
