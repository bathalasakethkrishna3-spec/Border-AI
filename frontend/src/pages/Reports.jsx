import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert, 
  Target,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { alertsAPI, detectionsAPI, camerasAPI } from '../services/api';

const Reports = () => {
  const [alerts, setAlerts] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [cameraFilter, setCameraFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Report Modal
  const [showBriefingModal, setShowBriefingModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertRes, camRes] = await Promise.all([
          alertsAPI.getAll(),
          camerasAPI.getAll()
        ]);
        setAlerts(alertRes.data || []);
        setCameras(camRes.data || []);
      } catch (err) {
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter records
  const filteredRecords = alerts.filter((record) => {
    const matchSector = sectorFilter === 'ALL' || record.sector === sectorFilter;
    const matchCamera = cameraFilter === 'ALL' || record.camera_id === cameraFilter;
    const matchType = typeFilter === 'ALL' || record.detection_type === typeFilter;
    const matchPriority = priorityFilter === 'ALL' || record.priority === priorityFilter;
    const matchStatus = statusFilter === 'ALL' || record.status === statusFilter;
    
    const matchSearch = !searchQuery || 
      record.alert_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.camera_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.detection_type?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSector && matchCamera && matchType && matchPriority && matchStatus && matchSearch;
  });

  // Export to CSV Function
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No data available to export with current filters.');
      return;
    }

    const headers = ['Alert ID', 'Camera ID', 'Sector', 'Location', 'Detection Type', 'Confidence (%)', 'Priority', 'Status', 'Timestamp', 'Resolved By'];
    const rows = filteredRecords.map(r => [
      `"${r.alert_id}"`,
      `"${r.camera_id}"`,
      `"${r.sector || ''}"`,
      `"${r.location_name || ''}"`,
      `"${r.detection_type}"`,
      r.confidence,
      `"${r.priority}"`,
      `"${r.status}"`,
      `"${r.created_at || ''}"`,
      `"${r.resolved_by || 'Unresolved'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BorderAI_Surveillance_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination slice
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              SURVEILLANCE INCIDENT AUDIT & INTELLIGENCE REPORTS
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              AUDIT TRAIL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive historical telemetry and threat incident logs with filtered CSV export.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBriefingModal(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>GENERATE BRIEFING</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Multi-Criteria Filter Controls */}
      <div className="p-4 rounded-xl bg-[#09101e] border border-[#1a2c47] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Keyword Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search alert, camera, msg..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Sector</label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Sectors</option>
              <option value="Sector A">Sector A</option>
              <option value="Sector B">Sector B</option>
              <option value="Sector C">Sector C</option>
              <option value="Sector D">Sector D</option>
              <option value="Sector E">Sector E</option>
            </select>
          </div>

          {/* Camera Filter */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Camera ID</label>
            <select
              value={cameraFilter}
              onChange={(e) => setCameraFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Cameras</option>
              {cameras.map(c => (
                <option key={c.camera_id} value={c.camera_id}>{c.camera_id}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Threats</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="surveillance-panel rounded-xl border border-[#1a2c47] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080e1a] border-b border-[#1a2c47] text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Alert ID</th>
                <th className="px-4 py-3">Camera Node</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Target Type</th>
                <th className="px-4 py-3">Threat Incident Summary</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Logged Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2c47]/60">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-slate-400">No incident logs found matching criteria.</td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.alert_id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{r.alert_id}</td>
                    <td className="px-4 py-3 text-cyan-400 font-bold">{r.camera_id}</td>
                    <td className="px-4 py-3 text-slate-300">{r.sector || 'Sector A'}</td>
                    <td className="px-4 py-3 text-white font-semibold">{r.detection_type}</td>
                    <td className="px-4 py-3 font-sans text-slate-300 max-w-xs truncate">{r.message}</td>
                    <td className="px-4 py-3 text-cyan-400 font-bold">{r.confidence}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.priority === 'HIGH' ? 'bg-red-950 text-red-400 border border-red-800' : (r.priority === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-blue-950 text-blue-400 border border-blue-800')
                      }`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[10px]">
                      {r.created_at?.substring(0, 19).replace('T', ' ') || r.time}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-[#080e1a] border-t border-[#1a2c47] flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-900 border border-[#1a2c47] hover:bg-slate-800 disabled:opacity-40 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-900 border border-[#1a2c47] hover:bg-slate-800 disabled:opacity-40 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Briefing Modal */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="surveillance-panel rounded-2xl p-6 border border-[#1a2c47] max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a2c47] pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">BORDER SURVEILLANCE DEFENSE BRIEFING</h3>
                <p className="text-xs text-slate-400">Generated on {new Date().toUTCString()}</p>
              </div>
              <button
                onClick={() => setShowBriefingModal(false)}
                className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Total Filtered:</span>
                <p className="text-xl font-bold text-white">{filteredRecords.length}</p>
              </div>
              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">High Severity:</span>
                <p className="text-xl font-bold text-red-400">
                  {filteredRecords.filter(r => r.priority === 'HIGH').length}
                </p>
              </div>
              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Resolved Rate:</span>
                <p className="text-xl font-bold text-emerald-400">
                  {Math.round((filteredRecords.filter(r => r.status === 'RESOLVED').length / (filteredRecords.length || 1)) * 100)}%
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-cyan-400 font-mono">EXECUTIVE SUMMARY:</h4>
              <p className="text-slate-300 leading-relaxed">
                During the evaluated operational window, automated AI neural surveillance engines processed multi-camera CCTV feeds. Threat alerts were automatically ingested and georeferenced. High-priority intrusion attempts in Sector B and Sector C were identified with over 90% model confidence.
              </p>
            </div>

            <div className="pt-3 border-t border-[#1a2c47] flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
