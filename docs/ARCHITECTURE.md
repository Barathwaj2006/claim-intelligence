# U.S. Healthcare Claim Intelligence Platform: System Architecture

## 1. Executive Summary

The **U.S. Healthcare Claim Intelligence Platform** is an enterprise-grade Revenue Cycle Management (RCM) intelligence engine. It addresses the \$265+ billion annual waste in U.S. healthcare administrative billing by catching denial-prone claims **before submission**, explaining root-cause risks, simulating payer adjudication, and automating revenue recovery workflows.

---

## 2. End-to-End U.S. Healthcare Revenue Cycle Flow

```text
                       PATIENT REGISTRATION
                                │
                                ▼
                       CLINICAL ENCOUNTER
                     (ICD-10-CM / CPT / HCPCS)
                                │
                                ▼
                    ELIGIBILITY & BENEFITS (270/271)
                     Active coverage, copay, deductibles
                                │
                                ▼
                     PRIOR AUTHORIZATION (278)
                      Medical necessity rules & codes
                                │
                                ▼
                     CLINICAL DOCUMENTATION
                      Operative notes, physician attestations
                                │
                                ▼
                     CLAIM PREPARATION (CMS-1500 / 837P)
                                │
                                ▼
                  DATA QUALITY & CORRECTION ENGINE
                   NPI formatting, typo repair, code checks
                                │
                                ▼
                    CLAIM INTELLIGENCE & RISK ENGINE
                     Multifactor 0–100 Denial Scoring
                                │
                                ▼
                   AUDIT & EXPLAINABILITY ENGINE
                   Rule-by-rule factor decomposition
                                │
                    ┌───────────┴───────────┐
                    │                       │
              [Risk >= 50]             [Risk < 50]
                    ▼                       ▼
            HUMAN-IN-THE-LOOP       AUTOMATED CLEAN SUBMISSION
          Review & One-Click Fix            │
                    │                       │
                    └───────────┬───────────┘
                                │
                                ▼
                     SIMULATED CLEARINGHOUSE
                      Syntax & EDI 837 validation
                                │
                                ▼
                     SIMULATED PAYER ADJUDICATION
                      Medicare / BCBS / UHC / Aetna
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
        PAID                 DENIED               UNDERPAID
   (Clean Payment)       (CARC/RARC Codes)      (Contract Shortfall)
          │                     │                     │
          │                     └──────────┬──────────┘
          │                                │
          ▼                                ▼
       FINANCIAL                    REVENUE RECOVERY
      RECONCILIATION                 PRIORITIZATION
          │                                │
          │                                ▼
          │                     APPEAL / RECONSIDERATION
          │                     Automated Packets & Dossiers
          │                                │
          └─────────────────────┬──────────┘
                                │
                                ▼
                    FEEDBACK LOOP TO RISK MODEL
```

---

## 3. Technology Stack & Architecture Rationale

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite, TypeScript | Ultra-fast HMR, strict type-safety, lightweight client footprint |
| **Styling & UI** | Tailwind CSS, Lucide Icons, clsx | Enterprise clinical UI design with high-density data tables and badges |
| **State & Data Fetching** | TanStack Query, React Router v6 | Optimistic updates, cache invalidation for claim status lifecycle |
| **Backend API** | FastAPI, Python 3.11+ | High performance asynchronous I/O, native Pydantic v2 validation |
| **ORM / Data Layer** | SQLAlchemy 2.0 | Dual PostgreSQL (production) & SQLite (local dev zero-config) support |
| **Type Synchronization** | TypeScript interfaces (`packages/types`) | Shared single source of truth across frontend and backend |
| **Engine Design** | Deterministic Rule Engines | Zero-hallucination compliance, predictable scoring, auditability |

---

## 4. Subsystem Decomposition

### Group A: Foundation Layer
- **apps/api/core**: Centralized settings, CORS security, database session factories, structured logging.
- **apps/api/models**: Canonical relational schema representing U.S. insurance entities.
- **packages/types**: Shared contracts guaranteeing typed interfaces for frontend and API consumers.
- **apps/web/src/layout**: Healthcare dashboard shell with breadcrumbs, notifications, and navigation.

### Group B: Insurance Intelligence Layer
- **Eligibility Engine (J4)**: Simulates HIPAA 270/271 real-time eligibility inquiry. Verifies active date spans, payer IDs, subscriber relationships, deductible remaining, and copays.
- **Authorization Engine (J5)**: Evaluates whether billed CPT codes require prior auth under specific payer policies. Validates authorization numbers, authorized date spans, and remaining approved units.
- **Coverage Engine (J6)**: Validates plan medical necessity, age/gender restrictions for procedure codes, and annual/lifetime frequency caps.
- **Data Quality & Correction Engine (J7)**: Detects typos (e.g. `BlueShild` → `BlueShield`), validates 10-digit NPIs with Luhn check, verifies ICD-10 dot formatting, and generates an audit log of proposed fixes.

### Group C: Claim Intelligence Layer
- **Risk Scoring Engine (J8)**: Computes a weighted 0–100 denial risk composite across 6 distinct dimensions:
  - Eligibility (25%)
  - Authorization (25%)
  - Coverage & Medical Necessity (20%)
  - Data Quality (10%)
  - Timely Filing (10%)
  - Historical Payer Friction (10%)
- **Explainability Engine (J9)**: Decomposes the risk score into human-readable positive and negative factors, citing specific CARC/RARC codes likely to trigger if uncorrected.
- **Lifecycle Engine (J10)**: State machine enforcing transition invariants: `DRAFT` → `VERIFIED` → `READY` → `SUBMITTED` → `ADJUDICATED` (`PAID`, `DENIED`, `UNDERPAID`, `PENDING`).
- **Simulated Clearinghouse & Payer Adjudication (J14)**: Simulates 835 Electronic Remittance Advice (ERA) generation with realistic financial math: Billed Amount, Allowed Amount, Contractual Adjustment, Payer Paid, and Patient Responsibility.

### Group D: Revenue Recovery & UI
- **Revenue Recovery Engine (J15)**: Prioritizes denied and underpaid claims by dollar value, recoverability probability, and appeal filing deadlines. Automatically drafts payer-specific reconsideration and appeal packets.
- **Executive Dashboard (J12)**: Aggregates total claims volume, revenue at risk, average clean-claim rate, and denial distributions.
- **Claim Detail Hero Experience (J13)**: 360-degree claim cockpit displaying patient, diagnosis, procedure lines, real-time risk breakdown, interactive data quality corrections, and submission actions.

---

## 5. Wave Execution & PR Strategy

To enable 15 parallel Jules agents to execute without merge conflicts or broken interfaces, work proceeds in 4 dependency waves mapped directly into 4 PR merges:

```text
┌────────────────────────────────────────────────────────┐
│ WAVE 1: FOUNDATION (PR 1)                             │
│ J1 (API Core)  J2 (DB Models)  J3 (Contracts)  J11(UI) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ WAVE 2: INSURANCE INTELLIGENCE (PR 2)                  │
│ J4 (Eligibility) J5 (Auth) J6 (Coverage) J7 (Quality)   │
│ J12 (Dashboard)  J13 (Claim Detail Hero Page)          │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ WAVE 3: CLAIM INTELLIGENCE & ADJUDICATION (PR 3)       │
│ J8 (Risk)  J9 (Explainability) J10(Lifecycle) J14(Payer)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ WAVE 4: REVENUE RECOVERY & INTEGRATION (PR 4)          │
│ J15 (Recovery, Appeals, System Integration, E2E Tests) │
└────────────────────────────────────────────────────────┘
```
