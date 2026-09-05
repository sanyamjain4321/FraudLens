import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, List, ShieldAlert, Network,
  FlaskConical, BarChart3, Cpu, FileText, User, LogOut, AlertCircle, Clock
} from 'lucide-react';
import { api } from '../lib/api';
import Logo from './Logo';

const NAV = [
  { name: 'Overview', path: '/app', icon: LayoutDashboard },
  { name: 'Transactions', path: '/app/transactions', icon: List },
  { name: 'Threat Intelligence', path: '/app/threats', icon: ShieldAlert },
  { name: 'Risk Network', path: '/app/network', icon: Network },
  { name: 'Traffic Lab', path: '/app/lab', icon: FlaskConical },
  { name: 'Analytics', path: '/app/analytics', icon: BarChart3 },
  { name: 'Model Performance', path: '/app/model', icon: Cpu },
  { name: 'Audit Trail', path: '/app/audit', icon: FileText },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true
      }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const checkHealth = () => {
      api.health()
        .then(() => setIsOnline(true))
        .catch(() => setIsOnline(false));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('razorshield_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch (_) {}
    }

    api.auth.me().then(u => {
      setUser(u);
      localStorage.setItem('razorshield_user', JSON.stringify(u));
    }).catch(() => {
      if (localStorage.getItem('razorshield_token')) {
        localStorage.removeItem('razorshield_token');
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch (_) {}
    localStorage.removeItem('razorshield_token');
    localStorage.removeItem('razorshield_user');
    navigate('/login');
  };

  const currentPage = NAV.find(n =>
    n.path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(n.path)
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-sky-50/60 via-blue-50/40 to-indigo-100/50 text-slate-900 overflow-hidden font-sans relative">
      {/* Ambient Blue Glowing Circles in Background */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl pointer-events-none animate-bubble-slow" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none animate-bubble-fast" />

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white/95 backdrop-blur-md border-r border-sky-200/80 flex flex-col shadow-lg z-10">
        {/* Logo Header - Logo click returns Home (/) */}
        <div className="px-6 py-4 border-b border-sky-100/80 flex items-center justify-between">
          <Logo showSubtitle={true} size="md" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1.5 px-3">
          {NAV.map(item => {
            const isActive = item.path === '/app'
              ? location.pathname === '/app'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 text-xs tracking-wide rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500/15 via-blue-500/15 to-indigo-500/15 text-sky-800 font-extrabold border-l-4 border-sky-600 shadow-md shadow-sky-500/10 translate-x-1'
                    : 'text-slate-600 font-bold hover:text-slate-900 hover:bg-sky-50/70 hover:translate-x-0.5'
                }`}
              >
                <item.icon size={17} className={isActive ? 'text-sky-600 animate-pulse' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <div className="border-t border-sky-100 p-4 bg-sky-50/60">
          <div className="flex items-center justify-between">
            <Link
              to="/app/profile"
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-blue-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={15} />}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-slate-900 truncate">{user?.name || 'Risk Analyst'}</p>
                <p className="text-[10px] text-slate-500 font-bold truncate">{user?.role || 'Senior Analyst'}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden z-10 min-w-0">
        {/* Topbar with rich ocean blue gradient accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-blue-600 via-indigo-600 to-purple-600" />
        <header className="h-14 flex-shrink-0 border-b border-sky-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900">
              {currentPage?.name || 'Risk Operations'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-600 font-bold hidden sm:inline">
              Fraud<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 font-extrabold">Lens</span> — Real-Time Risk Operations
            </span>

            {/* Real-Time Live Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 border border-slate-200 rounded-full text-xs font-mono font-bold text-slate-700 shadow-xs">
              <Clock size={13} className="text-sky-600 animate-pulse" />
              <span>{timeStr}</span>
            </div>

            {/* System Connection Health Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 shadow-xs">
              {isOnline ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs text-emerald-800 font-extrabold uppercase tracking-wider">SYSTEM ONLINE</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs text-red-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle size={12} /> CONNECTION ERROR
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-5 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
