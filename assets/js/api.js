// ============================================================
// ARCADINS Training Center — API Client
// Wrapper autour de fetch pour communiquer avec le backend
// ============================================================

// ---- Anti-clonage / propriété intellectuelle ----
// Cette plateforme et son code source sont la propriété exclusive d'ARCADINS
// Training Center. Toute copie, reproduction ou réutilisation non autorisée
// de cette application ou de son API est interdite.
(function () {
  try {
    console.log('%c⚠️ ARCADINS Training Center', 'color:#1565c0;font-size:16px;font-weight:bold;');
    console.log('%cCette application et son API sont la propriété exclusive d\'ARCADINS Training Center. Toute copie ou reproduction non autorisée est interdite et fera l\'objet de poursuites.', 'color:#666;font-size:12px;');
    if (!document.querySelector('meta[name="copyright"]')) {
      const meta = document.createElement('meta');
      meta.name = 'copyright';
      meta.content = `© ${new Date().getFullYear()} ARCADINS Training Center — Tous droits réservés`;
      document.head.appendChild(meta);
    }
  } catch (e) {}
})();

// API_BASE : défini par config.js (auto-détection localhost/production)
const API_BASE = window.ARCADINS_API_BASE || (
  ['localhost','127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3000/api'
    : window.location.origin + '/api'
);

// ---- Token management ----
function getToken() { return localStorage.getItem('arc_token'); }
function setToken(t) { localStorage.setItem('arc_token', t); }
function clearToken() { localStorage.removeItem('arc_token'); localStorage.removeItem('arc_user'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('arc_user') || 'null'); }
  catch { return null; }
}
function setUser(u) { localStorage.setItem('arc_user', JSON.stringify(u)); }

// ---- Core fetch ----
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(API_BASE + path, { ...options, headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  } catch (e) {
    if (e.message === 'Failed to fetch') throw new Error('Serveur inaccessible. Vérifiez que le serveur ARCADINS tourne sur le port 3000.');
    throw e;
  }
}

// ---- Auth API ----
const AuthAPI = {
  async register(data) {
    const res = await apiFetch('/access/register', { method: 'POST', body: JSON.stringify(data) });
    if (res.token) { setToken(res.token); setUser(res.user); }
    return res;
  },
  async login(email, password) {
    const res = await apiFetch('/access/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res.token) { setToken(res.token); setUser(res.user); }
    return res;
  },
  async me() {
    const res = await apiFetch('/access/me');
    if (res.user) setUser(res.user);
    return res;
  },
  async updateProfile(data) {
    const res = await apiFetch('/access/profile', { method: 'PUT', body: JSON.stringify(data) });
    if (res.user) setUser(res.user);
    return res;
  },
  changePassword: (currentPassword, newPassword) => apiFetch('/access/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
  logout() { clearToken(); window.location.href = getBasePath() + 'pages/acces.html'; }
};

// ---- Trial API ----
const TrialAPI = {
  questions: () => apiFetch('/trial/questions'),
  submit: (answers) => apiFetch('/trial/submit', { method: 'POST', body: JSON.stringify({ answers }) })
};

// ---- Plans API ----
const PlansAPI = {
  list: () => apiFetch('/plans'),
  checkout: (plan) => apiFetch('/plans/checkout', { method: 'POST', body: JSON.stringify({ plan }) })
};

// ---- Qualification API ----
const QualAPI = {
  questions: () => apiFetch('/qualification/questions'),
  submit: (answers) => apiFetch('/qualification/submit', { method: 'POST', body: JSON.stringify({ answers }) })
};

// ---- Modules API ----
const ModulesAPI = {
  status: () => apiFetch('/modules/status'),
  start: (num) => apiFetch(`/modules/${num}/start`, { method: 'POST' }),
  complete: (num) => apiFetch(`/modules/${num}/complete`, { method: 'POST' }),
  getTest: (num) => apiFetch(`/modules/${num}/test`),
  submitTest: (num, answers) => apiFetch(`/modules/${num}/test/submit`, { method: 'POST', body: JSON.stringify({ answers }) })
};

// ---- Final Test API ----
const FinalAPI = {
  questions: () => apiFetch('/final-test/questions'),
  submit: (answers) => apiFetch('/final-test/submit', { method: 'POST', body: JSON.stringify({ answers }) })
};

// ---- Certificate API ----
const CertAPI = {
  my: () => apiFetch('/certificate/my'),
  downloadUrl: () => API_BASE + '/certificate/download?token=' + getToken(),
  verify: (id) => apiFetch(`/certificate/verify/${id}`)
};

// ---- Affiliate API ----
const AffiliateAPI = {
  me: () => apiFetch('/affiliate/me')
};

// ---- Admin API ----
const AdminAPI = {
  stats: () => apiFetch('/admin/stats'),
  users: (filters = '') => apiFetch('/admin/users' + (filters ? '?' + filters : '')),
  user: (id) => apiFetch(`/admin/users/${id}`),
  updateUser: (id, data) => apiFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  prospects: () => apiFetch('/admin/prospects'),
  tests: () => apiFetch('/admin/tests'),
  certificates: () => apiFetch('/admin/certificates'),
  exportCsv: () => API_BASE + '/admin/export/csv?token=' + getToken(),
  settings: (data) => apiFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  sendEmail: (id, subj, body) => apiFetch(`/admin/users/${id}/email`, { method: 'POST', body: JSON.stringify({ subject: subj, body }) }),
  moduleStats: () => apiFetch('/admin/module-stats'),
  affiliates: () => apiFetch('/admin/affiliates'),
  updateAffiliate: (id, status) => apiFetch(`/admin/affiliates/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
};

// ---- Tuteur API ----
const TuteurAPI = {
  async postuler(data) {
    const res = await apiFetch('/tuteur/postuler', { method: 'POST', body: JSON.stringify(data) });
    if (res.token) { setToken(res.token); setUser(res.user); }
    return res;
  },
  createCheckout: () => apiFetch('/tuteur/create-checkout-session', { method: 'POST' }),
  verifyPayment: (sessionId) => apiFetch(`/tuteur/verify-payment?session_id=${encodeURIComponent(sessionId)}`),
  modules: () => apiFetch('/tuteur/modules'),
  completeModule: (num) => apiFetch(`/tuteur/modules/${num}/complete`, { method: 'POST' }),
  startTest: () => apiFetch('/tuteur/test/start'),
  submitTest: (answers) => apiFetch('/tuteur/test/submit', { method: 'POST', body: JSON.stringify({ answers }) })
};

// ---- Helper: get base path (root vs pages/) ----
function getBasePath() {
  return window.location.pathname.includes('/pages/') ? '../' : '';
}

// ---- Password visibility toggle (for pages without main.js) ----
if (typeof initPasswordToggles === 'undefined') {
  window.initPasswordToggles = function() {
    const EYE_OPEN  = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const EYE_CLOSE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    document.querySelectorAll('input[type="password"]').forEach(input => {
      if (input.closest('.pw-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'pw-wrap';
      const inlineStyle = input.getAttribute('style') || '';
      input.removeAttribute('style');
      if (inlineStyle) wrap.setAttribute('style', inlineStyle);
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pw-eye';
      btn.setAttribute('aria-label', 'Afficher/masquer le mot de passe');
      btn.innerHTML = EYE_OPEN;
      btn.addEventListener('click', () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = show ? EYE_CLOSE : EYE_OPEN;
      });
      wrap.appendChild(btn);
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordToggles);
  } else {
    initPasswordToggles();
  }
  document.addEventListener('click', () => setTimeout(initPasswordToggles, 100));
}
