// ═══════════════════════════════════════════
//  abilities.js — Abilities page
//  Depends on: shared/bg-animation.js, shared/audio.js
// ═══════════════════════════════════════════

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
