import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ClaimLine {
  lineNo: number;
  cpt: string;
  desc: string;
  units: number;
  charge: number;
  authStatus: 'NOT_REQUIRED' | 'ATTACHED' | 'MISSING';
  authNumber?: string;
  likelyCarc?: string;
}

export interface DetectedIssue {
  carc: string;
  issue: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedAction: string;
}

export interface ClaimItem {
  id: string;
  claimNumber: string;
  patientName: string;
  patientDob: string;
  memberId: string;
  payerName: string;
  payerId: string;
  providerName: string;
  providerNpi: string;
  serviceDate: string;
  filingDeadline: string;
  totalBilled: number;
  status: 'DRAFT' | 'VERIFIED' | 'READY_FOR_SUBMISSION' | 'SUBMITTED' | 'ADJUDICATED' | 'DENIED' | 'APPEAL_IN_PROGRESS';
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  primaryDiagnosis: string;
  secondaryDiagnosis?: string;
  clinicalNotes?: string;
  lines: ClaimLine[];
  denialReason?: string;
  detectedIssues: DetectedIssue[];
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryItem {
  id: string;
  claimId: string;
  claimNumber: string;
  patientName: string;
  payerName: string;
  carcCode: string;
  denialReason: string;
  revenueAtRisk: number;
  recoverability: number; // 0-100
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  daysRemaining: number;
  status: 'NEW' | 'APPEAL_GENERATED' | 'APPEAL_SUBMITTED' | 'RECOVERED_PAID' | 'ABANDONED';
  appealLetter?: string;
  createdAt: string;
}

export type RecoveryCase = RecoveryItem;

export interface EligibilityRecord {
  id: string;
  trn: string;
  memberId: string;
  payerId: string;
  payerName: string;
  patientName: string;
  patientDob: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  planName: string;
  coverageWindow: string;
  deductibleTotal: number;
  deductibleMet: number;
  deductibleRemaining: number;
  copay: number;
  coinsurance: number;
  verifiedAt: string;
}

interface ClaimContextType {
  claims: ClaimItem[];
  recoveryCases: RecoveryItem[];
  eligibilityHistory: EligibilityRecord[];
  addClaim: (newClaim: Omit<ClaimItem, 'id' | 'createdAt' | 'updatedAt' | 'riskScore' | 'riskLevel' | 'detectedIssues'>) => ClaimItem;
  updateClaim: (id: string, updates: Partial<ClaimItem>) => void;
  deleteClaim: (id: string) => void;
  applyCorrection: (id: string) => void;
  attachAuthorization: (id: string, lineNo: number, authNumber: string) => void;
  submitClaim: (id: string) => void;
  recordDenial: (claimId: string, carcCode: string, reason: string) => void;
  addRecoveryCase: (item: Omit<RecoveryItem, 'id' | 'createdAt' | 'status'>) => RecoveryItem;
  updateRecoveryCase: (id: string, updates: Partial<RecoveryItem>) => void;
  deleteRecoveryCase: (id: string) => void;
  generateAppealLetter: (caseId: string) => string;
  verifyEligibility: (params: { memberId: string; payerId: string; patientName?: string; patientDob?: string }) => EligibilityRecord;
  importClaims: (importedList: Partial<ClaimItem>[]) => number;
  clearAllData: () => void;
}

const STORAGE_KEY_CLAIMS = 'claimintel_user_claims_v1';
const STORAGE_KEY_RECOVERY = 'claimintel_user_recovery_v1';
const STORAGE_KEY_ELIGIBILITY = 'claimintel_user_eligibility_v1';

// Deterministic intelligence engine calculating risk and issues
export function evaluateClaimRisk(claim: Partial<ClaimItem>): {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  issues: DetectedIssue[];
} {
  const issues: DetectedIssue[] = [];
  let score = 5; // Base minimal score

  // 1. Check prior authorization requirement for lines
  const highAuthCpts = ['72148', '70450', '29881', '43239', '27447', '63030'];
  let missingAuthCount = 0;
  claim.lines?.forEach((line) => {
    const isHighAuth = highAuthCpts.some((c) => line.cpt.includes(c));
    if (line.authStatus === 'MISSING' || (isHighAuth && line.authStatus !== 'ATTACHED')) {
      missingAuthCount++;
      issues.push({
        carc: 'CO-197',
        issue: `Prior authorization absent on CPT ${line.cpt} (${line.desc})`,
        severity: 'HIGH',
        suggestedAction: 'Attach Auth',
      });
    }
  });
  if (missingAuthCount > 0) {
    score += Math.min(50, missingAuthCount * 35);
  }

  // 2. Check demographic or payer spelling / format irregularities
  const payerStr = (claim.payerName || '').toLowerCase();
  const memberStr = (claim.memberId || '').trim();
  if (
    payerStr.includes('ocr') ||
    payerStr.includes('typo') ||
    payerStr.includes('blueshild') ||
    payerStr.includes('unitd') ||
    memberStr.length < 5
  ) {
    score += 25;
    issues.push({
      carc: 'CO-16',
      issue: 'Subscriber / Payer format mismatch or OCR scan irregularity',
      severity: 'MEDIUM',
      suggestedAction: 'Auto-Correct',
    });
  }

  // 3. Check timely filing deadline proximity
  if (claim.filingDeadline) {
    try {
      const deadlineDate = new Date(claim.filingDeadline.split(' ')[0]);
      if (!isNaN(deadlineDate.getTime())) {
        const diffDays = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays >= 0) {
          score += 30;
          issues.push({
            carc: 'CO-29',
            issue: `Timely filing deadline expiring soon (${diffDays} days remaining)`,
            severity: 'HIGH',
            suggestedAction: 'Expedite',
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Check primary diagnosis presence
  if (!claim.primaryDiagnosis || claim.primaryDiagnosis.trim() === '') {
    score += 35;
    issues.push({
      carc: 'CO-16',
      issue: 'Primary ICD-10 diagnosis code absent',
      severity: 'HIGH',
      suggestedAction: 'Add ICD-10',
    });
  }

  score = Math.min(99, Math.max(5, score));
  const level: 'LOW' | 'MEDIUM' | 'HIGH' =
    score >= 70 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';

  return { score, level, issues };
}

const ClaimContext = createContext<ClaimContextType | null>(null);

export const ClaimProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with empty arrays - NO built-in demo data
  const [claims, setClaims] = useState<ClaimItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLAIMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recoveryCases, setRecoveryCases] = useState<RecoveryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECOVERY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [eligibilityHistory, setEligibilityHistory] = useState<EligibilityRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ELIGIBILITY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(claims));
    } catch (e) {
      console.error('Failed to save claims to localStorage', e);
    }
  }, [claims]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECOVERY, JSON.stringify(recoveryCases));
    } catch (e) {
      console.error('Failed to save recovery cases to localStorage', e);
    }
  }, [recoveryCases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ELIGIBILITY, JSON.stringify(eligibilityHistory));
    } catch (e) {
      console.error('Failed to save eligibility history to localStorage', e);
    }
  }, [eligibilityHistory]);

  const addClaim = (
    newClaim: Omit<ClaimItem, 'id' | 'createdAt' | 'updatedAt' | 'riskScore' | 'riskLevel' | 'detectedIssues'>
  ): ClaimItem => {
    const id = `clm-${Date.now()}`;
    const { score, level, issues } = evaluateClaimRisk(newClaim);

    // Calculate totalBilled from lines if not set
    const totalBilled =
      newClaim.totalBilled ||
      newClaim.lines?.reduce((sum, line) => sum + (line.charge || 0) * (line.units || 1), 0) ||
      0;

    const claimItem: ClaimItem = {
      ...newClaim,
      id,
      totalBilled,
      riskScore: score,
      riskLevel: level,
      detectedIssues: issues,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setClaims((prev) => [claimItem, ...prev]);
    return claimItem;
  };

  const updateClaim = (id: string, updates: Partial<ClaimItem>) => {
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const merged = { ...c, ...updates, updatedAt: new Date().toISOString() };
        const { score, level, issues } = evaluateClaimRisk(merged);
        return {
          ...merged,
          riskScore: updates.riskScore !== undefined ? updates.riskScore : score,
          riskLevel: updates.riskLevel !== undefined ? updates.riskLevel : level,
          detectedIssues: issues,
        };
      })
    );
  };

  const deleteClaim = (id: string) => {
    setClaims((prev) => prev.filter((c) => c.id !== id));
  };

  const applyCorrection = (id: string) => {
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        // Clean payer name and member ID formatting
        const cleanPayer = c.payerName
          .replace(/\(ocr typo\)/gi, '')
          .replace(/\(typo\)/gi, '')
          .trim();
        const cleanMember = c.memberId.toUpperCase().trim();

        const updated = {
          ...c,
          payerName: cleanPayer,
          memberId: cleanMember,
          updatedAt: new Date().toISOString(),
        };
        const { score, level, issues } = evaluateClaimRisk(updated);
        return {
          ...updated,
          riskScore: score,
          riskLevel: level,
          detectedIssues: issues,
        };
      })
    );
  };

  const attachAuthorization = (id: string, lineNo: number, authNumber: string) => {
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updatedLines = c.lines.map((l) =>
          l.lineNo === lineNo
            ? { ...l, authStatus: 'ATTACHED' as const, authNumber: authNumber || 'AUTH-VERIFIED-101' }
            : l
        );
        const updated = { ...c, lines: updatedLines, updatedAt: new Date().toISOString() };
        const { score, level, issues } = evaluateClaimRisk(updated);
        return {
          ...updated,
          riskScore: score,
          riskLevel: level,
          detectedIssues: issues,
        };
      })
    );
  };

  const submitClaim = (id: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'SUBMITTED',
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const recordDenial = (claimId: string, carcCode: string, reason: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;

    // Update claim status
    updateClaim(claimId, { status: 'DENIED', denialReason: reason });

    // Add recovery case
    const newCase: Omit<RecoveryItem, 'id' | 'createdAt' | 'status'> = {
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      patientName: claim.patientName,
      payerName: claim.payerName,
      carcCode: carcCode || 'CO-197',
      denialReason: reason || 'Payer denial requiring formal appeal',
      revenueAtRisk: claim.totalBilled,
      recoverability: 75,
      priority: 'HIGH',
      action: 'Clinical Appeal Dossier',
      daysRemaining: 45,
    };
    addRecoveryCase(newCase);
  };

  const addRecoveryCase = (
    item: Omit<RecoveryItem, 'id' | 'createdAt' | 'status'>
  ): RecoveryItem => {
    const id = `rec-${Date.now()}`;
    const newCase: RecoveryItem = {
      ...item,
      id,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    setRecoveryCases((prev) => [newCase, ...prev]);
    return newCase;
  };

  const updateRecoveryCase = (id: string, updates: Partial<RecoveryItem>) => {
    setRecoveryCases((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteRecoveryCase = (id: string) => {
    setRecoveryCases((prev) => prev.filter((item) => item.id !== id));
  };

  const generateAppealLetter = (caseId: string): string => {
    const caseItem = recoveryCases.find((r) => r.id === caseId);
    if (!caseItem) return '';

    const letter = `PROVIDER DISPUTE & RECONSIDERATION APPEAL DOSSIER
================================================================================
Date: ${new Date().toLocaleDateString()}
To: ${caseItem.payerName} - Claims Adjudication & Appeals Division
Re: Appeal of Claim Denial ${caseItem.claimNumber}
Subscriber / Patient: ${caseItem.patientName}
Denial Code (CARC): ${caseItem.carcCode}
Denial Stated Reason: ${caseItem.denialReason}
Amount in Dispute: $${caseItem.revenueAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}

CLINICAL RATIONALE & MEDICAL NECESSITY STATEMENT:
This letter serves as a formal level-1 clinical appeal regarding the adverse adjudication
of Claim #${caseItem.claimNumber}. The services rendered on behalf of ${caseItem.patientName}
met standard criteria for medical necessity based on evidence-based Milliman Care Guidelines
and CMS Local Coverage Determinations (LCD).

Pursuant to standard HIPAA 5010 transactions and state prompt-pay mandates, we request immediate
reopening and adjustment of this claim to payable status.

Supporting clinical notes, pre-procedure evaluations, and certified diagnostic reports are
attached herewith for expedited secondary review.

Respectfully submitted,
Revenue Cycle Operations & Appeals Committee
`;

    updateRecoveryCase(caseId, {
      status: 'APPEAL_GENERATED',
      appealLetter: letter,
    });

    return letter;
  };

  const verifyEligibility = (params: {
    memberId: string;
    payerId: string;
    patientName?: string;
    patientDob?: string;
  }): EligibilityRecord => {
    const payerMap: Record<string, string> = {
      '00123': 'Blue Cross Blue Shield',
      '00430': 'UnitedHealthcare',
      '00020': 'Medicare Part B',
      '60054': 'Aetna Health',
      'cigna': 'Cigna Commercial',
      'humana': 'Humana Healthcare',
    };

    const payerName = payerMap[params.payerId] || 'Commercial Healthcare Payer';
    const memberUpper = params.memberId.toUpperCase().trim();

    // Check if terminated or inactive test pattern
    const isTerminated = memberUpper.endsWith('TERM') || memberUpper.endsWith('INACT');

    const record: EligibilityRecord = {
      id: `elg-${Date.now()}`,
      trn: `TRN-${Date.now().toString().slice(-8)}`,
      memberId: params.memberId,
      payerId: params.payerId,
      payerName,
      patientName: params.patientName || 'Verified Subscriber',
      patientDob: params.patientDob || '1985-05-15',
      status: isTerminated ? 'TERMINATED' : 'ACTIVE',
      planName: `${payerName} Comprehensive Choice PPO`,
      coverageWindow: `${new Date().getFullYear()}-01-01 to Present`,
      deductibleTotal: 1500,
      deductibleMet: 1150,
      deductibleRemaining: 350,
      copay: 30,
      coinsurance: 20,
      verifiedAt: new Date().toISOString(),
    };

    setEligibilityHistory((prev) => [record, ...prev]);
    return record;
  };

  const importClaims = (importedList: Partial<ClaimItem>[]): number => {
    let count = 0;
    const newItems: ClaimItem[] = [];

    importedList.forEach((raw) => {
      if (!raw.claimNumber && !raw.patientName) return;
      const id = `clm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const lines: ClaimLine[] = raw.lines || [
        {
          lineNo: 1,
          cpt: '99214',
          desc: 'Office visit, established patient, level 4',
          units: 1,
          charge: raw.totalBilled || 350,
          authStatus: 'NOT_REQUIRED',
        },
      ];

      const totalBilled =
        raw.totalBilled || lines.reduce((acc, l) => acc + (l.charge || 0) * (l.units || 1), 0);

      const draft: Partial<ClaimItem> = {
        claimNumber: raw.claimNumber || `CLM-${Date.now().toString().slice(-5)}`,
        patientName: raw.patientName || 'Patient',
        patientDob: raw.patientDob || '1980-01-01',
        memberId: raw.memberId || 'MEM-000000',
        payerName: raw.payerName || 'Commercial Payer',
        payerId: raw.payerId || '00123',
        providerName: raw.providerName || 'Attending Physician, MD',
        providerNpi: raw.providerNpi || '1000000000',
        serviceDate: raw.serviceDate || new Date().toISOString().split('T')[0],
        filingDeadline:
          raw.filingDeadline ||
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalBilled,
        status: (raw.status as any) || 'DRAFT',
        primaryDiagnosis: raw.primaryDiagnosis || 'Z00.00 (General Exam)',
        secondaryDiagnosis: raw.secondaryDiagnosis,
        clinicalNotes: raw.clinicalNotes,
        lines,
      };

      const { score, level, issues } = evaluateClaimRisk(draft);
      newItems.push({
        ...(draft as any),
        id,
        riskScore: raw.riskScore || score,
        riskLevel: raw.riskLevel || level,
        detectedIssues: issues,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      count++;
    });

    if (newItems.length > 0) {
      setClaims((prev) => [...newItems, ...prev]);
    }
    return count;
  };

  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY_CLAIMS);
    localStorage.removeItem(STORAGE_KEY_RECOVERY);
    localStorage.removeItem(STORAGE_KEY_ELIGIBILITY);
    setClaims([]);
    setRecoveryCases([]);
    setEligibilityHistory([]);
  };

  return (
    <ClaimContext.Provider
      value={{
        claims,
        recoveryCases,
        eligibilityHistory,
        addClaim,
        updateClaim,
        deleteClaim,
        applyCorrection,
        attachAuthorization,
        submitClaim,
        recordDenial,
        addRecoveryCase,
        updateRecoveryCase,
        deleteRecoveryCase,
        generateAppealLetter,
        verifyEligibility,
        importClaims,
        clearAllData,
      }}
    >
      {children}
    </ClaimContext.Provider>
  );
};

export const useClaims = () => {
  const context = useContext(ClaimContext);
  if (!context) {
    throw new Error('useClaims must be used within a ClaimProvider');
  }
  return context;
};
