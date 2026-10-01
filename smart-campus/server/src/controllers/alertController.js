'use strict';
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
    message: `Emergency shutdown executed by ${req.user.fullName} for zone ${zone.name}`,
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
