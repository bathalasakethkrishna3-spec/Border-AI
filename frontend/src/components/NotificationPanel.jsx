import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Cpu, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

const NotificationPanel = ({ onClose }) => {
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead } = useAlerts();
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'ALERT':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'SYSTEM':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id);
    if (notif.camera_id) {
      navigate(`/cameras/${notif.camera_id}`);
    } else {
      navigate('/alerts');
    }
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0b1322] border border-[#1a2c47] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="p-3.5 bg-[#0e192c] border-b border-[#1a2c47] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Operational Alerts ({unreadNotifications})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {unreadNotifications > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#1a2c47]/60">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active notifications. System perimeter is normal.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3 transition-colors cursor-pointer hover:bg-slate-900/80 flex items-start gap-3 ${
                !notif.is_read ? 'bg-cyan-950/20' : 'opacity-75'
              }`}
            >
              <div className="mt-0.5 p-1.5 rounded bg-slate-900 border border-[#1a2c47]">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-semibold truncate ${!notif.is_read ? 'text-white' : 'text-slate-300'}`}>
                    {notif.title}
                  </h4>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 ml-2"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  {notif.message}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{notif.time || 'Just now'}</span>
                  {notif.camera_id && (
                    <span className="text-cyan-400 hover:underline flex items-center gap-0.5">
                      {notif.camera_id} <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-[#080d17] border-t border-[#1a2c47] text-center">
        <button
          onClick={() => {
            navigate('/alerts');
            onClose();
          }}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold tracking-wide"
        >
          View All Threat Feeds →
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
