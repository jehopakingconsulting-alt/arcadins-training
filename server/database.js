'use strict';

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'arcadins.db');

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
      modules_progress TEXT DEFAULT '{}',
      current_module INTEGER DEFAULT 1,
      all_modules_done INTEGER DEFAULT 0,
      lang TEXT DEFAULT 'fr'
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

  // Insert default admin user
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@arcadins-training.com');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('Admin2024!', 10);
    db.prepare(`
      INSERT INTO users (nom, prenom, email, password_hash, role, status, payment_confirmed, trial_done, qualification_done, all_modules_done, final_test_passed)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0)
    `).run('Admin', 'ARCADINS', 'admin@arcadins-training.com', hash, 'admin', 'active');
    console.log('[DB] Admin user created: admin@arcadins-training.com / Admin2024!');
  }

  console.log('[DB] Database initialized at', DB_PATH);
  return db;
}

module.exports = { getDb, initDatabase };
