'use strict';
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
