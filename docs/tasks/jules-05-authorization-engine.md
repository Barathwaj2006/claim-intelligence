# Jules Task 05: Prior Authorization Engine

## Wave & PR Target
- **Wave**: 2 (Insurance Intelligence)
- **Target PR**: PR 2 (Insurance Intelligence)

## Mission
Implement the Prior Authorization rule engine in `apps/api/services/authorization/` to catch the #1 cause of high-dollar clinical claim denials (`CO-197`).

## Exclusive File Ownership
- `apps/api/services/authorization/`
- `apps/api/routers/authorization.py`
- `apps/api/tests/test_authorization.py`

## Prerequisites & Dependencies
- Wave 1 completion (J1 API foundation, J2 models, J3 schemas).

## Detailed Requirements
1. **Clinical Rule Matrix (`apps/api/services/authorization/rules.py`)**:
   - Establish CPT categories requiring authorization:
     - Advanced Diagnostic Imaging: `72148` (MRI Lumbar Spine), `70450` (CT Head), `71250` (CT Thorax).
     - Outpatient Surgical Procedures: `29881` (Knee Arthroscopy), `27447` (Total Knee Arthroplasty).
     - Specialty Injectables / Biologics: `J9355` (Trastuzumab).
   - Rules vary by Payer: Commercial plans (BCBS, UHC, Aetna) mandate prior auth for advanced imaging, while Traditional Medicare Part B has select local coverage determinations (LCDs).

2. **Engine Evaluation (`apps/api/services/authorization/engine.py`)**:
   - Input: Claim with procedure lines and attached prior authorization records (if any).
   - Validation checks:
     - Is auth required for this CPT code and payer?
     - If required, is there an attached authorization number?
     - If attached, is the claim service date within `valid_from` and `valid_to`?
     - Are approved units greater than or equal to billed claim units?
   - Output: `AuthorizationResult` with status (`APPROVED`, `MISSING`, `EXPIRED`, `NOT_REQUIRED`).

3. **API Endpoint (`apps/api/routers/authorization.py`)**:
   - `POST /api/v1/claims/{id}/authorization`: Evaluates claim lines and returns authorization compliance.

4. **Pytest Suite (`apps/api/tests/test_authorization.py`)**:
   - Test routine E&M code `99213` returns `NOT_REQUIRED`.
   - Test MRI code `72148` without auth returns `MISSING` with projected `CO-197`.
   - Test valid auth within date window returns `APPROVED`.

## Verification Command
```bash
cd apps/api
pytest tests/test_authorization.py
```
