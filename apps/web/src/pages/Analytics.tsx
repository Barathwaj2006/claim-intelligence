import React, { useState } from 'react';
import { BarChart3, Plus, UploadCloud, PieChart, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClaims } from '../context/ClaimContext';
import { CreateClaimModal } from '../components/CreateClaimModal';
import { ImportClaimsModal } from '../components/ImportClaimsModal';

export const Analytics: React.FC = () => {
  const { claims, recoveryCases } = useClaims();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Group user claims by payer
  const payerMap = new Map<
    string,
    {
      name: string;
      totalClaims: number;
      totalBilled: number;
      cleanClaims: number;
      highRiskClaims: number;
    }
  >();

  claims.forEach((c) => {
    const rawPayer = c.payerName.trim() || 'Unspecified Payer';
    const existing = payerMap.get(rawPayer);
    if (existing) {
      existing.totalClaims += 1;
      existing.totalBilled += c.totalBilled || 0;
      if (c.riskLevel === 'LOW') existing.cleanClaims += 1;
      if (c.riskLevel === 'HIGH') existing.highRiskClaims += 1;
    } else {
      payerMap.set(rawPayer, {
        name: rawPayer,
        totalClaims: 1,
        totalBilled: c.totalBilled || 0,
        cleanClaims: c.riskLevel === 'LOW' ? 1 : 0,
        highRiskClaims: c.riskLevel === 'HIGH' ? 1 : 0,
      });
    }
  });

  const payerMetrics = Array.from(payerMap.values()).map((p) => {
    const cleanRate = ((p.cleanClaims / p.totalClaims) * 100).toFixed(1);
    const denialPropensity = ((p.highRiskClaims / p.totalClaims) * 100).toFixed(1);

    const relatedRecovery = recoveryCases.filter((r) =>
      r.payerName.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(r.payerName.toLowerCase())
    );

    const wonAppeals = relatedRecovery.filter((r) => r.status === 'RECOVERED_PAID').length;
    const appealWinRate =
      relatedRecovery.length > 0
        ? Math.round((wonAppeals / relatedRecovery.length) * 100)
        : null;

    return {
      ...p,
      cleanRate,
      denialPropensity,
      appealWinRate,
      appealsCount: relatedRecovery.length,
    };
  });

  return (
    <div className="space-y-6">
      <CreateClaimModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ImportClaimsModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Payer Intelligence & Performance Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time analytics computed strictly from your facility&apos;s staged claims and recovery appeals.
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Main Scorecard */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Your Facility&apos;s Payer Scorecard</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {payerMetrics.length} {payerMetrics.length === 1 ? 'Payer' : 'Payers'} with Staged Claims
          </span>
        </div>

        {payerMetrics.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <PieChart className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">No Payer Performance Data</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
              Performance metrics and denial propensities are derived directly from user-entered claims.
              Create your first claim or import a batch to view breakdown across payers.
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Payer Organization</th>
                  <th className="py-3 px-4 text-center">Staged Claims</th>
                  <th className="py-3 px-4 text-right">Total Billed</th>
                  <th className="py-3 px-4 text-center">Clean Claim Rate</th>
                  <th className="py-3 px-4 text-center">Denial Propensity</th>
                  <th className="py-3 px-4 text-center">Appeal Win Velocity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payerMetrics.map((payer) => (
                  <tr key={payer.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{payer.name}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {payer.totalClaims}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      ${payer.totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-emerald-600">{payer.cleanRate}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold ${
                          Number(payer.denialPropensity) > 50
                            ? 'text-rose-600'
                            : Number(payer.denialPropensity) > 0
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {payer.denialPropensity}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {payer.appealWinRate !== null ? (
                        <span className="px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700">
                          {payer.appealWinRate}% Won ({payer.appealsCount} appeals)
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">No appeals logged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary insights banner if claims exist */}
      {claims.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Pre-Submission Telemetry Active</div>
              <div className="text-slate-500">
                Payer rules evaluate CPT code combinations and prior-authorization mandates across all {claims.length} staged claims.
              </div>
            </div>
          </div>
          <Link
            to="/claims"
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
          >
            <span>Inspect Claims Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
