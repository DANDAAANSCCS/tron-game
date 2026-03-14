// ═══════════════════════════════════════════
//  emp.js — All 6 auto-triggered abilities: trigger, update, draw
//  Abilities: emp, shield, rapidfire, chain, freeze, orbital
//  Depends on: config.js, server-data.js, particles.js
// ═══════════════════════════════════════════

// ── Ability definitions with per-level scaling (levels 1–20) ──
const ABILITY_DEFS = {
  emp: {
    baseDamage: 60,     dmgPerLevel: 8,      // lv1→60  lv20→212
    baseRadius: 350,    radiusPerLevel: 15,   // lv1→350 lv20→635
    baseCooldown: 600,  cdPerLevel: -15,      // lv1→600 lv20→315 frames
  },
  shield: {
    baseAbsorb: 50,     absorbPerLevel: 10,   // lv1→50  lv20→240
    baseDuration: 300,  durPerLevel: 10,      // lv1→300 lv20→490 frames
    baseCooldown: 900,  cdPerLevel: -20,      // lv1→900 lv20→520 frames
  },
  rapidfire: {
    baseBoost: 0.5,     boostPerLevel: 0.03,  // lv1→0.50 lv20→1.07
    baseDuration: 240,  durPerLevel: 8,       // lv1→240 lv20→392 frames
    baseCooldown: 1200, cdPerLevel: -25,      // lv1→1200 lv20→725 frames
  },
  chain: {
    baseDamage: 40,     dmgPerLevel: 6,       // lv1→40  lv20→154
    baseBounces: 3,     bouncesPerLevel: 0.5, // lv1→3   lv20→12 (floored)
    baseCooldown: 720,  cdPerLevel: -15,      // lv1→720 lv20→435 frames
  },
  freeze: {
    baseSlow: 0.5,      slowPerLevel: 0.015,  // lv1→0.50 lv20→0.785 slow fraction
    baseDuration: 180,  durPerLevel: 8,       // lv1→180 lv20→332 frames
    baseCooldown: 1500, cdPerLevel: -30,      // lv1→1500 lv20→930 frames
    baseRadius: 400,    radiusPerLevel: 15,   // lv1→400 lv20→685
  },
  orbital: {
    baseDamage: 300,    dmgPerLevel: 25,      // lv1→300 lv20→775
    baseRadius: 500,    radiusPerLevel: 20,   // lv1→500 lv20→880
    baseCooldown: 2700, cdPerLevel: -50,      // lv1→2700 lv20→1750 frames
  },
};

// ── Ability runtime state ──
let abilityCooldowns = {};      // { abilityId: framesRemaining }

let shieldActive = false;
let shieldHp = 0;
let shieldTimer = 0;

let rapidfireActive = false;
let rapidfireTimer = 0;
let currentRapidfireBoost = 0;

let freezeActive = false;
let freezeTimer = 0;
let currentFreezeSlowAmount = 0;

// Visual effect pools
let chainLightningLines = [];   // [{ x1, y1, x2, y2, life, maxLife }]
let orbitalExplosions = [];     // [{ x, y, radius, maxRadius, life, maxLife }]
let freezeRings = [];           // [{ x, y, radius, maxRadius, life, maxLife }]
let shieldRingPulse = 0;        // animation counter for shield glow

// ── Helper: compute a scaled stat for a given ability ──
function getAbilityStat(abilityId, statName) {
  const def = ABILITY_DEFS[abilityId];
  if (!def) return 0;
  const level = getAbilityLevel(abilityId);
  if (level <= 0) return 0;
  const key = statName.charAt(0).toUpperCase() + statName.slice(1);
  const base = def['base' + key];
  const perLevel = def[statName + 'PerLevel'];
  if (base === undefined) return 0;
  return base + (level - 1) * (perLevel || 0);
}

// ── Reset all ability state (called from initGame) ──
function resetAbilities() {
  abilityCooldowns = {};
  shieldActive = false;
  shieldHp = 0;
  shieldTimer = 0;
  rapidfireActive = false;
  rapidfireTimer = 0;
  currentRapidfireBoost = 0;
  freezeActive = false;
  freezeTimer = 0;
  currentFreezeSlowAmount = 0;
  chainLightningLines = [];
  orbitalExplosions = [];
  freezeRings = [];
  shieldRingPulse = 0;
  abilityEffects = [];
}

// ════════════════════════════════════════════
//  ABILITY TRIGGER FUNCTIONS
// ════════════════════════════════════════════

// ── EMP: area damage + knockback + cyan wave visual ──
function triggerEMP() {
  if (!turret.alive) return;
  if (typeof playEMPSound === 'function') playEMPSound();
  const damage = getAbilityStat('emp', 'damage');
  const radius = getAbilityStat('emp', 'radius');

  empWaves.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: radius, life: 35 });

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dist = Math.hypot(enemy.x - turret.x, enemy.y - turret.y);
    if (dist < radius) {
      enemy.takeDamage(damage);
      const angle = Math.atan2(enemy.y - turret.y, enemy.x - turret.x);
      enemy.x += Math.cos(angle) * 50;
      enemy.y += Math.sin(angle) * 50;
    }
  }

  // Particles
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    spawnParticle(
      turret.x + Math.cos(a) * r, turret.y + Math.sin(a) * r,
      Math.cos(a) * 3, Math.sin(a) * 3,
      i % 3 === 0 ? COL.white : COL.cyan,
      15 + Math.random() * 25, 1.5 + Math.random() * 2);
  }

  camera.shakeX = (Math.random() - 0.5) * 12;
  camera.shakeY = (Math.random() - 0.5) * 12;
}

// ── Shield: absorb incoming damage for a duration ──
function triggerShield() {
  if (!turret.alive) return;
  if (typeof playShieldSound === 'function') playShieldSound();
  const absorb = getAbilityStat('shield', 'absorb');
  const duration = getAbilityStat('shield', 'duration');

  shieldActive = true;
  shieldHp = absorb;
  shieldTimer = Math.round(duration);
  shieldRingPulse = 0;

  // Burst particles around turret
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    spawnParticle(
      turret.x + Math.cos(a) * 38, turret.y + Math.sin(a) * 38,
      Math.cos(a) * 1.5, Math.sin(a) * 1.5,
      COL.cyan, 20 + Math.random() * 20, 2);
  }
}

// ── Rapidfire: boost turret fire rate for a duration ──
function triggerRapidfire() {
  if (!turret.alive) return;
  if (typeof playLevelUpSound === 'function') playLevelUpSound();
  const boost = getAbilityStat('rapidfire', 'boost');
  const duration = getAbilityStat('rapidfire', 'duration');

  rapidfireActive = true;
  rapidfireTimer = Math.round(duration);
  currentRapidfireBoost = boost;

  // Orange burst particles
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 20 + Math.random() * 20;
    spawnParticle(
      turret.x + Math.cos(a) * r, turret.y + Math.sin(a) * r,
      Math.cos(a) * 2, Math.sin(a) * 2,
      COL.orange, 15 + Math.random() * 15, 2);
  }
}

// ── Chain: lightning that bounces between nearby enemies ──
function triggerChain() {
  if (!turret.alive) return;
  if (typeof playChainSound === 'function') playChainSound();
  const damage = getAbilityStat('chain', 'damage');
  const bounces = Math.floor(getAbilityStat('chain', 'bounces'));
  const BOUNCE_RANGE = 200;

  const aliveEnemies = enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) return;

  // Find the nearest enemy to the turret as the first target
  let current = null;
  let minDist = Infinity;
  for (const e of aliveEnemies) {
    const d = Math.hypot(e.x - turret.x, e.y - turret.y);
    if (d < minDist) { minDist = d; current = e; }
  }
  if (!current) return;

  const hit = new Set();
  hit.add(current);

  // Draw lightning from turret to first target
  chainLightningLines.push({
    x1: turret.x, y1: turret.y,
    x2: current.x, y2: current.y,
    life: 20, maxLife: 20,
  });
  current.takeDamage(damage);

  // Bounce
  for (let b = 0; b < bounces; b++) {
    let next = null;
    let nextDist = Infinity;
    for (const e of aliveEnemies) {
      if (hit.has(e)) continue;
      const d = Math.hypot(e.x - current.x, e.y - current.y);
      if (d < BOUNCE_RANGE && d < nextDist) { nextDist = d; next = e; }
    }
    if (!next) break;

    chainLightningLines.push({
      x1: current.x, y1: current.y,
      x2: next.x, y2: next.y,
      life: 20, maxLife: 20,
    });
    next.takeDamage(damage);
    hit.add(next);
    current = next;
  }
}

// ── Freeze: slow all enemies in radius for a duration ──
function triggerFreeze() {
  if (!turret.alive) return;
  if (typeof playFreezeSound === 'function') playFreezeSound();
  const slow = getAbilityStat('freeze', 'slow');
  const duration = getAbilityStat('freeze', 'duration');
  const radius = getAbilityStat('freeze', 'radius');

  freezeActive = true;
  freezeTimer = Math.round(duration);
  currentFreezeSlowAmount = slow;

  // Expanding blue ring visual
  freezeRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: radius, life: 30, maxLife: 30 });

  // Blue particles
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    spawnParticle(
      turret.x + Math.cos(a) * r, turret.y + Math.sin(a) * r,
      Math.cos(a) * 1.5, Math.sin(a) * 1.5,
      COL.blue, 15 + Math.random() * 15, 1.5);
  }
}

// ── Orbital: massive damage in radius around a random enemy cluster ──
function triggerOrbital() {
  if (!turret.alive) return;
  if (typeof playOrbitalSound === 'function') playOrbitalSound();
  const damage = getAbilityStat('orbital', 'damage');
  const radius = getAbilityStat('orbital', 'radius');

  const aliveEnemies = enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) return;

  // Pick a random alive enemy as the epicenter
  const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  const cx = target.x;
  const cy = target.y;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dist = Math.hypot(enemy.x - cx, enemy.y - cy);
    if (dist < radius) {
      enemy.takeDamage(damage);
    }
  }

  // Expanding red/orange explosion ring
  orbitalExplosions.push({ x: cx, y: cy, radius: 0, maxRadius: radius, life: 40, maxLife: 40 });

  // Red/orange burst particles
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    spawnParticle(
      cx + Math.cos(a) * r, cy + Math.sin(a) * r,
      Math.cos(a) * (2 + Math.random() * 4), Math.sin(a) * (2 + Math.random() * 4),
      i % 3 === 0 ? COL.yellow : i % 3 === 1 ? COL.orange : COL.red,
      20 + Math.random() * 30, 2 + Math.random() * 2);
  }

  // Strong screen shake
  camera.shakeX = (Math.random() - 0.5) * 20;
  camera.shakeY = (Math.random() - 0.5) * 20;
}

// ════════════════════════════════════════════
//  MAIN UPDATE — called once per frame from gameLoop
// ════════════════════════════════════════════

function updateAbilities() {
  const equipped = serverGameData.equippedAbilities || [];
  const hasLiveEnemy = enemies.some(e => e.alive);

  for (const id of equipped) {
    if (!hasAbility(id)) continue;
    const def = ABILITY_DEFS[id];
    if (!def) continue;

    // Initialize cooldown if not yet set
    if (abilityCooldowns[id] === undefined) {
      abilityCooldowns[id] = 0; // start ready
    }

    if (abilityCooldowns[id] > 0) {
      abilityCooldowns[id]--;
    }

    // Auto-trigger when cooldown reaches 0 and there are enemies alive
    if (abilityCooldowns[id] <= 0 && hasLiveEnemy) {
      const cooldown = Math.round(getAbilityStat(id, 'cooldown'));

      switch (id) {
        case 'emp':       triggerEMP();       break;
        case 'shield':    triggerShield();    break;
        case 'rapidfire': triggerRapidfire(); break;
        case 'chain':     triggerChain();     break;
        case 'freeze':    triggerFreeze();    break;
        case 'orbital':   triggerOrbital();   break;
      }

      abilityCooldowns[id] = cooldown;
      _updateAbilityBarCooldown(id, cooldown);
    }
  }

  // ── Update active timed effects ──

  // Shield timer
  if (shieldActive) {
    shieldTimer--;
    shieldRingPulse++;
    if (shieldTimer <= 0 || shieldHp <= 0) {
      shieldActive = false;
      shieldHp = 0;
    }
  }

  // Rapidfire timer
  if (rapidfireActive) {
    rapidfireTimer--;
    if (rapidfireTimer <= 0) {
      rapidfireActive = false;
      currentRapidfireBoost = 0;
    }
  }

  // Freeze timer
  if (freezeActive) {
    freezeTimer--;
    if (freezeTimer <= 0) {
      freezeActive = false;
      currentFreezeSlowAmount = 0;
    }
  }

  // ── Update visual effects ──

  // Chain lightning lines (fade quickly)
  for (let i = chainLightningLines.length - 1; i >= 0; i--) {
    chainLightningLines[i].life--;
    if (chainLightningLines[i].life <= 0) chainLightningLines.splice(i, 1);
  }

  // Orbital explosion rings
  for (let i = orbitalExplosions.length - 1; i >= 0; i--) {
    const o = orbitalExplosions[i];
    o.radius += (o.maxRadius - o.radius) * 0.10;
    o.life--;
    if (o.life <= 0) orbitalExplosions.splice(i, 1);
  }

  // Freeze rings
  for (let i = freezeRings.length - 1; i >= 0; i--) {
    const f = freezeRings[i];
    f.radius += (f.maxRadius - f.radius) * 0.12;
    f.life--;
    if (f.life <= 0) freezeRings.splice(i, 1);
  }
}

// ── Update the ability bar slot UI to show cooldown state ──
function _updateAbilityBarCooldown(id, totalCooldown) {
  const slot = document.getElementById(`ability-${id}`);
  if (!slot) return;
  slot.classList.remove('ready');
  slot.classList.add('cooling');

  // Re-add 'ready' class once cooldown expires (rough approximation in ms)
  const ms = Math.round((totalCooldown / 60) * 1000);
  setTimeout(() => {
    if (slot) {
      slot.classList.remove('cooling');
      slot.classList.add('ready');
    }
  }, ms);
}

// ════════════════════════════════════════════
//  DRAW — called inside the world-space ctx.save/restore block
// ════════════════════════════════════════════

function drawAbilityEffects(ctx) {
  // ── Shield ring around turret ──
  if (shieldActive && turret && turret.alive) {
    const pulse = 0.6 + Math.sin(shieldRingPulse * 0.12) * 0.3;
    const shieldRadius = 46;

    // Outer glow
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 242, ${pulse * 0.5})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner fill
    const grad = ctx.createRadialGradient(turret.x, turret.y, shieldRadius * 0.6, turret.x, turret.y, shieldRadius);
    grad.addColorStop(0, `rgba(0, 255, 242, ${pulse * 0.05})`);
    grad.addColorStop(1, `rgba(0, 255, 242, ${pulse * 0.12})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, shieldRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Rapidfire glow on turret ──
  if (rapidfireActive && turret && turret.alive) {
    const pulse = 0.5 + Math.sin(frameCount * 0.2) * 0.3;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 102, 0, ${pulse * 0.6})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = COL.orange;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Freeze rings (expanding blue ring on trigger) ──
  for (const f of freezeRings) {
    const alpha = f.life / f.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(0, 136, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = COL.blue;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Freeze indicator on active enemies (blue tint ring) ──
  if (freezeActive) {
    ctx.save();
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const pulse = 0.4 + Math.sin(frameCount * 0.1 + enemy.wobble) * 0.2;
      ctx.strokeStyle = `rgba(0, 136, 255, ${pulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = COL.blue;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Chain lightning lines ──
  for (const line of chainLightningLines) {
    const alpha = line.life / line.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 242, ${alpha})`;
    ctx.lineWidth = 2 + alpha * 2;
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur = 12;

    // Jagged lightning path with midpoint displacement
    const mx = (line.x1 + line.x2) / 2 + (Math.random() - 0.5) * 30;
    const my = (line.y1 + line.y2) / 2 + (Math.random() - 0.5) * 30;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(mx, my);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();

    // Bright core
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(mx, my);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Orbital explosion rings ──
  for (const o of orbitalExplosions) {
    const alpha = o.life / o.maxLife;

    ctx.save();
    // Outer shockwave ring
    ctx.strokeStyle = `rgba(255, 102, 0, ${alpha * 0.8})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = COL.orange;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Fill gradient
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
    grad.addColorStop(0, `rgba(255, 220, 0, ${alpha * 0.12})`);
    grad.addColorStop(0.5, `rgba(255, 102, 0, ${alpha * 0.06})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner ring
    ctx.strokeStyle = `rgba(255, 220, 0, ${alpha * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ════════════════════════════════════════════
//  EMP WAVE VISUALS (kept from original)
// ════════════════════════════════════════════

function updateEMPWaves() {
  for (let i = empWaves.length - 1; i >= 0; i--) {
    const w = empWaves[i];
    w.radius += (w.maxRadius - w.radius) * 0.12;
    w.life--;
    if (w.life <= 0) empWaves.splice(i, 1);
  }
}

function drawEMPWaves(ctx) {
  for (const w of empWaves) {
    const alpha = w.life / 35;

    // Outer ring
    ctx.strokeStyle = `rgba(0, 255, 242, ${alpha * 0.7})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Fill
    const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.radius);
    grad.addColorStop(0, `rgba(0, 255, 242, ${alpha * 0.08})`);
    grad.addColorStop(0.7, `rgba(0, 255, 242, ${alpha * 0.03})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner ring
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}
