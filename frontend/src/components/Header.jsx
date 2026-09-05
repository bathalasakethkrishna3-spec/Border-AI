import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Settings as SettingsIcon, 
  ShieldAlert, 
  Clock, 
  Radio, 
  ChevronDown,
  Bot,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import NotificationPanel from './NotificationPanel';
import AssistantDrawer from './AssistantDrawer';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { unreadNotifications } = useAlerts();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isNight = currentTime.getHours() < 6 || currentTime.getHours() >= 19;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/surveillance') return 'Live Surveillance';
    if (path === '/incidents') return 'Incident History & Forensics';
    if (path.startsWith('/cameras/')) return 'Camera Feed & Video AI Diagnostics';
    if (path === '/cameras') return 'Camera Infrastructure Management';
    if (path === '/alerts') return 'Smart Threat Alerts';
    if (path === '/map') return 'Sector-Based Border Monitoring GIS';
    if (path === '/analytics') return 'AI Neural Analytics';
    if (path === '/reports') return 'Surveillance Reports & Logs';
    if (path === '/users') return 'Operator Directory';
    if (path === '/settings') return 'System Configuration';
    if (path === '/logs') return 'Audit & Security Logs';
    return 'Border Command Center';
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#070c16]/95 backdrop-blur border-b border-[#1a2c47] flex items-center justify-between px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 md:hidden focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide font-mono">
                {getPageTitle()}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800/40">
                LIVE NODE
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-medium">
              AI-Based Video Analytics Platform for Border Surveillance
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Day / Night Environment Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b1322] border border-[#1a2c47] text-[11px] font-mono">
            {isNight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span className="text-purple-300 font-bold">NIGHT (FLIR ACTIVE)</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-amber-300 font-bold">DAY (OPTICAL RGB)</span>
              </>
            )}
          </div>

          {/* Live Clock & Date */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b1322] border border-[#1a2c47] text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-300">
              {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-cyan-400 font-bold">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>

          {/* AI Tactical Assistant Trigger Button */}
          <button
            onClick={() => setShowAssistant(!showAssistant)}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all group"
            title="Open BorderAI Tactical Assistant"
          >
            <Bot className="w-4 h-4 text-cyan-400 group-hover:animate-bounce" />
            <span className="hidden sm:inline">AI ASSISTANT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <NotificationPanel onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* User Profile Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs border border-cyan-400/40 shadow-sm">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'OP'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {user?.full_name || user?.username || 'Operator'}
                </div>
                <div className="text-[10px] font-mono text-cyan-400 uppercase">
                  {user?.role || 'Operator'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0b1322] border border-[#1a2c47] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-[#1a2c47]">
                  <p className="text-xs font-bold text-white">{user?.full_name || user?.username}</p>
                  <p className="text-[11px] font-mono text-cyan-400">{user?.email}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2.5 text-left"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>System Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center gap-2.5 text-left border-t border-[#1a2c47]/50 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Sign Out Console</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Embedded Tactical Assistant Drawer */}
      <AssistantDrawer
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
      />
    </>
  );
};

export default Header;
