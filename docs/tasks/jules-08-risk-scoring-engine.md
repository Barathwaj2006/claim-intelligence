# Jules Task 08: Claim Risk Scoring Engine

## Wave & PR Target
- **Wave**: 3 (Claim Intelligence & Adjudication)
- **Target PR**: PR 3 (Claim Intelligence)

## Mission
Implement the multi-dimensional, deterministic 0–100 Denial Risk Scoring Engine in `apps/api/services/risk/`.

## Exclusive File Ownership
- `apps/api/services/risk/`
- `apps/api/routers/risk.py`
- `apps/api/tests/test_risk.py`

## Prerequisites & Dependencies
- Wave 2 engines (J4 Eligibility, J5 Auth, J6 Coverage, J7 Quality).

## Detailed Requirements
1. **Scoring Formula & Weights (`apps/api/services/risk/scorer.py`)**:
   - The composite score is normalized between 0 and 100:
     $$RiskScore = \sum (Subscore_i \times Weight_i)$$
   - Subscores and weights:
     - Prior Authorization: Weight **25%** (Missing required auth = 100 subscore, Expired auth = 80 subscore, Valid auth = 0).
     - Eligibility & Coverage: Weight **25%** (Terminated/inactive member = 100 subscore, Active = 0).
     - Medical Necessity: Weight **20%** (Incompatible CPT/ICD-10 = 100 subscore, Valid crosswalk = 0).
     - Data Quality: Weight **10%** (Uncorrected NPI or typo errors = 70 subscore, Clean = 0).
     - Timely Filing Horizon: Weight **10%** (>60 days remaining = 0, 15-30 days remaining = 40, <7 days remaining = 90, Past deadline = 100).
     - Network Status: Weight **10%** (Out of network without pre-approval = 60, In-network = 0).

2. **Risk Categorization**:
   - `0 - 29`: `LOW` (Clean claim, safe to auto-submit).
   - `30 - 69`: `MEDIUM` (Potential documentation or filing risk, recommend review).
   - `70 - 100`: `HIGH` (Critical denial certainty, prevent submission until remediated).

3. **API Endpoint (`apps/api/routers/risk.py`)**:
   - `POST /api/v1/claims/{id}/risk-score`: Computes composite score, saves `RiskScore` entity, and returns payload.

4. **Pytest Suite (`apps/api/tests/test_risk.py`)**:
   - Test pristine claim yields score < 20 (`LOW`).
   - Test claim missing prior authorization for MRI yields score >= 70 (`HIGH`).
   - Test mathematical range invariants (always $0 \le score \le 100$).

## Verification Command
```bash
cd apps/api
pytest tests/test_risk.py
```
