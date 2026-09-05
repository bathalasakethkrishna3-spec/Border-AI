import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Video, 
  Clock, 
  Trash2, 
  Target,
  ExternalLink 
} from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

const AlertCard = ({ alert, onDelete, onMapFocus }) => {
  const navigate = useNavigate();
  const { resolveAlert } = useAlerts();

  if (!alert) return null;

  const isHigh = alert.priority === 'HIGH';
  const isMedium = alert.priority === 'MEDIUM';
  const isResolved = alert.status === 'RESOLVED';

  const handleResolve = async (e) => {
    e.stopPropagation();
    await resolveAlert(alert.alert_id || alert.id);
  };

  const handleViewCamera = (e) => {
    e.stopPropagation();
    navigate(`/cameras/${alert.camera_id}`);
  };

  const handleViewOnMap = (e) => {
    e.stopPropagation();
    if (onMapFocus) {
      onMapFocus(alert.camera_id);
    } else {
      navigate(`/map?focus=${alert.camera_id}`);
    }
  };

  return (
    <div
      className={`surveillance-panel rounded-xl p-4 border transition-all duration-200 ${
        isResolved
          ? 'border-slate-800 opacity-70 bg-[#080e1a]'
          : isHigh
          ? 'border-red-500/50 bg-gradient-to-r from-red-950/20 to-slate-900 shadow-md shadow-red-950/20 hover:border-red-400'
          : isMedium
          ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/20 to-slate-900 hover:border-amber-400'
          : 'border-blue-500/40 hover:border-blue-400'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${
            isResolved 
              ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-400'
              : isHigh 
              ? 'bg-red-950/60 border border-red-800 text-red-400 animate-pulse' 
              : 'bg-amber-950/60 border border-amber-800 text-amber-400'
          }`}>
            {isResolved ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isHigh ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                {alert.alert_id}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700">
                {alert.camera_id}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • {alert.sector || 'Sector'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">
              {alert.message}
            </h4>
          </div>
        </div>

        {/* Priority Badge */}
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 text-[10px] font-mono font-extrabold uppercase rounded-full tracking-wider border ${
            isResolved
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
              : isHigh
              ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
              : isMedium
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
              : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
          }`}>
            {isResolved ? 'RESOLVED' : `${alert.priority} PRIORITY`}
          </span>
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {alert.time || alert.created_at?.substring(11, 16) || 'Recent'}
          </span>
        </div>
      </div>

      {/* Detection Confidence Bar */}
      <div className="mt-3 pt-3 border-t border-[#1a2c47]/60 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" />
              Target: <b className="text-white ml-1">{alert.detection_type}</b>
            </span>
            <span className="text-cyan-400 font-bold">{alert.confidence}% Confidence</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${alert.confidence}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          {!isResolved && (
            <button
              onClick={handleResolve}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-mono font-semibold flex items-center gap-1 transition-all shadow-sm"
              title="Mark alert as resolved"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve</span>
            </button>
          )}

          <button
            onClick={handleViewCamera}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-mono font-semibold flex items-center gap-1 transition-all"
            title="Inspect camera feed"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            onClick={handleViewOnMap}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-mono font-semibold flex items-center gap-1 transition-all"
            title="Locate on border map"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map</span>
          </button>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(alert.alert_id || alert.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
              title="Delete alert"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
