from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from apps.api.core.database import get_db
from apps.api.schemas.canonical import AuthorizationResultSchema
from apps.api.services.authorization.engine import evaluate_claim_authorization

router = APIRouter(prefix="/claims", tags=["Authorization"])


@router.post("/{claim_id}/authorization", response_model=AuthorizationResultSchema)
def verify_claim_authorization(claim_id: str, db: Session = Depends(get_db)):
    """
    Evaluates whether billed procedures on the claim require prior authorization
    and verifies whether valid authorization exists.
    """
    result = evaluate_claim_authorization(db=db, claim_id=claim_id)
    return result
