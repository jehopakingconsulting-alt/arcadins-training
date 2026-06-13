'use strict';

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// En production (Render), la DB est sur le disque persistant monté sur /data
// En local, elle est dans le dossier server/
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'arcadins.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telephone TEXT,
      pays TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'prospect',
      status TEXT DEFAULT 'trial',
      plan TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      trial_done INTEGER DEFAULT 0,
      trial_score REAL DEFAULT 0,
      qualification_done INTEGER DEFAULT 0,
      qualification_score REAL DEFAULT 0,
      qualification_level TEXT,
      final_test_done INTEGER DEFAULT 0,
      final_test_score REAL DEFAULT 0,
      final_test_passed INTEGER DEFAULT 0,
      certificate_id TEXT,
      certificate_generated_at TEXT,
      payment_confirmed INTEGER DEFAULT 0,
      payment_plan TEXT,
      payment_date TEXT,
      payment_method TEXT,
      payment_notes TEXT,
      stripe_session_id TEXT,
      modules_progress TEXT DEFAULT '{}',
      current_module INTEGER DEFAULT 1,
      all_modules_done INTEGER DEFAULT 0,
      lang TEXT DEFAULT 'fr',
      referral_code TEXT UNIQUE,
      referred_by INTEGER
    );

    CREATE TABLE IF NOT EXISTS prospects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT NOT NULL,
      telephone TEXT,
      pays TEXT,
      source TEXT DEFAULT 'website',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      test_type TEXT NOT NULL,
      score REAL DEFAULT 0,
      passed INTEGER DEFAULT 0,
      attempt_number INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      answers TEXT DEFAULT '[]',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module_number INTEGER NOT NULL,
      status TEXT DEFAULT 'locked',
      started_at TEXT,
      completed_at TEXT,
      score REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, module_number)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      certificate_number TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      programme TEXT DEFAULT 'TEF & TCF Canada - Préparation Complète',
      score REAL DEFAULT 0,
      issued_at TEXT DEFAULT (datetime('now')),
      pdf_path TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tuteur_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module_number INTEGER NOT NULL,
      status TEXT DEFAULT 'locked',
      started_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, module_number)
    );

    CREATE TABLE IF NOT EXISTS affiliate_commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER NOT NULL,
      referred_user_id INTEGER NOT NULL,
      plan TEXT,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      paid_at TEXT,
      FOREIGN KEY (referrer_id) REFERENCES users(id),
      FOREIGN KEY (referred_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      details TEXT,
      ip TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Insert default admin settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO admin_settings (key, value) VALUES (?, ?)
  `);
  insertSetting.run('max_attempts_final', '3');
  insertSetting.run('max_attempts_trial', '1');
  insertSetting.run('passing_score_final', '70');
  insertSetting.run('passing_score_qualification', '0');
  insertSetting.run('total_modules', '14');

  // Migration : ajouter les colonnes manquantes si la DB existe déjà
  const migrations = [
    'ALTER TABLE users ADD COLUMN payment_method TEXT',
    'ALTER TABLE users ADD COLUMN payment_notes TEXT',
    'ALTER TABLE users ADD COLUMN stripe_session_id TEXT',
    'ALTER TABLE users ADD COLUMN access_expires_at TEXT',
    'ALTER TABLE users ADD COLUMN is_tuteur_candidat INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN tuteur_application TEXT',
    'ALTER TABLE users ADD COLUMN tuteur_payment_confirmed INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN tuteur_payment_date TEXT',
    'ALTER TABLE users ADD COLUMN tuteur_stripe_session_id TEXT',
    'ALTER TABLE users ADD COLUMN tuteur_current_module INTEGER DEFAULT 1',
    'ALTER TABLE users ADD COLUMN tuteur_all_modules_done INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN tuteur_test_done INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN tuteur_test_score REAL DEFAULT 0',
    'ALTER TABLE users ADD COLUMN tuteur_test_passed INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN tuteur_test_session TEXT',
    'ALTER TABLE users ADD COLUMN qualification_started_at TEXT',
    'ALTER TABLE users ADD COLUMN final_test_started_at TEXT',
    'ALTER TABLE users ADD COLUMN referral_code TEXT',
    'ALTER TABLE users ADD COLUMN referred_by INTEGER',
    'ALTER TABLE users ADD COLUMN reset_token TEXT',
    'ALTER TABLE users ADD COLUMN reset_token_expires TEXT',
    'ALTER TABLE users ADD COLUMN telephone_normalized TEXT',
    'ALTER TABLE users ADD COLUMN signup_ip TEXT',
    'ALTER TABLE users ADD COLUMN last_login_at TEXT',
    'ALTER TABLE users ADD COLUMN last_login_ip TEXT',
    'ALTER TABLE users ADD COLUMN last_login_device TEXT',
  ];
  migrations.forEach(sql => {
    try { db.prepare(sql).run(); } catch(e) { /* colonne déjà existante */ }
  });

  // Backfill : générer un code de parrainage pour les utilisateurs qui n'en ont pas
  try {
    const noCode = db.prepare('SELECT id FROM users WHERE referral_code IS NULL OR referral_code = \'\'').all();
    const setCode = db.prepare('UPDATE users SET referral_code = ? WHERE id = ?');
    noCode.forEach(u => setCode.run(generateReferralCode(db, u.id), u.id));
    if (noCode.length) {
      console.log(`[DB] Backfill referral_code pour ${noCode.length} utilisateur(s)`);
    }
  } catch (e) {
    console.error('[DB] Erreur backfill referral_code:', e.message);
  }

  // Backfill : calculer la date d'expiration pour les comptes déjà payés
  // qui n'en ont pas encore (utilisateurs payants antérieurs à cette fonctionnalité)
  try {
    const { PLAN_DURATIONS_WEEKS } = require('./routes/plans');
    const paidNoExpiry = db.prepare(`
      SELECT id, payment_plan, payment_date, created_at FROM users
      WHERE payment_confirmed = 1 AND (access_expires_at IS NULL OR access_expires_at = '')
    `).all();
    const updateExpiry = db.prepare('UPDATE users SET access_expires_at = ? WHERE id = ?');
    paidNoExpiry.forEach(u => {
      const weeks = (PLAN_DURATIONS_WEEKS && PLAN_DURATIONS_WEEKS[u.payment_plan]) || 6;
      const base = u.payment_date || u.created_at || new Date().toISOString();
      const baseDate = new Date(base.replace(' ', 'T') + (base.includes('Z') || base.includes('+') ? '' : 'Z'));
      const expiry = new Date(baseDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
      updateExpiry.run(expiry.toISOString(), u.id);
    });
    if (paidNoExpiry.length) {
      console.log(`[DB] Backfill access_expires_at pour ${paidNoExpiry.length} utilisateur(s) payant(s)`);
    }
  } catch (e) {
    console.error('[DB] Erreur backfill access_expires_at:', e.message);
  }

  // Insert default admin user (identifiants pris depuis .env — jamais codés en dur)
  const adminEmail = process.env.ADMIN_LOGIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (!existingAdmin) {
      const hash = bcrypt.hashSync(adminPassword, 10);
      const result = db.prepare(`
        INSERT INTO users (nom, prenom, email, password_hash, role, status, payment_confirmed, trial_done, qualification_done, all_modules_done, final_test_passed)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0)
      `).run('Admin', 'ARCADINS', adminEmail, hash, 'admin', 'active');
      db.prepare('UPDATE users SET referral_code = ? WHERE id = ?')
        .run(generateReferralCode(db, result.lastInsertRowid), result.lastInsertRowid);
      console.log(`[DB] Admin user created: ${adminEmail}`);
    }
  } else {
    console.warn('[DB] ADMIN_LOGIN_EMAIL / ADMIN_PASSWORD non définis dans .env — aucun compte admin créé.');
  }

  // Backfill : normaliser les numéros de téléphone existants pour la détection de doublons
  try {
    const noNorm = db.prepare("SELECT id, telephone FROM users WHERE telephone IS NOT NULL AND telephone != '' AND (telephone_normalized IS NULL OR telephone_normalized = '')").all();
    const setNorm = db.prepare('UPDATE users SET telephone_normalized = ? WHERE id = ?');
    noNorm.forEach(u => setNorm.run(normalizePhone(u.telephone), u.id));
    if (noNorm.length) {
      console.log(`[DB] Backfill telephone_normalized pour ${noNorm.length} utilisateur(s)`);
    }
  } catch (e) {
    console.error('[DB] Erreur backfill telephone_normalized:', e.message);
  }

  console.log('[DB] Database initialized at', DB_PATH);
  return db;
}

// Génère un code de parrainage unique à 8 caractères (alphanumérique majuscule)
function generateReferralCode(db, userId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (db.prepare('SELECT id FROM users WHERE referral_code = ?').get(code));
  return code;
}

// Normalise un numéro de téléphone pour la détection de doublons (chiffres uniquement,
// en ignorant un éventuel "00" ou "0" de préfixe international/local)
function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  digits = digits.replace(/^00/, '');
  if (digits.length > 9 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

// Enregistre une action sensible effectuée par un admin (traçabilité / audit)
function logAdminAction(db, adminId, action, targetUserId, details) {
  try {
    db.prepare('INSERT INTO admin_audit_log (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)')
      .run(adminId, action, targetUserId || null, details ? JSON.stringify(details) : null);
  } catch (e) {
    console.error('[DB] Erreur audit log:', e.message);
  }
}

module.exports = { getDb, initDatabase, generateReferralCode, normalizePhone, logAdminAction };
