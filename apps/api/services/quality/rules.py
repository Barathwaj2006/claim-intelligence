"""
Data Quality Validation and Remediation Rules.

Provides deterministic validation and normalization routines for:
- Payer Name Normalization & Alias Mapping
- Provider NPI 10-digit format and Luhn checksum (CMS 80840 prefix)
- ICD-10-CM Dot Syntax Formatting
- Date Normalization (ISO 8601 YYYY-MM-DD)
- ZIP Code & Whitespace/Case Normalization
- Safe Member / Insurance ID Formatting
"""

import re
from datetime import datetime, date
from typing import Optional, Dict, Any, Tuple

KNOWN_PAYER_MAP: Dict[str, str] = {
    # Blue Cross Blue Shield aliases / typos
    "blueshild": "Blue Cross Blue Shield",
    "blue shield": "Blue Cross Blue Shield",
    "blue cross": "Blue Cross Blue Shield",
    "bcbs": "Blue Cross Blue Shield",
    "bcbsa": "Blue Cross Blue Shield",
    "blue cross blue shield": "Blue Cross Blue Shield",
    # UnitedHealthcare aliases / typos
    "uhc": "UnitedHealthcare",
    "united healthcare": "UnitedHealthcare",
    "united health care": "UnitedHealthcare",
    "unitedhealthcare": "UnitedHealthcare",
    "united health": "UnitedHealthcare",
    # Medicare aliases / typos
    "medicare": "Medicare Part B",
    "medicare part b": "Medicare Part B",
    "medicare b": "Medicare Part B",
    "traditional medicare": "Medicare Part B",
    "traditional medicare part b": "Medicare Part B",
    # Aetna aliases / typos
    "atna": "Aetna",
    "aetna commercial": "Aetna",
    "aetna health": "Aetna",
    "aetna": "Aetna",
    # Cigna aliases / typos
    "cignaa": "Cigna",
    "cigna health": "Cigna",
    "cigna healthcare": "Cigna",
    "cigna": "Cigna",
    # Humana aliases / typos
    "humana health plan": "Humana",
    "humana": "Humana",
}

# Ambiguous payer abbreviations that should be flagged for human review
AMBIGUOUS_PAYER_ALIASES = {
    "bc",      # Could be BCBS, Boston Medical, Baptist Health, etc.
    "health",  # Too generic
    "med",     # Could be Medicare, Medicaid, Medical Mutual, etc.
}


def normalize_whitespace_and_case(value: Optional[str]) -> str:
    """Strip leading/trailing whitespace and collapse internal multi-spaces."""
    if not value:
        return ""
    return re.sub(r"\s+", " ", value.strip())


def normalize_payer_name(payer_name: str) -> Tuple[Optional[str], float, str, bool]:
    """
    Normalizes payer name.
    Returns (suggested_value, confidence, reason, is_ambiguous).
    """
    cleaned = normalize_whitespace_and_case(payer_name)
    if not cleaned:
        return None, 0.0, "Empty payer name provided", True

    lower_cleaned = cleaned.lower()

    if lower_cleaned in AMBIGUOUS_PAYER_ALIASES:
        return None, 0.40, f"Payer name '{cleaned}' is ambiguous and requires human review", True

    if lower_cleaned in KNOWN_PAYER_MAP:
        canonical = KNOWN_PAYER_MAP[lower_cleaned]
        if canonical == cleaned:
            return cleaned, 1.0, "Payer name is already canonical", False
        return canonical, 0.98, f"Normalized payer alias/typo '{cleaned}' to canonical '{canonical}'", False

    # Check for close typo matches or contains
    for alias, canonical in KNOWN_PAYER_MAP.items():
        if len(alias) > 3 and alias in lower_cleaned:
            return canonical, 0.90, f"Matched known payer alias '{alias}' in '{cleaned}'", False

    # Unrecognized payer
    return cleaned, 0.50, f"Unrecognized payer name '{cleaned}', flag for review if uncertain", False


def validate_and_normalize_npi(npi: str) -> Tuple[bool, Optional[str], float, str]:
    """
    Validates 10-digit NPI using 80840 prefix Luhn checksum.
    Returns (is_valid, normalized_npi, confidence, reason).
    """
    cleaned = re.sub(r"\D", "", npi or "")
    if len(cleaned) != 10:
        return False, None, 0.0, f"Provider NPI must be exactly 10 digits (got '{npi}')"

    # Full Luhn check with 80840 prefix per standard CMS NPI specifications
    full_str = "80840" + cleaned
    total = 0
    for i, char in enumerate(reversed(full_str)):
        digit = int(char)
        if i % 2 == 1:  # Every second digit from right (0-indexed odd pos)
            digit *= 2
            if digit > 9:
                digit -= 9
        total += digit

    if total % 10 != 0:
        return False, None, 0.0, f"NPI '{cleaned}' failed 80840 CMS Luhn checksum verification"

    return True, cleaned, 1.0, "NPI is valid 10-digit format with correct Luhn checksum"


def normalize_icd10_code(icd_code: str) -> Tuple[Optional[str], float, str, bool]:
    """
    Normalizes ICD-10-CM diagnosis code dot syntax.
    Example: M545 -> M54.5, M25561 -> M25.561, M54.5 -> M54.5.
    Returns (suggested_value, confidence, reason, is_valid).
    """
    cleaned = normalize_whitespace_and_case(icd_code).upper()
    if not cleaned:
        return None, 0.0, "Empty ICD-10 code", False

    # Standard ICD-10 CM regex: 1 letter, 2 digits, optional dot, up to 4 alphanumeric sub-characters
    match = re.match(r"^([A-Z][0-9]{2})\.?([A-Z0-9]{1,4})?$", cleaned)
    if not match:
        return None, 0.0, f"ICD-10 code '{icd_code}' is in an invalid format", False

    category = match.group(1)
    subcategory = match.group(2)

    if subcategory:
        formatted = f"{category}.{subcategory}"
    else:
        formatted = category

    if formatted == cleaned:
        return formatted, 1.0, "ICD-10 code is properly formatted", True

    return formatted, 0.98, f"Normalized ICD-10 code dot syntax from '{cleaned}' to '{formatted}'", True


def normalize_date_string(date_val: Any) -> Tuple[Optional[str], float, str, bool]:
    """
    Normalizes date to ISO 8601 YYYY-MM-DD.
    Rejects invalid/impossible dates like 2026-02-31 without guessing.
    Returns (normalized_date_str, confidence, reason, is_valid).
    """
    if isinstance(date_val, (date, datetime)):
        return date_val.strftime("%Y-%m-%d"), 1.0, "Date is valid", True

    if not date_val or not isinstance(date_val, str):
        return None, 0.0, "Invalid or missing date input", False

    cleaned = normalize_whitespace_and_case(date_val)

    # Common valid formats to attempt parsing deterministically
    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%m-%d-%Y",
        "%Y.%m.%d",
        "%d-%b-%Y",
        "%d %b %Y",
    ]

    for fmt in formats:
        try:
            parsed = datetime.strptime(cleaned, fmt).date()
            formatted = parsed.strftime("%Y-%m-%d")
            if formatted == cleaned:
                return formatted, 1.0, "Date is in ISO 8601 format", True
            return formatted, 0.95, f"Normalized date '{cleaned}' to ISO 8601 format '{formatted}'", True
        except ValueError:
            continue

    return None, 0.0, f"Invalid date '{cleaned}' - cannot parse deterministically", False


def normalize_zip_code(zip_str: str) -> Tuple[Optional[str], float, str, bool]:
    """
    Validates and normalizes 5-digit or ZIP+4 codes.
    Returns (normalized_zip, confidence, reason, is_valid).
    """
    cleaned = normalize_whitespace_and_case(zip_str)
    digits_only = re.sub(r"\D", "", cleaned)

    if len(digits_only) == 5:
        return digits_only, 1.0, "ZIP code is valid 5-digit format", True
    elif len(digits_only) == 9:
        formatted = f"{digits_only[:5]}-{digits_only[5:]}"
        return formatted, 0.98, f"Normalized ZIP+4 code to '{formatted}'", True
    else:
        return None, 0.0, f"ZIP code '{zip_str}' is invalid (must be 5 or 9 digits)", False


def normalize_member_id(member_id: str) -> Tuple[Optional[str], float, str, bool]:
    """
    Normalizes insurance member ID (strip extraneous spaces, uppercase).
    No fabrication or identity guessing.
    """
    cleaned = normalize_whitespace_and_case(member_id).upper()
    if not cleaned or len(cleaned) < 3:
        return None, 0.0, f"Member ID '{member_id}' is invalid or too short", False

    if cleaned == member_id:
        return cleaned, 1.0, "Member ID is properly formatted", True

    return cleaned, 0.98, f"Normalized member ID whitespace/case from '{member_id}' to '{cleaned}'", True
