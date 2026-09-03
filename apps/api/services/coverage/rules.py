"""
Synthetic Payer Coverage Policy Rules and Medical Necessity Crosswalks
Deterministic rule evaluation without LLM dependency.
"""

from typing import Dict, List, Optional, Set, Tuple

# Known synthetic CPT procedures catalog
SYNTHETIC_CPT_CATALOG: Dict[str, Dict] = {
    "99213": {
        "name": "Office visit established low-complexity",
        "category": "E/M",
        "gender_restriction": None,
        "requires_auth": False,
        "max_frequency_per_year": None,
    },
    "99214": {
        "name": "Office visit established moderate-complexity",
        "category": "E/M",
        "gender_restriction": None,
        "requires_auth": False,
        "max_frequency_per_year": None,
    },
    "99215": {
        "name": "Office visit established high-complexity",
        "category": "E/M",
        "gender_restriction": None,
        "requires_auth": False,
        "max_frequency_per_year": None,
    },
    "99395": {
        "name": "Periodic comprehensive preventive medicine reevaluation (18-39 yrs)",
        "category": "Preventive",
        "gender_restriction": None,
        "requires_auth": False,
        "max_frequency_per_year": 1,
    },
    "36415": {
        "name": "Routine venipuncture",
        "category": "Laboratory",
        "gender_restriction": None,
        "requires_auth": False,
        "max_frequency_per_year": None,
    },
    "72148": {
        "name": "MRI Lumbar Spine without contrast",
        "category": "Advanced Imaging",
        "gender_restriction": None,
        "requires_auth": True,
        "max_frequency_per_year": 2,
    },
    "29881": {
        "name": "Knee Arthroscopy with meniscectomy",
        "category": "Surgical",
        "gender_restriction": None,
        "requires_auth": True,
        "max_frequency_per_year": 1,
    },
    "59400": {
        "name": "Routine obstetric care including antepartum, vaginal delivery, and postpartum care",
        "category": "Obstetrics",
        "gender_restriction": "FEMALE",
        "requires_auth": False,
        "max_frequency_per_year": 1,
    },
    "15780": {
        "name": "Dermabrasion total face",
        "category": "Cosmetic",
        "gender_restriction": None,
        "requires_auth": False,
        "max_frequency_per_year": None,
        "is_excluded": True,
    },
    "90999": {
        "name": "Unlisted dialysis procedure",
        "category": "Experimental/Unlisted",
        "gender_restriction": None,
        "requires_auth": True,
        "max_frequency_per_year": None,
        "is_excluded": True,
    },
}

# Explicitly excluded CPT codes across synthetic policies
SYNTHETIC_EXCLUSIONS: Set[str] = {
    "15780",  # Dermabrasion / Cosmetic procedure
    "90999",  # Unlisted experimental procedure
    "15781",  # Dermabrasion segmental
    "11950",  # Subcutaneous injection of filling material
}

# Medical Necessity Crosswalk: CPT code -> Allowed ICD-10 prefixes/codes
SYNTHETIC_MEDICAL_NECESSITY_CROSSWALK: Dict[str, List[str]] = {
    "72148": ["M54.5", "M54.16", "M54.4", "M51.16", "M54.1", "M54.2"],
    "29881": ["M23.22", "M23.20", "M23.2", "M23.30", "M23.8X"],
    "59400": ["Z34.00", "Z34.80", "Z34.90", "O80", "Z34.01"],
    "99395": ["Z00.00", "Z00.01", "Z00.8", "Z00"],
    "99213": ["*"],
    "99214": ["*"],
    "99215": ["*"],
    "36415": ["*"],
}


def check_medical_necessity(cpt_code: str, diagnosis_code: Optional[str]) -> Tuple[bool, str]:
    """
    Validates diagnosis code against CPT procedure code for medical necessity.
    Returns (is_met, reason_string).
    """
    if not diagnosis_code:
        return False, f"Missing primary diagnosis code for procedure CPT {cpt_code}."

    allowed_diagnoses = SYNTHETIC_MEDICAL_NECESSITY_CROSSWALK.get(cpt_code)
    if not allowed_diagnoses:
        # Default check for mapped CPTs without explicit restrictions
        return True, "Standard medical indication."

    if "*" in allowed_diagnoses:
        return True, "Diagnosis code satisfies broad clinical E/M necessity."

    clean_dx = diagnosis_code.upper().strip().split()[0]  # e.g., "M54.5"

    for allowed in allowed_diagnoses:
        if clean_dx == allowed or clean_dx.startswith(allowed):
            return True, f"Primary diagnosis {clean_dx} satisfies medical necessity criteria for CPT {cpt_code}."

    return False, f"Primary diagnosis {clean_dx} does not satisfy medical necessity criteria for CPT {cpt_code}."
