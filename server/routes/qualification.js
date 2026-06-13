'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const stepGuard = require('../middleware/stepGuard');

const QUALIFICATION_QUESTIONS = [
  // A1 level
  {
    id: 1,
    level: 'A1',
    question: { fr: 'Comment vous appelez-vous ?', en: 'What is your name?' },
    options: { fr: ['Je m\'appelle Marie.', 'Il s\'appelle Paul.', 'Tu t\'appelles Jean.', 'Elle s\'appelle Sophie.'], en: ['My name is Marie.', 'His name is Paul.', 'Your name is Jean.', 'Her name is Sophie.'] },
    correct: 0,
    points: 1,
    category: 'Expression orale',
  },
  {
    id: 2,
    level: 'A1',
    question: { fr: 'Quel est le pluriel de « un cheval » ?', en: 'What is the plural of "un cheval" (a horse)?' },
    options: { fr: ['des chevals', 'des chevaux', 'des cheval', 'des chevauxs'], en: ['des chevals', 'des chevaux', 'des cheval', 'des chevauxs'] },
    correct: 1,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 3,
    level: 'A2',
    question: { fr: 'Complétez : Hier, il ___ beau temps.', en: 'Complete: Yesterday, the weather ___ nice.' },
    options: { fr: ['fait', 'faisait', 'a fait', 'fera'], en: ['makes', 'was making', 'made', 'will make'] },
    correct: 2,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 4,
    level: 'A2',
    question: { fr: 'Quelle est la bonne préposition ? Je vais ___ Paris demain.', en: 'Which is the correct preposition? I am going ___ Paris tomorrow.' },
    options: { fr: ['en', 'au', 'à', 'dans'], en: ['en', 'au', 'à (to)', 'dans (in)'] },
    correct: 2,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 5,
    level: 'A2',
    question: { fr: 'Quel est le féminin de « acteur » ?', en: 'What is the feminine of "acteur" (actor)?' },
    options: { fr: ['acteure', 'actrice', 'acteuse', 'acteuse'], en: ['acteure', 'actrice', 'acteuse', 'acteure'] },
    correct: 1,
    points: 1,
    category: 'Vocabulaire',
  },
  {
    id: 6,
    level: 'B1',
    question: {
      fr: 'Lisez : « Bien que le français soit une langue difficile, de nombreux apprenants parviennent à la maîtriser grâce à une pratique régulière. » Quel est le message principal ?',
      en: 'Read: "Although French is a difficult language, many learners manage to master it through regular practice." What is the main message?',
    },
    options: {
      fr: ['Le français est impossible à apprendre.', 'La pratique régulière aide à maîtriser le français.', 'Personne ne peut apprendre le français.', 'Le français est facile.'],
      en: ['French is impossible to learn.', 'Regular practice helps master French.', 'Nobody can learn French.', 'French is easy.'],
    },
    correct: 1,
    points: 1,
    category: 'Compréhension écrite',
  },
  {
    id: 7,
    level: 'B1',
    question: { fr: 'Quel mot complète la phrase : Elle est très ___ dans son travail.', en: 'Which word completes: She is very ___ in her work.' },
    options: { fr: ['sérieux', 'sérieuse', 'sérieusement', 'sérieur'], en: ['serious (masc)', 'serious (fem)', 'seriously', 'sérieur (wrong)'] },
    correct: 1,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 8,
    level: 'B1',
    question: { fr: 'Complétez avec la bonne forme : Si j\'avais le temps, je ___ voyager.', en: 'Complete: If I had time, I ___ travel.' },
    options: { fr: ['voudrais', 'veux', 'voulu', 'vouloir'], en: ['would want (voudrais)', 'want (veux)', 'wanted (voulu)', 'to want (vouloir)'] },
    correct: 0,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 9,
    level: 'B1',
    question: { fr: 'Quel est le contraire de « approuver » ?', en: 'What is the opposite of "approuver" (to approve)?' },
    options: { fr: ['valider', 'désapprouver', 'accepter', 'confirmer'], en: ['validate', 'disapprove', 'accept', 'confirm'] },
    correct: 1,
    points: 1,
    category: 'Vocabulaire',
  },
  {
    id: 10,
    level: 'B1',
    question: {
      fr: 'Choisissez la bonne conjonction : Il est parti ___ il avait fini son travail.',
      en: 'Choose the correct conjunction: He left ___ he had finished his work.',
    },
    options: { fr: ['parce que', 'après que', 'avant que', 'pendant que'], en: ['because', 'after', 'before', 'while'] },
    correct: 1,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 11,
    level: 'B2',
    question: {
      fr: 'Lisez : « L\'immigration francophone vers le Canada a augmenté de 40% ces dernières années, notamment en raison des programmes d\'immigration facilitant l\'intégration des locuteurs de français. » Quelle est la raison principale ?',
      en: 'Read: "Francophone immigration to Canada has increased by 40% in recent years, mainly due to immigration programs facilitating the integration of French speakers." What is the main reason?',
    },
    options: {
      fr: ['Le Canada est plus riche.', 'Les programmes d\'immigration facilitent l\'intégration.', 'Il fait beau au Canada.', 'Les salaires sont plus élevés.'],
      en: ['Canada is richer.', 'Immigration programs facilitate integration.', 'The weather is nice in Canada.', 'Salaries are higher.'],
    },
    correct: 1,
    points: 1,
    category: 'Compréhension écrite',
  },
  {
    id: 12,
    level: 'B2',
    question: { fr: 'Quelle phrase utilise correctement le subjonctif ?', en: 'Which sentence correctly uses the subjunctive?' },
    options: {
      fr: [
        'Je veux que tu viens.',
        'Il faut que nous partions maintenant.',
        'Elle espère qu\'il vienne.',
        'Je souhaite que tu es là.',
      ],
      en: [
        'I want you to come (wrong subj)',
        'We must leave now (correct subj)',
        'She hopes he comes (debatable)',
        'I wish you are here (wrong subj)',
      ],
    },
    correct: 1,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 13,
    level: 'B2',
    question: { fr: 'Quel terme signifie « rendre quelque chose plus simple » ?', en: 'What term means "to make something simpler"?' },
    options: { fr: ['complexifier', 'simplifier', 'compliquer', 'élaborer'], en: ['complexify', 'simplify', 'complicate', 'elaborate'] },
    correct: 1,
    points: 1,
    category: 'Vocabulaire',
  },
  {
    id: 14,
    level: 'B2',
    question: { fr: 'Dans quelle phrase le conditionnel passé est-il correctement utilisé ?', en: 'In which sentence is the past conditional correctly used?' },
    options: {
      fr: [
        'Si tu étais venu, je serais resté.',
        'Si tu venais, je restais.',
        'Si tu viens, je reste.',
        'Si tu viendras, je resterais.',
      ],
      en: [
        'If you had come, I would have stayed.',
        'If you came, I was staying.',
        'If you come, I stay.',
        'If you will come, I would stay.',
      ],
    },
    correct: 0,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 15,
    level: 'B2',
    question: { fr: 'Complétez : Il a agi ___ à ce qu\'on lui avait demandé.', en: 'Complete: He acted ___ what he had been asked.' },
    options: { fr: ['conformément', 'conformable', 'conforme', 'conformant'], en: ['in accordance with', 'conformable', 'conform', 'conforming'] },
    correct: 0,
    points: 1,
    category: 'Vocabulaire',
  },
  {
    id: 16,
    level: 'C1',
    question: {
      fr: 'Lisez : « La politique linguistique canadienne, fondée sur le bilinguisme officiel, a permis de valoriser les deux langues officielles tout en faisant face aux défis de préservation de la langue française dans un environnement anglophone dominant. » Quel est le défi mentionné ?',
      en: 'Read the passage about Canadian linguistic policy. What challenge is mentioned?',
    },
    options: {
      fr: [
        'L\'apprentissage de l\'anglais.',
        'La préservation du français face à l\'anglais dominant.',
        'La disparition du bilinguisme.',
        'Le manque de ressources éducatives.',
      ],
      en: [
        'Learning English.',
        'Preserving French against dominant English.',
        'The disappearance of bilingualism.',
        'Lack of educational resources.',
      ],
    },
    correct: 1,
    points: 1,
    category: 'Compréhension écrite',
  },
  {
    id: 17,
    level: 'C1',
    question: { fr: 'Quel mot est un synonyme soutenu de « utiliser » ?', en: 'Which word is a formal synonym of "utiliser" (to use)?' },
    options: { fr: ['employer', 'recourir à', 'exploiter', 'mobiliser'], en: ['to employ', 'to resort to', 'to exploit', 'to mobilize'] },
    correct: 1,
    points: 1,
    category: 'Vocabulaire',
  },
  {
    id: 18,
    level: 'C1',
    question: { fr: 'Quelle construction est un gallicisme ?', en: 'Which construction is a gallicism?' },
    options: {
      fr: [
        'Je suis en train de manger.',
        'Je mange actuellement.',
        'Je suis en train manger.',
        'Je mange en ce moment précis.',
      ],
      en: [
        '"être en train de" + infinitive (progressive)',
        '"manger actuellement" (simple)',
        'Wrong form (error)',
        '"en ce moment précis" (neutral)',
      ],
    },
    correct: 0,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 19,
    level: 'C1',
    question: { fr: 'Reformulez sans changer le sens : « Malgré ses efforts, il n\'a pas réussi. »', en: 'Rephrase without changing meaning: "Despite his efforts, he did not succeed."' },
    options: {
      fr: [
        'Bien qu\'il ait fait des efforts, il a réussi.',
        'Même s\'il a fait des efforts, il n\'a pas réussi.',
        'Parce qu\'il a fait des efforts, il a échoué.',
        'Il a fait des efforts, donc il a réussi.',
      ],
      en: [
        'Although he made efforts, he succeeded.',
        'Even if he made efforts, he did not succeed.',
        'Because he made efforts, he failed.',
        'He made efforts, so he succeeded.',
      ],
    },
    correct: 1,
    points: 1,
    category: 'Expression écrite',
  },
  {
    id: 20,
    level: 'C1',
    question: { fr: 'Quel registre de langue est utilisé dans : « Auriez-vous l\'amabilité de m\'indiquer la direction de la gare ? »', en: 'What register of language is used in: "Would you be so kind as to indicate the direction of the station?"' },
    options: {
      fr: ['Familier', 'Courant', 'Soutenu', 'Argotique'],
      en: ['Informal', 'Neutral', 'Formal', 'Slang'],
    },
    correct: 2,
    points: 1,
    category: 'Compétence sociolinguistique',
  },
];

const QUALIFICATION_TIME_LIMIT_SECONDS = 30 * 60; // 30 minutes (correspond au timer client)

// GET /api/qualification/questions
router.get('/questions', authMiddleware, stepGuard('payment_confirmed'), (req, res) => {
  try {
    if (req.user.qualification_done === 1) {
      return res.status(400).json({
        success: false,
        message: 'already_done',
        data: {
          qualification_score: req.user.qualification_score,
          qualification_level: req.user.qualification_level,
        },
      });
    }
    // Démarre le chrono côté serveur (sans le réinitialiser si déjà en cours,
    // pour empêcher de regagner du temps en rafraîchissant la page)
    if (!req.user.qualification_started_at) {
      const db = getDb();
      db.prepare('UPDATE users SET qualification_started_at = ? WHERE id = ?').run(new Date().toISOString(), req.user.id);
    }
    const questions = QUALIFICATION_QUESTIONS.map(({ correct, ...q }) => q);
    return res.json({ success: true, data: { questions, total: questions.length, time_limit: QUALIFICATION_TIME_LIMIT_SECONDS } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/qualification/submit
router.post('/submit', authMiddleware, stepGuard('payment_confirmed'), (req, res) => {
  try {
    const user = req.user;
    const db = getDb();

    if (user.qualification_done === 1) {
      return res.status(400).json({
        success: false,
        message: 'already_done',
        data: { qualification_level: user.qualification_level },
      });
    }

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Réponses manquantes.' });
    }

    // Vérifie le temps écoulé depuis le début du test (anti-triche : un
    // rafraîchissement de page ne redonne pas de temps côté serveur)
    let timeExceeded = false;
    if (user.qualification_started_at) {
      const elapsedSeconds = (Date.now() - new Date(user.qualification_started_at).getTime()) / 1000;
      timeExceeded = elapsedSeconds > QUALIFICATION_TIME_LIMIT_SECONDS + 15;
    }

    let score = 0;
    QUALIFICATION_QUESTIONS.forEach((q, idx) => {
      if (!timeExceeded && answers[idx] === q.correct) score += q.points;
    });

    const scorePercent = (score / QUALIFICATION_QUESTIONS.length) * 100;

    // Assign level
    let level;
    if (scorePercent < 40) level = 'Débutant';
    else if (scorePercent <= 70) level = 'Intermédiaire';
    else level = 'Avancé';

    // Save test result
    const attempts = db.prepare('SELECT COUNT(*) as cnt FROM tests WHERE user_id = ? AND test_type = ?').get(user.id, 'qualification');
    db.prepare(`
      INSERT INTO tests (user_id, test_type, score, passed, attempt_number, answers)
      VALUES (?, 'qualification', ?, 1, ?, ?)
    `).run(user.id, scorePercent, (attempts.cnt || 0) + 1, JSON.stringify(answers));

    // Initialize 14 modules
    const insertModule = db.prepare(`
      INSERT OR IGNORE INTO modules (user_id, module_number, status)
      VALUES (?, ?, ?)
    `);
    for (let i = 1; i <= 14; i++) {
      insertModule.run(user.id, i, i === 1 ? 'not_started' : 'locked');
    }

    // Update user
    db.prepare(`
      UPDATE users SET qualification_done = 1, qualification_score = ?, qualification_level = ?, current_module = 1, qualification_started_at = NULL
      WHERE id = ?
    `).run(scorePercent, level, user.id);

    return res.json({
      success: true,
      data: {
        score: scorePercent,
        level,
        correct_answers: score,
        total_questions: QUALIFICATION_QUESTIONS.length,
        redirect: '/formation',
      },
      message: `Niveau évalué : ${level} (${scorePercent.toFixed(1)}%)`,
    });
  } catch (err) {
    console.error('[Qualification] Submit error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
