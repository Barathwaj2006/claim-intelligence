# Jules Task 06: Coverage & Benefit Limits Engine

## Wave & PR Target
- **Wave**: 2 (Insurance Intelligence)
- **Target PR**: PR 2 (Insurance Intelligence)

## Mission
Build the medical necessity crosswalk, age/gender restriction, and benefit frequency engine in `apps/api/services/coverage/`.

## Exclusive File Ownership
- `apps/api/services/coverage/`
- `apps/api/routers/coverage.py`
- `apps/api/tests/test_coverage.py`

## Prerequisites & Dependencies
- Wave 1 completion (J1 API foundation, J2 models, J3 schemas).

## Detailed Requirements
1. **Medical Necessity Crosswalk (`apps/api/services/coverage/necessity.py`)**:
   - Establish valid ICD-10-CM to CPT pairings:
     - CPT `72148` (MRI Lumbar Spine) is medically indicated for ICD-10 `M54.5` (Low back pain) and `M54.16` (Radiculopathy, lumbar region).
     - CPT `29881` (Knee Arthroscopy) is indicated for `M23.22` (Derangement of meniscus).
     - Incompatible pairs (e.g. CPT `72148` paired with ICD-10 `J02.9` Acute pharyngitis) flag medical necessity failure (`CO-50`).

2. **Demographic & Frequency Validation (`apps/api/services/coverage/limits.py`)**:
   - Gender checks: Flag OB/GYN procedures (e.g. `59400`) on male patients (`CO-9`).
   - Age checks: Pediatric codes billed for patients over age 18.
   - Frequency limits: Routine preventive annual exam `99395` restricted to 1 occurrence per 365 days.

3. **API Endpoint (`apps/api/routers/coverage.py`)**:
   - `POST /api/v1/claims/{id}/coverage`: Runs coverage and medical necessity checks.

4. **Pytest Suite (`apps/api/tests/test_coverage.py`)**:
   - Test matching ICD-10 and CPT returns `COVERED`.
   - Test mismatched diagnosis returns `DENIED_MEDICAL_NECESSITY` (`CO-50`).
   - Test gender contradiction returns demographic warning.

## Verification Command
```bash
cd apps/api
pytest tests/test_coverage.py
```
