'use strict';

const nodemailer = require('nodemailer');

const SMTP_USER  = process.env.SMTP_USER  || '';
const SMTP_PASS  = process.env.SMTP_PASS  || '';
const SMTP_HOST  = process.env.SMTP_HOST  || 'smtp.hostinger.com';
const SMTP_PORT  = parseInt(process.env.SMTP_PORT || '465');
const SMTP_SEC   = process.env.SMTP_SECURE !== 'false'; // true par défaut
const FROM_NAME  = process.env.SMTP_FROM_NAME || 'ARCADINS Training Center';
const REPLY_TO   = process.env.REPLY_TO   || 'support@arcadins-training.com';
const ADMIN      = process.env.ADMIN_EMAIL || 'arcadinstrainingcenter@gmail.com';
const SITE_URL   = process.env.FRONTEND_URL || 'http://localhost:3000';

function isConfigured() {
  return !!(SMTP_USER && SMTP_PASS &&
    SMTP_USER !== 'your@gmail.com' &&
    SMTP_PASS !== 'your_app_password' &&
    SMTP_PASS !== 'VOTRE_MOT_DE_PASSE_APPLICATION_16_CARACTERES');
}

function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SEC,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
}

const FROM = `"${FROM_NAME}" <${SMTP_USER}>`;

// ── Template de base ────────────────────────────────────────────────
function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
      <!-- HEADER -->
      <tr><td style="background:linear-gradient(135deg,#0d2060,#1a3a8c);padding:28px 36px;text-align:center;">
        <div style="font-size:22px;font-weight:900;color:white;letter-spacing:2px;">🍁 ARCADINS</div>
        <div style="font-size:11px;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Training Center</div>
      </td></tr>
      <!-- BODY -->
      <tr><td style="padding:32px 36px;">
        ${content}
      </td></tr>
      <!-- FOOTER -->
      <tr><td style="background:#0d2060;padding:18px 36px;text-align:center;">
        <p style="color:#8899bb;font-size:11px;margin:0;">© ${new Date().getFullYear()} ARCADINS Training Center · Tous droits réservés</p>
        <p style="color:#5566aa;font-size:11px;margin:6px 0 0;">
          <a href="${SITE_URL}" style="color:#c9a84c;text-decoration:none;">www.arcadins-training.com</a>
          &nbsp;|&nbsp;
          <a href="mailto:${ADMIN}" style="color:#8899bb;text-decoration:none;">${ADMIN}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ── 1. Notification admin — nouveau prospect ────────────────────────
async function sendAdminNotification(prospect) {
  if (!isConfigured()) {
    console.warn('[Email] Non configuré — notif admin ignorée pour:', prospect.email);
    return;
  }
  const html = baseTemplate(`
    <h2 style="color:#0d2060;margin:0 0 6px;">📥 Nouveau prospect enregistré</h2>
    <p style="color:#6b7a99;font-size:13px;margin:0 0 24px;">${new Date().toLocaleString('fr-CA')}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr style="background:#f7f9fc;"><td style="padding:10px 14px;font-weight:700;color:#4a5568;width:40%;">Prénom Nom</td><td style="padding:10px 14px;color:#1a2340;">${prospect.prenom} ${prospect.nom}</td></tr>
      <tr>                           <td style="padding:10px 14px;font-weight:700;color:#4a5568;border-top:1px solid #f0f4f8;">Email</td><td style="padding:10px 14px;border-top:1px solid #f0f4f8;"><a href="mailto:${prospect.email}" style="color:#1a56db;">${prospect.email}</a></td></tr>
      <tr style="background:#f7f9fc;"><td style="padding:10px 14px;font-weight:700;color:#4a5568;">Téléphone</td><td style="padding:10px 14px;">${prospect.telephone || '—'}</td></tr>
      <tr>                           <td style="padding:10px 14px;font-weight:700;color:#4a5568;border-top:1px solid #f0f4f8;">Pays</td><td style="padding:10px 14px;border-top:1px solid #f0f4f8;">${prospect.pays || '—'}</td></tr>
    </table>
    <div style="margin-top:24px;padding:14px 18px;background:#fff8e1;border-left:4px solid #c9a84c;border-radius:4px;">
      <p style="margin:0;font-size:13px;color:#b8860b;">👉 Ce prospect vient de s'inscrire et démarrer son test de niveau d'essai.</p>
    </div>
    <div style="margin-top:20px;text-align:center;">
      <a href="${SITE_URL}/pages/admin/" style="display:inline-block;background:#1a56db;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
        📊 Voir le backoffice admin →
      </a>
    </div>
  `);
  try {
    await createTransporter().sendMail({
      from: FROM,
      to: ADMIN,
      replyTo: REPLY_TO,
      subject: `[ARCADINS] 📥 Nouveau prospect : ${prospect.prenom} ${prospect.nom} (${prospect.pays || '?'})`,
      html,
    });
    console.log('[Email] ✅ Notif admin envoyée pour:', prospect.email);
  } catch(err) {
    console.error('[Email] ❌ Notif admin échouée:', err.message);
  }
}

// ── 2. Confirmation d'inscription à l'utilisateur ───────────────────
async function sendWelcomeEmail(user) {
  if (!isConfigured()) return;
  const html = baseTemplate(`
    <h2 style="color:#0d2060;margin:0 0 8px;">Bienvenue, ${user.prenom} ! 🎉</h2>
    <p style="color:#6b7a99;margin:0 0 24px;font-size:14px;">Votre compte ARCADINS Training Center a été créé avec succès.</p>
    <p style="font-size:15px;color:#1a2340;line-height:1.7;">
      Vous êtes maintenant inscrit(e) sur la plateforme de préparation au <strong>TEF Canada</strong> et <strong>TCF Canada</strong>.<br><br>
      Commencez dès maintenant par votre <strong>test de niveau d'essai</strong> pour évaluer votre niveau actuel.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE_URL}/pages/essai-gratuit.html" style="display:inline-block;background:#1a56db;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
        🎯 Démarrer mon test de niveau →
      </a>
    </div>
    <p style="font-size:13px;color:#6b7a99;">Des questions ? Répondez directement à cet email, nous vous répondons sous 24h.</p>
  `);
  try {
    await createTransporter().sendMail({
      from: FROM,
      to: user.email,
      replyTo: REPLY_TO,
      bcc: ADMIN,
      subject: `[ARCADINS] Bienvenue ${user.prenom} — Votre compte est prêt 🎓`,
      html,
    });
    console.log('[Email] ✅ Email bienvenue envoyé à:', user.email);
  } catch(err) {
    console.error('[Email] ❌ Email bienvenue échoué:', err.message);
  }
}

// ── 3. Confirmation de paiement ─────────────────────────────────────
async function sendPaymentConfirmation(user, plan) {
  if (!isConfigured()) return;
  const html = baseTemplate(`
    <h2 style="color:#0d2060;margin:0 0 8px;">✅ Paiement confirmé — Accès activé !</h2>
    <p style="color:#6b7a99;margin:0 0 24px;font-size:14px;">Merci ${user.prenom}, votre inscription est complète.</p>
    <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:8px;padding:18px 22px;margin-bottom:24px;">
      <p style="margin:0;font-size:15px;color:#2e7d32;font-weight:700;">Plan souscrit : ${plan || user.payment_plan || 'Standard'}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#4a7a4a;">Votre accès aux 14 modules de formation est maintenant actif.</p>
    </div>
    <p style="font-size:15px;color:#1a2340;line-height:1.7;">Vous pouvez maintenant :</p>
    <ul style="font-size:14px;color:#1a2340;line-height:2;">
      <li>📊 Passer votre test de qualification</li>
      <li>📚 Accéder aux 14 modules de formation</li>
      <li>🏆 Obtenir votre certificat officiel ARCADINS</li>
    </ul>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE_URL}/pages/espace-membre.html" style="display:inline-block;background:#2e7d32;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
        🎓 Accéder à ma formation →
      </a>
    </div>
  `);
  try {
    await createTransporter().sendMail({
      from: FROM,
      to: user.email,
      replyTo: REPLY_TO,
      bcc: ADMIN,
      subject: `[ARCADINS] ✅ Paiement confirmé — Votre accès est activé !`,
      html,
    });
    // Notif admin aussi
    await createTransporter().sendMail({
      from: FROM,
      to: ADMIN,
      replyTo: REPLY_TO,
      subject: `[ARCADINS] 💳 Paiement confirmé : ${user.prenom} ${user.nom} — ${plan || user.payment_plan}`,
      html: baseTemplate(`
        <h2 style="color:#0d2060;">💳 Nouveau paiement confirmé</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="background:#f7f9fc;"><td style="padding:10px 14px;font-weight:700;width:40%;">Client</td><td style="padding:10px 14px;">${user.prenom} ${user.nom}</td></tr>
          <tr><td style="padding:10px 14px;font-weight:700;border-top:1px solid #f0f4f8;">Email</td><td style="padding:10px 14px;border-top:1px solid #f0f4f8;">${user.email}</td></tr>
          <tr style="background:#f7f9fc;"><td style="padding:10px 14px;font-weight:700;">Plan</td><td style="padding:10px 14px;">${plan || user.payment_plan}</td></tr>
          <tr><td style="padding:10px 14px;font-weight:700;border-top:1px solid #f0f4f8;">Pays</td><td style="padding:10px 14px;border-top:1px solid #f0f4f8;">${user.pays || '—'}</td></tr>
        </table>
      `),
    });
    console.log('[Email] ✅ Confirmation paiement envoyée à:', user.email);
  } catch(err) {
    console.error('[Email] ❌ Confirmation paiement échouée:', err.message);
  }
}

// ── 4. Certificat généré ────────────────────────────────────────────
async function sendCertificateEmail(user, certificate) {
  if (!isConfigured()) return;
  const certUrl = `${SITE_URL}/pages/mon-certificat.html`;
  const html = baseTemplate(`
    <h2 style="color:#0d2060;margin:0 0 8px;">🏆 Félicitations ${user.prenom} !</h2>
    <p style="color:#6b7a99;margin:0 0 24px;font-size:14px;">Vous avez réussi votre test final avec succès.</p>
    <div style="background:linear-gradient(135deg,#0d2060,#1a3a8c);border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="color:#c9a84c;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">ARCADINS Training Center</p>
      <p style="color:white;font-size:22px;font-weight:900;margin:0 0 6px;">${user.prenom.toUpperCase()} ${user.nom.toUpperCase()}</p>
      <p style="color:#a0b0d0;font-size:13px;margin:0 0 12px;">Programme de Tutorat en TEF &amp; TCF Canada</p>
      <p style="color:#ffd700;font-size:28px;font-weight:900;margin:0;">Score : ${Math.round(certificate.score || 0)}%</p>
      <p style="color:#8899bb;font-size:11px;margin:8px 0 0;">N° ${certificate.certificate_number}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${certUrl}" style="display:inline-block;background:#c9a84c;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
        📥 Télécharger mon certificat PDF →
      </a>
    </div>
    <p style="font-size:13px;color:#6b7a99;text-align:center;">Votre certificat peut être vérifié en ligne par tout employeur ou institution.</p>
  `);
  try {
    await createTransporter().sendMail({
      from: FROM,
      to: user.email,
      replyTo: REPLY_TO,
      bcc: ADMIN,
      subject: `[ARCADINS] 🏆 Votre certificat officiel est prêt — Score : ${Math.round(certificate.score || 0)}%`,
      html,
    });
    console.log('[Email] ✅ Certificat envoyé à:', user.email);
  } catch(err) {
    console.error('[Email] ❌ Envoi certificat échoué:', err.message);
  }
}

// ── 5. Email libre (admin → utilisateur) ───────────────────────────
async function sendUserEmail(to, subject, htmlContent) {
  if (!isConfigured()) {
    console.warn('[Email] Non configuré — email ignoré pour:', to);
    return;
  }
  try {
    await createTransporter().sendMail({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      bcc: ADMIN,
      subject,
      html: baseTemplate(htmlContent),
    });
    console.log('[Email] ✅ Email envoyé à:', to);
  } catch(err) {
    console.error('[Email] ❌ Envoi échoué à', to, ':', err.message);
  }
}

// ── 6. Test de connexion SMTP ───────────────────────────────────────
async function testConnection() {
  if (!isConfigured()) {
    return { ok: false, message: 'SMTP non configuré dans le .env' };
  }
  try {
    await createTransporter().verify();
    return { ok: true, message: `Connexion SMTP OK — ${SMTP_USER}` };
  } catch(err) {
    return { ok: false, message: err.message };
  }
}

module.exports = {
  sendAdminNotification,
  sendWelcomeEmail,
  sendPaymentConfirmation,
  sendCertificateEmail,
  sendUserEmail,
  testConnection,
  isConfigured,
};
