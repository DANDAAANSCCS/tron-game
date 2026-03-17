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

// ── Ability registry (all abilities, auto-triggered — no key binding) ──
const ABILITY_REGISTRY = {
  // Original 6
  emp:                  { icon: '\u26A1' },
  shield:               { icon: '\uD83D\uDEE1' },
  rapidfire:            { icon: '\uD83D\uDD25' },
  chain:                { icon: '\u269B' },
  freeze:               { icon: '\u2744' },
  orbital:              { icon: '\u2604' },
  // Common
  plasma_burst:         { icon: '\uD83D\uDD35' },
  static_field:         { icon: '\u26A1' },
  repair_nanobots:      { icon: '\uD83D\uDD27' },
  shrapnel_mine:        { icon: '\uD83D\uDCA3' },
  targeting_boost:      { icon: '\uD83C\uDFAF' },
  poison_spray:         { icon: '\u2620\uFE0F' },
  energy_wall:          { icon: '\uD83D\uDEA7' },
  scatter_shot:         { icon: '\uD83D\uDCA5' },
  blind_flash:          { icon: '\uD83C\uDF1F' },
  bullet_magnet:        { icon: '\uD83E\uDDF2' },
  gravity_pull:         { icon: '\uD83C\uDF00' },
  armor_plating:        { icon: '\uD83D\uDEE1\uFE0F' },
  spark_trail:          { icon: '\u2728' },
  micro_missiles:       { icon: '\uD83D\uDE80' },
  decoy_signal:         { icon: '\uD83D\uDCE1' },
  voltaic_aura:         { icon: '\u2B55' },
  grease_slick:         { icon: '\uD83D\uDEE2\uFE0F' },
  ricochet_round:       { icon: '\u21A9\uFE0F' },
  smoke_screen:         { icon: '\uD83D\uDCA8' },
  overcharge_shot:      { icon: '\uD83D\uDD0B' },
  seismic_tap:          { icon: '\uD83D\uDCA2' },
  turret_overclock:     { icon: '\u2699\uFE0F' },
  acid_splash:          { icon: '\uD83E\uDDEA' },
  burst_shield:         { icon: '\uD83D\uDD35' },
  energy_spike:         { icon: '\uD83D\uDCCC' },
  hail_storm:           { icon: '\uD83C\uDF28\uFE0F' },
  crit_boost:           { icon: '\uD83C\uDFB0' },
  web_trap:             { icon: '\uD83D\uDD78\uFE0F' },
  flare_launch:         { icon: '\uD83D\uDD06' },
  repulsor_blast:       { icon: '\uD83D\uDCAB' },
  // Rare
  twin_barrels:         { icon: '\uD83D\uDD2B' },
  chain_burn:           { icon: '\uD83D\uDD25' },
  void_rift:            { icon: '\uD83D\uDD73\uFE0F' },
  kill_trigger_bomb:    { icon: '\uD83D\uDC80' },
  drone_sentry:         { icon: '\uD83E\uDD16' },
  lifesteal_rounds:     { icon: '\uD83E\uDE78' },
  tesla_coil:           { icon: '\uD83D\uDDFC' },
  mirror_wall:          { icon: '\uD83E\uDEDE' },
  vulnerability_mark:   { icon: '\uD83C\uDFAF' },
  phantom_barrage:      { icon: '\uD83D\uDC7B' },
  time_slow_field:      { icon: '\u23F1\uFE0F' },
  concussive_blast:     { icon: '\uD83D\uDCA3' },
  orbital_mine_ring:    { icon: '\uD83D\uDCA0' },
  shockwave_pulse:      { icon: '\u3030\uFE0F' },
  elemental_infusion:   { icon: '\uD83C\uDF08' },
  spectral_copy:        { icon: '\uD83D\uDC65' },
  execute_protocol:     { icon: '\u2620\uFE0F' },
  nano_swarm:           { icon: '\uD83D\uDC1D' },
  kinetic_surge:        { icon: '\u26A1' },
  scatter_mines:        { icon: '\uD83C\uDF10' },
  pulse_shield:         { icon: '\uD83D\uDD37' },
  dark_matter_round:    { icon: '\u26AB' },
  beacon_of_weakness:   { icon: '\uD83D\uDCC9' },
  cluster_bomb:         { icon: '\uD83D\uDCA3' },
  sonic_boom:           { icon: '\uD83D\uDCE2' },
  sniper_scope:         { icon: '\uD83D\uDD2D' },
  overclock_ammo:       { icon: '\uD83D\uDD04' },
  frost_nova:           { icon: '\uD83C\uDF2C\uFE0F' },
  momentum_field:       { icon: '\uD83C\uDF00' },
  toxin_canister:       { icon: '\uD83E\uDDEB' },
  // Epic
  blackhole_seed:       { icon: '\uD83C\uDF11' },
  bullet_storm:         { icon: '\uD83C\uDF2A\uFE0F' },
  time_reversal:        { icon: '\u23EA' },
  ion_cannon:           { icon: '\uD83D\uDD2D' },
  quantum_mirror:       { icon: '\uD83E\uDE9F' },
  plague_cloud:         { icon: '\u2601\uFE0F' },
  turret_fortress:      { icon: '\uD83C\uDFF0' },
  gravity_inverter:     { icon: '\uD83D\uDD04' },
  energy_leech:         { icon: '\uD83E\uDDA0' },
  cryo_freeze:          { icon: '\u2744\uFE0F' },
  death_mark:           { icon: '\uD83D\uDC80' },
  overload_field:       { icon: '\u26A1' },
  antimatter_shell:     { icon: '\uD83D\uDCA0' },
  phase_shift:          { icon: '\uD83C\uDF0A' },
  gravity_well_array:   { icon: '\uD83D\uDD18' },
  singularity_bomb:     { icon: '\uD83C\uDF20' },
  neural_disruptor:     { icon: '\uD83E\uDDE0' },
  gravity_lens:         { icon: '\uD83D\uDD0D' },
  chain_reaction:       { icon: '\uD83D\uDCA5' },
  temporal_stasis:      { icon: '\u23F8\uFE0F' },
  photon_barrier:       { icon: '\uD83D\uDD36' },
  power_surge:          { icon: '\uD83D\uDD0C' },
  warp_field:           { icon: '\uD83C\uDF0C' },
  temporal_dilation:    { icon: '\uD83D\uDD2E' },
  spectral_bomb:        { icon: '\uD83D\uDC41\uFE0F' },
  rewind_damage:        { icon: '\u23EE\uFE0F' },
  prism_array:          { icon: '\uD83D\uDD3A' },
  dark_resonance:       { icon: '\uD83C\uDF11' },
  nanobot_swarm_repair: { icon: '\uD83E\uDD16' },
  nano_heal_aura:       { icon: '\uD83D\uDC89' },
  // Legendary
  cosmic_ray:           { icon: '\u2600\uFE0F' },
  apocalypse_nova:      { icon: '\uD83C\uDF0B' },
  time_stop:            { icon: '\uD83D\uDD70\uFE0F' },
  supernova_collapse:   { icon: '\uD83C\uDF1F' },
  dimensional_rift:     { icon: '\uD83C\uDF00' },
  infinite_turret:      { icon: '\u267E\uFE0F' },
  total_annihilation:   { icon: '\uD83D\uDCA5' },
  vampire_field:        { icon: '\uD83E\uDDDB' },
  matrix_hack:          { icon: '\uD83D\uDCBB' },
  solar_flare:          { icon: '\uD83C\uDF1E' },
  omega_shield:         { icon: '\uD83D\uDEE1\uFE0F' },
  god_mode:             { icon: '\uD83D\uDC51' },
  paradox_loop:         { icon: '\uD83D\uDD01' },
  wrath_of_cosmos:      { icon: '\uD83C\uDF0C' },
  infinity_mirror:      { icon: '\uD83E\uDEDE' },
  reaper_scythe:        { icon: '\u2694\uFE0F' },
  eternal_storm:        { icon: '\u26C8\uFE0F' },
  void_collapse:        { icon: '\uD83D\uDD2E' },
  entropy_bomb:         { icon: '\u2622\uFE0F' },
  legion_protocol:      { icon: '\u2694\uFE0F' },
  reality_fracture:     { icon: '\uD83D\uDC8E' },
  mass_corruption:      { icon: '\uD83D\uDDA4' },
  turret_ascension:     { icon: '\uD83C\uDFC6' },
  overdrive_core:       { icon: '\u269B\uFE0F' },
  echo_blast:           { icon: '\uD83D\uDCE1' },
};

// Returns true if the player has this ability (cards > 0 OR equipped OR old unlocked)
function hasAbility(id) {
  const cards = serverGameData.abilityCards || {};
  if ((cards[id] || 0) > 0) return true;
  // Fallback: check old unlockedAbilities or equippedAbilities
  if ((serverGameData.unlockedAbilities || []).includes(id)) return true;
  if ((serverGameData.equippedAbilities || []).includes(id)) return true;
  return false;
}

// Returns the current level of an ability (minimum 1 if the ability is owned)
function getAbilityLevel(id) {
  const level = (serverGameData.abilityLevels || {})[id] || 0;
  if (level > 0) return level;
  // If ability is owned but has no level data, assume level 1
  if (hasAbility(id)) return 1;
  return 0;
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
  permBonus.precision = Math.min(1.0, (pu.precision || 0) * 0.10); // cap at 100%
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
