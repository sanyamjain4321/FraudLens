import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, PieChart, Pie
} from 'recharts';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, DollarSign, AlertTriangle, Activity, Loader2 } from 'lucide-react';

const RISK_COLORS: Record<string, string> = {
  low: '#16a34a', medium: '#d97706', high: '#ea580c', critical: '#dc2626',
};

const CHART_STYLE = {
  contentStyle: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
  labelStyle: { color: '#64748b', fontSize: 11 },
  itemStyle: { color: '#0f172a', fontSize: 11, fontWeight: 'bold' },
};

export default function Analytics() {
  const [summary, setSummary] = useState<any>({});
  const [fraudRate, setFraudRate] = useState<any[]>([]);
  const [riskByHour, setRiskByHour] = useState<any[]>([]);
  const [riskByMethod, setRiskByMethod] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [summaryRes, fraudRes, hourRes, methodRes] = await Promise.allSettled([
        api.dashboard.summary(),
        fetch('/api/analytics/fraud-rate').then(r => r.json()),
        fetch('/api/analytics/risk-by-hour').then(r => r.json()),
        fetch('/api/analytics/risk-by-method').then(r => r.json()),
      ]);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value ?? {});
      if (fraudRes.status === 'fulfilled') setFraudRate(fraudRes.value ?? []);
      if (hourRes.status === 'fulfilled') setRiskByHour(hourRes.value ?? []);
      if (methodRes.status === 'fulfilled') setRiskByMethod(methodRes.value ?? []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const riskDist = summary.risk_distribution ?? {};
  const pieData = Object.entries(riskDist)
    .filter(([, v]) => (v as number) > 0)
    .map(([k, v]) => ({ name: k.toUpperCase(), value: v as number }));

  const total = summary.total_transactions ?? 0;
  const flagged = summary.flagged_count ?? 0;
  const prevented = summary.fraud_prevented_count ?? 0;
  const fpRate = summary.false_positive_rate ?? 0.02;
  const avgTxnAmount = total > 0 ? 1500 : 0;
  const fraudPreventedValue = prevented * avgTxnAmount;
  const fpCost = Math.round(flagged * fpRate * avgTxnAmount * 0.1);
  const netPrevented = fraudPreventedValue - fpCost;

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 gap-2 text-xs">
      <Loader2 size={18} className="animate-spin text-sky-600" /> Loading analytics data...
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: total.toLocaleString(), icon: Activity, color: 'text-sky-600' },
          { label: 'Fraud Rate', value: `${((flagged / Math.max(total, 1)) * 100).toFixed(2)}%`, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'High-Risk Txns', value: ((summary.high_risk_count ?? 0)).toLocaleString(), icon: TrendingUp, color: 'text-orange-600' },
          { label: 'Fraud Prevented', value: formatCurrency(fraudPreventedValue), icon: DollarSign, color: 'text-emerald-600' },
        ].map(item => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
            <item.icon size={20} className={item.color} />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Fraud Rate Trend (30 Days)</h3>
          {fraudRate.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={fraudRate} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit="%" />
                <Tooltip {...CHART_STYLE} formatter={(v: any) => [`${v}%`, 'Fraud Rate']} />
                <Line type="monotone" dataKey="rate" stroke="#dc2626" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs">
              No trend data available.
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Risk Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name.toLowerCase()] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip {...CHART_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs">
              No distribution data
            </div>
          )}
        </div>
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Risk Volume by Hour</h3>
          {riskByHour.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskByHour} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                <Tooltip {...CHART_STYLE} />
                <Bar dataKey="high" fill="#ea580c" stackId="a" name="High" />
                <Bar dataKey="critical" fill="#dc2626" stackId="a" radius={[3, 3, 0, 0]} name="Critical" />
                <Bar dataKey="medium" fill="#d97706" stackId="a" name="Medium" />
                <Bar dataKey="low" fill="#16a34a" stackId="a" name="Low" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs">No hourly data</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Risk by Payment Method</h3>
          {riskByMethod.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskByMethod} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis dataKey="method" type="category" tick={{ fontSize: 9, fill: '#64748b' }} width={60} />
                <Tooltip {...CHART_STYLE} />
                <Bar dataKey="high" fill="#ea580c" stackId="a" name="High" />
                <Bar dataKey="critical" fill="#dc2626" stackId="a" name="Critical" />
                <Bar dataKey="medium" fill="#d97706" stackId="a" name="Medium" />
                <Bar dataKey="low" fill="#16a34a" stackId="a" name="Low" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs">No method data</div>
          )}
        </div>
      </div>

      {/* Risk Economics Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Risk Economics Analysis</h3>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold uppercase">
            MODELLED ESTIMATE
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Modelled revenue calculations based on transaction velocity and blocked exposure values. Assumptions: avg transaction = ₹1,500 · FP friction cost = 10% of blocked amount.
        </p>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Fraud Prevented Exposure', value: formatCurrency(fraudPreventedValue), note: `${prevented} blocked transactions`, color: 'text-emerald-600' },
            { label: 'False Positive Cost', value: formatCurrency(fpCost), note: 'Revenue friction estimate', color: 'text-orange-600' },
            { label: 'Net Prevented Loss', value: formatCurrency(netPrevented), note: 'Fraud prevented − FP cost', color: netPrevented >= 0 ? 'text-emerald-600' : 'text-red-600' },
            { label: 'Protected Revenue Stream', value: formatCurrency((total - flagged) * avgTxnAmount), note: 'Passed low-risk volume', color: 'text-sky-600' },
          ].map(item => (
            <div key={item.label} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{item.label}</p>
              <p className={`text-lg font-extrabold mt-1 ${item.color}`}>{item.value}</p>
              <p className="text-[9px] text-slate-400 mt-1">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
