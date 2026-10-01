import React from 'react';
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
