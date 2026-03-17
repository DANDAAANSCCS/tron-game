// ═══════════════════════════════════════════
//  upgrades.js — Permanent upgrades page
//  Depends on: shared/bg-animation.js, shared/audio.js
// ═══════════════════════════════════════════

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
  { id: 'health',    label: 'HEALTH',      icon: '\u2665',  color: '#00ff66', desc: '+10% MAX HP' },
  { id: 'damage',    label: 'DAMAGE',      icon: '\u2694', color: '#ff4444', desc: '+10% BULLET DMG' },
  { id: 'regen',     label: 'REGEN',       icon: '\u271A', color: '#44ffaa', desc: '+10% HP REGEN' },
  { id: 'precision', label: 'PRECISION',   icon: '\u25CE', color: '#00fff2', desc: '+10% ACCURACY' },
  { id: 'fireRate',  label: 'FIRE RATE',   icon: '\u26A1', color: '#ffdd00', desc: '+10% FIRE SPEED' },
];

const BASE_COST = 5;
const COST_SCALE = 1.10;
const BONUS_PER_LEVEL = 0.10;

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
    const isPrecisionMaxed = upg.id === 'precision' && level >= 10;
    const canBuy = gems >= cost && !isPrecisionMaxed;

    const card = document.createElement('div');
    card.className = `upg-card${i === currentIndex ? ' active' : ''}`;
    card.dataset.index = i;

    const displayLabel = (typeof t === 'function' ? t('perm.' + upg.id) : '') || upg.label;
    const displayDesc  = (typeof t === 'function' ? t('perm.' + upg.id + '_desc') : '') || upg.desc;
    const displayLvl   = (typeof t === 'function' ? t('perm.lvl') : 'LVL') + ' ' + level;
    const displayTotal = (typeof t === 'function' ? t('perm.total') : 'TOTAL') + ': +' + totalBonus + '%';
    const displayGem   = (typeof t === 'function' ? t('perm.gem') : 'GEM');

    card.innerHTML = `
      <div class="upg-icon" style="color:${upg.color};text-shadow:0 0 12px ${upg.color}">${upg.icon}</div>
      <div class="upg-body">
        <div class="upg-label" style="color:${upg.color}">${displayLabel}</div>
        <div class="upg-desc">${displayDesc}</div>
        <div class="upg-stats">
          <span class="upg-level">${displayLvl}</span>
          <span class="upg-total" style="color:${upg.color}">${displayTotal}</span>
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
          <span class="upg-cost-gem">${displayGem}</span>
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

  // Precision capped at level 10 (100%)
  if (upg.id === 'precision' && level >= 10) {
    playDenySound();
    return;
  }

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
    if (typeof playSelectSound === 'function') playSelectSound();
    window.location.href = '/menu.html';
  }
});

// Back button
const backBtn = document.querySelector('.back-btn');
if (backBtn) {
  backBtn.addEventListener('mouseenter', playHoverSound);
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    playSelectSound();
    window.location.href = '/menu.html';
  });
}

// ── Init ──
drawGemIcon(document.getElementById('gem-icon-cvs'));
loadServerData().then(() => buildUpgradeCards());
