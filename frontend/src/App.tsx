import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Login from './pages/Login';
import SignUp from './pages/SignUp';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Authenticated Application */}
        <Route path="/app" element={<Layout />}>
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
