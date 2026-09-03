export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  memberId: string;
  groupNumber?: string;
  address?: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  npi: string; // 10-digit National Provider Identifier
  name: string;
  taxonomyCode: string;
  taxId: string;
  inNetwork: boolean;
}
