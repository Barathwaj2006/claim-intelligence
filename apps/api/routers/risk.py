from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from apps.api.core.database import get_db
from apps.api.models.entities import Claim
from apps.api.schemas.canonical import RiskScoreSchema
from apps.api.services.risk.scorer import calculate_claim_risk_score

router = APIRouter(prefix="/claims", tags=["Risk Scoring"])


@router.post("/{claim_id}/risk-score", response_model=RiskScoreSchema)
def compute_claim_risk_score(claim_id: str, db: Session = Depends(get_db)):
    """
    Computes composite 0-100 denial risk score and individual subscores for a claim.
    Saves RiskScore entity to database.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()

    # If claim entity isn't in DB yet (e.g. mock/demo ID), create fallback dict structure
    if not claim:
        claim_data = {
            "id": claim_id,
            "status": "DRAFT",
            "service_date": "2026-08-20",
            "filing_deadline": "2026-11-20",
            "lines": [
                {
                    "id": "line-01",
                    "cpt_code": "72148",
                    "units": 1,
                    "unit_price": 2800.0,
                    "total_amount": 2800.0,
                }
            ],
            "requires_auth": True,
            "auth_status": "MISSING",
        }
        return calculate_claim_risk_score(claim_data)

    score_result = calculate_claim_risk_score(claim, db=db)
    return score_result
