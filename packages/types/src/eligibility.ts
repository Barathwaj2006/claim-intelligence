export interface EligibilityResult {
  claimId: string;
  isActive: boolean;
  effectiveDate: string;
  terminationDate: string | null;
  copayAmount: number;
  deductibleTotal: number;
  deductibleMet: number;
  deductibleRemaining: number;
  payerName: string;
  status: 'VERIFIED' | 'INACTIVE' | 'TERMINATED' | 'MEMBER_NOT_FOUND';
  warnings: string[];
}
