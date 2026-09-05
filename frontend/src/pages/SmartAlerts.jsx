import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Search, 
  CheckCheck, 
  Sparkles, 
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import AlertCard from '../components/AlertCard';
import { alertsAPI } from '../services/api';
import { useAlerts } from '../context/AlertContext';

const SmartAlerts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resolveAll, simulateAlert, refreshAlerts } = useAlerts();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('camera_id') || '');
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchAlerts = async () => {
    try {
      const params = {};
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (sectorFilter !== 'ALL') params.sector = sectorFilter;
      if (searchParams.get('camera_id')) params.camera_id = searchParams.get('camera_id');

      const res = await alertsAPI.getAll(params);
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [priorityFilter, statusFilter, sectorFilter, searchParams]);

  const handleDeleteAlert = async (id) => {
    if (window.confirm('Are you sure you want to permanently purge this alert log?')) {
      await alertsAPI.delete(id);
      await fetchAlerts();
      await refreshAlerts();
    }
  };

  const handleResolveAll = async () => {
    if (window.confirm('Mark all currently active alerts as RESOLVED?')) {
      await resolveAll();
      await fetchAlerts();
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    const cameras = ['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'];
    const threats = ['PERSON', 'VEHICLE', 'INTRUDER', 'WEAPON'];
    const cam = cameras[Math.floor(Math.random() * cameras.length)];
    const threat = threats[Math.floor(Math.random() * threats.length)];
    const conf = Math.floor(Math.random() * 10 + 90);

    await simulateAlert(cam, threat, conf);
    await fetchAlerts();
    setTimeout(() => setIsSimulating(false), 1000);
  };

  // Search filter
  const filteredAlerts = alerts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.alert_id?.toLowerCase().includes(q) ||
      a.camera_id?.toLowerCase().includes(q) ||
      a.detection_type?.toLowerCase().includes(q) ||
      a.message?.toLowerCase().includes(q) ||
      a.sector?.toLowerCase().includes(q)
    );
  });

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const highCount = alerts.filter((a) => a.status === 'ACTIVE' && a.priority === 'HIGH').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl surveillance-panel border border-[#1a2c47]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              SMART THREAT DETECTION & ALERT CONSOLE
            </h2>
            {highCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-red-950 text-red-400 border border-red-800 animate-pulse">
                {highCount} CRITICAL THREATS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated intelligence triage for perimeter breaches, unauthorized vehicles, and weapon signatures.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-red-400' : 'text-red-400'}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Threat Event'}</span>
          </button>

          {activeCount > 0 && (
            <button
              onClick={handleResolveAll}
              className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Batch Resolve Active ({activeCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#09101e] border border-[#1a2c47] space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Camera, Sector, Alert ID or Target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <span className="text-xs font-mono text-slate-400 mr-1">Status:</span>
            {[
              { id: 'ACTIVE', label: 'Active Only' },
              { id: 'RESOLVED', label: 'Resolved' },
              { id: 'ALL', label: 'All Records' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                  statusFilter === s.id
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Priority Tabs */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <span className="text-xs font-mono text-slate-400 mr-1">Severity:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                  priorityFilter === p
                    ? 'bg-purple-950 text-purple-300 border border-purple-700 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Feed Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-20 text-center surveillance-panel rounded-xl border border-[#1a2c47] space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-white font-mono uppercase">
            {statusFilter === 'ACTIVE' ? 'NO ACTIVE UNRESOLVED THREAT ALERTS' : 'NO ALERTS MATCHING CRITERIA'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {statusFilter === 'ACTIVE' 
              ? 'All border defense threat alerts have been acknowledged or resolved by the command center.'
              : 'Try changing your search query or filter settings to view alerts.'}
          </p>
          {statusFilter === 'ACTIVE' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="mt-2 px-4 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700 text-xs font-mono font-bold hover:bg-cyan-900 transition-colors"
            >
              View Complete Alert Archive (All Records)
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.alert_id || alert.id}
              alert={alert}
              onDelete={handleDeleteAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartAlerts;
