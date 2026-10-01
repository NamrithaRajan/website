import React from 'react';
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
            <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
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
            fill={`url(#grad-${m})`}
            dot={false}
            activeDot={{ r: 4, fill: COLORS[m] }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
