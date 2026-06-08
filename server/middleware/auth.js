'use strict';

const jwt = require('jsonwebtoken');
const { getDb } = require('../database');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Also accept token as query param (for file download links)
  const queryToken = req.query.token;
  if (!authHeader && !queryToken) {
    return res.status(401).json({ success: false, message: 'Token manquant ou invalide.' });
  }
  const token = queryToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token manquant ou invalide.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme_super_secret_jwt_key_arcadins_2024');
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
  }
}

module.exports = authMiddleware;
