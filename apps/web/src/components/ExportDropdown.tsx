import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Code } from 'lucide-react';

interface ExportDropdownProps {
  onExportCsv: () => void;
  onExportPdf: () => void;
  onExportJson?: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportCsv,
  onExportPdf,
  onExportJson,
  disabled = false,
  label = 'Export',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        id="export-dropdown-trigger-btn"
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <Download className="w-4 h-4 text-slate-500" />
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="export-dropdown-menu"
          className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Available Export Formats
          </div>

          <button
            id="export-csv-action-btn"
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExportCsv();
            }}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors group"
          >
            <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md group-hover:bg-emerald-100 transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">Export to CSV</div>
              <div className="text-[10px] text-slate-400">Spreadsheet table (.csv)</div>
            </div>
          </button>

          <button
            id="export-pdf-action-btn"
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExportPdf();
            }}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors group"
          >
            <div className="p-1 bg-rose-50 text-rose-600 rounded-md group-hover:bg-rose-100 transition-colors">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">Export to PDF</div>
              <div className="text-[10px] text-slate-400">Executive report (.pdf)</div>
            </div>
          </button>

          {onExportJson && (
            <button
              id="export-json-action-btn"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportJson();
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors group border-t border-slate-100 mt-1 pt-1.5"
            >
              <div className="p-1 bg-blue-50 text-blue-600 rounded-md group-hover:bg-blue-100 transition-colors">
                <Code className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Export Raw JSON</div>
                <div className="text-[10px] text-slate-400">Full schema backup (.json)</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
