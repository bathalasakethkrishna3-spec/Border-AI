import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ShieldCheck, ShieldAlert, AlertTriangle, Eye, Video, Activity } from 'lucide-react';

const StatCard = ({
  type = 'default',
  title,
  value,
  subvalue,
  subtitle,
  progress,
  progressColor = 'bg-cyan-500',
  sparklineData = [],
  sparklineColor = '#06b6d4',
  icon: IconComponent,
  statusBadge,
  statusColor = 'green',
}) => {
  // Border Status custom style
  if (type === 'border_status') {
    const isElevated = statusColor === 'red';
    const isSuspicious = statusColor === 'orange';

    return (
      <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47] relative overflow-hidden flex flex-col justify-between hover:border-purple-500/40 transition-all duration-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
            {title}
          </span>
          <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${
              isElevated ? 'text-red-400' : (isSuspicious ? 'text-amber-400' : 'text-emerald-400')
            }`}>
              {value}
            </span>
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isElevated ? 'bg-red-400' : (isSuspicious ? 'bg-amber-400' : 'bg-emerald-400')
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isElevated ? 'bg-red-500' : (isSuspicious ? 'bg-amber-500' : 'bg-emerald-500')
              }`}></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{subtitle || 'All Clear'}</p>
        </div>

        <div className="pt-2 border-t border-[#1a2c47]/50 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Perimeter Defense:</span>
          <span className="text-purple-400 font-bold">100% OPERATIONAL</span>
        </div>
      </div>
    );
  }

  // Active Cameras style with Progress Bar
  if (type === 'cameras') {
    return (
      <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47] relative overflow-hidden flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
            {title}
          </span>
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {value}
            </span>
            {subvalue && (
              <span className="text-sm font-mono text-slate-400">{subvalue}</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{subtitle}</p>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
              style={{ width: `${progress || 85}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Online: {progress || 85}%</span>
            <span>HD Feeds Synced</span>
          </div>
        </div>
      </div>
    );
  }

  // Standard Stat Card with Sparkline
  return (
    <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47] relative overflow-hidden flex flex-col justify-between hover:border-slate-600 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        {IconComponent && (
          <div className="p-2 rounded-lg bg-slate-900 border border-[#1a2c47] text-slate-300">
            <IconComponent className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 items-end gap-2 my-2">
        <div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {typeof value === 'number' && value < 10 ? `0${value}` : value}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{subtitle}</p>
        </div>

        {/* Mini Sparkline Chart */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={sparklineColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={sparklineColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#grad-${title})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[#1a2c47]/50 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Trend: Last 8 Hours</span>
        <span className="text-cyan-400 font-semibold flex items-center gap-1">
          <Activity className="w-3 h-3" /> Live
        </span>
      </div>
    </div>
  );
};

export default StatCard;
