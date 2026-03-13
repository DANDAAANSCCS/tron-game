// ═══════════════════════════════════════════
//  turret.js — Turret class and lerpAngle utility
//  Depends on: config.js, upgrades-panel.js, particles.js
// ═══════════════════════════════════════════

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
