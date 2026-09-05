import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Target,
  Clock,
  Layers
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

const AIAnalytics = () => {
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsAPI.getTrends();
        setTrendsData(res.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const donutBreakdown = trendsData?.detection_overview?.breakdown || [
    { name: 'Persons', value: 58, color: '#3b82f6' },
    { name: 'Vehicles', value: 32, color: '#06b6d4' },
    { name: 'Intrusions', value: 18, color: '#ef4444' },
    { name: 'Motion/Others', value: 20, color: '#8b5cf6' },
  ];

  const trend7Days = trendsData?.trend_7_days || [];
  const alertsBySector = trendsData?.alerts_by_sector || [];
  const hourlyData = trendsData?.hourly_distribution || [];
  const metrics = trendsData?.model_metrics || {
    model_architecture: 'YOLOv8x / BorderSurveillance-V2',
    mean_average_precision: '94.8% mAP@0.5',
    inference_latency: '18.4 ms',
    fps_throughput: '54.2 FPS',
    false_positive_rate: '0.8%',
    total_analyzed_frames: '1,420,890',
  };

  const totalDetections = trendsData?.detection_overview?.total || 128;

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b1322] border border-[#1a2c47] p-3 rounded-lg shadow-xl text-xs font-mono">
          <p className="text-white font-bold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2 text-[11px]" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-bold text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              NEURAL VIDEO ANALYTICS & PATTERN INTELLIGENCE
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              YOLO INFERENCE ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical object classification, perimeter intrusion trends, and sectoral risk distribution models.
          </p>
        </div>
      </div>

      {/* Top 4 AI Model Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47]">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Inference Model</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono mt-2">YOLOv8x / Custom</div>
          <div className="text-[10px] font-mono text-cyan-400 mt-1">BorderSurveillance V2.4</div>
        </div>

        <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47]">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Accuracy (mAP@0.5)</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">94.8%</div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Trained on Border Datasets</div>
        </div>

        <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47]">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Inference Latency</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-2">18.4 ms</div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Throughput: 54.2 FPS</div>
        </div>

        <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47]">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Analyzed Frames</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono mt-2">1.42M+</div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">0.8% False Positive Rate</div>
        </div>
      </div>

      {/* Row 1: Detection Overview Donut (Left) + 7-Day Trend Line Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Detection Breakdown */}
        <div className="surveillance-panel rounded-xl p-5 border border-[#1a2c47] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#1a2c47] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-cyan-400" /> Detection Breakdown
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">Total: {totalDetections}</span>
          </div>

          <div className="h-56 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#070c16" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Donut Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1a2c47]/60 text-xs font-mono">
            {donutBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-2 surveillance-panel rounded-xl p-5 border border-[#1a2c47] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#1a2c47] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> 7-Day Intrusion & Object Trend
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Past 7 Days Telemetry</span>
          </div>

          <div className="h-72 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2c47" opacity={0.5} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="persons" name="Persons Detected" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="vehicles" name="Vehicles Detected" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="intrusions" name="Critical Intrusions" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Alerts by Sector (Left) + 24-Hour Traffic Heatmap (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Alerts by Sector */}
        <div className="surveillance-panel rounded-xl p-5 border border-[#1a2c47]">
          <div className="flex items-center justify-between border-b border-[#1a2c47] pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" /> Sector Threat Concentration
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Total vs High Priority</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsBySector} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2c47" opacity={0.5} />
                <XAxis dataKey="sector" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="total_alerts" name="Total Sector Incidents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="high_priority" name="High Priority Threats" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart: 24-Hour Traffic Density */}
        <div className="surveillance-panel rounded-xl p-5 border border-[#1a2c47]">
          <div className="flex items-center justify-between border-b border-[#1a2c47] pb-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" /> 24-Hour Perimeter Motion Distribution
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Hourly Target Density</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2c47" opacity={0.5} />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="detections" name="Detections" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorHourly)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalytics;
