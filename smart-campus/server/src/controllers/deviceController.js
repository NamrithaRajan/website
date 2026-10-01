'use strict';
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
    message: `Device overridden to ${status} for ${durationMinutes} minutes`,
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
