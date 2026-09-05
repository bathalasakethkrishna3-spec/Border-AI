import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Compass, 
  PlayCircle, 
  CheckCircle2, 
  Download, 
  FileText, 
  ExternalLink,
  RefreshCw,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { incidentsAPI } from '../services/api';
import CCTVCanvas from '../components/CCTVCanvas';

const IncidentHistory = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (riskFilter !== 'ALL') params.risk_level = riskFilter;
      if (sectorFilter !== 'ALL') params.sector = sectorFilter;

      const res = await incidentsAPI.getAll(params);
      const list = res.data || [];
      setIncidents(list);
      if (list.length > 0 && !selectedIncident) {
        setSelectedIncident(list[0]);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, riskFilter, sectorFilter]);

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.incident_id?.toLowerCase().includes(q) ||
      inc.camera_id?.toLowerCase().includes(q) ||
      inc.sector?.toLowerCase().includes(q) ||
      inc.detection_type?.toLowerCase().includes(q)
    );
  });

  const exportIncidentReport = () => {
    const jsonStr = JSON.stringify(filteredIncidents, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BorderAI_Incidents_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl surveillance-panel border border-[#1a2c47]">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white flex items-center gap-2 font-mono">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            INCIDENT HISTORY & FORENSIC LOGS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Permanent, immutable records of all border intrusion events, video replay buffers, and triage resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchIncidents}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportIncidentReport}
            className="px-3 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT DOSSIER</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Incident ID, Camera, Sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW (Unresolved)</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        {/* Risk Level Filter */}
        <div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL (81-100)</option>
            <option value="HIGH">HIGH (61-80)</option>
            <option value="MEDIUM">MEDIUM (31-60)</option>
            <option value="LOW">LOW (0-30)</option>
          </select>
        </div>

        {/* Sector Filter */}
        <div>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-[#1a2c47] text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Sectors</option>
            <option value="Sector A">Sector A</option>
            <option value="Sector B">Sector B</option>
            <option value="Sector C">Sector C</option>
            <option value="Sector D">Sector D</option>
            <option value="Sector E">Sector E</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Incident Master List (Left) + Detail Dossier & Replay (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents List Column */}
        <div className="lg:col-span-1 surveillance-panel rounded-xl p-4 border border-[#1a2c47] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1a2c47] pb-2">
            <span className="text-xs font-mono font-bold text-white uppercase">
              Incident Records ({filteredIncidents.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center font-mono">
                No incidents match the active filters.
              </p>
            ) : (
              filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isCritical = inc.risk_level === 'CRITICAL';

                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500'
                        : 'bg-slate-900/60 border-[#1a2c47] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-white">
                        <span className={`w-2 h-2 rounded-full ${
                          inc.status === 'RESOLVED' ? 'bg-emerald-400' : 'bg-red-500 animate-ping'
                        }`}></span>
                        <span>{inc.incident_id}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        inc.status === 'RESOLVED'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950/80 text-red-400 border border-red-800'
                      }`}>
                        {inc.status}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-semibold">{inc.camera_id} • {inc.sector}</span>
                      <span className={`font-mono font-bold ${
                        isCritical ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        Risk: {inc.risk_score}/100
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{inc.detection_type} ({inc.person_count} target{inc.person_count > 1 ? 's' : ''})</span>
                      <span>{inc.formatted_time}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Incident Detail & Saved Video Replay (Right 2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedIncident ? (
            <>
              {/* Replay Screen */}
              <div className="surveillance-panel rounded-2xl overflow-hidden border border-red-500/70 shadow-2xl space-y-0">
                <div className="p-3 bg-[#080e1a] border-b border-[#1a2c47] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-xs font-mono font-bold text-white tracking-wider">
                      HISTORICAL INCIDENT VIDEO REPLAY • {selectedIncident.incident_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/cameras/${selectedIncident.camera_id}`)}
                      className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs font-mono font-bold flex items-center gap-1"
                    >
                      <span>Open Camera</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="relative aspect-video w-full bg-[#050911]">
                  <CCTVCanvas
                    cameraId={selectedIncident.camera_id}
                    sector={selectedIncident.sector}
                    streamType="optical"
                    status="ALERT"
                    showOverlay={true}
                    isReplayMode={true}
                    replayTimeSeconds={15.0}
                    movementDirection={selectedIncident.movement_direction}
                    directionDescription={selectedIncident.direction_description}
                    riskScore={selectedIncident.risk_score}
                  />
                </div>
              </div>

              {/* Comprehensive Incident Dossier Card */}
              <div className="surveillance-panel rounded-xl p-5 border border-[#1a2c47] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1a2c47] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-bold text-lg text-white">
                        {selectedIncident.incident_id}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                        selectedIncident.status === 'RESOLVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-red-950 text-red-400 border border-red-700'
                      }`}>
                        {selectedIncident.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Camera: {selectedIncident.camera_id} ({selectedIncident.camera_name}) • {selectedIncident.location_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-400 uppercase">Evaluated Threat Score</div>
                      <div className="text-xl font-extrabold text-red-400">
                        {selectedIncident.risk_score} / 100
                      </div>
                      <span className="text-[10px] font-bold text-red-300">{selectedIncident.risk_level}</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-900/70 border border-[#1a2c47]">
                    <span className="text-[10px] text-slate-400">Threat Type:</span>
                    <p className="font-bold text-white mt-0.5">{selectedIncident.detection_type}</p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/70 border border-[#1a2c47]">
                    <span className="text-[10px] text-slate-400">Target Count:</span>
                    <p className="font-bold text-white mt-0.5">{selectedIncident.person_count} Target(s)</p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/70 border border-[#1a2c47]">
                    <span className="text-[10px] text-slate-400">Confidence:</span>
                    <p className="font-bold text-cyan-400 mt-0.5">{selectedIncident.confidence}%</p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/70 border border-[#1a2c47]">
                    <span className="text-[10px] text-slate-400">Direction Vector:</span>
                    <p className="font-bold text-cyan-300 mt-0.5">{selectedIncident.movement_direction}</p>
                  </div>
                </div>

                {/* Resolution Notes (if resolved) */}
                {selectedIncident.resolution_notes && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs">
                    <span className="font-mono font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-4 h-4" /> Incident Resolution Dossier
                    </span>
                    <p className="text-slate-300 leading-relaxed">{selectedIncident.resolution_notes}</p>
                    <p className="text-[10px] font-mono text-emerald-400/80 mt-1">
                      Resolved by: {selectedIncident.resolved_by || 'Commander'} at {selectedIncident.resolved_at}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                {selectedIncident.timeline && selectedIncident.timeline.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1a2c47]">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">
                      Timeline of Events
                    </h4>
                    <div className="relative pl-4 border-l-2 border-slate-700 space-y-2.5 max-h-52 overflow-y-auto">
                      {selectedIncident.timeline.map((t, idx) => (
                        <div key={idx} className="relative text-xs">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 border border-black"></div>
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                            <span className="font-bold text-cyan-300">{t.time || '00:00:00'}</span>
                            <span className="text-slate-500">{t.actor}</span>
                          </div>
                          <p className="font-bold text-white text-[11px] mt-0.5">{t.event_title}</p>
                          <p className="text-[10px] text-slate-300">{t.event_description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center surveillance-panel rounded-xl border border-[#1a2c47]">
              <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-mono">Select an incident to view forensic video replay and timeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentHistory;
