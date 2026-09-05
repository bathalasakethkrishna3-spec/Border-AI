import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Grid2X2, 
  Grid3X3, 
  Square, 
  Filter, 
  Flame, 
  Moon, 
  Sun, 
  Radio, 
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Activity,
  ShieldAlert
} from 'lucide-react';
import CameraCard from '../components/CameraCard';
import { camerasAPI } from '../services/api';
import { useAlerts } from '../context/AlertContext';

const LiveSurveillance = () => {
  const { simulateAlert } = useAlerts();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridMode, setGridMode] = useState('2x2');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [sensorFilter, setSensorFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchCameras = async () => {
    try {
      const res = await camerasAPI.getAll();
      setCameras(res.data || []);
    } catch (err) {
      console.error('Error fetching cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerSim = async () => {
    setIsSimulating(true);
    const targetCam = cameras[Math.floor(Math.random() * cameras.length)]?.camera_id || 'CAM-01';
    const threats = ['PERSON', 'MULTI_PERSON', 'INTRUDER', 'VEHICLE'];
    const selectedThreat = threats[Math.floor(Math.random() * threats.length)];
    const conf = Math.floor(Math.random() * 15 + 85);
    const pCount = selectedThreat === 'MULTI_PERSON' ? 4 : 1;
    
    await simulateAlert(targetCam, selectedThreat, conf, pCount);
    await fetchCameras();
    setTimeout(() => setIsSimulating(false), 1200);
  };

  // Filter cameras
  const filteredCameras = cameras.filter((cam) => {
    const matchSector = sectorFilter === 'ALL' || cam.sector === sectorFilter;
    const matchSensor = sensorFilter === 'ALL' || cam.stream_type === sensorFilter;
    const matchHealth = healthFilter === 'ALL' || (cam.health_status || 'ONLINE') === healthFilter;
    return matchSector && matchSensor && matchHealth;
  });

  const getGridClass = () => {
    if (gridMode === '1x1') return 'grid-cols-1 max-w-4xl mx-auto';
    if (gridMode === '3x3') return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2'; // 2x2 default
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl surveillance-panel border border-[#1a2c47]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide font-mono">
              MULTI-SENSOR SURVEILLANCE & COMMAND MATRIX
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {filteredCameras.length} SENSOR NODES SYNCED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-spectrum CCTV feeds with smart incident priority and 45s buffered event replays.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTriggerSim}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Simulate incoming YOLO intrusion alert"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-red-400' : 'text-red-400'}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Intrusion'}</span>
          </button>

          {/* Grid Layout Switcher */}
          <div className="flex items-center bg-[#070c16] p-1 rounded-lg border border-[#1a2c47]">
            <button
              onClick={() => setGridMode('1x1')}
              className={`p-1.5 rounded text-xs ${gridMode === '1x1' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Single Focus (1x1)"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setGridMode('2x2')}
              className={`p-1.5 rounded text-xs ${gridMode === '2x2' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Tactical Quad (2x2)"
            >
              <Grid2X2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setGridMode('3x3')}
              className={`p-1.5 rounded text-xs ${gridMode === '3x3' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Surveillance Wall (3x3)"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#09101e] border border-[#1a2c47] text-xs">
        {/* Sector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-mono font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" /> Sector:
          </span>
          {['ALL', 'Sector A', 'Sector B', 'Sector C', 'Sector D', 'Sector E'].map((sec) => (
            <button
              key={sec}
              onClick={() => setSectorFilter(sec)}
              className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors ${
                sectorFilter === sec
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Health Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono font-semibold mr-1 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" /> Health:
          </span>
          {['ALL', 'ONLINE', 'UNSTABLE', 'OFFLINE'].map((h) => (
            <button
              key={h}
              onClick={() => setHealthFilter(h)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                healthFilter === h
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Sensor Spectrum Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono font-semibold mr-1">Spectrum:</span>
          {[
            { id: 'ALL', label: 'All Spectrum' },
            { id: 'optical', label: 'Optical RGB' },
            { id: 'thermal', label: 'FLIR Thermal' },
            { id: 'night_vision', label: 'Night Vision' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSensorFilter(s.id)}
              className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors ${
                sensorFilter === s.id
                  ? 'bg-purple-950 text-purple-300 border border-purple-700/80 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cameras Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="py-20 text-center surveillance-panel rounded-xl border border-[#1a2c47]">
          <p className="text-slate-400 text-sm">No cameras match the selected sector/sensor filters.</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${getGridClass()}`}>
          {filteredCameras.map((camera) => (
            <CameraCard
              key={camera.camera_id}
              camera={camera}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveSurveillance;
