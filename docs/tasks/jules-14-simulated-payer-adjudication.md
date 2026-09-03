# Jules Task 14: Simulated Clearinghouse & Payer Adjudication

## Wave & PR Target
- **Wave**: 3 (Claim Intelligence & Adjudication)
- **Target PR**: PR 3 (Claim Intelligence)

## Mission
Implement the realistic Simulated Clearinghouse and Payer Adjudication Engine in `apps/api/services/adjudication/` that generates HIPAA 835 Electronic Remittance Advice (ERA) responses.

## Exclusive File Ownership
- `apps/api/services/adjudication/`
- `apps/api/routers/adjudication.py`
- `apps/api/tests/test_adjudication.py`

## Prerequisites & Dependencies
- Wave 1 and Wave 2 engines.

## Detailed Requirements
1. **Adjudication Simulation Logic (`apps/api/services/adjudication/engine.py`)**:
   - Accepts a `SUBMITTED` claim.
   - Evaluates payer contract rules:
     - **Denial Case 1 (Missing Prior Auth)**:
       - CPT code requires auth and no approved auth is attached.
       - Status: `DENIED`.
       - CARC: `CO-197` ("Precertification/authorization/notification/pre-treatment absent").
       - Allowed Amount: $0.00, Payer Paid: $0.00, Patient Responsibility: $0.00.
     - **Denial Case 2 (Timely Filing Exceeded)**:
       - Elapsed days between service date and submission date exceeds `payer.timely_filing_days`.
       - Status: `DENIED`.
       - CARC: `CO-29` ("Time limit for filing has expired").
     - **Clean Payment Case**:
       - All checks passed.
       - Status: `PAID`.
       - Billed: $1,450.00.
       - Allowed: $1,000.00.
       - Contractual Adjustment (`CO-45`): $450.00.
       - Deductible / Copay (`PR-1` or `PR-2`): $50.00.
       - Payer Paid: $950.00.
     - **Underpayment Case**:
       - Billed $2,000, Contracted fee schedule expected $1,200, but payer paid only $700 without contractual justification.
       - Status: `UNDERPAID`.
   - Invariant:
     $$\text{Billed Amount} = \text{Allowed Amount} + \text{Contractual Adjustment}$$
     $$\text{Allowed Amount} = \text{Payer Paid} + \text{Patient Responsibility}$$

2. **API Endpoint (`apps/api/routers/adjudication.py`)**:
   - `POST /api/v1/claims/{id}/adjudicate`: Runs simulated adjudication, records `Adjudication` and `AdjudicationLine` rows, updates claim status to `ADJUDICATED`.

3. **Pytest Suite (`apps/api/tests/test_adjudication.py`)**:
   - Assert missing auth claim adjudicates to `DENIED` with `CO-197`.
   - Assert clean claim passes mathematical balance equation down to the penny.

## Verification Command
```bash
cd apps/api
pytest tests/test_adjudication.py
```
