'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const stepGuard = require('../middleware/stepGuard');
const { generateCertificate } = require('../services/pdf');

// GET /api/certificate/my
router.get('/my', authMiddleware, stepGuard('final_passed'), (req, res) => {
  try {
    const db = getDb();
    const cert = db.prepare('SELECT * FROM certificates WHERE user_id = ?').get(req.user.id);

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificat non trouvé. Contactez le support.' });
    }

    return res.json({
      success: true,
      data: {
        certificate: {
          ...cert,
          verify_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/certificate/verify/${cert.certificate_number}`,
        },
      },
    });
  } catch (err) {
    console.error('[Certificate] My error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// GET /api/certificate/download
// - Étudiant : télécharge son propre certificat (final_passed requis)
// - Admin/Modérateur : peut télécharger n'importe quel certificat via ?cert_id=XX
router.get('/download', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const user = req.user;
    const isAdmin = ['admin', 'moderator'].includes(user.role);

    let cert, owner;

    if (isAdmin && req.query.cert_id) {
      // Admin : téléchargement par ID de certificat
      cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.query.cert_id);
      if (!cert) return res.status(404).json({ success: false, message: 'Certificat introuvable.' });
      owner = db.prepare('SELECT * FROM users WHERE id = ?').get(cert.user_id);
      if (!owner) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    } else {
      // Étudiant : vérifie qu'il a réussi le test final
      if (!user.final_test_passed) {
        return res.status(403).json({ success: false, message: 'Vous devez réussir le test final.', required_step: 'final_passed' });
      }
      cert = db.prepare('SELECT * FROM certificates WHERE user_id = ?').get(user.id);
      if (!cert) return res.status(404).json({ success: false, message: 'Certificat non trouvé.' });
      owner = user;
    }

    const certsDir = path.join(__dirname, '..', 'certificates');
    const pdfPath  = path.join(certsDir, `${cert.certificate_number}.pdf`);

    let pdfBuffer;
    if (fs.existsSync(pdfPath)) {
      pdfBuffer = fs.readFileSync(pdfPath);
    } else {
      pdfBuffer = await generateCertificate(owner, cert);
      if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
      fs.writeFileSync(pdfPath, pdfBuffer);
      db.prepare('UPDATE certificates SET pdf_path = ? WHERE id = ?').run(`certificates/${cert.certificate_number}.pdf`, cert.id);
    }

    const fileName = `Certificat_ARCADINS_${owner.prenom}_${owner.nom}_${cert.certificate_number.slice(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[Certificate] Download error:', err);
    return res.status(500).json({ success: false, message: 'Erreur lors de la génération du PDF.' });
  }
});

// GET /api/certificate/verify/:id  (PUBLIC)
router.get('/verify/:id', (req, res) => {
  try {
    const db = getDb();
    const cert = db.prepare('SELECT * FROM certificates WHERE certificate_number = ?').get(req.params.id);

    if (!cert) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Certificat introuvable ou invalide.',
      });
    }

    return res.json({
      success: true,
      valid: true,
      data: {
        certificate_number: cert.certificate_number,
        nom: cert.nom,
        prenom: cert.prenom,
        programme: cert.programme,
        score: cert.score,
        issued_at: cert.issued_at,
      },
      message: 'Certificat valide et authentique.',
    });
  } catch (err) {
    console.error('[Certificate] Verify error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
