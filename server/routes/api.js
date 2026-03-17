const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// ═══════════════════════════════════════════
//  ABILITY & CHEST DEFINITIONS
// ═══════════════════════════════════════════

const ABILITIES = {
  // ── Original 6 ──
  emp:                    { rarity: 'common' },
  shield:                 { rarity: 'common' },
  rapidfire:              { rarity: 'rare' },
  chain:                  { rarity: 'rare' },
  freeze:                 { rarity: 'epic' },
  orbital:                { rarity: 'legendary' },
  // ── Common ──
  plasma_burst:           { rarity: 'common' },
  static_field:           { rarity: 'common' },
  repair_nanobots:        { rarity: 'common' },
  shrapnel_mine:          { rarity: 'common' },
  targeting_boost:        { rarity: 'common' },
  poison_spray:           { rarity: 'common' },
  energy_wall:            { rarity: 'common' },
  scatter_shot:           { rarity: 'common' },
  blind_flash:            { rarity: 'common' },
  bullet_magnet:          { rarity: 'common' },
  gravity_pull:           { rarity: 'common' },
  armor_plating:          { rarity: 'common' },
  spark_trail:            { rarity: 'common' },
  micro_missiles:         { rarity: 'common' },
  decoy_signal:           { rarity: 'common' },
  voltaic_aura:           { rarity: 'common' },
  grease_slick:           { rarity: 'common' },
  ricochet_round:         { rarity: 'common' },
  smoke_screen:           { rarity: 'common' },
  overcharge_shot:        { rarity: 'common' },
  seismic_tap:            { rarity: 'common' },
  turret_overclock:       { rarity: 'common' },
  acid_splash:            { rarity: 'common' },
  burst_shield:           { rarity: 'common' },
  energy_spike:           { rarity: 'common' },
  hail_storm:             { rarity: 'common' },
  crit_boost:             { rarity: 'common' },
  web_trap:               { rarity: 'common' },
  flare_launch:           { rarity: 'common' },
  repulsor_blast:         { rarity: 'common' },
  // ── Rare ──
  twin_barrels:           { rarity: 'rare' },
  chain_burn:             { rarity: 'rare' },
  void_rift:              { rarity: 'rare' },
  kill_trigger_bomb:      { rarity: 'rare' },
  drone_sentry:           { rarity: 'rare' },
  lifesteal_rounds:       { rarity: 'rare' },
  tesla_coil:             { rarity: 'rare' },
  mirror_wall:            { rarity: 'rare' },
  vulnerability_mark:     { rarity: 'rare' },
  phantom_barrage:        { rarity: 'rare' },
  time_slow_field:        { rarity: 'rare' },
  concussive_blast:       { rarity: 'rare' },
  orbital_mine_ring:      { rarity: 'rare' },
  shockwave_pulse:        { rarity: 'rare' },
  elemental_infusion:     { rarity: 'rare' },
  spectral_copy:          { rarity: 'rare' },
  execute_protocol:       { rarity: 'rare' },
  nano_swarm:             { rarity: 'rare' },
  kinetic_surge:          { rarity: 'rare' },
  scatter_mines:          { rarity: 'rare' },
  pulse_shield:           { rarity: 'rare' },
  dark_matter_round:      { rarity: 'rare' },
  beacon_of_weakness:     { rarity: 'rare' },
  cluster_bomb:           { rarity: 'rare' },
  sonic_boom:             { rarity: 'rare' },
  sniper_scope:           { rarity: 'rare' },
  overclock_ammo:         { rarity: 'rare' },
  frost_nova:             { rarity: 'rare' },
  momentum_field:         { rarity: 'rare' },
  toxin_canister:         { rarity: 'rare' },
  // ── Epic ──
  blackhole_seed:         { rarity: 'epic' },
  bullet_storm:           { rarity: 'epic' },
  time_reversal:          { rarity: 'epic' },
  ion_cannon:             { rarity: 'epic' },
  quantum_mirror:         { rarity: 'epic' },
  plague_cloud:           { rarity: 'epic' },
  turret_fortress:        { rarity: 'epic' },
  gravity_inverter:       { rarity: 'epic' },
  energy_leech:           { rarity: 'epic' },
  cryo_freeze:            { rarity: 'epic' },
  death_mark:             { rarity: 'epic' },
  overload_field:         { rarity: 'epic' },
  antimatter_shell:       { rarity: 'epic' },
  phase_shift:            { rarity: 'epic' },
  gravity_well_array:     { rarity: 'epic' },
  singularity_bomb:       { rarity: 'epic' },
  neural_disruptor:       { rarity: 'epic' },
  gravity_lens:           { rarity: 'epic' },
  chain_reaction:         { rarity: 'epic' },
  temporal_stasis:        { rarity: 'epic' },
  photon_barrier:         { rarity: 'epic' },
  power_surge:            { rarity: 'epic' },
  warp_field:             { rarity: 'epic' },
  temporal_dilation:      { rarity: 'epic' },
  spectral_bomb:          { rarity: 'epic' },
  rewind_damage:          { rarity: 'epic' },
  prism_array:            { rarity: 'epic' },
  dark_resonance:         { rarity: 'epic' },
  nanobot_swarm_repair:   { rarity: 'epic' },
  nano_heal_aura:         { rarity: 'epic' },
  // ── Legendary ──
  cosmic_ray:             { rarity: 'legendary' },
  apocalypse_nova:        { rarity: 'legendary' },
  time_stop:              { rarity: 'legendary' },
  supernova_collapse:     { rarity: 'legendary' },
  dimensional_rift:       { rarity: 'legendary' },
  infinite_turret:        { rarity: 'legendary' },
  total_annihilation:     { rarity: 'legendary' },
  vampire_field:          { rarity: 'legendary' },
  matrix_hack:            { rarity: 'legendary' },
  solar_flare:            { rarity: 'legendary' },
  omega_shield:           { rarity: 'legendary' },
  god_mode:               { rarity: 'legendary' },
  paradox_loop:           { rarity: 'legendary' },
  wrath_of_cosmos:        { rarity: 'legendary' },
  infinity_mirror:        { rarity: 'legendary' },
  reaper_scythe:          { rarity: 'legendary' },
  eternal_storm:          { rarity: 'legendary' },
  void_collapse:          { rarity: 'legendary' },
  entropy_bomb:           { rarity: 'legendary' },
  legion_protocol:        { rarity: 'legendary' },
  reality_fracture:       { rarity: 'legendary' },
  mass_corruption:        { rarity: 'legendary' },
  turret_ascension:       { rarity: 'legendary' },
  overdrive_core:         { rarity: 'legendary' },
  echo_blast:             { rarity: 'legendary' },
};

// Cards needed to reach each level (index 0 = level 2, etc.)
// Level 1 = unlocked at 1 card. Total cards for level 20 = sum + 1 = 2271
const CARDS_PER_LEVEL = [
  1, 2, 4, 8, 12, 18, 25, 35, 45, 60, 80, 100, 130, 160, 200, 250, 300, 380, 460
];

// Cards required to upgrade FROM level N to level N+1
// Index 0 = cards to go from 0→1 (unlock), index 1 = 1→2, etc.
const CARDS_TO_UPGRADE = [1, 2, 4, 8, 12, 18, 25, 35, 45, 60, 80, 100, 130, 160, 200, 250, 300, 380, 460];

// Silver cost per rarity base + 25% increase per level
const SILVER_BASE_COST = { common: 1500, rare: 3000, epic: 5000, legendary: 8000 };
const SILVER_SCALE = 1.25; // 25% more per level

function getSilverCost(rarity, currentLevel) {
  if (currentLevel < 1) return 0; // unlock is free
  const base = SILVER_BASE_COST[rarity] || 1500;
  return Math.round(base * Math.pow(SILVER_SCALE, currentLevel - 1));
}

// Total cards needed to have reached a given level (cumulative)
function cardsNeededForLevel(level) {
  let total = 0;
  for (let i = 0; i < level && i < CARDS_TO_UPGRADE.length; i++) {
    total += CARDS_TO_UPGRADE[i];
  }
  return total;
}

// Chest definitions
const CHESTS = {
  common: {
    cost: 150,
    rarities: ['common', 'rare'],
    rarityWeights: { common: 80, rare: 20 },
    // Cards: 25-90, weighted toward 25
    minCards: 25, maxCards: 90,
  },
  rare: {
    cost: 350,
    rarities: ['rare', 'epic'],
    rarityWeights: { rare: 75, epic: 25 },
    minCards: 10, maxCards: 30,
  },
  epic: {
    cost: 500,
    rarities: ['epic', 'legendary'],
    rarityWeights: { epic: 70, legendary: 30 },
    minCards: 4, maxCards: 8,
  },
};

function weightedCardCount(min, max) {
  // Exponential decay toward min
  const range = max - min;
  const r = Math.random();
  return min + Math.floor(range * Math.pow(r, 2.5));
}

function pickRarity(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [rarity, weight] of entries) {
    r -= weight;
    if (r <= 0) return rarity;
  }
  return entries[0][0];
}

function getAbilitiesByRarity(rarity) {
  return Object.entries(ABILITIES).filter(([, a]) => a.rarity === rarity).map(([id]) => id);
}

function openChest(chestType, ownedCards) {
  const chest = CHESTS[chestType];
  if (!chest) return null;

  const totalCards = weightedCardCount(chest.minCards, chest.maxCards);
  const results = {}; // { abilityId: cardCount }
  const owned = ownedCards || {};

  // Pick 2-4 different abilities first, then distribute all cards among them
  const maxSlots = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
  const selectedAbilities = [];

  for (let s = 0; s < maxSlots; s++) {
    const rarity = pickRarity(chest.rarityWeights);
    const pool = getAbilitiesByRarity(rarity);
    if (pool.length === 0) continue;

    // 80% chance to pick from owned, 20% any
    const ownedPool = pool.filter(id => (owned[id] || 0) > 0);
    let abilityId;
    if (ownedPool.length > 0 && Math.random() < 0.80) {
      abilityId = ownedPool[Math.floor(Math.random() * ownedPool.length)];
    } else {
      abilityId = pool[Math.floor(Math.random() * pool.length)];
    }
    if (!selectedAbilities.includes(abilityId)) {
      selectedAbilities.push(abilityId);
    }
  }

  // Ensure at least 1 ability selected
  if (selectedAbilities.length === 0) {
    const rarity = pickRarity(chest.rarityWeights);
    const pool = getAbilitiesByRarity(rarity);
    if (pool.length > 0) selectedAbilities.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  // Distribute all cards among selected abilities (weighted random)
  for (let i = 0; i < totalCards; i++) {
    const abilityId = selectedAbilities[Math.floor(Math.random() * selectedAbilities.length)];
    results[abilityId] = (results[abilityId] || 0) + 1;
  }

  return { totalCards, results };
}

// ═══════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════

// ── Current user ──
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'NOT AUTHENTICATED' });
  }
  res.json({
    displayName: req.user.displayName,
    username: req.user.username || null,
    email: req.user.email || null,
    hasGoogle: !!req.user.googleId,
  });
});

// ── Auth config ──
router.get('/auth-config', (req, res) => {
  res.json({
    googleEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
});

// ── Game Data ──
router.get('/gamedata', requireAuth, (req, res) => {
  const gd = req.user.gameData || {};
  const abilityCards = gd.abilityCards || {};
  const abilityLevels = gd.abilityLevels || {};

  // Backwards compat: migrate old unlockedAbilities to cards AND persist
  const oldUnlocked = gd.unlockedAbilities || [];
  if (oldUnlocked.length > 0) {
    const migrateUpdate = {};
    for (const id of oldUnlocked) {
      if (!abilityCards[id]) {
        abilityCards[id] = 1;
        abilityLevels[id] = 1;
        migrateUpdate[`gameData.abilityCards.${id}`] = 1;
        migrateUpdate[`gameData.abilityLevels.${id}`] = 1;
      }
    }
    if (Object.keys(migrateUpdate).length > 0) {
      migrateUpdate['gameData.unlockedAbilities'] = [];
      User.findByIdAndUpdate(req.user._id, { $set: migrateUpdate }).catch(() => {});
    }
  }

  // Auto-unlock: if cards >= 1 but level is 0, set level to 1 (free unlock)
  const autoUnlockUpdate = {};
  for (const [id, cards] of Object.entries(abilityCards)) {
    if (cards >= 1 && (!abilityLevels[id] || abilityLevels[id] < 1)) {
      abilityLevels[id] = 1;
      autoUnlockUpdate[`gameData.abilityLevels.${id}`] = 1;
    }
  }
  if (Object.keys(autoUnlockUpdate).length > 0) {
    User.findByIdAndUpdate(req.user._id, { $set: autoUnlockUpdate }).catch(() => {});
  }

  res.json({
    gems: gd.gems || 0,
    silverCoins: gd.silverCoins || 0,
    permUpgrades: gd.permUpgrades || {},
    levelProgress: gd.levelProgress || {},
    abilityCards,
    abilityLevels,
    equippedAbilities: gd.equippedAbilities || [],
    // Send upgrade costs for client display
    cardsToUpgrade: CARDS_TO_UPGRADE,
    silverBaseCost: SILVER_BASE_COST,
    silverScale: SILVER_SCALE,
  });
});

router.post('/gamedata', requireAuth, async (req, res) => {
  try {
    const { gems, silverCoins, permUpgrades, levelProgress } = req.body;
    const update = {};

    if (gems !== undefined) update['gameData.gems'] = gems;
    if (silverCoins !== undefined) update['gameData.silverCoins'] = silverCoins;
    if (permUpgrades) {
      for (const key of ['health', 'damage', 'regen', 'precision', 'fireRate']) {
        if (permUpgrades[key] !== undefined) {
          update[`gameData.permUpgrades.${key}`] = permUpgrades[key];
        }
      }
    }
    if (levelProgress) {
      for (const key of Object.keys(levelProgress)) {
        update[`gameData.levelProgress.${key}`] = levelProgress[key];
      }
    }

    await User.findByIdAndUpdate(req.user._id, { $set: update });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'SAVE FAILED' });
  }
});

// ── Abilities ──
router.get('/abilities', requireAuth, (req, res) => {
  const gd = req.user.gameData || {};
  const abilityCards = gd.abilityCards || {};
  const abilityLevels = gd.abilityLevels || {};

  res.json({
    abilityCards,
    abilityLevels,
    equippedAbilities: gd.equippedAbilities || [],
    cardsToUpgrade: CARDS_TO_UPGRADE,
    silverBaseCost: SILVER_BASE_COST,
    silverScale: SILVER_SCALE,
  });
});

router.post('/abilities/equip', requireAuth, async (req, res) => {
  try {
    const { abilityId } = req.body;
    if (!abilityId) return res.status(400).json({ error: 'MISSING DATA' });

    const user = await User.findById(req.user._id);
    const cards = user.gameData?.abilityCards || {};
    const equipped = user.gameData?.equippedAbilities || [];

    if (!cards[abilityId] || cards[abilityId] <= 0) {
      return res.status(400).json({ error: 'NOT UNLOCKED' });
    }
    if (equipped.includes(abilityId)) {
      return res.status(400).json({ error: 'ALREADY EQUIPPED' });
    }
    if (equipped.length >= 5) {
      return res.status(400).json({ error: 'MAX 5 ABILITIES EQUIPPED' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $push: { 'gameData.equippedAbilities': abilityId },
    });
    res.json({ ok: true, equippedAbilities: [...equipped, abilityId] });
  } catch (err) {
    res.status(500).json({ error: 'EQUIP FAILED' });
  }
});

router.post('/abilities/unequip', requireAuth, async (req, res) => {
  try {
    const { abilityId } = req.body;
    if (!abilityId) return res.status(400).json({ error: 'MISSING DATA' });

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { 'gameData.equippedAbilities': abilityId },
    });

    const user = await User.findById(req.user._id);
    res.json({ ok: true, equippedAbilities: user.gameData?.equippedAbilities || [] });
  } catch (err) {
    res.status(500).json({ error: 'UNEQUIP FAILED' });
  }
});

// ── Ability upgrade (costs cards + silver) ──
router.post('/abilities/upgrade', requireAuth, async (req, res) => {
  try {
    const { abilityId } = req.body;
    if (!abilityId) return res.status(400).json({ error: 'MISSING DATA' });

    const user = await User.findById(req.user._id);
    const cards = user.gameData?.abilityCards || {};
    const levels = user.gameData?.abilityLevels || {};
    const silver = user.gameData?.silverCoins || 0;

    const currentLevel = levels[abilityId] || 0;
    const totalCards = cards[abilityId] || 0;

    if (currentLevel >= 20) return res.status(400).json({ error: 'MAX LEVEL' });
    if (currentLevel < 1) return res.status(400).json({ error: 'NOT UNLOCKED' });

    // Cards needed: total cards consumed up to next level
    const cardsNeeded = cardsNeededForLevel(currentLevel + 1);
    if (totalCards < cardsNeeded) {
      return res.status(400).json({ error: 'NOT ENOUGH CARDS', cardsNeeded, cardsHave: totalCards });
    }

    // Silver cost based on rarity
    const rarity = ABILITIES[abilityId]?.rarity || 'common';
    const silverCost = getSilverCost(rarity, currentLevel);
    if (silver < silverCost) {
      return res.status(400).json({ error: 'NOT ENOUGH SILVER', silverNeeded: silverCost, silverHave: silver });
    }

    const newLevel = currentLevel + 1;
    const newSilver = silver - silverCost;

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        [`gameData.abilityLevels.${abilityId}`]: newLevel,
        'gameData.silverCoins': newSilver,
      }
    });

    res.json({
      ok: true,
      abilityId,
      newLevel,
      silverCoins: newSilver,
      abilityLevels: { ...levels, [abilityId]: newLevel },
    });
  } catch (err) {
    res.status(500).json({ error: 'UPGRADE FAILED' });
  }
});

// ── Chest opening ──
router.post('/chest/open', requireAuth, async (req, res) => {
  try {
    const { chestType } = req.body;
    const chest = CHESTS[chestType];
    if (!chest) return res.status(400).json({ error: 'INVALID CHEST TYPE' });

    const user = await User.findById(req.user._id);
    const gems = user.gameData?.gems || 0;

    if (gems < chest.cost) {
      return res.status(400).json({ error: 'NOT ENOUGH GEMS' });
    }

    const currentCards = user.gameData?.abilityCards || {};
    const drop = openChest(chestType, currentCards);
    if (!drop) return res.status(500).json({ error: 'CHEST OPEN FAILED' });
    const update = { 'gameData.gems': gems - chest.cost };

    for (const [abilityId, count] of Object.entries(drop.results)) {
      const newTotal = (currentCards[abilityId] || 0) + count;
      update[`gameData.abilityCards.${abilityId}`] = newTotal;
    }

    await User.findByIdAndUpdate(req.user._id, { $set: update });

    // Read stored levels for response
    const updatedCards = { ...currentCards };
    for (const [id, count] of Object.entries(drop.results)) {
      updatedCards[id] = (updatedCards[id] || 0) + count;
    }
    const storedLevels = user.gameData?.abilityLevels || {};
    const abilityLevels = { ...storedLevels };

    // Auto-unlock: if any ability now has >= 1 card and level 0, set to level 1
    const autoUnlock = {};
    for (const [id, cards] of Object.entries(updatedCards)) {
      if (cards >= 1 && (!abilityLevels[id] || abilityLevels[id] < 1)) {
        abilityLevels[id] = 1;
        autoUnlock[`gameData.abilityLevels.${id}`] = 1;
      }
    }
    if (Object.keys(autoUnlock).length > 0) {
      await User.findByIdAndUpdate(req.user._id, { $set: autoUnlock });
    }

    res.json({
      ok: true,
      gems: gems - chest.cost,
      drop: drop.results,
      totalCards: drop.totalCards,
      abilityCards: updatedCards,
      abilityLevels,
    });
  } catch (err) {
    res.status(500).json({ error: 'CHEST OPEN FAILED' });
  }
});

// ── Auto-save ──
router.post('/autosave', requireAuth, async (req, res) => {
  try {
    const { wave, score, gold, gems, hp, maxHp, totalKills, level, upgrades } = req.body;
    const sessionState = { wave, score, gold, gems, hp, maxHp, totalKills, level, upgrades, savedAt: Date.now() };
    await User.findByIdAndUpdate(req.user._id, { $set: { 'gameData.sessionState': sessionState } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'AUTOSAVE FAILED' });
  }
});

router.get('/autosave', requireAuth, (req, res) => {
  const ss = req.user.gameData?.sessionState || null;
  res.json({ sessionState: ss });
});

router.delete('/autosave', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { 'gameData.sessionState': null } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'CLEAR FAILED' });
  }
});

// ── Infinite mode: save best score ──
router.post('/infinite/save', requireAuth, async (req, res) => {
  try {
    const { score, wave, timePlayed } = req.body;
    const user = await User.findById(req.user._id);
    const best = user.gameData?.infiniteBest || { score: 0, wave: 0, timePlayed: 0 };

    // Only update if new score is higher
    if (score > best.score) {
      await User.findByIdAndUpdate(req.user._id, {
        $set: {
          'gameData.infiniteBest.score': score,
          'gameData.infiniteBest.wave': wave,
          'gameData.infiniteBest.timePlayed': timePlayed,
        }
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'SAVE FAILED' });
  }
});

// ── Leaderboards ──
router.get('/leaderboard/levels', async (req, res) => {
  try {
    const users = await User.find(
      { 'gameData.levelProgress': { $exists: true } },
      { displayName: 1, username: 1, 'gameData.levelProgress': 1 }
    ).lean();

    const board = users.map(u => {
      const lp = u.gameData?.levelProgress || {};
      let maxWave = 0;
      let maxLevel = 0;
      let totalScore = 0;
      for (const [key, val] of Object.entries(lp)) {
        const lvlNum = parseInt(key.replace('level', ''));
        if (val.completed) maxLevel = Math.max(maxLevel, lvlNum);
        maxWave = Math.max(maxWave, val.waveReached || 0);
        totalScore += val.score || 0;
      }
      return {
        name: u.displayName || u.username || 'Unknown',
        maxLevel,
        maxWave,
        totalScore,
      };
    }).filter(e => e.maxWave > 0)
      .sort((a, b) => b.maxLevel - a.maxLevel || b.maxWave - a.maxWave || b.totalScore - a.totalScore)
      .slice(0, 50);

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: 'LEADERBOARD FAILED' });
  }
});

router.get('/leaderboard/infinite', async (req, res) => {
  try {
    const users = await User.find(
      { 'gameData.infiniteBest.score': { $gt: 0 } },
      { displayName: 1, username: 1, 'gameData.infiniteBest': 1 }
    ).sort({ 'gameData.infiniteBest.score': -1 })
      .limit(50)
      .lean();

    const board = users.map(u => ({
      name: u.displayName || u.username || 'Unknown',
      score: u.gameData?.infiniteBest?.score || 0,
      wave: u.gameData?.infiniteBest?.wave || 0,
      timePlayed: u.gameData?.infiniteBest?.timePlayed || 0,
    }));

    res.json(board);
  } catch (err) {
    res.status(500).json({ error: 'LEADERBOARD FAILED' });
  }
});

module.exports = router;
