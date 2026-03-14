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

// ── Habilidades equipadas ──
// Registro de habilidades (para generar ability bar)
const ABILITY_REGISTRY = {
  emp: { icon: '\u26A1', key: 'SPACE' },
};

function hasAbility(id) {
  return (serverGameData.equippedAbilities || []).includes(id);
}

function buildAbilityBar() {
  const bar = document.getElementById('ability-bar');
  bar.innerHTML = '';
  const equipped = serverGameData.equippedAbilities || [];
  equipped.forEach(id => {
    const info = ABILITY_REGISTRY[id];
    if (!info) return;
    const slot = document.createElement('div');
    slot.className = 'ability-slot ready';
    slot.id = `ability-${id}`;
    slot.dataset.ability = id;
    slot.innerHTML = `<span class="ability-icon">${info.icon}</span><span class="ability-key">${info.key}</span>`;
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
  if (gameState !== 'playing' || !turret || !turret.alive) return;
  fetch('/api/autosave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wave,
      score,
      gold,
      gems,
      hp: turret.hp,
      totalKills,
      level: currentLevel,
    }),
  }).catch(() => {});
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
