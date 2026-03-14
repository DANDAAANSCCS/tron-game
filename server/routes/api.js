const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// ═══════════════════════════════════════════
//  ABILITY & CHEST DEFINITIONS
// ═══════════════════════════════════════════

const ABILITIES = {
  emp:       { rarity: 'common' },
  shield:    { rarity: 'common' },
  rapidfire: { rarity: 'rare' },
  chain:     { rarity: 'rare' },
  freeze:    { rarity: 'epic' },
  orbital:   { rarity: 'legendary' },
};

// Cards needed to reach each level (index 0 = level 2, etc.)
// Level 1 = unlocked at 1 card. Total cards for level 20 = sum + 1 = 2271
const CARDS_PER_LEVEL = [
  1, 2, 4, 8, 12, 18, 25, 35, 45, 60, 80, 100, 130, 160, 200, 250, 300, 380, 460
];

function getAbilityLevel(cards) {
  if (!cards || cards <= 0) return 0;
  let remaining = cards - 1; // 1 card = level 1
  let level = 1;
  for (let i = 0; i < CARDS_PER_LEVEL.length; i++) {
    if (remaining < CARDS_PER_LEVEL[i]) break;
    remaining -= CARDS_PER_LEVEL[i];
    level++;
  }
  return Math.min(level, 20);
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

function openChest(chestType) {
  const chest = CHESTS[chestType];
  if (!chest) return null;

  const totalCards = weightedCardCount(chest.minCards, chest.maxCards);
  const results = {}; // { abilityId: cardCount }

  for (let i = 0; i < totalCards; i++) {
    const rarity = pickRarity(chest.rarityWeights);
    const pool = getAbilitiesByRarity(rarity);
    if (pool.length === 0) continue;
    const abilityId = pool[Math.floor(Math.random() * pool.length)];
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

  // Compute levels from cards
  const abilityLevels = {};
  for (const [id, cards] of Object.entries(abilityCards)) {
    abilityLevels[id] = getAbilityLevel(cards);
  }

  // Backwards compat: migrate old unlockedAbilities to cards
  const oldUnlocked = gd.unlockedAbilities || [];
  for (const id of oldUnlocked) {
    if (!abilityCards[id]) {
      abilityCards[id] = 1;
      abilityLevels[id] = 1;
    }
  }

  res.json({
    gems: gd.gems || 0,
    silverCoins: gd.silverCoins || 0,
    permUpgrades: gd.permUpgrades || {},
    levelProgress: gd.levelProgress || {},
    abilityCards,
    abilityLevels,
    equippedAbilities: gd.equippedAbilities || [],
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
  const abilityLevels = {};
  for (const [id, cards] of Object.entries(abilityCards)) {
    abilityLevels[id] = getAbilityLevel(cards);
  }

  res.json({
    abilityCards,
    abilityLevels,
    equippedAbilities: gd.equippedAbilities || [],
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

    const drop = openChest(chestType);
    if (!drop) return res.status(500).json({ error: 'CHEST OPEN FAILED' });

    // Update cards
    const currentCards = user.gameData?.abilityCards || {};
    const update = { 'gameData.gems': gems - chest.cost };

    for (const [abilityId, count] of Object.entries(drop.results)) {
      const newTotal = (currentCards[abilityId] || 0) + count;
      update[`gameData.abilityCards.${abilityId}`] = newTotal;
    }

    await User.findByIdAndUpdate(req.user._id, { $set: update });

    // Compute new levels for response
    const updatedCards = { ...currentCards };
    for (const [id, count] of Object.entries(drop.results)) {
      updatedCards[id] = (updatedCards[id] || 0) + count;
    }
    const abilityLevels = {};
    for (const [id, cards] of Object.entries(updatedCards)) {
      abilityLevels[id] = getAbilityLevel(cards);
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
    const { wave, score, gold, gems, hp, totalKills, level } = req.body;
    const sessionState = { wave, score, gold, gems, hp, totalKills, level, savedAt: Date.now() };
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

module.exports = router;
