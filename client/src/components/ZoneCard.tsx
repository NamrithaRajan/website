import React from 'react';
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
      onClick={() => navigate(`/zones/${zone.id}`)}
      style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

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
        <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}33`, fontSize: 10, marginLeft: 8, flexShrink: 0 }}>
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
          <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, occupancyPct)}%`, background: occupancyPct > 80 ? 'var(--accent-red)' : occupancyPct > 60 ? 'var(--accent-yellow)' : 'var(--accent-green)', transition: 'width 0.5s ease' }} />
        </div>
      )}
    </div>
  );
}
