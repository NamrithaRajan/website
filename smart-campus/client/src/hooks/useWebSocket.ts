import { useEffect, useRef } from 'react';
import { useCampusStore } from '../store/useStore';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { setWsConnected, addLiveAlert } = useCampusStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log('[WS] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'TELEMETRY_UPDATE':
              queryClient.invalidateQueries({ queryKey: ['zones'] });
              break;
            case 'DEVICE_UPDATE':
              queryClient.invalidateQueries({ queryKey: ['zones'] });
              queryClient.invalidateQueries({ queryKey: ['zone', msg.payload?.zoneId] });
              break;
            case 'ALERT_CREATED':
              addLiveAlert({
                id: msg.payload.id,
                zoneId: msg.payload.zone_id,
                zoneName: msg.payload.zone_name,
                title: msg.payload.title,
                message: msg.payload.message,
                severity: msg.payload.severity,
                isResolved: false,
                createdAt: msg.payload.created_at,
              });
              queryClient.invalidateQueries({ queryKey: ['alerts'] });
              break;
            case 'ALERT_RESOLVED':
              queryClient.invalidateQueries({ queryKey: ['alerts'] });
              break;
            case 'AI_ACTION':
              queryClient.invalidateQueries({ queryKey: ['zones'] });
              queryClient.invalidateQueries({ queryKey: ['analytics'] });
              break;
          }
        } catch (e) {
          console.error('[WS] Parse error', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('[WS] Disconnected, reconnecting in 3s...');
        setTimeout(connect, 3000);
      };

      ws.onerror = (e) => {
        console.error('[WS] Error', e);
        ws.close();
      };
    }

    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return wsRef;
}
