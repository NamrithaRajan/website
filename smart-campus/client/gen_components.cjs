'use strict';
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src');
const files = {};

// ─── components/Navbar.tsx ────────────────────────────────────────────────────
files['components/Navbar.tsx'] = `import React from 'react';
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
            background: \`\${roleColor}22\`, border: \`1px solid \${roleColor}44\`,
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
`;

// ─── components/ZoneCard.tsx ──────────────────────────────────────────────────
files['components/ZoneCard.tsx'] = `import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Users, Wind, Zap, Activity, AlertTriangle, MapPin } from 'lucide-react';

interface Props {
  zone: any;
}

const zoneTypeColors: Record<string, string> = {
  ACADEMIC: '#3b82f6',
  LAB: '#8b5cf6',
  HOSTEL: '#10b981',
  COMMON_AREA: '#f59e0b',
};

const zoneTypeIcons: Record<string, React.ReactNode> = {
  ACADEMIC: <MapPin size={12} />,
  LAB: <Activity size={12} />,
  HOSTEL: <Users size={12} />,
  COMMON_AREA: <Zap size={12} />,
};

function getStatusColor(value: number, warn: number, danger: number) {
  if (value >= danger) return 'var(--accent-red)';
  if (value >= warn) return 'var(--accent-yellow)';
  return 'var(--accent-green)';
}

export default function ZoneCard({ zone }: Props) {
  const navigate = useNavigate();
  const t = zone.latestTelemetry;
  const color = zoneTypeColors[zone.type] || '#3b82f6';
  const activeDevices = zone.devices?.filter((d: any) => d.status === 'ON').length || 0;
  const totalDevices = zone.devices?.length || 0;
  const co2Color = t ? getStatusColor(t.co2Level, 800, 1200) : 'var(--text-muted)';
  const occupancyPct = t ? Math.round((t.occupancyCount / zone.maxCapacity) * 100) : 0;

  return (
    <div
      className="card glass-hover"
      onClick={() => navigate(\`/zones/\${zone.id}\`)}
      style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: \`linear-gradient(90deg, transparent, \${color}, transparent)\` }} />

      {/* Header */}
      <div className="flex justify-between items-start" style={{ marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', marginBottom: 3 }}>
            {zone.name}
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <MapPin size={10} /> {zone.building} · Floor {zone.floor}
          </div>
        </div>
        <span className="badge" style={{ background: \`\${color}1a\`, color, border: \`1px solid \${color}33\`, fontSize: 10, marginLeft: 8, flexShrink: 0 }}>
          {zoneTypeIcons[zone.type]}
          <span style={{ marginLeft: 3 }}>{zone.type.replace('_', ' ')}</span>
        </span>
      </div>

      {/* Telemetry grid */}
      {t ? (
        <div className="grid-2" style={{ gap: 10, marginBottom: 14 }}>
          <div className="stat-card" style={{ padding: '10px 12px', background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-1" style={{ marginBottom: 3 }}>
              <Thermometer size={12} color="var(--accent-orange)" />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Temperature</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: t.temperature > 35 ? 'var(--accent-red)' : t.temperature > 28 ? 'var(--accent-yellow)' : 'var(--accent-cyan)' }}>
              {t.temperature.toFixed(1)}°C
            </div>
          </div>
          <div className="stat-card" style={{ padding: '10px 12px', background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-1" style={{ marginBottom: 3 }}>
              <Wind size={12} color={co2Color} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>CO₂</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: co2Color }}>
              {Math.round(t.co2Level)} ppm
            </div>
          </div>
          <div className="stat-card" style={{ padding: '10px 12px', background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-1" style={{ marginBottom: 3 }}>
              <Users size={12} color="var(--accent-blue)" />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Occupancy</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-blue)' }}>
              {t.occupancyCount}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/{zone.maxCapacity}</span>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '10px 12px', background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-1" style={{ marginBottom: 3 }}>
              <Zap size={12} color="var(--accent-yellow)" />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Power</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-yellow)' }}>
              {t.powerDrawKw.toFixed(2)} kW
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: 13 }}>
          Awaiting telemetry...
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeDevices > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }} />
          {activeDevices}/{totalDevices} devices active
        </div>
        {t && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {occupancyPct}% capacity
          </div>
        )}
      </div>

      {/* Occupancy bar */}
      {t && (
        <div style={{ marginTop: 8, height: 3, background: 'var(--bg-secondary)', borderRadius: 3 }}>
          <div style={{ height: '100%', borderRadius: 3, width: \`\${Math.min(100, occupancyPct)}%\`, background: occupancyPct > 80 ? 'var(--accent-red)' : occupancyPct > 60 ? 'var(--accent-yellow)' : 'var(--accent-green)', transition: 'width 0.5s ease' }} />
        </div>
      )}
    </div>
  );
}
`;

// ─── components/TelemetryChart.tsx ────────────────────────────────────────────
files['components/TelemetryChart.tsx'] = `import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { format } from 'date-fns';

interface Props {
  data: any[];
  metrics?: string[];
}

const COLORS: Record<string, string> = {
  temperature: '#f97316',
  co2Level: '#06b6d4',
  powerDrawKw: '#f59e0b',
  occupancyCount: '#3b82f6',
  humidity: '#8b5cf6',
};

const LABELS: Record<string, string> = {
  temperature: 'Temp (°C)',
  co2Level: 'CO₂ (ppm)',
  powerDrawKw: 'Power (kW)',
  occupancyCount: 'Occupancy',
  humidity: 'Humidity (%)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2" style={{ marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{LABELS[entry.name] || entry.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function TelemetryChart({ data, metrics = ['temperature', 'co2Level', 'powerDrawKw'] }: Props) {
  const chartData = data.map(d => ({
    ...d,
    time: format(new Date(d.recordedAt), 'HH:mm:ss'),
  })).slice(-60);

  if (chartData.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        No telemetry data yet...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          {metrics.map(m => (
            <linearGradient key={m} id={\`grad-\${m}\`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[m]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS[m]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,48,80,0.5)" />
        <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{LABELS[value] || value}</span>}
        />
        {metrics.map(m => (
          <Area
            key={m}
            type="monotone"
            dataKey={m}
            stroke={COLORS[m]}
            strokeWidth={2}
            fill={\`url(#grad-\${m})\`}
            dot={false}
            activeDot={{ r: 4, fill: COLORS[m] }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
`;

// ─── components/DeviceControlPanel.tsx ────────────────────────────────────────
files['components/DeviceControlPanel.tsx'] = `import React, { useState } from 'react';
import { Lightbulb, Wind, Plug, DoorOpen, Bell, Clock, Shield } from 'lucide-react';
import { useOverrideDevice, useClearOverride } from '../hooks/useZones';
import { useCampusStore } from '../store/useStore';
import ManualOverrideModal from './ManualOverrideModal';

const DeviceIcons: Record<string, React.ReactNode> = {
  LIGHTING: <Lightbulb size={16} />,
  HVAC: <Wind size={16} />,
  POWER_OUTLET: <Plug size={16} />,
  ACCESS_CONTROL: <DoorOpen size={16} />,
  ALARM: <Bell size={16} />,
};

const StatusColors: Record<string, string> = {
  ON: 'var(--accent-green)',
  OFF: 'var(--text-muted)',
  ECO: 'var(--accent-cyan)',
  MAINTENANCE: 'var(--accent-yellow)',
};

interface Props {
  devices: any[];
  zoneId: string;
}

export default function DeviceControlPanel({ devices, zoneId }: Props) {
  const { user } = useCampusStore();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const overrideMutation = useOverrideDevice();
  const clearMutation = useClearOverride();

  const canOverride = user?.role !== 'USER';

  const handleClearOverride = async (deviceId: string) => {
    await clearMutation.mutateAsync(deviceId);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center gap-3"
            style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              border: \`1px solid \${device.isOverridden ? 'rgba(245,158,11,0.3)' : 'var(--border)'}\`,
              transition: 'all 0.2s',
            }}
          >
            {/* Icon */}
            <div style={{ color: StatusColors[device.status], flexShrink: 0 }}>
              {DeviceIcons[device.type]}
            </div>

            {/* Name & Status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {device.name.split(' - ').slice(-1)[0]}
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                <span className={\`badge badge-\${device.status.toLowerCase()}\`}>{device.status}</span>
                {device.isOverridden && (
                  <span className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--accent-yellow)' }}>
                    <Shield size={9} /> Override active
                  </span>
                )}
              </div>
            </div>

            {/* Power rating */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
              <div>{device.powerRatingWatts}W</div>
              {device.overrideUntil && (
                <div className="flex items-center gap-1" style={{ color: 'var(--accent-yellow)' }}>
                  <Clock size={9} />
                  {new Date(device.overrideUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Controls */}
            {canOverride && (
              <div className="flex gap-2" style={{ flexShrink: 0 }}>
                {device.isOverridden ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleClearOverride(device.id)}
                    disabled={clearMutation.isPending}
                    style={{ fontSize: 11 }}
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedDevice(device)}
                    style={{ fontSize: 11 }}
                  >
                    Override
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedDevice && (
        <ManualOverrideModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onConfirm={async (status, duration, reason) => {
            await overrideMutation.mutateAsync({
              deviceId: selectedDevice.id, status, durationMinutes: duration, reason,
            });
            setSelectedDevice(null);
          }}
          isPending={overrideMutation.isPending}
        />
      )}
    </div>
  );
}
`;

// ─── components/AlertFeed.tsx ─────────────────────────────────────────────────
files['components/AlertFeed.tsx'] = `import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { useCampusStore } from '../store/useStore';
import { resolveAlert } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

const SeverityIcons = {
  CRITICAL: <AlertCircle size={16} color="var(--accent-red)" />,
  HIGH: <AlertTriangle size={16} color="var(--accent-orange)" />,
  MEDIUM: <AlertTriangle size={16} color="var(--accent-yellow)" />,
  LOW: <Info size={16} color="var(--accent-blue)" />,
};

interface Props {
  alerts: any[];
  maxItems?: number;
  onResolve?: (id: string) => void;
}

export default function AlertFeed({ alerts, maxItems = 10, onResolve }: Props) {
  const { user } = useCampusStore();
  const qc = useQueryClient();
  const canResolve = user?.role !== 'USER';

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id);
      qc.invalidateQueries({ queryKey: ['alerts'] });
      onResolve?.(id);
    } catch (e) {
      console.error('Failed to resolve alert');
    }
  };

  const displayed = alerts.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 13 }}>
        <CheckCircle size={24} color="var(--accent-green)" style={{ margin: '0 auto 8px' }} />
        No active alerts
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {displayed.map((alert) => (
        <div
          key={alert.id}
          className="alert-item animate-fade-in"
          style={{
            borderColor: alert.severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' :
              alert.severity === 'HIGH' ? 'rgba(249,115,22,0.3)' :
              alert.severity === 'MEDIUM' ? 'rgba(245,158,11,0.3)' : 'var(--border)',
            opacity: alert.isResolved ? 0.5 : 1,
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            {SeverityIcons[alert.severity as keyof typeof SeverityIcons]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex justify-between items-start">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {alert.title}
              </div>
              <span className={\`badge badge-\${alert.severity?.toLowerCase()}\`} style={{ marginLeft: 8, flexShrink: 0, fontSize: 9 }}>
                {alert.severity}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {alert.message}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              {alert.zoneName || alert.zone_name || 'Campus'} · {new Date(alert.createdAt || alert.created_at).toLocaleTimeString()}
            </div>
          </div>
          {canResolve && !alert.isResolved && !alert.is_resolved && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleResolve(alert.id)}
              style={{ flexShrink: 0, fontSize: 11 }}
            >
              Resolve
            </button>
          )}
          {(alert.isResolved || alert.is_resolved) && (
            <CheckCircle size={14} color="var(--accent-green)" style={{ flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}
`;

// ─── components/EnergyKPIWidget.tsx ──────────────────────────────────────────
files['components/EnergyKPIWidget.tsx'] = `import React from 'react';
import { Zap, Leaf, DollarSign, Brain, TrendingUp, AlertTriangle, Server, Activity } from 'lucide-react';

interface Props {
  analytics: any;
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  colorClass: string;
  trend?: string;
}

function KPICard({ icon, label, value, unit, color, colorClass, trend }: KPICardProps) {
  return (
    <div className={\`stat-card \${colorClass}\`}>
      <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: \`\${color}1a\`, border: \`1px solid \${color}33\`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{ fontSize: 11, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <TrendingUp size={11} /> {trend}
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
        {label}
      </div>
    </div>
  );
}

export default function EnergyKPIWidget({ analytics }: Props) {
  if (!analytics) {
    return (
      <div className="grid-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="stat-card" style={{ height: 100, background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%)' }} />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      icon: <Zap size={18} />, label: 'Total Power Draw', value: analytics.totalPowerDrawKw?.toFixed(2),
      unit: 'kW', color: '#f59e0b', colorClass: 'yellow', trend: undefined,
    },
    {
      icon: <Activity size={18} />, label: 'Peak Load', value: analytics.peakLoadKw?.toFixed(2),
      unit: 'kW', color: '#f97316', colorClass: 'yellow', trend: undefined,
    },
    {
      icon: <Leaf size={18} />, label: 'CO₂ Reduced', value: analytics.co2ReducedKg?.toFixed(1),
      unit: 'kg', color: '#10b981', colorClass: 'green', trend: 'Saved today',
    },
    {
      icon: <DollarSign size={18} />, label: 'Monthly Savings', value: \`$\${analytics.monthlyCostSavings?.toFixed(0)}\`,
      unit: '', color: '#10b981', colorClass: 'green', trend: 'vs. baseline',
    },
    {
      icon: <Brain size={18} />, label: 'AI Efficiency Index', value: analytics.aiEfficiencyIndex?.toFixed(1),
      unit: '%', color: '#8b5cf6', colorClass: 'purple', trend: undefined,
    },
    {
      icon: <Server size={18} />, label: 'Active Devices', value: analytics.activeDevices,
      unit: '', color: '#3b82f6', colorClass: '', trend: \`of \${analytics.totalZones * 5} total\`,
    },
  ];

  return (
    <div className="grid-3" style={{ gap: 16 }}>
      {kpis.map((kpi, i) => (
        <KPICard key={i} {...kpi} />
      ))}
    </div>
  );
}
`;

// ─── components/ManualOverrideModal.tsx ───────────────────────────────────────
files['components/ManualOverrideModal.tsx'] = `import React, { useState } from 'react';
import { X, Shield, Clock, Zap } from 'lucide-react';

interface Props {
  device: any;
  onClose: () => void;
  onConfirm: (status: string, duration: number, reason: string) => Promise<void>;
  isPending: boolean;
}

export default function ManualOverrideModal({ device, onClose, onConfirm, isPending }: Props) {
  const [status, setStatus] = useState('ON');
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters.');
      return;
    }
    if (duration < 1 || duration > 480) {
      setError('Duration must be between 1 and 480 minutes.');
      return;
    }
    setError('');
    await onConfirm(status, duration, reason);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="var(--accent-yellow)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Manual Override</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{device.name.split(' - ').slice(-1)[0]}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Status Select */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Target Status
            </label>
            <div className="flex gap-2">
              {['ON', 'OFF', 'ECO'].map(s => (
                <button
                  key={s}
                  type="button"
                  className="btn"
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1, justifyContent: 'center', fontSize: 13,
                    background: status === s ? (s === 'ON' ? 'var(--accent-green)' : s === 'OFF' ? 'rgba(71,85,105,0.4)' : 'var(--accent-cyan)') : 'var(--bg-secondary)',
                    border: \`1px solid \${status === s ? 'transparent' : 'var(--border)'}\`,
                    color: status === s ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Duration (minutes)
            </label>
            <div className="flex items-center gap-2">
              <Clock size={14} color="var(--text-muted)" />
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 1)}
                min={1} max={480}
                className="w-full"
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>= {(duration / 60).toFixed(1)}h</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[15, 30, 60, 120].map(m => (
                <button key={m} type="button" className="btn btn-ghost btn-sm" onClick={() => setDuration(m)} style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '4px 0' }}>
                  {m < 60 ? \`\${m}m\` : \`\${m/60}h\`}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Enter reason for override (min. 5 characters)..."
              rows={3}
              className="w-full"
              style={{ resize: 'none' }}
              minLength={5}
              maxLength={255}
            />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: 'right' }}>{reason.length}/255</div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: 'var(--accent-red)', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" className="btn btn-ghost w-full" onClick={onClose} style={{ justifyContent: 'center' }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isPending}
              style={{ justifyContent: 'center', background: 'rgba(245,158,11,0.9)' }}
            >
              {isPending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Processing...</> : <><Shield size={14} /> Apply Override</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

// Write all component files
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(base, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Written:', relPath);
});

console.log('\n✅ All component files written!');