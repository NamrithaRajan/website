import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, BarChart3, Bell, Settings, Calendar,
  Activity, Wifi, WifiOff, LogOut, Shield, ChevronDown
} from 'lucide-react';
import { useCampusStore } from '../store/useStore';
import { useAlerts } from '../hooks/useTelemetry';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/zones', icon: MapPin, label: 'Zones' },
  { to: '/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const roleColors: Record<string, string> = {
  ADMIN: '#ef4444',
  FACILITY_MANAGER: '#3b82f6',
  SECURITY: '#f59e0b',
  USER: '#10b981',
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  FACILITY_MANAGER: 'Facility Manager',
  SECURITY: 'Security Officer',
  USER: 'Student/Faculty',
};

export default function Navbar() {
  const { user, logout, wsConnected, liveAlerts } = useCampusStore();
  const navigate = useNavigate();
  const { data: alerts } = useAlerts({ resolved: false });
  const unresolved = alerts?.filter((a: any) => !a.isResolved)?.length || liveAlerts.filter(a => !a.isResolved).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColor = roleColors[user?.role || 'USER'];

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59,130,246,0.4)'
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              SmartCampus
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              AUTOMATION SYSTEM
            </div>
          </div>
        </div>
      </div>

      {/* WS Status */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <><Wifi size={12} color="var(--accent-green)" /><span style={{ fontSize: 11, color: 'var(--accent-green)' }}>Live Connected</span></>
          ) : (
            <><WifiOff size={12} color="var(--accent-red)" /><span style={{ fontSize: 11, color: 'var(--accent-red)' }}>Reconnecting...</span></>
          )}
          {wsConnected && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', marginLeft: 'auto', animation: 'pulse-critical 2s infinite' }} />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '12px 8px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none',
              fontSize: 14, fontWeight: 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              transition: 'all 0.15s ease',
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} color={isActive ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                <span>{label}</span>
                {label === 'Alerts' && unresolved > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--accent-red)', color: '#fff',
                    borderRadius: 99, fontSize: 10, fontWeight: 700,
                    padding: '1px 6px', minWidth: 18, textAlign: 'center',
                  }}>{unresolved}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* User Profile */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `${roleColor}22`, border: `1px solid ${roleColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Shield size={14} color={roleColor} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName || 'Unknown'}
            </div>
            <div style={{ fontSize: 10, color: roleColor, fontWeight: 600, letterSpacing: '0.5px' }}>
              {roleLabels[user?.role || 'USER']}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm w-full" onClick={handleLogout} style={{ justifyContent: 'center' }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </nav>
  );
}
