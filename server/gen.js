'use strict';
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src');

const files = {};

// ─── validate.js ─────────────────────────────────────────────────────────────
files['middleware/validate.js'] = `'use strict';
const { z } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err && err.errors) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      next(err);
    }
  };
}

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const OverrideDeviceSchema = z.object({
  deviceId: z.string().uuid(),
  status: z.enum(['ON', 'OFF', 'ECO']),
  durationMinutes: z.number().min(1).max(480),
  reason: z.string().min(5).max(255),
});

module.exports = { validate, LoginSchema, OverrideDeviceSchema };
`;

// ─── websocket.js ─────────────────────────────────────────────────────────────
files['services/websocket.js'] = `'use strict';
const WebSocket = require('ws');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('[WS] Client connected');
    ws.send(JSON.stringify({ type: 'SYSTEM_STATUS', payload: { status: 'connected', message: 'Smart Campus WS Online' }, timestamp: new Date().toISOString() }));

    ws.on('close', () => console.log('[WS] Client disconnected'));
    ws.on('error', (err) => console.error('[WS] Error:', err.message));
  });

  return wss;
}

function broadcast(type, payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

module.exports = { initWebSocket, broadcast };
`;

// ─── aiEngine.js ──────────────────────────────────────────────────────────────
files['services/aiEngine.js'] = `'use strict';
const { GoogleGenAI } = require('@google/genai');
const { DEVICES, alertsStore, telemetryStore, getCurrentSchedule } = require('../data/seedData');
const { broadcast } = require('./websocket');
const { v4: uuidv4 } = require('uuid');

let ai = null;
const MODEL = 'gemini-2.5-flash';

function getAI() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// Heuristic fallback if AI unavailable or slow
function heuristicEvaluate(zone, telemetry, devices) {
  const actions = [];
  const hour = new Date().getHours();
  const isOffHour = hour >= 22 || hour < 6;
  const isOccupied = telemetry.occupancy_count > 0;
  let alertTriggered = false;
  let alertDetails = null;
  let savings = 0;

  devices.forEach(d => {
    if (d.is_overridden) return; // Skip overridden devices

    if (telemetry.co2_level > 1200) {
      alertTriggered = true;
      alertDetails = { title: 'CRITICAL: CO2 Threshold Breach', severity: 'CRITICAL', message: \`CO2 level \${telemetry.co2_level}ppm detected in \${zone.name}. Immediate ventilation required.\` };
    }

    if (telemetry.temperature > 50) {
      alertTriggered = true;
      alertDetails = { title: 'EMERGENCY: Thermal Alert', severity: 'CRITICAL', message: \`Temperature \${telemetry.temperature}°C detected in \${zone.name}. Possible fire risk.\` };
    }

    if (isOffHour && isOccupied) {
      alertTriggered = true;
      alertDetails = alertDetails || { title: 'SECURITY: Off-Hour Motion Detected', severity: 'HIGH', message: \`Unauthorized movement detected in \${zone.name} at off-hours.\` };
    }

    if (!isOccupied && !isOffHour) {
      if (d.type === 'LIGHTING' && d.status === 'ON') {
        actions.push({ deviceId: d.id, targetStatus: 'OFF', reason: 'Room unoccupied - turning off lights for energy savings' });
        savings += d.power_rating_watts;
      } else if (d.type === 'HVAC' && d.status === 'ON') {
        actions.push({ deviceId: d.id, targetStatus: 'ECO', reason: 'Room unoccupied - switching HVAC to ECO mode' });
        savings += d.power_rating_watts * 0.4;
      }
    } else if (isOccupied) {
      if (d.type === 'LIGHTING' && d.status === 'OFF') {
        actions.push({ deviceId: d.id, targetStatus: 'ON', reason: 'Room occupied - activating lighting' });
      } else if (d.type === 'HVAC' && d.status === 'ECO') {
        actions.push({ deviceId: d.id, targetStatus: 'ON', reason: 'Room occupied - restoring full HVAC comfort mode' });
      }
    }

    if (isOffHour && !isOccupied) {
      if (d.type === 'LIGHTING' && d.status === 'ON') {
        actions.push({ deviceId: d.id, targetStatus: 'OFF', reason: 'Off-hours auto shutoff' });
        savings += d.power_rating_watts;
      }
      if (d.type === 'HVAC' && d.status !== 'OFF') {
        actions.push({ deviceId: d.id, targetStatus: 'OFF', reason: 'Off-hours HVAC shutoff' });
        savings += d.power_rating_watts;
      }
    }
  });

  return {
    zoneId: zone.id,
    recommendedActions: actions,
    alertTriggered,
    alertDetails,
    estimatedPowerSavingsWatts: savings,
  };
}

async function evaluateZone(zone, telemetry) {
  const zoneDevices = DEVICES.filter(d => d.zone_id === zone.id);
  const schedule = getCurrentSchedule(zone.id);

  // Try AI with 2.5s timeout
  const client = getAI();
  if (client) {
    const prompt = \`You are the Smart Campus Automation AI Engine. Analyze the following zone and return ONLY valid JSON.

Zone Name: \${zone.name}
Zone Type: \${zone.type}
Current Schedule Event: \${schedule || 'None'}
Telemetry: \${JSON.stringify({ occupancy_count: telemetry.occupancy_count, temperature: telemetry.temperature, humidity: telemetry.humidity, ambientLux: telemetry.ambient_lux, co2Level: telemetry.co2_level, powerDrawKw: telemetry.power_draw_kw })}
Device States: \${JSON.stringify(zoneDevices.map(d => ({ id: d.id, name: d.name, type: d.type, status: d.status, isOverridden: d.is_overridden })))}

Safety Directives:
1. Issue CRITICAL alert if CO2 > 1200ppm, temperature > 50°C, or off-hours (22:00-06:00) unauthorized motion
2. Turn off lights and power when occupancy=0 after schedule hours
3. Set HVAC to ECO (27°C) when unoccupied during operational hours
4. Restore ON for occupied rooms

Return ONLY this JSON structure (no markdown, no explanation):
{
  "zoneId": "\${zone.id}",
  "recommendedActions": [{"deviceId": "...", "targetStatus": "ON|OFF|ECO", "reason": "..."}],
  "alertTriggered": false,
  "alertDetails": {"title": "...", "severity": "LOW|MEDIUM|HIGH|CRITICAL", "message": "..."},
  "estimatedPowerSavingsWatts": 0
}\`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const model = client.getGenerativeModel({ model: MODEL });
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 2500)),
      ]);
      clearTimeout(timeoutId);

      const text = result.response.text().trim();
      const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (err) {
      console.warn('[AI] Falling back to heuristic:', err.message);
    }
  }

  return heuristicEvaluate(zone, telemetry, zoneDevices);
}

async function applyAIActions(zone, result) {
  if (!result) return;

  // Apply device actions
  result.recommendedActions.forEach(action => {
    const device = DEVICES.find(d => d.id === action.deviceId);
    if (device && !device.is_overridden) {
      device.status = action.targetStatus;
      device.updated_at = new Date().toISOString();
    }
  });

  // Create alert if triggered
  if (result.alertTriggered && result.alertDetails) {
    const alert = {
      id: uuidv4(),
      zone_id: zone.id,
      zone_name: zone.name,
      title: result.alertDetails.title,
      message: result.alertDetails.message,
      severity: result.alertDetails.severity,
      is_resolved: false,
      resolved_by: null,
      created_at: new Date().toISOString(),
    };
    alertsStore.unshift(alert);
    broadcast('ALERT_CREATED', alert);
  }

  // Broadcast device updates
  broadcast('AI_ACTION', { zoneId: zone.id, actions: result.recommendedActions, savings: result.estimatedPowerSavingsWatts });
}

module.exports = { evaluateZone, applyAIActions, heuristicEvaluate };
`;

// ─── simulator.js ─────────────────────────────────────────────────────────────
files['services/simulator.js'] = `'use strict';
const { v4: uuidv4 } = require('uuid');
const { ZONES, DEVICES, telemetryStore } = require('../data/seedData');
const { broadcast } = require('./websocket');
const { evaluateZone, applyAIActions } = require('./aiEngine');

// Realistic sensor value generators
function jitter(base, variance) {
  return parseFloat((base + (Math.random() - 0.5) * 2 * variance).toFixed(2));
}

const zoneState = {};
ZONES.forEach(zone => {
  zoneState[zone.id] = {
    occupancy: 0,
    temperature: 23,
    humidity: 55,
    lux: 300,
    co2: 420,
    powerKw: 3.5,
    trend: 1,
  };
});

function updateZoneState(zone) {
  const state = zoneState[zone.id];
  const hour = new Date().getHours();
  const isDay = hour >= 8 && hour < 20;
  const isOffHour = hour >= 22 || hour < 6;

  // Occupancy simulation based on zone type and time
  if (isOffHour) {
    state.occupancy = Math.random() < 0.05 ? Math.floor(Math.random() * 3) : 0; // 5% anomaly chance
  } else if (isDay) {
    const maxOcc = Math.floor(zone.max_capacity * 0.7);
    state.occupancy = Math.floor(Math.random() * maxOcc);
  } else {
    state.occupancy = Math.floor(Math.random() * zone.max_capacity * 0.3);
  }

  // Temperature: rises when occupied, drops when HVAC ECO/OFF
  const hvac = DEVICES.find(d => d.zone_id === zone.id && d.type === 'HVAC');
  if (hvac && hvac.status === 'ON') {
    state.temperature = jitter(23, 1.5);
  } else if (hvac && hvac.status === 'ECO') {
    state.temperature = jitter(26, 1);
  } else {
    state.temperature = jitter(28 + state.occupancy * 0.05, 2);
  }

  // CO2 rises with occupancy
  state.co2 = jitter(420 + state.occupancy * 8, 30);
  if (zone.type === 'LAB' && Math.random() < 0.01) state.co2 = jitter(1250, 50); // Rare spike for labs

  // Lux based on lighting
  const lighting = DEVICES.find(d => d.zone_id === zone.id && d.type === 'LIGHTING');
  state.lux = lighting && lighting.status === 'ON' ? jitter(450, 100) : jitter(50, 30);

  // Power draw based on active devices
  const activeDevices = DEVICES.filter(d => d.zone_id === zone.id && d.status === 'ON');
  const ecoDev = DEVICES.filter(d => d.zone_id === zone.id && d.status === 'ECO');
  state.powerKw = parseFloat((
    activeDevices.reduce((sum, d) => sum + d.power_rating_watts, 0) / 1000 +
    ecoDev.reduce((sum, d) => sum + d.power_rating_watts * 0.3, 0) / 1000 +
    jitter(0, 0.2)
  ).toFixed(2));

  state.humidity = jitter(55 + state.occupancy * 0.2, 5);

  return {
    id: uuidv4(),
    zone_id: zone.id,
    occupancy_count: state.occupancy,
    temperature: state.temperature,
    humidity: Math.min(100, state.humidity),
    ambient_lux: state.lux,
    co2_level: state.co2,
    power_draw_kw: state.powerKw,
    recorded_at: new Date().toISOString(),
  };
}

let simulatorInterval = null;
let aiEvalInterval = null;

async function startSimulator() {
  console.log('[Simulator] Starting IoT telemetry stream...');

  // Telemetry every 5 seconds
  simulatorInterval = setInterval(() => {
    ZONES.forEach(zone => {
      const telemetry = updateZoneState(zone);
      const history = telemetryStore[zone.id];
      history.push(telemetry);
      // Keep last 200 readings per zone
      if (history.length > 200) history.shift();
      broadcast('TELEMETRY_UPDATE', { zoneId: zone.id, telemetry });
    });
  }, 5000);

  // AI evaluation every 30 seconds
  aiEvalInterval = setInterval(async () => {
    for (const zone of ZONES) {
      const history = telemetryStore[zone.id];
      if (history.length === 0) continue;
      const latest = history[history.length - 1];
      try {
        const result = await evaluateZone(zone, latest);
        await applyAIActions(zone, result);
        // Broadcast updated device states
        const zoneDevices = DEVICES.filter(d => d.zone_id === zone.id);
        broadcast('DEVICE_UPDATE', { zoneId: zone.id, devices: zoneDevices });
      } catch (err) {
        console.error('[Simulator] AI eval error for zone', zone.name, err.message);
      }
    }
  }, 30000);

  console.log('[Simulator] Telemetry stream active. AI evaluation every 30s.');
}

function stopSimulator() {
  if (simulatorInterval) clearInterval(simulatorInterval);
  if (aiEvalInterval) clearInterval(aiEvalInterval);
}

module.exports = { startSimulator, stopSimulator, zoneState };
`;

// ─── authController.js ────────────────────────────────────────────────────────
files['controllers/authController.js'] = `'use strict';
const bcrypt = require('bcryptjs');
const { USERS, auditLogStore } = require('../data/seedData');
const { generateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

async function login(req, res) {
  const { email, password } = req.body;

  const user = USERS.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user.id, user.role);

  auditLogStore.push({
    id: uuidv4(),
    user_id: user.id,
    action: 'USER_LOGIN',
    details: { email: user.email, role: user.role },
    created_at: new Date().toISOString(),
  });

  res.json({
    token,
    user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
  });
}

async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, getMe };
`;

// ─── zoneController.js ────────────────────────────────────────────────────────
files['controllers/zoneController.js'] = `'use strict';
const { ZONES, DEVICES, telemetryStore } = require('../data/seedData');

function getZones(req, res) {
  const zones = ZONES.map(zone => {
    const history = telemetryStore[zone.id];
    const latestTelemetry = history.length > 0 ? history[history.length - 1] : null;
    const devices = DEVICES.filter(d => d.zone_id === zone.id);
    return {
      id: zone.id,
      name: zone.name,
      building: zone.building,
      floor: zone.floor,
      type: zone.type,
      maxCapacity: zone.max_capacity,
      createdAt: zone.created_at,
      latestTelemetry: latestTelemetry ? {
        id: latestTelemetry.id,
        zoneId: latestTelemetry.zone_id,
        occupancyCount: latestTelemetry.occupancy_count,
        temperature: latestTelemetry.temperature,
        humidity: latestTelemetry.humidity,
        ambientLux: latestTelemetry.ambient_lux,
        co2Level: latestTelemetry.co2_level,
        powerDrawKw: latestTelemetry.power_draw_kw,
        recordedAt: latestTelemetry.recorded_at,
      } : null,
      devices: devices.map(formatDevice),
    };
  });
  res.json(zones);
}

function getZone(req, res) {
  const zone = ZONES.find(z => z.id === req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  const history = telemetryStore[zone.id];
  const devices = DEVICES.filter(d => d.zone_id === zone.id);
  const latestTelemetry = history.length > 0 ? history[history.length - 1] : null;

  res.json({
    id: zone.id,
    name: zone.name,
    building: zone.building,
    floor: zone.floor,
    type: zone.type,
    maxCapacity: zone.max_capacity,
    createdAt: zone.created_at,
    latestTelemetry: latestTelemetry ? formatTelemetry(latestTelemetry) : null,
    devices: devices.map(formatDevice),
  });
}

function getZoneTelemetry(req, res) {
  const zone = ZONES.find(z => z.id === req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  const history = telemetryStore[zone.id];
  const limit = parseInt(req.query.limit) || 50;
  const data = history.slice(-limit).map(formatTelemetry);
  res.json(data);
}

function formatTelemetry(t) {
  return {
    id: t.id, zoneId: t.zone_id, occupancyCount: t.occupancy_count,
    temperature: t.temperature, humidity: t.humidity, ambientLux: t.ambient_lux,
    co2Level: t.co2_level, powerDrawKw: t.power_draw_kw, recordedAt: t.recorded_at,
  };
}

function formatDevice(d) {
  return {
    id: d.id, zoneId: d.zone_id, name: d.name, type: d.type, status: d.status,
    powerRatingWatts: d.power_rating_watts, isOverridden: d.is_overridden,
    overrideUntil: d.override_until, updatedAt: d.updated_at,
  };
}

module.exports = { getZones, getZone, getZoneTelemetry };
`;

// ─── deviceController.js ──────────────────────────────────────────────────────
files['controllers/deviceController.js'] = `'use strict';
const { DEVICES, auditLogStore } = require('../data/seedData');
const { broadcast } = require('../services/websocket');
const { v4: uuidv4 } = require('uuid');

async function overrideDevice(req, res) {
  const { deviceId, status, durationMinutes, reason } = req.body;
  const device = DEVICES.find(d => d.id === deviceId);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const role = req.user.role;
  if (role === 'USER') {
    return res.status(403).json({ error: 'Insufficient permissions to override devices' });
  }

  const overrideUntil = new Date(Date.now() + durationMinutes * 60000).toISOString();
  device.status = status;
  device.is_overridden = true;
  device.override_until = overrideUntil;
  device.updated_at = new Date().toISOString();

  // Schedule override expiry
  setTimeout(() => {
    const d = DEVICES.find(x => x.id === deviceId);
    if (d && d.is_overridden && new Date(d.override_until) <= new Date()) {
      d.is_overridden = false;
      d.override_until = null;
      d.updated_at = new Date().toISOString();
      broadcast('DEVICE_UPDATE', { zoneId: d.zone_id, devices: DEVICES.filter(x => x.zone_id === d.zone_id) });
    }
  }, durationMinutes * 60000);

  auditLogStore.push({
    id: uuidv4(),
    user_id: req.user.id,
    action: 'DEVICE_OVERRIDE',
    details: { deviceId, status, durationMinutes, reason, overrideUntil },
    created_at: new Date().toISOString(),
  });

  broadcast('DEVICE_UPDATE', { zoneId: device.zone_id, devices: DEVICES.filter(d => d.zone_id === device.zone_id) });

  res.json({
    success: true,
    device: { id: device.id, status: device.status, isOverridden: device.is_overridden, overrideUntil: device.override_until },
    message: \`Device overridden to \${status} for \${durationMinutes} minutes\`,
  });
}

async function clearOverride(req, res) {
  const device = DEVICES.find(d => d.id === req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  device.is_overridden = false;
  device.override_until = null;
  device.updated_at = new Date().toISOString();

  broadcast('DEVICE_UPDATE', { zoneId: device.zone_id, devices: DEVICES.filter(d => d.zone_id === device.zone_id) });
  res.json({ success: true, message: 'Override cleared' });
}

module.exports = { overrideDevice, clearOverride };
`;

// ─── alertController.js ───────────────────────────────────────────────────────
files['controllers/alertController.js'] = `'use strict';
const { alertsStore, auditLogStore, DEVICES, ZONES } = require('../data/seedData');
const { broadcast } = require('../services/websocket');
const { v4: uuidv4 } = require('uuid');

function getAlerts(req, res) {
  const { resolved, severity, limit } = req.query;
  let alerts = [...alertsStore];

  if (resolved === 'true') alerts = alerts.filter(a => a.is_resolved);
  else if (resolved === 'false') alerts = alerts.filter(a => !a.is_resolved);
  if (severity) alerts = alerts.filter(a => a.severity === severity.toUpperCase());

  const n = parseInt(limit) || 100;
  res.json(alerts.slice(0, n));
}

async function resolveAlert(req, res) {
  const alert = alertsStore.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  alert.is_resolved = true;
  alert.resolved_by = req.user.id;

  auditLogStore.push({
    id: uuidv4(),
    user_id: req.user.id,
    action: 'ALERT_RESOLVED',
    details: { alertId: alert.id, title: alert.title },
    created_at: new Date().toISOString(),
  });

  broadcast('ALERT_RESOLVED', { alertId: alert.id, resolvedBy: req.user.fullName });
  res.json({ success: true, alert });
}

async function emergencyShutdown(req, res) {
  const { zoneId } = req.body;
  const zone = ZONES.find(z => z.id === zoneId);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  // Turn off all non-essential devices
  const zoneDevices = DEVICES.filter(d => d.zone_id === zoneId);
  zoneDevices.forEach(d => {
    if (d.type !== 'ACCESS_CONTROL' && d.type !== 'ALARM') {
      d.status = 'OFF';
      d.updated_at = new Date().toISOString();
    } else {
      d.status = 'ON'; // Alarms ON during emergency
      d.updated_at = new Date().toISOString();
    }
  });

  const alert = {
    id: uuidv4(),
    zone_id: zoneId,
    zone_name: zone.name,
    title: 'EMERGENCY SHUTDOWN INITIATED',
    message: \`Emergency shutdown executed by \${req.user.fullName} for zone \${zone.name}\`,
    severity: 'CRITICAL',
    is_resolved: false,
    resolved_by: null,
    created_at: new Date().toISOString(),
  };
  alertsStore.unshift(alert);

  broadcast('ALERT_CREATED', alert);
  broadcast('DEVICE_UPDATE', { zoneId, devices: zoneDevices });

  auditLogStore.push({
    id: uuidv4(),
    user_id: req.user.id,
    action: 'EMERGENCY_SHUTDOWN',
    details: { zoneId, zoneName: zone.name },
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Emergency shutdown executed', alert });
}

module.exports = { getAlerts, resolveAlert, emergencyShutdown };
`;

// ─── analyticsController.js ───────────────────────────────────────────────────
files['controllers/analyticsController.js'] = `'use strict';
const { ZONES, DEVICES, telemetryStore, alertsStore } = require('../data/seedData');

function getEnergyAnalytics(req, res) {
  // Aggregate across all zones
  let totalPower = 0;
  let peakLoad = 0;
  const zoneBreakdown = [];
  const hourlyBuckets = {};

  ZONES.forEach(zone => {
    const history = telemetryStore[zone.id];
    if (history.length === 0) return;

    const latest = history[history.length - 1];
    totalPower += latest.power_draw_kw;
    if (latest.power_draw_kw > peakLoad) peakLoad = latest.power_draw_kw;

    zoneBreakdown.push({ zoneName: zone.name, powerKw: latest.power_draw_kw, percentage: 0 });

    // Hourly aggregation
    history.forEach(t => {
      const h = new Date(t.recorded_at).getHours();
      const key = String(h).padStart(2,'0') + ':00';
      if (!hourlyBuckets[key]) hourlyBuckets[key] = { power: [], occupancy: [], temperature: [] };
      hourlyBuckets[key].power.push(t.power_draw_kw);
      hourlyBuckets[key].occupancy.push(t.occupancy_count);
      hourlyBuckets[key].temperature.push(t.temperature);
    });
  });

  // Compute percentages
  zoneBreakdown.forEach(z => { z.percentage = totalPower > 0 ? parseFloat((z.powerKw / totalPower * 100).toFixed(1)) : 0; });
  zoneBreakdown.sort((a, b) => b.powerKw - a.powerKw);

  // Build hourly data
  const avg = arr => arr.length ? parseFloat((arr.reduce((a,b) => a+b, 0) / arr.length).toFixed(2)) : 0;
  const hourlyData = Object.entries(hourlyBuckets)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([hour, data]) => ({ hour, power: avg(data.power), occupancy: Math.round(avg(data.occupancy)), temperature: avg(data.temperature) }));

  // Compute KPIs
  const nominalLoad = ZONES.length * 3.55; // kW nominal
  const actualLoad = totalPower;
  const savingsKwh = Math.max(0, (nominalLoad - actualLoad) * 24);
  const co2ReducedKg = parseFloat((savingsKwh * 0.233).toFixed(2));
  const monthlyCost = parseFloat((savingsKwh * 30 * 0.12).toFixed(2));
  const aiIndex = parseFloat(Math.min(100, Math.max(0, (savingsKwh / (nominalLoad * 24) * 100))).toFixed(1));

  res.json({
    totalPowerDrawKw: parseFloat(totalPower.toFixed(2)),
    peakLoadKw: parseFloat(peakLoad.toFixed(2)),
    totalSavingsKwh: parseFloat(savingsKwh.toFixed(2)),
    co2ReducedKg,
    monthlyCostSavings: monthlyCost,
    aiEfficiencyIndex: aiIndex,
    hourlyData,
    zoneBreakdown,
    activeAlerts: alertsStore.filter(a => !a.is_resolved).length,
    totalZones: ZONES.length,
    activeDevices: DEVICES.filter(d => d.status === 'ON').length,
  });
}

function getAuditLogs(req, res) {
  const { auditLogStore } = require('../data/seedData');
  const limit = parseInt(req.query.limit) || 50;
  res.json(auditLogStore.slice(0, limit));
}

module.exports = { getEnergyAnalytics, getAuditLogs };
`;

// ─── aiController.js ──────────────────────────────────────────────────────────
files['controllers/aiController.js'] = `'use strict';
const { ZONES, telemetryStore } = require('../data/seedData');
const { evaluateZone, applyAIActions } = require('../services/aiEngine');

async function evaluateZoneEndpoint(req, res) {
  const { zoneId } = req.body;
  const zone = ZONES.find(z => z.id === zoneId);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  const history = telemetryStore[zone.id];
  if (history.length === 0) {
    return res.status(400).json({ error: 'No telemetry data available for zone' });
  }

  const latest = history[history.length - 1];

  try {
    const result = await evaluateZone(zone, latest);
    await applyAIActions(zone, result);
    res.json({ success: true, evaluation: result });
  } catch (err) {
    res.status(500).json({ error: 'AI evaluation failed', message: err.message });
  }
}

module.exports = { evaluateZoneEndpoint };
`;

// ─── api.js routes ────────────────────────────────────────────────────────────
files['routes/api.js'] = `'use strict';
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, LoginSchema, OverrideDeviceSchema } = require('../middleware/validate');

const authController = require('../controllers/authController');
const zoneController = require('../controllers/zoneController');
const deviceController = require('../controllers/deviceController');
const alertController = require('../controllers/alertController');
const analyticsController = require('../controllers/analyticsController');
const aiController = require('../controllers/aiController');

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests' } });
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'AI rate limit exceeded' } });

router.use(apiLimiter);

// ─── Auth Routes ──────────────────────────────────────────────────────────────
router.post('/auth/login', validate(LoginSchema), authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);

// ─── Zone Routes ──────────────────────────────────────────────────────────────
router.get('/zones', authenticateToken, zoneController.getZones);
router.get('/zones/:id', authenticateToken, zoneController.getZone);
router.get('/zones/:id/telemetry', authenticateToken, zoneController.getZoneTelemetry);

// ─── Device Routes ────────────────────────────────────────────────────────────
router.post('/devices/override', authenticateToken, requireRole('ADMIN','FACILITY_MANAGER','SECURITY'), validate(OverrideDeviceSchema), deviceController.overrideDevice);
router.delete('/devices/:id/override', authenticateToken, requireRole('ADMIN','FACILITY_MANAGER'), deviceController.clearOverride);

// ─── Alert Routes ─────────────────────────────────────────────────────────────
router.get('/alerts', authenticateToken, alertController.getAlerts);
router.patch('/alerts/:id/resolve', authenticateToken, requireRole('ADMIN','FACILITY_MANAGER','SECURITY'), alertController.resolveAlert);
router.post('/alerts/emergency-shutdown', authenticateToken, requireRole('ADMIN','SECURITY'), alertController.emergencyShutdown);

// ─── Analytics Routes ─────────────────────────────────────────────────────────
router.get('/analytics/energy', authenticateToken, analyticsController.getEnergyAnalytics);
router.get('/analytics/audit-logs', authenticateToken, requireRole('ADMIN','FACILITY_MANAGER'), analyticsController.getAuditLogs);

// ─── AI Routes ────────────────────────────────────────────────────────────────
router.post('/ai/evaluate-zone', authenticateToken, requireRole('ADMIN','FACILITY_MANAGER'), aiLimiter, aiController.evaluateZoneEndpoint);

module.exports = router;
`;

// ─── index.js ─────────────────────────────────────────────────────────────────
files['index.js'] = `'use strict';
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRouter = require('./routes/api');
const { initWebSocket } = require('./services/websocket');
const { startSimulator } = require('./services/simulator');

const app = express();
const server = http.createServer(app);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));

// ─── Serve React Client (Production) ─────────────────────────────────────────
const clientDist = path.join(__dirname, '../../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(\`[Server] Smart Campus API running on http://localhost:\${PORT}\`);
  initWebSocket(server);
  startSimulator();
});

module.exports = { app, server };
`;

// Write all files
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(base, relPath);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Written:', fullPath);
});

console.log('\\n✅ All server source files written successfully!');