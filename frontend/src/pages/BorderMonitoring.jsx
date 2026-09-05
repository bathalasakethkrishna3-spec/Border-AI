import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Layers, 
  Video, 
  ShieldAlert, 
  Radio, 
  Search, 
  Crosshair, 
  Compass,
  Maximize2,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Activity,
  Upload,
  PlayCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import BorderMap from '../components/BorderMap';
import { camerasAPI, sectorsAPI } from '../services/api';

const BorderMonitoring = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [sectors, setSectors] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Sector View Mode: null = "ALL SECTORS", string = specific sector detail
  const [selectedSectorId, setSelectedSectorId] = useState(searchParams.get('sector') || null);
  const [focusedCameraId, setFocusedCameraId] = useState(searchParams.get('focus') || null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTelemetry = async () => {
    try {
      const [secRes, camRes] = await Promise.all([
        sectorsAPI.getAll(),
        camerasAPI.getAll()
      ]);
      setSectors(secRes.data || []);
      setCameras(camRes.data || []);
    } catch (err) {
      console.error('Error fetching border telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const secParam = searchParams.get('sector');
    if (secParam) setSelectedSectorId(secParam);
    const focusParam = searchParams.get('focus');
    if (focusParam) setFocusedCameraId(focusParam);
  }, [searchParams]);

  const handleSelectSector = (secId) => {
    setSelectedSectorId(secId);
    if (secId) {
      setSearchParams({ sector: secId });
    } else {
      setSearchParams({});
    }
  };

  // Find active sector object
  const activeSector = sectors.find((s) => s.sector_id === selectedSectorId);
  const sectorCameras = activeSector ? (activeSector.cameras || cameras.filter(c => c.sector === activeSector.sector_id)) : [];
  const sectorIncidents = activeSector?.active_incidents || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Breadcrumb Header */}
      <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {selectedSectorId ? (
              <button
                onClick={() => handleSelectSector(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 mr-1 flex items-center gap-1 text-xs font-mono"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Sectors</span>
              </button>
            ) : (
              <MapPin className="w-5 h-5 text-cyan-400" />
            )}
            <h2 className="text-base font-bold text-white tracking-wide font-mono">
              {activeSector ? `${activeSector.name.toUpperCase()}` : 'SECTOR-BASED BORDER SURVEILLANCE & GIS'}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {selectedSectorId ? 'DETAILED SECTOR DOSSIER' : '5 BORDER SECTORS ACTIVE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeSector 
              ? activeSector.description 
              : 'Independent sectoral perimeter monitoring, multi-tier geofence boundaries, and automated intrusion tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedSectorId && (
            <button
              onClick={() => handleSelectSector(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-semibold transition-colors"
            >
              View All Sectors Grid
            </button>
          )}
          <button
            onClick={() => {
              setFocusedCameraId(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Extent</span>
          </button>
        </div>
      </div>

      {/* ALL SECTORS OVERVIEW CARDS (When no specific sector is opened) */}
      {!selectedSectorId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {sectors.map((sec) => {
            const isAlert = sec.status === 'ALERT';
            const isSuspicious = sec.status === 'SUSPICIOUS';

            return (
              <div
                key={sec.sector_id}
                onClick={() => handleSelectSector(sec.sector_id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border group relative overflow-hidden ${
                  isAlert 
                    ? 'bg-red-950/20 border-red-800/80 hover:border-red-500 shadow-lg shadow-red-950/30' 
                    : isSuspicious 
                    ? 'bg-amber-950/20 border-amber-800/80 hover:border-amber-500' 
                    : 'surveillance-panel border-[#1a2c47] hover:border-cyan-500/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {sec.sector_id}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${
                    isAlert
                      ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                      : isSuspicious
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {sec.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 font-medium line-clamp-2 mb-3">
                  {sec.name.replace(sec.sector_id + ' — ', '')}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-[#1a2c47]/60">
                  <div className="text-slate-400">
                    Cameras: <span className="font-bold text-cyan-400">{sec.camera_count}</span>
                  </div>
                  <div className="text-right text-slate-400">
                    Intrusions: <span className={`font-bold ${sec.active_intrusion_count > 0 ? 'text-red-400 font-extrabold' : 'text-emerald-400'}`}>{sec.active_intrusion_count}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Inspect Sector</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DEDICATED SECTOR DETAIL VIEW */}
      {activeSector && (
        <div className="space-y-4">
          {/* Sector Telemetry & Zones Bar */}
          <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-[#1a2c47]">
              <span className="text-[10px] font-mono text-slate-400">Sector Status & Threat Level:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                  activeSector.status === 'ALERT'
                    ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  {activeSector.status}
                </span>
                <span className="text-xs font-mono text-slate-300 font-bold">
                  Risk: {activeSector.risk_level}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-[#1a2c47]">
              <span className="text-[10px] font-mono text-slate-400">Assigned Nodes:</span>
              <p className="text-base font-mono font-bold text-cyan-400 mt-1">
                {sectorCameras.length} Cameras ({activeSector.active_camera_count || sectorCameras.length} Online)
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-[#1a2c47]">
              <span className="text-[10px] font-mono text-slate-400">Active Unresolved Intrusions:</span>
              <p className={`text-base font-mono font-extrabold mt-1 ${
                sectorIncidents.length > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
              }`}>
                {sectorIncidents.length} Critical Intrusion(s)
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-[#1a2c47]">
              <span className="text-[10px] font-mono text-slate-400">Multi-Tier Zones Configured:</span>
              <p className="text-[11px] font-mono text-slate-200 mt-1">
                4 Tiers (Normal, Warning, Fence, Red Zone)
              </p>
            </div>
          </div>

          {/* Assigned Cameras Matrix in this Sector */}
          <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47] space-y-3">
            <div className="flex items-center justify-between border-b border-[#1a2c47] pb-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4 text-cyan-400" />
                Assigned Cameras in {activeSector.sector_id} ({sectorCameras.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sectorCameras.map((cam) => {
                const hasIncident = Boolean(cam.active_incident);
                return (
                  <div
                    key={cam.camera_id}
                    onClick={() => navigate(`/cameras/${cam.camera_id}`)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      hasIncident
                        ? 'bg-red-950/30 border-red-600 shadow-md shadow-red-950/40 ring-1 ring-red-600'
                        : 'bg-slate-900/60 border-[#1a2c47] hover:border-cyan-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-white">{cam.camera_id}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        hasIncident ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-cyan-400'
                      }`}>
                        {hasIncident ? 'INTRUSION ACTIVE' : cam.health_status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-200 mt-1 truncate">{cam.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{cam.location_name}</p>

                    <div className="mt-2.5 pt-2 border-t border-[#1a2c47]/50 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-cyan-400 uppercase">{cam.stream_type}</span>
                      <span className="text-slate-300 flex items-center gap-1">
                        {hasIncident ? <PlayCircle className="w-3 h-3 text-red-400" /> : <Video className="w-3 h-3 text-cyan-400" />}
                        {hasIncident ? 'Open Replay' : 'Open Camera'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Map Canvas */}
      <div className="surveillance-panel rounded-xl border border-[#1a2c47] overflow-hidden p-2">
        <BorderMap
          cameras={cameras}
          sectors={sectors}
          selectedSectorId={selectedSectorId}
          focusedCameraId={focusedCameraId}
          onSelectSector={handleSelectSector}
          height="620px"
        />
      </div>
    </div>
  );
};

export default BorderMonitoring;
