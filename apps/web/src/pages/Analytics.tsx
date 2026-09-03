import React from 'react';

export const Analytics: React.FC = () => {
  const payerBenchmarks = [
    {
      name: 'Blue Cross Blue Shield',
      cleanRate: 89.2,
      avgDaysToPay: 14,
      denialRate: 10.8,
      appealWinRate: 78,
    },
    {
      name: 'UnitedHealthcare',
      cleanRate: 79.4,
      avgDaysToPay: 21,
      denialRate: 20.6,
      appealWinRate: 64,
    },
    {
      name: 'Traditional Medicare Part B',
      cleanRate: 94.1,
      avgDaysToPay: 12,
      denialRate: 5.9,
      appealWinRate: 85,
    },
    {
      name: 'Aetna Commercial',
      cleanRate: 82.5,
      avgDaysToPay: 18,
      denialRate: 17.5,
      appealWinRate: 71,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Payer Intelligence & Performance Analytics
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Benchmark clean claim rates, average remittance turnaround times, and appeal win velocity across major payers.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">U.S. Payer Scorecard</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Payer Organization</th>
              <th className="py-3 px-4 text-center">Clean Claim Rate</th>
              <th className="py-3 px-4 text-center">Avg Turnaround</th>
              <th className="py-3 px-4 text-center">Denial Propensity</th>
              <th className="py-3 px-4 text-center">Appeal Win Velocity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payerBenchmarks.map((payer) => (
              <tr key={payer.name} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-800">{payer.name}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="font-bold text-emerald-600">{payer.cleanRate}%</span>
                </td>
                <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                  {payer.avgDaysToPay} days
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`font-bold ${
                      payer.denialRate > 15 ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  >
                    {payer.denialRate}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700">
                    {payer.appealWinRate}% Won
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
