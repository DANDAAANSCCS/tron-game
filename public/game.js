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
const FIRE_RATE = 8; // frames between shots
const EMP_COOLDOWN = 600; // 10 seconds
const EMP_RADIUS = 350;
const EMP_DAMAGE = 60;
const PLAYER_MAX_HP = 100;

// ── Enemy config ──
const ENEMY_BASE_HP = 50;
const ENEMY_BASE_SPEED = 1.2;
const ENEMY_RADIUS = 12;
const ENEMY_DAMAGE = 10;
const ENEMY_ATTACK_RANGE = 40;

// ── Colors ──
const COL = {
  cyan: '#00fff2',
  orange: '#ff6600',
  red: '#ff0055',
  green: '#00ff66',
  yellow: '#ffdd00',
  purple: '#aa00ff',
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

let camera = { x: 0, y: 0 };
let mouse = { x: 0, y: 0, worldX: CENTER_X, worldY: CENTER_Y };
let mouseDown = false;
let keys = {};

let fireTimer = 0;
let empCooldown = 0;

// Wave management
let waveEnemiesTotal = 0;
let waveEnemiesSpawned = 0;
let waveEnemiesKilled = 0;
let spawnTimer = 0;
let spawnInterval = 60;
let wavePaused = false;
let waveStartDelay = 0;

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

// ── Turret ──
class Turret {
  constructor() {
    this.x = CENTER_X;
    this.y = CENTER_Y;
    this.angle = 0;
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.radius = TURRET_RADIUS;
    this.alive = true;
    this.damageFlash = 0;
  }

  update() {
    // Point towards mouse
    const dx = mouse.worldX - this.x;
    const dy = mouse.worldY - this.y;
    this.angle = Math.atan2(dy, dx);

    if (this.damageFlash > 0) this.damageFlash--;

    // Auto-fire when mouse is held
    if (mouseDown && fireTimer <= 0 && this.alive) {
      this.shoot();
      fireTimer = FIRE_RATE;
    }
    if (fireTimer > 0) fireTimer--;
  }

  shoot() {
    const bx = this.x + Math.cos(this.angle) * (this.radius + 10);
    const by = this.y + Math.sin(this.angle) * (this.radius + 10);
    bullets.push(new Bullet(bx, by, this.angle));

    // Muzzle flash particles
    for (let i = 0; i < 4; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      spawnParticle(bx, by,
        Math.cos(this.angle + spread) * (3 + Math.random() * 4),
        Math.sin(this.angle + spread) * (3 + Math.random() * 4),
        COL.cyan, 10 + Math.random() * 10, 2);
    }
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.damageFlash = 15;
    // Screen shake
    camera.shakeX = (Math.random() - 0.5) * 8;
    camera.shakeY = (Math.random() - 0.5) * 8;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      spawnExplosion(this.x, this.y, COL.cyan, 60);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Range circle (subtle)
    ctx.strokeStyle = 'rgba(0, 255, 242, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, TURRET_RANGE, 0, Math.PI * 2);
    ctx.stroke();

    // Base platform - hexagonal
    ctx.rotate(Math.PI / 6);
    const hex = 30;
    ctx.strokeStyle = this.damageFlash > 0 ? 'rgba(255, 0, 85, 0.6)' : 'rgba(0, 255, 242, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * hex;
      const py = Math.sin(a) * hex;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner hex
    ctx.strokeStyle = 'rgba(0, 255, 242, 0.1)';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const px = Math.cos(a) * 18;
      const py = Math.sin(a) * 18;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.rotate(-Math.PI / 6);

    // Rotating ring
    const ringAngle = frameCount * 0.01;
    ctx.strokeStyle = 'rgba(0, 255, 242, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const a = ringAngle + (i / 3) * Math.PI * 2;
      const r1 = 24;
      const r2 = 28;
      ctx.beginPath();
      ctx.arc(0, 0, r1, a, a + 0.4);
      ctx.stroke();
    }

    // Core glow
    const coreGlow = 0.5 + Math.sin(frameCount * 0.05) * 0.15;
    ctx.fillStyle = this.damageFlash > 0
      ? `rgba(255, 0, 85, ${coreGlow})`
      : `rgba(0, 255, 242, ${coreGlow})`;
    ctx.shadowColor = this.damageFlash > 0 ? COL.red : COL.cyan;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cannon barrel
    ctx.rotate(this.angle);
    ctx.fillStyle = COL.cyan;
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur = 15;
    // Barrel
    ctx.fillRect(10, -3, 25, 6);
    // Barrel tip
    ctx.fillStyle = '#fff';
    ctx.fillRect(33, -4, 4, 8);
    // Barrel base
    ctx.fillStyle = 'rgba(0, 255, 242, 0.4)';
    ctx.fillRect(5, -5, 8, 10);

    ctx.shadowBlur = 0;
    ctx.restore();

    // HP bar below turret
    this.drawHpBar(ctx);
  }

  drawHpBar(ctx) {
    const barW = 50;
    const barH = 5;
    const bx = this.x - barW / 2;
    const by = this.y + 40;
    const ratio = this.hp / this.maxHp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

    const hpColor = ratio > 0.5 ? COL.green : ratio > 0.25 ? COL.yellow : COL.red;
    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(bx, by, barW * ratio, barH);
    ctx.shadowBlur = 0;
  }
}

// ── Bullet ──
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
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

    // Trail particle
    if (frameCount % 2 === 0) {
      spawnParticle(this.x, this.y, 0, 0, COL.cyan, 8, 1.5);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow
    ctx.fillStyle = 'rgba(0, 255, 242, 0.4)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ── Enemy: Runner ──
class Enemy {
  constructor(x, y, hp, speed) {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.radius = ENEMY_RADIUS;
    this.alive = true;
    this.angle = 0;
    this.damageFlash = 0;
    this.attackTimer = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.03 + Math.random() * 0.02;
  }

  update() {
    if (!this.alive) return;

    const dx = turret.x - this.x;
    const dy = turret.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);

    if (this.damageFlash > 0) this.damageFlash--;

    // Move towards turret
    if (dist > ENEMY_ATTACK_RANGE) {
      // Slight wobble for organic movement
      this.wobble += this.wobbleSpeed;
      const wobbleAngle = this.angle + Math.sin(this.wobble) * 0.3;
      this.x += Math.cos(wobbleAngle) * this.speed;
      this.y += Math.sin(wobbleAngle) * this.speed;
    } else {
      // Attack turret
      this.attackTimer++;
      if (this.attackTimer >= 60) {
        this.attackTimer = 0;
        if (turret.alive) {
          turret.takeDamage(ENEMY_DAMAGE);
          spawnFloatingText(turret.x, turret.y - 30, `-${ENEMY_DAMAGE}`, COL.red);
        }
      }
    }

    // Enemy trail particle
    if (frameCount % 8 === 0) {
      spawnParticle(this.x, this.y, 0, 0, COL.orange, 15, 2);
    }
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.damageFlash = 8;
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    spawnExplosion(this.x, this.y, COL.orange, 20);
    score += 10;
    totalKills++;
    waveEnemiesKilled++;
    spawnFloatingText(this.x, this.y - 15, '+10', COL.yellow);
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Outer glow ring
    const pulse = 0.5 + Math.sin(frameCount * 0.08 + this.wobble) * 0.2;
    ctx.strokeStyle = `rgba(255, 102, 0, ${pulse * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Body - diamond shape
    ctx.rotate(this.angle);
    ctx.fillStyle = this.damageFlash > 0 ? '#fff' : COL.orange;
    ctx.shadowColor = COL.orange;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(0, -this.radius * 0.6);
    ctx.lineTo(-this.radius * 0.7, 0);
    ctx.lineTo(0, this.radius * 0.6);
    ctx.closePath();
    ctx.fill();

    // Inner core
    ctx.fillStyle = this.damageFlash > 0 ? COL.orange : '#fff';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // "Eye" line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(this.radius - 2, 0);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.shadowBlur = 0;
    ctx.restore();

    // HP bar
    if (this.hp < this.maxHp) {
      const barW = 24;
      const barH = 3;
      const bx = this.x - barW / 2;
      const by = this.y - this.radius - 8;
      const ratio = this.hp / this.maxHp;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = ratio > 0.5 ? COL.green : ratio > 0.25 ? COL.yellow : COL.red;
      ctx.fillRect(bx, by, barW * ratio, barH);
    }
  }
}

// ── Particles ──
function spawnParticle(x, y, vx, vy, color, life, size) {
  particles.push({ x, y, vx, vy, color, life, maxLife: life, size });
}

function spawnExplosion(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 5;
    spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, 30 + Math.random() * 30, 2 + Math.random() * 3);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha * 0.7;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// ── Floating Text ──
function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color, life: 50 });
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].life--;
    floatingTexts[i].y -= 0.8;
    if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
  }
}

function drawFloatingTexts(ctx) {
  for (const ft of floatingTexts) {
    const alpha = ft.life / 50;
    ctx.globalAlpha = alpha;
    ctx.font = '700 13px Orbitron';
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// ── EMP Ability ──
function triggerEMP() {
  if (empCooldown > 0 || !turret.alive) return;
  empCooldown = EMP_COOLDOWN;

  // Visual wave
  empWaves.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: EMP_RADIUS, life: 30 });

  // Damage enemies in range
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dist = Math.hypot(enemy.x - turret.x, enemy.y - turret.y);
    if (dist < EMP_RADIUS) {
      enemy.takeDamage(EMP_DAMAGE);
      // Push back
      const angle = Math.atan2(enemy.y - turret.y, enemy.x - turret.x);
      enemy.x += Math.cos(angle) * 40;
      enemy.y += Math.sin(angle) * 40;
    }
  }

  // Particles
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * EMP_RADIUS;
    spawnParticle(
      turret.x + Math.cos(a) * r,
      turret.y + Math.sin(a) * r,
      Math.cos(a) * 2, Math.sin(a) * 2,
      COL.cyan, 20 + Math.random() * 20, 2);
  }
}

function updateEMPWaves() {
  for (let i = empWaves.length - 1; i >= 0; i--) {
    const w = empWaves[i];
    w.radius += (w.maxRadius - w.radius) * 0.15;
    w.life--;
    if (w.life <= 0) empWaves.splice(i, 1);
  }
}

function drawEMPWaves(ctx) {
  for (const w of empWaves) {
    const alpha = w.life / 30;
    ctx.strokeStyle = `rgba(0, 255, 242, ${alpha * 0.6})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius * 0.7, 0, Math.PI * 2);
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
        enemy.takeDamage(BULLET_DAMAGE);
        // Impact particles
        for (let i = 0; i < 5; i++) {
          const a = Math.random() * Math.PI * 2;
          spawnParticle(bullet.x, bullet.y, Math.cos(a) * 3, Math.sin(a) * 3, COL.cyan, 12, 2);
        }
        break;
      }
    }
  }
}

// ── Wave System ──
function startWave() {
  waveEnemiesTotal = 5 + wave * 3;
  waveEnemiesSpawned = 0;
  waveEnemiesKilled = 0;
  spawnInterval = Math.max(15, 60 - wave * 3);
  spawnTimer = 0;
  wavePaused = false;
}

function spawnEnemy() {
  // Spawn from edges
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 50;

  switch (side) {
    case 0: x = margin; y = margin + Math.random() * (MAP_H - margin * 2); break;
    case 1: x = MAP_W - margin; y = margin + Math.random() * (MAP_H - margin * 2); break;
    case 2: x = margin + Math.random() * (MAP_W - margin * 2); y = margin; break;
    case 3: x = margin + Math.random() * (MAP_W - margin * 2); y = MAP_H - margin; break;
  }

  const hpScale = 1 + (wave - 1) * 0.3;
  const speedScale = 1 + (wave - 1) * 0.08;

  enemies.push(new Enemy(x, y,
    Math.round(ENEMY_BASE_HP * hpScale),
    ENEMY_BASE_SPEED * speedScale
  ));
  waveEnemiesSpawned++;
}

function updateWaveSpawning() {
  if (wavePaused) return;

  if (waveEnemiesSpawned < waveEnemiesTotal) {
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnEnemy();
    }
  }

  // Wave complete check
  if (waveEnemiesKilled >= waveEnemiesTotal) {
    wavePaused = true;
    wave++;
    score += wave * 50;

    showOverlay(`WAVE ${wave}`, 'INCOMING...');
    waveStartDelay = 180; // 3 seconds
  }
}

// ── Camera ──
camera = { x: 0, y: 0, shakeX: 0, shakeY: 0 };

function updateCamera() {
  if (turret) {
    const targetX = turret.x - canvas.width / 2;
    const targetY = turret.y - canvas.height / 2;
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;
  }

  camera.x = Math.max(0, Math.min(MAP_W - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(MAP_H - canvas.height, camera.y));

  // Decay shake
  camera.shakeX *= 0.85;
  camera.shakeY *= 0.85;

  // Update mouse world position
  mouse.worldX = mouse.x + camera.x + camera.shakeX;
  mouse.worldY = mouse.y + camera.y + camera.shakeY;
}

// ── Drawing ──
function drawBackground() {
  ctx.fillStyle = '#06060a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid dots
  const spacing = 80;
  const offX = -(camera.x + camera.shakeX) % spacing;
  const offY = -(camera.y + camera.shakeY) % spacing;

  ctx.fillStyle = 'rgba(0, 255, 242, 0.05)';
  for (let x = offX; x < canvas.width; x += spacing) {
    for (let y = offY; y < canvas.height; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle grid lines near center
  const cx = turret.x - camera.x - camera.shakeX;
  const cy = turret.y - camera.y - camera.shakeY;
  ctx.strokeStyle = 'rgba(0, 255, 242, 0.02)';
  ctx.lineWidth = 1;

  // Concentric defense rings (in world space, drawn relative)
  const rings = [200, 400, 600, 800];
  for (const r of rings) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
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
  const size = 12;

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 255, 242, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = COL.cyan;
  ctx.shadowBlur = 8;

  // Cross
  ctx.beginPath();
  ctx.moveTo(mx - size, my);
  ctx.lineTo(mx - 4, my);
  ctx.moveTo(mx + 4, my);
  ctx.lineTo(mx + size, my);
  ctx.moveTo(mx, my - size);
  ctx.lineTo(mx, my - 4);
  ctx.moveTo(mx, my + 4);
  ctx.lineTo(mx, my + size);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = COL.cyan;
  ctx.beginPath();
  ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
  ctx.fill();

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

  // Turret
  if (turret) {
    minimapCtx.fillStyle = COL.cyan;
    minimapCtx.shadowColor = COL.cyan;
    minimapCtx.shadowBlur = 6;
    minimapCtx.beginPath();
    minimapCtx.arc(turret.x * scaleX, turret.y * scaleY, 3, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;

    // Range circle
    minimapCtx.strokeStyle = 'rgba(0, 255, 242, 0.15)';
    minimapCtx.beginPath();
    minimapCtx.arc(turret.x * scaleX, turret.y * scaleY, TURRET_RANGE * scaleX, 0, Math.PI * 2);
    minimapCtx.stroke();
  }

  // Enemies
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    minimapCtx.fillStyle = COL.orange;
    minimapCtx.beginPath();
    minimapCtx.arc(enemy.x * scaleX, enemy.y * scaleY, 2, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  // Viewport
  minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(
    camera.x * scaleX, camera.y * scaleY,
    canvas.width * scaleX, canvas.height * scaleY
  );
}

// ── HUD ──
function updateHUD() {
  document.getElementById('hp-val').textContent = turret ? Math.ceil(turret.hp) : 0;
  document.getElementById('kills-val').textContent = totalKills;
  document.getElementById('wave-val').textContent = wave;
  document.getElementById('enemies-val').textContent = Math.max(0, waveEnemiesTotal - waveEnemiesKilled);
  document.getElementById('score-val').textContent = score;

  // Ability cooldown display
  const empSlot = document.getElementById('ability-emp');
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

// ── Init ──
function initGame() {
  turret = new Turret();
  bullets = [];
  enemies = [];
  particles = [];
  floatingTexts = [];
  empWaves = [];
  frameCount = 0;
  wave = 1;
  score = 0;
  totalKills = 0;
  empCooldown = 0;
  fireTimer = 0;

  camera.x = turret.x - canvas.width / 2;
  camera.y = turret.y - canvas.height / 2;
  camera.shakeX = 0;
  camera.shakeY = 0;

  startWave();
}

// ── Main Game Loop ──
function gameLoop() {
  if (gameState !== 'playing') return;
  frameCount++;

  // EMP input
  if (keys.space && empCooldown <= 0) {
    triggerEMP();
  }
  if (empCooldown > 0) empCooldown--;

  // Wave delay between rounds
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
  updateEMPWaves();
  updateCamera();

  // Cleanup dead
  bullets = bullets.filter(b => b.alive);
  enemies = enemies.filter(e => e.alive || e.hp > 0); // keep briefly for death anim

  // Draw
  drawBackground();

  ctx.save();
  ctx.translate(-camera.x - camera.shakeX, -camera.y - camera.shakeY);

  turret.draw(ctx);

  for (const enemy of enemies) enemy.draw(ctx);
  for (const bullet of bullets) bullet.draw(ctx);

  drawParticles(ctx);
  drawFloatingTexts(ctx);
  drawEMPWaves(ctx);

  ctx.restore();

  drawWalls();
  drawCrosshair();
  drawMinimap();
  updateHUD();

  // Game over check
  if (!turret.alive) {
    gameState = 'gameover';
    showOverlay('SYSTEM OFFLINE', `SCORE: ${score} — PRESS ENTER TO RETRY`);
    waitForRestart();
    return;
  }

  requestAnimationFrame(gameLoop);
}

function waitForRestart() {
  function onKey(e) {
    if (e.key === 'Enter') {
      window.removeEventListener('keydown', onKey);
      startGame();
    }
  }
  window.addEventListener('keydown', onKey);
}

// ── Countdown & Start ──
async function startGame() {
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

// Hide default cursor over game
canvas.style.cursor = 'none';

// ── Start ──
startGame();
