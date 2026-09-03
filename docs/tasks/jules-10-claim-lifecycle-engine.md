# Jules Task 10: Claim Lifecycle State Machine

## Wave & PR Target
- **Wave**: 3 (Claim Intelligence & Adjudication)
- **Target PR**: PR 3 (Claim Intelligence)

## Mission
Implement the strict Claim Lifecycle State Machine in `apps/api/services/lifecycle/` and claim routing in `apps/api/routers/claims.py`.

## Exclusive File Ownership
- `apps/api/services/lifecycle/`
- `apps/api/routers/claims.py`
- `apps/api/tests/test_lifecycle.py`

## Prerequisites & Dependencies
- Wave 1 (J1, J2, J3) and Wave 2 engines.

## Detailed Requirements
1. **State Machine Invariants (`apps/api/services/lifecycle/state_machine.py`)**:
   - Permitted Transitions:
     - `DRAFT` → `VERIFIED` (Requires eligibility check to have been run).
     - `VERIFIED` → `READY_FOR_SUBMISSION` (Requires risk score calculated).
     - `READY_FOR_SUBMISSION` → `SUBMITTED` (Blocks if `risk_level == "HIGH"` unless `force_override=True`).
     - `SUBMITTED` → `ADJUDICATED` (Triggered upon receipt of payer 835 response).
     - `ADJUDICATED` → `APPEAL_IN_PROGRESS` (For denied/underpaid claims).
     - `ADJUDICATED` / `APPEAL_IN_PROGRESS` → `CLOSED` (Upon full payment or case abandonment).
   - Illegal state jumps (e.g. `DRAFT` directly to `SUBMITTED` or `ADJUDICATED` back to `DRAFT`) must raise an `InvalidTransitionError` mapped to HTTP 400.

2. **Audit Logging**:
   - Every transition logs the previous state, new state, timestamp, actor, and optional override reason.

3. **API Endpoints (`apps/api/routers/claims.py`)**:
   - `GET /api/v1/claims`: List claims with status, risk level, payer, and pagination filters.
   - `GET /api/v1/claims/{id}`: Detailed 360 claim view.
   - `POST /api/v1/claims/{id}/submit`: Transition claim to `SUBMITTED` state, generating clearinghouse trace ID.

4. **Pytest Suite (`apps/api/tests/test_lifecycle.py`)**:
   - Test legal path `DRAFT` → `VERIFIED` → `READY_FOR_SUBMISSION` → `SUBMITTED`.
   - Test blocking high-risk submission without override.
   - Test illegal transition raises HTTP 400.

## Verification Command
```bash
cd apps/api
pytest tests/test_lifecycle.py
```
