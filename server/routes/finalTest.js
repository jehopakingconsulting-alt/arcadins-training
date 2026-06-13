'use strict';

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const stepGuard = require('../middleware/stepGuard');
const { generateCertificate } = require('../services/pdf');
const { sendCertificateEmail } = require('../services/email');

const FINAL_TEST_TIME_LIMIT_SECONDS = 45 * 60; // 45 minutes (correspond au timer client)

const FINAL_QUESTIONS = [
  // Compréhension orale (CO) - simulated via text
  {
    id: 1,
    skill: 'CO',
    question: {
      fr: '[CO] Vous entendez : « Le vol AF456 à destination de Montréal embarque à la porte 12. Les passagers en classe affaires sont priés de se présenter en priorité. » Quelle est la destination de ce vol ?',
      en: '[CO] You hear: "Flight AF456 to Montreal is boarding at gate 12. Business class passengers are requested to board first." What is the destination?',
    },
    options: { fr: ['Paris', 'Toronto', 'Montréal', 'Québec'], en: ['Paris', 'Toronto', 'Montreal', 'Quebec'] },
    correct: 2, points: 1, level: 'B1',
  },
  {
    id: 2,
    skill: 'CO',
    question: {
      fr: '[CO] Dialogue : « — Tu as vu les nouvelles ? — Non, qu\'est-ce qui se passe ? — Le gouvernement annonce une réforme du système d\'immigration. — Ah bon, ça va changer quoi exactement ? — Ils vont simplifier les démarches pour les candidats francophones. » Qu\'est-ce qui va changer ?',
      en: '[CO] What is changing according to the dialogue?',
    },
    options: {
      fr: ['Les frais d\'inscription augmentent.', 'Les démarches pour francophones seront simplifiées.', 'L\'immigration sera suspendue.', 'Les tests de langue seront supprimés.'],
      en: ['Registration fees increase.', 'Procedures for Francophones will be simplified.', 'Immigration will be suspended.', 'Language tests will be eliminated.'],
    },
    correct: 1, points: 1, level: 'B2',
  },
  {
    id: 3,
    skill: 'CO',
    question: {
      fr: '[CO] Émission radio : « Les experts s\'accordent à dire que la maîtrise d\'une seconde langue améliore les fonctions cognitives, notamment la mémoire et la concentration, et retarde l\'apparition de maladies comme Alzheimer. » Quel est l\'avantage principal mentionné ?',
      en: '[CO] What main advantage is mentioned in the radio program?',
    },
    options: {
      fr: ['Trouver un emploi plus facilement.', 'Améliorer les fonctions cognitives et retarder Alzheimer.', 'Voyager sans difficultés.', 'Apprendre d\'autres langues plus facilement.'],
      en: ['Finding a job more easily.', 'Improving cognitive functions and delaying Alzheimer\'s.', 'Traveling without difficulties.', 'Learning other languages more easily.'],
    },
    correct: 1, points: 1, level: 'B2',
  },
  {
    id: 4,
    skill: 'CO',
    question: {
      fr: '[CO] Annonce : « Le musée des Beaux-Arts sera fermé le lundi et ouvert de 10h à 18h les autres jours. L\'entrée est gratuite le premier dimanche du mois. » Quand l\'entrée est-elle gratuite ?',
      en: '[CO] When is entry free?',
    },
    options: {
      fr: ['Tous les dimanches.', 'Le premier dimanche du mois.', 'Le lundi.', 'Tous les jours de 10h à 12h.'],
      en: ['Every Sunday.', 'The first Sunday of the month.', 'On Monday.', 'Every day from 10am to 12pm.'],
    },
    correct: 1, points: 1, level: 'A2',
  },
  {
    id: 5,
    skill: 'CO',
    question: {
      fr: '[CO] Conversation professionnelle : « Je vous appelle concernant votre candidature. Nous avons été très impressionnés par votre profil. Seriez-vous disponible pour un entretien jeudi prochain à 14h30 ? » Quel est le but de cet appel ?',
      en: '[CO] What is the purpose of this call?',
    },
    options: {
      fr: ['Demander des informations supplémentaires.', 'Proposer un entretien.', 'Annoncer un refus.', 'Confirmer une embauche.'],
      en: ['Request additional information.', 'Propose an interview.', 'Announce a rejection.', 'Confirm a hire.'],
    },
    correct: 1, points: 1, level: 'B1',
  },
  // Expression orale (EO) scenarios
  {
    id: 6,
    skill: 'EO',
    question: {
      fr: '[EO] Dans une présentation formelle, comment commencez-vous correctement ?',
      en: '[EO] In a formal presentation, how do you correctly begin?',
    },
    options: {
      fr: [
        'Salut tout le monde, aujourd\'hui je vais vous parler de...',
        'Mesdames et Messieurs, j\'ai l\'honneur de vous présenter...',
        'Bon, voilà, je vais vous expliquer un truc...',
        'OK les amis, écoutez bien...',
      ],
      en: [
        'Hi everyone, today I\'ll talk to you about...',
        'Ladies and Gentlemen, I have the honor of presenting...',
        'OK so I\'m going to explain something...',
        'Alright friends, listen up...',
      ],
    },
    correct: 1, points: 1, level: 'B2',
  },
  {
    id: 7,
    skill: 'EO',
    question: {
      fr: '[EO] Pour exprimer un désaccord poli en réunion, vous dites :',
      en: '[EO] To express polite disagreement in a meeting, you say:',
    },
    options: {
      fr: [
        'C\'est faux, tu as tort !',
        'Je comprends votre point de vue, cependant j\'aimerais nuancer...',
        'Non, jamais de la vie !',
        'Bof, c\'est pas terrible comme idée.',
      ],
      en: [
        'That\'s wrong, you\'re mistaken!',
        'I understand your point, however I would like to add a nuance...',
        'No, absolutely not!',
        'Meh, that\'s not a great idea.',
      ],
    },
    correct: 1, points: 1, level: 'B2',
  },
  {
    id: 8,
    skill: 'EO',
    question: {
      fr: '[EO] Quelle phrase utilise correctement le connecteur de concession ?',
      en: '[EO] Which sentence correctly uses a concession connector?',
    },
    options: {
      fr: [
        'Il fait froid. Cependant, je sors sans manteau.',
        'Il fait froid parce que je sors sans manteau.',
        'Il fait froid donc je sors sans manteau.',
        'Il fait froid et je sors sans manteau.',
      ],
      en: [
        'It\'s cold. However, I go out without a coat.',
        'It\'s cold because I go out without a coat.',
        'It\'s cold so I go out without a coat.',
        'It\'s cold and I go out without a coat.',
      ],
    },
    correct: 0, points: 1, level: 'B1',
  },
  // Compréhension écrite (CE)
  {
    id: 9,
    skill: 'CE',
    question: {
      fr: '[CE] Lisez : « Le Programme de Résidence Permanente par l\'entrée express sélectionne les candidats selon un système de points. Les critères incluent l\'âge, le niveau d\'études, l\'expérience professionnelle et la maîtrise des langues officielles. Un score minimum de 67 points sur 100 est requis. » Combien de critères principaux sont mentionnés ?',
      en: '[CE] Read: "The Express Entry program selects candidates based on a points system. Criteria include age, education level, work experience, and official language proficiency. A minimum score of 67 out of 100 is required." How many main criteria are mentioned?',
    },
    options: { fr: ['2', '3', '4', '5'], en: ['2', '3', '4', '5'] },
    correct: 2, points: 1, level: 'B1',
  },
  {
    id: 10,
    skill: 'CE',
    question: {
      fr: '[CE] Extrait : « La ville de Québec, fondée en 1608 par Samuel de Champlain, est la seule ville fortifiée d\'Amérique du Nord au nord du Mexique. Elle est classée au patrimoine mondial de l\'UNESCO depuis 1985. » En quelle année la ville a-t-elle été fondée ?',
      en: '[CE] When was the city of Quebec founded?',
    },
    options: { fr: ['1985', '1608', '1867', '1492'], en: ['1985', '1608', '1867', '1492'] },
    correct: 1, points: 1, level: 'A2',
  },
  {
    id: 11,
    skill: 'CE',
    question: {
      fr: '[CE] Lisez cet email : « Suite à notre entretien téléphonique, je vous confirme votre rendez-vous du 15 mars à 9h00 dans nos locaux au 45 rue de la République. Merci de vous munir d\'une pièce d\'identité. Cordialement, M. Dubois. » Qu\'est-ce que le destinataire doit apporter ?',
      en: '[CE] What must the recipient bring to the appointment?',
    },
    options: {
      fr: ['Un CV', 'Une pièce d\'identité', 'Un formulaire rempli', 'Des photos d\'identité'],
      en: ['A resume', 'An ID document', 'A filled form', 'Passport photos'],
    },
    correct: 1, points: 1, level: 'A2',
  },
  {
    id: 12,
    skill: 'CE',
    question: {
      fr: '[CE] Article : « Contrairement aux idées reçues, le bilinguisme n\'engendre pas de confusion linguistique chez l\'enfant. Au contraire, les études démontrent que les enfants bilingues développent des capacités métalinguistiques supérieures et une plus grande flexibilité cognitive. » Que démontrent les études ?',
      en: '[CE] What do the studies show about bilingual children?',
    },
    options: {
      fr: [
        'Le bilinguisme cause de la confusion.',
        'Les enfants bilingues ont des capacités métalinguistiques supérieures.',
        'Le bilinguisme ralentit le développement.',
        'Les enfants bilingues parlent moins bien.',
      ],
      en: [
        'Bilingualism causes confusion.',
        'Bilingual children have superior metalinguistic skills.',
        'Bilingualism slows development.',
        'Bilingual children speak less well.',
      ],
    },
    correct: 1, points: 1, level: 'B2',
  },
  {
    id: 13,
    skill: 'CE',
    question: {
      fr: '[CE] Annonce : « Avis aux voyageurs : en raison de travaux sur la ligne 4, les trains ne circuleront pas entre les stations Montparnasse et Nation du 20 au 27 juillet. Un service de navettes de remplacement sera mis en place. » Qu\'est-ce qui remplacera les trains ?',
      en: '[CE] What will replace the trains during the works?',
    },
    options: {
      fr: ['Des taxis', 'Des navettes', 'Des vélos en libre-service', 'Des bus express'],
      en: ['Taxis', 'Shuttle buses', 'Bike-sharing', 'Express buses'],
    },
    correct: 1, points: 1, level: 'A2',
  },
  // Expression écrite (EE)
  {
    id: 14,
    skill: 'EE',
    question: {
      fr: '[EE] Dans une lettre formelle, quelle formule de politesse finale est correcte ?',
      en: '[EE] In a formal letter, which closing formula is correct?',
    },
    options: {
      fr: [
        'Bisous, Marie.',
        'À bientôt !',
        'Veuillez agréer, Madame, l\'expression de mes salutations distinguées.',
        'Merci, bonne journée.',
      ],
      en: [
        'Hugs, Marie.',
        'See you soon!',
        'Please accept, Madam, the expression of my distinguished greetings.',
        'Thanks, have a nice day.',
      ],
    },
    correct: 2, points: 1, level: 'B1',
  },
  {
    id: 15,
    skill: 'EE',
    question: {
      fr: '[EE] Quelle phrase est la mieux rédigée pour un texte argumentatif ?',
      en: '[EE] Which sentence is best written for an argumentative text?',
    },
    options: {
      fr: [
        'Le changement climatique c\'est grave et faut faire quelque chose.',
        'En raison des effets irréversibles du changement climatique sur les écosystèmes, il est impératif d\'adopter des politiques environnementales ambitieuses.',
        'Le climat change et c\'est pas bien du tout pour la planète.',
        'On doit s\'occuper du climat parce que c\'est important.',
      ],
      en: [
        'Climate change is serious and we need to do something.',
        'Due to the irreversible effects of climate change on ecosystems, it is imperative to adopt ambitious environmental policies.',
        'The climate is changing and it\'s not good for the planet at all.',
        'We need to deal with the climate because it\'s important.',
      ],
    },
    correct: 1, points: 1, level: 'B2',
  },
  {
    id: 16,
    skill: 'EE',
    question: {
      fr: '[EE] Comment organise-t-on correctement un paragraphe argumentatif ?',
      en: '[EE] How do you correctly organize an argumentative paragraph?',
    },
    options: {
      fr: [
        'Exemple → Argument → Conclusion',
        'Conclusion → Argument → Exemple',
        'Argument → Exemple/Preuve → Mini-conclusion',
        'Exemple → Conclusion → Argument',
      ],
      en: [
        'Example → Argument → Conclusion',
        'Conclusion → Argument → Example',
        'Argument → Example/Proof → Mini-conclusion',
        'Example → Conclusion → Argument',
      ],
    },
    correct: 2, points: 1, level: 'B2',
  },
  // Grammaire avancée
  {
    id: 17,
    skill: 'Grammaire',
    question: {
      fr: 'Identifiez la phrase au passif : _____',
      en: 'Identify the passive voice sentence:',
    },
    options: {
      fr: [
        'Le directeur a signé le contrat.',
        'Le contrat a été signé par le directeur.',
        'Le directeur signe le contrat.',
        'Le directeur signera le contrat.',
      ],
      en: [
        'The director signed the contract.',
        'The contract was signed by the director.',
        'The director signs the contract.',
        'The director will sign the contract.',
      ],
    },
    correct: 1, points: 1, level: 'B1',
  },
  {
    id: 18,
    skill: 'Grammaire',
    question: {
      fr: 'Quel temps correspond à : « action passée qui a une conséquence sur le présent » ?',
      en: 'Which tense corresponds to: "past action with consequence in the present"?',
    },
    options: {
      fr: ['L\'imparfait', 'Le passé simple', 'Le passé composé', 'Le plus-que-parfait'],
      en: ['Imperfect', 'Simple past', 'Present perfect (passé composé)', 'Pluperfect'],
    },
    correct: 2, points: 1, level: 'B2',
  },
  {
    id: 19,
    skill: 'Grammaire',
    question: {
      fr: 'Quelle est la forme nominale de « s\'améliorer » ?',
      en: 'What is the noun form of "s\'améliorer" (to improve oneself)?',
    },
    options: { fr: ['amélioration', 'améliorateur', 'améliorant', 'amélioré'], en: ['improvement', 'improver', 'improving', 'improved'] },
    correct: 0, points: 1, level: 'B2',
  },
  {
    id: 20,
    skill: 'Grammaire',
    question: {
      fr: 'Complétez : Bien ___ il soit tard, il continue à travailler.',
      en: 'Complete: Although ___ it is late, he continues to work.',
    },
    options: { fr: ['que', 'qui', 'quoi', 'dont'], en: ['que (that/although)', 'qui (who)', 'quoi (what)', 'dont (of which)'] },
    correct: 0, points: 1, level: 'B2',
  },
  {
    id: 21,
    skill: 'Grammaire',
    question: {
      fr: 'Quel pronom relatif complète : La ville ___ je vous parle est magnifique.',
      en: 'Which relative pronoun completes: The city ___ I am talking to you about is magnificent.',
    },
    options: { fr: ['que', 'qui', 'dont', 'où'], en: ['que', 'qui', 'dont', 'où'] },
    correct: 2, points: 1, level: 'B1',
  },
  // Vocabulaire avancé
  {
    id: 22,
    skill: 'Vocabulaire',
    question: {
      fr: 'Quel mot signifie « qui dure longtemps, pérenne » ?',
      en: 'Which word means "long-lasting, perennial"?',
    },
    options: { fr: ['éphémère', 'durable', 'provisoire', 'temporaire'], en: ['ephemeral', 'durable/sustainable', 'provisional', 'temporary'] },
    correct: 1, points: 1, level: 'B2',
  },
  {
    id: 23,
    skill: 'Vocabulaire',
    question: {
      fr: 'Quel est le sens de « être en butte à » ?',
      en: 'What does "être en butte à" mean?',
    },
    options: {
      fr: ['Être attaqué par, subir des difficultés.', 'Être protégé de quelque chose.', 'Profiter de quelque chose.', 'Éviter une situation difficile.'],
      en: ['To be targeted by, to face difficulties.', 'To be protected from something.', 'To benefit from something.', 'To avoid a difficult situation.'],
    },
    correct: 0, points: 1, level: 'C1',
  },
  {
    id: 24,
    skill: 'Vocabulaire',
    question: {
      fr: 'Choisissez le terme juridique correct pour « document officiel donnant le droit de résider » :',
      en: 'Choose the correct legal term for "official document granting the right to reside":',
    },
    options: {
      fr: ['Un visa', 'Un permis de résidence', 'Un passeport', 'Une carte de visite'],
      en: ['A visa', 'A residence permit', 'A passport', 'A business card'],
    },
    correct: 1, points: 1, level: 'B1',
  },
  {
    id: 25,
    skill: 'Vocabulaire',
    question: {
      fr: 'Quel terme désigne « l\'ensemble des règles d\'une langue » ?',
      en: 'Which term refers to "the set of rules of a language"?',
    },
    options: { fr: ['Le lexique', 'La grammaire', 'La syntaxe', 'La phonologie'], en: ['The lexicon', 'Grammar', 'Syntax', 'Phonology'] },
    correct: 1, points: 1, level: 'B1',
  },
  // TEF/TCF specific
  {
    id: 26,
    skill: 'TEF/TCF',
    question: {
      fr: 'Le TEF Canada est accepté pour quelle procédure d\'immigration principale ?',
      en: 'The TEF Canada is accepted for which main immigration procedure?',
    },
    options: {
      fr: ['Visa touristique', 'Entrée express (Résidence Permanente)', 'Permis de travail temporaire', 'Regroupement familial'],
      en: ['Tourist visa', 'Express Entry (Permanent Residence)', 'Temporary work permit', 'Family reunification'],
    },
    correct: 1, points: 1, level: 'B1',
  },
  {
    id: 27,
    skill: 'TEF/TCF',
    question: {
      fr: 'Combien de compétences sont évaluées dans l\'épreuve complète du TEF Canada ?',
      en: 'How many skills are assessed in the full TEF Canada exam?',
    },
    options: { fr: ['2', '3', '4', '5'], en: ['2', '3', '4', '5'] },
    correct: 2, points: 1, level: 'A2',
  },
  {
    id: 28,
    skill: 'TEF/TCF',
    question: {
      fr: 'Quel niveau du CECRL correspond généralement au score requis pour l\'entrée express au Canada ?',
      en: 'Which CEFR level generally corresponds to the score required for Express Entry to Canada?',
    },
    options: { fr: ['A2', 'B1', 'B2', 'C1'], en: ['A2', 'B1', 'B2', 'C1'] },
    correct: 1, points: 1, level: 'B1',
  },
  {
    id: 29,
    skill: 'Compréhension écrite',
    question: {
      fr: '[CE] Texte complexe : « La notion de francophonie dépasse le simple cadre linguistique pour englober un ensemble de valeurs partagées : la diversité culturelle, la solidarité entre les peuples et la promotion du dialogue interculturel. Selon l\'OIF, 321 millions de personnes parlent français dans le monde. » Quel est le rôle principal de la francophonie selon ce texte ?',
      en: '[CE] According to the text, what is the main role of the Francophonie?',
    },
    options: {
      fr: [
        'Promouvoir uniquement la langue française.',
        'Englober des valeurs de diversité, solidarité et dialogue interculturel.',
        'Regrouper seulement les pays francophones d\'Europe.',
        'Compter les locuteurs de français dans le monde.',
      ],
      en: [
        'Promote only the French language.',
        'Encompass values of diversity, solidarity, and intercultural dialogue.',
        'Group only European French-speaking countries.',
        'Count French speakers in the world.',
      ],
    },
    correct: 1, points: 1, level: 'C1',
  },
  {
    id: 30,
    skill: 'Grammaire',
    question: {
      fr: 'Laquelle de ces phrases est grammaticalement correcte ?',
      en: 'Which of these sentences is grammatically correct?',
    },
    options: {
      fr: [
        'C\'est moi qui a raison.',
        'C\'est moi qui ai raison.',
        'C\'est moi qui aie raison.',
        'C\'est moi qui avoir raison.',
      ],
      en: [
        '"C\'est moi qui a raison" (wrong agreement)',
        '"C\'est moi qui ai raison" (correct agreement)',
        '"C\'est moi qui aie raison" (wrong mood)',
        '"C\'est moi qui avoir raison" (infinitive error)',
      ],
    },
    correct: 1, points: 1, level: 'B2',
  },
];

// GET /api/final-test/questions
router.get('/questions', authMiddleware, stepGuard('modules_done'), (req, res) => {
  try {
    const user = req.user;
    const db = getDb();

    // Check max attempts
    const settingRow = db.prepare('SELECT value FROM admin_settings WHERE key = ?').get('max_attempts_final');
    const maxAttempts = settingRow ? parseInt(settingRow.value) : 3;

    const attempts = db.prepare('SELECT COUNT(*) as cnt FROM tests WHERE user_id = ? AND test_type = ?').get(user.id, 'final');
    if (attempts.cnt >= maxAttempts && user.final_test_passed !== 1) {
      return res.status(403).json({
        success: false,
        message: `Nombre maximum de tentatives atteint (${maxAttempts}). Contactez le support.`,
        data: { attempts: attempts.cnt, max_attempts: maxAttempts },
      });
    }

    // Démarre le chrono côté serveur (sans le réinitialiser si déjà en cours,
    // pour empêcher de regagner du temps en rafraîchissant la page)
    if (!user.final_test_started_at) {
      db.prepare('UPDATE users SET final_test_started_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);
    }

    const questions = FINAL_QUESTIONS.map(({ correct, ...q }) => q);
    return res.json({
      success: true,
      data: {
        questions,
        total: questions.length,
        attempts_used: attempts.cnt,
        max_attempts: maxAttempts,
        time_limit: FINAL_TEST_TIME_LIMIT_SECONDS,
      },
    });
  } catch (err) {
    console.error('[FinalTest] Questions error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/final-test/submit
router.post('/submit', authMiddleware, stepGuard('modules_done'), async (req, res) => {
  try {
    const user = req.user;
    const db = getDb();

    // Check if already passed
    if (user.final_test_passed === 1) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà réussi le test final.', data: { final_test_score: user.final_test_score } });
    }

    // Check attempt limit
    const settingRow = db.prepare('SELECT value FROM admin_settings WHERE key = ?').get('max_attempts_final');
    const maxAttempts = settingRow ? parseInt(settingRow.value) : 3;
    const attemptRecord = db.prepare('SELECT COUNT(*) as cnt FROM tests WHERE user_id = ? AND test_type = ?').get(user.id, 'final');

    if (attemptRecord.cnt >= maxAttempts) {
      return res.status(403).json({
        success: false,
        message: `Nombre maximum de tentatives atteint (${maxAttempts}).`,
        data: { attempts: attemptRecord.cnt, max_attempts: maxAttempts },
      });
    }

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Réponses manquantes.' });
    }

    // Vérifie le temps écoulé depuis le début du test (anti-triche : un
    // rafraîchissement de page ne redonne pas de temps côté serveur)
    let timeExceeded = false;
    if (user.final_test_started_at) {
      const elapsedSeconds = (Date.now() - new Date(user.final_test_started_at).getTime()) / 1000;
      timeExceeded = elapsedSeconds > FINAL_TEST_TIME_LIMIT_SECONDS + 15;
    }

    // Calculate score
    let score = 0;
    const results = FINAL_QUESTIONS.map((q, idx) => {
      const userAnswer = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = !timeExceeded && userAnswer === q.correct;
      if (isCorrect) score += q.points;
      return { id: q.id, correct: q.correct, user_answer: userAnswer, is_correct: isCorrect, skill: q.skill };
    });

    const scorePercent = (score / FINAL_QUESTIONS.length) * 100;
    const passingScore = 80;
    const passed = scorePercent >= passingScore;
    const attemptNum = attemptRecord.cnt + 1;

    // Save test
    db.prepare(`
      INSERT INTO tests (user_id, test_type, score, passed, attempt_number, answers)
      VALUES (?, 'final', ?, ?, ?, ?)
    `).run(user.id, scorePercent, passed ? 1 : 0, attemptNum, JSON.stringify(answers));

    // Update user
    db.prepare('UPDATE users SET final_test_done = 1, final_test_score = ?, final_test_started_at = NULL WHERE id = ?').run(scorePercent, user.id);

    if (passed) {
      // Mark as passed
      db.prepare('UPDATE users SET final_test_passed = 1 WHERE id = ?').run(user.id);

      // Generate certificate
      const certNumber = uuidv4();
      const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

      db.prepare(`
        INSERT INTO certificates (user_id, certificate_number, nom, prenom, programme, score)
        VALUES (?, ?, ?, ?, 'TEF & TCF Canada – Préparation Complète', ?)
      `).run(user.id, certNumber, freshUser.nom, freshUser.prenom, scorePercent);

      db.prepare('UPDATE users SET certificate_id = ?, certificate_generated_at = datetime(\'now\') WHERE id = ?').run(certNumber, user.id);

      const cert = db.prepare('SELECT * FROM certificates WHERE certificate_number = ?').get(certNumber);

      // Generate PDF (async)
      generateCertificate(freshUser, cert).then((buffer) => {
        const path = require('path');
        const fs = require('fs');
        const certsDir = path.join(__dirname, '..', 'certificates');
        if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
        fs.writeFile(path.join(certsDir, `${certNumber}.pdf`), buffer, (err) => {
          if (err) console.error('[FinalTest] PDF save error:', err);
          else db.prepare('UPDATE certificates SET pdf_path = ? WHERE certificate_number = ?').run(`certificates/${certNumber}.pdf`, certNumber);
        });
      }).catch((err) => console.error('[FinalTest] PDF generation error:', err));

      // Send certificate email
      const certEmailHtml = `
        <h2 style="color: #1a2a6c;">Félicitations ! Vous avez réussi ! 🎓</h2>
        <p>Bonjour <strong>${freshUser.prenom} ${freshUser.nom}</strong>,</p>
        <p>Nous avons le plaisir de vous informer que vous avez <strong>réussi le test final</strong> avec un score de <strong>${scorePercent.toFixed(1)}%</strong>.</p>
        <p>Votre certificat officiel ARCADINS a été généré !</p>
        <div style="margin: 20px 0; padding: 15px; background: #fffbf0; border-left: 4px solid #c9a84c; border-radius: 4px;">
          <strong>Numéro de certificat :</strong> ${certNumber}<br>
          <strong>Score :</strong> ${scorePercent.toFixed(1)}%<br>
          <strong>Programme :</strong> TEF & TCF Canada – Préparation Complète
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificat" style="display:inline-block;padding:12px 24px;background:#c9a84c;color:#0a0e2a;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:10px;">
          Télécharger mon certificat →
        </a>
      `;
      sendCertificateEmail(freshUser, { score: scorePercent, certificate_number: certNumber }).catch(() => {});

      return res.json({
        success: true,
        data: {
          passed: true,
          score: scorePercent,
          correct_answers: score,
          total_questions: FINAL_QUESTIONS.length,
          certificate_number: certNumber,
          redirect: '/certificat',
          results,
        },
        message: `Félicitations ! Vous avez réussi avec ${scorePercent.toFixed(1)}%. Votre certificat est disponible.`,
      });
    } else {
      // Failed
      const remainingAttempts = maxAttempts - attemptNum;

      // Identify weak areas
      const skillScores = {};
      results.forEach((r) => {
        if (!skillScores[r.skill]) skillScores[r.skill] = { correct: 0, total: 0 };
        skillScores[r.skill].total++;
        if (r.is_correct) skillScores[r.skill].correct++;
      });

      const weakAreas = Object.entries(skillScores)
        .filter(([, s]) => s.correct / s.total < 0.6)
        .map(([skill]) => skill);

      return res.json({
        success: true,
        data: {
          passed: false,
          score: scorePercent,
          correct_answers: score,
          total_questions: FINAL_QUESTIONS.length,
          attempt_number: attemptNum,
          remaining_attempts: remainingAttempts,
          weak_areas: weakAreas,
          skill_breakdown: skillScores,
          results,
        },
        message: `Score : ${scorePercent.toFixed(1)}%. Score minimum requis : ${passingScore}%. Il vous reste ${remainingAttempts} tentative(s).`,
      });
    }
  } catch (err) {
    console.error('[FinalTest] Submit error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
