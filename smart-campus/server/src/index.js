'use strict';
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRouter = require('./routes/api');
const { initWebSocket } = require('./services/websocket');
const { startSimulator } = require('./services/simulator');

const app = express();
const server = http.createServer(app);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));

// ─── Serve React Client (Production) ─────────────────────────────────────────
const clientDist = path.join(__dirname, '../../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Server] Smart Campus API running on http://localhost:${PORT}`);
  initWebSocket(server);
  startSimulator();
});

module.exports = { app, server };
