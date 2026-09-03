import React from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
  Clock,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Executive RCM Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time pre-submission claim intelligence, denial prevention, and risk telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/claims"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Review High-Risk Claims (16)</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Billed (M-T-D)
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">$428,900.00</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">+12.4%</span> vs last month
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Clean Claim Rate
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">84.5%</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">+6.2%</span> post-rule engine
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Revenue at Risk
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">$58,300.00</div>
            <div className="text-xs text-slate-500 mt-1">16 claims pending fix</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recovered Revenue
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">$34,200.00</div>
            <div className="text-xs text-slate-500 mt-1">8 appeals won this month</div>
          </div>
        </div>
      </div>

      {/* Risk Distribution & Top Denial Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-1">
          <h3 className="text-base font-bold text-slate-900 mb-4">Risk Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">Low Risk (0–29) - Clean Submission</span>
                <span className="text-slate-600">98 claims (69%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '69%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">Medium Risk (30–69) - Review Suggested</span>
                <span className="text-slate-600">28 claims (20%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700">High Risk (70–100) - Action Required</span>
                <span className="text-slate-600">16 claims (11%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: '11%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Refreshed 2 minutes ago against payer clearinghouse</span>
          </div>
        </div>

        {/* Top Denial Drivers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 mb-4">Top Projected Denial Causes (Pre-Submission)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">CARC Code</th>
                  <th className="py-2.5 px-3">Denial Description</th>
                  <th className="py-2.5 px-3 text-center">Claims</th>
                  <th className="py-2.5 px-3 text-right">Exposure</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-rose-600">CO-197</td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    Prior authorization absent (e.g. Lumbar MRI, Knee Arthroscopy)
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">9</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">$28,400.00</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold cursor-pointer hover:bg-blue-100">
                      Attach Auth
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-amber-600">CO-16</td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    Lacks info / Demographic typo (e.g. BlueShild OCR typo)
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">5</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">$14,200.00</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold cursor-pointer hover:bg-amber-100">
                      Auto-Correct
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-rose-600">CO-29</td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    Timely filing deadline expiring within 7 days
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">2</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">$15,700.00</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold cursor-pointer hover:bg-rose-100">
                      Expedite
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Claims Queue Snippet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Claims Queue</h3>
            <p className="text-xs text-slate-500">Claims staged for pre-submission intelligence scoring</p>
          </div>
          <Link
            to="/claims"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all 142 claims <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Claim #</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Payer</th>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4 text-right">Billed Amount</th>
                <th className="py-3 px-4 text-center">Risk Score</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-mono font-bold text-blue-600">CLM-2026-00102</td>
                <td className="py-3 px-4 font-medium text-slate-800">Marcus Thorne</td>
                <td className="py-3 px-4 text-slate-600">UnitedHealthcare</td>
                <td className="py-3 px-4 text-slate-600">2026-08-20</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">$3,200.00</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-700">
                    85 / 100
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    DRAFT
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link
                    to="/claims/clm-002"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-xs"
                  >
                    Inspect
                  </Link>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-mono font-bold text-blue-600">CLM-2026-00101</td>
                <td className="py-3 px-4 font-medium text-slate-800">Eleanor Vance</td>
                <td className="py-3 px-4 text-slate-600">Blue Cross Blue Shield</td>
                <td className="py-3 px-4 text-slate-600">2026-08-15</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">$1,450.00</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700">
                    18 / 100
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                    READY
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link
                    to="/claims/clm-001"
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
                  >
                    Inspect
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
