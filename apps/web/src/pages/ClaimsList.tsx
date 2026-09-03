import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, CheckSquare, RefreshCw, ShieldCheck, Send } from 'lucide-react';

interface ClaimQueueItem {
  id: string;
  claimNumber: string;
  patientName: string;
  memberId: string;
  payerName: string;
  serviceDate: string;
  billedAmount: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  primaryDiag: string;
  status: 'DRAFT' | 'VERIFIED' | 'READY_FOR_SUBMISSION' | 'SUBMITTED' | 'ADJUDICATED';
  cptList: string;
}

const INITIAL_CLAIMS: ClaimQueueItem[] = [
  {
    id: 'clm-002',
    claimNumber: 'CLM-2026-00102',
    patientName: 'Marcus Thorne',
    memberId: 'UHC-44912033',
    payerName: 'UnitedHealthcare',
    serviceDate: '2026-08-20',
    billedAmount: 3200.00,
    riskScore: 85,
    riskLevel: 'HIGH',
    primaryDiag: 'M54.5 (Low back pain)',
    status: 'DRAFT',
    cptList: '72148, 99214',
  },
  {
    id: 'clm-001',
    claimNumber: 'CLM-2026-00101',
    patientName: 'Eleanor Vance',
    memberId: 'BCBS-98231011',
    payerName: 'Blue Cross Blue Shield',
    serviceDate: '2026-08-15',
    billedAmount: 1450.00,
    riskScore: 18,
    riskLevel: 'LOW',
    primaryDiag: 'Z00.00 (General exam)',
    status: 'READY_FOR_SUBMISSION',
    cptList: '99213, 36415',
  },
  {
    id: 'clm-003',
    claimNumber: 'CLM-2026-00103',
    patientName: 'Sarah Jenkins',
    memberId: 'MED-1EG4-TE9-MK72',
    payerName: 'Medicare Part B',
    serviceDate: '2026-08-10',
    billedAmount: 680.00,
    riskScore: 12,
    riskLevel: 'LOW',
    primaryDiag: 'I10 (Essential hypertension)',
    status: 'ADJUDICATED',
    cptList: '99214',
  },
  {
    id: 'clm-004',
    claimNumber: 'CLM-2026-00104',
    patientName: 'David K. Miller',
    memberId: 'AET-8830192',
    payerName: 'Aetna Health',
    serviceDate: '2026-08-05',
    billedAmount: 2850.00,
    riskScore: 74,
    riskLevel: 'HIGH',
    primaryDiag: 'M23.22 (Meniscus tear)',
    status: 'VERIFIED',
    cptList: '29881',
  },
];

export const ClaimsList: React.FC = () => {
  const [claimsList, setClaimsList] = useState<ClaimQueueItem[]>(INITIAL_CLAIMS);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [payerFilter, setPayerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [batchActionFeedback, setBatchActionFeedback] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedClaimIds.length === filteredClaims.length) {
      setSelectedClaimIds([]);
    } else {
      setSelectedClaimIds(filteredClaims.map((c) => c.id));
    }
  };

  const toggleSelectClaim = (id: string) => {
    if (selectedClaimIds.includes(id)) {
      setSelectedClaimIds(selectedClaimIds.filter((item) => item !== id));
    } else {
      setSelectedClaimIds([...selectedClaimIds, id]);
    }
  };

  // Batch actions
  const handleBatchEligibility = () => {
    setBatchActionFeedback(`Ran HIPAA 270 Eligibility check on ${selectedClaimIds.length} selected claim(s). Coverage verified.`);
    setTimeout(() => setBatchActionFeedback(null), 4000);
  };

  const handleBatchCalculateRisk = () => {
    setBatchActionFeedback(`Recalculated risk scores for ${selectedClaimIds.length} selected claim(s) across 6 engine dimensions.`);
    setTimeout(() => setBatchActionFeedback(null), 4000);
  };

  const handleBatchSubmitClean = () => {
    const updated = claimsList.map((c) => {
      if (selectedClaimIds.includes(c.id) && c.riskLevel !== 'HIGH') {
        return { ...c, status: 'SUBMITTED' as const };
      }
      return c;
    });
    setClaimsList(updated);
    setBatchActionFeedback(`Submitted ${selectedClaimIds.length} clean claim(s) to clearinghouse.`);
    setTimeout(() => setBatchActionFeedback(null), 4000);
  };

  // Filtering
  const filteredClaims = claimsList.filter((claim) => {
    if (riskFilter !== 'ALL' && claim.riskLevel !== riskFilter) return false;
    if (statusFilter !== 'ALL' && claim.status !== statusFilter) return false;
    if (payerFilter !== 'ALL' && claim.payerName !== payerFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = claim.claimNumber.toLowerCase().includes(q);
      const matchPat = claim.patientName.toLowerCase().includes(q);
      const matchMember = claim.memberId.toLowerCase().includes(q);
      if (!matchNum && !matchPat && !matchMember) return false;
    }
    return true;
  });

  const payersList = Array.from(new Set(claimsList.map((c) => c.payerName)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pre-Submission Claims Queue</h2>
          <p className="text-sm text-slate-500 mt-1">
            360-degree CMS-1500 claims queue scored for denial propensity prior to clearinghouse submission.
          </p>
        </div>
      </div>

      {/* Batch Actions Bar (when items selected) */}
      {selectedClaimIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>{selectedClaimIds.length} claim(s) selected for batch operations</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchEligibility}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Run Eligibility on Selected
            </button>
            <button
              onClick={handleBatchCalculateRisk}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Calculate Risk
            </button>
            <button
              onClick={handleBatchSubmitClean}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" /> Submit Clean Claims
            </button>
          </div>
        </div>
      )}

      {batchActionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
          {batchActionFeedback}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Claim #, Patient, Member ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="READY_FOR_SUBMISSION">READY_FOR_SUBMISSION</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ADJUDICATED">ADJUDICATED</option>
            </select>

            {/* Payer Filter */}
            <select
              value={payerFilter}
              onChange={(e) => setPayerFilter(e.target.value)}
              className="text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
            >
              <option value="ALL">All Payers</option>
              {payersList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-100 flex justify-between">
          <span>Showing {filteredClaims.length} of {claimsList.length} staged claims</span>
          <span>Click "Inspect" to open 360-Degree Claim Cockpit</span>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={filteredClaims.length > 0 && selectedClaimIds.length === filteredClaims.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="py-3 px-4">Claim ID</th>
              <th className="py-3 px-4">Patient / Member ID</th>
              <th className="py-3 px-4">Payer</th>
              <th className="py-3 px-4">Primary Diag & CPTs</th>
              <th className="py-3 px-4 text-right">Billed</th>
              <th className="py-3 px-4 text-center">Denial Risk</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClaims.map((claim) => (
              <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedClaimIds.includes(claim.id)}
                    onChange={() => toggleSelectClaim(claim.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="py-3 px-4 font-mono font-bold text-blue-600">
                  <Link to={`/claims/${claim.id}`} className="hover:underline">
                    {claim.claimNumber}
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{claim.patientName}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{claim.memberId}</div>
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">{claim.payerName}</td>
                <td className="py-3 px-4">
                  <div className="text-slate-900 font-medium">{claim.primaryDiag}</div>
                  <div className="text-slate-400 font-mono text-[11px]">CPT: {claim.cptList}</div>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">
                  ${claim.billedAmount.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                      claim.riskLevel === 'HIGH'
                        ? 'bg-rose-100 text-rose-700'
                        : claim.riskLevel === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {claim.riskScore} / 100
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                    {claim.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link
                    to={`/claims/${claim.id}`}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors shadow-xs"
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
  );
};
