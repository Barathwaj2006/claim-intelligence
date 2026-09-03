# Jules Task 03: Shared Contracts & Type Definitions

## Wave & PR Target
- **Wave**: 1 (Foundation)
- **Target PR**: PR 1 (Foundation)

## Mission
Define and export the canonical TypeScript interfaces in `packages/types/` and mirror them in Pydantic v2 schemas in `apps/api/schemas/` to guarantee absolute type alignment across frontend and backend.

## Exclusive File Ownership
- `packages/types/`
- `packages/config/`
- `apps/api/schemas/`

**Forbidden Paths**: Do NOT modify `apps/web/src/pages/` or `apps/api/core/`.

## Prerequisites & Dependencies
- Read `docs/DATA_MODEL.md` and `docs/API_CONTRACT.md`.

## Detailed Requirements
1. **TypeScript Interfaces (`packages/types/src/`)**:
   - `patient.ts`: `Patient`, `Gender` enum.
   - `payer.ts`: `Payer`, `InsurancePlan`, `PlanType` enum.
   - `claim.ts`: `Claim`, `ClaimLine`, `ClaimStatus` enum.
   - `eligibility.ts`: `EligibilityResult`, `EligibilityCheckRequest`.
   - `authorization.ts`: `AuthorizationResult`, `AuthStatus` enum.
   - `risk.ts`: `RiskScore`, `RiskFactor`, `RiskLevel` enum, `RiskCategory` enum.
   - `adjudication.ts`: `AdjudicationResult`, `AdjudicationLine`, `AdjudicationStatus` enum.
   - `recovery.ts`: `RecoveryCase`, `AppealDocument`, `RecoveryPriority`, `RecoveryStatus`.
   - `index.ts`: Barrel export of all types.

2. **Pydantic v2 Canonical Schemas (`apps/api/schemas/canonical.py`)**:
   - Mirror the identical field names and types for incoming request validation and response serialization.
   - Include standard envelope models: `StandardResponse[T]`, `StandardError`.

3. **Shared Constants (`packages/config/src/index.ts`)**:
   - CARC codes: `CO-16`, `CO-29`, `CO-45`, `CO-197`, `PR-1`, `PR-2`.
   - Standard risk threshold constants: `RISK_LOW_MAX = 29`, `RISK_MEDIUM_MAX = 69`.

## Verification Command
```bash
cd packages/types
# Verify syntax / types build cleanly
```
