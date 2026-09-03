import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Send,
  Zap,
  FileCheck2,
  Search,
} from 'lucide-react';
import { useClaims, PriorAuthRequest } from '../context/ClaimContext';

export const PriorAuthorization: React.FC = () => {
  const { priorAuths, addPriorAuthRequest } = useClaims();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [patientName, setPatientName] = useState('Eleanor Vance');
  const [patientDob, setPatientDob] = useState('1982-06-14');
  const [memberId, setMemberId] = useState('BCBS-88391204');
  const [payerName, setPayerName] = useState('Blue Cross Blue Shield');
  const [procedureCode, setProcedureCode] = useState('72148');
  const [procedureDesc, setProcedureDesc] = useState('MRI Lumbar Spine without contrast');
  const [diagnosisCode, setDiagnosisCode] = useState('M54.5 (Low back pain intractable)');
  const [requestingPhysician, setRequestingPhysician] = useState('Dr. Marcus Vance, MD (Specialty Clinic)');
  const [physicianNpi, setPhysicianNpi] = useState('1982736450');
  const [urgency, setUrgency] = useState<'STANDARD' | 'EXPEDITED'>('EXPEDITED');
  const [clinicalNotes, setClinicalNotes] = useState(
    'Patient with progressive lumbar radiculopathy failing conservative physical therapy and NSAIDs for >6 weeks. Bilateral sensory deficit L5-S1 distribution.'
  );

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !procedureCode.trim()) return;

    addPriorAuthRequest({
      patientName: patientName.trim(),
      patientDob,
      memberId: memberId.trim(),
      payerName,
      payerId: '00123',
      cptCode: procedureCode.trim(),
      procedureCode: procedureCode.trim(),
      cptDesc: procedureDesc.trim(),
      procedureDesc: procedureDesc.trim(),
      diagnosisCode: diagnosisCode.trim(),
      requestingPhysician: requestingPhysician.trim(),
      physicianNpi: physicianNpi.trim(),
      urgency,
      status: 'APPROVED',
      turnaroundMandate: urgency === 'EXPEDITED' ? '72_HOURS' : '7_CALENDAR_DAYS',
      clinicalRationale: clinicalNotes.trim(),
      criteriaChecklist: [
        { id: '1', label: 'Conservative physical therapy failure documented (>6 weeks)', satisfied: true },
        { id: '2', label: 'Objective neurological deficit (L5-S1 radiculopathy)', satisfied: true },
        { id: '3', label: 'Clinical rationale verified by board-certified specialist', satisfied: true },
      ],
    });

    setIsModalOpen(false);
  };

  const filteredAuths = priorAuths.filter((auth: PriorAuthRequest) => {
    const matchesStatus = statusFilter === 'ALL' || auth.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const code = (auth.procedureCode || auth.cptCode || '').toLowerCase();
    const matchesQuery =
      !query ||
      auth.authNumber.toLowerCase().includes(query) ||
      auth.patientName.toLowerCase().includes(query) ||
      auth.memberId.toLowerCase().includes(query) ||
      code.includes(query) ||
      auth.payerName.toLowerCase().includes(query);

    return matchesStatus && matchesQuery;
  });

  const totalApproved = priorAuths.filter((a) => a.status === 'APPROVED').length;
  const totalPending = priorAuths.filter((a) => a.status === 'IN_REVIEW' || a.status === 'ADDITIONAL_INFO_REQUIRED').length;
  const totalDenied = priorAuths.filter((a) => a.status === 'DENIED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">CMS-0057-F Prior Authorization</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              HL7 DaVinci FHIR PAS
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automate electronic Prior Authorization Support (PAS), Coverage Requirements Discovery (CRD), and Documentation Templates (DTR).
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New FHIR PA Request</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Active / Approved Auths</span>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
              {totalApproved}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold">Pre-authorized & ready for billing</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">In-Review / Pending SLA</span>
            <div className="text-2xl font-black text-amber-600 font-mono mt-1">
              {totalPending}
            </div>
            <span className="text-[11px] text-amber-700 font-semibold">CMS 72h / 7d SLA compliant</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Denied Requests</span>
            <div className="text-2xl font-black text-rose-600 font-mono mt-1">
              {totalDenied}
            </div>
            <span className="text-[11px] text-rose-700 font-semibold">Eligible for Peer-to-Peer Review</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Prior Auth Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              {['ALL', 'APPROVED', 'PENDING', 'DENIED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search auth #, patient, CPT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {filteredAuths.length} Prior Authorization Records
          </div>
        </div>

        {filteredAuths.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Prior Authorization Requests</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Submit a new CMS-0057-F electronic prior authorization request to obtain pre-approval before providing high-cost services.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Initiate First PA Request
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Auth Number</th>
                  <th className="py-3 px-4">Patient / Member ID</th>
                  <th className="py-3 px-4">Payer</th>
                  <th className="py-3 px-4">Procedure Code (CPT)</th>
                  <th className="py-3 px-4">Urgency & SLA</th>
                  <th className="py-3 px-4 text-center">Decision Status</th>
                  <th className="py-3 px-4">Validity Window</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuths.map((auth: PriorAuthRequest) => (
                  <tr key={auth.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-blue-600">{auth.authNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Req: {auth.submissionDate || auth.requestedAt?.split('T')[0]}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{auth.patientName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{auth.memberId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{auth.payerName}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{auth.procedureCode || auth.cptCode}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-[200px]" title={auth.procedureDesc || auth.cptDesc}>
                        {auth.procedureDesc || auth.cptDesc}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                          auth.urgency === 'EXPEDITED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {auth.urgency === 'EXPEDITED' ? 'Expedited (72h SLA)' : 'Standard (7-Day)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                          auth.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : auth.status === 'DENIED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {auth.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {(auth.validUntil || auth.validThrough) ? `Exp: ${auth.validUntil || auth.validThrough}` : 'Pending Response'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(auth.authNumber);
                          alert(`Copied Prior Auth ${auth.authNumber} to clipboard! You can paste this in your claim service line.`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition-colors"
                      >
                        Copy Auth #
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Initiate Electronic Prior Auth (FHIR PAS)</h3>
                  <p className="text-xs text-slate-500">Submits to payer FHIR endpoint with instant clinical evaluation.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={patientDob}
                    onChange={(e) => setPatientDob(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Member / Subscriber ID *</label>
                  <input
                    type="text"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Requesting Physician</label>
                  <input
                    type="text"
                    value={requestingPhysician}
                    onChange={(e) => setRequestingPhysician(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Physician NPI</label>
                  <input
                    type="text"
                    value={physicianNpi}
                    onChange={(e) => setPhysicianNpi(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Target Payer *</label>
                  <select
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold bg-white"
                  >
                    <option value="Blue Cross Blue Shield">Blue Cross Blue Shield</option>
                    <option value="UnitedHealthcare">UnitedHealthcare</option>
                    <option value="Aetna Health">Aetna Health</option>
                    <option value="Cigna Commercial">Cigna Commercial</option>
                    <option value="Medicare Advantage">Medicare Advantage (Part C)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Urgency SLA</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold bg-white"
                  >
                    <option value="EXPEDITED">Expedited (Urgent Clinical - 72hr SLA)</option>
                    <option value="STANDARD">Standard (Elective - 7 Calendar Days)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 uppercase mb-1">CPT / HCPCS *</label>
                  <input
                    type="text"
                    value={procedureCode}
                    onChange={(e) => setProcedureCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-blue-600"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Procedure Description *</label>
                  <input
                    type="text"
                    value={procedureDesc}
                    onChange={(e) => setProcedureDesc(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Primary Clinical Indication (ICD-10) *</label>
                <input
                  type="text"
                  value={diagnosisCode}
                  onChange={(e) => setDiagnosisCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Clinical Documentation / Evidence (DTR Questionnaire)</label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit FHIR $submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
