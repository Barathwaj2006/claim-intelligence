# Jules Task 02: Database Domain Model

## Wave & PR Target
- **Wave**: 1 (Foundation)
- **Target PR**: PR 1 (Foundation)

## Mission
Implement the authoritative SQLAlchemy 2.0 database domain models in `apps/api/models/` matching the specifications in `docs/DATA_MODEL.md`.

## Exclusive File Ownership
- `apps/api/models/`
- `apps/api/tests/test_models.py`

**Forbidden Paths**: Do NOT edit `apps/web/`, `apps/api/core/`, or `packages/types/`.

## Prerequisites & Dependencies
- Read `docs/DATA_MODEL.md` thoroughly.
- Imports declarative `Base` from `apps.api.core.database`.

## Detailed Requirements
1. **Model Definitions (`apps/api/models/entities.py` and `__init__.py`)**:
   Implement all 15 relational tables using SQLAlchemy 2.0 `Mapped` and `mapped_column`:
   - `Patient`: `id` (UUID), `first_name`, `last_name`, `date_of_birth`, `gender`, `member_id`, `group_number`, `address`, `created_at`.
   - `Provider`: `id`, `npi` (10 chars), `name`, `taxonomy_code`, `tax_id`, `in_network`.
   - `Payer`: `id`, `name`, `payer_id`, `timely_filing_days`, `requires_auth_for_advanced_imaging`.
   - `InsurancePlan`: `id`, `payer_id`, `plan_name`, `plan_type`, `annual_deductible`, `copay_specialist`, `coinsurance_percentage`.
   - `Encounter`: `id`, `patient_id`, `provider_id`, `service_date`, `place_of_service`, `primary_diagnosis_code`, `secondary_diagnosis_codes`, `clinical_notes`.
   - `Claim`: `id`, `claim_number`, `patient_id`, `provider_id`, `payer_id`, `encounter_id`, `status`, `total_billed_amount`, `service_date`, `filing_deadline`, `created_at`, `updated_at`.
   - `ClaimLine`: `id`, `claim_id`, `line_number`, `cpt_code`, `modifiers`, `diagnosis_pointers`, `units`, `unit_price`, `total_amount`.
   - `EligibilityCheck`: `id`, `patient_id`, `payer_id`, `check_date`, `is_active`, `effective_date`, `termination_date`, `deductible_total`, `deductible_met`, `copay_amount`, `raw_response`.
   - `PriorAuthorization`: `id`, `claim_id`, `cpt_code`, `authorization_number`, `status`, `approved_units`, `valid_from`, `valid_to`.
   - `RiskScore`: `id`, `claim_id`, `overall_score`, `risk_level`, `eligibility_subscore`, `authorization_subscore`, `coverage_subscore`, `quality_subscore`, `calculated_at`.
   - `RiskFactor`: `id`, `risk_score_id`, `impact_points`, `category`, `title`, `description`, `likely_carc_code`.
   - `Correction`: `id`, `claim_id`, `field_name`, `original_value`, `suggested_value`, `reason`, `confidence`, `status`.
   - `Adjudication`: `id`, `claim_id`, `adjudication_date`, `status`, `billed_amount`, `allowed_amount`, `contractual_adjustment`, `payer_paid_amount`, `patient_responsibility`.
   - `AdjudicationLine`: `id`, `adjudication_id`, `claim_line_id`, `paid_amount`, `carc_code`, `carc_description`, `rarc_code`.
   - `RecoveryCase`: `id`, `claim_id`, `adjudication_id`, `revenue_at_risk`, `recoverability_score`, `priority`, `status`, `recommended_action`, `filing_deadline`.
   - `AppealDocument`: `id`, `recovery_case_id`, `document_type`, `content`, `created_at`.

2. **Foreign Keys & Cascades**:
   - Establish correct foreign key relationships (`ForeignKey("patients.id")`, etc.) and back-populates.

3. **Verification Test (`apps/api/tests/test_models.py`)**:
   - Instantiate an in-memory SQLite engine.
   - Run `Base.metadata.create_all(engine)` and assert all 15 tables exist in the metadata schema.

## Verification Command
```bash
cd apps/api
pytest tests/test_models.py
```
