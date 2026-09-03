"""
Clinical rules matrix for Prior Authorization requirements.
Configurable synthetic rules mapped by CPT code, CPT category, and payer attributes.
"""

from typing import Dict, List, Any, Optional

# CPT Categories requiring prior authorization under commercial payer policies
ADVANCED_IMAGING_CPTS = {
    "72148": "MRI Lumbar Spine without contrast",
    "70450": "CT Head/Brain without contrast",
    "71250": "CT Thorax with contrast",
}

OUTPATIENT_SURGERY_CPTS = {
    "29881": "Arthroscopy, knee, surgical; with meniscectomy",
    "27447": "Arthroplasty, knee, condyle and plateau; total knee replacement",
}

SPECIALTY_INJECTABLE_CPTS = {
    "J9355": "Injection, trastuzumab, 10 mg",
}

# CPT codes explicitly not requiring prior authorization (e.g., routine E&M, lab tests)
ROUTINE_CPTS = {
    "99213": "Office/outpatient visit, established patient, low complexity",
    "99214": "Office/outpatient visit, established patient, moderate complexity",
    "36415": "Routine venipuncture",
}

# Master CPT category mapping
CPT_AUTH_CATEGORIES: Dict[str, str] = {
    **{code: "ADVANCED_IMAGING" for code in ADVANCED_IMAGING_CPTS},
    **{code: "OUTPATIENT_SURGERY" for code in OUTPATIENT_SURGERY_CPTS},
    **{code: "SPECIALTY_INJECTABLES" for code in SPECIALTY_INJECTABLE_CPTS},
}


def is_medicare_payer(payer_id: Optional[str], payer_name: Optional[str]) -> bool:
    """
    Determines if the payer is Traditional Medicare Part B or Fee-For-Service Medicare.
    Traditional Medicare generally does not require prior authorization for standard advanced imaging.
    """
    if payer_id and payer_id in ("pyr-003", "00020"):
        return True
    if payer_name and "Medicare Part B" in payer_name and "Advantage" not in payer_name:
        return True
    return False


def cpt_requires_authorization(
    cpt_code: str,
    payer_id: Optional[str] = None,
    payer_name: Optional[str] = None,
    requires_auth_for_advanced_imaging: bool = True,
) -> bool:
    """
    Determines whether a specific CPT/HCPCS code requires prior authorization
    for a given payer based on clinical rule matrix and payer settings.
    """
    category = CPT_AUTH_CATEGORIES.get(cpt_code)

    if not category:
        return False

    # Check for Traditional Medicare exception on Advanced Imaging
    if category == "ADVANCED_IMAGING":
        if is_medicare_payer(payer_id, payer_name) or not requires_auth_for_advanced_imaging:
            return False
        return True

    if category in ("OUTPATIENT_SURGERY", "SPECIALTY_INJECTABLES"):
        return True

    return False


def get_cpt_description(cpt_code: str) -> str:
    """Returns clinical description for a given CPT code."""
    all_codes = {
        **ADVANCED_IMAGING_CPTS,
        **OUTPATIENT_SURGERY_CPTS,
        **SPECIALTY_INJECTABLE_CPTS,
        **ROUTINE_CPTS,
    }
    return all_codes.get(cpt_code, f"Procedure Code {cpt_code}")
