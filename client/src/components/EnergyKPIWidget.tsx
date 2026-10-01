import React from 'react';
import { Zap, Leaf, IndianRupee, Brain, TrendingUp, AlertTriangle, Server, Activity } from 'lucide-react';

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
    <div className={`stat-card ${colorClass}`}>
      <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}1a`, border: `1px solid ${color}33`,
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
      icon: <IndianRupee size={18} />, label: 'Monthly Savings', value: `₹${analytics.monthlyCostSavings?.toFixed(0)}`,
      unit: '', color: '#10b981', colorClass: 'green', trend: 'vs. baseline',
    },
    {
      icon: <Brain size={18} />, label: 'AI Efficiency Index', value: analytics.aiEfficiencyIndex?.toFixed(1),
      unit: '%', color: '#8b5cf6', colorClass: 'purple', trend: undefined,
    },
    {
      icon: <Server size={18} />, label: 'Active Devices', value: analytics.activeDevices,
      unit: '', color: '#3b82f6', colorClass: '', trend: `of ${analytics.totalZones * 5} total`,
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
