/**
 * Standard Claim Adjustment Reason Codes (CARC)
 */
export const CARC_CODES = {
  CO_16: {
    code: 'CO-16',
    title: 'Claim/service lacks information or has submission/billing error(s)',
    category: 'DATA_QUALITY'
  },
  CO_27: {
    code: 'CO-27',
    title: 'Expenses incurred after coverage terminated or prior to effective date',
    category: 'ELIGIBILITY'
  },
  CO_29: {
    code: 'CO-29',
    title: 'The time limit for filing has expired',
    category: 'TIMELY_FILING'
  },
  CO_45: {
    code: 'CO-45',
    title: 'Charge exceeds fee schedule/maximum allowable or contracted fee amount',
    category: 'CONTRACTUAL'
  },
  CO_50: {
    code: 'CO-50',
    title: 'These are non-covered services because this is not deemed a medical necessity',
    category: 'MEDICAL_NECESSITY'
  },
  CO_197: {
    code: 'CO-197',
    title: 'Precertification/authorization/notification/pre-treatment absent',
    category: 'AUTHORIZATION'
  },
  PR_1: {
    code: 'PR-1',
    title: 'Deductible amount',
    category: 'PATIENT_RESPONSIBILITY'
  },
  PR_2: {
    code: 'PR-2',
    title: 'Coinsurance amount',
    category: 'PATIENT_RESPONSIBILITY'
  },
  PR_3: {
    code: 'PR-3',
    title: 'Copayment amount',
    category: 'PATIENT_RESPONSIBILITY'
  }
} as const;

/**
 * Risk Scoring Thresholds
 */
export const RISK_THRESHOLDS = {
  LOW_MAX: 29,
  MEDIUM_MAX: 69,
  HIGH_MIN: 70
} as const;

/**
 * Weighting Model for Composite Denial Risk Score
 */
export const RISK_WEIGHTS = {
  AUTHORIZATION: 0.25,
  ELIGIBILITY: 0.25,
  COVERAGE_NECESSITY: 0.20,
  DATA_QUALITY: 0.10,
  TIMELY_FILING: 0.10,
  PROVIDER_NETWORK: 0.10
} as const;
