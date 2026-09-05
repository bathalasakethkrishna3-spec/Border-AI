import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { alertsAPI, incidentsAPI, notificationsAPI, detectionsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [activeIncidentCount, setActiveIncidentCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [lastThreatEvent, setLastThreatEvent] = useState(null);

  const fetchAlertsAndNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [alertsRes, incidentsRes, notifsRes] = await Promise.all([
        alertsAPI.getAll({ status: 'ACTIVE' }),
        incidentsAPI.getAll({ status: 'UNRESOLVED' }),
        notificationsAPI.getAll({ limit: 10 })
      ]);

      const alerts = alertsRes.data || [];
      setActiveAlerts(alerts);
      setActiveAlertCount(alerts.length);

      const incidents = incidentsRes.data || [];
      setActiveIncidents(incidents);
      setActiveIncidentCount(incidents.length);

      const notifData = notifsRes.data || { notifications: [], unread_count: 0 };
      setNotifications(notifData.notifications || []);
      setUnreadNotifications(notifData.unread_count || 0);

      if (incidents.length > 0) {
        setLastThreatEvent(incidents[0]);
      } else if (alerts.length > 0) {
        setLastThreatEvent(alerts[0]);
      }
    } catch (err) {
      console.error('Error fetching alerts/notifications/incidents:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlertsAndNotifications();
    // Poll every 5 seconds for real-time surveillance updates
    const interval = setInterval(fetchAlertsAndNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchAlertsAndNotifications]);

  const acknowledgeIncident = async (incidentId) => {
    try {
      await incidentsAPI.acknowledge(incidentId);
      await fetchAlertsAndNotifications();
      return true;
    } catch (err) {
      console.error('Failed to acknowledge incident:', err);
      return false;
    }
  };

  const investigateIncident = async (incidentId) => {
    try {
      await incidentsAPI.investigate(incidentId);
      await fetchAlertsAndNotifications();
      return true;
    } catch (err) {
      console.error('Failed to mark incident under investigation:', err);
      return false;
    }
  };

  const resolveIncident = async (incidentId, notes) => {
    try {
      const payload = typeof notes === 'object' && notes !== null ? notes : { notes: notes || 'Perimeter sweep completed. All clear.' };
      await incidentsAPI.resolve(incidentId, payload);
      await fetchAlertsAndNotifications();
      return true;
    } catch (err) {
      console.error('Failed to resolve incident:', err);
      return false;
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await alertsAPI.resolve(alertId);
      await fetchAlertsAndNotifications();
      return true;
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      return false;
    }
  };

  const resolveAll = async () => {
    try {
      await alertsAPI.resolveAll();
      await fetchAlertsAndNotifications();
      return true;
    } catch (err) {
      console.error('Failed to resolve all alerts:', err);
      return false;
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      await fetchAlertsAndNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      await fetchAlertsAndNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const simulateAlert = async (cameraId = 'CAM-01', objectType = 'PERSON', confidence = 95.5, personCount = 1) => {
    try {
      await detectionsAPI.simulate({
        camera_id: cameraId,
        object_type: objectType,
        confidence: confidence,
        person_count: personCount
      });
      await fetchAlertsAndNotifications();
    } catch (err) {
      console.error('Simulation failed:', err);
    }
  };

  return (
    <AlertContext.Provider
      value={{
        activeAlerts,
        activeAlertCount,
        activeIncidents,
        activeIncidentCount,
        unreadNotifications,
        notifications,
        lastThreatEvent,
        refreshAlerts: fetchAlertsAndNotifications,
        acknowledgeIncident,
        investigateIncident,
        resolveIncident,
        resolveAlert,
        resolveAll,
        markNotificationRead,
        markAllNotificationsRead,
        simulateAlert
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
