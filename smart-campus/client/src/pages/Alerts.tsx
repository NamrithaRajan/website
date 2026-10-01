import React, { useState } from 'react';
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
