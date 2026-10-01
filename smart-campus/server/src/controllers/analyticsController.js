'use strict';
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
