'use strict';

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const stepGuard = require('../middleware/stepGuard');
const { generateCertificate } = require('../services/pdf');
const { sendCertificateEmail } = require('../services/email');

const DEFAULT_TIME_LIMIT_SECONDS = 45 * 60; // 45 minutes
const DEFAULT_PASSING_SCORE      = 70;       // fallback si admin_settings manquant

// ══════════════════════════════════════════════════════════════
//  30 QUESTIONS FINALES — 4 compétences + grammaire + vocabulaire
//  correct : index 0-3 · explanation : affiché si mauvaise réponse
// ══════════════════════════════════════════════════════════════
const FINAL_QUESTIONS = [
  // ── CO (5 questions) ─────────────────────────────────────────
  {
    id: 1, skill: 'CO',
    question: { fr: '[CO] Vous entendez : « Le vol AF456 à destination de Montréal embarque à la porte 12. Les passagers en classe affaires sont priés de se présenter en priorité. » Quelle est la destination de ce vol ?', en: '[CO] You hear: "Flight AF456 to Montreal is boarding at gate 12. Business class passengers are requested to board first." What is the destination?' },
    options: { fr: ['Paris', 'Toronto', 'Montréal', 'Québec'], en: ['Paris', 'Toronto', 'Montreal', 'Quebec'] },
    correct: 2, points: 1, level: 'B1',
    explanation: { fr: '« À destination de Montréal » = le vol se dirige vers Montréal — l\'information est donnée explicitement dans l\'annonce.', en: '"To Montreal" clearly states the destination — no inference needed.' },
  },
  {
    id: 2, skill: 'CO',
    question: { fr: '[CO] Dialogue : « — Tu as vu les nouvelles ? — Non, qu\'est-ce qui se passe ? — Le gouvernement annonce une réforme du système d\'immigration. — Ils vont simplifier les démarches pour les candidats francophones. » Qu\'est-ce qui va changer ?', en: '[CO] What is changing according to the dialogue?' },
    options: { fr: ['Les frais d\'inscription augmentent.', 'Les démarches pour francophones seront simplifiées.', 'L\'immigration sera suspendue.', 'Les tests de langue seront supprimés.'], en: ['Registration fees increase.', 'Procedures for Francophones will be simplified.', 'Immigration will be suspended.', 'Language tests will be eliminated.'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: 'La réforme « simplifie les démarches pour les candidats francophones » — c\'est la seule information de changement donnée dans le dialogue.', en: 'The reform "simplifies procedures for Francophone candidates" — the only change explicitly stated.' },
  },
  {
    id: 3, skill: 'CO',
    question: { fr: '[CO] Émission radio : « Les experts s\'accordent à dire que la maîtrise d\'une seconde langue améliore les fonctions cognitives, notamment la mémoire et la concentration, et retarde l\'apparition de maladies comme Alzheimer. » Quel est l\'avantage principal mentionné ?', en: '[CO] What main advantage is mentioned in the radio program?' },
    options: { fr: ['Trouver un emploi plus facilement.', 'Améliorer les fonctions cognitives et retarder Alzheimer.', 'Voyager sans difficultés.', 'Apprendre d\'autres langues plus facilement.'], en: ['Finding a job more easily.', 'Improving cognitive functions and delaying Alzheimer\'s.', 'Traveling without difficulties.', 'Learning other languages more easily.'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: 'Le texte cite explicitement « améliore les fonctions cognitives » et « retarde l\'apparition d\'Alzheimer » — c\'est l\'avantage central de l\'extrait.', en: 'The text explicitly cites "improves cognitive functions" and "delays Alzheimer\'s" as the main benefit.' },
  },
  {
    id: 4, skill: 'CO',
    question: { fr: '[CO] Annonce : « Le musée des Beaux-Arts sera fermé le lundi et ouvert de 10h à 18h les autres jours. L\'entrée est gratuite le premier dimanche du mois. » Quand l\'entrée est-elle gratuite ?', en: '[CO] When is entry free?' },
    options: { fr: ['Tous les dimanches.', 'Le premier dimanche du mois.', 'Le lundi.', 'Tous les jours de 10h à 12h.'], en: ['Every Sunday.', 'The first Sunday of the month.', 'On Monday.', 'Every day from 10am to 12pm.'] },
    correct: 1, points: 1, level: 'A2',
    explanation: { fr: '« Le premier dimanche du mois » est précisé dans l\'annonce — pas tous les dimanches, seulement le premier du mois.', en: '"The first Sunday of the month" is explicitly stated — not every Sunday.' },
  },
  {
    id: 5, skill: 'CO',
    question: { fr: '[CO] Conversation professionnelle : « Je vous appelle concernant votre candidature. Nous avons été très impressionnés par votre profil. Seriez-vous disponible pour un entretien jeudi prochain à 14h30 ? » Quel est le but de cet appel ?', en: '[CO] What is the purpose of this call?' },
    options: { fr: ['Demander des informations supplémentaires.', 'Proposer un entretien.', 'Annoncer un refus.', 'Confirmer une embauche.'], en: ['Request additional information.', 'Propose an interview.', 'Announce a rejection.', 'Confirm a hire.'] },
    correct: 1, points: 1, level: 'B1',
    explanation: { fr: 'La question « Seriez-vous disponible pour un entretien ? » identifie clairement l\'objectif : proposer un entretien. Le ton positif exclut un refus.', en: '"Would you be available for an interview?" clearly identifies the purpose: proposing an interview.' },
  },

  // ── EO (3 questions) ─────────────────────────────────────────
  {
    id: 6, skill: 'EO',
    question: { fr: '[EO] Dans une présentation formelle, comment commencez-vous correctement ?', en: '[EO] In a formal presentation, how do you correctly begin?' },
    options: { fr: ['Salut tout le monde, aujourd\'hui je vais vous parler de…', 'Mesdames et Messieurs, j\'ai l\'honneur de vous présenter…', 'Bon, voilà, je vais vous expliquer un truc…', 'OK les amis, écoutez bien…'], en: ['Hi everyone, today I\'ll talk to you about…', 'Ladies and Gentlemen, I have the honor of presenting…', 'OK so I\'m going to explain something…', 'Alright friends, listen up…'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: '« Mesdames et Messieurs, j\'ai l\'honneur de… » est la formule introductive formelle standard. Les autres options sont familières ou informelles.', en: '"Ladies and Gentlemen, I have the honor of…" is the standard formal opening formula. Others are informal.' },
  },
  {
    id: 7, skill: 'EO',
    question: { fr: '[EO] Pour exprimer un désaccord poli en réunion, vous dites :', en: '[EO] To express polite disagreement in a meeting, you say:' },
    options: { fr: ['C\'est faux, tu as tort !', 'Je comprends votre point de vue, cependant j\'aimerais nuancer…', 'Non, jamais de la vie !', 'Bof, c\'est pas terrible comme idée.'], en: ['That\'s wrong, you\'re mistaken!', 'I understand your point, however I would like to add a nuance…', 'No, absolutely not!', 'Meh, that\'s not a great idea.'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: 'Désaccord poli = reconnaître le point de vue adverse (« je comprends ») + marquer l\'opposition (« cependant ») + nuancer. Les autres sont agressives ou familières.', en: 'Polite disagreement = acknowledge the other view + use a concession connector + nuance. Others are aggressive or informal.' },
  },
  {
    id: 8, skill: 'EO',
    question: { fr: '[EO] Quelle phrase utilise correctement le connecteur de concession ?', en: '[EO] Which sentence correctly uses a concession connector?' },
    options: { fr: ['Il fait froid. Cependant, je sors sans manteau.', 'Il fait froid parce que je sors sans manteau.', 'Il fait froid donc je sors sans manteau.', 'Il fait froid et je sors sans manteau.'], en: ['It\'s cold. However, I go out without a coat.', 'It\'s cold because I go out without a coat.', 'It\'s cold so I go out without a coat.', 'It\'s cold and I go out without a coat.'] },
    correct: 0, points: 1, level: 'B1',
    explanation: { fr: '« Cependant » exprime une opposition (= malgré cela). Ici : il fait froid, MAIS je sors quand même → concession. « Parce que » = cause, « donc » = conséquence.', en: '"However" expresses opposition/concession. "Because" = cause, "so" = consequence.' },
  },

  // ── CE (6 questions) ─────────────────────────────────────────
  {
    id: 9, skill: 'CE',
    question: { fr: '[CE] Lisez : « Le Programme par l\'entrée express sélectionne les candidats selon un système de points. Les critères incluent l\'âge, le niveau d\'études, l\'expérience professionnelle et la maîtrise des langues officielles. » Combien de critères principaux sont mentionnés ?', en: '[CE] How many main criteria are mentioned?' },
    options: { fr: ['2', '3', '4', '5'], en: ['2', '3', '4', '5'] },
    correct: 2, points: 1, level: 'B1',
    explanation: { fr: 'Le texte liste explicitement 4 critères : âge, niveau d\'études, expérience professionnelle, maîtrise des langues — comptez-les !', en: 'The text lists 4 criteria: age, education, work experience, language proficiency.' },
  },
  {
    id: 10, skill: 'CE',
    question: { fr: '[CE] « La ville de Québec, fondée en 1608 par Samuel de Champlain, est la seule ville fortifiée d\'Amérique du Nord au nord du Mexique. Elle est classée au patrimoine mondial de l\'UNESCO depuis 1985. » En quelle année la ville a-t-elle été fondée ?', en: '[CE] When was the city of Quebec founded?' },
    options: { fr: ['1985', '1608', '1867', '1492'], en: ['1985', '1608', '1867', '1492'] },
    correct: 1, points: 1, level: 'A2',
    explanation: { fr: '« Fondée en 1608 » est indiqué explicitement. 1985 est l\'année du classement UNESCO — piège classique : lire attentivement.', en: '"Founded in 1608" is explicitly stated. 1985 is the UNESCO listing year — classic distractor.' },
  },
  {
    id: 11, skill: 'CE',
    question: { fr: '[CE] Email : « Suite à notre entretien téléphonique, je vous confirme votre rendez-vous du 15 mars à 9h00 dans nos locaux au 45 rue de la République. Merci de vous munir d\'une pièce d\'identité. » Qu\'est-ce que le destinataire doit apporter ?', en: '[CE] What must the recipient bring?' },
    options: { fr: ['Un CV', 'Une pièce d\'identité', 'Un formulaire rempli', 'Des photos d\'identité'], en: ['A resume', 'An ID document', 'A filled form', 'Passport photos'] },
    correct: 1, points: 1, level: 'A2',
    explanation: { fr: '« Merci de vous munir d\'une pièce d\'identité » = l\'unique document demandé dans l\'email. « Se munir de » = apporter avec soi.', en: '"Please bring an ID document" is the only item explicitly requested in the email.' },
  },
  {
    id: 12, skill: 'CE',
    question: { fr: '[CE] « Contrairement aux idées reçues, le bilinguisme n\'engendre pas de confusion linguistique chez l\'enfant. Au contraire, les études démontrent que les enfants bilingues développent des capacités métalinguistiques supérieures et une plus grande flexibilité cognitive. » Que démontrent les études ?', en: '[CE] What do the studies show?' },
    options: { fr: ['Le bilinguisme cause de la confusion.', 'Les enfants bilingues ont des capacités métalinguistiques supérieures.', 'Le bilinguisme ralentit le développement.', 'Les enfants bilingues parlent moins bien.'], en: ['Bilingualism causes confusion.', 'Bilingual children have superior metalinguistic skills.', 'Bilingualism slows development.', 'Bilingual children speak less well.'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: 'Piège : l\'intro dit « contrairement aux idées reçues » (= la confusion est une IDÉE FAUSSE). Les études prouvent le contraire : capacités supérieures.', en: 'Trap: "contrary to popular belief" means confusion is FALSE. Studies prove the opposite: superior skills.' },
  },
  {
    id: 13, skill: 'CE',
    question: { fr: '[CE] « En raison de travaux sur la ligne 4, les trains ne circuleront pas entre Montparnasse et Nation du 20 au 27 juillet. Un service de navettes de remplacement sera mis en place. » Qu\'est-ce qui remplacera les trains ?', en: '[CE] What will replace the trains?' },
    options: { fr: ['Des taxis', 'Des navettes', 'Des vélos en libre-service', 'Des bus express'], en: ['Taxis', 'Shuttle buses', 'Bike-sharing', 'Express buses'] },
    correct: 1, points: 1, level: 'A2',
    explanation: { fr: '« Un service de navettes de remplacement sera mis en place » — le mot « navettes » est explicitement mentionné dans l\'annonce.', en: '"A shuttle replacement service will be put in place" — "navettes" = shuttles, stated explicitly.' },
  },
  {
    id: 14, skill: 'CE',
    question: { fr: '[CE] « La notion de francophonie dépasse le simple cadre linguistique pour englober un ensemble de valeurs partagées : la diversité culturelle, la solidarité entre les peuples et la promotion du dialogue interculturel. » Quel est le rôle principal de la francophonie selon ce texte ?', en: '[CE] What is the main role of the Francophonie according to the text?' },
    options: { fr: ['Promouvoir uniquement la langue française.', 'Englober des valeurs de diversité, solidarité et dialogue interculturel.', 'Regrouper seulement les pays européens.', 'Compter les locuteurs de français dans le monde.'], en: ['Promote only the French language.', 'Encompass values of diversity, solidarity, and intercultural dialogue.', 'Group only European countries.', 'Count French speakers in the world.'] },
    correct: 1, points: 1, level: 'C1',
    explanation: { fr: 'Le texte insiste sur « dépasse le simple cadre linguistique » → la langue seule n\'est pas le seul rôle. Les trois valeurs citées définissent la francophonie.', en: '"Goes beyond the linguistic framework" → language alone is not the only role. The three cited values define Francophonie.' },
  },

  // ── EE (3 questions) ─────────────────────────────────────────
  {
    id: 15, skill: 'EE',
    question: { fr: '[EE] Dans une lettre formelle, quelle formule de politesse finale est correcte ?', en: '[EE] In a formal letter, which closing formula is correct?' },
    options: { fr: ['Bisous, Marie.', 'À bientôt !', 'Veuillez agréer, Madame, l\'expression de mes salutations distinguées.', 'Merci, bonne journée.'], en: ['Hugs, Marie.', 'See you soon!', 'Please accept, Madam, the expression of my distinguished greetings.', 'Thanks, have a nice day.'] },
    correct: 2, points: 1, level: 'B1',
    explanation: { fr: '« Veuillez agréer… mes salutations distinguées » est la formule de clôture formelle standard en français. Les autres sont familières ou informelles.', en: '"Veuillez agréer… mes salutations distinguées" is the standard formal French closing. Others are informal.' },
  },
  {
    id: 16, skill: 'EE',
    question: { fr: '[EE] Quelle phrase est la mieux rédigée pour un texte argumentatif ?', en: '[EE] Which sentence is best for an argumentative text?' },
    options: { fr: ['Le changement climatique c\'est grave et faut faire quelque chose.', 'En raison des effets irréversibles du changement climatique sur les écosystèmes, il est impératif d\'adopter des politiques environnementales ambitieuses.', 'Le climat change et c\'est pas bien du tout pour la planète.', 'On doit s\'occuper du climat parce que c\'est important.'], en: ['Climate change is serious and we need to do something.', 'Due to the irreversible effects of climate change on ecosystems, it is imperative to adopt ambitious environmental policies.', 'The climate is changing and it\'s not good for the planet at all.', 'We need to deal with the climate because it\'s important.'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: 'La phrase B utilise un registre soutenu (« en raison de », « il est impératif »), une structure complexe et un vocabulaire précis — attendus en EE niveau B2/C1.', en: 'Option B uses formal register ("due to", "it is imperative"), complex structure and precise vocabulary — expected in EE at B2/C1.' },
  },
  {
    id: 17, skill: 'EE',
    question: { fr: '[EE] Comment organise-t-on correctement un paragraphe argumentatif ?', en: '[EE] How do you correctly organize an argumentative paragraph?' },
    options: { fr: ['Exemple → Argument → Conclusion', 'Conclusion → Argument → Exemple', 'Argument (thèse du paragraphe) → Exemple/Preuve → Mini-conclusion', 'Exemple → Conclusion → Argument'], en: ['Example → Argument → Conclusion', 'Conclusion → Argument → Example', 'Argument (paragraph thesis) → Example/Proof → Mini-conclusion', 'Example → Conclusion → Argument'] },
    correct: 2, points: 1, level: 'B2',
    explanation: { fr: 'La structure AEI (Affirmation → Exemple → Illustration/Conclusion) est la méthode standard : on pose l\'argument d\'abord, on l\'illustre ensuite, puis on conclut.', en: 'The AEI structure (Affirmation → Example → Illustration) is standard: state the argument first, then illustrate, then conclude.' },
  },

  // ── Grammaire (7 questions) ───────────────────────────────────
  {
    id: 18, skill: 'Grammaire',
    question: { fr: 'Identifiez la phrase à la voix passive :', en: 'Identify the passive voice sentence:' },
    options: { fr: ['Le directeur a signé le contrat.', 'Le contrat a été signé par le directeur.', 'Le directeur signe le contrat.', 'Le directeur signera le contrat.'], en: ['The director signed the contract.', 'The contract was signed by the director.', 'The director signs the contract.', 'The director will sign the contract.'] },
    correct: 1, points: 1, level: 'B1',
    explanation: { fr: 'Voix passive = sujet apparent (contrat) + être + participe passé (signé) + par + agent (directeur). Les autres phrases sont à la voix active.', en: 'Passive = apparent subject + être + past participle + par + agent. All others are active voice.' },
  },
  {
    id: 19, skill: 'Grammaire',
    question: { fr: 'Quel temps correspond à : « action passée qui a une conséquence sur le présent » ?', en: 'Which tense corresponds to: "past action with consequence in the present"?' },
    options: { fr: ['L\'imparfait', 'Le passé simple', 'Le passé composé', 'Le plus-que-parfait'], en: ['Imperfect', 'Simple past', 'Present perfect (passé composé)', 'Pluperfect'] },
    correct: 2, points: 1, level: 'B2',
    explanation: { fr: 'Le passé composé relie le passé au présent (ex : « J\'ai étudié → je suis prêt »). L\'imparfait décrit une durée/habitude. Le plus-que-parfait exprime l\'antériorité.', en: 'The passé composé links past to present. Imperfect = duration/habit. Pluperfect = anterior past.' },
  },
  {
    id: 20, skill: 'Grammaire',
    question: { fr: 'Quelle est la forme nominale de « s\'améliorer » ?', en: 'What is the noun form of "s\'améliorer"?' },
    options: { fr: ['amélioration', 'améliorateur', 'améliorant', 'amélioré'], en: ['improvement (amélioration)', 'improver (améliorateur)', 'improving (améliorant)', 'improved (amélioré)'] },
    correct: 0, points: 1, level: 'B2',
    explanation: { fr: '« L\'amélioration » est le nom dérivé du verbe « améliorer ». « Améliorateur » = adjectif, « améliorant » = participe présent, « amélioré » = participe passé.', en: '"Amélioration" is the noun form. "Améliorateur" = adj, "améliorant" = present participle, "amélioré" = past participle.' },
  },
  {
    id: 21, skill: 'Grammaire',
    question: { fr: 'Complétez : « Bien ___ il soit tard, il continue à travailler. »', en: 'Complete: "Although ___ it is late, he continues to work."' },
    options: { fr: ['que', 'qui', 'quoi', 'dont'], en: ['que (that/although)', 'qui (who)', 'quoi (what)', 'dont (of which)'] },
    correct: 0, points: 1, level: 'B2',
    explanation: { fr: '« Bien que » + subjonctif exprime la concession. Seul « que » complète cette locution conjonctive. « Bien qui/quoi/dont » n\'existent pas.', en: '"Bien que" + subjunctive = concession. Only "que" completes this conjunction. "Bien qui/quoi/dont" do not exist.' },
  },
  {
    id: 22, skill: 'Grammaire',
    question: { fr: 'Quel pronom relatif complète : « La ville ___ je vous parle est magnifique. »', en: 'Which relative pronoun completes: "The city ___ I am talking to you about is magnificent."' },
    options: { fr: ['que', 'qui', 'dont', 'où'], en: ['que', 'qui', 'dont', 'où'] },
    correct: 2, points: 1, level: 'B1',
    explanation: { fr: '« Parler de quelque chose » → « dont » remplace le COI introduit par « de ». « Que » = COD, « qui » = sujet, « où » = lieu/temps.', en: '"Parler de" → "dont" replaces the object introduced by "de". "Que" = direct object, "qui" = subject, "où" = place/time.' },
  },
  {
    id: 23, skill: 'Grammaire',
    question: { fr: 'Laquelle de ces phrases est grammaticalement correcte ?', en: 'Which sentence is grammatically correct?' },
    options: { fr: ['C\'est moi qui a raison.', 'C\'est moi qui ai raison.', 'C\'est moi qui aie raison.', 'C\'est moi qui avoir raison.'], en: ['"C\'est moi qui a raison" (wrong)', '"C\'est moi qui ai raison" (correct)', '"C\'est moi qui aie raison" (wrong mood)', '"C\'est moi qui avoir raison" (infinitive error)'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: 'Après « c\'est moi qui », le verbe s\'accorde avec « moi » (1re personne du sing.) → « j\'ai raison » → « qui ai raison ». « A » = 3e pers., « aie » = subjonctif injustifié.', en: 'After "c\'est moi qui", the verb agrees with "moi" (1st person sing.) → "ai". "A" = 3rd person, "aie" = unjustified subjunctive.' },
  },
  {
    id: 24, skill: 'Grammaire',
    question: { fr: 'Complétez : « Les lettres ___ j\'ai écrit___ étaient formelles. »', en: 'Complete: "The letters ___ I wrote ___ were formal."' },
    options: { fr: ['que / ées', 'qui / es', 'que / és', 'dont / ées'], en: ['que / ées (correct)', 'qui / es (wrong pronoun)', 'que / és (wrong gender)', 'dont / ées (wrong pronoun)'] },
    correct: 0, points: 1, level: 'C1',
    explanation: { fr: '« Que » = pronom COD (les lettres que). COD féminin pluriel avant avoir → accord : « écrites » (ées). « Que » est correct car les lettres sont l\'objet d\'écrire.', en: '"Que" = direct object pronoun. Feminine plural COD before avoir → agreement: "écrites" (ées).' },
  },

  // ── Vocabulaire (6 questions) ─────────────────────────────────
  {
    id: 25, skill: 'Vocabulaire',
    question: { fr: 'Quel mot signifie « qui dure longtemps, pérenne » ?', en: 'Which word means "long-lasting, perennial"?' },
    options: { fr: ['éphémère', 'durable', 'provisoire', 'temporaire'], en: ['ephemeral', 'durable/sustainable', 'provisional', 'temporary'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: '« Durable » = qui résiste dans le temps, pérenne. « Éphémère » = bref, passager (CONTRAIRE). « Provisoire » et « temporaire » = qui dure peu.', en: '"Durable" = lasting over time. "Éphémère" = brief (OPPOSITE). "Provisoire/temporaire" = short-term.' },
  },
  {
    id: 26, skill: 'Vocabulaire',
    question: { fr: 'Quel est le sens de « être en butte à » ?', en: 'What does "être en butte à" mean?' },
    options: { fr: ['Être attaqué par, subir des difficultés.', 'Être protégé de quelque chose.', 'Profiter de quelque chose.', 'Éviter une situation difficile.'], en: ['To be targeted by, to face difficulties.', 'To be protected from something.', 'To benefit from something.', 'To avoid a difficult situation.'] },
    correct: 0, points: 1, level: 'C1',
    explanation: { fr: '« Être en butte à » = être exposé à des attaques, être la cible de difficultés ou d\'hostilités. Expression figée du registre soutenu.', en: '"Être en butte à" = to be exposed to attacks or difficulties — a fixed expression in formal register.' },
  },
  {
    id: 27, skill: 'Vocabulaire',
    question: { fr: 'Choisissez le terme correct pour « document officiel donnant le droit de résider » :', en: 'Choose the correct term for "official document granting the right to reside":' },
    options: { fr: ['Un visa', 'Un permis de résidence', 'Un passeport', 'Une carte de visite'], en: ['A visa', 'A residence permit', 'A passport', 'A business card'] },
    correct: 1, points: 1, level: 'B1',
    explanation: { fr: 'Un « permis de résidence » (ou titre de séjour) autorise à vivre dans un pays. Un visa = entrée temporaire. Un passeport = document d\'identité national.', en: 'A "residence permit" authorizes living in a country. A visa = temporary entry. A passport = national ID.' },
  },
  {
    id: 28, skill: 'Vocabulaire',
    question: { fr: 'Quel terme désigne « l\'ensemble des règles d\'une langue » ?', en: 'Which term refers to "the complete set of rules of a language"?' },
    options: { fr: ['Le lexique', 'La grammaire', 'La syntaxe', 'La phonologie'], en: ['The lexicon', 'Grammar', 'Syntax', 'Phonology'] },
    correct: 1, points: 1, level: 'B1',
    explanation: { fr: 'La grammaire englobe toutes les règles (morphologie, syntaxe, conjugaison). La syntaxe = ordre des mots. Le lexique = vocabulaire. La phonologie = sons.', en: 'Grammar covers all rules. Syntax = word order. Lexicon = vocabulary. Phonology = sounds.' },
  },
  {
    id: 29, skill: 'Vocabulaire',
    question: { fr: 'Quel est le synonyme soutenu de « mais » pour introduire une opposition forte ?', en: 'What is the formal synonym of "but" to introduce a strong opposition?' },
    options: { fr: ['alors', 'cependant', 'car', 'ainsi'], en: ['alors (then)', 'cependant (however)', 'car (because)', 'ainsi (thus)'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: '« Cependant » est le connecteur d\'opposition formel le plus courant (= toutefois, néanmoins). « Car » = cause, « ainsi » = conséquence, « alors » = temps/conséquence.', en: '"Cependant" is the most common formal opposition connector (= however, nevertheless). "Car" = cause, "ainsi" = consequence.' },
  },
  {
    id: 30, skill: 'Vocabulaire',
    question: { fr: 'Que signifie l\'expression « à cet égard » ?', en: 'What does "à cet égard" mean?' },
    options: { fr: ['À cette adresse', 'En ce qui concerne ce point précis', 'Malgré tout', 'En revanche'], en: ['At this address', 'Regarding this specific point', 'Despite everything', 'On the other hand'] },
    correct: 1, points: 1, level: 'B2',
    explanation: { fr: '« À cet égard » = locution formelle signifiant « en ce qui concerne ce point ». Elle fait référence à quelque chose qui vient d\'être mentionné.', en: '"À cet égard" = formal expression meaning "regarding this point" — it refers back to something just mentioned.' },
  },
];

// ── GET /api/final-test/questions ─────────────────────────────────────────────
router.get('/questions', authMiddleware, stepGuard('modules_done'), (req, res) => {
  try {
    const user = req.user;
    const db   = getDb();

    const maxRow  = db.prepare('SELECT value FROM admin_settings WHERE key=?').get('max_attempts_final');
    const maxAttempts = maxRow ? parseInt(maxRow.value) : 3;

    const attempts = db.prepare("SELECT COUNT(*) as cnt FROM tests WHERE user_id=? AND test_type='final'").get(user.id);
    if (attempts.cnt >= maxAttempts && user.final_test_passed !== 1) {
      return res.status(403).json({
        success: false,
        message: `Nombre maximum de tentatives atteint (${maxAttempts}). Contactez le support.`,
        data: { attempts: attempts.cnt, max_attempts: maxAttempts },
      });
    }

    // Réinitialiser le timer à chaque nouvelle tentative (sinon la 2e tentative expire immédiatement)
    db.prepare("UPDATE users SET final_test_started_at=? WHERE id=?").run(new Date().toISOString(), user.id);

    const questions = FINAL_QUESTIONS.map(({ correct, explanation, ...q }) => q);
    return res.json({
      success: true,
      data: {
        questions,
        total: questions.length,
        attempts_used: attempts.cnt,
        max_attempts: maxAttempts,
        time_limit: DEFAULT_TIME_LIMIT_SECONDS,
      },
    });
  } catch (err) {
    console.error('[FinalTest] Questions error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ── POST /api/final-test/submit ───────────────────────────────────────────────
router.post('/submit', authMiddleware, stepGuard('modules_done'), async (req, res) => {
  try {
    const user = req.user;
    const db   = getDb();

    if (user.final_test_passed === 1) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà réussi le test final.', data: { final_test_score: user.final_test_score } });
    }

    const maxRow  = db.prepare('SELECT value FROM admin_settings WHERE key=?').get('max_attempts_final');
    const maxAttempts = maxRow ? parseInt(maxRow.value) : 3;

    const passRow = db.prepare('SELECT value FROM admin_settings WHERE key=?').get('passing_score_final');
    const passingScore = passRow ? parseInt(passRow.value) : DEFAULT_PASSING_SCORE;

    const attemptRecord = db.prepare("SELECT COUNT(*) as cnt FROM tests WHERE user_id=? AND test_type='final'").get(user.id);
    if (attemptRecord.cnt >= maxAttempts) {
      return res.status(403).json({ success: false, message: `Nombre maximum de tentatives atteint (${maxAttempts}).`, data: { attempts: attemptRecord.cnt, max_attempts: maxAttempts } });
    }

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Réponses manquantes.' });
    }

    // Vérification anti-triche : temps écoulé depuis le démarrage côté serveur
    let timeExceeded = false;
    if (user.final_test_started_at) {
      const elapsed = (Date.now() - new Date(user.final_test_started_at).getTime()) / 1000;
      timeExceeded = elapsed > DEFAULT_TIME_LIMIT_SECONDS + 30; // 30s de tolérance réseau
    }

    // Calcul du score
    let score = 0;
    const results = FINAL_QUESTIONS.map((q, idx) => {
      const given     = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = !timeExceeded && given === q.correct;
      if (isCorrect) score += q.points;
      return {
        id:          q.id,
        skill:       q.skill,
        correct:     q.correct,
        user_answer: given,
        is_correct:  isCorrect,
        explanation: isCorrect ? null : q.explanation, // explication si faux
      };
    });

    const scorePercent = Math.round((score / FINAL_QUESTIONS.length) * 100);
    const passed       = scorePercent >= passingScore;
    const attemptNum   = attemptRecord.cnt + 1;

    // Persister la tentative
    db.prepare("INSERT INTO tests (user_id,test_type,score,passed,attempt_number,answers) VALUES (?,'final',?,?,?,?)")
      .run(user.id, scorePercent, passed ? 1 : 0, attemptNum, JSON.stringify(answers));

    db.prepare("UPDATE users SET final_test_done=1, final_test_score=?, final_test_started_at=NULL WHERE id=?")
      .run(scorePercent, user.id);

    // ── Échec ──────────────────────────────────────────────────
    if (!passed) {
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
          passed: false, score: scorePercent, correct_answers: score,
          total_questions: FINAL_QUESTIONS.length, passing_score: passingScore,
          attempt_number: attemptNum, remaining_attempts: maxAttempts - attemptNum,
          weak_areas: weakAreas, skill_breakdown: skillScores, results,
        },
        message: `Score : ${scorePercent}%. Minimum requis : ${passingScore}%. Il vous reste ${maxAttempts - attemptNum} tentative(s).`,
      });
    }

    // ── Réussi ─────────────────────────────────────────────────
    db.prepare("UPDATE users SET final_test_passed=1 WHERE id=?").run(user.id);

    const certNumber = uuidv4();
    const freshUser  = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);

    db.prepare("INSERT INTO certificates (user_id,certificate_number,nom,prenom,programme,score) VALUES (?,?,?,?,'TEF & TCF Canada – Préparation Complète',?)")
      .run(user.id, certNumber, freshUser.nom, freshUser.prenom, scorePercent);
    db.prepare("UPDATE users SET certificate_id=?, certificate_generated_at=datetime('now') WHERE id=?")
      .run(certNumber, user.id);

    const cert = db.prepare('SELECT * FROM certificates WHERE certificate_number=?').get(certNumber);

    // Génération PDF async
    generateCertificate(freshUser, cert).then((buffer) => {
      const path = require('path');
      const fs   = require('fs');
      const dir  = path.join(__dirname, '..', 'certificates');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFile(path.join(dir, `${certNumber}.pdf`), buffer, (err) => {
        if (err) console.error('[FinalTest] PDF save error:', err);
        else db.prepare('UPDATE certificates SET pdf_path=? WHERE certificate_number=?')
               .run(`certificates/${certNumber}.pdf`, certNumber);
      });
    }).catch((err) => console.error('[FinalTest] PDF generation error:', err));

    // Email certificat
    sendCertificateEmail(freshUser, { score: scorePercent, certificate_number: certNumber }).catch(() => {});

    return res.json({
      success: true,
      data: {
        passed: true, score: scorePercent, correct_answers: score,
        total_questions: FINAL_QUESTIONS.length, passing_score: passingScore,
        certificate_number: certNumber, results,
      },
      message: `Félicitations ! Vous avez réussi avec ${scorePercent}%. Votre certificat est disponible.`,
    });

  } catch (err) {
    console.error('[FinalTest] Submit error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
