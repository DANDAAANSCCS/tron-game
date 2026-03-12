// ── Background Grid Animation (same as menu) ──
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const gridSize = 60;
let offset = 0;

const trails = [];
const TRAIL_COUNT = 4;
const TRAIL_COLORS = ['#00fff2', '#ff6600', '#0044ff', '#ff0055'];

function createTrail(index) {
  const horizontal = Math.random() > 0.5;
  return {
    x: horizontal ? -100 : Math.random() * canvas.width,
    y: horizontal ? Math.random() * canvas.height : -100,
    speed: 1.5 + Math.random() * 2,
    horizontal,
    color: TRAIL_COLORS[index % TRAIL_COLORS.length],
    length: 80 + Math.random() * 120,
    alpha: 0.3 + Math.random() * 0.4
  };
}

for (let i = 0; i < TRAIL_COUNT; i++) trails.push(createTrail(i));

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  grad.addColorStop(0, '#0d1117');
  grad.addColorStop(1, '#050508');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0, 255, 242, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  const scrollOffset = offset % gridSize;
  for (let y = -gridSize + scrollOffset; y <= canvas.height + gridSize; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0, 255, 242, 0.08)';
  for (let x = 0; x <= canvas.width; x += gridSize) {
    for (let y = -gridSize + scrollOffset; y <= canvas.height + gridSize; y += gridSize) {
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  offset += 0.3;
}

function drawTrails() {
  trails.forEach((trail, i) => {
    if (trail.horizontal) {
      trail.x += trail.speed;
      if (trail.x > canvas.width + trail.length) trails[i] = createTrail(i);
    } else {
      trail.y += trail.speed;
      if (trail.y > canvas.height + trail.length) trails[i] = createTrail(i);
    }
    const gradient = trail.horizontal
      ? ctx.createLinearGradient(trail.x - trail.length, trail.y, trail.x, trail.y)
      : ctx.createLinearGradient(trail.x, trail.y - trail.length, trail.x, trail.y);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, trail.color);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.globalAlpha = trail.alpha;
    ctx.beginPath();
    if (trail.horizontal) { ctx.moveTo(trail.x - trail.length, trail.y); ctx.lineTo(trail.x, trail.y); }
    else { ctx.moveTo(trail.x, trail.y - trail.length); ctx.lineTo(trail.x, trail.y); }
    ctx.stroke();
    ctx.shadowColor = trail.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(trail.x, trail.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = trail.color;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });
}

function animateBg() {
  drawGrid();
  drawTrails();
  requestAnimationFrame(animateBg);
}
animateBg();

// ── Audio ──
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playHoverSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function playSelectSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

// ── Level Data ──
const LEVELS = [
  {
    id: 1,
    name: 'SECTOR 7-G',
    subtitle: 'TRAINING GROUNDS',
    waves: 100,
    colors: { primary: '#00fff2', accent: '#ff6600' },
    description: '100 WAVES • TANK @ 50 • BOSS @ 100',
    requiresLevel: null,
  },
  {
    id: 2,
    name: 'SECTOR 9-X',
    subtitle: 'PHANTOM ZONE',
    waves: 100,
    colors: { primary: '#0088ff', accent: '#00ffaa' },
    description: '100 WAVES • TANKS+PHANTOMS • OVERLORD @ 100',
    requiresLevel: 1,
  }
];

let serverData = null;

async function loadServerData() {
  try {
    const res = await fetch('/api/gamedata');
    if (res.ok) serverData = await res.json();
  } catch (e) {}
}

function getProgress(levelId) {
  if (serverData && serverData.levelProgress) {
    return serverData.levelProgress[`level${levelId}`] || { waveReached: 0, completed: false, timePlayed: 0, score: 0 };
  }
  return { waveReached: 0, completed: false, timePlayed: 0, score: 0 };
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Draw Thumbnail ──
function drawThumbnail(cvs, level, progress) {
  const c = cvs.getContext('2d');
  const w = cvs.width;
  const h = cvs.height;

  // Background
  const bg = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
  bg.addColorStop(0, '#0a0a14');
  bg.addColorStop(1, '#050508');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  // Grid
  c.strokeStyle = 'rgba(0, 255, 242, 0.06)';
  c.lineWidth = 0.5;
  const gs = 16;
  for (let x = 0; x <= w; x += gs) {
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke();
  }
  for (let y = 0; y <= h; y += gs) {
    c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
  }

  // Defense rings
  c.strokeStyle = 'rgba(0, 255, 242, 0.08)';
  c.lineWidth = 0.5;
  for (let r = 15; r < w / 2; r += 18) {
    c.beginPath(); c.arc(w / 2, h / 2, r, 0, Math.PI * 2); c.stroke();
  }

  // Turret dot
  c.fillStyle = level.colors.primary;
  c.shadowColor = level.colors.primary;
  c.shadowBlur = 12;
  c.beginPath();
  c.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
  c.fill();

  // Range circle
  c.strokeStyle = 'rgba(0, 255, 242, 0.15)';
  c.lineWidth = 1;
  c.setLineDash([3, 5]);
  c.beginPath();
  c.arc(w / 2, h / 2, 28, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  c.shadowBlur = 0;

  // Simulated enemy dots
  const rng = (s) => { let x = Math.sin(s) * 9999; return x - Math.floor(x); };
  const enemyCount = Math.min(progress.waveReached * 0.3, 20);
  for (let i = 0; i < enemyCount; i++) {
    const angle = rng(i * 7.3) * Math.PI * 2;
    const dist = 30 + rng(i * 3.1) * (w / 2 - 35);
    const ex = w / 2 + Math.cos(angle) * dist;
    const ey = h / 2 + Math.sin(angle) * dist;
    c.fillStyle = i < enemyCount * 0.8 ? level.colors.accent : '#ff0055';
    c.shadowColor = c.fillStyle;
    c.shadowBlur = 4;
    c.beginPath();
    c.arc(ex, ey, 1.5, 0, Math.PI * 2);
    c.fill();
  }
  c.shadowBlur = 0;

  // Border
  c.strokeStyle = progress.completed ? 'rgba(0, 255, 102, 0.4)' : 'rgba(0, 255, 242, 0.2)';
  c.lineWidth = 1;
  c.strokeRect(0, 0, w, h);

  // Completed overlay
  if (progress.completed) {
    c.fillStyle = 'rgba(0, 255, 102, 0.05)';
    c.fillRect(0, 0, w, h);
    c.font = '900 14px Orbitron';
    c.fillStyle = '#00ff66';
    c.shadowColor = '#00ff66';
    c.shadowBlur = 10;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('COMPLETED', w / 2, h / 2 + 25);
    c.shadowBlur = 0;
  }
}

// ── Build Cards ──
function isLevelUnlocked(level) {
  if (!level.requiresLevel) return true;
  const reqProgress = getProgress(level.requiresLevel);
  return reqProgress.completed;
}

function buildLevelCards() {
  const grid = document.getElementById('levels-grid');

  for (const level of LEVELS) {
    const progress = getProgress(level.id);
    const unlocked = isLevelUnlocked(level);
    const pct = progress.completed ? 100 : Math.floor((progress.waveReached / level.waves) * 100);

    const card = document.createElement('div');
    card.className = `level-card${progress.completed ? ' completed' : ''}${!unlocked ? ' locked' : ''}`;
    card.dataset.level = level.id;

    card.innerHTML = `
      <canvas class="level-thumbnail" width="160" height="160"></canvas>
      <div class="level-info">
        <div class="level-name">${level.name}</div>
        <div class="level-sub">${level.subtitle}</div>
        <div class="level-desc">${unlocked ? level.description : 'COMPLETE LEVEL ' + level.requiresLevel + ' TO UNLOCK'}</div>
        <div class="level-progress-wrap">
          <div class="level-progress-bar">
            <div class="level-progress-fill" style="width:${unlocked ? pct : 0}%;${progress.completed ? 'background:#00ff66;box-shadow:0 0 8px #00ff66;' : ''}"></div>
          </div>
          <span class="level-progress-text">${unlocked ? pct + '%' : 'LOCKED'}</span>
        </div>
        <div class="level-stats">
          ${unlocked ? `
            <span class="stat-item">${progress.completed ? 'COMPLETED' : progress.waveReached > 0 ? `WAVE ${progress.waveReached} / ${level.waves}` : 'NOT STARTED'}</span>
            <span class="stat-sep">|</span>
            <span class="stat-item">${progress.timePlayed > 0 ? formatTime(progress.timePlayed) : '--:--'}</span>
            <span class="stat-sep">|</span>
            <span class="stat-item">SCORE: ${progress.score}</span>
          ` : '<span class="stat-item" style="color:rgba(255,0,85,0.6);">LOCKED</span>'}
        </div>
        <div class="level-play-hint">${unlocked ? '[ ENTER / CLICK TO PLAY ]' : '[ LOCKED ]'}</div>
      </div>
    `;

    // Draw thumbnail
    const thumbCanvas = card.querySelector('.level-thumbnail');
    if (unlocked) {
      drawThumbnail(thumbCanvas, level, progress);
    } else {
      drawLockedThumbnail(thumbCanvas, level);
    }

    // Events
    card.addEventListener('mouseenter', playHoverSound);
    if (unlocked) {
      card.addEventListener('click', () => {
        playSelectSound();
        card.classList.add('flash');
        setTimeout(() => {
          window.location.href = `/game.html?level=${level.id}`;
        }, 400);
      });
    }

    grid.appendChild(card);
  }
}

function drawLockedThumbnail(cvs, level) {
  const c = cvs.getContext('2d');
  const w = cvs.width;
  const h = cvs.height;

  // Dark background
  c.fillStyle = '#050508';
  c.fillRect(0, 0, w, h);

  // Grid (very dim)
  c.strokeStyle = 'rgba(255, 0, 85, 0.03)';
  c.lineWidth = 0.5;
  const gs = 16;
  for (let x = 0; x <= w; x += gs) {
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke();
  }
  for (let y = 0; y <= h; y += gs) {
    c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
  }

  // Lock icon
  c.font = '900 28px Orbitron';
  c.fillStyle = 'rgba(255, 0, 85, 0.3)';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('⊘', w / 2, h / 2);

  // Border
  c.strokeStyle = 'rgba(255, 0, 85, 0.2)';
  c.lineWidth = 1;
  c.strokeRect(0, 0, w, h);
}

// Keyboard nav
let selectedCardIndex = 0;
document.addEventListener('keydown', (e) => {
  const cards = document.querySelectorAll('.level-card:not(.locked)');
  if (cards.length === 0) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    selectedCardIndex = Math.min(selectedCardIndex + 1, cards.length - 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    selectedCardIndex = Math.max(selectedCardIndex - 1, 0);
  } else if (e.key === 'Enter') {
    const card = cards[selectedCardIndex];
    if (card) {
      playSelectSound();
      card.classList.add('flash');
      const levelId = card.dataset.level;
      setTimeout(() => {
        window.location.href = `/game.html?level=${levelId}`;
      }, 400);
    }
  } else if (e.key === 'Escape' || e.key === 'Backspace') {
    window.location.href = '/';
  }
});

// Back button
const backBtn = document.querySelector('.back-btn');
if (backBtn) {
  backBtn.addEventListener('mouseenter', playHoverSound);
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    playSelectSound();
    setTimeout(() => { window.location.href = '/'; }, 300);
  });
}

// Init: load server data then build cards
loadServerData().then(() => buildLevelCards());
