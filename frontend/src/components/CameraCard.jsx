import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Maximize2, 
  Layers, 
  MapPin, 
  Radio, 
  AlertTriangle, 
  Camera as CameraIcon, 
  ExternalLink,
  Flame,
  Moon,
  Sun,
  ShieldAlert,
  PlayCircle,
  Activity
} from 'lucide-react';
import CCTVCanvas from './CCTVCanvas';

const CameraCard = ({ camera, onMapClick, compact = false }) => {
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(true);
  const [streamMode, setStreamMode] = useState(camera?.stream_type || 'optical');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const timeStr = d.toISOString().replace('T', ' ').substring(0, 19);
      setCurrentTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!camera) return null;

  const activeInc = camera.active_incident;
  const hasActiveIncident = Boolean(activeInc);
  const isAlert = camera.status === 'ALERT' || hasActiveIncident;
  const isSuspicious = camera.status === 'SUSPICIOUS';
  const health = camera.health_status || 'ONLINE';
  const isOffline = health === 'OFFLINE' || health === 'NO_SIGNAL';
  const zones = camera.zones || {};

  const handleCardClick = () => {
    navigate(`/cameras/${camera.camera_id}`);
  };

  return (
    <div className={`surveillance-panel rounded-xl overflow-hidden border transition-all duration-300 group ${
      hasActiveIncident 
        ? 'border-red-500 shadow-xl shadow-red-950/50 ring-1 ring-red-500/50' 
        : isSuspicious 
        ? 'border-amber-500/50 shadow-lg shadow-amber-950/30' 
        : isOffline
        ? 'border-slate-700/60 opacity-80'
        : 'border-[#1a2c47] hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/30'
    }`}>
      {/* CCTV Screen Box */}
      <div className="relative aspect-video w-full bg-[#050911] cursor-pointer" onClick={handleCardClick}>
        <CCTVCanvas
          cameraId={camera.camera_id}
          sector={camera.sector}
          streamType={streamMode}
          videoUrl={camera.video_url}
          status={camera.status}
          showOverlay={showOverlay}
          movementDirection={activeInc?.movement_direction || 'NORTH_EAST'}
          riskScore={activeInc?.risk_score || (isAlert ? 85 : 30)}
          normalZone={zones.normal_zone}
          warningZone={zones.warning_zone}
          perimeterLine={zones.perimeter_line}
          restrictedZone={zones.restricted_zone}
        />

        {/* Top HUD Bar */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-black/85 border border-slate-700 text-xs font-mono font-bold text-white flex items-center gap-1.5 shadow">
              <span className={`w-2 h-2 rounded-full ${
                hasActiveIncident ? 'bg-red-500 animate-ping' : (isOffline ? 'bg-slate-500' : 'bg-emerald-400')
              }`}></span>
              {camera.camera_id}
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-cyan-300 border border-cyan-800/40">
              {camera.sector}
            </span>
            {/* Camera Health Tag */}
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
              health === 'ONLINE' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' :
              health === 'UNSTABLE' ? 'bg-amber-950/80 text-amber-300 border-amber-700/50' :
              'bg-red-950/80 text-red-300 border-red-700/50'
            }`}>
              {health}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* INCIDENT ALERT BADGE */}
            {hasActiveIncident ? (
              <div className="px-2 py-0.5 rounded bg-red-600 border border-red-400 text-[10px] font-mono font-bold text-white flex items-center gap-1 animate-pulse shadow-lg">
                <ShieldAlert className="w-3 h-3" />
                <span>REPLAY: RISK {activeInc.risk_score}</span>
              </div>
            ) : (
              <div className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
        </div>

        {/* Bottom HUD Bar */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none z-10">
          <div className="bg-black/80 px-2 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-300">
            <div className="text-cyan-400 font-semibold">{currentTime} UTC</div>
            <div className="text-slate-400 text-[9px] truncate max-w-[160px] sm:max-w-[220px]">
              {camera.location_name}
            </div>
          </div>

          {/* Quick HUD Mode Switchers */}
          <div className="pointer-events-auto flex items-center gap-1 bg-black/80 p-1 rounded border border-slate-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStreamMode('optical');
              }}
              title="Optical RGB"
              className={`p-1 rounded text-[10px] ${streamMode === 'optical' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStreamMode('thermal');
              }}
              title="FLIR Thermal"
              className={`p-1 rounded text-[10px] ${streamMode === 'thermal' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Flame className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStreamMode('night_vision');
              }}
              title="Night Vision NVG"
              className={`p-1 rounded text-[10px] ${streamMode === 'night_vision' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Moon className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOverlay(!showOverlay);
              }}
              title="Toggle AI HUD Overlay"
              className={`p-1 rounded text-[10px] ${showOverlay ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Layers className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-3 bg-[#0a1220] border-t border-[#1a2c47] flex items-center justify-between text-xs">
        <div>
          <h4 className="font-bold text-white tracking-wide truncate max-w-[180px] sm:max-w-[240px] flex items-center gap-1.5">
            {camera.name}
            {hasActiveIncident && (
              <span className="px-1.5 py-0.2 rounded bg-red-900/60 text-red-400 border border-red-700/50 text-[9px] font-mono">
                {activeInc.status}
              </span>
            )}
          </h4>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              {camera.latitude.toFixed(3)}, {camera.longitude.toFixed(3)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onMapClick && (
            <button
              onClick={() => onMapClick(camera)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 border border-slate-700/60 transition-colors"
              title="View on Map"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCardClick}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 transition-all ${
              hasActiveIncident
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/50'
                : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50'
            }`}
          >
            {hasActiveIncident ? (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Incident Replay</span>
              </>
            ) : (
              <>
                <span>Live Feed</span>
                <ExternalLink className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCard;
