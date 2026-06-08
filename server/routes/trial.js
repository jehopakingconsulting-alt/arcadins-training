'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

const TRIAL_QUESTIONS = [
  {
    id: 1,
    question: {
      fr: 'Choisissez la bonne réponse : Je ___ au Canada depuis 2 ans.',
      en: 'Choose the correct answer: I ___ in Canada for 2 years.',
    },
    options: {
      fr: ['suis', 'ai été', 'habite', 'habitais'],
      en: ['am', 'have been', 'live', 'was living'],
    },
    correct: 2,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 2,
    question: {
      fr: 'Quelle phrase est correcte ?',
      en: 'Which sentence is correct?',
    },
    options: {
      fr: [
        'Je suis allé au magasin hier.',
        'J\'ai allé au magasin hier.',
        'Je suis aller au magasin hier.',
        'Je suis allée au magasin hier matin.',
      ],
      en: [
        'I went to the store yesterday.',
        'I have gone to the store yesterday.',
        'I am went to the store yesterday.',
        'I going to the store yesterday.',
      ],
    },
    correct: 0,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 3,
    question: {
      fr: 'Quel est le synonyme de « rapide » ?',
      en: 'What is the synonym of "rapide" (fast)?',
    },
    options: {
      fr: ['lent', 'vite', 'agile', 'immobile'],
      en: ['slow', 'quick', 'agile', 'still'],
    },
    correct: 2,
    points: 1,
    category: 'Vocabulaire',
  },
  {
    id: 4,
    question: {
      fr: 'Complétez : Elle ___ fatiguée quand elle est arrivée.',
      en: 'Complete: She ___ tired when she arrived.',
    },
    options: {
      fr: ['est', 'était', 'a été', 'sera'],
      en: ['is', 'was', 'has been', 'will be'],
    },
    correct: 1,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 5,
    question: {
      fr: 'Lisez le texte : « Marie prend le bus tous les matins pour aller à son travail. Elle préfère cela à la voiture car c\'est moins cher. » Pourquoi Marie prend-elle le bus ?',
      en: 'Read: "Marie takes the bus every morning to go to work. She prefers this to the car because it\'s cheaper." Why does Marie take the bus?',
    },
    options: {
      fr: [
        'Parce qu\'elle n\'a pas de voiture.',
        'Parce que c\'est plus rapide.',
        'Parce que c\'est moins cher.',
        'Parce qu\'elle aime les transports en commun.',
      ],
      en: [
        'Because she has no car.',
        'Because it is faster.',
        'Because it is cheaper.',
        'Because she loves public transport.',
      ],
    },
    correct: 2,
    points: 1,
    category: 'Compréhension écrite',
  },
  {
    id: 6,
    question: {
      fr: 'Choisissez le bon article : ___ information importante.',
      en: 'Choose the correct article: ___ important information.',
    },
    options: {
      fr: ['Un', 'Une', 'Des', 'Le'],
      en: ['A (un)', 'An (une)', 'Some (des)', 'The (le)'],
    },
    correct: 1,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 7,
    question: {
      fr: 'Quel mot est contraire à « difficile » ?',
      en: 'Which word is opposite to "difficile" (difficult)?',
    },
    options: {
      fr: ['compliqué', 'simple', 'long', 'grave'],
      en: ['complicated', 'simple', 'long', 'serious'],
    },
    correct: 1,
    points: 1,
    category: 'Vocabulaire',
  },
  {
    id: 8,
    question: {
      fr: 'Quelle est la forme correcte du subjonctif ? Il faut que tu ___ cette règle.',
      en: 'What is the correct subjunctive form? It is necessary that you ___ this rule.',
    },
    options: {
      fr: ['comprends', 'comprendre', 'comprennes', 'comprennes'],
      en: ['understand (comprends)', 'to understand (comprendre)', 'understand (comprends-subj)', 'understood (compris)'],
    },
    correct: 2,
    points: 1,
    category: 'Grammaire',
  },
  {
    id: 9,
    question: {
      fr: 'Lisez : « Le TEF et le TCF sont des examens qui évaluent les compétences en langue française. Ils sont reconnus par les gouvernements canadien et français. » Ces examens sont reconnus par combien de gouvernements ?',
      en: 'Read: "TEF and TCF are exams that assess French language skills. They are recognized by both the Canadian and French governments." How many governments recognize these exams?',
    },
    options: {
      fr: ['Un seul', 'Deux', 'Trois', 'Plusieurs'],
      en: ['Only one', 'Two', 'Three', 'Several'],
    },
    correct: 1,
    points: 1,
    category: 'Compréhension écrite',
  },
  {
    id: 10,
    question: {
      fr: 'Complétez avec le bon pronom : C\'est ___ qui a organisé la réunion.',
      en: 'Complete with the correct pronoun: It is ___ who organized the meeting.',
    },
    options: {
      fr: ['lui', 'le', 'la', 'se'],
      en: ['him (lui)', 'him (le)', 'her (la)', 'himself (se)'],
    },
    correct: 0,
    points: 1,
    category: 'Grammaire',
  },
];

// GET /api/trial/questions
router.get('/questions', authMiddleware, (req, res) => {
  try {
    // Return questions without 'correct' field
    const questions = TRIAL_QUESTIONS.map(({ correct, ...q }) => q);
    return res.json({ success: true, data: { questions, total: questions.length } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/trial/submit
router.post('/submit', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    const db = getDb();

    if (user.trial_done === 1) {
      return res.status(400).json({
        success: false,
        message: 'already_done',
        data: { trial_score: user.trial_score },
      });
    }

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Réponses manquantes.' });
    }

    // Calculate score
    let score = 0;
    const results = TRIAL_QUESTIONS.map((q, idx) => {
      const userAnswer = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = userAnswer === q.correct;
      if (isCorrect) score += q.points;
      return { id: q.id, correct: q.correct, user_answer: userAnswer, is_correct: isCorrect };
    });

    const scorePercent = (score / TRIAL_QUESTIONS.length) * 100;

    // Save to tests table
    const existingAttempts = db.prepare('SELECT COUNT(*) as cnt FROM tests WHERE user_id = ? AND test_type = ?').get(user.id, 'trial');
    db.prepare(`
      INSERT INTO tests (user_id, test_type, score, passed, attempt_number, answers)
      VALUES (?, 'trial', ?, ?, ?, ?)
    `).run(user.id, scorePercent, scorePercent >= 50 ? 1 : 0, (existingAttempts.cnt || 0) + 1, JSON.stringify(answers));

    // Update user
    db.prepare('UPDATE users SET trial_done = 1, trial_score = ? WHERE id = ?').run(scorePercent, user.id);

    return res.json({
      success: true,
      data: {
        score: scorePercent,
        total_questions: TRIAL_QUESTIONS.length,
        correct_answers: score,
        results,
        redirect: '/plans',
      },
      message: `Test terminé ! Score : ${scorePercent.toFixed(1)}%`,
    });
  } catch (err) {
    console.error('[Trial] Submit error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
