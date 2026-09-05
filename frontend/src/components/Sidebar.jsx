import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Video, 
  BarChart3, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  Camera, 
  Settings, 
  Users, 
  ClipboardList,
  ShieldCheck,
  Radio,
  History
} from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { activeAlertCount, activeIncidentCount } = useAlerts();
  const { isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Live Surveillance', path: '/surveillance', icon: Video },
    { 
      name: 'Incident History', 
      path: '/incidents', 
      icon: History,
      badge: activeIncidentCount > 0 ? activeIncidentCount : null,
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40'
    },
    { name: 'AI Analytics', path: '/analytics', icon: BarChart3 },
    { 
      name: 'Smart Alerts', 
      path: '/alerts', 
      icon: AlertTriangle, 
      badge: activeAlertCount > 0 ? activeAlertCount : null 
    },
    { name: 'Border Monitoring', path: '/map', icon: MapPin },
    { name: 'Reports & Export', path: '/reports', icon: FileText },
    { name: 'Camera Management', path: '/cameras', icon: Camera },
    { name: 'System Settings', path: '/settings', icon: Settings },
    ...(isAdmin ? [{ name: 'User Management', path: '/users', icon: Users }] : []),
    { name: 'Audit Logs', path: '/logs', icon: ClipboardList },
  ];

  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#070c16] border-r border-[#1a2c47] flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1a2c47] flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10">
          <ShieldAlert className="w-6 h-6 animate-pulse-slow" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping"></span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-lg text-white">
            <span>BORDER</span>
            <span className="text-cyan-400 font-extrabold px-1 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-xs">AI</span>
          </div>
          <p className="text-[11px] font-mono tracking-tight text-slate-400 uppercase">
            Smart Border Surveillance
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-400">
          Command Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/40 text-cyan-400 border-l-4 border-cyan-400 shadow-md shadow-cyan-950/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110 text-inherit" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 text-xs font-bold font-mono rounded-full border animate-pulse ${item.badgeColor || 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom System Status Card */}
      <div className="p-3 border-t border-[#1a2c47] bg-[#09101d]">
        <div className="p-3 rounded-lg border border-emerald-900/40 bg-gradient-to-b from-emerald-950/30 to-emerald-950/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400">
                DEFENSE STATUS
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-sm font-extrabold tracking-wide text-white">SECURE</span>
            <span className="text-[10px] font-mono text-emerald-400/80">99.8% DEFENSE</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Neural AI Nodes Active
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
