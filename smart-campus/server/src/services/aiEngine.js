'use strict';
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
      alertDetails = { title: 'CRITICAL: CO2 Threshold Breach', severity: 'CRITICAL', message: `CO2 level ${telemetry.co2_level}ppm detected in ${zone.name}. Immediate ventilation required.` };
    }

    if (telemetry.temperature > 50) {
      alertTriggered = true;
      alertDetails = { title: 'EMERGENCY: Thermal Alert', severity: 'CRITICAL', message: `Temperature ${telemetry.temperature}°C detected in ${zone.name}. Possible fire risk.` };
    }

    if (isOffHour && isOccupied) {
      alertTriggered = true;
      alertDetails = alertDetails || { title: 'SECURITY: Off-Hour Motion Detected', severity: 'HIGH', message: `Unauthorized movement detected in ${zone.name} at off-hours.` };
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
    const prompt = `You are the Smart Campus Automation AI Engine. Analyze the following zone and return ONLY valid JSON.

Zone Name: ${zone.name}
Zone Type: ${zone.type}
Current Schedule Event: ${schedule || 'None'}
Telemetry: ${JSON.stringify({ occupancy_count: telemetry.occupancy_count, temperature: telemetry.temperature, humidity: telemetry.humidity, ambientLux: telemetry.ambient_lux, co2Level: telemetry.co2_level, powerDrawKw: telemetry.power_draw_kw })}
Device States: ${JSON.stringify(zoneDevices.map(d => ({ id: d.id, name: d.name, type: d.type, status: d.status, isOverridden: d.is_overridden })))}

Safety Directives:
1. Issue CRITICAL alert if CO2 > 1200ppm, temperature > 50°C, or off-hours (22:00-06:00) unauthorized motion
2. Turn off lights and power when occupancy=0 after schedule hours
3. Set HVAC to ECO (27°C) when unoccupied during operational hours
4. Restore ON for occupied rooms

Return ONLY this JSON structure (no markdown, no explanation):
{
  "zoneId": "${zone.id}",
  "recommendedActions": [{"deviceId": "...", "targetStatus": "ON|OFF|ECO", "reason": "..."}],
  "alertTriggered": false,
  "alertDetails": {"title": "...", "severity": "LOW|MEDIUM|HIGH|CRITICAL", "message": "..."},
  "estimatedPowerSavingsWatts": 0
}`;

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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
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
