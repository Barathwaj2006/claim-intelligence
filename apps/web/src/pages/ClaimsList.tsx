import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter } from 'lucide-react';

export const ClaimsList: React.FC = () => {
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const claims = [
    {
      id: 'clm-002',
      claimNumber: 'CLM-2026-00102',
      patientName: 'Marcus Thorne',
      memberId: 'UHC-44912033',
      payerName: 'UnitedHealthcare',
      serviceDate: '2026-08-20',
      billed: '$3,200.00',
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
      billed: '$1,450.00',
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
      billed: '$680.00',
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
      billed: '$2,850.00',
      riskScore: 74,
      riskLevel: 'HIGH',
      primaryDiag: 'M23.22 (Meniscus tear)',
      status: 'VERIFIED',
      cptList: '29881',
    },
  ];

  const filteredClaims =
    riskFilter === 'ALL'
      ? claims
      : claims.filter((c) => c.riskLevel === riskFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pre-Submission Claims Queue</h2>
          <p className="text-sm text-slate-500 mt-1">
            CMS-1500 professional claims scored for denial propensity prior to clearinghouse submission.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter by Risk:
          </span>
          {['ALL', 'HIGH', 'LOW'].map((rf) => (
            <button
              key={rf}
              onClick={() => setRiskFilter(rf)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                riskFilter === rf
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {rf}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredClaims.length} of {claims.length} staged claims
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
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
                <td className="py-3 px-4 font-mono font-bold text-blue-600">
                  {claim.claimNumber}
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
                <td className="py-3 px-4 text-right font-bold text-slate-900">{claim.billed}</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                      claim.riskLevel === 'HIGH'
                        ? 'bg-rose-100 text-rose-700'
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
