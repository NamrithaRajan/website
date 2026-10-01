'use strict';
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
