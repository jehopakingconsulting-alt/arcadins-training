'use strict';

const express = require('express');
const router  = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

// ── GET /api/affiliate/me ────────────────────────────────────
// Retourne le code de parrainage, le lien, et les statistiques de commissions
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db   = getDb();
    const user = req.user;

    const referred = db.prepare(`
      SELECT id, nom, prenom, created_at, payment_confirmed, payment_plan
      FROM users WHERE referred_by = ?
      ORDER BY created_at DESC
    `).all(user.id);

    const commissions = db.prepare(`
      SELECT ac.id, ac.referred_user_id, ac.plan, ac.amount, ac.status, ac.created_at, ac.paid_at,
             u.nom, u.prenom
      FROM affiliate_commissions ac
      JOIN users u ON u.id = ac.referred_user_id
      WHERE ac.referrer_id = ?
      ORDER BY ac.created_at DESC
    `).all(user.id);

    const totals = commissions.reduce((acc, c) => {
      acc.total += c.amount;
      if (c.status === 'paid') acc.paid += c.amount;
      else acc.pending += c.amount;
      return acc;
    }, { total: 0, pending: 0, paid: 0 });

    return res.json({
      success: true,
      data: {
        referral_code: user.referral_code,
        referred_count: referred.length,
        referred,
        commissions,
        totals,
      },
    });
  } catch (err) {
    console.error('[Affiliate] /me error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
