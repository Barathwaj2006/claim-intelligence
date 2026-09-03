import React, { useState } from 'react';
import { Search, CheckCircle2, AlertCircle, Plus, FileSpreadsheet, History } from 'lucide-react';
import { useClaims, EligibilityRecord } from '../context/ClaimContext';
import { CreateClaimModal } from '../components/CreateClaimModal';

export const Eligibility: React.FC = () => {
  const { eligibilityHistory, verifyEligibility } = useClaims();

  const [patientName, setPatientName] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [memberId, setMemberId] = useState('');
  const [payerId, setPayerId] = useState('00123'); // BCBS
  const [currentResponse, setCurrentResponse] = useState<EligibilityRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const handleRunInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!memberId.trim()) {
      setError('Please enter a Subscriber Member ID.');
      return;
    }

    setIsLoading(true);

    // Simulate real EDI 270 transaction latency
    setTimeout(() => {
      const cleanName = patientName.trim() || 'Insured Subscriber';

      const newRecord = verifyEligibility({
        patientName: cleanName,
        patientDob: patientDob || '1985-01-01',
        memberId: memberId.trim(),
        payerId,
      });

      setCurrentResponse(newRecord);
      setIsLoading(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      <CreateClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        prefill={
          currentResponse
            ? {
                patientName: currentResponse.patientName,
                memberId: currentResponse.memberId,
                patientDob: currentResponse.patientDob,
                payerName: currentResponse.payerName.replace(/\s\(\d+\)/, ''),
              }
            : undefined
        }
      />

      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Real-Time Eligibility (EDI 270/271)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Verify active insurance coverage, deductibles, and specialist copays prior to claim submission.
        </p>
      </div>

      {/* Verification Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
        <form onSubmit={handleRunInquiry} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Select Payer (Payer ID) *
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full font-semibold p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="00123">Blue Cross Blue Shield (00123)</option>
                <option value="00430">UnitedHealthcare (00430)</option>
                <option value="00020">Medicare Part B (00020)</option>
                <option value="60054">Aetna Health (60054)</option>
                <option value="62308">Cigna Commercial (62308)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Member / Subscriber ID *
              </label>
              <input
                type="text"
                placeholder="e.g. BCBS-98231011"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full font-mono font-semibold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Patient Full Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Eleanor Vance"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full font-semibold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Patient Date of Birth (Optional)
              </label>
              <input
                type="date"
                value={patientDob}
                onChange={(e) => setPatientDob(e.target.value)}
                className="w-full font-semibold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'Querying Clearinghouse EDI 270...' : 'Run 270 Real-Time Inquiry'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 271 Response Card */}
      {currentResponse ? (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-xs overflow-hidden max-w-2xl">
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                {currentResponse.status === 'ACTIVE'
                  ? 'Coverage Active (HIPAA 271 Response OK)'
                  : 'Coverage Inactive or Terminated'}
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
              {currentResponse.trn}
            </span>
          </div>

          <div className="p-6 grid grid-cols-2 gap-6 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Subscriber Name</div>
              <div className="text-sm font-bold text-slate-800">{currentResponse.patientName}</div>
              <div className="text-slate-500 mt-1">Plan: {currentResponse.planName}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Coverage Window</div>
              <div className="text-sm font-bold text-slate-800">
                {currentResponse.coverageWindow}
              </div>
              <div
                className={`font-semibold mt-1 ${
                  currentResponse.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {currentResponse.status === 'ACTIVE' ? 'Currently Effective' : 'Policy Terminated'}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Annual Deductible</div>
              <div className="text-sm font-bold text-slate-800">
                ${currentResponse.deductibleTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} Total
              </div>
              <div className="text-slate-600 mt-1">
                ${currentResponse.deductibleMet.toLocaleString('en-US', { minimumFractionDigits: 2 })} Met ($
                {(currentResponse.deductibleTotal - currentResponse.deductibleMet).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}{' '}
                Remaining)
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Patient Cost-Share</div>
              <div className="text-sm font-bold text-slate-800">
                ${currentResponse.copay}.00 Specialist Copay
              </div>
              <div className="text-slate-600 mt-1">{currentResponse.coinsurance}% In-Network Coinsurance</div>
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">
              Verified on {new Date(currentResponse.verifiedAt).toLocaleString()}
            </span>
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Stage Claim for this Member</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 max-w-2xl bg-white border border-dashed border-slate-300 rounded-xl text-center text-slate-500">
          <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="text-xs font-semibold text-slate-700">No eligibility inquiry submitted yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Enter a subscriber ID and click &ldquo;Run 270 Real-Time Inquiry&rdquo; to query payer benefits.
          </p>
        </div>
      )}

      {/* Inquiry History */}
      {eligibilityHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs max-w-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2 text-slate-800 font-bold text-xs">
            <History className="w-4 h-4 text-slate-500" />
            <span>Verification Session History ({eligibilityHistory.length})</span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {eligibilityHistory.map((rec: EligibilityRecord) => (
              <div
                key={rec.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-800">{rec.patientName}</div>
                  <div className="text-slate-500 text-[11px]">
                    ID: <span className="font-mono">{rec.memberId}</span> &bull; {rec.payerName}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      rec.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {rec.status}
                  </span>
                  <button
                    onClick={() => setCurrentResponse(rec)}
                    className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 font-semibold rounded transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
