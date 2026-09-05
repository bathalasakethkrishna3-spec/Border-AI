import axios from 'axios';

// Public deployment URL support: uses VITE_API_BASE_URL if configured, else defaults to deployed Render backend
const DEPLOYED_BACKEND_URL = 'https://border-ai-backend.onrender.com';
const rawApiBase = import.meta.env.VITE_API_BASE_URL;

let API_URL;
let BACKEND_ORIGIN;

if (rawApiBase) {
  const cleanBase = rawApiBase.replace(/\/+$/, '');
  API_URL = cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;
  BACKEND_ORIGIN = cleanBase.endsWith('/api') ? cleanBase.slice(0, -4) : cleanBase;
} else if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    // Local dev (Vite proxy forwards /api) or local Flask server
    API_URL = `${window.location.origin}/api`;
    BACKEND_ORIGIN = window.location.origin;
  } else if (window.location.origin.includes('border-ai-backend.onrender.com')) {
    // Frontend served directly from the same backend host
    API_URL = `${window.location.origin}/api`;
    BACKEND_ORIGIN = window.location.origin;
  } else {
    // Separate frontend deployment (e.g. Render frontend static service)
    API_URL = `${DEPLOYED_BACKEND_URL}/api`;
    BACKEND_ORIGIN = DEPLOYED_BACKEND_URL;
  }
} else {
  API_URL = `${DEPLOYED_BACKEND_URL}/api`;
  BACKEND_ORIGIN = DEPLOYED_BACKEND_URL;
}

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_ORIGIN}${cleanPath}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('borderai_token') || localStorage.getItem('border_ai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized safely without breaking active sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const reqUrl = error.config?.url || '';
      // Only clear storage and redirect if authentication endpoint failed
      if (reqUrl.includes('/auth/me') || reqUrl.includes('/auth/verify')) {
        localStorage.removeItem('borderai_token');
        localStorage.removeItem('borderai_user');
        localStorage.removeItem('border_ai_token');
        localStorage.removeItem('border_ai_user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Sectors API
export const sectorsAPI = {
  getAll: (params) => api.get('/sectors', { params }),
  getById: (id) => api.get(`/sectors/${id}`),
  getCameras: (id) => api.get(`/sectors/${id}/cameras`),
  getIncidents: (id) => api.get(`/sectors/${id}/incidents`),
};

// Cameras API
export const camerasAPI = {
  getAll: (params) => api.get('/cameras', { params }),
  getById: (id) => api.get(`/cameras/${id}`),
  create: (cameraData) => api.post('/cameras', cameraData),
  update: (id, cameraData) => api.put(`/cameras/${id}`, cameraData),
  delete: (id) => api.delete(`/cameras/${id}`),
  uploadVideo: (id, formDataOrJson) => {
    if (formDataOrJson instanceof FormData) {
      return api.post(`/cameras/${id}/upload-video`, formDataOrJson, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post(`/cameras/${id}/upload-video`, formDataOrJson);
  },
  getUploads: (id) => api.get(`/cameras/${id}/uploads`),
  getUploadDetail: (id, uploadId) => api.get(`/cameras/${id}/uploads/${uploadId}`),
};

// Incidents API
export const incidentsAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  getActiveByCamera: (cameraId) => api.get(`/incidents/camera/${cameraId}/active`),
  acknowledge: (id, payload = {}) => api.post(`/incidents/${id}/acknowledge`, typeof payload === 'string' ? { notes: payload } : payload),
  investigate: (id, payload = {}) => api.post(`/incidents/${id}/investigate`, typeof payload === 'string' ? { notes: payload } : payload),
  resolve: (id, payload = {}) => api.post(`/incidents/${id}/resolve`, typeof payload === 'string' ? { notes: payload } : payload),
};

// Alerts API
export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  resolve: (id, payload = {}) => api.post(`/alerts/${id}/resolve`, typeof payload === 'string' ? { notes: payload } : payload),
  resolveAll: () => api.post('/alerts/resolve-all'),
  delete: (id) => api.delete(`/alerts/${id}`),
  simulate: (payload) => api.post('/alerts/simulate', payload),
};

// Detections API
export const detectionsAPI = {
  getAll: (params) => api.get('/detections', { params }),
  getLatest: (limit = 10) => api.get('/detections', { params: { limit } }),
  getByCamera: (cameraId) => api.get(`/detections?camera_id=${cameraId}`),
  simulate: (payload) => api.post('/detections/simulate', payload),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTrends: (params) => api.get('/analytics/trends', { params }),
};

// Assistant API
export const assistantAPI = {
  query: (queryText) => api.post('/assistant/query', { query: queryText }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

// Audit Logs API
export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  get: () => api.get('/settings'),
  update: (settingsData) => api.put('/settings', settingsData),
};

export default api;
