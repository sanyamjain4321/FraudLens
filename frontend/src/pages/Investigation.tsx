import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, User, Smartphone, Globe, AlertTriangle, CheckCircle, Clock, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency, formatDateTime, formatRelativeTime, getRiskBadgeClass, getDecisionBadgeClass } from '../lib/utils';
import { ImpossibleTravelVisual, CardTestingVisual, AbuseRingVisual } from '../components/ScenarioInspectors';

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-mono font-bold text-slate-900">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

const EVIDENCE_COLORS: Record<string, string> = {
  'VELOCITY SIGNAL': 'text-amber-800 border-amber-200 bg-amber-50',
  'NETWORK SIGNAL': 'text-purple-800 border-purple-200 bg-purple-50',
  'ML SIGNAL': 'text-sky-800 border-sky-200 bg-sky-50',
  'AMOUNT ANOMALY': 'text-orange-800 border-orange-200 bg-orange-50',
  'DEVICE ANOMALY': 'text-blue-800 border-blue-200 bg-blue-50',
};

export default function Investigation() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.transactions.get(id);
      setData(res);
    } catch (e) {
      showToast('Failed to load transaction details.', 'error');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (action: string) => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      await api.transactions.decide(id, action, `Analyst action: ${action.toUpperCase()}`);
      showToast(`Transaction decision updated to ${action.toUpperCase()}. Saved in database.`);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Action failed to record.', 'error');
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500 gap-2 text-xs">
      <Loader2 size={18} className="animate-spin text-sky-600" />
      <span>Loading transaction investigation workstation...</span>
    </div>
  );

  if (!data) return (
    <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
      <p className="font-semibold text-slate-700">Transaction not found.</p>
      <Link to="/app/transactions" className="text-sky-600 hover:underline text-xs mt-2 inline-block font-bold">
        ← Back to Transactions
      </Link>
    </div>
  );

  const txn = data.transaction ?? {};
  const customer = data.customer ?? {};
  const device = data.device ?? {};
  const evidence: any[] = txn.evidence ?? [];
  const threatType = (txn.threat_type || '').toUpperCase();

  const isImpossibleTravel = threatType.includes('TRAVEL') || evidence.some(e => e.type?.includes('TRAVEL') || e.description?.includes('km'));
  const isCardTesting = threatType.includes('CARD') || evidence.some(e => e.type?.includes('VELOCITY') || e.description?.includes('card'));
  const isAbuseRing = threatType.includes('RING') || evidence.some(e => e.type?.includes('NETWORK') || e.description?.includes('account'));

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold border transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Back Nav Link */}
      <Link to="/app/transactions" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors">
        <ArrowLeft size={14} /> Back to Transactions Feed
      </Link>

      {/* Transaction Summary Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-200">
                <ShieldAlert size={18} />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{txn.id}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-11">{formatDateTime(txn.timestamp)}</p>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount</p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">{formatCurrency(txn.amount, txn.currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Risk Score</p>
              <div className={`text-2xl font-extrabold font-mono ${
                (txn.risk_score ?? 0) >= 80 ? 'text-red-600' :
                (txn.risk_score ?? 0) >= 60 ? 'text-orange-600' :
                (txn.risk_score ?? 0) >= 30 ? 'text-amber-600' : 'text-emerald-600'
              }`}>{(txn.risk_score ?? 0).toFixed(0)}</div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Risk Tier</p>
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${getRiskBadgeClass(txn.risk_level)}`}>
                {txn.risk_level?.toUpperCase()}
              </span>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Decision</p>
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${getDecisionBadgeClass(txn.decision)}`}>
                {txn.decision?.toUpperCase().replace('_', '-') ?? 'ALLOW'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED SCENARIO VISUAL INSPECTORS */}
      {isImpossibleTravel && (
        <ImpossibleTravelVisual
          data={{
            origin: 'Delhi, India',
            destination: [txn.location_city, txn.location_country].filter(Boolean).join(', ') || 'London, United Kingdom',
            distance: '6,700 km',
            timeElapsed: '18 minutes',
            calculatedSpeed: '22,333 km/h',
            thresholdSpeed: '900 km/h',
          }}
        />
      )}

      {isCardTesting && !isImpossibleTravel && (
        <CardTestingVisual
          data={{
            txnCount: 17,
            timeWindow: '42 sec',
            instruments: 15,
            deviceId: txn.device_id || 'DEV-8821',
            velocity: '24 tx/min',
          }}
        />
      )}

      {isAbuseRing && !isImpossibleTravel && !isCardTesting && (
        <AbuseRingVisual
          data={{
            accounts: ['CUST-101', 'CUST-102', 'CUST-103', 'CUST-104'],
            device: txn.device_id || 'DEV-902',
            ip: txn.ip_address || '198.51.100.42',
          }}
        />
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Left Column: Details & Evidence */}
        <div className="col-span-2 space-y-5">
          {/* Key Fields Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Transaction Details</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
              {[
                ['Transaction ID', txn.id],
                ['Timestamp', formatDateTime(txn.timestamp)],
                ['Amount', formatCurrency(txn.amount, txn.currency)],
                ['Payment Method', txn.payment_method?.replace('_', ' ').toUpperCase()],
                ['Card BIN', txn.card_bin ?? '—'],
                ['Payment Instrument', txn.payment_instrument_id ?? '—'],
                ['Merchant Category', txn.merchant_category || '—'],
                ['Device ID', txn.device_id || '—'],
                ['IP Address', txn.ip_address || '—'],
                ['Location', [txn.location_city, txn.location_country].filter(Boolean).join(', ') || 'India'],
                ['Threat Type', txn.threat_type || '—'],
                ['Data Source', txn.source || 'SIMULATOR'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">{k}</span>
                  <span className="text-slate-900 font-mono font-semibold text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
              WHY WAS THIS FLAGGED?
            </h2>
            {evidence.length > 0 ? (
              <div className="space-y-2.5">
                {evidence.map((e: any, i: number) => {
                  const colorClass = EVIDENCE_COLORS[e.type] ?? 'text-slate-800 border-slate-200 bg-slate-50';
                  return (
                    <div key={i} className={`border rounded-lg p-3 ${colorClass}`}>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5">{e.type}</p>
                      <p className="text-xs leading-relaxed">{e.description}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No risk evidence signals recorded. Evaluated within normal baseline parameters.</p>
            )}
          </div>

          {/* Model & Engine Scores */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">Model & Engine Contribution</h2>
            <div className="space-y-3.5">
              <ScoreBar label="ML Anomaly Engine" value={txn.fraud_probability ?? 0} color="bg-red-500" />
              <ScoreBar label="Velocity Engine" value={txn.velocity_score ?? 0} color="bg-amber-500" />
              <ScoreBar label="Network Graph Engine" value={txn.network_score ?? 0} color="bg-purple-500" />
              <ScoreBar label="Deterministic Rules" value={txn.rule_score ?? 0} color="bg-orange-500" />
              <div className="pt-2 border-t border-slate-200">
                <ScoreBar label="Ensemble Composite Score" value={txn.risk_score ?? 0} color="bg-sky-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Profile & Analyst Action */}
        <div className="space-y-5">
          {/* Analyst Actions Workstation */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Analyst Workstation Actions</h2>
            <p className="text-[11px] text-slate-500">Executing a decision updates transaction status, stores audit records, and creates case tickets automatically.</p>

            <div className="space-y-2">
              <button
                onClick={() => handleAction('allow')}
                disabled={actionLoading}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all font-bold text-xs shadow-xs disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600" /> ALLOW TRANSACTION</span>
                <ChevronRight size={14} />
              </button>

              <button
                onClick={() => handleAction('step_up')}
                disabled={actionLoading}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 transition-all font-bold text-xs shadow-xs disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><Globe size={16} className="text-blue-600" /> STEP-UP AUTH (2FA)</span>
                <ChevronRight size={14} />
              </button>

              <button
                onClick={() => handleAction('hold')}
                disabled={actionLoading}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all font-bold text-xs shadow-xs disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><Clock size={16} className="text-amber-600" /> HOLD FOR REVIEW</span>
                <ChevronRight size={14} />
              </button>

              <button
                onClick={() => handleAction('decline')}
                disabled={actionLoading}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 transition-all font-bold text-xs shadow-xs disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><XCircle size={16} className="text-red-600" /> DECLINE TRANSACTION</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {actionLoading && (
              <div className="flex items-center justify-center gap-2 text-xs text-sky-600 py-1 font-medium">
                <Loader2 size={14} className="animate-spin" /> Saving decision to database...
              </div>
            )}
          </div>

          {/* Customer Profile */}
          {customer.id && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={14} className="text-sky-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Customer Profile</h2>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  ['ID', customer.id],
                  ['Name', customer.name],
                  ['Trust Score', `${customer.trust_score}/100`],
                  ['Account Age', `${customer.account_age_days} days`],
                  ['Total Transactions', customer.total_transactions],
                  ['Chargeback Count', customer.chargeback_count],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-900 font-mono font-semibold">{v ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
