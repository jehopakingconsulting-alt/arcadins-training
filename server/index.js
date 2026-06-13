'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initDatabase } = require('./database');

// Initialize DB before anything else
initDatabase();

const app = express();
// Render injecte automatiquement $PORT (10000 en général)
const PORT = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:8765',
  'http://localhost:3000',
  'http://127.0.0.1:8765',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,                           // https://arcadins-training.onrender.com
  process.env.CUSTOM_DOMAIN,                          // https://www.arcadins-training.com
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks, etc.)
    if (!origin) return callback(null, true);
    // Allow any onrender.com subdomain (covers web service URL)
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    // Allow our custom domain (with or without www, http or https)
    if (/^https?:\/\/(www\.)?arcadins-training\.com$/.test(origin)) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── BODY PARSERS ────────────────────────────────────────────────────────────
// Raw body for Stripe webhooks (must come before json parser for that route)
app.use('/api/plans/stripe-webhook', express.raw({ type: 'application/json' }));
app.use('/api/tuteur/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── STATIC FILES ────────────────────────────────────────────────────────────
// Serve generated certificates
const certsDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
app.use('/certificates', express.static(certsDir));

// Serve the main frontend (static HTML from parent directory)
const frontendDir = path.join(__dirname, '..');
app.use(express.static(frontendDir));

// ─── API ROUTES ──────────────────────────────────────────────────────────────
app.use('/api/access', require('./routes/access'));
app.use('/api/trial', require('./routes/trial'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/qualification', require('./routes/qualification'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/final-test', require('./routes/finalTest'));
app.use('/api/certificate', require('./routes/certificate'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/tuteur', require('./routes/tuteur'));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ARCADINS API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── FRONTEND FALLBACK ───────────────────────────────────────────────────────
// For any non-API routes, serve the frontend index.html (SPA support)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Route API non trouvée.' });
  }
  const indexPath = path.join(__dirname, '..', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).send('Frontend non trouvé.');
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message || err);
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Erreur serveur interne.' : err.message,
  });
});

// ─── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║          ARCADINS Training Center – API           ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`║  Server running on: http://localhost:${PORT}         ║`);
  console.log(`║  Frontend served:   http://localhost:${PORT}         ║`);
  console.log(`║  API base:          http://localhost:${PORT}/api     ║`);
  console.log(`║  Health check:      http://localhost:${PORT}/api/health ║`);
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log('[Admin] Default credentials: admin@arcadins-training.com / Admin2024!');
  console.log('');
});

module.exports = app;
