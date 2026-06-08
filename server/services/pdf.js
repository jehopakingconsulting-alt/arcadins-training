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
      .text('pour avoir complété avec succès le programme de formation', 60, 229, { align: 'center', width: W - 120 });

    // Programme
    const programme = certificate.programme || 'TEF & TCF Canada – Préparation Complète';
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

    // Three columns at bottom
    const col1X = 80, col2X = W / 2 - 80, col3X = W - 260;
    const footerY = 360;

    // Col 1 - Date
    doc.moveTo(col1X, footerY).lineTo(col1X + 160, footerY).lineWidth(1).stroke('#c9a84c');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
      .text(issuedDate, col1X, footerY + 5, { width: 160, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#a0a8c0')
      .text('Date de délivrance', col1X, footerY + 18, { width: 160, align: 'center' });

    // Col 2 - Signature
    doc.moveTo(col2X, footerY).lineTo(col2X + 160, footerY).lineWidth(1).stroke('#c9a84c');
    doc.font('Helvetica-BoldOblique').fontSize(12).fillColor('#ffffff')
      .text('Direction ARCADINS', col2X, footerY + 5, { width: 160, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#a0a8c0')
      .text('Directeur de la Formation', col2X, footerY + 20, { width: 160, align: 'center' });

    // Col 3 - Certificate number
    doc.moveTo(col3X, footerY).lineTo(col3X + 160, footerY).lineWidth(1).stroke('#c9a84c');
    doc.font('Helvetica').fontSize(7).fillColor('#a0a8c0')
      .text(`N° ${certificate.certificate_number}`, col3X, footerY + 5, { width: 160, align: 'center' });
    doc.font('Helvetica').fontSize(7).fillColor('#a0a8c0')
      .text('Numéro de certificat', col3X, footerY + 16, { width: 160, align: 'center' });

    // === VERIFICATION URL ===
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/certificate/verify/${certificate.certificate_number}`;
    doc.font('Helvetica').fontSize(7).fillColor('#5a6080')
      .text(`Vérifiez ce certificat sur: ${verifyUrl}`, 60, H - 45, { align: 'center', width: W - 120 });

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
