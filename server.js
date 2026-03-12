const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = process.env.PORT || 3000;

// ── MongoDB ──
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neondefense';

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
});

// ── User Schema ──
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  displayName: { type: String },
  createdAt: { type: Date, default: Date.now },
  gameData: {
    gems: { type: Number, default: 0 },
    permUpgrades: {
      health: { type: Number, default: 0 },
      damage: { type: Number, default: 0 },
      regen: { type: Number, default: 0 },
      precision: { type: Number, default: 0 },
      fireRate: { type: Number, default: 0 },
    },
    levelProgress: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Habilidades desbloqueadas (array de ids: ['emp', ...])
    unlockedAbilities: { type: [String], default: [] },
    // Auto-save: estado de partida en curso
    sessionState: { type: mongoose.Schema.Types.Mixed, default: null },
  }
});

const User = mongoose.model('User', userSchema);

// ── Middleware ──
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'neon-defense-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 7 * 24 * 60 * 60, // 7 days
  }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === 'true',
    sameSite: 'lax',
  }
}));

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(passport.initialize());
app.use(passport.session());

// ── Passport: Local Strategy (acepta email o username) ──
passport.use(new LocalStrategy({ usernameField: 'identifier' }, async (identifier, password, done) => {
  try {
    const id = identifier.toLowerCase().trim();
    // Buscar por email o username
    const user = await User.findOne({
      $or: [{ email: id }, { username: id }]
    });
    if (!user) return done(null, false, { message: 'USER NOT FOUND' });
    if (!user.password) return done(null, false, { message: 'USE GOOGLE LOGIN' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return done(null, false, { message: 'WRONG PASSWORD' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// ── Passport: Google Strategy (optional) ──
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback';
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          displayName: profile.displayName || profile.emails?.[0]?.value || 'Player',
          email: profile.emails?.[0]?.value || '',
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  console.log('Google OAuth enabled');
} else {
  console.log('Google OAuth disabled (no GOOGLE_CLIENT_ID/SECRET)');
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ── Auth middleware ──
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'NOT AUTHENTICATED' });
}

// ── Static files (public) ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Auth Routes ──
app.post('/auth/register', async (req, res) => {
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

app.post('/auth/login', (req, res, next) => {
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

// Google OAuth routes (only if configured)
app.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(404).json({ error: 'GOOGLE LOGIN NOT CONFIGURED' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect('/login.html');
  }
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login.html?error=google_failed',
  })(req, res, next);
});

app.post('/auth/logout', (req, res) => {
  req.logout(() => {
    res.json({ ok: true });
  });
});

// ── API: Current user ──
app.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'NOT AUTHENTICATED' });
  }
  res.json({
    displayName: req.user.displayName,
    username: req.user.username || null,
    email: req.user.email || null,
    hasGoogle: !!req.user.googleId,
  });
});

// ── API: Check if Google OAuth is available ──
app.get('/api/auth-config', (req, res) => {
  res.json({
    googleEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
});

// ── API: Game Data ──
app.get('/api/gamedata', requireAuth, (req, res) => {
  const gd = req.user.gameData || {};
  res.json({
    gems: gd.gems || 0,
    permUpgrades: gd.permUpgrades || {},
    levelProgress: gd.levelProgress || {},
    unlockedAbilities: gd.unlockedAbilities || [],
  });
});

app.post('/api/gamedata', requireAuth, async (req, res) => {
  try {
    const { gems, permUpgrades, levelProgress } = req.body;
    const update = {};

    if (gems !== undefined) update['gameData.gems'] = gems;
    if (permUpgrades) {
      for (const key of ['health', 'damage', 'regen', 'precision', 'fireRate']) {
        if (permUpgrades[key] !== undefined) {
          update[`gameData.permUpgrades.${key}`] = permUpgrades[key];
        }
      }
    }
    if (levelProgress) {
      for (const key of Object.keys(levelProgress)) {
        update[`gameData.levelProgress.${key}`] = levelProgress[key];
      }
    }

    await User.findByIdAndUpdate(req.user._id, { $set: update });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'SAVE FAILED' });
  }
});

// ── API: Abilities ──
app.get('/api/abilities', requireAuth, (req, res) => {
  res.json({ unlockedAbilities: req.user.gameData?.unlockedAbilities || [] });
});

app.post('/api/abilities/unlock', requireAuth, async (req, res) => {
  try {
    const { abilityId, cost } = req.body;
    if (!abilityId || cost === undefined) {
      return res.status(400).json({ error: 'MISSING DATA' });
    }

    const user = await User.findById(req.user._id);
    const gems = user.gameData?.gems || 0;
    const unlocked = user.gameData?.unlockedAbilities || [];

    if (unlocked.includes(abilityId)) {
      return res.status(400).json({ error: 'ALREADY UNLOCKED' });
    }
    if (gems < cost) {
      return res.status(400).json({ error: 'NOT ENOUGH GEMS' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'gameData.gems': gems - cost },
      $push: { 'gameData.unlockedAbilities': abilityId },
    });

    res.json({ ok: true, gems: gems - cost });
  } catch (err) {
    res.status(500).json({ error: 'UNLOCK FAILED' });
  }
});

// ── API: Auto-save (estado de partida en curso) ──
app.post('/api/autosave', requireAuth, async (req, res) => {
  try {
    const { wave, score, gold, gems, hp, totalKills, level } = req.body;
    const sessionState = { wave, score, gold, gems, hp, totalKills, level, savedAt: Date.now() };
    const update = { 'gameData.sessionState': sessionState };

    // Tambien actualizar gems en el servidor
    if (gems !== undefined) {
      update['gameData.gems'] = gems;
    }

    await User.findByIdAndUpdate(req.user._id, { $set: update });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'AUTOSAVE FAILED' });
  }
});

app.get('/api/autosave', requireAuth, (req, res) => {
  const ss = req.user.gameData?.sessionState || null;
  res.json({ sessionState: ss });
});

app.delete('/api/autosave', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { 'gameData.sessionState': null } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'CLEAR FAILED' });
  }
});

// ── Fallback: SPA-like, serve index for non-file routes ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
