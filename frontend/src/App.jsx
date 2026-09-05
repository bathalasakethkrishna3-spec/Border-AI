import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveSurveillance from './pages/LiveSurveillance';
import IncidentHistory from './pages/IncidentHistory';
import CameraDetails from './pages/CameraDetails';
import SmartAlerts from './pages/SmartAlerts';
import BorderMonitoring from './pages/BorderMonitoring';
import AIAnalytics from './pages/AIAnalytics';
import Reports from './pages/Reports';
import CameraManagement from './pages/CameraManagement';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';

// Protected Layout Wrapper
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#04070d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
            Booting Defense Surveillance Console...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        ></div>
      )}

      {/* Main Content Area */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Sticky Tactical Header */}
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Dynamic Route View */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/surveillance" element={<LiveSurveillance />} />
            <Route path="/incidents" element={<IncidentHistory />} />
            <Route path="/cameras/:id" element={<CameraDetails />} />
            <Route path="/cameras" element={<CameraManagement />} />
            <Route path="/alerts" element={<SmartAlerts />} />
            <Route path="/map" element={<BorderMonitoring />} />
            <Route path="/analytics" element={<AIAnalytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/logs" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AlertProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
};

export default App;
