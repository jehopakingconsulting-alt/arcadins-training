'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { getDb, generateReferralCode, normalizePhone } = require('../database');
const authMiddleware = require('../middleware/auth');
const { sendAdminNotification, sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email');
const { isAccessExpired } = require('../middleware/stepGuard');

// Limite les tentatives de connexion/inscription pour freiner le brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' },
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'changeme_super_secret_jwt_key_arcadins_2024',
    { expiresIn: '30d' }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /api/access/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { nom, prenom, email, telephone, pays, password, lang, ref } = req.body;

    // Validate required fields
    if (!nom || !prenom || !email || !telephone || !pays) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis: nom, prenom, email, telephone, pays.',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Format email invalide.' });
    }

    // Validate phone
    if (telephone.replace(/\D/g, '').length < 7) {
      return res.status(400).json({ success: false, message: 'Numéro de téléphone invalide (minimum 7 chiffres).' });
    }

    const db = getDb();
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
    const userAgent = req.headers['user-agent'] || null;
    const phoneNormalized = normalizePhone(telephone);

    // Check if email already exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      // If they have a password and match, allow re-login
      if (password && existing.password_hash && bcrypt.compareSync(password, existing.password_hash)) {
        const token = signToken(existing);
        db.prepare('UPDATE users SET last_login_at = ?, last_login_ip = ?, last_login_device = ? WHERE id = ?')
          .run(new Date().toISOString(), clientIp, userAgent, existing.id);
        return res.json({ success: true, token, user: sanitizeUser(existing), message: 'Reconnexion réussie.' });
      }
      // Return existing token for prospect re-entry (uniquement si aucun
      // mot de passe n'a encore été défini sur ce compte, sinon n'importe
      // qui connaissant l'email pourrait usurper le compte sans mot de passe)
      if (!existing.password_hash && (existing.role === 'prospect' || existing.trial_done === 0)) {
        const token = signToken(existing);
        db.prepare('UPDATE users SET last_login_at = ?, last_login_ip = ?, last_login_device = ? WHERE id = ?')
          .run(new Date().toISOString(), clientIp, userAgent, existing.id);
        return res.json({ success: true, token, user: sanitizeUser(existing), message: 'Compte existant récupéré.' });
      }
      return res.status(409).json({ success: false, message: 'Un compte existe déjà avec cet email. Veuillez vous connecter.' });
    }

    // Un seul compte par numéro de téléphone
    if (phoneNormalized) {
      const existingPhone = db.prepare('SELECT id FROM users WHERE telephone_normalized = ?').get(phoneNormalized);
      if (existingPhone) {
        return res.status(409).json({ success: false, message: 'Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter.' });
      }
    }

    // Hash password if provided
    let password_hash = null;
    if (password) {
      password_hash = bcrypt.hashSync(password, 10);
    }

    // Programme de parrainage : retrouver le parrain via son code d'affiliation
    let referredBy = null;
    if (ref) {
      const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(String(ref).trim().toUpperCase());
      if (referrer) referredBy = referrer.id;
    }

    // Create user
    const result = db.prepare(`
      INSERT INTO users (nom, prenom, email, telephone, telephone_normalized, pays, password_hash, role, status, lang, referred_by, signup_ip, last_login_at, last_login_ip, last_login_device)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'prospect', 'trial', ?, ?, ?, ?, ?, ?)
    `).run(
      nom.trim(), prenom.trim(), email.toLowerCase().trim(),
      telephone.trim(), phoneNormalized, pays.trim(), password_hash,
      lang || 'fr', referredBy, clientIp, new Date().toISOString(), clientIp, userAgent
    );

    const userId = result.lastInsertRowid;

    // Générer le code de parrainage du nouvel utilisateur
    db.prepare('UPDATE users SET referral_code = ? WHERE id = ?')
      .run(generateReferralCode(db, userId), userId);

    // Insert into prospects table
    db.prepare(`
      INSERT INTO prospects (nom, prenom, email, telephone, pays, source)
      VALUES (?, ?, ?, ?, ?, 'website')
    `).run(nom.trim(), prenom.trim(), email.toLowerCase().trim(), telephone.trim(), pays.trim());

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    // Send admin notification (async, don't block)
    sendAdminNotification({ nom: nom.trim(), prenom: prenom.trim(), email: email.toLowerCase().trim(), telephone, pays }).catch(() => {});
    sendWelcomeEmail({ prenom: prenom.trim(), nom: nom.trim(), email: email.toLowerCase().trim() }).catch(() => {});

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: 'Inscription réussie. Bienvenue chez ARCADINS!',
    });
  } catch (err) {
    console.error('[Access] Register error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur. Veuillez réessayer.' });
  }
});

// POST /api/access/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ success: false, message: 'Aucun mot de passe défini. Utilisez le formulaire d\'inscription.' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
    const userAgent = req.headers['user-agent'] || null;
    db.prepare('UPDATE users SET last_login_at = ?, last_login_ip = ?, last_login_device = ? WHERE id = ?')
      .run(new Date().toISOString(), clientIp, userAgent, user.id);
    user.last_login_at = new Date().toISOString();
    user.last_login_ip = clientIp;
    user.last_login_device = userAgent;

    const token = signToken(user);

    // Determine redirect based on user status
    let redirect = '/';
    if (!user.trial_done) redirect = '/test-positionnement';
    else if (!user.payment_confirmed) redirect = '/plans';
    else if (!user.qualification_done) redirect = '/qualification';
    else if (!user.all_modules_done) redirect = '/formation';
    else if (!user.final_test_passed) redirect = '/test-final';
    else redirect = '/certificat';

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      redirect,
      message: 'Connexion réussie.',
    });
  } catch (err) {
    console.error('[Access] Login error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/access/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const genericMessage = 'Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.';

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

    // Réponse identique que le compte existe ou non, pour éviter l'énumération d'emails
    if (!user) {
      return res.json({ success: true, message: genericMessage });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
      .run(token, expires, user.id);

    // Priorité : domaine custom → FRONTEND_URL → localhost
    const SITE = process.env.CUSTOM_DOMAIN || process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const resetLink = `${SITE}/pages/reinitialiser-mot-de-passe.html?token=${token}`;

    try {
      await sendPasswordResetEmail(user, resetLink);
    } catch (emailErr) {
      console.error('[Access] Forgot-password email failed:', emailErr.message);
      return res.status(500).json({ success: false, message: 'Impossible d\'envoyer l\'email. Veuillez réessayer ou contacter le support.' });
    }

    return res.json({ success: true, message: genericMessage });
  } catch (err) {
    console.error('[Access] Forgot-password error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/access/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token et mot de passe requis.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);

    if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Lien de réinitialisation invalide ou expiré.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
      .run(password_hash, user.id);

    return res.json({ success: true, message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    console.error('[Access] Reset-password error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// PUT /api/access/profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { nom, prenom, telephone, pays, lang } = req.body;
    const db = getDb();

    const fields = [];
    const values = [];
    if (nom !== undefined) { fields.push('nom = ?'); values.push(String(nom).trim()); }
    if (prenom !== undefined) { fields.push('prenom = ?'); values.push(String(prenom).trim()); }
    if (telephone !== undefined) {
      if (String(telephone).replace(/\D/g, '').length < 7) {
        return res.status(400).json({ success: false, message: 'Numéro de téléphone invalide (minimum 7 chiffres).' });
      }
      const phoneNormalized = normalizePhone(telephone);
      const existingPhone = db.prepare('SELECT id FROM users WHERE telephone_normalized = ? AND id != ?').get(phoneNormalized, req.user.id);
      if (existingPhone) {
        return res.status(409).json({ success: false, message: 'Un compte existe déjà avec ce numéro de téléphone.' });
      }
      fields.push('telephone = ?'); values.push(String(telephone).trim());
      fields.push('telephone_normalized = ?'); values.push(phoneNormalized);
    }
    if (pays !== undefined) { fields.push('pays = ?'); values.push(String(pays).trim()); }
    if (lang !== undefined) { fields.push('lang = ?'); values.push(String(lang).trim()); }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour.' });
    }

    values.push(req.user.id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({ success: true, user: sanitizeUser(user), message: 'Profil mis à jour avec succès.' });
  } catch (err) {
    console.error('[Access] Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// PUT /api/access/password
router.put('/password', authMiddleware, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel et nouveau mot de passe requis.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!user.password_hash || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect.' });
    }

    const password_hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, req.user.id);

    return res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error('[Access] Change password error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// GET /api/access/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = sanitizeUser(req.user);
    const expired = isAccessExpired(req.user);
    user.access_expired = expired;

    // Determine next step
    let nextStep = null;
    if (!user.trial_done) nextStep = 'trial';
    else if (!user.payment_confirmed) nextStep = 'plans';
    else if (expired) nextStep = 'renew';
    else if (!user.qualification_done) nextStep = 'qualification';
    else if (!user.all_modules_done) nextStep = 'modules';
    else if (!user.final_test_passed) nextStep = 'final_test';
    else nextStep = 'certificate';

    return res.json({ success: true, user, next_step: nextStep });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
