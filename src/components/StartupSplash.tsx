import React, { useEffect, useState } from 'react';
import { DetectiveLensIcon } from './Logo';

const STAGES = [
  { label: 'Initializing FraudLens AI Engine', icon: '⚡' },
  { label: 'Loading Velocity & Behavioral Models', icon: '🧠' },
  { label: 'Connecting Graph Risk Network', icon: '🕸️' },
  { label: 'Real-Time Ensemble Pipeline Active', icon: '✅' },
];

export default function StartupSplash({ onFinish }: { onFinish?: () => void }) {
  const [stage, setStage] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const t1 = setTimeout(() => { setStage(1); setProgress(35); }, 500);
    const t2 = setTimeout(() => { setStage(2); setProgress(62); }, 1000);
    const t3 = setTimeout(() => { setStage(3); setProgress(90); }, 1500);
    const t4 = setTimeout(() => { setProgress(100); }, 1900);
    const t5 = setTimeout(() => setIsFading(true), 2100);
    const t6 = setTimeout(() => { if (onFinish) onFinish(); }, 2550);
    return () => [t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white font-sans overflow-hidden transition-opacity duration-500 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 20% 20%, #0369a1 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #4f46e5 0%, transparent 50%), radial-gradient(ellipse at 60% 10%, #7c3aed 0%, transparent 40%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 70%, #020617 100%)',
      }}
    >
      {/* Animated background orbs */}
      <div className="absolute w-[600px] h-[600px] rounded-full pointer-events-none animate-bubble-slow"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)', top: '-10%', left: '-10%' }} />
      <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none animate-bubble-fast"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', bottom: '-5%', right: '-5%' }} />
      <div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none animate-bubble-slow"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', top: '30%', right: '10%', animationDelay: '2s' }} />
      <div className="absolute w-[300px] h-[300px] rounded-full pointer-events-none animate-bubble-fast"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', bottom: '20%', left: '5%', animationDelay: '1s' }} />
      <div className="absolute w-[250px] h-[250px] rounded-full pointer-events-none animate-bubble-slow"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.10) 0%, transparent 70%)', top: '60%', left: '25%', animationDelay: '3s' }} />

      {/* Animated dot grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.6) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center gap-7 px-8 text-center max-w-lg">

        {/* Detective Lens Icon with rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer radar sweep ring */}
          <div className="absolute w-40 h-40 rounded-full border border-sky-400/30 animate-radar-sweep pointer-events-none" />
          {/* Middle ping ring */}
          <div className="absolute w-32 h-32 rounded-full border border-indigo-400/25 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
          {/* Inner glow ring */}
          <div className="absolute w-28 h-28 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)' }} />

          {/* Icon box */}
          <div className="w-24 h-24 rounded-[2rem] p-2 flex items-center justify-center shadow-2xl animate-holo-shine"
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 50%, #7c3aed 100%)', boxShadow: '0 0 60px rgba(56,189,248,0.4), 0 0 30px rgba(99,102,241,0.3)' }}>
            <DetectiveLensIcon />
          </div>
        </div>

        {/* Brand name */}
        <div className="space-y-1.5">
          <h1 className="text-5xl font-black tracking-tight leading-none">
            Fraud<span className="text-transparent"
              style={{ WebkitTextFillColor: 'transparent', background: 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)', WebkitBackgroundClip: 'text' }}>Lens</span>
          </h1>
          <p className="text-[11px] font-black tracking-[0.35em] uppercase text-slate-300">
            Real-Time Payment Risk Intelligence
          </p>
        </div>

        {/* Stage status lines */}
        <div className="space-y-1.5 w-full text-left bg-white/5 backdrop-blur border border-white/10 rounded-2xl px-5 py-4">
          {STAGES.map((s, i) => (
            <div key={i} className={`flex items-center gap-2.5 text-xs font-mono transition-all duration-300 ${i <= stage ? 'opacity-100' : 'opacity-25'}`}>
              <span className={`text-sm ${i < stage ? 'text-emerald-400' : i === stage ? 'text-sky-300 animate-pulse' : 'text-slate-500'}`}>
                {i < stage ? '✓' : i === stage ? '›' : '○'}
              </span>
              <span className={i < stage ? 'text-emerald-300' : i === stage ? 'text-sky-200' : 'text-slate-500'}>
                {s.icon} {s.label}{i === stage && stage < 3 ? '...' : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="h-2 w-full rounded-full overflow-hidden border border-white/10"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)',
                boxShadow: '0 0 12px rgba(56,189,248,0.6)',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" style={{ display: 'inline-block' }} />
              Loading AI pipeline
            </span>
            <span className="text-sky-300 font-bold">{progress}%</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
          Powered by AI Risk Intelligence · Razorpay Buildathon
        </p>
      </div>
    </div>
  );
}



