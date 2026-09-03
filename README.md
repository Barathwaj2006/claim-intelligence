# U.S. Healthcare Claim Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)

An enterprise-grade Revenue Cycle Management (RCM) intelligence engine designed to eliminate administrative claim denials **before submission**, explain root-cause risks, simulate payer adjudication, and automate denial recovery and appeals.

---

## 🚀 Key Capabilities

- **Real-Time Eligibility (EDI 270/271)**: Instant verification of member ID, active coverage spans, copays, and remaining deductibles.
- **Prior Authorization Engine**: Clinical rule matrix detecting missing authorizations on high-dollar CPT procedures (e.g. Lumbar MRI, Arthroscopy) before submission, preventing **CO-197** denials.
- **Coverage & Medical Necessity Crosswalk**: Validates ICD-10 to CPT compatibility, gender/age contraindications, and annual benefit limits.
- **Pre-Submission Data Quality Remediation**: Detects and fixes typos (e.g. `BlueShild` → `Blue Cross Blue Shield`), validates 10-digit NPIs with Luhn checksums, and formats ICD-10 codes with audit trails.
- **Multi-Factor Denial Risk Scoring (0–100)**: Deterministic composite scoring across Eligibility, Auth, Coverage, Quality, and Timely Filing.
- **Explainability & Projected CARC Codes**: Plain-English factor decomposition with actionable next-best-steps and predicted CARC/RARC codes.
- **Simulated Clearinghouse & Payer Adjudication (EDI 835)**: Generates remittance advices with accurate mathematical accounting (Billed = Allowed + Contractual Adj; Allowed = Payer Paid + Patient Responsibility).
- **Revenue Recovery & Automated Appeals**: Converts denied, pended, and underpaid claims into structured recovery opportunities with deterministic recoverability scoring, priority matrix, expected recovery values, human approval controls, and automated clinical appeal dossiers.

---

## 🏛️ System Architecture

```text
PATIENT REGISTRATION
        ↓
CLINICAL ENCOUNTER (CPT / ICD-10)
        ↓
ELIGIBILITY & BENEFITS (270/271)
        ↓
PRIOR AUTHORIZATION (278)
        ↓
CLAIM PREPARATION (CMS-1500 / 837P)
        ↓
DATA QUALITY & PRE-SUBMISSION CORRECTION
        ↓
CLAIM INTELLIGENCE & RISK SCORING (0-100)
        ↓
EXPLAINABILITY & PREDICTED CARCS
   ┌────┴────┐
   ↓         ↓
[LOW RISK] [HIGH RISK (>=70)]
   │         ↓
   │     ONE-CLICK REMEDIATION
   │         ↓
CLEAN CLAIM SUBMISSION
        ↓
SIMULATED CLEARINGHOUSE
        ↓
SIMULATED PAYER ADJUDICATION (EDI 835)
   ┌─────────┼──────────┐
   ↓         ↓          ↓
 PAID      DENIED   UNDERPAID
             │          │
             └────┬─────┘
                  ↓
          REVENUE RECOVERY
                  ↓
   AUTOMATED APPEAL DOSSIER & RETRO-AUTH
```

---

## 👥 15-Agent Multi-Agent Orchestration Plan

This repository is orchestrated across **4 sequential dependency waves** and merged into **4 discrete Pull Requests**:

```text
Wave 1 (PR 1: Foundation)
  ├── J1: Backend Foundation (FastAPI, CORS, DB config)
  ├── J2: Database Domain Model (SQLAlchemy 15 entities)
  ├── J3: Shared Contracts & Types (TypeScript & Pydantic)
  └── J11: Frontend Application Shell (Vite, React, Tailwind)

Wave 2 (PR 2: Insurance Intelligence)
  ├── J4: Eligibility Engine (270/271 simulation)
  ├── J5: Prior Authorization Engine (Clinical rules)
  ├── J6: Coverage & Necessity Engine (Crosswalks)
  ├── J7: Data Quality & Correction Engine (NPI, typos)
  ├── J12: Executive Claims Dashboard (KPIs, revenue at risk)
  └── J13: Claim Detail Hero Page (360 Cockpit, risk gauge)

Wave 3 (PR 3: Claim Intelligence & Adjudication)
  ├── J8: Claim Risk Scoring Engine (0-100 composite)
  ├── J9: Explainability & Audit Engine (Factor decomposition)
  ├── J10: Claim Lifecycle State Machine (Submission gate)
  └── J14: Simulated Clearinghouse & Payer Adjudication (835 ERA)

Wave 4 (PR 4: Revenue Recovery & Integration)
  └── J15: Revenue Recovery, Appeal Generation & E2E Integration
```

Detailed individual prompt specifications for each agent are located in [`docs/tasks/`](file:///c:/Users/barat/OneDrive/Desktop/Insurence%20Claim/docs/tasks/).

---

## ⚡ Quick Start

### 1. Backend API (FastAPI)
```bash
cd apps/api
# Recommended: Create virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/api/v1/docs`
- Health Check: `http://localhost:8000/api/v1/health`

### 2. Frontend Application (React + Vite)
```bash
cd apps/web
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

### 3. Run Automated Tests
```bash
cd apps/api
pytest -v
```

---

## 📂 Repository Layout
- `apps/api/`: FastAPI backend with core config, models, schemas, and routers.
- `apps/web/`: React 18 + Vite + Tailwind frontend application.
- `packages/types/`: Canonical TypeScript interfaces for zero-drift type safety.
- `packages/config/`: Shared constants, CARC/RARC codes, and risk weight definitions.
- `data/seed/`: Synthetic U.S. healthcare seed data (payers, claims, NPIs).
- `data/fixtures/`: Synthetic test fixtures for eligibility and adjudication testing.
- `docs/`:
  - `ARCHITECTURE.md`: Master architectural specification.
  - `DATA_MODEL.md`: Relational entity documentation and schema details.
  - `API_CONTRACT.md`: RESTful endpoint contract and response envelopes.
  - `JULES_WORK_ASSIGNMENTS.md`: Master 15-agent assignment matrix.
  - `tasks/`: Standalone execution prompts for Jules 1 through 15.
- `AGENTS.md`: Multi-agent operational rules, boundary constraints, and safety guidelines.
