'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const stepGuard = require('../middleware/stepGuard');
const { sendUserEmail, sendAdminNotification, sendWelcomeEmail } = require('../services/email');

const MODULE_TITLES = {
  1: 'Introduction au TEF & TCF Canada',
  2: 'Compréhension orale – Niveau 1',
  3: 'Expression orale – Niveau 1',
  4: 'Compréhension écrite – Niveau 1',
  5: 'Expression écrite – Niveau 1',
  6: 'Grammaire essentielle',
  7: 'Vocabulaire thématique',
  8: 'Compréhension orale – Niveau 2',
  9: 'Expression orale – Niveau 2',
  10: 'Compréhension écrite – Niveau 2',
  11: 'Expression écrite – Niveau 2',
  12: 'Techniques d\'examen',
  13: 'Simulations et examens blancs',
  14: 'Révision générale et stratégies finales',
};

const MODULE_DESCRIPTIONS = {
  1: 'Découvrez la structure des examens TEF et TCF Canada, les critères d\'évaluation et les stratégies générales.',
  2: 'Développez votre écoute active et apprenez à comprendre des enregistrements audio authentiques.',
  3: 'Pratiquez la production orale spontanée avec des exercices de monologue et de dialogue.',
  4: 'Améliorez votre lecture de textes variés : articles, lettres formelles, graphiques.',
  5: 'Apprenez à rédiger des textes clairs et cohérents : courriels, lettres, textes argumentatifs.',
  6: 'Maîtrisez les points de grammaire essentiels : temps, accords, conjugaison, syntaxe.',
  7: 'Enrichissez votre vocabulaire dans les domaines clés : travail, vie quotidienne, actualités.',
  8: 'Perfectionnez votre écoute avec des exercices de niveau intermédiaire à avancé.',
  9: 'Développez des stratégies avancées pour l\'expression orale en situation d\'examen.',
  10: 'Analysez des textes complexes et apprenez à répondre à des questions précises.',
  11: 'Rédigez des textes structurés avec argumentation claire et vocabulaire soutenu.',
  12: 'Apprenez les techniques spécifiques pour maximiser votre score en conditions d\'examen.',
  13: 'Réalisez des simulations complètes d\'examens TEF/TCF dans des conditions réelles.',
  14: 'Consolidez toutes vos compétences avec une révision complète et des stratégies de dernière minute.',
};

// GET /api/modules/status
router.get('/status', authMiddleware, stepGuard('qualification_done'), (req, res) => {
  try {
    const db = getDb();
    const user = req.user;

    const modules = db.prepare('SELECT * FROM modules WHERE user_id = ? ORDER BY module_number').all(user.id);

    // If no modules yet (shouldn't happen after qualification), create them
    if (modules.length === 0) {
      const insertModule = db.prepare('INSERT OR IGNORE INTO modules (user_id, module_number, status) VALUES (?, ?, ?)');
      for (let i = 1; i <= 14; i++) {
        insertModule.run(user.id, i, i === 1 ? 'not_started' : 'locked');
      }
      const newModules = db.prepare('SELECT * FROM modules WHERE user_id = ? ORDER BY module_number').all(user.id);
      return buildModulesResponse(res, newModules, user);
    }

    return buildModulesResponse(res, modules, user);
  } catch (err) {
    console.error('[Modules] Status error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

function buildModulesResponse(res, modules, user) {
  const enriched = modules.map((m) => ({
    ...m,
    title: MODULE_TITLES[m.module_number] || `Module ${m.module_number}`,
    description: MODULE_DESCRIPTIONS[m.module_number] || '',
  }));

  const completed = enriched.filter((m) => m.status === 'completed').length;
  const inProgress = enriched.find((m) => m.status === 'in_progress');
  const nextNotStarted = enriched.find((m) => m.status === 'not_started');

  return res.json({
    success: true,
    data: {
      modules: enriched,
      stats: {
        total: 14,
        completed,
        current: user.current_module,
        all_done: user.all_modules_done === 1,
      },
      current_module: inProgress || nextNotStarted || null,
    },
  });
}

// POST /api/modules/:num/start
router.post('/:num/start', authMiddleware, stepGuard('qualification_done'), (req, res) => {
  try {
    const db = getDb();
    const user = req.user;
    const num = parseInt(req.params.num);

    if (isNaN(num) || num < 1 || num > 14) {
      return res.status(400).json({ success: false, message: 'Numéro de module invalide.' });
    }

    const module = db.prepare('SELECT * FROM modules WHERE user_id = ? AND module_number = ?').get(user.id, num);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module non trouvé.' });
    }

    if (module.status === 'locked') {
      return res.status(403).json({ success: false, message: 'Ce module est verrouillé. Complétez le module précédent.' });
    }

    if (module.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Ce module est déjà complété.' });
    }

    if (module.status === 'in_progress') {
      return res.json({ success: true, data: { module }, message: 'Module déjà en cours.' });
    }

    // Check previous module is completed (unless module 1)
    if (num > 1) {
      const prevModule = db.prepare('SELECT * FROM modules WHERE user_id = ? AND module_number = ?').get(user.id, num - 1);
      if (!prevModule || prevModule.status !== 'completed') {
        return res.status(403).json({ success: false, message: 'Complétez le module précédent avant de commencer celui-ci.' });
      }
    }

    db.prepare(`UPDATE modules SET status = 'in_progress', started_at = datetime('now') WHERE user_id = ? AND module_number = ?`).run(user.id, num);
    db.prepare('UPDATE users SET current_module = ? WHERE id = ?').run(num, user.id);

    const updated = db.prepare('SELECT * FROM modules WHERE user_id = ? AND module_number = ?').get(user.id, num);

    return res.json({
      success: true,
      data: { module: { ...updated, title: MODULE_TITLES[num], description: MODULE_DESCRIPTIONS[num] } },
      message: `Module ${num} démarré.`,
    });
  } catch (err) {
    console.error('[Modules] Start error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/modules/:num/complete
router.post('/:num/complete', authMiddleware, stepGuard('qualification_done'), async (req, res) => {
  try {
    const db = getDb();
    const user = req.user;
    const num = parseInt(req.params.num);

    if (isNaN(num) || num < 1 || num > 14) {
      return res.status(400).json({ success: false, message: 'Numéro de module invalide.' });
    }

    const module = db.prepare('SELECT * FROM modules WHERE user_id = ? AND module_number = ?').get(user.id, num);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module non trouvé.' });
    }

    if (module.status === 'locked') {
      return res.status(403).json({ success: false, message: 'Module verrouillé.' });
    }

    const { score } = req.body;
    const moduleScore = typeof score === 'number' ? score : 100;

    // Mark as completed
    db.prepare(`UPDATE modules SET status = 'completed', completed_at = datetime('now'), score = ? WHERE user_id = ? AND module_number = ?`).run(moduleScore, user.id, num);

    let allDone = false;

    if (num < 14) {
      // Unlock next module
      db.prepare(`UPDATE modules SET status = 'not_started' WHERE user_id = ? AND module_number = ?`).run(user.id, num + 1);
      db.prepare('UPDATE users SET current_module = ? WHERE id = ?').run(num + 1, user.id);
    } else {
      // All 14 modules done
      allDone = true;
      db.prepare('UPDATE users SET all_modules_done = 1, current_module = 14 WHERE id = ?').run(user.id);

      // Send invitation email
      const inviteHtml = `
        <h2 style="color: #1a2a6c;">Félicitations ! 🎓</h2>
        <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
        <p>Vous avez complété avec succès <strong>les 14 modules</strong> de formation ARCADINS !</p>
        <p>Vous êtes maintenant qualifié(e) pour passer le <strong>Test Final</strong> et obtenir votre certificat officiel.</p>
        <div style="margin: 20px 0; padding: 15px; background: #f0f4ff; border-left: 4px solid #c9a84c; border-radius: 4px;">
          <strong>Prochaine étape :</strong> Test Final TEF & TCF Canada<br>
          <strong>Durée :</strong> 30 questions<br>
          <strong>Score requis :</strong> 80% minimum
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/test-final" style="display:inline-block;padding:12px 24px;background:#1a2a6c;color:white;text-decoration:none;border-radius:6px;margin-top:10px;">
          Passer le test final →
        </a>
      `;
      sendUserEmail(user.email, '[ARCADINS] 🎓 Tous les modules complétés — Passez le test final !', inviteHtml).catch(() => {});
      sendAdminNotification({ nom: user.nom, prenom: user.prenom, email: user.email, telephone: user.telephone, pays: user.pays, event: 'modules_completed' }).catch(() => {});
    }

    const modules = db.prepare('SELECT * FROM modules WHERE user_id = ? ORDER BY module_number').all(user.id);
    const enriched = modules.map((m) => ({ ...m, title: MODULE_TITLES[m.module_number], description: MODULE_DESCRIPTIONS[m.module_number] }));

    return res.json({
      success: true,
      data: {
        modules: enriched,
        all_done: allDone,
        redirect: allDone ? '/test-final' : null,
      },
      message: allDone ? 'Formation complétée ! Vous pouvez maintenant passer le test final.' : `Module ${num} complété. Module ${num + 1} déverrouillé.`,
    });
  } catch (err) {
    console.error('[Modules] Complete error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
