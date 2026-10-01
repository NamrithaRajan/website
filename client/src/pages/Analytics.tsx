import React from 'react';
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
