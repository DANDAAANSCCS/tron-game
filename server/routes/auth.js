const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

// ── Register ──
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'ALL FIELDS REQUIRED' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'USERNAME MIN 3 CHARACTERS' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'PASSWORD MIN 4 CHARACTERS' });
    }
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'INVALID EMAIL FORMAT' });
    }

    const existsUser = await User.findOne({ username: username.toLowerCase() });
    if (existsUser) {
      return res.status(400).json({ error: 'USERNAME ALREADY EXISTS' });
    }
    const existsEmail = await User.findOne({ email: email.toLowerCase() });
    if (existsEmail) {
      return res.status(400).json({ error: 'EMAIL ALREADY REGISTERED' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      displayName: username,
      password: hash,
    });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'LOGIN FAILED' });
      return res.json({ ok: true, user: { displayName: user.displayName } });
    });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER ERROR' });
  }
});

// ── Login ──
router.post('/login', (req, res, next) => {
  // Aceptar 'identifier' (nuevo) o 'username' (legacy) para login
  if (req.body.username && !req.body.identifier) {
    req.body.identifier = req.body.username;
  }
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: 'SERVER ERROR' });
    if (!user) return res.status(401).json({ error: info?.message || 'LOGIN FAILED' });
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'SESSION ERROR' });
      return res.json({ ok: true, user: { displayName: user.displayName } });
    });
  })(req, res, next);
});

// ── Logout ──
router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ ok: true });
  });
});

// ── Google OAuth routes (only if configured) ──
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(404).json({ error: 'GOOGLE LOGIN NOT CONFIGURED' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect('/login.html');
  }
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login.html?error=google_failed',
  })(req, res, next);
});

module.exports = router;
