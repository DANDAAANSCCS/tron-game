// ═══════════════════════════════════════════
//  upgrades-panel.js — In-game upgrade system logic and UI panel
//  Depends on: config.js, particles.js (spawnFloatingText, spawnRewardPopup)
// ═══════════════════════════════════════════

function getUpgradePerLevel(upg) {
  // Base % + 1% per tier
  return upg.basePerLevel + upg.tier * 0.01;
}

function getUpgradeDesc(upg) {
  const pct = Math.round(getUpgradePerLevel(upg) * 100);
  if (upg === upgrades.precision) return `-${pct}% ${upg.descBase}`;
  return `+${pct}% ${upg.descBase}`;
}

function getPipLevel(upg) {
  // Level within current tier (0-9)
  return upg.level % PIPS_PER_TIER;
}

function getUpgradeCost(upg) {
  return Math.round(upg.baseCost * Math.pow(UPGRADE_COST_SCALE, upg.level));
}

function getUpgradeValue(upg) {
  // Sum of all levels with their respective tier bonuses
  let total = 0;
  let lvl = 0;
  let t_tier = 0;
  while (lvl < upg.level) {
    const tierEnd = Math.min(upg.level, (t_tier + 1) * PIPS_PER_TIER);
    const count = tierEnd - lvl;
    const perLvl = upg.basePerLevel + t_tier * 0.01;
    total += count * perLvl;
    lvl = tierEnd;
    t_tier++;
  }
  return total;
}

function getCurrentDamage() {
  return BULLET_DAMAGE * (1 + getUpgradeValue(upgrades.damage) + permBonus.damage);
}

function getCurrentFireRate(base) {
  const reduction = getUpgradeValue(upgrades.fireRate) + permBonus.fireRate;
  return Math.max(2, Math.round(base * (1 - reduction)));
}

function getCurrentSpread() {
  const reduction = getUpgradeValue(upgrades.precision) + permBonus.precision;
  return BASE_BULLET_SPREAD * Math.max(0.05, 1 - reduction);
}

function getDoubleBulletChance() {
  return Math.min(upgrades.doubleBul.max, getUpgradeValue(upgrades.doubleBul));
}

function getCurrentMaxHp() {
  return Math.round(PLAYER_MAX_HP * (1 + getUpgradeValue(upgrades.health) + permBonus.health));
}

function buyUpgrade(key) {
  const upg = upgrades[key];
  const cost = getUpgradeCost(upg);
  if (gold < cost) {
    if (typeof playDenySound === 'function') playDenySound();
    return false;
  }
  if (key === 'doubleBul' && getUpgradeValue(upg) >= upg.max) {
    if (typeof playDenySound === 'function') playDenySound();
    return false;
  }
  gold -= cost;
  upg.level++;

  // Check tier up (every 10 levels)
  if (upg.level % PIPS_PER_TIER === 0) {
    upg.tier++;
    spawnFloatingText(turret.x, turret.y - 70, `TIER ${upg.tier + 1}!`, upg.color);
    spawnRewardPopup(`${upg.label} TIER UP!`, upg.color);
  }

  // Apply health upgrade immediately
  if (key === 'health' && turret) {
    const newMax = getCurrentMaxHp();
    const hpGain = newMax - turret.maxHp;
    turret.maxHp = newMax;
    turret.hp = Math.min(turret.hp + hpGain, turret.maxHp);
  }

  spawnFloatingText(turret.x, turret.y - 50, (typeof t === 'function' ? t('game.upgraded') : 'UPGRADED!'), upg.color);
  if (typeof playBuySound === 'function') playBuySound();
  return true;
}

// ── Upgrades Panel ──
function drawUpgradesPanel() {
  if (!upgradesPanelOpen) {
    // HTML button #touch-upgrades-btn handles the toggle on mobile — nothing to draw here
    return;
  }

  const upgradeKeys = ['damage', 'fireRate', 'precision', 'doubleBul', 'health'];
  const panelW = Math.min(440, canvas.width - 40);
  const rowH = 50;
  const panelH = 80 + upgradeKeys.length * rowH + 25;
  const px = (canvas.width - panelW) / 2;
  const py = (canvas.height - panelH) / 2 - 10;

  ctx.save();

  // Panel background
  ctx.fillStyle = 'rgba(3, 3, 12, 0.93)';
  ctx.fillRect(px, py, panelW, panelH);

  // Panel border
  ctx.strokeStyle = 'rgba(0, 255, 242, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, panelW, panelH);

  // Corner accents
  const cs = 15;
  ctx.strokeStyle = COL.cyan;
  ctx.lineWidth = 2;
  ctx.shadowColor = COL.cyan;
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(px, py + cs); ctx.lineTo(px, py); ctx.lineTo(px + cs, py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px + panelW - cs, py); ctx.lineTo(px + panelW, py); ctx.lineTo(px + panelW, py + cs); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, py + panelH - cs); ctx.lineTo(px, py + panelH); ctx.lineTo(px + cs, py + panelH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px + panelW - cs, py + panelH); ctx.lineTo(px + panelW, py + panelH); ctx.lineTo(px + panelW, py + panelH - cs); ctx.stroke();
  ctx.shadowBlur = 0;

  // Close button (X) — top-right corner, detected by touch in input.js
  const closeBtnX = px + panelW - 30;
  const closeBtnY = py + 10;
  const closeBtnSize = 20;
  ctx.strokeStyle = COL.cyan;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = COL.cyan;
  ctx.shadowBlur = 6;
  ctx.strokeRect(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);
  ctx.font = '700 12px Share Tech Mono';
  ctx.fillStyle = COL.cyan;
  ctx.textAlign = 'center';
  ctx.fillText('X', closeBtnX + closeBtnSize / 2, closeBtnY + 14);
  ctx.shadowBlur = 0;

  // Title
  ctx.font = '900 18px Orbitron';
  ctx.fillStyle = COL.cyan;
  ctx.shadowColor = COL.cyan;
  ctx.shadowBlur = 12;
  ctx.textAlign = 'center';
  ctx.fillText((typeof t === 'function' ? t('panel.upgrades') : 'UPGRADES'), px + panelW / 2, py + 30);
  ctx.shadowBlur = 0;

  // Gold display
  ctx.font = '700 13px Share Tech Mono';
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 6;
  ctx.fillText((typeof t === 'function' ? t('panel.gold') : 'GOLD') + ': ' + gold, px + panelW / 2, py + 50);
  ctx.shadowBlur = 0;

  // Separator
  ctx.strokeStyle = 'rgba(0, 255, 242, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px + 20, py + 60); ctx.lineTo(px + panelW - 20, py + 60); ctx.stroke();

  // Rows
  const startY = py + 70;
  const pipStartX = px + Math.min(268, panelW * 0.6);

  for (let i = 0; i < upgradeKeys.length; i++) {
    const key = upgradeKeys[i];
    const upg = upgrades[key];
    const cost = getUpgradeCost(upg);
    const isMaxed = key === 'doubleBul' && getUpgradeValue(upg) >= upg.max;
    const canBuy = gold >= cost && !isMaxed;
    const ry = startY + i * rowH;
    const pipLvl = getPipLevel(upg);
    const tierNum = upg.tier;

    // Row bg
    ctx.fillStyle = canBuy ? 'rgba(0, 255, 242, 0.03)' : 'rgba(255, 255, 255, 0.01)';
    ctx.fillRect(px + 12, ry, panelW - 24, rowH - 4);
    ctx.strokeStyle = canBuy ? `${upg.color}44` : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 12, ry, panelW - 24, rowH - 4);

    // Key number
    ctx.font = '900 15px Orbitron';
    ctx.fillStyle = canBuy ? upg.color : 'rgba(255, 255, 255, 0.2)';
    ctx.shadowColor = canBuy ? upg.color : 'transparent';
    ctx.shadowBlur = canBuy ? 8 : 0;
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, px + 32, ry + 28);
    ctx.shadowBlur = 0;

    // Icon
    ctx.font = '18px sans-serif';
    ctx.fillText(upg.icon, px + 58, ry + 28);

    // Label + tier badge
    const UPGRADE_KEY_MAP = { damage: 'damage', fireRate: 'fire_rate', precision: 'precision', doubleBul: 'double_shot', health: 'health' };
    const i18nKey = UPGRADE_KEY_MAP[key];
    const displayLabel = (typeof t === 'function' && i18nKey ? t('upgrade.' + i18nKey) : '') || upg.label;
    ctx.font = '700 12px Orbitron';
    ctx.fillStyle = canBuy ? '#fff' : 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'left';
    ctx.fillText(displayLabel, px + 80, ry + 18);

    // Tier badge
    if (tierNum > 0) {
      const tierText = `T${tierNum + 1}`;
      const tx = px + 80 + ctx.measureText(displayLabel).width + 8;
      ctx.font = '700 8px Orbitron';
      ctx.fillStyle = upg.color;
      ctx.shadowColor = upg.color;
      ctx.shadowBlur = 4;
      // Badge bg
      const tw = ctx.measureText(tierText).width + 6;
      ctx.fillStyle = `${upg.color}22`;
      ctx.fillRect(tx - 3, ry + 9, tw, 12);
      ctx.strokeStyle = `${upg.color}66`;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(tx - 3, ry + 9, tw, 12);
      ctx.fillStyle = upg.color;
      ctx.fillText(tierText, tx, ry + 18);
      ctx.shadowBlur = 0;
    }

    // Description (dynamic)
    ctx.font = '600 10px Share Tech Mono';
    ctx.fillStyle = canBuy ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)';
    ctx.textAlign = 'left';
    const desc = getUpgradeDesc(upg);
    const totalPct = Math.round(getUpgradeValue(upg) * 100);
    ctx.fillText(desc + '  [' + (typeof t === 'function' ? t('panel.total') : 'total') + ': ' + totalPct + '%]', px + 80, ry + 33);

    // Progress pips (10 per tier, fills and resets)
    const maxPips = PIPS_PER_TIER;
    const pipW = 7;
    const pipH = 4;
    for (let p = 0; p < maxPips; p++) {
      const filled = p < pipLvl;
      ctx.fillStyle = filled ? upg.color : 'rgba(255, 255, 255, 0.06)';
      if (filled) {
        ctx.shadowColor = upg.color;
        ctx.shadowBlur = 3;
      }
      ctx.fillRect(pipStartX + p * (pipW + 2), ry + 12, pipW, pipH);
      ctx.shadowBlur = 0;
    }

    // Tier label under pips
    ctx.font = '600 7px Share Tech Mono';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.textAlign = 'center';
    ctx.fillText((typeof t === 'function' ? t('panel.lvl') : 'LVL') + ' ' + upg.level, pipStartX + (maxPips * (pipW + 2)) / 2 - 1, ry + 24);

    // Cost / MAX
    ctx.font = '700 11px Orbitron';
    ctx.textAlign = 'right';
    if (isMaxed) {
      ctx.fillStyle = upg.color;
      ctx.shadowColor = upg.color;
      ctx.shadowBlur = 6;
      ctx.fillText((typeof t === 'function' ? t('panel.max') : 'MAX'), px + panelW - 22, ry + 28);
    } else {
      ctx.fillStyle = canBuy ? '#ffd700' : 'rgba(255, 200, 0, 0.25)';
      ctx.shadowColor = canBuy ? '#ffd700' : 'transparent';
      ctx.shadowBlur = canBuy ? 4 : 0;
      ctx.fillText(`${cost}g`, px + panelW - 22, ry + 28);
    }
    ctx.shadowBlur = 0;
  }

  // Close hint
  ctx.font = '600 10px Share Tech Mono';
  ctx.fillStyle = 'rgba(0, 255, 242, 0.4)';
  ctx.textAlign = 'center';
  ctx.fillText((typeof t === 'function' ? t('panel.tap_buy') : 'TAP UPGRADE TO BUY | TAP X TO CLOSE'), px + panelW / 2, py + panelH - 10);

  ctx.restore();
}
