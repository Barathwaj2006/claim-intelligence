export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RiskCategory =
  | 'ELIGIBILITY'
  | 'AUTHORIZATION'
  | 'COVERAGE'
  | 'DATA_QUALITY'
  | 'TIMELY_FILING'
  | 'PROVIDER_NETWORK';

export interface RiskFactor {
  id: string;
  category: RiskCategory;
  impactPoints: number; // e.g. +35 or -10
  title: string;
  description: string;
  likelyCarc?: string;
  recommendedFix?: string;
}

export interface RiskSubscores {
  eligibility: number;
  authorization: number;
  coverage: number;
  dataQuality: number;
  timelyFiling: number;
  providerNetwork: number;
}

export interface RiskScore {
  claimId: string;
  overallScore: number; // 0 to 100
  riskLevel: RiskLevel;
  subscores: RiskSubscores;
  factors: RiskFactor[];
  calculatedAt: string;
}

export interface Correction {
  id: string;
  claimId: string;
  fieldName: string;
  originalValue: string;
  suggestedValue: string;
  reason: string;
  confidence: number;
  status: 'PENDING' | 'APPLIED' | 'REJECTED';
}
