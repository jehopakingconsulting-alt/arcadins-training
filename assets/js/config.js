// ============================================================
// ARCADINS Training Center — Configuration API
// Modifiez API_BASE pour pointer vers votre backend en production
// ============================================================

(function () {
  // Le serveur Express sert AUSSI le frontend (déploiement unique sur Render).
  // Donc l'API est toujours accessible via un chemin RELATIF "/api" sur le
  // même domaine — que ce soit en local (localhost:3000) ou en production
  // (ex: https://arcadins-training.onrender.com).
  //
  // Exception : si vous hébergez le frontend séparément (ex: Netlify) sans
  // y déployer le backend, définissez ARCADINS_REMOTE_API_BASE ci-dessous.
  const REMOTE_API_BASE = ''; // ex: 'https://arcadins-training.onrender.com/api'

  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const sameOriginApi = window.location.origin + '/api';

  window.ARCADINS_API_BASE = isLocal
    ? 'http://localhost:3000/api'
    : (REMOTE_API_BASE || sameOriginApi);

  // Exposé aussi comme constante simple pour les scripts inline
  window.API_BASE_URL = window.ARCADINS_API_BASE;
})();
