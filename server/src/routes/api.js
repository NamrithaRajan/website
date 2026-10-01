'use strict';
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
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10000, message: { error: 'Too many requests' } });
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
