export interface CoverageResult {
  claimId: string;
  coverageStatus: 'COVERED' | 'NOT_COVERED' | 'CONDITIONAL' | 'EXCEEDED_LIMITS';
  medicalNecessityMet: boolean;
  frequencyLimitsExceeded: boolean;
  policyNotes?: string;
}
