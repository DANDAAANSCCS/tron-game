// ═══════════════════════════════════════════
//  server-data.js — Server communication, abilities, and permanent bonuses
//  Depends on: config.js
// ═══════════════════════════════════════════

async function loadServerGameData() {
  try {
    const res = await fetch('/api/gamedata');
    if (res.ok) serverGameData = await res.json();
  } catch (e) {}
}

// ── Ability registry (all 6 abilities, auto-triggered — no key binding) ──
const ABILITY_REGISTRY = {
  emp:       { icon: '\u26A1' },
  shield:    { icon: '\uD83D\uDEE1' },
  rapidfire: { icon: '\uD83D\uDD25' },
  chain:     { icon: '\u269B' },
  freeze:    { icon: '\u2744' },
  orbital:   { icon: '\u2604' },
};

// Returns true if the player owns at least 1 card for this ability
function hasAbility(id) {
  const cards = serverGameData.abilityCards || {};
  return (cards[id] || 0) > 0;
}

// Returns the current level of an ability (0 = not leveled / not owned)
function getAbilityLevel(id) {
  return (serverGameData.abilityLevels || {})[id] || 0;
}

function buildAbilityBar() {
  const bar = document.getElementById('ability-bar');
  bar.innerHTML = '';
  const equipped = serverGameData.equippedAbilities || [];
  equipped.forEach(id => {
    const info = ABILITY_REGISTRY[id];
    if (!info) return;
    const level = getAbilityLevel(id);
    const slot = document.createElement('div');
    slot.className = 'ability-slot ready';
    slot.id = `ability-${id}`;
    slot.dataset.ability = id;
    // Show icon + level number (abilities are auto-triggered, no key label)
    slot.innerHTML = `<span class="ability-icon">${info.icon}</span><span class="ability-key">Lv${level}</span>`;
    bar.appendChild(slot);
  });
}

async function saveServerGameData(data) {
  try {
    await fetch('/api/gamedata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {}
}

// ── Auto-save periodico (cada 30 segundos) ──
function doAutoSave() {
  if (!turret) return;
  // Save current upgrades state
  const upgradeState = {};
  for (const key in upgrades) {
    upgradeState[key] = { level: upgrades[key].level, tier: upgrades[key].tier };
  }
  fetch('/api/autosave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wave,
      score,
      gold,
      gems,
      hp: turret.hp,
      maxHp: turret.maxHp,
      totalKills,
      level: currentLevel,
      upgrades: upgradeState,
    }),
  }).catch(() => {});
}

// ── Restore session from auto-save ──
function restoreSession(session) {
  if (!session || session.level !== currentLevel) return false;
  wave = session.wave || 1;
  score = session.score || 0;
  gold = session.gold || 0;
  gems = session.gems || 0;
  totalKills = session.totalKills || 0;
  if (turret) {
    turret.hp = session.hp || turret.maxHp;
    if (session.maxHp) turret.maxHp = session.maxHp;
  }
  // Restore in-game upgrades
  if (session.upgrades) {
    for (const key in session.upgrades) {
      if (upgrades[key]) {
        upgrades[key].level = session.upgrades[key].level || 0;
        upgrades[key].tier = session.upgrades[key].tier || 0;
      }
    }
    // Re-apply health upgrade
    if (turret) {
      turret.maxHp = getCurrentMaxHp();
      turret.hp = Math.min(turret.hp, turret.maxHp);
    }
  }
  return true;
}

function applyPermBonuses() {
  const pu = serverGameData.permUpgrades || {};
  permBonus.health    = (pu.health    || 0) * 0.10;
  permBonus.damage    = (pu.damage    || 0) * 0.10;
  permBonus.regen     = (pu.regen     || 0) * 0.10;
  permBonus.precision = (pu.precision || 0) * 0.10;
  permBonus.fireRate  = (pu.fireRate  || 0) * 0.10;
}

// ── Save Progress (server API) ──
async function saveProgress(completed = false) {
  const levelKey = `level${currentLevel}`;
  const existing = (serverGameData.levelProgress || {})[levelKey] || { waveReached: 0, completed: false, timePlayed: 0, score: 0 };

  const sessionTime = Math.floor((Date.now() - levelStartTime) / 1000);

  const levelData = {
    waveReached: Math.max(existing.waveReached, wave),
    completed: existing.completed || completed,
    timePlayed: existing.timePlayed + sessionTime,
    score: Math.max(existing.score, score)
  };

  // Update local cache
  if (!serverGameData.levelProgress) serverGameData.levelProgress = {};
  serverGameData.levelProgress[levelKey] = levelData;
  levelStartTime = Date.now();

  // Bank gems: leer gemas actuales del servidor para no sobreescribir
  const newGems = gems - gemsbanked;
  let totalGems = serverGameData.gems || 0;

  if (newGems > 0) {
    // Leer gemas frescas del servidor para evitar sobreescribir
    try {
      const freshRes = await fetch('/api/gamedata');
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        totalGems = (freshData.gems || 0) + newGems;
      } else {
        totalGems = (serverGameData.gems || 0) + newGems;
      }
    } catch (e) {
      totalGems = (serverGameData.gems || 0) + newGems;
    }
    serverGameData.gems = totalGems;
    gemsbanked = gems;
  }

  // Save to server
  const saveData = { levelProgress: { [levelKey]: levelData } };
  if (newGems > 0) saveData.gems = totalGems;
  saveServerGameData(saveData);
}

// ── Save silver coins (called after roulette) ──
async function saveSilverCoins(amount) {
  if (amount <= 0) return;
  try {
    const freshRes = await fetch('/api/gamedata');
    let total = 0;
    if (freshRes.ok) {
      const freshData = await freshRes.json();
      total = (freshData.silverCoins || 0) + amount;
    } else {
      total = (serverGameData.silverCoins || 0) + amount;
    }
    serverGameData.silverCoins = total;
    saveServerGameData({ silverCoins: total });
  } catch (e) {
    const total = (serverGameData.silverCoins || 0) + amount;
    serverGameData.silverCoins = total;
    saveServerGameData({ silverCoins: total });
  }
}
