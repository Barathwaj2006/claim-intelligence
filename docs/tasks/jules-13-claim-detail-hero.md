# Jules Task 13: Claim Detail Hero Experience

## Wave & PR Target
- **Wave**: 2 (Insurance Intelligence)
- **Target PR**: PR 2 (Insurance Intelligence)

## Mission
Build the primary hero page of the platform: the 360-Degree Claim Cockpit (`apps/web/src/pages/ClaimDetail.tsx`) and the Claims Queue (`ClaimsList.tsx`).

## Exclusive File Ownership
- `apps/web/src/pages/ClaimDetail.tsx`
- `apps/web/src/pages/ClaimsList.tsx`

**Forbidden Paths**: Do NOT modify `apps/web/src/layout/` or backend files.

## Prerequisites & Dependencies
- Wave 1 completion (J11 Frontend Shell and J3 shared types).

## Detailed Requirements
1. **Claims Queue (`ClaimsList.tsx`)**:
   - Filterable table: Filter by Status, Risk Level (Low/Med/High), and Payer.
   - Batch actions: "Run Eligibility on Selected", "Calculate Risk", "Submit Clean Claims".
   - Direct click to open Claim Detail.

2. **Claim Detail Cockpit (`ClaimDetail.tsx`)**:
   - **Header Banner**:
     - Claim Number (e.g. `CLM-2026-00101`), Status Pill (`VERIFIED`, `SUBMITTED`, etc.), Timely filing countdown badge ("Filing deadline in 14 days").
     - Patient Name, Member ID, Payer Name, Service Date, Total Billed Charge.
   - **Denial Risk Center**:
     - Large visual gauge showing composite score (0-100) with dynamic color (Green <30, Amber 30-69, Red >=70).
     - Individual subscore bars: Eligibility, Authorization, Coverage, Data Quality.
   - **Explainability & Factor Cards**:
     - Bullet list of risk factors with impact points (`+35 Missing Prior Auth`, `-10 Active BCBS coverage`).
     - Predicted CARC/RARC badge (`CO-197`).
   - **One-Click Pre-Submission Corrections**:
     - Interactive banner showing detected typos or formatting issues (e.g. `BlueShild` → `Blue Cross Blue Shield`, invalid NPI).
     - "Apply Fix" button with instant visual feedback.
   - **Procedure Line Items (CMS-1500 Grid)**:
     - Table of lines: Line #, CPT Code, Modifiers, Diagnosis Pointer, Units, Charge, Prior Auth status.
   - **Action Bar**:
     - "Run Re-verification" button.
     - "Simulate Adjudication" button.
     - "Submit Claim to Clearinghouse" button (disabled or requiring confirmation if Risk >= 70).

## Verification Command
```bash
cd apps/web
npm run build
```
