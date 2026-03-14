// ═══════════════════════════════════════════
//  abilities.js — Card Collection System
//  Depends on: shared/bg-animation.js, shared/audio.js
// ═══════════════════════════════════════════

// ── Gem Icon ──
function drawGemIcon() {
  const gc = document.getElementById('gem-icon');
  if (!gc) return;
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
//  ABILITY DEFINITIONS
// ═══════════════════════════════════════════

const ABILITIES = [
  {
    id: 'emp',
    name: 'EMP PULSE',
    rarity: 'common',
    icon: '\u26A1',
    description: 'Onda electromagn\u00e9tica que da\u00f1a y empuja enemigos.',
    baseStats: 'DMG: 60 | RADIO: 350 | CD: 10s',
  },
  {
    id: 'shield',
    name: 'ESCUDO',
    rarity: 'common',
    icon: '\uD83D\uDEE1',
    description: 'Escudo temporal que absorbe da\u00f1o.',
    baseStats: 'ABSORBE: 50 | DUR: 5s | CD: 15s',
  },
  {
    id: 'rapidfire',
    name: 'FUEGO RAPIDO',
    rarity: 'rare',
    icon: '\uD83D\uDD25',
    description: 'Aumenta temporalmente la velocidad de disparo.',
    baseStats: 'BOOST: +50% | DUR: 4s | CD: 20s',
  },
  {
    id: 'chain',
    name: 'RAYO CADENA',
    rarity: 'rare',
    icon: '\u269B',
    description: 'Rayo que rebota entre enemigos cercanos.',
    baseStats: 'DMG: 40 | REBOTES: 3 | CD: 12s',
  },
  {
    id: 'freeze',
    name: 'ONDA GLACIAL',
    rarity: 'epic',
    icon: '\u2744',
    description: 'Congela y ralentiza a todos los enemigos en rango.',
    baseStats: 'SLOW: 50% | DUR: 3s | CD: 25s',
  },
  {
    id: 'orbital',
    name: 'ATAQUE ORBITAL',
    rarity: 'legendary',
    icon: '\u2604',
    description: 'Bombardeo orbital masivo en un \u00e1rea grande.',
    baseStats: 'DMG: 300 | RADIO: 500 | CD: 45s',
  },
];

const RARITY = {
  common:    { label: 'COMUN',      color: '#00fff2', border: 'rgba(0, 255, 242, 0.3)'  },
  rare:      { label: 'RARO',       color: '#4488ff', border: 'rgba(68, 136, 255, 0.3)' },
  epic:      { label: 'EPICO',      color: '#aa00ff', border: 'rgba(170, 0, 255, 0.3)'  },
  legendary: { label: 'LEGENDARIO', color: '#ffaa00', border: 'rgba(255, 170, 0, 0.3)'  },
};

// Cards required to advance from level N to level N+1.
// Index 0 = cards needed to reach level 1 (unlock).
// Index 1 = cards needed to go from level 1 to level 2, etc.
// 19 entries cover levels 1-20 (index 0..18).
const CARDS_PER_LEVEL = [1, 2, 4, 8, 12, 18, 25, 35, 45, 60, 80, 100, 130, 160, 200, 250, 300, 380, 460];

const MAX_EQUIPPED = 5;
const MAX_LEVEL = 20;

// ── State ──
let serverGems = 0;
let abilityCards = {};    // { [id]: cardCount }
let abilityLevels = {};   // { [id]: level }
let equippedAbilities = [];

// ── Helpers ──

/**
 * Given total cards accumulated, compute the current level.
 * Level 1 is granted when totalCards >= CARDS_PER_LEVEL[0] (i.e., >= 1).
 */
function computeLevel(totalCards) {
  let cardsConsumed = 0;
  for (let lvl = 0; lvl < CARDS_PER_LEVEL.length; lvl++) {
    cardsConsumed += CARDS_PER_LEVEL[lvl];
    if (totalCards < cardsConsumed) return lvl; // lvl = number of thresholds cleared
  }
  return MAX_LEVEL;
}

/**
 * Cards consumed to reach a given level (sum of CARDS_PER_LEVEL[0..level-1]).
 */
function cardsForLevel(level) {
  let sum = 0;
  for (let i = 0; i < level; i++) sum += CARDS_PER_LEVEL[i];
  return sum;
}

/**
 * Returns progress info for an ability given its total card count and stored level.
 * We use the stored level from the server if provided, otherwise derive from cards.
 */
function getProgressInfo(id) {
  const totalCards = abilityCards[id] || 0;
  // Use server-provided level if available, otherwise derive from card count.
  let level = (abilityLevels[id] !== undefined) ? abilityLevels[id] : computeLevel(totalCards);

  if (level === 0 && totalCards === 0) {
    return { level: 0, totalCards: 0, cardsTowardNext: 0, cardsNeeded: CARDS_PER_LEVEL[0], pct: 0 };
  }

  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, totalCards, cardsTowardNext: 0, cardsNeeded: 0, pct: 1 };
  }

  const consumed = cardsForLevel(level);
  const cardsTowardNext = totalCards - consumed;
  const cardsNeeded = CARDS_PER_LEVEL[level]; // cost to go from current level to next
  const pct = cardsNeeded > 0 ? Math.min(cardsTowardNext / cardsNeeded, 1) : 1;

  return { level, totalCards, cardsTowardNext, cardsNeeded, pct };
}

// ── Data loading ──
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
      abilityCards    = ad.abilityCards    || {};
      abilityLevels   = ad.abilityLevels   || {};
      equippedAbilities = ad.equippedAbilities || [];
    }
  } catch (e) {
    // Silent fail — UI will show zeroed state
  }
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

// ── Render ──
function renderAbilities() {
  const grid = document.getElementById('abilities-grid');
  grid.innerHTML = '';

  ABILITIES.forEach(ab => {
    const rarity = RARITY[ab.rarity];
    const info = getProgressInfo(ab.id);
    const isEquipped = equippedAbilities.includes(ab.id);
    const hasCards = info.level >= 1;
    const slotsAvailable = equippedAbilities.length < MAX_EQUIPPED;

    const card = document.createElement('div');
    card.className = [
      'ability-card',
      hasCards ? 'has-cards' : '',
      isEquipped ? 'equipped' : '',
    ].filter(Boolean).join(' ');

    // CSS custom property for the left-border rarity glow
    card.style.setProperty('--rarity-color', rarity.color);

    // ── Icon column ──
    const iconColor = hasCards ? rarity.color : 'rgba(255,255,255,0.14)';
    const iconGlow  = hasCards ? `0 0 14px ${rarity.color}` : 'none';

    // ── Level / progress section ──
    let levelHTML;
    if (info.level === 0) {
      levelHTML = `
        <div class="ab-no-cards-label">SIN CARTAS &mdash; <a class="shop-link" href="/shop.html">IR A TIENDA</a></div>
      `;
    } else if (info.level >= MAX_LEVEL) {
      levelHTML = `
        <div class="ab-level-row">
          <span class="ab-lvl-badge max-level">LVL MAX</span>
        </div>
      `;
    } else {
      const fillColor = rarity.color;
      levelHTML = `
        <div class="ab-level-row">
          <span class="ab-lvl-badge" style="color: ${rarity.color}; text-shadow: 0 0 6px ${rarity.color};">LVL ${info.level}</span>
          <div class="ab-progress-wrap">
            <div class="ab-progress-bar-track">
              <div class="ab-progress-bar-fill" style="width: ${Math.round(info.pct * 100)}%; background: ${fillColor}; box-shadow: 0 0 6px ${fillColor};"></div>
            </div>
            <div class="ab-progress-label">${info.cardsTowardNext} / ${info.cardsNeeded} CARTAS</div>
          </div>
        </div>
      `;
    }

    // ── Equip / unequip button ──
    let actionHTML = '';
    if (hasCards) {
      if (isEquipped) {
        actionHTML = `<button class="ab-equip-btn ab-unequip">DESEQUIPAR</button>`;
      } else {
        const noSlots = !slotsAvailable;
        actionHTML = `<button class="ab-equip-btn ab-equip${noSlots ? ' no-slots' : ''}" ${noSlots ? 'disabled' : ''}>EQUIPAR</button>`;
      }
    }

    card.innerHTML = `
      <div class="ab-icon-col" style="color: ${iconColor}; text-shadow: ${iconGlow};">${ab.icon}</div>
      <div class="ab-body">
        <div class="ab-header">
          <span class="ab-name" style="color: ${hasCards ? rarity.color : 'rgba(255,255,255,0.22)'};">${ab.name}</span>
          <span class="ab-rarity" style="color: ${rarity.color}; border-color: ${rarity.border};">${rarity.label}</span>
          ${isEquipped ? '<span class="ab-equipped-badge">EQUIPADO</span>' : ''}
        </div>
        <div class="ab-desc">${ab.description}</div>
        <div class="ab-stats">${ab.baseStats}</div>
        ${levelHTML}
      </div>
      <div class="ab-action-col">${actionHTML}</div>
    `;

    // ── Event listeners ──
    if (hasCards) {
      if (isEquipped) {
        card.querySelector('.ab-unequip').addEventListener('click', () => {
          if (typeof playSelectSound === 'function') playSelectSound();
          unequipAbility(ab.id);
        });
      } else {
        const btn = card.querySelector('.ab-equip');
        if (btn && !btn.disabled) {
          btn.addEventListener('click', () => {
            if (typeof playSelectSound === 'function') playSelectSound();
            equipAbility(ab.id);
          });
        }
      }
    }

    // ── "IR A TIENDA" link sound ──
    const shopLink = card.querySelector('.shop-link');
    if (shopLink) {
      shopLink.addEventListener('click', () => {
        if (typeof playSelectSound === 'function') playSelectSound();
      });
    }

    grid.appendChild(card);
  });

  // ── Back button sound (wired once after render) ──
  const backBtn = document.querySelector('.back-btn');
  if (backBtn && !backBtn._soundBound) {
    backBtn._soundBound = true;
    backBtn.addEventListener('click', () => {
      if (typeof playSelectSound === 'function') playSelectSound();
    });
  }
}

// ── Equip / Unequip ──
async function equipAbility(abilityId) {
  if (equippedAbilities.length >= MAX_EQUIPPED) return;
  try {
    const res = await fetch('/api/abilities/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abilityId }),
    });
    if (res.ok) {
      const data = await res.json();
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
    if (res.ok) {
      const data = await res.json();
      equippedAbilities = data.equippedAbilities;
      updateUI();
    }
  } catch (e) {}
}

// ── Init ──
loadData();
