'use strict';

const express = require('express');
const router  = express.Router();
const { getDb } = require('../database');
const { sendUserEmail, sendAdminNotification } = require('../services/email');

const ADMIN = process.env.ADMIN_EMAIL || 'arcadinstrainingcenter@gmail.com';

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { nom, email, sujet, message, telephone } = req.body;
    if (!nom || !email || !message) {
      return res.status(400).json({ success: false, message: 'Nom, email et message sont requis.' });
    }

    // Email à l'admin
    const adminHtml = `
      <h2 style="color:#074A2E;">📬 Nouveau message de contact</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="background:#f7f9fc;"><td style="padding:10px 14px;font-weight:700;width:35%;">Nom</td><td style="padding:10px 14px;">${nom}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:700;border-top:1px solid #eef3f0;">Email</td><td style="padding:10px 14px;border-top:1px solid #eef3f0;"><a href="mailto:${email}">${email}</a></td></tr>
        ${telephone ? `<tr style="background:#f7f9fc;"><td style="padding:10px 14px;font-weight:700;">Téléphone</td><td style="padding:10px 14px;">${telephone}</td></tr>` : ''}
        ${sujet ? `<tr><td style="padding:10px 14px;font-weight:700;border-top:1px solid #eef3f0;">Sujet</td><td style="padding:10px 14px;border-top:1px solid #eef3f0;">${sujet}</td></tr>` : ''}
        <tr style="background:#f7f9fc;"><td style="padding:10px 14px;font-weight:700;">Message</td><td style="padding:10px 14px;white-space:pre-wrap;">${message}</td></tr>
      </table>`;

    await sendUserEmail(
      ADMIN,
      `[ARCADINS Contact] ${sujet || 'Nouveau message'} — ${nom}`,
      adminHtml
    );

    // Email de confirmation à l'expéditeur
    const confirmHtml = `
      <h2 style="color:#074A2E;">Merci pour votre message, ${nom} ! ✅</h2>
      <p style="color:#5d7a6e;">Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais (généralement sous 24h).</p>
      <div style="background:#eaf7f0;border-left:4px solid #0B5D3B;border-radius:6px;padding:16px 18px;margin:20px 0;font-size:.9rem;color:#1a2e28;">
        <strong>Votre message :</strong><br/><br/>
        <em>${message}</em>
      </div>
      <p style="font-size:.85rem;color:#5d7a6e;">Pour toute urgence, contactez-nous directement sur WhatsApp : <strong>+1 514-451-3436</strong></p>`;

    sendUserEmail(email, `[ARCADINS] Votre message a bien été reçu`, confirmHtml).catch(() => {});

    return res.json({ success: true, message: 'Message envoyé avec succès. Nous vous répondrons sous 24h.' });
  } catch (err) {
    console.error('[Contact] Error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur. Veuillez réessayer.' });
  }
});

module.exports = router;
