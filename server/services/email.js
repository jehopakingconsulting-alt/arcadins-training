'use strict';

const nodemailer = require('nodemailer');

function isConfigured() {
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  return !!user && !!pass && user !== 'your@gmail.com' && pass !== 'your_app_password';
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    tls: { rejectUnauthorized: false },
  });
}

async function sendAdminNotification(prospect) {
  if (!isConfigured()) {
    console.warn('[Email] SMTP non configuré — notification admin ignorée pour:', prospect.email);
    return;
  }
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@arcadins-training.com';
  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a2a6c, #b21f1f); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">ARCADINS Training Center</h1>
        <p style="color: #ffd700; margin: 5px 0;">Nouveau Prospect Inscrit</p>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1a2a6c;">Nouveau prospect enregistré</h2>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Nom :</td><td style="padding: 8px;">${prospect.nom} ${prospect.prenom}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Email :</td><td style="padding: 8px;"><a href="mailto:${prospect.email}">${prospect.email}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Téléphone :</td><td style="padding: 8px;">${prospect.telephone || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Pays :</td><td style="padding: 8px;">${prospect.pays || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Date :</td><td style="padding: 8px;">${new Date().toLocaleString('fr-FR')}</td></tr>
        </table>
        <p style="margin-top: 20px; color: #777; font-size: 13px;">Ce prospect a démarré le test de positionnement.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"ARCADINS System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[ARCADINS] Nouveau prospect: ${prospect.prenom} ${prospect.nom}`,
      html,
    });
    console.log('[Email] Admin notification sent for:', prospect.email);
  } catch (err) {
    console.error('[Email] Failed to send admin notification:', err.message);
  }
}

async function sendUserEmail(to, subject, htmlContent) {
  if (!isConfigured()) {
    console.warn('[Email] SMTP non configuré — email utilisateur ignoré pour:', to);
    return;
  }
  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: `"ARCADINS Training Center" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a2a6c, #b21f1f); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ARCADINS Training Center</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            ${htmlContent}
          </div>
          <div style="padding: 15px; background: #1a2a6c; text-align: center;">
            <p style="color: #aaa; font-size: 12px; margin: 0;">© 2024 ARCADINS Training Center. Tous droits réservés.</p>
          </div>
        </div>
      `,
    });
    console.log('[Email] Email sent to:', to, '| Subject:', subject);
  } catch (err) {
    console.error('[Email] Failed to send email to', to, ':', err.message);
  }
}

module.exports = { sendAdminNotification, sendUserEmail };
