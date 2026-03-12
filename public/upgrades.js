// ── Background Grid Animation (same as menu) ──
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
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  grad.addColorStop(0, '#0d1117');
  grad.addColorStop(1, '#050508');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0, 255, 242, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  const scrollOffset = offset % gridSize;
  for (let y = -gridSize + scrollOffset; y <= canvas.height + gridSize; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0, 255, 242, 0.08)';
  for (let x = 0; x <= canvas.width; x += gridSize) {
    for (let y = -gridSize + scrollOffset; y <= canvas.height + gridSize; y += gridSize) {
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  offset += 0.3;
}

function drawTrails() {
  trails.forEach((trail, i) => {
    if (trail.horizontal) {
      trail.x += trail.speed;
      if (trail.x > canvas.width + trail.length) trails[i] = createTrail(i);
    } else {
      trail.y += trail.speed;
      if (trail.y > canvas.height + trail.length) trails[i] = createTrail(i);
    }
    const gradient = trail.horizontal
      ? ctx.createLinearGradient(trail.x - trail.length, trail.y, trail.x, trail.y)
      : ctx.createLinearGradient(trail.x, trail.y - trail.length, trail.x, trail.y);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, trail.color);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.globalAlpha = trail.alpha;
    ctx.beginPath();
    if (trail.horizontal) { ctx.moveTo(trail.x - trail.length, trail.y); ctx.lineTo(trail.x, trail.y); }
    else { ctx.moveTo(trail.x, trail.y - trail.length); ctx.lineTo(trail.x, trail.y); }
    ctx.stroke();
    ctx.shadowColor = trail.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(trail.x, trail.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = trail.color;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });
}

function animateBg() {
  drawGrid();
  drawTrails();
  requestAnimationFrame(animateBg);
}
animateBg();

// ── Audio ──
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playHoverSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function playSelectSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

function playBuySound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
  osc.start(); osc.stop(audioCtx.currentTime + 0.25);
}

function playDenySound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

// ── Gem Icon (draw on small canvas for HUD) ──
function drawGemIcon(cvs) {
  const c = cvs.getContext('2d');
  const w = cvs.width;
  const h = cvs.height;
  const cx = w / 2;
  const cy = h / 2;
  const size = 18;
  const hw = size * 0.5;
  const hh = size;

  c.clearRect(0, 0, w, h);
  c.save();
  c.translate(cx, cy);

  c.shadowColor = '#e040fb';
  c.shadowBlur = 8;

  const gemGrad = c.createLinearGradient(-hw, -hh * 0.3, hw, hh * 0.3);
  gemGrad.addColorStop(0, '#e040fb');
  gemGrad.addColorStop(0.3, '#f48cff');
  gemGrad.addColorStop(0.5, '#ffffff');
  gemGrad.addColorStop(0.7, '#f48cff');
  gemGrad.addColorStop(1, '#aa00ff');
  c.fillStyle = gemGrad;

  c.beginPath();
  c.moveTo(0, -hh * 0.55);
  c.lineTo(hw, -hh * 0.1);
  c.lineTo(hw * 0.7, hh * 0.05);
  c.lineTo(-hw * 0.7, hh * 0.05);
  c.lineTo(-hw, -hh * 0.1);
  c.closePath();
  c.fill();

  const pavGrad = c.createLinearGradient(0, 0, 0, hh * 0.55);
  pavGrad.addColorStop(0, '#d050f0');
  pavGrad.addColorStop(1, '#7700cc');
  c.fillStyle = pavGrad;
  c.beginPath();
  c.moveTo(-hw * 0.7, hh * 0.05);
  c.lineTo(hw * 0.7, hh * 0.05);
  c.lineTo(0, hh * 0.55);
  c.closePath();
  c.fill();

  c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(0, -hh * 0.55); c.lineTo(0, hh * 0.55);
  c.moveTo(-hw * 0.7, hh * 0.05); c.lineTo(0, hh * 0.55);
  c.moveTo(hw * 0.7, hh * 0.05); c.lineTo(0, hh * 0.55);
  c.stroke();

  c.shadowBlur = 0;
  c.restore();
}

// ── Permanent Upgrades Data ──
const PERM_UPGRADES = [
  { id: 'health',    label: 'HEALTH',      icon: '♥',  color: '#00ff66', desc: '+10% MAX HP' },
  { id: 'damage',    label: 'DAMAGE',      icon: '⚔', color: '#ff4444', desc: '+10% BULLET DMG' },
  { id: 'regen',     label: 'REGEN',       icon: '✚', color: '#44ffaa', desc: '+10% HP REGEN' },
  { id: 'precision', label: 'PRECISION',   icon: '◎', color: '#00fff2', desc: '+10% ACCURACY' },
  { id: 'fireRate',  label: 'FIRE RATE',   icon: '⚡', color: '#ffdd00', desc: '+10% FIRE SPEED' },
];

const BASE_COST = 5;
const COST_SCALE = 1.10;
const BONUS_PER_LEVEL = 0.05;

// Server-backed data
let serverGems = 0;
let serverUpgrades = {};

async function loadServerData() {
  try {
    const res = await fetch('/api/gamedata');
    if (res.ok) {
      const data = await res.json();
      serverGems = data.gems || 0;
      serverUpgrades = data.permUpgrades || {};
    }
  } catch (e) {}
}

async function saveToServer(gems, permUpgrades) {
  try {
    await fetch('/api/gamedata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gems, permUpgrades }),
    });
  } catch (e) {}
}

function getPermUpgrades() { return serverUpgrades; }
function getGems() { return serverGems; }

function getUpgradeCost(level) {
  return Math.round(BASE_COST * Math.pow(COST_SCALE, level));
}

// ── Build UI ──
let currentIndex = 0;

function buildUpgradeCards() {
  const grid = document.getElementById('upgrades-grid');
  grid.innerHTML = '';
  const upgData = getPermUpgrades();
  const gems = getGems();

  document.getElementById('gems-count').textContent = gems;

  PERM_UPGRADES.forEach((upg, i) => {
    const level = upgData[upg.id] || 0;
    const cost = getUpgradeCost(level);
    const totalBonus = Math.round(level * BONUS_PER_LEVEL * 100);
    const canBuy = gems >= cost;

    const card = document.createElement('div');
    card.className = `upg-card${i === currentIndex ? ' active' : ''}`;
    card.dataset.index = i;

    card.innerHTML = `
      <div class="upg-icon" style="color:${upg.color};text-shadow:0 0 12px ${upg.color}">${upg.icon}</div>
      <div class="upg-body">
        <div class="upg-label" style="color:${upg.color}">${upg.label}</div>
        <div class="upg-desc">${upg.desc}</div>
        <div class="upg-stats">
          <span class="upg-level">LVL ${level}</span>
          <span class="upg-total" style="color:${upg.color}">TOTAL: +${totalBonus}%</span>
        </div>
        <div class="upg-bar-wrap">
          <div class="upg-bar">
            <div class="upg-bar-fill" style="width:${Math.min(100, level * 10)}%;background:${upg.color};box-shadow:0 0 6px ${upg.color}"></div>
          </div>
        </div>
      </div>
      <div class="upg-cost-area">
        <div class="upg-cost ${canBuy ? 'can-buy' : 'no-buy'}">
          <span class="upg-cost-val">${cost}</span>
          <span class="upg-cost-gem">GEM</span>
        </div>
        <div class="upg-key">[${i + 1}]</div>
      </div>
    `;

    card.addEventListener('mouseenter', () => {
      currentIndex = i;
      highlightCard(i);
      playHoverSound();
    });

    card.addEventListener('click', () => {
      buyUpgrade(i);
    });

    grid.appendChild(card);
  });
}

function highlightCard(index) {
  const cards = document.querySelectorAll('.upg-card');
  cards.forEach((c, i) => {
    c.classList.toggle('active', i === index);
  });
  currentIndex = index;
}

function buyUpgrade(index) {
  const upg = PERM_UPGRADES[index];
  const level = serverUpgrades[upg.id] || 0;
  const cost = getUpgradeCost(level);

  if (serverGems < cost) {
    playDenySound();
    const card = document.querySelectorAll('.upg-card')[index];
    card.classList.add('deny');
    setTimeout(() => card.classList.remove('deny'), 300);
    return;
  }

  serverGems -= cost;
  serverUpgrades[upg.id] = level + 1;
  saveToServer(serverGems, serverUpgrades);
  playBuySound();

  // Flash effect
  const card = document.querySelectorAll('.upg-card')[index];
  card.classList.add('bought');
  setTimeout(() => card.classList.remove('bought'), 400);

  buildUpgradeCards();
  highlightCard(index);
}

// ── Keyboard Nav ──
document.addEventListener('keydown', (e) => {
  const num = parseInt(e.key);
  if (num >= 1 && num <= PERM_UPGRADES.length) {
    currentIndex = num - 1;
    highlightCard(currentIndex);
    buyUpgrade(currentIndex);
    return;
  }

  if (e.key === 'ArrowDown' || e.key === 's') {
    e.preventDefault();
    currentIndex = (currentIndex + 1) % PERM_UPGRADES.length;
    highlightCard(currentIndex);
    playHoverSound();
  }
  if (e.key === 'ArrowUp' || e.key === 'w') {
    e.preventDefault();
    currentIndex = (currentIndex - 1 + PERM_UPGRADES.length) % PERM_UPGRADES.length;
    highlightCard(currentIndex);
    playHoverSound();
  }
  if (e.key === 'Enter') {
    buyUpgrade(currentIndex);
  }
  if (e.key === 'Escape' || e.key === 'Backspace') {
    window.location.href = '/';
  }
});

// Back button
const backBtn = document.querySelector('.back-btn');
if (backBtn) {
  backBtn.addEventListener('mouseenter', playHoverSound);
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    playSelectSound();
    setTimeout(() => { window.location.href = '/'; }, 300);
  });
}

// ── Init ──
drawGemIcon(document.getElementById('gem-icon-cvs'));
loadServerData().then(() => buildUpgradeCards());
