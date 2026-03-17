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
  plasma_burst:         { icon: '\u25C6' },
  static_field:         { icon: '\u21AF' },
  repair_nanobots:      { icon: '\u2727' },
  shrapnel_mine:        { icon: '\u25B2' },
  targeting_boost:      { icon: '\u25CE' },
  poison_spray:         { icon: '\u2601' },
  energy_wall:          { icon: '\u2295' },
  scatter_shot:         { icon: '\u2726' },
  blind_flash:          { icon: '\u2600' },
  bullet_magnet:        { icon: '\u21DD' },
  gravity_pull:         { icon: '\u25CB' },
  armor_plating:        { icon: '\u25A3' },
  spark_trail:          { icon: '\u2301' },
  micro_missiles:       { icon: '\u25BD' },
  decoy_signal:         { icon: '\u2234' },
  voltaic_aura:         { icon: '\u229B' },
  grease_slick:         { icon: '\u224B' },
  ricochet_round:       { icon: '\u2297' },
  smoke_screen:         { icon: '\u25C7' },
  overcharge_shot:      { icon: '\u2605' },
  seismic_tap:          { icon: '\u25B3' },
  turret_overclock:     { icon: '\u2699' },
  acid_splash:          { icon: '\u22A0' },
  burst_shield:         { icon: '\u229E' },
  energy_spike:         { icon: '\u2739' },
  hail_storm:           { icon: '\u2735' },
  crit_boost:           { icon: '\u2666' },
  web_trap:             { icon: '\u22C6' },
  flare_launch:         { icon: '\u2605' },
  repulsor_blast:       { icon: '\u2660' },
  // Rare
  twin_barrels:         { icon: '\u22BF' },
  chain_burn:           { icon: '\u2622' },
  void_rift:            { icon: '\u27D0' },
  kill_trigger_bomb:    { icon: '\u2620' },
  drone_sentry:         { icon: '\u23E3' },
  lifesteal_rounds:     { icon: '\u2665' },
  tesla_coil:           { icon: '\u238A' },
  mirror_wall:          { icon: '\u25A7' },
  vulnerability_mark:   { icon: '\u2B1F' },
  phantom_barrage:      { icon: '\u25C7' },
  time_slow_field:      { icon: '\u221E' },
  concussive_blast:     { icon: '\u25C6' },
  orbital_mine_ring:    { icon: '\u23DA' },
  shockwave_pulse:      { icon: '\u224B' },
  elemental_infusion:   { icon: '\u2735' },
  spectral_copy:        { icon: '\u22C6' },
  execute_protocol:     { icon: '\u2297' },
  nano_swarm:           { icon: '\u229B' },
  kinetic_surge:        { icon: '\u21AF' },
  scatter_mines:        { icon: '\u25BD' },
  pulse_shield:         { icon: '\u2295' },
  dark_matter_round:    { icon: '\u25CF' },
  beacon_of_weakness:   { icon: '\u2663' },
  cluster_bomb:         { icon: '\u25B2' },
  sonic_boom:           { icon: '\u224B' },
  sniper_scope:         { icon: '\u25CE' },
  overclock_ammo:       { icon: '\u2301' },
  frost_nova:           { icon: '\u2744' },
  momentum_field:       { icon: '\u21DD' },
  toxin_canister:       { icon: '\u2601' },
  // Epic
  blackhole_seed:       { icon: '\u221E' },
  bullet_storm:         { icon: '\u2739' },
  time_reversal:        { icon: '\u2234' },
  ion_cannon:           { icon: '\u22BF' },
  quantum_mirror:       { icon: '\u27D0' },
  plague_cloud:         { icon: '\u2601' },
  turret_fortress:      { icon: '\u2B21' },
  gravity_inverter:     { icon: '\u25C7' },
  energy_leech:         { icon: '\u2665' },
  cryo_freeze:          { icon: '\u2744' },
  death_mark:           { icon: '\u2620' },
  overload_field:       { icon: '\u26A1' },
  antimatter_shell:     { icon: '\u22A0' },
  phase_shift:          { icon: '\u25CB' },
  gravity_well_array:   { icon: '\u238A' },
  singularity_bomb:     { icon: '\u2726' },
  neural_disruptor:     { icon: '\u229B' },
  gravity_lens:         { icon: '\u25CE' },
  chain_reaction:       { icon: '\u269B' },
  temporal_stasis:      { icon: '\u23E3' },
  photon_barrier:       { icon: '\u2295' },
  power_surge:          { icon: '\u2699' },
  warp_field:           { icon: '\u27D0' },
  temporal_dilation:    { icon: '\u2234' },
  spectral_bomb:        { icon: '\u25A7' },
  rewind_damage:        { icon: '\u21DD' },
  prism_array:          { icon: '\u2735' },
  dark_resonance:       { icon: '\u22C6' },
  nanobot_swarm_repair: { icon: '\u2727' },
  nano_heal_aura:       { icon: '\u229E' },
  // Legendary
  cosmic_ray:           { icon: '\u2600' },
  apocalypse_nova:      { icon: '\u2726' },
  time_stop:            { icon: '\u221E' },
  supernova_collapse:   { icon: '\u2605' },
  dimensional_rift:     { icon: '\u25C7' },
  infinite_turret:      { icon: '\u2B21' },
  total_annihilation:   { icon: '\u22A0' },
  vampire_field:        { icon: '\u2665' },
  matrix_hack:          { icon: '\u27D0' },
  solar_flare:          { icon: '\u2600' },
  omega_shield:         { icon: '\u25A3' },
  god_mode:             { icon: '\u2605' },
  paradox_loop:         { icon: '\u23E3' },
  wrath_of_cosmos:      { icon: '\u224B' },
  infinity_mirror:      { icon: '\u25CE' },
  reaper_scythe:        { icon: '\u2694' },
  eternal_storm:        { icon: '\u26A1' },
  void_collapse:        { icon: '\u22BF' },
  entropy_bomb:         { icon: '\u2622' },
  legion_protocol:      { icon: '\u2694' },
  reality_fracture:     { icon: '\u25A7' },
  mass_corruption:      { icon: '\u2620' },
  turret_ascension:     { icon: '\u2739' },
  overdrive_core:       { icon: '\u269B' },
  echo_blast:           { icon: '\u229B' },
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
