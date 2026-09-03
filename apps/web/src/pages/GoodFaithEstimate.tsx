import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Search,
  Scale,
} from 'lucide-react';
import { useClaims, GoodFaithEstimate as GFEItem } from '../context/ClaimContext';

export const GoodFaithEstimatePage: React.FC = () => {
  const { goodFaithEstimates: estimates, addGoodFaithEstimate } = useClaims();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGFE, setSelectedGFE] = useState<GFEItem | null>(null);

  // Form states
  const [patientName, setPatientName] = useState('Jonathan Reynolds');
  const [patientDob, setPatientDob] = useState('1978-11-23');
  const [serviceDescription, setServiceDescription] = useState('Total Knee Arthroplasty (Outpatient)');
  const [primaryCpt, setPrimaryCpt] = useState('27447');
  const [serviceDate, setServiceDate] = useState(
    () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [facilityFee, setFacilityFee] = useState<number>(5800);
  const [professionalFee, setProfessionalFee] = useState<number>(2400);
  const [anesthesiaFee, setAnesthesiaFee] = useState<number>(950);
  const [pharmacyFee, setPharmacyFee] = useState<number>(450);

  const totalCalculated = facilityFee + professionalFee + anesthesiaFee + pharmacyFee;

  const handleCreateGFE = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    addGoodFaithEstimate({
      patientName: patientName.trim(),
      patientDob,
      serviceDescription: serviceDescription.trim(),
      primaryCpt: primaryCpt.trim(),
      scheduledDate: serviceDate,
      items: [
        { desc: 'Ambulatory Surgery Center / Facility Operating Room Fee', cpt: '27447', charge: facilityFee },
        { desc: 'Orthopedic Surgeon Professional Service', cpt: '27447', charge: professionalFee },
        { desc: 'Anesthesiology Care & Monitoring', cpt: '01402', charge: anesthesiaFee },
        { desc: 'Pharmacy, Implants, & Post-Op Recovery Medications', cpt: 'J-Codes', charge: pharmacyFee },
      ],
      totalEstimate: totalCalculated,
      disputeThreshold: totalCalculated + 400,
    });

    setIsModalOpen(false);
  };

  const filteredEstimates = estimates.filter((e: GFEItem) => {
    const query = searchQuery.toLowerCase().trim();
    const serviceDesc = (e.serviceDescription || e.procedureDesc || '').toLowerCase();
    return (
      !query ||
      e.gfeNumber.toLowerCase().includes(query) ||
      e.patientName.toLowerCase().includes(query) ||
      serviceDesc.includes(query) ||
      e.primaryCpt.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Good Faith Estimate (GFE) & Price Transparency</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
              No Surprises Act 45 CFR § 149.610
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Generate federally compliant itemized cost estimates for self-pay and uninsured patients with Selected Dispute Resolution (SDR) thresholds.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Good Faith Estimate</span>
        </button>
      </div>

      {/* Compliance Information Banner */}
      <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-xl flex items-start gap-3">
        <Scale className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 leading-relaxed">
          <span className="font-bold">Federal Patient Rights Under the No Surprises Act:</span> If the final billed charges exceed this Good Faith Estimate by <span className="font-bold underline">$400 or more</span>, the patient is legally entitled to initiate the federal Selected Dispute Resolution (SDR) process against the healthcare facility or provider.
        </div>
      </div>

      {/* Estimates Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search estimate #, patient, service, CPT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {filteredEstimates.length} Published Estimates
          </div>
        </div>

        {filteredEstimates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Good Faith Estimates Issued</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Issue an itemized estimate for an upcoming scheduled or requested self-pay elective procedure to comply with federal price transparency rules.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Issue First Estimate
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">GFE Number</th>
                  <th className="py-3 px-4">Patient Demographics</th>
                  <th className="py-3 px-4">Procedure & Service</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4 text-right">Estimated Total</th>
                  <th className="py-3 px-4 text-right">SDR Dispute Ceiling</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEstimates.map((gfe: GFEItem) => (
                  <tr key={gfe.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {gfe.gfeNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{gfe.patientName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">DOB: {gfe.patientDob}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{gfe.serviceDescription || gfe.procedureDesc}</div>
                      <div className="font-mono text-slate-500 text-[11px]">CPT: {gfe.primaryCpt}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {gfe.scheduledDate || gfe.serviceDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      ${(gfe.totalEstimate || gfe.totalGrossCharges || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      ${(gfe.disputeThreshold || (gfe.totalEstimate || 0) + 400).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedGFE(gfe)}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold text-[11px] transition-colors"
                      >
                        Print / View GFE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View GFE Modal */}
      {selectedGFE && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden text-xs">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <span className="font-bold text-slate-900 text-sm">
                  Official Patient Good Faith Estimate
                </span>
              </div>
              <button
                onClick={() => setSelectedGFE(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Document body */}
            <div className="p-6 space-y-5 print:p-0">
              <div className="border-b border-slate-200 pb-4 flex justify-between">
                <div>
                  <h4 className="font-black text-base text-slate-900 uppercase tracking-tight">
                    St. Jude Metropolitan Hospital & Clinic
                  </h4>
                  <p className="text-slate-500 text-[11px]">100 Hospital Drive, Medical District • NPI: 1092837461</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Document #</span>
                  <span className="font-mono font-bold text-teal-700 text-sm">{selectedGFE.gfeNumber}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedGFE.patientName}</span>
                  <span className="text-slate-500 block text-[11px]">DOB: {selectedGFE.patientDob}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Scheduled Service Date</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedGFE.scheduledDate || selectedGFE.serviceDate}</span>
                  <span className="text-slate-500 block text-[11px]">Primary Code: {selectedGFE.primaryCpt}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <span className="font-bold text-slate-800 uppercase block mb-2">Itemized Estimate of Expected Charges</span>
                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">Service Description</th>
                      <th className="py-2 px-3">Service Code</th>
                      <th className="py-2 px-3 text-right">Expected Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedGFE.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-800">{it.desc || it.description}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{it.cpt || it.code}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ${(it.charge || it.standardCharge || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-300">
                      <td colSpan={2} className="py-2 px-3 text-slate-900">Total Estimated Out-Of-Pocket Charges</td>
                      <td className="py-2 px-3 text-right font-mono font-black text-teal-700 text-sm">
                        ${(selectedGFE.totalEstimate || selectedGFE.totalGrossCharges || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Legal disclaimer */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <span className="font-bold block">Patient Notice Regarding Selected Dispute Resolution (SDR):</span>
                <p>
                  This Good Faith Estimate shows the costs of items and services that are reasonably expected for your health care needs. The estimate is based on information known at the time the estimate was created. If you are billed for more than this Good Faith Estimate by <span className="font-bold">$400 or more</span> (dispute threshold: <span className="font-bold font-mono">${(selectedGFE.disputeThreshold || (selectedGFE.totalEstimate || 0) + 400).toFixed(2)}</span>), you have the right to dispute the bill under federal law through the Department of Health and Human Services (HHS).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGFE(null)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl my-8 overflow-hidden text-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Generate Good Faith Estimate (GFE)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGFE} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Patient Name *</label>
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
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Procedure Description *</label>
                  <input
                    type="text"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Primary CPT *</label>
                  <input
                    type="text"
                    value={primaryCpt}
                    onChange={(e) => setPrimaryCpt(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-teal-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Scheduled Service Date</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Facility Fee ($)</label>
                  <input
                    type="number"
                    value={facilityFee}
                    onChange={(e) => setFacilityFee(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Surgeon Fee ($)</label>
                  <input
                    type="number"
                    value={professionalFee}
                    onChange={(e) => setProfessionalFee(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Anesthesia Fee ($)</label>
                  <input
                    type="number"
                    value={anesthesiaFee}
                    onChange={(e) => setAnesthesiaFee(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Pharmacy / Labs ($)</label>
                  <input
                    type="number"
                    value={pharmacyFee}
                    onChange={(e) => setPharmacyFee(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Total Expected Charge:</span>
                  <span className="text-lg font-black font-mono text-teal-700">
                    ${totalCalculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Publish Estimate
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const GoodFaithEstimate = GoodFaithEstimatePage;
