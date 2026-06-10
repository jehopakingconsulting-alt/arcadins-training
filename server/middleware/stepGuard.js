'use strict';

/**
 * stepGuard(step) — returns middleware that checks the user has completed required steps.
 * Steps in order:
 *   'prospect'            - user exists (always true if auth passed)
 *   'trial_done'          - user.trial_done = 1
 *   'payment_confirmed'   - user.payment_confirmed = 1
 *   'qualification_done'  - user.qualification_done = 1
 *   'modules_done'        - user.all_modules_done = 1
 *   'final_passed'        - user.final_test_passed = 1
 */

const STEP_CHECKS = {
  prospect: (user) => !!user,
  trial_done: (user) => user.trial_done === 1,
  payment_confirmed: (user) => user.payment_confirmed === 1,
  qualification_done: (user) => user.qualification_done === 1,
  modules_done: (user) => user.all_modules_done === 1,
  final_passed: (user) => user.final_test_passed === 1,
};

const STEP_MESSAGES = {
  prospect: 'Vous devez être inscrit.',
  trial_done: 'Vous devez compléter le test de positionnement.',
  payment_confirmed: 'Vous devez confirmer votre paiement.',
  qualification_done: 'Vous devez compléter le test de qualification.',
  modules_done: 'Vous devez compléter tous les modules de formation.',
  final_passed: 'Vous devez réussir le test final.',
};

// Étapes qui supposent un paiement confirmé : on y vérifie aussi l'expiration de l'accès.
// Note : 'final_passed' (certificat) n'est pas inclus — un certificat déjà obtenu
// reste accessible même après l'expiration de la période d'accès au contenu.
const STEPS_REQUIRING_ACTIVE_ACCESS = new Set([
  'payment_confirmed',
  'qualification_done',
  'modules_done',
]);

// Retourne true si l'accès payant de l'utilisateur est expiré (forfait arrivé à échéance)
function isAccessExpired(user) {
  if (user.payment_confirmed !== 1) return false;
  if (!user.access_expires_at) return false;
  const expiry = new Date(user.access_expires_at);
  if (isNaN(expiry.getTime())) return false;
  return expiry.getTime() < Date.now();
}

function stepGuard(step) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié.' });
    }
    const check = STEP_CHECKS[step];
    if (!check) {
      return res.status(500).json({ success: false, message: `Étape inconnue: ${step}` });
    }
    if (!check(req.user)) {
      return res.status(403).json({
        success: false,
        message: STEP_MESSAGES[step] || 'Accès refusé.',
        required_step: step,
      });
    }
    if (STEPS_REQUIRING_ACTIVE_ACCESS.has(step) && isAccessExpired(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Votre accès a expiré. Veuillez renouveler votre forfait pour continuer.',
        required_step: 'access_expired',
        expired: true,
        access_expires_at: req.user.access_expires_at,
      });
    }
    next();
  };
}

module.exports = stepGuard;
module.exports.isAccessExpired = isAccessExpired;
