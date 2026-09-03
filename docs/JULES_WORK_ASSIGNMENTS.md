# Master Jules Work Assignments Matrix

This document defines the strict ownership boundaries, input dependencies, output deliverables, and verification criteria for each of the **15 Jules Agent Executions**.

---

## 1. Wave Progression & PR Map

| Wave | Target PR | Agent ID | Agent Role | Exclusive File Ownership Paths | Prerequisite Dependencies |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **1** | **PR 1** | **Jules 1** | Backend Foundation | `apps/api/core/`, `apps/api/main.py`, `apps/api/requirements.txt` | Initial Repo Skeleton |
| **1** | **PR 1** | **Jules 2** | Database Domain Model | `apps/api/models/` | Initial Repo Skeleton |
| **1** | **PR 1** | **Jules 3** | Shared Contracts & Types | `packages/types/`, `packages/config/` | `docs/DATA_MODEL.md`, `docs/API_CONTRACT.md` |
| **1** | **PR 1** | **Jules 11** | Frontend App Shell | `apps/web/src/layout/`, `apps/web/package.json`, `apps/web/src/App.tsx` | Initial Repo Skeleton |
| **2** | **PR 2** | **Jules 4** | Eligibility Engine | `apps/api/services/eligibility/`, `apps/api/routers/eligibility.py` | Wave 1 (J1, J2, J3) |
| **2** | **PR 2** | **Jules 5** | Authorization Engine | `apps/api/services/authorization/`, `apps/api/routers/authorization.py` | Wave 1 (J1, J2, J3) |
| **2** | **PR 2** | **Jules 6** | Coverage Engine | `apps/api/services/coverage/`, `apps/api/routers/coverage.py` | Wave 1 (J1, J2, J3) |
| **2** | **PR 2** | **Jules 7** | Data Quality / Corrections | `apps/api/services/quality/`, `apps/api/routers/quality.py` | Wave 1 (J1, J2, J3) |
| **2** | **PR 2** | **Jules 12** | Executive Dashboard UI | `apps/web/src/pages/Dashboard.tsx`, `apps/web/src/pages/Analytics.tsx` | Wave 1 (J3, J11) |
| **2** | **PR 2** | **Jules 13** | Claim Detail Hero Page | `apps/web/src/pages/ClaimDetail.tsx`, `apps/web/src/pages/ClaimsList.tsx` | Wave 1 (J3, J11) |
| **3** | **PR 3** | **Jules 8** | Risk Scoring Engine | `apps/api/services/risk/`, `apps/api/routers/risk.py` | Wave 2 (J4, J5, J6, J7) |
| **3** | **PR 3** | **Jules 9** | Explainability Engine | `apps/api/services/explainability/` | Wave 3 (J8) |
| **3** | **PR 3** | **Jules 10** | Claim Lifecycle Engine | `apps/api/services/lifecycle/`, `apps/api/routers/claims.py` | Wave 2 + J8 |
| **3** | **PR 3** | **Jules 14** | Simulated Payer Adjudication | `apps/api/services/adjudication/`, `apps/api/routers/adjudication.py` | Wave 1 + Wave 2 |
| **4** | **PR 4** | **Jules 15** | Revenue Recovery & Integration | `apps/api/services/recovery/`, `apps/web/src/pages/Recovery.tsx`, E2E tests | Wave 1, 2, 3 |

---

## 2. Individual Agent Detailed Specs

### Jules 1: Backend Foundation
- **Role**: Backend Infrastructure Engineer
- **Scope**: `apps/api/core/`, `apps/api/main.py`, `apps/api/requirements.txt`, `apps/api/tests/test_health.py`
- **Responsibilities**:
  - FastAPI application bootstrap with `/api/v1` prefix.
  - CORS middleware supporting `http://localhost:5173`.
  - Database connection factory with SQLAlchemy (PostgreSQL URL support + SQLite local auto-fallback).
  - Global error handler returning standard error envelope.
  - `/api/v1/health` endpoint returning database ping and uptime.
- **Verification**: `pytest apps/api/tests/test_health.py` passes with 100%.

### Jules 2: Database Domain Model
- **Role**: Relational Data Architect
- **Scope**: `apps/api/models/`
- **Responsibilities**:
  - Implement SQLAlchemy 2.0 declarative models matching `docs/DATA_MODEL.md`.
  - Entities: `Patient`, `Provider`, `Payer`, `InsurancePlan`, `Encounter`, `Claim`, `ClaimLine`, `EligibilityCheck`, `PriorAuthorization`, `RiskScore`, `RiskFactor`, `Correction`, `Adjudication`, `AdjudicationLine`, `RecoveryCase`, `AppealDocument`.
  - Relationships with cascading deletes and indexing on foreign keys (`patient_id`, `claim_id`, `payer_id`).
- **Verification**: `python -c "from apps.api.models import Base; print(Base.metadata.tables.keys())"` prints all 15 tables.

### Jules 3: Shared Contracts & Type Definitions
- **Role**: API & Type Contract Architect
- **Scope**: `packages/types/`, `packages/config/`, `apps/api/schemas/`
- **Responsibilities**:
  - Export TypeScript interfaces for all domain entities, requests, and responses.
  - Mirror Pydantic v2 schemas in `apps/api/schemas/canonical.py`.
  - Export standard constants (CARC/RARC codes, Risk Level thresholds, Claim Status enums).
- **Verification**: TypeScript compiles cleanly (`tsc --noEmit`), Pydantic models validate sample JSON payloads.

### Jules 4: Eligibility & Benefits Engine
- **Role**: EDI 270/271 Specialist
- **Scope**: `apps/api/services/eligibility/`, `apps/api/tests/test_eligibility.py`
- **Responsibilities**:
  - Validate member ID syntax by payer (e.g. BCBS 3 alpha prefix + 9 digits).
  - Verify patient DOB against coverage effective/termination date spans.
  - Calculate remaining deductible and specialist copay.
- **Verification**: Pytest test suite testing active, terminated, and mismatched demographic cases.

### Jules 5: Prior Authorization Engine
- **Role**: Medical Necessity & Clinical Rules Engineer
- **Scope**: `apps/api/services/authorization/`, `apps/api/tests/test_authorization.py`
- **Responsibilities**:
  - Rule matrix evaluating whether CPT code requires prior authorization per payer policy (e.g. MRI 72148, CT 70450, arthroscopy 29881).
  - Check authorization validity window against claim service date.
  - Flag missing or expired authorizations.
- **Verification**: Test suite testing required auth, unneeded auth, and expired auth scenarios.

### Jules 6: Coverage & Benefit Limits Engine
- **Role**: Plan Coverage Specialist
- **Scope**: `apps/api/services/coverage/`, `apps/api/tests/test_coverage.py`
- **Responsibilities**:
  - Validate procedure code against covered benefits for HMO, PPO, Medicare plans.
  - Check frequency limits (e.g. routine physical once per 365 days).
  - Evaluate age and gender contraindications for billed CPT/ICD-10 pairs.
- **Verification**: Pytest covering covered, excluded, and frequency-exceeded cases.

### Jules 7: Data Quality & Pre-Submission Correction Engine
- **Role**: RCM Data Quality Engineer
- **Scope**: `apps/api/services/quality/`, `apps/api/tests/test_quality.py`
- **Responsibilities**:
  - Payer name normalization (e.g. `BlueShild` → `Blue Cross Blue Shield`).
  - Provider NPI 10-digit format and Luhn checksum validation.
  - Diagnosis code ICD-10 formatting (validate standard dot notation).
  - Return structured remediation object (`original`, `suggested`, `reason`, `confidence`).
- **Verification**: Test suite verifying correction accuracy and confidence ratings.

### Jules 8: Claim Risk Scoring Engine
- **Role**: Risk Modeling Engineer
- **Scope**: `apps/api/services/risk/`, `apps/api/tests/test_risk.py`
- **Responsibilities**:
  - Aggregate findings from Eligibility, Prior Auth, Coverage, and Data Quality.
  - Compute normalized 0–100 risk score and subscores based on weighted formula:
    - Auth: 25%
    - Eligibility: 25%
    - Coverage: 20%
    - Quality: 10%
    - Timely Filing: 10%
    - Provider In-Network: 10%
  - Assign risk tier: `LOW` (0-29), `MEDIUM` (30-69), `HIGH` (70-100).
- **Verification**: Tests validating mathematical bounds [0, 100] and risk classifications.

### Jules 9: Explainability & Audit Engine
- **Role**: Human-in-the-Loop Explainability Engineer
- **Scope**: `apps/api/services/explainability/`, `apps/api/tests/test_explainability.py`
- **Responsibilities**:
  - Convert numeric risk factors into clinician/biller-friendly plain English summaries.
  - Project likely CARC/RARC denial codes (e.g. `CO-197` for missing auth, `CO-16` for typo).
  - Provide actionable one-click recommendations to mitigate risk.
- **Verification**: Tests checking that high-risk claims receive unambiguous explanatory bullets.

### Jules 10: Claim Lifecycle State Machine
- **Role**: Workflow & Transaction Architect
- **Scope**: `apps/api/services/lifecycle/`, `apps/api/tests/test_lifecycle.py`
- **Responsibilities**:
  - Enforce valid state transitions:
    `DRAFT` → `VERIFIED` → `READY_FOR_SUBMISSION` → `SUBMITTED` → `ADJUDICATED` → `CLOSED`.
  - Block submission of claims in `HIGH` risk tier unless explicit override flag is supplied.
  - Record full state transition audit trail with timestamps.
- **Verification**: Tests asserting valid transitions succeed and illegal jumps (e.g. DRAFT to ADJUDICATED) raise HTTP 400.

### Jules 11: Frontend Application Shell
- **Role**: Frontend Lead / UI Architect
- **Scope**: `apps/web/src/layout/`, `apps/web/src/App.tsx`, `apps/web/src/index.css`
- **Responsibilities**:
  - Healthcare navigation layout: Top header with user profile & environment badge, responsive collapsible sidebar.
  - Route setup for Dashboard, Claims List, Claim Detail, Eligibility, Recovery, Analytics.
  - Design system configuration: Tailwind colors (`navy`, `emerald`, `amber`, `rose`), badge components, card primitives.
- **Verification**: `npm run build` succeeds; all navigation links route without console errors.

### Jules 12: Executive Claims Dashboard
- **Role**: Frontend Data Visualization Specialist
- **Scope**: `apps/web/src/pages/Dashboard.tsx`, `apps/web/src/pages/Analytics.tsx`
- **Responsibilities**:
  - KPI Stat cards: Total Billed Value, Clean Claim Rate %, Revenue at Risk, Denied Claims.
  - Risk Distribution chart (Low/Med/High breakdown).
  - Top denial root-causes table with financial exposure.
  - Real-time claims activity feed.
- **Verification**: Dashboard renders KPIs cleanly with mock or API data, handles loading/error states.

### Jules 13: Claim Detail Hero Experience
- **Role**: Senior Product UX Engineer
- **Scope**: `apps/web/src/pages/ClaimDetail.tsx`, `apps/web/src/pages/ClaimsList.tsx`
- **Responsibilities**:
  - 360-degree claim cockpit:
    - Header: Claim ID, Payer, Filing deadline countdown, Status badge.
    - Risk Gauge: 0-100 visual meter with color-coded risk tier.
    - Factor breakdown cards with projected CARC codes.
    - Line item table: CPT, units, charge, auth status.
    - Pre-submission one-click data correction banner.
    - Action bar: "Run Intelligence Check", "Apply Corrections", "Submit Claim".
- **Verification**: Full page rendering with interactive tabs, responsive layout, and clean state handling.

### Jules 14: Simulated Clearinghouse & Payer Adjudication
- **Role**: Payer Simulation & EDI 835 Architect
- **Scope**: `apps/api/services/adjudication/`, `apps/api/tests/test_adjudication.py`
- **Responsibilities**:
  - Simulates 835 Electronic Remittance Advice generation.
  - Adjudication logic:
    - Claims with missing auth → DENIED (`CO-197`).
    - Claims past timely filing → DENIED (`CO-29`).
    - Claims with missing demographic data → DENIED (`CO-16`).
    - Clean claims → PAID (calculates Allowed, Contractual Discount `CO-45`, Payer Paid, Patient Responsibility `PR-1`).
- **Verification**: Pytest tests confirming accurate financial math: `Billed = Allowed + Contractual Adj` and `Allowed = Payer Paid + Patient Resp`.

### Jules 15: Revenue Recovery Engine & Full Integration
- **Role**: Recovery Specialist & Lead Integrator
- **Scope**: `apps/api/services/recovery/`, `apps/web/src/pages/Recovery.tsx`, `apps/api/tests/test_integration.py`
- **Responsibilities**:
  - Ingest adjudicated denials and underpayments into prioritized recovery queues.
  - Compute Recoverability Score (0-100) based on denial root cause and appeal win rates.
  - Automated Appeal Letter generation citing CMS guidelines and attached documentation.
  - End-to-end integration test validating the entire pipeline: Patient -> Claim -> Risk -> Submission -> Adjudication -> Recovery Case.
- **Verification**: `pytest apps/api/tests/test_integration.py` passes end-to-end.
