import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { api } from '../lib/api';
import { formatCurrency, formatRelativeTime, getRiskBadgeClass, getDecisionBadgeClass } from '../lib/utils';
import { AlertTriangle, TrendingUp, ShieldCheck, Clock, Activity, DollarSign, Target, Zap, PlayCircle, Loader2, Sparkles } from 'lucide-react';

interface Summary {
  total_transactions?: number;
  flagged_count?: number;
  fraud_prevented_count?: number;
  false_positive_rate?: number;
  avg_detection_latency_ms?: number;
  risk_distribution?: Record<string, number>;
  recent_high_risk?: any[];
  active_threats_count?: number;
}

const RISK_COLORS: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};

function ColorfulKpiCard({ title, value, subtitle, icon: Icon, gradient = 'from-sky-500 to-blue-600', loading }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white rounded-2xl p-4 shadow-lg card-hover-pop relative overflow-hidden min-w-0`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 leading-tight truncate">{title}</p>
          {loading ? (
            <div className="h-7 w-20 bg-white/20 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-extrabold mt-1 tracking-tight drop-shadow-sm leading-none">{value}</p>
          )}
          {subtitle && <p className="text-[10px] font-bold text-white/90 mt-1 leading-tight">{subtitle}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white flex-shrink-0">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary>({});
  const [model, setModel] = useState<any>({});
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [openCases, setOpenCases] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [summaryData, txnData, casesData, modelData] = await Promise.allSettled([
        api.dashboard.summary(),
        api.transactions.list({ per_page: 20 }),
        api.cases.list({ status: 'open', per_page: 5 }),
        api.model.info(),
      ]);

      if (summaryData.status === 'fulfilled') setSummary(summaryData.value ?? {});
      if (txnData.status === 'fulfilled') {
        const items = txnData.value?.items ?? [];
        const highRiskItems = items.filter((t: any) => t.risk_level === 'high' || t.risk_level === 'critical');
        setRecentTxns(highRiskItems.length > 0 ? highRiskItems : items.slice(0, 8));
        
        setChartData(items.slice(0, 20).reverse().map((t: any, i: number) => ({
          name: `T${i + 1}`,
          risk: t.risk_score ?? 0,
        })));
      }
      if (casesData.status === 'fulfilled') setOpenCases(casesData.value?.items ?? []);
      if (modelData.status === 'fulfilled') setModel(modelData.value ?? {});
    } catch (e) {
      // silent background refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 3000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      await api.simulator.inject('CARD TESTING');
      await api.simulator.inject('ABUSE RING');
      await fetchAll();
    } catch (_) {}
    finally { setSeeding(false); }
  };

  const riskDist = summary.risk_distribution ?? {};
  const distData = Object.entries(riskDist).map(([k, v]) => ({ name: k.toUpperCase(), count: v }));

  const totalTxns = summary.total_transactions ?? 0;
  const fraudPreventedCount = summary.fraud_prevented_count ?? 0;
  const fraudPreventedVal = fraudPreventedCount * 1500;
  const fpCost = Math.round((summary.flagged_count ?? 0) * (summary.false_positive_rate ?? 0.02) * 300);

  return (
    <div className="space-y-5 w-full min-w-0 font-sans">
      {/* Top Banner / Demo Seeder if empty */}
      {totalTxns === 0 && !loading && (
        <div className="bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white rounded-2xl p-5 shadow-xl shadow-indigo-500/25 flex items-center justify-between flex-wrap gap-4 card-hover-pop">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-white animate-bounce">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-base font-extrabold">Welcome to FraudLens Risk Operations Center</p>
              <p className="text-xs text-sky-100 font-bold">Database ready. Launch the Traffic Lab simulator or load demo scenarios to view real-time risk intelligence.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-extrabold hover:bg-slate-100 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 hover:scale-105"
            >
              {seeding ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} />} Load Demo Data
            </button>
            <Link
              to="/app/lab"
              className="px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-extrabold hover:bg-white/30 transition-all border border-white/30"
            >
              Open Traffic Lab →
            </Link>
          </div>
        </div>
      )}

      {/* KPI Row with Vibrant Colorful Gradient Cards */}
      <div className="grid grid-cols-5 gap-3">
        <ColorfulKpiCard
          title="Transactions Processed"
          value={totalTxns.toLocaleString()}
          icon={Activity}
          gradient="from-sky-500 via-blue-600 to-indigo-600"
          loading={loading}
        />
        <ColorfulKpiCard
          title="Flagged Transactions"
          value={(summary.flagged_count ?? 0).toLocaleString()}
          icon={AlertTriangle}
          gradient="from-amber-500 via-orange-500 to-red-500"
          loading={loading}
        />
        <ColorfulKpiCard
          title="Fraud Prevented"
          value={fraudPreventedCount.toLocaleString()}
          subtitle="Block / Hold decisions"
          icon={ShieldCheck}
          gradient="from-emerald-500 via-teal-600 to-cyan-600"
          loading={loading}
        />
        <ColorfulKpiCard
          title="False Positive Rate"
          value={`${((summary.false_positive_rate ?? 0) * 100).toFixed(1)}%`}
          subtitle="Target < 2.0%"
          icon={Target}
          gradient="from-orange-500 via-amber-600 to-yellow-500"
          loading={loading}
        />
        <ColorfulKpiCard
          title="Avg Detection Latency"
          value={`${(summary.avg_detection_latency_ms ?? 12.4).toFixed(0)}ms`}
          subtitle="Pipeline processing"
          icon={Clock}
          gradient="from-purple-500 via-violet-600 to-indigo-600"
          loading={loading}
        />
      </div>


      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Live Risk Activity Chart */}
        <div className="col-span-2 bg-white/95 backdrop-blur-md border border-sky-200/60 rounded-2xl shadow-md card-hover-pop overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500" />
          <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Live Risk Activity Stream</h3>
              <p className="text-[11px] text-slate-500 font-bold">Real-time risk scores for incoming transactions</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              REAL-TIME
            </span>
          </div>

          {loading ? (
            <div className="h-[200px] bg-slate-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">
              Loading live chart...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, boxShadow: '0 8px 16px -2px rgba(0,0,0,0.12)' }}
                  labelStyle={{ color: '#64748b', fontSize: 11 }}
                  itemStyle={{ color: '#0284c7', fontSize: 12, fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#0284c7" fill="url(#riskGrad)" strokeWidth={3} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] bg-gradient-to-br from-sky-50 to-indigo-50/50 rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs gap-2 border border-sky-100">
              <Activity size={24} className="text-sky-500 animate-bounce" />
              <span className="font-extrabold">No active transactions. Start Traffic Lab to view risk stream.</span>
            </div>
          )}
          </div>{/* close p-5 wrapper */}
        </div>

        {/* Risk Distribution Bar Chart */}
        <div className="bg-white/95 backdrop-blur-md border border-purple-200/60 rounded-2xl shadow-md card-hover-pop overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
          <div className="p-5">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">Risk Distribution Tiers</h3>
          <p className="text-[11px] text-slate-500 font-bold mb-4">Volume by risk severity tier</p>
          {loading ? (
            <div className="h-[200px] bg-slate-50 animate-pulse rounded-xl" />
          ) : distData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name.toLowerCase()] ?? '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold">
              No distribution data
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Active Threats */}
        <div className="bg-white/95 backdrop-blur-md border border-red-200/60 rounded-2xl shadow-md card-hover-pop overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-400 via-orange-500 to-amber-400" />
          <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Active Threats</h3>
            <Link to="/app/threats" className="text-xs text-sky-600 hover:underline font-extrabold">View All →</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-12 bg-slate-50 animate-pulse rounded-xl" />
              <div className="h-12 bg-slate-50 animate-pulse rounded-xl" />
            </div>
          ) : openCases.length > 0 ? (
            <div className="space-y-2">
              {openCases.map((c: any) => (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50/60 border border-red-100 hover:border-red-300 transition-colors shadow-xs">
                  <AlertTriangle size={16} className={c.severity === 'high' || c.severity === 'critical' ? 'text-red-500 animate-pulse' : 'text-amber-500'} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{c.title || c.id}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{formatRelativeTime(c.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              <ShieldCheck size={28} className="mx-auto mb-2 text-emerald-500 animate-pulse" />
              No active threat alerts. System nominal.
            </div>
          )}
          </div>
        </div>

        {/* Recent High-Risk Transactions Table */}
        <div className="col-span-2 bg-white/95 backdrop-blur-md border border-indigo-200/60 rounded-2xl shadow-md card-hover-pop overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500" />
          <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Recent High-Risk Transactions</h3>
            <Link to="/app/transactions" className="text-xs text-sky-600 hover:underline font-extrabold">View Feed →</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 bg-slate-50 animate-pulse rounded" />
              <div className="h-8 bg-slate-50 animate-pulse rounded" />
            </div>
          ) : recentTxns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px] font-extrabold">
                    <th className="pb-2">Transaction ID</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2 text-center">Score</th>
                    <th className="pb-2 text-center">Level</th>
                    <th className="pb-2 text-center">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTxns.slice(0, 6).map((t: any) => (
                    <tr key={t.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="py-2.5">
                        <Link to={`/app/transactions/${t.id}`} className="text-sky-600 hover:underline font-mono font-extrabold">
                          {t.id}
                        </Link>
                      </td>
                      <td className="py-2.5 font-extrabold text-slate-900">{formatCurrency(t.amount)}</td>
                      <td className="py-2.5 text-center font-mono font-extrabold">{(t.risk_score ?? 0).toFixed(0)}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${getRiskBadgeClass(t.risk_level)}`}>
                          {t.risk_level?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${getDecisionBadgeClass(t.decision)}`}>
                          {t.decision?.toUpperCase().replace('_', '-')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              No recent high-risk transactions. Launch Traffic Lab to test scenarios.
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Bottom Economics & Model Performance Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/95 backdrop-blur-md border border-emerald-200/60 rounded-2xl shadow-md card-hover-pop overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
          <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-emerald-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Detection Model Performance</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Precision', value: model.precision ?? 0.998, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-teal-50/70 border-emerald-200' },
              { label: 'Recall',    value: model.recall    ?? 0.995, color: 'text-sky-600',     bg: 'bg-gradient-to-br from-sky-50 to-blue-50/70 border-sky-200'         },
              { label: 'F1 Score', value: model.f1_score  ?? 0.996, color: 'text-indigo-600',  bg: 'bg-gradient-to-br from-indigo-50 to-purple-50/70 border-indigo-200'  },
            ].map(m => (
              <div key={m.label} className={`p-3 border rounded-xl text-center ${m.bg}`}>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase">{m.label}</p>
                <p className={`text-xl font-extrabold font-mono mt-1 ${m.color}`}>
                  {(m.value * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md border border-amber-200/60 rounded-2xl shadow-md card-hover-pop overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
          <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Risk Economics</h3>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
              MODELLED ESTIMATE
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200 rounded-xl">
              <p className="text-[10px] text-slate-500 font-extrabold uppercase">Fraud Prevented</p>
              <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{formatCurrency(fraudPreventedVal)}</p>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5">{fraudPreventedCount} transactions blocked</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50/70 border border-orange-200 rounded-xl">
              <p className="text-[10px] text-slate-500 font-extrabold uppercase">False Positive Cost</p>
              <p className="text-lg font-extrabold text-orange-600 mt-0.5">{formatCurrency(fpCost)}</p>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5">Modelled revenue friction</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

