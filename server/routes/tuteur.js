'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const { sendAdminNotification } = require('../services/email');

const TUTEUR_FEE = { amount: 100, currency: 'cad', label: 'Frais de dossier — Devenir Tuteur ARCADINS' };
const TOTAL_TUTEUR_MODULES = 5;
const TEST_PASSING_SCORE = 22;
const TEST_TOTAL_QUESTIONS = 30;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key || key.includes('YOUR_STRIPE')) {
    throw new Error('Stripe non configuré — ajoutez STRIPE_SECRET_KEY dans .env');
  }
  return require('stripe')(key);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'changeme_super_secret_jwt_key_arcadins_2024',
    { expiresIn: '30d' }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  if (safe.tuteur_application) {
    try { safe.tuteur_application = JSON.parse(safe.tuteur_application); } catch (e) { /* ignore */ }
  }
  return safe;
}

// ── POST /api/tuteur/postuler ───────────────────────────────
// Crée (ou met à jour) un compte candidat tuteur à partir du formulaire
router.post('/postuler', async (req, res) => {
  try {
    const { nom, email, telephone, pays, password, application, lang } = req.body;

    if (!nom || !email || !telephone || !pays) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis: nom, email, téléphone, pays.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Format email invalide.' });
    }

    const db = getDb();
    const emailNorm = email.toLowerCase().trim();
    const appJson = JSON.stringify(application || {});

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailNorm);

    if (user) {
      db.prepare(`
        UPDATE users
        SET is_tuteur_candidat = 1, tuteur_application = ?, nom = ?, telephone = ?, pays = ?
        WHERE id = ?
      `).run(appJson, nom.trim(), telephone.trim(), pays.trim(), user.id);

      if (password && !user.password_hash) {
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), user.id);
      }
    } else {
      const password_hash = password ? bcrypt.hashSync(password, 10) : null;
      const result = db.prepare(`
        INSERT INTO users (nom, prenom, email, telephone, pays, password_hash, role, status, lang, is_tuteur_candidat, tuteur_application)
        VALUES (?, '', ?, ?, ?, ?, 'tuteur_candidat', 'trial', ?, 1, ?)
      `).run(nom.trim(), emailNorm, telephone.trim(), pays.trim(), password_hash, lang || 'fr', appJson);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    const token = signToken(user);

    sendAdminNotification({
      nom: nom.trim(), prenom: '', email: emailNorm, telephone: telephone.trim(), pays: pays.trim(),
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: 'Candidature enregistrée. Direction le paiement des frais de dossier.',
    });
  } catch (err) {
    console.error('[Tuteur] postuler error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur. Veuillez réessayer.' });
  }
});

// ── POST /api/tuteur/create-checkout-session ────────────────
// Crée une session Stripe Checkout pour les frais de dossier (100 CAD)
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (user.tuteur_payment_confirmed === 1) {
      return res.status(400).json({ success: false, message: 'Frais de dossier déjà payés.' });
    }

    const stripe     = getStripe();
    const SITE       = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const successUrl = `${SITE}/pages/tuteur.html?tuteur_payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${SITE}/pages/tuteur.html?tuteur_payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: TUTEUR_FEE.currency,
            unit_amount: TUTEUR_FEE.amount * 100,
            product_data: {
              name: 'ARCADINS Training Center — Frais de dossier Tuteur',
              description: 'Frais d\'ouverture de dossier candidature Tuteur ARCADINS (100 CAD)',
              images: [`${SITE}/assets/img/logo-nav.svg`],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: String(user.id),
        user_email: user.email,
        type: 'tuteur_frais_dossier',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: 'fr',
    });

    const db = getDb();
    db.prepare('UPDATE users SET tuteur_stripe_session_id = ? WHERE id = ?').run(session.id, user.id);

    return res.json({ success: true, data: { url: session.url, session_id: session.id } });
  } catch (err) {
    console.error('[Tuteur][Stripe] create-checkout-session error:', err.message);
    if (err.message.includes('non configuré')) {
      return res.status(503).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Erreur serveur Stripe.' });
  }
});

// ── GET /api/tuteur/verify-payment?session_id=xxx ───────────
router.get('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ success: false, message: 'session_id manquant.' });
    }

    const stripe  = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ success: false, message: 'Paiement non complété.' });
    }

    const db   = getDb();
    const user = req.user;

    if (session.metadata.user_id !== String(user.id)) {
      return res.status(403).json({ success: false, message: 'Session invalide.' });
    }

    if (user.tuteur_payment_confirmed === 1 && user.tuteur_stripe_session_id === session_id) {
      const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      return res.json({ success: true, data: { user: sanitizeUser(fresh) }, message: 'Déjà activé.' });
    }

    db.prepare(`
      UPDATE users
      SET tuteur_payment_confirmed = 1, tuteur_payment_date = datetime('now'), tuteur_stripe_session_id = ?
      WHERE id = ?
    `).run(session_id, user.id);

    // Créer les modules de formation tuteur si pas encore créés
    const existing = db.prepare('SELECT COUNT(*) as c FROM tuteur_modules WHERE user_id = ?').get(user.id);
    if (existing.c === 0) {
      const ins = db.prepare('INSERT OR IGNORE INTO tuteur_modules (user_id, module_number, status) VALUES (?, ?, ?)');
      for (let i = 1; i <= TOTAL_TUTEUR_MODULES; i++) {
        ins.run(user.id, i, i === 1 ? 'not_started' : 'locked');
      }
    }

    const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

    return res.json({
      success: true,
      data: { user: sanitizeUser(freshUser), redirect: '/pages/tuteur-espace.html' },
      message: 'Frais de dossier réglés ! Accès à la formation tuteur débloqué.',
    });
  } catch (err) {
    console.error('[Tuteur][Stripe] verify-payment error:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur de vérification du paiement.' });
  }
});

// ── POST /api/tuteur/webhook ─────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig           = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!webhookSecret || webhookSecret.includes('YOUR_WEBHOOK')) {
    return res.json({ received: true });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[Tuteur][Stripe] Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.metadata?.type === 'tuteur_frais_dossier') {
      const userEmail = session.customer_email || session.customer_details?.email;
      if (userEmail) {
        try {
          const db = getDb();
          db.prepare(`
            UPDATE users
            SET tuteur_payment_confirmed = 1, tuteur_payment_date = datetime('now'), tuteur_stripe_session_id = ?
            WHERE email = ?
          `).run(session.id, userEmail);

          const user = db.prepare('SELECT id FROM users WHERE email = ?').get(userEmail);
          if (user) {
            const existing = db.prepare('SELECT COUNT(*) as c FROM tuteur_modules WHERE user_id = ?').get(user.id);
            if (existing.c === 0) {
              const ins = db.prepare('INSERT OR IGNORE INTO tuteur_modules (user_id, module_number, status) VALUES (?, ?, ?)');
              for (let i = 1; i <= TOTAL_TUTEUR_MODULES; i++) ins.run(user.id, i, i === 1 ? 'not_started' : 'locked');
            }
          }
          console.log('[Tuteur][Stripe] ✅ Webhook: frais de dossier confirmés pour', userEmail);
        } catch (dbErr) {
          console.error('[Tuteur][Stripe] Webhook DB error:', dbErr.message);
        }
      }
    }
  }

  return res.json({ received: true });
});

// ── Middleware: requiert le paiement des frais de dossier ───
function requireTuteurPayment(req, res, next) {
  if (req.user.tuteur_payment_confirmed !== 1) {
    return res.status(403).json({ success: false, message: 'Frais de dossier non réglés.', required_step: 'tuteur_payment' });
  }
  next();
}

// ── GET /api/tuteur/modules ──────────────────────────────────
router.get('/modules', authMiddleware, requireTuteurPayment, (req, res) => {
  try {
    const db = getDb();
    const modules = db.prepare('SELECT module_number, status, started_at, completed_at FROM tuteur_modules WHERE user_id = ? ORDER BY module_number').all(req.user.id);
    return res.json({
      success: true,
      data: {
        modules,
        total: TOTAL_TUTEUR_MODULES,
        all_done: req.user.tuteur_all_modules_done === 1,
        current_module: req.user.tuteur_current_module,
      },
    });
  } catch (err) {
    console.error('[Tuteur] modules error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ── POST /api/tuteur/modules/:num/complete ───────────────────
router.post('/modules/:num/complete', authMiddleware, requireTuteurPayment, (req, res) => {
  try {
    const moduleNum = parseInt(req.params.num, 10);
    if (!moduleNum || moduleNum < 1 || moduleNum > TOTAL_TUTEUR_MODULES) {
      return res.status(400).json({ success: false, message: 'Module invalide.' });
    }

    const db = getDb();
    const mod = db.prepare('SELECT * FROM tuteur_modules WHERE user_id = ? AND module_number = ?').get(req.user.id, moduleNum);
    if (!mod || mod.status === 'locked') {
      return res.status(403).json({ success: false, message: 'Module verrouillé.' });
    }

    db.prepare(`UPDATE tuteur_modules SET status = 'completed', completed_at = datetime('now') WHERE user_id = ? AND module_number = ?`)
      .run(req.user.id, moduleNum);

    // Déverrouille le module suivant
    if (moduleNum < TOTAL_TUTEUR_MODULES) {
      db.prepare(`UPDATE tuteur_modules SET status = 'not_started' WHERE user_id = ? AND module_number = ? AND status = 'locked'`)
        .run(req.user.id, moduleNum + 1);
      db.prepare('UPDATE users SET tuteur_current_module = ? WHERE id = ?').run(moduleNum + 1, req.user.id);
    } else {
      db.prepare('UPDATE users SET tuteur_all_modules_done = 1 WHERE id = ?').run(req.user.id);
    }

    const modules = db.prepare('SELECT module_number, status, started_at, completed_at FROM tuteur_modules WHERE user_id = ? ORDER BY module_number').all(req.user.id);
    const allDone = moduleNum === TOTAL_TUTEUR_MODULES;

    return res.json({ success: true, data: { modules, all_done: allDone } });
  } catch (err) {
    console.error('[Tuteur] module complete error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ── POST /api/tuteur/test/submit ─────────────────────────────
// Le test (30 questions, banque côté client) est corrigé côté client ;
// ce endpoint enregistre le résultat côté serveur après les modules complétés.
router.post('/test/submit', authMiddleware, requireTuteurPayment, (req, res) => {
  try {
    if (req.user.tuteur_all_modules_done !== 1) {
      return res.status(403).json({ success: false, message: 'Veuillez terminer tous les modules de formation avant le test d\'habilitation.' });
    }

    const { score } = req.body;
    const numericScore = parseInt(score, 10);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > TEST_TOTAL_QUESTIONS) {
      return res.status(400).json({ success: false, message: 'Score invalide.' });
    }

    const passed = numericScore >= TEST_PASSING_SCORE;
    const db = getDb();
    db.prepare(`
      UPDATE users
      SET tuteur_test_done = 1, tuteur_test_score = ?, tuteur_test_passed = ?
      WHERE id = ?
    `).run(numericScore, passed ? 1 : 0, req.user.id);

    return res.json({
      success: true,
      data: {
        score: numericScore,
        total: TEST_TOTAL_QUESTIONS,
        passing_score: TEST_PASSING_SCORE,
        passed,
      },
      message: passed
        ? 'Félicitations ! Vous avez réussi le test d\'habilitation tuteur.'
        : 'Score insuffisant. Vous pouvez retenter le test.',
    });
  } catch (err) {
    console.error('[Tuteur] test submit error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
module.exports.TUTEUR_FEE = TUTEUR_FEE;
module.exports.TOTAL_TUTEUR_MODULES = TOTAL_TUTEUR_MODULES;
