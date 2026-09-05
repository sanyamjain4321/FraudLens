import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Square, Pause, Zap, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency, formatRelativeTime, getRiskBadgeClass } from '../lib/utils';

const RATES = [1, 5, 10, 20];

const SCENARIOS = [
  {
    id: 'NORMAL TRAFFIC',
    title: 'Normal Traffic',
    description: 'Realistic distribution of legitimate payment transactions across varying amounts and payment methods.',
    icon: '📊',
    color: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-br from-white to-emerald-50/60',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'CARD TESTING',
    title: 'Card Testing Burst',
    description: 'Simulates stolen card testing — high frequency small-amount transactions from one device across multiple BINs.',
    icon: '💳',
    color: 'border-orange-200 hover:border-orange-400 bg-gradient-to-br from-white to-orange-50/60',
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    id: 'ABUSE RING',
    title: 'Coordinated Abuse Ring',
    description: 'Multiple customer accounts sharing the same device fingerprint and IP address transacting rapidly.',
    icon: '🔗',
    color: 'border-red-200 hover:border-red-400 bg-gradient-to-br from-white to-red-50/60',
    badge: 'bg-red-100 text-red-800 border-red-300',
  },
  {
    id: 'IMPOSSIBLE TRAVEL',
    title: 'Impossible Travel',
    description: 'Payment instrument observed in geographically distant locations within an implausible time delta.',
    icon: '✈️',
    color: 'border-purple-200 hover:border-purple-400 bg-gradient-to-br from-white to-purple-50/60',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    id: 'MIXED ATTACK',
    title: 'Mixed Attack Scenario',
    description: 'Combined card testing and abuse ring activity to stress-test all detection engines simultaneously.',
    icon: '⚡',
    color: 'border-amber-200 hover:border-amber-400 bg-gradient-to-br from-white to-amber-50/60',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
];

export default function TrafficLab() {
  const [rate, setRate] = useState(1);
  const [mode, setMode] = useState('NORMAL TRAFFIC');
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<any[]>([]);
  const [injectLoading, setInjectLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const pollFeed = useCallback(async () => {
    try {
      const data = await api.transactions.list({ per_page: 20 });
      setFeed(data.items ?? []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (isRunning) {
      pollFeed();
      pollRef.current = setInterval(pollFeed, 1000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isRunning, pollFeed]);

  useEffect(() => {
    api.simulator.status().then(s => {
      setIsRunning(s.is_running ?? false);
      if (s.mode) setMode(s.mode);
      if (s.rate) setRate(s.rate);
    }).catch(() => {});
    pollFeed();
  }, [pollFeed]);

  const handleStart = async () => {
    setLoading(true);
    try {
      await api.simulator.start(rate, mode);
      setIsRunning(true);
      showToast(`Stream started — ${mode} at ${rate} tx/sec`, 'success');
    } catch (e: any) {
      showToast(`Failed to start stream: ${e.message}`, 'error');
    } finally { setLoading(false); }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await api.simulator.stop();
      setIsRunning(false);
      showToast('Simulation stream stopped.', 'info');
    } catch (e: any) {
      showToast(`Stop failed: ${e.message}`, 'error');
    } finally { setLoading(false); }
  };

  const handleInject = async (threatType: string) => {
    setInjectLoading(true);
    try {
      await api.simulator.inject(threatType);
      showToast(`5 ${threatType} transactions injected into risk pipeline.`, 'success');
      setTimeout(pollFeed, 600);
    } catch (e: any) {
      showToast(`Injection failed: ${e.message}`, 'error');
    } finally { setInjectLoading(false); }
  };

  const handleScenario = async (scenarioId: string) => {
    setMode(scenarioId);
    setLoading(true);
    try {
      if (isRunning) await api.simulator.stop();
      await api.simulator.start(rate, scenarioId);
      setIsRunning(true);
      showToast(`Launched scenario: ${scenarioId}`, 'success');
    } catch (e: any) {
      showToast(`Scenario launch failed: ${e.message}`, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold border transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-300 text-red-800' :
          'bg-sky-50 border-sky-300 text-sky-800'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4 card-hover-pop">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">TRAFFIC LAB</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Controlled transaction environment for validating risk engine detection capabilities.</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
              CONTROLLED SIMULATION PIPELINE
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Every generated transaction enters the exact same risk engine as real traffic.</span>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${isRunning ? 'bg-emerald-50/80 border-emerald-300 animate-ring-pulse' : 'bg-slate-50 border-slate-200'}`}>
          {isRunning ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">STREAMING LIVE</p>
                <p className="text-[10px] text-emerald-600 font-bold">{mode} · {rate} tx/sec</p>
              </div>
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-slate-400"></span>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">STREAM STOPPED</p>
                <p className="text-[10px] text-slate-400 font-semibold">Ready to start</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Demo Scenario Presets */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Demo Attack Scenarios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SCENARIOS.map(s => (
            <div
              key={s.id}
              className={`border rounded-2xl p-4 flex flex-col justify-between transition-all card-hover-pop ${s.color} ${mode === s.id && isRunning ? 'ring-2 ring-sky-500 shadow-md' : ''}`}
            >
              <div>
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-xs font-extrabold text-slate-900 mb-1">{s.title}</p>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-3 font-medium">{s.description}</p>
              </div>

              <button
                onClick={() => handleScenario(s.id)}
                disabled={loading}
                className={`w-full text-[10px] font-extrabold uppercase py-2 rounded-xl border transition-all ${s.badge} hover:opacity-90 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1 shadow-xs`}
              >
                {loading && mode === s.id ? <Loader2 size={12} className="animate-spin" /> : 'LAUNCH SCENARIO'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stream Controls & Instant Injection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stream Settings */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 card-hover-pop">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Stream Controls</h2>

          {/* Rate Selection */}
          <div>
            <p className="text-xs font-extrabold text-slate-700 mb-2">Transaction Ingestion Rate</p>
            <div className="flex gap-2">
              {RATES.map(r => (
                <button
                  key={r}
                  onClick={() => setRate(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border ${rate === r ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-sky-600 shadow-md scale-105' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                >
                  {r} tx/sec
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <p className="text-xs font-extrabold text-slate-700 mb-1.5">Traffic Mode</p>
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
            >
              {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>

          {/* Start / Stop Buttons */}
          <div className="flex gap-2 pt-1">
            {!isRunning ? (
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />} START STREAM
              </button>
            ) : (
              <button
                onClick={handleStop}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-extrabold hover:from-red-700 hover:to-rose-700 transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />} STOP STREAM
              </button>
            )}
          </div>
        </div>

        {/* Instant Threat Injection */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 card-hover-pop">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Instant Threat Burst Injection</h2>
          <p className="text-xs text-slate-500 font-semibold">Inject 5 threat transactions directly into the real-time pipeline to immediately trigger alerts and risk graph updates.</p>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'CARD TESTING', label: 'Card Testing Burst', color: 'bg-gradient-to-r from-orange-50 to-amber-50/80 border-orange-200 text-orange-900 hover:border-orange-400' },
              { id: 'ABUSE RING', label: 'Abuse Ring Burst', color: 'bg-gradient-to-r from-red-50 to-rose-50/80 border-red-200 text-red-900 hover:border-red-400' },
              { id: 'IMPOSSIBLE TRAVEL', label: 'Impossible Travel', color: 'bg-gradient-to-r from-purple-50 to-indigo-50/80 border-purple-200 text-purple-900 hover:border-purple-400' },
              { id: 'MIXED ATTACK', label: 'Mixed Threat Attack', color: 'bg-gradient-to-r from-amber-50 to-yellow-50/80 border-amber-200 text-amber-900 hover:border-amber-400' },
            ].map(threat => (
              <button
                key={threat.id}
                onClick={() => handleInject(threat.id)}
                disabled={injectLoading}
                className={`p-3 rounded-xl border text-xs font-extrabold transition-all text-left flex items-center justify-between shadow-xs active:scale-95 disabled:opacity-50 ${threat.color}`}
              >
                <span>{threat.label}</span>
                <Zap size={14} className="opacity-80 text-amber-600" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Transaction Feed Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm card-hover-pop">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Live Transaction Feed</h2>
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full">SIMULATOR PIPELINE</span>
          </div>
          <button onClick={pollFeed} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-extrabold text-[10px] uppercase">
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Risk Tier</th>
                <th className="px-4 py-3 text-center">Decision</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    No transactions streamed yet. Click START STREAM or INJECT to generate traffic.
                  </td>
                </tr>
              ) : (
                feed.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-extrabold">
                      <Link to={`/app/transactions/${t.id}`} className="text-sky-600 hover:underline">{t.id}</Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3 uppercase font-bold text-slate-600">{t.payment_method?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-center font-mono font-extrabold">{(t.risk_score ?? 0).toFixed(0)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${getRiskBadgeClass(t.risk_level)}`}>
                        {t.risk_level?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-extrabold">
                      <span className={
                        t.decision === 'allow' ? 'text-emerald-600' :
                        t.decision === 'hold' ? 'text-amber-600' : 'text-red-600'
                      }>
                        {t.decision?.toUpperCase().replace('_', '-')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-semibold">{formatRelativeTime(t.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
