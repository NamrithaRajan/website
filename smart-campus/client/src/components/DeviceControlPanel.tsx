import React, { useState } from 'react';
import { Lightbulb, Wind, Plug, DoorOpen, Bell, Clock, Shield } from 'lucide-react';
import { useOverrideDevice, useClearOverride } from '../hooks/useZones';
import { useCampusStore } from '../store/useStore';
import ManualOverrideModal from './ManualOverrideModal';

const DeviceIcons: Record<string, React.ReactNode> = {
  LIGHTING: <Lightbulb size={16} />,
  HVAC: <Wind size={16} />,
  POWER_OUTLET: <Plug size={16} />,
  ACCESS_CONTROL: <DoorOpen size={16} />,
  ALARM: <Bell size={16} />,
};

const StatusColors: Record<string, string> = {
  ON: 'var(--accent-green)',
  OFF: 'var(--text-muted)',
  ECO: 'var(--accent-cyan)',
  MAINTENANCE: 'var(--accent-yellow)',
};

interface Props {
  devices: any[];
  zoneId: string;
}

export default function DeviceControlPanel({ devices, zoneId }: Props) {
  const { user } = useCampusStore();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const overrideMutation = useOverrideDevice();
  const clearMutation = useClearOverride();

  const canOverride = user?.role !== 'USER';

  const handleClearOverride = async (deviceId: string) => {
    await clearMutation.mutateAsync(deviceId);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center gap-3"
            style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              border: `1px solid ${device.isOverridden ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
              transition: 'all 0.2s',
            }}
          >
            {/* Icon */}
            <div style={{ color: StatusColors[device.status], flexShrink: 0 }}>
              {DeviceIcons[device.type]}
            </div>

            {/* Name & Status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {device.name.split(' - ').slice(-1)[0]}
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                <span className={`badge badge-${device.status.toLowerCase()}`}>{device.status}</span>
                {device.isOverridden && (
                  <span className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--accent-yellow)' }}>
                    <Shield size={9} /> Override active
                  </span>
                )}
              </div>
            </div>

            {/* Power rating */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
              <div>{device.powerRatingWatts}W</div>
              {device.overrideUntil && (
                <div className="flex items-center gap-1" style={{ color: 'var(--accent-yellow)' }}>
                  <Clock size={9} />
                  {new Date(device.overrideUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Controls */}
            {canOverride && (
              <div className="flex gap-2" style={{ flexShrink: 0 }}>
                {device.isOverridden ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleClearOverride(device.id)}
                    disabled={clearMutation.isPending}
                    style={{ fontSize: 11 }}
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedDevice(device)}
                    style={{ fontSize: 11 }}
                  >
                    Override
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedDevice && (
        <ManualOverrideModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onConfirm={async (status, duration, reason) => {
            await overrideMutation.mutateAsync({
              deviceId: selectedDevice.id, status, durationMinutes: duration, reason,
            });
            setSelectedDevice(null);
          }}
          isPending={overrideMutation.isPending}
        />
      )}
    </div>
  );
}
