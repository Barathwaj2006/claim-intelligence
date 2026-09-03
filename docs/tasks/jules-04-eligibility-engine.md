# Jules Task 04: Eligibility & Benefits Engine

## Wave & PR Target
- **Wave**: 2 (Insurance Intelligence)
- **Target PR**: PR 2 (Insurance Intelligence)

## Mission
Implement the simulated HIPAA 270/271 real-time eligibility verification engine in `apps/api/services/eligibility/`.

## Exclusive File Ownership
- `apps/api/services/eligibility/`
- `apps/api/routers/eligibility.py`
- `apps/api/tests/test_eligibility.py`

## Prerequisites & Dependencies
- Wave 1 completion (J1 API foundation, J2 models, J3 schemas).

## Detailed Requirements
1. **Engine Logic (`apps/api/services/eligibility/engine.py`)**:
   - Verify Member ID structure against payer conventions:
     - BCBS: 3 alphabetical prefix characters + 9 numeric digits.
     - Medicare: 11 alphanumeric characters (MBI format: digit, alpha, alnum, digit, etc.).
     - UnitedHealthcare / Aetna: 9-10 numeric digits.
   - Verify Service Date against Coverage Effective Date and Termination Date:
     - If service date is prior to effective date → Inactive coverage (`CO-27`).
     - If service date is after termination date → Terminated coverage (`CO-27`).
   - Deductible & Copay computation:
     - Return remaining deductible: `max(0, deductible_total - deductible_met)`.
     - Return specialist copay amount based on plan tier.
   - Return structured `EligibilityResult`.

2. **API Endpoint (`apps/api/routers/eligibility.py`)**:
   - `POST /api/v1/claims/{id}/eligibility`: Executes eligibility check for claim and persists `EligibilityCheck` record.

3. **Pytest Suite (`apps/api/tests/test_eligibility.py`)**:
   - Test active coverage returns `is_active=True` with correct remaining deductible.
   - Test expired coverage returns `is_active=False`.
   - Test invalid member ID format returns validation warning.

## Verification Command
```bash
cd apps/api
pytest tests/test_eligibility.py
```
