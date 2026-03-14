// ═══════════════════════════════════════════
//  roulette.js — Silver coin roulette on game end
//  Depends on: config.js, rendering.js (showOverlay/hideOverlay), server-data.js
// ═══════════════════════════════════════════

// ── Roulette segments with weighted probabilities ──
const ROULETTE_SEGMENTS = [
  { mult: 1.0, label: 'x1',   color: '#00fff2', weight: 30 },
  { mult: 1.2, label: 'x1.2', color: '#00ff66', weight: 25 },
  { mult: 1.4, label: 'x1.4', color: '#ffdd00', weight: 20 },
  { mult: 1.5, label: 'x1.5', color: '#ff6600', weight: 12 },
  { mult: 1.6, label: 'x1.6', color: '#e040fb', weight: 7 },
  { mult: 1.8, label: 'x1.8', color: '#aa00ff', weight: 4 },
  { mult: 2.0, label: 'x2',   color: '#ff0055', weight: 2 },
];

// Pick a segment based on weights
function _pickRouletteResult() {
  const totalWeight = ROULETTE_SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const seg of ROULETTE_SEGMENTS) {
    rand -= seg.weight;
    if (rand <= 0) return seg;
  }
  return ROULETTE_SEGMENTS[0];
}

// ── Roulette state ──
let _rouletteActive = false;
let _rouletteAngle = 0;        // current rotation angle
let _rouletteSpeed = 0;        // angular speed (rad/frame)
let _rouletteResult = null;     // the picked segment
let _roulettePhase = 'idle';    // idle | spinning | slowing | done
let _rouletteBaseCoins = 0;     // score / 4
let _rouletteFinalCoins = 0;    // after multiplier
let _rouletteDoneTimer = 0;
let _rouletteTargetAngle = 0;   // where we want to stop
let _rouletteCallback = null;   // called when roulette finishes

// ── Tick tracking for segment boundary detection ──
let _rouletteLastTickSeg = -1;  // which segment was last ticked
let _rouletteStopSoundPlayed = false;
let _rouletteRewardSoundPlayed = false;

function startRoulette(finalScore, callback) {
  _rouletteActive = true;
  _roulettePhase = 'spinning';
  _rouletteAngle = 0;
  _rouletteSpeed = 0.35 + Math.random() * 0.1; // fast initial spin
  _rouletteBaseCoins = Math.floor(finalScore / 4);
  _rouletteDoneTimer = 0;
  _rouletteCallback = callback;

  // Reset tick/sound state
  _rouletteLastTickSeg = -1;
  _rouletteStopSoundPlayed = false;
  _rouletteRewardSoundPlayed = false;

  // Pre-pick the result
  _rouletteResult = _pickRouletteResult();
  _rouletteFinalCoins = Math.floor(_rouletteBaseCoins * _rouletteResult.mult);

  // Calculate where to stop: the result segment's center
  const segCount = ROULETTE_SEGMENTS.length;
  const segAngle = (Math.PI * 2) / segCount;
  const resultIndex = ROULETTE_SEGMENTS.indexOf(_rouletteResult);
  // The pointer is at top (angle 0 = -PI/2). We want the result segment under the pointer.
  // Segment i spans from i*segAngle to (i+1)*segAngle.
  // To land in the middle: targetStopAngle = -resultIndex * segAngle - segAngle/2
  // But we spin many full rotations first (5-8 full rotations)
  const fullRotations = (5 + Math.floor(Math.random() * 4)) * Math.PI * 2;
  _rouletteTargetAngle = fullRotations + (resultIndex * segAngle + segAngle * (0.3 + Math.random() * 0.4));
}

function updateRoulette() {
  if (!_rouletteActive) return;

  const segCount = ROULETTE_SEGMENTS.length;
  const segAngle = (Math.PI * 2) / segCount;

  if (_roulettePhase === 'spinning') {
    _rouletteAngle += _rouletteSpeed;

    // Tick sound: detect segment boundary crossings
    const currentSeg = Math.floor((_rouletteAngle % (Math.PI * 2)) / segAngle) % segCount;
    if (currentSeg !== _rouletteLastTickSeg) {
      _rouletteLastTickSeg = currentSeg;
      if (typeof playRouletteTickSound === 'function') playRouletteTickSound();
    }

    // Decelerate as we approach target
    const remaining = _rouletteTargetAngle - _rouletteAngle;
    if (remaining < Math.PI * 4) {
      _roulettePhase = 'slowing';
    }
  }

  if (_roulettePhase === 'slowing') {
    const remaining = _rouletteTargetAngle - _rouletteAngle;
    // Ease out deceleration
    _rouletteSpeed = Math.max(0.003, remaining * 0.02);
    _rouletteAngle += _rouletteSpeed;

    // Tick sound: detect segment boundary crossings during slowdown
    const currentSeg = Math.floor((_rouletteAngle % (Math.PI * 2)) / segAngle) % segCount;
    if (currentSeg !== _rouletteLastTickSeg) {
      _rouletteLastTickSeg = currentSeg;
      if (typeof playRouletteTickSound === 'function') playRouletteTickSound();
    }

    if (remaining <= 0.01) {
      _rouletteAngle = _rouletteTargetAngle;
      _roulettePhase = 'done';
      _rouletteDoneTimer = 0;

      // Stop sound when roulette settles
      if (typeof playRouletteStopSound === 'function') playRouletteStopSound();
      _rouletteStopSoundPlayed = true;
    }
  }

  if (_roulettePhase === 'done') {
    _rouletteDoneTimer++;

    // Reward sound ~0.5s after stopping (frame 30), when result text becomes visible
    if (_rouletteDoneTimer === 30 && !_rouletteRewardSoundPlayed) {
      if (typeof playRouletteRewardSound === 'function') playRouletteRewardSound();
      _rouletteRewardSoundPlayed = true;
    }

    // After 3 seconds, finish
    if (_rouletteDoneTimer >= 180) {
      _rouletteActive = false;
      if (_rouletteCallback) _rouletteCallback(_rouletteFinalCoins);
    }
  }
}

function drawRoulette() {
  if (!_rouletteActive) return;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.28;
  const segCount = ROULETTE_SEGMENTS.length;
  const segAngle = (Math.PI * 2) / segCount;

  // Dim background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.save();
  ctx.font = '900 18px Orbitron';
  ctx.fillStyle = '#c0c0c0';
  ctx.shadowColor = '#c0c0c0';
  ctx.shadowBlur = 12;
  ctx.textAlign = 'center';
  ctx.fillText('SILVER COINS', cx, cy - radius - 40);
  ctx.shadowBlur = 0;

  ctx.restore();

  // Draw wheel
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-_rouletteAngle); // rotate the wheel

  for (let i = 0; i < segCount; i++) {
    const seg = ROULETTE_SEGMENTS[i];
    const startA = i * segAngle - Math.PI / 2;
    const endA = startA + segAngle;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startA, endA);
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    grad.addColorStop(0, 'rgba(10, 10, 20, 0.9)');
    grad.addColorStop(1, seg.color + '33');
    ctx.fillStyle = grad;
    ctx.fill();

    // Segment border
    ctx.strokeStyle = seg.color + '66';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    const labelAngle = startA + segAngle / 2;
    const labelR = radius * 0.65;
    ctx.save();
    ctx.translate(Math.cos(labelAngle) * labelR, Math.sin(labelAngle) * labelR);
    ctx.rotate(labelAngle + Math.PI / 2);
    ctx.font = '900 16px Orbitron';
    ctx.fillStyle = seg.color;
    ctx.shadowColor = seg.color;
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(seg.label, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Center circle
  const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
  centerGrad.addColorStop(0, '#c0c0c0');
  centerGrad.addColorStop(0.5, '#888888');
  centerGrad.addColorStop(1, '#333333');
  ctx.fillStyle = centerGrad;
  ctx.shadowColor = '#c0c0c0';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Silver coin icon in center
  ctx.font = '900 14px Orbitron';
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 1);

  ctx.restore();

  // Pointer (triangle at top, fixed — doesn't rotate)
  ctx.save();
  ctx.translate(cx, cy - radius - 4);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(-10, -4);
  ctx.lineTo(10, -4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Outer ring glow
  ctx.save();
  ctx.strokeStyle = 'rgba(192, 192, 192, 0.15)';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#c0c0c0';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Result display (after stopping)
  if (_roulettePhase === 'done') {
    const pulse = 0.8 + Math.sin(_rouletteDoneTimer * 0.1) * 0.2;

    ctx.save();
    ctx.font = '900 22px Orbitron';
    ctx.fillStyle = _rouletteResult.color;
    ctx.shadowColor = _rouletteResult.color;
    ctx.shadowBlur = 20;
    ctx.textAlign = 'center';
    ctx.globalAlpha = pulse;
    ctx.fillText(`${_rouletteResult.label}`, cx, cy + radius + 45);

    ctx.font = '900 28px Orbitron';
    ctx.fillStyle = '#c0c0c0';
    ctx.shadowColor = '#c0c0c0';
    ctx.shadowBlur = 15;
    ctx.fillText(`+${_rouletteFinalCoins}`, cx, cy + radius + 78);

    ctx.font = '600 11px Share Tech Mono';
    ctx.fillStyle = 'rgba(192, 192, 192, 0.5)';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.fillText('SILVER COINS', cx, cy + radius + 95);
    ctx.restore();
  }
}
