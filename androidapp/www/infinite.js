// ═══════════════════════════════════════════
//  infinite.js — Infinite mode selection page
//  Depends on: shared/bg-animation.js, shared/audio.js, shared/i18n.js
// ═══════════════════════════════════════════

// ── Helpers ──

/**
 * Format total seconds into MM:SS string.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// ── Load & display best score ──

async function loadBestScore() {
  const recordValue = document.getElementById('record-value');
  if (!recordValue) return;

  try {
    const res = await fetch('/api/gamedata');
    if (!res.ok) throw new Error('Network response not ok');

    const data = await res.json();
    const best = data.infiniteBest;

    if (best && (best.score > 0 || best.wave > 0)) {
      const scoreStr  = best.score  != null ? best.score  : 0;
      const waveStr   = best.wave   != null ? best.wave   : 0;
      const timeStr   = best.time   != null ? formatTime(best.time) : '--:--';

      const bestLabel = t('infinite.best');
      const waveLabel = t('hud.wave');

      recordValue.textContent =
        scoreStr + '  |  ' + waveLabel + ' ' + waveStr + '  |  ' + timeStr;
    } else {
      // No record yet — show translated message
      recordValue.textContent = t('infinite.no_record');
      recordValue.style.cssText =
        'font-family:"Share Tech Mono",monospace;' +
        'font-size:0.72rem;letter-spacing:4px;' +
        'color:rgba(0,255,242,0.25);' +
        'text-shadow:none;';
    }
  } catch (e) {
    // On network error keep the default "SIN RECORD" text already in DOM
    recordValue.textContent = t('infinite.no_record');
    recordValue.style.cssText =
      'font-family:"Share Tech Mono",monospace;' +
      'font-size:0.72rem;letter-spacing:4px;' +
      'color:rgba(0,255,242,0.25);' +
      'text-shadow:none;';
  }
}

// ── START button ──

const startBtn = document.getElementById('start-btn');
if (startBtn) {
  startBtn.addEventListener('mouseenter', () => {
    if (typeof playHoverSound === 'function') playHoverSound();
  });

  startBtn.addEventListener('click', () => {
    if (typeof playSelectSound === 'function') playSelectSound();
    startBtn.classList.add('flash');
    setTimeout(() => {
      window.location.href = '/game.html?level=infinite';
    }, 400);
  });
}

// ── BACK button ──

const backBtn = document.getElementById('back-btn');
if (backBtn) {
  backBtn.addEventListener('mouseenter', () => {
    if (typeof playHoverSound === 'function') playHoverSound();
  });

  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof playSelectSound === 'function') playSelectSound();
    window.location.href = '/menu.html';
  });
}

// ── Keyboard navigation ──

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    if (typeof playSelectSound === 'function') playSelectSound();
    if (startBtn) startBtn.classList.add('flash');
    setTimeout(() => {
      window.location.href = '/game.html?level=infinite';
    }, 400);
  } else if (e.key === 'Escape' || e.key === 'Backspace') {
    if (typeof playSelectSound === 'function') playSelectSound();
    window.location.href = '/menu.html';
  }
});

// ── Init ──

loadBestScore();
