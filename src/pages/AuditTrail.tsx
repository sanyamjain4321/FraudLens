import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatDateTime, formatRelativeTime } from '../lib/utils';

const ACTION_COLORS: Record<string, string> = {
  TRANSACTION_CREATED: 'bg-blue-50 text-blue-700 border-blue-200',
  RISK_ASSESSED: 'bg-sky-50 text-sky-700 border-sky-200',
  ANALYST_ALLOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ANALYST_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  ANALYST_DECLINE: 'bg-red-50 text-red-700 border-red-200',
  ANALYST_STEP_UP: 'bg-blue-50 text-blue-700 border-blue-200',
  CASE_CREATED: 'bg-purple-50 text-purple-700 border-purple-200',
  CASE_UPDATED: 'bg-purple-50 text-purple-700 border-purple-200',
  SYSTEM_INIT: 'bg-slate-100 text-slate-700 border-slate-200',
};

function getActionBadge(action: string) {
  const cls = ACTION_COLORS[action.toUpperCase()] ?? 'bg-slate-50 text-slate-600 border-slate-200';
  return `text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${cls}`;
}

export default function AuditTrail() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.audit.list({
        page,
        per_page: 50,
        search: search || undefined,
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const id = setInterval(() => fetchData(true), 4000);
    return () => clearInterval(id);
  }, [fetchData]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Search Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action or entity ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
          />
        </div>
        <button
          onClick={() => fetchData()}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 shadow-xs"
        >
          <RefreshCw size={15} />
        </button>
        <span className="text-xs text-slate-500 font-medium ml-auto">{total.toLocaleString()} audit records</span>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3 text-right">Risk Score</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-sky-600" /> Fetching audit log...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    <FileText size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No audit records logged yet</p>
                    <p className="text-xs text-slate-400 mt-1">Start Traffic Lab or make analyst decisions to populate audit records.</p>
                  </td>
                </tr>
              ) : (
                items.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <p className="text-xs text-slate-900 font-medium">{formatDateTime(e.timestamp)}</p>
                      <p className="text-[10px] text-slate-400">{formatRelativeTime(e.timestamp)}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-bold ${e.actor === 'Analyst' ? 'text-sky-600' : 'text-slate-600'}`}>
                        {e.actor ?? 'system'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={getActionBadge(e.action)}>
                        {e.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 capitalize font-medium">
                      {e.entity ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      {e.entity_id && e.entity === 'transaction' ? (
                        <Link to={`/app/transactions/${e.entity_id}`} className="text-sky-600 font-bold hover:underline">
                          {e.entity_id?.slice(-12)}
                        </Link>
                      ) : (
                        <span className="text-slate-600">{e.entity_id?.slice(-12) ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">
                      {e.risk_score != null ? (
                        <span className={
                          e.risk_score >= 80 ? 'text-red-600' :
                          e.risk_score >= 60 ? 'text-orange-600' :
                          e.risk_score >= 30 ? 'text-amber-600' : 'text-emerald-600'
                        }>{e.risk_score.toFixed(0)}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">
                      {e.details ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
