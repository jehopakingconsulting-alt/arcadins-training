// ============================================================
// ARCADINS Training Center — API Client
// Wrapper autour de fetch pour communiquer avec le backend
// ============================================================

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
  complete: (num) => apiFetch(`/modules/${num}/complete`, { method: 'POST' })
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
  submitTest: (score) => apiFetch('/tuteur/test/submit', { method: 'POST', body: JSON.stringify({ score }) })
};

// ---- Helper: get base path (root vs pages/) ----
function getBasePath() {
  return window.location.pathname.includes('/pages/') ? '../' : '';
}
