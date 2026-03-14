const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

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

// ── Auth config (Google OAuth availability) ──
router.get('/auth-config', (req, res) => {
  res.json({
    googleEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
});

// ── Game Data ──
router.get('/gamedata', requireAuth, (req, res) => {
  const gd = req.user.gameData || {};
  res.json({
    gems: gd.gems || 0,
    silverCoins: gd.silverCoins || 0,
    permUpgrades: gd.permUpgrades || {},
    levelProgress: gd.levelProgress || {},
    unlockedAbilities: gd.unlockedAbilities || [],
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
  res.json({
    unlockedAbilities: req.user.gameData?.unlockedAbilities || [],
    equippedAbilities: req.user.gameData?.equippedAbilities || [],
  });
});

router.post('/abilities/unlock', requireAuth, async (req, res) => {
  try {
    const { abilityId, cost } = req.body;
    if (!abilityId || cost === undefined) {
      return res.status(400).json({ error: 'MISSING DATA' });
    }

    const user = await User.findById(req.user._id);
    const gems = user.gameData?.gems || 0;
    const unlocked = user.gameData?.unlockedAbilities || [];

    if (unlocked.includes(abilityId)) {
      return res.status(400).json({ error: 'ALREADY UNLOCKED' });
    }
    if (gems < cost) {
      return res.status(400).json({ error: 'NOT ENOUGH GEMS' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'gameData.gems': gems - cost },
      $push: { 'gameData.unlockedAbilities': abilityId },
    });

    res.json({ ok: true, gems: gems - cost });
  } catch (err) {
    res.status(500).json({ error: 'UNLOCK FAILED' });
  }
});

router.post('/abilities/equip', requireAuth, async (req, res) => {
  try {
    const { abilityId } = req.body;
    if (!abilityId) return res.status(400).json({ error: 'MISSING DATA' });

    const user = await User.findById(req.user._id);
    const unlocked = user.gameData?.unlockedAbilities || [];
    const equipped = user.gameData?.equippedAbilities || [];

    if (!unlocked.includes(abilityId)) {
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

// ── Auto-save (estado de partida en curso) ──
router.post('/autosave', requireAuth, async (req, res) => {
  try {
    const { wave, score, gold, gems, hp, totalKills, level } = req.body;
    const sessionState = { wave, score, gold, gems, hp, totalKills, level, savedAt: Date.now() };
    // Solo guardar estado de sesion, NO tocar gameData.gems (eso lo hace saveProgress)
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
