import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  DollarSign,
  Wrench,
  ArrowUpRight,
  ExternalLink,
  Clock,
  Filter,
  CheckCircle2,
  ChevronRight,
  PieChart,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
export type ClaimStatus =
  | 'DRAFT'
  | 'VERIFIED'
  | 'READY_FOR_SUBMISSION'
  | 'SUBMITTED'
  | 'ADJUDICATED'
  | 'APPEAL_IN_PROGRESS'
  | 'CLOSED';

// Types representing canonical API response structure for Dashboard metrics
interface DashboardKPIs {
  totalAnalyzed: number;
  totalCleared: number;
  cleanRate: number;
  requiringReview: number;
  highRiskCount: number;
  revenueAtRisk: number;
  autoCorrectionsApplied: number;
}

interface RiskDistribution {
  low: number; // 0-29
  medium: number; // 30-69
  high: number; // 70-100
}

interface StatusBreakdownItem {
  status: ClaimStatus;
  label: string;
  count: number;
  colorBg: string;
  colorText: string;
}

interface DenialCategory {
  carc: string;
  title: string;
  category: string;
  count: number;
  exposure: number;
  recommendedAction: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface PayerDistributionItem {
  payerName: string;
  claimCount: number;
  sharePercent: number;
  cleanRate: number;
  atRiskAmount: number;
}

interface AttentionClaim {
  id: string;
  claimNumber: string;
  patientName: string;
  payerName: string;
  serviceDescription: string;
  cptCode: string;
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM';
  primaryIssue: string;
  recommendedNextAction: string;
  actionType: 'FIX_TYPO' | 'ATTACH_AUTH' | 'EXPEDITE' | 'VERIFY_ELIGIBILITY';
  billedAmount: number;
}

interface RecentClaim {
  id: string;
  claimNumber: string;
  patientName: string;
  payerName: string;
  serviceDate: string;
  billedAmount: number;
  riskScore: number;
  status: ClaimStatus;
}

// Synthetic / Fallback Dashboard Data conforming to Canonical Contracts
const MOCK_KPIS: DashboardKPIs = {
  totalAnalyzed: 142,
  totalCleared: 120,
  cleanRate: 84.5,
  requiringReview: 22,
  highRiskCount: 16,
  revenueAtRisk: 58300.0,
  autoCorrectionsApplied: 38,
};

const MOCK_RISK_DISTRIBUTION: RiskDistribution = {
  low: 98,
  medium: 28,
  high: 16,
};

const MOCK_STATUS_BREAKDOWN: StatusBreakdownItem[] = [
  {
    status: 'READY_FOR_SUBMISSION',
    label: 'Ready for Submission',
    count: 72,
    colorBg: 'bg-emerald-50 border-emerald-200',
    colorText: 'text-emerald-700',
  },
  {
    status: 'SUBMITTED',
    label: 'Submitted to Clearinghouse',
    count: 24,
    colorBg: 'bg-blue-50 border-blue-200',
    colorText: 'text-blue-700',
  },
  {
    status: 'VERIFIED',
    label: 'Verified / In Progress',
    count: 18,
    colorBg: 'bg-purple-50 border-purple-200',
    colorText: 'text-purple-700',
  },
  {
    status: 'ADJUDICATED',
    label: 'Adjudicated',
    count: 16,
    colorBg: 'bg-indigo-50 border-indigo-200',
    colorText: 'text-indigo-700',
  },
  {
    status: 'DRAFT',
    label: 'Draft',
    count: 12,
    colorBg: 'bg-slate-100 border-slate-200',
    colorText: 'text-slate-700',
  },
];

const MOCK_DENIAL_CATEGORIES: DenialCategory[] = [
  {
    carc: 'CO-197',
    title: 'Precertification / Auth Absent',
    category: 'Prior Authorization',
    count: 9,
    exposure: 28400.0,
    recommendedAction: 'Attach retro-authorization or verify pre-auth ID',
    severity: 'HIGH',
  },
  {
    carc: 'CO-16',
    title: 'Lacks Information Needed for Adjudication',
    category: 'Data Quality / Typo',
    count: 5,
    exposure: 14200.0,
    recommendedAction: 'Apply auto-correction for subscriber OCR typo',
    severity: 'MEDIUM',
  },
  {
    carc: 'CO-29',
    title: 'Timely Filing Limit Expiring Soon',
    category: 'Filing Deadline',
    count: 2,
    exposure: 15700.0,
    recommendedAction: 'Expedite clearinghouse dispatch within 48h',
    severity: 'HIGH',
  },
  {
    carc: 'CO-96',
    title: 'Non-Covered Charge / Policy Cap Exceeded',
    category: 'Coverage Policy',
    count: 3,
    exposure: 6800.0,
    recommendedAction: 'Attach clinical necessity notes & modifier',
    severity: 'MEDIUM',
  },
];

const MOCK_PAYER_DISTRIBUTION: PayerDistributionItem[] = [
  {
    payerName: 'Blue Cross Blue Shield',
    claimCount: 52,
    sharePercent: 36.6,
    cleanRate: 89.2,
    atRiskAmount: 18400.0,
  },
  {
    payerName: 'UnitedHealthcare',
    claimCount: 38,
    sharePercent: 26.8,
    cleanRate: 79.4,
    atRiskAmount: 22100.0,
  },
  {
    payerName: 'Traditional Medicare Part B',
    claimCount: 32,
    sharePercent: 22.5,
    cleanRate: 94.1,
    atRiskAmount: 6200.0,
  },
  {
    payerName: 'Aetna Commercial',
    claimCount: 20,
    sharePercent: 14.1,
    cleanRate: 82.5,
    atRiskAmount: 11600.0,
  },
];

const MOCK_ATTENTION_CLAIMS: AttentionClaim[] = [
  {
    id: 'clm-002',
    claimNumber: 'CLM-2026-00102',
    patientName: 'Marcus Thorne',
    payerName: 'UnitedHealthcare',
    serviceDescription: 'MRI Lumbar Spine W/O Contrast',
    cptCode: '72148',
    riskScore: 85,
    riskLevel: 'HIGH',
    primaryIssue: 'Missing Prior Authorization (CPT 72148)',
    recommendedNextAction: 'Attach valid authorization or request retro-auth',
    actionType: 'ATTACH_AUTH',
    billedAmount: 3200.0,
  },
  {
    id: 'clm-004',
    claimNumber: 'CLM-2026-00104',
    patientName: 'Sarah Jenkins',
    payerName: 'Blue Cross Blue Shield',
    serviceDescription: 'Outpatient Physical Therapy Evaluation',
    cptCode: '97161',
    riskScore: 78,
    riskLevel: 'HIGH',
    primaryIssue: 'Payer Name typo ("BlueShild") & NPI length error',
    recommendedNextAction: 'Run 1-Click Auto-Correction to fix demographic data',
    actionType: 'FIX_TYPO',
    billedAmount: 1850.0,
  },
  {
    id: 'clm-005',
    claimNumber: 'CLM-2026-00105',
    patientName: 'Robert Chen',
    payerName: 'Traditional Medicare Part B',
    serviceDescription: 'Knee Arthroscopy Surgical Procedure',
    cptCode: '29881',
    riskScore: 72,
    riskLevel: 'HIGH',
    primaryIssue: 'Timely filing limit expiring in 3 days',
    recommendedNextAction: 'Expedite submission batch to clearinghouse',
    actionType: 'EXPEDITE',
    billedAmount: 5400.0,
  },
  {
    id: 'clm-006',
    claimNumber: 'CLM-2026-00106',
    patientName: 'Elena Rostova',
    payerName: 'Aetna Commercial',
    serviceDescription: 'Comprehensive Metabolic Panel & Lipid Panel',
    cptCode: '80053',
    riskScore: 62,
    riskLevel: 'MEDIUM',
    primaryIssue: 'Inactive member coverage on service date',
    recommendedNextAction: 'Re-verify real-time eligibility with 270 query',
    actionType: 'VERIFY_ELIGIBILITY',
    billedAmount: 920.0,
  },
];

const MOCK_RECENT_CLAIMS: RecentClaim[] = [
  {
    id: 'clm-002',
    claimNumber: 'CLM-2026-00102',
    patientName: 'Marcus Thorne',
    payerName: 'UnitedHealthcare',
    serviceDate: '2026-08-20',
    billedAmount: 3200.0,
    riskScore: 85,
    status: 'DRAFT',
  },
  {
    id: 'clm-001',
    claimNumber: 'CLM-2026-00101',
    patientName: 'Eleanor Vance',
    payerName: 'Blue Cross Blue Shield',
    serviceDate: '2026-08-15',
    billedAmount: 1450.0,
    riskScore: 18,
    status: 'READY_FOR_SUBMISSION',
  },
  {
    id: 'clm-003',
    claimNumber: 'CLM-2026-00103',
    patientName: 'David Miller',
    payerName: 'Traditional Medicare Part B',
    serviceDate: '2026-08-18',
    billedAmount: 2100.0,
    riskScore: 12,
    status: 'SUBMITTED',
  },
  {
    id: 'clm-007',
    claimNumber: 'CLM-2026-00107',
    patientName: 'Hannah Abbott',
    payerName: 'Aetna Commercial',
    serviceDate: '2026-08-21',
    billedAmount: 4150.0,
    riskScore: 45,
    status: 'VERIFIED',
  },
  {
    id: 'clm-008',
    claimNumber: 'CLM-2026-00108',
    patientName: 'Carlos Gomez',
    payerName: 'Blue Cross Blue Shield',
    serviceDate: '2026-08-12',
    billedAmount: 1280.0,
    riskScore: 8,
    status: 'ADJUDICATED',
  },
];

export const Dashboard: React.FC = () => {
  const [kpis] = useState<DashboardKPIs>(MOCK_KPIS);
  const [attentionFilter, setAttentionFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');

  const filteredAttentionClaims = MOCK_ATTENTION_CLAIMS.filter((c) => {
    if (attentionFilter === 'ALL') return true;
    return c.riskLevel === attentionFilter;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Claim Intelligence Dashboard
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5" /> Live Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time pre-submission claim analysis, denial prevention, risk scoring, and auto-corrections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/claims"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <span>Inspect All Claims ({kpis.totalAnalyzed})</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* SECTION 1: Required 6 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Claims Analyzed */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Claims Analyzed
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{kpis.totalAnalyzed}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-blue-600 font-semibold">100%</span> processed
            </div>
          </div>
        </div>

        {/* KPI 2: Claims Cleared */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Claims Cleared
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{kpis.totalCleared}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">{kpis.cleanRate}%</span> clean rate
            </div>
          </div>
        </div>

        {/* KPI 3: Claims Requiring Review */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Requiring Review
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">{kpis.requiringReview}</div>
            <div className="text-xs text-slate-500 mt-1">Pending staff action</div>
          </div>
        </div>

        {/* KPI 4: High-Risk Claims */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              High-Risk Claims
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">{kpis.highRiskCount}</div>
            <div className="text-xs text-slate-500 mt-1">Score &ge; 70 (Blocked)</div>
          </div>
        </div>

        {/* KPI 5: Estimated Revenue at Risk */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Revenue at Risk
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">
              ${kpis.revenueAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">Across 16 high-risk claims</div>
          </div>
        </div>

        {/* KPI 6: Auto-Corrections */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Auto-Corrections
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-700">{kpis.autoCorrectionsApplied}</div>
            <div className="text-xs text-slate-500 mt-1">OCR &amp; NPI fixes applied</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Operational Area - "Claims Requiring Attention" */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Claims Requiring Attention</h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                {filteredAttentionClaims.length} Action Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              High and medium risk claims requiring manual review or 1-click fix before submission.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Risk Level:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs font-semibold">
              <button
                onClick={() => setAttentionFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  attentionFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAttentionFilter('HIGH')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  attentionFilter === 'HIGH'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setAttentionFilter('MEDIUM')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  attentionFilter === 'MEDIUM'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Medium Risk
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredAttentionClaims.map((claim) => (
            <div
              key={claim.id}
              className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/claims/${claim.id}`}
                    className="font-mono font-bold text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    {claim.claimNumber} <ExternalLink className="w-3 h-3" />
                  </Link>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-800">{claim.patientName}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                    {claim.payerName}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      claim.riskLevel === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Risk Score: {claim.riskScore}/100 ({claim.riskLevel})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Service / CPT: </span>
                    <span className="font-semibold text-slate-800">
                      {claim.serviceDescription} (CPT {claim.cptCode})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Billed Amount: </span>
                    <span className="font-bold text-slate-900">
                      ${claim.billedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 min-w-fit">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    Primary Issue:
                  </div>
                  <div className="text-amber-950 font-medium">{claim.primaryIssue}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <div className="text-xs text-right hidden xl:block mr-2">
                  <div className="text-slate-400 font-medium">Recommended Action</div>
                  <div className="text-slate-700 font-semibold">{claim.recommendedNextAction}</div>
                </div>
                <Link
                  to={`/claims/${claim.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Resolve Issue</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Required Visualizations (Grid Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Visualization 1: Risk Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Risk Distribution</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">142 total</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Categorization based on multi-factor pre-submission denial scoring (0–100).
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low Risk (0–29)
                  </span>
                  <span className="text-slate-700">
                    {MOCK_RISK_DISTRIBUTION.low} claims ({Math.round((MOCK_RISK_DISTRIBUTION.low / kpis.totalAnalyzed) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(MOCK_RISK_DISTRIBUTION.low / kpis.totalAnalyzed) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium Risk (30–69)
                  </span>
                  <span className="text-slate-700">
                    {MOCK_RISK_DISTRIBUTION.medium} claims ({Math.round((MOCK_RISK_DISTRIBUTION.medium / kpis.totalAnalyzed) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${(MOCK_RISK_DISTRIBUTION.medium / kpis.totalAnalyzed) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> High Risk (70–100)
                  </span>
                  <span className="text-slate-700">
                    {MOCK_RISK_DISTRIBUTION.high} claims ({Math.round((MOCK_RISK_DISTRIBUTION.high / kpis.totalAnalyzed) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full"
                    style={{ width: `${(MOCK_RISK_DISTRIBUTION.high / kpis.totalAnalyzed) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Auto-cleared: {MOCK_RISK_DISTRIBUTION.low}
            </span>
            <span className="text-rose-600 font-semibold">Blocked: {MOCK_RISK_DISTRIBUTION.high}</span>
          </div>
        </div>

        {/* Visualization 2: Claim Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Claim Lifecycle Status</h3>
              </div>
              <span className="text-xs text-slate-500">Pipeline View</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Volume breakdown across the claim state machine lifecycle.
            </p>

            <div className="space-y-2">
              {MOCK_STATUS_BREAKDOWN.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${item.colorBg} ${item.colorText}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs text-slate-900">{item.count} claims</span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({Math.round((item.count / kpis.totalAnalyzed) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Real-time clearinghouse sync enabled</span>
          </div>
        </div>

        {/* Visualization 3: Payer Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between lg:col-span-2 xl:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Payer Volume &amp; Clean Rate</h3>
              </div>
              <Link to="/analytics" className="text-xs text-blue-600 hover:underline font-semibold">
                Analytics &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Volume concentration and clean claim submission success per payer.
            </p>

            <div className="space-y-2.5">
              {MOCK_PAYER_DISTRIBUTION.map((payer) => (
                <div key={payer.payerName} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/40">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1">
                    <span>{payer.payerName}</span>
                    <span className="text-emerald-700">{payer.cleanRate}% Clean</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{payer.claimCount} claims ({payer.sharePercent}%)</span>
                    <span className="text-rose-600 font-medium">
                      At risk: ${payer.atRiskAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${payer.sharePercent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>4 Major Payers Active</span>
            <span className="text-blue-600 font-semibold">Avg clean rate: 86.3%</span>
          </div>
        </div>
      </div>

      {/* Visualization 4: Denial-Risk Categories */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Top Denial-Risk Categories (Pre-Submission)</h3>
            <p className="text-xs text-slate-500">
              Anticipated CARC codes and financial exposure identified by the risk engine.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Total Financial Exposure: <span className="text-rose-600 font-bold">$65,100.00</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">CARC Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Denial Description</th>
                <th className="py-3 px-4 text-center">Impacted Claims</th>
                <th className="py-3 px-4 text-right">Dollar Exposure</th>
                <th className="py-3 px-4">Recommended Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_DENIAL_CATEGORIES.map((cat) => (
                <tr key={cat.carc} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-600">{cat.carc}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                      {cat.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{cat.title}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">{cat.count}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ${cat.exposure.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-600 font-medium">{cat.recommendedAction}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualization 5: Recent Claims Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Claims Activity Feed</h3>
            <p className="text-xs text-slate-500">Live stream of claims analyzed by the Intelligence Engine</p>
          </div>
          <Link
            to="/claims"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all claims queue <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Payer</th>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4 text-right">Billed Amount</th>
                <th className="py-3 px-4 text-center">Risk Score</th>
                <th className="py-3 px-4 text-center">Lifecycle Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_RECENT_CLAIMS.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    <Link to={`/claims/${claim.id}`} className="hover:underline">
                      {claim.claimNumber}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{claim.patientName}</td>
                  <td className="py-3.5 px-4 text-slate-700">{claim.payerName}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{claim.serviceDate}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ${claim.billedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold ${
                        claim.riskScore >= 70
                          ? 'bg-rose-100 text-rose-800'
                          : claim.riskScore >= 30
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {claim.riskScore} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                      {claim.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      to={`/claims/${claim.id}`}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
