// ═══════════════════════════════════════════
//  emp.js — EMP ability: trigger, update, draw
//  Depends on: config.js, particles.js
// ═══════════════════════════════════════════

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
