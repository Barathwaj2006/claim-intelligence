import React, { useState } from 'react';
import { X, TrendingUp, AlertCircle } from 'lucide-react';
import { useClaims } from '../context/ClaimContext';

interface CreateRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillClaim?: {
    claimId: string;
    claimNumber: string;
    patientName: string;
    payerName: string;
    billed: number;
  };
}

export const CreateRecoveryModal: React.FC<CreateRecoveryModalProps> = ({
  isOpen,
  onClose,
  prefillClaim,
}) => {
  const { addRecoveryCase, claims } = useClaims();

  const [selectedClaimId, setSelectedClaimId] = useState(prefillClaim?.claimId || '');
  const [claimNumber, setClaimNumber] = useState(prefillClaim?.claimNumber || '');
  const [patientName, setPatientName] = useState(prefillClaim?.patientName || '');
  const [payerName, setPayerName] = useState(prefillClaim?.payerName || 'Blue Cross Blue Shield');
  const [carcCode, setCarcCode] = useState('CO-197');
  const [denialReason, setDenialReason] = useState(
    'Prior authorization absent on procedure line'
  );
  const [revenueAtRisk, setRevenueAtRisk] = useState<number>(prefillClaim?.billed || 2800);
  const [priority, setPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [recoverability, setRecoverability] = useState<number>(75);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectClaim = (id: string) => {
    setSelectedClaimId(id);
    const found = claims.find((c) => c.id === id);
    if (found) {
      setClaimNumber(found.claimNumber);
      setPatientName(found.patientName);
      setPayerName(found.payerName);
      setRevenueAtRisk(found.totalBilled);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimNumber.trim()) {
      setError('Claim number is required.');
      return;
    }
    if (!patientName.trim()) {
      setError('Patient name is required.');
      return;
    }

    addRecoveryCase({
      claimId: selectedClaimId || `clm-${Date.now()}`,
      claimNumber: claimNumber.trim(),
      patientName: patientName.trim(),
      payerName: payerName.trim(),
      carcCode,
      denialReason: denialReason.trim(),
      revenueAtRisk: Number(revenueAtRisk) || 0,
      recoverability: Number(recoverability) || 50,
      priority,
      action: 'Clinical Appeal Dossier',
      daysRemaining: 45,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-600 text-white rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Log Post-Adjudication Denial</h3>
              <p className="text-xs text-slate-500">Record a claim denial to initiate automated clinical recovery appeals.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {claims.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Link Existing Staged Claim (Optional)
              </label>
              <select
                value={selectedClaimId}
                onChange={(e) => handleSelectClaim(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold focus:outline-hidden"
              >
                <option value="">-- Or enter custom claim details --</option>
                {claims.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.claimNumber} - {c.patientName} (${c.totalBilled})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Claim Number *</label>
              <input
                type="text"
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                placeholder="e.g. CLM-2026-00088"
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Patient Name *</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Robert Langdon"
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Payer Organization</label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Revenue At Risk ($)</label>
              <input
                type="number"
                value={revenueAtRisk}
                onChange={(e) => setRevenueAtRisk(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-rose-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">CARC Code</label>
              <select
                value={carcCode}
                onChange={(e) => setCarcCode(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-rose-600 focus:outline-hidden"
              >
                <option value="CO-197">CO-197 (Auth Absent)</option>
                <option value="CO-16">CO-16 (Billing Error)</option>
                <option value="CO-29">CO-29 (Filing Expired)</option>
                <option value="CO-45">CO-45 (Fee Discrepancy)</option>
                <option value="CO-50">CO-50 (Medical Necessity)</option>
                <option value="CO-27">CO-27 (Terminated)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold focus:outline-hidden"
              >
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Recoverability %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={recoverability}
                onChange={(e) => setRecoverability(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Denial Explanation / Stated Reason</label>
            <textarea
              rows={2}
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Queue Denial for Recovery</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
