import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('campus_token');
      localStorage.removeItem('campus_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const getMe = () => api.get('/auth/me').then(r => r.data);

// Zones
export const fetchZones = () => api.get('/zones').then(r => r.data);
export const fetchZone = (id: string) => api.get(`/zones/${id}`).then(r => r.data);
export const fetchZoneTelemetry = (id: string, limit = 50) =>
  api.get(`/zones/${id}/telemetry?limit=${limit}`).then(r => r.data);

// Devices
export const overrideDevice = (data: { deviceId: string; status: string; durationMinutes: number; reason: string }) =>
  api.post('/devices/override', data).then(r => r.data);
export const clearOverride = (deviceId: string) =>
  api.delete(`/devices/${deviceId}/override`).then(r => r.data);

// Alerts
export const fetchAlerts = (params?: { resolved?: boolean; severity?: string }) =>
  api.get('/alerts', { params }).then(r => r.data);
export const resolveAlert = (id: string) =>
  api.patch(`/alerts/${id}/resolve`).then(r => r.data);
export const emergencyShutdown = (zoneId: string) =>
  api.post('/alerts/emergency-shutdown', { zoneId }).then(r => r.data);

// Analytics
export const fetchEnergyAnalytics = () => api.get('/analytics/energy').then(r => r.data);
export const fetchAuditLogs = () => api.get('/analytics/audit-logs').then(r => r.data);

// AI
export const evaluateZone = (zoneId: string) =>
  api.post('/ai/evaluate-zone', { zoneId }).then(r => r.data);
