import React, { useState } from 'react';
import { X, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useClaims, ClaimLine } from '../context/ClaimContext';

interface CreateClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: {
    patientName?: string;
    memberId?: string;
    payerName?: string;
    patientDob?: string;
  };
}

export const CreateClaimModal: React.FC<CreateClaimModalProps> = ({
  isOpen,
  onClose,
  prefill,
}) => {
  const { addClaim } = useClaims();

  const [claimNumber, setClaimNumber] = useState(
    () => `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [patientName, setPatientName] = useState(prefill?.patientName || '');
  const [patientDob, setPatientDob] = useState(prefill?.patientDob || '1982-06-14');
  const [memberId, setMemberId] = useState(prefill?.memberId || '');
  const [payerName, setPayerName] = useState(prefill?.payerName || 'Blue Cross Blue Shield');
  const [customPayer, setCustomPayer] = useState('');
  const [providerName, setProviderName] = useState('Dr. Marcus Vance, MD (Specialty Clinic)');
  const [providerNpi, setProviderNpi] = useState('1982736450');
  const [serviceDate, setServiceDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('M54.5 (Low back pain)');
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [lines, setLines] = useState<ClaimLine[]>([
    {
      lineNo: 1,
      cpt: '99214',
      desc: 'Office visit, established patient, level 4',
      units: 1,
      charge: 400,
      authStatus: 'NOT_REQUIRED',
    },
  ]);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        lineNo: prev.length + 1,
        cpt: '72148',
        desc: 'MRI Lumbar Spine without contrast',
        units: 1,
        charge: 1850,
        authStatus: 'MISSING',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, lineNo: i + 1 })));
  };

  const handleLineChange = (idx: number, field: keyof ClaimLine, value: any) => {
    setLines((prev) =>
      prev.map((line, i) => (i === idx ? { ...line, [field]: value } : line))
    );
  };

  const totalCalculated = lines.reduce(
    (sum, l) => sum + (Number(l.charge) || 0) * (Number(l.units) || 1),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (!memberId.trim()) {
      setError('Subscriber Member ID is required.');
      return;
    }
    if (!primaryDiagnosis.trim()) {
      setError('Primary ICD-10 diagnosis code is required.');
      return;
    }

    const effectivePayer = payerName === 'OTHER' ? customPayer || 'Custom Healthcare Payer' : payerName;

    // Default filing deadline: 90 days from service date
    const serviceDateObj = new Date(serviceDate);
    const deadlineObj = new Date(serviceDateObj.getTime() + 90 * 24 * 60 * 60 * 1000);
    const filingDeadline = deadlineObj.toISOString().split('T')[0];

    addClaim({
      claimNumber,
      patientName: patientName.trim(),
      patientDob,
      memberId: memberId.trim(),
      payerName: effectivePayer,
      payerId: '00123',
      providerName: providerName.trim(),
      providerNpi: providerNpi.trim(),
      serviceDate,
      filingDeadline,
      totalBilled: totalCalculated,
      status: 'DRAFT',
      primaryDiagnosis: primaryDiagnosis.trim(),
      secondaryDiagnosis: secondaryDiagnosis.trim() || undefined,
      clinicalNotes: clinicalNotes.trim() || undefined,
      lines,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Professional Claim (CMS-1500)</h3>
              <p className="text-xs text-slate-500">
                Input patient, provider, and procedure service lines for pre-submission intelligence scoring.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Claim & Payer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Claim Number</label>
              <input
                type="text"
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-semibold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Payer Organization</label>
              <select
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Blue Cross Blue Shield">Blue Cross Blue Shield</option>
                <option value="UnitedHealthcare">UnitedHealthcare</option>
                <option value="Medicare Part B">Medicare Part B</option>
                <option value="Aetna Health">Aetna Health</option>
                <option value="Cigna Commercial">Cigna Commercial</option>
                <option value="Humana">Humana</option>
                <option value="OTHER">Other / Custom Payer</option>
              </select>
            </div>
            {payerName === 'OTHER' ? (
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Custom Payer Name</label>
                <input
                  type="text"
                  placeholder="Enter Payer Name"
                  value={customPayer}
                  onChange={(e) => setCustomPayer(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Service Date</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Patient Details */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">Patient & Subscriber Demographics</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Eleanor Vance"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={patientDob}
                  onChange={(e) => setPatientDob(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Member / Subscriber ID *</label>
                <input
                  type="text"
                  placeholder="e.g. BCBS-98231011"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* Provider Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Rendering Provider</label>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Provider NPI (10 digits)</label>
              <input
                type="text"
                value={providerNpi}
                onChange={(e) => setProviderNpi(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Diagnoses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Primary Diagnosis (ICD-10) *</label>
              <input
                type="text"
                placeholder="e.g. M54.5 (Low back pain)"
                value={primaryDiagnosis}
                onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Secondary Diagnosis (Optional)</label>
              <input
                type="text"
                placeholder="e.g. M54.16 (Radiculopathy, lumbar)"
                value={secondaryDiagnosis}
                onChange={(e) => setSecondaryDiagnosis(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Procedure Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider">Service Line Items (CPT / HCPCS)</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-md flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Service Line
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">CPT Code</label>
                    <input
                      type="text"
                      value={line.cpt}
                      onChange={(e) => handleLineChange(idx, 'cpt', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                    <input
                      type="text"
                      value={line.desc}
                      onChange={(e) => handleLineChange(idx, 'desc', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Units</label>
                    <input
                      type="number"
                      min="1"
                      value={line.units}
                      onChange={(e) => handleLineChange(idx, 'units', parseInt(e.target.value) || 1)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-center font-bold focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Charge ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={line.charge}
                      onChange={(e) => handleLineChange(idx, 'charge', parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Prior Auth</label>
                    <select
                      value={line.authStatus}
                      onChange={(e) => handleLineChange(idx, 'authStatus', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white font-semibold text-[11px] focus:outline-hidden"
                    >
                      <option value="NOT_REQUIRED">Not Required</option>
                      <option value="MISSING">Missing (Required)</option>
                      <option value="ATTACHED">Attached (Auth OK)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors"
                      title="Remove line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Clinical Notes & History (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Patient presents with intractable pain failing conservative physical therapy."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer & Total */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500">Total Billed Charges:</span>
              <div className="text-xl font-black text-slate-900 font-mono">
                ${totalCalculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save & Score Claim</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
