export type PlanType = 'HMO' | 'PPO' | 'EPO' | 'POS' | 'MEDICARE' | 'MEDICAID';

export interface Payer {
  id: string;
  name: string;
  payerId: string; // 5-digit clearinghouse identifier
  timelyFilingDays: number;
  requiresAuthForAdvancedImaging: boolean;
}

export interface InsurancePlan {
  id: string;
  payerId: string;
  planName: string;
  planType: PlanType;
  annualDeductible: number;
  copaySpecialist: number;
  coinsurancePercentage: number;
}
