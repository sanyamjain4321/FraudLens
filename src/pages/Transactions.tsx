import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ExternalLink, Filter, Loader2, Eye, ShieldAlert, CheckCircle, Clock, XCircle, Globe, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency, formatDateTime, getRiskBadgeClass, getDecisionBadgeClass, getRiskBorderClass } from '../lib/utils';
import Modal from '../components/Modal';
import { ImpossibleTravelVisual, CardTestingVisual, AbuseRingVisual } from '../components/ScenarioInspectors';

const RISK_LEVELS = ['', 'low', 'medium', 'high', 'critical'];
const PAYMENT_METHODS = ['', 'upi', 'credit_card', 'debit_card', 'net_banking', 'wallet'];

export default function Transactions() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Modal Popup states
  const [inspectTxn, setInspectTxn] = useState<any | null>(null);
  const [decisionModalTxn, setDecisionModalTxn] = useState<any | null>(null);
  const [pendingAction, setPendingAction] = useState<string>('hold');
  const [decisionReason, setDecisionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTxns = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.transactions.list({
        page,
        per_page: 20,
        search: search || undefined,
        risk_level: riskLevel || undefined,
        payment_method: paymentMethod || undefined,
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, search, riskLevel, paymentMethod]);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  useEffect(() => {
    const id = setInterval(() => fetchTxns(true), 4000);
    return () => clearInterval(id);
  }, [fetchTxns]);

  const handleConfirmDecision = async () => {
    if (!decisionModalTxn || actionLoading) return;
    setActionLoading(true);
    try {
      await api.transactions.decide(decisionModalTxn.id, pendingAction, decisionReason || `Analyst ${pendingAction.toUpperCase()}`);
      showToast(`Transaction ${decisionModalTxn.id} updated to ${pendingAction.toUpperCase()}. Saved in DB.`);
      setDecisionModalTxn(null);
      setInspectTxn(null);
      await fetchTxns();
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold border transition-all animate-toast-slide ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header and Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500" />
          <input
            type="text"
            placeholder="Search Transaction ID, customer, merchant..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white border border-sky-200/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
          />
        </div>

        <select
          value={riskLevel}
          onChange={e => { setRiskLevel(e.target.value); setPage(1); }}
          className="bg-white border border-sky-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500 shadow-sm"
        >
          <option value="">All Risk Levels</option>
          {RISK_LEVELS.filter(Boolean).map(l => (
            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
          ))}
        </select>

        <select
          value={paymentMethod}
          onChange={e => { setPaymentMethod(e.target.value); setPage(1); }}
          className="bg-white border border-sky-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500 shadow-sm"
        >
          <option value="">All Payment Methods</option>
          {PAYMENT_METHODS.filter(Boolean).map(m => (
            <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>

        <button
          onClick={() => fetchTxns()}
          className="p-2.5 bg-white border border-sky-200/80 rounded-xl text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors shadow-sm"
        >
          <RefreshCw size={15} />
        </button>

        <span className="text-xs text-slate-600 font-extrabold ml-auto">{total.toLocaleString()} transactions</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-sky-200/80 rounded-2xl overflow-hidden shadow-sm card-hover-pop">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gradient-to-r from-sky-50 to-indigo-50/60 border-b border-sky-100 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Customer ID</th>
                <th className="px-4 py-3 text-center">Risk Score</th>
                <th className="px-4 py-3 text-center">Level</th>
                <th className="px-4 py-3 text-center">Decision</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-sky-600" />
                      Fetching transactions...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <p className="font-bold">No transactions found</p>
                    <p className="text-xs text-slate-400 mt-1">Start Traffic Lab to stream transactions.</p>
                  </td>
                </tr>
              ) : (
                items.map((t: any) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-sky-50/40 transition-colors ${getRiskBorderClass(t.risk_level)}`}
                  >
                    <td className="px-4 py-3 font-mono font-extrabold">
                      <button
                        onClick={() => setInspectTxn(t)}
                        className="text-sky-600 hover:underline flex items-center gap-1 text-left"
                      >
                        {t.id}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-semibold whitespace-nowrap">
                      {formatDateTime(t.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 uppercase font-bold">
                      {t.payment_method?.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {t.customer_id?.slice(-10) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-extrabold">
                      <span className={
                        (t.risk_score ?? 0) >= 80 ? 'text-red-600' :
                        (t.risk_score ?? 0) >= 60 ? 'text-orange-600' :
                        (t.risk_score ?? 0) >= 30 ? 'text-amber-600' : 'text-emerald-600'
                      }>
                        {(t.risk_score ?? 0).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${getRiskBadgeClass(t.risk_level)}`}>
                        {t.risk_level?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${getDecisionBadgeClass(t.decision)}`}>
                        {t.decision?.toUpperCase().replace('_', '-') ?? 'ALLOW'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Quick Inspect Popup Modal Button */}
                        <button
                          onClick={() => setInspectTxn(t)}
                          title="Quick Inspect Popup"
                          className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-[10px] border border-sky-200 transition-all flex items-center gap-1"
                        >
                          <Eye size={12} /> Inspect
                        </button>
                        <Link to={`/app/transactions/${t.id}`} className="p-1 text-slate-400 hover:text-sky-600">
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/60">
            <p className="text-xs text-slate-500 font-bold">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 shadow-xs"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK INSPECTION MODAL POPUP */}
      <Modal
        isOpen={!!inspectTxn}
        onClose={() => setInspectTxn(null)}
        title={`Transaction Inspection Popup — ${inspectTxn?.id}`}
        subtitle={`Evaluated on ${formatDateTime(inspectTxn?.timestamp)}`}
      >
        {inspectTxn && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-xl">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Transaction Amount</p>
                <p className="text-xl font-extrabold text-slate-900 font-mono">{formatCurrency(inspectTxn.amount, inspectTxn.currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Risk Score</p>
                <p className="text-xl font-extrabold font-mono text-sky-600">{(inspectTxn.risk_score ?? 0).toFixed(0)}/100</p>
              </div>
            </div>

            {/* Dedicated Visual Threat Inspector if available */}
            {inspectTxn.threat_type?.includes('TRAVEL') && (
              <ImpossibleTravelVisual
                data={{
                  origin: 'Delhi, India',
                  destination: [inspectTxn.location_city, inspectTxn.location_country].filter(Boolean).join(', ') || 'London, UK',
                  distance: '6,700 km',
                  timeElapsed: '18 minutes',
                  calculatedSpeed: '22,333 km/h',
                }}
              />
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border rounded-lg">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Payment Method</span>
                <span className="font-bold text-slate-800 uppercase">{inspectTxn.payment_method}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border rounded-lg">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Card BIN</span>
                <span className="font-mono font-bold text-slate-800">{inspectTxn.card_bin || '—'}</span>
              </div>
            </div>

            {/* Quick Action Decision Buttons */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              {['allow', 'step_up', 'hold', 'decline'].map(act => (
                <button
                  key={act}
                  onClick={() => {
                    setPendingAction(act);
                    setDecisionModalTxn(inspectTxn);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold uppercase transition-all shadow-xs ${
                    act === 'allow' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' :
                    act === 'step_up' ? 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200' :
                    act === 'hold' ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200' :
                    'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                  }`}
                >
                  {act.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRMATION DECISION MODAL POPUP */}
      <Modal
        isOpen={!!decisionModalTxn}
        onClose={() => setDecisionModalTxn(null)}
        title={`Confirm Decision: ${pendingAction.toUpperCase()}`}
        subtitle={`Updating transaction ${decisionModalTxn?.id}`}
      >
        {decisionModalTxn && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Are you sure you want to mark transaction <span className="font-mono font-bold text-slate-900">{decisionModalTxn.id}</span> as <span className="font-bold text-sky-600">{pendingAction.toUpperCase()}</span>? This decision will be persisted in SQLite and write an audit log entry.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Analyst Rationale / Notes
              </label>
              <textarea
                value={decisionReason}
                onChange={e => setDecisionReason(e.target.value)}
                placeholder="Specify reason for decision..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500 h-20"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDecisionModalTxn(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:from-sky-700 hover:to-indigo-700 shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirm & Save Decision'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
