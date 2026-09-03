export type RecoveryPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RecoveryStatus =
  | 'IDENTIFIED'
  | 'ANALYZING'
  | 'ACTION_REQUIRED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'CORRECTED'
  | 'RESUBMITTED'
  | 'PAYER_REVIEW'
  | 'RECOVERED'
  | 'PARTIALLY_RECOVERED'
  | 'UNSUCCESSFUL'
  | 'ESCALATED'
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

export interface EvidenceItem {
  name: string;
  available: boolean;
}

export interface AuditTrailEntry {
  timestamp: string;
  action: string;
  actor?: string;
  from_status?: string;
  to_status?: string;
  recovered_amount?: number;
  remaining_amount?: number;
  status?: string;
  notes?: string;
}

export interface RecoveryCase {
  id: string;
  claimId: string;
  claimNumber: string;
  patientName: string;
  payerName: string;
  adjudicationId?: string;
  denialCarc: string;
  denialReason: string;
  revenueAtRisk: number;
  expectedRecoveryValue?: number;
  recoveredAmount?: number;
  remainingAmount?: number;
  recoverabilityScore: number; // 0 to 100
  priority: RecoveryPriority;
  status: RecoveryStatus;
  recommendedAction: RecommendedAction;
  explanationWhy?: string;
  filingDeadline: string; // YYYY-MM-DD
  daysRemaining: number;
  evidence?: EvidenceItem[];
  auditTrail?: AuditTrailEntry[];
}

export interface AppealDocument {
  id: string;
  recoveryCaseId: string;
  documentType: 'APPEAL_LETTER' | 'CLINICAL_SUMMARY' | 'CORRECTED_CLAIM_FORM';
  content: string;
  createdAt: string;
}
