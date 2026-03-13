// Shared background grid animation
// Requires a <canvas id="bg-canvas"> element in the page

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

for (let i = 0; i < TRAIL_COUNT; i++) {
  trails.push(createTrail(i));
}

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
