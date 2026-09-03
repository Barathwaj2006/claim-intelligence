import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Building2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useClaims } from '../context/ClaimContext';
import { useNavigate } from 'react-router-dom';

interface PrincipalDx {
  code: string;
  desc: string;
  category: string;
  defaultMdc: string;
}

interface ProcedureItem {
  code: string;
  desc: string;
  isOrProcedure: boolean;
}

interface SecondaryDx {
  code: string;
  desc: string;
  tier: 'MCC' | 'CC';
}

const PRINCIPAL_DIAGNOSES: PrincipalDx[] = [
  { code: 'A41.9', desc: 'Sepsis, unspecified organism', category: 'Infectious', defaultMdc: 'MDC 18' },
  { code: 'I50.9', desc: 'Heart failure, unspecified', category: 'Circulatory', defaultMdc: 'MDC 05' },
  { code: 'I21.0', desc: 'Acute transmural MI of anterior wall (STEMI)', category: 'Circulatory', defaultMdc: 'MDC 05' },
  { code: 'J18.9', desc: 'Pneumonia, unspecified organism', category: 'Respiratory', defaultMdc: 'MDC 04' },
  { code: 'M17.11', desc: 'Unilateral primary osteoarthritis, right knee', category: 'Musculoskeletal', defaultMdc: 'MDC 08' },
  { code: 'K35.80', desc: 'Unspecified acute appendicitis', category: 'Digestive', defaultMdc: 'MDC 06' },
  { code: 'I63.9', desc: 'Cerebral infarction, unspecified (Ischemic Stroke)', category: 'Nervous', defaultMdc: 'MDC 01' },
  { code: 'N17.9', desc: 'Acute kidney failure, unspecified', category: 'Kidney & Urinary', defaultMdc: 'MDC 11' },
  { code: 'K56.60', desc: 'Unspecified intestinal obstruction', category: 'Digestive', defaultMdc: 'MDC 06' },
];

const AVAILABLE_PROCEDURES: ProcedureItem[] = [
  { code: '0SR9019', desc: 'Replacement of Right Knee Joint with Synthetic Substitute (Total Knee)', isOrProcedure: true },
  { code: '0SRB019', desc: 'Replacement of Right Hip Joint with Synthetic Substitute (Total Hip)', isOrProcedure: true },
  { code: '021009Z', desc: 'Coronary Artery Bypass, 1 Site from Aorta with Autologous Vein', isOrProcedure: true },
  { code: '0DTJ0ZZ', desc: 'Resection of Appendix, Open Approach (Appendectomy)', isOrProcedure: true },
  { code: '5A1945Z', desc: 'Respiratory Ventilation, Greater than 96 Consecutive Hours', isOrProcedure: false },
  { code: '02703ZZ', desc: 'Dilation of Coronary Artery, One Artery (PTCA/Stent)', isOrProcedure: true },
];

const AVAILABLE_SECONDARY_DX: SecondaryDx[] = [
  { code: 'N17.9', desc: 'Acute kidney failure (MCC)', tier: 'MCC' },
  { code: 'J96.00', desc: 'Acute respiratory failure, unspecified (MCC)', tier: 'MCC' },
  { code: 'R57.0', desc: 'Cardiogenic shock (MCC)', tier: 'MCC' },
  { code: 'E87.2', desc: 'Acidosis / Metabolic derangement (MCC)', tier: 'MCC' },
  { code: 'J44.1', desc: 'Chronic obstructive pulmonary disease with acute exacerbation (CC)', tier: 'CC' },
  { code: 'E11.65', desc: 'Type 2 diabetes with hyperglycemia (CC)', tier: 'CC' },
  { code: 'I12.9', desc: 'Hypertensive chronic kidney disease with stage 1-4 CKD (CC)', tier: 'CC' },
  { code: 'D64.9', desc: 'Anemia, unspecified (CC)', tier: 'CC' },
];

export const DRGGrouper: React.FC = () => {
  const { addClaim } = useClaims();
  const navigate = useNavigate();

  const [principalDx, setPrincipalDx] = useState<string>('A41.9');
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [selectedSecondary, setSelectedSecondary] = useState<string[]>(['N17.9']);
  const [baseHospitalRate, setBaseHospitalRate] = useState<number>(6850);
  const [patientName, setPatientName] = useState<string>('Robert C. Sterling');
  const [memberId, setMemberId] = useState<string>('MCAR-88391204');
  const [stageSuccess, setStageSuccess] = useState<string | null>(null);

  // Grouping logic based on CMS v42.0 Inpatient Prospective Payment System (IPPS)
  const hasMcc = selectedSecondary.some((c) => AVAILABLE_SECONDARY_DX.find((d) => d.code === c)?.tier === 'MCC');
  const hasCc = selectedSecondary.some((c) => AVAILABLE_SECONDARY_DX.find((d) => d.code === c)?.tier === 'CC');
  const hasVent96 = selectedProcedures.includes('5A1945Z');

  let drgCode = '871';
  let drgTitle = 'Septicemia or Severe Sepsis w/o MV >96 Hours w/ MCC';
  let relativeWeight = 1.8421;
  let gmlos = 4.8;
  let mdc = 'MDC 18 (Infectious Diseases)';

  if (hasVent96) {
    drgCode = '870';
    drgTitle = 'Septicemia or Severe Sepsis w/ MV >96 Hours';
    relativeWeight = 5.6824;
    gmlos = 12.4;
    mdc = 'MDC 18 (Infectious Diseases)';
  } else if (selectedProcedures.includes('021009Z')) {
    if (hasMcc) {
      drgCode = '235';
      drgTitle = 'Coronary Bypass w/ PTCA w/ MCC';
      relativeWeight = 5.1294;
      gmlos = 8.5;
    } else {
      drgCode = '236';
      drgTitle = 'Coronary Bypass w/o MCC';
      relativeWeight = 3.4218;
      gmlos = 5.1;
    }
    mdc = 'MDC 05 (Circulatory System)';
  } else if (selectedProcedures.includes('0SR9019') || selectedProcedures.includes('0SRB019')) {
    if (hasMcc) {
      drgCode = '469';
      drgTitle = 'Major Hip and Knee Joint Replacement w/ MCC';
      relativeWeight = 3.0189;
      gmlos = 4.6;
    } else {
      drgCode = '470';
      drgTitle = 'Major Hip and Knee Joint Replacement w/o MCC';
      relativeWeight = 1.9540;
      gmlos = 2.3;
    }
    mdc = 'MDC 08 (Musculoskeletal System)';
  } else if (selectedProcedures.includes('0DTJ0ZZ')) {
    if (hasMcc) {
      drgCode = '341';
      drgTitle = 'Appendectomy w/ Complicated Principal Diag w/ MCC';
      relativeWeight = 2.4512;
      gmlos = 4.9;
    } else if (hasCc) {
      drgCode = '342';
      drgTitle = 'Appendectomy w/ Complicated Principal Diag w/ CC';
      relativeWeight = 1.5812;
      gmlos = 3.1;
    } else {
      drgCode = '343';
      drgTitle = 'Appendectomy w/o CC/MCC';
      relativeWeight = 1.0945;
      gmlos = 1.6;
    }
    mdc = 'MDC 06 (Digestive System)';
  } else if (principalDx === 'I50.9') {
    if (hasMcc) {
      drgCode = '291';
      drgTitle = 'Heart Failure & Shock w/ MCC';
      relativeWeight = 1.4820;
      gmlos = 4.5;
    } else if (hasCc) {
      drgCode = '292';
      drgTitle = 'Heart Failure & Shock w/ CC';
      relativeWeight = 0.9845;
      gmlos = 3.2;
    } else {
      drgCode = '293';
      drgTitle = 'Heart Failure & Shock w/o CC/MCC';
      relativeWeight = 0.6912;
      gmlos = 2.3;
    }
    mdc = 'MDC 05 (Circulatory System)';
  } else if (principalDx === 'I21.0') {
    if (hasMcc) {
      drgCode = '280';
      drgTitle = 'Acute Myocardial Infarction, Discharged Alive w/ MCC';
      relativeWeight = 1.7451;
      gmlos = 4.1;
    } else {
      drgCode = '281';
      drgTitle = 'Acute Myocardial Infarction, Discharged Alive w/ CC';
      relativeWeight = 1.0542;
      gmlos = 2.7;
    }
    mdc = 'MDC 05 (Circulatory System)';
  } else if (principalDx === 'J18.9') {
    if (hasMcc) {
      drgCode = '193';
      drgTitle = 'Simple Pneumonia & Pleurisy w/ MCC';
      relativeWeight = 1.3412;
      gmlos = 4.2;
    } else if (hasCc) {
      drgCode = '194';
      drgTitle = 'Simple Pneumonia & Pleurisy w/ CC';
      relativeWeight = 0.9412;
      gmlos = 3.1;
    } else {
      drgCode = '195';
      drgTitle = 'Simple Pneumonia & Pleurisy w/o CC/MCC';
      relativeWeight = 0.6841;
      gmlos = 2.2;
    }
    mdc = 'MDC 04 (Respiratory System)';
  } else if (principalDx === 'A41.9') {
    if (hasMcc) {
      drgCode = '871';
      drgTitle = 'Septicemia or Severe Sepsis w/o MV >96 Hours w/ MCC';
      relativeWeight = 1.8421;
      gmlos = 4.8;
    } else {
      drgCode = '872';
      drgTitle = 'Septicemia or Severe Sepsis w/o MV >96 Hours w/o MCC';
      relativeWeight = 1.1840;
      gmlos = 3.4;
    }
    mdc = 'MDC 18 (Infectious Diseases)';
  }

  const estimatedReimbursement = Math.round(relativeWeight * baseHospitalRate);
  const activePrincipal = PRINCIPAL_DIAGNOSES.find((d) => d.code === principalDx) || PRINCIPAL_DIAGNOSES[0];

  const toggleProcedure = (code: string) => {
    setSelectedProcedures((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleSecondary = (code: string) => {
    setSelectedSecondary((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleStageUB04Claim = () => {
    const claimNum = `UB04-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().split('T')[0];
    const admissionDate = new Date(Date.now() - Math.round(gmlos) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const billed = Math.round(estimatedReimbursement * 2.8);

    addClaim({
      claimNumber: claimNum,
      claimType: 'INSTITUTIONAL',
      typeOfBill: '111 - Hospital Inpatient',
      admissionDate,
      admissionType: 'EMERGENCY',
      dischargeStatus: '01 - Discharged to Home / Self Care',
      drgCode,
      drgTitle,
      drgWeight: relativeWeight,
      inpatientLos: Math.round(gmlos),
      patientName,
      patientDob: '1962-04-18',
      memberId,
      payerName: 'Medicare Part A / Inpatient Hospital',
      payerId: '00123',
      providerName: 'St. Jude Metropolitan Hospital (Main Campus)',
      providerNpi: '1092837461',
      serviceDate: today,
      filingDeadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalBilled: billed,
      status: 'DRAFT',
      primaryDiagnosis: `${activePrincipal.code} (${activePrincipal.desc})`,
      secondaryDiagnosis: selectedSecondary.join(', ') || undefined,
      clinicalNotes: `Inpatient Admission for ${activePrincipal.desc}. Grouped to MS-DRG ${drgCode} (${drgTitle}) with relative weight ${relativeWeight}. Comorbidities: ${selectedSecondary.join(', ')}.`,
      lines: [
        {
          lineNo: 1,
          revenueCode: '0110',
          cpt: '0110',
          desc: `Inpatient Acute Care Accommodations (${Math.round(gmlos)} days)`,
          units: Math.round(gmlos),
          charge: Math.round(billed * 0.55),
          authStatus: 'NOT_REQUIRED',
        },
        {
          lineNo: 2,
          revenueCode: '0450',
          cpt: '99285',
          desc: 'Emergency Department Evaluation & Resuscitation',
          units: 1,
          charge: 1850,
          authStatus: 'NOT_REQUIRED',
        },
        {
          lineNo: 3,
          revenueCode: '0250',
          cpt: 'J1569',
          desc: 'Inpatient Pharmacy & IV Infusion Medications',
          units: 1,
          charge: Math.round(billed * 0.25),
          authStatus: 'NOT_REQUIRED',
        },
      ],
    });

    setStageSuccess(`Claim ${claimNum} successfully staged as UB-04 Institutional Claim!`);
    setTimeout(() => {
      navigate('/claims');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">MS-DRG Inpatient Grouper</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              CMS v42.0 IPPS
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Simulate Inpatient Prospective Payment System (IPPS) grouping, relative weights, and expected reimbursement.
          </p>
        </div>
        <button
          onClick={handleStageUB04Claim}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Building2 className="w-4 h-4" />
          <span>Stage as UB-04 Claim</span>
        </button>
      </div>

      {stageSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{stageSuccess} Redirecting to Claims Queue...</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Clinical inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Principal Diagnosis Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                1. Principal Inpatient Diagnosis (ICD-10-CM)
              </span>
              <span className="text-xs text-slate-500 font-mono">Governs MDC & Base DRG</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRINCIPAL_DIAGNOSES.map((dx) => (
                <button
                  key={dx.code}
                  onClick={() => setPrincipalDx(dx.code)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    principalDx === dx.code
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 text-xs">{dx.code}</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {dx.category}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">{dx.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Comorbidities Card (CC / MCC) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  2. Comorbidities & Complications (CC / MCC Tier)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select co-existing acute conditions to evaluate severity shifts.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">MCC ({hasMcc ? 'Captured' : 'None'})</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">CC ({hasCc ? 'Captured' : 'None'})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_SECONDARY_DX.map((dx) => {
                const isSelected = selectedSecondary.includes(dx.code);
                return (
                  <button
                    key={dx.code}
                    onClick={() => toggleSecondary(dx.code)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? dx.tier === 'MCC'
                          ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-200 shadow-xs'
                          : 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-200 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-800">{dx.code}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            dx.tier === 'MCC'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {dx.tier}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mt-1">{dx.desc}</div>
                    </div>
                    <div className="pt-0.5">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Surgical / OR Procedures Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  3. Inpatient Operating Room (OR) Procedures (ICD-10-PCS)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Surgical procedures automatically drive Surgical DRG partition assignment.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {AVAILABLE_PROCEDURES.map((proc) => {
                const isSelected = selectedProcedures.includes(proc.code);
                return (
                  <button
                    key={proc.code}
                    onClick={() => toggleProcedure(proc.code)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div>
                        <span className="font-mono font-bold text-xs text-emerald-800">{proc.code}</span>
                        <span className="text-xs font-semibold text-slate-800 ml-2">{proc.desc}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                      {proc.isOrProcedure ? 'OR Surgical' : 'Non-OR Vent'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Grouping Results Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-4">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Assigned MS-DRG Result
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-800/80 text-indigo-200 text-[11px] font-mono font-bold">
                CMS v42.0
              </span>
            </div>

            <div>
              <div className="text-3xl font-black font-mono text-white tracking-tight flex items-baseline gap-2">
                <span>MS-DRG {drgCode}</span>
              </div>
              <p className="text-sm font-semibold text-indigo-200 mt-1.5 leading-snug">
                {drgTitle}
              </p>
              <div className="text-xs text-indigo-400 mt-1 font-mono">
                {mdc}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-indigo-900/40 border border-indigo-800/60 p-3 rounded-xl">
                <span className="text-[11px] text-indigo-300 uppercase font-bold block">Relative Weight</span>
                <span className="text-xl font-black font-mono text-white mt-1 block">
                  {relativeWeight.toFixed(4)}
                </span>
                <span className="text-[10px] text-indigo-300 mt-0.5 block">National CMS Weight</span>
              </div>

              <div className="bg-indigo-900/40 border border-indigo-800/60 p-3 rounded-xl">
                <span className="text-[11px] text-indigo-300 uppercase font-bold block">GMLOS Target</span>
                <span className="text-xl font-black font-mono text-white mt-1 block">
                  {gmlos} <span className="text-xs font-normal text-indigo-300">Days</span>
                </span>
                <span className="text-[10px] text-indigo-300 mt-0.5 block">Geometric Mean LOS</span>
              </div>
            </div>

            <div className="bg-indigo-800/40 border border-indigo-700/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-indigo-200">
                <span>Hospital Base Operating Rate:</span>
                <input
                  type="number"
                  value={baseHospitalRate}
                  onChange={(e) => setBaseHospitalRate(Number(e.target.value) || 0)}
                  className="w-24 px-2 py-0.5 bg-indigo-950 border border-indigo-700 text-right font-mono font-bold text-white rounded text-xs"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-indigo-200">
                <span>Severity Tier:</span>
                <span className="font-bold text-amber-300">{hasMcc ? 'MCC (Major Severity)' : hasCc ? 'CC (Moderate)' : 'Non-CC/MCC'}</span>
              </div>
              <div className="border-t border-indigo-700/60 pt-2 flex items-center justify-between">
                <span className="font-bold text-white text-xs">Estimated Medicare Base:</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  ${estimatedReimbursement.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stage parameters */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-indigo-300 uppercase mb-1">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-2 bg-indigo-950/60 border border-indigo-800 rounded-lg text-xs text-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-300 uppercase mb-1">Member / HICN ID</label>
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full p-2 bg-indigo-950/60 border border-indigo-800 rounded-lg text-xs text-white font-mono font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <button
                onClick={handleStageUB04Claim}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>Stage Directly as UB-04 Claim</span>
              </button>
            </div>
          </div>

          {/* Hospital CMI Impact note */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-blue-600" />
              Revenue Integrity Impact
            </div>
            <p className="text-slate-600 leading-relaxed">
              Capturing documentation for an acute comorbidity (like Acute Kidney Failure N17.9) shifts the base DRG from 872 (Weight 1.1840) to MS-DRG 871 (Weight 1.8421), recovering an additional <span className="font-bold text-emerald-700">${Math.round((1.8421 - 1.1840) * baseHospitalRate).toLocaleString()}</span> in legitimate facility reimbursement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
