import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Radio, 
  ShieldCheck, 
  Cpu, 
  AlertCircle,
  KeyRound,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleQuickRoleLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
    setLoading(true);

    const res = await login(u, p);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Authentication failed for selected role.');
    }
  };

  return (
    <div className="min-h-screen bg-[#04070d] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Tactical Radar Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a2c47_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        {/* Card Container */}
        <div className="surveillance-panel rounded-2xl p-8 border border-[#1a2c47] shadow-2xl relative">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 text-cyan-400 mb-3 shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-8 h-8 animate-pulse-slow" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-widest text-white">
                BORDER <span className="text-cyan-400">AI</span>
              </h1>
            </div>
            
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400/80 mt-1">
              Border AI Surveillance System
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Intelligent Video Analytics Command Center
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Operator ID / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, operator, or analyst"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-[#070c16] border border-[#1a2c47] text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#070c16] border border-[#1a2c47] text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-[#1a2c47] text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember Credentials</span>
              </label>
              <span className="font-mono text-cyan-500/70 text-[11px]">256-BIT JWT SECURE</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm tracking-wider uppercase font-mono shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Access Command Center'}</span>
            </button>
          </form>

          {/* Quick Demo Access Credentials Box for all 3 Roles */}
          <div className="mt-6 pt-5 border-t border-[#1a2c47]/80">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Quick Role-Based Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRoleLogin('admin', 'admin123')}
                className="p-2 rounded-lg bg-[#070c16] hover:bg-cyan-950/60 border border-[#1a2c47] hover:border-cyan-500/60 text-left transition-colors group"
                title="Login as Administrator (Full privileges)"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 font-mono group-hover:text-cyan-300">ADMIN</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-0.5">admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('operator', 'operator123')}
                className="p-2 rounded-lg bg-[#070c16] hover:bg-blue-950/60 border border-[#1a2c47] hover:border-blue-500/60 text-left transition-colors group"
                title="Login as Radar/Surveillance Operator"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 font-mono group-hover:text-blue-300">OPERATOR</span>
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-0.5">operator123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('analyst', 'analyst123')}
                className="p-2 rounded-lg bg-[#070c16] hover:bg-purple-950/60 border border-[#1a2c47] hover:border-purple-500/60 text-left transition-colors group"
                title="Login as Intelligence & Threat Analyst"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 font-mono group-hover:text-purple-300">ANALYST</span>
                  <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-0.5">analyst123</div>
              </button>
            </div>
          </div>
        </div>

        {/* System Tag */}
        <div className="mt-4 text-center text-[11px] font-mono text-slate-400 flex items-center justify-center gap-2">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>MIL-STD-810H AI SURVEILLANCE NODE • READY</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
