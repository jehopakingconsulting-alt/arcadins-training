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
    next();
  };
}

module.exports = stepGuard;
