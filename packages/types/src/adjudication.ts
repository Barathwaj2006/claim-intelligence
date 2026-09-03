export type AdjudicationStatus = 'PAID' | 'DENIED' | 'UNDERPAID' | 'PENDING';

export interface AdjudicationLine {
  id: string;
  claimLineId: string;
  cptCode: string;
  paidAmount: number;
  carcCode?: string;
  carcDescription?: string;
  rarcCode?: string;
}

export interface AdjudicationResult {
  id: string;
  claimId: string;
  adjudicationDate: string;
  status: AdjudicationStatus;
  billedAmount: number;
  allowedAmount: number;
  contractualAdjustment: number;
  payerPaidAmount: number;
  patientResponsibility: number;
  lines: AdjudicationLine[];
}
