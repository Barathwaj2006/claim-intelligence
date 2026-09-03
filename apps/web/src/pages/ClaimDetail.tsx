import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Send,
  FileText,
  Wrench,
  Check,
} from 'lucide-react';

export const ClaimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [correctionApplied, setCorrectionApplied] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

  const claim = {
    id: id || 'clm-002',
    claimNumber: 'CLM-2026-00102',
    patientName: 'Marcus Thorne',
    patientDob: '1978-04-12',
    memberId: 'UHC-44912033',
    payerName: correctionApplied ? 'UnitedHealthcare' : 'UnitedHealthCare (Ocr Typo)',
    providerName: 'Dr. Gregory House, MD (Orthopedics)',
    providerNpi: '1982736450',
    serviceDate: '2026-08-20',
    filingDeadline: '2026-11-20 (78 days remaining)',
    totalBilled: '$3,200.00',
    status: submissionStatus || 'DRAFT',
    riskScore: correctionApplied ? 55 : 85,
    riskLevel: correctionApplied ? 'MEDIUM' : 'HIGH',
    primaryDiagnosis: 'M54.5 (Low Back Pain)',
    secondaryDiagnosis: 'M54.16 (Radiculopathy, lumbar region)',
    clinicalNotes:
      'Patient has suffered 8 weeks intractable lower back pain radiating down left L5 distribution. Failed conservative physical therapy.',
    lines: [
      {
        lineNo: 1,
        cpt: '72148',
        desc: 'MRI Lumbar Spine without contrast',
        units: 1,
        charge: '$2,800.00',
        authStatus: 'MISSING',
        likelyCarc: 'CO-197',
      },
      {
        lineNo: 2,
        cpt: '99214',
        desc: 'Office Visit, Established Patient, Level 4',
        units: 1,
        charge: '$400.00',
        authStatus: 'NOT_REQUIRED',
        likelyCarc: 'NONE',
      },
    ],
  };

  const handleApplyCorrection = () => {
    setCorrectionApplied(true);
  };

  const handleSubmitClaim = () => {
    setSubmissionStatus('SUBMITTED');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
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
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
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
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                claim.riskLevel === 'HIGH'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
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
              <div className="text-base font-black text-slate-900">{claim.totalBilled}</div>
              <div className="text-slate-500">Date: {claim.serviceDate}</div>
            </div>
          </div>
        </div>

        {/* Big Risk Meter */}
        <div className="shrink-0 flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500 uppercase">Composite Denial Propensity</div>
            <div className="text-xs text-slate-400">Deterministic Rule Engine v1.0</div>
          </div>
          <div
            className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-sm ${
              claim.riskScore >= 70 ? 'bg-rose-600' : 'bg-amber-500'
            }`}
          >
            {claim.riskScore}
          </div>
        </div>
      </div>

      {/* Pre-Submission Remediation Banner */}
      {!correctionApplied ? (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                1 Pre-Submission Data Correction Available
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Payer name normalization suggested: Change <span className="font-mono bg-amber-100 px-1 font-bold">UnitedHealthCare (Ocr Typo)</span> to{' '}
                <span className="font-mono bg-amber-100 px-1 font-bold">UnitedHealthcare</span> (98% confidence).
              </p>
            </div>
          </div>
          <button
            onClick={handleApplyCorrection}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-xs flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Apply One-Click Correction
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-800">
            Data Quality correction successfully applied. Payer name normalized to UnitedHealthcare.
          </span>
        </div>
      )}

      {/* Two-Column Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lines & Explainability */}
        <div className="lg:col-span-2 space-y-6">
          {/* Procedure Line Items */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> CMS-1500 Service Lines
              </h3>
              <span className="text-xs text-slate-500 font-medium">Place of Service: 11 (Office)</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">CPT / HCPCS</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Billed</th>
                  <th className="py-2.5 px-3 text-center">Prior Auth</th>
                  <th className="py-2.5 px-3 text-center">Likely CARC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claim.lines.map((l) => (
                  <tr key={l.lineNo} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-semibold text-slate-400">{l.lineNo}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{l.cpt}</td>
                    <td className="py-3 px-3 text-slate-800">{l.desc}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{l.charge}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          l.authStatus === 'MISSING'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {l.authStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-rose-600">
                      {l.likelyCarc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explainability / Root Cause Diagnosis */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Denial Risk Factor Decomposition
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>+35 Impact — Prior Authorization Missing for CPT 72148</span>
                  <span className="font-mono bg-rose-200 px-1.5 py-0.5 rounded text-[11px]">
                    Projected CARC: CO-197
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-1">
                  UnitedHealthcare commercial policy mandates precertification for outpatient lumbar MRI. No valid authorization number was detected on this encounter.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>-10 Impact — Active Patient Coverage Verified</span>
                  <span className="text-emerald-700 text-[11px]">270/271 Check Passed</span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Subscriber coverage is active under UnitedHealthcare Group #UHC-4491. Deductible met ($1,500 / $1,500).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Actions & Checklist */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Pre-Submission Actions</h3>
            <div className="space-y-2">
              <button
                disabled={claim.riskScore >= 70 && !correctionApplied}
                onClick={handleSubmitClaim}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Claim to Clearinghouse</span>
              </button>
              {claim.riskScore >= 70 && !correctionApplied && (
                <p className="text-[11px] text-rose-600 font-medium text-center">
                  Blocked by rule engine: High denial risk requires remediation before clean submission.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-2">Simulate Adjudication (835 ERA)</div>
              <Link
                to="/recovery"
                className="block text-center py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Simulate Payer Adjudication & View Denial
              </Link>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Clinical Diagnosis</h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Primary ICD-10:</span>
                <div className="font-bold text-slate-800">{claim.primaryDiagnosis}</div>
              </div>
              <div>
                <span className="text-slate-400">Secondary ICD-10:</span>
                <div className="font-medium text-slate-700">{claim.secondaryDiagnosis}</div>
              </div>
              <div className="pt-2">
                <span className="text-slate-400">Clinical Summary:</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {claim.clinicalNotes}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
