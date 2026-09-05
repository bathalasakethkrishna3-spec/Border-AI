import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Sliders, 
  Bell, 
  HardDrive, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  RefreshCw,
  Radio
} from 'lucide-react';
import { settingsAPI } from '../services/api';

const Settings = () => {
  const [config, setConfig] = useState({
    threshold_person: '80.0',
    threshold_vehicle: '75.0',
    threshold_weapon: '70.0',
    threshold_intruder: '75.0',
    threshold_motion: '85.0',
    threshold_drone: '75.0',
    auto_alert_enabled: 'true',
    siren_audio_enabled: 'true',
    retention_days: '30',
    threat_defense_level: 'ELEVATED'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsAPI.get();
        if (res.data?.config) {
          setConfig(prev => ({ ...prev, ...res.data.config }));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSliderChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: String(value) }));
  };

  const handleToggle = (key) => {
    setConfig(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await settingsAPI.update(config);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              SYSTEM CONFIGURATION & NEURAL SENSITIVITY CALIBRATION
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              REAL-TIME TUNING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure AI detection confidence gates, audio dispatch alarms, and surveillance storage retention policies.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 transition-all self-start md:self-auto disabled:opacity-60"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Updating Parameters...' : 'APPLY CONFIGURATION'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Surveillance sensitivity thresholds and system parameters synchronized to backend database.</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: AI Object Detection Sensitivity */}
        <div className="surveillance-panel rounded-xl p-5 border border-[#1a2c47] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a2c47] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> AI Detection Confidence Thresholds
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">YOLO Gating (%)</span>
          </div>

          <div className="space-y-4">
            {/* Person */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Person / Intruder Signature:</span>
                <span className="text-cyan-400 font-bold">{config.threshold_person}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={parseFloat(config.threshold_person) || 80}
                onChange={(e) => handleSliderChange('threshold_person', e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-slate-400">Detections above this confidence trigger high-priority intruder tracking.</span>
            </div>

            {/* Vehicle */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Vehicle / Convoy Detection:</span>
                <span className="text-amber-400 font-bold">{config.threshold_vehicle}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={parseFloat(config.threshold_vehicle) || 75}
                onChange={(e) => handleSliderChange('threshold_vehicle', e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[10px] text-slate-400">Confidence gate for light and armored vehicle signatures.</span>
            </div>

            {/* Weapon */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Weapon / Threat Signature:</span>
                <span className="text-red-400 font-bold">{config.threshold_weapon}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={parseFloat(config.threshold_weapon) || 70}
                onChange={(e) => handleSliderChange('threshold_weapon', e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-400"
              />
              <span className="text-[10px] text-slate-400">High sensitivity trigger for potential firearm or weapon profile.</span>
            </div>

            {/* Motion */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Perimeter Optical Motion Sensitivity:</span>
                <span className="text-purple-400 font-bold">{config.threshold_motion}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={parseFloat(config.threshold_motion) || 85}
                onChange={(e) => handleSliderChange('threshold_motion', e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <span className="text-[10px] text-slate-400">Filters environmental vegetation sway while alerting on body motion.</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Threat Alarm & Storage Configuration */}
        <div className="space-y-6">
          {/* Alarms */}
          <div className="surveillance-panel rounded-xl p-5 border border-[#1a2c47] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a2c47] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" /> Operational Alert Triggers
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-[#1a2c47]">
                <div>
                  <p className="text-xs font-bold text-white">Automated High-Priority Alerts</p>
                  <p className="text-[11px] text-slate-400">Spawn real-time operator alerts when AI confidence breaches threshold.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('auto_alert_enabled')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${config.auto_alert_enabled === 'true' ? 'bg-cyan-600' : 'bg-slate-700'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.auto_alert_enabled === 'true' ? 'left-6' : 'left-1'}`}></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-[#1a2c47]">
                <div>
                  <p className="text-xs font-bold text-white">Audible Console Siren</p>
                  <p className="text-[11px] text-slate-400">Trigger audio siren buzzer on verified perimeter breaches.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('siren_audio_enabled')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${config.siren_audio_enabled === 'true' ? 'bg-cyan-600' : 'bg-slate-700'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.siren_audio_enabled === 'true' ? 'left-6' : 'left-1'}`}></span>
                </button>
              </div>
            </div>
          </div>

          {/* Storage Policy */}
          <div className="surveillance-panel rounded-xl p-5 border border-[#1a2c47] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a2c47] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" /> Video Recording & Telemetry Retention
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Retention Window (Days)</label>
                <input
                  type="number"
                  value={config.retention_days}
                  onChange={(e) => setConfig({ ...config, retention_days: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-[#1a2c47] text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Defense Readiness</label>
                <select
                  value={config.threat_defense_level}
                  onChange={(e) => setConfig({ ...config, threat_defense_level: e.target.value })}
                  className="w-full px-2.5 py-2 rounded bg-slate-900 border border-[#1a2c47] text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="NORMAL">DEFCON 5 - NORMAL</option>
                  <option value="ELEVATED">DEFCON 4 - ELEVATED</option>
                  <option value="HIGH_ALERT">DEFCON 3 - HIGH ALERT</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
