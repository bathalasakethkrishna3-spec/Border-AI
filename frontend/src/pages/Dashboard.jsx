import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Eye, 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  RefreshCw, 
  MapPin, 
  CheckCircle2, 
  Radio, 
  Clock,
  Sparkles,
  Compass,
  PlayCircle,
  History,
  Layers,
  Sun,
  Moon,
  TrendingUp,
  Cpu,
  Share2
} from 'lucide-react';
import StatCard from '../components/StatCard';
import CameraCard from '../components/CameraCard';
import BorderMap from '../components/BorderMap';
import { analyticsAPI, camerasAPI, incidentsAPI, sectorsAPI } from '../services/api';
import { useAlerts } from '../context/AlertContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { resolveAlert, resolveIncident, activeAlertCount, activeIncidentCount } = useAlerts();

  const [dashboardData, setDashboardData] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [activeIncidentsList, setActiveIncidentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [focusedCameraId, setFocusedCameraId] = useState(null);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [dashRes, camRes, incRes, secRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        camerasAPI.getAll(),
        incidentsAPI.getAll({ status: 'UNRESOLVED', limit: 6 }),
        sectorsAPI.getAll()
      ]);
      setDashboardData(dashRes.data);
      setCameras(camRes.data || []);
      setActiveIncidentsList(incRes.data || []);
      setSectors(secRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(false), 6000);
    return () => clearInterval(interval);
  }, []);

  // Reactively re-fetch telemetry whenever alerts or incidents are resolved or simulated anywhere
  useEffect(() => {
    fetchDashboard(false);
  }, [activeAlertCount, activeIncidentCount]);

  const handleQuickResolve = async (alertId) => {
    await resolveAlert(alertId);
    fetchDashboard(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
            Synchronizing BorderAI Surveillance Telemetry...
          </p>
        </div>
      </div>
    );
  }

  const activeCams = dashboardData?.active_cameras || { count: 7, total: 8, percentage: 87.5 };
  const offlineCams = dashboardData?.offline_cameras ?? 1;
  const detectionsToday = dashboardData?.ai_detections || { count: 48, sparkline: [] };
  const activeInc = dashboardData?.active_incidents || { count: 3, critical_count: 2, sparkline: [] };
  const resolvedInc = dashboardData?.resolved_incidents || { count: 3 };
  const borderStatus = dashboardData?.border_status || { status: 'CRITICAL ALERT', subtitle: '3 Active Breaches', color: 'red' };
  const envStatus = dashboardData?.environmental_status || { mode: 'DAY MODE (Optical RGB)', visibility: '92% Clear', lighting: 'Sunlight' };
  const correlations = dashboardData?.cross_camera_correlations || [];
  const gridCameras = dashboardData?.grid_cameras || cameras.slice(0, 4);
  const recentAlerts = dashboardData?.recent_alerts || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / System Telemetry Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl surveillance-panel border border-[#1a2c47]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-700/50 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide font-mono">
                BORDER SURVEILLANCE & DEFENSE COMMAND CENTER
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                AI INFERENCE SYNCED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated multi-tier intrusion detection active across Sectors A, B, C, D & E with 45s buffered event replays.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>

          <button
            onClick={() => navigate('/surveillance')}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Surveillance Matrix</span>
          </button>
        </div>
      </div>

      {/* 5 CLICKABLE TOP STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. ACTIVE CAMERAS -> Navigates to /cameras */}
        <div 
          onClick={() => navigate('/cameras')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <StatCard
            type="cameras"
            title="ACTIVE CAMERAS"
            value={activeCams.count}
            subvalue={`/ ${activeCams.total} Nodes`}
            subtitle={`${offlineCams} Offline • Click to Manage`}
            progress={activeCams.percentage}
            progressColor="bg-cyan-500"
          />
        </div>

        {/* 2. AI DETECTIONS TODAY -> Navigates to /analytics */}
        <div 
          onClick={() => navigate('/analytics')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <StatCard
            title="AI DETECTIONS TODAY"
            value={detectionsToday.count}
            subtitle="Neural Inferences • Click Trends"
            sparklineData={detectionsToday.sparkline}
            sparklineColor="#3b82f6"
            icon={Eye}
          />
        </div>

        {/* 3. ACTIVE INCIDENTS -> Navigates to /incidents?status=UNRESOLVED */}
        <div 
          onClick={() => navigate('/incidents?status=NEW')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <StatCard
            title="ACTIVE INCIDENTS"
            value={activeInc.count}
            subtitle={`${activeInc.critical_count || 0} Critical • Triage Now`}
            sparklineData={activeInc.sparkline}
            sparklineColor="#ef4444"
            icon={ShieldAlert}
          />
        </div>

        {/* 4. RESOLVED INCIDENTS -> Navigates to /incidents?status=RESOLVED */}
        <div 
          onClick={() => navigate('/incidents?status=RESOLVED')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <StatCard
            title="RESOLVED INCIDENTS"
            value={resolvedInc.count}
            subtitle="Permanent History • Open Dossiers"
            icon={CheckCircle2}
          />
        </div>

        {/* 5. BORDER DEFENSE STATUS -> Navigates to /map */}
        <div 
          onClick={() => navigate('/map')}
          className="cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <StatCard
            type="border_status"
            title="BORDER DEFENSE STATUS"
            value={borderStatus.status}
            subtitle={`${borderStatus.subtitle} • Open GIS`}
            statusColor={borderStatus.color}
          />
        </div>
      </div>

      {/* ACTIVE UNRESOLVED INCIDENTS TABLE */}
      {activeIncidentsList.length > 0 && (
        <div className="surveillance-panel rounded-xl p-4 border border-red-500/70 shadow-2xl bg-gradient-to-r from-red-950/30 via-[#0c0913] to-red-950/20 space-y-3">
          <div className="flex items-center justify-between border-b border-red-900/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Active Intrusion Incidents Awaiting Triage ({activeIncidentsList.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs font-mono text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
            >
              <span>View Permanent Incident Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-2">INCIDENT ID</th>
                  <th className="pb-2">CAMERA / SECTOR</th>
                  <th className="pb-2">THREAT & TARGETS</th>
                  <th className="pb-2">DIRECTION VECTOR</th>
                  <th className="pb-2">RISK SCORE</th>
                  <th className="pb-2">STATUS</th>
                  <th className="pb-2 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeIncidentsList.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      {inc.incident_id}
                    </td>
                    <td className="py-2.5 text-cyan-300 font-bold">{inc.camera_id} ({inc.sector})</td>
                    <td className="py-2.5 text-slate-200">
                      {inc.detection_type} ({inc.person_count} target{inc.person_count > 1 ? 's' : ''})
                    </td>
                    <td className="py-2.5 text-slate-300">
                      <span className="flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        {inc.movement_direction}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-red-950 border border-red-700 text-red-400 font-bold text-[11px]">
                        {inc.risk_score} / 100 ({inc.risk_level})
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={async () => {
                            await resolveIncident(inc.incident_id);
                            fetchDashboard(false);
                          }}
                          className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm"
                          title="Resolve incident"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Resolve</span>
                        </button>
                        <button
                          onClick={() => navigate(`/cameras/${inc.camera_id}`)}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-md shadow-red-950/60 transition-all"
                        >
                          <PlayCircle className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTOR PERIMETER STATUS OVERVIEW WIDGET */}
      <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1a2c47] pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Sector Perimeter Status & Threat Concentration
            </h3>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>Open Detailed Sector Maps</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {sectors.map((s) => {
            const isAlert = s.status === 'ALERT';
            const isSuspicious = s.status === 'SUSPICIOUS';

            return (
              <div
                key={s.sector_id}
                onClick={() => navigate(`/map?sector=${s.sector_id}`)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isAlert 
                    ? 'bg-red-950/20 border-red-800/80 hover:border-red-500' 
                    : isSuspicious 
                    ? 'bg-amber-950/20 border-amber-800/80 hover:border-amber-500' 
                    : 'bg-slate-900/60 border-[#1a2c47] hover:border-cyan-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white">{s.sector_id}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    isAlert ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'
                  }`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{s.name.replace(s.sector_id + ' — ', '')}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-[#1a2c47]/50 pt-1">
                  <span>Cams: {s.camera_count}</span>
                  <span className={s.active_intrusion_count > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                    Breaches: {s.active_intrusion_count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CROSS-CAMERA CORRELATION & ENVIRONMENTAL TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cross-Camera Target Movement Correlation */}
        <div className="lg:col-span-2 surveillance-panel rounded-xl p-4 border border-[#1a2c47] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1a2c47] pb-2">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Cross-Camera Target Intelligence & Movement Correlation
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              CORRELATED TRAJECTORY
            </span>
          </div>

          {correlations.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No cross-camera target trajectory detected.</p>
          ) : (
            correlations.map((corr) => (
              <div key={corr.correlation_id} className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/50 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-[11px]">{corr.label}:</span>
                    <span className="text-cyan-300 font-bold">{corr.cameras.join(' ➔ ')}</span>
                  </div>
                  <span className="text-[10px] text-purple-300 font-bold">Conf: {corr.confidence_score}%</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{corr.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-purple-900/40">
                  <span>Sector: {corr.sector}</span>
                  <span>Vector: {corr.direction}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Environmental & Optical Telemetry Widget */}
        <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1a2c47] pb-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Environmental Telemetry
              </h3>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-slate-900/60 border border-[#1a2c47]">
              <span className="text-[10px] text-slate-400">Sensor Spectrum Mode:</span>
              <p className="font-bold text-cyan-300 mt-0.5">{envStatus.mode}</p>
            </div>
            <div className="p-2.5 rounded bg-slate-900/60 border border-[#1a2c47]">
              <span className="text-[10px] text-slate-400">Atmospheric Visibility:</span>
              <p className="font-bold text-emerald-400 mt-0.5">{envStatus.visibility}</p>
            </div>
            <div className="p-2.5 rounded bg-slate-900/60 border border-[#1a2c47]">
              <span className="text-[10px] text-slate-400">Illumination / Weather:</span>
              <p className="font-bold text-slate-200 mt-0.5">{envStatus.lighting} ({envStatus.weather || 'Clear'})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Live CCTV Feeds 2x2 (Left) + Right Column (Recent Alerts) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live CCTV Feeds 2x2 */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                Live Multi-Sensor Surveillance Feeds (2x2 Quad)
              </h3>
            </div>
            <button
              onClick={() => navigate('/surveillance')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All Cameras ({cameras.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gridCameras.map((camera) => (
              <CameraCard
                key={camera.camera_id}
                camera={camera}
                onMapClick={(cam) => {
                  setFocusedCameraId(cam.camera_id);
                  const mapElement = document.getElementById('dashboard-map');
                  if (mapElement) {
                    mapElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Right 1 Col: Recent Alerts Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                Recent Threat Alerts
              </h3>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47] divide-y divide-[#1a2c47]/80">
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent threat alerts. Perimeter status is normal.
              </div>
            ) : (
              recentAlerts.map((alert) => {
                const isHigh = alert.priority === 'HIGH' || alert.priority === 'CRITICAL';
                const isMedium = alert.priority === 'MEDIUM';
                const isResolved = alert.status === 'RESOLVED';

                return (
                  <div
                    key={alert.alert_id}
                    className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group cursor-pointer hover:bg-slate-900/40 p-2 rounded transition-colors"
                    onClick={() => navigate(`/cameras/${alert.camera_id}`)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 p-1.5 rounded ${
                        isResolved
                          ? 'bg-emerald-950/60 text-emerald-400'
                          : isHigh
                          ? 'bg-red-950/60 text-red-400 animate-pulse'
                          : 'bg-amber-950/60 text-amber-400'
                      }`}>
                        {isResolved ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <ShieldAlert className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {alert.message}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {alert.sector || 'Sector'} • {alert.camera_id} • Risk: {alert.risk_score || 75}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {alert.time || alert.created_at?.substring(11, 16) || 'Recent'}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {alert.confidence}% Conf.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase rounded-full ${
                        isResolved
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isHigh
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : isMedium
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      }`}>
                        {isResolved ? 'RESOLVED' : alert.priority}
                      </span>

                      {!isResolved && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickResolve(alert.alert_id);
                          }}
                          className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 underline"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Interactive Border Monitoring Map */}
      <div id="dashboard-map" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              Border GIS Perimeter Intelligence & Sensor Deployments
            </h3>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Open Dedicated Sector Map View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <BorderMap
          cameras={cameras}
          sectors={sectors}
          focusedCameraId={focusedCameraId}
          height="450px"
        />
      </div>
    </div>
  );
};

export default Dashboard;
