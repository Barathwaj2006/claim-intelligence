import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useClaims } from '../context/ClaimContext';

interface ImportClaimsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportClaimsModal: React.FC<ImportClaimsModalProps> = ({ isOpen, onClose }) => {
  const { importClaims } = useClaims();
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setJsonText(text);
      } catch {
        setError('Failed to read uploaded file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setError(null);
    setSuccessCount(null);

    if (!jsonText.trim()) {
      setError('Please paste JSON data or select a JSON file.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const count = importClaims(list);
      if (count === 0) {
        setError('No valid claims found in JSON. Ensure items include claimNumber or patientName.');
      } else {
        setSuccessCount(count);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch {
      setError('Invalid JSON syntax. Please verify formatting.');
    }
  };

  const handleLoadSampleBatch = () => {
    const sampleBatch = [
      {
        claimNumber: 'CLM-2026-00101',
        patientName: 'Eleanor Vance',
        patientDob: '1989-11-23',
        memberId: 'BCBS-98231011',
        payerName: 'Blue Cross Blue Shield',
        providerName: 'Dr. Sarah Jenkins, MD',
        providerNpi: '1293847561',
        serviceDate: '2026-08-15',
        filingDeadline: '2026-11-15',
        status: 'READY_FOR_SUBMISSION',
        primaryDiagnosis: 'Z00.00 (General adult medical exam)',
        lines: [
          {
            lineNo: 1,
            cpt: '99213',
            desc: 'Office visit, established, level 3',
            units: 1,
            charge: 250,
            authStatus: 'NOT_REQUIRED',
          },
          {
            lineNo: 2,
            cpt: '36415',
            desc: 'Routine venipuncture',
            units: 1,
            charge: 45,
            authStatus: 'NOT_REQUIRED',
          },
        ],
      },
      {
        claimNumber: 'CLM-2026-00102',
        patientName: 'Marcus Thorne',
        patientDob: '1978-04-12',
        memberId: 'UHC-44912033',
        payerName: 'UnitedHealthcare (OCR typo)',
        providerName: 'Dr. Gregory House, MD',
        providerNpi: '1982736450',
        serviceDate: '2026-08-20',
        filingDeadline: '2026-11-20',
        status: 'DRAFT',
        primaryDiagnosis: 'M54.5 (Low Back Pain)',
        secondaryDiagnosis: 'M54.16 (Radiculopathy, lumbar)',
        lines: [
          {
            lineNo: 1,
            cpt: '72148',
            desc: 'MRI Lumbar Spine without contrast',
            units: 1,
            charge: 2800,
            authStatus: 'MISSING',
          },
          {
            lineNo: 2,
            cpt: '99214',
            desc: 'Office visit, established, level 4',
            units: 1,
            charge: 400,
            authStatus: 'NOT_REQUIRED',
          },
        ],
      },
    ];
    setJsonText(JSON.stringify(sampleBatch, null, 2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import Claims (JSON / EDI)</h3>
              <p className="text-xs text-slate-500">
                Upload or paste structured professional CMS-1500 claim records.
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

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Successfully imported {successCount} claim(s)! Updating queue...</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Select JSON File
            </label>
            <input
              type="file"
              accept=".json,.txt"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 uppercase">Or Paste Raw JSON</label>
              <button
                type="button"
                onClick={handleLoadSampleBatch}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" /> Load Sample Format Template
              </button>
            </div>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste JSON array of claim objects..."
              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
              type="button"
              onClick={handleImport}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import into Staging Queue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
