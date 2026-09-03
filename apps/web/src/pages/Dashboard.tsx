import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
  Plus,
  FilePlus,
  UploadCloud,
  CheckCircle2,
  Inbox,
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
  Scale,
} from 'lucide-react';
import { useClaims } from '../context/ClaimContext';
import { CreateClaimModal } from '../components/CreateClaimModal';
import { ImportClaimsModal } from '../components/ImportClaimsModal';

export const Dashboard: React.FC = () => {
  const {
    claims,
    recoveryCases,
    priorAuths,
    remittances,
    underpayments,
    goodFaithEstimates,
  } = useClaims();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Facility Operations KPIs
  const activePriorAuths = priorAuths.filter((p) => p.status === 'APPROVED' || p.status === 'IN_REVIEW').length;
  const totalRemittancePaid = remittances.reduce((s, r) => s + (r.paidAmount || r.paymentAmount || 0), 0);
  const totalUnderpaymentLeakage = underpayments.reduce((s, u) => s + (u.varianceUnderpaid || u.underpaidAmount || 0), 0);
  const totalGfeCreated = goodFaithEstimates.length;

  // Compute live metrics from user's claims
  const totalBilled = claims.reduce((sum, c) => sum + (c.totalBilled || 0), 0);
  const lowRiskClaims = claims.filter((c) => c.riskLevel === 'LOW');
  const mediumRiskClaims = claims.filter((c) => c.riskLevel === 'MEDIUM');
  const highRiskClaims = claims.filter((c) => c.riskLevel === 'HIGH');

  const cleanClaimRate =
    claims.length > 0
      ? ((lowRiskClaims.length / claims.length) * 100).toFixed(1)
      : '0.0';

  const revenueAtRisk = claims
    .filter((c) => c.riskLevel === 'HIGH' || c.status === 'DENIED')
    .reduce((sum, c) => sum + (c.totalBilled || 0), 0);

  const recoveredRevenue = recoveryCases
    .filter((r) => r.status === 'RECOVERED_PAID')
    .reduce((sum, r) => sum + (r.revenueAtRisk || 0), 0);

  const wonAppealsCount = recoveryCases.filter((r) => r.status === 'RECOVERED_PAID').length;

  // Aggregate detected issues across claims
  const issueMap = new Map<
    string,
    { carc: string; issue: string; count: number; exposure: number; claimId?: string }
  >();

  claims.forEach((claim) => {
    claim.detectedIssues?.forEach((issue) => {
      const existing = issueMap.get(issue.carc);
      if (existing) {
        existing.count += 1;
        existing.exposure += claim.totalBilled || 0;
      } else {
        issueMap.set(issue.carc, {
          carc: issue.carc,
          issue: issue.issue,
          count: 1,
          exposure: claim.totalBilled || 0,
          claimId: claim.id,
        });
      }
    });
  });

  const topDenials = Array.from(issueMap.values());

  const lowPct = claims.length > 0 ? Math.round((lowRiskClaims.length / claims.length) * 100) : 0;
  const medPct = claims.length > 0 ? Math.round((mediumRiskClaims.length / claims.length) * 100) : 0;
  const highPct = claims.length > 0 ? Math.round((highRiskClaims.length / claims.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Modals */}
      <CreateClaimModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ImportClaimsModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">RCM Executive Operations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-submission claim evaluation, actuarial denial risk scoring, and revenue recovery intelligence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Data</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Claim</span>
          </button>
          {highRiskClaims.length > 0 && (
            <Link
              to="/claims"
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Action High-Risk ({highRiskClaims.length})</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Value Staged
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              ${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {claims.length} {claims.length === 1 ? 'claim' : 'claims'} in current staging
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Clean Claim Rate
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">{cleanClaimRate}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {lowRiskClaims.length} of {claims.length} low-risk submissions
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Revenue at Risk
            </span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-rose-600 font-mono">
              ${revenueAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {highRiskClaims.length} claims with predicted denials
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Recovered Revenue
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              ${recoveredRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {wonAppealsCount} {wonAppealsCount === 1 ? 'appeal won' : 'appeals won'}
            </div>
          </div>
        </div>
      </div>

      {/* Hospital RCM Facility Operations Quick Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Hospital Operations & Regulatory Modules
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrated facility modules across prior authorization, remittance reconciliation, contract auditing, and price transparency.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            UB-04 & CMS-1500 Engine Active
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <Link
            to="/prior-auth"
            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg transition-colors border border-slate-200/80 block group"
          >
            <div className="flex items-center justify-between text-slate-600 group-hover:text-blue-600">
              <span className="text-xs font-semibold">Prior Auths</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">
              {activePriorAuths} <span className="text-xs font-normal text-slate-500">active</span>
            </div>
            <span className="text-[11px] text-slate-500">FHIR PAS & CMS SLA</span>
          </Link>

          <Link
            to="/remittance"
            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg transition-colors border border-slate-200/80 block group"
          >
            <div className="flex items-center justify-between text-slate-600 group-hover:text-emerald-600">
              <span className="text-xs font-semibold">835 Remittance</span>
              <Receipt className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-emerald-700 font-mono mt-1">
              ${totalRemittancePaid.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <span className="text-[11px] text-slate-500">{remittances.length} ERA batches</span>
          </Link>

          <Link
            to="/contract-auditing"
            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg transition-colors border border-slate-200/80 block group"
          >
            <div className="flex items-center justify-between text-slate-600 group-hover:text-amber-600">
              <span className="text-xs font-semibold">Underpayments</span>
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-bold text-amber-700 font-mono mt-1">
              ${totalUnderpaymentLeakage.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <span className="text-[11px] text-slate-500">{underpayments.length} cases detected</span>
          </Link>

          <Link
            to="/good-faith-estimate"
            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg transition-colors border border-slate-200/80 block group"
          >
            <div className="flex items-center justify-between text-slate-600 group-hover:text-purple-600">
              <span className="text-xs font-semibold">GFE & NSA</span>
              <Scale className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">
              {totalGfeCreated} <span className="text-xs font-normal text-slate-500">estimates</span>
            </div>
            <span className="text-[11px] text-slate-500">No Surprises Act</span>
          </Link>
        </div>
      </div>

      {/* Risk Distribution & Top Denial Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Risk Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Risk Tier Breakdown</h3>
          {claims.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">No claims recorded yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Staged claims will be analyzed and scored into risk tiers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700">Low Risk (0–29) · Clean</span>
                  <span className="text-slate-600 font-mono">
                    {lowRiskClaims.length} ({lowPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${lowPct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-700">Medium Risk (30–69) · Review</span>
                  <span className="text-slate-600 font-mono">
                    {mediumRiskClaims.length} ({medPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${medPct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700">High Risk (70–100) · Action</span>
                  <span className="text-slate-600 font-mono">
                    {highRiskClaims.length} ({highPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all"
                    style={{ width: `${highPct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Actuarial Evaluation Engine</span>
            <span className="font-semibold text-slate-700 font-mono">
              {claims.length} {claims.length === 1 ? 'Claim' : 'Claims'}
            </span>
          </div>
        </div>

        {/* Top Denial Drivers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Top Projected Denial Causes (Pre-Submission)
          </h3>
          {topDenials.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-semibold text-slate-700">
                {claims.length === 0
                  ? 'No claims available to analyze.'
                  : 'Zero pre-submission denial risks detected.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {claims.length === 0
                  ? 'Create or import claims to evaluate compliance and payer rules.'
                  : 'All staged claims satisfy payer compliance checks.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">CARC Code</th>
                    <th className="py-2.5 px-3">Denial Description</th>
                    <th className="py-2.5 px-3 text-center">Claims</th>
                    <th className="py-2.5 px-3 text-right">Exposure</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topDenials.map((denial) => (
                    <tr key={denial.carc} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-600">{denial.carc}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{denial.issue}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">{denial.count}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        ${denial.exposure.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {denial.claimId ? (
                          <Link
                            to={`/claims/${denial.claimId}`}
                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 inline-block text-[11px]"
                          >
                            Resolve
                          </Link>
                        ) : (
                          <Link
                            to="/claims"
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 inline-block text-[11px]"
                          >
                            Review
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Live Claims Queue Snippet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Claims Staging Queue</h3>
            <p className="text-xs text-slate-500">Claims staged for pre-submission intelligence scoring</p>
          </div>
          {claims.length > 0 && (
            <Link
              to="/claims"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View all {claims.length} claims <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {claims.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FilePlus className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Claims in Queue</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5 leading-relaxed">
              The platform evaluates claims against CMS-1500, ICD-10, CPT prior authorization,
              and payer policies. Create your first claim or import data to get started.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Claim</span>
              </button>
              <Link
                to="/eligibility"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verify Patient Eligibility</span>
              </Link>
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                <span>Import JSON</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5">Claim #</th>
                  <th className="py-2.5 px-3.5">Patient</th>
                  <th className="py-2.5 px-3.5">Payer</th>
                  <th className="py-2.5 px-3.5">Service Date</th>
                  <th className="py-2.5 px-3.5 text-right">Billed Amount</th>
                  <th className="py-2.5 px-3.5 text-center">Risk Tier</th>
                  <th className="py-2.5 px-3.5 text-center">Status</th>
                  <th className="py-2.5 px-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.slice(0, 5).map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600">
                      {claim.claimNumber}
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-800">{claim.patientName}</td>
                    <td className="py-2.5 px-3.5 text-slate-600">{claim.payerName}</td>
                    <td className="py-2.5 px-3.5 text-slate-600">{claim.serviceDate}</td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 font-mono">
                      ${claim.totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          claim.riskLevel === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : claim.riskLevel === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {claim.riskScore} / 100
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <Link
                        to={`/claims/${claim.id}`}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs inline-block"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
