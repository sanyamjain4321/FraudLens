import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function DetectiveLensIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* BOLD MAGNIFYING GLASS BEZEL RING (Matching uploaded image) */}
      <circle cx="20" cy="19" r="14.5" stroke="white" strokeWidth="4.8" strokeOpacity="0.98" />

      {/* DISTINCT TOP-LEFT CRESCENT GLARE REFLECTION */}
      <path
        d="M 10.5 16 A 11 11 0 0 1 20 8.5"
        stroke="#38bdf8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeOpacity="0.95"
      />

      {/* HANDLE JUNCTION NECK */}
      <path
        d="M 29.5 28 L 32.5 31"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="square"
      />

      {/* HEAVY BOLD DIAGONAL HANDLE */}
      <path
        d="M 32 30.5 L 42 40.5"
        stroke="white"
        strokeWidth="5.6"
        strokeLinecap="round"
      />
      <path
        d="M 32 30.5 L 42 40.5"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* DETECTIVE SILHOUETTE (FEDORA HAT + COAT LAPELS + RED TIE) */}
      {/* Fedora Hat Crown */}
      <path
        d="M14.5 12.5 C14.5 7.5, 17 6.2, 20 6.2 C23 6.2, 25.5 7.5, 25.5 12.5 Z"
        fill="white"
      />

      {/* Fedora Hat Ribbon Band */}
      <path d="M14.5 12.2 L25.5 12.2" stroke="#0284c7" strokeWidth="1.3" strokeLinecap="round" />

      {/* Fedora Hat Brim */}
      <path
        d="M9.5 13.5 C13.8 11.2, 26.2 11.2, 30.5 13.5 C31.2 14, 30.5 15, 28 15 C21 15 19 15 12 15 C9.5 15 8.8 14 9.5 13.5 Z"
        fill="white"
      />

      {/* High Coat Lapels / Collar Wings */}
      <path
        d="M8.5 21.5 L15.5 16 L17.2 20.5 L20 29 L22.8 20.5 L24.5 16 L31.5 21.5 L20 30 Z"
        fill="white"
      />

      {/* Distinctive Red Tie */}
      <path
        d="M17.8 21 H22.2 L20.9 28 C20.5 28.6, 19.5 28.6, 19.1 28 Z"
        fill="#ef4444"
      />
    </svg>
  );
}

export default function Logo({ showSubtitle = true, size = 'md', className = '' }: LogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-xs tracking-wider',
    md: 'text-base tracking-tight font-extrabold',
    lg: 'text-xl tracking-tight font-extrabold',
    xl: 'text-2xl tracking-tight font-extrabold',
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group transition-all hover:scale-[1.02] ${className}`}>
      {/* Custom FraudLens Brand Symbol: Bold Detective Magnifying Glass with Fedora Hat & Red Tie */}
      <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all flex-shrink-0 relative p-1`}>
        <DetectiveLensIcon />
      </div>

      <div className="flex flex-col">
        <span className={`text-slate-900 ${titleSizes[size]}`}>
          Fraud<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">Lens</span>
        </span>
        {showSubtitle && (
          <span className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase font-sans">
            Payment Risk Intelligence
          </span>
        )}
      </div>
    </Link>
  );
}



