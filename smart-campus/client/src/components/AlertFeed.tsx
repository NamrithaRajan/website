import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { useCampusStore } from '../store/useStore';
import { resolveAlert } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

const SeverityIcons = {
  CRITICAL: <AlertCircle size={16} color="var(--accent-red)" />,
  HIGH: <AlertTriangle size={16} color="var(--accent-orange)" />,
  MEDIUM: <AlertTriangle size={16} color="var(--accent-yellow)" />,
  LOW: <Info size={16} color="var(--accent-blue)" />,
};

interface Props {
  alerts: any[];
  maxItems?: number;
  onResolve?: (id: string) => void;
}

export default function AlertFeed({ alerts, maxItems = 10, onResolve }: Props) {
  const { user } = useCampusStore();
  const qc = useQueryClient();
  const canResolve = user?.role !== 'USER';

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id);
      qc.invalidateQueries({ queryKey: ['alerts'] });
      onResolve?.(id);
    } catch (e) {
      console.error('Failed to resolve alert');
    }
  };

  const displayed = alerts.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 13 }}>
        <CheckCircle size={24} color="var(--accent-green)" style={{ margin: '0 auto 8px' }} />
        No active alerts
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {displayed.map((alert) => (
        <div
          key={alert.id}
          className="alert-item animate-fade-in"
          style={{
            borderColor: alert.severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' :
              alert.severity === 'HIGH' ? 'rgba(249,115,22,0.3)' :
              alert.severity === 'MEDIUM' ? 'rgba(245,158,11,0.3)' : 'var(--border)',
            opacity: alert.isResolved ? 0.5 : 1,
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            {SeverityIcons[alert.severity as keyof typeof SeverityIcons]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex justify-between items-start">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {alert.title}
              </div>
              <span className={`badge badge-${alert.severity?.toLowerCase()}`} style={{ marginLeft: 8, flexShrink: 0, fontSize: 9 }}>
                {alert.severity}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {alert.message}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              {alert.zoneName || alert.zone_name || 'Campus'} · {new Date(alert.createdAt || alert.created_at).toLocaleTimeString()}
            </div>
          </div>
          {canResolve && !alert.isResolved && !alert.is_resolved && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleResolve(alert.id)}
              style={{ flexShrink: 0, fontSize: 11 }}
            >
              Resolve
            </button>
          )}
          {(alert.isResolved || alert.is_resolved) && (
            <CheckCircle size={14} color="var(--accent-green)" style={{ flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}
