export type AuthStatus = 'NOT_REQUIRED' | 'APPROVED' | 'MISSING' | 'EXPIRED' | 'DENIED';

export interface PriorAuthorization {
  id: string;
  claimId: string;
  cptCode: string;
  authorizationNumber: string;
  status: AuthStatus;
  approvedUnits: number;
  validFrom: string;
  validTo: string;
}

export interface AuthorizationResult {
  claimId: string;
  requiresAuth: boolean;
  authStatus: AuthStatus;
  authorizationNumber?: string;
  authorizedCptCodes: string[];
  validThrough?: string;
  warnings: string[];
  likelyCarc?: string;
}
