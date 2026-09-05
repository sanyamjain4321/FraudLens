import React, { useEffect, useState } from 'react';
import { User, Shield, Activity, Award, LogOut, CheckCircle2, Building, Mail, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/utils';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.auth.me().then(u => setUser(u)).catch(() => {
      const saved = localStorage.getItem('razorshield_user');
      if (saved) {
        try { setUser(JSON.parse(saved)); } catch (_) {}
      }
    });
  }, []);

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch (_) {}
    localStorage.removeItem('razorshield_token');
    localStorage.removeItem('razorshield_user');
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between shadow-xs flex-wrap gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-sky-100 border-2 border-sky-200 text-sky-700 flex items-center justify-center font-extrabold text-xl shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={28} />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900">{user?.name || 'Risk Analyst'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 border border-sky-200 text-sky-700 uppercase tracking-wider">
                {user?.role || 'Senior Risk Analyst'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">ID: {user?.id || 'USR-DEMO-01'}</p>
            <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 pt-0.5">
              <Building size={13} className="text-slate-400" /> {user?.organization || 'RazorShield Risk Ops'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>

      {/* Account Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
          User Account Information
        </h2>

        <div className="grid grid-cols-2 gap-6 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Full Name</span>
            <span className="text-slate-900 font-semibold text-sm">{user?.name || '—'}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Email Address</span>
            <span className="text-slate-900 font-mono font-semibold text-sm flex items-center gap-1.5">
              <Mail size={14} className="text-slate-400" /> {user?.email || '—'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Organization</span>
            <span className="text-slate-900 font-semibold text-sm">{user?.organization || 'RazorShield Risk Ops'}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Assigned Role</span>
            <span className="text-slate-900 font-semibold text-sm">{user?.role || 'Risk Analyst'}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Account Created</span>
            <span className="text-slate-700 font-medium text-xs flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" /> {formatDateTime(user?.created_at)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Last Login</span>
            <span className="text-slate-700 font-medium text-xs flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" /> {formatDateTime(user?.last_login)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
