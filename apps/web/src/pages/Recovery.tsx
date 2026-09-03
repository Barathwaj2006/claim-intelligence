import React, { useState } from 'react';
import {
  FileText,
  Download,
  Send,
  X,
} from 'lucide-react';

export const Recovery: React.FC = () => {
  const [activeAppealModal, setActiveAppealModal] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const recoveryCases = [
    {
      id: 'rec-001',
      claimNumber: 'CLM-2026-00088',
      patientName: 'Robert Langdon',
      payerName: 'Blue Cross Blue Shield',
      carcCode: 'CO-197',
      denialReason: 'Prior authorization absent (Knee Arthroscopy 29881)',
      revenueAtRisk: '$4,850.00',
      recoverability: 75,
      priority: 'URGENT',
      action: 'Retro-Authorization Appeal',
      daysRemaining: 12,
    },
    {
      id: 'rec-002',
      claimNumber: 'CLM-2026-00074',
      patientName: 'Linda Kowalski',
      payerName: 'UnitedHealthcare',
      carcCode: 'CO-16',
      denialReason: 'Member ID format mismatch on electronic submission',
      revenueAtRisk: '$1,920.00',
      recoverability: 95,
      priority: 'HIGH',
      action: 'Corrected Claim Resubmission',
      daysRemaining: 45,
    },
    {
      id: 'rec-003',
      claimNumber: 'CLM-2026-00062',
      patientName: 'Thomas Anderson',
      payerName: 'Aetna Health',
      carcCode: 'CO-45',
      denialReason: 'Underpayment discrepancy vs contracted fee schedule',
      revenueAtRisk: '$850.00',
      recoverability: 60,
      priority: 'MEDIUM',
      action: 'Contract Underpayment Audit',
      daysRemaining: 60,
    },
  ];

  return (
    <div className="space-y-6">
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
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold">
            Total Pipeline at Risk: $7,620.00
          </div>
        </div>
      </div>

      {/* Recovery Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Claim / Patient</th>
              <th className="py-3 px-4">Payer</th>
              <th className="py-3 px-4">Denial Root Cause (CARC)</th>
              <th className="py-3 px-4 text-right">Revenue at Risk</th>
              <th className="py-3 px-4 text-center">Recoverability</th>
              <th className="py-3 px-4">Filing Deadline</th>
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
                  <div className="text-slate-700 font-medium">{rc.patientName}</div>
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">{rc.payerName}</td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-rose-600 mr-1.5">{rc.carcCode}</span>
                  <span className="text-slate-700">{rc.denialReason}</span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{rc.revenueAtRisk}</td>
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
                <td className="py-3 px-4 text-slate-600 font-medium">
                  {rc.daysRemaining} days remaining
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setActiveAppealModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors shadow-xs"
                  >
                    Generate Appeal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Appeal Dossier Modal */}
      {activeAppealModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Automated Reconsideration & Appeal Packet</h3>
              </div>
              <button
                onClick={() => setActiveAppealModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto font-mono text-xs text-slate-700 leading-relaxed bg-slate-50 border-b border-slate-200">
              <p className="font-bold text-slate-900">
                DATE: September 3, 2026<br />
                TO: Blue Cross Blue Shield Clinical Grievance & Appeals Department<br />
                RE: Formal First-Level Denial Appeal for Claim #CLM-2026-00088<br />
                PATIENT: Robert Langdon | MEMBER ID: BCBS-44910283 | DOB: 1982-11-04<br />
                DATE OF SERVICE: 2026-08-12 | BILLED: $4,850.00
              </p>
              <hr className="border-slate-200" />
              <p>
                Dear Appeals Committee,
              </p>
              <p>
                This letter serves as a formal appeal regarding the adverse adjudication and denial (CARC CO-197) of CPT 29881 (Knee Arthroscopy) performed on August 12, 2026.
              </p>
              <p>
                <strong>Clinical Justification:</strong> The patient presented with persistent mechanical knee locking and meniscal entrapment (ICD-10 M23.22) confirmed via MRI. The urgent nature of the joint entrapment required prompt surgical intervention to prevent irreversible articular cartilage degeneration. Attached please find the operative report, diagnostic imaging report, and physician attestation.
              </p>
              <p>
                We respectfully request immediate retroactive certification and full payment of the allowable charge of $4,850.00.
              </p>
              <p className="font-bold">
                Sincerely,<br />
                Memorial Orthopedic Surgery Center<br />
                NPI: 1982736450
              </p>
            </div>

            <div className="p-4 bg-white flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Includes operative notes & CMS guidelines citation
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStatusNotification('Appeal Packet PDF dossier downloaded successfully.');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download PDF Dossier
                </button>
                <button
                  onClick={() => {
                    setStatusNotification('Appeal electronically submitted to Blue Cross Blue Shield Clearinghouse portal.');
                    setActiveAppealModal(false);
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
