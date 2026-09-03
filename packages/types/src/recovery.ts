export type RecoveryPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RecoveryStatus =
  | 'NEW'
  | 'PACKET_GENERATED'
  | 'SUBMITTED_TO_PAYER'
  | 'RESOLVED_PAID'
  | 'ABANDONED';
export type RecommendedAction =
  | 'CORRECTED_CLAIM'
  | 'RECONSIDERATION'
  | 'FIRST_LEVEL_APPEAL'
  | 'PEER_TO_PEER';

export interface RecoveryCase {
  id: string;
  claimId: string;
  claimNumber: string;
  patientName: string;
  payerName: string;
  adjudicationId: string;
  denialCarc: string;
  denialReason: string;
  revenueAtRisk: number;
  recoverabilityScore: number; // 0 to 100
  priority: RecoveryPriority;
  status: RecoveryStatus;
  recommendedAction: RecommendedAction;
  filingDeadline: string; // YYYY-MM-DD
  daysRemaining: number;
}

export interface AppealDocument {
  id: string;
  recoveryCaseId: string;
  documentType: 'APPEAL_LETTER' | 'CLINICAL_SUMMARY' | 'CORRECTED_CLAIM_FORM';
  content: string;
  createdAt: string;
}
