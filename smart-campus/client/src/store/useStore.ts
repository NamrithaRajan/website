import { create } from 'zustand';
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
