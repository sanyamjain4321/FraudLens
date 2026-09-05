const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const componentsDir = path.join(srcDir, 'components');

[pagesDir, componentsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const files = {
    'components/Layout.tsx': `import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, ShieldAlert, Network, PlayCircle, BarChart3, Activity, FileText, User } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const nav = [
    { name: 'OVERVIEW', path: '/', icon: LayoutDashboard },
    { name: 'TRANSACTIONS', path: '/transactions', icon: List },
    { name: 'THREAT INTELLIGENCE', path: '/threats', icon: ShieldAlert },
    { name: 'RISK NETWORK', path: '/network', icon: Network },
    { name: 'TRAFFIC LAB', path: '/lab', icon: PlayCircle },
    { name: 'ANALYTICS', path: '/analytics', icon: BarChart3 },
    { name: 'MODEL PERFORMANCE', path: '/model', icon: Activity },
    { name: 'AUDIT TRAIL', path: '/audit', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-primary text-text-primary overflow-hidden font-sans">
      <div className="w-64 bg-secondary border-r border-border flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <ShieldAlert className="text-cyan" />
          <div>
            <h1 className="font-bold text-lg tracking-wider text-text-primary">RAZORSHIELD</h1>
            <p className="text-xs text-text-muted">RISK OPERATIONS</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {nav.map(item => (
            <Link key={item.path} to={item.path} className={\`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors \${location.pathname === item.path ? 'bg-panel-hover text-cyan border-r-2 border-cyan' : 'text-text-secondary hover:text-text-primary hover:bg-panel'}\`}>
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Link to="/profile" className="flex items-center gap-3 px-2 py-2 text-sm text-text-secondary hover:text-text-primary">
            <User size={18} /> Profile
          </Link>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden bg-primary">
        <header className="h-16 border-b border-border bg-secondary flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold">{nav.find(n => n.path === location.pathname)?.name || 'Dashboard'}</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-emerald">
              <span className="w-2 h-2 rounded-full bg-emerald"></span> System Online
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}`,
    'App.tsx': `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investigation from './pages/Investigation';
import ThreatIntelligence from './pages/ThreatIntelligence';
import RiskNetwork from './pages/RiskNetwork';
import TrafficLab from './pages/TrafficLab';
import Analytics from './pages/Analytics';
import ModelPerformance from './pages/ModelPerformance';
import AuditTrail from './pages/AuditTrail';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="transactions/:id" element={<Investigation />} />
          <Route path="threats" element={<ThreatIntelligence />} />
          <Route path="network" element={<RiskNetwork />} />
          <Route path="lab" element={<TrafficLab />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="model" element={<ModelPerformance />} />
          <Route path="audit" element={<AuditTrail />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}`,
    'pages/Dashboard.tsx': `import React, { useEffect, useState } from 'react';
export default function Dashboard() {
  return <div className="space-y-6">
    <div className="grid grid-cols-4 gap-4">
      {['Transactions Processed', 'Flagged Transactions', 'Fraud Prevented', 'False Positive Rate'].map(k => (
        <div key={k} className="p-4 bg-panel border border-border rounded shadow-sm">
          <p className="text-sm text-text-muted">{k}</p>
          <p className="text-2xl font-semibold mt-1">---</p>
        </div>
      ))}
    </div>
    <div className="h-96 bg-panel border border-border flex items-center justify-center text-text-muted rounded">
      [Live Risk Activity Chart]
    </div>
  </div>;
}`,
    'pages/Transactions.tsx': `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
export default function Transactions() {
  const [txns, setTxns] = useState([]);
  
  useEffect(() => {
    fetch('/api/transactions?per_page=50')
      .then(r => r.json())
      .then(d => setTxns(d.items || []));
  }, []);
  
  return <div className="space-y-4">
    <div className="bg-panel border border-border rounded overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-secondary text-text-muted uppercase">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Risk</th>
            <th className="px-4 py-3">Decision</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {txns.map(t => (
            <tr key={t.id} className="hover:bg-panel-hover">
              <td className="px-4 py-3"><Link to={\`/transactions/\${t.id}\`} className="text-cyan hover:underline">{t.id}</Link></td>
              <td className="px-4 py-3">{new Date(t.timestamp).toLocaleString()}</td>
              <td className="px-4 py-3">₹{t.amount?.toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className={\`px-2 py-1 rounded text-xs \${t.risk_level === 'high' || t.risk_level === 'critical' ? 'bg-danger/20 text-danger' : t.risk_level === 'medium' ? 'bg-amber/20 text-amber' : 'bg-emerald/20 text-emerald'}\`}>
                  {t.risk_score} - {t.risk_level?.toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3">{t.decision?.toUpperCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>;
}`,
    'pages/Investigation.tsx': `import React from 'react';
export default function Investigation() { return <div className="p-4">Investigation details...</div>; }`,
    'pages/ThreatIntelligence.tsx': `import React from 'react';
export default function ThreatIntelligence() { return <div className="p-4">Threat Intelligence...</div>; }`,
    'pages/RiskNetwork.tsx': `import React from 'react';
export default function RiskNetwork() { return <div className="p-4">Risk Network...</div>; }`,
    'pages/TrafficLab.tsx': `import React from 'react';
export default function TrafficLab() { return <div className="p-4">Traffic Lab...</div>; }`,
    'pages/Analytics.tsx': `import React from 'react';
export default function Analytics() { return <div className="p-4">Analytics...</div>; }`,
    'pages/ModelPerformance.tsx': `import React from 'react';
export default function ModelPerformance() { return <div className="p-4">Model Performance...</div>; }`,
    'pages/AuditTrail.tsx': `import React from 'react';
export default function AuditTrail() { return <div className="p-4">Audit Trail...</div>; }`,
    'pages/Profile.tsx': `import React from 'react';
export default function Profile() { return <div className="p-4">Profile...</div>; }`,
    'pages/LandingPage.tsx': `import React from 'react';
export default function LandingPage() { return <div className="p-4">Landing Page...</div>; }`,
};

for (const [filepath, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(srcDir, filepath), content);
}

console.log('Frontend scaffolding created.');
