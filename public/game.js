// ═══════════════════════════════════════════
//  TRON LIGHT CYCLES — Free Movement, Big Map
// ═══════════════════════════════════════════

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

// ── Config ──
const MAP_W = 6000;
const MAP_H = 6000;
const WALL_THICKNESS = 8;
const PLAYER_SPEED = 4.5;
const AI_COUNT = 5;
const TURN_SPEED = 0.045;
const TRAIL_WIDTH = 3;
const BOOST_SPEED = 7;
const BOOST_DURATION = 120; // frames
const BOOST_COOLDOWN = 300;
const COLLISION_GRACE = 60; // frames of invulnerability at start

// ── Colors ──
const COLORS = [
  { main: '#00fff2', glow: 'rgba(0,255,242,', name: 'Cyan' },
  { main: '#ff6600', glow: 'rgba(255,102,0,', name: 'Orange' },
  { main: '#ff0055', glow: 'rgba(255,0,85,',  name: 'Red' },
  { main: '#aa00ff', glow: 'rgba(170,0,255,', name: 'Purple' },
  { main: '#00ff66', glow: 'rgba(0,255,102,', name: 'Green' },
  { main: '#ffdd00', glow: 'rgba(255,221,0,', name: 'Yellow' },
];

// ── State ──
let player, bikes, camera, keys, gameState, frameCount, round;

// ── Canvas resize ──
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ── Input ──
keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') keys.space = true;
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === ' ') keys.space = false;
});

// ── Bike class ──
class Bike {
  constructor(x, y, angle, colorIndex, isPlayer = false) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = PLAYER_SPEED;
    this.baseSpeed = PLAYER_SPEED;
    this.colorIndex = colorIndex;
    this.color = COLORS[colorIndex];
    this.isPlayer = isPlayer;
    this.alive = true;
    this.trail = [{ x, y }];
    this.trailSegments = []; // precomputed line segments for collision
    this.boosting = false;
    this.boostTimer = 0;
    this.boostCooldown = 0;
    this.frame = 0;

    // AI properties
    this.aiTurnTarget = angle;
    this.aiNextDecision = 0;
    this.aiAggression = 0.3 + Math.random() * 0.5;
  }

  update() {
    if (!this.alive) return;
    this.frame++;

    if (this.isPlayer) {
      this.handlePlayerInput();
    } else {
      this.handleAI();
    }

    // Boost logic
    if (this.boostCooldown > 0) this.boostCooldown--;
    if (this.boosting) {
      this.speed = BOOST_SPEED;
      this.boostTimer--;
      if (this.boostTimer <= 0) {
        this.boosting = false;
        this.speed = this.baseSpeed;
        this.boostCooldown = BOOST_COOLDOWN;
      }
    } else {
      this.speed = this.baseSpeed;
    }

    // Move
    const prevX = this.x;
    const prevY = this.y;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // Record trail
    const last = this.trail[this.trail.length - 1];
    const dx = this.x - last.x;
    const dy = this.y - last.y;
    if (dx * dx + dy * dy > 4) {
      this.trail.push({ x: this.x, y: this.y });
      // Keep segments array updated
      if (this.trail.length >= 2) {
        const len = this.trail.length;
        this.trailSegments.push({
          x1: this.trail[len - 2].x,
          y1: this.trail[len - 2].y,
          x2: this.trail[len - 1].x,
          y2: this.trail[len - 1].y,
        });
      }
    }

    // Wall collision
    if (this.x < WALL_THICKNESS || this.x > MAP_W - WALL_THICKNESS ||
        this.y < WALL_THICKNESS || this.y > MAP_H - WALL_THICKNESS) {
      this.die();
    }
  }

  handlePlayerInput() {
    if (keys['arrowleft'] || keys['a']) {
      this.angle -= TURN_SPEED;
    }
    if (keys['arrowright'] || keys['d']) {
      this.angle += TURN_SPEED;
    }
    if (keys.space && !this.boosting && this.boostCooldown <= 0) {
      this.boosting = true;
      this.boostTimer = BOOST_DURATION;
    }
  }

  handleAI() {
    if (this.frame % 5 === 0) {
      this.aiDecide();
    }
    // Smooth turn towards target
    let diff = this.aiTurnTarget - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const turnRate = TURN_SPEED * 0.8;
    if (Math.abs(diff) < turnRate) {
      this.angle = this.aiTurnTarget;
    } else {
      this.angle += Math.sign(diff) * turnRate;
    }

    // Random boost
    if (!this.boosting && this.boostCooldown <= 0 && Math.random() < 0.002) {
      this.boosting = true;
      this.boostTimer = BOOST_DURATION * 0.5;
    }
  }

  aiDecide() {
    const lookAhead = 120 + this.speed * 20;

    // Check multiple directions
    let bestAngle = this.angle;
    let bestDist = this.raycast(this.angle, lookAhead);

    const checks = [-0.3, -0.15, 0.15, 0.3, -0.6, 0.6];
    for (const offset of checks) {
      const testAngle = this.angle + offset;
      const dist = this.raycast(testAngle, lookAhead);
      if (dist > bestDist) {
        bestDist = dist;
        bestAngle = testAngle;
      }
    }

    // If danger is close, turn harder
    const forwardDist = this.raycast(this.angle, lookAhead);
    if (forwardDist < 80) {
      // Emergency turn - check wider angles
      const wideChecks = [-1.2, -0.9, 0.9, 1.2, -Math.PI / 2, Math.PI / 2];
      for (const offset of wideChecks) {
        const testAngle = this.angle + offset;
        const dist = this.raycast(testAngle, lookAhead);
        if (dist > bestDist) {
          bestDist = dist;
          bestAngle = testAngle;
        }
      }
    }

    this.aiTurnTarget = bestAngle;
  }

  raycast(angle, maxDist) {
    const step = 6;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let d = 20; d < maxDist; d += step) {
      const px = this.x + cos * d;
      const py = this.y + sin * d;

      // Wall check
      if (px < WALL_THICKNESS + 10 || px > MAP_W - WALL_THICKNESS - 10 ||
          py < WALL_THICKNESS + 10 || py > MAP_H - WALL_THICKNESS - 10) {
        return d;
      }

      // Trail check
      for (const bike of bikes) {
        if (!bike.alive && bike !== this) continue;
        const segs = bike.trailSegments;
        const skipLast = (bike === this) ? 10 : 0;
        const len = segs.length - skipLast;
        for (let i = Math.max(0, len - 300); i < len; i++) {
          const s = segs[i];
          if (pointToSegmentDist(px, py, s.x1, s.y1, s.x2, s.y2) < TRAIL_WIDTH + 3) {
            return d;
          }
        }
      }
    }
    return maxDist;
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    spawnExplosion(this.x, this.y, this.color.main);
  }

  draw(ctx, cam) {
    if (this.trail.length < 2) return;

    // Draw trail
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Trail glow (outer)
    ctx.strokeStyle = this.color.glow + '0.15)';
    ctx.lineWidth = TRAIL_WIDTH * 4;
    ctx.shadowColor = this.color.main;
    ctx.shadowBlur = 20;
    this.drawTrailPath(ctx);
    ctx.stroke();

    // Trail core
    ctx.shadowBlur = 0;
    ctx.strokeStyle = this.alive ? this.color.glow + '0.7)' : this.color.glow + '0.25)';
    ctx.lineWidth = TRAIL_WIDTH;
    this.drawTrailPath(ctx);
    ctx.stroke();

    // Bright head
    if (this.alive) {
      ctx.strokeStyle = this.color.main;
      ctx.lineWidth = TRAIL_WIDTH + 1;
      ctx.shadowColor = this.color.main;
      ctx.shadowBlur = 25;
      const len = this.trail.length;
      if (len >= 2) {
        ctx.beginPath();
        ctx.moveTo(this.trail[len - 2].x, this.trail[len - 2].y);
        ctx.lineTo(this.trail[len - 1].x, this.trail[len - 1].y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Draw bike head
    if (this.alive) {
      this.drawBike(ctx);
    }
  }

  drawTrailPath(ctx) {
    ctx.beginPath();
    // Only draw trail segments in view (with margin)
    const margin = 200;
    const vl = camera.x - margin;
    const vr = camera.x + canvas.width + margin;
    const vt = camera.y - margin;
    const vb = camera.y + canvas.height + margin;

    let moved = false;
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      // rough visibility check
      if (i > 0) {
        const prev = this.trail[i - 1];
        const inView = (p.x > vl && p.x < vr && p.y > vt && p.y < vb) ||
                       (prev.x > vl && prev.x < vr && prev.y > vt && prev.y < vb);
        if (!inView) {
          moved = false;
          continue;
        }
      }
      if (!moved) {
        ctx.moveTo(p.x, p.y);
        moved = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
  }

  drawBike(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Bike body
    ctx.fillStyle = this.color.main;
    ctx.shadowColor = this.color.main;
    ctx.shadowBlur = this.boosting ? 35 : 20;

    // Main body shape
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-10, -3);
    ctx.lineTo(-10, 3);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.fill();

    // Inner bright line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, 0);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Boost flame
    if (this.boosting) {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = this.color.main;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(-18 - Math.random() * 8, 0);
      ctx.lineTo(-10, 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── Explosions ──
const explosions = [];

function spawnExplosion(x, y, color) {
  const particles = [];
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 60 + Math.random() * 40,
      maxLife: 100,
      size: 2 + Math.random() * 3,
    });
  }
  explosions.push({ particles, color, frame: 0 });
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    exp.frame++;
    let allDead = true;
    for (const p of exp.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life--;
      if (p.life > 0) allDead = false;
    }
    if (allDead) explosions.splice(i, 1);
  }
}

function drawExplosions(ctx) {
  for (const exp of explosions) {
    for (const p of exp.particles) {
      if (p.life <= 0) continue;
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = exp.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = exp.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// ── Collision ──
function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function checkCollisions() {
  for (const bike of bikes) {
    if (!bike.alive || bike.frame < COLLISION_GRACE) continue;

    const hx = bike.x;
    const hy = bike.y;

    for (const other of bikes) {
      const segs = other.trailSegments;
      // Skip last segments of own trail to avoid self-collision at head
      const skipLast = (other === bike) ? 12 : 2;
      const len = segs.length - skipLast;

      for (let i = 0; i < len; i++) {
        const s = segs[i];
        if (pointToSegmentDist(hx, hy, s.x1, s.y1, s.x2, s.y2) < TRAIL_WIDTH + 2) {
          bike.die();
          break;
        }
      }
      if (!bike.alive) break;
    }
  }
}

// ── Camera ──
camera = { x: 0, y: 0 };

function updateCamera() {
  if (!player || !player.alive) {
    // Follow last position
  } else {
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;
    camera.x += (targetX - camera.x) * 0.08;
    camera.y += (targetY - camera.y) * 0.08;
  }

  // Clamp to map
  camera.x = Math.max(0, Math.min(MAP_W - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(MAP_H - canvas.height, camera.y));
}

// ── Drawing ──
function drawBackground() {
  // Dark fill
  ctx.fillStyle = '#06060a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle ground pattern — dots at intersections only (no grid lines)
  const spacing = 80;
  const offX = -camera.x % spacing;
  const offY = -camera.y % spacing;

  ctx.fillStyle = 'rgba(0, 255, 242, 0.06)';
  for (let x = offX; x < canvas.width; x += spacing) {
    for (let y = offY; y < canvas.height; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWalls() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  const wallColor = '#00fff2';
  ctx.strokeStyle = wallColor;
  ctx.lineWidth = WALL_THICKNESS;
  ctx.shadowColor = wallColor;
  ctx.shadowBlur = 30;

  ctx.strokeRect(
    WALL_THICKNESS / 2,
    WALL_THICKNESS / 2,
    MAP_W - WALL_THICKNESS,
    MAP_H - WALL_THICKNESS
  );

  // Corner accents
  ctx.shadowBlur = 50;
  const cornerSize = 60;
  const corners = [
    [0, 0, cornerSize, 0, 0, cornerSize],
    [MAP_W, 0, MAP_W - cornerSize, 0, MAP_W, cornerSize],
    [0, MAP_H, cornerSize, MAP_H, 0, MAP_H - cornerSize],
    [MAP_W, MAP_H, MAP_W - cornerSize, MAP_H, MAP_W, MAP_H - cornerSize],
  ];

  ctx.strokeStyle = '#ff6600';
  ctx.shadowColor = '#ff6600';
  ctx.lineWidth = 3;
  for (const [cx, cy, x1, y1, x2, y2] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMinimap() {
  const mw = minimapCanvas.width;
  const mh = minimapCanvas.height;
  const scaleX = mw / MAP_W;
  const scaleY = mh / MAP_H;

  minimapCtx.clearRect(0, 0, mw, mh);

  // Background
  minimapCtx.fillStyle = 'rgba(5, 5, 8, 0.8)';
  minimapCtx.fillRect(0, 0, mw, mh);

  // Border
  minimapCtx.strokeStyle = 'rgba(0, 255, 242, 0.3)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(0, 0, mw, mh);

  // Trails
  for (const bike of bikes) {
    if (bike.trail.length < 2) continue;
    minimapCtx.strokeStyle = bike.alive ? bike.color.glow + '0.6)' : bike.color.glow + '0.15)';
    minimapCtx.lineWidth = 1;
    minimapCtx.beginPath();
    minimapCtx.moveTo(bike.trail[0].x * scaleX, bike.trail[0].y * scaleY);
    for (let i = 1; i < bike.trail.length; i += 3) {
      minimapCtx.lineTo(bike.trail[i].x * scaleX, bike.trail[i].y * scaleY);
    }
    minimapCtx.stroke();

    // Bike position dot
    if (bike.alive) {
      minimapCtx.fillStyle = bike.color.main;
      minimapCtx.shadowColor = bike.color.main;
      minimapCtx.shadowBlur = 5;
      minimapCtx.beginPath();
      minimapCtx.arc(bike.x * scaleX, bike.y * scaleY, bike.isPlayer ? 3 : 2, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
    }
  }

  // Viewport rectangle
  minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(
    camera.x * scaleX,
    camera.y * scaleY,
    canvas.width * scaleX,
    canvas.height * scaleY
  );
}

// ── HUD ──
function updateHUD() {
  const speed = player ? Math.round(player.speed * 100) : 0;
  const alive = bikes.filter(b => b.alive).length;
  document.getElementById('speed-val').textContent = speed;
  document.getElementById('alive-val').textContent = alive;
  document.getElementById('round-val').textContent = round;
}

// ── Overlay / Countdown ──
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

// ── Init game ──
function initGame() {
  bikes = [];
  explosions.length = 0;
  frameCount = 0;

  // Player starts near center
  const cx = MAP_W / 2;
  const cy = MAP_H / 2;
  const spawnRadius = 800;

  player = new Bike(
    cx + (Math.random() - 0.5) * 400,
    cy + (Math.random() - 0.5) * 400,
    Math.random() * Math.PI * 2,
    0, true
  );
  bikes.push(player);

  // AI bikes spawned around map
  for (let i = 0; i < AI_COUNT; i++) {
    const angle = (i / AI_COUNT) * Math.PI * 2;
    const sx = cx + Math.cos(angle) * spawnRadius + (Math.random() - 0.5) * 300;
    const sy = cy + Math.sin(angle) * spawnRadius + (Math.random() - 0.5) * 300;
    const facing = angle + Math.PI + (Math.random() - 0.5) * 1;
    const ai = new Bike(
      Math.max(100, Math.min(MAP_W - 100, sx)),
      Math.max(100, Math.min(MAP_H - 100, sy)),
      facing,
      (i + 1) % COLORS.length,
      false
    );
    bikes.push(ai);
  }

  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;
}

// ── Game loop ──
function gameLoop() {
  if (gameState !== 'playing') return;
  frameCount++;

  // Update bikes
  for (const bike of bikes) {
    bike.update();
  }

  checkCollisions();
  updateExplosions();
  updateCamera();

  // Draw
  drawBackground();

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Draw all trails & bikes
  for (const bike of bikes) {
    bike.draw(ctx, camera);
  }

  drawExplosions(ctx);
  ctx.restore();

  drawWalls();
  drawMinimap();
  updateHUD();

  // Check win/lose
  const aliveCount = bikes.filter(b => b.alive).length;

  if (!player.alive) {
    gameState = 'gameover';
    showOverlay('DEREZZED', 'PRESS ENTER TO RETRY');
    waitForRestart();
    return;
  }

  if (aliveCount <= 1 && player.alive) {
    gameState = 'won';
    round++;
    showOverlay('VICTORY', 'PRESS ENTER FOR NEXT ROUND');
    waitForRestart();
    return;
  }

  requestAnimationFrame(gameLoop);
}

function waitForRestart() {
  function onKey(e) {
    if (e.key === 'Enter') {
      window.removeEventListener('keydown', onKey);
      startRound();
    }
  }
  window.addEventListener('keydown', onKey);
}

// ── Countdown & Start ──
round = 1;

async function startRound() {
  initGame();
  gameState = 'countdown';

  for (let i = 3; i >= 1; i--) {
    showOverlay(i.toString());
    await sleep(700);
  }

  showOverlay('GO!');
  await sleep(400);
  hideOverlay();

  gameState = 'playing';
  requestAnimationFrame(gameLoop);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Start ──
startRound();
