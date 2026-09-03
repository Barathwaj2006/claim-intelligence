# Jules Task 12: Executive Claims Dashboard

## Wave & PR Target
- **Wave**: 2 (Insurance Intelligence)
- **Target PR**: PR 2 (Insurance Intelligence)

## Mission
Build the high-impact Executive Claims Dashboard and Analytics pages in `apps/web/src/pages/Dashboard.tsx` and `Analytics.tsx`.

## Exclusive File Ownership
- `apps/web/src/pages/Dashboard.tsx`
- `apps/web/src/pages/Analytics.tsx`

**Forbidden Paths**: Do NOT modify `apps/web/src/layout/` or backend files.

## Prerequisites & Dependencies
- Wave 1 completion (J11 Frontend Shell and J3 shared types).

## Detailed Requirements
1. **Executive KPI Stat Cards**:
   - Total Claims Analyzed (e.g. `142`).
   - Clean Claim Rate % (e.g. `84.5%`, with green up-trend badge).
   - Revenue at Risk (e.g. `$58,300.00`, with warning icon).
   - Recovered Revenue (e.g. `$34,200.00`).

2. **Risk Distribution Visualizer**:
   - Clean UI breakdown bar or cards:
     - `Low Risk (0-29)`: Clean claims ready for immediate submission.
     - `Medium Risk (30-69)`: Claims needing documentation checks.
     - `High Risk (70-100)`: Denials blocked before submission.

3. **Top Denial Root Causes Table**:
   - Displays top anticipated CARC codes (e.g. `CO-197 Missing Auth`, `CO-16 Lacks Info`, `CO-29 Timely Filing`), count of claims impacted, and total dollar exposure.

4. **Recent Activity / Live Claims Feed**:
   - Table of recent claims with Claim ID, Patient, Payer, Billed Amount, Risk Score badge, and "Inspect" button linking to `/claims/{id}`.

5. **Analytics Page (`Analytics.tsx`)**:
   - Comparative payer performance (clean claim rate by BCBS vs Medicare vs UHC).
   - Time-to-adjudication and appeal success rates.

## Verification Command
```bash
cd apps/web
npm run build
```
