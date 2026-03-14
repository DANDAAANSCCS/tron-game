// ═══════════════════════════════════════════
//  input.js — Touch (primary) + Mouse/Keyboard (fallback) input handling
//  Depends on: config.js, upgrades-panel.js (buyUpgrade)
//  Provides: checkBulletCollisions()
// ═══════════════════════════════════════════

// ── Upgrade panel hit-test constants (must match upgrades-panel.js draw calls) ──
const PANEL_ROW_H = 50;
const PANEL_START_OFFSET_Y = 70;
const UPGRADE_KEYS = ['damage', 'fireRate', 'precision', 'doubleBul', 'health'];

function _getPanelBounds() {
  const panelW = Math.min(440, canvas.width - 40); // match upgrades-panel.js
  const panelH = PANEL_START_OFFSET_Y + UPGRADE_KEYS.length * PANEL_ROW_H + 20;
  const px = (canvas.width  - panelW) / 2;
  const py = (canvas.height - panelH) / 2 - 10;
  return { px, py, panelW, panelH };
}

// If the touch (sx, sy) falls inside an upgrade row, buy it and return true.
function _tryBuyUpgradeAtScreenPos(sx, sy) {
  if (!upgradesPanelOpen) return false;
  const { px, py, panelW } = _getPanelBounds();
  if (sx < px || sx > px + panelW) return false;
  const relY = sy - py - PANEL_START_OFFSET_Y;
  if (relY < 0) return false;
  const row = Math.floor(relY / PANEL_ROW_H);
  if (row >= 0 && row < UPGRADE_KEYS.length) {
    const purchased = buyUpgrade(UPGRADE_KEYS[row]);
    if (purchased) {
      if (typeof playBuySound === 'function') playBuySound();
    } else {
      if (typeof playDenySound === 'function') playDenySound();
    }
    return true;
  }
  return false;
}

// ── Touch state tracking ──────────────────────────────────────────────────────
let _aimTouchId  = null;

const _upgradesBtn = document.getElementById('touch-upgrades-btn');

// ── Helper: update aim from a Touch object ────────────────────────────────────
function _updateAimFromTouch(touch) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  mouse.x      = (touch.clientX - rect.left) * scaleX;
  mouse.y      = (touch.clientY - rect.top)  * scaleY;
  mouse.worldX = mouse.x + camera.x;
  mouse.worldY = mouse.y + camera.y;
}

// ── Canvas touch events (aim + shoot) ─────────────────────────────────────────
// Touch on canvas = aim at that point AND fire (mouseDown = true while touching)
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    if (_aimTouchId === null) {
      _aimTouchId = touch.identifier;
      _updateAimFromTouch(touch);
      mouseDown = true; // Start shooting

      // If upgrades panel is open, handle panel interaction instead
      if (upgradesPanelOpen && gameState === 'playing') {
        mouseDown = false; // Don't shoot while interacting with panel
        const { px, py, panelW } = _getPanelBounds();
        const closeBtnX = px + panelW - 30;
        const closeBtnY = py + 10;
        if (mouse.x >= closeBtnX && mouse.x <= closeBtnX + 20 &&
            mouse.y >= closeBtnY && mouse.y <= closeBtnY + 20) {
          upgradesPanelOpen = false;
          if (typeof playSelectSound === 'function') playSelectSound();
        } else {
          _tryBuyUpgradeAtScreenPos(mouse.x, mouse.y);
        }
      }
    }
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    if (touch.identifier === _aimTouchId) {
      _updateAimFromTouch(touch);
    }
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    if (touch.identifier === _aimTouchId) {
      _aimTouchId = null;
      mouseDown = false; // Stop shooting when finger lifts
    }
  }
}, { passive: false });

canvas.addEventListener('touchcancel', e => {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    if (touch.identifier === _aimTouchId) {
      _aimTouchId = null;
      mouseDown = false;
    }
  }
}, { passive: false });

// ── Upgrades button touch event ───────────────────────────────────────────────
_upgradesBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  e.stopPropagation();
  if (gameState === 'playing') {
    upgradesPanelOpen = !upgradesPanelOpen;
    if (typeof playSelectSound === 'function') playSelectSound();
  }
}, { passive: false });

// Fallback mouse click for the upgrades button (browser testing)
_upgradesBtn.addEventListener('click', () => {
  if (gameState === 'playing') {
    upgradesPanelOpen = !upgradesPanelOpen;
    if (typeof playSelectSound === 'function') playSelectSound();
  }
});

// ── Ability slots touch events ────────────────────────────────────────────────
// Slots are created dynamically by emp.js / abilities rendering code,
// so we use event delegation on the container.
const _abilityBar = document.getElementById('ability-bar');

_abilityBar.addEventListener('touchstart', e => {
  const slot = e.target.closest('.ability-slot');
  if (!slot) return;
  e.preventDefault();
  e.stopPropagation();
  // Trigger whichever ability is bound to this slot.
  // Currently only EMP (SPACE) is supported; extend here for future abilities.
  const abilityName = slot.dataset.ability;
  if (abilityName === 'emp' || !abilityName) {
    // Pulse keys.space for one game tick — main.js consumes it and clears it.
    keys.space = true;
    setTimeout(() => { keys.space = false; }, 100);
  }
}, { passive: false });

// ── Prevent default context-menu and unwanted gestures on canvas ──────────────
canvas.addEventListener('contextmenu', e => e.preventDefault());

document.body.addEventListener('touchmove', e => {
  // Block scroll/zoom on the page level; individual elements call their own preventDefault.
  if (e.target === document.body || e.target === canvas) {
    e.preventDefault();
  }
}, { passive: false });

// ── Mouse events (browser / emulator fallback) ────────────────────────────────
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  mouse.x      = (e.clientX - rect.left) * scaleX;
  mouse.y      = (e.clientY - rect.top)  * scaleY;
  mouse.worldX = mouse.x + camera.x;
  mouse.worldY = mouse.y + camera.y;
});

window.addEventListener('mousedown', e => {
  if (e.button === 0) mouseDown = true;
});

window.addEventListener('mouseup', e => {
  if (e.button === 0) mouseDown = false;
});

// ── Keyboard events (browser / emulator fallback) ─────────────────────────────
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') { keys.space = true; e.preventDefault(); }
  if (e.key.toLowerCase() === 'b' && gameState === 'playing') {
    upgradesPanelOpen = !upgradesPanelOpen;
    if (typeof playSelectSound === 'function') playSelectSound();
  }
  if (upgradesPanelOpen && gameState === 'playing') {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 5) {
      const purchased = buyUpgrade(UPGRADE_KEYS[num - 1]);
      if (purchased) {
        if (typeof playBuySound === 'function') playBuySound();
      } else {
        if (typeof playDenySound === 'function') playDenySound();
      }
    }
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === ' ') keys.space = false;
});

// ── Settings panel handlers ──────────────────────────────────────────────────
(function () {
  const settingsBtn   = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const musicToggle   = document.getElementById('music-toggle');
  const sfxToggle     = document.getElementById('sfx-toggle');
  const settingsClose = document.getElementById('settings-close');
  const btnSaveQuit   = document.getElementById('btn-save-quit');
  const btnRestart    = document.getElementById('btn-restart');

  function syncToggles() {
    if (musicToggle) {
      const on = typeof musicEnabled !== 'undefined' ? musicEnabled : true;
      musicToggle.textContent = on ? 'ON' : 'OFF';
      musicToggle.classList.toggle('off', !on);
    }
    if (sfxToggle) {
      const on = typeof sfxEnabled !== 'undefined' ? sfxEnabled : true;
      sfxToggle.textContent = on ? 'ON' : 'OFF';
      sfxToggle.classList.toggle('off', !on);
    }
  }

  function openSettings() {
    settingsPanel.style.display = 'block';
    syncToggles();
    if (typeof playSelectSound === 'function') playSelectSound();
  }

  function closeSettings() {
    settingsPanel.style.display = 'none';
    if (typeof playSelectSound === 'function') playSelectSound();
  }

  function addTap(el, fn) {
    el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
    el.addEventListener('click', fn);
  }

  addTap(settingsBtn, () => settingsPanel.style.display === 'none' ? openSettings() : closeSettings());
  addTap(settingsClose, closeSettings);

  addTap(musicToggle, () => {
    if (typeof toggleMusic === 'function') toggleMusic();
    syncToggles();
    if (typeof playSelectSound === 'function') playSelectSound();
  });

  addTap(sfxToggle, () => {
    if (typeof toggleSFX === 'function') toggleSFX();
    syncToggles();
    if (typeof playSelectSound === 'function') playSelectSound();
  });

  // Save & Quit — saves full game state (wave, score, upgrades, etc.)
  addTap(btnSaveQuit, () => {
    if (typeof playSelectSound === 'function') playSelectSound();
    if (typeof saveProgress === 'function') saveProgress();
    if (typeof doAutoSave === 'function') doAutoSave();
    if (typeof stopMusic === 'function') stopMusic();
    setTimeout(() => { window.location.href = '/levels.html'; }, 300);
  });

  // Restart
  addTap(btnRestart, () => {
    if (typeof playSelectSound === 'function') playSelectSound();
    closeSettings();
    if (typeof initGame === 'function') {
      initGame();
      gameState = 'playing';
    }
  });

  // Block canvas touches from leaking through the panel
  settingsPanel.addEventListener('touchstart', e => e.stopPropagation(), { passive: false });
  settingsPanel.addEventListener('touchmove',  e => e.stopPropagation(), { passive: false });
  settingsPanel.addEventListener('touchend',   e => e.stopPropagation(), { passive: false });
})();

// ── Collision: Bullets vs Enemies ─────────────────────────────────────────────
function checkBulletCollisions() {
  for (const bullet of bullets) {
    if (!bullet.alive) continue;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
      if (dist < bullet.radius + enemy.radius) {
        bullet.alive = false;
        enemy.takeDamage(Math.round(getCurrentDamage()));
        // Impact particles
        const impactAngle = Math.atan2(bullet.vy, bullet.vx);
        for (let i = 0; i < 8; i++) {
          const a = impactAngle + Math.PI + (Math.random() - 0.5) * 1.5;
          const s = 2 + Math.random() * 4;
          spawnParticle(bullet.x, bullet.y, Math.cos(a) * s, Math.sin(a) * s,
            i < 4 ? COL.cyan : COL.orange, 10 + Math.random() * 10, 1.5);
        }
        // Bright flash
        spawnParticle(bullet.x, bullet.y, 0, 0, COL.white, 5, 6);
        break;
      }
    }
  }
}
