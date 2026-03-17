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

const CARDS_PER_LEVEL = [1, 2, 4, 8, 12, 18, 25, 35, 45, 60, 80, 100, 130, 160, 200, 250, 300, 380, 460];

const MAX_EQUIPPED = 5;
const MAX_LEVEL = 20;

let SILVER_BASE = { common: 1500, rare: 3000, epic: 5000, legendary: 8000 };
let SILVER_SCALE = 1.25;

// ── Stat definitions per ability ──
const ABILITY_STATS = {
  emp: {
    damage:   { label: 'DAÑO',       base: 60,  perLvl: 8,   unit: ''  },
    radius:   { label: 'RADIO',      base: 350, perLvl: 15,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',   base: 600, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  shield: {
    absorb:   { label: 'ABSORBE',    base: 50,  perLvl: 10,  unit: ''  },
    duration: { label: 'DURACIÓN',   base: 300, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',   base: 900, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  rapidfire: {
    boost:    { label: 'BOOST',      base: 50,  perLvl: 3,   unit: '%' },
    duration: { label: 'DURACIÓN',   base: 240, perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',   base: 1200,perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  chain: {
    damage:   { label: 'DAÑO',       base: 40,  perLvl: 6,   unit: ''  },
    bounces:  { label: 'REBOTES',    base: 3,   perLvl: 0.5, unit: '', floor: true },
    cooldown: { label: 'COOLDOWN',   base: 720, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  freeze: {
    slow:     { label: 'SLOW',       base: 50,  perLvl: 1.5, unit: '%' },
    duration: { label: 'DURACIÓN',   base: 180, perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    radius:   { label: 'RADIO',      base: 400, perLvl: 15,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',   base: 1500,perLvl: -30, unit: 'f', display: 's', divisor: 60 },
  },
  orbital: {
    damage:   { label: 'DAÑO',       base: 300, perLvl: 25,  unit: ''  },
    radius:   { label: 'RADIO',      base: 500, perLvl: 20,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',   base: 2700,perLvl: -50, unit: 'f', display: 's', divisor: 60 },
  },
};

function getSilverCost(rarity, level) {
  if (level < 1) return 0;
  const base = SILVER_BASE[rarity] || 1500;
  return Math.round(base * Math.pow(SILVER_SCALE, level - 1));
}

// ── State ──
let serverGems = 0;
let serverSilver = 0;
let abilityCards = {};
let abilityLevels = {};
let equippedAbilities = [];

// ── Helpers ──

function computeLevel(totalCards) {
  let cardsConsumed = 0;
  for (let lvl = 0; lvl < CARDS_PER_LEVEL.length; lvl++) {
    cardsConsumed += CARDS_PER_LEVEL[lvl];
    if (totalCards < cardsConsumed) return lvl;
  }
  return MAX_LEVEL;
}

function cardsForLevel(level) {
  let sum = 0;
  for (let i = 0; i < level; i++) sum += CARDS_PER_LEVEL[i];
  return sum;
}

function getProgressInfo(id) {
  const totalCards = abilityCards[id] || 0;
  let level = (abilityLevels[id] !== undefined) ? abilityLevels[id] : computeLevel(totalCards);

  if (level === 0 && totalCards === 0) {
    return { level: 0, totalCards: 0, cardsTowardNext: 0, cardsNeeded: CARDS_PER_LEVEL[0], pct: 0 };
  }

  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, totalCards, cardsTowardNext: 0, cardsNeeded: 0, pct: 1 };
  }

  const consumed = cardsForLevel(level);
  const cardsTowardNext = totalCards - consumed;
  const cardsNeeded = CARDS_PER_LEVEL[level];
  const pct = cardsNeeded > 0 ? Math.min(cardsTowardNext / cardsNeeded, 1) : 1;

  return { level, totalCards, cardsTowardNext, cardsNeeded, pct };
}

// ── Stat value calculator ──
function getStatValue(statDef, level) {
  // level 0 = base stats (no levels applied)
  const rawLevel = Math.max(0, level);
  let val = statDef.base + statDef.perLvl * rawLevel;
  if (statDef.floor) val = Math.floor(val);
  if (statDef.display === 's' && statDef.divisor) {
    return (val / statDef.divisor).toFixed(1) + 's';
  }
  if (statDef.unit && statDef.unit !== 'f' && statDef.unit !== '') {
    return val + statDef.unit;
  }
  return statDef.floor ? val : (Number.isInteger(val) ? val : Math.round(val * 10) / 10);
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
      serverSilver = gd.silverCoins || 0;
      if (gd.silverBaseCost) SILVER_BASE = gd.silverBaseCost;
      if (gd.silverScale) SILVER_SCALE = gd.silverScale;
      if (gd.cardsToUpgrade) CARDS_PER_LEVEL.splice(0, CARDS_PER_LEVEL.length, ...gd.cardsToUpgrade);
    }
    if (abRes.ok) {
      const ad = await abRes.json();
      abilityCards      = ad.abilityCards      || {};
      abilityLevels     = ad.abilityLevels     || {};
      equippedAbilities = ad.equippedAbilities || [];
    }
  } catch (e) {
    // Silent fail — UI will show zeroed state
  }
  updateUI();
}

function updateUI() {
  const gemsEl = document.getElementById('gems-count');
  if (gemsEl) gemsEl.textContent = serverGems;
  const silverEl = document.getElementById('silver-count');
  if (silverEl) silverEl.textContent = serverSilver;
  updateEquipCounter();
  renderAbilities();
}

function updateEquipCounter() {
  const el = document.getElementById('equip-counter');
  if (el) el.textContent = `${equippedAbilities.length} / ${MAX_EQUIPPED}`;
}

// ═══════════════════════════════════════════
//  DETAIL MODAL
// ═══════════════════════════════════════════

function buildStatsTableHTML(ab, info) {
  const statDefs = ABILITY_STATS[ab.id];
  if (!statDefs) return '';

  const rarity = RARITY[ab.rarity];
  const level = info.level;
  const isMax = level >= MAX_LEVEL;

  let rows = '';
  for (const key of Object.keys(statDefs)) {
    const def = statDefs[key];
    const currentVal = getStatValue(def, level);
    let nextCell;

    if (isMax) {
      nextCell = `<span style="color:#ffaa00;font-size:0.55rem;letter-spacing:2px;">MAX</span>`;
    } else {
      const nextVal = getStatValue(def, level + 1);
      const improved = def.perLvl > 0 || (def.display === 's'); // cooldown goes down = improvement
      // For cooldown, smaller is better; detect by perLvl sign
      const isImprovement = def.perLvl < 0
        ? (parseFloat(String(nextVal)) < parseFloat(String(currentVal)))
        : (parseFloat(String(nextVal)) > parseFloat(String(currentVal)));
      const arrowColor = isImprovement ? '#00fff2' : '#ff6644';
      const valColor = isImprovement ? '#00ff66' : '#ff6644';
      nextCell = `
        <span style="color:${arrowColor};margin:0 4px;">&#8594;</span>
        <span style="color:${valColor};">${nextVal}</span>
      `;
    }

    rows += `
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:5px 0;
        border-bottom:1px solid rgba(255,255,255,0.06);
        font-family:'Share Tech Mono',monospace;
        font-size:0.6rem;
        letter-spacing:1px;
      ">
        <span style="color:rgba(255,255,255,0.45);min-width:90px;">${(typeof t === 'function' ? t('stat.' + key) : '') || def.label}</span>
        <span style="display:flex;align-items:center;gap:2px;">
          <span style="color:#fff;">${currentVal}</span>
          ${nextCell}
        </span>
      </div>
    `;
  }

  return `
    <div style="margin:10px 0 4px;">
      <div style="
        font-family:'Share Tech Mono',monospace;
        font-size:0.5rem;
        letter-spacing:3px;
        color:rgba(255,255,255,0.25);
        margin-bottom:6px;
      ">${(typeof t === 'function' ? t('abilities.stats') : 'ESTADISTICAS')}</div>
      ${rows}
    </div>
  `;
}

function openModal(ab) {
  if (typeof playSelectSound === 'function') playSelectSound();

  const rarity = RARITY[ab.rarity];
  const info = getProgressInfo(ab.id);
  const isEquipped = equippedAbilities.includes(ab.id);
  const hasCards = info.level >= 1;
  const slotsAvailable = equippedAbilities.length < MAX_EQUIPPED;
  const isMax = info.level >= MAX_LEVEL;

  // ── Progress bar ──
  const progressPct = Math.round(info.pct * 100);
  const progressBarHTML = `
    <div style="
      width:100%;
      height:4px;
      background:rgba(255,255,255,0.08);
      border-radius:2px;
      overflow:hidden;
      margin:6px 0 3px;
    ">
      <div style="
        width:${progressPct}%;
        height:100%;
        background:${rarity.color};
        box-shadow:0 0 6px ${rarity.color};
        border-radius:2px;
        transition:width 0.4s ease;
      "></div>
    </div>
  `;

  // ── Level label ──
  let levelLabel;
  if (info.level === 0) {
    levelLabel = `<span style="color:rgba(255,255,255,0.25);font-size:0.6rem;letter-spacing:2px;">${(typeof t === 'function' ? t('abilities.no_cards') : 'SIN CARTAS')}</span>`;
  } else if (isMax) {
    levelLabel = `<span style="color:#ffaa00;text-shadow:0 0 8px rgba(255,170,0,0.6);font-size:0.65rem;letter-spacing:2px;">${(typeof t === 'function' ? t('abilities.lvl_max') : 'LVL MAX')}</span>`;
  } else {
    levelLabel = `<span style="color:${rarity.color};text-shadow:0 0 6px ${rarity.color};font-size:0.65rem;letter-spacing:2px;">${(typeof t === 'function' ? t('abilities.lvl') : 'LVL')} ${info.level}</span>`;
  }

  // ── Upgrade section ──
  let upgradeHTML = '';
  if (hasCards && !isMax) {
    const silverCost = getSilverCost(ab.rarity, info.level);
    const cardsReady = info.cardsTowardNext >= info.cardsNeeded;
    const silverReady = serverSilver >= silverCost;
    const canUpgrade = cardsReady && silverReady;
    const cardsMissing = Math.max(0, info.cardsNeeded - info.cardsTowardNext);

    let hintHTML = '';
    if (!cardsReady) {
      hintHTML = `<div style="
        font-family:'Share Tech Mono',monospace;
        font-size:0.5rem;
        color:rgba(255,100,68,0.7);
        letter-spacing:1px;
        margin-top:4px;
      ">${(typeof t === 'function' ? t('abilities.missing_cards', {n: cardsMissing}) : 'FALTAN ' + cardsMissing + ' CARTAS')}</div>`;
    } else if (!silverReady) {
      hintHTML = `<div style="
        font-family:'Share Tech Mono',monospace;
        font-size:0.5rem;
        color:rgba(255,100,68,0.7);
        letter-spacing:1px;
        margin-top:4px;
      ">${(typeof t === 'function' ? t('abilities.missing_silver') : 'FALTA PLATA')}</div>`;
    }

    upgradeHTML = `
      <div style="margin-top:14px;">
        <button id="modal-upgrade-btn" style="
          font-family:'Orbitron',sans-serif;
          font-size:0.6rem;
          font-weight:700;
          letter-spacing:2px;
          padding:10px 20px;
          width:100%;
          border:1px solid ${canUpgrade ? 'rgba(0,255,102,0.45)' : 'rgba(192,192,192,0.2)'};
          background:${canUpgrade ? 'rgba(0,255,102,0.07)' : 'rgba(192,192,192,0.04)'};
          color:${canUpgrade ? '#00ff66' : 'rgba(192,192,192,0.35)'};
          cursor:${canUpgrade ? 'pointer' : 'not-allowed'};
          text-shadow:${canUpgrade ? '0 0 8px rgba(0,255,102,0.4)' : 'none'};
          box-shadow:${canUpgrade ? '0 0 8px rgba(0,255,102,0.08)' : 'none'};
          transition:all 0.2s ease;
        " ${canUpgrade ? '' : 'disabled'}>
          ${(typeof t === 'function' ? t('abilities.upgrade') : 'MEJORAR')}
          <span style="
            display:block;
            font-family:'Share Tech Mono',monospace;
            font-size:0.55rem;
            letter-spacing:1px;
            opacity:0.75;
            margin-top:2px;
          ">${silverCost.toLocaleString()} <span style="color:#c0c0c0;">SLV</span></span>
        </button>
        ${hintHTML}
      </div>
    `;
  }

  // ── Equip / Unequip button ──
  let equipHTML = '';
  if (hasCards) {
    if (isEquipped) {
      equipHTML = `
        <button id="modal-equip-btn" style="
          font-family:'Orbitron',sans-serif;
          font-size:0.6rem;
          font-weight:700;
          letter-spacing:2px;
          padding:10px 20px;
          width:100%;
          margin-top:8px;
          border:1px solid rgba(255,102,68,0.4);
          background:rgba(255,68,34,0.07);
          color:#ff6644;
          cursor:pointer;
          text-shadow:0 0 8px rgba(255,102,68,0.4);
          box-shadow:0 0 8px rgba(255,68,34,0.08);
          transition:all 0.2s ease;
        ">${(typeof t === 'function' ? t('abilities.unequip') : 'DESEQUIPAR')}</button>
      `;
    } else {
      const noSlots = !slotsAvailable;
      equipHTML = `
        <button id="modal-equip-btn" style="
          font-family:'Orbitron',sans-serif;
          font-size:0.6rem;
          font-weight:700;
          letter-spacing:2px;
          padding:10px 20px;
          width:100%;
          margin-top:8px;
          border:1px solid ${noSlots ? 'rgba(255,255,255,0.1)' : 'rgba(0,255,242,0.4)'};
          background:${noSlots ? 'transparent' : 'rgba(0,255,242,0.07)'};
          color:${noSlots ? 'rgba(255,255,255,0.22)' : '#00fff2'};
          cursor:${noSlots ? 'not-allowed' : 'pointer'};
          text-shadow:${noSlots ? 'none' : '0 0 8px rgba(0,255,242,0.4)'};
          box-shadow:${noSlots ? 'none' : '0 0 8px rgba(0,255,242,0.08)'};
          transition:all 0.2s ease;
        " ${noSlots ? 'disabled' : ''}>${(typeof t === 'function' ? t('abilities.equip') : 'EQUIPAR')}</button>
      `;
    }
  }

  // ── Stats table ──
  const statsTableHTML = buildStatsTableHTML(ab, info);

  // ── Assemble modal ──
  const overlay = document.createElement('div');
  overlay.id = 'ability-modal-overlay';
  overlay.style.cssText = `
    position:fixed;
    top:0;left:0;right:0;bottom:0;
    background:rgba(0,0,5,0.92);
    z-index:9999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    box-sizing:border-box;
  `;

  overlay.innerHTML = `
    <div style="
      background:rgba(4,4,18,0.98);
      border:1px solid ${rarity.border};
      box-shadow:0 0 30px ${rarity.color}22, inset 0 0 30px rgba(0,0,0,0.5);
      max-width:340px;
      width:100%;
      max-height:90vh;
      overflow-y:auto;
      padding:20px;
      box-sizing:border-box;
      position:relative;
    ">

      <!-- HEADER -->
      <div style="
        display:flex;
        align-items:center;
        gap:14px;
        padding-bottom:14px;
        border-bottom:1px solid rgba(255,255,255,0.07);
        margin-bottom:14px;
      ">
        <div style="
          font-size:2.4rem;
          color:${rarity.color};
          text-shadow:0 0 20px ${rarity.color}, 0 0 40px ${rarity.color}66;
          flex-shrink:0;
        ">${ab.icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="
            font-family:'Orbitron',sans-serif;
            font-size:0.9rem;
            font-weight:900;
            letter-spacing:3px;
            color:${rarity.color};
            text-shadow:0 0 8px ${rarity.color}88;
            margin-bottom:5px;
          ">${(typeof t === 'function' ? t('ability.' + ab.id) : ab.name)}</div>
          <span style="
            font-family:'Share Tech Mono',monospace;
            font-size:0.5rem;
            letter-spacing:3px;
            padding:2px 7px;
            border:1px solid ${rarity.border};
            color:${rarity.color};
          ">${(typeof t === 'function' ? t('rarity.' + ab.rarity) : rarity.label)}</span>
          ${isEquipped ? `<span style="
            font-family:'Share Tech Mono',monospace;
            font-size:0.48rem;
            letter-spacing:2px;
            color:#00ff66;
            padding:1px 6px;
            border:1px solid rgba(0,255,102,0.35);
            background:rgba(0,255,102,0.08);
            margin-left:6px;
          ">${(typeof t === 'function' ? t('abilities.equipped_badge') : 'EQUIPADO')}</span>` : ''}
        </div>
      </div>

      <!-- DESCRIPTION -->
      <div style="
        font-family:'Share Tech Mono',monospace;
        font-size:0.63rem;
        letter-spacing:1px;
        color:rgba(255,255,255,0.45);
        line-height:1.5;
        margin-bottom:14px;
      ">${(typeof t === 'function' ? t('ability.' + ab.id + '.desc') : ab.description)}</div>

      <!-- LEVEL + PROGRESS -->
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom:2px;
      ">
        ${levelLabel}
        <span style="
          font-family:'Share Tech Mono',monospace;
          font-size:0.52rem;
          letter-spacing:1px;
          color:rgba(255,255,255,0.3);
        ">${info.level > 0 && !isMax ? info.cardsTowardNext + ' / ' + info.cardsNeeded + ' ' + (typeof t === 'function' ? t('abilities.cards') : 'CARTAS') : ''}</span>
      </div>
      ${!isMax ? progressBarHTML : ''}

      <!-- STATS TABLE -->
      ${statsTableHTML}

      <!-- UPGRADE -->
      ${upgradeHTML}

      <!-- EQUIP / UNEQUIP -->
      ${equipHTML}

      <!-- CLOSE -->
      <button id="modal-close-btn" style="
        font-family:'Orbitron',sans-serif;
        font-size:0.55rem;
        font-weight:700;
        letter-spacing:3px;
        padding:10px 20px;
        width:100%;
        margin-top:12px;
        border:1px solid rgba(255,255,255,0.12);
        background:rgba(255,255,255,0.03);
        color:rgba(255,255,255,0.4);
        cursor:pointer;
        transition:all 0.2s ease;
      ">${(typeof t === 'function' ? t('settings.close') : 'CERRAR')}</button>

    </div>
  `;

  document.body.appendChild(overlay);

  // ── Wire modal buttons ──
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.07)';
      closeBtn.style.borderColor = 'rgba(255,255,255,0.25)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.03)';
      closeBtn.style.borderColor = 'rgba(255,255,255,0.12)';
    });
  }

  const upgradeBtn = document.getElementById('modal-upgrade-btn');
  if (upgradeBtn && !upgradeBtn.disabled) {
    upgradeBtn.addEventListener('click', async () => {
      await upgradeAbility(ab.id);
      closeModal(false);
      openModal(ab);
    });
    upgradeBtn.addEventListener('mouseenter', () => {
      upgradeBtn.style.background = 'rgba(0,255,102,0.13)';
      upgradeBtn.style.borderColor = 'rgba(0,255,102,0.65)';
    });
    upgradeBtn.addEventListener('mouseleave', () => {
      upgradeBtn.style.background = 'rgba(0,255,102,0.07)';
      upgradeBtn.style.borderColor = 'rgba(0,255,102,0.45)';
    });
  }

  const equipBtn = document.getElementById('modal-equip-btn');
  if (equipBtn && !equipBtn.disabled) {
    equipBtn.addEventListener('click', async () => {
      if (typeof playSelectSound === 'function') playSelectSound();
      if (isEquipped) {
        await unequipAbility(ab.id);
      } else {
        await equipAbility(ab.id);
      }
      closeModal(false);
      openModal(ab);
    });
  }

  // Close on overlay backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function closeModal(playSound = true) {
  if (playSound && typeof playSelectSound === 'function') playSelectSound();
  const overlay = document.getElementById('ability-modal-overlay');
  if (overlay) overlay.remove();
}

// ═══════════════════════════════════════════
//  RENDER — Simplified grid cards
// ═══════════════════════════════════════════

function renderAbilities() {
  const grid = document.getElementById('abilities-grid');
  grid.innerHTML = '';

  ABILITIES.forEach(ab => {
    const rarity = RARITY[ab.rarity];
    const info = getProgressInfo(ab.id);
    const isEquipped = equippedAbilities.includes(ab.id);
    const hasCards = info.level >= 1;
    const isMax = info.level >= MAX_LEVEL;

    // Upgrade available indicator
    let canUpgrade = false;
    if (hasCards && !isMax) {
      const silverCost = getSilverCost(ab.rarity, info.level);
      const cardsReady = info.cardsTowardNext >= info.cardsNeeded;
      const silverReady = serverSilver >= silverCost;
      canUpgrade = cardsReady && silverReady;
    }

    const card = document.createElement('div');
    card.className = [
      'ability-card',
      hasCards ? 'has-cards' : '',
      isEquipped ? 'equipped' : '',
    ].filter(Boolean).join(' ');
    card.style.setProperty('--rarity-color', rarity.color);
    card.style.cursor = 'pointer';
    card.style.userSelect = 'none';

    const iconColor = hasCards ? rarity.color : 'rgba(255,255,255,0.14)';
    const iconGlow  = hasCards ? `0 0 14px ${rarity.color}` : 'none';

    // LVL badge
    let lvlBadgeHTML;
    if (!hasCards) {
      lvlBadgeHTML = `<span style="
        font-family:'Orbitron',sans-serif;
        font-size:0.48rem;
        letter-spacing:2px;
        color:rgba(255,255,255,0.18);
      ">${(typeof t === 'function' ? t('abilities.no_cards') : 'SIN CARTAS')}</span>`;
    } else if (isMax) {
      lvlBadgeHTML = `<span style="
        font-family:'Orbitron',sans-serif;
        font-size:0.52rem;
        font-weight:700;
        letter-spacing:2px;
        color:#ffaa00;
        text-shadow:0 0 6px rgba(255,170,0,0.6);
      ">${(typeof t === 'function' ? t('abilities.lvl_max') : 'LVL MAX')}</span>`;
    } else {
      lvlBadgeHTML = `<span style="
        font-family:'Orbitron',sans-serif;
        font-size:0.52rem;
        font-weight:700;
        letter-spacing:2px;
        color:${rarity.color};
        text-shadow:0 0 5px ${rarity.color};
      ">${(typeof t === 'function' ? t('abilities.lvl') : 'LVL')} ${info.level}</span>`;
    }

    // Upgrade arrow indicator (top-right)
    const upgradeArrow = canUpgrade ? `
      <div style="
        position:absolute;
        top:6px;
        right:8px;
        color:#00ff66;
        font-size:0.75rem;
        text-shadow:0 0 8px #00ff66;
        line-height:1;
      ">&#11014;</div>
    ` : '';

    // Equipped dot indicator
    const equippedDot = isEquipped ? `
      <div style="
        width:7px;
        height:7px;
        border-radius:50%;
        background:#00ff66;
        box-shadow:0 0 6px #00ff66;
        flex-shrink:0;
      "></div>
    ` : '';

    card.innerHTML = `
      ${upgradeArrow}

      <!-- Icon -->
      <div class="ab-icon-col" style="color:${iconColor};text-shadow:${iconGlow};">${ab.icon}</div>

      <!-- Center body -->
      <div style="
        flex:1;
        display:flex;
        flex-direction:column;
        justify-content:center;
        gap:5px;
        padding:14px 10px 14px 0;
        min-width:0;
      ">
        <!-- Name row -->
        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
          <span style="
            font-family:'Orbitron',sans-serif;
            font-size:0.82rem;
            font-weight:900;
            letter-spacing:2px;
            color:${hasCards ? rarity.color : 'rgba(255,255,255,0.22)'};
          ">${(typeof t === 'function' ? t('ability.' + ab.id) : ab.name)}</span>
          <span style="
            font-family:'Share Tech Mono',monospace;
            font-size:0.48rem;
            letter-spacing:2px;
            padding:2px 6px;
            border:1px solid ${rarity.border};
            color:${rarity.color};
            opacity:${hasCards ? 1 : 0.4};
          ">${(typeof t === 'function' ? t('rarity.' + ab.rarity) : rarity.label)}</span>
        </div>

        <!-- Level + equipped dot -->
        <div style="display:flex;align-items:center;gap:8px;">
          ${lvlBadgeHTML}
          ${equippedDot}
        </div>
      </div>
    `;

    // Tap to open detail modal
    card.addEventListener('click', () => openModal(ab));

    grid.appendChild(card);
  });

  // ── Back button sound (wired once) ──
  const backBtn = document.querySelector('.back-btn');
  if (backBtn && !backBtn._soundBound) {
    backBtn._soundBound = true;
    backBtn.addEventListener('click', () => {
      if (typeof playSelectSound === 'function') playSelectSound();
    });
  }
}

// ── Upgrade (costs cards + silver) ──
async function upgradeAbility(abilityId) {
  try {
    const res = await fetch('/api/abilities/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abilityId }),
    });
    const data = await res.json();
    if (res.ok) {
      if (typeof playBuySound === 'function') playBuySound();
      abilityLevels[abilityId] = data.newLevel;
      serverSilver = data.silverCoins;
      updateUI();
    } else {
      if (typeof playDenySound === 'function') playDenySound();
    }
  } catch (e) {
    if (typeof playDenySound === 'function') playDenySound();
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
