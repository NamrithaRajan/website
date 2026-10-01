import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────
export const UserRoleEnum = z.enum(['ADMIN', 'FACILITY_MANAGER', 'SECURITY', 'USER']);
export const ZoneTypeEnum = z.enum(['ACADEMIC', 'LAB', 'HOSTEL', 'COMMON_AREA']);
export const DeviceTypeEnum = z.enum(['LIGHTING', 'HVAC', 'POWER_OUTLET', 'ACCESS_CONTROL', 'ALARM']);
export const DeviceStatusEnum = z.enum(['ON', 'OFF', 'ECO', 'MAINTENANCE']);
export const AlertSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export type UserRole = z.infer<typeof UserRoleEnum>;
export type ZoneType = z.infer<typeof ZoneTypeEnum>;
export type DeviceType = z.infer<typeof DeviceTypeEnum>;
export type DeviceStatus = z.infer<typeof DeviceStatusEnum>;
export type AlertSeverity = z.infer<typeof AlertSeverityEnum>;

// ─── API Input Schemas ────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const OverrideDeviceSchema = z.object({
  deviceId: z.string().uuid(),
  status: z.enum(['ON', 'OFF', 'ECO']),
  durationMinutes: z.number().min(1).max(480),
  reason: z.string().min(5).max(255),
});

export const TelemetryInputSchema = z.object({
  zoneId: z.string().uuid(),
  occupancyCount: z.number().int().min(0),
  temperature: z.number().min(-10).max(60),
  humidity: z.number().min(0).max(100),
  ambientLux: z.number().min(0).max(100000),
  co2Level: z.number().min(200).max(5000),
  powerDrawKw: z.number().min(0),
});

export const ResolveAlertSchema = z.object({
  resolvedBy: z.string().uuid(),
});

// ─── AI Response Schema ───────────────────────────────────────────────────────
export const AIActionSchema = z.object({
  deviceId: z.string(),
  targetStatus: z.enum(['ON', 'OFF', 'ECO']),
  reason: z.string(),
});

export const AIEvaluationResponseSchema = z.object({
  zoneId: z.string(),
  recommendedActions: z.array(AIActionSchema),
  alertTriggered: z.boolean(),
  alertDetails: z.object({
    title: z.string(),
    severity: AlertSeverityEnum,
    message: z.string(),
  }).optional(),
  estimatedPowerSavingsWatts: z.number().optional(),
});

export type AIEvaluationResponse = z.infer<typeof AIEvaluationResponseSchema>;
export type AIAction = z.infer<typeof AIActionSchema>;

// ─── Domain Types ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface Zone {
  id: string;
  name: string;
  building: string;
  floor: number;
  type: ZoneType;
  maxCapacity: number;
  createdAt: string;
  latestTelemetry?: SensorTelemetry;
  devices?: Device[];
}

export interface Device {
  id: string;
  zoneId: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  powerRatingWatts: number;
  isOverridden: boolean;
  overrideUntil?: string | null;
  updatedAt: string;
}

export interface SensorTelemetry {
  id: string;
  zoneId: string;
  occupancyCount: number;
  temperature: number;
  humidity: number;
  ambientLux: number;
  co2Level: number;
  powerDrawKw: number;
  recordedAt: string;
}

export interface Alert {
  id: string;
  zoneId: string;
  zoneName?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  isResolved: boolean;
  resolvedBy?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface EnergyAnalytics {
  totalPowerDrawKw: number;
  peakLoadKw: number;
  totalSavingsKwh: number;
  co2ReducedKg: number;
  monthlyCostSavings: number;
  aiEfficiencyIndex: number;
  hourlyData: Array<{ hour: string; power: number; occupancy: number; temperature: number }>;
  zoneBreakdown: Array<{ zoneName: string; powerKw: number; percentage: number }>;
}

// ─── WebSocket Message Types ──────────────────────────────────────────────────
export type WSMessageType =
  | 'TELEMETRY_UPDATE'
  | 'DEVICE_UPDATE'
  | 'ALERT_CREATED'
  | 'ALERT_RESOLVED'
  | 'AI_ACTION'
  | 'SYSTEM_STATUS';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: string;
}
