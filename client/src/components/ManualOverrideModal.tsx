import React, { useState } from 'react';
import { X, Shield, Clock, Zap } from 'lucide-react';

interface Props {
  device: any;
  onClose: () => void;
  onConfirm: (status: string, duration: number, reason: string) => Promise<void>;
  isPending: boolean;
}

export default function ManualOverrideModal({ device, onClose, onConfirm, isPending }: Props) {
  const [status, setStatus] = useState('ON');
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters.');
      return;
    }
    if (duration < 1 || duration > 480) {
      setError('Duration must be between 1 and 480 minutes.');
      return;
    }
    setError('');
    await onConfirm(status, duration, reason);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="var(--accent-yellow)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Manual Override</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{device.name.split(' - ').slice(-1)[0]}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Status Select */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Target Status
            </label>
            <div className="flex gap-2">
              {['ON', 'OFF', 'ECO'].map(s => (
                <button
                  key={s}
                  type="button"
                  className="btn"
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1, justifyContent: 'center', fontSize: 13,
                    background: status === s ? (s === 'ON' ? 'var(--accent-green)' : s === 'OFF' ? 'rgba(71,85,105,0.4)' : 'var(--accent-cyan)') : 'var(--bg-secondary)',
                    border: `1px solid ${status === s ? 'transparent' : 'var(--border)'}`,
                    color: status === s ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Duration (minutes)
            </label>
            <div className="flex items-center gap-2">
              <Clock size={14} color="var(--text-muted)" />
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 1)}
                min={1} max={480}
                className="w-full"
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>= {(duration / 60).toFixed(1)}h</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[15, 30, 60, 120].map(m => (
                <button key={m} type="button" className="btn btn-ghost btn-sm" onClick={() => setDuration(m)} style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '4px 0' }}>
                  {m < 60 ? `${m}m` : `${m/60}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Enter reason for override (min. 5 characters)..."
              rows={3}
              className="w-full"
              style={{ resize: 'none' }}
              minLength={5}
              maxLength={255}
            />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: 'right' }}>{reason.length}/255</div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: 'var(--accent-red)', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" className="btn btn-ghost w-full" onClick={onClose} style={{ justifyContent: 'center' }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isPending}
              style={{ justifyContent: 'center', background: 'rgba(245,158,11,0.9)' }}
            >
              {isPending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Processing...</> : <><Shield size={14} /> Apply Override</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
