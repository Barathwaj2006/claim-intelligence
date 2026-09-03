from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.core.database import get_db
from apps.api.schemas.canonical import (
    RecoveryCaseSchema,
    TransitionRequestSchema,
    OutcomeRequestSchema,
    AppealResponseSchema,
    RecoveryAnalyticsSchema,
)
from apps.api.services.recovery import (
    evaluate_recovery_opportunity,
    generate_appeal_dossier,
    transition_case_state,
    record_simulated_outcome,
)

router = APIRouter(prefix="/recovery", tags=["Revenue Recovery"])

# In-memory store for active recovery cases during runtime / demo session
_RECOVERY_CASES_DB: Dict[str, Dict[str, Any]] = {}


def _init_seed_cases():
    if _RECOVERY_CASES_DB:
        return

    today = date.today()
    seed_data = [
        {
            "id": "rec-001",
            "claim_id": "clm-001",
            "claim_number": "CLM-2026-00088",
            "patient_name": "Robert Langdon",
            "patient_dob": "1982-11-04",
            "member_id": "BCBS-44910283",
            "payer_name": "Blue Cross Blue Shield",
            "adjudication_id": "adj-101",
            "service_date": "2026-08-12",
            "billed_amount": 4850.00,
            "paid_amount": 0.00,
            "denial_carc": "CO-197",
            "denial_reason": "Prior authorization absent or unapproved (Knee Arthroscopy 29881)",
            "cpt_codes": ["29881"],
            "filing_deadline": today + timedelta(days=12),
            "has_evidence": True,
            "status": "ACTION_REQUIRED",
        },
        {
            "id": "rec-002",
            "claim_id": "clm-002",
            "claim_number": "CLM-2026-00074",
            "patient_name": "Linda Kowalski",
            "patient_dob": "1975-06-22",
            "member_id": "UHC-99210488",
            "payer_name": "UnitedHealthcare",
            "adjudication_id": "adj-102",
            "service_date": "2026-08-15",
            "billed_amount": 1920.00,
            "paid_amount": 0.00,
            "denial_carc": "CO-16",
            "denial_reason": "Member ID format mismatch on electronic submission",
            "cpt_codes": ["99214", "72148"],
            "filing_deadline": today + timedelta(days=45),
            "has_evidence": True,
            "status": "IDENTIFIED",
        },
        {
            "id": "rec-003",
            "claim_id": "clm-003",
            "claim_number": "CLM-2026-00062",
            "patient_name": "Thomas Anderson",
            "patient_dob": "1980-03-11",
            "member_id": "AET-7718290",
            "payer_name": "Aetna Health",
            "adjudication_id": "adj-103",
            "service_date": "2026-08-10",
            "billed_amount": 1250.00,
            "paid_amount": 400.00,
            "denial_carc": "CO-45",
            "denial_reason": "Underpayment discrepancy vs contracted fee schedule",
            "cpt_codes": ["99215"],
            "filing_deadline": today + timedelta(days=60),
            "has_evidence": True,
            "status": "ANALYZING",
        },
    ]

    for item in seed_data:
        eval_res = evaluate_recovery_opportunity(
            billed_amount=item["billed_amount"],
            paid_amount=item["paid_amount"],
            carc_code=item["denial_carc"],
            carc_description=item["denial_reason"],
            filing_deadline=item["filing_deadline"],
            has_evidence=item["has_evidence"],
        )

        now_str = datetime.utcnow().isoformat() + "Z"
        case_record = {
            "id": item["id"],
            "claim_id": item["claim_id"],
            "claim_number": item["claim_number"],
            "patient_name": item["patient_name"],
            "patient_dob": item["patient_dob"],
            "member_id": item["member_id"],
            "payer_name": item["payer_name"],
            "adjudication_id": item["adjudication_id"],
            "service_date": item["service_date"],
            "denial_carc": item["denial_carc"],
            "denial_reason": item["denial_reason"],
            "cpt_codes": item["cpt_codes"],
            "revenue_at_risk": eval_res["revenue_at_risk"],
            "expected_recovery_value": eval_res["expected_recovery"],
            "recovered_amount": 0.0,
            "remaining_amount": eval_res["revenue_at_risk"],
            "recoverability_score": eval_res["recoverability_score"],
            "priority": eval_res["priority"],
            "status": item["status"],
            "recommended_action": eval_res["recommended_action"],
            "explanation_why": eval_res["explanation_why"],
            "filing_deadline": item["filing_deadline"],
            "days_remaining": eval_res["days_remaining"],
            "evidence": eval_res["evidence"],
            "audit_trail": [
                {
                    "timestamp": now_str,
                    "action": "RECOVERY_CASE_CREATED",
                    "actor": "System Engine",
                    "from_status": "NONE",
                    "to_status": item["status"],
                    "notes": f"Converted {item['denial_carc']} denial into structured recovery opportunity",
                }
            ],
        }
        _RECOVERY_CASES_DB[item["id"]] = case_record


@router.get("/cases", response_model=List[RecoveryCaseSchema])
def list_recovery_cases(
    priority: Optional[str] = None,
    status: Optional[str] = None,
    payer: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List recovery cases sorted by revenue at risk and priority."""
    _init_seed_cases()
    cases = list(_RECOVERY_CASES_DB.values())

    if priority:
        cases = [c for c in cases if c["priority"].upper() == priority.upper()]
    if status:
        cases = [c for c in cases if c["status"].upper() == status.upper()]
    if payer:
        cases = [c for c in cases if payer.lower() in c["payer_name"].lower()]

    # Sort by revenue at risk descending
    cases.sort(key=lambda x: x["revenue_at_risk"], reverse=True)
    return cases


@router.get("/cases/{case_id}", response_model=RecoveryCaseSchema)
def get_recovery_case(case_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed recovery case record."""
    _init_seed_cases()
    if case_id not in _RECOVERY_CASES_DB:
        raise HTTPException(status_code=404, detail=f"Recovery case {case_id} not found")
    return _RECOVERY_CASES_DB[case_id]


@router.post("/ingest/{claim_id}", response_model=RecoveryCaseSchema)
def ingest_claim_into_recovery(
    claim_id: str,
    carc_code: str = "CO-197",
    carc_description: str = "Prior authorization absent or unapproved",
    billed_amount: float = 3500.00,
    paid_amount: float = 0.00,
    patient_name: str = "Synthetic Patient",
    payer_name: str = "Blue Cross Blue Shield",
    db: Session = Depends(get_db),
):
    """Convert a claim outcome into a structured recovery opportunity."""
    _init_seed_cases()
    case_id = f"rec-{len(_RECOVERY_CASES_DB) + 1:03d}"
    today = date.today()
    filing_deadline = today + timedelta(days=60)

    eval_res = evaluate_recovery_opportunity(
        billed_amount=billed_amount,
        paid_amount=paid_amount,
        carc_code=carc_code,
        carc_description=carc_description,
        filing_deadline=filing_deadline,
        has_evidence=True,
    )

    now_str = datetime.utcnow().isoformat() + "Z"
    case_record = {
        "id": case_id,
        "claim_id": claim_id,
        "claim_number": f"CLM-{claim_id[:8].upper()}",
        "patient_name": patient_name,
        "patient_dob": "1985-05-15",
        "member_id": "SYN-1029384",
        "payer_name": payer_name,
        "adjudication_id": f"adj-{claim_id[:6]}",
        "service_date": today.strftime("%Y-%m-%d"),
        "denial_carc": carc_code,
        "denial_reason": carc_description,
        "cpt_codes": ["72148"],
        "revenue_at_risk": eval_res["revenue_at_risk"],
        "expected_recovery_value": eval_res["expected_recovery"],
        "recovered_amount": 0.0,
        "remaining_amount": eval_res["revenue_at_risk"],
        "recoverability_score": eval_res["recoverability_score"],
        "priority": eval_res["priority"],
        "status": "IDENTIFIED",
        "recommended_action": eval_res["recommended_action"],
        "explanation_why": eval_res["explanation_why"],
        "filing_deadline": filing_deadline,
        "days_remaining": eval_res["days_remaining"],
        "evidence": eval_res["evidence"],
        "audit_trail": [
            {
                "timestamp": now_str,
                "action": "RECOVERY_CASE_CREATED",
                "actor": "System Engine",
                "from_status": "NONE",
                "to_status": "IDENTIFIED",
                "notes": f"Ingested {carc_code} denial for claim {claim_id}",
            }
        ],
    }

    _RECOVERY_CASES_DB[case_id] = case_record
    return case_record


@router.post("/cases/{case_id}/appeal", response_model=AppealResponseSchema)
def generate_appeal_for_case(case_id: str, db: Session = Depends(get_db)):
    """Generate professional clinical appeal dossier."""
    _init_seed_cases()
    if case_id not in _RECOVERY_CASES_DB:
        raise HTTPException(status_code=404, detail=f"Recovery case {case_id} not found")

    case = _RECOVERY_CASES_DB[case_id]
    dossier = generate_appeal_dossier(
        claim_id=case["claim_id"],
        claim_number=case["claim_number"],
        patient_name=case["patient_name"],
        member_id=case.get("member_id", "SYN-998811"),
        patient_dob=case.get("patient_dob", "1980-01-01"),
        payer_name=case["payer_name"],
        service_date=str(case.get("service_date", date.today())),
        billed_amount=case["revenue_at_risk"],
        carc_code=case["denial_carc"],
        carc_description=case["denial_reason"],
        recommended_action=case["recommended_action"],
        cpt_codes=case.get("cpt_codes", ["72148"]),
    )

    # Append audit trail event if not already generated
    now_str = datetime.utcnow().isoformat() + "Z"
    case["audit_trail"].append(
        {
            "timestamp": now_str,
            "action": "APPEAL_DOSSIER_GENERATED",
            "actor": "Human User / Appeal Engine",
            "from_status": case["status"],
            "to_status": case["status"],
            "notes": f"Generated formal {dossier['document_type']} dossier for payer submission",
        }
    )

    return AppealResponseSchema(
        case_id=case_id,
        document_type=dossier["document_type"],
        subject=dossier["subject"],
        content=dossier["content"],
        created_at=dossier["created_at"],
    )


@router.post("/cases/{case_id}/transition", response_model=RecoveryCaseSchema)
def transition_case_workflow_state(
    case_id: str,
    payload: TransitionRequestSchema,
    db: Session = Depends(get_db),
):
    """Human approval boundary: Transition recovery workflow state."""
    _init_seed_cases()
    if case_id not in _RECOVERY_CASES_DB:
        raise HTTPException(status_code=404, detail=f"Recovery case {case_id} not found")

    case = _RECOVERY_CASES_DB[case_id]
    try:
        transition_res = transition_case_state(
            current_status=case["status"],
            target_status=payload.status,
            actor=payload.actor or "Human User",
            notes=payload.notes,
            audit_trail=case["audit_trail"],
        )
        case["status"] = transition_res["status"]
        case["audit_trail"] = transition_res["audit_trail"]
        return case
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.post("/cases/{case_id}/outcome", response_model=RecoveryCaseSchema)
def record_simulated_recovery_action(
    case_id: str,
    payload: OutcomeRequestSchema,
    db: Session = Depends(get_db),
):
    """Simulate recovery action outcome (record recovered amount & update remaining balance)."""
    _init_seed_cases()
    if case_id not in _RECOVERY_CASES_DB:
        raise HTTPException(status_code=404, detail=f"Recovery case {case_id} not found")

    case = _RECOVERY_CASES_DB[case_id]
    outcome_res = record_simulated_outcome(
        revenue_at_risk=case["revenue_at_risk"],
        recovered_amount=payload.recovered_amount,
        notes=payload.notes,
        current_audit_trail=case["audit_trail"],
        actor="Human Reviewer (Simulated Recovery)",
    )

    case["recovered_amount"] = outcome_res["recovered_amount"]
    case["remaining_amount"] = outcome_res["remaining_amount"]
    case["status"] = payload.status or outcome_res["status"]
    case["audit_trail"] = outcome_res["audit_trail"]

    return case


@router.get("/analytics", response_model=RecoveryAnalyticsSchema)
def get_recovery_analytics(db: Session = Depends(get_db)):
    """Retrieve aggregate analytics for the revenue recovery pipeline."""
    _init_seed_cases()
    cases = list(_RECOVERY_CASES_DB.values())

    total_at_risk = sum(c["revenue_at_risk"] for c in cases)
    expected_value = sum(c["expected_recovery_value"] for c in cases)
    recovered_amount = sum(c["recovered_amount"] for c in cases)

    priority_counts = {"URGENT": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    status_counts = {}

    for c in cases:
        p = c["priority"].upper()
        if p in priority_counts:
            priority_counts[p] += 1
        s = c["status"].upper()
        status_counts[s] = status_counts.get(s, 0) + 1

    recovery_rate = (recovered_amount / total_at_risk * 100.0) if total_at_risk > 0 else 0.0

    return RecoveryAnalyticsSchema(
        total_cases=len(cases),
        total_revenue_at_risk=round(total_at_risk, 2),
        expected_recoverable_value=round(expected_value, 2),
        total_recovered_amount=round(recovered_amount, 2),
        recovery_rate_percentage=round(recovery_rate, 1),
        priority_breakdown=priority_counts,
        status_breakdown=status_counts,
    )
