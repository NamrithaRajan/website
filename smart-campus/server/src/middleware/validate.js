'use strict';
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
