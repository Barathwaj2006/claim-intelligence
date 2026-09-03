import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Send,
  FileText,
  Wrench,
  Check,
  ShieldAlert,
  Plus,
  Trash2,
} from 'lucide-react';
import { useClaims } from '../context/ClaimContext';
import { CreateClaimModal } from '../components/CreateClaimModal';

export const ClaimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    claims,
    applyCorrection,
    attachAuthorization,
    submitClaim,
    recordDenial,
    deleteClaim,
  } = useClaims();

  const [authModalLine, setAuthModalLine] = useState<number | null>(null);
  const [authNumberInput, setAuthNumberInput] = useState('');
  const [denialModalOpen, setDenialModalOpen] = useState(false);
  const [denialCarc, setDenialCarc] = useState('CO-197');
  const [denialReason, setDenialReason] = useState('Prior authorization missing or invalid');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Find claim in user's state
  const claim = claims.find((c) => c.id === id);

  if (!claim) {
    return (
      <div className="space-y-6">
        <CreateClaimModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        <div className="flex items-center gap-2">
          <Link
            to="/claims"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Claims Queue
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Claim Record Not Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            No claim exists with identifier <code className="font-mono font-bold text-slate-700">{id}</code>.
            The claim may have been deleted or not yet created.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/claims"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              View Claims Queue
            </Link>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Claim</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAttachAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authModalLine !== null) {
      attachAuthorization(claim.id, authModalLine, authNumberInput || 'AUTH-2026-9812');
      setAuthModalLine(null);
      setAuthNumberInput('');
    }
  };

  const handleRecordDenialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordDenial(claim.id, denialCarc, denialReason);
    setDenialModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Attach Auth Modal */}
      {authModalLine !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Attach Prior Authorization (Line #{authModalLine})
            </h4>
            <p className="text-slate-500 mb-4">
              Enter the approved payer authorization number to resolve CO-197 pre-submission risk.
            </p>
            <form onSubmit={handleAttachAuthSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Authorization #</label>
                <input
                  type="text"
                  placeholder="e.g. AUTH-2026-98120"
                  value={authNumberInput}
                  onChange={(e) => setAuthNumberInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalLine(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Verify & Attach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Denial Modal */}
      {denialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Move Claim to Post-Adjudication Denial Recovery
            </h4>
            <p className="text-slate-500 mb-4">
              This will update claim status to DENIED and automatically create a case in the Revenue Recovery queue.
            </p>
            <form onSubmit={handleRecordDenialSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">CARC Code</label>
                <select
                  value={denialCarc}
                  onChange={(e) => setDenialCarc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-rose-600"
                >
                  <option value="CO-197">CO-197 (Precertification/Auth Absent)</option>
                  <option value="CO-16">CO-16 (Lacks Info / Billing Error)</option>
                  <option value="CO-29">CO-29 (Timely Filing Expired)</option>
                  <option value="CO-45">CO-45 (Exceeds Allowable / Fee Discrepancy)</option>
                  <option value="CO-50">CO-50 (Not Medically Necessary)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Denial Explanation</label>
                <textarea
                  rows={2}
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDenialModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Denial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/claims"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Claims Queue
        </Link>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
            Filing Deadline: {claim.filingDeadline}
          </span>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold ${
              claim.status === 'SUBMITTED'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : claim.status === 'DENIED'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            STATUS: {claim.status}
          </span>
        </div>
      </div>

      {/* Claim Header Cockpit */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {claim.claimNumber}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                claim.claimType === 'INSTITUTIONAL'
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {claim.claimType === 'INSTITUTIONAL' ? 'UB-04 / 837I Facility' : 'CMS-1500 / 837P'}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                claim.riskLevel === 'HIGH'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : claim.riskLevel === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {claim.riskLevel} DENIAL RISK
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Patient</div>
              <div className="font-bold text-slate-800">{claim.patientName}</div>
              <div className="text-slate-500">DOB: {claim.patientDob}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Subscriber Payer</div>
              <div className="font-bold text-slate-800">{claim.payerName}</div>
              <div className="text-slate-500 font-mono">ID: {claim.memberId}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Rendering Provider</div>
              <div className="font-bold text-slate-800">{claim.providerName}</div>
              <div className="text-slate-500 font-mono">NPI: {claim.providerNpi}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Total Billed</div>
              <div className="text-base font-black text-slate-900 font-mono">
                ${claim.totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-slate-500">DOS: {claim.serviceDate}</div>
            </div>
          </div>
        </div>

        {/* Calibrated Actuarial Denial Risk Card */}
        <div className="shrink-0 p-4 bg-slate-50 border border-slate-200 rounded-xl min-w-[220px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Denial Propensity
            </span>
            <span
              className={`font-bold font-mono text-[11px] px-1.5 py-0.5 rounded ${
                claim.riskLevel === 'HIGH'
                  ? 'bg-rose-100 text-rose-800'
                  : claim.riskLevel === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {claim.riskLevel}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-black font-mono text-slate-900">{claim.riskScore}</span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 my-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                claim.riskLevel === 'HIGH'
                  ? 'bg-rose-500'
                  : claim.riskLevel === 'MEDIUM'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${claim.riskScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0 Clean</span>
            <span>30 Med</span>
            <span>70 High</span>
          </div>
        </div>
      </div>

      {/* Institutional UB-04 Facility Parameters Banner */}
      {claim.claimType === 'INSTITUTIONAL' && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              UB-04 (CMS-1450) Institutional Parameters & DRG Assignment
            </h3>
            <span className="text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded">
              EDI 837I Inpatient Hospital
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div>
              <span className="text-indigo-600 font-bold block">Type of Bill (FL 04):</span>
              <span className="font-semibold text-slate-900">{claim.typeOfBill || '111 - Hospital Inpatient'}</span>
            </div>
            <div>
              <span className="text-indigo-600 font-bold block">Admission Date (FL 12):</span>
              <span className="font-semibold text-slate-900">{claim.admissionDate || claim.serviceDate}</span>
            </div>
            <div>
              <span className="text-indigo-600 font-bold block">Admission Type (FL 14):</span>
              <span className="font-semibold text-slate-900">{claim.admissionType || 'EMERGENCY'}</span>
            </div>
            <div>
              <span className="text-indigo-600 font-bold block">Discharge Status (FL 17):</span>
              <span className="font-semibold text-slate-900">{claim.dischargeStatus || '01 - Home/Self Care'}</span>
            </div>
          </div>

          {claim.drgCode && (
            <div className="bg-white p-3 rounded-lg border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
              <div>
                <span className="text-[10px] text-indigo-500 font-bold uppercase block">CMS MS-DRG Grouping</span>
                <div className="text-sm font-black text-indigo-900 font-mono">
                  DRG {claim.drgCode} - {claim.drgTitle}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {claim.drgWeight && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Relative Weight</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">{claim.drgWeight.toFixed(4)}</span>
                  </div>
                )}
                {claim.inpatientLos && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Length of Stay</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">{claim.inpatientLos} Days</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actionable Detected Issues & Pre-Submission Interventions */}
      {claim.detectedIssues && claim.detectedIssues.length > 0 ? (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>
              Pre-Submission Rule Engine Findings ({claim.detectedIssues.length}{' '}
              {claim.detectedIssues.length === 1 ? 'Issue' : 'Issues'} Detected)
            </span>
          </div>
          <p className="text-xs text-amber-800">
            Resolving identified flags before clearinghouse transmission prevents costly adjudication
            rejections and average 18-day appeal delays.
          </p>
          <div className="space-y-2 mt-2">
            {claim.detectedIssues.map((issue, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono font-bold text-rose-600 px-2 py-0.5 bg-rose-50 rounded">
                    {issue.carc}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900">{issue.issue}</span>
                    <div className="text-slate-500 text-[11px]">Recommended: {issue.suggestedAction}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {issue.carc === 'CO-16' && (
                    <button
                      onClick={() => applyCorrection(claim.id)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Apply Auto-Correction</span>
                    </button>
                  )}
                  {issue.carc === 'CO-197' && (
                    <button
                      onClick={() => setAuthModalLine(1)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Attach Auth</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Clean Claim Status: All pre-submission rules and medical necessity checks pass!</span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-md shadow-xs">
            100% Ready for Submission
          </span>
        </div>
      )}

      {/* Clinical Notes & Diagnoses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            ICD-10-CM Diagnoses
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block">Primary Diagnosis:</span>
              <span className="font-semibold text-slate-900">{claim.primaryDiagnosis}</span>
            </div>
            {claim.secondaryDiagnosis && (
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block">Secondary Diagnosis:</span>
                <span className="text-slate-800">{claim.secondaryDiagnosis}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Clinical Documentation & History
          </h3>
          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 italic leading-relaxed min-h-[70px]">
            {claim.clinicalNotes ||
              'No clinical history recorded. Medical necessity documentation may be uploaded during appeal generation.'}
          </p>
        </div>
      </div>

      {/* Procedure Service Lines */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {claim.claimType === 'INSTITUTIONAL'
              ? 'Institutional Revenue Codes & Line Items (UB-04 FL 42-47)'
              : 'Service Line Items (CMS-1500 Section 24)'}
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {claim.lines?.length || 0} {claim.lines?.length === 1 ? 'Line Item' : 'Line Items'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Line #</th>
                {claim.claimType === 'INSTITUTIONAL' && (
                  <th className="py-2.5 px-4">Rev Code</th>
                )}
                <th className="py-2.5 px-4">CPT / HCPCS</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-center">Units</th>
                <th className="py-2.5 px-4 text-right">Charge</th>
                <th className="py-2.5 px-4 text-center">Prior Auth Status</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claim.lines?.map((line) => (
                <tr key={line.lineNo} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">{line.lineNo}</td>
                  {claim.claimType === 'INSTITUTIONAL' && (
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {line.revenueCode || '-'}
                    </td>
                  )}
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{line.cpt}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{line.desc}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">{line.units}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                    ${(line.charge * line.units).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        line.authStatus === 'ATTACHED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : line.authStatus === 'MISSING'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {line.authStatus === 'ATTACHED'
                        ? `ATTACHED (${line.authNumber || 'OK'})`
                        : line.authStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {line.authStatus === 'MISSING' && (
                      <button
                        onClick={() => setAuthModalLine(line.lineNo)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded transition-colors text-[11px]"
                      >
                        Attach Auth
                      </button>
                    )}
                    {line.authStatus === 'ATTACHED' && (
                      <span className="text-emerald-600 font-semibold text-[11px] flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Command Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Delete this claim permanently?')) {
                deleteClaim(claim.id);
                navigate('/claims');
              }
            }}
            className="px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Claim</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDenialModalOpen(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Simulate Denial / Route to Appeals</span>
          </button>

          <button
            onClick={() => submitClaim(claim.id)}
            disabled={claim.status === 'SUBMITTED'}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>
              {claim.status === 'SUBMITTED' ? 'Claim Submitted (EDI 837P)' : 'Submit Claim to Payer'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
