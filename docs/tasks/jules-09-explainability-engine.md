# Jules Task 09: Explainability & Audit Engine

## Wave & PR Target
- **Wave**: 3 (Claim Intelligence & Adjudication)
- **Target PR**: PR 3 (Claim Intelligence)

## Mission
Build the Explainability and Audit Engine in `apps/api/services/explainability/` that translates risk scores into transparent, clinician- and biller-friendly rationales.

## Exclusive File Ownership
- `apps/api/services/explainability/`
- `apps/api/tests/test_explainability.py`

## Prerequisites & Dependencies
- Wave 3 Jules 8 (Risk Scoring Engine).

## Detailed Requirements
1. **Factor Decomposition (`apps/api/services/explainability/explainer.py`)**:
   - Take `RiskScore` and constituent subscores.
   - Generate positive (protective) and negative (risk-driving) bullet factors:
     - Example: `+30 Missing Prior Authorization for CPT 72148 (MRI Lumbar Spine) under Blue Cross Blue Shield policy.`
     - Example: `+15 Timely filing deadline expires in 6 days (2026-09-09).`
     - Example: `-10 Active patient coverage verified on 2026-09-01.`
   - Map each negative factor to the exact predicted CARC/RARC code:
     - Missing Auth → `CO-197 / N56`
     - Expired Timely Filing → `CO-29`
     - Invalid NPI / Typo → `CO-16`
     - Medical Necessity → `CO-50`

2. **Executive Summary Formulation**:
   - Synthesize a concise 1-2 sentence clinical executive summary for the claim header.
   - Provide concrete, actionable remediation steps ("Next Best Actions").

3. **API Integration**:
   - Connected via `GET /api/v1/claims/{id}/explain`.

4. **Pytest Suite (`apps/api/tests/test_explainability.py`)**:
   - Verify that high-risk scores output non-empty factor lists with projected CARC codes.
   - Verify that low-risk scores output clean claim confirmations.

## Verification Command
```bash
cd apps/api
pytest tests/test_explainability.py
```
