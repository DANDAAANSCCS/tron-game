// ═══════════════════════════════════════════
//  particles.js — Visual effects: particles, ground decals, floating texts,
//                 reward popups, gem icon, coin icon
//  Depends on: config.js
// ═══════════════════════════════════════════

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
