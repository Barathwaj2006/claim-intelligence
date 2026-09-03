import React, { useState } from 'react';
import {
  FileText,
  Download,
  Send,
  X,
  Plus,
  TrendingUp,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useClaims, RecoveryCase } from '../context/ClaimContext';
import { CreateRecoveryModal } from '../components/CreateRecoveryModal';

export const Recovery: React.FC = () => {
  const { recoveryCases, updateRecoveryCase, deleteRecoveryCase } = useClaims();
  const [activeCase, setActiveCase] = useState<RecoveryCase | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const totalAtRisk = recoveryCases
    .filter((r) => r.status !== 'RECOVERED_PAID')
    .reduce((sum, r) => sum + (r.revenueAtRisk || 0), 0);

  const totalRecovered = recoveryCases
    .filter((r) => r.status === 'RECOVERED_PAID')
    .reduce((sum, r) => sum + (r.revenueAtRisk || 0), 0);

  const handleDownloadDossier = (c: RecoveryCase) => {
    const text = `APPEAL PACKET & CLINICAL RECONSIDERATION
DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
TO: ${c.payerName} Clinical Grievance & Appeals Department
RE: Formal Denial Appeal for Claim #${c.claimNumber}
PATIENT: ${c.patientName}
DENIAL REASON: [${c.carcCode}] ${c.denialReason}
DISPUTED REVENUE: $${c.revenueAtRisk.toFixed(2)}

Dear Appeals Committee,

This document serves as a formal reconsideration request regarding the adverse adjudication and denial of claim #${c.claimNumber} for patient ${c.patientName}.

CARC ROOT CAUSE ANALYSIS:
- Denial Code: ${c.carcCode}
- Stated Denial Reason: ${c.denialReason}

CLINICAL & COMPLIANCE JUSTIFICATION:
1. Medical Necessity: Services rendered were medically necessary, meeting standard CMS and clinical practice guidelines.
2. Coding Accuracy: All reported diagnosis (ICD-10-CM) and procedure (CPT/HCPCS) codes accurately reflect documented clinical interventions.
3. Prior Authorization / Administrative Clarification: All available clinical documentation, notes, and medical records are attached in support of this request.

We respectfully request immediate reversal of the adverse adjudication and disbursement of payment totaling $${c.revenueAtRisk.toFixed(2)}.

Sincerely,
Memorial Health RCM Department
Provider NPI: 1982736450
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appeal_dossier_${c.claimNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusNotification(`Appeal Packet text dossier for ${c.claimNumber} downloaded.`);
  };

  return (
    <div className="space-y-6">
      <CreateRecoveryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {statusNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs">
          <span>{statusNotification}</span>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Revenue Recovery & Denials Queue
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Prioritize post-adjudication denials, assess recoverability probability, and generate clinical appeal dossiers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Denial Case</span>
          </button>
          <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-bold font-mono">
            Pipeline at Risk: ${totalAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          {totalRecovered > 0 && (
            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold font-mono">
              Recovered: ${totalRecovered.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>
      </div>

      {/* Recovery Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {recoveryCases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Post-Adjudication Denials</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
              No denied claims are currently in the recovery queue. When clearinghouse or payer remittances return
              CARC denial codes (e.g. CO-197, CO-16), log them here to generate automated clinical appeal packets.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Denial for Appeal</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Claim / Patient</th>
                  <th className="py-3 px-4">Payer</th>
                  <th className="py-3 px-4">Denial Root Cause (CARC)</th>
                  <th className="py-3 px-4 text-right">Revenue at Risk</th>
                  <th className="py-3 px-4 text-center">Recoverability</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recoveryCases.map((rc) => (
                  <tr key={rc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          rc.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-700'
                            : rc.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rc.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-blue-600">{rc.claimNumber}</div>
                      <div className="text-slate-800 font-semibold">{rc.patientName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{rc.payerName}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-rose-600 mr-1.5">{rc.carcCode}</span>
                      <span className="text-slate-700">{rc.denialReason}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      ${rc.revenueAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${rc.recoverability}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-700">{rc.recoverability}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          rc.status === 'RECOVERED_PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rc.status === 'APPEAL_SUBMITTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActiveCase(rc)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors shadow-xs"
                        >
                          Generate Appeal
                        </button>
                        {rc.status !== 'RECOVERED_PAID' && (
                          <button
                            onClick={() => {
                              updateRecoveryCase(rc.id, { status: 'RECOVERED_PAID' });
                              setStatusNotification(`Marked ${rc.claimNumber} as fully paid / recovered!`);
                            }}
                            title="Mark Recovered & Paid"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete case ${rc.claimNumber}?`)) {
                              deleteRecoveryCase(rc.id);
                            }
                          }}
                          title="Delete Case"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appeal Dossier Modal */}
      {activeCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Automated Reconsideration & Appeal Packet</h3>
              </div>
              <button
                onClick={() => setActiveCase(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto font-mono text-xs text-slate-700 leading-relaxed bg-slate-50 border-b border-slate-200">
              <p className="font-bold text-slate-900">
                DATE: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br />
                TO: {activeCase.payerName} Clinical Grievance & Appeals Department<br />
                RE: Formal First-Level Denial Appeal for Claim #{activeCase.claimNumber}<br />
                PATIENT: {activeCase.patientName}<br />
                BILLED AMOUNT AT RISK: ${activeCase.revenueAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}<br />
                ADJUDICATED DENIAL CODE: {activeCase.carcCode}
              </p>
              <hr className="border-slate-200" />
              <p>Dear Appeals Committee,</p>
              <p>
                This letter serves as a formal appeal regarding the adverse adjudication and denial ({activeCase.carcCode} - {activeCase.denialReason}) for patient {activeCase.patientName}.
              </p>
              <p>
                <strong>Clinical Justification & Medical Necessity:</strong> The rendered clinical interventions strictly fulfilled medical necessity guidelines. Conservative therapies were thoroughly exhausted, and delays in treatment posed immediate health risk. Attached please find supporting clinical operative notes, diagnostic reports, and physician signed attestation.
              </p>
              <p>
                We respectfully request immediate retroactive certification and full payment of the allowable charges amounting to ${activeCase.revenueAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}.
              </p>
              <p className="font-bold">
                Sincerely,<br />
                Memorial Health RCM Lead Biller<br />
                Provider NPI: 1982736450
              </p>
            </div>

            <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Includes operative notes & CMS compliance citations
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDossier(activeCase)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download Text Dossier
                </button>
                <button
                  onClick={() => {
                    updateRecoveryCase(activeCase.id, { status: 'APPEAL_SUBMITTED' });
                    setStatusNotification(
                      `Appeal for ${activeCase.claimNumber} electronically transmitted to ${activeCase.payerName} clearinghouse portal.`
                    );
                    setActiveCase(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-4 h-4" /> Submit Appeal to Payer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
