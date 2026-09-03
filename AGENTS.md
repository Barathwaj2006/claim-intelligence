# Agent Rules and Orchestration Governance

Welcome to the **U.S. Healthcare Claim Intelligence Platform** repository. This codebase operates under a multi-agent orchestration architecture where agents (Antigravity and Jules) implement specific subsystems in parallel.

All agents operating in this repository MUST strictly abide by the following rules:

---

## 1. Golden Rules of Agent Execution

1. **Read Governance First**:
   Always read `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, and `docs/API_CONTRACT.md` before making any code modifications.

2. **Strict Ownership Boundaries**:
   You have a strictly assigned file ownership scope (see `docs/JULES_WORK_ASSIGNMENTS.md` or your assigned task prompt).
   **DO NOT modify, rename, or delete files outside of your assigned ownership boundary.**

3. **No Dependency File Conflicts**:
   - `apps/api/requirements.txt` is owned exclusively by **Jules 1 (Backend Foundation)**.
   - `apps/web/package.json` is owned exclusively by **Jules 11 (Frontend App Shell)**.
   - `packages/types/package.json` is owned exclusively by **Jules 3 (Shared Contracts)**.
   If your task requires an additional external dependency, notify the orchestrator or use standard standard-library capabilities rather than altering dependency manifests.

4. **Preserve Canonical Contracts**:
   Do not modify existing Pydantic models in `apps/api/schemas/` or TypeScript definitions in `packages/types/` without documenting the reason. All communication between backend and frontend must adhere strictly to `docs/API_CONTRACT.md`.

5. **Synthetic Healthcare Data Only (HIPAA Safe)**:
   Under no circumstances may real Protected Health Information (PHI) or Personally Identifiable Information (PII) be committed to this repository. Use only the synthetic data provided in `data/seed/` and `data/fixtures/` conforming to realistic CMS-1500, ICD-10-CM, and CPT/HCPCS formats.

6. **Deterministic Rule Engines over Uncontrolled LLMs**:
   Core RCM engines (Eligibility, Prior Auth, Coverage, Risk Scoring, Adjudication) must be built as deterministic, auditable rule-based engines. AI/LLM components are reserved exclusively for human-facing explanations, appeal letter generation, and unstructured document extraction.

7. **Mandatory Automated Verification**:
   Before declaring any task complete:
   - Backend agents must run `pytest` inside `apps/api` and confirm all tests pass with 0 errors.
   - Frontend agents must run type-checks (`npm run build` or `tsc --noEmit`) inside `apps/web`.
   - Never skip tests or silence assertions.

8. **Four-PR Grouping Discipline**:
   Changes must align with the 4 assigned PR stages:
   - **PR 1**: Foundation (J1, J2, J3, J11)
   - **PR 2**: Insurance Intelligence (J4, J5, J6, J7, J12, J13)
   - **PR 3**: Claim Intelligence (J8, J9, J10, J14)
   - **PR 4**: Adjudication & Revenue Recovery (J15 + Integration)

---

## 2. Directory Layout & Ownership Map

```text
claim-intelligence/
├── apps/
│   ├── api/                    # Backend (FastAPI, Python 3.11+)
│   │   ├── core/               # Jules 1 (Config, DB session, CORS)
│   │   ├── models/             # Jules 2 (SQLAlchemy entities)
│   │   ├── schemas/            # Jules 3 (Pydantic canonical schemas)
│   │   ├── services/
│   │   │   ├── eligibility/    # Jules 4 (Eligibility & Benefits engine)
│   │   │   ├── authorization/  # Jules 5 (Prior Authorization engine)
│   │   │   ├── coverage/       # Jules 6 (Coverage & Benefit limits engine)
│   │   │   ├── quality/        # Jules 7 (Data Quality & Correction engine)
│   │   │   ├── risk/           # Jules 8 (Claim Risk Scoring engine)
│   │   │   ├── explainability/ # Jules 9 (Explainability & Audit engine)
│   │   │   ├── lifecycle/      # Jules 10 (Claim Lifecycle state machine)
│   │   │   ├── adjudication/   # Jules 14 (Simulated Clearinghouse & Payer Adjudication)
│   │   │   └── recovery/       # Jules 15 (Revenue Recovery & Appeals engine)
│   │   ├── routers/            # Routers assigned per domain
│   │   └── tests/              # Dedicated test suites per engine
│   └── web/                    # Frontend (React 18 + Vite + TS + Tailwind)
│       ├── src/
│       │   ├── layout/         # Jules 11 (App Shell, Navbar, Sidebar)
│       │   ├── components/     # Shared UI components
│       │   └── pages/
│       │       ├── Dashboard.tsx    # Jules 12 (Executive dashboard)
│       │       ├── ClaimDetail.tsx  # Jules 13 (Hero claim inspector)
│       │       ├── ClaimsList.tsx   # Jules 11/12
│       │       ├── Eligibility.tsx  # Jules 11/4
│       │       ├── Recovery.tsx     # Jules 15
│       │       └── Analytics.tsx    # Jules 12
├── packages/
│   ├── types/                  # Jules 3 (Shared TypeScript interfaces)
│   └── config/                 # Jules 3 (Shared system constants)
├── data/
│   ├── seed/                   # Antigravity (Standard payers, NPIs, sample claims)
│   └── fixtures/               # Test fixtures (EDI 837P, 835 ERA mocks)
├── docs/
│   ├── ARCHITECTURE.md         # Master RCM Architecture
│   ├── DATA_MODEL.md           # Canonical Data Model
│   ├── API_CONTRACT.md         # REST API Contract
│   ├── JULES_WORK_ASSIGNMENTS.md # Master Agent Matrix
│   └── tasks/                  # Standalone prompt specs for Jules 1-15
├── docker-compose.yml          # Container orchestration
└── README.md                   # System documentation & quickstart
```

---

## 3. Communication Protocol for Blockers

If an agent encounters a missing module or interface from an uncompleted predecessor:
1. Check `docs/API_CONTRACT.md` and `docs/DATA_MODEL.md` for the exact signature.
2. Implement a local stub or adapter conforming strictly to that contract.
3. Add a `# TODO: Replace with Jules X implementation` marker.
4. Never invent an incompatible custom interface.
