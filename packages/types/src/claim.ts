export type ClaimStatus =
  | 'DRAFT'
  | 'VERIFIED'
  | 'READY_FOR_SUBMISSION'
  | 'SUBMITTED'
  | 'ADJUDICATED'
  | 'APPEAL_IN_PROGRESS'
  | 'CLOSED';

export interface ClaimLine {
  id: string;
  claimId: string;
  lineNumber: number;
  cptCode: string;
  modifiers: string[];
  diagnosisPointers: number[];
  units: number;
  unitPrice: number;
  totalAmount: number;
}

export interface Claim {
  id: string;
  claimNumber: string;
  patientId: string;
  providerId: string;
  payerId: string;
  encounterId: string;
  status: ClaimStatus;
  totalBilledAmount: number;
  serviceDate: string; // YYYY-MM-DD
  filingDeadline: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface ClaimDetail extends Claim {
  patientName: string;
  patientDob: string;
  memberId: string;
  providerName: string;
  providerNpi: string;
  payerName: string;
  lines: ClaimLine[];
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  clinicalNotes?: string;
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}
