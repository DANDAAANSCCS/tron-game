// ── Background Grid Animation (same as menu) ──
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
const gridSize = 60;
let offset = 0;
const trails = [];
const TRAIL_COUNT = 4;
const TRAIL_COLORS = ['#00fff2', '#ff6600', '#0044ff', '#ff0055'];
function createTrail(i) {
  const h = Math.random() > 0.5;
  return { x: h ? -100 : Math.random() * canvas.width, y: h ? Math.random() * canvas.height : -100, speed: 1.5 + Math.random() * 2, horizontal: h, color: TRAIL_COLORS[i % TRAIL_COLORS.length], length: 80 + Math.random() * 120, alpha: 0.3 + Math.random() * 0.4 };
}
for (let i = 0; i < TRAIL_COUNT; i++) trails.push(createTrail(i));
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width*0.7);
  grad.addColorStop(0, '#0d1117'); grad.addColorStop(1, '#050508');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(0, 255, 242, 0.04)'; ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  const so = offset % gridSize;
  for (let y = -gridSize + so; y <= canvas.height + gridSize; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0, 255, 242, 0.08)';
  for (let x = 0; x <= canvas.width; x += gridSize) { for (let y = -gridSize + so; y <= canvas.height + gridSize; y += gridSize) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill(); } }
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
    if (t.horizontal) { ctx.moveTo(t.x-t.length, t.y); ctx.lineTo(t.x, t.y); } else { ctx.moveTo(t.x, t.y-t.length); ctx.lineTo(t.x, t.y); }
    ctx.stroke();
    ctx.shadowColor = t.color; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(t.x, t.y, 2, 0, Math.PI*2); ctx.fillStyle = t.color; ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  });
}
function animBg() { drawGrid(); drawTrails(); requestAnimationFrame(animBg); }
animBg();

// ── Gem Icon ──
function drawGemIcon() {
  const gc = document.getElementById('gem-icon');
  const gx = gc.getContext('2d');
  const cx = 9, cy = 9;
  gx.clearRect(0, 0, 18, 18);
  gx.fillStyle = '#e040fb';
  gx.shadowColor = '#e040fb';
  gx.shadowBlur = 6;
  gx.beginPath();
  gx.moveTo(cx, cy - 7);
  gx.lineTo(cx + 5, cy - 2);
  gx.lineTo(cx + 3, cy + 7);
  gx.lineTo(cx - 3, cy + 7);
  gx.lineTo(cx - 5, cy - 2);
  gx.closePath();
  gx.fill();
  gx.shadowBlur = 0;
  gx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  gx.lineWidth = 0.5;
  gx.beginPath();
  gx.moveTo(cx - 5, cy - 2);
  gx.lineTo(cx + 5, cy - 2);
  gx.moveTo(cx, cy - 7);
  gx.lineTo(cx - 1, cy - 2);
  gx.lineTo(cx - 3, cy + 7);
  gx.moveTo(cx, cy - 7);
  gx.lineTo(cx + 1, cy - 2);
  gx.lineTo(cx + 3, cy + 7);
  gx.stroke();
}
drawGemIcon();

// ═══════════════════════════════════════════
//  ABILITIES SYSTEM
//  Raridades: comun (5), raro (15), epico (25), legendario (40)
// ═══════════════════════════════════════════

const RARITY = {
  common:    { label: 'COMUN',      cost: 5,  color: '#00fff2', border: 'rgba(0, 255, 242, 0.3)',  glow: 'rgba(0, 255, 242, 0.15)' },
  rare:      { label: 'RARO',       cost: 15, color: '#4488ff', border: 'rgba(68, 136, 255, 0.3)', glow: 'rgba(68, 136, 255, 0.15)' },
  epic:      { label: 'EPICO',      cost: 25, color: '#aa00ff', border: 'rgba(170, 0, 255, 0.3)',  glow: 'rgba(170, 0, 255, 0.15)' },
  legendary: { label: 'LEGENDARIO', cost: 40, color: '#ffaa00', border: 'rgba(255, 170, 0, 0.3)',  glow: 'rgba(255, 170, 0, 0.15)' },
};

const ABILITIES = [
  {
    id: 'emp',
    name: 'EMP PULSE',
    rarity: 'common',
    icon: '\u26A1',
    key: 'SPACE',
    description: 'Emite una onda electromagnetica que dania y empuja a todos los enemigos cercanos.',
    stats: 'DMG: 60 | RADIO: 350 | CD: 10s',
  },
  // Futuras habilidades van aqui siguiendo el formato
  // { id: 'shield', name: 'ENERGY SHIELD', rarity: 'rare', icon: '...', ... },
];

const MAX_EQUIPPED = 5;
let serverGems = 0;
let unlockedAbilities = [];
let equippedAbilities = [];

// ── Load data from server ──
async function loadData() {
  try {
    const [gemsRes, abRes] = await Promise.all([
      fetch('/api/gamedata'),
      fetch('/api/abilities'),
    ]);
    if (gemsRes.ok) {
      const gd = await gemsRes.json();
      serverGems = gd.gems || 0;
    }
    if (abRes.ok) {
      const ad = await abRes.json();
      unlockedAbilities = ad.unlockedAbilities || [];
      equippedAbilities = ad.equippedAbilities || [];
    }
  } catch (e) {}
  updateUI();
}

function updateUI() {
  document.getElementById('gems-count').textContent = serverGems;
  updateEquipCounter();
  renderAbilities();
}

function updateEquipCounter() {
  const el = document.getElementById('equip-counter');
  if (el) el.textContent = `${equippedAbilities.length} / ${MAX_EQUIPPED}`;
}

function renderAbilities() {
  const grid = document.getElementById('abilities-grid');
  grid.innerHTML = '';

  ABILITIES.forEach(ab => {
    const rarity = RARITY[ab.rarity];
    const isUnlocked = unlockedAbilities.includes(ab.id);
    const isEquipped = equippedAbilities.includes(ab.id);
    const canBuy = serverGems >= rarity.cost;
    const canEquip = equippedAbilities.length < MAX_EQUIPPED;

    const card = document.createElement('div');
    card.className = 'ability-card' + (isEquipped ? ' equipped' : isUnlocked ? ' unlocked' : '');
    card.style.borderColor = isEquipped ? rarity.border : isUnlocked ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)';

    let actionHTML;
    if (!isUnlocked) {
      actionHTML = `<button class="ab-unlock-btn ${canBuy ? 'can-buy' : 'no-buy'}">
        <span class="ab-cost-val">${rarity.cost}</span>
        <span class="ab-cost-gem">GEMAS</span>
      </button>`;
    } else if (isEquipped) {
      actionHTML = `<button class="ab-equip-btn ab-unequip">DESEQUIPAR</button>`;
    } else {
      actionHTML = `<button class="ab-equip-btn ab-equip ${canEquip ? '' : 'no-buy'}">EQUIPAR</button>`;
    }

    card.innerHTML = `
      <div class="ab-icon" style="color: ${isUnlocked ? rarity.color : 'rgba(255,255,255,0.15)'}; text-shadow: 0 0 12px ${isUnlocked ? rarity.color : 'transparent'};">${ab.icon}</div>
      <div class="ab-body">
        <div class="ab-header">
          <span class="ab-name" style="color: ${isUnlocked ? rarity.color : 'rgba(255,255,255,0.25)'};">${ab.name}</span>
          <span class="ab-rarity" style="color: ${rarity.color}; border-color: ${rarity.border};">${rarity.label}</span>
          ${isEquipped ? '<span class="ab-equipped-badge">EQUIPADO</span>' : ''}
        </div>
        <div class="ab-desc">${ab.description}</div>
        <div class="ab-stats">${ab.stats}</div>
        <div class="ab-key">TECLA: [${ab.key}]</div>
      </div>
      <div class="ab-action">${actionHTML}</div>
    `;

    // Event listeners
    if (!isUnlocked) {
      card.querySelector('.ab-unlock-btn').addEventListener('click', () => unlockAbility(ab.id, rarity.cost, card));
    } else if (isEquipped) {
      card.querySelector('.ab-unequip').addEventListener('click', () => unequipAbility(ab.id));
    } else {
      card.querySelector('.ab-equip').addEventListener('click', () => equipAbility(ab.id));
    }

    grid.appendChild(card);
  });
}

async function unlockAbility(abilityId, cost, cardEl) {
  if (serverGems < cost) {
    cardEl.classList.add('deny');
    setTimeout(() => cardEl.classList.remove('deny'), 300);
    return;
  }
  try {
    const res = await fetch('/api/abilities/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abilityId, cost }),
    });
    const data = await res.json();
    if (res.ok) {
      serverGems = data.gems;
      unlockedAbilities.push(abilityId);
      cardEl.classList.add('bought');
      setTimeout(() => cardEl.classList.remove('bought'), 400);
      updateUI();
    }
  } catch (e) {}
}

async function equipAbility(abilityId) {
  if (equippedAbilities.length >= MAX_EQUIPPED) return;
  try {
    const res = await fetch('/api/abilities/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abilityId }),
    });
    const data = await res.json();
    if (res.ok) {
      equippedAbilities = data.equippedAbilities;
      updateUI();
    }
  } catch (e) {}
}

async function unequipAbility(abilityId) {
  try {
    const res = await fetch('/api/abilities/unequip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abilityId }),
    });
    const data = await res.json();
    if (res.ok) {
      equippedAbilities = data.equippedAbilities;
      updateUI();
    }
  } catch (e) {}
}

loadData();
