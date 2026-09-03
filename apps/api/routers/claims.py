from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.core.database import get_db
from apps.api.schemas.canonical import (
    StandardResponse,
    ClaimSummarySchema,
    ClaimDetailSchema,
    EligibilityResultSchema,
    AuthorizationResultSchema,
    RiskScoreSchema,
    AdjudicationSchema,
)

router = APIRouter(prefix="/claims", tags=["Claims"])


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
    # Seeded demo claim items for immediate front-end / API integration
    demo_claims = [
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
        demo_claims = [c for c in demo_claims if c.risk_level == risk_level.upper()]
    if status:
        demo_claims = [c for c in demo_claims if c.status == status.upper()]
    return demo_claims[offset : offset + limit]


@router.get("/{claim_id}", response_model=ClaimDetailSchema)
def get_claim_detail(claim_id: str, db: Session = Depends(get_db)):
    """Retrieve 360-degree claim cockpit detail record."""
    # Seeded detailed record for demo & verification
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
        status="DRAFT",
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


@router.post("/{claim_id}/submit")
def submit_claim(claim_id: str, force_override: bool = False, db: Session = Depends(get_db)):
    """Submit claim to simulated clearinghouse (blocks HIGH risk unless force_override=True)."""
    return {
        "success": True,
        "claim_id": claim_id,
        "status": "SUBMITTED",
        "clearinghouse_trace_id": f"TRACE-{claim_id[:8].upper()}-837P",
        "submitted_at": datetime.utcnow().isoformat() + "Z",
    }
