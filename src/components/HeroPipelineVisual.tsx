import React, { useEffect, useState } from 'react';
import { ArrowRight, ShieldAlert, Zap, Network, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

const PIPELINE_SAMPLES = [
  {
    id: 'TXN-8841',
    amount: '₹2,450',
    customer: 'C-2048',
    velocity: '4 tx / 60s',
    network: '3 linked devices',
    score: 82,
    level: 'HIGH',
    decision: 'HOLD FOR REVIEW',
    color: 'border-amber-400 bg-amber-500/10 text-amber-900 shadow-lg shadow-amber-500/10',
    badge: 'bg-amber-500 text-white shadow-sm',
    scoreColor: 'bg-amber-500',
  },
  {
    id: 'TXN-9012',
    amount: '₹14,999',
    customer: 'C-1092',
    velocity: '18 tx / 30s',
    network: '14 payment cards',
    score: 96,
    level: 'CRITICAL',
    decision: 'AUTOMATIC DECLINE',
    color: 'border-rose-400 bg-rose-500/10 text-rose-900 shadow-lg shadow-rose-500/10',
    badge: 'bg-rose-600 text-white shadow-sm',
    scoreColor: 'bg-rose-600',
  },
  {
    id: 'TXN-4102',
    amount: '₹850',
    customer: 'C-8821',
    velocity: '1 tx / 1h',
    network: '1 device',
    score: 12,
    level: 'LOW',
    decision: 'ALLOW & APPROVE',
    color: 'border-emerald-400 bg-emerald-500/10 text-emerald-900 shadow-lg shadow-emerald-500/10',
    badge: 'bg-emerald-600 text-white shadow-sm',
    scoreColor: 'bg-emerald-500',
  },
];

export default function HeroPipelineVisual() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % PIPELINE_SAMPLES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const item = PIPELINE_SAMPLES[activeIdx];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur border border-sky-200/80 rounded-2xl p-6 shadow-2xl shadow-sky-500/10 space-y-6 animate-holo-shine">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-600"></span>
          </span>
          <span className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            Live Risk Pipeline Flow
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
            Latency: &lt;45ms
          </span>
          <span className="text-[10px] text-slate-400 font-mono">ENFORCE ENGINE v2.4</span>
        </div>
      </div>

      {/* 4 Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        {/* Stage 1: Ingestion */}
        <div className="bg-gradient-to-br from-sky-50 to-indigo-50/50 border border-sky-200 rounded-xl p-3.5 space-y-1.5 transition-all card-hover-pop">
          <p className="text-[9px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-sky-600" />
            1. Ingestion
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-900 font-mono">{item.id}</span>
            <span className="text-xs font-bold text-sky-600 font-mono">{item.amount}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Cust: {item.customer}</p>
        </div>

        {/* Stage 2: Velocity & Features */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 border border-indigo-200 rounded-xl p-3.5 space-y-1.5 transition-all card-hover-pop">
          <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-indigo-600" />
            2. Velocity Analysis
          </p>
          <p className="text-xs font-extrabold text-slate-800">{item.velocity}</p>
          <p className="text-[10px] text-slate-500 font-medium">Sliding 60s Window</p>
        </div>

        {/* Stage 3: Network & ML Score */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-200 rounded-xl p-3.5 space-y-1.5 transition-all card-hover-pop">
          <p className="text-[9px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
            <Network className="w-3 h-3 text-purple-600" />
            3. Graph & ML Score
          </p>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-medium">{item.network}</span>
            <span className="text-xs font-extrabold font-mono text-slate-900">{item.score}/100</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden p-0.5">
            <div className={`${item.scoreColor} h-full rounded-full transition-all duration-500 shadow-sm`} style={{ width: `${item.score}%` }} />
          </div>
        </div>

        {/* Stage 4: Decision Output */}
        <div className={`border-2 rounded-xl p-3.5 space-y-1.5 transition-all card-hover-pop ${item.color}`}>
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            4. Decision Output
          </p>
          <p className="text-xs font-extrabold tracking-wide">{item.decision}</p>
          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${item.badge}`}>
            {item.level} RISK
          </span>
        </div>
      </div>
    </div>
  );
}

