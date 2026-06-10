// ============================================================
// ARCADINS Training Center — Popup d'accès obligatoire
// S'affiche sur toutes les pages publiques si non connecté
// Impossible à fermer sans inscription/connexion
// ============================================================

(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────
  const API_BASE = window.ARCADINS_API_BASE || (
    ['localhost','127.0.0.1'].includes(window.location.hostname)
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api'
  );

  // Pages qui ne nécessitent PAS le popup (espace membres)
  const EXEMPT_PAGES = [
    'acces.html', 'essai-gratuit.html', 'forfaits.html',
    'qualification.html', 'formation.html', 'test-final.html',
    'mon-certificat.html', 'espace-membre.html', 'verifier-certificat.html',
    'admin/index.html'
  ];

  const currentPage = window.location.pathname;
  const isExempt = EXEMPT_PAGES.some(p => currentPage.includes(p));
  if (isExempt) return;

  // ── Vérifie si déjà connecté ──────────────────────────────
  const token = localStorage.getItem('arc_token');
  if (token) {
    // Vérifie que le token est encore valide
    fetch(API_BASE + '/access/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => {
      if (!r.ok) { localStorage.removeItem('arc_token'); showPopup(); }
    }).catch(() => { showPopup(); });
    return;
  }

  // ── Affiche le popup dès le chargement ───────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showPopup);
  } else {
    showPopup();
  }

  // ── PAYS pour le select ───────────────────────────────────
  const PAYS = [
    'Afghanistan','Afrique du Sud','Albanie','Algérie','Allemagne','Andorre','Angola',
    'Antigua-et-Barbuda','Arabie Saoudite','Argentine','Arménie','Australie','Autriche',
    'Azerbaïdjan','Bahamas','Bahreïn','Bangladesh','Barbade','Belgique','Belize','Bénin',
    'Bhoutan','Biélorussie','Birmanie (Myanmar)','Bolivie','Bosnie-Herzégovine','Botswana',
    'Brésil','Brunei','Bulgarie','Burkina Faso','Burundi','Cambodge','Cameroun','Canada',
    'Cap-Vert','Chili','Chine','Chypre','Colombie','Comores','Congo (Brazzaville)',
    'Congo (RDC)','Corée du Nord','Corée du Sud','Costa Rica','Côte d\'Ivoire','Croatie',
    'Cuba','Danemark','Djibouti','Dominique','Égypte','Émirats arabes unis','Équateur',
    'Érythrée','Espagne','Estonie','Eswatini','États-Unis','Éthiopie','Fidji','Finlande',
    'France','Gabon','Gambie','Géorgie','Ghana','Grèce','Grenade','Guatemala','Guinée',
    'Guinée équatoriale','Guinée-Bissau','Guyana','Haïti','Honduras','Hongrie','Îles Marshall',
    'Îles Salomon','Inde','Indonésie','Irak','Iran','Irlande','Islande','Israël','Italie',
    'Jamaïque','Japon','Jordanie','Kazakhstan','Kenya','Kirghizistan','Kiribati','Kosovo',
    'Koweït','Laos','Lesotho','Lettonie','Liban','Liberia','Libye','Liechtenstein',
    'Lituanie','Luxembourg','Macédoine du Nord','Madagascar','Malaisie','Malawi','Maldives',
    'Mali','Malte','Maroc','Maurice','Mauritanie','Mexique','Micronésie','Moldavie',
    'Monaco','Mongolie','Monténégro','Mozambique','Namibie','Nauru','Népal','Nicaragua',
    'Niger','Nigéria','Norvège','Nouvelle-Zélande','Oman','Ouganda','Ouzbékistan','Pakistan',
    'Palaos','Palestine','Panama','Papouasie-Nouvelle-Guinée','Paraguay','Pays-Bas','Pérou',
    'Philippines','Pologne','Portugal','Qatar','République centrafricaine',
    'République dominicaine','République tchèque','Roumanie','Royaume-Uni','Russie','Rwanda',
    'Saint-Christophe-et-Niévès','Saint-Marin','Saint-Vincent-et-les-Grenadines','Sainte-Lucie',
    'Salvador','Samoa','Sao Tomé-et-Principe','Sénégal','Serbie','Seychelles','Sierra Leone',
    'Singapour','Slovaquie','Slovénie','Somalie','Soudan','Soudan du Sud','Sri Lanka',
    'Suède','Suisse','Suriname','Syrie','Tadjikistan','Tanzanie','Tchad','Thaïlande',
    'Timor oriental','Togo','Tonga','Trinité-et-Tobago','Tunisie','Turkménistan','Turquie',
    'Tuvalu','Ukraine','Uruguay','Vanuatu','Vatican','Venezuela','Vietnam','Yémen',
    'Zambie','Zimbabwe'
  ];

  function getLang() {
    return localStorage.getItem('arc_lang') || 'fr';
  }

  const TXT = {
    fr: {
      welcome: 'Bienvenue sur ARCADINS',
      sub: 'Créez votre compte pour accéder à la plateforme de préparation TEF & TCF Canada',
      tabNew: '✨ Nouveau visiteur',
      tabLogin: '🔑 Déjà inscrit',
      prenom: 'Prénom *',
      nom: 'Nom de famille *',
      email: 'Adresse email *',
      tel: 'Numéro de téléphone *',
      pays: 'Pays de résidence *',
      paysDefault: '— Sélectionnez votre pays —',
      password: 'Mot de passe * (min. 8 caractères)',
      btnRegister: 'Accéder à la plateforme →',
      btnLogin: 'Se connecter →',
      loginEmail: 'Email',
      loginPass: 'Mot de passe',
      loading: 'Connexion en cours...',
      privacy: '🔒 Vos données sont confidentielles et ne seront jamais partagées.',
      errRequired: 'Tous les champs sont obligatoires.',
      errEmail: 'Adresse email invalide.',
      errPays: 'Veuillez sélectionner votre pays.',
      errPassword: 'Le mot de passe doit contenir au moins 8 caractères.',
      errServer: 'Erreur serveur. Vérifiez votre connexion.',
    },
    en: {
      welcome: 'Welcome to ARCADINS',
      sub: 'Create your free account to access the TEF & TCF Canada preparation platform',
      tabNew: '✨ New visitor',
      tabLogin: '🔑 Already registered',
      prenom: 'First name *',
      nom: 'Last name *',
      email: 'Email address *',
      tel: 'Phone number *',
      pays: 'Country of residence *',
      paysDefault: '— Select your country —',
      password: 'Password * (min. 8 characters)',
      btnRegister: 'Access the platform →',
      btnLogin: 'Log in →',
      loginEmail: 'Email',
      loginPass: 'Password',
      loading: 'Connecting...',
      privacy: '🔒 Your data is confidential and will never be shared.',
      errRequired: 'All fields are required.',
      errEmail: 'Invalid email address.',
      errPays: 'Please select your country.',
      errPassword: 'Password must be at least 8 characters.',
      errServer: 'Server error. Check your connection.',
    }
  };

  function showPopup() {
    const lang = getLang();
    const tx = TXT[lang] || TXT.fr;

    // Bloc scroll de la page
    document.body.style.overflow = 'hidden';

    const paysOptions = PAYS.map(p => `<option value="${p}">${p}</option>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'arcAccessPopup';
    overlay.innerHTML = `
      <style>
        #arcAccessPopup {
          position:fixed; inset:0; z-index:99999;
          background:rgba(0,15,50,.92);
          backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center;
          padding:16px;
          animation:fadeInPop .4s ease;
        }
        @keyframes fadeInPop { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
        #arcPopupBox {
          background:white; border-radius:20px;
          width:100%; max-width:500px;
          max-height:92vh; overflow-y:auto;
          box-shadow:0 32px 80px rgba(0,0,0,.5);
          animation:slideUpPop .4s ease;
        }
        @keyframes slideUpPop { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        #arcPopupBox::-webkit-scrollbar { width:4px; }
        #arcPopupBox::-webkit-scrollbar-thumb { background:#e0e0e0; border-radius:4px; }
        .arc-popup-header {
          background:linear-gradient(135deg,#074A2E,#003399);
          border-radius:20px 20px 0 0;
          padding:28px 28px 20px;
          text-align:center; color:white;
        }
        .arc-popup-logo { font-size:1.1rem; font-weight:900; letter-spacing:2px; opacity:.9; margin-bottom:4px; }
        .arc-popup-title { font-size:1.5rem; font-weight:900; margin:8px 0 6px; }
        .arc-popup-sub { font-size:.85rem; opacity:.8; line-height:1.5; }
        .arc-popup-maple { font-size:2rem; margin-bottom:6px; }
        .arc-popup-tabs {
          display:flex; border-bottom:2px solid #f0f4f8;
          background:#fafbff;
        }
        .arc-tab-btn {
          flex:1; padding:12px 8px; border:none; background:none;
          font-family:inherit; font-size:.82rem; font-weight:700;
          color:#888; cursor:pointer; transition:.2s;
          border-bottom:3px solid transparent; margin-bottom:-2px;
        }
        .arc-tab-btn.active { color:#074A2E; border-bottom-color:#C9A84C; background:white; }
        .arc-popup-body { padding:24px 28px 20px; }
        .arc-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media(max-width:480px) { .arc-form-row { grid-template-columns:1fr; } }
        .arc-field { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
        .arc-field label { font-size:.78rem; font-weight:700; color:#074A2E; }
        .arc-field input, .arc-field select {
          border:2px solid #e0e6f0; border-radius:10px;
          padding:10px 14px; font-family:inherit; font-size:.9rem;
          transition:.2s; background:white; color:#222;
        }
        .arc-field input:focus, .arc-field select:focus {
          border-color:#074A2E; outline:none;
          box-shadow:0 0 0 3px rgba(0,31,107,.08);
        }
        .arc-field input.err, .arc-field select.err { border-color:#d32f2f; }
        .arc-error-msg {
          background:#fce4ec; border:1.5px solid #ef9a9a;
          border-radius:8px; padding:10px 14px;
          font-size:.82rem; color:#c62828;
          margin-bottom:14px; display:none;
        }
        .arc-btn-submit {
          width:100%; padding:13px; border:none; border-radius:12px;
          background:linear-gradient(135deg,#C9A84C,#a07830);
          color:white; font-family:inherit; font-size:.95rem;
          font-weight:800; cursor:pointer; transition:.25s;
          letter-spacing:.5px; margin-top:4px;
        }
        .arc-btn-submit:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(201,168,76,.4); }
        .arc-btn-submit:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .arc-privacy {
          text-align:center; font-size:.74rem; color:#999;
          margin-top:14px; padding-top:14px;
          border-top:1px solid #f0f0f0; line-height:1.5;
        }
        .arc-badge-row {
          display:flex; gap:10px; justify-content:center;
          margin-top:12px; flex-wrap:wrap;
        }
        .arc-badge {
          background:#f0f4ff; border:1px solid #d0d8f0;
          border-radius:20px; padding:4px 12px;
          font-size:.72rem; color:#074A2E; font-weight:600;
        }
      </style>

      <div id="arcPopupBox">
        <div class="arc-popup-header">
          <div class="arc-popup-maple">🍁</div>
          <div class="arc-popup-logo">ARCADINS TRAINING CENTER</div>
          <div class="arc-popup-title" id="arcPopTitle">${tx.welcome}</div>
          <div class="arc-popup-sub" id="arcPopSub">${tx.sub}</div>
        </div>

        <div class="arc-popup-tabs">
          <button class="arc-tab-btn active" id="arcTabNew" onclick="arcSwitchTab('register')">${tx.tabNew}</button>
          <button class="arc-tab-btn" id="arcTabLogin" onclick="arcSwitchTab('login')">${tx.tabLogin}</button>
        </div>

        <div class="arc-popup-body">

          <!-- Formulaire inscription -->
          <form id="arcRegisterForm" onsubmit="arcHandleRegister(event)">
            <div class="arc-form-row">
              <div class="arc-field">
                <label id="lblPrenom">${tx.prenom}</label>
                <input type="text" id="arcPrenom" autocomplete="given-name" />
              </div>
              <div class="arc-field">
                <label id="lblNom">${tx.nom}</label>
                <input type="text" id="arcNom" autocomplete="family-name" />
              </div>
            </div>
            <div class="arc-field">
              <label id="lblEmail">${tx.email}</label>
              <input type="email" id="arcEmail" autocomplete="email" />
            </div>
            <div class="arc-field">
              <label id="lblTel">${tx.tel}</label>
              <input type="tel" id="arcTel" autocomplete="tel" placeholder="+1 514 000 0000" />
            </div>
            <div class="arc-field">
              <label id="lblPays">${tx.pays}</label>
              <select id="arcPays">
                <option value="" id="lblPaysDefault">${tx.paysDefault}</option>
                ${paysOptions}
              </select>
            </div>
            <div class="arc-field">
              <label id="lblPass">${tx.password}</label>
              <input type="password" id="arcPass" autocomplete="new-password" />
            </div>
            <div class="arc-error-msg" id="arcRegErr"></div>
            <button type="submit" class="arc-btn-submit" id="arcRegBtn">${tx.btnRegister}</button>
          </form>

          <!-- Formulaire connexion -->
          <form id="arcLoginForm" onsubmit="arcHandleLogin(event)" style="display:none;">
            <div class="arc-field">
              <label id="lblLoginEmail">${tx.loginEmail}</label>
              <input type="email" id="arcLoginEmail" autocomplete="email" />
            </div>
            <div class="arc-field">
              <label id="lblLoginPass">${tx.loginPass}</label>
              <input type="password" id="arcLoginPass" autocomplete="current-password" />
            </div>
            <div class="arc-error-msg" id="arcLoginErr"></div>
            <button type="submit" class="arc-btn-submit" id="arcLoginBtn">${tx.btnLogin}</button>
          </form>

          <div class="arc-privacy" id="arcPrivacy">${tx.privacy}</div>
          <div class="arc-badge-row">
            <span class="arc-badge">✅ TEF Canada</span>
            <span class="arc-badge">✅ TCF Canada</span>
            <span class="arc-badge">🔒 Sécurisé</span>
            <span class="arc-badge">🇨🇦 Ottawa</span>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Empêche la fermeture en cliquant en dehors
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        const box = document.getElementById('arcPopupBox');
        box.style.animation = 'none';
        box.style.transform = 'scale(1.02)';
        setTimeout(() => { box.style.transform = ''; }, 150);
      }
    });
  }

  // ── Gestion des onglets ───────────────────────────────────
  window.arcSwitchTab = function(tab) {
    const lang = getLang();
    const tx = TXT[lang] || TXT.fr;
    document.getElementById('arcRegisterForm').style.display = tab === 'register' ? '' : 'none';
    document.getElementById('arcLoginForm').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('arcTabNew').classList.toggle('active', tab === 'register');
    document.getElementById('arcTabLogin').classList.toggle('active', tab === 'login');
  };

  // ── Inscription ───────────────────────────────────────────
  window.arcHandleRegister = async function(e) {
    e.preventDefault();
    const lang = getLang();
    const tx = TXT[lang] || TXT.fr;

    const prenom   = document.getElementById('arcPrenom').value.trim();
    const nom      = document.getElementById('arcNom').value.trim();
    const email    = document.getElementById('arcEmail').value.trim();
    const tel      = document.getElementById('arcTel').value.trim();
    const pays     = document.getElementById('arcPays').value;
    const password = document.getElementById('arcPass').value;

    const errEl = document.getElementById('arcRegErr');
    errEl.style.display = 'none';

    // Validations
    if (!prenom || !nom || !email || !tel || !password) {
      showErr(errEl, tx.errRequired); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showErr(errEl, tx.errEmail); return;
    }
    if (!pays) {
      showErr(errEl, tx.errPays); return;
    }
    if (password.length < 8) {
      showErr(errEl, tx.errPassword); return;
    }

    const btn = document.getElementById('arcRegBtn');
    btn.disabled = true;
    btn.textContent = tx.loading;

    try {
      const res = await fetch(API_BASE + '/access/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom, email, telephone: tel, pays, password })
      });
      const data = await res.json();

      if (!res.ok) {
        showErr(errEl, data.message || tx.errServer);
        btn.disabled = false;
        btn.textContent = tx.btnRegister;
        return;
      }

      // Succès
      localStorage.setItem('arc_token', data.token);
      if (data.user) localStorage.setItem('arc_user', JSON.stringify(data.user));
      arcClosePopup(data.user);
    } catch(err) {
      showErr(errEl, tx.errServer);
      btn.disabled = false;
      btn.textContent = tx.btnRegister;
    }
  };

  // ── Connexion ─────────────────────────────────────────────
  window.arcHandleLogin = async function(e) {
    e.preventDefault();
    const lang = getLang();
    const tx = TXT[lang] || TXT.fr;

    const email    = document.getElementById('arcLoginEmail').value.trim();
    const password = document.getElementById('arcLoginPass').value;
    const errEl    = document.getElementById('arcLoginErr');
    errEl.style.display = 'none';

    if (!email || !password) { showErr(errEl, tx.errRequired); return; }

    const btn = document.getElementById('arcLoginBtn');
    btn.disabled = true;
    btn.textContent = tx.loading;

    try {
      const res = await fetch(API_BASE + '/access/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        showErr(errEl, data.message || tx.errServer);
        btn.disabled = false;
        btn.textContent = tx.btnLogin;
        return;
      }

      localStorage.setItem('arc_token', data.token);
      if (data.user) localStorage.setItem('arc_user', JSON.stringify(data.user));
      arcClosePopup(data.user);
    } catch(err) {
      showErr(errEl, tx.errServer);
      btn.disabled = false;
      btn.textContent = tx.btnLogin;
    }
  };

  // ── Fermeture + redirection intelligente après succès ─────
  function arcClosePopup(user) {
    const overlay = document.getElementById('arcAccessPopup');
    if (!overlay) return;
    overlay.style.transition = 'opacity .3s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
      arcRedirect(user);
    }, 300);
  }

  function arcRedirect(user) {
    if (!user) { window.location.reload(); return; }

    // Déterminer le préfixe selon la page courante
    const inPages = window.location.pathname.includes('/pages/');
    const base = inPages ? '' : 'pages/';

    // Redirection selon l'étape de l'utilisateur
    if (!user.trial_done) {
      window.location.href = base + 'essai-gratuit.html';
    } else if (!user.payment_confirmed) {
      window.location.href = base + 'forfaits.html';
    } else if (!user.qualification_done) {
      window.location.href = base + 'qualification.html';
    } else if (!user.all_modules_done) {
      window.location.href = base + 'formation.html';
    } else if (!user.final_test_passed) {
      window.location.href = base + 'test-final.html';
    } else {
      window.location.href = base + 'mon-certificat.html';
    }
  }

  function showErr(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
  }

})();
