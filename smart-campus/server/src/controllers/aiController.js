'use strict';
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
