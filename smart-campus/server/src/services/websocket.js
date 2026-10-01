'use strict';
const WebSocket = require('ws');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('[WS] Client connected');
    ws.send(JSON.stringify({ type: 'SYSTEM_STATUS', payload: { status: 'connected', message: 'Smart Campus WS Online' }, timestamp: new Date().toISOString() }));

    ws.on('close', () => console.log('[WS] Client disconnected'));
    ws.on('error', (err) => console.error('[WS] Error:', err.message));
  });

  return wss;
}

function broadcast(type, payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

module.exports = { initWebSocket, broadcast };
