import React from 'react';
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
