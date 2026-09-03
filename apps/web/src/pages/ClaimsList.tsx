import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, Plus, UploadCloud, Download, Trash2, FilePlus, AlertCircle } from 'lucide-react';
import { useClaims } from '../context/ClaimContext';
import { CreateClaimModal } from '../components/CreateClaimModal';
import { ImportClaimsModal } from '../components/ImportClaimsModal';

export const ClaimsList: React.FC = () => {
  const { claims, deleteClaim } = useClaims();
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const filteredClaims = claims.filter((claim) => {
    const matchesRisk =
      riskFilter === 'ALL' || claim.riskLevel === riskFilter;

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      claim.claimNumber.toLowerCase().includes(query) ||
      claim.patientName.toLowerCase().includes(query) ||
      claim.memberId.toLowerCase().includes(query) ||
      claim.payerName.toLowerCase().includes(query) ||
      claim.primaryDiagnosis.toLowerCase().includes(query);

    return matchesRisk && matchesQuery;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(claims, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `claims_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      <CreateClaimModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ImportClaimsModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pre-Submission Claims Queue</h2>
          <p className="text-sm text-slate-500 mt-1">
            CMS-1500 professional claims scored for denial propensity prior to clearinghouse submission.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {claims.length > 0 && (
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export JSON</span>
            </button>
          )}
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-slate-500" />
            <span>Import Claims</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Claim</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Risk:
            </span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((rf) => (
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

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search claim, patient, payer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredClaims.length} of {claims.length} staged claims
        </div>
      </div>

      {/* Claims Table / Empty State */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {claims.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FilePlus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Claims in Queue</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
              You currently have no claims recorded. Enter your first CMS-1500 claim or import a batch
              to run real-time pre-submission risk scoring and prior-authorization checks.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Professional Claim</span>
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4 text-slate-500" />
                <span>Import Claims JSON</span>
              </button>
            </div>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No claims match the selected filters.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try resetting search criteria or risk filter.</p>
            <button
              onClick={() => {
                setRiskFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {filteredClaims.map((claim) => {
                  const cptSummary =
                    claim.lines?.map((l) => l.cpt).join(', ') || 'None';

                  return (
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
                        <div className="text-slate-900 font-medium truncate max-w-[220px]">
                          {claim.primaryDiagnosis}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          CPT: {cptSummary}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        ${claim.totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                            claim.status === 'SUBMITTED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : claim.status === 'DENIED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/claims/${claim.id}`}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors shadow-xs"
                          >
                            Inspect
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm(`Delete claim ${claim.claimNumber}?`)) {
                                deleteClaim(claim.id);
                              }
                            }}
                            title="Delete Claim"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
