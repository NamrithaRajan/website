import React from 'react';
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
