import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  if (typeof amount !== 'number') return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(ts: string | number | Date | null | undefined): string {
  if (!ts) return '—';
  try {
    let str = String(ts).trim();
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }
    if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
      str += 'Z';
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true
    });
  } catch (_) {
    return '—';
  }
}

export function formatRelativeTime(ts: string | number | Date | null | undefined): string {
  if (!ts) return '—';
  try {
    let str = String(ts).trim();
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }
    if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
      str += 'Z';
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 5 && seconds >= -5) return 'Just now';
    if (seconds < 0) return 'Just now';
    if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch (_) {
    return '—';
  }
}

export function getRiskColor(level: string): string {
  switch (level?.toLowerCase()) {
    case 'low': return 'text-emerald-600';
    case 'medium': return 'text-amber-600';
    case 'high': return 'text-orange-600';
    case 'critical': return 'text-red-600';
    default: return 'text-slate-500';
  }
}

export function getRiskBadgeClass(level: string): string {
  switch (level?.toLowerCase()) {
    case 'low': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'medium': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'high': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'critical': return 'bg-red-50 text-red-700 border border-red-200';
    default: return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

export function getDecisionBadgeClass(decision: string): string {
  switch (decision?.toLowerCase()) {
    case 'allow': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'step_up': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'hold': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'decline': return 'bg-red-50 text-red-700 border border-red-200';
    default: return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

export function getRiskBorderClass(level: string): string {
  switch (level?.toLowerCase()) {
    case 'critical': return 'border-l-4 border-l-red-500';
    case 'high': return 'border-l-4 border-l-orange-500';
    case 'medium': return 'border-l-4 border-l-amber-500';
    default: return 'border-l-4 border-l-transparent';
  }
}
