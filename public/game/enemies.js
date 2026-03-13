// ═══════════════════════════════════════════
//  enemies.js — Enemy class with all draw methods
//  Enemigo 1: Runner, Enemigo 2: Tank, Enemigo 3: Boss,
//  Enemigo 4: Phantom, Enemigo 5: Sentinel, Enemigo 6: Overlord
//  Depends on: config.js, particles.js
// ═══════════════════════════════════════════

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
