import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ClaimLine {
  lineNo: number;
  cpt: string;
  desc: string;
  units: number;
  charge: number;
  revenueCode?: string; // UB-04 Institutional Revenue Code (e.g. 0450, 0110, 0360)
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
  claimType?: 'PROFESSIONAL' | 'INSTITUTIONAL'; // CMS-1500 vs UB-04
  typeOfBill?: string; // e.g. '111 - Hospital Inpatient', '131 - Hospital Outpatient'
  admissionDate?: string;
  admissionType?: 'EMERGENCY' | 'URGENT' | 'ELECTIVE' | 'TRAUMA';
  dischargeStatus?: string; // e.g. '01 - Discharged to Home', '02 - Acute Care Hospital'
  drgCode?: string; // e.g. '871', '470', '291'
  drgTitle?: string;
  drgWeight?: number;
  inpatientLos?: number; // Length of stay (days)
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
  paidAmount?: number;
  allowedAmount?: number;
  contractualAdjustment?: number;
  patientResponsibility?: number;
  reconciliationStatus?: 'UNRECONCILED' | 'MATCHED_PAID' | 'PARTIAL_PAYMENT' | 'DENIED_835';
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

export interface RemittanceItem {
  id: string;
  checkNumber: string;
  checkDate?: string;
  paymentDate: string;
  payerName: string;
  payerId?: string;
  claimId?: string;
  claimNumber: string;
  patientName: string;
  totalBilled: number;
  paidAmount: number;
  paymentAmount?: number;
  contractualAdjustment: number;
  patientResponsibility: number;
  carcCode?: string;
  carcDesc?: string;
  rarcCode?: string;
  rarcDesc?: string;
  status: 'PAID' | 'PARTIAL_PAYMENT' | 'DENIED' | 'MATCHED' | 'UNMATCHED';
  totalRemittance?: number;
  totalBilledProcessed?: number;
  claimsProcessedCount?: number;
  matchedCount?: number;
  deniedCount?: number;
  processedAt?: string;
  lines?: {
    lineNo: number;
    cpt: string;
    billed: number;
    paid: number;
    adjustment: number;
    carc?: string;
  }[];
  claimsSummary?: {
    claimNumber: string;
    patientName: string;
    billed: number;
    allowed: number;
    paid: number;
    contractualDiscount: number;
    patientResponsibility: number;
    carcCode?: string;
    actionTaken: string;
  }[];
}

export interface PriorAuthRequest {
  id: string;
  authNumber: string;
  patientName: string;
  patientDob?: string;
  memberId: string;
  payerName: string;
  payerId: string;
  requestingPhysician?: string;
  physicianNpi?: string;
  cptCode: string;
  procedureCode?: string;
  cptDesc: string;
  procedureDesc?: string;
  diagnosisCode: string;
  urgency: 'STANDARD' | 'EXPEDITED';
  status: 'APPROVED' | 'IN_REVIEW' | 'ADDITIONAL_INFO_REQUIRED' | 'DENIED';
  turnaroundMandate: '72_HOURS' | '7_CALENDAR_DAYS';
  clinicalRationale: string;
  criteriaChecklist: { id: string; label: string; satisfied: boolean }[];
  requestedAt: string;
  submissionDate?: string;
  validThrough: string;
  validUntil?: string;
}

export interface UnderpaymentCase {
  id: string;
  claimId: string;
  claimNumber: string;
  patientName: string;
  payerName: string;
  serviceDesc: string;
  cptOrDrg?: string;
  billedAmount: number;
  contractExpectedRate: number;
  expectedPayment?: number;
  actualPaidAmount: number;
  actualPayment?: number;
  varianceUnderpaid: number;
  underpaidAmount?: number;
  contractClause: string;
  auditReason: 'MULTIPLE_PROCEDURE_CASCADING' | 'DOWNCODED_DRG' | 'UNBUNDLED_FEE_SCHEDULE' | 'STOP_LOSS_IGNORED';
  status: 'DETECTED' | 'DEMAND_LETTER_ISSUED' | 'RECOVERED' | 'DISPUTED';
  recoveryStatus?: 'PENDING_REVIEW' | 'DEMAND_SENT' | 'RECOVERED' | 'DISPUTED' | 'IDENTIFIED' | 'IN_DISPUTE';
  demandLetter?: string;
  detectedAt: string;
}

export interface GoodFaithEstimate {
  id: string;
  gfeNumber: string;
  patientName: string;
  patientDob: string;
  serviceDate?: string;
  scheduledDate?: string;
  procedureDesc?: string;
  serviceDescription?: string;
  primaryCpt: string;
  serviceLocation?: string;
  fplPercentage?: number;
  financialAssistanceDiscount?: number;
  totalGrossCharges?: number;
  totalEstimate?: number;
  disputeThreshold?: number;
  patientEstimatedResponsibility?: number;
  items: {
    category?: 'FACILITY' | 'PHYSICIAN' | 'ANESTHESIA' | 'PHARMACY' | 'RADIOLOGY_LAB';
    description?: string;
    desc?: string;
    code?: string;
    cpt?: string;
    standardCharge?: number;
    charge?: number;
    discountedAmount?: number;
  }[];
  disclaimerAccepted?: boolean;
  createdAt: string;
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
  remittances: RemittanceItem[];
  priorAuths: PriorAuthRequest[];
  underpayments: UnderpaymentCase[];
  goodFaithEstimates: GoodFaithEstimate[];
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
  ingest835Remittance: (raw835Text: string, metadata?: { checkNumber?: string; payerName?: string; checkDate?: string }) => RemittanceItem;
  addPriorAuthRequest: (req: Omit<PriorAuthRequest, 'id' | 'authNumber' | 'requestedAt' | 'validThrough'>) => PriorAuthRequest;
  updatePriorAuthRequest: (id: string, updates: Partial<PriorAuthRequest>) => void;
  addUnderpaymentCase: (item: Omit<UnderpaymentCase, 'id' | 'detectedAt'>) => UnderpaymentCase;
  generateUnderpaymentDemandLetter: (caseId: string) => string;
  updateUnderpaymentCase: (id: string, updates: Partial<UnderpaymentCase>) => void;
  updateUnderpaymentStatus: (id: string, status: UnderpaymentCase['status'] | string) => void;
  addGoodFaithEstimate: (gfe: Omit<GoodFaithEstimate, 'id' | 'gfeNumber' | 'createdAt'>) => GoodFaithEstimate;
  deleteGoodFaithEstimate: (id: string) => void;
  clearAllData: () => void;
}

const STORAGE_KEY_CLAIMS = 'claimintel_user_claims_v1';
const STORAGE_KEY_RECOVERY = 'claimintel_user_recovery_v1';
const STORAGE_KEY_ELIGIBILITY = 'claimintel_user_eligibility_v1';
const STORAGE_KEY_REMITTANCE = 'claimintel_user_remittance_v1';
const STORAGE_KEY_PRIOR_AUTH = 'claimintel_user_prior_auth_v1';
const STORAGE_KEY_UNDERPAYMENTS = 'claimintel_user_underpayments_v1';
const STORAGE_KEY_GFE = 'claimintel_user_gfe_v1';

// Deterministic intelligence engine calculating risk and issues
export function evaluateClaimRisk(claim: Partial<ClaimItem>): {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  issues: DetectedIssue[];
} {
  const issues: DetectedIssue[] = [];
  let score = 5; // Base minimal score

  // 1. Check prior authorization requirement for lines
  const highAuthCpts = ['72148', '70450', '29881', '43239', '27447', '63030', '93458', '22612'];
  let missingAuthCount = 0;
  claim.lines?.forEach((line) => {
    const isHighAuth = highAuthCpts.some((c) => line.cpt.includes(c));
    if (line.authStatus === 'MISSING' || (isHighAuth && line.authStatus !== 'ATTACHED')) {
      missingAuthCount++;
      issues.push({
        carc: 'CO-197',
        issue: `Prior authorization absent on procedure ${line.cpt} (${line.desc})`,
        severity: 'HIGH',
        suggestedAction: 'Attach Auth',
      });
    }
  });
  if (missingAuthCount > 0) {
    score += Math.min(50, missingAuthCount * 35);
  }

  // Institutional UB-04 validations
  if (claim.claimType === 'INSTITUTIONAL') {
    if (!claim.typeOfBill) {
      score += 25;
      issues.push({
        carc: 'CO-16',
        issue: 'Type of Bill (FL 04) missing on Institutional UB-04 claim',
        severity: 'HIGH',
        suggestedAction: 'Add Type of Bill',
      });
    }
    const linesMissingRev = claim.lines?.filter((l) => !l.revenueCode || l.revenueCode.trim() === '');
    if (linesMissingRev && linesMissingRev.length > 0) {
      score += 25;
      issues.push({
        carc: 'CO-16',
        issue: `${linesMissingRev.length} line item(s) missing UB-04 Revenue Codes (FL 42)`,
        severity: 'MEDIUM',
        suggestedAction: 'Add Revenue Code',
      });
    }
    if (claim.typeOfBill?.startsWith('11') && !claim.admissionDate) {
      score += 20;
      issues.push({
        carc: 'CO-16',
        issue: 'Inpatient admission date required for Type of Bill 11X',
        severity: 'MEDIUM',
        suggestedAction: 'Set Admission Date',
      });
    }
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

  const [remittances, setRemittances] = useState<RemittanceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REMITTANCE);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [priorAuths, setPriorAuths] = useState<PriorAuthRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRIOR_AUTH);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [underpayments, setUnderpayments] = useState<UnderpaymentCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNDERPAYMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [goodFaithEstimates, setGoodFaithEstimates] = useState<GoodFaithEstimate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GFE);
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REMITTANCE, JSON.stringify(remittances));
    } catch (e) {
      console.error('Failed to save remittances to localStorage', e);
    }
  }, [remittances]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRIOR_AUTH, JSON.stringify(priorAuths));
    } catch (e) {
      console.error('Failed to save prior auths to localStorage', e);
    }
  }, [priorAuths]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNDERPAYMENTS, JSON.stringify(underpayments));
    } catch (e) {
      console.error('Failed to save underpayments to localStorage', e);
    }
  }, [underpayments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GFE, JSON.stringify(goodFaithEstimates));
    } catch (e) {
      console.error('Failed to save good faith estimates to localStorage', e);
    }
  }, [goodFaithEstimates]);

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

  const ingest835Remittance = (
    raw835Text: string,
    metadata?: { checkNumber?: string; payerName?: string; checkDate?: string }
  ): RemittanceItem => {
    const id = `rem-${Date.now()}`;
    const checkNumber = metadata?.checkNumber || `EFT-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const checkDate = metadata?.checkDate || new Date().toISOString().split('T')[0];
    const payerName = metadata?.payerName || 'Commercial Health Plan / Clearinghouse 835';
    const payerId = '00123';

    let parsedClaims: {
      claimNumber: string;
      patientName: string;
      billed: number;
      allowed: number;
      paid: number;
      contractualDiscount: number;
      patientResponsibility: number;
      carcCode?: string;
      actionTaken: string;
    }[] = [];

    // Try parsing as JSON first
    let isJson = false;
    try {
      const parsedJson = JSON.parse(raw835Text);
      if (Array.isArray(parsedJson)) {
        parsedClaims = parsedJson;
        isJson = true;
      } else if (parsedJson.claims && Array.isArray(parsedJson.claims)) {
        parsedClaims = parsedJson.claims;
        isJson = true;
      }
    } catch {
      // Not JSON, parse as EDI 835 text
    }

    if (!isJson) {
      // Parse EDI 835 CLP segments if present
      const lines = raw835Text.split(/~|\n/).map((l) => l.trim()).filter(Boolean);
      let currentClaim: any = null;

      lines.forEach((line) => {
        if (line.startsWith('CLP*')) {
          const parts = line.split('*');
          const claimNum = parts[1] || `CLM-${Math.floor(1000 + Math.random() * 9000)}`;
          const statusCode = parts[2] || '1'; // 1=Processed as primary, 4=Denied
          const billed = parseFloat(parts[3]) || 500;
          const paid = parseFloat(parts[4]) || 0;
          const patResp = parseFloat(parts[5]) || 0;

          currentClaim = {
            claimNumber: claimNum,
            patientName: 'Insured Patient',
            billed,
            allowed: billed > paid ? billed * 0.8 : billed,
            paid,
            contractualDiscount: Math.max(0, billed - paid - patResp),
            patientResponsibility: patResp,
            carcCode: statusCode === '4' ? 'CO-197' : 'CO-45',
            actionTaken: statusCode === '4' ? 'Denied - Routed to Recovery' : 'Paid & Posted',
          };
          parsedClaims.push(currentClaim);
        } else if (line.startsWith('NM1*QC*') && currentClaim) {
          const parts = line.split('*');
          currentClaim.patientName = `${parts[4] || ''} ${parts[3] || ''}`.trim() || currentClaim.patientName;
        } else if (line.startsWith('CAS*') && currentClaim) {
          const parts = line.split('*');
          const group = parts[1] || 'CO';
          const code = parts[2] || '45';
          currentClaim.carcCode = `${group}-${code}`;
          if (code === '197' || code === '16' || code === '50' || code === '27') {
            currentClaim.actionTaken = `Denied (${group}-${code}) - Routed to Recovery`;
          }
        }
      });
    }

    // If still no parsed claims, match against existing staged claims or build a default reconcile batch
    if (parsedClaims.length === 0) {
      if (claims.length > 0) {
        parsedClaims = claims.slice(0, 3).map((c, i) => {
          const isDenied = i === 0 && c.riskLevel === 'HIGH';
          const billed = c.totalBilled;
          const allowed = isDenied ? 0 : Math.round(billed * 0.78);
          const paid = isDenied ? 0 : Math.round(allowed * 0.85);
          const contractualDiscount = isDenied ? 0 : billed - allowed;
          const patientResponsibility = isDenied ? 0 : allowed - paid;
          return {
            claimNumber: c.claimNumber,
            patientName: c.patientName,
            billed,
            allowed,
            paid,
            contractualDiscount,
            patientResponsibility,
            carcCode: isDenied ? 'CO-197' : 'CO-45',
            actionTaken: isDenied ? 'Denied (CO-197) - Routed to Recovery' : 'Posted to A/R',
          };
        });
      } else {
        parsedClaims = [
          {
            claimNumber: 'CLM-78401',
            patientName: 'Eleanor Vance',
            billed: 1250,
            allowed: 950,
            paid: 760,
            contractualDiscount: 300,
            patientResponsibility: 190,
            carcCode: 'CO-45',
            actionTaken: 'Posted to A/R',
          },
          {
            claimNumber: 'CLM-78402',
            patientName: 'David Miller',
            billed: 4200,
            allowed: 0,
            paid: 0,
            contractualDiscount: 0,
            patientResponsibility: 0,
            carcCode: 'CO-197',
            actionTaken: 'Denied (CO-197) - Routed to Recovery',
          },
        ];
      }
    }

    let matchedCount = 0;
    let deniedCount = 0;
    let totalRemittance = 0;
    let totalBilledProcessed = 0;

    // Apply reconciliation to claims context and route denials to recovery
    parsedClaims.forEach((pc) => {
      totalRemittance += pc.paid;
      totalBilledProcessed += pc.billed;

      const matchedClaim = claims.find((c) => c.claimNumber === pc.claimNumber);
      if (matchedClaim) {
        matchedCount++;
        const isDenial = pc.paid === 0 && pc.billed > 0;
        if (isDenial) {
          deniedCount++;
          updateClaim(matchedClaim.id, {
            status: 'DENIED',
            paidAmount: 0,
            allowedAmount: 0,
            reconciliationStatus: 'DENIED_835',
            denialReason: `835 Electronic Remittance Denial (${pc.carcCode || 'CO-197'})`,
          });
          // Route to recovery appeals
          addRecoveryCase({
            claimId: matchedClaim.id,
            claimNumber: matchedClaim.claimNumber,
            patientName: matchedClaim.patientName,
            payerName: matchedClaim.payerName,
            carcCode: pc.carcCode || 'CO-197',
            denialReason: `835 ERA Automated Post: ${pc.carcCode || 'CO-197'} Adverse Determination`,
            revenueAtRisk: matchedClaim.totalBilled,
            recoverability: 75,
            priority: 'HIGH',
            action: 'Submit Electronic Reconsideration',
            daysRemaining: 45,
          });
        } else {
          updateClaim(matchedClaim.id, {
            status: 'ADJUDICATED',
            paidAmount: pc.paid,
            allowedAmount: pc.allowed,
            contractualAdjustment: pc.contractualDiscount,
            patientResponsibility: pc.patientResponsibility,
            reconciliationStatus: 'MATCHED_PAID',
          });
        }
      } else {
        if (pc.paid === 0) {
          deniedCount++;
          addRecoveryCase({
            claimId: `ext-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            claimNumber: pc.claimNumber,
            patientName: pc.patientName,
            payerName,
            carcCode: pc.carcCode || 'CO-197',
            denialReason: `835 Remittance Denial: ${pc.carcCode || 'CO-197'}`,
            revenueAtRisk: pc.billed,
            recoverability: 80,
            priority: 'URGENT',
            action: 'Prior Auth / Medical Records Appeal',
            daysRemaining: 30,
          });
        }
      }
    });

    const remittanceItem: RemittanceItem = {
      id,
      checkNumber,
      checkDate,
      paymentDate: checkDate,
      payerName,
      payerId,
      claimNumber: parsedClaims[0]?.claimNumber || `BATCH-${id.slice(-6)}`,
      patientName: parsedClaims[0]?.patientName || `${parsedClaims.length} Claims in ERA Batch`,
      totalBilled: totalBilledProcessed,
      paidAmount: totalRemittance,
      contractualAdjustment: Math.max(0, totalBilledProcessed - totalRemittance),
      patientResponsibility: 0,
      status: deniedCount > 0 ? (matchedCount > 0 ? 'PARTIAL_PAYMENT' : 'DENIED') : 'MATCHED',
      totalRemittance,
      totalBilledProcessed,
      claimsProcessedCount: parsedClaims.length,
      matchedCount,
      deniedCount,
      processedAt: new Date().toISOString(),
      claimsSummary: parsedClaims,
    };

    setRemittances((prev) => [remittanceItem, ...prev]);
    return remittanceItem;
  };

  const addPriorAuthRequest = (
    req: Omit<PriorAuthRequest, 'id' | 'authNumber' | 'requestedAt' | 'validThrough'>
  ): PriorAuthRequest => {
    const id = `pa-${Date.now()}`;
    const authNumber = `AUTH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const validThrough = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newPA: PriorAuthRequest = {
      ...req,
      id,
      authNumber,
      requestedAt: now.toISOString(),
      validThrough,
    };

    setPriorAuths((prev) => [newPA, ...prev]);
    return newPA;
  };

  const updatePriorAuthRequest = (id: string, updates: Partial<PriorAuthRequest>) => {
    setPriorAuths((prev) => prev.map((pa) => (pa.id === id ? { ...pa, ...updates } : pa)));
  };

  const addUnderpaymentCase = (item: Omit<UnderpaymentCase, 'id' | 'detectedAt'>): UnderpaymentCase => {
    const id = `und-${Date.now()}`;
    const newCase: UnderpaymentCase = {
      ...item,
      id,
      detectedAt: new Date().toISOString(),
    };
    setUnderpayments((prev) => [newCase, ...prev]);
    return newCase;
  };

  const updateUnderpaymentCase = (id: string, updates: Partial<UnderpaymentCase>) => {
    setUnderpayments((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const generateUnderpaymentDemandLetter = (caseId: string): string => {
    const item = underpayments.find((u) => u.id === caseId);
    if (!item) return '';

    const letter = `FORMAL DEMAND FOR CONTRACTUAL UNDERPAYMENT RESOLUTION
================================================================================
Date: ${new Date().toLocaleDateString()}
To: ${item.payerName} - Provider Contracting & Settlement Operations
Re: Contractual Variance & Underpayment Demand - Claim #${item.claimNumber}
Subscriber / Patient: ${item.patientName}
Service Performed: ${item.serviceDesc}
Contract Rate Clause: ${item.contractClause}

FINANCIAL AUDIT DISCREPANCY:
- Total Billed Charge: $${item.billedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Contractual Allowable Fee: $${item.contractExpectedRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Actual Remittance Paid: $${item.actualPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- RECOVERABLE UNDERPAYMENT VARIANCE: $${item.varianceUnderpaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}

AUDIT REASON & CONTRACTUAL GROUNDING:
Our hospital revenue integrity audit identified an unauthorized downward adjustment
on Claim #${item.claimNumber}. Payer failed to adjudicate in accordance with Section 8.3
of our Participating Provider Agreement (${item.auditReason.replace(/_/g, ' ')}).

Under state Prompt Payment regulations, failure to remit the remaining balance of
$${item.varianceUnderpaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} within 30 calendar days will accrue statutory interest at
1.5% per month.

Please re-adjudicate this claim and issue electronic settlement remittance immediately.

Respectfully submitted,
Hospital Contracting & Revenue Integrity Office
`;

    updateUnderpaymentCase(caseId, {
      status: 'DEMAND_LETTER_ISSUED',
      demandLetter: letter,
    });
    return letter;
  };

  const updateUnderpaymentStatus = (id: string, status: UnderpaymentCase['status'] | string) => {
    updateUnderpaymentCase(id, {
      status: status as UnderpaymentCase['status'],
      recoveryStatus: status as UnderpaymentCase['recoveryStatus'],
    });
  };

  const addGoodFaithEstimate = (
    gfe: Omit<GoodFaithEstimate, 'id' | 'gfeNumber' | 'createdAt'>
  ): GoodFaithEstimate => {
    const id = `gfe-${Date.now()}`;
    const gfeNumber = `GFE-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newGfe: GoodFaithEstimate = {
      ...gfe,
      id,
      gfeNumber,
      createdAt: new Date().toISOString(),
    };
    setGoodFaithEstimates((prev) => [newGfe, ...prev]);
    return newGfe;
  };

  const deleteGoodFaithEstimate = (id: string) => {
    setGoodFaithEstimates((prev) => prev.filter((g) => g.id !== id));
  };

  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY_CLAIMS);
    localStorage.removeItem(STORAGE_KEY_RECOVERY);
    localStorage.removeItem(STORAGE_KEY_ELIGIBILITY);
    localStorage.removeItem(STORAGE_KEY_REMITTANCE);
    localStorage.removeItem(STORAGE_KEY_PRIOR_AUTH);
    localStorage.removeItem(STORAGE_KEY_UNDERPAYMENTS);
    localStorage.removeItem(STORAGE_KEY_GFE);
    setClaims([]);
    setRecoveryCases([]);
    setEligibilityHistory([]);
    setRemittances([]);
    setPriorAuths([]);
    setUnderpayments([]);
    setGoodFaithEstimates([]);
  };

  return (
    <ClaimContext.Provider
      value={{
        claims,
        recoveryCases,
        eligibilityHistory,
        remittances,
        priorAuths,
        underpayments,
        goodFaithEstimates,
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
        ingest835Remittance,
        addPriorAuthRequest,
        updatePriorAuthRequest,
        addUnderpaymentCase,
        generateUnderpaymentDemandLetter,
        updateUnderpaymentCase,
        updateUnderpaymentStatus,
        addGoodFaithEstimate,
        deleteGoodFaithEstimate,
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
