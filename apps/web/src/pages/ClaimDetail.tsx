import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileText,
  Wrench,
  Check,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  User,
  Calendar,
  Building2,
  AlertCircle,
  HelpCircle,
  History,
  Activity,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface FullClaimData {
  id: string;
  claimNumber: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  memberId: string;
  providerId: string;
  providerName: string;
  providerNpi: string;
  payerId: string;
  payerName: string;
  serviceDate: string;
  filingDeadline: string;
  createdAt: string;
  updatedAt: string;
  evaluatedAt: string;
  serviceDescription: string;
  totalBilledAmount: number;
  expectedAmount: number;
  status: 'DRAFT' | 'VERIFIED' | 'READY_FOR_SUBMISSION' | 'SUBMITTED' | 'ADJUDICATED' | 'CLOSED';
  trafficLight: 'GREEN' | 'AMBER' | 'RED';

  // Risk Score & Tier
  riskScore: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';

  // Intelligence Engines status
  eligibility: {
    status: 'VERIFIED' | 'INACTIVE' | 'TERMINATED' | 'MEMBER_NOT_FOUND';
    isActive: boolean;
    effectiveDate: string;
    copayAmount: number;
    deductibleTotal: number;
    deductibleMet: number;
    deductibleRemaining: number;
  };
  authorization: {
    status: 'APPROVED' | 'MISSING' | 'EXPIRED' | 'NOT_REQUIRED' | 'DENIED';
    requiresAuth: boolean;
    authorizationNumber?: string;
    authorizedCptCodes: string[];
    validThrough?: string;
  };
  coverage: {
    status: 'COVERED' | 'EXCEEDED' | 'NOT_COVERED';
    medicalNecessityMet: boolean;
    frequencyLimitsExceeded: boolean;
    policyNotes: string;
  };

  // Data quality
  dataQuality: {
    hasIssues: boolean;
    corrections: Array<{
      id: string;
      fieldName: string;
      originalValue: string;
      suggestedValue: string;
      reason: string;
      confidence: number;
      status: 'PENDING' | 'APPLIED' | 'REJECTED';
      appliedAt?: string;
    }>;
  };

  // Risk Factors
  riskFactors: Array<{
    id: string;
    category: 'ELIGIBILITY' | 'AUTHORIZATION' | 'COVERAGE' | 'DATA_QUALITY' | 'TIMELY_FILING' | 'PROVIDER_NETWORK';
    impactPoints: number;
    title: string;
    description: string;
    likelyCarc?: string;
    recommendedFix?: string;
  }>;

  // Root explanation
  explanation: {
    summary: string;
    rootCauses: string[];
    projectedCarc?: string;
  };

  // Action
  recommendedAction: {
    title: string;
    description: string;
    urgent: boolean;
  };

  // Lines
  lines: Array<{
    lineNo: number;
    cptCode: string;
    description: string;
    modifiers: string[];
    diagnosisPointer: number;
    units: number;
    billedAmount: number;
    expectedAmount: number;
    authStatus: string;
    likelyCarc?: string;
  }>;

  // Diagnosis
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  clinicalNotes: string;

  // Correction history log
  correctionHistory: Array<{
    id: string;
    timestamp: string;
    field: string;
    oldValue: string;
    newValue: string;
    user: string;
  }>;
}

const MOCK_CLAIMS_DATABASE: Record<string, FullClaimData> = {
  'clm-002': {
    id: 'clm-002',
    claimNumber: 'CLM-2026-00102',
    patientId: 'pat-8812',
    patientName: 'Marcus Thorne',
    patientDob: '1978-04-12',
    memberId: 'UHC-44912033',
    providerId: 'prv-1092',
    providerName: 'Dr. Gregory House, MD (Orthopedics)',
    providerNpi: '1982736450',
    payerId: 'pay-00430',
    payerName: 'UnitedHealthCare (Ocr Typo)',
    serviceDate: '2026-08-20',
    filingDeadline: '2026-11-20',
    createdAt: '2026-08-20T14:30:00Z',
    updatedAt: '2026-09-02T10:15:00Z',
    evaluatedAt: '2026-09-03T08:00:00Z',
    serviceDescription: 'Lumbar Spine MRI & Orthopedic Evaluation',
    totalBilledAmount: 3200.00,
    expectedAmount: 2150.00,
    status: 'DRAFT',
    trafficLight: 'RED',
    riskScore: 85,
    riskTier: 'HIGH',
    eligibility: {
      status: 'VERIFIED',
      isActive: true,
      effectiveDate: '2026-01-01',
      copayAmount: 45.00,
      deductibleTotal: 1500.00,
      deductibleMet: 1500.00,
      deductibleRemaining: 0.00,
    },
    authorization: {
      status: 'MISSING',
      requiresAuth: true,
      authorizationNumber: undefined,
      authorizedCptCodes: [],
      validThrough: undefined,
    },
    coverage: {
      status: 'COVERED',
      medicalNecessityMet: true,
      frequencyLimitsExceeded: false,
      policyNotes: 'Lumbar MRI indicated for radiculopathy > 6 weeks PT failure.',
    },
    dataQuality: {
      hasIssues: true,
      corrections: [
        {
          id: 'corr-001',
          fieldName: 'payer_name',
          originalValue: 'UnitedHealthCare (Ocr Typo)',
          suggestedValue: 'UnitedHealthcare',
          reason: 'Normalized common OCR/typo abbreviation',
          confidence: 0.98,
          status: 'PENDING',
        },
      ],
    },
    riskFactors: [
      {
        id: 'rf-1',
        category: 'AUTHORIZATION',
        impactPoints: 35,
        title: 'Missing Prior Authorization',
        description: 'Payer policy mandates precertification for outpatient lumbar MRI (CPT 72148). No valid authorization number was attached.',
        likelyCarc: 'CO-197',
        recommendedFix: 'Obtain retro-authorization number from UnitedHealthcare portal and update claim prior to submission.',
      },
      {
        id: 'rf-2',
        category: 'DATA_QUALITY',
        impactPoints: 15,
        title: 'Unnormalized Payer Name',
        description: 'Payer name "UnitedHealthCare (Ocr Typo)" contains OCR artifacts that could lead to clearinghouse EDI route failure.',
        likelyCarc: 'CO-16',
        recommendedFix: 'Apply one-click payer name normalization fix.',
      },
      {
        id: 'rf-3',
        category: 'ELIGIBILITY',
        impactPoints: -10,
        title: 'Active Policy Verified',
        description: 'Subscriber policy #UHC-44912033 is active. Annual deductible is fully met ($1,500 / $1,500).',
      },
    ],
    explanation: {
      summary: 'High Denial Propensity (Score: 85/100). Primary rejection risk is missing prior authorization for CPT 72148 (MRI Lumbar Spine).',
      rootCauses: [
        'CPT 72148 requires prior authorization per UnitedHealthcare Commercial Plan Policy #UHC-RAD-04.',
        'No prior authorization record is associated with this claim.',
        'Payer ID string contains non-standard OCR character string.',
      ],
      projectedCarc: 'CO-197 (Precertification/authorization absent)',
    },
    recommendedAction: {
      title: 'Action Required: Request Retro-Authorization & Apply Fix',
      description: 'Do not submit claim in current state. Apply the available data quality correction and obtain an authorization number for CPT 72148 to prevent guaranteed $2,800.00 denial.',
      urgent: true,
    },
    lines: [
      {
        lineNo: 1,
        cptCode: '72148',
        description: 'MRI Lumbar Spine without contrast',
        modifiers: ['LT'],
        diagnosisPointer: 1,
        units: 1,
        billedAmount: 2800.00,
        expectedAmount: 1850.00,
        authStatus: 'MISSING',
        likelyCarc: 'CO-197',
      },
      {
        lineNo: 2,
        cptCode: '99214',
        description: 'Office Visit, Established Patient, Level 4',
        modifiers: [],
        diagnosisPointer: 1,
        units: 1,
        billedAmount: 400.00,
        expectedAmount: 300.00,
        authStatus: 'NOT_REQUIRED',
        likelyCarc: undefined,
      },
    ],
    primaryDiagnosis: 'M54.5 (Low Back Pain)',
    secondaryDiagnoses: ['M54.16 (Radiculopathy, lumbar region)'],
    clinicalNotes: 'Patient has suffered 8 weeks intractable lower back pain radiating down left L5 distribution. Failed conservative physical therapy.',
    correctionHistory: [
      {
        id: 'log-101',
        timestamp: '2026-08-20T14:35:00Z',
        field: 'created_at',
        oldValue: 'N/A',
        newValue: 'Initial Draft Created from EHR Import',
        user: 'System Ingestion Bot',
      },
    ],
  },
  'clm-001': {
    id: 'clm-001',
    claimNumber: 'CLM-2026-00101',
    patientId: 'pat-1049',
    patientName: 'Eleanor Vance',
    patientDob: '1985-11-23',
    memberId: 'BCBS-98231011',
    providerId: 'prv-0042',
    providerName: 'Dr. Sarah Jenkins, MD (Internal Medicine)',
    providerNpi: '1234567890',
    payerId: 'pay-00123',
    payerName: 'Blue Cross Blue Shield',
    serviceDate: '2026-08-15',
    filingDeadline: '2026-11-15',
    createdAt: '2026-08-15T09:12:00Z',
    updatedAt: '2026-09-01T11:00:00Z',
    evaluatedAt: '2026-09-03T08:00:00Z',
    serviceDescription: 'Comprehensive Outpatient Annual Exam & Venipuncture',
    totalBilledAmount: 1450.00,
    expectedAmount: 1220.00,
    status: 'READY_FOR_SUBMISSION',
    trafficLight: 'GREEN',
    riskScore: 18,
    riskTier: 'LOW',
    eligibility: {
      status: 'VERIFIED',
      isActive: true,
      effectiveDate: '2026-01-01',
      copayAmount: 35.00,
      deductibleTotal: 1500.00,
      deductibleMet: 1200.00,
      deductibleRemaining: 300.00,
    },
    authorization: {
      status: 'NOT_REQUIRED',
      requiresAuth: false,
      authorizationNumber: undefined,
      authorizedCptCodes: ['99213', '36415'],
    },
    coverage: {
      status: 'COVERED',
      medicalNecessityMet: true,
      frequencyLimitsExceeded: false,
      policyNotes: 'Preventive annual visit & routine bloodwork covered 100% under PPO benefit.',
    },
    dataQuality: {
      hasIssues: false,
      corrections: [],
    },
    riskFactors: [
      {
        id: 'rf-101',
        category: 'ELIGIBILITY',
        impactPoints: -10,
        title: 'Active Coverage Confirmed',
        description: 'Subscriber coverage active with BCBS PPO.',
      },
      {
        id: 'rf-102',
        category: 'AUTHORIZATION',
        impactPoints: -10,
        title: 'No Authorization Needed',
        description: 'Billed procedure codes do not require prior authorization.',
      },
    ],
    explanation: {
      summary: 'Low Denial Risk (Score: 18/100). All clinical, coding, and eligibility validation checks passed.',
      rootCauses: ['No risks identified. Claim meets clean submission criteria.'],
    },
    recommendedAction: {
      title: 'Ready for Immediate Submission',
      description: 'Claim is clean and verified. Proceed to submit to clearinghouse.',
      urgent: false,
    },
    lines: [
      {
        lineNo: 1,
        cptCode: '99213',
        description: 'Office Visit, Established Patient, Level 3',
        modifiers: ['25'],
        diagnosisPointer: 1,
        units: 1,
        billedAmount: 1250.00,
        expectedAmount: 1100.00,
        authStatus: 'NOT_REQUIRED',
      },
      {
        lineNo: 2,
        cptCode: '36415',
        description: 'Routine Venipuncture (Blood Draw)',
        modifiers: [],
        diagnosisPointer: 1,
        units: 1,
        billedAmount: 200.00,
        expectedAmount: 120.00,
        authStatus: 'NOT_REQUIRED',
      },
    ],
    primaryDiagnosis: 'Z00.00 (General adult medical examination)',
    secondaryDiagnoses: ['E78.5 (Hyperlipidemia, unspecified)'],
    clinicalNotes: 'Routine annual preventive physical. Patient feels well. Lab panel ordered.',
    correctionHistory: [
      {
        id: 'log-201',
        timestamp: '2026-08-15T09:15:00Z',
        field: 'created_at',
        oldValue: 'N/A',
        newValue: 'Draft created via EHR Interface',
        user: 'AutoIngest Engine',
      },
    ],
  },
  'clm-004': {
    id: 'clm-004',
    claimNumber: 'CLM-2026-00104',
    patientId: 'pat-9031',
    patientName: 'David K. Miller',
    patientDob: '1965-02-14',
    memberId: 'AET-8830192',
    providerId: 'prv-3391',
    providerName: 'Dr. James Wilson, MD (Orthopedic Surgery)',
    providerNpi: '1827364509',
    payerId: 'pay-60054',
    payerName: 'Aetna Health',
    serviceDate: '2026-08-05',
    filingDeadline: '2026-11-05',
    createdAt: '2026-08-05T16:00:00Z',
    updatedAt: '2026-08-28T14:20:00Z',
    evaluatedAt: '2026-09-03T08:00:00Z',
    serviceDescription: 'Arthroscopic Knee Meniscectomy',
    totalBilledAmount: 2850.00,
    expectedAmount: 1900.00,
    status: 'VERIFIED',
    trafficLight: 'AMBER',
    riskScore: 74,
    riskTier: 'HIGH',
    eligibility: {
      status: 'VERIFIED',
      isActive: true,
      effectiveDate: '2026-01-01',
      copayAmount: 50.00,
      deductibleTotal: 2000.00,
      deductibleMet: 800.00,
      deductibleRemaining: 1200.00,
    },
    authorization: {
      status: 'APPROVED',
      requiresAuth: true,
      authorizationNumber: 'AUTH-AET-99210',
      authorizedCptCodes: ['29881'],
      validThrough: '2026-10-15',
    },
    coverage: {
      status: 'EXCEEDED',
      medicalNecessityMet: false,
      frequencyLimitsExceeded: true,
      policyNotes: 'Second knee arthroscopy in 6 months exceeds standard policy frequency limit without operative report attachment.',
    },
    dataQuality: {
      hasIssues: false,
      corrections: [],
    },
    riskFactors: [
      {
        id: 'rf-401',
        category: 'COVERAGE',
        impactPoints: 40,
        title: 'Frequency Limit Exceeded',
        description: 'Patient had same procedure 4 months ago. Operative notes and conservative management failure documentation required.',
        likelyCarc: 'CO-50',
        recommendedFix: 'Attach clinical operative note and conservative treatment history before submission.',
      },
      {
        id: 'rf-402',
        category: 'AUTHORIZATION',
        impactPoints: -15,
        title: 'Prior Auth Approved',
        description: 'Valid authorization number AUTH-AET-99210 attached.',
      },
    ],
    explanation: {
      summary: 'High Risk (Score: 74/100). Risk of Medical Necessity / Frequency Limit denial (CARC CO-50).',
      rootCauses: ['CPT 29881 exceeds 6-month frequency cap without accompanying clinical justification notes.'],
      projectedCarc: 'CO-50 (Non-covered request procedure code)',
    },
    recommendedAction: {
      title: 'Attach Operative Clinical Notes',
      description: 'Attach operative report to standard submission package to satisfy frequency cap exception rules.',
      urgent: true,
    },
    lines: [
      {
        lineNo: 1,
        cptCode: '29881',
        description: 'Arthroscopy Knee Surgical with Meniscectomy',
        modifiers: ['RT'],
        diagnosisPointer: 1,
        units: 1,
        billedAmount: 2850.00,
        expectedAmount: 1900.00,
        authStatus: 'APPROVED',
        likelyCarc: 'CO-50',
      },
    ],
    primaryDiagnosis: 'M23.22 (Derangement of meniscus due to old tear)',
    secondaryDiagnoses: [],
    clinicalNotes: 'Right knee locking and swelling. MRI showed bucket-handle medial meniscus tear. Surgery performed successfully.',
    correctionHistory: [],
  },
};

export const ClaimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<FullClaimData | null>(null);

  // Interactive state
  const [reverifying, setReverifying] = useState<boolean>(false);
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      const claimId = id || 'clm-002';
      const record = MOCK_CLAIMS_DATABASE[claimId];

      if (!record) {
        setError(`Claim with ID "${claimId}" was not found in the claim intelligence repository.`);
        setClaimData(null);
      } else {
        setClaimData({ ...record });
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [id]);

  const handleApplyCorrection = (corrId: string) => {
    if (!claimData) return;

    const updatedCorrections = claimData.dataQuality.corrections.map((c) => {
      if (c.id === corrId) {
        return { ...c, status: 'APPLIED' as const, appliedAt: new Date().toISOString() };
      }
      return c;
    });

    const newScore = Math.max(0, claimData.riskScore - 15);
    const newTier = newScore >= 70 ? 'HIGH' : newScore >= 30 ? 'MEDIUM' : 'LOW';
    const newTraffic = newScore >= 70 ? 'RED' : newScore >= 30 ? 'AMBER' : 'GREEN';

    const newHistory = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        field: 'payer_name',
        oldValue: claimData.payerName,
        newValue: 'UnitedHealthcare',
        user: 'Current Billing Specialist (Jules)',
      },
      ...claimData.correctionHistory,
    ];

    setClaimData({
      ...claimData,
      payerName: 'UnitedHealthcare',
      trafficLight: newTraffic as 'GREEN' | 'AMBER' | 'RED',
      riskScore: newScore,
      riskTier: newTier as 'LOW' | 'MEDIUM' | 'HIGH',
      dataQuality: {
        hasIssues: false,
        corrections: updatedCorrections,
      },
      correctionHistory: newHistory,
    });
  };

  const handleRunReverification = () => {
    setReverifying(true);
    setTimeout(() => {
      setReverifying(false);
      if (claimData) {
        setClaimData({
          ...claimData,
          evaluatedAt: new Date().toISOString(),
        });
      }
    }, 600);
  };

  const handleSubmitClaim = () => {
    if (!claimData) return;
    setClaimData({
      ...claimData,
      status: 'SUBMITTED',
      updatedAt: new Date().toISOString(),
    });
    setShowOverrideModal(false);
  };

  // Helper for filing deadline countdown badge
  const getFilingCountdown = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const now = new Date('2026-09-03');
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { text: 'Filing Deadline Passed!', urgent: true };
    if (diffDays <= 30) return { text: `Filing deadline in ${diffDays} days`, urgent: true };
    return { text: `Filing deadline in ${diffDays} days`, urgent: false };
  };

  // Render Loading State
  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <div>
          <h3 className="text-lg font-bold text-slate-900">Loading Claim Intelligence Cockpit...</h3>
          <p className="text-xs text-slate-500 mt-1">Fetching 360-degree claim factors, rule evaluations, and data quality checks.</p>
        </div>
      </div>
    );
  }

  // Render Error / Not Found State
  if (error || !claimData) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6 text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-black text-rose-900">Claim Record Not Found</h2>
          <p className="text-xs text-rose-700 leading-relaxed">
            {error || 'Unable to load claim intelligence data.'}
          </p>
          <div className="pt-2">
            <Link
              to="/claims"
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Claims Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filingCountdown = getFilingCountdown(claimData.filingDeadline);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/claims"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Claims Queue
        </Link>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${
              filingCountdown.urgent
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {filingCountdown.text}
          </span>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold ${
              claimData.status === 'SUBMITTED'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : claimData.status === 'READY_FOR_SUBMISSION'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            STATUS: {claimData.status}
          </span>
        </div>
      </div>

      {/* 1. CLAIM HEADER */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-md">
                CMS-1500
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {claimData.claimNumber}
              </h2>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-black ${
                  claimData.riskTier === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : claimData.riskTier === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {claimData.riskTier} DENIAL RISK
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Service: <strong className="text-slate-800">{claimData.serviceDescription}</strong></span>
              <span>•</span>
              <span>Evaluated: {new Date(claimData.evaluatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRunReverification}
              disabled={reverifying}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reverifying ? 'animate-spin' : ''}`} />
              {reverifying ? 'Evaluating...' : 'Run Re-verification'}
            </button>
            <Link
              to="/recovery"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5"
            >
              Simulate Adjudication <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Claim Header Key Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" /> Patient Ref
            </div>
            <div className="font-bold text-slate-900 mt-1">{claimData.patientName}</div>
            <div className="text-slate-500 text-[11px]">DOB: {claimData.patientDob}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" /> Payer
            </div>
            <div className="font-bold text-slate-900 mt-1 truncate">{claimData.payerName}</div>
            <div className="text-slate-500 font-mono text-[11px]">ID: {claimData.memberId}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Date of Service
            </div>
            <div className="font-bold text-slate-900 mt-1">{claimData.serviceDate}</div>
            <div className="text-slate-500 text-[11px]">POS: 11 (Office)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Billed Amount
            </div>
            <div className="font-black text-slate-900 text-sm mt-1">
              ${claimData.totalBilledAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-slate-500 text-[11px]">{claimData.lines.length} Line Items</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Expected Amt
            </div>
            <div className="font-black text-emerald-700 text-sm mt-1">
              ${claimData.expectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-slate-500 text-[11px]">Contract Allowed</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-slate-500" /> Rendering
            </div>
            <div className="font-bold text-slate-900 mt-1 truncate">{claimData.providerName.split(',')[0]}</div>
            <div className="text-slate-500 font-mono text-[11px]">NPI: {claimData.providerNpi}</div>
          </div>
        </div>
      </div>

      {/* 2. TRAFFIC-LIGHT STATUS & 3. RISK SCORE & 4. FINANCIAL IMPACT BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 2. Traffic Light Status Banner */}
        <div
          className={`p-6 rounded-xl border flex flex-col justify-between space-y-4 ${
            claimData.trafficLight === 'RED'
              ? 'bg-rose-50 border-rose-300'
              : claimData.trafficLight === 'AMBER'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-emerald-50 border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Traffic-Light Status Indicator
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  claimData.trafficLight === 'RED' ? 'bg-rose-600 animate-pulse' : 'bg-rose-300'
                }`}
              />
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  claimData.trafficLight === 'AMBER' ? 'bg-amber-500 animate-pulse' : 'bg-amber-300'
                }`}
              />
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  claimData.trafficLight === 'GREEN' ? 'bg-emerald-600' : 'bg-emerald-300'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {claimData.trafficLight === 'RED' ? (
              <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
            ) : claimData.trafficLight === 'AMBER' ? (
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            )}
            <div>
              <div className="text-base font-black text-slate-900">
                {claimData.trafficLight === 'RED'
                  ? 'CRITICAL REJECTION RISK'
                  : claimData.trafficLight === 'AMBER'
                  ? 'WARNING / MANUAL REVIEW'
                  : 'CLEAN CLAIM - READY'}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {claimData.trafficLight === 'RED'
                  ? 'Engine detected high probability of pre-submission rejection or post-submission CARC denial.'
                  : claimData.trafficLight === 'AMBER'
                  ? 'Subscores indicate potential documentation or coverage exceptions.'
                  : 'Passed all 270/271, prior auth, coverage, and data quality validation rules.'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Composite Risk Score Gauge */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Composite Denial Risk Score
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {claimData.riskScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Tier: <span className="font-bold text-slate-800">{claimData.riskTier}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Weighted Across Eligibility (25%), Auth (25%), Coverage (20%), Quality (10%)
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <div
              className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-md ${
                claimData.riskScore >= 70
                  ? 'bg-rose-600'
                  : claimData.riskScore >= 30
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
            >
              <span className="text-3xl font-black font-mono">{claimData.riskScore}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">SCORE</span>
            </div>
          </div>
        </div>

        {/* 4. Financial Impact Analysis */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Financial Impact & Risk Value
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Billed Charge</div>
              <div className="text-base font-bold text-slate-900 font-mono">
                ${claimData.totalBilledAmount.toFixed(2)}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Expected Reimbursement</div>
              <div className="text-base font-bold text-emerald-700 font-mono">
                ${claimData.expectedAmount.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between text-xs font-bold text-rose-900">
            <span>Potential Denial Revenue Loss:</span>
            <span className="font-mono text-sm">${(claimData.expectedAmount * (claimData.riskScore / 100)).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 5, 6, 7. THREE-ENGINE INTELLIGENCE GRID: ELIGIBILITY | AUTHORIZATION | COVERAGE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 5. ELIGIBILITY */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Eligibility & Benefits (270/271)</h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                claimData.eligibility.isActive
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {claimData.eligibility.status}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Effective Date:</span>
              <span className="font-bold text-slate-800">{claimData.eligibility.effectiveDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Specialist Copay:</span>
              <span className="font-bold text-slate-800">${claimData.eligibility.copayAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Annual Deductible:</span>
              <span className="font-bold text-slate-800">${claimData.eligibility.deductibleTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Deductible Remaining:</span>
              <span className="font-bold text-emerald-700">${claimData.eligibility.deductibleRemaining.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 6. AUTHORIZATION */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Prior Authorization</h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                claimData.authorization.status === 'APPROVED' || claimData.authorization.status === 'NOT_REQUIRED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {claimData.authorization.status}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Requires Auth:</span>
              <span className="font-bold text-slate-800">{claimData.authorization.requiresAuth ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Auth Number:</span>
              <span className="font-mono font-bold text-slate-900">
                {claimData.authorization.authorizationNumber || 'NOT ATTACHED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Approved Codes:</span>
              <span className="font-mono text-slate-800">
                {claimData.authorization.authorizedCptCodes.length > 0
                  ? claimData.authorization.authorizedCptCodes.join(', ')
                  : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* 7. COVERAGE */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Coverage & Policy Limits</h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                claimData.coverage.status === 'COVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {claimData.coverage.status}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Medical Necessity:</span>
              <span className="font-bold text-slate-800">
                {claimData.coverage.medicalNecessityMet ? 'MET' : 'NOT MET'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Frequency Cap Exceeded:</span>
              <span className="font-bold text-slate-800">
                {claimData.coverage.frequencyLimitsExceeded ? 'YES' : 'NO'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
              {claimData.coverage.policyNotes}
            </p>
          </div>
        </div>
      </div>

      {/* 8. DATA QUALITY & ONE-CLICK PRE-SUBMISSION CORRECTIONS */}
      {claimData.dataQuality.corrections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" /> Data Quality & Pre-Submission Remediation
          </h3>
          {claimData.dataQuality.corrections.map((corr) => (
            <div
              key={corr.id}
              className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                corr.status === 'APPLIED'
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-amber-50 border-amber-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {corr.status === 'APPLIED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Wrench className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {corr.status === 'APPLIED'
                        ? 'Correction Applied'
                        : `Suggested Fix: ${corr.fieldName.replace('_', ' ').toUpperCase()}`}
                    </h4>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded">
                      Confidence: {Math.round(corr.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    {corr.reason}: Change <span className="font-mono bg-white px-1.5 py-0.5 rounded border font-bold text-rose-700">{corr.originalValue}</span> to{' '}
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border font-bold text-emerald-700">{corr.suggestedValue}</span>.
                  </p>
                </div>
              </div>

              {corr.status === 'PENDING' ? (
                <button
                  onClick={() => handleApplyCorrection(corr.id)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Apply Fix
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg">
                  Fix Active
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PROCEDURE LINE ITEMS (CMS-1500 GRID) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> CMS-1500 Procedure Lines Grid
          </h3>
          <span className="text-xs text-slate-500 font-mono">{claimData.lines.length} Line Item(s)</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4">Line #</th>
              <th className="py-2.5 px-4">CPT / HCPCS</th>
              <th className="py-2.5 px-4">Description</th>
              <th className="py-2.5 px-4 text-center">Modifiers</th>
              <th className="py-2.5 px-4 text-center">Units</th>
              <th className="py-2.5 px-4 text-right">Billed Charge</th>
              <th className="py-2.5 px-4 text-center">Prior Auth</th>
              <th className="py-2.5 px-4 text-center">Likely CARC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {claimData.lines.map((l) => (
              <tr key={l.lineNo} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-400">{l.lineNo}</td>
                <td className="py-3 px-4 font-mono font-bold text-blue-600">{l.cptCode}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{l.description}</td>
                <td className="py-3 px-4 text-center font-mono text-slate-600">
                  {l.modifiers.length > 0 ? l.modifiers.join(', ') : '—'}
                </td>
                <td className="py-3 px-4 text-center font-bold text-slate-700">{l.units}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">
                  ${l.billedAmount.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      l.authStatus === 'MISSING'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {l.authStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                  {l.likelyCarc || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 9. RISK FACTORS & 10. EXPLANATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 9. Risk Factors List */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> Denial Risk Factor Decomposition
          </h3>
          <div className="space-y-3">
            {claimData.riskFactors.map((rf) => (
              <div
                key={rf.id}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  rf.impactPoints > 0
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className={rf.impactPoints > 0 ? 'text-rose-900' : 'text-emerald-900'}>
                    {rf.impactPoints > 0 ? `+${rf.impactPoints}` : rf.impactPoints} Impact — {rf.title}
                  </span>
                  {rf.likelyCarc && (
                    <span className="font-mono bg-rose-200 text-rose-900 px-2 py-0.5 rounded text-[11px]">
                      Predicted: {rf.likelyCarc}
                    </span>
                  )}
                </div>
                <p className={rf.impactPoints > 0 ? 'text-rose-800' : 'text-emerald-800'}>
                  {rf.description}
                </p>
                {rf.recommendedFix && (
                  <div className="pt-1 font-semibold text-rose-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-rose-600" /> Fix: {rf.recommendedFix}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 10. Plain-Language Explanation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" /> AI / Deterministic Explanation Narrative
          </h3>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="font-bold text-slate-900 text-sm leading-snug">
              {claimData.explanation.summary}
            </div>
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-700">Identified Root Causes:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {claimData.explanation.rootCauses.map((cause, idx) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
            </div>
            {claimData.explanation.projectedCarc && (
              <div className="pt-2 border-t border-slate-200 text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Projected CARC Code: {claimData.explanation.projectedCarc}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-800">Primary Diagnosis Code</div>
            <div className="font-bold text-blue-600 font-mono text-sm">{claimData.primaryDiagnosis}</div>
            <div className="text-slate-500">Clinical documentation context:</div>
            <p className="italic text-slate-600 bg-white p-2.5 rounded border border-slate-200">
              "{claimData.clinicalNotes}"
            </p>
          </div>
        </div>
      </div>

      {/* 11. RECOMMENDED ACTION & ACTION BAR */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" /> Recommended Action Protocol
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {claimData.recommendedAction.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {claimData.riskScore >= 70 ? (
              <button
                onClick={() => setShowOverrideModal(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Attempt Submission (High Risk)
              </button>
            ) : (
              <button
                onClick={handleSubmitClaim}
                disabled={claimData.status === 'SUBMITTED'}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {claimData.status === 'SUBMITTED' ? 'Claim Submitted' : 'Submit Clean Claim to Clearinghouse'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 12. AUDIT TRAIL & TIMESTAMPS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-600" /> Timestamps & Audit Trail
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-slate-100 pb-4">
          <div>
            <span className="text-slate-400 font-medium">Ingestion Date</span>
            <div className="font-mono font-bold text-slate-800 mt-0.5">
              {new Date(claimData.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Last Modified</span>
            <div className="font-mono font-bold text-slate-800 mt-0.5">
              {new Date(claimData.updatedAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Rule Engine Evaluated</span>
            <div className="font-mono font-bold text-slate-800 mt-0.5">
              {new Date(claimData.evaluatedAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Filing Deadline</span>
            <div className="font-mono font-bold text-rose-700 mt-0.5">
              {claimData.filingDeadline}
            </div>
          </div>
        </div>

        {/* History Log Table */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700">Modification Log</div>
          <div className="space-y-1.5 text-xs">
            {claimData.correctionHistory.map((log) => (
              <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-slate-700 font-mono text-[11px]">
                <div>
                  <span className="font-bold text-slate-900">{log.field}:</span> {log.oldValue} → <span className="text-blue-600 font-bold">{log.newValue}</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString()} ({log.user})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for High Risk Override */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">High Risk Submission Warning</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This claim has a composite denial risk score of <strong className="text-rose-700">{claimData.riskScore}/100</strong>. Submitting this claim without resolving missing prior authorization may result in immediate rejection by the clearinghouse.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel & Fix
              </button>
              <button
                onClick={handleSubmitClaim}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Override & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
