'use strict';
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src');

const files = {};

// ─── lib/api.ts ───────────────────────────────────────────────────────────────
files['lib/api.ts'] = `import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campus_token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
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
export const fetchZone = (id: string) => api.get(\`/zones/\${id}\`).then(r => r.data);
export const fetchZoneTelemetry = (id: string, limit = 50) =>
  api.get(\`/zones/\${id}/telemetry?limit=\${limit}\`).then(r => r.data);

// Devices
export const overrideDevice = (data: { deviceId: string; status: string; durationMinutes: number; reason: string }) =>
  api.post('/devices/override', data).then(r => r.data);
export const clearOverride = (deviceId: string) =>
  api.delete(\`/devices/\${deviceId}/override\`).then(r => r.data);

// Alerts
export const fetchAlerts = (params?: { resolved?: boolean; severity?: string }) =>
  api.get('/alerts', { params }).then(r => r.data);
export const resolveAlert = (id: string) =>
  api.patch(\`/alerts/\${id}/resolve\`).then(r => r.data);
export const emergencyShutdown = (zoneId: string) =>
  api.post('/alerts/emergency-shutdown', { zoneId }).then(r => r.data);

// Analytics
export const fetchEnergyAnalytics = () => api.get('/analytics/energy').then(r => r.data);
export const fetchAuditLogs = () => api.get('/analytics/audit-logs').then(r => r.data);

// AI
export const evaluateZone = (zoneId: string) =>
  api.post('/ai/evaluate-zone', { zoneId }).then(r => r.data);
`;

// ─── store/useStore.ts ────────────────────────────────────────────────────────
files['store/useStore.ts'] = `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'FACILITY_MANAGER' | 'SECURITY' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface Alert {
  id: string;
  zoneId: string;
  zoneName?: string;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isResolved: boolean;
  createdAt: string;
}

interface CampusStore {
  // Auth
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;

  // Real-time alerts
  liveAlerts: Alert[];
  addLiveAlert: (alert: Alert) => void;
  resolveLocalAlert: (id: string) => void;
  clearAlerts: () => void;

  // WS connection state
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;

  // Active zone filter
  zoneFilter: string;
  setZoneFilter: (v: string) => void;
}

export const useCampusStore = create<CampusStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('campus_token', token);
        localStorage.setItem('campus_user', JSON.stringify(user));
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('campus_token');
        localStorage.removeItem('campus_user');
        set({ user: null, token: null });
      },

      liveAlerts: [],
      addLiveAlert: (alert) =>
        set((s) => ({ liveAlerts: [alert, ...s.liveAlerts].slice(0, 50) })),
      resolveLocalAlert: (id) =>
        set((s) => ({ liveAlerts: s.liveAlerts.map(a => a.id === id ? { ...a, isResolved: true } : a) })),
      clearAlerts: () => set({ liveAlerts: [] }),

      wsConnected: false,
      setWsConnected: (v) => set({ wsConnected: v }),

      zoneFilter: 'ALL',
      setZoneFilter: (v) => set({ zoneFilter: v }),
    }),
    { name: 'campus-store', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
`;

// ─── hooks/useWebSocket.ts ────────────────────────────────────────────────────
files['hooks/useWebSocket.ts'] = `import { useEffect, useRef } from 'react';
import { useCampusStore } from '../store/useStore';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { setWsConnected, addLiveAlert } = useCampusStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log('[WS] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'TELEMETRY_UPDATE':
              queryClient.invalidateQueries({ queryKey: ['zones'] });
              break;
            case 'DEVICE_UPDATE':
              queryClient.invalidateQueries({ queryKey: ['zones'] });
              queryClient.invalidateQueries({ queryKey: ['zone', msg.payload?.zoneId] });
              break;
            case 'ALERT_CREATED':
              addLiveAlert({
                id: msg.payload.id,
                zoneId: msg.payload.zone_id,
                zoneName: msg.payload.zone_name,
                title: msg.payload.title,
                message: msg.payload.message,
                severity: msg.payload.severity,
                isResolved: false,
                createdAt: msg.payload.created_at,
              });
              queryClient.invalidateQueries({ queryKey: ['alerts'] });
              break;
            case 'ALERT_RESOLVED':
              queryClient.invalidateQueries({ queryKey: ['alerts'] });
              break;
            case 'AI_ACTION':
              queryClient.invalidateQueries({ queryKey: ['zones'] });
              queryClient.invalidateQueries({ queryKey: ['analytics'] });
              break;
          }
        } catch (e) {
          console.error('[WS] Parse error', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('[WS] Disconnected, reconnecting in 3s...');
        setTimeout(connect, 3000);
      };

      ws.onerror = (e) => {
        console.error('[WS] Error', e);
        ws.close();
      };
    }

    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return wsRef;
}
`;

// ─── hooks/useZones.ts ────────────────────────────────────────────────────────
files['hooks/useZones.ts'] = `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchZones, fetchZone, fetchZoneTelemetry, overrideDevice, clearOverride, evaluateZone } from '../lib/api';

export function useZones() {
  return useQuery({ queryKey: ['zones'], queryFn: fetchZones, refetchInterval: 10000 });
}

export function useZone(id: string) {
  return useQuery({ queryKey: ['zone', id], queryFn: () => fetchZone(id), enabled: !!id, refetchInterval: 5000 });
}

export function useZoneTelemetry(id: string, limit = 50) {
  return useQuery({ queryKey: ['telemetry', id], queryFn: () => fetchZoneTelemetry(id, limit), enabled: !!id, refetchInterval: 5000 });
}

export function useOverrideDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: overrideDevice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });
}

export function useClearOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearOverride,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });
}

export function useEvaluateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: evaluateZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
`;

// ─── hooks/useTelemetry.ts ────────────────────────────────────────────────────
files['hooks/useTelemetry.ts'] = `import { useQuery } from '@tanstack/react-query';
import { fetchEnergyAnalytics, fetchAlerts, fetchAuditLogs } from '../lib/api';

export function useEnergyAnalytics() {
  return useQuery({ queryKey: ['analytics'], queryFn: fetchEnergyAnalytics, refetchInterval: 15000 });
}

export function useAlerts(params?: { resolved?: boolean; severity?: string }) {
  return useQuery({ queryKey: ['alerts', params], queryFn: () => fetchAlerts(params), refetchInterval: 10000 });
}

export function useAuditLogs() {
  return useQuery({ queryKey: ['audit-logs'], queryFn: fetchAuditLogs, refetchInterval: 30000 });
}
`;

// ─── index.css ────────────────────────────────────────────────────────────────
files['../index.css'] = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg-primary: #080c14;
  --bg-secondary: #0d1623;
  --bg-card: #111a27;
  --bg-card-hover: #162234;
  --border: #1e3050;
  --border-glow: #1e4080;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
  --accent-blue: #3b82f6;
  --accent-cyan: #06b6d4;
  --accent-green: #10b981;
  --accent-yellow: #f59e0b;
  --accent-orange: #f97316;
  --accent-red: #ef4444;
  --accent-purple: #8b5cf6;
  --glow-blue: rgba(59,130,246,0.15);
  --glow-cyan: rgba(6,182,212,0.15);
  --glow-green: rgba(16,185,129,0.15);
  --glow-red: rgba(239,68,68,0.15);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body { height: 100%; }

body {
  font-family: 'Inter', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow-x: hidden;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-secondary); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-glow); }

/* Utility classes */
.glass {
  background: rgba(13,22,35,0.7);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
}

.glass-hover {
  transition: all 0.2s ease;
}
.glass-hover:hover {
  background: rgba(22,34,52,0.8);
  border-color: var(--border-glow);
  box-shadow: 0 0 20px var(--glow-blue);
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-glow);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--accent-blue);
  color: #fff;
}
.btn-primary:hover { background: #2563eb; box-shadow: 0 0 12px rgba(59,130,246,0.4); }

.btn-danger {
  background: var(--accent-red);
  color: #fff;
}
.btn-danger:hover { background: #dc2626; box-shadow: 0 0 12px rgba(239,68,68,0.4); }

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-ghost:hover { background: var(--bg-card-hover); color: var(--text-primary); border-color: var(--border-glow); }

.btn-sm { padding: 5px 10px; font-size: 12px; }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.badge-on { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
.badge-off { background: rgba(71,85,105,0.2); color: #64748b; border: 1px solid rgba(71,85,105,0.3); }
.badge-eco { background: rgba(6,182,212,0.15); color: #06b6d4; border: 1px solid rgba(6,182,212,0.3); }
.badge-maintenance { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }

.badge-low { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
.badge-medium { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.badge-high { background: rgba(249,115,22,0.12); color: #f97316; border: 1px solid rgba(249,115,22,0.25); }
.badge-critical { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); animation: pulse-critical 1.5s infinite; }

@keyframes pulse-critical {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
  50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.15); }
}

.glow-text-blue { color: var(--accent-blue); text-shadow: 0 0 20px rgba(59,130,246,0.5); }
.glow-text-cyan { color: var(--accent-cyan); text-shadow: 0 0 20px rgba(6,182,212,0.5); }
.glow-text-green { color: var(--accent-green); text-shadow: 0 0 20px rgba(16,185,129,0.5); }
.glow-text-red { color: var(--accent-red); text-shadow: 0 0 20px rgba(239,68,68,0.5); }

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-blue), transparent);
}

.stat-card.green::before { background: linear-gradient(90deg, transparent, var(--accent-green), transparent); }
.stat-card.cyan::before { background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent); }
.stat-card.yellow::before { background: linear-gradient(90deg, transparent, var(--accent-yellow), transparent); }
.stat-card.red::before { background: linear-gradient(90deg, transparent, var(--accent-red), transparent); }
.stat-card.purple::before { background: linear-gradient(90deg, transparent, var(--accent-purple), transparent); }

input, select, textarea {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  padding: 8px 12px;
  transition: all 0.15s ease;
  outline: none;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px var(--glow-blue);
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
}

.toggle-switch input { opacity: 0; width: 0; height: 0; }

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 16px; width: 16px;
  left: 3px; bottom: 3px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: 0.3s;
}

input:checked + .toggle-slider { background: var(--glow-green); border-color: var(--accent-green); }
input:checked + .toggle-slider:before { transform: translateX(20px); background: var(--accent-green); }

.animate-fade-in { animation: fadeIn 0.3s ease; }
.animate-slide-up { animation: slideUp 0.3s ease; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

@media (max-width: 1200px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 900px) { .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; } }

.page-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-body { padding: 24px; flex: 1; }

.metric-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-top: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  transition: all 0.2s;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
  animation: slideUp 0.25s ease;
}

.font-mono { font-family: 'JetBrains Mono', monospace; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.w-full { width: 100%; }
.text-xs { font-size: 12px; }
.text-sm { font-size: 14px; }
.text-base { font-size: 16px; }
.text-lg { font-size: 18px; }
.text-xl { font-size: 20px; }
.text-2xl { font-size: 24px; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.text-muted { color: var(--text-muted); }
.text-secondary { color: var(--text-secondary); }
.text-right { text-align: right; }
.text-center { text-align: center; }
.opacity-60 { opacity: 0.6; }
.rounded { border-radius: 8px; }
.rounded-full { border-radius: 9999px; }
.overflow-hidden { overflow: hidden; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

// Write all files
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(base, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Written:', relPath);
});

console.log('\n✅ Phase 1 client files written!');