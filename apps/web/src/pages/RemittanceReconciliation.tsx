import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  RefreshCw,
  Search,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { useClaims, RemittanceItem } from '../context/ClaimContext';
import { Link } from 'react-router-dom';

const SAMPLE_835_EDI = `ISA*00*          *00*          *ZZ*BCBSERA        *ZZ*HOSPITAL123    *260401*1430*U*00501*000000001*0*P*>~
GS*HP*BCBSERA*HOSPITAL123*20260401*1430*1*X*005010X221A1~
ST*835*0001~
BPR*I*12850.00*C*ACH*CTX*01*121000358*DA*9876543210*1982736450**01*044000037*DA*123456789*20260401~
TRN*1*1092837465*1982736450~
N1*PR*BLUE CROSS BLUE SHIELD~
N1*PE*ST JUDE METROPOLITAN HOSPITAL*XX*1982736450~
CLP*CLM-2026-88124*1*14200.00*12850.00*0.00*MB*BCBS-88391204*11*1~
CAS*CO*45*1350.00~
SVC*HC:99285*1850.00*1500.00**1~
CAS*CO*45*350.00~
SVC*HC:0110*12350.00*11350.00**3~
CAS*CO*45*1000.00~
SE*14*0001~
GE*1*1~
IEA*1*000000001~`;

const SAMPLE_835_JSON = JSON.stringify(
  [
    {
      claimNumber: 'CLM-2026-94112',
      patientName: 'Eleanor Vance',
      payerName: 'UnitedHealthcare',
      checkNumber: 'CHK-994821',
      paymentDate: '2026-04-02',
      totalBilled: 3200,
      paidAmount: 2450,
      contractualAdjustment: 600,
      patientResponsibility: 150,
      status: 'PAID',
      carcCode: '45',
      carcDesc: 'Charge exceeds fee schedule/maximum allowable amount (Contractual obligation)',
      rarcCode: 'N202',
      lines: [
        {
          lineNo: 1,
          cpt: '99214',
          billed: 400,
          paid: 280,
          adjustment: 120,
          carc: '45',
        },
        {
          lineNo: 2,
          cpt: '72148',
          billed: 2800,
          paid: 2170,
          adjustment: 480,
          carc: '45',
        },
      ],
    },
    {
      claimNumber: 'CLM-2026-10294',
      patientName: 'Marcus Holloway',
      payerName: 'Aetna Health',
      checkNumber: 'EFT-883912',
      paymentDate: '2026-04-03',
      totalBilled: 1850,
      paidAmount: 0,
      contractualAdjustment: 0,
      patientResponsibility: 0,
      status: 'DENIED',
      carcCode: '197',
      carcDesc: 'Precertification/authorization/notification/pre-treatment absent or denied.',
      rarcCode: 'N382',
    },
  ],
  null,
  2
);

export const RemittanceReconciliation: React.FC = () => {
  const { remittances, ingest835Remittance, claims } = useClaims();
  const [rawPayload, setRawPayload] = useState<string>('');
  const [inputFormat, setInputFormat] = useState<'EDI' | 'JSON'>('EDI');
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleLoadSample = (type: 'EDI' | 'JSON') => {
    setInputFormat(type);
    setRawPayload(type === 'EDI' ? SAMPLE_835_EDI : SAMPLE_835_JSON);
  };

  const handleProcessRemittance = () => {
    if (!rawPayload.trim()) return;

    try {
      if (inputFormat === 'JSON') {
        const parsed = JSON.parse(rawPayload);
        const count = ingest835Remittance(parsed);
        setIngestStatus(`Successfully ingested & reconciled ${count} electronic remittances.`);
      } else {
        const count = ingest835Remittance(rawPayload);
        setIngestStatus(`Successfully parsed EDI 835 format and auto-reconciled ${count} claim remittance items!`);
      }
      setRawPayload('');
    } catch (err: any) {
      setIngestStatus(`Parsing error: ${err.message || 'Invalid format'}`);
    }
  };

  const filteredRemittances = remittances.filter((rem) => {
    const matchesStatus = statusFilter === 'ALL' || rem.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      rem.claimNumber.toLowerCase().includes(query) ||
      rem.patientName.toLowerCase().includes(query) ||
      rem.payerName.toLowerCase().includes(query) ||
      (rem.carcCode && rem.carcCode.toLowerCase().includes(query));

    return matchesStatus && matchesQuery;
  });

  const totalPaid = remittances.reduce((s, r: RemittanceItem) => s + (r.paidAmount ?? r.paymentAmount ?? 0), 0);
  const totalAdjusted = remittances.reduce((s, r: RemittanceItem) => s + (r.contractualAdjustment ?? 0), 0);
  const totalPatientResp = remittances.reduce((s, r: RemittanceItem) => s + (r.patientResponsibility ?? 0), 0);
  const totalDenials = remittances.filter((r: RemittanceItem) => r.status === 'DENIED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">835 ERA Ingestion & Reconciliation</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              HIPAA EDI 835 X12
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automate electronic remittance advice posting, CARC/RARC denial reason code parsing, and ledger balancing.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Paid Remittances</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">
            ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Settled via ACH / Check
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Contractual Adjustments</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">
            ${totalAdjusted.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            CARC Group CO (Contractual)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Patient Responsibility</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">
            ${totalPatientResp.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">
            Co-pay, Co-insurance, Deductible
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Zero-Pay / Denials</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-2">
            {totalDenials} <span className="text-xs font-normal text-slate-500">Items</span>
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            Actionable via Appeals / Recovery
          </div>
        </div>
      </div>

      {/* Ingestion Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              Ingest Electronic Remittance Advice (835 ERA)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste ASC X12N 835 (005010X221A1) EDI transaction segments or standard clearinghouse JSON payload.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLoadSample('EDI')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Load Sample 835 EDI
            </button>
            <button
              onClick={() => handleLoadSample('JSON')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Load Sample JSON
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={inputFormat === 'EDI'}
                onChange={() => setInputFormat('EDI')}
                className="text-blue-600"
              />
              Raw EDI 835 (X12 Segments: BPR, TRN, CLP, CAS, SVC)
            </label>
            <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={inputFormat === 'JSON'}
                onChange={() => setInputFormat('JSON')}
                className="text-blue-600"
              />
              Structured Clearinghouse JSON Array
            </label>
          </div>

          <textarea
            rows={5}
            value={rawPayload}
            onChange={(e) => setRawPayload(e.target.value)}
            placeholder={
              inputFormat === 'EDI'
                ? 'ISA*00*...~BPR*I*12850.00...~CLP*CLM-2026-88124*1*14200.00*12850.00...~CAS*CO*45*1350.00~...'
                : '[\n  {\n    "claimNumber": "CLM-2026-...",\n    "paidAmount": 1200,\n    ...\n  }\n]'
            }
            className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50"
          />

          <div className="flex items-center justify-between">
            {ingestStatus ? (
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{ingestStatus}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Matches claim CLP numbers to update internal ledger balances automatically.
              </span>
            )}
            <button
              onClick={handleProcessRemittance}
              disabled={!rawPayload.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Process & Reconcile ERA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Remittance Items Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              {['ALL', 'PAID', 'PARTIAL', 'DENIED'].map((st) => (
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
                placeholder="Search claim, check #, CARC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {filteredRemittances.length} Reconciled Remittance Advices
          </div>
        </div>

        {/* Table */}
        {filteredRemittances.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Remittance Items Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Paste an EDI 835 segment or load sample data above to inspect claim remittance adjustments and post payments.
            </p>
            <button
              onClick={() => handleLoadSample('EDI')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Load Sample 835 Batch
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Claim & Check #</th>
                  <th className="py-3 px-4">Patient / Payer</th>
                  <th className="py-3 px-4 text-right">Billed</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Adjustments</th>
                  <th className="py-3 px-4 text-center">CARC / Reason</th>
                  <th className="py-3 px-4 text-center">ERA Status</th>
                  <th className="py-3 px-4 text-center">Matched Claim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRemittances.map((item) => {
                  const matchedClaim = claims.find((c) => c.claimNumber === item.claimNumber);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-600">{item.claimNumber}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.checkNumber} • {item.paymentDate}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.patientName}</div>
                        <div className="text-[11px] text-slate-500">{item.payerName}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                        ${item.totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                        ${item.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        <div>CO: ${item.contractualAdjustment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        {item.patientResponsibility > 0 && (
                          <div className="text-[10px] text-purple-600">PR: ${item.patientResponsibility.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.carcCode ? (
                          <div className="max-w-[180px] mx-auto">
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                              CARC {item.carcCode}
                            </span>
                            {item.carcDesc && (
                              <div className="text-[10px] text-slate-500 truncate mt-0.5" title={item.carcDesc}>
                                {item.carcDesc}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'DENIED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {matchedClaim ? (
                          <Link
                            to={`/claims/${matchedClaim.id}`}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                          >
                            View Claim ({matchedClaim.status})
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-xs">Unmatched in Queue</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
