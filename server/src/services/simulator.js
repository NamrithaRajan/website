'use strict';
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
