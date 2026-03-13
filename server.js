const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const mongoose = require('mongoose');
const passport = require('passport');

const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS for Android app (Capacitor) ──
const ALLOWED_ORIGINS = [
  'https://localhost',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3000',
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (same-origin, mobile apps, curl)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now — tighten in production
    }
  },
  credentials: true,
}));

// ── MongoDB ──
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neondefense';

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
});

// ── Middleware ──
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('trust proxy', 1);

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
    secure: true,
    sameSite: 'none',
  }
}));

// ── Passport ──
require('./server/config/passport');
app.use(passport.initialize());
app.use(passport.session());

// ── Static files ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ──
// Auth routes mounted at /auth; /api/me and /api/auth-config mounted at root
app.use('/auth', require('./server/routes/auth'));
app.use('/api', require('./server/routes/api'));

// ── Fallback: serve index for root ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
