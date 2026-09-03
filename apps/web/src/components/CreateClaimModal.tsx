import React, { useState } from 'react';
import { X, Plus, Trash2, ShieldCheck, AlertCircle, Building2, User } from 'lucide-react';
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

  const [claimType, setClaimType] = useState<'PROFESSIONAL' | 'INSTITUTIONAL'>('PROFESSIONAL');
  const [claimNumber, setClaimNumber] = useState(
    () => `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [typeOfBill, setTypeOfBill] = useState('111 - Hospital Inpatient');
  const [admissionDate, setAdmissionDate] = useState(
    () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [admissionType, setAdmissionType] = useState<'EMERGENCY' | 'URGENT' | 'ELECTIVE' | 'TRAUMA'>('EMERGENCY');
  const [dischargeStatus, setDischargeStatus] = useState('01 - Discharged to Home / Self Care');
  const [drgCode, setDrgCode] = useState('871');
  const [drgTitle, setDrgTitle] = useState('Septicemia or Severe Sepsis w/o MV >96 Hours w/ MCC');
  const [drgWeight, setDrgWeight] = useState(1.8421);
  const [patientName, setPatientName] = useState(prefill?.patientName || '');
  const [patientDob, setPatientDob] = useState(prefill?.patientDob || '1982-06-14');
  const [memberId, setMemberId] = useState(prefill?.memberId || '');
  const [payerName, setPayerName] = useState(prefill?.payerName || 'Blue Cross Blue Shield');
  const [customPayer, setCustomPayer] = useState('');
  const [providerName, setProviderName] = useState(
    'Dr. Marcus Vance, MD (Specialty Clinic)'
  );
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

  const handleClaimTypeChange = (type: 'PROFESSIONAL' | 'INSTITUTIONAL') => {
    setClaimType(type);
    if (type === 'INSTITUTIONAL') {
      setProviderName('St. Jude Metropolitan Hospital (Main Campus)');
      setPrimaryDiagnosis('A41.9 (Sepsis, unspecified organism)');
      setSecondaryDiagnosis('N17.9 (Acute kidney failure, unspecified)');
      setLines([
        {
          lineNo: 1,
          revenueCode: '0450',
          cpt: '99285',
          desc: 'Emergency Room Visit - High Severity',
          units: 1,
          charge: 1450,
          authStatus: 'NOT_REQUIRED',
        },
        {
          lineNo: 2,
          revenueCode: '0110',
          cpt: '0110',
          desc: 'Inpatient Room & Board - Intensive Care Unit (ICU)',
          units: 3,
          charge: 4800,
          authStatus: 'NOT_REQUIRED',
        },
        {
          lineNo: 3,
          revenueCode: '0250',
          cpt: 'J1569',
          desc: 'Pharmacy - IV Antibiotics & Electrolytes',
          units: 1,
          charge: 920,
          authStatus: 'NOT_REQUIRED',
        },
      ]);
    } else {
      setProviderName('Dr. Marcus Vance, MD (Specialty Clinic)');
      setPrimaryDiagnosis('M54.5 (Low back pain)');
      setSecondaryDiagnosis('');
      setLines([
        {
          lineNo: 1,
          cpt: '99214',
          desc: 'Office visit, established patient, level 4',
          units: 1,
          charge: 400,
          authStatus: 'NOT_REQUIRED',
        },
      ]);
    }
  };

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        lineNo: prev.length + 1,
        revenueCode: claimType === 'INSTITUTIONAL' ? '0360' : undefined,
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
      claimType,
      typeOfBill: claimType === 'INSTITUTIONAL' ? typeOfBill : undefined,
      admissionDate: claimType === 'INSTITUTIONAL' ? admissionDate : undefined,
      admissionType: claimType === 'INSTITUTIONAL' ? admissionType : undefined,
      dischargeStatus: claimType === 'INSTITUTIONAL' ? dischargeStatus : undefined,
      drgCode: claimType === 'INSTITUTIONAL' ? drgCode : undefined,
      drgTitle: claimType === 'INSTITUTIONAL' ? drgTitle : undefined,
      drgWeight: claimType === 'INSTITUTIONAL' ? drgWeight : undefined,
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
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className={`p-2 text-white rounded-lg ${claimType === 'INSTITUTIONAL' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
              {claimType === 'INSTITUTIONAL' ? <Building2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {claimType === 'INSTITUTIONAL' ? 'Create Institutional Claim (UB-04 / CMS-1450)' : 'Create Professional Claim (CMS-1500)'}
              </h3>
              <p className="text-xs text-slate-500">
                {claimType === 'INSTITUTIONAL'
                  ? 'Hospital facility billing with Revenue Codes, Type of Bill (TOB), and MS-DRG grouping.'
                  : 'Physician and clinician outpatient billing with CPT/HCPCS and modifiers.'}
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

        {/* Claim Form Format Switcher */}
        <div className="px-6 pt-4 bg-white">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => handleClaimTypeChange('PROFESSIONAL')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                claimType === 'PROFESSIONAL'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              CMS-1500 Professional (Physician/Clinic)
            </button>
            <button
              type="button"
              onClick={() => handleClaimTypeChange('INSTITUTIONAL')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                claimType === 'INSTITUTIONAL'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              UB-04 Institutional (Hospital/Facility)
            </button>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto custom-scrollbar text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Institutional UB-04 Specific Fields */}
          {claimType === 'INSTITUTIONAL' && (
            <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  UB-04 Hospital Institutional Parameters
                </span>
                <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono font-bold">
                  CMS-1450 EDI 837I
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-indigo-900 font-semibold mb-1">Type of Bill (FL 04) *</label>
                  <select
                    value={typeOfBill}
                    onChange={(e) => setTypeOfBill(e.target.value)}
                    className="w-full p-2 border border-indigo-200 bg-white rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="111 - Hospital Inpatient">111 - Hospital Inpatient</option>
                    <option value="131 - Hospital Outpatient">131 - Hospital Outpatient</option>
                    <option value="831 - Ambulatory Surgery">831 - Ambulatory Surgery Center</option>
                    <option value="121 - Inpatient Part B">121 - Hospital Inpatient Part B</option>
                    <option value="141 - Outpatient Lab/Diag">141 - Hospital Non-Patient Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-indigo-900 font-semibold mb-1">Admission Date (FL 12)</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full p-2 border border-indigo-200 bg-white rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-indigo-900 font-semibold mb-1">Admission Type (FL 14)</label>
                  <select
                    value={admissionType}
                    onChange={(e) => setAdmissionType(e.target.value as any)}
                    className="w-full p-2 border border-indigo-200 bg-white rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="EMERGENCY">1 - Emergency</option>
                    <option value="URGENT">2 - Urgent</option>
                    <option value="ELECTIVE">3 - Elective</option>
                    <option value="TRAUMA">5 - Trauma Center</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-indigo-900 font-semibold mb-1">Discharge Status (FL 17)</label>
                  <select
                    value={dischargeStatus}
                    onChange={(e) => setDischargeStatus(e.target.value)}
                    className="w-full p-2 border border-indigo-200 bg-white rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="01 - Discharged to Home / Self Care">01 - Home / Self Care</option>
                    <option value="02 - Transferred to Acute Hospital">02 - Short-term General Hospital</option>
                    <option value="03 - Skilled Nursing Facility (SNF)">03 - Skilled Nursing Facility</option>
                    <option value="06 - Home Health Organization">06 - Home Health Agency</option>
                    <option value="20 - Expired">20 - Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-indigo-900 font-semibold mb-1">MS-DRG Code (Inpatient)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={drgCode}
                      onChange={(e) => setDrgCode(e.target.value)}
                      placeholder="e.g. 871, 470"
                      className="w-24 p-2 border border-indigo-200 bg-white rounded-lg font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <input
                      type="text"
                      value={drgTitle}
                      onChange={(e) => setDrgTitle(e.target.value)}
                      placeholder="DRG Title / Description"
                      className="flex-1 p-2 border border-indigo-200 bg-white rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-indigo-900 font-semibold mb-1">DRG Relative Weight</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={drgWeight}
                    onChange={(e) => setDrgWeight(parseFloat(e.target.value) || 1.0)}
                    className="w-full p-2 border border-indigo-200 bg-white rounded-lg font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
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
                <option value="Medicare Part A / Hospital">Medicare Part A (Inpatient)</option>
                <option value="Medicare Part B">Medicare Part B (Outpatient/Physician)</option>
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
                <label className="block font-bold text-slate-700 uppercase mb-1">Service / Discharge Date</label>
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
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {claimType === 'INSTITUTIONAL' ? 'Facility / Hospital Entity' : 'Rendering Provider'}
              </label>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {claimType === 'INSTITUTIONAL' ? 'Billing Hospital NPI' : 'Provider NPI (10 digits)'}
              </label>
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
              <label className="block font-bold text-slate-700 uppercase mb-1">Principal Diagnosis (ICD-10-CM) *</label>
              <input
                type="text"
                placeholder="e.g. A41.9 (Sepsis) or M54.5 (Low back pain)"
                value={primaryDiagnosis}
                onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Secondary Comorbidity (CC/MCC)</label>
              <input
                type="text"
                placeholder="e.g. N17.9 (Acute kidney failure) or E11.9 (Type 2 diabetes)"
                value={secondaryDiagnosis}
                onChange={(e) => setSecondaryDiagnosis(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Service Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider">
                {claimType === 'INSTITUTIONAL' ? 'Hospital Line Items (Rev Codes & HCPCS)' : 'Service Line Items (CPT / HCPCS)'}
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Service Line
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-1 text-center font-mono font-bold text-slate-500">
                    #{line.lineNo}
                  </div>

                  {claimType === 'INSTITUTIONAL' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Rev Code</label>
                      <input
                        type="text"
                        placeholder="0450"
                        value={line.revenueCode || ''}
                        onChange={(e) => handleLineChange(idx, 'revenueCode', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded font-mono font-semibold bg-white"
                      />
                    </div>
                  )}

                  <div className={claimType === 'INSTITUTIONAL' ? 'col-span-2' : 'col-span-3'}>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">CPT/HCPCS</label>
                    <input
                      type="text"
                      placeholder="99214"
                      value={line.cpt}
                      onChange={(e) => handleLineChange(idx, 'cpt', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded font-mono font-semibold bg-white"
                      required
                    />
                  </div>

                  <div className={claimType === 'INSTITUTIONAL' ? 'col-span-3' : 'col-span-4'}>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Description</label>
                    <input
                      type="text"
                      placeholder="Description"
                      value={line.desc}
                      onChange={(e) => handleLineChange(idx, 'desc', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white"
                      required
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Units</label>
                    <input
                      type="number"
                      min="1"
                      value={line.units}
                      onChange={(e) => handleLineChange(idx, 'units', parseInt(e.target.value) || 1)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-center"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Charge ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.charge}
                      onChange={(e) => handleLineChange(idx, 'charge', parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                      required
                    />
                  </div>

                  <div className="col-span-1 flex justify-center pt-3">
                    <button
                      type="button"
                      disabled={lines.length <= 1}
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <span className="font-bold text-slate-700 text-sm">
                Total Billed: <span className="text-blue-600 font-mono">${totalCalculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </span>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              {claimType === 'INSTITUTIONAL' ? 'Inpatient Clinical History & H&P Summary' : 'Clinical Encounter Notes / Pre-Op Documentation'}
            </label>
            <textarea
              rows={2}
              placeholder="Enter brief clinical history, vital signs, physical exam findings, or medical necessity rationale..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Actions */}
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
                className={`px-5 py-2 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none ${
                  claimType === 'INSTITUTIONAL'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{claimType === 'INSTITUTIONAL' ? 'Stage UB-04 Hospital Claim' : 'Save & Score Claim'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
