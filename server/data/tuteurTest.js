'use strict';

const QUESTION_BANK = require('./questionBank');

const TUTEUR_TEST_CONFIG = {
  categories: [
    { cat: 'grammaire', count: 10 },
    { cat: 'vocabulaire', count: 10 },
    { cat: 'strategies', count: 7 },
    { cat: 'culture', count: 3 },
  ],
  total: 30,
  timeLimitSeconds: 30 * 60,
  passingScore: 22,
};

// Sélectionne `count` questions aléatoires (sans répétition) d'une catégorie
function pickRandom(category, count) {
  const bank = QUESTION_BANK[category] || [];
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Construit un test (30 questions), mélange les options de chaque question.
// Retourne { questions, answerKey } :
//  - questions : tableau sans la réponse correcte (à envoyer au client)
//  - answerKey : tableau parallèle des index corrects (gardé côté serveur)
function buildTuteurTest() {
  let picked = [];
  TUTEUR_TEST_CONFIG.categories.forEach(({ cat, count }) => {
    picked = picked.concat(pickRandom(cat, count));
  });

  // Mélanger l'ordre global
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  const questions = [];
  const answerKey = [];

  picked.forEach((q, idx) => {
    const correctText = q.opts[q.ans];
    const shuffledOpts = [...q.opts].sort(() => Math.random() - 0.5);
    const newAnswerIndex = shuffledOpts.indexOf(correctText);

    questions.push({ id: idx, q: q.q, opts: shuffledOpts, expl: q.expl });
    answerKey.push(newAnswerIndex);
  });

  return { questions, answerKey };
}

module.exports = { TUTEUR_TEST_CONFIG, buildTuteurTest };
