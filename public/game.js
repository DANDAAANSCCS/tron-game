// ═══════════════════════════════════════════
//  NEON DEFENSE — Tower Defense with Tron Style
// ═══════════════════════════════════════════

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

// ── Config ──
const MAP_W = 4000;
const MAP_H = 4000;
const CENTER_X = MAP_W / 2;
const CENTER_Y = MAP_H / 2;
const TURRET_RADIUS = 22;
const TURRET_RANGE = 500;
const BULLET_SPEED = 14;
const BULLET_DAMAGE = 25;
const FIRE_RATE_MANUAL = 8;
const FIRE_RATE_AUTO = Math.round(FIRE_RATE_MANUAL * 1.4); // 40% slower
const EMP_COOLDOWN = 600;
const EMP_RADIUS = 350;
const EMP_DAMAGE = 60;
const PLAYER_MAX_HP = 100;

// ── Level config ──
const urlParams = new URLSearchParams(window.location.search);
const currentLevel = parseInt(urlParams.get('level')) || 1;
const MAX_WAVES = 100;
const TANK_START_WAVE = 50;
const BOSS_WAVE = 100;
const STORAGE_KEY = 'neonDefenseProgress';
let levelStartTime = Date.now();

// ── Server data (loaded async before game starts) ──
let serverGameData = { gems: 0, permUpgrades: {}, levelProgress: {}, unlockedAbilities: [], equippedAbilities: [] };

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
let autoSaveTimer = 0;
const AUTOSAVE_INTERVAL = 30 * 60; // 30 seg * 60 fps

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

// ── Permanent upgrades (set after loading from server) ──
const permBonus = { health: 0, damage: 0, regen: 0, precision: 0, fireRate: 0 };

function applyPermBonuses() {
  const pu = serverGameData.permUpgrades || {};
  permBonus.health    = (pu.health    || 0) * 0.10;
  permBonus.damage    = (pu.damage    || 0) * 0.10;
  permBonus.regen     = (pu.regen     || 0) * 0.10;
  permBonus.precision = (pu.precision || 0) * 0.10;
  permBonus.fireRate  = (pu.fireRate  || 0) * 0.10;
}

// ═══════════════════════════════════════════
//  ENEMY TYPES
//  Enemigo 1: Runner   (nivel 1: wave 1+)
//  Enemigo 2: Tank     (nivel 1: wave 50+ / nivel 2: wave 1+)
//  Enemigo 3: Boss     (nivel 1: wave 100)
//  Enemigo 4: Phantom  (nivel 2: wave 71+)
//  Enemigo 5: Sentinel (nivel 2: mini-boss wave 70)
//  Enemigo 6: Overlord (nivel 2: boss wave 100)
// ═══════════════════════════════════════════

// ── Enemigo 1: Runner ──
const ENEMY_BASE_HP = 50;
const ENEMY_BASE_SPEED = 1.2;
const ENEMY_RADIUS = 12;
const ENEMY_DAMAGE = 10;
const ENEMY_ATTACK_RANGE = 40;

// ── Enemigo 2: Tank ──
const TANK_BASE_HP = 300;
const TANK_BASE_SPEED = 0.6;
const TANK_RADIUS = 20;
const TANK_DAMAGE = 20;

// ── Enemigo 3: Boss ──
const BOSS_BASE_HP = 5000;
const BOSS_BASE_SPEED = 0.4;
const BOSS_RADIUS = 40;
const BOSS_DAMAGE = 35;

// ── Enemigo 4: Phantom (nivel 2, wave 71+) ──
const PHANTOM_BASE_HP = 150;
const PHANTOM_BASE_SPEED = 1.0;
const PHANTOM_RADIUS = 14;
const PHANTOM_DAMAGE = 15;

// ── Enemigo 5: Sentinel (mini-boss nivel 2, wave 70) ──
const SENTINEL_BASE_HP = 3000;
const SENTINEL_BASE_SPEED = 0.5;
const SENTINEL_RADIUS = 32;
const SENTINEL_DAMAGE = 25;

// ── Enemigo 6: Overlord (boss nivel 2, wave 100) ──
const OVERLORD_BASE_HP = 8000;
const OVERLORD_BASE_SPEED = 0.35;
const OVERLORD_RADIUS = 45;
const OVERLORD_DAMAGE = 40;

// ── Colors ──
const COL = {
  cyan: '#00fff2',
  orange: '#ff6600',
  red: '#ff0055',
  green: '#00ff66',
  yellow: '#ffdd00',
  purple: '#aa00ff',
  white: '#ffffff',
  blue: '#0088ff',
  teal: '#00ffaa',
};

// ── State ──
let gameState = 'starting';
let frameCount = 0;
let wave = 1;
let score = 0;
let totalKills = 0;

let turret = null;
let bullets = [];
let enemies = [];
let particles = [];
let floatingTexts = [];
let empWaves = [];
let groundDecals = [];

let camera = { x: 0, y: 0, shakeX: 0, shakeY: 0 };
let mouse = { x: 0, y: 0, worldX: CENTER_X, worldY: CENTER_Y };
let mouseDown = false;
let keys = {};

let fireTimer = 0;
let empCooldown = 0;
let autoAimTarget = null;

// ── Currency ──
let gold = 0;
let gems = 0;
let rewardPopups = [];
const BASE_BULLET_SPREAD = 0.32;

// ── Upgrades ──
const PIPS_PER_TIER = 10;
let upgrades = {
  damage:    { level: 0, tier: 0, basePerLevel: 0.05, label: 'DAMAGE',      icon: '⚔', descBase: 'DMG',      color: '#ff4444',  baseCost: 5 },
  fireRate:  { level: 0, tier: 0, basePerLevel: 0.02, label: 'FIRE RATE',   icon: '⚡', descBase: 'SPEED',    color: '#ffdd00',  baseCost: 5 },
  precision: { level: 0, tier: 0, basePerLevel: 0.05, label: 'PRECISION',   icon: '◎', descBase: 'SPREAD',   color: '#00fff2',  baseCost: 5 },
  doubleBul: { level: 0, tier: 0, basePerLevel: 0.02, label: 'DOUBLE SHOT', icon: '⟐', descBase: 'CHANCE',  color: '#e040fb',  baseCost: 5, max: 0.65 },
  health:    { level: 0, tier: 0, basePerLevel: 0.05, label: 'HEALTH',      icon: '♥', descBase: 'HP',       color: '#00ff66',  baseCost: 5 },
};
const UPGRADE_COST_SCALE = 1.20;
let upgradesPanelOpen = false;

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
  let t = 0;
  while (lvl < upg.level) {
    const tierEnd = Math.min(upg.level, (t + 1) * PIPS_PER_TIER);
    const count = tierEnd - lvl;
    const perLvl = upg.basePerLevel + t * 0.01;
    total += count * perLvl;
    lvl = tierEnd;
    t++;
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
  if (gold < cost) return false;
  if (key === 'doubleBul' && getUpgradeValue(upg) >= upg.max) return false;
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

  spawnFloatingText(turret.x, turret.y - 50, 'UPGRADED!', upg.color);
  return true;
}

// Wave management
let waveEnemiesTotal = 0;
let waveEnemiesSpawned = 0;
let waveEnemiesKilled = 0;
let spawnTimer = 0;
let spawnInterval = 60;
let wavePaused = false;
let waveStartDelay = 0;
let waveTanksToSpawn = 0;
let waveBossToSpawn = 0;
let waveTanksSpawned = 0;
let waveBossSpawned = 0;
let wavePhantomsToSpawn = 0;
let waveSentinelToSpawn = 0;
let waveOverlordToSpawn = 0;
let wavePhantomsSpawned = 0;
let waveSentinelSpawned = 0;
let waveOverlordSpawned = 0;

// Death state
let deathTimer = 0;
const DEATH_RETURN_DELAY = 180; // 3 seconds then go to menu

// ── Canvas resize ──
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ── Input ──
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') { keys.space = true; e.preventDefault(); }
  // Toggle upgrades panel
  if (e.key.toLowerCase() === 'b' && gameState === 'playing') {
    upgradesPanelOpen = !upgradesPanelOpen;
  }
  // Buy upgrades 1-4
  if (upgradesPanelOpen && gameState === 'playing') {
    const upgradeKeys = ['damage', 'fireRate', 'precision', 'doubleBul', 'health'];
    const num = parseInt(e.key);
    if (num >= 1 && num <= 5) {
      buyUpgrade(upgradeKeys[num - 1]);
    }
  }
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === ' ') keys.space = false;
});
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.worldX = e.clientX + camera.x;
  mouse.worldY = e.clientY + camera.y;
});
window.addEventListener('mousedown', e => {
  if (e.button === 0) mouseDown = true;
});
window.addEventListener('mouseup', e => {
  if (e.button === 0) mouseDown = false;
});

// ── Utility ──
function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

// ── Turret ──
class Turret {
  constructor() {
    this.x = CENTER_X;
    this.y = CENTER_Y;
    this.angle = 0;
    this.targetAngle = 0;
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.radius = TURRET_RADIUS;
    this.alive = true;
    this.damageFlash = 0;
    this.recoil = 0;
    this.ringRotation = 0;
    this.outerRingRotation = 0;
    this.regenAccum = 0;
  }

  update() {
    if (this.damageFlash > 0) this.damageFlash--;
    if (this.recoil > 0) this.recoil *= 0.8;

    this.ringRotation += 0.015;
    this.outerRingRotation -= 0.008;

    // Regen (permanent upgrade) — regen 0.5 HP/sec base * (1 + regenBonus)
    if (permBonus.regen > 0 && this.alive && this.hp < this.maxHp) {
      this.regenAccum += (0.5 / 60) * (1 + permBonus.regen * 10);
      if (this.regenAccum >= 1) {
        const heal = Math.floor(this.regenAccum);
        this.hp = Math.min(this.maxHp, this.hp + heal);
        this.regenAccum -= heal;
      }
    }

    // Determine aiming mode
    autoAimTarget = this.findNearestEnemy();

    if (mouseDown) {
      // Manual mode: aim at mouse, fire at manual rate
      this.targetAngle = Math.atan2(mouse.worldY - this.y, mouse.worldX - this.x);
      this.angle = lerpAngle(this.angle, this.targetAngle, 0.2);

      if (fireTimer <= 0 && this.alive) {
        this.shoot();
        fireTimer = getCurrentFireRate(FIRE_RATE_MANUAL);
      }
    } else if (autoAimTarget) {
      // Auto-aim mode: aim at nearest enemy, fire 40% slower
      this.targetAngle = Math.atan2(autoAimTarget.y - this.y, autoAimTarget.x - this.x);
      this.angle = lerpAngle(this.angle, this.targetAngle, 0.12);

      if (fireTimer <= 0 && this.alive) {
        this.shoot();
        fireTimer = getCurrentFireRate(FIRE_RATE_AUTO);
      }
    } else {
      // No target: slowly rotate and track mouse
      this.targetAngle = Math.atan2(mouse.worldY - this.y, mouse.worldX - this.x);
      this.angle = lerpAngle(this.angle, this.targetAngle, 0.05);
    }

    if (fireTimer > 0) fireTimer--;
  }

  findNearestEnemy() {
    let nearest = null;
    let nearestDist = TURRET_RANGE;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  shoot() {
    const curSpread = getCurrentSpread();
    const bx = this.x + Math.cos(this.angle) * (this.radius + 12);
    const by = this.y + Math.sin(this.angle) * (this.radius + 12);

    // Primary bullet
    const s1 = (Math.random() - 0.5) * curSpread * 2;
    bullets.push(new Bullet(bx, by, this.angle + s1));

    // Double bullet chance
    if (Math.random() < getDoubleBulletChance()) {
      const s2 = (Math.random() - 0.5) * curSpread * 2;
      bullets.push(new Bullet(bx, by, this.angle + s2));
    }

    this.recoil = 5;

    // Muzzle flash particles
    for (let i = 0; i < 6; i++) {
      const sp = (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 5;
      spawnParticle(bx, by,
        Math.cos(this.angle + sp) * speed,
        Math.sin(this.angle + sp) * speed,
        i < 3 ? COL.cyan : COL.white, 8 + Math.random() * 12, 1.5 + Math.random());
    }
    spawnParticle(bx, by, 0, 0, COL.white, 5, 6);
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.damageFlash = 20;
    camera.shakeX = (Math.random() - 0.5) * 10;
    camera.shakeY = (Math.random() - 0.5) * 10;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      spawnExplosion(this.x, this.y, COL.cyan, 80);
      spawnExplosion(this.x, this.y, COL.white, 30);
      // Ground scorch
      groundDecals.push({ x: this.x, y: this.y, radius: 60, alpha: 0.4, color: COL.cyan });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const dmg = this.damageFlash > 0;
    const pri = dmg ? COL.red : COL.cyan;
    const priA = dmg ? 'rgba(255,0,85,' : 'rgba(0,255,242,';

    // ── Range circle (dashed, pulsing) ──
    const rangePulse = 0.03 + Math.sin(frameCount * 0.02) * 0.015;
    ctx.strokeStyle = `${priA}${rangePulse})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 14]);
    ctx.beginPath();
    ctx.arc(0, 0, TURRET_RANGE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Ambient ground glow ──
    const ambGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 55);
    ambGrad.addColorStop(0, `${priA}0.06)`);
    ambGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ambGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI * 2);
    ctx.fill();

    // ── Outer shield ring (slow counter-rotate, 6 arc segments) ──
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = this.outerRingRotation + (i / 6) * Math.PI * 2;
      const gap = 0.12;
      const arcLen = (Math.PI * 2 / 6) - gap;
      ctx.strokeStyle = `${priA}${0.08 + Math.sin(frameCount * 0.04 + i) * 0.04})`;
      ctx.beginPath();
      ctx.arc(0, 0, 42, a, a + arcLen);
      ctx.stroke();
    }

    // ── Base body — circular layered platform ──
    // Outer ring
    ctx.strokeStyle = `${priA}0.25)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();

    // Filled base disc
    const baseGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    baseGrad.addColorStop(0, `${priA}0.07)`);
    baseGrad.addColorStop(0.7, `${priA}0.03)`);
    baseGrad.addColorStop(1, `${priA}0.01)`);
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    // Mid ring
    ctx.strokeStyle = `${priA}0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();

    // ── Rotating inner arcs (energy ring) ──
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = this.ringRotation + (i / 3) * Math.PI * 2;
      const alpha = 0.25 + Math.sin(frameCount * 0.08 + i * 2) * 0.1;
      ctx.strokeStyle = `${priA}${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, 17, a, a + 0.7);
      ctx.stroke();
    }

    // ── Cross-hair notches on base (N/S/E/W) ──
    ctx.strokeStyle = `${priA}0.2)`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24);
      ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30);
      ctx.stroke();
    }

    // ── Decorative diagonal ticks ──
    ctx.strokeStyle = `${priA}0.1)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 27, Math.sin(a) * 27);
      ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30);
      ctx.stroke();
    }

    // ── Core reactor (multi-layer glow) ──
    const coreBreath = 0.6 + Math.sin(frameCount * 0.06) * 0.2;

    // Halo
    const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
    haloGrad.addColorStop(0, `${priA}${coreBreath * 0.7})`);
    haloGrad.addColorStop(0.4, `${priA}${coreBreath * 0.2})`);
    haloGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Core ring
    ctx.strokeStyle = pri;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = pri;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Hot center
    ctx.fillStyle = COL.white;
    ctx.shadowColor = pri;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── Cannon (with recoil) ──
    ctx.rotate(this.angle);
    const rc = -this.recoil;

    // Barrel housing / mount
    ctx.fillStyle = `${priA}0.12)`;
    ctx.beginPath();
    ctx.moveTo(10 + rc, -9);
    ctx.lineTo(16 + rc, -6);
    ctx.lineTo(16 + rc, 6);
    ctx.lineTo(10 + rc, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `${priA}0.25)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Main barrel body (tapered)
    ctx.shadowColor = pri;
    ctx.shadowBlur = 12;
    ctx.fillStyle = pri;
    ctx.beginPath();
    ctx.moveTo(15 + rc, -4);
    ctx.lineTo(40 + rc, -2.5);
    ctx.lineTo(40 + rc, 2.5);
    ctx.lineTo(15 + rc, 4);
    ctx.closePath();
    ctx.fill();

    // Barrel inner line (bright center)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(18 + rc, 0);
    ctx.lineTo(38 + rc, 0);
    ctx.stroke();

    // Barrel segments / vents
    ctx.strokeStyle = `${priA}0.3)`;
    ctx.lineWidth = 1;
    const vents = [22, 28, 34];
    for (const vx of vents) {
      ctx.beginPath();
      ctx.moveTo(vx + rc, -3.5);
      ctx.lineTo(vx + rc, 3.5);
      ctx.stroke();
    }

    // Muzzle tip
    ctx.fillStyle = COL.white;
    ctx.shadowColor = COL.white;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(40 + rc, -3.5);
    ctx.lineTo(44 + rc, -2);
    ctx.lineTo(44 + rc, 2);
    ctx.lineTo(40 + rc, 3.5);
    ctx.closePath();
    ctx.fill();

    // Side stabilizers
    ctx.fillStyle = `${priA}0.35)`;
    ctx.shadowBlur = 0;
    // Top stabilizer
    ctx.beginPath();
    ctx.moveTo(16 + rc, -5);
    ctx.lineTo(30 + rc, -4);
    ctx.lineTo(30 + rc, -6);
    ctx.lineTo(18 + rc, -7);
    ctx.closePath();
    ctx.fill();
    // Bottom stabilizer
    ctx.beginPath();
    ctx.moveTo(16 + rc, 5);
    ctx.lineTo(30 + rc, 4);
    ctx.lineTo(30 + rc, 6);
    ctx.lineTo(18 + rc, 7);
    ctx.closePath();
    ctx.fill();

    // Auto-aim glow at muzzle
    if (!mouseDown && autoAimTarget) {
      ctx.fillStyle = 'rgba(255, 102, 0, 0.5)';
      ctx.shadowColor = COL.orange;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(44 + rc, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // HP bar
    this.drawHpBar(ctx);

    // Auto-aim line to target
    if (!mouseDown && autoAimTarget && this.alive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 102, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(autoAimTarget.x, autoAimTarget.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  drawHpBar(ctx) {
    const barW = 54;
    const barH = 6;
    const bx = this.x - barW / 2;
    const by = this.y + 44;
    const ratio = this.hp / this.maxHp;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

    // Border
    ctx.strokeStyle = 'rgba(0, 255, 242, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 1, by - 1, barW + 2, barH + 2);

    // Fill with gradient
    const hpColor = ratio > 0.5 ? COL.green : ratio > 0.25 ? COL.yellow : COL.red;
    const grad = ctx.createLinearGradient(bx, by, bx + barW * ratio, by);
    grad.addColorStop(0, hpColor);
    grad.addColorStop(1, ratio > 0.5 ? '#00cc55' : ratio > 0.25 ? '#cc9900' : '#cc0033');
    ctx.fillStyle = grad;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(bx, by, barW * ratio, barH);
    ctx.shadowBlur = 0;

    // HP tick marks
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    for (let i = 1; i < 4; i++) {
      ctx.fillRect(bx + (barW / 4) * i, by, 1, barH);
    }
  }
}

// ── Bullet ──
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.angle = angle;
    this.alive = true;
    this.life = 120;
    this.radius = 4;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;

    if (this.life <= 0 ||
        this.x < 0 || this.x > MAP_W ||
        this.y < 0 || this.y > MAP_H) {
      this.alive = false;
    }

    // Trail particles
    if (frameCount % 2 === 0) {
      spawnParticle(
        this.x - this.vx * 0.3 + (Math.random() - 0.5) * 2,
        this.y - this.vy * 0.3 + (Math.random() - 0.5) * 2,
        -this.vx * 0.05, -this.vy * 0.05,
        COL.cyan, 10, 1.5);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Bullet trail glow
    const trailGrad = ctx.createLinearGradient(-14, 0, 4, 0);
    trailGrad.addColorStop(0, 'transparent');
    trailGrad.addColorStop(1, 'rgba(0, 255, 242, 0.5)');
    ctx.fillStyle = trailGrad;
    ctx.fillRect(-14, -2.5, 18, 5);

    // Core
    ctx.fillStyle = COL.white;
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright
    ctx.fillStyle = COL.cyan;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ═══════════════════════════════════════════
//  ENEMY CLASS
//  Contiene: Enemigo 1 (Runner), Enemigo 2 (Tank), Enemigo 3 (Boss)
// ═══════════════════════════════════════════
class Enemy {
  constructor(x, y, hp, speed, type = 'runner') {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.type = type;
    this.radius = type === 'overlord' ? OVERLORD_RADIUS : type === 'boss' ? BOSS_RADIUS : type === 'sentinel' ? SENTINEL_RADIUS : type === 'tank' ? TANK_RADIUS : type === 'phantom' ? PHANTOM_RADIUS : ENEMY_RADIUS;
    this.alive = true;
    this.angle = 0;
    this.damageFlash = 0;
    this.attackTimer = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.03 + Math.random() * 0.02;
    this.spawnAnim = 1.0; // scale animation on spawn
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.trailTimer = 0;
  }

  update() {
    if (!this.alive) return;

    const dx = turret.x - this.x;
    const dy = turret.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);

    if (this.damageFlash > 0) this.damageFlash--;
    if (this.spawnAnim > 0) this.spawnAnim -= 0.02;

    // Move towards turret
    if (dist > ENEMY_ATTACK_RANGE) {
      this.wobble += this.wobbleSpeed;
      const wobbleAngle = this.angle + Math.sin(this.wobble) * 0.25;
      this.x += Math.cos(wobbleAngle) * this.speed;
      this.y += Math.sin(wobbleAngle) * this.speed;
    } else {
      // Attack turret
      this.attackTimer++;
      if (this.attackTimer >= 60) {
        this.attackTimer = 0;
        if (turret.alive) {
          const dmg = this.type === 'overlord' ? OVERLORD_DAMAGE : this.type === 'boss' ? BOSS_DAMAGE : this.type === 'sentinel' ? SENTINEL_DAMAGE : this.type === 'tank' ? TANK_DAMAGE : this.type === 'phantom' ? PHANTOM_DAMAGE : ENEMY_DAMAGE;
          turret.takeDamage(dmg);
          spawnFloatingText(turret.x, turret.y - 30, `-${dmg}`, COL.red);
          // Attack flash effect
          spawnParticle(this.x, this.y, 0, 0, COL.red, 10, 8);
        }
      }
    }

    // Trail particles (engine exhaust)
    this.trailTimer++;
    if (this.trailTimer >= 4) {
      this.trailTimer = 0;
      const backAngle = this.angle + Math.PI;
      spawnParticle(
        this.x + Math.cos(backAngle) * this.radius,
        this.y + Math.sin(backAngle) * this.radius,
        Math.cos(backAngle) * 0.8 + (Math.random() - 0.5) * 0.5,
        Math.sin(backAngle) * 0.8 + (Math.random() - 0.5) * 0.5,
        this.type === 'overlord' ? COL.blue : this.type === 'boss' ? COL.purple : this.type === 'sentinel' ? COL.teal : this.type === 'tank' ? COL.red : this.type === 'phantom' ? COL.blue : COL.orange, 12 + Math.random() * 8, (this.type === 'boss' || this.type === 'overlord' || this.type === 'sentinel') ? 4 : 2);
    }
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.damageFlash = 10;
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    const isBoss = this.type === 'boss' || this.type === 'overlord';
    const isTank = this.type === 'tank';
    const isSentinel = this.type === 'sentinel';
    const isPhantom = this.type === 'phantom';
    const isOverlord = this.type === 'overlord';
    const baseColor = isOverlord ? COL.blue : this.type === 'boss' ? COL.purple : isSentinel ? COL.teal : isTank ? COL.red : isPhantom ? COL.blue : COL.orange;

    const explSize = isBoss ? 60 : isSentinel ? 45 : isTank ? 35 : 25;
    spawnExplosion(this.x, this.y, baseColor, explSize);
    spawnExplosion(this.x, this.y, COL.yellow, isBoss ? 30 : isSentinel ? 20 : isTank ? 15 : 10);
    groundDecals.push({ x: this.x, y: this.y, radius: isBoss ? 50 : isSentinel ? 35 : isTank ? 25 : 18, alpha: 0.2, color: baseColor });

    const scoreGain = isOverlord ? 800 : this.type === 'boss' ? 500 : isSentinel ? 300 : isTank ? 25 : isPhantom ? 15 : 10;
    score += scoreGain;
    totalKills++;
    waveEnemiesKilled++;

    const goldMultiplier = isOverlord ? 25 : this.type === 'boss' ? 20 : isSentinel ? 15 : isTank ? 3 : isPhantom ? 2 : 1;
    const goldPerKill = (1 + Math.floor(wave / 5)) * goldMultiplier;
    gold += goldPerKill;
    spawnFloatingText(this.x, this.y - 15, `+${goldPerKill} gold`, '#ffd700');

    if (isBoss) {
      gems += isOverlord ? 2 : 1;
      spawnFloatingText(this.x, this.y - 35, isOverlord ? '+2 GEMS' : '+1 GEM', '#e040fb');
      spawnRewardPopup(isOverlord ? 'OVERLORD DESTROYED!' : 'BOSS DEFEATED!', isOverlord ? COL.blue : '#aa00ff');
      camera.shakeX = (Math.random() - 0.5) * (isOverlord ? 30 : 20);
      camera.shakeY = (Math.random() - 0.5) * (isOverlord ? 30 : 20);
    }
    if (isSentinel) {
      gems += 1;
      spawnFloatingText(this.x, this.y - 35, '+1 GEM', '#e040fb');
      spawnRewardPopup('SENTINEL DESTROYED!', COL.teal);
      camera.shakeX = (Math.random() - 0.5) * 15;
      camera.shakeY = (Math.random() - 0.5) * 15;
    }
    if (isTank) {
      spawnFloatingText(this.x, this.y - 35, 'TANK DOWN', COL.red);
    }
    if (isPhantom) {
      spawnFloatingText(this.x, this.y - 35, 'PHANTOM DOWN', COL.blue);
    }
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = 0.5 + Math.sin(frameCount * 0.08 + this.pulsePhase) * 0.2;
    const scale = 1.0 + Math.max(0, this.spawnAnim) * 0.5;
    ctx.scale(scale, scale);

    // Seleccionar dibujo segun tipo de enemigo
    if (this.type === 'overlord') {
      this.drawOverlord(ctx, pulse);   // Enemigo 6
    } else if (this.type === 'sentinel') {
      this.drawSentinel(ctx, pulse);   // Enemigo 5
    } else if (this.type === 'phantom') {
      this.drawPhantom(ctx, pulse);    // Enemigo 4
    } else if (this.type === 'boss') {
      this.drawBoss(ctx, pulse);       // Enemigo 3
    } else if (this.type === 'tank') {
      this.drawTank(ctx, pulse);       // Enemigo 2
    } else {
      this.drawRunner(ctx, pulse);     // Enemigo 1
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // HP bar
    this.drawEnemyHpBar(ctx);
  }

  // ── Enemigo 1: Runner (dibujo) ──
  drawRunner(ctx, pulse) {
    const r = this.radius;
    // Threat ring (pulsing)
    ctx.strokeStyle = `rgba(255, 102, 0, ${pulse * 0.2})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r + 6 + Math.sin(frameCount * 0.1 + this.pulsePhase) * 2, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating threat segments
    ctx.strokeStyle = `rgba(255, 102, 0, ${pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = frameCount * 0.03 + this.pulsePhase + (i / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, a, a + 0.3);
      ctx.stroke();
    }

    ctx.rotate(this.angle);

    // Body glow
    const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 2);
    bodyGrad.addColorStop(0, this.damageFlash > 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 102, 0, 0.2)');
    bodyGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
    ctx.fill();

    // Main body - angular shape
    ctx.fillStyle = this.damageFlash > 0 ? COL.white : COL.orange;
    ctx.shadowColor = COL.orange;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(r + 2, 0);
    ctx.lineTo(2, -r * 0.7);
    ctx.lineTo(-r * 0.5, -r * 0.4);
    ctx.lineTo(-r * 0.8, 0);
    ctx.lineTo(-r * 0.5, r * 0.4);
    ctx.lineTo(2, r * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.damageFlash > 0 ? COL.yellow : 'rgba(255, 150, 50, 0.6)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Inner detail lines
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.2);
    ctx.lineTo(r * 0.5, -r * 0.15);
    ctx.moveTo(-r * 0.3, r * 0.2);
    ctx.lineTo(r * 0.5, r * 0.15);
    ctx.stroke();

    // Core eye
    ctx.fillStyle = this.damageFlash > 0 ? COL.orange : COL.white;
    ctx.shadowColor = this.damageFlash > 0 ? COL.orange : COL.yellow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(1, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COL.red;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(2, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Forward targeting line
    ctx.strokeStyle = `rgba(255, 102, 0, ${pulse * 0.5})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(r + 2, 0);
    ctx.lineTo(r + 8, 0);
    ctx.stroke();
  }

  // ── Enemigo 2: Tank (dibujo) ──
  drawTank(ctx, pulse) {
    const r = this.radius;
    const col = '#ff0055';
    const colA = 'rgba(255, 0, 85,';

    // Pulsing shield aura
    ctx.strokeStyle = `${colA} ${pulse * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r + 8 + Math.sin(frameCount * 0.06 + this.pulsePhase) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Shield arcs (4 rotating)
    ctx.strokeStyle = `${colA} ${pulse * 0.4})`;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const a = frameCount * 0.02 + this.pulsePhase + (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, a, a + 0.5);
      ctx.stroke();
    }

    ctx.rotate(this.angle);

    // Body glow
    const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 2);
    bodyGrad.addColorStop(0, this.damageFlash > 0 ? 'rgba(255, 255, 255, 0.3)' : `${colA} 0.15)`);
    bodyGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
    ctx.fill();

    // Main body - hexagonal shape
    ctx.fillStyle = this.damageFlash > 0 ? COL.white : col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Edge highlight
    ctx.strokeStyle = this.damageFlash > 0 ? COL.yellow : 'rgba(255, 100, 150, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Inner hex ring
    ctx.strokeStyle = `${colA} 0.3)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const px = Math.cos(a) * r * 0.6;
      const py = Math.sin(a) * r * 0.6;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Cross struts
    ctx.strokeStyle = 'rgba(255, 150, 180, 0.25)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
      ctx.lineTo(Math.cos(a + Math.PI) * r * 0.55, Math.sin(a + Math.PI) * r * 0.55);
      ctx.stroke();
    }

    // Core
    ctx.fillStyle = this.damageFlash > 0 ? col : COL.white;
    ctx.shadowColor = col;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Forward spike
    ctx.fillStyle = `${colA} ${pulse * 0.7})`;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(r + 6, -2);
    ctx.lineTo(r + 6, 2);
    ctx.closePath();
    ctx.fill();
  }

  // ── Enemigo 3: Boss (dibujo) ──
  drawBoss(ctx, pulse) {
    const r = this.radius;
    const col = '#aa00ff';
    const colA = 'rgba(170, 0, 255,';

    // Massive aura
    const auraGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r + 20);
    auraGrad.addColorStop(0, `${colA} 0.08)`);
    auraGrad.addColorStop(0.7, `${colA} 0.03)`);
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r + 20, 0, Math.PI * 2);
    ctx.fill();

    // Outer pulsing ring
    ctx.strokeStyle = `${colA} ${pulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r + 12 + Math.sin(frameCount * 0.05 + this.pulsePhase) * 4, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating shield segments (6)
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = frameCount * 0.015 + (i / 6) * Math.PI * 2;
      const alpha = 0.2 + Math.sin(frameCount * 0.04 + i * 1.5) * 0.1;
      ctx.strokeStyle = `${colA} ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, a, a + 0.4);
      ctx.stroke();
    }

    // Counter-rotating inner arcs
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = -frameCount * 0.025 + (i / 4) * Math.PI * 2;
      ctx.strokeStyle = `${colA} ${0.15 + pulse * 0.1})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, a, a + 0.6);
      ctx.stroke();
    }

    ctx.rotate(this.angle);

    // Main body - octagonal
    ctx.fillStyle = this.damageFlash > 0 ? COL.white : col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Edge
    ctx.strokeStyle = this.damageFlash > 0 ? COL.yellow : 'rgba(200, 100, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Inner octagon
    ctx.strokeStyle = `${colA} 0.25)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
      const px = Math.cos(a) * r * 0.6;
      const py = Math.sin(a) * r * 0.6;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Radial struts
    ctx.strokeStyle = 'rgba(200, 150, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35);
      ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      ctx.stroke();
    }

    // Energy core
    const coreBreath = 0.6 + Math.sin(frameCount * 0.07) * 0.3;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${coreBreath})`);
    coreGrad.addColorStop(0.3, `${colA} ${coreBreath * 0.8})`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Core ring
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.shadowColor = col;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Hot center
    ctx.fillStyle = COL.white;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Forward lance
    ctx.fillStyle = `${colA} ${pulse * 0.6})`;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(r, -4);
    ctx.lineTo(r + 14, 0);
    ctx.lineTo(r, 4);
    ctx.closePath();
    ctx.fill();

    // Side spikes
    for (let s = -1; s <= 1; s += 2) {
      ctx.fillStyle = `${colA} 0.3)`;
      ctx.beginPath();
      ctx.moveTo(r * 0.3, s * r);
      ctx.lineTo(r * 0.6, s * (r + 8));
      ctx.lineTo(-r * 0.1, s * r);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ── Enemigo 4: Phantom (dibujo) ──
  drawPhantom(ctx, pulse) {
    const r = this.radius;
    const col = '#0088ff';
    const colA = 'rgba(0, 136, 255,';

    // Ghostly aura
    ctx.strokeStyle = `${colA} ${pulse * 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r + 6 + Math.sin(frameCount * 0.1 + this.pulsePhase) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Electric arcs (3 rotating)
    ctx.strokeStyle = `${colA} ${pulse * 0.5})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = frameCount * 0.04 + this.pulsePhase + (i / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, a, a + 0.4);
      ctx.stroke();
    }

    ctx.rotate(this.angle);

    // Body glow
    const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 2);
    bodyGrad.addColorStop(0, this.damageFlash > 0 ? 'rgba(255, 255, 255, 0.3)' : `${colA} 0.2)`);
    bodyGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
    ctx.fill();

    // Main body - diamond/rhombus shape
    ctx.fillStyle = this.damageFlash > 0 ? COL.white : col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(0, -r * 0.7);
    ctx.lineTo(-r * 0.8, 0);
    ctx.lineTo(0, r * 0.7);
    ctx.closePath();
    ctx.fill();

    // Edge highlight
    ctx.strokeStyle = this.damageFlash > 0 ? COL.yellow : 'rgba(100, 180, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Inner diamond
    ctx.strokeStyle = `${colA} 0.3)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(r * 0.5, 0);
    ctx.lineTo(0, -r * 0.35);
    ctx.lineTo(-r * 0.4, 0);
    ctx.lineTo(0, r * 0.35);
    ctx.closePath();
    ctx.stroke();

    // Core
    ctx.fillStyle = this.damageFlash > 0 ? col : COL.white;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Forward spike
    ctx.fillStyle = `${colA} ${pulse * 0.7})`;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(r + 5, -1.5);
    ctx.lineTo(r + 5, 1.5);
    ctx.closePath();
    ctx.fill();
  }

  // ── Enemigo 5: Sentinel (mini-boss, dibujo) ──
  drawSentinel(ctx, pulse) {
    const r = this.radius;
    const col = '#00ffaa';
    const colA = 'rgba(0, 255, 170,';

    // Aura gradient
    const auraGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r + 15);
    auraGrad.addColorStop(0, `${colA} 0.06)`);
    auraGrad.addColorStop(0.7, `${colA} 0.02)`);
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r + 15, 0, Math.PI * 2);
    ctx.fill();

    // Outer pulsing ring
    ctx.strokeStyle = `${colA} ${pulse * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r + 10 + Math.sin(frameCount * 0.05 + this.pulsePhase) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating shield segments (5)
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 5; i++) {
      const a = frameCount * 0.02 + (i / 5) * Math.PI * 2;
      const alpha = 0.2 + Math.sin(frameCount * 0.04 + i * 1.5) * 0.1;
      ctx.strokeStyle = `${colA} ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, r + 5, a, a + 0.5);
      ctx.stroke();
    }

    // Counter-rotating arcs
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = -frameCount * 0.03 + (i / 3) * Math.PI * 2;
      ctx.strokeStyle = `${colA} ${0.15 + pulse * 0.1})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.65, a, a + 0.5);
      ctx.stroke();
    }

    ctx.rotate(this.angle);

    // Main body - pentagon
    ctx.fillStyle = this.damageFlash > 0 ? COL.white : col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Edge
    ctx.strokeStyle = this.damageFlash > 0 ? COL.yellow : 'rgba(100, 255, 200, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Inner pentagon
    ctx.strokeStyle = `${colA} 0.25)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r * 0.55;
      const py = Math.sin(a) * r * 0.55;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Radial struts
    ctx.strokeStyle = 'rgba(150, 255, 220, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
      ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
      ctx.stroke();
    }

    // Energy core
    const coreBreath = 0.6 + Math.sin(frameCount * 0.07) * 0.3;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${coreBreath})`);
    coreGrad.addColorStop(0.3, `${colA} ${coreBreath * 0.8})`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Core ring
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = col;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Hot center
    ctx.fillStyle = COL.white;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Forward lance
    ctx.fillStyle = `${colA} ${pulse * 0.6})`;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(r, -3);
    ctx.lineTo(r + 10, 0);
    ctx.lineTo(r, 3);
    ctx.closePath();
    ctx.fill();
  }

  // ── Enemigo 6: Overlord (boss nivel 2, dibujo) ──
  drawOverlord(ctx, pulse) {
    const r = this.radius;
    const col = '#0055ff';
    const colA = 'rgba(0, 85, 255,';

    // Massive aura
    const auraGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r + 25);
    auraGrad.addColorStop(0, `${colA} 0.1)`);
    auraGrad.addColorStop(0.7, `${colA} 0.03)`);
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r + 25, 0, Math.PI * 2);
    ctx.fill();

    // Outer pulsing ring
    ctx.strokeStyle = `${colA} ${pulse * 0.35})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r + 14 + Math.sin(frameCount * 0.04 + this.pulsePhase) * 5, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating shield segments (8)
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = frameCount * 0.012 + (i / 8) * Math.PI * 2;
      const alpha = 0.2 + Math.sin(frameCount * 0.035 + i * 1.2) * 0.1;
      ctx.strokeStyle = `${colA} ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, r + 7, a, a + 0.3);
      ctx.stroke();
    }

    // Counter-rotating inner arcs
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = -frameCount * 0.02 + (i / 5) * Math.PI * 2;
      ctx.strokeStyle = `${colA} ${0.15 + pulse * 0.1})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, a, a + 0.5);
      ctx.stroke();
    }

    // Lightning bolts (3 rotating)
    ctx.strokeStyle = `rgba(100, 180, 255, ${0.3 + pulse * 0.2})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = frameCount * 0.018 + (i / 3) * Math.PI * 2;
      const bx = Math.cos(a) * (r + 5);
      const by = Math.sin(a) * (r + 5);
      const ex = Math.cos(a) * (r + 18);
      const ey = Math.sin(a) * (r + 18);
      const mx = (bx + ex) / 2 + (Math.random() - 0.5) * 6;
      const my = (by + ey) / 2 + (Math.random() - 0.5) * 6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    ctx.rotate(this.angle);

    // Main body - decagonal
    ctx.fillStyle = this.damageFlash > 0 ? COL.white : col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 35;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 10;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Edge
    ctx.strokeStyle = this.damageFlash > 0 ? COL.yellow : 'rgba(100, 150, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Inner decagon
    ctx.strokeStyle = `${colA} 0.25)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 10;
      const px = Math.cos(a) * r * 0.6;
      const py = Math.sin(a) * r * 0.6;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Radial struts
    ctx.strokeStyle = 'rgba(150, 180, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 10;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35);
      ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      ctx.stroke();
    }

    // Energy core (larger, more intense)
    const coreBreath = 0.7 + Math.sin(frameCount * 0.06) * 0.3;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${coreBreath})`);
    coreGrad.addColorStop(0.3, `${colA} ${coreBreath * 0.8})`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Core ring
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = col;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Hot center
    ctx.fillStyle = COL.white;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Forward lance (larger)
    ctx.fillStyle = `${colA} ${pulse * 0.7})`;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(r, -5);
    ctx.lineTo(r + 18, 0);
    ctx.lineTo(r, 5);
    ctx.closePath();
    ctx.fill();

    // Side spikes (3 each side)
    for (let s = -1; s <= 1; s += 2) {
      for (let j = 0; j < 2; j++) {
        const off = j * 0.25;
        ctx.fillStyle = `${colA} ${0.25 - j * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(r * (0.3 - off), s * r * (0.9 + j * 0.15));
        ctx.lineTo(r * (0.5 - off), s * (r + 10 + j * 4));
        ctx.lineTo(-r * (0.1 + off), s * r * (0.9 + j * 0.15));
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  drawEnemyHpBar(ctx) {
    if (this.hp >= this.maxHp) return;
    const isBigEnemy = this.type === 'boss' || this.type === 'overlord' || this.type === 'sentinel';
    const barW = this.type === 'overlord' ? 70 : this.type === 'boss' ? 60 : this.type === 'sentinel' ? 50 : this.type === 'tank' ? 34 : 26;
    const barH = isBigEnemy ? 5 : 3;
    const bx = this.x - barW / 2;
    const by = this.y - this.radius - 10;
    const ratio = this.hp / this.maxHp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    if (isBigEnemy) {
      const borderCol = this.type === 'overlord' ? 'rgba(0, 85, 255, 0.4)' : this.type === 'sentinel' ? 'rgba(0, 255, 170, 0.4)' : 'rgba(170, 0, 255, 0.4)';
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 1, by - 1, barW + 2, barH + 2);
    }
    const hpCol = ratio > 0.5 ? COL.green : ratio > 0.25 ? COL.yellow : COL.red;
    ctx.fillStyle = hpCol;
    ctx.shadowColor = hpCol;
    ctx.shadowBlur = 4;
    ctx.fillRect(bx, by, barW * ratio, barH);
    ctx.shadowBlur = 0;

    if (isBigEnemy) {
      const label = this.type === 'overlord' ? 'OVERLORD' : this.type === 'sentinel' ? 'SENTINEL' : 'BOSS';
      const labelCol = this.type === 'overlord' ? '#0055ff' : this.type === 'sentinel' ? '#00ffaa' : '#aa00ff';
      ctx.font = '700 9px Orbitron';
      ctx.fillStyle = labelCol;
      ctx.shadowColor = labelCol;
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(label, this.x, by - 5);
      ctx.shadowBlur = 0;
    }
  }
}

// ── Particles ──
function spawnParticle(x, y, vx, vy, color, life, size) {
  if (particles.length > 800) return; // cap
  particles.push({ x, y, vx, vy, color, life, maxLife: life, size });
}

function spawnExplosion(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 6;
    spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, 25 + Math.random() * 35, 2 + Math.random() * 3);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    const sz = p.size * alpha;
    if (sz < 0.3) continue;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha * 0.8;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// ── Ground Decals ──
function drawGroundDecals(ctx) {
  for (let i = groundDecals.length - 1; i >= 0; i--) {
    const d = groundDecals[i];
    d.alpha -= 0.0005;
    if (d.alpha <= 0) { groundDecals.splice(i, 1); continue; }

    const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.radius);
    grad.addColorStop(0, d.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = d.alpha;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Floating Text ──
function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color, life: 55, scale: 1.3 });
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.life--;
    ft.y -= 0.7;
    ft.scale = Math.max(1, ft.scale - 0.02);
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
}

function drawFloatingTexts(ctx) {
  for (const ft of floatingTexts) {
    const alpha = Math.min(1, ft.life / 30);
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${Math.round(13 * ft.scale)}px Orbitron`;
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// ── Reward Popups (screen-space, big center announcements) ──
function spawnRewardPopup(text, color) {
  rewardPopups.push({ text, color, life: 120, y: 0 });
}

function updateRewardPopups() {
  for (let i = rewardPopups.length - 1; i >= 0; i--) {
    rewardPopups[i].life--;
    rewardPopups[i].y += 0.3;
    if (rewardPopups[i].life <= 0) rewardPopups.splice(i, 1);
  }
}

function drawRewardPopups() {
  const baseY = canvas.height * 0.35;
  for (let i = 0; i < rewardPopups.length; i++) {
    const rp = rewardPopups[i];
    const alpha = Math.min(1, rp.life / 40);
    const scale = rp.life > 100 ? 1 + (120 - rp.life) * 0.02 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${Math.round(28 * scale)}px Orbitron`;
    ctx.fillStyle = rp.color;
    ctx.shadowColor = rp.color;
    ctx.shadowBlur = 20;
    ctx.textAlign = 'center';
    ctx.fillText(rp.text, canvas.width / 2, baseY + i * 40 - rp.y);
    ctx.restore();
  }
  ctx.shadowBlur = 0;
}

// ── Gem drawing (for HUD) ──
function drawGemIcon(x, y, size, ctx2d) {
  const c = ctx2d || ctx;
  c.save();
  c.translate(x, y);

  // Gem shape: pointed top and bottom, wide middle
  const w = size * 0.5;
  const h = size;

  // Outer glow
  c.shadowColor = '#e040fb';
  c.shadowBlur = 10;

  // Main gem body
  const gemGrad = c.createLinearGradient(-w, -h * 0.3, w, h * 0.3);
  gemGrad.addColorStop(0, '#e040fb');
  gemGrad.addColorStop(0.3, '#f48cff');
  gemGrad.addColorStop(0.5, '#ffffff');
  gemGrad.addColorStop(0.7, '#f48cff');
  gemGrad.addColorStop(1, '#aa00ff');
  c.fillStyle = gemGrad;

  // Top half (crown)
  c.beginPath();
  c.moveTo(0, -h * 0.55);       // top point
  c.lineTo(w, -h * 0.1);         // top-right
  c.lineTo(w * 0.7, h * 0.05);   // mid-right
  c.lineTo(-w * 0.7, h * 0.05);  // mid-left
  c.lineTo(-w, -h * 0.1);        // top-left
  c.closePath();
  c.fill();

  // Bottom half (pavilion)
  const pavGrad = c.createLinearGradient(0, 0, 0, h * 0.55);
  pavGrad.addColorStop(0, '#d050f0');
  pavGrad.addColorStop(0.5, '#aa00ff');
  pavGrad.addColorStop(1, '#7700cc');
  c.fillStyle = pavGrad;

  c.beginPath();
  c.moveTo(-w * 0.7, h * 0.05);
  c.lineTo(w * 0.7, h * 0.05);
  c.lineTo(0, h * 0.55);         // bottom point
  c.closePath();
  c.fill();

  // Facet lines
  c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  c.lineWidth = 0.8;
  // Crown facets
  c.beginPath();
  c.moveTo(0, -h * 0.55);
  c.lineTo(-w * 0.3, h * 0.05);
  c.moveTo(0, -h * 0.55);
  c.lineTo(w * 0.3, h * 0.05);
  // Pavilion facets
  c.moveTo(-w * 0.7, h * 0.05);
  c.lineTo(0, h * 0.55);
  c.moveTo(w * 0.7, h * 0.05);
  c.lineTo(0, h * 0.55);
  c.moveTo(0, h * 0.05);
  c.lineTo(0, h * 0.55);
  c.stroke();

  // Highlight sparkle
  c.fillStyle = 'rgba(255, 255, 255, 0.7)';
  c.shadowBlur = 4;
  c.shadowColor = '#fff';
  c.beginPath();
  c.arc(-w * 0.2, -h * 0.2, size * 0.08, 0, Math.PI * 2);
  c.fill();

  c.shadowBlur = 0;
  c.restore();
}

// ── Gold coin drawing (for HUD) ──
function drawCoinIcon(x, y, size, ctx2d) {
  const c = ctx2d || ctx;
  c.save();
  c.translate(x, y);
  const r = size * 0.4;

  // Coin glow
  c.shadowColor = '#ffd700';
  c.shadowBlur = 8;

  // Outer coin
  const coinGrad = c.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  coinGrad.addColorStop(0, '#fff8b0');
  coinGrad.addColorStop(0.4, '#ffd700');
  coinGrad.addColorStop(1, '#b8860b');
  c.fillStyle = coinGrad;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();

  // Inner ring
  c.strokeStyle = 'rgba(184, 134, 11, 0.6)';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0, 0, r * 0.7, 0, Math.PI * 2);
  c.stroke();

  // $ symbol
  c.fillStyle = '#b8860b';
  c.shadowBlur = 0;
  c.font = `700 ${Math.round(r * 1.1)}px Orbitron`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('$', 0, 1);

  c.shadowBlur = 0;
  c.restore();
}

// ── EMP Ability ──
function triggerEMP() {
  if (empCooldown > 0 || !turret.alive) return;
  empCooldown = EMP_COOLDOWN;

  empWaves.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: EMP_RADIUS, life: 35 });

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dist = Math.hypot(enemy.x - turret.x, enemy.y - turret.y);
    if (dist < EMP_RADIUS) {
      enemy.takeDamage(EMP_DAMAGE);
      const angle = Math.atan2(enemy.y - turret.y, enemy.x - turret.x);
      enemy.x += Math.cos(angle) * 50;
      enemy.y += Math.sin(angle) * 50;
    }
  }

  // Lots of particles
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * EMP_RADIUS;
    spawnParticle(
      turret.x + Math.cos(a) * r, turret.y + Math.sin(a) * r,
      Math.cos(a) * 3, Math.sin(a) * 3,
      i % 3 === 0 ? COL.white : COL.cyan,
      15 + Math.random() * 25, 1.5 + Math.random() * 2);
  }

  camera.shakeX = (Math.random() - 0.5) * 12;
  camera.shakeY = (Math.random() - 0.5) * 12;
}

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

// ── Collision: Bullets vs Enemies ──
function checkBulletCollisions() {
  for (const bullet of bullets) {
    if (!bullet.alive) continue;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
      if (dist < bullet.radius + enemy.radius) {
        bullet.alive = false;
        enemy.takeDamage(Math.round(getCurrentDamage()));
        // Impact particles
        const impactAngle = Math.atan2(bullet.vy, bullet.vx);
        for (let i = 0; i < 8; i++) {
          const a = impactAngle + Math.PI + (Math.random() - 0.5) * 1.5;
          const s = 2 + Math.random() * 4;
          spawnParticle(bullet.x, bullet.y, Math.cos(a) * s, Math.sin(a) * s,
            i < 4 ? COL.cyan : COL.orange, 10 + Math.random() * 10, 1.5);
        }
        // Bright flash
        spawnParticle(bullet.x, bullet.y, 0, 0, COL.white, 5, 6);
        break;
      }
    }
  }
}

// ── Wave System ──
function startWave() {
  waveTanksSpawned = 0;
  waveBossSpawned = 0;
  wavePhantomsSpawned = 0;
  waveSentinelSpawned = 0;
  waveOverlordSpawned = 0;

  if (currentLevel === 2) {
    // ── Level 2 wave composition ──
    if (wave <= 20) {
      // Waves 1-20: Runner + Tank (tank less frequent)
      waveEnemiesTotal = 5 + wave * 3;
      waveTanksToSpawn = Math.max(0, Math.floor(wave / 4));
      waveBossToSpawn = 0;
      wavePhantomsToSpawn = 0;
      waveSentinelToSpawn = 0;
      waveOverlordToSpawn = 0;
    } else if (wave <= 69) {
      // Waves 21-69: Only tanks
      waveEnemiesTotal = 4 + wave * 2;
      waveTanksToSpawn = waveEnemiesTotal;
      waveBossToSpawn = 0;
      wavePhantomsToSpawn = 0;
      waveSentinelToSpawn = 0;
      waveOverlordToSpawn = 0;
    } else if (wave === 70) {
      // Wave 70: Mini-boss (Sentinel) + tanks
      waveEnemiesTotal = 4 + wave * 2;
      waveTanksToSpawn = waveEnemiesTotal;
      waveSentinelToSpawn = 1;
      waveBossToSpawn = 0;
      wavePhantomsToSpawn = 0;
      waveOverlordToSpawn = 0;
      waveEnemiesTotal += waveSentinelToSpawn;
    } else if (wave <= 99) {
      // Waves 71-99: Tanks + Phantoms (gradually more)
      waveEnemiesTotal = 4 + wave * 2;
      wavePhantomsToSpawn = Math.min(Math.floor((wave - 70) / 2) + 1, 15);
      waveTanksToSpawn = waveEnemiesTotal - wavePhantomsToSpawn;
      waveBossToSpawn = 0;
      waveSentinelToSpawn = 0;
      waveOverlordToSpawn = 0;
    } else {
      // Wave 100: Overlord boss + tanks + phantoms
      waveEnemiesTotal = 4 + wave * 2;
      wavePhantomsToSpawn = 10;
      waveTanksToSpawn = waveEnemiesTotal - wavePhantomsToSpawn;
      waveOverlordToSpawn = 1;
      waveBossToSpawn = 0;
      waveSentinelToSpawn = 0;
      waveEnemiesTotal += waveOverlordToSpawn;
    }
  } else {
    // ── Level 1 (original) ──
    waveEnemiesTotal = 5 + wave * 3;
    waveTanksToSpawn = (wave >= TANK_START_WAVE) ? 1 + Math.floor(Math.random() * 2) : 0;
    waveBossToSpawn = (wave === BOSS_WAVE) ? 1 : 0;
    wavePhantomsToSpawn = 0;
    waveSentinelToSpawn = 0;
    waveOverlordToSpawn = 0;
    waveEnemiesTotal += waveTanksToSpawn + waveBossToSpawn;
  }

  waveEnemiesSpawned = 0;
  waveEnemiesKilled = 0;
  spawnInterval = Math.max(15, 60 - wave * 3);
  spawnTimer = 0;
  wavePaused = false;
}

function spawnEnemy(type = 'runner') {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 50;

  switch (side) {
    case 0: x = margin; y = margin + Math.random() * (MAP_H - margin * 2); break;
    case 1: x = MAP_W - margin; y = margin + Math.random() * (MAP_H - margin * 2); break;
    case 2: x = margin + Math.random() * (MAP_W - margin * 2); y = margin; break;
    case 3: x = margin + Math.random() * (MAP_W - margin * 2); y = MAP_H - margin; break;
  }

  // Stats base segun tipo de enemigo
  let baseHp, baseSpeed;
  if (type === 'overlord') {       // Enemigo 6
    baseHp = OVERLORD_BASE_HP;
    baseSpeed = OVERLORD_BASE_SPEED;
  } else if (type === 'sentinel') { // Enemigo 5
    baseHp = SENTINEL_BASE_HP;
    baseSpeed = SENTINEL_BASE_SPEED;
  } else if (type === 'phantom') {  // Enemigo 4
    baseHp = PHANTOM_BASE_HP;
    baseSpeed = PHANTOM_BASE_SPEED;
  } else if (type === 'boss') {     // Enemigo 3
    baseHp = BOSS_BASE_HP;
    baseSpeed = BOSS_BASE_SPEED;
  } else if (type === 'tank') {     // Enemigo 2
    baseHp = TANK_BASE_HP;
    baseSpeed = TANK_BASE_SPEED;
  } else {                          // Enemigo 1
    baseHp = ENEMY_BASE_HP;
    baseSpeed = ENEMY_BASE_SPEED;
  }

  const hpMult = (type === 'boss' || type === 'overlord' || type === 'sentinel') ? 0.1 : 0.3;
  const hpScale = 1 + (wave - 1) * hpMult;
  const speedScale = 1 + (wave - 1) * 0.08;

  enemies.push(new Enemy(x, y,
    Math.round(baseHp * hpScale),
    baseSpeed * speedScale,
    type
  ));
  waveEnemiesSpawned++;

  // Spawn flash at location
  const flashCol = type === 'overlord' ? COL.blue : type === 'sentinel' ? COL.teal : type === 'phantom' ? COL.blue : type === 'boss' ? COL.purple : type === 'tank' ? COL.red : COL.orange;
  spawnParticle(x, y, 0, 0, flashCol, 15, 10);
}

function updateWaveSpawning() {
  if (wavePaused) return;

  if (waveEnemiesSpawned < waveEnemiesTotal) {
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;

      // Spawn por prioridad: Boss/Overlord > Sentinel > Tank > Phantom > Runner
      if (waveOverlordSpawned < waveOverlordToSpawn && waveEnemiesSpawned >= Math.floor(waveEnemiesTotal / 2)) {
        spawnEnemy('overlord');    // Enemigo 6
        waveOverlordSpawned++;
        spawnRewardPopup('WARNING: OVERLORD INCOMING', '#0055ff');
      } else if (waveBossSpawned < waveBossToSpawn && waveEnemiesSpawned >= Math.floor(waveEnemiesTotal / 2)) {
        spawnEnemy('boss');        // Enemigo 3
        waveBossSpawned++;
        spawnRewardPopup('WARNING: BOSS INCOMING', '#aa00ff');
      } else if (waveSentinelSpawned < waveSentinelToSpawn && waveEnemiesSpawned >= Math.floor(waveEnemiesTotal / 3)) {
        spawnEnemy('sentinel');    // Enemigo 5
        waveSentinelSpawned++;
        spawnRewardPopup('WARNING: SENTINEL DETECTED', '#00ffaa');
      } else if (waveTanksSpawned < waveTanksToSpawn) {
        spawnEnemy('tank');        // Enemigo 2
        waveTanksSpawned++;
      } else if (wavePhantomsSpawned < wavePhantomsToSpawn) {
        spawnEnemy('phantom');     // Enemigo 4
        wavePhantomsSpawned++;
      } else {
        spawnEnemy('runner');      // Enemigo 1
      }
    }
  }

  if (waveEnemiesKilled >= waveEnemiesTotal) {
    wavePaused = true;

    // Rewards for completing current wave
    const completedWave = wave;
    let goldReward = 5;
    let gemReward = 0;

    // Bonus every 5 waves: 15 gold
    if (completedWave % 5 === 0) {
      goldReward = 15;
    }

    // Bonus every 10 waves: +15 gold extra
    if (completedWave % 10 === 0) {
      goldReward += 15;
    }

    // x2 gold cada 5 y 10 rondas
    if (completedWave % 5 === 0) {
      goldReward *= 2;
    }

    let rewardMsg = `+${goldReward} gold`;

    // Gem every 5 waves
    if (completedWave % 5 === 0) {
      gemReward = 1;
    }

    // Bonus gems every 10 waves
    if (completedWave % 10 === 0) {
      gemReward += 5;
    }

    gold += goldReward;
    gems += gemReward;
    score += (completedWave + 1) * 50;

    // Show reward popup
    spawnRewardPopup(rewardMsg, '#ffd700');
    if (gemReward > 0) {
      spawnRewardPopup(`+${gemReward} GEM${gemReward > 1 ? 'S' : ''}`, '#e040fb');
    }

    // Save progress after every wave
    saveProgress();

    // Check win condition
    if (wave >= MAX_WAVES) {
      gems += 25;
      gameState = 'victory';
      saveProgress(true);
      // Limpiar auto-save al completar nivel
      fetch('/api/autosave', { method: 'DELETE' }).catch(() => {});
      showOverlay('VICTORY!', `LEVEL ${currentLevel} COMPLETE — SCORE: ${score}`);
      spawnRewardPopup('LEVEL COMPLETE!', '#00ff66');
      spawnRewardPopup('+25 GEMS', '#e040fb');
      setTimeout(() => {
        window.location.href = '/levels.html';
      }, 4000);
      return;
    }

    wave++;
    let waveMsg = 'INCOMING...';
    if (currentLevel === 2) {
      if (wave === 21) waveMsg = 'TANKS ONLY — BRACE YOURSELF...';
      else if (wave === 70) waveMsg = 'SENTINEL APPROACHING...';
      else if (wave === 71) waveMsg = 'NEW THREAT: PHANTOMS DETECTED...';
      else if (wave === BOSS_WAVE) waveMsg = 'FINAL WAVE — OVERLORD INCOMING';
    } else {
      if (wave === TANK_START_WAVE) waveMsg = 'NEW THREAT DETECTED...';
      else if (wave === BOSS_WAVE) waveMsg = 'FINAL WAVE — BOSS INCOMING';
    }
    showOverlay(`WAVE ${wave}`, waveMsg);
    waveStartDelay = 210;
  }
}

// ── Camera ──
function updateCamera() {
  if (turret) {
    const targetX = turret.x - canvas.width / 2;
    const targetY = turret.y - canvas.height / 2;
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;
  }

  camera.x = Math.max(0, Math.min(MAP_W - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(MAP_H - canvas.height, camera.y));

  camera.shakeX *= 0.82;
  camera.shakeY *= 0.82;

  mouse.worldX = mouse.x + camera.x + camera.shakeX;
  mouse.worldY = mouse.y + camera.y + camera.shakeY;
}

// ── Drawing ──
function drawBackground() {
  // Dark gradient background
  const bgGrad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
  bgGrad.addColorStop(0, '#080810');
  bgGrad.addColorStop(1, '#04040a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const camX = camera.x + camera.shakeX;
  const camY = camera.y + camera.shakeY;

  // Grid lines (subtle)
  const spacing = 80;
  const offX = -camX % spacing;
  const offY = -camY % spacing;

  ctx.strokeStyle = 'rgba(0, 255, 242, 0.018)';
  ctx.lineWidth = 1;
  for (let x = offX; x < canvas.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = offY; y < canvas.height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Grid dots at intersections
  ctx.fillStyle = 'rgba(0, 255, 242, 0.06)';
  for (let x = offX; x < canvas.width; x += spacing) {
    for (let y = offY; y < canvas.height; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Concentric defense rings
  const cx = turret.x - camX;
  const cy = turret.y - camY;
  const rings = [150, 300, 450, 600, 800];
  for (let ri = 0; ri < rings.length; ri++) {
    const r = rings[ri];
    const alpha = 0.02 - ri * 0.003;
    ctx.strokeStyle = `rgba(0, 255, 242, ${Math.max(0.005, alpha)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Directional lines from center (compass)
  ctx.strokeStyle = 'rgba(0, 255, 242, 0.012)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
    ctx.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 900);
    ctx.stroke();
  }
}

function drawWalls() {
  ctx.save();
  ctx.translate(-camera.x - camera.shakeX, -camera.y - camera.shakeY);

  const wt = 6;
  ctx.strokeStyle = COL.cyan;
  ctx.lineWidth = wt;
  ctx.shadowColor = COL.cyan;
  ctx.shadowBlur = 25;
  ctx.strokeRect(wt / 2, wt / 2, MAP_W - wt, MAP_H - wt);

  // Corner accents
  const cornerSize = 80;
  ctx.strokeStyle = COL.orange;
  ctx.shadowColor = COL.orange;
  ctx.lineWidth = 3;
  const corners = [
    [0, 0, cornerSize, 0, 0, cornerSize],
    [MAP_W, 0, MAP_W - cornerSize, 0, MAP_W, cornerSize],
    [0, MAP_H, cornerSize, MAP_H, 0, MAP_H - cornerSize],
    [MAP_W, MAP_H, MAP_W - cornerSize, MAP_H, MAP_W, MAP_H - cornerSize],
  ];
  for (const [cx, cy, x1, y1, x2, y2] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCrosshair() {
  const mx = mouse.x;
  const my = mouse.y;
  const size = 14;
  const innerGap = 5;
  const isAuto = !mouseDown && autoAimTarget;

  ctx.save();
  const color = isAuto ? COL.orange : COL.cyan;
  ctx.strokeStyle = isAuto ? 'rgba(255, 102, 0, 0.7)' : 'rgba(0, 255, 242, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  // Rotating outer ring
  const rot = frameCount * 0.02;
  ctx.beginPath();
  ctx.arc(mx, my, size + 2, rot, rot + 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mx, my, size + 2, rot + Math.PI, rot + Math.PI + 1);
  ctx.stroke();

  // Cross lines
  ctx.beginPath();
  ctx.moveTo(mx - size, my); ctx.lineTo(mx - innerGap, my);
  ctx.moveTo(mx + innerGap, my); ctx.lineTo(mx + size, my);
  ctx.moveTo(mx, my - size); ctx.lineTo(mx, my - innerGap);
  ctx.moveTo(mx, my + innerGap); ctx.lineTo(mx, my + size);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(mx, my, 2, 0, Math.PI * 2);
  ctx.fill();

  // Mode indicator text
  ctx.font = '600 9px Share Tech Mono';
  ctx.fillStyle = isAuto ? 'rgba(255, 102, 0, 0.5)' : 'rgba(0, 255, 242, 0.4)';
  ctx.textAlign = 'center';
  ctx.shadowBlur = 4;
  ctx.fillText(isAuto ? 'AUTO' : 'MANUAL', mx, my + size + 14);

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawMinimap() {
  const mw = minimapCanvas.width;
  const mh = minimapCanvas.height;
  const scaleX = mw / MAP_W;
  const scaleY = mh / MAP_H;

  minimapCtx.clearRect(0, 0, mw, mh);
  minimapCtx.fillStyle = 'rgba(5, 5, 8, 0.85)';
  minimapCtx.fillRect(0, 0, mw, mh);

  minimapCtx.strokeStyle = 'rgba(0, 255, 242, 0.3)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(0, 0, mw, mh);

  if (turret && turret.alive) {
    minimapCtx.fillStyle = COL.cyan;
    minimapCtx.shadowColor = COL.cyan;
    minimapCtx.shadowBlur = 6;
    minimapCtx.beginPath();
    minimapCtx.arc(turret.x * scaleX, turret.y * scaleY, 3, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;

    // Direction arrow showing where turret is aiming
    const tx = turret.x * scaleX;
    const ty = turret.y * scaleY;
    const arrowLen = 14;
    const arrowHead = 5;
    const ang = turret.angle || 0;
    const ax = tx + Math.cos(ang) * arrowLen;
    const ay = ty + Math.sin(ang) * arrowLen;
    minimapCtx.strokeStyle = 'rgba(0, 255, 242, 0.8)';
    minimapCtx.lineWidth = 1.5;
    minimapCtx.beginPath();
    minimapCtx.moveTo(tx, ty);
    minimapCtx.lineTo(ax, ay);
    minimapCtx.stroke();
    // Arrowhead
    minimapCtx.fillStyle = 'rgba(0, 255, 242, 0.8)';
    minimapCtx.beginPath();
    minimapCtx.moveTo(ax, ay);
    minimapCtx.lineTo(ax - Math.cos(ang - 0.5) * arrowHead, ay - Math.sin(ang - 0.5) * arrowHead);
    minimapCtx.lineTo(ax - Math.cos(ang + 0.5) * arrowHead, ay - Math.sin(ang + 0.5) * arrowHead);
    minimapCtx.closePath();
    minimapCtx.fill();

    minimapCtx.strokeStyle = 'rgba(0, 255, 242, 0.12)';
    minimapCtx.lineWidth = 1;
    minimapCtx.beginPath();
    minimapCtx.arc(turret.x * scaleX, turret.y * scaleY, TURRET_RANGE * scaleX, 0, Math.PI * 2);
    minimapCtx.stroke();
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const eCol = enemy.type === 'overlord' ? COL.blue : enemy.type === 'boss' ? COL.purple : enemy.type === 'sentinel' ? COL.teal : enemy.type === 'tank' ? COL.red : enemy.type === 'phantom' ? COL.blue : COL.orange;
    const eSz = (enemy.type === 'overlord' || enemy.type === 'boss') ? 5 : enemy.type === 'sentinel' ? 4 : enemy.type === 'tank' ? 3 : 2;
    minimapCtx.fillStyle = eCol;
    minimapCtx.shadowColor = eCol;
    minimapCtx.shadowBlur = (enemy.type === 'boss' || enemy.type === 'overlord' || enemy.type === 'sentinel') ? 8 : 3;
    minimapCtx.beginPath();
    minimapCtx.arc(enemy.x * scaleX, enemy.y * scaleY, eSz, 0, Math.PI * 2);
    minimapCtx.fill();
  }
  minimapCtx.shadowBlur = 0;

  minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(
    camera.x * scaleX, camera.y * scaleY,
    canvas.width * scaleX, canvas.height * scaleY);
}

// ── Vignette ──
function drawVignette() {
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.75);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ── Death screen effect ──
function drawDeathEffect() {
  const progress = Math.min(1, deathTimer / 60);
  // Red tint
  ctx.fillStyle = `rgba(255, 0, 30, ${progress * 0.15})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Static noise
  if (progress > 0.3) {
    ctx.globalAlpha = (progress - 0.3) * 0.1;
    for (let i = 0; i < 50; i++) {
      const nx = Math.random() * canvas.width;
      const ny = Math.random() * canvas.height;
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(nx, ny, Math.random() * 3, Math.random() * 2);
    }
    ctx.globalAlpha = 1;
  }
}

// ── HUD ──
function updateHUD() {
  document.getElementById('hp-val').textContent = turret ? Math.ceil(turret.hp) : 0;
  document.getElementById('kills-val').textContent = totalKills;
  document.getElementById('level-val').textContent = currentLevel;
  document.getElementById('wave-val').textContent = wave;
  document.getElementById('enemies-val').textContent = Math.max(0, waveEnemiesTotal - waveEnemiesKilled);
  document.getElementById('score-val').textContent = score;
  document.getElementById('gold-val').textContent = gold;
  document.getElementById('gems-val').textContent = gems;

  // Fire mode indicator
  const modeEl = document.getElementById('mode-val');
  if (mouseDown) {
    modeEl.textContent = 'MANUAL';
    modeEl.style.color = COL.cyan;
  } else if (autoAimTarget) {
    modeEl.textContent = 'AUTO';
    modeEl.style.color = COL.orange;
  } else {
    modeEl.textContent = 'IDLE';
    modeEl.style.color = 'rgba(0, 255, 242, 0.4)';
  }

  // EMP HUD (solo si esta equipado)
  const empSlot = document.getElementById('ability-emp');
  if (empSlot) {
    const cdEl = empSlot.querySelector('.ability-cooldown');
    if (empCooldown > 0) {
      empSlot.classList.remove('ready');
      if (!cdEl) {
        const div = document.createElement('div');
        div.className = 'ability-cooldown';
        div.textContent = Math.ceil(empCooldown / 60) + 's';
        empSlot.appendChild(div);
      } else {
        cdEl.textContent = Math.ceil(empCooldown / 60) + 's';
      }
    } else {
      empSlot.classList.add('ready');
      if (cdEl) cdEl.remove();
    }
  }
}

// ── Upgrades Panel ──
function drawUpgradesPanel() {
  if (!upgradesPanelOpen) {
    ctx.save();
    ctx.font = '600 10px Share Tech Mono';
    ctx.fillStyle = 'rgba(0, 255, 242, 0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('[B] UPGRADES', canvas.width / 2, canvas.height - 85);
    ctx.restore();
    return;
  }

  const upgradeKeys = ['damage', 'fireRate', 'precision', 'doubleBul', 'health'];
  const panelW = 440;
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

  // Title
  ctx.font = '900 18px Orbitron';
  ctx.fillStyle = COL.cyan;
  ctx.shadowColor = COL.cyan;
  ctx.shadowBlur = 12;
  ctx.textAlign = 'center';
  ctx.fillText('UPGRADES', px + panelW / 2, py + 30);
  ctx.shadowBlur = 0;

  // Gold display
  ctx.font = '700 13px Share Tech Mono';
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 6;
  ctx.fillText(`GOLD: ${gold}`, px + panelW / 2, py + 50);
  ctx.shadowBlur = 0;

  // Separator
  ctx.strokeStyle = 'rgba(0, 255, 242, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px + 20, py + 60); ctx.lineTo(px + panelW - 20, py + 60); ctx.stroke();

  // Rows
  const startY = py + 70;

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
    ctx.font = '700 11px Orbitron';
    ctx.fillStyle = canBuy ? '#fff' : 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'left';
    ctx.fillText(upg.label, px + 80, ry + 18);

    // Tier badge
    if (tierNum > 0) {
      const tierText = `T${tierNum + 1}`;
      const tx = px + 80 + ctx.measureText(upg.label).width + 8;
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
    ctx.font = '600 9px Share Tech Mono';
    ctx.fillStyle = canBuy ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)';
    ctx.textAlign = 'left';
    const desc = getUpgradeDesc(upg);
    const totalPct = Math.round(getUpgradeValue(upg) * 100);
    ctx.fillText(`${desc}  [total: ${totalPct}%]`, px + 80, ry + 33);

    // Progress pips (10 per tier, fills and resets)
    const maxPips = PIPS_PER_TIER;
    const pipW = 7;
    const pipH = 4;
    const pipStartX = px + 268;
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
    ctx.fillText(`LVL ${upg.level}`, pipStartX + (maxPips * (pipW + 2)) / 2 - 1, ry + 24);

    // Cost / MAX
    ctx.font = '700 11px Orbitron';
    ctx.textAlign = 'right';
    if (isMaxed) {
      ctx.fillStyle = upg.color;
      ctx.shadowColor = upg.color;
      ctx.shadowBlur = 6;
      ctx.fillText('MAX', px + panelW - 22, ry + 28);
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
  ctx.fillText('[B] CLOSE    [1-5] BUY', px + panelW / 2, py + panelH - 10);

  ctx.restore();
}

// ── HUD Currency Icons (drawn on canvas for fanciness) ──
function drawHUDIcons() {
  // Gold coin icon next to gold counter
  const goldEl = document.getElementById('gold-val');
  if (goldEl) {
    const rect = goldEl.getBoundingClientRect();
    drawCoinIcon(rect.left - 14, rect.top + rect.height / 2, 16, ctx);
  }
  // Gem icon next to gem counter
  const gemEl = document.getElementById('gems-val');
  if (gemEl) {
    const rect = gemEl.getBoundingClientRect();
    drawGemIcon(rect.left - 14, rect.top + rect.height / 2, 16, ctx);
  }
}

// ── Overlay ──
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const overlaySub = document.getElementById('overlay-sub');

function showOverlay(text, sub = '') {
  overlay.classList.remove('hidden');
  overlayText.textContent = text;
  overlaySub.textContent = sub;
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

// ── Save Progress (server API) ──
let gemsbanked = 0;

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

// ── Init ──
function initGame() {
  turret = new Turret();
  bullets = [];
  enemies = [];
  particles = [];
  floatingTexts = [];
  empWaves = [];
  groundDecals = [];
  frameCount = 0;
  wave = 1;
  score = 0;
  totalKills = 0;
  empCooldown = 0;
  fireTimer = 0;
  deathTimer = 0;
  autoAimTarget = null;
  gold = 0;
  gems = 0;
  rewardPopups = [];
  upgradesPanelOpen = false;
  waveTanksToSpawn = 0;
  waveBossToSpawn = 0;
  waveTanksSpawned = 0;
  waveBossSpawned = 0;
  wavePhantomsToSpawn = 0;
  waveSentinelToSpawn = 0;
  waveOverlordToSpawn = 0;
  wavePhantomsSpawned = 0;
  waveSentinelSpawned = 0;
  waveOverlordSpawned = 0;
  levelStartTime = Date.now();
  gemsbanked = 0;
  for (const key in upgrades) { upgrades[key].level = 0; upgrades[key].tier = 0; }

  camera.x = turret.x - canvas.width / 2;
  camera.y = turret.y - canvas.height / 2;
  camera.shakeX = 0;
  camera.shakeY = 0;

  startWave();
}

// ── Main Game Loop ──
function gameLoop() {
  if (gameState !== 'playing' && gameState !== 'victory') return;
  if (gameState === 'victory') {
    // Keep rendering but no updates, just wait for redirect
    requestAnimationFrame(gameLoop);
    return;
  }
  frameCount++;

  // Auto-save periodico
  autoSaveTimer++;
  if (autoSaveTimer >= AUTOSAVE_INTERVAL) {
    autoSaveTimer = 0;
    doAutoSave();
  }

  // EMP input (solo si esta desbloqueado)
  if (keys.space && empCooldown <= 0 && hasAbility('emp')) {
    triggerEMP();
  }
  if (empCooldown > 0) empCooldown--;

  // Wave delay
  if (wavePaused) {
    waveStartDelay--;
    if (waveStartDelay <= 0) {
      hideOverlay();
      startWave();
    }
  }

  // Update
  turret.update();
  updateWaveSpawning();

  for (const enemy of enemies) enemy.update();
  for (const bullet of bullets) bullet.update();

  checkBulletCollisions();
  updateParticles();
  updateFloatingTexts();
  updateRewardPopups();
  updateEMPWaves();
  updateCamera();

  // Cleanup
  bullets = bullets.filter(b => b.alive);
  enemies = enemies.filter(e => e.alive);

  // Draw
  drawBackground();

  ctx.save();
  ctx.translate(-camera.x - camera.shakeX, -camera.y - camera.shakeY);

  drawGroundDecals(ctx);
  turret.draw(ctx);
  for (const enemy of enemies) enemy.draw(ctx);
  for (const bullet of bullets) bullet.draw(ctx);
  drawParticles(ctx);
  drawFloatingTexts(ctx);
  drawEMPWaves(ctx);

  ctx.restore();

  drawWalls();
  drawVignette();
  drawCrosshair();
  drawRewardPopups();
  drawMinimap();
  drawHUDIcons();
  drawUpgradesPanel();
  updateHUD();

  // Game over: go back to levels after delay
  if (!turret.alive) {
    deathTimer++;
    drawDeathEffect();

    if (deathTimer === 1) {
      saveProgress();
      // Limpiar auto-save al morir (ya se guardo el progreso final)
      fetch('/api/autosave', { method: 'DELETE' }).catch(() => {});
      showOverlay('SYSTEM OFFLINE', `WAVE ${wave} / ${MAX_WAVES} | SCORE: ${score} — RETURNING TO LEVELS...`);
    }

    if (deathTimer >= DEATH_RETURN_DELAY) {
      window.location.href = '/levels.html';
      return;
    }
  }

  requestAnimationFrame(gameLoop);
}

// ── Countdown & Start ──
async function startGame() {
  // Load server data (perm upgrades, gems, abilities) before starting
  await loadServerGameData();
  applyPermBonuses();
  buildAbilityBar();

  initGame();
  gameState = 'countdown';

  for (let i = 3; i >= 1; i--) {
    showOverlay(i.toString(), 'INITIALIZING DEFENSE GRID...');
    await sleep(700);
  }

  showOverlay('DEFEND!', '');
  await sleep(500);
  hideOverlay();

  gameState = 'playing';
  requestAnimationFrame(gameLoop);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

canvas.style.cursor = 'none';

// ── Auto-save al cerrar/salir de la pagina ──
window.addEventListener('beforeunload', () => {
  if (gameState === 'playing' && turret && turret.alive) {
    navigator.sendBeacon('/api/autosave', new Blob([JSON.stringify({
      wave, score, gold, gems, hp: turret.hp, totalKills, level: currentLevel,
    })], { type: 'application/json' }));
  }
});

// ── Start ──
startGame();
