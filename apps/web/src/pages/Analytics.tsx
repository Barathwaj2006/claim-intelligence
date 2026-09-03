import React from 'react';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Building2,
  DollarSign,
  AlertCircle,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const payerBenchmarks = [
    {
      name: 'Blue Cross Blue Shield',
      totalClaims: 52,
      billedAmount: 184500.0,
      cleanRate: 89.2,
      avgDaysToPay: 14,
      denialRate: 10.8,
      appealWinRate: 78,
      topCARC: 'CO-16 (Typo / Info Missing)',
    },
    {
      name: 'UnitedHealthcare',
      totalClaims: 38,
      billedAmount: 142000.0,
      cleanRate: 79.4,
      avgDaysToPay: 21,
      denialRate: 20.6,
      appealWinRate: 64,
      topCARC: 'CO-197 (Missing Prior Auth)',
    },
    {
      name: 'Traditional Medicare Part B',
      totalClaims: 32,
      billedAmount: 68400.0,
      cleanRate: 94.1,
      avgDaysToPay: 12,
      denialRate: 5.9,
      appealWinRate: 85,
      topCARC: 'CO-29 (Timely Filing Limit)',
    },
    {
      name: 'Aetna Commercial',
      totalClaims: 20,
      billedAmount: 34000.0,
      cleanRate: 82.5,
      avgDaysToPay: 18,
      denialRate: 17.5,
      appealWinRate: 71,
      topCARC: 'CO-96 (Non-covered charge)',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Payer Intelligence &amp; RCM Performance Analytics
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Benchmarks Active
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Comparative payer performance, clean claim rates, adjudication turnarounds, denial propensity, and appeal recovery velocity.
        </p>
      </div>

      {/* Analytics KPI Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Overall Clean Claim Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">86.3%</div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <span>+4.2%</span> vs regional provider benchmark
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Avg Time to Adjudication</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">16.2 Days</div>
          <div className="mt-1 text-xs text-blue-600 font-semibold flex items-center gap-1">
            <span>-3.5 Days</span> with pre-submission verification
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>First-Pass Denial Rate</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">13.7%</div>
          <div className="mt-1 text-xs text-amber-600 font-semibold flex items-center gap-1">
            <span>Target &lt; 10%</span> post-rule engine
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Appeal Win Rate</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700">74.5%</div>
          <div className="mt-1 text-xs text-slate-500">Across 32 reconsidered claims</div>
        </div>
      </div>

      {/* Payer Performance Scorecard */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">U.S. Payer Scorecard &amp; Adjudication Metrics</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Q3 2026 Telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Payer Organization</th>
                <th className="py-3.5 px-4 text-center">Volume</th>
                <th className="py-3.5 px-4 text-right">Total Billed</th>
                <th className="py-3.5 px-4 text-center">Clean Claim Rate</th>
                <th className="py-3.5 px-4 text-center">Avg Turnaround</th>
                <th className="py-3.5 px-4 text-center">Denial Propensity</th>
                <th className="py-3.5 px-4 text-center">Appeal Win Velocity</th>
                <th className="py-3.5 px-4">Top Risk Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payerBenchmarks.map((payer) => (
                <tr key={payer.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    {payer.name}
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-slate-800">{payer.totalClaims}</td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                    ${payer.billedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {payer.cleanRate}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-medium text-slate-700">
                    {payer.avgDaysToPay} days
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        payer.denialRate > 15
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {payer.denialRate}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {payer.appealWinRate}% Won
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-mono text-[11px]">{payer.topCARC}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RCM Pipeline Health Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Pre-Submission Error Breakdown</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Distribution of issues captured before claim submission to clearinghouse.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Prior Authorization Missing / Expired</span>
                <span className="text-slate-900 font-bold">41% ($28.4k)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '41%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">Member Eligibility / Coverage Terminated</span>
                <span className="text-slate-900 font-bold">25% ($14.2k)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">NPI / Demographic OCR Typo</span>
                <span className="text-slate-900 font-bold">22% ($15.7k)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '22%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700">ICD-10 / CPT Medical Necessity Mismatch</span>
                <span className="text-slate-900 font-bold">12% ($6.8k)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Revenue Recovery Impact Summary</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Financial impact of automated risk detection and 1-click auto-corrections.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="text-slate-500 font-medium">Prevented Denials</div>
                <div className="text-lg font-bold text-emerald-700 mt-1">$42,100.00</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">38 claims auto-fixed</div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="text-slate-500 font-medium">Recovered via Appeals</div>
                <div className="text-lg font-bold text-blue-700 mt-1">$34,200.00</div>
                <div className="text-[11px] text-blue-600 mt-0.5">8 appeals won</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Net Revenue Protected: <strong className="text-slate-900">$76,300.00</strong></span>
            <span className="text-emerald-600 font-semibold">&uarr; 18.4% ROI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
