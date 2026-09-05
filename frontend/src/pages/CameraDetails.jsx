import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Video, 
  ShieldAlert, 
  Layers, 
  Clock, 
  Target, 
  Flame, 
  Moon, 
  Sun, 
  Sparkles, 
  CheckCircle2, 
  Radio, 
  Cpu,
  Camera as CameraIcon,
  Maximize2,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  RotateCcw,
  Compass,
  AlertTriangle,
  FileCheck,
  Search,
  Eye,
  Activity,
  History,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import CCTVCanvas from '../components/CCTVCanvas';
import AddCameraModal from '../components/AddCameraModal';
import { camerasAPI, incidentsAPI, detectionsAPI } from '../services/api';
import { useAlerts } from '../context/AlertContext';

const CameraDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { acknowledgeIncident, investigateIncident, resolveIncident } = useAlerts();

  const [camera, setCamera] = useState(null);
  const [activeIncident, setActiveIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Priority View Mode: 'REPLAY' if unresolved incident exists, otherwise 'LIVE'
  const [viewMode, setViewMode] = useState('LIVE');
  const [streamMode, setStreamMode] = useState('optical');
  const [showOverlay, setShowOverlay] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Replay Video Buffer Controller (0 to 45 seconds, 15s is intrusion moment)
  const [replayTime, setReplayTime] = useState(15.0);
  const [isPlayingReplay, setIsPlayingReplay] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // PTZ State
  const [ptzPan, setPtzPan] = useState({ x: 0, y: 0 });
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchCameraData = async (initial = false) => {
    try {
      const res = await camerasAPI.getById(id);
      const camData = res.data;
      setCamera(camData);
      setStreamMode(camData.stream_type || 'optical');

      // Check for active unresolved incident
      const inc = camData.active_incident;
      setActiveIncident(inc);

      // SMART CAMERA OPENING LOGIC:
      if (initial) {
        if (camData.health_status === 'OFFLINE' || camData.health_status === 'NO_SIGNAL') {
          // If Offline, check if 24h incident exists
          if (camData.has_24h_incident && camData.recent_24h_incident) {
            setViewMode('REPLAY');
            setReplayTime(15.0);
          } else {
            setViewMode('OFFLINE_DIAGNOSTIC');
          }
        } else {
          // If Online, check unresolved incident
          if (inc && ['NEW', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION'].includes(inc.status)) {
            setViewMode('REPLAY');
            setReplayTime(15.0);
          } else {
            setViewMode('LIVE');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching camera details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameraData(true);
    const interval = setInterval(() => fetchCameraData(false), 5000);
    return () => clearInterval(interval);
  }, [id]);

  // Video Replay Playback Timer
  useEffect(() => {
    let animId;
    if (viewMode === 'REPLAY' && isPlayingReplay) {
      const timer = setInterval(() => {
        setReplayTime((prev) => {
          if (prev >= 45.0) return 0.0;
          return +(prev + 0.2 * playbackSpeed).toFixed(1);
        });
      }, 200);
      return () => clearInterval(timer);
    }
  }, [viewMode, isPlayingReplay, playbackSpeed]);

  const handleAcknowledge = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!activeIncident) return;
    await acknowledgeIncident(activeIncident.incident_id || activeIncident.id);
    await fetchCameraData(false);
  };

  const handleInvestigate = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!activeIncident) return;
    await investigateIncident(activeIncident.incident_id || activeIncident.id);
    await fetchCameraData(false);
  };

  const handleConfirmResolve = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!activeIncident) return;
    await resolveIncident(activeIncident.incident_id || activeIncident.id, resolutionNotes);
    setIsResolveModalOpen(false);
    setResolutionNotes('');
    await fetchCameraData(false);
    setViewMode('LIVE');
  };

  const handleTriggerDetection = async (type = 'PERSON') => {
    setIsSimulating(true);
    try {
      await detectionsAPI.simulate({
        camera_id: camera.camera_id,
        object_type: type,
        confidence: Math.floor(Math.random() * 10 + 90),
        person_count: type === 'MULTI_PERSON' ? 4 : 1
      });
      await fetchCameraData(false);
      setViewMode('REPLAY');
    } catch (err) {
      console.error('Failed to trigger simulation:', err);
    } finally {
      setTimeout(() => setIsSimulating(false), 800);
    }
  };

  const handleUpdateCamera = async (updatedData) => {
    await camerasAPI.update(camera.id || camera.camera_id, updatedData);
    await fetchCameraData(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="p-8 text-center surveillance-panel rounded-xl border border-red-800/40">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Camera Sensor Node Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">Unable to locate camera feed ID: {id}</p>
        <button
          onClick={() => navigate('/cameras')}
          className="mt-4 px-4 py-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700 text-xs font-mono"
        >
          Return to Camera List
        </button>
      </div>
    );
  }

  const isOffline = camera.health_status === 'OFFLINE' || camera.health_status === 'NO_SIGNAL';
  const isAlert = camera.status === 'ALERT' || Boolean(activeIncident);
  const isSuspicious = camera.status === 'SUSPICIOUS';
  const risk = activeIncident?.risk_score || (isAlert ? 94 : 20);

  const zones = camera.zones || {};
  const normalZone = zones.normal_zone;
  const warningZone = zones.warning_zone;
  const perimeterLine = zones.perimeter_line;
  const restrictedZone = zones.restricted_zone;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & PRIORITY INCIDENT BANNER */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl surveillance-panel border border-[#1a2c47]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-white">{camera.camera_id}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {camera.sector}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                  isAlert ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : (isSuspicious ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40')
                }`}>
                  {camera.status}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  isOffline ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  HEALTH: {camera.health_status || 'ONLINE'}
                </span>
              </div>
              <h2 className="text-xs text-slate-300 mt-0.5 font-medium">{camera.name} • {camera.location_name}</h2>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">

            {/* View Mode Toggle Button */}
            {activeIncident && (
              <button
                onClick={() => setViewMode(viewMode === 'REPLAY' ? 'LIVE' : 'REPLAY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  viewMode === 'REPLAY'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/60 ring-2 ring-red-400'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                }`}
              >
                {viewMode === 'REPLAY' ? (
                  <>
                    <Video className="w-3.5 h-3.5" />
                    <span>VIEW LIVE FEED</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>VIEW INCIDENT REPLAY</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => navigate(`/map?focus=${camera.camera_id}`)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>VIEW ON MAP</span>
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#070c16] hover:bg-slate-800 text-cyan-400 border border-[#1a2c47] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>CONFIG</span>
            </button>
          </div>
        </div>

        {/* ACTIVE UNRESOLVED INCIDENT ALERT BANNER */}
        {activeIncident && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/90 via-[#18090d] to-red-950/70 border-2 border-red-500/70 shadow-2xl shadow-red-950/60 text-white space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-red-800/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-600/30 border border-red-500 text-red-400 animate-pulse">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-red-300 tracking-wider">
                      CONFIRMED INTRUSION: {activeIncident.incident_id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-extrabold animate-pulse">
                      {activeIncident.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/60 border border-red-700 text-red-300 font-mono text-[10px] font-bold">
                      {activeIncident.detection_type}
                    </span>
                  </div>
                  <p className="text-xs text-red-200/90 mt-0.5">
                    {activeIncident.direction_description} • AI Confidence: {activeIncident.confidence}% • Targets: {activeIncident.person_count}
                  </p>
                </div>
              </div>

              {/* Risk Score Meter Gauge */}
              <div className="flex items-center gap-3 bg-black/60 p-2.5 rounded-xl border border-red-800/60">
                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Smart Threat Score</div>
                  <div className="text-xl font-extrabold text-red-400 leading-none">
                    {activeIncident.risk_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>
                  <span className="text-[9px] font-bold text-red-300 uppercase tracking-wide">
                    {activeIncident.risk_level}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-red-500 flex items-center justify-center bg-red-950 text-red-200 font-mono font-bold text-xs shadow-lg shadow-red-500/30 animate-pulse">
                  {activeIncident.risk_score}%
                </div>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="text-slate-400">Restricted Zone:</span>
                <span className="px-2 py-0.5 rounded bg-red-900/60 border border-red-700 text-red-300 font-bold">
                  BREACHED
                </span>
                <span className="text-slate-400">• Vector:</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-800 text-cyan-300 font-bold flex items-center gap-1">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  {activeIncident.movement_direction}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeIncident.status === 'NEW' && (
                  <button
                    onClick={handleAcknowledge}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ACKNOWLEDGE INCIDENT</span>
                  </button>
                )}

                {activeIncident.status === 'ACKNOWLEDGED' && (
                  <button
                    onClick={handleInvestigate}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950/50 transition-all"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>MARK UNDER INVESTIGATION</span>
                  </button>
                )}

                <button
                  onClick={() => setIsResolveModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>RESOLVE INCIDENT</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN VIDEO & INCIDENT REPLAY CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Screen Box */}
        <div className="lg:col-span-2 space-y-4">
          {viewMode === 'OFFLINE_DIAGNOSTIC' ? (
            /* OFFLINE CAMERA DIAGNOSTIC TELEMETRY VIEW (When Offline and NO 24h Incident exists) */
            <div className="surveillance-panel rounded-2xl overflow-hidden border border-slate-700 bg-[#060a12] p-8 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                  CAMERA OFFLINE — NO SIGNAL
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Sensor node {camera.camera_id} is currently disconnected from microwave relay. No active intrusion incidents recorded in the previous 24 hours.
                </p>
              </div>

              <div className="max-w-md mx-auto grid grid-cols-2 gap-2 text-left font-mono text-xs p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="text-slate-500">Camera ID:</span>
                  <p className="text-white font-bold">{camera.camera_id}</p>
                </div>
                <div>
                  <span className="text-slate-500">Sector:</span>
                  <p className="text-white font-bold">{camera.sector}</p>
                </div>
                <div>
                  <span className="text-slate-500">Location:</span>
                  <p className="text-slate-300">{camera.location_name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Last Active:</span>
                  <p className="text-cyan-400">{camera.last_active ? camera.last_active.substring(0, 19).replace('T', ' ') : 'Offline'}</p>
                </div>
              </div>

              <button
                onClick={() => fetchCameraData(true)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-mono"
              >
                Retry Microwave Relay Connection
              </button>
            </div>
          ) : (
            <div className={`surveillance-panel rounded-2xl overflow-hidden border shadow-2xl relative ${
              viewMode === 'REPLAY' ? 'border-red-500/80 ring-2 ring-red-500/40' : 'border-[#1a2c47]'
            }`}>
              {/* Screen Header Bar */}
              <div className="p-3 bg-[#080e1a] border-b border-[#1a2c47] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${viewMode === 'REPLAY' ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
                  <span className="text-xs font-mono font-bold text-white tracking-wider">
                    {viewMode === 'REPLAY' 
                      ? `SAVED INCIDENT BUFFER REPLAY (45s FORENSIC CLIP)` 
                      : `LIVE ULTRA-HD STREAM • ${camera.resolution}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <span>FPS: {camera.fps}</span>
                  <span>• IP: {camera.ip_address}</span>
                </div>
              </div>

              {/* Video Canvas Box with 4-Tier Zones */}
              <div className="relative aspect-video w-full bg-[#050911]">
                <CCTVCanvas
                  cameraId={camera.camera_id}
                  sector={camera.sector}
                  streamType={streamMode}
                  videoUrl={camera.video_url}
                  status={camera.status}
                  showOverlay={showOverlay}
                  isReplayMode={viewMode === 'REPLAY'}
                  replayTimeSeconds={replayTime}
                  movementDirection={activeIncident?.movement_direction || 'NORTH_EAST'}
                  directionDescription={activeIncident?.direction_description}
                  riskScore={risk}
                  normalZone={normalZone}
                  warningZone={warningZone}
                  perimeterLine={perimeterLine}
                  restrictedZone={restrictedZone}
                />
              </div>

              {/* REPLAY TIMELINE SCRUBBER & CONTROLLER */}
              {viewMode === 'REPLAY' && (
                <div className="p-3 bg-[#0c1424] border-t border-red-900/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlayingReplay(!isPlayingReplay)}
                        className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
                      >
                        {isPlayingReplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setReplayTime(0.0)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Restart Buffer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-white">
                        {replayTime.toFixed(1)}s <span className="text-slate-400 font-normal">/ 45.0s</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">Speed:</span>
                      {[0.5, 1.0, 2.0].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            playbackSpeed === spd ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrubber Range Input */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="45"
                      step="0.1"
                      value={replayTime}
                      onChange={(e) => setReplayTime(parseFloat(e.target.value))}
                      className="w-full accent-red-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="absolute top-0 left-[33.3%] w-1 h-3 bg-red-500 -translate-x-1/2 pointer-events-none rounded shadow-lg shadow-red-500"></div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                      <span>0s (15s Before Intrusion)</span>
                      <span className="text-red-400 font-bold">▲ 15s (Intrusion Moment)</span>
                      <span>45s (30s After Intrusion)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Controls Footer */}
              <div className="p-3 bg-[#080e1a] border-t border-[#1a2c47] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Spectrum:</span>
                  <button
                    onClick={() => setStreamMode('optical')}
                    className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
                      streamMode === 'optical' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3 h-3" /> Optical RGB
                  </button>
                  <button
                    onClick={() => setStreamMode('thermal')}
                    className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
                      streamMode === 'thermal' ? 'bg-red-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3 h-3" /> FLIR Thermal
                  </button>
                  <button
                    onClick={() => setStreamMode('night_vision')}
                    className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
                      streamMode === 'night_vision' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3 h-3" /> NVG Night
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOverlay(!showOverlay)}
                    className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1 border transition-colors ${
                      showOverlay ? 'bg-purple-950 text-purple-300 border-purple-700' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Layers className="w-3 h-3" /> 4-Tier Zones: {showOverlay ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test Trigger Bar for Live AI Simulation */}
          <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Staged Intrusion Simulation
              </h4>
              <p className="text-[11px] text-slate-400">
                Person Detected ≠ Intrusion. Evaluates Normal Activity, Warning Approach, and Restricted Breach.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTriggerDetection('PERSON')}
                disabled={isSimulating}
                className="px-2.5 py-1 rounded bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 text-xs font-mono"
              >
                + Normal Person
              </button>
              <button
                onClick={() => handleTriggerDetection('MULTI_PERSON')}
                disabled={isSimulating}
                className="px-2.5 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs font-mono"
              >
                + Group (4)
              </button>
              <button
                onClick={() => handleTriggerDetection('INTRUDER')}
                disabled={isSimulating}
                className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 text-xs font-mono"
              >
                + Intrusion Breach
              </button>
            </div>
          </div>
        </div>

        {/* 3. RIGHT COLUMN: INCIDENT TIMELINE & CAMERA TELEMETRY */}
        <div className="space-y-4">
          {/* CHRONOLOGICAL INCIDENT TIMELINE CARD */}
          {activeIncident && activeIncident.timeline && activeIncident.timeline.length > 0 && (
            <div className="surveillance-panel rounded-xl p-4 border border-red-900/60 bg-gradient-to-b from-red-950/20 to-transparent space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2 border-b border-[#1a2c47] pb-2">
                <Clock className="w-4 h-4 text-red-400" /> Staged Incident Timeline ({activeIncident.incident_id})
              </h3>

              <div className="relative pl-4 border-l-2 border-red-800/60 space-y-3 max-h-60 overflow-y-auto">
                {activeIncident.timeline.map((evt, idx) => (
                  <div key={idx} className="relative text-xs">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-black"></div>
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span className="font-bold text-red-300">{evt.time || '00:00:00'}</span>
                      <span className="text-slate-500">{evt.actor}</span>
                    </div>
                    <p className="font-bold text-white text-[11px] mt-0.5">{evt.event_title}</p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{evt.event_description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hardware & Location Card */}
          <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2 border-b border-[#1a2c47] pb-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> Sensor Hardware Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-900/60 border border-[#1a2c47]">
                <span className="text-slate-400 text-[10px]">Sector:</span>
                <p className="text-white font-bold">{camera.sector}</p>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-[#1a2c47]">
                <span className="text-slate-400 text-[10px]">Status:</span>
                <p className={isAlert ? 'text-red-400 font-bold' : (isSuspicious ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold')}>
                  {camera.status}
                </p>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-[#1a2c47]">
                <span className="text-slate-400 text-[10px]">GPS Latitude:</span>
                <p className="text-cyan-400 font-bold">{camera.latitude.toFixed(4)}° N</p>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-[#1a2c47]">
                <span className="text-slate-400 text-[10px]">GPS Longitude:</span>
                <p className="text-cyan-400 font-bold">{camera.longitude.toFixed(4)}° E</p>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-[#1a2c47]">
                <span className="text-slate-400 text-[10px]">Resolution:</span>
                <p className="text-slate-200">{camera.resolution}</p>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-[#1a2c47]">
                <span className="text-slate-400 text-[10px]">Health:</span>
                <p className={isOffline ? 'text-slate-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {camera.health_status || 'ONLINE'}
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Videos & Recent Incidents for this Camera */}
          <div className="surveillance-panel rounded-xl p-4 border border-[#1a2c47] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2 border-b border-[#1a2c47] pb-2">
              <History className="w-4 h-4 text-cyan-400" /> Video Analysis Dossiers ({camera.recent_uploads?.length || 0})
            </h3>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {!camera.recent_uploads || camera.recent_uploads.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No video upload analysis logged for this node.</p>
              ) : (
                camera.recent_uploads.map((u) => (
                  <div key={u.upload_id} className="p-2.5 rounded bg-slate-900/70 border border-slate-800 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">{u.upload_id}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {u.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 truncate">{u.filename}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Detections: {u.total_detections}</span>
                      <span className="text-red-400 font-bold">Incidents: {u.total_incidents}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RESOLVE INCIDENT MODAL */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl surveillance-panel border border-emerald-500/60 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base font-mono">Resolve Intrusion Incident</h3>
                <p className="text-xs text-slate-400">Incident: {activeIncident?.incident_id}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300">Resolution Field Notes & Action Taken:</label>
              <textarea
                rows="4"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="E.g., Perimeter sweep conducted by Unit 4. Target identified and secured. All clear."
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold"
              >
                Confirm Resolution & Return to Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Camera Modal */}
      <AddCameraModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateCamera}
        initialData={camera}
      />
    </div>
  );
};

export default CameraDetails;
