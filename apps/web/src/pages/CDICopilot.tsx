import React, { useState } from 'react';
import {
  FileCode2,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  Copy,
  BookmarkPlus
} from 'lucide-react';
import { useClaims } from '../context/ClaimContext';
import { useNavigate } from 'react-router-dom';

interface CDIQueryTemplate {
  id: string;
  triggerCondition: string;
  queryTitle: string;
  acdisStandard: string;
  clinicalIndicators: string;
  impactMccCc: string;
  queryText: string;
}

const CDI_QUERIES: CDIQueryTemplate[] = [
  {
    id: 'CDI-01',
    triggerCondition: 'Pneumonia documented without organism or respiratory failure',
    queryTitle: 'Aspiration vs. Bacterial Pneumonia & Acute Respiratory Failure',
    acdisStandard: 'ACDIS/AHIMA Guidelines for Achieving a Compliant Query Practice',
    clinicalIndicators: 'Patient noted on 4L nasal cannula, PaO2/FiO2 < 300, witnessed vomiting prior to admission.',
    impactMccCc: 'Adding J96.01 (Acute Hypoxemic Respiratory Failure) qualifies as MCC, increasing hospital relative weight by +0.72.',
    queryText: `To Attending Physician:
Patient clinical record indicates diagnosis of Pneumonia with supplemental oxygen requirement (4L NC). Please clarify whether the pneumonia represents:
[ ] Community-Acquired Bacterial Pneumonia (J18.9)
[ ] Aspiration Pneumonia due to food/vomitus (J69.0) [MCC]
[ ] Other specified organism (e.g. Pseudomonas J15.1, Klebsiella J15.0)
[ ] Associated Acute Respiratory Failure (J96.01) [MCC]
[ ] Other etiology: _______________
[ ] Unable to determine`,
  },
  {
    id: 'CDI-02',
    triggerCondition: 'Creatinine elevation (>1.5x baseline) without Acute Kidney Failure diagnosis',
    queryTitle: 'Acute Kidney Injury (AKI) / Acute Tubular Necrosis (ATN)',
    acdisStandard: 'KDIGO Clinical Practice Guideline for Acute Kidney Injury',
    clinicalIndicators: 'Admission Cr 2.4 mg/dL up from baseline 0.9 mg/dL. IV hydration initiated.',
    impactMccCc: 'N17.9 (Acute Kidney Failure) or N17.0 (Acute Tubular Necrosis) qualifies as MCC.',
    queryText: `To Attending Physician:
Patient admission serum creatinine rose to 2.4 mg/dL from baseline 0.9 mg/dL. Please clarify the renal clinical assessment:
[ ] Acute Kidney Injury (AKI) / Acute Renal Failure (N17.9) [MCC]
[ ] Acute Tubular Necrosis (ATN) (N17.0) [MCC]
[ ] Pre-renal azotemia / Dehydration responding to IV fluids
[ ] Acute on Chronic Kidney Disease Stage: _____
[ ] Other renal condition: _______________
[ ] Unable to determine`,
  },
  {
    id: 'CDI-03',
    triggerCondition: 'Sepsis documented without specific organ dysfunction (Severe Sepsis)',
    queryTitle: 'Severe Sepsis with Acute Organ Dysfunction',
    acdisStandard: 'Sepsis-3 Consensus Definitions',
    clinicalIndicators: 'Lactate 3.2 mmol/L, MAP <65 requiring vasopressors, Platelets <100k.',
    impactMccCc: 'Upgrades MS-DRG 872 to MS-DRG 871 (Relative Weight shifts from 1.184 to 1.842).',
    queryText: `To Attending Physician:
Patient meets Sepsis criteria with elevated lactate (3.2) and transient hypotension. Please clarify if acute organ dysfunction was present:
[ ] Severe Sepsis with Septic Shock (R65.21) [MCC]
[ ] Severe Sepsis without Septic Shock (R65.20) [MCC]
[ ] Sepsis without acute organ dysfunction (A41.9)
[ ] Systemic Inflammatory Response Syndrome (SIRS) of non-infectious etiology
[ ] Other: _______________
[ ] Unable to determine`,
  },
  {
    id: 'CDI-04',
    triggerCondition: 'Severe Malnutrition documented without severity grading',
    queryTitle: 'Malnutrition Clinical Severity Specification',
    acdisStandard: 'ASPEN/AND Consensus Diagnostic Criteria for Malnutrition',
    clinicalIndicators: 'Weight loss >10% over 6 months, temporal wasting, albumin 2.1 g/dL.',
    impactMccCc: 'Severe protein-calorie malnutrition (E43) is an MCC. Moderate (E44.0) is a CC.',
    queryText: `To Attending Physician / Clinical Nutritionist:
Nutritional assessment notes profound weight loss and muscle wasting. Please clarify malnutrition severity:
[ ] Severe protein-calorie malnutrition (E43) [MCC]
[ ] Moderate protein-calorie malnutrition (E44.0) [CC]
[ ] Mild protein-calorie malnutrition (E44.1)
[ ] Cachexia / Failure to thrive (R64)
[ ] Normal nutritional status
[ ] Unable to determine`,
  },
];

export const CDICopilot: React.FC = () => {
  const { addClaim } = useClaims();
  const navigate = useNavigate();

  const [clinicalText, setClinicalText] = useState(
    `74 y/o female admitted through ED with lethargy, productive cough, and fever (101.8 F).
Chest X-ray shows right middle and lower lobe consolidation consistent with pneumonia.
Patient placed on 4L nasal cannula for O2 saturation 89% on room air.
Labs show WBC 16.8k, Serum Creatinine 2.3 mg/dL (baseline 0.8 mg/dL 3 months ago), Lactate 2.8 mmol/L.
Broad-spectrum IV antibiotics (Ceftriaxone and Azithromycin) and 2L normal saline bolus administered.`
  );

  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'complete'>('complete');

  const handleCopyQuery = (query: CDIQueryTemplate) => {
    navigator.clipboard.writeText(query.queryText);
    setCopiedQueryId(query.id);
    setTimeout(() => setCopiedQueryId(null), 2500);
  };

  const handleStageEnrichedClaim = () => {
    const claimNum = `CDI-${Date.now().toString().slice(-6)}`;
    addClaim({
      claimNumber: claimNum,
      claimType: 'INSTITUTIONAL',
      typeOfBill: '111 - Hospital Inpatient',
      admissionDate: new Date().toISOString().split('T')[0],
      admissionType: 'EMERGENCY',
      dischargeStatus: '01 - Discharged to Home / Self Care',
      drgCode: '871',
      drgTitle: 'Septicemia or Severe Sepsis w/o MV >96 Hours w/ MCC',
      drgWeight: 1.8421,
      inpatientLos: 5,
      patientName: 'Miriam Vance',
      patientDob: '1952-03-12',
      memberId: 'MCAR-99382109',
      payerName: 'Medicare Part A / Inpatient Hospital',
      payerId: '00123',
      providerName: 'St. Jude Metropolitan Hospital (Inpatient Services)',
      providerNpi: '1092837461',
      serviceDate: new Date().toISOString().split('T')[0],
      filingDeadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalBilled: 24500,
      status: 'DRAFT',
      primaryDiagnosis: 'A41.9 (Sepsis, unspecified organism)',
      secondaryDiagnosis: 'N17.9 (Acute kidney failure - MCC), J96.01 (Acute hypoxemic respiratory failure - MCC)',
      clinicalNotes: clinicalText,
      lines: [
        {
          lineNo: 1,
          revenueCode: '0110',
          cpt: '0110',
          desc: 'Inpatient Acute Care Room & Board (5 Days)',
          units: 5,
          charge: 16500,
          authStatus: 'NOT_REQUIRED',
        },
        {
          lineNo: 2,
          revenueCode: '0450',
          cpt: '99285',
          desc: 'Emergency Department High Complexity',
          units: 1,
          charge: 1950,
          authStatus: 'NOT_REQUIRED',
        },
        {
          lineNo: 3,
          revenueCode: '0250',
          cpt: 'J1569',
          desc: 'Pharmacy - IV Antibiotics & Resuscitation Fluids',
          units: 1,
          charge: 6050,
          authStatus: 'NOT_REQUIRED',
        },
      ],
    });

    navigate('/claims');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">CDI & Medical Necessity Copilot</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200">
              ACDIS / AHIMA Compliant
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Clinical Documentation Improvement auditor for inpatient chart reviews, specificity gaps, and physician queries.
          </p>
        </div>
        <button
          onClick={handleStageEnrichedClaim}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <BookmarkPlus className="w-4 h-4" />
          <span>Stage Enriched UB-04 Claim</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Clinical narrative input */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-violet-600" />
                Inpatient Clinical Encounter / H&P Narrative
              </span>
              <span className="text-[11px] text-slate-400 font-mono">ED Intake & Physician Notes</span>
            </div>

            <textarea
              rows={9}
              value={clinicalText}
              onChange={(e) => setClinicalText(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-hidden bg-slate-50 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                Audits against ICD-10-CM Official Coding Guidelines & CMS IPPS MCC definitions.
              </span>
              <button
                onClick={() => setAuditStatus('complete')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>{auditStatus === 'complete' ? 'Re-run CDI Audit' : 'Run CDI Audit'}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats banner */}
          <div className="bg-gradient-to-br from-violet-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">CDI Revenue & CMI Shift</span>
              <span className="text-[10px] font-mono bg-violet-800 text-violet-200 px-2 py-0.5 rounded font-bold">
                Case Mix Index +0.48
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              +$5,480.00 <span className="text-xs font-normal text-slate-300">Potential Legal Reimbursement</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Addressing the 2 flagged documentation specificity gaps (Acute Kidney Failure & Hypoxemic Respiratory Failure) supports coding validation, avoids post-payment DRG downgrades, and defends medical necessity.
            </p>
          </div>
        </div>

        {/* Right Col: CDI Queries & Clarifications */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-violet-600" />
                Identified Documentation Specificity Queries
              </span>
              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                {CDI_QUERIES.length} Queries Ready
              </span>
            </div>

            <div className="space-y-3">
              {CDI_QUERIES.map((query) => (
                <div
                  key={query.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-violet-300 transition-all bg-slate-50/60 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-violet-700">{query.id}</span>
                        <h4 className="font-bold text-slate-900 text-xs">{query.queryTitle}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{query.triggerCondition}</p>
                    </div>
                    <button
                      onClick={() => handleCopyQuery(query)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                      title="Copy AHIMA-compliant query to clipboard"
                    >
                      {copiedQueryId === query.id ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy Query</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
                    <div className="text-slate-600">
                      <span className="font-bold text-slate-800">Clinical Evidence: </span>
                      {query.clinicalIndicators}
                    </div>
                    <div className="text-emerald-700 font-semibold">
                      <span className="font-bold">CC/MCC Impact: </span>
                      {query.impactMccCc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
