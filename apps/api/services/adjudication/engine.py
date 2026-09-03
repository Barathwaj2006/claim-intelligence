import json
import os
from datetime import datetime, date
from typing import Dict, Any, List, Optional


def load_adjudication_rules() -> Dict[str, Any]:
    """Load payer adjudication rules configuration from seed JSON file."""
    rule_file = os.path.join(
        os.path.dirname(__file__), "../../../../data/seed/adjudication_rules.json"
    )
    if os.path.exists(rule_file):
        try:
            with open(rule_file, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "auth_required_codes": ["72148", "70553", "93306", "27447"],
        "default_timely_filing_days": 90,
        "fee_schedules": {
            "72148": 750.00,
            "99214": 250.00,
            "99213": 150.00,
            "36415": 15.00,
        },
    }


def adjudicate_claim(
    claim: Any,
    adjudication_date: Optional[date] = None,
    force_underpaid: bool = False,
) -> Dict[str, Any]:
    """
    Deterministic Payer Adjudication Engine.

    Evaluates claims against payer rules and outputs financial adjudication results:
    - Status: PAID, PARTIALLY_PAID, DENIED, REJECTED, PENDED, UNDERPAID
    - Billed Amount
    - Allowed Amount
    - Contractual Adjustment
    - Payer Paid Amount
    - Patient Responsibility
    - Line-level CARC / RARC details
    """
    if adjudication_date is None:
        adjudication_date = date.today()

    rules = load_adjudication_rules()
    auth_required_codes = set(rules.get("auth_required_codes", ["72148", "70553", "93306", "27447"]))
    carc_defs = rules.get("carc_definitions", {})

    # Extract claim properties (supporting both SQLAlchemy object & dict/Pydantic)
    if isinstance(claim, dict):
        claim_id = claim.get("id", "claim-id")
        claim_number = claim.get("claim_number", "")
        service_date = claim.get("service_date")
        if isinstance(service_date, str):
            service_date = date.fromisoformat(service_date)
        total_billed = float(claim.get("total_billed_amount", 0.0))
        lines_raw = claim.get("lines", [])
        authorizations_raw = claim.get("authorizations", [])
        payer_obj = claim.get("payer", {})
        if isinstance(payer_obj, dict):
            timely_filing_days = payer_obj.get("timely_filing_days", 90)
        else:
            timely_filing_days = getattr(payer_obj, "timely_filing_days", 90)
        is_underpay_demo = claim.get("is_underpaid", False) or force_underpaid
    else:
        claim_id = getattr(claim, "id", "claim-id")
        claim_number = getattr(claim, "claim_number", "")
        service_date = getattr(claim, "service_date", date.today())
        total_billed = float(getattr(claim, "total_billed_amount", 0.0))
        lines_raw = getattr(claim, "lines", [])
        authorizations_raw = getattr(claim, "authorizations", [])
        payer = getattr(claim, "payer", None)
        timely_filing_days = getattr(payer, "timely_filing_days", 90) if payer else 90
        is_underpay_demo = force_underpaid or getattr(claim, "is_underpaid", False)

    if claim_number in ["CLM-UNDERPAY-001", "CLM-2026-003", "CLM-UNDERPAID"]:
        is_underpay_demo = True

    # Parse authorizations
    approved_auth_cpts = set()
    for auth in authorizations_raw:
        if isinstance(auth, dict):
            cpt = auth.get("cpt_code")
            status = auth.get("status", "")
        else:
            cpt = getattr(auth, "cpt_code", None)
            status = getattr(auth, "status", "")
        if cpt and status.upper() == "APPROVED":
            approved_auth_cpts.add(cpt)

    # Process claim lines
    parsed_lines = []
    for line in lines_raw:
        if isinstance(line, dict):
            parsed_lines.append({
                "id": line.get("id", "line-id"),
                "cpt_code": line.get("cpt_code", ""),
                "units": int(line.get("units", 1)),
                "unit_price": float(line.get("unit_price", 0.0)),
                "total_amount": float(line.get("total_amount", 0.0)),
            })
        else:
            parsed_lines.append({
                "id": getattr(line, "id", "line-id"),
                "cpt_code": getattr(line, "cpt_code", ""),
                "units": int(getattr(line, "units", 1)),
                "unit_price": float(getattr(line, "unit_price", 0.0)),
                "total_amount": float(getattr(line, "total_amount", 0.0)),
            })

    # Rule Check 1: Missing Prior Auth
    missing_auth_lines = []
    for line in parsed_lines:
        cpt = line["cpt_code"]
        if cpt in auth_required_codes and cpt not in approved_auth_cpts:
            missing_auth_lines.append(line)

    if missing_auth_lines:
        adj_lines = []
        for line in parsed_lines:
            cpt = line["cpt_code"]
            if cpt in auth_required_codes and cpt not in approved_auth_cpts:
                carc_info = carc_defs.get("CO-197", {})
                adj_lines.append({
                    "claim_line_id": line["id"],
                    "cpt_code": cpt,
                    "paid_amount": 0.00,
                    "carc_code": "CO-197",
                    "carc_description": carc_info.get("description", "Precertification/authorization/notification/pre-treatment absent."),
                    "rarc_code": "N56",
                })
            else:
                adj_lines.append({
                    "claim_line_id": line["id"],
                    "cpt_code": cpt,
                    "paid_amount": 0.00,
                    "carc_code": "CO-197",
                    "carc_description": "Precertification/authorization/notification/pre-treatment absent.",
                    "rarc_code": "N56",
                })
        return {
            "claim_id": claim_id,
            "adjudication_date": adjudication_date.isoformat(),
            "status": "DENIED",
            "billed_amount": round(total_billed, 2),
            "allowed_amount": 0.00,
            "contractual_adjustment": 0.00,
            "payer_paid_amount": 0.00,
            "patient_responsibility": 0.00,
            "lines": adj_lines,
            "denial_reason": "Missing required prior authorization for procedure.",
        }

    # Rule Check 2: Timely Filing Exceeded
    if service_date:
        days_elapsed = (adjudication_date - service_date).days
        if days_elapsed > timely_filing_days:
            carc_info = carc_defs.get("CO-29", {})
            adj_lines = [
                {
                    "claim_line_id": line["id"],
                    "cpt_code": line["cpt_code"],
                    "paid_amount": 0.00,
                    "carc_code": "CO-29",
                    "carc_description": carc_info.get("description", "Time limit for filing has expired."),
                    "rarc_code": "N347",
                }
                for line in parsed_lines
            ]
            return {
                "claim_id": claim_id,
                "adjudication_date": adjudication_date.isoformat(),
                "status": "DENIED",
                "billed_amount": round(total_billed, 2),
                "allowed_amount": 0.00,
                "contractual_adjustment": 0.00,
                "payer_paid_amount": 0.00,
                "patient_responsibility": 0.00,
                "lines": adj_lines,
                "denial_reason": f"Filing deadline exceeded ({days_elapsed} days elapsed, limit is {timely_filing_days} days).",
            }

    # Rule Check 3: Underpayment Case
    fee_schedules = rules.get("fee_schedules", {})
    if is_underpay_demo:
        total_allowed = 0.0
        for line in parsed_lines:
            cpt = line["cpt_code"]
            line_allowed = fee_schedules.get(cpt, line["total_amount"] * 0.6)
            total_allowed += line_allowed * line["units"]

        contractual_adj = total_billed - total_allowed
        # Payer pays significantly less than contracted fee schedule without contractual justification
        unjustified_shortfall = max(300.00, round(total_allowed * 0.4, 2))
        payer_paid = max(0.0, total_allowed - unjustified_shortfall)
        patient_resp = 0.00

        adj_lines = []
        for line in parsed_lines:
            cpt = line["cpt_code"]
            cpt_allowed = fee_schedules.get(cpt, line["total_amount"] * 0.6) * line["units"]
            line_paid = max(0.0, cpt_allowed - (unjustified_shortfall / len(parsed_lines)))
            adj_lines.append({
                "claim_line_id": line["id"],
                "cpt_code": cpt,
                "paid_amount": round(line_paid, 2),
                "carc_code": "CO-45",
                "carc_description": "Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement.",
                "rarc_code": "N130",
            })

        return {
            "claim_id": claim_id,
            "adjudication_date": adjudication_date.isoformat(),
            "status": "UNDERPAID",
            "billed_amount": round(total_billed, 2),
            "allowed_amount": round(total_allowed, 2),
            "contractual_adjustment": round(contractual_adj, 2),
            "payer_paid_amount": round(payer_paid, 2),
            "patient_responsibility": round(patient_resp, 2),
            "lines": adj_lines,
            "denial_reason": "Payment received is less than the contracted fee schedule allowance.",
        }

    # Rule Check 4: Clean Payment Case
    total_allowed = 0.0
    for line in parsed_lines:
        cpt = line["cpt_code"]
        if cpt in fee_schedules:
            line_allowed = fee_schedules[cpt] * line["units"]
        else:
            line_allowed = line["total_amount"] * 0.70
        total_allowed += line_allowed

    total_allowed = round(total_allowed, 2)
    contractual_adj = round(total_billed - total_allowed, 2)
    patient_resp = 50.00 if total_allowed >= 50.00 else round(total_allowed * 0.1, 2)
    payer_paid = round(total_allowed - patient_resp, 2)

    adj_lines = []
    for line in parsed_lines:
        cpt = line["cpt_code"]
        if cpt in fee_schedules:
            l_allowed = round(fee_schedules[cpt] * line["units"], 2)
        else:
            l_allowed = round(line["total_amount"] * 0.70, 2)
        l_patient = round(patient_resp / len(parsed_lines), 2)
        l_paid = round(l_allowed - l_patient, 2)
        adj_lines.append({
            "claim_line_id": line["id"],
            "cpt_code": cpt,
            "paid_amount": l_paid,
            "carc_code": "CO-45",
            "carc_description": "Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement.",
            "rarc_code": None,
        })

    return {
        "claim_id": claim_id,
        "adjudication_date": adjudication_date.isoformat(),
        "status": "PAID",
        "billed_amount": round(total_billed, 2),
        "allowed_amount": round(total_allowed, 2),
        "contractual_adjustment": round(contractual_adj, 2),
        "payer_paid_amount": round(payer_paid, 2),
        "patient_responsibility": round(patient_resp, 2),
        "lines": adj_lines,
        "denial_reason": None,
    }
