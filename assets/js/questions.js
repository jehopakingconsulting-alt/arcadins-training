// ============================================================
// ARCADINS Training Center — Banque de questions enrichie
// 400+ questions · 7 catégories · Mélange aléatoire intelligent
// ============================================================

const QUESTION_BANK = {

  // ===== GRAMMAIRE — 60 questions =====
  grammaire: [
    { q:"Choisissez la bonne forme : « Elle a ______ ses valises hier soir. »", opts:["fait","fais","faire","faite"], ans:0, expl:"Le participe passé de 'faire' est 'fait'. Avec l'auxiliaire avoir, il ne s'accorde pas avec le sujet." },
    { q:"Quel est l'accord correct ? « Les lettres qu'il a ______. »", opts:["écrit","écrites","écrits","écrite"], ans:1, expl:"Le COD 'que' (= lettres, fém. plur.) précède l'auxiliaire avoir : accord obligatoire → 'écrites'." },
    { q:"Complétez : « Il faut que tu ______ présent. »", opts:["es","sera","sois","soit"], ans:2, expl:"'Il faut que' déclenche le subjonctif présent → 'sois' pour 'tu'." },
    { q:"« ______ vous partirez tôt, ______ vous arriverez. »", opts:["Moins/plus","Plus/plus","Plus/moins","Autant/autant"], ans:1, expl:"Structure comparative 'plus…plus' exprime une proportionnalité positive." },
    { q:"Choisissez la bonne préposition : « Il rêve ______ partir au Canada. »", opts:["de","à","pour","en"], ans:0, expl:"'Rêver de + infinitif' est la seule construction correcte." },
    { q:"Identifiez le subjonctif passé : ", opts:["Il est possible qu'il vienne","Il est possible qu'il soit venu","Il est possible qu'il viendra","Il est possible qu'il est venu"], ans:1, expl:"Subjonctif passé = subjonctif de l'auxiliaire + participe passé : 'soit venu'." },
    { q:"Quelle phrase contient une erreur d'accord ?", opts:["Les documents que j'ai reçus sont complets","Le programme qu'elle a suivi est excellent","Les cours qu'il a donnés étaient intéressants","Les examens que nous avons passé sont difficiles"], ans:3, expl:"'passé' doit s'accorder avec 'que' (= examens, masc. plur.) → 'passés'." },
    { q:"Complétez : « Quoiqu'elle ______ très qualifiée, elle n'a pas été retenue. »", opts:["est","sera","soit","était"], ans:2, expl:"'Quoique' est une conjonction de concession qui exige le subjonctif → 'soit'." },
    { q:"« Ni Pierre ni Marie ne ______ venu(s). »", opts:["est","sont","a","ont"], ans:1, expl:"'Ni…ni' avec deux sujets distincts → accord au pluriel → 'sont venus'." },
    { q:"Choisissez : « C'est lui ______ a pris la décision. »", opts:["qui","que","dont","lequel"], ans:0, expl:"'Qui' = pronom relatif sujet du verbe 'a pris'." },
    { q:"« Si j'avais su, je ______ venu plus tôt. »", opts:["suis","serais","serai","était"], ans:1, expl:"Si + plus-que-parfait → conditionnel passé → 'serais venu'. C'est l'hypothèse irréelle dans le passé." },
    { q:"« Les résultats ______ affichés dès que le jury ______ délibéré. »", opts:["seront/aura","seront/a","sont/aura","ont été/avait"], ans:0, expl:"Futur simple dans la principale + futur antérieur dans la subordonnée de temps." },
    { q:"Identifiez l'erreur : « Malgré qu'il soit tard, il continue. »", opts:["Aucune erreur","'Malgré que' incorrect → 'Bien que'","'soit' incorrect","'continue' incorrect"], ans:1, expl:"'Malgré que' est fautif en français standard. La forme correcte est 'Bien que' + subjonctif." },
    { q:"Le conditionnel passé dans « J'aurais aimé venir » exprime :", opts:["Un futur certain","Un regret ou une hypothèse irréelle passée","Une obligation","Une permission"], ans:1, expl:"Le conditionnel passé exprime un regret ou une hypothèse irréalisée dans le passé." },
    { q:"Choisissez : « C'est une décision ______ nous assumons ensemble. »", opts:["que","qui","dont","laquelle"], ans:0, expl:"'Que' = pronom relatif COD (la décision est le COD du verbe 'assumer')." },
    { q:"Quelle phrase est au plus-que-parfait ?", opts:["Il partira demain","Il était parti avant mon arrivée","Il part maintenant","Il partait souvent"], ans:1, expl:"Plus-que-parfait = auxiliaire à l'imparfait + participe passé : 'était parti'." },
    { q:"Complétez : « Je doute qu'il ______ la vérité. »", opts:["dit","dira","dise","dirait"], ans:2, expl:"'Douter que' déclenche le subjonctif présent → 'dise'." },
    { q:"Identifiez la voix passive : ", opts:["Il mange une pomme","La pomme est mangée par lui","Il a mangé la pomme","Mangeons la pomme"], ans:1, expl:"Voix passive = être conjugué + participe passé. L'agent peut être introduit par 'par'." },
    { q:"« On m'a dit que tu ______ malade. »", opts:["es","étais","sois","seras"], ans:1, expl:"Concordance des temps au discours indirect : présent → imparfait après un verbe principal au passé." },
    { q:"Quel verbe se conjugue TOUJOURS avec 'être' au passé composé ?", opts:["manger","partir","finir","prendre"], ans:1, expl:"Les verbes de mouvement intransitifs (partir, aller, venir, naître, mourir…) utilisent 'être'." },
    { q:"« Bien ______ ce problème, il a trouvé la solution. »", opts:["comprenant","comprendant","comprends","avoir compris"], ans:0, expl:"Participe présent = radical du verbe + -ant : comprend- → 'comprenant'. Ne jamais écrire 'comprendant'." },
    { q:"Complétez : « Il ______ midi quand nous sommes arrivés. »", opts:["était","a été","est","serait"], ans:0, expl:"Pour situer une circonstance de temps dans le passé → imparfait 'était'." },
    { q:"Identifiez la phrase hypothétique correcte :", opts:["Si il viendrait, je serais content","Si il vient, je serais content","S'il venait, je serais content","Si il vient, je suis content"], ans:2, expl:"Si + imparfait → conditionnel présent : 'S'il venait, je serais content'. Jamais de conditionnel après 'si'." },
    { q:"Complétez : « Elle ______ ses devoirs avant que je n'______. »", opts:["avait fini/arrive","a fini/sois arrivé","eut fini/arrive","aura fini/arrive"], ans:3, expl:"Futur antérieur (aura fini) exprime l'antériorité + subjonctif présent (arrive) après 'avant que'." },
    { q:"'De surcroît' est un connecteur qui exprime :", opts:["L'opposition","L'addition renforcée","La cause","Le temps"], ans:1, expl:"'De surcroît' = 'en plus de cela'. Synonymes : de plus, qui plus est, en outre, par ailleurs." },
    { q:"Choisissez la forme correcte du subjonctif : « Il est essentiel que vous ______ ce document. »", opts:["signez","signeriez","signerez","signé"], ans:0, expl:"'Il est essentiel que' exige le subjonctif présent → 'signiez'. (Orthographe : sign-iez, pas sign-ez.)" },
    { q:"Complétez : « Aussitôt qu'il ______ la lettre, il a répondu. »", opts:["a reçu","recevait","aura reçu","reçoit"], ans:0, expl:"'Aussitôt que' au passé + passé composé dans les deux propositions." },
    { q:"Identifiez la phrase à la forme impersonnelle :", opts:["Il mange beaucoup","Il est important de travailler","Il part demain","Il nous attend"], ans:1, expl:"'Il est important de' est une tournure impersonnelle. Le sujet 'il' ne désigne personne." },
    { q:"Choisissez : « Je lui ______ la lettre hier. »", opts:["ai envoyé","ai envoyée","ait envoyé","aie envoyé"], ans:0, expl:"Le COD 'la lettre' est placé après le verbe → pas d'accord avec avoir → 'envoyé' invariable." },
    { q:"« ______ travaillé dur, il a réussi. »", opts:["Pour avoir","Ayant","Pour","D'avoir"], ans:1, expl:"Le participe présent composé 'ayant travaillé' exprime l'antériorité par rapport au résultat." },
    { q:"Quel temps exprime une action habituelle dans le passé ?", opts:["Le passé composé","L'imparfait","Le plus-que-parfait","Le passé simple"], ans:1, expl:"L'imparfait décrit des actions habituelles ou répétées dans le passé : 'Il allait au bureau chaque matin'." },
    { q:"Complétez : « À condition qu'elle ______, nous acceptons. »", opts:["vient","viendra","vienne","viendrait"], ans:2, expl:"'À condition que' + subjonctif présent → 'vienne'." },
    { q:"Quelle est la forme correcte ? « Les candidats ______ sélectionnés seront convoqués. »", opts:["qui ont été","que ont été","qui étaient","qu'ont été"], ans:0, expl:"Proposition relative au passé composé passif : 'qui ont été sélectionnés'." },
    { q:"Complétez : « Bien qu'il ______ fatigué, il a continué. »", opts:["est","soit","était","sera"], ans:1, expl:"'Bien que' + subjonctif présent → 'soit'. C'est une conjonction de concession." },
    { q:"Choisissez la forme correcte : « Elle s'est ______ les mains. »", opts:["lavée","lavé","laver","lavées"], ans:1, expl:"Se laver = verbe pronominal avec COD 'les mains' postposé → le participe ne s'accorde pas avec le sujet." },
    { q:"Dans quelle phrase le pronom 'y' remplace-t-il un lieu ?", opts:["J'y pense souvent","J'y vais demain","J'y réponds ce soir","J'y consens"], ans:1, expl:"Dans 'J'y vais demain', 'y' remplace un complément de lieu : 'Je vais [là-bas] demain'." },
    { q:"Complétez : « Il m'a demandé si je ______ satisfait. »", opts:["suis","étais","serais","sois"], ans:1, expl:"Discours indirect au passé : le présent du discours direct devient l'imparfait → 'étais'." },
    { q:"Choisissez la bonne tournure : « ______ arrivé le premier, il a ouvert la salle. »", opts:["Étant","Ayant","Bien qu'","Quoique"], ans:0, expl:"Le participe présent composé passif 'Étant arrivé' exprime une cause ou une circonstance antérieure." },
    { q:"Quel pronom utilise-t-on pour remplacer 'de + chose' ?", opts:["lui","leur","en","y"], ans:2, expl:"Le pronom 'en' remplace 'de + chose' : 'Je parle de ce projet' → 'J'en parle'." },
    { q:"Complétez : « Que vous le vouliez ou ______, c'est décidé. »", opts:["pas","non","non pas","ne pas"], ans:1, expl:"La locution 'ou non' s'utilise pour exprimer une alternative : 'que vous le vouliez ou non'." },
    { q:"Identifiez la phrase au conditionnel présent :", opts:["Il viendrait si on l'invitait","Il vient souvent","Il est venu hier","Il vient demain"], ans:0, expl:"'Viendrait' est la forme du conditionnel présent (il/elle + radical + -ait)." },
    { q:"Quelle préposition accompagne 'se souvenir' ?", opts:["à","de","pour","en"], ans:1, expl:"'Se souvenir DE quelque chose' : 'Je me souviens de mon arrivée au Canada'." },
    { q:"Complétez : « Plus on pratique, ______ on s'améliore. »", opts:["plus","moins","autant","mieux"], ans:3, expl:"'Plus on pratique, mieux on s'améliore' est la tournure idiomatique correcte avec un adverbe de qualité." },
    { q:"Choisissez : « Des informations ______ ont été publiées. »", opts:["supplémentaires","supplémentaire","supplémentairement","supplémentaires-ci"], ans:0, expl:"L'adjectif s'accorde avec le nom féminin pluriel 'informations' → 'supplémentaires'." },
    { q:"Dans « Il ne mange que des légumes », 'ne…que' exprime :", opts:["La négation totale","La restriction","Le doute","L'hypothèse"], ans:1, expl:"'Ne…que' est une tournure restrictive équivalente à 'seulement' : 'Il mange seulement des légumes'." },
    { q:"Quel est le mode du verbe dans « Veuillez trouver ci-joint… » ?", opts:["Indicatif","Conditionnel","Impératif","Subjonctif"], ans:2, expl:"'Veuillez' est l'impératif présent du verbe 'vouloir'. Très utilisé dans les formules épistolaires formelles." },
    { q:"Complétez : « Je ne sais pas ______ elle viendra. »", opts:["si","que","quoi","dont"], ans:0, expl:"Dans une interrogative indirecte, 'si' introduit le doute sur un fait : 'Je ne sais pas si elle viendra'." },
    { q:"Quelle phrase utilise correctement le gérondif ?", opts:["En arrivant, la porte était ouverte","En travaillant régulièrement, il a progressé","En étant parti tôt, le bus était là","En faisant froid, il est resté"], ans:1, expl:"Le sujet du gérondif DOIT être identique au sujet principal : 'il' travaille ET 'il' a progressé." },
    { q:"Choisissez la bonne forme : « Il est interdit de ______ ici. »", opts:["fumer","fumé","fume","fumant"], ans:0, expl:"Après 'de', on utilise l'infinitif présent : 'Il est interdit de fumer'." },
    { q:"Complétez : « Depuis qu'elle est arrivée, elle ______ beaucoup. »", opts:["a progressé","progressait","aura progressé","progresse"], ans:0, expl:"'Depuis que' + passé composé pour une action commencée dans le passé et dont le résultat est visible maintenant." },
    { q:"Identifiez la phrase avec un accord erroné :", opts:["Elles se sont rencontrées hier","Elles se sont téléphoné hier","Elles se sont vues au bureau","Elles se sont saluées poliment"], ans:1, expl:"'Téléphoner' est un verbe pronominal à COI → pas d'accord : 'Elles se sont téléphoné' (correct en fait). Mais 'Elles se sont vues' est correct car voir a un COD." },
    { q:"Quelle conjonction introduit une proposition de but ?", opts:["parce que","pour que","bien que","puisque"], ans:1, expl:"'Pour que' + subjonctif = but : 'Je t'explique pour que tu comprennes'." },
    { q:"Choisissez : « Ayant ______ ses clés, il ne pouvait pas entrer. »", opts:["perdu","perdé","perdit","perdait"], ans:0, expl:"Participe présent composé actif = ayant + participe passé → 'ayant perdu'." },
    { q:"Complétez : « C'est le candidat ______ le dossier a été accepté. »", opts:["qui","que","dont","auquel"], ans:2, expl:"'Dont' = pronom relatif remplaçant 'de + antécédent' : 'le dossier de ce candidat' → 'dont le dossier'." },
    { q:"Quel temps utilise-t-on après 'quand' pour le futur ?", opts:["Le futur simple","Le conditionnel","Le subjonctif","Le présent de l'indicatif"], ans:0, expl:"Contrairement à l'anglais, en français on utilise le futur dans les subordonnées temporelles : 'Quand il arrivera…'" },
    { q:"Choisissez la bonne forme : « Nous ______ partir dès maintenant. »", opts:["devrions","devraient","devrait","devront"], ans:0, expl:"'Nous' + conditionnel présent → 'devrions'. Le conditionnel présent de 'devoir' pour 'nous' = devrions." },
    { q:"Identifiez le complément d'objet indirect (COI) :", opts:["Il mange une pomme","Il parle à son ami","Il voit le film","Il prend le bus"], ans:1, expl:"'À son ami' est un COI car il répond à 'à qui ?'. Le COD répond à 'qui ?' ou 'quoi ?'." },
    { q:"Complétez : « Sans ______ fait d'efforts, tu n'aurais pas réussi. »", opts:["avoir","être","ayant","étant"], ans:0, expl:"'Sans avoir fait' = construction infinitive négative passée : 'sans + avoir/être + participe passé'." },
    { q:"Quelle est la forme correcte de la négation au passé composé ?", opts:["Il a ne pas mangé","Il n'a pas mangé","Il a mangé pas","Il pas mangé"], ans:1, expl:"La négation encadre l'auxiliaire au passé composé : 'il n'a pas mangé'. Ne jamais séparer ne/pas." },
    { q:"Complétez : « Je cherche quelqu'un qui ______ le français couramment. »", opts:["parle","parlerait","parle (subjonctif)","parlera"], ans:2, expl:"Après 'quelqu'un qui' dans une recherche indéterminée → subjonctif présent 'parle' (même forme que l'indicatif ici, mais c'est bien le subjonctif)." },
    { q:"Choisissez la bonne forme verbale : « Elle a réussi mieux qu'on ne ______ espéré. »", opts:["l'avait","l'a","l'aurait","le"], ans:0, expl:"'Ne' explétif est possible après les comparatifs. 'Mieux qu'on ne l'avait espéré' est la forme soutenue correcte." }
  ],

  // ===== VOCABULAIRE IMMIGRATION — 60 questions =====
  vocabulaire: [
    { q:"La 'résidence permanente' au Canada signifie :", opts:["La citoyenneté canadienne","Vivre/travailler au Canada sans être citoyen","Un visa temporaire","Une autorisation de voyage"], ans:1, expl:"La RP permet de vivre et travailler de façon permanente sans être citoyen. Elle doit être renouvelée tous les 5 ans." },
    { q:"Le 'parrainage' désigne :", opts:["Une bourse d'études","Un contrat de travail","Le soutien d'un résident/citoyen pour un proche","Un permis temporaire"], ans:2, expl:"Le parrainage permet à un citoyen ou résident permanent de soutenir un membre de famille pour immigrer." },
    { q:"'CRS' dans Express Entry signifie :", opts:["Centre de Régularisation des Statuts","Comprehensive Ranking System","Certificat de Résidence Spéciale","Comité de Révision des Statuts"], ans:1, expl:"Le CRS est le système de classement qui attribue des points selon les compétences, l'âge, la langue, l'expérience." },
    { q:"Le MIFI au Québec est :", opts:["Ministère des Impôts et Finances","Ministère de l'Immigration, de la Francisation et de l'Intégration","Module d'Intégration des Francophones","Ministère des Investissements"], ans:1, expl:"Le MIFI gère l'immigration provinciale québécoise et les programmes de francisation." },
    { q:"L'ITD dans Express Entry signifie :", opts:["Invitation à présenter une Demande","Identifiant de Traitement du Dossier","Indicateur de Traitement Différé","Inscription au Test de Diplôme"], ans:0, expl:"L'ITD (Invitation to Apply / ITA) est l'invitation officielle d'IRCC à soumettre une demande de RP." },
    { q:"Le CSQ est :", opts:["Le passeport québécois","Le document provincial qui précède la RP au Québec","Un certificat linguistique","Un permis de travail temporaire"], ans:1, expl:"Le CSQ (Certificat de Sélection du Québec) est délivré par le MIFI. Il précède la demande fédérale de RP." },
    { q:"Un 'permis de travail fermé' signifie :", opts:["Permis pour tout employeur","Permis lié à un seul employeur spécifique","Permis refusé","Permis expiré"], ans:1, expl:"Le permis fermé lie le travailleur à un seul employeur. Son nom figure explicitement sur le permis." },
    { q:"L'EIMT est :", opts:["Un test de compétences","Un document prouvant qu'aucun Canadien n'est disponible pour le poste","Un diplôme reconnu","Une évaluation économique"], ans:1, expl:"L'EIMT (Étude d'Impact sur le Marché du Travail) est délivrée par EDSC avant l'embauche d'un travailleur étranger." },
    { q:"La 'francisation' au Québec désigne :", opts:["La traduction de documents","L'apprentissage du français offert gratuitement aux immigrants","L'obligation de parler français","La certification des diplômes"], ans:1, expl:"Le programme de francisation aide les nouveaux arrivants à apprendre le français, souvent gratuitement." },
    { q:"NCLC 7 correspond environ à :", opts:["A2 (CECRL)","B2 (CECRL)","C2 (CECRL)","A1 (CECRL)"], ans:1, expl:"NCLC 7 ≈ B2 du CECRL. C'est le seuil minimum pour obtenir des points de langue en français dans Express Entry." },
    { q:"Le PEQ au Québec désigne :", opts:["Programme d'Entrée au Québec","Programme de l'Expérience Québécoise","Permis d'Établissement au Québec","Programme Éducatif Québécois"], ans:1, expl:"Le PEQ permet aux travailleurs temporaires et étudiants étrangers ayant étudié au Québec d'obtenir la RP." },
    { q:"Express Entry a été lancé en :", opts:["2010","2013","2015","2018"], ans:2, expl:"Express Entry a été introduit en janvier 2015 comme système principal de sélection des immigrants économiques." },
    { q:"Un 'permis de travail ouvert' signifie :", opts:["Permis pour un seul employeur","Permis permettant de travailler pour tout employeur","Permis en cours de traitement","Permis pour étudiants seulement"], ans:1, expl:"Le permis ouvert n'est pas lié à un employeur spécifique. Exemple : le permis pour conjoint de travailleur qualifié." },
    { q:"Que signifie 'CECRL' ?", opts:["Cadre Européen Commun de Référence pour les Langues","Centre d'Évaluation des Compétences en Recherche Linguistique","Certificat Européen de Compétences en Langue","Comité Européen de Certification des Langues"], ans:0, expl:"Le CECRL est la référence internationale pour évaluer les compétences langagières, de A1 (débutant) à C2 (expert)." },
    { q:"La durée de validité des résultats TEF & TCF Canada pour IRCC est :", opts:["6 mois","1 an","2 ans","5 ans"], ans:2, expl:"Les résultats du TEF & TCF Canada sont valides 2 ans pour les dossiers IRCC." },
    { q:"'IRCC' est l'acronyme de :", opts:["Institut de Recherche Canadien en Communication","Immigration Réfugiés et Citoyenneté Canada","Inspection et Régulation du Commerce Canadien","Intégration et Résidence pour les Citoyens du Canada"], ans:1, expl:"IRCC est le ministère fédéral canadien qui gère toute l'immigration, les réfugiés et la citoyenneté." },
    { q:"Le 'CLB' est l'équivalent anglophone du :", opts:["CECRL","NCLC","TEF","TCF"], ans:1, expl:"CLB (Canadian Language Benchmarks) = NCLC (Niveaux de compétence linguistique canadiens) en anglais." },
    { q:"'NOC' signifie :", opts:["Numéro d'Ordre Canadien","Classification Nationale des Professions","Norme Officielle Canadienne","Niveau d'Ouverture aux Compétences"], ans:1, expl:"Le NOC (National Occupational Classification) est le système canadien de classification des professions." },
    { q:"Le TEER dans le NOC représente :", opts:["Taux d'Emploi et Expertise Régionale","Formation, éducation, expérience et responsabilités","Test d'Évaluation et d'Emploi au Régional","Titre d'Emploi et Expérience Reconnue"], ans:1, expl:"TEER (Training, Education, Experience and Responsibilities) remplace les anciens niveaux O-A-B-C-D du NOC depuis 2022." },
    { q:"Combien de compétences sont évaluées au TEF & TCF Canada ?", opts:["2","3","4","5"], ans:2, expl:"4 compétences : Compréhension Orale, Compréhension Écrite, Expression Orale, Expression Écrite." },
    { q:"Le 'CAQ' est :", opts:["Un visa fédéral","Un certificat d'acceptation du Québec pour les étudiants","Un permis de travail ouvert","Une attestation de niveau de langue"], ans:1, expl:"Le CAQ (Certificat d'Acceptation du Québec) est requis par le Québec avant le permis d'études fédéral." },
    { q:"Le programme 'Entrée Express' classe les candidats selon :", opts:["La nationalité","Le score CRS","L'âge seulement","Le niveau d'études seulement"], ans:1, expl:"Entrée Express (Express Entry) utilise le score CRS pour classer les candidats et émettre des invitations." },
    { q:"Un 'visa de visiteur' au Canada est généralement valide pour :", opts:["6 mois","1 an","2 ans","Illimité"], ans:0, expl:"Un visa de visiteur au Canada est généralement accordé pour 6 mois, renouvelable sous conditions." },
    { q:"La 'période de transition' après l'obtention de la RP permet :", opts:["De devenir citoyen immédiatement","De maintenir la RP pendant l'installation","De travailler sans permis","De voter aux élections"], ans:1, expl:"Après la RP, le résident doit être physiquement présent au Canada au moins 730 jours sur 5 ans pour conserver son statut." },
    { q:"Pour la citoyenneté canadienne, il faut en général :", opts:["1 an de RP","3 ans de présence sur 5 ans","5 ans continus","10 ans"], ans:1, expl:"1 095 jours (3 ans) de présence physique sur les 5 années précédant la demande sont requis." },
    { q:"Le 'NEXUS' est :", opts:["Un programme d'immigration express","Un programme de voyageurs dignes de confiance Canada-USA","Un visa de travail","Un permis d'études"], ans:1, expl:"NEXUS facilite les contrôles à la frontière Canada-USA pour les voyageurs préapprouvés." },
    { q:"Le programme des travailleurs agricoles saisonniers s'appelle :", opts:["Express Entry","PTPAF","PRTQ","PEQ"], ans:1, expl:"Le PTPAF (Programme des Travailleurs Agricoles Saisonniers) est un programme de travail temporaire avec le Mexique et les Caraïbes." },
    { q:"La 'déclaration de revenus' au Canada s'appelle également :", opts:["Le bilan fiscal","La déclaration T1","Le rapport annuel","Le formulaire IRCC-01"], ans:1, expl:"Le formulaire T1 est la déclaration de revenus des particuliers canadiens, à remettre à l'ARC (Agence du Revenu du Canada)." },
    { q:"'ARC' signifie :", opts:["Agence de Réglementation du Commerce","Agence du Revenu du Canada","Autorité de Régulation des Citoyens","Association des Résidents du Canada"], ans:1, expl:"L'ARC (Agence du Revenu du Canada) est l'organisme fédéral responsable de la fiscalité et des impôts." },
    { q:"Un 'acte de naissance apostillé' est :", opts:["Un document traduit","Un document certifié conforme pour usage international","Un acte enregistré auprès du gouvernement canadien","Un acte payant"], ans:1, expl:"L'apostille est une certification internationale qui rend un document officiel reconnu dans les pays signataires de la Convention de La Haye." },
    { q:"Le 'regroupement familial' au Canada permet de :", opts:["Travailler immédiatement","Parrainer des membres de famille pour la RP","Étudier gratuitement","Obtenir la citoyenneté directement"], ans:1, expl:"Le regroupement familial permet à un citoyen ou résident permanent de parrainer des proches pour obtenir la RP." },
    { q:"Un 'dossier de police' est souvent requis pour :", opts:["L'inscription à l'université","Une demande d'immigration","Un permis de conduire","Un compte bancaire"], ans:1, expl:"Un certificat de police (Certificat de bonne conduite) est requis pour la plupart des demandes d'immigration." },
    { q:"Le 'RPVP' désigne :", opts:["Résidence Permanente pour Visiteurs Professionnels","Résidents Permanents ayant Vécu au Pays","Rien de spécifique","Regroupement Professionnel de Visa Permanent"], ans:0, expl:"Il s'agit du Programme des Résidents Permanents Visiteurs Professionnels, moins courant. Vérifiez toujours les acronymes officiels sur le site d'IRCC." },
    { q:"L'expression 'démarche d'immigration' signifie :", opts:["Marcher jusqu'au bureau d'immigration","L'ensemble des étapes pour immigrer légalement","Une randonnée administrative","Un voyage au Canada"], ans:1, expl:"Une 'démarche' est un ensemble d'actions entreprises pour atteindre un objectif administratif ou légal." },
    { q:"Le 'délai de traitement' d'un dossier d'immigration désigne :", opts:["La date d'expiration du visa","Le temps entre le dépôt et la décision","Le temps pour passer la frontière","La durée du séjour autorisé"], ans:1, expl:"Le délai de traitement (processing time) est la durée moyenne entre la réception du dossier et la décision d'IRCC." },
    { q:"'ERP' dans le contexte de l'immigration québécoise signifie :", opts:["Étude de Résidence Permanente","Évaluation des Ressources Professionnelles","Entrée Rapide au Québec","Expression Régulière de Parcours"], ans:1, expl:"L'ERP (Évaluation des Ressources Professionnelles) évalue la formation étrangère pour sa reconnaissance au Québec." },
    { q:"Le 'tuteur linguistique' dans un programme de francisation est :", opts:["Un enseignant bénévole ou professionnel qui aide à pratiquer le français","Un logiciel de traduction","Un dictionnaire bilingue","Un test de niveau"], ans:0, expl:"Le tuteur linguistique accompagne les nouveaux arrivants dans la pratique conversationnelle du français." },
    { q:"Un 'entretien de sélection' consulaire est :", opts:["Un entretien d'embauche au Canada","Une convocation pour vérifier votre dossier d'immigration","Un test de langue","Un examen médical"], ans:1, expl:"L'entretien consulaire permet à un agent d'immigration de vérifier l'authenticité et la cohérence d'un dossier." },
    { q:"Le terme 'inadmissibilité' en immigration signifie :", opts:["Un refus définitif et irrévocable","Le fait d'être non éligible pour des raisons précises (santé, sécurité, antécédents)","L'absence de visa","Le manque de points CRS"], ans:1, expl:"L'inadmissibilité peut être temporaire ou permanente selon la cause (criminalité, maladie, fausse déclaration…)." },
    { q:"Le 'Programme des Aides Familiaux' permet :", opts:["D'engager des aides ménagères sans permis","À des travailleurs qualifiés de prendre soin d'enfants/personnes âgées et d'obtenir la RP","D'amener sa famille rapidement","De travailler dans n'importe quel secteur"], ans:1, expl:"Ce programme offre une voie vers la RP aux travailleurs étrangers qui s'occupent d'enfants ou de personnes dépendantes." },
    { q:"'Établissement' au sens de l'immigration désigne :", opts:["Un bâtiment administratif","Le processus d'intégration et d'installation durable dans le pays d'accueil","Un programme scolaire","Un titre de séjour"], ans:1, expl:"L'établissement est l'ensemble du processus d'intégration : logement, emploi, services, langue, réseau social." },
    { q:"Le 'NCLC' signifie :", opts:["Niveau de Compétence en Langue du Canada","Niveaux de compétence linguistique canadiens","Norme canadienne de langue et communication","Niveau certifié de langue canadienne"], ans:1, expl:"Le NCLC (Niveaux de compétence linguistique canadiens) est l'échelle nationale pour le français, de 1 à 12." },
    { q:"Le score NCLC minimum pour Express Entry (traitement prioritaire en français) est :", opts:["NCLC 5","NCLC 7","NCLC 9","NCLC 12"], ans:1, expl:"NCLC 7 dans les 4 compétences est le seuil minimum pour obtenir des points de langue en français dans Express Entry." },
    { q:"Le 'Programme des travailleurs qualifiés fédéraux' (PTQF) sélectionne selon :", opts:["La nationalité","La grille de points (études, expérience, langue, adaptabilité)","Le secteur d'activité seulement","Le niveau de salaire au Canada"], ans:1, expl:"Le PTQF utilise une grille de sélection à points évaluant 6 facteurs : études, expérience, âge, offre d'emploi, langue, adaptabilité." },
    { q:"Un 'code CNP/NOC' identifie :", opts:["Un pays d'origine","Une profession spécifique au Canada","Un niveau d'études","Un type de visa"], ans:1, expl:"Chaque profession canadienne a un code NOC unique. Il est essentiel pour toutes les demandes d'immigration et de travail." },
    { q:"Le 'parrainage de conjoint' permet :", opts:["D'amener un ami","De faire venir son époux/épouse ou partenaire de vie","D'accélérer un dossier","D'obtenir un visa de visiteur rapidement"], ans:1, expl:"Un citoyen ou résident permanent peut parrainer son conjoint (époux/épouse ou conjoint de fait) pour la RP." },
    { q:"L'expression 'accréditation de diplôme' signifie :", opts:["L'obtention d'un diplôme canadien","La reconnaissance officielle d'un diplôme étranger au Canada","Une traduction certifiée","Un examen de validation"], ans:1, expl:"L'accréditation permet à un professionnel formé à l'étranger d'exercer sa profession au Canada." },
    { q:"Le 'droit de résidence' pour un résident permanent est :", opts:["Gratuit","Payé annuellement","Payé lors de la confirmation de RP","Jamais requis"], ans:2, expl:"Le droit de résidence permanent (680 $ en 2024) est payé une seule fois lors de la confirmation de la RP." },
    { q:"'IMM 5669' est :", opts:["Un code postal canadien","Un formulaire d'immigration IRCC pour les antécédents personnels","Un numéro de certificat linguistique","Un code de programme provincial"], ans:1, expl:"L'IMM 5669 (Annexe A – Antécédents/Déclaration) est un formulaire obligatoire pour la plupart des demandes IRCC." },
    { q:"Le terme 'biométrie' dans le contexte de l'immigration désigne :", opts:["Un test sanguin","La collecte d'empreintes digitales et d'une photo","Un examen médical complet","Un test de personnalité"], ans:1, expl:"La biométrie (empreintes + photo) est obligatoire pour la plupart des demandes de visa et de RP au Canada." },
    { q:"Une 'lettre d'appui' dans un dossier d'immigration est :", opts:["Une lettre de refus","Un document d'un employeur, ami ou organisme soutenant votre demande","Une garantie financière","Un contrat de travail"], ans:1, expl:"Une lettre d'appui renforce un dossier en attestant de liens, d'intentions ou de capacités du demandeur." },
    { q:"Le terme 'immigrant reçu' est une expression québécoise pour :", opts:["Un immigrant illégal","Un nouvel arrivant ayant obtenu la RP","Un demandeur d'asile","Un travailleur temporaire"], ans:1, expl:"'Immigrant reçu' est le terme québécois traditionnel pour désigner une personne ayant obtenu la résidence permanente." },
    { q:"L'expression 'mise en candidature' dans Express Entry signifie :", opts:["Soumettre une offre d'emploi","Soumettre son profil dans le bassin de candidats","Passer un entretien","Déposer un dossier complet"], ans:1, expl:"La mise en candidature (creating a profile) consiste à entrer son profil dans le bassin Express Entry pour être évalué selon le CRS." },
    { q:"Une 'offre d'emploi réservée' dans Express Entry :", opts:["Garantit un emploi au Canada","Ajoute des points CRS significatifs","Remplace le permis de travail","Est obligatoire pour postuler"], ans:1, expl:"Une offre d'emploi admissible (Designated job offer) ajoute 50 ou 200 points CRS selon le niveau NOC." },
    { q:"Le 'bassin de candidats' dans Express Entry fonctionne :", opts:["Premier arrivé, premier servi","Par tirage au sort","Par classement CRS — les meilleurs scores reçoivent les invitations","Par ancienneté dans le système"], ans:2, expl:"Les candidats sont classés par score CRS. Lors des tirages, IRCC invite les candidats avec les scores les plus élevés." },
    { q:"Le programme 'Connexion Francophone' vise :", opts:["Les anglophones apprenant le français","Les francophones s'installant hors Québec","Les étudiants en immersion","Les travailleurs bilingues"], ans:1, expl:"Connexion Francophone encourage les immigrants francophones à s'établir dans les communautés francophones hors Québec." },
    { q:"'IRCC en ligne' (SEFP) permet :", opts:["De travailler légalement au Canada","De soumettre et suivre les demandes d'immigration par internet","De passer le TEF Canada","De valider un diplôme étranger"], ans:1, expl:"Le Système en ligne d'IRCC (anciennement eMEN) permet de déposer, payer et suivre toutes les demandes d'immigration." },
    { q:"Le terme 'interdiction de territoire' signifie :", opts:["Une frontière fermée","Une inadmissibilité permanente à entrer au Canada","Un refus de visa temporaire","Une restriction de voyage"], ans:1, expl:"L'interdiction de territoire (inadmissibility) interdit à une personne d'entrer ou de rester au Canada pour des raisons légales." }
  ],

  // ===== CULTURE CANADIENNE — 40 questions =====
  culture: [
    { q:"Le Canada a ______ langues officielles.", opts:["1","2","3","4"], ans:1, expl:"Le Canada a 2 langues officielles : le français et l'anglais (Loi sur les langues officielles de 1969)." },
    { q:"La province la plus francophone du Canada est :", opts:["Ontario","Colombie-Britannique","Québec","Alberta"], ans:2, expl:"Le Québec est la seule province majoritairement francophone, avec environ 78 % de locuteurs francophones." },
    { q:"Ottawa est la capitale du Canada. Elle est située dans :", opts:["Le Québec","L'Ontario","Le Manitoba","La Colombie-Britannique"], ans:1, expl:"Ottawa est en Ontario, juste en face de Gatineau (Québec) de l'autre côté de la rivière des Outaouais." },
    { q:"La Charte canadienne des droits et libertés protège entre autres :", opts:["Le droit au logement gratuit","Les droits linguistiques des minorités","Le droit aux études gratuites","Le droit au revenu universel"], ans:1, expl:"La Charte (1982) protège notamment les droits des minorités de langue officielle partout au Canada." },
    { q:"Le système de santé canadien est :", opts:["Entièrement privé","Universel et financé par les provinces avec aide fédérale","Uniquement fédéral","Optionnel"], ans:1, expl:"Le système de santé canadien est universel : les soins de santé de base sont gratuits pour tous les résidents." },
    { q:"La fête nationale du Québec est célébrée le :", opts:["1er juillet","24 juin","25 juin","1er juin"], ans:1, expl:"La Saint-Jean-Baptiste, fête nationale du Québec, est célébrée le 24 juin depuis 1977." },
    { q:"Quelle ville canadienne est la plus grande en population ?", opts:["Ottawa","Montréal","Toronto","Vancouver"], ans:2, expl:"Toronto est la plus grande ville du Canada avec environ 3 millions d'habitants (zone métropolitaine : 6 millions)." },
    { q:"Les peuples autochtones du Canada comprennent :", opts:["Les nouveaux immigrants","Les Premières Nations, les Métis et les Inuits","Les Canadiens de naissance","Les citoyens naturalisés"], ans:1, expl:"Les Autochtones du Canada sont les Premières Nations, les Métis et les Inuits — les peuples originaires du territoire." },
    { q:"Le gouverneur général du Canada représente :", opts:["Le président du Canada","Le monarque canadien","Le premier ministre","Le Parlement"], ans:1, expl:"Le gouverneur général représente le roi du Canada (Charles III) en tant que chef d'État symbolique." },
    { q:"Le Canada compte ______ provinces et ______ territoires.", opts:["9 / 3","10 / 2","10 / 3","11 / 2"], ans:2, expl:"10 provinces (dont le Québec et l'Ontario) et 3 territoires (Yukon, Territoires du Nord-Ouest, Nunavut)." },
    { q:"La 'Loi 101' au Québec est connue sous le nom de :", opts:["Loi sur l'immigration","Charte de la langue française","Loi sur la citoyenneté","Code civil québécois"], ans:1, expl:"La Loi 101 (1977) fait du français la seule langue officielle du Québec et régit son usage dans la vie publique." },
    { q:"Le Parlement fédéral canadien comprend :", opts:["La Chambre des communes seulement","Le Sénat seulement","La Chambre des communes et le Sénat","L'Assemblée nationale"], ans:2, expl:"Le Parlement comprend la Chambre des communes (élus) et le Sénat (nommés). L'Assemblée nationale est le parlement du Québec." },
    { q:"Le numéro d'urgence au Canada est :", opts:["999","911","112","000"], ans:1, expl:"Le 911 est le numéro unifié au Canada pour police, pompiers et ambulance." },
    { q:"La ville de Québec a été fondée en :", opts:["1534","1608","1642","1760"], ans:1, expl:"Samuel de Champlain a fondé Québec en 1608, l'une des plus anciennes villes d'Amérique du Nord." },
    { q:"L'emblème floral du Québec est :", opts:["La tulipe","L'iris versicolore","La rose","Le lys"], ans:1, expl:"L'iris versicolore est l'emblème floral officiel du Québec depuis 1999." },
    { q:"L'OQLF (Office québécois de la langue française) veille à :", opts:["La traduction gratuite des documents","L'application de la Charte de la langue française (Loi 101)","L'enseignement du français aux touristes","La correction des immigrants"], ans:1, expl:"L'OQLF veille au respect de la loi 101 : français comme langue de travail, d'affichage et de commerce au Québec." },
    { q:"Le 'bilinguisme institutionnel' garantit :", opts:["Que tous les Canadiens parlent deux langues","Des services gouvernementaux fédéraux en français ET en anglais","L'enseignement obligatoire en deux langues","Le droit de travailler en deux langues partout"], ans:1, expl:"Le bilinguisme institutionnel (Loi sur les langues officielles) garantit des services fédéraux dans les deux langues." },
    { q:"La monnaie officielle du Canada est :", opts:["Le dollar américain","Le dollar canadien","Le franc canadien","La livre canadienne"], ans:1, expl:"Le dollar canadien (CAD ou C$) est la monnaie officielle du Canada." },
    { q:"Le programme d'immersion française permet :", opts:["Aux immigrants d'apprendre l'anglais","Aux enfants anglophones de suivre leurs cours en français","Aux adultes de passer le TEF","Aux entreprises de se franciser"], ans:1, expl:"L'immersion française est un programme scolaire dans lequel des élèves anglophones étudient en français." },
    { q:"La 'Révolution tranquille' au Québec désigne :", opts:["Une révolte armée","Une période de modernisation rapide du Québec dans les années 1960","Une réforme linguistique","Un programme d'immigration"], ans:1, expl:"La Révolution tranquille (1960s) est la période de modernisation sociale, économique et politique du Québec sous Jean Lesage." },
    { q:"Montréal est connue pour :", opts:["Être la capitale du Québec","Être la deuxième ville francophone mondiale après Paris","Être exclusivement anglophone","Être la capitale fédérale"], ans:1, expl:"Montréal est souvent présentée comme la deuxième plus grande ville francophone du monde après Paris." },
    { q:"La 'Saint-Jean' au Québec est associée à :", opts:["La fête du Canada","Un festival de musique et de fierté québécoise","Un référendum","Un événement sportif"], ans:1, expl:"La Saint-Jean (24 juin) est célébrée avec des feux d'artifice et des concerts pour affirmer l'identité québécoise." },
    { q:"Le 'code postal' canadien est composé de :", opts:["5 chiffres","6 caractères alternant lettres et chiffres","7 chiffres","4 lettres seulement"], ans:1, expl:"Le code postal canadien est du type A1A 1A1 : lettre-chiffre-lettre (espace) chiffre-lettre-chiffre." },
    { q:"Le 'REER' est :", opts:["Un régime d'entraînement linguistique","Un régime d'épargne retraite enregistré","Un registre d'entreprises","Un règlement d'établissement"], ans:1, expl:"Le REER (Régime enregistré d'épargne-retraite) est un véhicule d'épargne fiscal pour la retraite au Canada." },
    { q:"La province de l'Alberta est connue pour :", opts:["Ses côtes maritimes","Son industrie pétrolière et ses paysages naturels","Ses vignobles","Son parlement bilingue"], ans:1, expl:"L'Alberta est la principale province pétrolière du Canada (sables bitumineux) et abrite les Rocheuses et Banff." },
    { q:"Le terme 'dépanneur' au Québec désigne :", opts:["Un mécanicien","Une épicerie de quartier ouverte tard","Un service de remorquage","Un technicien en informatique"], ans:1, expl:"Un 'dépanneur' (ou 'dep') est une petite épicerie de quartier québécoise, souvent ouverte 7j/7." },
    { q:"L'expression 'char' au Québec signifie :", opts:["Un tank militaire","Une voiture","Un cheval","Un bateau"], ans:1, expl:"'Char' est un québécisme courant pour 'voiture'. 'Je vais chercher mon char' = 'Je vais chercher ma voiture'." },
    { q:"Le gouvernement fédéral du Canada est dirigé par :", opts:["Le président","Le premier ministre","Le gouverneur général","Le Parlement"], ans:1, expl:"Le Canada est une monarchie constitutionnelle avec un régime parlementaire. Le premier ministre dirige le gouvernement." },
    { q:"Les 'CPE' au Québec sont :", opts:["Des centres de formation professionnelle","Des centres de la petite enfance (garde d'enfants)","Des centres de préparation à l'emploi","Des centres de placement externe"], ans:1, expl:"Les CPE (Centres de la Petite Enfance) offrent des services de garde subventionnés aux enfants de 0 à 5 ans au Québec." },
    { q:"La 'Fête du Canada' est célébrée le :", opts:["24 juin","1er juillet","1er septembre","11 novembre"], ans:1, expl:"La Fête du Canada (1er juillet) commémore la Confédération canadienne du 1er juillet 1867." },
    { q:"Le 'NAS' (Numéro d'Assurance Sociale) est :", opts:["Un numéro de passeport","Un identifiant fiscal unique requis pour travailler au Canada","Un numéro de compte bancaire","Un code de sécurité en ligne"], ans:1, expl:"Le NAS est le numéro d'identification unique requis pour travailler, payer des impôts et recevoir des prestations gouvernementales." },
    { q:"Le hockey sur glace est :", opts:["Le sport officiel d'hiver du Canada","Un sport interdit dans certaines provinces","Le sport uniquement pratiqué au Québec","Un sport importé récemment"], ans:0, expl:"Le hockey sur glace est le sport national d'hiver officiel du Canada depuis 1994 (lacrosse = sport national d'été)." },
    { q:"L'expression 'tabarnac' au Québec est :", opts:["Un terme neutre","Un sacre québécois dérivé du vocabulaire religieux","Un mot d'argot politique","Un terme affectueux"], ans:1, expl:"Les 'sacres' québécois sont des jurons issus du vocabulaire de l'Église catholique, très présents dans l'argot québécois." },
    { q:"La ville de Vancouver est connue pour :", opts:["Son bilinguisme officiel","Son climat doux, sa diversité et son industrie cinématographique","Ses champs de blé","Son parlement fédéral"], ans:1, expl:"Vancouver (Colombie-Britannique) est réputée pour son climat tempéré, sa diversité culturelle et son industrie du cinéma." },
    { q:"Le 'système de points' canadien pour l'immigration valorise surtout :", opts:["L'ancienneté dans le pays","Les compétences linguistiques, l'éducation et l'expérience de travail","La nationalité","L'appartenance religieuse"], ans:1, expl:"Le Canada sélectionne ses immigrants selon un système basé sur le capital humain : langue, études, expérience, âge, adaptabilité." },
    { q:"La 'Commission des droits de la personne' au Québec :", opts:["Gère les dossiers d'immigration","Protège contre la discrimination et les atteintes aux droits","Offre des services de traduction","Gère les tests de langue"], ans:1, expl:"La Commission des droits de la personne et des droits de la jeunesse (CDPDJ) défend les droits fondamentaux au Québec." },
    { q:"L'acronyme 'CNESST' désigne :", opts:["Un syndicat d'enseignants","La Commission des normes, de l'équité, de la santé et de la sécurité du travail","Un centre de formation","Un ministère fédéral"], ans:1, expl:"La CNESST est l'organisme québécois responsable des normes du travail, de l'équité salariale et de la santé/sécurité au travail." },
    { q:"Le terme 'maudit français' au Québec peut désigner :", opts:["Une insulte grave","Familièrement, un ressortissant français (surtout parisien)","Un titre officiel","Une langue différente du québécois"], ans:1, expl:"C'est une expression informelle (parfois affectueuse, parfois ironique) désignant les ressortissants de France." },
    { q:"Le 'Régime québécois d'assurance parentale' (RQAP) offre :", opts:["Des congés maladie","Des prestations pour les nouveaux parents (maternité, paternité, adoption)","Un revenu universel","Des congés d'études"], ans:1, expl:"Le RQAP est plus généreux que le programme fédéral : il couvre jusqu'à 5 semaines de paternité exclusives et offre plus de souplesse." },
    { q:"La 'STM' à Montréal est :", opts:["La Société de Transport de Montréal","Un syndicat de techniciens","Une école de langue","Un ministère provincial"], ans:0, expl:"La STM (Société de Transport de Montréal) gère le réseau de bus et de métro de l'île de Montréal." }
  ],

  // ===== STRATÉGIES TEF/TCF — 40 questions =====
  strategies: [
    { q:"Pour la compréhension orale, quelle est la meilleure stratégie ?", opts:["Tout transcrire mot à mot","Se concentrer sur les mots-clés et le contexte global","Mémoriser les dialogues à l'avance","Ignorer les premières secondes"], ans:1, expl:"En compréhension orale, cibler les mots-clés, les intonations et le contexte global est plus efficace que la transcription intégrale." },
    { q:"Pour l'expression écrite Tâche 1 (message formel), quel est l'ordre correct ?", opts:["Conclusion, développement, salutation","Salutation formelle, objet, développement, formule de politesse","Corps, signature, objet","Introduction, salutation, conclusion"], ans:1, expl:"Structure standard d'un courriel/lettre formelle : Salutation → Objet → Développement → Formule de politesse finale." },
    { q:"Pour atteindre NCLC 9 en expression orale, il faut :", opts:["Parler très vite sans pause","Vocabulaire varié + connecteurs logiques + structure claire","Utiliser uniquement des phrases simples","Répéter les mêmes idées autrement"], ans:1, expl:"NCLC 9 exige : structure (intro/déve/conclu), vocabulaire riche, connecteurs logiques variés, fluidité naturelle." },
    { q:"Quel connecteur exprime la CAUSE ?", opts:["Cependant","Parce que","Donc","Néanmoins"], ans:1, expl:"'Parce que' introduit une cause directe. Autres marqueurs de cause : car, puisque, étant donné que, vu que." },
    { q:"Quel connecteur exprime la CONCESSION ?", opts:["De plus","Bien que","Ainsi","Par conséquent"], ans:1, expl:"'Bien que' (+ subjonctif) exprime la concession. Synonymes : quoique, même si, malgré, certes… mais." },
    { q:"Pour la compréhension écrite, quelle technique est recommandée ?", opts:["Lire d'abord les questions, puis le texte","Lire le texte deux fois avant de regarder les questions","Répondre sans lire le texte","Toujours choisir la réponse la plus longue"], ans:0, expl:"Lire les questions d'abord permet de cibler l'information recherchée pendant la lecture du texte." },
    { q:"Quel niveau NCLC est requis pour le bonus maximum en français (Express Entry) ?", opts:["NCLC 5","NCLC 7","NCLC 9+","NCLC 12"], ans:2, expl:"NCLC 9+ dans les 4 compétences donne les points CRS maximaux pour la langue française dans Express Entry." },
    { q:"Pour gérer le temps en compréhension orale :", opts:["Écouter chaque extrait 5 fois","Répondre pendant l'écoute et utiliser les pauses entre questions","Attendre la fin pour répondre","Prendre des notes très longues"], ans:1, expl:"Répondre EN écoutant et utiliser efficacement les quelques secondes de pause entre questions est la stratégie optimale." },
    { q:"Quel est le piège classique en expression écrite Tâche 2 (argumentatif) ?", opts:["Trop d'arguments","Hors sujet ou position peu claire","Trop de connecteurs","Phrases trop courtes"], ans:1, expl:"Le hors-sujet et l'absence de prise de position claire sont les erreurs les plus pénalisées en expression écrite." },
    { q:"La 'cohérence textuelle' en expression écrite concerne :", opts:["L'orthographe uniquement","Le lien logique entre les idées et les paragraphes","Le nombre de mots","La calligraphie"], ans:1, expl:"La cohérence = progression logique des idées, liens entre les paragraphes. Critère central pour NCLC 8+." },
    { q:"Pour l'expression orale, quelle erreur est la plus pénalisante ?", opts:["Un léger accent","Des pauses courtes","L'absence de structure (pas d'intro/conclusion)","Parler trop lentement"], ans:2, expl:"L'absence de structure est la principale cause d'un score faible à l'oral. L'accent n'est jamais pénalisé en soi." },
    { q:"La durée totale du TEF Canada (4 épreuves) est approximativement :", opts:["1h30","2h00","3h30","5h00"], ans:2, expl:"Le TEF Canada dure environ 3h30 en incluant les 4 épreuves : CO (~40 min), CE (~60 min), EO (~15 min), EE (~60 min)." },
    { q:"Comment introduire une argumentation à l'expression orale ?", opts:["'Bon...' ou 'Euh...'","'Il me semble que...' / 'À mon avis...' / 'Il est indéniable que...'","'Je pense... non... enfin...'","'Le sujet c'est que...'"], ans:1, expl:"Les formules d'introduction soutenues ('Il me semble que', 'Force est de constater') démontrent la maîtrise du registre formel." },
    { q:"En NCLC, quelle compétence est généralement la plus longue à améliorer ?", opts:["Compréhension orale","Compréhension écrite","Expression écrite","Expression orale"], ans:3, expl:"L'expression orale nécessite une pratique orale régulière et prolongée. Elle progresse plus lentement que les compétences écrites." },
    { q:"Pour maximiser le score en compréhension écrite :", opts:["Lire mot à mot","Identifier d'abord le type de texte et adapter la stratégie","Ne lire que le premier paragraphe","Choisir toujours la réponse A si incertain"], ans:1, expl:"Un article de presse, une publicité et un formulaire se lisent différemment. Adapter sa stratégie = gain de temps et de précision." },
    { q:"En expression écrite, 'Par ailleurs' sert à :", opts:["Conclure","Introduire un argument supplémentaire ou complémentaire","Exprimer la cause","Exprimer le temps"], ans:1, expl:"'Par ailleurs' introduit une idée complémentaire ou un nouvel angle d'approche. Synonymes : de plus, en outre, qui plus est." },
    { q:"Quel score minimum en CO est requis pour NCLC 7 au TEF Canada (approximatif) ?", opts:["145 points","217 points","280 points","310 points"], ans:1, expl:"NCLC 7 en Compréhension Orale au TEF Canada correspond approximativement à un score de 217 à 248 points." },
    { q:"Pour la Tâche 2 de l'expression écrite, la structure optimale est :", opts:["Raconter une histoire","Thèse (pour) + Antithèse (contre) + Synthèse (opinion argumentée)","Lister des faits sans opinion","Donner un seul point de vue très développé"], ans:1, expl:"La structure thèse/antithèse/synthèse est la norme attendue pour un texte argumentatif de niveau B2/C1." },
    { q:"En compréhension orale, les 'mots de transition' permettent de :", opts:["Ignorer certaines parties","Anticiper la structure du discours","Gagner du temps","Deviner la bonne réponse"], ans:1, expl:"Les marqueurs de discours ('d'abord', 'ensuite', 'donc', 'cependant') indiquent la structure logique et aident à anticiper le contenu." },
    { q:"Pour l'expression orale, 'reformuler' une idée permet :", opts:["De répéter sans valeur ajoutée","De montrer sa maîtrise du vocabulaire et d'éviter les répétitions","De gagner du temps inutilement","D'esquiver la question"], ans:1, expl:"Reformuler avec des synonymes ou des structures variées démontre la richesse lexicale — critère clé pour NCLC 8+." },
    { q:"En compréhension écrite, un 'texte injonctif' est :", opts:["Un texte racontant une histoire","Un texte qui donne des instructions ou des ordres","Un texte qui argumente","Un texte publicitaire"], ans:1, expl:"Un texte injonctif donne des instructions : modes d'emploi, recettes, règlements, consignes de sécurité." },
    { q:"La 'prise de position' en expression écrite doit être :", opts:["Toujours neutre","Claire dès l'introduction et cohérente tout au long du texte","Révélée uniquement en conclusion","Absente — seuls les faits comptent"], ans:1, expl:"La prise de position (thèse) doit être annoncée dans l'introduction et défendue avec des arguments et exemples tout au long du texte." },
    { q:"Pour mémoriser du vocabulaire efficacement, la méthode recommandée est :", opts:["Lire les mots une seule fois","La révision espacée (revoir à intervalles croissants)","Mémoriser par ordre alphabétique","Écrire chaque mot 100 fois"], ans:1, expl:"La révision espacée (Spaced Repetition System) est scientifiquement prouvée comme la méthode la plus efficace pour la mémorisation à long terme." },
    { q:"Quel type de connecteur utilise-t-on pour introduire une conclusion ?", opts:["De plus / en outre","Donc / ainsi / en conclusion / par conséquent","Cependant / toutefois","Parce que / car"], ans:1, expl:"Les connecteurs de conclusion/conséquence (donc, ainsi, en somme, par conséquent) marquent la fin du raisonnement." },
    { q:"En expression orale, une 'pause réflexive' de 2-3 secondes est :", opts:["Toujours une faiblesse","Naturelle et acceptable si utilisée pour structurer sa pensée","Très pénalisée","Considérée comme une erreur"], ans:1, expl:"Les pauses courtes pour réfléchir sont normales et naturelles dans la communication. L'important est de reprendre sans bloquer." },
    { q:"Pour l'épreuve de compréhension orale, à quoi sert le temps avant l'écoute ?", opts:["À se détendre","À lire les questions pour anticiper le contenu","À vérifier ses réponses précédentes","À relire ses notes"], ans:1, expl:"Lire les questions AVANT d'écouter permet de cibler les informations clés et d'anticiper le vocabulaire thématique." },
    { q:"En expression écrite, le 'registre soutenu' se caractérise par :", opts:["L'utilisation du 'tu' et des contractions","La complexité syntaxique, le vocabulaire précis et l'absence d'anglicismes","Le style SMS","L'utilisation d'expressions familières"], ans:1, expl:"Le registre soutenu utilise des structures syntaxiques complexes, un vocabulaire précis et évite les familiarités et anglicismes." },
    { q:"La 'paraphrase' en compréhension écrite est utile pour :", opts:["Copier le texte","Reformuler une réponse avec ses propres mots — critère de qualité","Éviter de lire le texte","Raccourcir ses réponses"], ans:1, expl:"Reformuler les informations du texte avec ses propres mots démontre la compréhension réelle et évite le copiage." },
    { q:"Quelle est la longueur minimale recommandée pour la Tâche 1 de l'expression écrite au TEF Canada ?", opts:["50 mots","120 mots","200 mots","300 mots"], ans:1, expl:"La Tâche 1 (lettre/courriel formel) requiert entre 120 et 150 mots. En dessous, des points sont retirés." },
    { q:"En expression orale, 'nuancer' sa position signifie :", opts:["Être indécis","Reconnaître la complexité du sujet avec des concessions et réserves argumentées","Changer d'avis en cours de réponse","Donner deux réponses contradictoires"], ans:1, expl:"Nuancer = 'Certes X, mais Y' / 'Il convient de reconnaître que… toutefois…' — marque de maturité intellectuelle valorisée en NCLC 9-10." },
    { q:"Pour le TCF Canada, l'épreuve d'expression écrite comporte :", opts:["1 seule tâche de 250 mots","2 tâches : une production guidée et une production libre","3 tâches d'argumentation","Uniquement des QCM"], ans:1, expl:"Le TCF Canada propose 2 tâches à l'écrit : Tâche 1 (lettre/message ~150 mots) et Tâche 2 (argumentation ~250 mots)." },
    { q:"En compréhension orale, que faire si on n'a pas compris un passage ?", opts:["Laisser la réponse vide","Deviner en s'appuyant sur le contexte et les indices sonores disponibles","Demander à répéter","Attendre le passage suivant sans répondre"], ans:1, expl:"Au TEF/TCF Canada, on ne peut pas réécouter. Utiliser les indices contextuels (ton, mots reconnus, logique) est la seule stratégie." },
    { q:"Le 'lexique évaluatif' en expression écrite comprend :", opts:["Les chiffres et statistiques","Les adjectifs, adverbes et expressions pour qualifier et nuancer","Les noms propres","Les formules de politesse seulement"], ans:1, expl:"Le lexique évaluatif (saisissant, remarquable, préoccupant, indéniable…) enrichit le texte et signale un niveau B2/C1." },
    { q:"Quelle est la meilleure façon de terminer un texte argumentatif ?", opts:["Répéter l'introduction mot pour mot","Une conclusion qui synthétise les arguments et propose une ouverture ou perspective","Une liste de faits supplémentaires","La phrase 'Voilà mon opinion'"], ans:1, expl:"La conclusion doit : synthétiser (bilan) + ouvrir (perspective, question rhétorique, recommandation) — sans introduire d'arguments nouveaux." },
    { q:"En expression orale, la 'fluidité' se mesure par :", opts:["L'absence totale de pauses","La continuité du discours avec des pauses naturelles et un débit régulier","La vitesse maximale","L'utilisation de très longues phrases"], ans:1, expl:"La fluidité = discours continu, débit régulier, pauses naturelles aux bons endroits. La vitesse excessive est pénalisante." },
    { q:"Pour la compréhension écrite, un 'texte narratif' se reconnaît à :", opts:["Des instructions et directives","Une chronologie d'événements avec des personnages","Des données chiffrées","Des arguments et contre-arguments"], ans:1, expl:"Le texte narratif raconte une histoire avec une chronologie, des personnages et des actions. Ex : un récit, un témoignage." },
    { q:"En expression écrite, éviter les 'répétitions lexicales' signifie :", opts:["Supprimer les adjectifs","Utiliser des synonymes, pronoms et reformulations variés","Écrire des phrases plus courtes","Éviter les connecteurs"], ans:1, expl:"La variété lexicale (synonymes, pronoms, périphrases) est un critère d'évaluation explicite pour NCLC 8 et plus." },
    { q:"Le 'volume de production' en expression orale est évalué sur :", opts:["Le nombre de mots uniquement","La quantité, la pertinence et la richesse du discours produit","La durée chronométrée exacte","Le nombre de connecteurs"], ans:1, expl:"Les examinateurs évaluent la quantité (réponse complète), la pertinence (hors-sujet = pénalité) et la richesse du discours." },
    { q:"Pour la compréhension écrite, identifier le 'type de texte' permet de :", opts:["Ignorer certaines parties","Adapter sa stratégie de lecture et anticiper le vocabulaire","Choisir la réponse au hasard","Gagner du temps en ne lisant pas tout"], ans:1, expl:"Un publicité se survole, un article se lit analytiquement, un formulaire se scanne. Le type détermine la stratégie." },
    { q:"En expression orale, les 'connecteurs de temps' (d'abord, ensuite, enfin) permettent de :", opts:["Dérouter l'examinateur","Structurer clairement son discours dans le temps","Compenser un manque de vocabulaire","Raccourcir sa réponse"], ans:1, expl:"Les marqueurs temporels structurent le discours et facilitent la compréhension de l'examinateur — fortement valorisés." }
  ],

  // ===== CONJUGAISON — 30 questions =====
  conjugaison: [
    { q:"Conjuguez 'aller' à la 1ère personne du singulier au futur simple.", opts:["j'allerai","j'irai","je vais","j'aille"], ans:1, expl:"'Aller' a un radical irrégulier au futur : ir- → 'j'irai'. Ne pas confondre avec 'je vais' (présent)." },
    { q:"Quel est le subjonctif présent de 'être' à la 3e personne du singulier ?", opts:["il est","il était","il soit","il sera"], ans:2, expl:"Le subjonctif de 'être' : que je sois, que tu sois, qu'il soit, que nous soyons, que vous soyez, qu'ils soient." },
    { q:"Conjuguez 'avoir' au conditionnel présent (nous).", opts:["nous avons","nous aurions","nous ayons","nous eurent"], ans:1, expl:"Conditionnel présent = infinitif + terminaisons de l'imparfait (-ais,-ais,-ait,-ions,-iez,-aient). 'Avoir' → 'nous aurions'." },
    { q:"Quel est le participe passé de 'mourir' ?", opts:["mouré","mouru","mort","mourri"], ans:2, expl:"Participe passé de 'mourir' = 'mort'. Il se conjugue avec 'être' : 'Il est mort'." },
    { q:"'Nous ______ (résoudre) ce problème hier.' — Passé composé.", opts:["avons résoudé","avons résolu","avons résout","avons résous"], ans:1, expl:"Participe passé de 'résoudre' = 'résolu'. 'Nous avons résolu ce problème hier'." },
    { q:"Conjuguez 'pouvoir' au subjonctif présent (qu'elle) :", opts:["qu'elle peut","qu'elle pourrait","qu'elle puisse","qu'elle pouvait"], ans:2, expl:"Subjonctif de 'pouvoir' : que je puisse, que tu puisses, qu'il/elle puisse, que nous puissions…" },
    { q:"Quel est l'imparfait de 'savoir' (je) ?", opts:["je sus","je savais","je saurais","je sache"], ans:1, expl:"Imparfait de 'savoir' : je savais, tu savais, il savait, nous savions, vous saviez, ils savaient." },
    { q:"Conjuguez 'venir' au passé composé (ils) :", opts:["ils ont venu","ils sont venus","ils vinrent","ils venaient"], ans:1, expl:"'Venir' se conjugue avec 'être' au passé composé. Accord avec le sujet masc. plur. → 'ils sont venus'." },
    { q:"Quel est le futur antérieur de 'finir' (tu) ?", opts:["tu finiras","tu auras fini","tu aurais fini","tu finissais"], ans:1, expl:"Futur antérieur = futur de l'auxiliaire + participe passé. 'Tu auras fini' exprime une action terminée avant un moment futur." },
    { q:"Conjuguez 'croire' à la 1ère personne du pluriel au subjonctif présent :", opts:["nous croyons","nous croirions","que nous croyions","que nous crayions"], ans:2, expl:"Subjonctif présent de 'croire' : que nous croyions (diphtongue préservée, accent sur le -i- suivi de -ons)." },
    { q:"Quel est le passé simple de 'prendre' (il) ?", opts:["il prendait","il prit","il a pris","il prenait"], ans:1, expl:"Passé simple de 'prendre' : je pris, tu pris, il prit, nous prîmes, vous prîtes, ils prirent." },
    { q:"Conjuguez 's'asseoir' au présent de l'indicatif (je) :", opts:["je m'assis","je m'asseois / je m'assois","je me suis assis","je m'asseyais"], ans:1, expl:"'S'asseoir' a deux formes au présent : je m'assieds/je m'assois (les deux sont correctes)." },
    { q:"Quel est le participe passé de 'naître' ?", opts:["naîtu","né","naissé","nait"], ans:1, expl:"Participe passé de 'naître' = 'né'. Se conjugue avec être : 'Il est né au Québec'." },
    { q:"Conjuguez 'devoir' au conditionnel passé (vous) :", opts:["vous devrez","vous aviez dû","vous auriez dû","vous eûtes dû"], ans:2, expl:"Conditionnel passé = conditionnel présent de l'auxiliaire + participe passé : 'vous auriez dû'." },
    { q:"'Elle ______ (traduire) ce document en une heure.' — Passé composé.", opts:["a traduit","a traduis","a traduisé","avait traduit"], ans:0, expl:"Participe passé de 'traduire' = 'traduit'. 'Elle a traduit ce document en une heure'." },
    { q:"Conjuguez 'faire' à l'impératif présent (2e personne du pluriel) :", opts:["faites","fassiez","faisiez","faites (accent)"], ans:0, expl:"Impératif présent de 'faire' : fais (tu), faisons (nous), faites (vous). Pas d'accent sur 'faites'." },
    { q:"Quel est le présent du subjonctif de 'avoir' (que j') ?", opts:["que j'ai","que j'aurais","que j'aie","que j'eus"], ans:2, expl:"Subjonctif de 'avoir' : que j'aie, que tu aies, qu'il ait, que nous ayons, que vous ayez, qu'ils aient." },
    { q:"Conjuguez 'battre' au passé composé (nous) :", opts:["nous battions","nous avons battus","nous avons battu","nous eûmes battu"], ans:2, expl:"Participe passé de 'battre' = 'battu'. Avec 'avoir' + COD après → pas d'accord : 'nous avons battu'." },
    { q:"Quel est l'imparfait de 'mettre' (ils) ?", opts:["ils mirent","ils mettaient","ils ont mis","ils mettraient"], ans:1, expl:"Imparfait de 'mettre' : je mettais, tu mettais, il mettait, nous mettions, vous mettiez, ils mettaient." },
    { q:"Conjuguez 'recevoir' au futur simple (je) :", opts:["je reçois","je reçevrai","je recevrai","je recevais"], ans:2, expl:"Futur de 'recevoir' : je recevrai (sans cédille). Radical : recevr-." },
    { q:"Quel est le passé composé de 'se lever' (elle) ?", opts:["elle a levé","elle s'est levée","elle levait","elle s'est levé"], ans:1, expl:"Verbe pronominal + être → accord avec le sujet féminin : 'elle s'est levée'." },
    { q:"Conjuguez 'lire' au subjonctif présent (que tu) :", opts:["que tu lis","que tu liras","que tu lises","que tu lisais"], ans:2, expl:"Subjonctif présent de 'lire' : que je lise, que tu lises, qu'il lise, que nous lisions, que vous lisiez." },
    { q:"Quel est le participe passé de 'offrir' ?", opts:["offri","offrit","offert","offru"], ans:2, expl:"Participe passé de 'offrir' = 'offert'. Comme 'couvrir' (couvert), 'souffrir' (souffert), 'ouvrir' (ouvert)." },
    { q:"Conjuguez 'connaître' à la 1ère personne du singulier au présent :", opts:["je connais","je connaît","je connait","je connaîs"], ans:0, expl:"'Je connais' (sans accent circonflexe sur le 'i', contrairement à 'connaître' à l'infinitif). Règle : accent avant 't'." },
    { q:"Quel est le plus-que-parfait de 'partir' (elle) ?", opts:["elle partait","elle était partie","elle serait partie","elle avait parti"], ans:1, expl:"Plus-que-parfait de 'partir' (conjugué avec être) : 'elle était partie' (imparfait de être + participe passé accordé)." },
    { q:"Conjuguez 'écrire' au passé simple (nous) :", opts:["nous écrivions","nous écrivîmes","nous avons écrit","nous écrivâmes"], ans:1, expl:"Passé simple de 'écrire' : j'écrivis, tu écrivis, il écrivit, nous écrivîmes, vous écrivîtes, ils écrivirent." },
    { q:"Quel est le conditionnel présent de 'vouloir' (il) ?", opts:["il veut","il voudrait","il voulerait","il voudra"], ans:1, expl:"Conditionnel présent de 'vouloir' : je voudrais, tu voudrais, il voudrait, nous voudrions, vous voudriez, ils voudraient." },
    { q:"Conjuguez 'appeler' au présent de l'indicatif (tu) :", opts:["tu apèles","tu appeles","tu appelles","tu apellas"], ans:2, expl:"'Appeler' double le 'l' devant un 'e' muet : j'appelle, tu appelles, il appelle, nous appelons, vous appelez, ils appellent." },
    { q:"Quel est le passé composé de 'mourir' (ils) ?", opts:["ils ont mourant","ils sont morts","ils avaient mort","ils mouraient"], ans:1, expl:"'Mourir' se conjugue avec 'être' au passé composé. Accord avec le sujet masc. plur. → 'ils sont morts'." },
    { q:"Conjuguez 'tenir' au subjonctif présent (que nous) :", opts:["que nous tenons","que nous tienions","que nous tenions","que nous tendrions"], ans:2, expl:"Subjonctif présent de 'tenir' : que je tienne, que tu tiennes, qu'il tienne, que nous tenions, que vous teniez, qu'ils tiennent." }
  ],

  // ===== COMPRÉHENSION ÉCRITE — 30 questions =====
  comprehension: [
    { q:"Dans un texte, 'néanmoins' introduit :", opts:["Une cause","Une conséquence","Une opposition ou nuance","Une addition"], ans:2, expl:"'Néanmoins' = 'cependant', 'pourtant', 'toutefois'. Il introduit une restriction ou une nuance par rapport à ce qui précède." },
    { q:"Le terme 'octroyer' signifie :", opts:["Refuser","Accorder / attribuer","Annuler","Demander"], ans:1, expl:"'Octroyer' = accorder, attribuer (quelque chose à quelqu'un). Ex : 'Le gouvernement lui a octroyé une bourse'." },
    { q:"Dans un texte administratif, 'le cas échéant' signifie :", opts:["Dans le meilleur des cas","Si la situation se présente / si nécessaire","Dans le pire des cas","Jamais"], ans:1, expl:"'Le cas échéant' = si cela s'avère nécessaire, si la situation l'exige. Très fréquent dans les documents officiels." },
    { q:"Un texte 'épistolaire' est :", opts:["Un texte scientifique","Un texte sous forme de lettres ou correspondances","Un texte narratif historique","Un texte publicitaire"], ans:1, expl:"'Épistolaire' vient de 'épître' (lettre). Un roman épistolaire est entièrement composé de lettres (ex: 'Les Liaisons dangereuses')." },
    { q:"L'expression 'sans préjudice de' dans un texte juridique signifie :", opts:["Contrairement à","Sans nuire aux droits déjà existants","Malgré les préjugés","Sans opinion préalable"], ans:1, expl:"'Sans préjudice de' = sans porter atteinte aux droits, recours ou obligations existants par ailleurs." },
    { q:"Que signifie 'à titre onéreux' ?", opts:["Gratuitement","Contre paiement / à un prix coûteux","À titre exceptionnel","En échange de services"], ans:1, expl:"'À titre onéreux' = en échange d'une compensation financière. S'oppose à 'à titre gratuit' (gratuitement)." },
    { q:"Dans un formulaire d'immigration, 'personne à charge' désigne :", opts:["Un employeur","Un dépendant financier (enfant, conjoint sans revenus)","Un garant financier","Un fonctionnaire"], ans:1, expl:"Une personne à charge (dependent) est quelqu'un financièrement dépendant du demandeur principal (enfants, conjoint inactif)." },
    { q:"Le mot 'solliciter' dans un contexte formel signifie :", opts:["Refuser poliment","Demander de manière formelle","Forcer quelqu'un","Proposer un service"], ans:1, expl:"'Solliciter' = demander de façon formelle et respectueuse. 'Je sollicite votre bienveillante attention'." },
    { q:"Dans un courriel professionnel, 'PJ' signifie :", opts:["Pour Joindre","Pièce jointe","Priorité Justifiée","Paragraphe Joint"], ans:1, expl:"'PJ' = Pièce Jointe. 'Veuillez trouver en PJ mon dossier complet' = 'Please find attached'." },
    { q:"L'expression 'dans les meilleurs délais' signifie :", opts:["Dès que possible","Le plus lentement possible","À une date précise","Dans un mois maximum"], ans:0, expl:"'Dans les meilleurs délais' = aussi rapidement que possible. Formule fréquente dans les courriers officiels et administratifs." },
    { q:"Un texte 'informatif' a pour objectif principal :", opts:["De divertir","De transmettre des informations objectives sur un sujet","De convaincre","De raconter une histoire"], ans:1, expl:"Le texte informatif présente des faits, données ou explications sans chercher à influencer l'opinion du lecteur." },
    { q:"Que signifie 'être en défaut de' dans un texte légal ?", opts:["Avoir un avantage sur","Ne pas respecter une obligation","Avoir payé en avance","Être dispensé de"], ans:1, expl:"'Être en défaut de' = ne pas avoir rempli une obligation contractuelle ou légale. Ex : 'être en défaut de paiement'." },
    { q:"Dans une annonce de recrutement, 'rémunération selon expérience' signifie :", opts:["Salaire fixe pour tous","Le salaire sera adapté au profil et à l'expérience du candidat","Travail bénévole","Salaire payé en fonction des résultats"], ans:1, expl:"Cette formule indique que le salaire n'est pas fixe et sera négocié selon les qualifications et l'expérience du candidat retenu." },
    { q:"Le terme 'accrédité' appliqué à un organisme signifie :", opts:["Nouveau","Officiellement reconnu et autorisé","Temporaire","Privé"], ans:1, expl:"Un organisme accrédité a reçu une reconnaissance officielle attestant de sa compétence dans un domaine précis." },
    { q:"Dans un texte, 'en dépit de' est synonyme de :", opts:["Grâce à","Malgré","À cause de","Selon"], ans:1, expl:"'En dépit de' = malgré, nonobstant. Ex : 'En dépit des difficultés, il a réussi' = 'Malgré les difficultés'." },
    { q:"Que signifie 'mandater quelqu'un' ?", opts:["Le critiquer","Lui donner le pouvoir d'agir en son nom","L'inviter","Le rembourser"], ans:1, expl:"Mandater = donner à quelqu'un un mandat, c'est-à-dire l'autorisation d'agir au nom de la personne qui mandate." },
    { q:"L'expression 'sous réserve de' dans un contrat signifie :", opts:["Sans condition","Avec la condition que / à condition que","De manière définitive","Sans possibilité de changement"], ans:1, expl:"'Sous réserve de' = à condition que certaines conditions soient remplies. Ex : 'Offre valable sous réserve de disponibilité'." },
    { q:"Dans un texte argumentatif, une 'concession' est :", opts:["Un argument en faveur de sa propre thèse","La reconnaissance partielle de la validité de l'argument adverse","Une erreur de raisonnement","Une conclusion définitive"], ans:1, expl:"La concession = 'certes X (point adverse), mais Y (réfutation)'. Elle montre la nuance et renforce paradoxalement sa propre thèse." },
    { q:"Le mot 'allocution' désigne :", opts:["Une allocation financière","Un discours ou une prise de parole officielle","Un formulaire administratif","Un article de loi"], ans:1, expl:"Une 'allocution' est un discours officiel, généralement bref, prononcé lors d'une cérémonie ou d'un événement formel." },
    { q:"Dans un texte de presse, 'selon nos sources' signifie :", opts:["L'information est certifiée vraie","L'information provient de personnes non nommées et n'est pas officiellement confirmée","L'information est fausse","L'information provient du gouvernement"], ans:1, expl:"'Selon nos sources' indique que l'information vient de sources confidentielles non vérifiables publiquement." },
    { q:"L'expression 'à l'instar de' signifie :", opts:["Contrairement à","À la manière de / comme","En opposition à","Grâce à"], ans:1, expl:"'À l'instar de' = à l'exemple de, comme, de la même façon que. Ex : 'À l'instar de son père, il est devenu médecin'." },
    { q:"Dans un contrat de travail, 'préavis' désigne :", opts:["Un salaire supplémentaire","Le délai à respecter avant de quitter ou renvoyer un employé","Un test de compétences","Une période d'essai"], ans:1, expl:"Le préavis est la période de notification obligatoire avant la rupture d'un contrat de travail (démission ou licenciement)." },
    { q:"Que signifie 'valider' une demande dans un contexte administratif ?", opts:["Refuser officiellement","Confirmer officiellement la conformité et l'acceptation","Transmettre à un supérieur","Archiver"], ans:1, expl:"Valider = confirmer officiellement qu'une demande est recevable, complète et acceptée. Différent de 'approuver' (décision finale)." },
    { q:"L'expression 'au prorata de' signifie :", opts:["En totalité","Proportionnellement à","Indépendamment de","À l'exception de"], ans:1, expl:"'Au prorata de' = proportionnellement à. Ex : 'Le congé est calculé au prorata des heures travaillées'." },
    { q:"Dans un texte, 'étayer' un argument signifie :", opts:["L'affaiblir","Le renforcer avec des preuves ou des exemples","Le supprimer","Le résumer"], ans:1, expl:"'Étayer' = renforcer, appuyer, illustrer par des preuves, exemples, chiffres ou citations." },
    { q:"Que signifie 'ad hoc' dans un texte formel ?", opts:["Par hasard","Spécialement conçu pour cette situation précise","En général","De façon permanente"], ans:1, expl:"'Ad hoc' (latin) = spécifiquement conçu pour cette situation ou ce but précis. Ex : 'Un comité ad hoc a été formé'." },
    { q:"Dans un bail de logement, 'le locataire' est :", opts:["Le propriétaire du logement","La personne qui loue le logement","L'agence immobilière","Le garant"], ans:1, expl:"Le locataire = la personne qui loue le logement (tenant). Le propriétaire = le bailleur (landlord)." },
    { q:"L'expression 'faire valoir ses droits' signifie :", opts:["Accepter une décision","Exercer et défendre ses droits légaux","Renoncer à ses droits","Payer ses impôts"], ans:1, expl:"'Faire valoir ses droits' = exercer activement ses droits, notamment en recourant aux voies légales disponibles." },
    { q:"Dans un texte publicitaire, 'offre limitée' signifie :", opts:["L'offre est mauvaise","L'offre est disponible en quantité ou temps limité pour inciter à l'action immédiate","L'offre est gratuite","L'offre est permanente"], ans:1, expl:"'Offre limitée' est une technique de marketing créant l'urgence : disponible seulement pour un nombre limité ou une durée courte." },
    { q:"Le terme 'acquiescer' signifie :", opts:["Refuser poliment","Contester","Accepter / donner son accord","Ignorer"], ans:2, expl:"'Acquiescer' = donner son accord, accepter, dire oui. 'Il a acquiescé d'un hochement de tête'." }
  ],

  // ===== EXPRESSION ÉCRITE — 30 questions =====
  expression_ecrite: [
    { q:"Quelle formule de salutation convient à un courriel formel adressé à une femme dont on ignore le prénom ?", opts:["Salut,","Madame,","Chère amie,","Hey,"], ans:1, expl:"En français formel, 'Madame,' (avec virgule) est la formule standard si on connaît le genre mais pas le prénom. Sans prénom = pas de 'Chère Madame'." },
    { q:"Quelle formule de politesse finale convient pour un courriel professionnel ?", opts:["Bisous","À bientôt","Veuillez agréer, Madame, l'expression de mes salutations distinguées.","Cordialement suffira"], ans:2, expl:"La formule longue ('Veuillez agréer…') est requise dans les courriers officiels. 'Cordialement' convient pour les échanges professionnels informels." },
    { q:"Un connecteur d'opposition dans un texte argumentatif est :", opts:["De plus","Cependant","Parce que","En conclusion"], ans:1, expl:"'Cependant' = mais, néanmoins, toutefois. Il introduit une opposition ou une réserve." },
    { q:"La 'Tâche 2' de l'expression écrite au TEF Canada demande :", opts:["Un courriel de 60 mots","Un texte argumentatif de 200-250 mots","Une liste de courses","Un résumé de 100 mots"], ans:1, expl:"La Tâche 2 est un texte argumentatif de 200 à 250 mots présentant une opinion argumentée sur un sujet donné." },
    { q:"Dans un texte argumentatif, le plan 'thèse-antithèse-synthèse' signifie :", opts:["Raconter une histoire en 3 parties","Présenter le pour, le contre, puis sa propre conclusion nuancée","Lister 3 arguments du même côté","Résumer 3 textes différents"], ans:1, expl:"La structure dialectique thèse/antithèse/synthèse est le plan standard pour un texte argumentatif au niveau B2/C1." },
    { q:"Quel est le registre adapté à un courriel formel ?", opts:["Registre familier avec contractions","Registre soutenu sans contractions ni anglicismes","Registre SMS","Registre technique uniquement"], ans:1, expl:"Un courriel formel exige un registre soutenu : 'vous', formules complètes, vocabulaire précis, pas de 'c'est' en début de phrase." },
    { q:"Quelle phrase est au registre le plus soutenu ?", opts:["Je veux savoir si vous avez reçu mon dossier.","Pourriez-vous m'informer de la réception de mon dossier ?","Vous avez reçu mon dossier ?","Mon dossier, vous l'avez eu ?"], ans:1, expl:"Le conditionnel de politesse ('Pourriez-vous') + vocabulaire formel ('m'informer de la réception') = registre soutenu." },
    { q:"Un 'exemple concret' dans un texte argumentatif sert à :", opts:["Remplacer l'argument","Illustrer et renforcer l'argument par un cas réel ou plausible","Allonger le texte","Introduire une contradiction"], ans:1, expl:"L'exemple illustre l'argument abstrait par un cas concret, ce qui le rend plus convaincant et crédible." },
    { q:"Quel connecteur utilise-t-on pour introduire une conclusion ?", opts:["De plus","En guise de conclusion / Ainsi / En somme","Certes","Parce que"], ans:1, expl:"Les connecteurs conclusifs (en somme, ainsi, par conséquent, en définitive) signalent la fin du raisonnement." },
    { q:"La 'cohésion textuelle' se construit avec :", opts:["Des titres et sous-titres uniquement","Des pronoms, connecteurs et répétitions contrôlées assurant la continuité thématique","Des listes à puces","Des chiffres et statistiques"], ans:1, expl:"La cohésion = liens entre les phrases et paragraphes par les pronoms (anaphores), connecteurs et reprises lexicales variées." },
    { q:"Quelle erreur est typique d'un niveau B1 en expression écrite ?", opts:["Des connecteurs variés","La répétition du même mot ou de la même structure tout au long du texte","Un vocabulaire trop riche","Des phrases trop longues"], ans:1, expl:"La répétition lexicale et syntaxique est le signal d'un manque de maîtrise du vocabulaire, caractéristique du niveau B1." },
    { q:"Quel temps est privilégié dans un texte argumentatif pour énoncer une vérité générale ?", opts:["Le passé composé","Le présent de l'indicatif","L'imparfait","Le conditionnel"], ans:1, expl:"Le présent de vérité générale ('L'immigration enrichit les sociétés') est le temps de référence des textes argumentatifs." },
    { q:"'Qui plus est' est un connecteur qui exprime :", opts:["L'opposition","L'addition renforcée / la surenchère","La cause","Le temps"], ans:1, expl:"'Qui plus est' = de surcroît, en outre, de plus. Il ajoute un argument plus fort que le précédent." },
    { q:"Dans une lettre formelle, l'objet est :", opts:["Toujours le dernier élément","Une ligne résumant le sujet principal, placée avant le corps","Obligatoirement entre guillemets","Un élément optionnel"], ans:1, expl:"La ligne 'Objet :' (ou 'Re :') résume le sujet de la lettre. Elle se place après la date et les coordonnées, avant le corps du texte." },
    { q:"Un 'argument d'autorité' dans un texte argumentatif est :", opts:["Une décision autoritaire","Une citation d'expert ou une référence à une source crédible pour renforcer son point","Un argument émotionnel","Un chiffre inventé"], ans:1, expl:"L'argument d'autorité = citer une source reconnue (expert, étude, statistique officielle) pour légitimer sa position." },
    { q:"Quel est le temps le plus adapté pour formuler une recommandation dans un texte ?", opts:["Le passé simple","Le conditionnel présent","L'imparfait","Le futur antérieur"], ans:1, expl:"Le conditionnel présent ('Il serait souhaitable de', 'Il conviendrait de') est la forme standard des recommandations en français formel." },
    { q:"Dans un texte argumentatif, une 'transition' entre deux paragraphes sert à :", opts:["Terminer l'idée sans la relier à la suivante","Assurer la fluidité en liant logiquement les idées entre elles","Introduire un hors-sujet","Résumer tout le texte"], ans:1, expl:"La phrase de transition reprend l'idée du paragraphe précédent et annonce celle du suivant, assurant la cohérence du texte." },
    { q:"Quel registre convient pour s'adresser à un fonctionnaire de l'immigration par écrit ?", opts:["Familier","Formel et courtois","Technique et impersonnel uniquement","Décontracté"], ans:1, expl:"Les communications avec des fonctionnaires exigent un registre formel et courtois : 'vous', formules complètes, ton respectueux." },
    { q:"L'expression 'force est de constater que' en expression écrite sert à :", opts:["Exprimer un doute","Introduire un fait incontestable de manière soutenue","Critiquer","Donner une opinion personnelle directe"], ans:1, expl:"'Force est de constater que' = il est indéniable que, on ne peut que reconnaître que. Expression de haut registre pour NCLC 9+." },
    { q:"En expression écrite, éviter les 'anglicismes' signifie :", opts:["Ne pas utiliser de mots latins","Remplacer les mots d'origine anglaise par leurs équivalents français corrects","Éviter tout vocabulaire technique","Utiliser uniquement des mots de moins de 2 syllabes"], ans:1, expl:"Les anglicismes sont très pénalisés au TEF/TCF. Ex : 'canceller' → 'annuler' ; 'checker' → 'vérifier' ; 'meeting' → 'réunion'." },
    { q:"Dans la Tâche 1 (lettre/courriel), 'développer les points demandés' signifie :", opts:["Mentionner vaguement chaque point","Traiter chaque consigne avec au moins 2-3 phrases d'explication ou d'exemple","Écrire une seule longue phrase par point","Ignorer les points mineurs"], ans:1, expl:"Chaque consigne de la Tâche 1 doit être développée avec explication + exemple ou demande précise. Un simple mentionner = points partiels." },
    { q:"Quel est l'équivalent formel de 'je veux' dans un courriel professionnel ?", opts:["Je veux vraiment","Je souhaite / Je souhaiterais","Je voulais juste","Je désire absolument"], ans:1, expl:"'Je souhaite' (présent) ou 'Je souhaiterais' (conditionnel de politesse) remplace 'je veux' dans les contextes formels." },
    { q:"Dans un texte argumentatif, 'nuancer sa conclusion' signifie :", opts:["Changer d'avis à la dernière minute","Reconnaître les limites de sa position tout en maintenant l'essentiel de son argument","Ne pas conclure","Répéter l'introduction"], ans:1, expl:"Nuancer = reconnaître les limites ('certes, il existe des exceptions…') sans abandonner sa thèse principale — signe de maturité intellectuelle." },
    { q:"L'expression 'à cet égard' dans un texte formel signifie :", opts:["En ce qui concerne ce sujet précis","À cet endroit","Pour cette raison","En dehors de ce sujet"], ans:0, expl:"'À cet égard' = en ce qui concerne ce point, sur ce sujet précis. Ex : 'À cet égard, les données sont claires'." },
    { q:"Quelle structure de phrase est caractéristique du registre soutenu ?", opts:["'Y'a pas de souci'","'Quoique la situation soit complexe, il convient de reconnaître que…'","'C'est super important'","'Ça marche très bien'"], ans:1, expl:"La subordination complexe (quoique + subjonctif), le vocabulaire précis et les formules impersonnelles caractérisent le registre soutenu." },
    { q:"En expression écrite formelle, les abréviations comme 'bcp', 'pr', 'stp' sont :", opts:["Acceptables si le texte est long","Toujours interdites dans une production formelle","Recommandées pour gagner du temps","Neutres — ni pénalisées ni valorisées"], ans:1, expl:"Les abréviations de type SMS sont totalement proscrites dans un texte formel. Elles témoignent d'un manque de maîtrise du registre." },
    { q:"La formule 'Je vous prie d'agréer…' au bas d'une lettre est :", opts:["Optionnelle","Obligatoire dans les courriers officiels formels","Ancienne et à éviter","Réservée aux courriers gouvernementaux"], ans:1, expl:"La formule de politesse conclusive est obligatoire dans les lettres formelles. 'Cordialement' suffit pour les courriels professionnels courants." },
    { q:"Dans un plan thèse/antithèse/synthèse, la 'synthèse' doit :", opts:["Répéter la thèse mot pour mot","Proposer un dépassement nuancé qui tient compte des deux arguments précédents","Introduire un troisième argument opposé","Conclure avec une question sans réponse"], ans:1, expl:"La synthèse (conclusion) dépasse l'opposition thèse/antithèse en proposant une position nuancée qui intègre les deux perspectives." },
    { q:"Quel registre emploie-t-on dans un courriel de réclamation formelle ?", opts:["Agressif et direct","Formel, poli mais ferme","Familier et amical","Neutre et impersonnel uniquement"], ans:1, expl:"Un courriel de réclamation = registre formel + courtoisie + fermeté. Éviter l'agressivité qui nuit à l'efficacité de la démarche." },
    { q:"En expression écrite, 'la pertinence du contenu' est évaluée sur :", opts:["La longueur du texte uniquement","L'adéquation du contenu avec les consignes et le sujet donné","La beauté de l'écriture","Le nombre de connecteurs"], ans:1, expl:"La pertinence = le texte répond exactement aux consignes, reste dans le sujet et apporte du contenu utile et approprié." }
  ]

};

// ===== MOTEUR DE SÉLECTION ALÉATOIRE =====
const usedQuestions = {};

function getRandomQuestions(category, count) {
  const bank = QUESTION_BANK[category];
  if (!bank) return [];

  if (!usedQuestions[category]) usedQuestions[category] = new Set();
  if (usedQuestions[category].size >= bank.length - count) {
    usedQuestions[category].clear();
  }

  const available = bank
    .map((q, i) => ({ ...q, _originalIndex: i }))
    .filter(q => !usedQuestions[category].has(q._originalIndex));

  // Fisher-Yates shuffle
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const selected = available.slice(0, count);
  selected.forEach(q => usedQuestions[category].add(q._originalIndex));

  // Mélanger les options (et mettre à jour l'index de la bonne réponse)
  return selected.map(q => {
    const originalAnswer = q.opts[q.ans];
    const shuffledOpts = [...q.opts].sort(() => Math.random() - 0.5);
    const newAns = shuffledOpts.indexOf(originalAnswer);
    return { ...q, opts: shuffledOpts, ans: newAns };
  });
}

// ===== CONFIGURATION DES TESTS =====
const TEST_CONFIG = {
  niveau: {
    title: "Test de niveau NCLC",
    categories: [
      { cat: 'grammaire',         count: 3 },
      { cat: 'vocabulaire',       count: 3 },
      { cat: 'strategies',        count: 2 },
      { cat: 'culture',           count: 2 }
    ],
    total: 10,
    timeLimit: null,
    badge: 'GRATUIT'
  },
  semiofficiel: {
    title: "Test semi-officiel d'évaluation",
    categories: [
      { cat: 'grammaire',         count: 4 },
      { cat: 'vocabulaire',       count: 4 },
      { cat: 'conjugaison',       count: 2 },
      { cat: 'strategies',        count: 3 },
      { cat: 'culture',           count: 2 }
    ],
    total: 15,
    timeLimit: 20 * 60,
    badge: 'SEMI-OFFICIEL'
  },
  grammaire: {
    title: "Quiz de grammaire avancée",
    categories: [
      { cat: 'grammaire',   count: 7 },
      { cat: 'conjugaison', count: 3 }
    ],
    total: 10,
    timeLimit: null
  },
  vocabulaire: {
    title: "Vocabulaire & immigration",
    categories: [{ cat: 'vocabulaire', count: 10 }],
    total: 10,
    timeLimit: null
  },
  strategies: {
    title: "Stratégies d'examen TEF/TCF",
    categories: [{ cat: 'strategies', count: 10 }],
    total: 10,
    timeLimit: null
  },
  culture: {
    title: "Culture & société canadiennes",
    categories: [{ cat: 'culture', count: 10 }],
    total: 10,
    timeLimit: null
  },
  conjugaison: {
    title: "Quiz de conjugaison",
    categories: [{ cat: 'conjugaison', count: 10 }],
    total: 10,
    timeLimit: null
  },
  comprehension: {
    title: "Compréhension écrite",
    categories: [{ cat: 'comprehension', count: 10 }],
    total: 10,
    timeLimit: null
  },
  expression: {
    title: "Expression écrite — connaissances",
    categories: [{ cat: 'expression_ecrite', count: 10 }],
    total: 10,
    timeLimit: null
  },
  tuteur: {
    title: "Test d'habilitation TUTEUR",
    categories: [
      { cat: 'grammaire',         count: 7 },
      { cat: 'conjugaison',       count: 3 },
      { cat: 'vocabulaire',       count: 7 },
      { cat: 'strategies',        count: 7 },
      { cat: 'culture',           count: 3 },
      { cat: 'comprehension',     count: 2 },
      { cat: 'expression_ecrite', count: 1 }
    ],
    total: 30,
    timeLimit: 30 * 60,
    passingScore: 22,
    badge: 'CERTIFICATION TUTEUR'
  }
};

function buildQuizQuestions(testId) {
  const config = TEST_CONFIG[testId];
  if (!config) return [];
  let questions = [];
  config.categories.forEach(({ cat, count }) => {
    questions = questions.concat(getRandomQuestions(cat, count));
  });
  // Mélange final
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions;
}
