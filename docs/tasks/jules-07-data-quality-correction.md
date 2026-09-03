# Jules Task 07: Data Quality & Pre-Submission Correction Engine

## Wave & PR Target
- **Wave**: 2 (Insurance Intelligence)
- **Target PR**: PR 2 (Insurance Intelligence)

## Mission
Build the pre-submission data quality, typo remediation, and format validation engine in `apps/api/services/quality/`.

## Exclusive File Ownership
- `apps/api/services/quality/`
- `apps/api/routers/quality.py`
- `apps/api/tests/test_quality.py`

## Prerequisites & Dependencies
- Wave 1 completion (J1 API foundation, J2 models, J3 schemas).

## Detailed Requirements
1. **Remediation & Quality Rules (`apps/api/services/quality/rules.py`)**:
   - **Payer Name Normalization**:
     - Common OCR and human entry errors: `BlueShild` → `Blue Cross Blue Shield`, `UHC` → `UnitedHealthcare`, `Atna` → `Aetna`, `Cignaa` → `Cigna`.
   - **Provider NPI Validation**:
     - 10-digit numerical verification.
     - Full Luhn algorithm checksum verification with prefix `80840` per CMS NPI standards.
   - **ICD-10-CM Dot Syntax**:
     - Verify format: 3 characters followed by a decimal and up to 4 sub-characters (e.g. `M545` normalized to `M54.5`).
   - **ZIP Code & Date Formatting**:
     - 5-digit or 9-digit (ZIP+4) validation.
     - Dates strictly in ISO 8601 `YYYY-MM-DD`.

2. **Correction Audit Trail**:
   - For every detected issue, generate a structured remediation object:
     `{ "field_name": "...", "original_value": "...", "suggested_value": "...", "reason": "...", "confidence": 0.98 }`

3. **API Endpoints (`apps/api/routers/quality.py`)**:
   - `POST /api/v1/claims/{id}/validate`: Runs all quality rules on the claim and returns detected errors.
   - `POST /api/v1/claims/{id}/corrections/apply`: Applies one or all suggested corrections to the claim and updates its fields.

4. **Pytest Suite (`apps/api/tests/test_quality.py`)**:
   - Test `BlueShild` normalization generates suggestion with confidence >= 0.95.
   - Test invalid NPI checksum triggers data quality error.
   - Test applying correction updates the claim field and changes correction status to `APPLIED`.

## Verification Command
```bash
cd apps/api
pytest tests/test_quality.py
```
