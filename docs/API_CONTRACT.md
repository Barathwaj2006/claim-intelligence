# REST API Contract & Endpoint Specification

Base URL: `/api/v1`

All responses are formatted in UTF-8 JSON. Standard HTTP status codes are used for errors and successes.

---

## 1. Global Response & Error Envelopes

### Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Claim with ID CLM-001 was not found",
    "details": []
  }
}
```

---

## 2. Endpoints by Subsystem

### 2.1 Health & Diagnostics
#### `GET /health`
- **Description**: Returns system health, database connectivity status, and version.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2026-09-03T12:00:00Z"
}
```

---

### 2.2 Claims Management
#### `GET /claims`
- **Query Params**:
  - `status`: Filter by claim status (e.g. `DRAFT`, `SUBMITTED`, `ADJUDICATED`)
  - `risk_level`: Filter by risk (e.g. `LOW`, `MEDIUM`, `HIGH`)
  - `payer_id`: Filter by payer
  - `limit`: Default `50`
  - `offset`: Default `0`
- **Response `200 OK`**:
```json
{
  "total": 45,
  "limit": 50,
  "offset": 0,
  "items": [
    {
      "id": "c1a2-3b4c",
      "claim_number": "CLM-2026-00101",
      "patient_name": "Eleanor Vance",
      "member_id": "BCBS-982310",
      "payer_name": "Blue Cross Blue Shield",
      "service_date": "2026-08-15",
      "total_billed_amount": 1450.00,
      "status": "READY_FOR_SUBMISSION",
      "risk_score": 18,
      "risk_level": "LOW",
      "filing_deadline": "2026-11-15"
    }
  ]
}
```

#### `GET /claims/{id}`
- **Description**: Full 360-degree claim record including patient, provider, diagnosis codes, procedure claim lines, prior auth details, risk score, and corrections.
- **Response `200 OK`**: Detailed `ClaimDetail` payload.

---

### 2.3 Insurance Intelligence Endpoints
#### `POST /claims/{id}/eligibility`
- **Description**: Triggers HIPAA 270 inquiry simulation against patient payer record.
- **Response `200 OK`**:
```json
{
  "claim_id": "c1a2-3b4c",
  "is_active": true,
  "effective_date": "2026-01-01",
  "termination_date": null,
  "copay_amount": 35.00,
  "deductible_total": 1500.00,
  "deductible_met": 1200.00,
  "deductible_remaining": 300.00,
  "payer_name": "Blue Cross Blue Shield",
  "status": "VERIFIED"
}
```

#### `POST /claims/{id}/authorization`
- **Description**: Evaluates if billed procedures require prior authorization under the payer's clinical guidelines.
- **Response `200 OK`**:
```json
{
  "claim_id": "c1a2-3b4c",
  "requires_auth": true,
  "auth_status": "APPROVED",
  "authorization_number": "AUTH-72148-99A",
  "authorized_cpt_codes": ["72148"],
  "valid_through": "2026-10-30",
  "warnings": []
}
```

#### `POST /claims/{id}/coverage`
- **Description**: Validates medical necessity crosswalk between primary diagnosis (ICD-10) and billed CPT lines.
- **Response `200 OK`**:
```json
{
  "claim_id": "c1a2-3b4c",
  "coverage_status": "COVERED",
  "medical_necessity_met": true,
  "frequency_limits_exceeded": false,
  "policy_notes": "L-Spine MRI indicated for chronic radiculopathy persisting > 6 weeks"
}
```

#### `POST /claims/{id}/validate`
- **Description**: Runs Data Quality & Correction rules (typo detection, NPI format, ICD-10 validity).
- **Response `200 OK`**:
```json
{
  "claim_id": "c1a2-3b4c",
  "has_quality_issues": true,
  "corrections": [
    {
      "id": "corr-1",
      "field_name": "payer_name",
      "original_value": "BlueShild",
      "suggested_value": "Blue Cross Blue Shield",
      "reason": "Normalized common OCR/typo abbreviation",
      "confidence": 0.98,
      "status": "PENDING"
    }
  ]
}
```

---

### 2.4 Claim Intelligence & Risk Endpoints
#### `POST /claims/{id}/risk-score`
- **Description**: Computes composite 0-100 denial risk score and individual dimension subscores.
- **Response `200 OK`**:
```json
{
  "claim_id": "c1a2-3b4c",
  "overall_score": 82,
  "risk_level": "HIGH",
  "subscores": {
    "eligibility": 0,
    "authorization": 95,
    "coverage": 40,
    "data_quality": 60,
    "timely_filing": 10
  },
  "calculated_at": "2026-09-03T12:30:00Z"
}
```

#### `GET /claims/{id}/explain`
- **Description**: Provides plain-language explanations of risk factors and likely denial CARC codes.
- **Response `200 OK`**:
```json
{
  "claim_id": "c1a2-3b4c",
  "overall_score": 82,
  "summary": "High Denial Risk: Claim is missing prior authorization for an advanced imaging procedure (CPT 72148).",
  "factors": [
    {
      "category": "AUTHORIZATION",
      "impact": 35,
      "title": "Missing Prior Authorization",
      "description": "Payer policy requires prior authorization for MRI Lumbar Spine (72148). No valid authorization record found.",
      "likely_carc": "CO-197",
      "recommended_fix": "Obtain retro-authorization or attach existing authorization number before submitting."
    }
  ]
}
```

---

### 2.5 Submission & Clearinghouse Simulation
#### `POST /claims/{id}/submit`
- **Description**: Moves claim to `SUBMITTED` state, generates EDI 837P batch record, and logs submission timestamp.
- **Response `200 OK`**:
```json
{
  "claim_id": "c1a2-3b4c",
  "claim_number": "CLM-2026-00101",
  "status": "SUBMITTED",
  "clearinghouse_trace_id": "TRACE-908234-837P",
  "submitted_at": "2026-09-03T12:35:00Z"
}
```

#### `POST /claims/{id}/adjudicate`
- **Description**: Simulates payer adjudication engine producing an 835 ERA response with payment breakdown.
- **Response `200 OK`**:
```json
{
  "claim_id": "c1a2-3b4c",
  "adjudication_id": "adj-9912",
  "status": "DENIED",
  "billed_amount": 1450.00,
  "allowed_amount": 0.00,
  "contractual_adjustment": 0.00,
  "payer_paid_amount": 0.00,
  "patient_responsibility": 0.00,
  "lines": [
    {
      "claim_line_id": "line-1",
      "cpt_code": "72148",
      "paid_amount": 0.00,
      "carc_code": "CO-197",
      "carc_description": "Precertification/authorization/notification/pre-treatment absent.",
      "rarc_code": "N56"
    }
  ]
}
```

---

### 2.6 Revenue Recovery & Appeals
#### `GET /recovery/cases`
- **Description**: Lists prioritized denial recovery cases sorted by revenue at risk and recoverability.
- **Response `200 OK`**: List of `RecoveryCase` objects.

#### `POST /recovery/cases/{id}/appeal`
- **Description**: Generates an appeal dossier or corrected claim packet.
- **Response `200 OK`**:
```json
{
  "case_id": "rec-101",
  "document_type": "FIRST_LEVEL_APPEAL",
  "payer_name": "Blue Cross Blue Shield",
  "appeal_filing_deadline": "2026-11-15",
  "appeal_letter_markdown": "# FORMAL RECONSIDERATION REQUEST\n\n**To:** Blue Cross Blue Shield Appeals Unit\n...",
  "generated_at": "2026-09-03T12:40:00Z"
}
```

---

### 2.7 Executive Analytics Dashboard
#### `GET /analytics/dashboard`
- **Description**: KPI metrics for executive RCM overview.
- **Response `200 OK`**:
```json
{
  "total_claims": 142,
  "clean_claim_rate": 84.5,
  "total_billed_value": 428900.00,
  "revenue_at_risk": 58300.00,
  "recovered_revenue": 34200.00,
  "risk_distribution": {
    "low": 98,
    "medium": 28,
    "high": 16
  },
  "top_denial_reasons": [
    { "carc": "CO-197", "description": "Precertification/auth absent", "count": 9, "amount": 28400.00 },
    { "carc": "CO-16", "description": "Claim lacks info needed for adjudication", "count": 5, "amount": 14200.00 }
  ]
}
```
