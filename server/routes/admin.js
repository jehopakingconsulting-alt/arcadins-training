'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb, normalizePhone, logAdminAction } = require('../database');
const authMiddleware = require('../middleware/auth');
const { sendUserEmail, testConnection, isConfigured } = require('../services/email');

// ── Admin guard (admin + modérateur) ────────────────────────────────────────
function adminOnly(req, res, next) {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }
  next();
}

// ── Full admin guard (admin uniquement — actions sensibles) ──────────────────
function fullAdminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Action réservée à l\'administrateur principal.' });
  }
  next();
}

router.use(authMiddleware, adminOnly);

// ════════════════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════════════════
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const g = (sql) => db.prepare(sql).get().cnt;

    const recentProspects = db.prepare(
      'SELECT nom, prenom, email, pays, telephone, created_at FROM prospects ORDER BY created_at DESC LIMIT 10'
    ).all();

    return res.json({
      success: true,
      data: {
        total_users:          g("SELECT COUNT(*) cnt FROM users WHERE role!='admin'"),
        total_prospects:      g("SELECT COUNT(*) cnt FROM prospects"),
        total_apprenants:     g("SELECT COUNT(*) cnt FROM users WHERE role='apprenant'"),
        payment_confirmed:    g("SELECT COUNT(*) cnt FROM users WHERE payment_confirmed=1 AND role!='admin'"),
        payment_pending:      g("SELECT COUNT(*) cnt FROM users WHERE payment_confirmed=0 AND role='apprenant'"),
        trial_done:           g("SELECT COUNT(*) cnt FROM users WHERE trial_done=1 AND role!='admin'"),
        qualification_done:   g("SELECT COUNT(*) cnt FROM users WHERE qualification_done=1 AND role!='admin'"),
        modules_all_done:     g("SELECT COUNT(*) cnt FROM users WHERE all_modules_done=1"),
        final_passed:         g("SELECT COUNT(*) cnt FROM users WHERE final_test_passed=1"),
        certificates_generated: g('SELECT COUNT(*) cnt FROM certificates'),
        blocked_users:        g("SELECT COUNT(*) cnt FROM users WHERE status='blocked'"),
        recent_prospects:     recentProspects,
      },
    });
  } catch (err) {
    console.error('[Admin] Stats:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — LIST
// ════════════════════════════════════════════════════════════════════
router.get('/users', (req, res) => {
  try {
    const db = getDb();
    const { role, status, pays, search, page = 1, limit = 100 } = req.query;

    let q = `SELECT id,nom,prenom,email,telephone,pays,role,status,plan,created_at,
      trial_done,trial_score,payment_confirmed,payment_plan,payment_date,payment_method,
      qualification_done,qualification_level,qualification_score,
      current_module,all_modules_done,final_test_done,final_test_score,final_test_passed,
      certificate_id,lang FROM users WHERE 1=1`;
    const p = [];

    if (role)   { q += ' AND role=?';  p.push(role); }
    if (status) { q += ' AND status=?'; p.push(status); }
    if (pays)   { q += ' AND pays=?';  p.push(pays); }
    if (search) {
      q += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR telephone LIKE ?)';
      p.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    q += ' ORDER BY created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    q += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const users = db.prepare(q).all(...p);
    return res.json({ success: true, data: { users, total: users.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — DETAIL
// ════════════════════════════════════════════════════════════════════
router.get('/users/:id', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(
      `SELECT id,nom,prenom,email,telephone,pays,role,status,plan,created_at,
       trial_done,trial_score,payment_confirmed,payment_plan,payment_date,payment_method,payment_notes,
       qualification_done,qualification_level,qualification_score,
       current_module,all_modules_done,final_test_done,final_test_score,final_test_passed,
       certificate_id,lang FROM users WHERE id=?`
    ).get(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const tests   = db.prepare('SELECT * FROM tests WHERE user_id=? ORDER BY created_at DESC').all(user.id);
    const modules = db.prepare('SELECT * FROM modules WHERE user_id=? ORDER BY module_number').all(user.id);
    const cert    = db.prepare('SELECT * FROM certificates WHERE user_id=?').get(user.id);
    const testAttempts = db.prepare("SELECT COUNT(*) cnt FROM tests WHERE user_id=? AND test_type='final'").get(user.id);

    return res.json({ success: true, data: { user, tests, modules, certificate: cert || null, final_attempts: testAttempts.cnt } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — CREATE MANUALLY
// ════════════════════════════════════════════════════════════════════
router.post('/users', fullAdminOnly, async (req, res) => {
  try {
    const db = getDb();
    const { nom, prenom, email, telephone, pays, password, plan, payment_method, payment_confirmed, notes } = req.body;

    if (!nom || !prenom || !email || !password)
      return res.status(400).json({ success: false, message: 'Nom, prénom, email et mot de passe requis.' });

    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (existing) return res.status(409).json({ success: false, message: 'Email déjà utilisé.' });

    const hash = await bcrypt.hash(password, 10);
    const paid = payment_confirmed ? 1 : 0;

    const info = db.prepare(`
      INSERT INTO users (nom,prenom,email,telephone,pays,password_hash,role,status,
        payment_plan,payment_method,payment_confirmed,payment_date,payment_notes,lang)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      nom.trim(), prenom.trim(), email.trim().toLowerCase(),
      telephone || null, pays || null, hash,
      paid ? 'apprenant' : 'prospect',
      paid ? 'active' : 'trial',
      plan || null,
      payment_method || null,
      paid,
      paid ? new Date().toISOString() : null,
      notes || null,
      'fr'
    );

    const newId = info.lastInsertRowid;

    // Si paiement confirmé → créer les 14 modules
    if (paid) {
      const ins = db.prepare('INSERT OR IGNORE INTO modules (user_id,module_number,status) VALUES (?,?,?)');
      for (let i = 1; i <= 14; i++) ins.run(newId, i, i === 1 ? 'not_started' : 'locked');
      db.prepare("UPDATE users SET qualification_done=1 WHERE id=?").run(newId);
    }

    const created = db.prepare('SELECT id,nom,prenom,email,role,status,payment_confirmed FROM users WHERE id=?').get(newId);
    return res.status(201).json({ success: true, data: { user: created }, message: 'Compte créé avec succès.' });
  } catch (err) {
    console.error('[Admin] Create user:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — EDIT PROFILE
// ════════════════════════════════════════════════════════════════════
router.put('/users/:id/profile', async (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const { nom, prenom, email, telephone, pays, plan, password, notes } = req.body;
    const updates = []; const params = [];

    if (nom)       { updates.push('nom=?');       params.push(nom.trim()); }
    if (prenom)    { updates.push('prenom=?');     params.push(prenom.trim()); }
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingEmail = db.prepare('SELECT id FROM users WHERE email=? AND id!=?').get(normalizedEmail, user.id);
      if (existingEmail) return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé par un autre compte.' });
      updates.push('email=?'); params.push(normalizedEmail);
    }
    if (telephone !== undefined) {
      const phoneNormalized = normalizePhone(telephone);
      if (phoneNormalized) {
        const existingPhone = db.prepare('SELECT id FROM users WHERE telephone_normalized=? AND id!=?').get(phoneNormalized, user.id);
        if (existingPhone) return res.status(409).json({ success: false, message: 'Ce numéro de téléphone est déjà utilisé par un autre compte.' });
      }
      updates.push('telephone=?'); params.push(telephone || null);
      updates.push('telephone_normalized=?'); params.push(phoneNormalized || null);
    }
    if (pays !== undefined)      { updates.push('pays=?');      params.push(pays || null); }
    if (plan !== undefined)      { updates.push('payment_plan=?'); params.push(plan || null); }
    if (notes !== undefined)     { updates.push('payment_notes=?'); params.push(notes || null); }
    if (password)  {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash=?'); params.push(hash);
    }

    if (!updates.length) return res.status(400).json({ success: false, message: 'Aucune modification.' });

    params.push(req.params.id);
    db.prepare(`UPDATE users SET ${updates.join(',')} WHERE id=?`).run(...params);

    logAdminAction(db, req.user.id, 'edit_profile', user.id, { fields: Object.keys(req.body) });
    return res.json({ success: true, message: 'Profil mis à jour.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — CONFIRM PAYMENT (cash, Interac, virement…)
// ════════════════════════════════════════════════════════════════════
router.post('/users/:id/confirm-payment', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const { plan, payment_method, notes } = req.body;

    // Confirm payment + upgrade role + activate
    db.prepare(`UPDATE users SET
      payment_confirmed=1, payment_date=datetime('now'),
      payment_plan=COALESCE(?,payment_plan),
      payment_method=COALESCE(?,payment_method,'Manuel'),
      payment_notes=COALESCE(?,payment_notes),
      role='apprenant', status='active', qualification_done=1
    WHERE id=?`).run(plan || null, payment_method || 'Manuel', notes || null, user.id);

    // Create/unlock modules if not already done
    const existing = db.prepare('SELECT COUNT(*) cnt FROM modules WHERE user_id=?').get(user.id);
    if (existing.cnt === 0) {
      const ins = db.prepare('INSERT OR IGNORE INTO modules (user_id,module_number,status) VALUES (?,?,?)');
      for (let i = 1; i <= 14; i++) ins.run(user.id, i, i === 1 ? 'not_started' : 'locked');
    } else {
      // Unlock first module if still locked
      db.prepare("UPDATE modules SET status='not_started' WHERE user_id=? AND module_number=1 AND status='locked'").run(user.id);
    }

    logAdminAction(db, req.user.id, 'confirm_payment', user.id, { plan, payment_method, notes });
    return res.json({ success: true, message: `Paiement confirmé. Accès à la formation accordé à ${user.prenom} ${user.nom}.` });
  } catch (err) {
    console.error('[Admin] Confirm payment:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — GRANT ACCESS (without payment, e.g. promo/test)
// ════════════════════════════════════════════════════════════════════
router.post('/users/:id/grant-access', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const { reason } = req.body;

    db.prepare(`UPDATE users SET
      role='apprenant', status='active', qualification_done=1,
      payment_notes=COALESCE(?,'Accès accordé manuellement par admin')
    WHERE id=?`).run(reason || null, user.id);

    const existing = db.prepare('SELECT COUNT(*) cnt FROM modules WHERE user_id=?').get(user.id);
    if (existing.cnt === 0) {
      const ins = db.prepare('INSERT OR IGNORE INTO modules (user_id,module_number,status) VALUES (?,?,?)');
      for (let i = 1; i <= 14; i++) ins.run(user.id, i, i === 1 ? 'not_started' : 'locked');
    } else {
      db.prepare("UPDATE modules SET status='not_started' WHERE user_id=? AND module_number=1 AND status='locked'").run(user.id);
    }

    logAdminAction(db, req.user.id, 'grant_access', user.id, { reason });
    return res.json({ success: true, message: `Accès formation accordé à ${user.prenom} ${user.nom}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — BLOCK
// ════════════════════════════════════════════════════════════════════
router.post('/users/:id/block', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Impossible de bloquer un admin.' });

    const { reason } = req.body;
    db.prepare("UPDATE users SET status='blocked', payment_notes=COALESCE(?,payment_notes) WHERE id=?")
      .run(reason ? `[BLOQUÉ] ${reason}` : null, user.id);

    logAdminAction(db, req.user.id, 'block_user', user.id, { reason });
    return res.json({ success: true, message: `Compte de ${user.prenom} ${user.nom} bloqué.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — UNBLOCK
// ════════════════════════════════════════════════════════════════════
router.post('/users/:id/unblock', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const newStatus = user.payment_confirmed ? 'active' : 'trial';
    db.prepare("UPDATE users SET status=? WHERE id=?").run(newStatus, user.id);

    logAdminAction(db, req.user.id, 'unblock_user', user.id, { newStatus });
    return res.json({ success: true, message: `Compte de ${user.prenom} ${user.nom} débloqué.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — DELETE
// ════════════════════════════════════════════════════════════════════
router.delete('/users/:id', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Impossible de supprimer un admin.' });

    logAdminAction(db, req.user.id, 'delete_user', user.id, { email: user.email, nom: user.nom, prenom: user.prenom });

    // Delete all related data
    db.prepare('DELETE FROM tests WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM modules WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM certificates WHERE user_id=?').run(user.id);
    db.prepare('DELETE FROM users WHERE id=?').run(user.id);

    return res.json({ success: true, message: `Compte de ${user.prenom} ${user.nom} supprimé définitivement.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — RESET FINAL TEST ATTEMPTS
// ════════════════════════════════════════════════════════════════════
router.post('/users/:id/reset-final-test', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    db.prepare("DELETE FROM tests WHERE user_id=? AND test_type='final'").run(user.id);
    db.prepare("UPDATE users SET final_test_done=0, final_test_score=0, final_test_passed=0 WHERE id=?").run(user.id);

    logAdminAction(db, req.user.id, 'reset_final_test', user.id, null);
    return res.json({ success: true, message: `Tentatives du test final réinitialisées pour ${user.prenom} ${user.nom}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — RESET MODULE PROGRESS
// ════════════════════════════════════════════════════════════════════
router.post('/users/:id/reset-modules', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    db.prepare('DELETE FROM modules WHERE user_id=?').run(user.id);
    db.prepare("UPDATE users SET current_module=1, all_modules_done=0, final_test_done=0, final_test_score=0, final_test_passed=0 WHERE id=?").run(user.id);
    db.prepare("DELETE FROM tests WHERE user_id=? AND test_type='final'").run(user.id);

    // Re-create locked modules
    const ins = db.prepare('INSERT INTO modules (user_id,module_number,status) VALUES (?,?,?)');
    for (let i = 1; i <= 14; i++) ins.run(user.id, i, i === 1 ? 'not_started' : 'locked');

    logAdminAction(db, req.user.id, 'reset_modules', user.id, null);
    return res.json({ success: true, message: `Progression modules réinitialisée pour ${user.prenom} ${user.nom}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USERS — REVOKE ACCESS (suspend)
// ════════════════════════════════════════════════════════════════════
router.post('/users/:id/revoke-access', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    db.prepare("UPDATE users SET payment_confirmed=0, status='suspended', role='prospect' WHERE id=?").run(user.id);

    logAdminAction(db, req.user.id, 'revoke_access', user.id, null);
    return res.json({ success: true, message: `Accès révoqué pour ${user.prenom} ${user.nom}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  PAYMENTS — LIST pending / all
// ════════════════════════════════════════════════════════════════════
router.get('/payments', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query; // 'pending' | 'confirmed' | all

    let q = `SELECT id,nom,prenom,email,telephone,pays,role,status,
      payment_plan,payment_method,payment_confirmed,payment_date,payment_notes,created_at
      FROM users WHERE role!='admin'`;

    if (status === 'pending')   q += " AND payment_confirmed=0 AND (role='apprenant' OR payment_method IS NOT NULL)";
    if (status === 'confirmed') q += ' AND payment_confirmed=1';

    q += ' ORDER BY created_at DESC';

    const payments = db.prepare(q).all();
    return res.json({ success: true, data: { payments, total: payments.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  PROSPECTS
// ════════════════════════════════════════════════════════════════════
router.get('/prospects', (req, res) => {
  try {
    const db = getDb();
    const prospects = db.prepare('SELECT * FROM prospects ORDER BY created_at DESC').all();
    return res.json({ success: true, data: { prospects, total: prospects.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  TESTS
// ════════════════════════════════════════════════════════════════════
router.get('/tests', (req, res) => {
  try {
    const db = getDb();
    const { type } = req.query;
    let q = `SELECT t.*,u.nom,u.prenom,u.email FROM tests t
      JOIN users u ON t.user_id=u.id WHERE 1=1`;
    const p = [];
    if (type) { q += ' AND t.test_type=?'; p.push(type); }
    q += ' ORDER BY t.created_at DESC LIMIT 500';
    const tests = db.prepare(q).all(...p);
    return res.json({ success: true, data: { tests, total: tests.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  CERTIFICATES
// ════════════════════════════════════════════════════════════════════
router.get('/certificates', (req, res) => {
  try {
    const db = getDb();
    const certs = db.prepare(`
      SELECT c.*,u.email,u.pays FROM certificates c
      JOIN users u ON c.user_id=u.id ORDER BY c.issued_at DESC
    `).all();
    return res.json({ success: true, data: { certificates: certs, total: certs.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  SEND EMAIL TO USER
// ════════════════════════════════════════════════════════════════════
router.post('/users/:id/email', async (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const { subject, message } = req.body;
    if (!subject || !message)
      return res.status(400).json({ success: false, message: 'Sujet et message requis.' });

    const html = `<p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
      <div style="margin:20px 0;padding:16px;background:#f9f9f9;border-radius:6px;">${message.replace(/\n/g,'<br>')}</div>
      <p style="color:#666;font-size:13px;">L'équipe ARCADINS Training Center</p>`;

    await sendUserEmail(user.email, subject, html);
    return res.json({ success: true, message: `Email envoyé à ${user.email}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Erreur lors de l'envoi." });
  }
});

// ════════════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════════════
router.get('/settings', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM admin_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return res.json({ success: true, data: { settings } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.put('/settings', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object')
      return res.status(400).json({ success: false, message: 'Settings requis.' });

    const upsert = db.prepare('INSERT OR REPLACE INTO admin_settings (key,value) VALUES (?,?)');
    const tx = db.transaction((entries) => { entries.forEach(([k,v]) => upsert.run(k, String(v))); });
    tx(Object.entries(settings));

    return res.json({ success: true, message: 'Paramètres enregistrés.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  EXPORT CSV
// ════════════════════════════════════════════════════════════════════
router.get('/export/csv', (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT nom,prenom,email,telephone,pays,role,status,payment_plan,payment_method,
      payment_confirmed,payment_date,created_at,trial_done,trial_score,
      qualification_done,qualification_level,qualification_score,
      all_modules_done,final_test_passed,final_test_score
      FROM users WHERE role!='admin' ORDER BY created_at DESC
    `).all();

    if (!users.length) return res.send('Aucun utilisateur');

    // Neutralise l'injection de formules Excel/Sheets : si une valeur commence
    // par =, +, -, @ ou une tabulation, Excel peut l'interpréter comme une
    // formule à l'ouverture. On préfixe d'une apostrophe pour la forcer en texte.
    const sanitizeCsvCell = (v) => {
      let s = v !== null && v !== undefined ? String(v) : '';
      if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };

    const headers = Object.keys(users[0]).join(',');
    const rows = users.map(u =>
      Object.values(u).map(sanitizeCsvCell).join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="arcadins_users_${Date.now()}.csv"`);
    return res.send('﻿' + [headers, ...rows].join('\n'));
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  EMAIL — TEST CONNEXION SMTP
// ════════════════════════════════════════════════════════════════════
router.get('/email/test', async (req, res) => {
  const result = await testConnection();
  return res.json({ success: result.ok, message: result.message, configured: isConfigured() });
});

// POST /api/admin/email/test-send — envoie un email de test à l'admin
router.post('/email/test-send', async (req, res) => {
  try {
    await sendUserEmail(
      process.env.ADMIN_EMAIL || 'arcadinstrainingcenter@gmail.com',
      '[ARCADINS] ✅ Test email — Configuration Gmail OK',
      `<h2 style="color:#074A2E;">✅ Connexion Gmail opérationnelle</h2>
       <p>La connexion SMTP Gmail fonctionne correctement.</p>
       <p style="color:#5d7a6e;font-size:13px;">Tous les emails de la plateforme ARCADINS seront envoyés depuis ce compte.</p>`
    );
    return res.json({ success: true, message: 'Email de test envoyé à arcadinstrainingcenter@gmail.com' });
  } catch(err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════
//  AFFILIATION — Programme de parrainage
// ════════════════════════════════════════════════════════════════════

// GET /api/admin/affiliates — liste de toutes les commissions
router.get('/affiliates', (req, res) => {
  try {
    const db = getDb();
    const commissions = db.prepare(`
      SELECT ac.id, ac.plan, ac.amount, ac.status, ac.created_at, ac.paid_at,
             r.id as referrer_id, r.nom as referrer_nom, r.prenom as referrer_prenom, r.email as referrer_email, r.referral_code,
             u.id as referred_id, u.nom as referred_nom, u.prenom as referred_prenom, u.email as referred_email
      FROM affiliate_commissions ac
      JOIN users r ON r.id = ac.referrer_id
      JOIN users u ON u.id = ac.referred_user_id
      ORDER BY ac.created_at DESC
    `).all();

    const totals = commissions.reduce((acc, c) => {
      acc.total += c.amount;
      if (c.status === 'paid') acc.paid += c.amount;
      else acc.pending += c.amount;
      return acc;
    }, { total: 0, pending: 0, paid: 0 });

    return res.json({ success: true, data: { commissions, totals } });
  } catch (err) {
    console.error('[Admin] Affiliates list:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// PUT /api/admin/affiliates/:id — met à jour le statut d'une commission (pending/paid)
router.put('/affiliates/:id', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    if (!['pending', 'paid'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide.' });
    }
    const commission = db.prepare('SELECT id FROM affiliate_commissions WHERE id = ?').get(req.params.id);
    if (!commission) {
      return res.status(404).json({ success: false, message: 'Commission introuvable.' });
    }
    db.prepare(`
      UPDATE affiliate_commissions
      SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN datetime('now') ELSE NULL END
      WHERE id = ?
    `).run(status, status, req.params.id);

    logAdminAction(db, req.user.id, 'update_affiliate_commission', null, { commission_id: req.params.id, status });
    return res.json({ success: true, message: 'Statut mis à jour.' });
  } catch (err) {
    console.error('[Admin] Affiliates update:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  TUTEURS — gestion des candidats tuteurs
// ════════════════════════════════════════════════════════════════════

// GET /api/admin/tuteurs — liste tous les candidats tuteurs
router.get('/tuteurs', (req, res) => {
  try {
    const db = getDb();
    const tuteurs = db.prepare(`
      SELECT id,nom,prenom,email,telephone,pays,status,created_at,
        is_tuteur_candidat,tuteur_application,
        tuteur_payment_confirmed,tuteur_payment_date,tuteur_stripe_session_id,
        tuteur_current_module,tuteur_all_modules_done,
        tuteur_test_done,tuteur_test_score,tuteur_test_passed
      FROM users WHERE is_tuteur_candidat=1 ORDER BY created_at DESC
    `).all();
    return res.json({ success: true, data: { tuteurs, total: tuteurs.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/admin/tuteurs/:id/confirm-payment — confirme paiement tuteur manuellement
router.post('/tuteurs/:id/confirm-payment', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    const { notes } = req.body;
    db.prepare(`UPDATE users SET tuteur_payment_confirmed=1, tuteur_payment_date=datetime('now'),
      tuteur_application=COALESCE(?,tuteur_application) WHERE id=?`)
      .run(notes || null, user.id);
    logAdminAction(db, req.user.id, 'tuteur_confirm_payment', user.id, { notes });
    return res.json({ success: true, message: `Paiement tuteur confirmé pour ${user.prenom} ${user.nom}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/admin/tuteurs/:id/approve — approuve manuellement le test tuteur
router.post('/tuteurs/:id/approve', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    db.prepare(`UPDATE users SET tuteur_test_done=1, tuteur_test_passed=1, tuteur_test_score=100 WHERE id=?`).run(user.id);
    logAdminAction(db, req.user.id, 'tuteur_approve', user.id, null);
    return res.json({ success: true, message: `Statut tuteur approuvé pour ${user.prenom} ${user.nom}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/admin/broadcast — envoie un email à tous les utilisateurs (ou par rôle)
router.post('/broadcast', fullAdminOnly, async (req, res) => {
  try {
    const db = getDb();
    const { subject, message, target } = req.body;
    if (!subject || !message) return res.status(400).json({ success: false, message: 'Sujet et message requis.' });

    const { sendUserEmail } = require('../services/email');
    let q = "SELECT email,prenom,nom FROM users WHERE status!='blocked' AND role!='admin'";
    if (target === 'apprenants') q += " AND role='apprenant'";
    if (target === 'prospects')  q += " AND role='prospect'";
    if (target === 'payants')    q += " AND payment_confirmed=1";
    const users = db.prepare(q).all();

    let sent = 0;
    for (const u of users) {
      try {
        const html = `<p>Bonjour <strong>${u.prenom} ${u.nom}</strong>,</p>
          <div style="margin:20px 0;padding:16px;background:#f9f9f9;border-radius:6px;">${message.replace(/\n/g,'<br>')}</div>
          <p style="color:#666;font-size:13px;">L'équipe ARCADINS Training Center</p>`;
        await sendUserEmail(u.email, subject, html);
        sent++;
      } catch {}
    }

    logAdminAction(db, req.user.id, 'broadcast_email', null, { subject, target, sent, total: users.length });
    return res.json({ success: true, message: `Email envoyé à ${sent}/${users.length} destinataires.` });
  } catch (err) {
    console.error('[Admin] Broadcast:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  ME — profil de l'admin/modérateur connecté
// ════════════════════════════════════════════════════════════════════
router.get('/me', (req, res) => {
  try {
    const db = getDb();
    const me = db.prepare('SELECT id,nom,prenom,email,role FROM users WHERE id=?').get(req.user.id);
    return res.json({ success: true, data: { user: me } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  MODÉRATEURS — gestion des comptes modérateurs (admin uniquement)
// ════════════════════════════════════════════════════════════════════

// GET /api/admin/moderators — liste tous les modérateurs
router.get('/moderators', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const mods = db.prepare(
      "SELECT id,nom,prenom,email,status,created_at,last_login_at FROM users WHERE role='moderator' ORDER BY created_at DESC"
    ).all();
    return res.json({ success: true, data: { moderators: mods, total: mods.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/admin/moderators — crée un nouveau modérateur
router.post('/moderators', fullAdminOnly, async (req, res) => {
  try {
    const db = getDb();
    const { nom, prenom, email, password } = req.body;
    if (!nom || !prenom || !email || !password)
      return res.status(400).json({ success: false, message: 'Nom, prénom, email et mot de passe requis.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' });

    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email.trim().toLowerCase());
    if (existing) return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });

    const hash = await bcrypt.hash(password, 10);
    const info = db.prepare(`
      INSERT INTO users (nom,prenom,email,password_hash,role,status,payment_confirmed,trial_done,qualification_done,all_modules_done,final_test_passed)
      VALUES (?,?,?,?,'moderator','active',0,0,0,0,0)
    `).run(nom.trim(), prenom.trim(), email.trim().toLowerCase(), hash);

    logAdminAction(db, req.user.id, 'create_moderator', info.lastInsertRowid, { email });
    const created = db.prepare('SELECT id,nom,prenom,email,role,status,created_at FROM users WHERE id=?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, data: { moderator: created }, message: 'Modérateur créé avec succès.' });
  } catch (err) {
    console.error('[Admin] Create moderator:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// PUT /api/admin/moderators/:id — modifie un modérateur (nom, prénom, mot de passe)
router.put('/moderators/:id', fullAdminOnly, async (req, res) => {
  try {
    const db = getDb();
    const mod = db.prepare("SELECT * FROM users WHERE id=? AND role='moderator'").get(req.params.id);
    if (!mod) return res.status(404).json({ success: false, message: 'Modérateur introuvable.' });

    const { nom, prenom, password } = req.body;
    const updates = []; const params = [];
    if (nom)    { updates.push('nom=?');    params.push(nom.trim()); }
    if (prenom) { updates.push('prenom=?'); params.push(prenom.trim()); }
    if (password) {
      if (password.length < 8) return res.status(400).json({ success: false, message: 'Mot de passe trop court (8 caractères min).' });
      updates.push('password_hash=?'); params.push(await bcrypt.hash(password, 10));
    }
    if (!updates.length) return res.status(400).json({ success: false, message: 'Aucune modification.' });

    params.push(req.params.id);
    db.prepare(`UPDATE users SET ${updates.join(',')} WHERE id=?`).run(...params);
    logAdminAction(db, req.user.id, 'edit_moderator', mod.id, { fields: Object.keys(req.body) });
    return res.json({ success: true, message: 'Modérateur mis à jour.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/moderators/:id — supprime un modérateur
router.delete('/moderators/:id', fullAdminOnly, (req, res) => {
  try {
    const db = getDb();
    const mod = db.prepare("SELECT * FROM users WHERE id=? AND role='moderator'").get(req.params.id);
    if (!mod) return res.status(404).json({ success: false, message: 'Modérateur introuvable.' });

    logAdminAction(db, req.user.id, 'delete_moderator', mod.id, { email: mod.email });
    db.prepare('DELETE FROM users WHERE id=?').run(mod.id);
    return res.json({ success: true, message: `Modérateur ${mod.prenom} ${mod.nom} supprimé.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ════════════════════════════════════════════════════════════════════
//  AUDIT LOG — historique des actions sensibles admin
// ════════════════════════════════════════════════════════════════════
router.get('/audit-log', (req, res) => {
  try {
    const db = getDb();
    const logs = db.prepare(`
      SELECT l.*, a.email as admin_email, u.email as target_email, u.nom as target_nom, u.prenom as target_prenom
      FROM admin_audit_log l
      LEFT JOIN users a ON a.id = l.admin_id
      LEFT JOIN users u ON u.id = l.target_user_id
      ORDER BY l.created_at DESC LIMIT 200
    `).all();
    return res.json({ success: true, data: { logs, total: logs.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
