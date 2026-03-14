// ═══════════════════════════════════════════
//  login.js — Login/Register page logic
//  Depends on: shared/bg-animation.js
// ═══════════════════════════════════════════

// ── Check if already logged in ──
fetch('/api/me').then(r => {
  if (r.ok) window.location.href = '/';
});

// ── Check Google OAuth availability ──
fetch('/api/auth-config').then(r => r.json()).then(cfg => {
  if (cfg.googleEnabled) {
    document.getElementById('google-section').style.display = '';
    document.getElementById('google-btn').style.display = '';
  }
});

// ── Tab Switching ──
const tabs = document.querySelectorAll('.login-tab');
const forms = document.querySelectorAll('.login-form');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (typeof playSelectSound === 'function') playSelectSound();
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    forms.forEach(f => f.classList.toggle('active', f.dataset.tab === target));
    document.querySelectorAll('.form-error').forEach(e => e.textContent = '');
  });
});

// ── Login Form ──
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-pass').value;

  if (!identifier || !password) {
    errEl.textContent = 'FILL ALL FIELDS';
    if (typeof playDenySound === 'function') playDenySound();
    return;
  }

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (res.ok) {
      if (typeof playSelectSound === 'function') playSelectSound();
      setTimeout(() => { window.location.href = '/'; }, 300);
    } else {
      errEl.textContent = data.error || 'LOGIN FAILED';
      if (typeof playDenySound === 'function') playDenySound();
    }
  } catch (err) {
    errEl.textContent = 'CONNECTION ERROR';
    if (typeof playDenySound === 'function') playDenySound();
  }
});

// ── Register Form ──
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('register-error');
  errEl.textContent = '';

  const username = document.getElementById('reg-user').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-pass').value;
  const password2 = document.getElementById('reg-pass2').value;

  if (!username || !email || !password || !password2) {
    errEl.textContent = 'FILL ALL FIELDS';
    if (typeof playDenySound === 'function') playDenySound();
    return;
  }
  // Validar formato email en cliente
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errEl.textContent = 'INVALID EMAIL FORMAT';
    if (typeof playDenySound === 'function') playDenySound();
    return;
  }
  if (password !== password2) {
    errEl.textContent = 'PASSWORDS DO NOT MATCH';
    if (typeof playDenySound === 'function') playDenySound();
    return;
  }

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      if (typeof playSelectSound === 'function') playSelectSound();
      setTimeout(() => { window.location.href = '/'; }, 300);
    } else {
      errEl.textContent = data.error || 'REGISTER FAILED';
      if (typeof playDenySound === 'function') playDenySound();
    }
  } catch (err) {
    errEl.textContent = 'CONNECTION ERROR';
    if (typeof playDenySound === 'function') playDenySound();
  }
});

// ── Show URL error (from Google callback) ──
const urlErr = new URLSearchParams(window.location.search).get('error');
if (urlErr) {
  document.getElementById('login-error').textContent = urlErr.toUpperCase().replace(/_/g, ' ');
}
