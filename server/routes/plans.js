'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const { sendUserEmail, sendAdminNotification } = require('../services/email');

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    currency: 'USD',
    description: 'Idéal pour débuter votre préparation TEF/TCF',
    features: [
      'Accès aux 14 modules de formation',
      'Test de qualification inclus',
      'Test final (1 tentative)',
      'Support par email',
    ],
    recommended: false,
  },
  {
    id: 'essential',
    name: 'Essential',
    price: 147,
    currency: 'USD',
    description: 'Le choix le plus populaire pour une préparation complète',
    features: [
      'Tout le plan Starter',
      'Test final (2 tentatives)',
      'Certificat officiel ARCADINS',
      'Support prioritaire',
      'Accès 6 mois',
    ],
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 247,
    currency: 'USD',
    description: 'Préparez-vous avec un accompagnement personnalisé',
    features: [
      'Tout le plan Essential',
      'Test final (3 tentatives)',
      'Sessions de coaching individuel (2h)',
      'Ressources supplémentaires',
      'Accès à vie',
    ],
    recommended: false,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 497,
    currency: 'USD',
    description: 'L\'excellence avec suivi personnalisé complet',
    features: [
      'Tout le plan Premium',
      'Tentatives illimitées au test final',
      'Coaching illimité (3 mois)',
      'Préparation orale intensive',
      'Garantie de résultat',
      'Support 24/7',
    ],
    recommended: false,
  },
];

// GET /api/plans
router.get('/', (req, res) => {
  return res.json({ success: true, data: { plans: PLANS } });
});

// POST /api/plans/checkout (simulated payment)
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const db = getDb();

    if (user.payment_confirmed === 1) {
      return res.status(400).json({ success: false, message: 'Paiement déjà confirmé.' });
    }

    const { plan } = req.body;
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Plan non spécifié.' });
    }

    const selectedPlan = PLANS.find((p) => p.id === plan);
    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: 'Plan invalide.' });
    }

    // Simulate payment success
    db.prepare(`
      UPDATE users
      SET payment_confirmed = 1, payment_plan = ?, payment_date = datetime('now'), role = 'apprenant', status = 'active'
      WHERE id = ?
    `).run(plan, user.id);

    // Send confirmation email to user
    const emailHtml = `
      <h2 style="color: #1a2a6c;">Paiement confirmé ! 🎉</h2>
      <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
      <p>Votre paiement pour le plan <strong>${selectedPlan.name}</strong> (${selectedPlan.price} ${selectedPlan.currency}) a été confirmé avec succès.</p>
      <p>Vous pouvez maintenant accéder à votre test de qualification pour commencer votre formation.</p>
      <div style="margin: 20px 0; padding: 15px; background: #f0f4ff; border-left: 4px solid #1a2a6c; border-radius: 4px;">
        <strong>Plan souscrit :</strong> ${selectedPlan.name}<br>
        <strong>Montant :</strong> ${selectedPlan.price} ${selectedPlan.currency}<br>
        <strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}
      </div>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/qualification" style="display:inline-block;padding:12px 24px;background:#1a2a6c;color:white;text-decoration:none;border-radius:6px;margin-top:10px;">
        Commencer ma qualification →
      </a>
    `;

    sendUserEmail(user.email, `[ARCADINS] Confirmation de paiement – Plan ${selectedPlan.name}`, emailHtml).catch(() => {});
    sendAdminNotification({ nom: user.nom, prenom: user.prenom, email: user.email, telephone: user.telephone, pays: user.pays }).catch(() => {});

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    const { password_hash, ...safeUser } = updatedUser;

    return res.json({
      success: true,
      data: { user: safeUser, plan: selectedPlan, redirect: '/qualification' },
      message: `Paiement confirmé ! Plan ${selectedPlan.name} activé.`,
    });
  } catch (err) {
    console.error('[Plans] Checkout error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/plans/stripe-webhook
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('[Stripe] Webhook signature verification failed:', err.message);
      return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.customer_email || (session.customer_details && session.customer_details.email);
      const plan = session.metadata && session.metadata.plan;

      if (userEmail) {
        const db = getDb();
        db.prepare(`
          UPDATE users SET payment_confirmed = 1, payment_plan = ?, payment_date = datetime('now'), role = 'apprenant', status = 'active'
          WHERE email = ?
        `).run(plan || 'essential', userEmail);
        console.log('[Stripe] Payment confirmed for:', userEmail);
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[Stripe] Webhook error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
