import React from 'react';
import { Plane, AlertTriangle, ArrowRight, Smartphone, Globe, CreditCard, ShieldAlert, CheckCircle2, Network, Users, Activity, Zap } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function ImpossibleTravelVisual({ data }: { data?: any }) {
  const origin = data?.origin || 'Delhi, India';
  const destination = data?.destination || 'London, United Kingdom';
  const distance = data?.distance || '6,700 km';
  const timeElapsed = data?.timeElapsed || '18 minutes';
  const calculatedSpeed = data?.calculatedSpeed || '22,333 km/h';
  const thresholdSpeed = data?.thresholdSpeed || '900 km/h';

  return (
    <div className="bg-gradient-to-br from-purple-500/10 via-sky-500/5 to-indigo-500/10 border-2 border-purple-300/80 rounded-2xl p-5 shadow-xl shadow-purple-500/10 space-y-4 font-sans card-hover-pop">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-purple-600 text-white font-bold shadow-md shadow-purple-500/30 animate-bounce">
            <Plane size={18} />
          </span>
          <div>
            <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
              IMPOSSIBLE TRAVEL DETECTED
            </h3>
            <p className="text-[10px] text-purple-700 font-bold">Geographic Velocity Anomaly</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm border border-rose-400 uppercase tracking-wide">
          PHYSICALLY IMPLAUSIBLE
        </span>
      </div>

      {/* Visual Geographic Route Line with Animated Flight Icon */}
      <div className="bg-white/90 backdrop-blur border border-purple-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-purple-600 ring-4 ring-purple-100" />
            <span className="font-extrabold">{origin}</span>
          </div>

          <div className="flex-1 px-4 text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t-2 border-dashed border-purple-400 animate-pulse" />
              <span className="absolute bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-mono px-3 py-1 rounded-full font-black shadow-md border border-purple-300">
                ✈ {distance} · {timeElapsed}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 ring-4 ring-rose-100 animate-ping" />
            <span className="font-extrabold">{destination}</span>
          </div>
        </div>
      </div>

      {/* Calculated Speed Breakdown Grid */}
      <div className="grid grid-cols-4 gap-3 text-center text-xs">
        <div className="p-3 bg-white border border-purple-200 rounded-xl shadow-xs">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase">Distance</p>
          <p className="font-black font-mono text-purple-900 mt-0.5 text-sm">{distance}</p>
        </div>
        <div className="p-3 bg-white border border-purple-200 rounded-xl shadow-xs">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase">Elapsed Time</p>
          <p className="font-black font-mono text-purple-900 mt-0.5 text-sm">{timeElapsed}</p>
        </div>
        <div className="p-3 bg-rose-500/10 border-2 border-rose-300 rounded-xl shadow-xs">
          <p className="text-[9px] text-rose-600 font-black uppercase">Calculated Speed</p>
          <p className="font-black font-mono text-rose-700 mt-0.5 text-sm">{calculatedSpeed}</p>
        </div>
        <div className="p-3 bg-white border border-purple-200 rounded-xl shadow-xs">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase">Max Flight Speed</p>
          <p className="font-bold font-mono text-slate-600 mt-0.5 text-sm">{thresholdSpeed}</p>
        </div>
      </div>
    </div>
  );
}

export function CardTestingVisual({ data }: { data?: any }) {
  const txnCount = data?.txnCount || 17;
  const timeWindow = data?.timeWindow || '42 sec';
  const instruments = data?.instruments || 15;
  const deviceId = data?.deviceId || 'DEV-8821';
  const velocity = data?.velocity || '24 tx/min';

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border-2 border-amber-300/80 rounded-2xl p-5 shadow-xl shadow-amber-500/10 space-y-4 font-sans card-hover-pop">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500 text-white font-bold shadow-md shadow-amber-500/30 animate-pulse">
            <CreditCard size={18} />
          </span>
          <div>
            <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              CARD TESTING BURST DETECTED
            </h3>
            <p className="text-[10px] text-amber-800 font-bold">Rapid Micro-Validation Attack</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-sm border border-amber-400 uppercase tracking-wide">
          HIGH VELOCITY BURST
        </span>
      </div>

      {/* Signal Chain Pipeline */}
      <div className="grid grid-cols-4 gap-3 text-center text-xs">
        <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase">Single Device</p>
          <p className="font-mono font-black text-slate-900 mt-0.5 truncate text-xs">{deviceId}</p>
        </div>
        <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs">
          <p className="text-[9px] text-amber-700 font-extrabold uppercase">Unique Cards</p>
          <p className="font-mono font-black text-amber-700 mt-0.5 text-sm">{instruments} Cards</p>
        </div>
        <div className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase">Time Window</p>
          <p className="font-mono font-black text-slate-900 mt-0.5 text-sm">{timeWindow}</p>
        </div>
        <div className="p-3 bg-rose-500/10 border-2 border-rose-300 rounded-xl shadow-xs">
          <p className="text-[9px] text-rose-600 font-black uppercase">Burst Rate</p>
          <p className="font-mono font-black text-rose-700 mt-0.5 text-sm">{velocity}</p>
        </div>
      </div>
    </div>
  );
}

export function AbuseRingVisual({ data }: { data?: any }) {
  const accounts = data?.accounts || ['CUST-101', 'CUST-102', 'CUST-103', 'CUST-104'];
  const device = data?.device || 'DEV-902';
  const ip = data?.ip || '198.51.100.42';

  return (
    <div className="bg-gradient-to-br from-rose-500/10 via-indigo-500/5 to-purple-500/10 border-2 border-rose-300/80 rounded-2xl p-5 shadow-xl shadow-rose-500/10 space-y-4 font-sans card-hover-pop">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-rose-600 text-white font-bold shadow-md shadow-rose-500/30 animate-pulse">
            <Network size={18} />
          </span>
          <div>
            <h3 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
              COORDINATED ABUSE RING DETECTED
            </h3>
            <p className="text-[10px] text-rose-700 font-bold">Multi-Account Device Cluster</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-sm border border-rose-400 uppercase tracking-wide">
          SHARED DEVICE CLUSTER
        </span>
      </div>

      <div className="bg-white/90 backdrop-blur border border-rose-200 rounded-xl p-4 flex items-center justify-between text-xs gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800 font-black bg-sky-50 border border-sky-200 px-3 py-2 rounded-lg">
          <Users size={16} className="text-sky-600" />
          <span>{accounts.length} Shared Accounts</span>
        </div>
        <ArrowRight size={16} className="text-rose-400 animate-pulse" />
        <div className="flex items-center gap-2 text-slate-800 font-black bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          <Smartphone size={16} className="text-amber-600" />
          <span className="font-mono">{device}</span>
        </div>
        <ArrowRight size={16} className="text-rose-400 animate-pulse" />
        <div className="flex items-center gap-2 text-slate-800 font-black bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg">
          <Globe size={16} className="text-purple-600" />
          <span className="font-mono">{ip}</span>
        </div>
      </div>
    </div>
  );
}

