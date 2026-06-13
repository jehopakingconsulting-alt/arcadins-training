// ===== NAVBAR =====
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
document.addEventListener('click', e => {
  const nav = document.getElementById('navLinks');
  const ham = document.querySelector('.hamburger');
  if (nav && ham && !nav.contains(e.target) && !ham.contains(e.target)) {
    nav.classList.remove('open');
  }
});

// ===== MODAL AUTH =====
function openModal(tab) {
  document.getElementById('authModal').classList.add('active');
  switchTab(tab || 'login');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('authModal').classList.remove('active');
  document.body.style.overflow = '';
}
function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('active', tab === 'login');
  document.getElementById('registerForm').classList.toggle('active', tab === 'register');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
}
const authModal = document.getElementById('authModal');
if (authModal) authModal.addEventListener('click', function(e) { if (e.target === this) closeModal(); });

async function handleAuth(e, type) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ ...';

  try {
    if (type === 'login') {
      const email    = form.querySelector('input[type="email"]').value.trim();
      const password = form.querySelector('input[type="password"]').value;
      const res  = await fetch('/api/access/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('arc_token', data.token);
        localStorage.setItem('arc_user', JSON.stringify(data.user));
        closeModal();
        showToast('Connexion réussie ! Redirection...', 'success');
        setTimeout(() => {
          const u = data.user;
          const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
          if (!u.trial_done)              window.location.href = base + 'essai-gratuit.html';
          else if (!u.payment_confirmed)  window.location.href = base + 'forfaits.html';
          else if (!u.qualification_done) window.location.href = base + 'qualification.html';
          else                            window.location.href = base + 'formation.html';
        }, 1000);
      } else {
        btn.disabled = false; btn.innerHTML = origText;
        showToast(data.message || 'Email ou mot de passe incorrect.', 'error');
      }
    } else {
      // Pour l'inscription, on redirige vers le formulaire principal
      closeModal();
      const inPages = window.location.pathname.includes('/pages/');
      window.location.href = (inPages ? '../index.html' : 'index.html') + '#inscription';
    }
  } catch (err) {
    btn.disabled = false; btn.innerHTML = origText;
    showToast('Erreur réseau. Vérifiez votre connexion.', 'error');
  }
}

// ===== FAQ =====
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ===== FORMULAIRE INSCRIPTION =====
async function submitForm(e) {
  e.preventDefault();

  const nomComplet  = (document.getElementById('nom')?.value || '').trim();
  const email       = (document.getElementById('email')?.value || '').trim();
  const telephone   = (document.getElementById('tel')?.value || '').trim();
  const pays        = (document.getElementById('pays')?.value || '').trim();
  const lang        = (typeof currentLang !== 'undefined' ? currentLang : 'fr');

  // Split nom complet → prenom + nom
  const parts  = nomComplet.split(/\s+/);
  const prenom = parts[0] || nomComplet;
  const nom    = parts.slice(1).join(' ') || prenom;

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; }

  // Afficher le succès immédiatement (UX)
  document.getElementById('inscriptionForm').style.display = 'none';
  document.getElementById('formSuccess').style.display = 'block';
  showToast(t('toast.form'), 'success');

  // Appel API pour créer le compte en arrière-plan
  try {
    const res = await fetch('/api/access/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, telephone: telephone || '0000000000', pays: pays || 'Autre', lang, ref: localStorage.getItem('arc_ref') || null })
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('arc_token', data.token);
      localStorage.setItem('arc_user', JSON.stringify(data.user));
    }
  } catch (err) {
    // Pas bloquant : l'accès-popup gérera l'auth au chargement de forfaits.html
    console.warn('[submitForm] API call failed (offline?):', err.message);
  }

  // Redirection vers forfaits après 2.5 secondes
  setTimeout(() => {
    const inPages = window.location.pathname.includes('/pages/');
    const target  = inPages ? 'forfaits.html' : 'pages/forfaits.html';
    window.location.href = target + (email ? '?email=' + encodeURIComponent(email) : '');
  }, 2500);
}

// ===== SCROLL TO TOP =====
const scrollBtn = document.createElement('button');
scrollBtn.className = 'scroll-top';
scrollBtn.innerHTML = '↑';
scrollBtn.title = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'Back to top' : 'Retour en haut';
scrollBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
document.body.appendChild(scrollBtn);
window.addEventListener('scroll', () => {
  scrollBtn.classList.toggle('visible', window.scrollY > 400);
  updateReadingBar();
});

// ===== READING PROGRESS BAR =====
const readingBar = document.createElement('div');
readingBar.className = 'reading-bar';
document.body.prepend(readingBar);
function updateReadingBar() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  readingBar.style.width = pct + '%';
}

// ===== WHATSAPP FLOATING BUTTON =====
const isInPages = window.location.pathname.includes('/pages/');
const confidLink = isInPages ? 'confidentialite.html' : 'pages/confidentialite.html';
const inscLinkBase = isInPages ? '../index.html#inscription' : '#inscription';
const tarifLink = isInPages ? 'tarifs.html' : 'pages/tarifs.html';

const waHtml = `
<div class="wa-float" id="waFloat">
  <div class="wa-tooltip">
    <strong>Besoin d'aide ? 💬</strong>
    <p>Posez vos questions sur WhatsApp — réponse rapide !</p>
  </div>
  <a href="https://wa.me/15144513436?text=Bonjour%20ARCADINS%20Training%20Center%2C%20je%20souhaite%20des%20informations%20sur%20vos%20programmes%20de%20tutorat%20TEF%20Canada%20%2F%20TCF%20Canada." target="_blank" class="wa-btn" title="Contactez-nous sur WhatsApp">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  </a>
</div>`;
document.body.insertAdjacentHTML('beforeend', waHtml);

// ===== CHAT WIDGET =====
const chatHtml = `
<button class="chat-toggle-btn" id="chatToggle" onclick="toggleChat()" title="Chat FAQ ARCADINS" style="position:relative;">
  💬
  <span class="chat-notif" id="chatNotif">1</span>
</button>
<div class="chat-widget" id="chatWidget">
  <div class="chat-header">
    <div class="chat-agent">
      <div class="chat-avatar">AT</div>
      <div class="chat-agent-info">
        <strong id="chatAgentName">${t('chat.agent')}</strong>
        <span style="display:flex;align-items:center;gap:4px;font-size:.72rem;opacity:.85;margin-top:2px;">
          <span style="width:7px;height:7px;background:#4caf50;border-radius:50%;display:inline-block;"></span>
          <span id="chatOnlineStatus">${t('chat.online')}</span>
        </span>
      </div>
    </div>
    <button class="chat-close-btn" onclick="toggleChat()">✕</button>
  </div>
  <div class="chat-messages" id="chatMessages">
    <div class="msg msg-bot">
      <div class="msg-bubble" id="chatGreeting">${t('chat.greeting')}</div>
    </div>
  </div>
  <div class="chat-quick-btns" id="chatQuickBtns">
    <button class="quick-btn" onclick="quickReply('tef')">TEF Canada</button>
    <button class="quick-btn" onclick="quickReply('tcf')">TCF Canada</button>
    <button class="quick-btn" id="qbtnTarifs" onclick="quickReply('tarifs')">${t('chat.q.tarifs')}</button>
    <button class="quick-btn" id="qbtnInscription" onclick="quickReply('inscription')">${t('chat.q.inscription')}</button>
    <button class="quick-btn" onclick="quickReply('nclc')">NCLC</button>
    <button class="quick-btn" id="qbtnContact" onclick="quickReply('contact')">${t('chat.q.contact')}</button>
  </div>
  <div class="chat-input-row">
    <input class="chat-input" id="chatInput" placeholder="${t('chat.placeholder')}" onkeydown="if(event.key==='Enter')sendChat()" />
    <button class="chat-send" onclick="sendChat()">➤</button>
  </div>
</div>`;
document.body.insertAdjacentHTML('beforeend', chatHtml);

let chatOpen = false;
function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chatWidget').classList.toggle('open', chatOpen);
  const notif = document.getElementById('chatNotif');
  if (chatOpen && notif) notif.style.display = 'none';
}

// Réponses bilingues du chat
const chatAnswers = {
  tef: {
    fr: "Le <strong>TEF Canada</strong> est organisé par la CCIP (CCI Paris). Il évalue 4 compétences : Compréhension Orale, Compréhension Écrite, Expression Orale et Expression Écrite. Les résultats sont valides 2 ans et reconnus par IRCC pour Express Entry et la résidence permanente. 🍁",
    en: "The <strong>TEF Canada</strong> is organized by the CCIP (CCI Paris). It assesses 4 skills: Listening, Reading, Speaking and Writing. Results are valid for 2 years and recognized by IRCC for Express Entry and permanent residence. 🍁"
  },
  tcf: {
    fr: "Le <strong>TCF Canada</strong> est organisé par France Éducation international. Il est reconnu par IRCC (Canada) et le MIFI (Québec). Il comprend 5 épreuves dont la Maîtrise des Structures de la Langue (MSL). Idéal pour le PEQ et Express Entry. 🇨🇦",
    en: "The <strong>TCF Canada</strong> is organized by France Éducation international. It is recognized by IRCC (Canada) and MIFI (Quebec). It includes 5 components including Language Structure Mastery (MSL). Ideal for PEQ and Express Entry. 🇨🇦"
  },
  tarifs: {
    fr: "Nous proposons 4 plans :<br>• <strong>Découverte : Inclus dans votre inscription<br>• <strong>Standard</strong> : 149€<br>• <strong>Premium</strong> : 249€ ⭐<br>• <strong>VIP</strong> : 399€ avec coaching<br><a href='" + tarifLink + "' style='color:var(--gold)'>Voir les détails →</a>",
    en: "We offer 4 plans:<br>• <strong>Discovery</strong>: Free<br>• <strong>Standard</strong>: €149<br>• <strong>Premium</strong>: €249 ⭐<br>• <strong>VIP</strong>: €399 with coaching<br><a href='" + tarifLink + "' style='color:var(--gold)'>See details →</a>"
  },
  inscription: {
    fr: "Pour vous inscrire, remplissez notre formulaire en bas de la page d'accueil. Notre équipe vous contactera sous 24h pour activer votre compte. 📧 Vous pouvez aussi nous appeler au <strong>514-451-3436</strong>.",
    en: "To register, fill out our form at the bottom of the home page. Our team will contact you within 24h to activate your account. 📧 You can also call us at <strong>514-451-3436</strong>."
  },
  nclc: {
    fr: "Le <strong>NCLC</strong> (Niveaux de Compétence Linguistique Canadiens) est la grille officielle d'évaluation du français pour IRCC. Pour Express Entry : NCLC 7 vous donne des points, NCLC 9+ maximise votre CRS. Nos programmes de tutorat ciblent NCLC 7 à 9+.",
    en: "The <strong>CLB</strong> (Canadian Language Benchmarks) is the official French proficiency scale for IRCC. For Express Entry: CLB 7 earns you points, CLB 9+ maximizes your CRS score. Our tutoring programs target CLB 7 to 9+."
  },
  contact: {
    fr: "Vous pouvez nous joindre par :<br>📧 <strong>info@arcadins-training.com</strong><br>📧 <strong>contact@arcadins-training.com</strong><br>📞 <strong>514-451-3436</strong><br>💬 WhatsApp : <strong>514-451-3436</strong><br>📍 116, Rue Albert, Ottawa, Ontario",
    en: "You can reach us at:<br>📧 <strong>info@arcadins-training.com</strong><br>📧 <strong>contact@arcadins-training.com</strong><br>📞 <strong>514-451-3436</strong><br>💬 WhatsApp: <strong>514-451-3436</strong><br>📍 116 Albert Street, Ottawa, Ontario"
  }
};

function getChatAnswer(key) {
  const a = chatAnswers[key];
  if (!a) return t('chat.fallback');
  return a[currentLang] || a['fr'];
}

function quickReply(key) {
  const labels = {
    tef: 'TEF Canada', tcf: 'TCF Canada',
    tarifs:      currentLang === 'en' ? 'What are the prices?'     : 'Quels sont les tarifs ?',
    inscription: currentLang === 'en' ? 'How do I register?'       : 'Comment m\'inscrire ?',
    nclc:        currentLang === 'en' ? 'What is the CLB/NCLC?'    : 'C\'est quoi le NCLC ?',
    contact:     currentLang === 'en' ? 'How can I contact you?'   : 'Comment vous contacter ?'
  };
  addChatMsg(labels[key] || key, 'user');
  setTimeout(() => addChatMsg(getChatAnswer(key), 'bot'), 600);
  document.getElementById('chatQuickBtns').style.display = 'none';
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  addChatMsg(msg, 'user');
  input.value = '';
  const lower = msg.toLowerCase();
  let reply = t('chat.fallback');
  if (lower.includes('tef')) reply = getChatAnswer('tef');
  else if (lower.includes('tcf')) reply = getChatAnswer('tcf');
  else if (lower.includes('tarif') || lower.includes('prix') || lower.includes('price') || lower.includes('cost') || lower.includes('combien') || lower.includes('coute') || lower.includes('plan')) reply = getChatAnswer('tarifs');
  else if (lower.includes('inscri') || lower.includes('creer') || lower.includes('compte') || lower.includes('register') || lower.includes('sign up')) reply = getChatAnswer('inscription');
  else if (lower.includes('nclc') || lower.includes('clb') || lower.includes('niveau') || lower.includes('level') || lower.includes('score')) reply = getChatAnswer('nclc');
  else if (lower.includes('contact') || lower.includes('email') || lower.includes('telephone') || lower.includes('phone') || lower.includes('appel') || lower.includes('call')) reply = getChatAnswer('contact');
  else if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello') || lower.includes('hi ') || lower === 'hi') reply = t('chat.hello');
  else if (lower.includes('merci') || lower.includes('thank')) reply = t('chat.merci');
  setTimeout(() => addChatMsg(reply, 'bot'), 700);
}

function addChatMsg(text, type) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `msg msg-${type}`;
  div.innerHTML = `<div class="msg-bubble">${text}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ===== COOKIE BANNER =====
if (!localStorage.getItem('arc_cookies')) {
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.id = 'cookieBanner';
  banner.innerHTML = `
    <p>${t('cookie.text')} <a href="${confidLink}">${t('cookie.learn')}</a></p>
    <div class="cookie-btns">
      <button class="btn-cookie-accept" onclick="acceptCookies()">${t('cookie.accept')}</button>
      <button class="btn-cookie-decline" onclick="declineCookies()">${t('cookie.decline')}</button>
    </div>`;
  document.body.appendChild(banner);
  setTimeout(() => banner.classList.add('show'), 1200);
}
function acceptCookies() {
  localStorage.setItem('arc_cookies', 'accepted');
  hideCookieBanner();
}
function declineCookies() {
  localStorage.setItem('arc_cookies', 'declined');
  hideCookieBanner();
}
function hideCookieBanner() {
  const b = document.getElementById('cookieBanner');
  if (b) { b.classList.remove('show'); setTimeout(() => b.remove(), 400); }
}

// ===== WELCOME POPUP (1ère visite) =====
const testsLink = isInPages ? 'tests.html' : 'pages/tests.html';
if (!sessionStorage.getItem('arc_visited')) {
  sessionStorage.setItem('arc_visited', '1');
  setTimeout(() => {
    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay active';
    overlay.id = 'welcomeOverlay';
    overlay.innerHTML = `
      <div class="welcome-popup">
        <button class="welcome-close" onclick="closeWelcome()">✕</button>
        <div class="welcome-header">
          <div class="offer-badge">${t('popup.badge')}</div>
          <h2>${t('popup.h2')}</h2>
          <p>${t('popup.p')}</p>
        </div>
        <div class="welcome-body">
          <ul class="welcome-perks">
            <li>${t('popup.perk1')}</li>
            <li>${t('popup.perk2')}</li>
            <li>${t('popup.perk3')}</li>
            <li>${t('popup.perk4')}</li>
          </ul>
          <a href="${testsLink}" onclick="closeWelcome()" class="btn-primary" style="display:block;text-align:center;font-size:1rem;padding:15px;">
            ${t('popup.btn')}
          </a>
          <p style="text-align:center;font-size:.78rem;color:var(--gray-text);margin-top:12px;">
            <span id="popupOr">${t('popup.or')}</span> <a href="${inscLinkBase}" onclick="closeWelcome()" class="popup-or-link" style="color:var(--blue);">${t('popup.link')}</a>
          </p>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeWelcome(); });
  }, 3000);
}
function closeWelcome() {
  const o = document.getElementById('welcomeOverlay');
  if (o) { o.classList.remove('active'); setTimeout(() => o.remove(), 300); }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(msg, type = 'info') {
  const colors = { success: '#2e7d32', error: '#c62828', info: '#0B5D3B', warning: '#f57f17' };
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;top:24px;right:24px;z-index:99999;background:${colors[type]};color:white;padding:14px 20px;border-radius:10px;font-size:.88rem;font-weight:600;box-shadow:0 4px 24px rgba(0,0,0,.2);max-width:340px;animation:popIn .3s ease;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-10px)'; toast.style.transition = '.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ===== NOTIFICATION BAR =====
if (!sessionStorage.getItem('arc_notif_closed')) {
  const nav = document.querySelector('nav');
  if (nav) {
    const bar = document.createElement('div');
    bar.className = 'notif-bar';
    bar.id = 'notifBar';
    bar.innerHTML = `
      <span class="notif-bar-count">${t('notif.badge')}</span>
      ${t('notif.text')}
      <a href="${inscLinkBase}">${t('notif.cta')}</a>
      <button class="notif-bar-close" onclick="closeNotifBar()">✕</button>`;
    nav.insertAdjacentElement('beforebegin', bar);
  }
}
function closeNotifBar() {
  sessionStorage.setItem('arc_notif_closed', '1');
  const b = document.getElementById('notifBar');
  if (b) { b.style.display = 'none'; }
}

// ===== ANIMATIONS SCROLL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .formation-card, .test-card, .pricing-card, .testi-card, .blog-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ===== NEWSLETTER =====
function submitNewsletter(e) {
  e.preventDefault();
  const email = document.getElementById('nlEmail');
  if (email) email.value = '';
  const ok = document.getElementById('nlSuccess');
  if (ok) ok.style.display = 'block';
  showToast(t('toast.newsletter'), 'success');
}

// ===== COPYRIGHT ANNÉE DYNAMIQUE =====
const yearEl = document.getElementById('footerYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== COMPTEUR LIVE ÉTUDIANT (simulation) =====
function animateCounter() {
  const el = document.getElementById('liveCount');
  if (!el) return;
  const base = 2400;
  const rand = Math.floor(Math.random() * 30) + 5;
  el.textContent = (base + rand).toLocaleString();
}
animateCounter();
setInterval(animateCounter, 8000);

// ===== RE-APPLY TRANSLATIONS AFTER DYNAMIC ELEMENTS ARE CREATED =====
setTimeout(() => {
  if (typeof applyTranslations === 'function') applyTranslations();
}, 150);
