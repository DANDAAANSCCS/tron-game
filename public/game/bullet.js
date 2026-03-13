// ═══════════════════════════════════════════
//  bullet.js — Bullet class
//  Depends on: config.js, particles.js
// ═══════════════════════════════════════════

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
