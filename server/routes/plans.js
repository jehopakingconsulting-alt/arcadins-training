'use strict';

const express = require('express');
const router  = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const { sendPaymentConfirmation } = require('../services/email');

// ── Stripe init (lazy) ──────────────────────────────────────
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key || key.includes('YOUR_STRIPE')) {
    throw new Error('Stripe non configuré — ajoutez STRIPE_SECRET_KEY dans .env');
  }
  return require('stripe')(key);
}

// ── Catalogue forfaits ──────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    currency: 'usd',
    description: 'Idéal pour débuter votre préparation TEF/TCF',
    duration_weeks: 6,
    features: [
      'Accès aux 14 modules de formation',
      'Test de qualification inclus',
      'Test final · 1 tentative',
      'Support par email',
      'Accès 6 semaines',
    ],
    recommended: false,
  },
  {
    id: 'essential',
    name: 'Essential',
    price: 147,
    currency: 'usd',
    description: 'Le choix le plus populaire pour une préparation complète',
    duration_weeks: 6,
    features: [
      'Tout le plan Starter',
      'Test final · 2 tentatives',
      'Certificat officiel ARCADINS',
      'Support prioritaire',
      'Accès 6 semaines',
    ],
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 247,
    currency: 'usd',
    description: 'Préparez-vous avec un accompagnement personnalisé',
    duration_weeks: 6,
    features: [
      'Tout le plan Essential',
      'Test final · 3 tentatives',
      'Coaching individuel · 2h',
      'Ressources supplémentaires',
      'Accès 6 semaines',
    ],
    recommended: false,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 497,
    currency: 'usd',
    description: "L'excellence avec suivi personnalisé complet",
    duration_weeks: 8,
    features: [
      'Tout le plan Premium',
      'Test final · 6 tentatives',
      'Coaching privé · 4h',
      'Préparation orale intensive',
      'Garantie de résultat',
      'Support 24/7',
      'Accès 8 semaines',
    ],
    recommended: false,
  },
];

// ── GET /api/plans ──────────────────────────────────────────
router.get('/', (req, res) => {
  return res.json({ success: true, data: { plans: PLANS } });
});

// ── POST /api/plans/create-checkout-session ─────────────────
// Crée une session Stripe Checkout et retourne l'URL
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const db   = getDb();

    if (user.payment_confirmed === 1) {
      return res.status(400).json({ success: false, message: 'Paiement déjà confirmé.' });
    }

    const { plan } = req.body;
    const selectedPlan = PLANS.find(p => p.id === plan);
    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: 'Plan invalide.' });
    }

    const stripe      = getStripe();
    const SITE        = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const successUrl  = `${SITE}/pages/forfaits.html?payment=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl   = `${SITE}/pages/forfaits.html?payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency,
            unit_amount: selectedPlan.price * 100,   // en centimes
            product_data: {
              name: `ARCADINS Training Center — Plan ${selectedPlan.name}`,
              description: selectedPlan.description,
              images: [`${SITE}/assets/img/logo-nav.svg`],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id:  String(user.id),
        user_email: user.email,
        plan:     selectedPlan.id,
        plan_name: selectedPlan.name,
      },
      success_url: successUrl,
      cancel_url:  cancelUrl,
      locale: 'fr',
    });

    // Sauvegarde l'ID de session dans la DB pour vérification ultérieure
    db.prepare(`UPDATE users SET payment_plan = ?, stripe_session_id = ? WHERE id = ?`)
      .run(selectedPlan.id, session.id, user.id);

    return res.json({
      success: true,
      data: { url: session.url, session_id: session.id },
    });

  } catch (err) {
    console.error('[Stripe] create-checkout-session error:', err.message);
    if (err.message.includes('non configuré')) {
      return res.status(503).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Erreur serveur Stripe.' });
  }
});

// ── GET /api/plans/verify-payment?session_id=xxx ────────────
// Appelé après retour depuis Stripe pour confirmer le paiement
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

    // Vérifie que la session appartient bien à cet utilisateur
    if (session.metadata.user_id !== String(user.id)) {
      return res.status(403).json({ success: false, message: 'Session invalide.' });
    }

    // Déjà confirmé ?
    if (user.payment_confirmed === 1) {
      const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      const { password_hash, ...safeUser } = fresh;
      return res.json({ success: true, data: { user: safeUser }, message: 'Déjà activé.' });
    }

    const plan     = session.metadata.plan || 'essential';
    const planName = session.metadata.plan_name || plan;

    // Activer le compte + créer les 14 modules
    db.prepare(`
      UPDATE users
      SET payment_confirmed = 1, payment_plan = ?, payment_date = datetime('now'),
          role = 'apprenant', status = 'active',
          stripe_session_id = ?
      WHERE id = ?
    `).run(plan, session_id, user.id);

    // Créer les 14 modules si pas encore créés
    const existing = db.prepare('SELECT COUNT(*) as c FROM modules WHERE user_id = ?').get(user.id);
    if (existing.c === 0) {
      const ins = db.prepare('INSERT OR IGNORE INTO modules (user_id, module_number, status) VALUES (?, ?, ?)');
      for (let i = 1; i <= 14; i++) {
        ins.run(user.id, i, i === 1 ? 'not_started' : 'locked');
      }
    }

    const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    const { password_hash, ...safeUser } = freshUser;

    // Email de confirmation
    sendPaymentConfirmation(freshUser, planName).catch(() => {});

    return res.json({
      success: true,
      data: { user: safeUser, plan, redirect: '/pages/formation.html' },
      message: `Plan ${planName} activé avec succès ! Bienvenue dans votre formation.`,
    });

  } catch (err) {
    console.error('[Stripe] verify-payment error:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur de vérification du paiement.' });
  }
});

// ── POST /api/plans/webhook ─────────────────────────────────
// Webhook Stripe (pour production avec URL publique)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig           = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!webhookSecret || webhookSecret.includes('YOUR_WEBHOOK')) {
    // En mode test sans webhook configuré, on ignore silencieusement
    return res.json({ received: true });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe] Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session   = event.data.object;
    const userEmail = session.customer_email || session.customer_details?.email;
    const plan      = session.metadata?.plan || 'essential';
    const planName  = session.metadata?.plan_name || plan;

    if (userEmail) {
      try {
        const db = getDb();
        db.prepare(`
          UPDATE users
          SET payment_confirmed = 1, payment_plan = ?, payment_date = datetime('now'),
              role = 'apprenant', status = 'active',
              stripe_session_id = ?
          WHERE email = ?
        `).run(plan, session.id, userEmail);

        const existing = db.prepare('SELECT COUNT(*) as c FROM modules WHERE user_id = (SELECT id FROM users WHERE email = ?)').get(userEmail);
        if (existing.c === 0) {
          const userId = db.prepare('SELECT id FROM users WHERE email = ?').get(userEmail)?.id;
          if (userId) {
            const ins = db.prepare('INSERT OR IGNORE INTO modules (user_id, module_number, status) VALUES (?, ?, ?)');
            for (let i = 1; i <= 14; i++) ins.run(userId, i, i === 1 ? 'not_started' : 'locked');
          }
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(userEmail);
        if (user) sendPaymentConfirmation(user, planName).catch(() => {});

        console.log('[Stripe] ✅ Webhook: paiement confirmé pour', userEmail, '— plan', plan);
      } catch (dbErr) {
        console.error('[Stripe] Webhook DB error:', dbErr.message);
      }
    }
  }

  return res.json({ received: true });
});

// ── POST /api/plans/checkout (mode test sans Stripe) ────────
// Gardé pour les tests manuels admin
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const db   = getDb();

    if (user.payment_confirmed === 1) {
      return res.status(400).json({ success: false, message: 'Paiement déjà confirmé.' });
    }

    const { plan } = req.body;
    const selectedPlan = PLANS.find(p => p.id === plan);
    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: 'Plan invalide.' });
    }

    db.prepare(`
      UPDATE users
      SET payment_confirmed = 1, payment_plan = ?, payment_date = datetime('now'),
          role = 'apprenant', status = 'active', qualification_done = 1
      WHERE id = ?
    `).run(plan, user.id);

    const existing = db.prepare('SELECT COUNT(*) as c FROM modules WHERE user_id = ?').get(user.id);
    if (existing.c === 0) {
      const ins = db.prepare('INSERT OR IGNORE INTO modules (user_id, module_number, status) VALUES (?, ?, ?)');
      for (let i = 1; i <= 14; i++) ins.run(user.id, i, i === 1 ? 'not_started' : 'locked');
    }

    sendPaymentConfirmation(user, selectedPlan.name).catch(() => {});

    const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    const { password_hash, ...safeUser } = freshUser;

    return res.json({
      success: true,
      data: { user: safeUser, plan: selectedPlan, redirect: '/pages/formation.html' },
      message: `Plan ${selectedPlan.name} activé.`,
    });
  } catch (err) {
    console.error('[Plans] Checkout error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
