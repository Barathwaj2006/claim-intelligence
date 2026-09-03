import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { PdfReportData, printHtmlReport, downloadCsv } from '../utils/exportUtils';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: PdfReportData | null;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({ isOpen, onClose, reportData }) => {
  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    printHtmlReport(reportData);
  };

  const handleDownloadCsv = () => {
    const filename = `${reportData.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_export.csv`;
    downloadCsv(filename, reportData.tableHeaders, reportData.tableRows);
  };

  return (
    <div
      id="pdf-report-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="pdf-report-modal-container"
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Toolbar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Executive PDF Report Preview</h3>
              <p className="text-[11px] text-slate-400">
                Ready for printing or &ldquo;Save as PDF&rdquo; export via browser
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="pdf-modal-download-csv-btn"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              id="pdf-modal-print-btn"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              id="pdf-modal-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper View */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
          <div className="bg-white w-full max-w-4xl p-8 rounded-xl shadow-xs border border-slate-200 text-slate-900 space-y-6">
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start pb-4 border-b-2 border-blue-600 gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider rounded">
                  U.S. Healthcare Claim Intelligence Platform
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 mt-2">{reportData.title}</h1>
                <p className="text-xs text-slate-500 mt-0.5">{reportData.subtitle}</p>
              </div>
              <div className="text-right text-[11px] text-slate-500 space-y-0.5 font-mono">
                <div>
                  <span className="font-bold text-slate-700">Date:</span> {reportData.generatedAt}
                </div>
                <div>
                  <span className="font-bold text-slate-700">Audit Status:</span> Compliant
                </div>
                <div>
                  <span className="font-bold text-slate-700">Standard:</span> HIPAA 5010
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            {reportData.kpis.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {reportData.kpis.map((kpi, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      {kpi.label}
                    </span>
                    <span className="block text-lg font-black font-mono text-slate-900 mt-1">
                      {kpi.value}
                    </span>
                    {kpi.subtext && (
                      <span className="block text-[10px] text-slate-400 mt-0.5">{kpi.subtext}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    {reportData.tableHeaders.map((header, idx) => {
                      const align = reportData.tableAlignments?.[idx] || 'left';
                      return (
                        <th
                          key={idx}
                          className={`py-2.5 px-3 ${
                            align === 'right'
                              ? 'text-right'
                              : align === 'center'
                              ? 'text-center'
                              : 'text-left'
                          }`}
                        >
                          {header}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reportData.tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      {row.map((cell, cIdx) => {
                        const align = reportData.tableAlignments?.[cIdx] || 'left';
                        return (
                          <td
                            key={cIdx}
                            className={`py-2 px-3 text-slate-800 ${
                              align === 'right'
                                ? 'text-right font-mono'
                                : align === 'center'
                                ? 'text-center'
                                : 'text-left'
                            }`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {reportData.footerNotes ||
                    'Audited by deterministic rule engines conforming to CMS-1500, UB-04, and ANSI X12 5010.'}
                </span>
              </div>
              <div className="font-mono">Record Count: {reportData.tableRows.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
