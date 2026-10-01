'use strict';
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src');
const files = {};

// ─── pages/Login.tsx ──────────────────────────────────────────────────────────
files['pages/Login.tsx'] = `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, ChevronRight, Shield } from 'lucide-react';
import { login } from '../lib/api';
import { useCampusStore } from '../store/useStore';

const DEMO_ACCOUNTS = [
  { email: 'admin@campus.edu', role: 'Administrator', color: '#ef4444' },
  { email: 'facility@campus.edu', role: 'Facility Manager', color: '#3b82f6' },
  { email: 'security@campus.edu', role: 'Security Officer', color: '#f59e0b' },
  { email: 'student@campus.edu', role: 'Student/Faculty', color: '#10b981' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@campus.edu');
  const [password, setPassword] = useState('campus123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useCampusStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(139,92,246,0.05) 0%, transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: 24, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(59,130,246,0.3)',
          }}>
            <Activity size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            SmartCampus
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '1px' }}>
            AUTOMATION CONTROL CENTER
          </p>
        </div>

        {/* Login Form */}
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full" style={{ paddingLeft: 36 }}
                  placeholder="you@campus.edu" required
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full" style={{ paddingLeft: 36 }}
                  placeholder="••••••••" required minLength={6}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--accent-red)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ justifyContent: 'center', padding: '12px 20px', fontSize: 15, fontWeight: 600 }}
            >
              {loading ? <><div className="spinner" /> Authenticating...</> : <>Sign In <ChevronRight size={16} /></>}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Login Demo Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                className="btn btn-ghost btn-sm"
                onClick={() => { setEmail(acc.email); setPassword('campus123'); }}
                style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
              >
                <Shield size={12} color={acc.color} />
                <span style={{ fontSize: 11 }}>{acc.role}</span>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: 'var(--text-muted)' }}>
            All demo accounts use password: <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>campus123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// ─── pages/Dashboard.tsx ──────────────────────────────────────────────────────
files['pages/Dashboard.tsx'] = `import React from 'react';
import { Activity, Zap, Users, AlertTriangle, Brain, MapPin } from 'lucide-react';
import { useZones } from '../hooks/useZones';
import { useEnergyAnalytics, useAlerts } from '../hooks/useTelemetry';
import { useCampusStore } from '../store/useStore';
import EnergyKPIWidget from '../components/EnergyKPIWidget';
import AlertFeed from '../components/AlertFeed';
import ZoneCard from '../components/ZoneCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

export default function Dashboard() {
  const { data: zones } = useZones();
  const { data: analytics } = useEnergyAnalytics();
  const { data: alerts } = useAlerts();
  const { liveAlerts } = useCampusStore();

  const totalOccupancy = zones?.reduce((sum: number, z: any) => sum + (z.latestTelemetry?.occupancyCount || 0), 0) || 0;
  const totalCapacity = zones?.reduce((sum: number, z: any) => sum + z.maxCapacity, 0) || 0;
  const activeAlerts = (alerts || liveAlerts).filter((a: any) => !a.isResolved && !a.is_resolved);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-primary)' }}>Campus </span>
          <span className="glow-text-blue">Dashboard</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Real-time operational overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <EnergyKPIWidget analytics={analytics} />

      {/* Quick Stats Row */}
      <div className="grid-3" style={{ gap: 16, marginTop: 20, marginBottom: 20 }}>
        <div className="stat-card cyan">
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <Users size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campus Occupancy</span>
          </div>
          <div className="metric-value glow-text-cyan">{totalOccupancy}</div>
          <div className="metric-label">of {totalCapacity} total capacity</div>
          <div style={{ marginTop: 8, height: 4, background: 'var(--bg-secondary)', borderRadius: 4 }}>
            <div style={{ height: '100%', borderRadius: 4, background: 'var(--accent-cyan)', width: totalCapacity > 0 ? (totalOccupancy / totalCapacity * 100) + '%' : '0%', transition: 'width 0.5s' }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <MapPin size={16} color="var(--accent-blue)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Zones</span>
          </div>
          <div className="metric-value glow-text-blue">{zones?.length || 0}</div>
          <div className="metric-label">campus zones monitored</div>
        </div>
        <div className={"stat-card " + (activeAlerts.length > 0 ? 'red' : 'green')}>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <AlertTriangle size={16} color={activeAlerts.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Alerts</span>
          </div>
          <div className={"metric-value " + (activeAlerts.length > 0 ? 'glow-text-red' : 'glow-text-green')}>
            {activeAlerts.length}
          </div>
          <div className="metric-label">{activeAlerts.length === 0 ? 'all systems normal' : 'requires attention'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Zone Power Breakdown Chart */}
        <div className="card">
          <h3 className="section-title"><Zap size={16} color="var(--accent-yellow)" /> Zone Power Distribution</h3>
          {analytics?.zoneBreakdown && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.zoneBreakdown.slice(0, 8)} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,48,80,0.4)" />
                <XAxis
                  dataKey="zoneName" tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                  tickLine={false} interval={0} angle={-20} textAnchor="end" height={60}
                />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [v.toFixed(2) + ' kW', 'Power']}
                />
                <Bar dataKey="powerKw" radius={[4, 4, 0, 0]}>
                  {analytics.zoneBreakdown.slice(0, 8).map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alert Feed */}
        <div className="card" style={{ maxHeight: 380, overflow: 'auto' }}>
          <h3 className="section-title"><AlertTriangle size={16} color="var(--accent-red)" /> Live Alert Feed</h3>
          <AlertFeed alerts={activeAlerts.length > 0 ? activeAlerts : liveAlerts} maxItems={8} />
        </div>
      </div>

      {/* Quick Zone Grid */}
      <div style={{ marginTop: 24 }}>
        <h3 className="section-title"><MapPin size={16} color="var(--accent-blue)" /> Zone Overview</h3>
        <div className="grid-4">
          {zones?.slice(0, 8).map((zone: any) => (
            <ZoneCard key={zone.id} zone={zone} />
          ))}
        </div>
      </div>
    </div>
  );
}
`;

// ─── pages/Zones.tsx ──────────────────────────────────────────────────────────
files['pages/Zones.tsx'] = `import React from 'react';
import { MapPin, Filter, Search } from 'lucide-react';
import { useZones } from '../hooks/useZones';
import { useCampusStore } from '../store/useStore';
import ZoneCard from '../components/ZoneCard';

const ZONE_TYPES = ['ALL', 'ACADEMIC', 'LAB', 'HOSTEL', 'COMMON_AREA'];

export default function Zones() {
  const { data: zones, isLoading } = useZones();
  const { zoneFilter, setZoneFilter } = useCampusStore();
  const [search, setSearch] = React.useState('');

  const filtered = zones?.filter((z: any) => {
    const matchType = zoneFilter === 'ALL' || z.type === zoneFilter;
    const matchSearch = search === '' || z.name.toLowerCase().includes(search.toLowerCase()) || z.building.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  }) || [];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-primary)' }}>Campus </span>
            <span className="glow-text-blue">Zones</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Interactive map of all monitored campus areas
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search zones..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full" style={{ paddingLeft: 36 }}
          />
        </div>
        <div className="flex gap-2">
          {ZONE_TYPES.map(t => (
            <button
              key={t}
              className={"btn btn-sm " + (zoneFilter === t ? 'btn-primary' : 'btn-ghost')}
              onClick={() => setZoneFilter(t)}
            >
              {t === 'ALL' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Zone Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading campus zones...</div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((zone: any) => (
            <ZoneCard key={zone.id} zone={zone} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div style={{ fontSize: 15, fontWeight: 500 }}>No zones match your filters</div>
        </div>
      )}
    </div>
  );
}
`;

// ─── pages/ZoneDetails.tsx ────────────────────────────────────────────────────
files['pages/ZoneDetails.tsx'] = `import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, MapPin, Thermometer, Users, Wind, Zap, Droplets, Sun } from 'lucide-react';
import { useZone, useZoneTelemetry, useEvaluateZone } from '../hooks/useZones';
import TelemetryChart from '../components/TelemetryChart';
import DeviceControlPanel from '../components/DeviceControlPanel';
import { useCampusStore } from '../store/useStore';

export default function ZoneDetails() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const { data: zone, isLoading } = useZone(zoneId || '');
  const { data: telemetry } = useZoneTelemetry(zoneId || '', 100);
  const evaluateMutation = useEvaluateZone();
  const { user } = useCampusStore();

  const canEvaluate = user?.role === 'ADMIN' || user?.role === 'FACILITY_MANAGER';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (!zone) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 16 }}>Zone not found</div>
        <button className="btn btn-ghost mt-3" onClick={() => navigate('/zones')}>Back to Zones</button>
      </div>
    );
  }

  const t = zone.latestTelemetry;

  const sensorCards = t ? [
    { icon: <Thermometer size={18} />, label: 'Temperature', value: t.temperature?.toFixed(1) + '°C', color: t.temperature > 35 ? 'var(--accent-red)' : 'var(--accent-orange)' },
    { icon: <Users size={18} />, label: 'Occupancy', value: t.occupancyCount + ' / ' + zone.maxCapacity, color: 'var(--accent-blue)' },
    { icon: <Wind size={18} />, label: 'CO₂ Level', value: Math.round(t.co2Level) + ' ppm', color: t.co2Level > 1000 ? 'var(--accent-red)' : 'var(--accent-cyan)' },
    { icon: <Zap size={18} />, label: 'Power Draw', value: t.powerDrawKw?.toFixed(2) + ' kW', color: 'var(--accent-yellow)' },
    { icon: <Droplets size={18} />, label: 'Humidity', value: t.humidity?.toFixed(1) + '%', color: 'var(--accent-purple)' },
    { icon: <Sun size={18} />, label: 'Ambient Light', value: Math.round(t.ambientLux) + ' lux', color: 'var(--accent-green)' },
  ] : [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/zones')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{zone.name}</h1>
          <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            <MapPin size={12} /> {zone.building} · Floor {zone.floor} · {zone.type.replace('_', ' ')}
          </div>
        </div>
        {canEvaluate && (
          <button
            className="btn btn-primary"
            onClick={() => evaluateMutation.mutate(zone.id)}
            disabled={evaluateMutation.isPending}
          >
            {evaluateMutation.isPending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Evaluating...</> : <><Brain size={14} /> AI Evaluate</>}
          </button>
        )}
      </div>

      {/* Sensor Readings Grid */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {sensorCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '16px 18px' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Telemetry Charts */}
        <div className="card">
          <h3 className="section-title"><Zap size={16} color="var(--accent-yellow)" /> Live Telemetry</h3>
          <TelemetryChart data={telemetry || []} metrics={['temperature', 'co2Level', 'powerDrawKw']} />
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Occupancy & Humidity</h4>
            <TelemetryChart data={telemetry || []} metrics={['occupancyCount', 'humidity']} />
          </div>
        </div>

        {/* Device Control Panel */}
        <div className="card">
          <h3 className="section-title"><Zap size={16} color="var(--accent-green)" /> Device Controls</h3>
          <DeviceControlPanel devices={zone.devices || []} zoneId={zone.id} />
        </div>
      </div>
    </div>
  );
}
`;

// ─── pages/Schedules.tsx ──────────────────────────────────────────────────────
files['pages/Schedules.tsx'] = `import React from 'react';
import { Calendar, Clock, MapPin, Zap } from 'lucide-react';

const SCHEDULES = [
  { zone: 'Academic Block A - Room 101', event: 'CS101 Lecture', days: 'Mon–Fri', time: '09:00 – 11:00', status: 'active', type: 'ACADEMIC' },
  { zone: 'Computer Lab 102', event: 'Web Dev Lab', days: 'Mon, Wed, Fri', time: '14:00 – 17:00', status: 'active', type: 'LAB' },
  { zone: 'Central Library', event: 'Library Hours', days: 'Mon–Sat', time: '08:00 – 22:00', status: 'active', type: 'COMMON_AREA' },
  { zone: 'Lecture Hall - Auditorium', event: 'Guest Lecture', days: 'Thu', time: '10:00 – 12:00', status: 'scheduled', type: 'ACADEMIC' },
  { zone: 'Electronics Lab 201', event: 'Circuit Design Lab', days: 'Tue, Thu', time: '14:00 – 16:00', status: 'scheduled', type: 'LAB' },
  { zone: 'Hostel B - Common Room', event: 'Open Access', days: 'Daily', time: '06:00 – 23:00', status: 'active', type: 'HOSTEL' },
  { zone: 'Sports Complex', event: 'Training Session', days: 'Mon–Fri', time: '06:00 – 08:00', status: 'scheduled', type: 'COMMON_AREA' },
];

const POWER_RULES = [
  { name: 'Unoccupied Timeout', description: 'Lights and non-critical outlets off after 15 min vacancy', value: '15 min', enabled: true },
  { name: 'Off-Hours Lockdown', description: 'All non-emergency systems off 22:00 – 06:00', value: '22:00–06:00', enabled: true },
  { name: 'ECO Mode Threshold', description: 'HVAC switches to ECO when occupancy below 20%', value: '20%', enabled: true },
  { name: 'Peak Demand Shedding', description: 'Reduce non-essential load when campus exceeds 80% capacity', value: '80%', enabled: false },
];

const typeColors: Record<string, string> = { ACADEMIC: '#3b82f6', LAB: '#8b5cf6', HOSTEL: '#10b981', COMMON_AREA: '#f59e0b' };

export default function Schedules() {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-primary)' }}>Schedule & </span>
          <span className="glow-text-cyan">Power Rules</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Timetable synchronization and automated power rule management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Schedule Table */}
        <div className="card">
          <h3 className="section-title"><Calendar size={16} color="var(--accent-cyan)" /> Active Schedules</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Zone', 'Event', 'Days', 'Time', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEDULES.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: typeColors[s.type] || 'var(--text-muted)' }} />
                        <span className="truncate" style={{ maxWidth: 180 }}>{s.zone}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{s.event}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)' }}>{s.days}</td>
                    <td style={{ padding: '12px', fontSize: 12 }} className="font-mono">{s.time}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={"badge " + (s.status === 'active' ? 'badge-on' : 'badge-eco')}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Power Rules */}
        <div className="card">
          <h3 className="section-title"><Zap size={16} color="var(--accent-yellow)" /> Power Rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {POWER_RULES.map((rule, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{rule.name}</span>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={rule.enabled} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{rule.description}</div>
                <div className="flex items-center gap-1" style={{ fontSize: 11 }}>
                  <Clock size={10} color="var(--accent-cyan)" />
                  <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{rule.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// ─── pages/Analytics.tsx ──────────────────────────────────────────────────────
files['pages/Analytics.tsx'] = `import React from 'react';
import { BarChart3, TrendingUp, Leaf, DollarSign } from 'lucide-react';
import { useEnergyAnalytics } from '../hooks/useTelemetry';
import EnergyKPIWidget from '../components/EnergyKPIWidget';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

export default function Analytics() {
  const { data: analytics, isLoading } = useEnergyAnalytics();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-primary)' }}>Energy </span>
          <span className="glow-text-green">Analytics</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Historical consumption, cost savings, and carbon footprint analysis</p>
      </div>

      <EnergyKPIWidget analytics={analytics} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        {/* Hourly Power Trend */}
        <div className="card">
          <h3 className="section-title"><TrendingUp size={16} color="var(--accent-yellow)" /> Hourly Power Trend</h3>
          {analytics?.hourlyData && (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics.hourlyData}>
                <defs>
                  <linearGradient id="gradPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,48,80,0.4)" />
                <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={2} fill="url(#gradPower)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Zone Power Breakdown */}
        <div className="card">
          <h3 className="section-title"><BarChart3 size={16} color="var(--accent-blue)" /> Zone Power Breakdown</h3>
          {analytics?.zoneBreakdown && (
            <div>
              {analytics.zoneBreakdown.map((zone: any, i: number) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{zone.zoneName}</span>
                    <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{zone.powerKw.toFixed(2)} kW</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3 }}>
                    <div style={{ height: '100%', borderRadius: 3, width: zone.percentage + '%', background: COLORS[i % COLORS.length], transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{zone.percentage}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carbon Footprint Summary */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="section-title"><Leaf size={16} color="var(--accent-green)" /> Carbon Footprint Report</h3>
        <div className="grid-3">
          <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <Leaf size={24} color="var(--accent-green)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>{analytics?.co2ReducedKg?.toFixed(1) || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>kg CO₂ Reduced Today</div>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <DollarSign size={24} color="var(--accent-green)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>{'$'}{analytics?.monthlyCostSavings?.toFixed(0) || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Monthly Cost Savings</div>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <TrendingUp size={24} color="var(--accent-purple)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-purple)' }}>{analytics?.aiEfficiencyIndex?.toFixed(1) || 0}%</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>AI Efficiency Index</div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// ─── pages/Alerts.tsx ─────────────────────────────────────────────────────────
files['pages/Alerts.tsx'] = `import React, { useState } from 'react';
import { Bell, Filter, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useAlerts } from '../hooks/useTelemetry';
import { useZones } from '../hooks/useZones';
import { useCampusStore } from '../store/useStore';
import AlertFeed from '../components/AlertFeed';
import { emergencyShutdown } from '../lib/api';

export default function Alerts() {
  const [showResolved, setShowResolved] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const { data: alerts, isLoading } = useAlerts();
  const { data: zones } = useZones();
  const { user, liveAlerts } = useCampusStore();
  const [shutdownZone, setShutdownZone] = useState('');
  const [shutdownLoading, setShutdownLoading] = useState(false);

  const canShutdown = user?.role === 'ADMIN' || user?.role === 'SECURITY';

  const allAlerts = alerts || liveAlerts;
  const filtered = allAlerts.filter((a: any) => {
    const resolved = a.isResolved || a.is_resolved;
    if (!showResolved && resolved) return false;
    if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
    return true;
  });

  const handleShutdown = async () => {
    if (!shutdownZone || shutdownLoading) return;
    setShutdownLoading(true);
    try {
      await emergencyShutdown(shutdownZone);
      setShutdownZone('');
    } catch (e) { console.error(e); }
    setShutdownLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-start" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-primary)' }}>Incident </span>
            <span className="glow-text-red">Alerts</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Security & safety incident response triage</p>
        </div>
        {canShutdown && (
          <div className="flex items-center gap-2">
            <select value={shutdownZone} onChange={e => setShutdownZone(e.target.value)} style={{ minWidth: 200 }}>
              <option value="">Select zone...</option>
              {zones?.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <button className="btn btn-danger" onClick={handleShutdown} disabled={!shutdownZone || shutdownLoading}>
              <ShieldAlert size={14} /> Emergency Shutdown
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <button className={"btn btn-sm " + (!showResolved ? 'btn-primary' : 'btn-ghost')} onClick={() => setShowResolved(false)}>Active</button>
        <button className={"btn btn-sm " + (showResolved ? 'btn-primary' : 'btn-ghost')} onClick={() => setShowResolved(true)}>All</button>
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
          <button key={s} className={"btn btn-sm " + (selectedSeverity === s ? 'btn-primary' : 'btn-ghost')} onClick={() => setSelectedSeverity(s)} style={{ fontSize: 11 }}>
            {s === 'ALL' ? 'All' : s}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} alerts</span>
      </div>

      {/* Alert List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <AlertFeed alerts={filtered} maxItems={50} />
      )}
    </div>
  );
}
`;

// ─── pages/Settings.tsx ───────────────────────────────────────────────────────
files['pages/Settings.tsx'] = `import React from 'react';
import { Settings as SettingsIcon, Thermometer, Clock, AlertTriangle, Brain, Shield } from 'lucide-react';
import { useCampusStore } from '../store/useStore';

const THRESHOLD_CONFIGS = [
  { label: 'Target Temperature (Occupied)', value: '22°C – 26°C', icon: <Thermometer size={16} color="var(--accent-orange)" /> },
  { label: 'ECO Mode Temperature', value: '28°C', icon: <Thermometer size={16} color="var(--accent-cyan)" /> },
  { label: 'Unoccupied Delay Timeout', value: '15 minutes', icon: <Clock size={16} color="var(--accent-blue)" /> },
  { label: 'Off-Hour Schedule', value: '22:00 – 06:00', icon: <Clock size={16} color="var(--accent-purple)" /> },
  { label: 'CO₂ Warning Threshold', value: '> 1000 ppm', icon: <AlertTriangle size={16} color="var(--accent-yellow)" /> },
  { label: 'CO₂ Critical Threshold', value: '> 1200 ppm', icon: <AlertTriangle size={16} color="var(--accent-red)" /> },
  { label: 'Power Spike Threshold', value: '> 150% nominal', icon: <AlertTriangle size={16} color="var(--accent-orange)" /> },
  { label: 'Fire/Thermal Emergency', value: '> 50°C', icon: <AlertTriangle size={16} color="var(--accent-red)" /> },
];

export default function Settings() {
  const { user } = useCampusStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-primary)' }}>System </span>
          <span className="glow-text-cyan">Settings</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sensor thresholds, AI control modes, and system configuration</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Thresholds */}
        <div className="card">
          <h3 className="section-title"><SettingsIcon size={16} color="var(--accent-cyan)" /> Sensor Thresholds</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {THRESHOLD_CONFIGS.map((cfg, i) => (
              <div key={i} className="flex items-center gap-3" style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ flexShrink: 0 }}>{cfg.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{cfg.label}</div>
                </div>
                <div className="font-mono" style={{ fontSize: 13, color: 'var(--accent-cyan)', flexShrink: 0 }}>{cfg.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Configuration & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="section-title"><Brain size={16} color="var(--accent-purple)" /> AI Control Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'AI Auto-Control', desc: 'Allow AI to autonomously adjust devices', enabled: true },
                { label: 'Aggressive Savings Mode', desc: 'Faster unoccupied timeouts and lower ECO temps', enabled: false },
                { label: 'Anomaly Detection', desc: 'AI monitors for unusual patterns and security risks', enabled: true },
                { label: 'Night Lockdown Mode', desc: 'Full shutdown of non-essential systems at night', enabled: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between" style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={item.enabled} disabled={!isAdmin} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title"><Shield size={16} color="var(--accent-red)" /> Security Info</h3>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <div><strong>Gemini API Key:</strong> <span className="font-mono" style={{ color: 'var(--accent-green)' }}>●●●●●●●● (server-side only)</span></div>
              <div><strong>JWT Expiry:</strong> <span className="font-mono">8 hours</span></div>
              <div><strong>Rate Limit:</strong> <span className="font-mono">100 req / 15 min</span></div>
              <div><strong>CORS:</strong> <span className="font-mono">localhost:5173</span></div>
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: 'var(--accent-green)' }}>
                ✓ API keys are never exposed to the frontend bundle
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// ─── App.tsx ──────────────────────────────────────────────────────────────────
files['App.tsx'] = `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCampusStore } from './store/useStore';
import { useWebSocket } from './hooks/useWebSocket';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Zones from './pages/Zones';
import ZoneDetails from './pages/ZoneDetails';
import Schedules from './pages/Schedules';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedLayout() {
  const { token } = useCampusStore();
  useWebSocket();

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="page-layout">
      <Navbar />
      <div className="main-content">
        <div className="page-body">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/zones" element={<Zones />} />
            <Route path="/zones/:zoneId" element={<ZoneDetails />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
`;

// ─── main.tsx ─────────────────────────────────────────────────────────────────
files['main.tsx'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

// Write all files
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(base, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Written:', relPath);
});

console.log('\n✅ All page files, App.tsx, and main.tsx written!');