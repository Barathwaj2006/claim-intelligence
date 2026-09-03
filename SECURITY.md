# Security & HIPAA Compliance Policy

## 1. Synthetic Data & HIPAA Safe Harbor

The **U.S. Healthcare Claim Intelligence Platform** operates exclusively on **synthetic, de-identified healthcare data** conforming to the HIPAA Privacy Rule Safe Harbor standard (45 CFR § 164.514(b)(2)).

- **Zero Real PHI/PII**: Under no circumstances is real Protected Health Information (PHI) or Personally Identifiable Information (PII) committed or processed in this repository.
- **Realistic Synthetic Entities**: All patient profiles, subscriber IDs, National Provider Identifiers (NPIs), and clinical records are algorithmically generated for demonstration, testing, and validation purposes.
- **National Coding Compliance**: Synthetic claims utilize authentic ICD-10-CM diagnostic codes, CPT-4/HCPCS Level II procedure codes, UB-04 revenue codes, and Claim Adjustment Reason Codes (CARCs/RARCs) without referencing real patient encounters.

## 2. Deterministic Engine Security

- Core adjudication, eligibility verification, prior authorization matching, and risk scoring are executed via **deterministic rule engines** rather than black-box probabilistic models.
- Financial accounting equations (EDI 835 Remittance balancing, contract variance auditing) enforce mathematical invariants to prevent calculation drift or tampering.

## 3. Reporting Security Vulnerabilities

If you discover a potential security vulnerability in this project:

1. **Do not create a public GitHub issue.**
2. Report the vulnerability privately to the project maintainers via GitHub Security Advisories or by emailing the project maintainers.
3. Provide detailed steps to reproduce the vulnerability, including sample requests, environment details, and potential impact.

Security reports are typically acknowledged within 48 hours, and patches are coordinated through private release branches.
