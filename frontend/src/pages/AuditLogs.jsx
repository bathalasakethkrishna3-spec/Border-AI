import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ShieldCheck, 
  User, 
  Activity, 
  Clock,
  Radio
} from 'lucide-react';
import { auditLogsAPI } from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      const params = {};
      if (actionFilter !== 'ALL') params.action = actionFilter;
      const res = await auditLogsAPI.getAll(params);
      setLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.username?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.ip_address?.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              SECURITY AUDIT & OPERATIONAL EVENT TIMELINE
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              IMMUTABLE LEDGER
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically timestamped operator actions, system events, login attempts, and threshold updates.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#09101e] border border-[#1a2c47] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, action, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Action Type:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="CAMERA_ADDED">Camera Deployments</option>
            <option value="ALERT_RESOLVED">Alert Resolutions</option>
            <option value="AI_ALERT_TRIGGERED">AI Alert Triggers</option>
            <option value="SETTINGS_UPDATED">Settings Changes</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="surveillance-panel rounded-xl border border-[#1a2c47] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080e1a] border-b border-[#1a2c47] text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Operator / Source</th>
                <th className="px-4 py-3">Event Action</th>
                <th className="px-4 py-3">Audit Details</th>
                <th className="px-4 py-3">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2c47]/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-slate-400">No audit events found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3 text-cyan-400 font-bold whitespace-nowrap">{log.time || log.created_at?.substring(0, 19).replace('T', ' ')}</td>
                    <td className="px-4 py-3 text-white font-semibold">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-300 max-w-md">{log.details}</td>
                    <td className="px-4 py-3 text-slate-400 text-[10px]">{log.ip_address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
