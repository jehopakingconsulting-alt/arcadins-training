'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, generateReferralCode } = require('../database');
const authMiddleware = require('../middleware/auth');
const { sendAdminNotification, sendWelcomeEmail } = require('../services/email');
const { isAccessExpired } = require('../middleware/stepGuard');

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
router.post('/register', async (req, res) => {
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

    // Check if email already exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      // If they have a password and match, allow re-login
      if (password && existing.password_hash && bcrypt.compareSync(password, existing.password_hash)) {
        const token = signToken(existing);
        return res.json({ success: true, token, user: sanitizeUser(existing), message: 'Reconnexion réussie.' });
      }
      // Return existing token for prospect re-entry
      if (existing.role === 'prospect' || existing.trial_done === 0) {
        const token = signToken(existing);
        return res.json({ success: true, token, user: sanitizeUser(existing), message: 'Compte existant récupéré.' });
      }
      return res.status(409).json({ success: false, message: 'Un compte existe déjà avec cet email. Veuillez vous connecter.' });
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
      INSERT INTO users (nom, prenom, email, telephone, pays, password_hash, role, status, lang, referred_by)
      VALUES (?, ?, ?, ?, ?, ?, 'prospect', 'trial', ?, ?)
    `).run(
      nom.trim(), prenom.trim(), email.toLowerCase().trim(),
      telephone.trim(), pays.trim(), password_hash,
      lang || 'fr', referredBy
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
router.post('/login', async (req, res) => {
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
