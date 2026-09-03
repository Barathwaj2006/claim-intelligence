import React, { useState } from 'react';
import {
  FileSpreadsheet,
  AlertOctagon,
  CheckCircle2,
  Copy,
  Plus,
  Search,
} from 'lucide-react';
import { useClaims, UnderpaymentCase } from '../context/ClaimContext';

export const ContractAuditing: React.FC = () => {
  const {
    underpayments,
    addUnderpaymentCase,
    updateUnderpaymentStatus,
    generateUnderpaymentDemandLetter,
  } = useClaims();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Case form state
  const [claimNumber, setClaimNumber] = useState('CLM-2026-94112');
  const [patientName, setPatientName] = useState('Eleanor Vance');
  const [payerName, setPayerName] = useState('UnitedHealthcare');
  const [cptOrDrg, setCptOrDrg] = useState('72148 / MRI Lumbar');
  const [billedAmount, setBilledAmount] = useState<number>(3200);
  const [expectedPayment, setExpectedPayment] = useState<number>(2450);
  const [actualPayment, setActualPayment] = useState<number>(1850);
  const [varianceReason, setVarianceReason] = useState(
    'Payer silent downcoding to Level 3 allowable without contractual justification'
  );

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimNumber.trim()) return;

    const underpaidAmount = Math.max(0, expectedPayment - actualPayment);

    addUnderpaymentCase({
      claimId: claimNumber.trim(),
      claimNumber: claimNumber.trim(),
      patientName: patientName.trim(),
      payerName,
      serviceDesc: cptOrDrg,
      cptOrDrg,
      billedAmount,
      contractExpectedRate: expectedPayment,
      expectedPayment,
      actualPaidAmount: actualPayment,
      actualPayment,
      varianceUnderpaid: underpaidAmount,
      underpaidAmount,
      contractClause: varianceReason || 'Section 4.2 Commercial Inpatient/Imaging Fee Schedule (135% Medicare)',
      auditReason: 'DOWNCODED_DRG',
      status: 'DETECTED',
      recoveryStatus: 'IDENTIFIED',
    });

    setIsModalOpen(false);
  };

  const filteredCases = underpayments.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      !query ||
      c.claimNumber.toLowerCase().includes(query) ||
      c.patientName.toLowerCase().includes(query) ||
      c.payerName.toLowerCase().includes(query) ||
      (c.cptOrDrg || c.serviceDesc).toLowerCase().includes(query)
    );
  });

  const totalLeakage = underpayments.reduce((sum, c) => sum + (c.underpaidAmount || c.varianceUnderpaid || 0), 0);
  const totalRecovered = underpayments
    .filter((c) => c.recoveryStatus === 'RECOVERED' || c.status === 'RECOVERED')
    .reduce((sum, c) => sum + (c.underpaidAmount || c.varianceUnderpaid || 0), 0);
  const activeDisputes = underpayments.filter(
    (c) => c.recoveryStatus === 'PENDING_REVIEW' || c.status === 'DETECTED' || c.status === 'DEMAND_LETTER_ISSUED'
  ).length;

  const handleCopyDemandLetter = (c: UnderpaymentCase) => {
    const text = generateUnderpaymentDemandLetter(c.id);
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Payer Contract Modeling & Underpayment Audit</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Revenue Leakage Guard
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Detect silent payer short-pays where actual remittance falls below contracted fee schedules and automated demand letters.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Stage Underpayment Audit</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Identified Revenue Leakage</span>
            <div className="text-2xl font-black text-rose-600 font-mono mt-1">
              ${totalLeakage.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-rose-700 font-semibold">Underpaid by payers vs contract</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Recovered Revenue</span>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
              ${totalRecovered.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold">Successfully recouped</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Active Disputed Claims</span>
            <div className="text-2xl font-black text-amber-600 font-mono mt-1">
              {activeDisputes} <span className="text-xs font-normal text-slate-500">Cases</span>
            </div>
            <span className="text-[11px] text-amber-700 font-semibold">Under formal demand review</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {copiedNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Formal Contract Underpayment Demand Letter copied to clipboard! Ready to transmit to payer.</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search claim, patient, payer, CPT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {filteredCases.length} Active Underpayment Cases
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Underpayment Variances Flagged</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Click below to stage an audit on an adjudicated claim where payer payment fell short of contracted fee terms.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Audit Claim Against Contract
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Patient / Payer</th>
                  <th className="py-3 px-4">Service / Code</th>
                  <th className="py-3 px-4 text-right">Contract Expected</th>
                  <th className="py-3 px-4 text-right">Actual Remittance</th>
                  <th className="py-3 px-4 text-right">Shortfall (Variance)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {c.claimNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.patientName}</div>
                      <div className="text-slate-500 text-[11px]">{c.payerName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {c.cptOrDrg || c.serviceDesc}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      ${(c.expectedPayment || c.contractExpectedRate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                      ${(c.actualPayment || c.actualPaidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                      -${(c.underpaidAmount || c.varianceUnderpaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          (c.recoveryStatus === 'RECOVERED' || c.status === 'RECOVERED')
                            ? 'bg-emerald-100 text-emerald-800'
                            : (c.recoveryStatus === 'IN_DISPUTE' || c.status === 'DEMAND_LETTER_ISSUED')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.recoveryStatus || c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleCopyDemandLetter(c)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          title="Copy formal demand letter"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Demand Letter</span>
                        </button>
                        {c.recoveryStatus !== 'RECOVERED' && c.status !== 'RECOVERED' && (
                          <button
                            onClick={() => updateUnderpaymentStatus(c.id, 'RECOVERED')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] transition-colors"
                            title="Mark recouped from payer"
                          >
                            Mark Recouped
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for new audit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl my-8 overflow-hidden text-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Audit Underpayment Variance</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Claim Number *</label>
                  <input
                    type="text"
                    value={claimNumber}
                    onChange={(e) => setClaimNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-semibold text-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Patient Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Payer *</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">CPT or DRG *</label>
                  <input
                    type="text"
                    value={cptOrDrg}
                    onChange={(e) => setCptOrDrg(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Billed ($)</label>
                  <input
                    type="number"
                    value={billedAmount}
                    onChange={(e) => setBilledAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Contracted ($)</label>
                  <input
                    type="number"
                    value={expectedPayment}
                    onChange={(e) => setExpectedPayment(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Actual Paid ($)</label>
                  <input
                    type="number"
                    value={actualPayment}
                    onChange={(e) => setActualPayment(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Variance Reason / Violation Rationale</label>
                <textarea
                  rows={2}
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500">Calculated Underpayment:</span>
                  <div className="text-base font-black text-rose-600 font-mono">
                    ${Math.max(0, expectedPayment - actualPayment).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Add Audit Case
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
