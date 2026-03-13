// ═══════════════════════════════════════════
//  rendering.js — World rendering, HUD, UI overlays
//  Depends on: config.js, particles.js (drawGemIcon, drawCoinIcon),
//              upgrades-panel.js (drawUpgradesPanel)
// ═══════════════════════════════════════════

// ── Canvas resize ──
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

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
