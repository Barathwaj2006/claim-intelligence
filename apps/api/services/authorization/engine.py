"""
Prior Authorization Evaluation Engine.
Deterministically evaluates whether procedure lines require prior authorization and whether
an applicable, valid prior authorization exists for the claim.
"""

from datetime import date, datetime
from typing import List, Optional, Union, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from apps.api.models.entities import Claim, PriorAuthorization, Payer, ClaimLine
from apps.api.schemas.canonical import AuthorizationResultSchema
from apps.api.services.authorization.rules import cpt_requires_authorization, get_cpt_description

# Seed data claims map for fallback/demo evaluation
SEED_CLAIMS: Dict[str, Dict[str, Any]] = {
    "clm-001": {
        "id": "clm-001",
        "payer_id": "pyr-001",
        "payer_name": "Blue Cross Blue Shield",
        "service_date": date(2026, 8, 15),
        "requires_auth_for_advanced_imaging": True,
        "lines": [
            {"cpt_code": "99213", "units": 1},
            {"cpt_code": "36415", "units": 1},
        ],
        "authorizations": [],
    },
    "clm-002": {
        "id": "clm-002",
        "payer_id": "pyr-002",
        "payer_name": "UnitedHealthcare",
        "service_date": date(2026, 8, 20),
        "requires_auth_for_advanced_imaging": True,
        "lines": [
            {"cpt_code": "72148", "units": 1},
            {"cpt_code": "99214", "units": 1},
        ],
        "authorizations": [],
    },
    "clm-003": {
        "id": "clm-003",
        "payer_id": "pyr-003",
        "payer_name": "Traditional Medicare Part B",
        "service_date": date(2026, 8, 10),
        "requires_auth_for_advanced_imaging": False,
        "lines": [
            {"cpt_code": "99214", "units": 1},
        ],
        "authorizations": [],
    },
}


def evaluate_authorization_details(
    claim_id: str,
    payer_id: Optional[str],
    payer_name: Optional[str],
    requires_auth_for_imaging: bool,
    service_date: date,
    lines: List[Dict[str, Any]],
    authorizations: List[Dict[str, Any]],
) -> AuthorizationResultSchema:
    """
    Core deterministic evaluation logic taking explicit primitive structures.
    """
    cpts_requiring_auth = []
    total_billed_units_by_cpt: Dict[str, int] = {}

    for line in lines:
        cpt = line.get("cpt_code", "")
        units = line.get("units", 1)
        total_billed_units_by_cpt[cpt] = total_billed_units_by_cpt.get(cpt, 0) + units

        if cpt_requires_authorization(
            cpt_code=cpt,
            payer_id=payer_id,
            payer_name=payer_name,
            requires_auth_for_advanced_imaging=requires_auth_for_imaging,
        ):
            cpts_requiring_auth.append(cpt)

    # Deduplicate CPT codes requiring auth
    cpts_requiring_auth = sorted(list(set(cpts_requiring_auth)))

    if not cpts_requiring_auth:
        return AuthorizationResultSchema(
            claim_id=claim_id,
            requires_auth=False,
            auth_status="NOT_REQUIRED",
            authorization_number=None,
            authorized_cpt_codes=[],
            valid_through=None,
            warnings=[],
            likely_carc=None,
        )

    # If auth is required, check attached authorization records
    if not authorizations:
        cpt_list_str = ", ".join(cpts_requiring_auth)
        return AuthorizationResultSchema(
            claim_id=claim_id,
            requires_auth=True,
            auth_status="MISSING",
            authorization_number=None,
            authorized_cpt_codes=[],
            valid_through=None,
            warnings=[
                f"Missing required prior authorization for procedure code(s): {cpt_list_str} under {payer_name or 'payer policy'}."
            ],
            likely_carc="CO-197",
        )

    # Evaluate attached authorizations against required CPTs
    warnings: List[str] = []
    valid_auth_number: Optional[str] = None
    valid_cpt_codes: List[str] = []
    valid_through_date: Optional[date] = None
    overall_status = "APPROVED"

    for required_cpt in cpts_requiring_auth:
        # Find matching auth for this CPT code (or generic auth matching all)
        matching_auths = [
            auth for auth in authorizations if auth.get("cpt_code") in (required_cpt, "*", "ALL")
        ]

        if not matching_auths:
            warnings.append(f"No prior authorization record attached for procedure {required_cpt}.")
            overall_status = "MISSING"
            continue

        auth = matching_auths[0]
        auth_num = auth.get("authorization_number", "")
        auth_status = (auth.get("status") or "APPROVED").upper()
        valid_from = auth.get("valid_from")
        valid_to = auth.get("valid_to")
        approved_units = auth.get("approved_units", 1)
        billed_units = total_billed_units_by_cpt.get(required_cpt, 1)

        # 1. Check Auth Status
        if auth_status not in ("APPROVED", "ACTIVE", "VALID"):
            warnings.append(
                f"Prior authorization {auth_num} for CPT {required_cpt} has invalid status '{auth_status}'."
            )
            overall_status = "INVALID"
            continue

        # 2. Check Validity Window
        if valid_to and service_date > valid_to:
            warnings.append(
                f"Prior authorization {auth_num} expired on {valid_to.isoformat()} prior to service date {service_date.isoformat()}."
            )
            overall_status = "EXPIRED"
            continue

        if valid_from and service_date < valid_from:
            warnings.append(
                f"Service date {service_date.isoformat()} is prior to authorization start date {valid_from.isoformat()}."
            )
            overall_status = "INVALID"
            continue

        # 3. Check Units
        if approved_units < billed_units:
            warnings.append(
                f"Billed units ({billed_units}) exceed approved authorization units ({approved_units}) for procedure {required_cpt}."
            )
            overall_status = "INVALID"
            continue

        valid_auth_number = auth_num
        valid_cpt_codes.append(required_cpt)
        if valid_to and (valid_through_date is None or valid_to > valid_through_date):
            valid_through_date = valid_to

    likely_carc = "CO-197" if overall_status in ("MISSING", "EXPIRED", "INVALID") else None

    return AuthorizationResultSchema(
        claim_id=claim_id,
        requires_auth=True,
        auth_status=overall_status,
        authorization_number=valid_auth_number if overall_status == "APPROVED" else None,
        authorized_cpt_codes=valid_cpt_codes if overall_status == "APPROVED" else [],
        valid_through=valid_through_date if overall_status == "APPROVED" else None,
        warnings=warnings,
        likely_carc=likely_carc,
    )


def evaluate_claim_authorization(db: Optional[Session], claim_id: str) -> AuthorizationResultSchema:
    """
    Evaluates prior authorization compliance for a given claim ID from the database,
    falling back to seeded claims if not found in database or if DB tables are uninitialized.
    """
    claim: Optional[Claim] = None
    if db is not None:
        try:
            claim = db.query(Claim).filter(Claim.id == claim_id).first()
        except Exception:
            claim = None

    if claim:
        payer = claim.payer
        payer_id = claim.payer_id
        payer_name = payer.name if payer else "Unknown Payer"
        requires_auth_for_imaging = payer.requires_auth_for_advanced_imaging if payer else True

        lines = [
            {"cpt_code": line.cpt_code, "units": line.units}
            for line in claim.lines
        ]

        authorizations = [
            {
                "authorization_number": auth.authorization_number,
                "cpt_code": auth.cpt_code,
                "status": auth.status,
                "approved_units": auth.approved_units,
                "valid_from": auth.valid_from,
                "valid_to": auth.valid_to,
            }
            for auth in claim.authorizations
        ]

        return evaluate_authorization_details(
            claim_id=claim.id,
            payer_id=payer_id,
            payer_name=payer_name,
            requires_auth_for_imaging=requires_auth_for_imaging,
            service_date=claim.service_date,
            lines=lines,
            authorizations=authorizations,
        )

    # Fallback to seed claims
    if claim_id in SEED_CLAIMS:
        seed = SEED_CLAIMS[claim_id]
        return evaluate_authorization_details(
            claim_id=seed["id"],
            payer_id=seed["payer_id"],
            payer_name=seed["payer_name"],
            requires_auth_for_imaging=seed["requires_auth_for_advanced_imaging"],
            service_date=seed["service_date"],
            lines=seed["lines"],
            authorizations=seed["authorizations"],
        )

    # If claim not found at all, return default response
    return AuthorizationResultSchema(
        claim_id=claim_id,
        requires_auth=False,
        auth_status="NOT_REQUIRED",
        warnings=[f"Claim {claim_id} not found."],
    )
