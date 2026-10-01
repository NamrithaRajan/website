import React from 'react';
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
