import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Clock, CheckCircle, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { formatRelativeTime } from '../lib/utils';

function inferThreatType(c: any): string {
  const title = (c.title ?? '').toLowerCase();
  const desc = (c.description ?? '').toLowerCase();
  if (title.includes('card') || desc.includes('card')) return 'CARD TESTING';
  if (title.includes('ring') || desc.includes('ring')) return 'ABUSE RING';
  if (title.includes('travel') || desc.includes('travel')) return 'IMPOSSIBLE TRAVEL';
  if (title.includes('velocity') || desc.includes('velocity')) return 'VELOCITY SPIKE';
  return 'ANOMALOUS ACTIVITY';
}

const THREAT_COLORS: Record<string, string> = {
  'CARD TESTING': 'text-orange-800 border-orange-200 bg-orange-50',
  'ABUSE RING': 'text-red-800 border-red-200 bg-red-50',
  'IMPOSSIBLE TRAVEL': 'text-purple-800 border-purple-200 bg-purple-50',
  'VELOCITY SPIKE': 'text-amber-800 border-amber-200 bg-amber-50',
  'ANOMALOUS ACTIVITY': 'text-sky-800 border-sky-200 bg-sky-50',
};

const SEV_COLORS: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border border-red-200',
  high: 'bg-orange-50 text-orange-700 border border-orange-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export default function ThreatIntelligence() {
  const [cases, setCases] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.cases.list({ per_page: 50 });
      setCases(res.items ?? []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(true), 8000);
    return () => clearInterval(id);
  }, [fetchData]);

  const filtered = cases.filter(c => {
    if (filter === 'active') return c.status === 'open';
    if (filter === 'resolved') return c.status !== 'open';
    return true;
  });

  const totalCritical = cases.filter(c => c.severity === 'critical' || c.severity === 'high').length;
  const totalActive = cases.filter(c => c.status === 'open').length;
  const totalResolved = cases.filter(c => c.status !== 'open').length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Threats', value: cases.length, color: 'text-slate-900', icon: ShieldAlert },
          { label: 'Critical / High', value: totalCritical, color: 'text-red-600', icon: AlertTriangle },
          { label: 'Active Alerts', value: totalActive, color: 'text-amber-600', icon: Clock },
          { label: 'Resolved Threats', value: totalResolved, color: 'text-emerald-600', icon: CheckCircle },
        ].map(item => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
            <item.icon size={22} className={item.color} />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</p>
              <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
          {(['all', 'active', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-md font-bold uppercase tracking-wider transition-colors ${
                filter === f ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => fetchData()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 shadow-xs">
          <RefreshCw size={14} />
        </button>
        <span className="text-xs text-slate-500 font-medium ml-auto">{filtered.length} threat alerts</span>
      </div>

      {/* Threat Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 gap-2 text-xs">
          <Loader2 size={18} className="animate-spin text-sky-600" /> Loading threat intelligence...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <ShieldAlert size={36} className="text-slate-300 mx-auto mb-2" />
          <p className="text-slate-900 font-bold text-sm">No threat alerts detected</p>
          <p className="text-xs text-slate-500 mt-1">Use Traffic Lab to inject test scenarios.</p>
          <Link to="/app/lab" className="inline-block mt-4 px-4 py-2 bg-sky-600 text-white font-bold rounded-lg text-xs hover:bg-sky-700 shadow-xs">
            Open Traffic Lab →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c: any) => {
            const threatType = inferThreatType(c);
            const threatColor = THREAT_COLORS[threatType] ?? 'text-slate-800 border-slate-200 bg-slate-50';
            const sevColor = SEV_COLORS[c.severity] ?? SEV_COLORS.medium;
            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase border px-2 py-0.5 rounded ${threatColor}`}>
                      <AlertTriangle size={11} /> {threatType}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-2">{c.title || c.id}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sevColor}`}>
                      {c.severity?.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold ${c.status === 'open' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {c.status === 'open' ? '● ACTIVE' : '✓ RESOLVED'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Risk Score</p>
                    <p className="font-extrabold font-mono text-slate-900">{(c.risk_score ?? 0).toFixed(0)}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Detected</p>
                    <p className="font-semibold text-slate-700">{formatRelativeTime(c.created_at)}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned</p>
                    <p className="font-semibold text-slate-700 truncate">{c.assigned_to || 'Unassigned'}</p>
                  </div>
                </div>

                {c.description && (
                  <p className="text-xs text-slate-600 border-t border-slate-100 pt-2 leading-relaxed">{c.description}</p>
                )}

                {c.transaction_id && (
                  <div className="pt-1">
                    <Link
                      to={`/app/transactions/${c.transaction_id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline"
                    >
                      Investigate Transaction →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
