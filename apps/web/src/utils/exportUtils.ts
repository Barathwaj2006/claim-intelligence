import { ClaimItem } from '../context/ClaimContext';

export interface ReportKpi {
  label: string;
  value: string | number;
  subtext?: string;
}

export interface PdfReportData {
  title: string;
  subtitle: string;
  reportCategory: 'CLAIMS_QUEUE' | 'PAYER_ANALYTICS';
  generatedAt: string;
  kpis: ReportKpi[];
  tableHeaders: string[];
  tableAlignments?: ('left' | 'center' | 'right')[];
  tableRows: (string | number)[][];
  footerNotes?: string;
}

/**
 * Escapes and formats content to RFC 4180 compliant CSV string with UTF-8 BOM.
 */
export function generateCsvContent(
  headers: string[],
  rows: (string | number | undefined | null)[][]
): string {
  const escapeCell = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(','));
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Initiates an immediate client-side file download for CSV.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
): void {
  const content = generateCsvContent(headers, rows);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prepares CSV dataset from a collection of claims.
 */
export function exportClaimsToCsv(claims: ClaimItem[], filenamePrefix = 'claims_rcm_queue'): void {
  const headers = [
    'Claim Number',
    'Claim Format',
    'Patient Name',
    'Member ID',
    'Payer Organization',
    'Type of Bill',
    'DRG Code',
    'Primary Diagnosis (ICD-10)',
    'Primary CPT',
    'Date of Service',
    'Total Billed ($)',
    'Risk Score (0-100)',
    'Risk Level',
    'Lifecycle Status',
    'Identified Issues Count',
    'Created At',
  ];

  const rows = claims.map((c) => [
    c.claimNumber,
    c.claimType === 'INSTITUTIONAL' ? 'UB-04 (Institutional)' : 'CMS-1500 (Professional)',
    c.patientName,
    c.memberId,
    c.payerName,
    c.typeOfBill || 'N/A',
    c.drgCode || 'N/A',
    c.primaryDiagnosis,
    c.lines?.[0]?.cpt || 'N/A',
    c.serviceDate,
    c.totalBilled,
    c.riskScore,
    c.riskLevel,
    c.status,
    c.detectedIssues?.length || 0,
    c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A',
  ]);

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(`${filenamePrefix}_${timestamp}.csv`, headers, rows);
}

export interface PayerMetricExportItem {
  name: string;
  totalClaims: number;
  totalBilled: number;
  cleanClaims: number;
  highRiskClaims: number;
  cleanRate: string;
  denialPropensity: string;
  appealWinRate: number | null;
  appealsCount: number;
}

/**
 * Prepares CSV dataset from payer performance scorecard.
 */
export function exportAnalyticsToCsv(
  metrics: PayerMetricExportItem[],
  filenamePrefix = 'payer_analytics_scorecard'
): void {
  const headers = [
    'Payer Organization',
    'Staged Claims Count',
    'Total Billed Amount ($)',
    'Clean Claims Count',
    'Clean Claim Rate (%)',
    'High Risk Claims Count',
    'Denial Propensity (%)',
    'Appeals Logged',
    'Appeal Win Rate (%)',
  ];

  const rows = metrics.map((m) => [
    m.name,
    m.totalClaims,
    m.totalBilled.toFixed(2),
    m.cleanClaims,
    `${m.cleanRate}%`,
    m.highRiskClaims,
    `${m.denialPropensity}%`,
    m.appealsCount,
    m.appealWinRate !== null ? `${m.appealWinRate}%` : 'N/A',
  ]);

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(`${filenamePrefix}_${timestamp}.csv`, headers, rows);
}

/**
 * Triggers a high-resolution printable report suitable for saving as PDF via browser print.
 */
export function printHtmlReport(reportData: PdfReportData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // If pop-up is blocked, fall back to triggering print on the current window
    window.print();
    return;
  }

  const kpisHtml = reportData.kpis
    .map(
      (kpi) => `
      <div style="flex: 1; min-width: 130px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${kpi.label}</div>
        <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 3px; font-family: 'Courier New', monospace;">${kpi.value}</div>
        ${kpi.subtext ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${kpi.subtext}</div>` : ''}
      </div>
    `
    )
    .join('');

  const tableHeadersHtml = reportData.tableHeaders
    .map((header, idx) => {
      const align = reportData.tableAlignments?.[idx] || 'left';
      return `<th style="padding: 8px 10px; text-align: ${align}; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; background: #f1f5f9; text-transform: uppercase;">${header}</th>`;
    })
    .join('');

  const tableRowsHtml = reportData.tableRows
    .map(
      (row, rIdx) => `
      <tr style="background: ${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        ${row
          .map((cell, cIdx) => {
            const align = reportData.tableAlignments?.[cIdx] || 'left';
            return `<td style="padding: 7px 10px; text-align: ${align}; font-size: 11px; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${cell}</td>`;
          })
          .join('')}
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${reportData.title} - ${reportData.generatedAt}</title>
        <style>
          @page {
            size: letter landscape;
            margin: 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 14px;
            border-bottom: 2px solid #0284c7;
            margin-bottom: 16px;
          }
          .badge {
            display: inline-block;
            background: #0284c7;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
            margin: 3px 0 0 0;
          }
          .meta {
            text-align: right;
            font-size: 10px;
            color: #64748b;
          }
          .kpis-container {
            display: flex;
            gap: 12px;
            margin-bottom: 18px;
            flex-wrap: wrap;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .footer {
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            margin-top: 16px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; padding: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; font-weight: 600; color: #1e40af;">Executive PDF Report Preview</span>
          <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
        </div>

        <div class="header">
          <div>
            <div class="badge">U.S. Healthcare Claim Intelligence Platform</div>
            <h1 class="title">${reportData.title}</h1>
            <p class="subtitle">${reportData.subtitle}</p>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${reportData.generatedAt}</div>
            <div><strong>Report Type:</strong> Official RCM Audit</div>
            <div><strong>Confidentiality:</strong> Synthetic / HIPAA Safe</div>
          </div>
        </div>

        ${reportData.kpis.length > 0 ? `<div class="kpis-container">${kpisHtml}</div>` : ''}

        <table>
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>${reportData.footerNotes || 'Generated deterministically by the U.S. Healthcare Claim Intelligence Platform. Validated against HIPAA ANSI X12 5010 & CMS standards.'}</div>
          <div>Page 1 of 1 • System Audit Ledger</div>
        </div>

        <script>
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.print();
            }, 300);
          });
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
