'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const { sendUserEmail } = require('../services/email');

// Admin check middleware
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }
  next();
}

router.use(authMiddleware, adminOnly);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const db = getDb();

    const totalUsers      = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role != 'admin'").get();
    const prospects       = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'prospect'").get();
    const apprenants      = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'apprenant'").get();
    const paymentConfirmed= db.prepare("SELECT COUNT(*) as cnt FROM users WHERE payment_confirmed = 1 AND role != 'admin'").get();
    const trialDone       = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE trial_done = 1 AND role != 'admin'").get();
    const qualDone        = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE qualification_done = 1 AND role != 'admin'").get();
    const modulesDone     = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE all_modules_done = 1 AND role != 'admin'").get();
    const finalPassed     = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE final_test_passed = 1 AND role != 'admin'").get();
    const certificates    = db.prepare('SELECT COUNT(*) as cnt FROM certificates').get();
    const totalRevenue    = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE payment_confirmed = 1 AND role != 'admin'").get();

    const recentProspects = db.prepare(`
      SELECT nom, prenom, email, pays, created_at FROM prospects ORDER BY created_at DESC LIMIT 5
    `).all();

    return res.json({
      success: true,
      data: {
        total_users: totalUsers.cnt,
        prospects: prospects.cnt,
        apprenants: apprenants.cnt,
        payment_confirmed: paymentConfirmed.cnt,
        trial_done: trialDone.cnt,
        qualification_done: qualDone.cnt,
        modules_done: modulesDone.cnt,
        final_passed: finalPassed.cnt,
        certificates_issued: certificates.cnt,
        recent_prospects: recentProspects,
        conversion_rate: totalUsers.cnt > 0 ? ((paymentConfirmed.cnt / totalUsers.cnt) * 100).toFixed(1) : 0,
      },
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  try {
    const db = getDb();
    const { role, status, pays, search, page = 1, limit = 50 } = req.query;

    let query = `SELECT id, nom, prenom, email, telephone, pays, role, status, plan, created_at,
      trial_done, trial_score, payment_confirmed, payment_plan, payment_date,
      qualification_done, qualification_level, qualification_score,
      all_modules_done, final_test_passed, final_test_score, certificate_id, lang
      FROM users WHERE 1=1`;
    const params = [];

    if (role) { query += ' AND role = ?'; params.push(role); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (pays) { query += ' AND pays = ?'; params.push(pays); }
    if (search) {
      query += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const users = db.prepare(query).all(...params);
    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as cnt FROM').replace(/ORDER BY.*$/, '');

    return res.json({
      success: true,
      data: {
        users,
        total: users.length,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('[Admin] Users error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT id, nom, prenom, email, telephone, pays, role, status, plan, created_at,
      trial_done, trial_score, payment_confirmed, payment_plan, payment_date,
      qualification_done, qualification_level, qualification_score,
      all_modules_done, final_test_passed, final_test_score, certificate_id,
      current_module, lang
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const tests = db.prepare('SELECT * FROM tests WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    const modules = db.prepare('SELECT * FROM modules WHERE user_id = ? ORDER BY module_number').all(user.id);
    const cert = db.prepare('SELECT * FROM certificates WHERE user_id = ?').get(user.id);

    return res.json({
      success: true,
      data: { user, tests, modules, certificate: cert || null },
    });
  } catch (err) {
    console.error('[Admin] User detail error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', (req, res) => {
  try {
    const db = getDb();
    const { role, status, payment_confirmed, trial_done, qualification_done, all_modules_done, final_test_passed, plan } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const updates = [];
    const params = [];

    if (role !== undefined) { updates.push('role = ?'); params.push(role); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (payment_confirmed !== undefined) { updates.push('payment_confirmed = ?'); params.push(payment_confirmed ? 1 : 0); }
    if (trial_done !== undefined) { updates.push('trial_done = ?'); params.push(trial_done ? 1 : 0); }
    if (qualification_done !== undefined) { updates.push('qualification_done = ?'); params.push(qualification_done ? 1 : 0); }
    if (all_modules_done !== undefined) { updates.push('all_modules_done = ?'); params.push(all_modules_done ? 1 : 0); }
    if (final_test_passed !== undefined) { updates.push('final_test_passed = ?'); params.push(final_test_passed ? 1 : 0); }
    if (plan !== undefined) { updates.push('payment_plan = ?'); params.push(plan); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune modification spécifiée.' });
    }

    params.push(req.params.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    const { password_hash, ...safeUser } = updated;

    return res.json({ success: true, data: { user: safeUser }, message: 'Utilisateur mis à jour.' });
  } catch (err) {
    console.error('[Admin] Update user error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// GET /api/admin/prospects
router.get('/prospects', (req, res) => {
  try {
    const db = getDb();
    const prospects = db.prepare('SELECT * FROM prospects ORDER BY created_at DESC').all();
    return res.json({ success: true, data: { prospects, total: prospects.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// GET /api/admin/tests
router.get('/tests', (req, res) => {
  try {
    const db = getDb();
    const { type } = req.query;
    let query = `SELECT t.*, u.nom, u.prenom, u.email FROM tests t
      JOIN users u ON t.user_id = u.id WHERE 1=1`;
    const params = [];
    if (type) { query += ' AND t.test_type = ?'; params.push(type); }
    query += ' ORDER BY t.created_at DESC LIMIT 200';

    const tests = db.prepare(query).all(...params);
    return res.json({ success: true, data: { tests, total: tests.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// GET /api/admin/certificates
router.get('/certificates', (req, res) => {
  try {
    const db = getDb();
    const certs = db.prepare(`
      SELECT c.*, u.email, u.pays FROM certificates c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.issued_at DESC
    `).all();
    return res.json({ success: true, data: { certificates: certs, total: certs.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// GET /api/admin/export/csv
router.get('/export/csv', (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT nom, prenom, email, telephone, pays, role, status, payment_plan, created_at,
      trial_done, trial_score, qualification_done, qualification_level, qualification_score,
      all_modules_done, final_test_passed, final_test_score
      FROM users WHERE role != 'admin' ORDER BY created_at DESC
    `).all();

    const headers = Object.keys(users[0] || {}).join(',');
    const rows = users.map((u) => Object.values(u).map((v) => `"${v !== null && v !== undefined ? String(v).replace(/"/g, '""') : ''}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="arcadins_users_${Date.now()}.csv"`);
    return res.send('﻿' + csv); // BOM for Excel
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// PUT /api/admin/settings
router.put('/settings', (req, res) => {
  try {
    const db = getDb();
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Settings requis.' });
    }

    const upsert = db.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)');
    const updateMany = db.transaction((entries) => {
      entries.forEach(([key, value]) => upsert.run(key, String(value)));
    });

    updateMany(Object.entries(settings));

    const allSettings = db.prepare('SELECT * FROM admin_settings').all();
    return res.json({ success: true, data: { settings: allSettings }, message: 'Paramètres mis à jour.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/admin/users/:id/email
router.post('/users/:id/email', async (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Sujet et message requis.' });
    }

    const htmlContent = `
      <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
      <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 4px;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <p style="color: #666; font-size: 13px; margin-top: 20px;">L'équipe ARCADINS Training Center</p>
    `;

    await sendUserEmail(user.email, subject, htmlContent);
    return res.json({ success: true, message: `Email envoyé à ${user.email}.` });
  } catch (err) {
    console.error('[Admin] Send email error:', err);
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi.' });
  }
});

module.exports = router;
