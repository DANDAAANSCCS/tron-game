// ── Background Grid Animation ──
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const gridSize = 60;
let offset = 0;

const trails = [];
const TRAIL_COUNT = 4;
const TRAIL_COLORS = ['#00fff2', '#ff6600', '#0044ff', '#ff0055'];

function createTrail(index) {
  const horizontal = Math.random() > 0.5;
  return {
    x: horizontal ? -100 : Math.random() * canvas.width,
    y: horizontal ? Math.random() * canvas.height : -100,
    speed: 1.5 + Math.random() * 2,
    horizontal,
    color: TRAIL_COLORS[index % TRAIL_COLORS.length],
    length: 80 + Math.random() * 120,
    alpha: 0.3 + Math.random() * 0.4
  };
}
for (let i = 0; i < TRAIL_COUNT; i++) trails.push(createTrail(i));

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width*0.7);
  grad.addColorStop(0, '#0d1117');
  grad.addColorStop(1, '#050508');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(0, 255, 242, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  const so = offset % gridSize;
  for (let y = -gridSize + so; y <= canvas.height + gridSize; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0, 255, 242, 0.08)';
  for (let x = 0; x <= canvas.width; x += gridSize) {
    for (let y = -gridSize + so; y <= canvas.height + gridSize; y += gridSize) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill(); }
  }
  offset += 0.3;
}
function drawTrails() {
  trails.forEach((t, i) => {
    if (t.horizontal) { t.x += t.speed; if (t.x > canvas.width + t.length) trails[i] = createTrail(i); }
    else { t.y += t.speed; if (t.y > canvas.height + t.length) trails[i] = createTrail(i); }
    const g = t.horizontal ? ctx.createLinearGradient(t.x-t.length, t.y, t.x, t.y) : ctx.createLinearGradient(t.x, t.y-t.length, t.x, t.y);
    g.addColorStop(0, 'transparent'); g.addColorStop(1, t.color);
    ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.globalAlpha = t.alpha;
    ctx.beginPath();
    if (t.horizontal) { ctx.moveTo(t.x-t.length, t.y); ctx.lineTo(t.x, t.y); }
    else { ctx.moveTo(t.x, t.y-t.length); ctx.lineTo(t.x, t.y); }
    ctx.stroke();
    ctx.shadowColor = t.color; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(t.x, t.y, 2, 0, Math.PI*2); ctx.fillStyle = t.color; ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  });
}
function animateBg() { drawGrid(); drawTrails(); requestAnimationFrame(animateBg); }
animateBg();

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
      window.location.href = '/';
    } else {
      errEl.textContent = data.error || 'LOGIN FAILED';
    }
  } catch (err) {
    errEl.textContent = 'CONNECTION ERROR';
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
    return;
  }
  // Validar formato email en cliente
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errEl.textContent = 'INVALID EMAIL FORMAT';
    return;
  }
  if (password !== password2) {
    errEl.textContent = 'PASSWORDS DO NOT MATCH';
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
      window.location.href = '/';
    } else {
      errEl.textContent = data.error || 'REGISTER FAILED';
    }
  } catch (err) {
    errEl.textContent = 'CONNECTION ERROR';
  }
});

// ── Show URL error (from Google callback) ──
const urlErr = new URLSearchParams(window.location.search).get('error');
if (urlErr) {
  document.getElementById('login-error').textContent = urlErr.toUpperCase().replace(/_/g, ' ');
}
