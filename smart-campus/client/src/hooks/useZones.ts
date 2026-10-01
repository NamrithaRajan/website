import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchZones, fetchZone, fetchZoneTelemetry, overrideDevice, clearOverride, evaluateZone } from '../lib/api';

export function useZones() {
  return useQuery({ queryKey: ['zones'], queryFn: fetchZones, refetchInterval: 10000 });
}

export function useZone(id: string) {
  return useQuery({ queryKey: ['zone', id], queryFn: () => fetchZone(id), enabled: !!id, refetchInterval: 5000 });
}

export function useZoneTelemetry(id: string, limit = 50) {
  return useQuery({ queryKey: ['telemetry', id], queryFn: () => fetchZoneTelemetry(id, limit), enabled: !!id, refetchInterval: 5000 });
}

export function useOverrideDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: overrideDevice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });
}

export function useClearOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearOverride,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });
}

export function useEvaluateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: evaluateZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
