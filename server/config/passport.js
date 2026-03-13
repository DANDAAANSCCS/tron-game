const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ── Local Strategy (accepts email or username) ──
passport.use(new LocalStrategy({ usernameField: 'identifier' }, async (identifier, password, done) => {
  try {
    const id = identifier.toLowerCase().trim();
    // Search by email or username
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

// ── Google Strategy (optional) ──
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

module.exports = passport;
