'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const CERTS_DIR = path.join(__dirname, '..', 'certificates');

function ensureCertsDir() {
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
  }
}

function generateCertificate(user, certificate) {
  return new Promise((resolve, reject) => {
    ensureCertsDir();

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = doc.page.width;   // 841.89
    const H = doc.page.height;  // 595.28

    // === BACKGROUND ===
    doc.rect(0, 0, W, H).fill('#0a0e2a');

    // Gold border outer
    doc.rect(15, 15, W - 30, H - 30).lineWidth(3).stroke('#c9a84c');
    // Gold border inner
    doc.rect(25, 25, W - 50, H - 50).lineWidth(1).stroke('#c9a84c');

    // Corner decorations
    const corners = [[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]];
    corners.forEach(([cx, cy]) => {
      doc.circle(cx, cy, 6).fill('#c9a84c');
    });

    // === HEADER — Logo ARCADINS compact ===
    // Top accent line
    doc.rect(60, 30, W - 120, 2).fill('#c9a84c');

    // Logo centred: icon + ARCADINS + TRAINING CENTER on one line
    const sc = 0.62; // compact scale
    const iconW = 60 * sc;  // shield width in pts
    const totalLogoW = iconW + 130; // icon + text block
    const logoX = (W - totalLogoW) / 2;
    const logoY = 36;

    // Shield outline
    doc.save()
       .translate(logoX, logoY)
       .scale(sc)
       .path('M 20 4 L 40 0 L 60 4 L 60 36 L 40 48 L 20 36 Z')
       .lineWidth(3).strokeColor('#8899bb').stroke()
       .restore();

    // Bars inside shield
    doc.rect(logoX + 7*sc,  logoY + 26*sc, 5*sc, 12*sc).fill('#8899bb');
    doc.rect(logoX + 15*sc, logoY + 18*sc, 5*sc, 20*sc).fill('#c9a84c');
    doc.rect(logoX + 23*sc, logoY + 12*sc, 5*sc, 26*sc).fill('#e6c06b');

    // Arrow tip
    doc.save().translate(logoX, logoY).scale(sc)
       .moveTo(25.5, 2).lineTo(20, 12).lineTo(31, 12).closePath().fill('#c9a84c')
       .restore();

    // Text: ARCADINS
    const textX = logoX + iconW + 6;
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff')
       .text('ARCADINS', textX, logoY + 4, { lineBreak: false });
    // TRAINING CENTER
    doc.font('Helvetica').fontSize(7).fillColor('#8899bb')
       .text('TRAINING CENTER', textX + 1, logoY + 24, { lineBreak: false, characterSpacing: 2 });

    // Tagline centred
    doc.font('Helvetica').fontSize(7).fillColor('#a0a8c0')
       .text('Excellence · Expertise · Réussite', 60, logoY + 40, { align: 'center', width: W - 120 });

    // Bottom accent line
    doc.rect(60, logoY + 52, W - 120, 1).fill('#c9a84c');

    // === MAIN TITLE === (starts after logo at ~y=96)
    doc.font('Helvetica-Bold').fontSize(36).fillColor('#ffffff')
      .text('CERTIFICAT DE RÉUSSITE', 60, 100, { align: 'center', width: W - 120 });

    doc.font('Helvetica').fontSize(10).fillColor('#c9a84c')
      .text('CERTIFICATE OF ACHIEVEMENT', 60, 140, { align: 'center', width: W - 120 });

    // Decorative line
    doc.moveTo(W / 2 - 120, 158).lineTo(W / 2 + 120, 158).lineWidth(0.5).stroke('#c9a84c');

    // === BODY TEXT ===
    doc.font('Helvetica').fontSize(10).fillColor('#a0a8c0')
      .text('Ce certificat est décerné à', 60, 168, { align: 'center', width: W - 120 });

    // Student Name
    const fullName = `${user.prenom} ${user.nom}`.toUpperCase();
    doc.font('Helvetica-BoldOblique').fontSize(30).fillColor('#ffd700')
      .text(fullName, 60, 184, { align: 'center', width: W - 120 });

    // Underline name
    const nameWidth = Math.min(doc.widthOfString(fullName) + 40, 380);
    doc.moveTo(W / 2 - nameWidth / 2, 220).lineTo(W / 2 + nameWidth / 2, 220)
      .lineWidth(1).stroke('#c9a84c');

    doc.font('Helvetica').fontSize(10).fillColor('#a0a8c0')
      .text('pour avoir complété avec succès le', 60, 229, { align: 'center', width: W - 120 });

    // Programme
    const programme = 'Programme de Tutorat en TEF & TCF Canada';
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
      .text(programme, 60, 246, { align: 'center', width: W - 120 });

    // Score
    const scoreText = `Score obtenu : ${certificate.score.toFixed(1)}%`;
    doc.font('Helvetica').fontSize(11).fillColor('#c9a84c')
      .text(scoreText, 60, 268, { align: 'center', width: W - 120 });

    // === FOOTER INFO ===
    const issuedDate = new Date(certificate.issued_at || Date.now()).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // === FOOTER — Signature zone uniquement (centré) ===
    const footerY = 345;
    const sigZoneX = W / 2 - 100; // centré, largeur 200

    // Signature image (si disponible)
    const sigClean = path.join(__dirname, '..', 'assets', 'signature_clean.png');
    const sigRaw   = path.join(__dirname, '..', 'assets', 'signature.jpg');
    const sigFile  = fs.existsSync(sigClean) ? sigClean : fs.existsSync(sigRaw) ? sigRaw : null;
    if (sigFile) {
      // Centre l'image au-dessus de la ligne de signature
      doc.image(sigFile, sigZoneX + 10, footerY - 45, { width: 180, height: 45, fit: [180, 45] });
    }

    // Ligne signature (or)
    doc.moveTo(sigZoneX, footerY).lineTo(sigZoneX + 200, footerY).lineWidth(1).stroke('#c9a84c');

    // Nom du directeur
    doc.font('Helvetica-BoldOblique').fontSize(10).fillColor('#ffffff')
      .text('M. Claude Jr EMILE', sigZoneX, footerY + 6, { width: 200, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#a0a8c0')
      .text('Directeur Général — ARCADINS Training Center', sigZoneX, footerY + 19, { width: 200, align: 'center' });

    // Date et N° discrets sous la signature
    doc.font('Helvetica').fontSize(7.5).fillColor('#6a7090')
      .text(issuedDate, sigZoneX, footerY + 34, { width: 200, align: 'center' });
    doc.font('Helvetica').fontSize(7).fillColor('#4a5060')
      .text(`N° ${certificate.certificate_number}`, sigZoneX, footerY + 46, { width: 200, align: 'center' });

    // === LEGAL NOTE ===
    const legalNote =
      'NOTE LÉGALE : Ce certificat atteste uniquement que le titulaire a obtenu les notes de passage exigées dans le cadre ' +
      'du Programme de Tutorat en TEF & TCF Canada d\'ARCADINS Training Center. Il ne constitue en aucune façon une ' +
      'attestation de réussite à un examen officiel (TEF Canada ou TCF Canada), ne confère aucun droit ni reconnaissance ' +
      'officielle auprès d\'un organisme gouvernemental ou d\'immigration, et ne remplace pas les résultats d\'un test certifié.';

    doc.rect(65, H - 88, W - 130, 0.5).fill('#3a4060');
    doc.font('Helvetica').fontSize(6).fillColor('#4a5070')
      .text(legalNote, 65, H - 83, { align: 'justify', width: W - 130, lineGap: 1 });

    // === VERIFICATION URL ===
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/certificate/verify/${certificate.certificate_number}`;
    doc.font('Helvetica').fontSize(6.5).fillColor('#5a6080')
      .text(`Vérification : ${verifyUrl}`, 65, H - 48, { align: 'center', width: W - 130 });

    // Bottom border
    doc.rect(60, H - 38, W - 120, 1).fill('#c9a84c');

    doc.end();

    // Also save to disk
    doc.on('finish', () => {});

    // Save separately
    ensureCertsDir();
    const filePath = path.join(CERTS_DIR, `${certificate.certificate_number}.pdf`);
    const writeStream = fs.createWriteStream(filePath);
    const doc2 = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

    // We already collected buffers above; write them
    doc2.end(); // just to avoid hanging; we'll write the buffer
    setTimeout(() => {
      fs.writeFile(filePath, Buffer.concat(buffers), (err) => {
        if (err) console.error('[PDF] Failed to save cert to disk:', err.message);
        else console.log('[PDF] Certificate saved to:', filePath);
      });
    }, 100);
  });
}

module.exports = { generateCertificate };
