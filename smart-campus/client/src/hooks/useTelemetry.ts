import { useQuery } from '@tanstack/react-query';
import { fetchEnergyAnalytics, fetchAlerts, fetchAuditLogs } from '../lib/api';

export function useEnergyAnalytics() {
  return useQuery({ queryKey: ['analytics'], queryFn: fetchEnergyAnalytics, refetchInterval: 15000 });
}

export function useAlerts(params?: { resolved?: boolean; severity?: string }) {
  return useQuery({ queryKey: ['alerts', params], queryFn: () => fetchAlerts(params), refetchInterval: 10000 });
}

export function useAuditLogs() {
  return useQuery({ queryKey: ['audit-logs'], queryFn: fetchAuditLogs, refetchInterval: 30000 });
}
