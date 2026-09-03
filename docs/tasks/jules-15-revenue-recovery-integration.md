# Jules Task 15: Revenue Recovery Engine & Full System Integration

## Wave & PR Target
- **Wave**: 4 (Revenue Recovery & Integration)
- **Target PR**: PR 4 (Revenue Recovery & Integration)

## Mission
Build the denial recovery and automated appeals generation engine in `apps/api/services/recovery/`, build the frontend recovery page (`apps/web/src/pages/Recovery.tsx`), and write the comprehensive end-to-end integration test suite.

## Exclusive File Ownership
- `apps/api/services/recovery/`
- `apps/api/routers/recovery.py`
- `apps/web/src/pages/Recovery.tsx`
- `apps/api/tests/test_integration.py`
- `README.md` (Final documentation update)

## Prerequisites & Dependencies
- Waves 1, 2, and 3 complete across all backend and frontend services.

## Detailed Requirements
1. **Recovery Prioritization Algorithm (`apps/api/services/recovery/prioritizer.py`)**:
   - Ingest claims with status `ADJUDICATED` and adjudication outcome `DENIED` or `UNDERPAID`.
   - Calculate Recoverability Score (0-100):
     - `CO-16` (Missing Info): 90% recoverability (high probability with submission of missing record).
     - `CO-197` (Missing Auth): 60% recoverability (retro-auth or provider appeal).
     - `CO-29` (Timely Filing): 15% recoverability (requires proof of initial timely submission).
   - Priority Matrix:
     - `URGENT`: Revenue at risk > $5,000 OR filing deadline < 14 days.
     - `HIGH`: Revenue at risk $1,000 - $5,000.
     - `MEDIUM`: Revenue at risk < $1,000.

2. **Automated Appeal Dossier Generator (`apps/api/services/recovery/appeal_generator.py`)**:
   - Synthesizes professional U.S. health insurance formal appeal / reconsideration letters:
     - Cites Patient Name, Member ID, Claim Number, Service Date, Billed CPTs.
     - Cites specific denial CARC code and refutes denial based on clinical justification.
     - Formatted in clean Markdown with formal clinic letterhead structure.

3. **Frontend Recovery Page (`apps/web/src/pages/Recovery.tsx`)**:
   - Work queue of active recovery cases with Priority pills (`URGENT`, `HIGH`, etc.).
   - Recoverability score progress ring/bar.
   - "Generate Formal Appeal" action button opening modal with editable appeal letter.
   - "Download Appeal Packet" action.

4. **End-to-End Integration Test (`apps/api/tests/test_integration.py`)**:
   - Full lifecycle test:
     1. Create Patient, Payer, Provider, and Encounter.
     2. Create Claim for CPT `72148` (MRI Lumbar Spine).
     3. Run Eligibility check (assert active coverage).
     4. Run Auth check (assert missing auth identified).
     5. Calculate Risk Score (assert high risk, score >= 70).
     6. Submit claim with force override.
     7. Adjudicate claim (assert denied with CARC `CO-197`).
     8. Ingest into Recovery engine (assert recovery case generated with appeal letter).

## Verification Command
```bash
cd apps/api
pytest tests/test_integration.py
```
