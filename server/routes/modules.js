'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const stepGuard = require('../middleware/stepGuard');
const { sendUserEmail } = require('../services/email');

const ATTEMPT_COOLDOWN_MINUTES = 10; // délai minimum entre deux tentatives échouées

const MODULE_TITLES = {
  1:  'Introduction au TEF & TCF Canada',
  2:  'Compréhension orale – Niveau 1',
  3:  'Expression orale – Niveau 1',
  4:  'Compréhension écrite – Niveau 1',
  5:  'Expression écrite – Niveau 1',
  6:  'Grammaire essentielle',
  7:  'Vocabulaire thématique',
  8:  'Compréhension orale – Niveau 2',
  9:  'Expression orale – Niveau 2',
  10: 'Compréhension écrite – Niveau 2',
  11: 'Expression écrite – Niveau 2',
  12: 'Techniques d\'examen',
  13: 'Simulations et examens blancs',
  14: 'Révision générale et stratégies finales',
};

const MODULE_DESCRIPTIONS = {
  1:  'Découvrez la structure des examens TEF et TCF Canada, les critères d\'évaluation et les stratégies générales.',
  2:  'Développez votre écoute active et apprenez à comprendre des enregistrements audio authentiques.',
  3:  'Pratiquez la production orale spontanée avec des exercices de monologue et de dialogue.',
  4:  'Améliorez votre lecture de textes variés : articles, lettres formelles, graphiques.',
  5:  'Apprenez à rédiger des textes clairs et cohérents : courriels, lettres, textes argumentatifs.',
  6:  'Maîtrisez les points de grammaire essentiels : temps, accords, conjugaison, syntaxe.',
  7:  'Enrichissez votre vocabulaire dans les domaines clés : travail, vie quotidienne, actualités.',
  8:  'Perfectionnez votre écoute avec des exercices de niveau intermédiaire à avancé.',
  9:  'Développez des stratégies avancées pour l\'expression orale en situation d\'examen.',
  10: 'Analysez des textes complexes et apprenez à répondre à des questions précises.',
  11: 'Rédigez des textes structurés avec argumentation claire et vocabulaire soutenu.',
  12: 'Apprenez les techniques spécifiques pour maximiser votre score en conditions d\'examen.',
  13: 'Entraînez-vous avec des exercices chronométrés et des mises en situation reproduisant les conditions du vrai examen TEF/TCF Canada.',
  14: 'Consolidez toutes vos compétences avec une révision complète et des stratégies de dernière minute.',
};

// Fisher-Yates — mélange l'ordre des questions à chaque tentative
function shuffleArray(arr) {
  const a = arr.map((q, i) => ({ ...q, _origIdx: i }));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════
//  QUESTIONS PAR MODULE  (10 questions · 70% requis = 7/10)
//  correct : index 0-3 de la bonne réponse
//  explanation : affiché pour les mauvaises réponses
// ══════════════════════════════════════════════════════════════
const MODULE_TESTS = {
  1: [
    {
      q: 'Que signifie l\'acronyme TEF ?',
      opts: ['Test d\'Évaluation du Français','Test d\'Expression Francophone','Test d\'Entrée en Formation','Test d\'Enseignement Fondamental'],
      correct: 0,
      explanation: 'TEF signifie « Test d\'Évaluation du Français » — c\'est l\'acronyme officiel reconnu par IRCC pour l\'immigration au Canada.',
    },
    {
      q: 'Combien de compétences langagières sont évaluées au TEF et au TCF Canada ?',
      opts: ['2','3','4','5'],
      correct: 2,
      explanation: 'Les 4 compétences sont : Compréhension Orale (CO), Compréhension Écrite (CE), Expression Orale (EO) et Expression Écrite (EE).',
    },
    {
      q: 'Le NCLC est utilisé pour évaluer les compétences linguistiques dans le cadre de :',
      opts: ['L\'immigration au Canada','Les examens universitaires en France','Le baccalauréat québécois','Les certifications professionnelles'],
      correct: 0,
      explanation: 'NCLC = Niveaux de Compétence Linguistique Canadiens — c\'est l\'échelle utilisée par IRCC pour évaluer les candidats à l\'immigration.',
    },
    {
      q: 'Quel organisme administre le TCF Canada ?',
      opts: ['Alliance Française','Institut français','France Éducation International','Chambre de Commerce'],
      correct: 2,
      explanation: 'Le TCF Canada est organisé par France Éducation International (anciennement CIEP), pas par l\'Alliance Française.',
    },
    {
      q: 'Quel est le niveau NCLC minimum généralement requis pour la résidence permanente via Express Entry ?',
      opts: ['NCLC 4','NCLC 6','NCLC 7','NCLC 9'],
      correct: 2,
      explanation: 'IRCC exige généralement NCLC 7 dans les 4 compétences pour être admissible aux programmes fédéraux d\'immigration comme Express Entry.',
    },
    {
      q: 'Le TEF Canada comprend des épreuves obligatoires et des épreuves :',
      opts: ['Optionnelles','Supplémentaires payantes','Impossibles à éviter','Réservées aux anglophones'],
      correct: 0,
      explanation: 'L\'Expression Orale et l\'Expression Écrite sont optionnelles au TEF Canada selon le programme d\'immigration visé — certains n\'exigent que CO et CE.',
    },
    {
      q: 'L\'épreuve de compréhension orale du TCF Canada dure environ :',
      opts: ['15 minutes','25 minutes','35 minutes','60 minutes'],
      correct: 2,
      explanation: 'La compréhension orale du TCF Canada comporte 29 questions et dure environ 35 minutes — c\'est l\'une des épreuves les plus courtes.',
    },
    {
      q: 'Quelle compétence mesure la capacité à lire et à comprendre des textes écrits ?',
      opts: ['Expression orale','Compréhension orale','Compréhension écrite','Expression écrite'],
      correct: 2,
      explanation: 'La Compréhension Écrite (CE) évalue la capacité à lire et comprendre des textes variés : articles, publicités, courriels, formulaires.',
    },
    {
      q: 'Le score NCLC 7 correspond approximativement au niveau CECRL :',
      opts: ['A2','B1','B2','C1'],
      correct: 2,
      explanation: 'NCLC 7 correspond environ au niveau B2 du CECRL (Cadre Européen Commun de Référence pour les Langues) — niveau « intermédiaire avancé ».',
    },
    {
      q: 'Quelle est la durée de validité des résultats du TEF Canada pour une demande d\'immigration ?',
      opts: ['1 an','2 ans','3 ans','5 ans'],
      correct: 1,
      explanation: 'Les résultats du TEF Canada sont valides 2 ans à compter de la date de l\'examen pour être utilisés dans une demande d\'immigration.',
    },
  ],

  2: [
    {
      q: 'Dans une conversation, « Bien entendu » signifie :',
      opts: ['Je n\'ai pas entendu','Certainement, oui','Mal compris','Je ne suis pas d\'accord'],
      correct: 1,
      explanation: '« Bien entendu » est une expression figée signifiant « certainement, évidemment » — elle n\'a aucun lien avec le verbe entendre au sens auditif.',
    },
    {
      q: 'Vous entendez : « Le train a du retard de vingt minutes. » Que comprenez-vous ?',
      opts: ['Le train est annulé','Le train arrive en avance','Le train arrivera 20 min plus tard que prévu','Le train est à l\'heure'],
      correct: 2,
      explanation: '« Du retard de 20 minutes » = il arrivera 20 minutes après l\'heure prévue — ni annulé, ni en avance.',
    },
    {
      q: 'Quelle stratégie est recommandée avant d\'écouter un document audio en examen ?',
      opts: ['Fermer les yeux','Lire les questions à l\'avance','Écrire rapidement','Ignorer les options'],
      correct: 1,
      explanation: 'Lire les questions avant l\'écoute permet d\'anticiper les informations à repérer et d\'orienter son attention sur les détails pertinents.',
    },
    {
      q: 'Vous entendez : « Je ne suis pas contre l\'idée, mais il faut y réfléchir. » L\'interlocuteur est :',
      opts: ['Totalement opposé','Totalement favorable','Indécis, nuancé','Indifférent'],
      correct: 2,
      explanation: '« Pas contre… mais » = position nuancée : il n\'est ni totalement pour ni totalement contre — il exprime une réserve.',
    },
    {
      q: 'Dans un dialogue formel, « Je vous en prie » est une formule :',
      opts: ['De refus','De politesse pour accueillir un remerciement','D\'excuses','D\'introduction'],
      correct: 1,
      explanation: '« Je vous en prie » répond à un remerciement (= de rien, avec plaisir) — c\'est l\'équivalent formel de « pas de problème ».',
    },
    {
      q: 'Vous entendez : « Veuillez composer le 3 pour le service client. » C\'est :',
      opts: ['Une publicité','Une annonce téléphonique','Un dialogue entre amis','Un bulletin météo'],
      correct: 1,
      explanation: '« Veuillez composer le... » est le message typique d\'un standard téléphonique automatique (SVI — Serveur Vocal Interactif).',
    },
    {
      q: 'Comment identifier le thème principal d\'un document audio ?',
      opts: ['En comptant les mots','En repérant les mots répétés et le contexte','En ignorant les détails','En traduisant mentalement'],
      correct: 1,
      explanation: 'Les mots qui reviennent souvent et le contexte général (lieu, personnes, situation) permettent d\'identifier le thème sans tout comprendre.',
    },
    {
      q: 'L\'expression « à voix basse » signifie :',
      opts: ['En criant','En chuchotant, discrètement','En pleurant','En chantant'],
      correct: 1,
      explanation: '« À voix basse » = en parlant très doucement, en chuchotant, pour ne pas être entendu des autres.',
    },
    {
      q: 'Vous entendez : « La réunion est reportée à jeudi prochain. » Que devez-vous retenir ?',
      opts: ['La réunion est annulée','La réunion est avancée','La réunion aura lieu jeudi prochain','La réunion est maintenue aujourd\'hui'],
      correct: 2,
      explanation: '« Reportée à jeudi » = repoussée à jeudi prochain — la réunion a lieu mais à une date ultérieure, elle n\'est pas annulée.',
    },
    {
      q: 'Quel type de document NE fait PAS partie de l\'épreuve de compréhension orale du TEF/TCF ?',
      opts: ['Dialogues quotidiens','Annonces publiques','Textes littéraires lus à voix haute','Émissions radio'],
      correct: 2,
      explanation: 'Le TEF/TCF utilise des documents authentiques de la vie courante (dialogues, annonces, émissions) — pas des textes littéraires récités.',
    },
  ],

  3: [
    {
      q: 'Dans l\'épreuve d\'expression orale, « développer un point de vue » signifie :',
      opts: ['Lire un texte','Argumenter et justifier sa position','Répéter la question','Traduire en anglais'],
      correct: 1,
      explanation: 'Développer un point de vue = présenter une position, l\'argumenter avec des exemples et la justifier logiquement.',
    },
    {
      q: 'Pour structurer un monologue oral, on utilise des connecteurs. Lequel introduit une conclusion ?',
      opts: ['D\'abord','Ensuite','Par conséquent','En revanche'],
      correct: 2,
      explanation: '« Par conséquent » introduit une conséquence ou conclusion logique. « D\'abord » et « ensuite » structurent l\'ordre, « en revanche » marque l\'opposition.',
    },
    {
      q: 'Quel connecteur exprime une opposition ?',
      opts: ['De plus','Cependant','Ainsi','Car'],
      correct: 1,
      explanation: '« Cependant » = connecteur d\'opposition (= toutefois, néanmoins, or). « De plus » ajoute, « ainsi » conclut, « car » explique.',
    },
    {
      q: 'Comment dit-on en français soutenu « Je pense que c\'est une bonne idée » ?',
      opts: ['C\'est super !','Il me semble que cette proposition est pertinente.','C\'est pas mal.','Ouais, pourquoi pas.'],
      correct: 1,
      explanation: '« Il me semble que cette proposition est pertinente » emploie un verbe impersonnel, un vocabulaire précis et évite les tournures familières.',
    },
    {
      q: 'Pour introduire un exemple dans un discours, on dit :',
      opts: ['En revanche','En effet','Par exemple','Pourtant'],
      correct: 2,
      explanation: '« Par exemple » est le connecteur standard pour illustrer une idée par un cas concret. « En effet » confirme, « en revanche » et « pourtant » opposent.',
    },
    {
      q: 'La durée typique d\'un monologue en expression orale au TCF Canada est d\'environ :',
      opts: ['1 minute','3 minutes','10 minutes','20 minutes'],
      correct: 1,
      explanation: 'Au TCF Canada, le monologue dure environ 3 minutes — il faut structurer son discours (intro, développement, conclusion) en ce temps limité.',
    },
    {
      q: 'Quelle formule est appropriée pour commencer une prise de parole formelle ?',
      opts: ['Bon, euh…','Je voudrais aborder la question de…','Tu sais quoi ?','Bah, en fait…'],
      correct: 1,
      explanation: '« Je voudrais aborder la question de… » est une formule introductive formelle, qui montre que le locuteur est structuré et préparé.',
    },
    {
      q: 'En expression orale, « hésiter » est pénalisant. Une bonne stratégie est :',
      opts: ['De se taire complètement','D\'utiliser des expressions de transition comme « c\'est-à-dire »','De parler en anglais','De répéter la même phrase'],
      correct: 1,
      explanation: 'Utiliser « c\'est-à-dire », « autrement dit » ou « je veux préciser que » permet de combler une hésitation sans perdre le fil du discours.',
    },
    {
      q: 'Le mot « néanmoins » appartient au registre :',
      opts: ['Familier','Argotique','Soutenu/formel','Enfantin'],
      correct: 2,
      explanation: '« Néanmoins » est un connecteur d\'opposition du registre soutenu (= cependant, toutefois, pourtant) — à utiliser à l\'écrit et à l\'oral formel.',
    },
    {
      q: 'Pour exprimer une cause, on utilise :',
      opts: ['Donc','Car','Mais','Or'],
      correct: 1,
      explanation: '« Car » exprime la cause comme « parce que » mais dans un registre plus formel. « Donc » exprime la conséquence, « mais » l\'opposition.',
    },
  ],

  4: [
    {
      q: 'Quel est l\'objectif principal d\'un texte argumentatif ?',
      opts: ['Raconter une histoire','Décrire un lieu','Convaincre le lecteur d\'un point de vue','Donner des instructions'],
      correct: 2,
      explanation: 'Un texte argumentatif a pour but de convaincre le lecteur d\'adopter un point de vue en s\'appuyant sur des arguments et des exemples.',
    },
    {
      q: 'Dans un article de presse, l\'introduction a pour rôle de :',
      opts: ['Résumer la conclusion','Présenter le sujet et donner envie de lire','Lister des données statistiques','Donner l\'avis de l\'auteur uniquement'],
      correct: 1,
      explanation: 'L\'introduction (chapô) d\'un article présente le contexte du sujet et accroche le lecteur pour lui donner envie de lire la suite.',
    },
    {
      q: 'Le mot « cependant » dans un texte introduit :',
      opts: ['Une cause','Une conséquence','Une concession ou opposition','Un exemple'],
      correct: 2,
      explanation: '« Cependant » est un connecteur d\'opposition/concession (= mais, toutefois). Il introduit une idée qui contraste avec ce qui précède.',
    },
    {
      q: 'Lire « en diagonale » signifie :',
      opts: ['Lire très lentement','Lire uniquement les mots en gras','Parcourir rapidement pour identifier les idées principales','Lire de droite à gauche'],
      correct: 2,
      explanation: 'Lire en diagonale = technique de lecture rapide qui consiste à balayer le texte pour en saisir l\'essentiel sans lire chaque mot.',
    },
    {
      q: 'Dans un formulaire d\'immigration, « état civil » désigne :',
      opts: ['La nationalité','La situation maritale (célibataire, marié…)','Le niveau d\'études','La profession'],
      correct: 1,
      explanation: '« État civil » désigne la situation maritale : célibataire, marié(e), divorcé(e), veuf/veuve — pas la nationalité ni la profession.',
    },
    {
      q: 'Que signifie « à cet égard » dans un texte ?',
      opts: ['À cette adresse','En ce qui concerne ce point','Malgré tout','En revanche'],
      correct: 1,
      explanation: '« À cet égard » = locution adverbiale signifiant « en ce qui concerne ce point précis » — elle introduit une précision liée à ce qui vient d\'être dit.',
    },
    {
      q: 'Un « courriel formel » doit commencer par :',
      opts: ['Salut !','Hey,','Madame, Monsieur,','Yo,'],
      correct: 2,
      explanation: '« Madame, Monsieur, » est la formule d\'appel standard pour un courriel formel adressé à une personne dont on ne connaît pas le genre.',
    },
    {
      q: 'Dans un texte, « bien que » introduit :',
      opts: ['Une cause','Une conséquence','Une concession (opposition)','Un but'],
      correct: 2,
      explanation: '« Bien que » + subjonctif introduit une concession : on admet un fait contraire à la thèse principale (= même si, quoique).',
    },
    {
      q: 'Quel registre est utilisé dans les documents officiels du gouvernement canadien ?',
      opts: ['Familier','Standard ou soutenu','Argotique','Poétique'],
      correct: 1,
      explanation: 'Les documents gouvernementaux canadiens utilisent un registre standard à soutenu pour être clairs, accessibles et professionnels.',
    },
    {
      q: 'La « thèse » dans un texte argumentatif est :',
      opts: ['La conclusion finale','L\'exemple principal','La position défendue par l\'auteur','La liste des arguments'],
      correct: 2,
      explanation: 'La thèse = la position centrale que l\'auteur défend tout au long du texte et qu\'il cherche à faire adopter au lecteur.',
    },
  ],

  5: [
    {
      q: 'Quelle est la structure d\'une lettre formelle française ?',
      opts: ['Bonjour – corps – bye','Objet – corps – merci','En-tête, formule d\'appel, corps, formule de politesse, signature','Introduction – développement – conclusion uniquement'],
      correct: 2,
      explanation: 'Une lettre formelle complète comporte : l\'en-tête (coordonnées), la formule d\'appel, le corps, la formule de politesse finale et la signature.',
    },
    {
      q: 'La formule « Je vous prie d\'agréer, Madame, mes salutations distinguées » est utilisée :',
      opts: ['Dans un SMS','Dans un courriel à un ami','Dans une lettre formelle à un inconnu','Dans un forum en ligne'],
      correct: 2,
      explanation: 'C\'est la formule de politesse finale la plus formelle, réservée aux lettres adressées à des inconnus ou des supérieurs dans un contexte professionnel.',
    },
    {
      q: 'Dans l\'expression écrite, la « cohérence » d\'un texte signifie :',
      opts: ['Que les idées se suivent logiquement','Que le texte est très long','Que l\'orthographe est parfaite','Que le texte contient beaucoup d\'adjectifs'],
      correct: 0,
      explanation: 'La cohérence = le fil directeur logique entre les idées. Un texte cohérent progresse clairement d\'une idée à l\'autre sans contradictions.',
    },
    {
      q: 'Quel connecteur utilise-t-on pour ajouter un argument supplémentaire ?',
      opts: ['En revanche','De plus','Or','Pourtant'],
      correct: 1,
      explanation: '« De plus » (= en outre, également, par ailleurs) ajoute un argument dans le même sens. « En revanche » et « pourtant » marquent l\'opposition.',
    },
    {
      q: 'Dans la Tâche 1 du TEF (expression écrite), on vous demande généralement de :',
      opts: ['Écrire un poème','Rédiger une lettre ou un courriel de 120-150 mots','Résumer un article en 500 mots','Décrire une image'],
      correct: 1,
      explanation: 'La Tâche 1 du TEF EE demande de rédiger une lettre ou un courriel formel d\'environ 120-150 mots en réponse à une consigne précise.',
    },
    {
      q: 'Le subjonctif est utilisé après :',
      opts: ['Je crois que…','Il est certain que…','Il faut que…','Je pense que…'],
      correct: 2,
      explanation: '« Il faut que » exprime une obligation et exige obligatoirement le subjonctif. « Je crois/pense que » et « il est certain que » sont suivis de l\'indicatif.',
    },
    {
      q: 'Dans un texte argumentatif, une « antithèse » est :',
      opts: ['L\'argument principal','L\'argument contraire à la thèse','La conclusion','L\'exemple illustratif'],
      correct: 1,
      explanation: 'L\'antithèse = l\'argument qui s\'oppose à la thèse principale. La présenter montre que l\'auteur a considéré les deux côtés avant d\'argumenter.',
    },
    {
      q: 'Pour exprimer une condition, on utilise :',
      opts: ['Parce que','Si + présent + futur','Bien que + subjonctif','Afin de + infinitif'],
      correct: 1,
      explanation: '« Si + présent + futur simple » est la structure de la condition réalisable de type 1 (ex : « Si tu étudies, tu réussiras »).',
    },
    {
      q: 'Quel temps verbal décrit une action passée avec un résultat dans le présent ?',
      opts: ['Imparfait','Passé simple','Passé composé','Plus-que-parfait'],
      correct: 2,
      explanation: 'Le passé composé décrit une action passée dont les effets sont encore présents (ex : « J\'ai étudié → je suis prêt »). L\'imparfait décrit une durée ou habitude.',
    },
    {
      q: 'Le mot « néologisme » désigne :',
      opts: ['Un mot ancien','Un mot nouveau récemment entré dans la langue','Un mot argotique','Un mot emprunté à l\'anglais uniquement'],
      correct: 1,
      explanation: 'Un néologisme est un mot nouvellement créé ou adopté (ex : « selfie », « courriel », « podcast »). Il peut venir de n\'importe quelle langue.',
    },
  ],

  6: [
    {
      q: 'Conjuguez correctement : « Il faut que tu ___ à l\'heure. » (être)',
      opts: ['es','soit','seras','étais'],
      correct: 1,
      explanation: '« Il faut que » exige le subjonctif présent. La forme subjonctif présent de « être » pour « tu » est « sois » — ici « soit » est correct pour « il/elle ».',
    },
    {
      q: 'Choisissez la forme correcte : « Les résultats que j\'ai ___ étaient excellents. » (obtenir)',
      opts: ['obtenu','obtenus','obtenue','obtenues'],
      correct: 1,
      explanation: 'Le COD « les résultats » (masculin pluriel) est placé avant l\'auxiliaire avoir → accord obligatoire : obtenus (masc. plur.).',
    },
    {
      q: 'Quel temps exprime une action habituelle dans le passé ?',
      opts: ['Passé composé','Futur simple','Imparfait','Conditionnel'],
      correct: 2,
      explanation: 'L\'imparfait exprime une habitude passée (« Chaque matin, il lisait le journal »), une description ou une action en arrière-plan.',
    },
    {
      q: 'Complétez : « Si j\'avais su, je ___ venu plus tôt. » (venir)',
      opts: ['serai','viendrais','serais','viendrai'],
      correct: 2,
      explanation: 'Condition irréelle passée : si + plus-que-parfait → conditionnel passé. « Je serais venu » est la forme correcte du conditionnel passé de « venir ».',
    },
    {
      q: 'Quelle phrase est grammaticalement correcte ?',
      opts: ['Je me souviens de lui.','Je me souviens le.','Je me souviens à lui.','Je souviens de lui.'],
      correct: 0,
      explanation: 'Le verbe pronominal « se souvenir » se construit avec « de » + pronom tonique : « se souvenir de lui/elle/eux ». On ne peut pas omettre « se ».',
    },
    {
      q: 'Le verbe « partir » se conjugue avec l\'auxiliaire :',
      opts: ['Avoir','Être','Les deux selon le contexte','Aucun des deux'],
      correct: 1,
      explanation: '« Partir » est un verbe de mouvement intransitif qui se conjugue toujours avec l\'auxiliaire « être » aux temps composés.',
    },
    {
      q: 'Quelle est la forme passive de « Le directeur signe le contrat » ?',
      opts: ['Le contrat a signé le directeur.','Le contrat est signé par le directeur.','Le directeur est signé par le contrat.','Le contrat signé par le directeur.'],
      correct: 1,
      explanation: 'La voix passive = sujet (contrat) + être conjugué (est) + participe passé (signé) + « par » + agent (le directeur).',
    },
    {
      q: 'Complétez avec le bon pronom relatif : « C\'est le livre ___ je t\'ai parlé. »',
      opts: ['qui','que','dont','où'],
      correct: 2,
      explanation: '« Dont » remplace un complément introduit par « de » : « je t\'ai parlé de ce livre » → « le livre dont je t\'ai parlé ».',
    },
    {
      q: 'Quelle phrase utilise correctement le conditionnel de politesse ?',
      opts: ['Je veux un café.','Je voudrais un café, s\'il vous plaît.','Je voulais un café.','Je voudrai un café.'],
      correct: 1,
      explanation: 'Le conditionnel présent (voudrais) adoucit une demande et la rend polie. « Je veux » est direct, « je voulais » est imparfait, « je voudrai » est futur.',
    },
    {
      q: 'L\'accord du participe passé avec « avoir » se fait avec :',
      opts: ['Le sujet','Le complément d\'objet direct placé avant','L\'auxiliaire','Le verbe principal'],
      correct: 1,
      explanation: 'Avec « avoir », le participe passé s\'accorde uniquement avec le COD s\'il est placé AVANT le verbe (ex : « Les lettres que j\'ai écrites »).',
    },
  ],

  7: [
    {
      q: 'Dans le contexte de l\'immigration canadienne, « Express Entry » est :',
      opts: ['Une compagnie aérienne','Un système de gestion des demandes de résidence permanente','Un visa de tourisme','Un programme d\'études'],
      correct: 1,
      explanation: 'Express Entry est le portail en ligne d\'IRCC qui gère les demandes de résidence permanente pour les travailleurs qualifiés (STFQ, TPTE, CEC).',
    },
    {
      q: 'Que signifie « CAQ » en immigration québécoise ?',
      opts: ['Certificat d\'Acceptation du Québec','Candidature Administrative au Québec','Carte d\'Accès au Québec','Contrat d\'Acceptation Québécois'],
      correct: 0,
      explanation: 'Le CAQ (Certificat d\'Acceptation du Québec) est un document délivré par le MIFI, obligatoire pour étudier ou travailler temporairement au Québec.',
    },
    {
      q: 'Le mot « employeur » désigne :',
      opts: ['Celui qui cherche du travail','Celui qui offre du travail et paie un salaire','Un syndicat','Un fonctionnaire'],
      correct: 1,
      explanation: '« Employeur » = la personne ou l\'entreprise qui embauche et rémunère un salarié (≠ employé = celui qui travaille pour l\'employeur).',
    },
    {
      q: 'Quel mot est un synonyme de « logement » ?',
      opts: ['Nourriture','Habitation','Emploi','Formation'],
      correct: 1,
      explanation: '« Logement » = endroit où l\'on vit. Synonymes : habitation, domicile, résidence, demeure, hébergement.',
    },
    {
      q: 'Dans un CV, la « formation » désigne :',
      opts: ['L\'expérience professionnelle','Le parcours scolaire et les diplômes','Les loisirs','Les références'],
      correct: 1,
      explanation: 'La rubrique « Formation » d\'un CV liste les études, diplômes et certifications obtenus — à ne pas confondre avec l\'expérience professionnelle.',
    },
    {
      q: 'Le terme « subvention » signifie :',
      opts: ['Une taxe supplémentaire','Une aide financière accordée par l\'État ou un organisme','Un remboursement de prêt','Un salaire minimum'],
      correct: 1,
      explanation: 'Une subvention est une aide financière non remboursable accordée par un gouvernement ou un organisme pour soutenir un projet ou une activité.',
    },
    {
      q: 'Quel est le synonyme de « déménager » ?',
      opts: ['Rester sur place','Changer de domicile','Travailler à distance','Prendre sa retraite'],
      correct: 1,
      explanation: 'Déménager = changer de domicile, s\'installer dans un nouveau logement. À distinguer de « émigrer » (quitter son pays).',
    },
    {
      q: 'Dans un formulaire officiel, « date de naissance » signifie :',
      opts: ['La date d\'arrivée au Canada','La date de l\'examen','Le jour, le mois et l\'année où vous êtes né(e)','La date de votre mariage'],
      correct: 2,
      explanation: 'La date de naissance est l\'information biographique de base : le jour, le mois et l\'année auxquels on est né(e).',
    },
    {
      q: 'Le mot « bénévole » décrit quelqu\'un qui travaille :',
      opts: ['Pour un salaire élevé','Sans rémunération, de façon volontaire','À temps partiel','En intérim'],
      correct: 1,
      explanation: 'Un bénévole travaille gratuitement et volontairement pour une cause ou un organisme, sans contrepartie financière.',
    },
    {
      q: 'Quel terme désigne l\'autorisation officielle de travailler au Canada ?',
      opts: ['Visa de tourisme','Permis de travail','Carte de crédit','Numéro d\'assurance sociale uniquement'],
      correct: 1,
      explanation: 'Le permis de travail est le document délivré par IRCC qui autorise légalement un étranger à occuper un emploi au Canada.',
    },
  ],

  8: [
    {
      q: 'Vous entendez : « Bien que les résultats soient encourageants, des efforts supplémentaires s\'imposent. » L\'orateur exprime :',
      opts: ['Une satisfaction totale','Une critique virulente','Une nuance : progrès réels mais insuffisants','Un refus de commenter'],
      correct: 2,
      explanation: 'La structure « bien que… mais des efforts s\'imposent » = position nuancée : on reconnaît des progrès tout en soulignant qu\'ils ne sont pas suffisants.',
    },
    {
      q: 'Dans un débat radio, « prendre la parole » signifie :',
      opts: ['Voler le micro','Commencer à parler à son tour','Interrompre brutalement','Écouter en silence'],
      correct: 1,
      explanation: '« Prendre la parole » = commencer à s\'exprimer dans un cadre structuré (débat, réunion) — c\'est une expression neutre et formelle.',
    },
    {
      q: 'Vous entendez un bulletin météo : « Des précipitations sont attendues en fin de journée. » Cela signifie :',
      opts: ['Il fera beau','Il fera froid','Il va probablement pleuvoir ou neiger ce soir','Il y aura du brouillard le matin'],
      correct: 2,
      explanation: '« Précipitations » est le terme météorologique générique pour la pluie, la neige ou la grêle. « En fin de journée » = dans la soirée.',
    },
    {
      q: 'L\'expression « dans une certaine mesure » signifie :',
      opts: ['Totalement','Partiellement, jusqu\'à un certain point','Jamais','De façon exagérée'],
      correct: 1,
      explanation: '« Dans une certaine mesure » exprime une vérité partielle — on admet quelque chose mais sans l\'affirmer totalement.',
    },
    {
      q: 'Vous entendez une interview : « Je nuancerais ce constat. » L\'interviewé :',
      opts: ['Accepte complètement l\'affirmation','Refuse catégoriquement','Apporte des réserves à ce qui a été dit','Change de sujet'],
      correct: 2,
      explanation: '« Nuancer » = tempérer, apporter des précisions qui modèrent une affirmation sans la rejeter entièrement — position intermédiaire.',
    },
    {
      q: 'Dans une conférence, « à cet égard » introduit :',
      opts: ['Un nouveau sujet sans lien','Une précision sur ce qui vient d\'être dit','Une contradiction totale','Une question rhétorique'],
      correct: 1,
      explanation: '« À cet égard » = locution adverbiale formelle qui introduit une précision ou un développement relatif au point précédent.',
    },
    {
      q: 'Vous entendez : « Le taux de chômage a chuté de 2 points. » Cela signifie que le chômage a :',
      opts: ['Augmenté de 2%','Diminué de 2 points de pourcentage','Stagné','Doublé'],
      correct: 1,
      explanation: '« Chuter » = baisser fortement. « Chuter de 2 points » = diminuer de 2 points de pourcentage — le chômage a donc baissé.',
    },
    {
      q: 'Quelle est la différence entre « informer » et « convaincre » dans un discours oral ?',
      opts: ['Aucune différence','Informer transmet des faits, convaincre cherche à changer l\'opinion','Convaincre utilise uniquement des statistiques','Informer est toujours subjectif'],
      correct: 1,
      explanation: 'Informer = transmettre des faits de façon neutre ; convaincre = utiliser des arguments pour amener l\'auditeur à adopter un point de vue.',
    },
    {
      q: 'Vous entendez : « Force est de constater que… » Cette expression signifie :',
      opts: ['Il est impossible de savoir','On ne peut que reconnaître ce fait évident','Il est interdit de constater','On refuse d\'admettre'],
      correct: 1,
      explanation: '« Force est de constater que » = expression figée signifiant qu\'on est obligé d\'admettre un fait évident, même s\'il déplaît.',
    },
    {
      q: 'Dans une émission de débat, « l\'intervenant » désigne :',
      opts: ['L\'animateur uniquement','Toute personne qui prend la parole','Le technicien son','Le spectateur'],
      correct: 1,
      explanation: 'Un intervenant = toute personne qui prend la parole lors d\'un débat, d\'une conférence ou d\'une émission (invités, experts, animateur).',
    },
  ],

  9: [
    {
      q: 'Pour réussir l\'épreuve d\'expression orale au niveau B2/C1, il est essentiel de :',
      opts: ['Parler le plus vite possible','Utiliser des connecteurs variés et un vocabulaire précis','N\'utiliser que des mots simples','Éviter toute opinion personnelle'],
      correct: 1,
      explanation: 'Aux niveaux B2/C1, les critères clés sont la richesse lexicale, la variété syntaxique et l\'utilisation de connecteurs logiques appropriés.',
    },
    {
      q: 'Comment exprimer un désaccord poli en français formel ?',
      opts: ['C\'est faux !','Je ne suis pas d\'accord du tout.','Je me permets de nuancer ce point de vue.','Non !'],
      correct: 2,
      explanation: '« Je me permets de nuancer » est une formule de désaccord poli qui montre respect et maîtrise du registre formel — indispensable en EO.',
    },
    {
      q: 'Quelle phrase illustre le mieux l\'utilisation du registre soutenu ?',
      opts: ['Ça me semble pas top.','C\'est vraiment bien.','Il m\'apparaît que cette mesure présente des avantages indéniables.','C\'est pas mal du tout.'],
      correct: 2,
      explanation: '« Il m\'apparaît que » est une construction impersonnelle formelle. Les autres options utilisent des tournures familières (négation sans « ne », adverbes vagues).',
    },
    {
      q: 'Pour conclure un exposé oral, quelle formule est la plus appropriée ?',
      opts: ['Voilà, c\'est tout.','En conclusion, nous pouvons retenir que…','Bon, j\'ai fini.','Allez, au revoir !'],
      correct: 1,
      explanation: '« En conclusion, nous pouvons retenir que… » est une formule de clôture structurée qui synthétise les idées exposées et marque clairement la fin.',
    },
    {
      q: 'Le « débit » dans l\'expression orale fait référence à :',
      opts: ['Le vocabulaire utilisé','La vitesse à laquelle on parle','La qualité de la prononciation','La structure du discours'],
      correct: 1,
      explanation: 'Le débit = la vitesse de parole. Un débit trop rapide nuit à la compréhension, trop lent peut paraître hésitant — un débit régulier est idéal.',
    },
    {
      q: 'Dans une simulation d\'entretien oral, répondre uniquement « Oui » à toute question est :',
      opts: ['Idéal pour montrer son accord','Insuffisant car cela ne démontre pas sa capacité à développer','La meilleure stratégie','Pénalisé uniquement si répété 3 fois'],
      correct: 1,
      explanation: 'L\'examinateur évalue la capacité à développer, justifier et argumenter — une réponse monosyllabique ne démontre aucune compétence linguistique.',
    },
    {
      q: 'L\'expression « il va sans dire » signifie :',
      opts: ['Il faut le dire clairement','C\'est évident, cela s\'impose de lui-même','Il est impossible de le dire','Il vaut mieux se taire'],
      correct: 1,
      explanation: '« Il va sans dire que » = expression idiomatique signifiant « c\'est évident, cela va de soi » — elle renforce une affirmation présentée comme évidente.',
    },
    {
      q: 'Pour reformuler une idée en entretien oral, on peut dire :',
      opts: ['Laissez-moi répéter exactement la même chose.','Autrement dit, / En d\'autres termes, …','Je veux dire euh…','C\'est pareil.'],
      correct: 1,
      explanation: '« Autrement dit » et « en d\'autres termes » sont des connecteurs de reformulation formels qui permettent de clarifier une idée sans répéter.',
    },
    {
      q: 'Quel est le rôle de la « prosodie » dans l\'expression orale ?',
      opts: ['Elle désigne l\'orthographe parlée','Elle inclut le rythme, l\'intonation et l\'accentuation','Elle concerne uniquement la vitesse','Elle remplace les connecteurs logiques'],
      correct: 1,
      explanation: 'La prosodie regroupe le rythme, l\'intonation (montante/descendante) et l\'accentuation — ces éléments rendent le discours naturel et expressif.',
    },
    {
      q: 'Comment exprimer une certitude en français soutenu ?',
      opts: ['Peut-être que…','Il se pourrait que…','Il ne fait aucun doute que…','J\'imagine que…'],
      correct: 2,
      explanation: '« Il ne fait aucun doute que » + indicatif est une expression de certitude absolue en registre soutenu. Les autres options expriment le doute ou la supposition.',
    },
  ],

  10: [
    {
      q: 'Dans un texte complexe, « en dépit de » signifie :',
      opts: ['À cause de','Grâce à','Malgré','En plus de'],
      correct: 2,
      explanation: '« En dépit de » est une locution prépositionnelle synonyme de « malgré » — elle exprime une opposition entre deux faits.',
    },
    {
      q: 'Un « paradoxe » dans un texte est :',
      opts: ['Une évidence','Une affirmation qui semble contradictoire mais contient une vérité','Une statistique erronée','Un exemple concret'],
      correct: 1,
      explanation: 'Un paradoxe est une affirmation apparemment absurde ou contradictoire mais qui révèle une vérité profonde (ex : « moins c\'est plus »).',
    },
    {
      q: 'Le mot « prépondérant » signifie :',
      opts: ['Secondaire','Dominant, qui a le plus d\'importance','Inexistant','Contradictoire'],
      correct: 1,
      explanation: '« Prépondérant » = qui domine, qui l\'emporte sur les autres éléments par son importance ou son influence.',
    },
    {
      q: 'Dans un texte de presse, un « éditorial » est :',
      opts: ['Un article de faits','L\'opinion du directeur de publication','Un reportage photographique','Une annonce publicitaire'],
      correct: 1,
      explanation: 'L\'éditorial exprime la position officielle de la publication ou l\'opinion du rédacteur en chef — c\'est un texte d\'opinion, pas d\'information.',
    },
    {
      q: 'Quelle est la signification de « à l\'instar de » ?',
      opts: ['À la différence de','Contrairement à','À la manière de, comme','Avant'],
      correct: 2,
      explanation: '« À l\'instar de » = locution formelle signifiant « à la façon de, comme, de la même manière que » — elle introduit une comparaison.',
    },
    {
      q: 'Le terme « ubiquité » signifie :',
      opts: ['L\'absence totale','La capacité d\'être partout à la fois','La lenteur','La contradiction'],
      correct: 1,
      explanation: '« L\'ubiquité » = la capacité d\'être présent en plusieurs endroits simultanément. Ex : « Les réseaux sociaux ont l\'ubiquité ».',
    },
    {
      q: 'Dans un texte argumentatif, un « sophisme » est :',
      opts: ['Un argument logique solide','Un raisonnement fallacieux qui semble valide','Une citation exacte','Un fait vérifié'],
      correct: 1,
      explanation: 'Un sophisme est un raisonnement qui semble logique mais qui est en réalité incorrect ou trompeur — il vise à persuader sans véritablement prouver.',
    },
    {
      q: 'Que signifie « il convient de » dans un texte formel ?',
      opts: ['Il est interdit de','Il est déconseillé de','Il est approprié / il faut','Il est inutile de'],
      correct: 2,
      explanation: '« Il convient de » = expression impersonnelle formelle signifiant « il est approprié de, il est recommandé de » — plus élégant que « il faut ».',
    },
    {
      q: 'Un texte « synthétique » est un texte :',
      opts: ['Très long et détaillé','Qui résume l\'essentiel de façon concise','Incompréhensible','Entièrement en langage familier'],
      correct: 1,
      explanation: 'Un texte synthétique condense l\'information essentielle en peu de mots, sans détails inutiles — c\'est une qualité valorisée en production écrite.',
    },
    {
      q: 'La « connotation » d\'un mot est :',
      opts: ['Sa définition dans le dictionnaire','Son sens figuré, l\'idée évoquée au-delà du sens littéral','Son étymologie latine','Son niveau de langue'],
      correct: 1,
      explanation: 'La connotation = les idées, émotions et associations évoquées par un mot au-delà de son sens littéral (dénotation). Ex : « serpent » connote la traîtrise.',
    },
  ],

  11: [
    {
      q: 'Dans la Tâche 2 du TEF (expression écrite longue), le nombre de mots recommandé est d\'environ :',
      opts: ['50-80 mots','100-120 mots','200-250 mots','400-500 mots'],
      correct: 2,
      explanation: 'La Tâche 2 du TEF EE demande un texte argumentatif ou une lettre longue d\'environ 200-250 mots — en dessous du minimum, des points sont déduits.',
    },
    {
      q: 'Quelle phrase illustre un bon usage du discours indirect ?',
      opts: ['Il dit : « Je viendrai demain. »','Il dit qu\'il viendrait le lendemain.','Il dit que je viens demain.','Il dite qu\'il vient demain.'],
      correct: 1,
      explanation: 'Au discours indirect, le verbe de parole au passé (« dit ») entraîne une concordance : « viendrai » (futur) → « viendrait » (cond. présent) et « demain » → « le lendemain ».',
    },
    {
      q: 'Pour rédiger une introduction efficace, on doit :',
      opts: ['Donner immédiatement toutes les réponses','Présenter le sujet, contextualiser et annoncer le plan','Copier l\'énoncé word for word','Écrire uniquement des questions'],
      correct: 1,
      explanation: 'Une bonne introduction contextualise le sujet, présente l\'enjeu et annonce le plan — elle donne au lecteur un aperçu clair de ce qui suit.',
    },
    {
      q: 'Le « champ lexical » d\'un texte sur la technologie inclut :',
      opts: ['Forêt, rivière, montagne','Numérique, algorithme, interface, données','Amour, tendresse, émotion','Vote, parlement, loi'],
      correct: 1,
      explanation: 'Le champ lexical = ensemble des mots d\'un même thème. Pour la technologie : numérique, algorithme, interface, données, connecté, IA, etc.',
    },
    {
      q: 'Comment éviter les répétitions dans un texte écrit ?',
      opts: ['Écrire des phrases très courtes','Utiliser des pronoms, synonymes et périphrases','Répéter les mêmes mots mais en majuscules','Supprimer tous les articles'],
      correct: 1,
      explanation: 'Pour éviter les répétitions : utiliser des pronoms de reprise, des synonymes précis et des périphrases descriptives qui enrichissent le texte.',
    },
    {
      q: 'Le « registre soutenu » dans l\'écrit se caractérise par :',
      opts: ['Des abréviations et émoticônes','Un vocabulaire précis, des phrases complètes et une syntaxe élaborée','Des fautes orthographiques intentionnelles','Des phrases inachevées'],
      correct: 1,
      explanation: 'Le registre soutenu = vocabulaire riche et précis, phrases complètes bien construites, syntaxe complexe — attendu dans les productions écrites TEF/TCF.',
    },
    {
      q: 'Quelle est la différence entre « davantage » et « d\'avantage » ?',
      opts: ['Il n\'y en a aucune','« Davantage » signifie « plus », « d\'avantage » n\'existe pas en français standard','« d\'avantage » signifie « plus »','Les deux sont équivalents'],
      correct: 0,
      explanation: '« Davantage » (adverbe = plus) s\'écrit toujours en un seul mot. La forme « d\'avantage » n\'existe pas — c\'est une erreur courante à éviter.',
    },
    {
      q: 'Pour exprimer un but dans un texte formel, on utilise :',
      opts: ['Parce que','Afin de / afin que','Bien que','Malgré'],
      correct: 1,
      explanation: '« Afin de » + infinitif (même sujet) ou « afin que » + subjonctif (sujets différents) expriment le but de façon formelle.',
    },
    {
      q: 'Dans un texte argumentatif, l\'« implication » d\'un argument signifie :',
      opts: ['La répétition de l\'argument','La conséquence logique qui découle de cet argument','L\'introduction d\'un contre-argument','La reformulation de la thèse'],
      correct: 1,
      explanation: 'L\'implication = ce que l\'argument entraîne logiquement. Ex : « Si le niveau NCLC est élevé, il implique une meilleure intégration professionnelle ».',
    },
    {
      q: 'Le « participe présent » se forme en ajoutant ___ à la base du verbe (nous) :',
      opts: ['-ait','-ant','-ons','-aient'],
      correct: 1,
      explanation: 'Le participe présent se forme en remplaçant « -ons » de la 1re personne du pluriel par « -ant » (ex : nous finissons → finissant, nous prenons → prenant).',
    },
  ],

  12: [
    {
      q: 'Quelle est la meilleure stratégie pour gérer le temps en compréhension écrite ?',
      opts: ['Lire chaque texte 3 fois entièrement','Lire les questions d\'abord, puis chercher les réponses dans le texte','Répondre au hasard si le temps manque','Ignorer les textes longs'],
      correct: 1,
      explanation: 'Lire les questions avant le texte permet de cibler exactement l\'information à rechercher et d\'économiser un temps précieux en examen.',
    },
    {
      q: 'En compréhension orale, si vous n\'avez pas bien entendu un extrait, vous devez :',
      opts: ['Paniquer et sauter la question','Utiliser le contexte et les options pour déduire la réponse probable','Demander à l\'examinateur de répéter','Laisser la réponse vide'],
      correct: 1,
      explanation: 'En CO, vous ne pouvez pas réécouter — utilisez le contexte, éliminez les options absurdes et choisissez la plus plausible. Ne laissez jamais de blanc.',
    },
    {
      q: 'Combien de temps devriez-vous consacrer à relire votre production écrite ?',
      opts: ['Aucun temps, aller vite','5-10 minutes minimum pour corriger les erreurs','Toute la durée restante','Juste les 30 dernières secondes'],
      correct: 1,
      explanation: 'Réserver 5-10 minutes pour la relecture permet de corriger accords, conjugaisons et oublis — ces corrections peuvent faire gagner plusieurs points.',
    },
    {
      q: 'Dans une question à choix multiple, si deux réponses semblent correctes, vous devez :',
      opts: ['Choisir la plus longue','Choisir la plus précisément justifiée par le texte source','Cocher les deux','Laisser vide'],
      correct: 1,
      explanation: 'La bonne réponse est toujours celle qui est directement et précisément justifiée par le texte — pas celle qui semble « généralement vraie ».',
    },
    {
      q: 'Pour l\'expression orale, comment gérer un moment de blanc (silence) ?',
      opts: ['S\'arrêter et attendre en silence','Utiliser des expressions comme « C\'est-à-dire… » ou « En d\'autres termes… »','Parler en anglais','Répéter la question entière'],
      correct: 1,
      explanation: 'Les expressions de reformulation (« c\'est-à-dire », « autrement dit », « permettez-moi de préciser ») permettent de gagner du temps sans perturber le flux.',
    },
    {
      q: 'Quelle est l\'erreur la plus fréquente et pénalisée en expression écrite TEF/TCF ?',
      opts: ['Écrire trop peu (moins que le minimum requis)','Écrire trop (au-delà du maximum)','Utiliser un vocabulaire trop simple','Oublier la ponctuation'],
      correct: 0,
      explanation: 'Écrire en dessous du nombre de mots minimum est la faute la plus sanctionnée car elle démontre une incapacité à développer les idées suffisamment.',
    },
    {
      q: 'Pour maximiser son score en expression écrite, il faut :',
      opts: ['Utiliser uniquement des mots simples','Varier les structures de phrases et le vocabulaire','Écrire le plus vite possible sans relire','Utiliser des mots en anglais si nécessaire'],
      correct: 1,
      explanation: 'Les critères d\'évaluation valorisent la variété lexicale et syntaxique — alterner phrases simples et complexes, utiliser des synonymes et des connecteurs variés.',
    },
    {
      q: 'Dans une épreuve à durée limitée, la gestion du stress passe par :',
      opts: ['Tout refaire depuis le début si une erreur est faite','Une respiration calme et travailler méthodiquement','Comparer sa copie avec celle du voisin','Ne pas dormir la veille'],
      correct: 1,
      explanation: 'La gestion du stress = respiration abdominale calme + approche méthodique (commencer par ce qu\'on sait, revenir aux difficultés ensuite).',
    },
    {
      q: 'À quoi sert la phase de « planification » avant de rédiger en expression écrite ?',
      opts: ['À perdre du temps','À organiser ses idées et la structure du texte','À corriger l\'orthographe','À compter les mots'],
      correct: 1,
      explanation: 'Un brouillon rapide (2-3 minutes) permet d\'organiser ses idées, d\'éviter les hors-sujets et de produire un texte cohérent et bien structuré.',
    },
    {
      q: 'En compréhension orale, les informations importantes sont souvent indiquées par :',
      opts: ['Une pause ou une répétition dans l\'enregistrement','Un mot en anglais','Un silence de 10 secondes','Le débit très rapide de l\'orateur'],
      correct: 0,
      explanation: 'Les orateurs marquent les informations clés par des pauses, des répétitions ou un changement d\'intonation — ces signaux guident l\'auditeur attentif.',
    },
  ],

  13: [
    {
      q: 'Dans une simulation d\'examen, il est important de :',
      opts: ['Travailler dans les mêmes conditions que l\'examen réel (temps limité, sans aide)','Vérifier ses réponses sur internet','Prendre des pauses fréquentes','Commencer par les exercices les plus faciles uniquement'],
      correct: 0,
      explanation: 'S\'entraîner dans les conditions réelles (minuterie, sans dictionnaire) est la méthode la plus efficace pour s\'habituer à la pression de l\'examen.',
    },
    {
      q: 'Un score de 75% à une simulation signifie :',
      opts: ['Échec assuré à l\'examen','Un niveau déjà satisfaisant, à améliorer encore','Un résultat parfait','Un niveau insuffisant pour s\'améliorer'],
      correct: 1,
      explanation: '75% en simulation = niveau B2 solide, au-dessus du seuil minimal (70%) — à consolider pour viser NCLC 8-9 avec une préparation ciblée.',
    },
    {
      q: 'Compréhension orale : Vous entendez « Il est hors de question que je parte. » L\'orateur :',
      opts: ['Envisage de partir','Refuse catégoriquement de partir','Hésite à partir','Vient de partir'],
      correct: 1,
      explanation: '« Hors de question » est une expression idiomatique exprimant un refus absolu et catégorique — il n\'y a aucune ambiguïté possible.',
    },
    {
      q: 'Complétez : « ___ ses difficultés, il a réussi son examen. »',
      opts: ['Grâce à','Malgré','À cause de','En raison de'],
      correct: 1,
      explanation: '« Malgré » + nom exprime une concession : il a réussi EN DÉPIT de ses difficultés. « Grâce à » et « en raison de » introduisent une cause, pas une opposition.',
    },
    {
      q: 'Quel niveau NCLC correspond à la zone « intermédiaire avancé » (B2) ?',
      opts: ['NCLC 4-5','NCLC 6-7','NCLC 8-9','NCLC 10-12'],
      correct: 1,
      explanation: 'NCLC 6-7 correspond au niveau B2 du CECRL (intermédiaire avancé). NCLC 8-9 = C1 (avancé autonome), NCLC 10-12 = C2 (maîtrise).',
    },
    {
      q: 'Lisez : « Le gouvernement entend mettre en place de nouvelles mesures. » « entend » signifie ici :',
      opts: ['Écoute','Espère','A l\'intention de','Comprend'],
      correct: 2,
      explanation: 'Dans ce contexte, « entendre » signifie « avoir l\'intention de » — c\'est un faux ami par rapport au sens auditif habituel du verbe.',
    },
    {
      q: 'Quelle phrase utilise correctement le plus-que-parfait ?',
      opts: ['Quand il arriva, elle partait.','Quand il est arrivé, elle partira.','Quand il est arrivé, elle était déjà partie.','Quand il arrive, elle part.'],
      correct: 2,
      explanation: 'Le plus-que-parfait (était partie) exprime une action antérieure à une autre action passée (est arrivé). C\'est la valeur classique de ce temps.',
    },
    {
      q: 'Le mot « préalable » dans « conditions préalables » signifie :',
      opts: ['Conditions futures','Conditions qui doivent être remplies avant','Conditions facultatives','Conditions impossibles'],
      correct: 1,
      explanation: '« Préalable » = qui doit être accompli ou établi AVANT toute autre chose. Les conditions préalables sont des prérequis obligatoires.',
    },
    {
      q: 'Compréhension écrite — « Cet article est dépourvu de fondements scientifiques. » Cela signifie que l\'article :',
      opts: ['A une base scientifique solide','Manque de preuves scientifiques','A été rédigé par un scientifique','Est publié dans une revue scientifique'],
      correct: 1,
      explanation: '« Dépourvu de » = qui manque de, qui est privé de. « Dépourvu de fondements scientifiques » = sans preuves ni bases scientifiques sérieuses.',
    },
    {
      q: 'Pour la Tâche 1 en expression écrite (lettre formelle de réclamation), vous devez :',
      opts: ['Raconter une anecdote personnelle','Exposer un problème, en demander la résolution, et utiliser un ton poli mais ferme','Critiquer librement l\'entreprise avec un langage familier','Écrire uniquement en point de forme'],
      correct: 1,
      explanation: 'Une réclamation formelle : exposer clairement le problème, proposer ou demander une solution précise, maintenir un ton professionnel tout au long.',
    },
  ],

  14: [
    {
      q: 'La compétence « compréhension orale » est évaluée dans :',
      opts: ['Le TEF Canada uniquement','Le TCF Canada uniquement','Les deux examens (TEF et TCF Canada)','Aucun des deux'],
      correct: 2,
      explanation: 'La CO est une compétence fondamentale évaluée dans les deux examens — elle représente une part significative du score total NCLC.',
    },
    {
      q: 'Quel temps verbal est systématiquement utilisé pour les consignes d\'examen ?',
      opts: ['Futur simple','Conditionnel','Impératif présent','Imparfait'],
      correct: 2,
      explanation: 'L\'impératif présent exprime un ordre ou une instruction directe (ex : « Lisez le texte et répondez aux questions »).',
    },
    {
      q: 'Pour obtenir un NCLC 9 à l\'écrit, quel niveau CECRL faut-il généralement atteindre ?',
      opts: ['A2','B1','B2','C1'],
      correct: 3,
      explanation: 'NCLC 9 correspond généralement au niveau C1 du CECRL (avancé autonome) — c\'est le niveau cible pour maximiser les points dans Express Entry.',
    },
    {
      q: 'Quelle stratégie finale est recommandée pour la semaine avant l\'examen ?',
      opts: ['Apprendre du nouveau vocabulaire intensif','Réviser les points faibles identifiés et simuler des conditions d\'examen','Ne rien faire pour se reposer','Regarder des films en français 10h par jour'],
      correct: 1,
      explanation: 'La semaine avant l\'examen : réviser les points faibles, faire des simulations chronométrées et se reposer — éviter d\'apprendre du nouveau contenu.',
    },
    {
      q: 'Le connecteur « or » dans un texte argumentatif introduit :',
      opts: ['Une conclusion','Une cause','Une transition qui reformule ou précise un élément antérieur','Une liste'],
      correct: 2,
      explanation: '« Or » est un connecteur logique qui introduit une précision ou une transition dans le raisonnement (ex : « J\'ai étudié dur. Or, les résultats confirment mon niveau »).',
    },
    {
      q: 'Complétez : « Il aurait mieux valu qu\'il ___ plus tôt. » (prévenir)',
      opts: ['prévient','préviendrait','ait prévenu','prévenu'],
      correct: 2,
      explanation: 'Après « il aurait mieux valu que » (conditionnel passé), on utilise le subjonctif passé : « qu\'il ait prévenu » (avoir + participe passé au subjonctif).',
    },
    {
      q: 'Dans un examen officiel, la « grille de critères » sert à :',
      opts: ['Décorer la copie','Définir clairement comment les points sont attribués','Limiter les sujets traités','Pénaliser les candidats moins rapides'],
      correct: 1,
      explanation: 'La grille de critères permet à l\'examinateur d\'évaluer objectivement et uniformément chaque production selon des indicateurs précis et mesurables.',
    },
    {
      q: 'Un candidat qui termine son examen en avance devrait :',
      opts: ['Partir immédiatement','Utiliser le temps restant pour relire et corriger ses réponses','S\'endormir','Aider le voisin'],
      correct: 1,
      explanation: 'Relire sa copie permet de corriger des erreurs d\'étourderie (accords, oublis, réponses mal cochées) qui peuvent faire la différence sur le score final.',
    },
    {
      q: 'La « morphosyntaxe » dans les critères d\'évaluation écrite concerne :',
      opts: ['Le vocabulaire uniquement','La structure des phrases et les règles grammaticales','La ponctuation uniquement','Le nombre de mots utilisés'],
      correct: 1,
      explanation: 'La morphosyntaxe évalue la maîtrise des règles grammaticales : accords, conjugaisons, construction des phrases — c\'est l\'un des 4 critères officiels.',
    },
    {
      q: 'Quelle est la clé du succès pour le jour de l\'examen TEF/TCF Canada ?',
      opts: ['Mémoriser des réponses types','Arriver préparé, bien reposé et gérer son temps efficacement','Copier sur le voisin','Apporter ses notes'],
      correct: 1,
      explanation: 'La réussite combine préparation sérieuse, repos suffisant (éviter les révisions nocturnes) et gestion méthodique du temps pendant l\'épreuve.',
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  GET /api/modules/status
// ══════════════════════════════════════════════════════════════
router.get('/status', authMiddleware, stepGuard('qualification_done'), (req, res) => {
  try {
    const db = getDb();
    const user = req.user;

    let modules = db.prepare('SELECT * FROM modules WHERE user_id = ? ORDER BY module_number').all(user.id);

    if (modules.length === 0) {
      const ins = db.prepare('INSERT OR IGNORE INTO modules (user_id, module_number, status) VALUES (?, ?, ?)');
      for (let i = 1; i <= 14; i++) ins.run(user.id, i, i === 1 ? 'not_started' : 'locked');
      modules = db.prepare('SELECT * FROM modules WHERE user_id = ? ORDER BY module_number').all(user.id);
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
      stats: { total: 14, completed, current: user.current_module, all_done: user.all_modules_done === 1 },
      current_module: inProgress || nextNotStarted || null,
    },
  });
}

// ══════════════════════════════════════════════════════════════
//  POST /api/modules/:num/start
// ══════════════════════════════════════════════════════════════
router.post('/:num/start', authMiddleware, stepGuard('qualification_done'), (req, res) => {
  try {
    const db = getDb();
    const user = req.user;
    const num = parseInt(req.params.num);

    if (isNaN(num) || num < 1 || num > 14)
      return res.status(400).json({ success: false, message: 'Numéro de module invalide.' });

    const module = db.prepare('SELECT * FROM modules WHERE user_id = ? AND module_number = ?').get(user.id, num);
    if (!module) return res.status(404).json({ success: false, message: 'Module non trouvé.' });
    if (module.status === 'locked')    return res.status(403).json({ success: false, message: 'Ce module est verrouillé. Complétez le module précédent.' });
    if (module.status === 'completed') return res.json({ success: true, data: { module }, message: 'Module déjà complété.' });
    if (module.status === 'in_progress') return res.json({ success: true, data: { module }, message: 'Module déjà en cours.' });

    if (num > 1) {
      const prev = db.prepare('SELECT * FROM modules WHERE user_id = ? AND module_number = ?').get(user.id, num - 1);
      if (!prev || prev.status !== 'completed')
        return res.status(403).json({ success: false, message: 'Complétez le module précédent avant de commencer celui-ci.' });
    }

    db.prepare(`UPDATE modules SET status='in_progress', started_at=datetime('now') WHERE user_id=? AND module_number=?`).run(user.id, num);
    db.prepare('UPDATE users SET current_module=? WHERE id=?').run(num, user.id);

    const updated = db.prepare('SELECT * FROM modules WHERE user_id=? AND module_number=?').get(user.id, num);
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

// ══════════════════════════════════════════════════════════════
//  GET /api/modules/:num/test  — questions mélangées, sans correction
// ══════════════════════════════════════════════════════════════
router.get('/:num/test', authMiddleware, stepGuard('qualification_done'), (req, res) => {
  try {
    const db = getDb();
    const num = parseInt(req.params.num);

    if (isNaN(num) || num < 1 || num > 14)
      return res.status(400).json({ success: false, message: 'Numéro de module invalide.' });

    const module = db.prepare('SELECT * FROM modules WHERE user_id=? AND module_number=?').get(req.user.id, num);
    if (!module) return res.status(404).json({ success: false, message: 'Module non trouvé.' });
    if (module.status === 'locked') return res.status(403).json({ success: false, message: 'Module verrouillé.' });

    // Mélanger les questions à chaque accès (Fisher-Yates)
    const shuffled = shuffleArray(MODULE_TESTS[num] || []);
    const questions = shuffled.map((q) => ({
      id: q._origIdx,   // index original = clé pour la correction côté serveur
      question: q.q,
      options: q.opts,  // ordre des options inchangé (seul l'ordre des questions varie)
    }));

    return res.json({
      success: true,
      data: {
        module_number: num,
        title: MODULE_TITLES[num],
        questions,
        total: questions.length,
        passing_score: 70,
        test_passed:   module.test_passed   || 0,
        test_score:    module.test_score    || 0,
        test_attempts: module.test_attempts || 0,
      },
    });
  } catch (err) {
    console.error('[Modules] Get test error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  POST /api/modules/:num/test/submit
// ══════════════════════════════════════════════════════════════
router.post('/:num/test/submit', authMiddleware, stepGuard('qualification_done'), async (req, res) => {
  try {
    const db  = getDb();
    const user = req.user;
    const num  = parseInt(req.params.num);

    if (isNaN(num) || num < 1 || num > 14)
      return res.status(400).json({ success: false, message: 'Numéro de module invalide.' });

    const module = db.prepare('SELECT * FROM modules WHERE user_id=? AND module_number=?').get(user.id, num);
    if (!module) return res.status(404).json({ success: false, message: 'Module non trouvé.' });
    if (module.status === 'locked') return res.status(403).json({ success: false, message: 'Module verrouillé.' });

    // Test déjà réussi → renvoyer le succès sans retraiter
    if (module.test_passed)
      return res.json({ success: true, message: 'Test déjà réussi.', data: { passed: true, score: module.test_score } });

    // Cooldown entre tentatives (dès la 2e tentative)
    if ((module.test_attempts || 0) > 0 && module.test_last_attempt_at) {
      const minutesSince = (Date.now() - new Date(module.test_last_attempt_at.replace(' ', 'T') + 'Z').getTime()) / 60000;
      if (minutesSince < ATTEMPT_COOLDOWN_MINUTES) {
        const waitMin = Math.ceil(ATTEMPT_COOLDOWN_MINUTES - minutesSince);
        return res.status(429).json({
          success: false,
          message: `Veuillez patienter encore ${waitMin} minute(s) avant de retenter ce test.`,
          wait_minutes: waitMin,
        });
      }
    }

    const { answers } = req.body; // { originalIndex: selectedOption, ... }
    if (!answers || typeof answers !== 'object')
      return res.status(400).json({ success: false, message: 'Réponses requises.' });

    const questions = MODULE_TESTS[num] || [];
    let correct = 0;
    const feedback = questions.map((q, origIdx) => {
      const given   = parseInt(answers[origIdx]);
      const isCorrect = given === q.correct;
      if (isCorrect) correct++;
      return {
        id:             origIdx,
        correct:        isCorrect,
        given_answer:   isNaN(given) ? null : given,
        correct_answer: q.correct,
        explanation:    isCorrect ? null : q.explanation,  // explication uniquement si faux
      };
    });

    const score    = Math.round((correct / questions.length) * 100);
    const passed   = score >= 70;
    const attempts = (module.test_attempts || 0) + 1;

    // Sauvegarder score, tentatives et timestamp
    db.prepare(`UPDATE modules SET test_score=?, test_passed=?, test_attempts=?, test_last_attempt_at=datetime('now') WHERE user_id=? AND module_number=?`)
      .run(score, passed ? 1 : 0, attempts, user.id, num);

    let allDone = false;

    if (passed) {
      db.prepare(`UPDATE modules SET status='completed', completed_at=datetime('now'), score=? WHERE user_id=? AND module_number=?`)
        .run(score, user.id, num);

      if (num < 14) {
        db.prepare(`UPDATE modules SET status='not_started' WHERE user_id=? AND module_number=?`).run(user.id, num + 1);
        db.prepare('UPDATE users SET current_module=? WHERE id=?').run(num + 1, user.id);
      } else {
        allDone = true;
        db.prepare('UPDATE users SET all_modules_done=1, current_module=14 WHERE id=?').run(user.id);

        const inviteHtml = `<h2 style="color:#074A2E;">🎓 Félicitations !</h2>
          <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
          <p>Vous avez complété les <strong>14 modules</strong> de formation ARCADINS et réussi tous les tests !</p>
          <p>Vous êtes maintenant invité(e) à passer le <strong>Test Final</strong> pour obtenir votre certificat officiel.</p>
          <p><a href="${process.env.CUSTOM_DOMAIN || process.env.FRONTEND_URL || ''}/pages/test-final.html"
               style="background:#074A2E;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
            Passer le test final →
          </a></p>`;
        sendUserEmail(user.email, '[ARCADINS] 🎓 Formation complétée — Passez le test final !', inviteHtml).catch(() => {});
      }
    }

    return res.json({
      success: true,
      data: { score, passed, correct, total: questions.length, attempts, feedback, all_done: allDone },
      message: passed
        ? (allDone
            ? '🎉 Formation complétée ! Vous pouvez passer le test final.'
            : `✅ Test réussi (${score}%) ! Module ${num + 1} déverrouillé.`)
        : `❌ Score insuffisant (${score}%). Minimum requis : 70%. Réessayez dans ${ATTEMPT_COOLDOWN_MINUTES} minutes.`,
    });
  } catch (err) {
    console.error('[Modules] Test submit error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  POST /api/modules/:num/complete  — bloqué, la validation passe par le test
// ══════════════════════════════════════════════════════════════
router.post('/:num/complete', authMiddleware, stepGuard('qualification_done'), (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Veuillez passer le test du module pour valider votre progression.',
  });
});

module.exports = router;
