// ============================================================
// ARCADINS Training Center — Route Guard
// Protège chaque page selon l'étape du parcours utilisateur
// ============================================================

// Map: page → étape requise minimum
const PAGE_REQUIREMENTS = {
  'essai-gratuit.html':    'registered',
  'forfaits.html':         'trial_done',
  'qualification.html':    'payment_confirmed',
  'formation.html':        'qualification_done',
  'test-final.html':       'modules_done',
  'mon-certificat.html':   'final_passed',
  'espace-membre.html':    'registered',
  'admin':                 'admin'
};

// Redirect map: si user est plus avancé, où le renvoyer
const STEP_REDIRECTS = {
  registered:        'pages/essai-gratuit.html',
  trial_done:        'pages/forfaits.html',
  payment_confirmed: 'pages/qualification.html',
  qualification_done:'pages/formation.html',
  modules_done:      'pages/test-final.html',
  final_passed:      'pages/mon-certificat.html',
  admin:             'pages/admin/index.html'
};

// Calcul du step courant de l'utilisateur
function getUserStep(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'admin';
  if (user.final_test_passed) return 'final_passed';
  if (user.all_modules_done) return 'modules_done';
  if (user.qualification_done) return 'qualification_done';
  if (user.payment_confirmed) return 'payment_confirmed';
  if (user.trial_done) return 'trial_done';
  return 'registered';
}

// Ordre des étapes
const STEP_ORDER = ['registered', 'trial_done', 'payment_confirmed', 'qualification_done', 'modules_done', 'final_passed'];

function stepIndex(s) { return STEP_ORDER.indexOf(s); }

// ---- Point d'entrée principal ----
async function initAuthGuard() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isAdminPage = window.location.pathname.includes('/admin/');
  const isAccessPage = currentPage === 'acces.html';
  const isVerifyPage = currentPage === 'verifier-certificat.html';

  // Pages publiques sans restriction
  if (isAccessPage || isVerifyPage || currentPage === 'conditions.html' ||
      currentPage === 'confidentialite.html' || currentPage === 'mentions-legales.html') {
    // Accessible sans auth
    _setupNavUI();
    return;
  }

  // Vérifier token en mémoire
  const token = getToken();
  if (!token) {
    _redirectToAccess();
    return;
  }

  // Vérifier avec le serveur
  let user;
  try {
    const res = await AuthAPI.me();
    user = res.user;
  } catch (e) {
    // Serveur hors ligne : mode dégradé (permet navigation côté demo)
    console.warn('[AuthGuard] Server unreachable, offline mode');
    user = getUser();
    if (!user) { _redirectToAccess(); return; }
  }

  const userStep = getUserStep(user);

  // Page admin
  if (isAdminPage && user.role !== 'admin') {
    window.location.href = getBasePath() + STEP_REDIRECTS[userStep] || 'pages/espace-membre.html';
    return;
  }

  // Vérifier la page actuelle
  const requirement = PAGE_REQUIREMENTS[currentPage];
  if (requirement) {
    if (requirement === 'admin' && user.role !== 'admin') {
      window.location.href = getBasePath() + 'pages/espace-membre.html';
      return;
    }
    const reqIdx = stepIndex(requirement);
    const userIdx = stepIndex(userStep);
    if (userIdx < reqIdx) {
      // Pas encore à cette étape → rediriger vers l'étape actuelle
      const dest = getBasePath() + STEP_REDIRECTS[userStep];
      if (dest) { window.location.href = dest; return; }
    }
  }

  // Index.html : si l'utilisateur a déjà un token, le rediriger vers son espace
  if ((currentPage === 'index.html' || currentPage === '') && user) {
    // Ne pas rediriger depuis la page d'accueil — laisser voir le site
  }

  _setupNavUI(user);
  _updateUserDisplay(user);
}

function _redirectToAccess() {
  const base = getBasePath();
  if (!window.location.pathname.endsWith('acces.html')) {
    window.location.href = base + 'pages/acces.html';
  }
}

function _setupNavUI(user) {
  // Mettre à jour le bouton langToggle si présent
  const lt = document.getElementById('langToggle');
  if (lt && typeof currentLang !== 'undefined') {
    lt.textContent = currentLang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR';
  }

  // Afficher / cacher liens selon connexion
  const loginBtns = document.querySelectorAll('.btn-login');
  const memberLinks = document.querySelectorAll('[data-auth-only]');
  if (user) {
    loginBtns.forEach(b => {
      b.textContent = user.prenom || user.nom || 'Mon compte';
      b.href = getBasePath() + 'pages/espace-membre.html';
      b.onclick = null;
    });
    memberLinks.forEach(el => el.style.display = '');
  }
}

function _updateUserDisplay(user) {
  const nameEl = document.getElementById('userDisplayName');
  if (nameEl && user) nameEl.textContent = (user.prenom || '') + ' ' + (user.nom || '');
  const stepEl = document.getElementById('userStepDisplay');
  if (stepEl && user) {
    const step = getUserStep(user);
    const labels = {
      fr: { registered:'Essai gratuit', trial_done:'Choix du forfait', payment_confirmed:'Test de qualification', qualification_done:'Formation en cours', modules_done:'Test final', final_passed:'Certifié ✅', admin:'Administrateur' },
      en: { registered:'Free Trial', trial_done:'Plan Selection', payment_confirmed:'Qualification Test', qualification_done:'Training in progress', modules_done:'Final Test', final_passed:'Certified ✅', admin:'Administrator' }
    };
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'fr';
    stepEl.textContent = labels[lang][step] || step;
  }
}

// ---- Auto-init ----
document.addEventListener('DOMContentLoaded', initAuthGuard);
