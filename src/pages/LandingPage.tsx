import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Network, Users, DollarSign, Activity, ArrowRight,
  ShieldCheck, Cpu, ChevronRight, CheckCircle2, Plane,
  Sparkles, Clock, Target, ShieldAlert,
} from 'lucide-react';
import Logo from '../components/Logo';
import NetworkBackground from '../components/NetworkBackground';
import HeroPipelineVisual from '../components/HeroPipelineVisual';

const CAPABILITIES = [
  { icon: Zap,        title: 'Velocity Intelligence',          desc: 'Tracks rapid transaction bursts across cards, devices, IPs and merchant categories over sliding temporal windows.',                              gradient: 'from-amber-500 to-orange-500',  shadow: 'shadow-amber-500/25'  },
  { icon: Network,    title: 'Network Intelligence',           desc: 'Detects multi-customer abuse rings sharing devices, cards, or IP addresses through graph relationship clustering.',                               gradient: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/25' },
  { icon: Plane,      title: 'Impossible Travel Detection',    desc: 'Flags payment instruments observed across distant locations within physically implausible time deltas.',                                          gradient: 'from-sky-500 to-cyan-500',      shadow: 'shadow-sky-500/25'    },
  { icon: Cpu,        title: 'Explainable Risk Scoring',       desc: 'XGBoost anomaly classifier generating 0-100 normalized risk scores with exact evidence explanations for every transaction.',                    gradient: 'from-emerald-500 to-teal-600',  shadow: 'shadow-emerald-500/25'},
  { icon: Users,      title: 'Human-in-the-Loop Workstation',  desc: 'Empowers analysts to Allow, Step-Up, Hold or Decline with persistent case creation and immutable audit records.',                               gradient: 'from-blue-500 to-indigo-600',   shadow: 'shadow-blue-500/25'   },
  { icon: DollarSign, title: 'Risk Economics',                 desc: 'Modelled financial impact balancing false positive customer friction against prevented fraud exposure.',                                         gradient: 'from-rose-500 to-pink-600',     shadow: 'shadow-rose-500/25'   },
];

const METRICS = [
  { value: '< 15ms',   label: 'Detection Latency',      color: 'text-sky-600',     bg: 'from-sky-50 to-blue-50',      border: 'border-sky-200',     icon: Clock        },
  { value: '99.8%',    label: 'Card Testing Precision',  color: 'text-emerald-600', bg: 'from-emerald-50 to-teal-50',  border: 'border-emerald-200', icon: Target       },
  { value: '4-Engine', label: 'Ensemble Pipeline',       color: 'text-indigo-600',  bg: 'from-indigo-50 to-purple-50', border: 'border-indigo-200',  icon: Cpu          },
  { value: '100%',     label: 'Explainable Evidence',    color: 'text-amber-600',   bg: 'from-amber-50 to-orange-50',  border: 'border-amber-200',   icon: CheckCircle2 },
];

const ARCH_STEPS = [
  { label: 'Payment Event',         sub: 'Gateway Webhook',               color: 'from-slate-600 to-slate-700',   text: 'text-slate-200',  highlight: false },
  { label: 'Feature Extraction',    sub: 'Device, BIN, Velocity',          color: 'from-sky-600 to-blue-700',      text: 'text-sky-100',    highlight: false },
  { label: 'Ensemble Engine',       sub: 'Velocity, ML, Graph, Rules',     color: 'from-indigo-600 to-purple-700', text: 'text-indigo-100', highlight: true  },
  { label: 'Risk Score + Evidence', sub: '0-100 Score, SHAP',              color: 'from-amber-600 to-orange-600',  text: 'text-amber-100',  highlight: false },
  { label: 'Decision + Audit',      sub: 'Allow, Hold, Decline',           color: 'from-emerald-600 to-teal-600',  text: 'text-emerald-100',highlight: false },
];

const HOW_STEPS = [
  { num: '01', title: 'Real-Time Ingestion',          desc: 'Processes payment payloads immediately as transactions pass through the gateway, extracting device fingerprints, BINs, velocity counts, and customer history.', color: 'from-sky-500 to-blue-600',     icon: Activity    },
  { num: '02', title: '4-Layer Risk Scoring',          desc: 'Evaluates every payload in parallel across Velocity Rules, Machine Learning Anomaly models, Coordinated Abuse Ring graphs, and Geolocation checks.',           color: 'from-indigo-500 to-purple-600', icon: ShieldAlert  },
  { num: '03', title: 'Automated and Analyst Actions', desc: 'Low-risk payments pass instantly; high-risk payments trigger automated step-up, hold, or decline decisions with full analyst auditability.',                   color: 'from-emerald-500 to-teal-600',  icon: ShieldCheck  },
];

const ECO_CARDS = [
  { icon: ShieldCheck, label: 'Fraud Prevented',    desc: 'Every declined high-risk transaction stops money leaving the merchant before a chargeback occurs.',                                color: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50',  border: 'border-emerald-200' },
  { icon: Target,      label: 'False Positive Rate', desc: 'FraudLens optimises the precision-recall tradeoff targeting below 2% FPR to preserve genuine customer revenue.',                  color: 'from-amber-500 to-orange-500', bg: 'from-amber-50 to-orange-50',  border: 'border-amber-200'   },
  { icon: Activity,    label: 'Sub-15ms Latency',    desc: 'Inline risk scoring adds near-zero overhead to the payment gateway, ensuring seamless checkout for legitimate users.',            color: 'from-sky-500 to-indigo-600',   bg: 'from-sky-50 to-indigo-50',    border: 'border-sky-200'     },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-900 font-sans overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="bg-white/95 backdrop-blur-md fixed top-0 w-full z-50 border-b border-slate-200/80 shadow-sm">
        <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600" />
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo showSubtitle={true} size="md" />
          <div className="flex items-center gap-5">
            {([['How It Works','#how-it-works'],['Capabilities','#capabilities'],['Architecture','#architecture'],['Economics','#economics']] as [string,string][]).map(([l,h]) => (
              <a key={l} href={h} className="text-xs font-bold text-slate-600 hover:text-sky-600 transition-colors hidden md:inline">{l}</a>
            ))}
            <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200">
              <Link to="/login" className="text-xs font-bold text-slate-700 hover:text-sky-600 transition-colors">Sign In</Link>
              <Link to="/app"
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white hover:scale-105 transition-all flex items-center gap-1.5 shadow-md"
                style={{ background: 'linear-gradient(135deg,#0284c7,#4f46e5)' }}>
                Enter Operations <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-20 pb-32 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 15% 30%,#0c4a6e 0%,transparent 52%), radial-gradient(ellipse at 85% 70%,#312e81 0%,transparent 52%), linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)' }}>
        <NetworkBackground />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(56,189,248,0.14) 0%,transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 70%)' }} />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10 pt-14 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider"
            style={{ background: 'rgba(56,189,248,0.08)' }}>
            <Sparkles size={13} className="text-sky-400" />
            FraudLens - AI-Powered Real-Time Fraud Detection
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.07]">
            Detect threats{' '}
            <span style={{ WebkitTextFillColor: 'transparent', background: 'linear-gradient(90deg,#38bdf8,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              before they<br />become losses.
            </span>
          </h1>

          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Identify payment fraud in real time using behavioral velocity, anomaly detection,
            network intelligence and explainable risk scoring — all in under 15ms.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/app"
              className="px-7 py-3.5 rounded-xl text-white text-sm font-bold hover:scale-105 transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#0284c7,#4f46e5)', boxShadow: '0 0 32px rgba(56,189,248,0.28)' }}>
              ENTER RISK OPERATIONS <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works"
              className="px-7 py-3.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 hover:scale-105 transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)' }}>
              SEE HOW IT WORKS <ChevronRight size={16} />
            </a>
          </div>

          <div className="pt-8 animate-float">
            <HeroPipelineVisual />
          </div>
        </div>
      </section>

      {/* METRICS BAND */}
      <section className="py-10 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          {METRICS.map((m) => (
            <div key={m.label} className={`bg-gradient-to-br ${m.bg} border ${m.border} rounded-2xl p-5 text-center card-hover-pop shadow-sm`}>
              <m.icon size={22} className={`mx-auto mb-2 ${m.color}`} />
              <p className={`text-3xl font-black font-mono ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 space-y-14">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-sky-300"
              style={{ background: 'rgba(56,189,248,0.09)', border: '1px solid rgba(56,189,248,0.22)' }}>
              Why FraudLens
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Modern Payments Demand{' '}
              <span style={{ WebkitTextFillColor: 'transparent', background: 'linear-gradient(90deg,#38bdf8,#818cf8)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                Real-Time Defense
              </span>
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Legacy fraud filters rely on static post-facto rules. FraudLens combines real-time
              streaming feature engineering with graph network intelligence and explainable ML anomaly scoring.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_STEPS.map((step) => (
              <div key={step.num} className="rounded-2xl p-6 space-y-4 card-hover-pop"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg text-white`}>
                  <step.icon size={22} />
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{step.num}</div>
                <h3 className="text-base font-black text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="py-24 bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/30 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 space-y-14">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-700"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              Core Capabilities
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Multi-Dimensional{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">Threat Detection</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title}
                className="bg-white rounded-2xl p-6 space-y-4 border border-slate-200 hover:border-transparent card-hover-pop group transition-all">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cap.gradient} flex items-center justify-center shadow-md ${cap.shadow} text-white`}>
                  <cap.icon size={22} />
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition-colors">{cap.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" className="py-24"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 space-y-14">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-emerald-300"
              style={{ background: 'rgba(16,185,129,0.09)', border: '1px solid rgba(16,185,129,0.22)' }}>
              End-to-End Pipeline
            </div>
            <h2 className="text-3xl font-black text-white">FraudLens System Architecture</h2>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-stretch min-w-[700px] gap-2">
              {ARCH_STEPS.map((step, i) => (
                <React.Fragment key={i}>
                  <div className={`flex-1 bg-gradient-to-br ${step.color} rounded-2xl p-4 text-center space-y-2 shadow-xl card-hover-pop ${step.highlight ? 'ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-slate-900 scale-[1.04]' : ''}`}>
                    <div className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${step.text}`}>
                      {i === 0 ? 'Input' : i === ARCH_STEPS.length - 1 ? 'Output' : `Step ${i}`}
                    </div>
                    <p className={`text-xs font-black leading-tight ${step.text}`}>{step.label}</p>
                    <p className={`text-[9px] font-bold opacity-70 ${step.text}`}>{step.sub}</p>
                  </div>
                  {i < ARCH_STEPS.length - 1 && (
                    <div className="flex items-center flex-shrink-0 px-1">
                      <ChevronRight size={18} className="text-slate-500" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ECONOMICS */}
      <section id="economics" className="py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-rose-700"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              Risk Economics
            </div>
            <h2 className="text-3xl font-black text-slate-900">Financial Impact Modelling</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Every block and hold decision has a financial impact. FraudLens quantifies both prevented
              fraud exposure and false positive revenue friction.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {ECO_CARDS.map((card) => (
              <div key={card.label} className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-6 space-y-4 card-hover-pop`}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}>
                  <card.icon size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-900">{card.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 30% 50%,#0c4a6e 0%,transparent 58%), radial-gradient(ellipse at 70% 50%,#312e81 0%,transparent 58%), linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(148,163,184,0.55) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center space-y-7">
          <Logo showSubtitle={false} size="lg" className="mx-auto" />
          <p className="text-slate-400 text-sm leading-relaxed">
            FraudLens is a real-time payment risk intelligence platform built for the Razorpay Buildathon TRACK 2 - AI Risk Manager.
          </p>
          <Link to="/app"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-white font-bold text-sm hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg,#0284c7,#4f46e5)', boxShadow: '0 0 40px rgba(56,189,248,0.28)' }}>
            Enter Risk Operations <ArrowRight size={17} />
          </Link>
          <p className="text-slate-600 text-[11px]">Copyright 2026 FraudLens - Razorpay Buildathon - Track 2 AI Risk Manager</p>
        </div>
      </footer>

    </div>
  );
}