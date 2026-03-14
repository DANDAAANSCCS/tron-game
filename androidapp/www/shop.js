// ═══════════════════════════════════════════
//  shop.js — Shop page (chest opening)
//  Depends on: shared/bg-animation.js, shared/audio.js
// ═══════════════════════════════════════════

// ── Display data ──
const ABILITY_NAMES = {
  emp:       'EMP PULSE',
  shield:    'ESCUDO',
  rapidfire: 'FUEGO RAPIDO',
  chain:     'RAYO CADENA',
  freeze:    'ONDA GLACIAL',
  orbital:   'ATAQUE ORBITAL',
};

const RARITY_COLORS = {
  common:    '#00fff2',
  rare:      '#4488ff',
  epic:      '#aa00ff',
  legendary: '#ffaa00',
};

const ABILITY_RARITY = {
  emp:       'common',
  shield:    'common',
  rapidfire: 'rare',
  chain:     'rare',
  freeze:    'epic',
  orbital:   'legendary',
};

// ── State ──
let currentGems = 0;
let isBusy = false; // prevent double-tapping while overlay is open

// ── Gem Icon (same style as other pages) ──
function drawGemIcon(cvs) {
  const c = cvs.getContext('2d');
  const cx = cvs.width / 2;
  const cy = cvs.height / 2;
  c.clearRect(0, 0, cvs.width, cvs.height);

  c.save();
  c.fillStyle = '#e040fb';
  c.shadowColor = '#e040fb';
  c.shadowBlur = 6;
  c.beginPath();
  c.moveTo(cx, cy - 7);
  c.lineTo(cx + 5, cy - 2);
  c.lineTo(cx + 3, cy + 7);
  c.lineTo(cx - 3, cy + 7);
  c.lineTo(cx - 5, cy - 2);
  c.closePath();
  c.fill();

  c.shadowBlur = 0;
  c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  c.lineWidth = 0.5;
  c.beginPath();
  c.moveTo(cx - 5, cy - 2);
  c.lineTo(cx + 5, cy - 2);
  c.moveTo(cx, cy - 7);
  c.lineTo(cx - 1, cy - 2);
  c.lineTo(cx - 3, cy + 7);
  c.moveTo(cx, cy - 7);
  c.lineTo(cx + 1, cy - 2);
  c.lineTo(cx + 3, cy + 7);
  c.stroke();
  c.restore();
}

// ── Load gem count from server ──
async function loadGems() {
  try {
    const res = await fetch('/api/gamedata');
    if (res.ok) {
      const data = await res.json();
      currentGems = data.gems || 0;
    }
  } catch (e) {
    // Silent fail — UI will show 0
  }
  updateGemsDisplay();
}

function updateGemsDisplay() {
  const el = document.getElementById('shop-gems-count');
  if (el) el.textContent = currentGems;
}

// ── Error feedback on a chest card ──
function showCardError(card, message) {
  // Shake
  card.classList.remove('deny');
  // Force reflow so re-adding the class triggers the animation again
  void card.offsetWidth;
  card.classList.add('deny');
  card.addEventListener('animationend', () => card.classList.remove('deny'), { once: true });

  // Show message
  const errEl = card.querySelector('.chest-error');
  if (errEl) {
    errEl.textContent = message;
    clearTimeout(errEl._timer);
    errEl._timer = setTimeout(() => { errEl.textContent = ''; }, 2800);
  }

  if (typeof playDenySound === 'function') playDenySound();
}

// ── Open chest request ──
async function openChest(chestType, card) {
  if (isBusy) return;

  const cost = parseInt(card.dataset.cost, 10);

  // Client-side gem check for fast feedback
  if (currentGems < cost) {
    showCardError(card, 'GEMAS INSUFICIENTES');
    return;
  }

  isBusy = true;

  // Disable button during request
  const btn = card.querySelector('.chest-open-btn');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/chest/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chestType }),
    });

    if (!res.ok) {
      let msg = 'ERROR AL ABRIR';
      try {
        const body = await res.json();
        if (body && body.error) msg = body.error.toUpperCase();
      } catch (_) {}
      showCardError(card, msg);
      return;
    }

    const data = await res.json();

    // Update gems from server response (authoritative)
    if (typeof data.gems === 'number') {
      currentGems = data.gems;
    } else {
      // Fallback: optimistic deduction
      currentGems = Math.max(0, currentGems - cost);
    }
    updateGemsDisplay();

    // Flash card
    card.classList.add('opening');
    card.addEventListener('animationend', () => card.classList.remove('opening'), { once: true });

    // Play chest open sound on successful purchase
    if (typeof playChestOpenSound === 'function') playChestOpenSound();
    else if (typeof playBuySound === 'function') playBuySound();

    // Show reveal overlay
    showRevealOverlay(data);

  } catch (e) {
    showCardError(card, 'ERROR DE RED');
  } finally {
    if (btn) btn.disabled = false;
    isBusy = false;
  }
}

// ── Reveal Overlay ──
function showRevealOverlay(data) {
  const overlay  = document.getElementById('reveal-overlay');
  const totalEl  = document.getElementById('reveal-total');
  const listEl   = document.getElementById('reveal-list');

  if (!overlay || !totalEl || !listEl) return;

  // data.cards: array of { ability: string, count: number }
  // data.totalCards: number (optional, we compute fallback)
  const cards = Array.isArray(data.cards) ? data.cards : [];
  const total = typeof data.totalCards === 'number'
    ? data.totalCards
    : cards.reduce((sum, c) => sum + (c.count || 0), 0);

  totalEl.textContent = `${total} CARTA${total !== 1 ? 'S' : ''} OBTENIDA${total !== 1 ? 'S' : ''}`;

  listEl.innerHTML = '';

  cards.forEach((entry, idx) => {
    const abilityKey = entry.ability || '';
    const count      = entry.count || 0;
    const name       = ABILITY_NAMES[abilityKey] || abilityKey.toUpperCase();
    const rarity     = ABILITY_RARITY[abilityKey] || 'common';
    const color      = RARITY_COLORS[rarity] || '#00fff2';

    const item = document.createElement('div');
    item.className = 'reveal-item';
    item.style.cssText = `
      border-color: ${color}33;
      background: rgba(0,0,0,0.3);
      animation-delay: ${idx * 60}ms;
    `;

    item.innerHTML = `
      <div>
        <div class="reveal-item-name" style="color:${color};text-shadow:0 0 8px ${color}66">${name}</div>
        <div class="reveal-item-rarity" style="color:${color}">${rarity.toUpperCase()}</div>
      </div>
      <div class="reveal-item-count" style="color:${color};text-shadow:0 0 8px ${color}">+${count}</div>
    `;

    listEl.appendChild(item);
  });

  // Show overlay, trap focus on continue button
  overlay.classList.add('visible');
  overlay.style.display = 'flex';

  const continueBtn = document.getElementById('reveal-continue-btn');
  if (continueBtn) {
    setTimeout(() => continueBtn.focus(), 350);
  }
}

function hideRevealOverlay() {
  const overlay = document.getElementById('reveal-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  overlay.style.display = 'none';
}

// ── Wire up overlay close ──
function initOverlay() {
  const continueBtn = document.getElementById('reveal-continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      hideRevealOverlay();
      if (typeof playSelectSound === 'function') playSelectSound();
    });
  }

  // Close on overlay backdrop click (not panel)
  const overlay = document.getElementById('reveal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        hideRevealOverlay();
        if (typeof playSelectSound === 'function') playSelectSound();
      }
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('reveal-overlay');
      if (overlay && overlay.classList.contains('visible')) {
        hideRevealOverlay();
        if (typeof playSelectSound === 'function') playSelectSound();
      }
    }
  });
}

// ── Wire up chest open buttons ──
function initChestButtons() {
  document.querySelectorAll('.chest-open-btn').forEach((btn) => {
    const card = btn.closest('.chest-card');
    if (!card) return;

    const chestType = btn.dataset.chest;

    btn.addEventListener('click', () => {
      openChest(chestType, card);
    });

    // Touch feedback
    btn.addEventListener('touchstart', () => {
      btn.style.opacity = '0.75';
    }, { passive: true });
    btn.addEventListener('touchend', () => {
      btn.style.opacity = '';
    }, { passive: true });

    // Hover sound
    btn.addEventListener('mouseenter', () => {
      if (typeof playHoverSound === 'function') playHoverSound();
    });
  });
}

// ── Back button ──
function initBackButton() {
  const backBtn = document.getElementById('shop-back-btn');
  if (!backBtn) return;

  backBtn.addEventListener('mouseenter', () => {
    if (typeof playHoverSound === 'function') playHoverSound();
  });

  backBtn.addEventListener('click', () => {
    if (typeof playSelectSound === 'function') playSelectSound();
    setTimeout(() => { window.location.href = '/'; }, 280);
  });
}

// ── Keyboard shortcut: Backspace / Escape goes back ──
document.addEventListener('keydown', (e) => {
  const overlay = document.getElementById('reveal-overlay');
  const overlayOpen = overlay && overlay.classList.contains('visible');

  if (overlayOpen) return; // handled separately above

  if (e.key === 'Escape' || e.key === 'Backspace') {
    if (typeof playSelectSound === 'function') playSelectSound();
    setTimeout(() => { window.location.href = '/'; }, 300);
  }
});

// ── Init ──
(function init() {
  drawGemIcon(document.getElementById('shop-gem-icon'));
  loadGems();
  initChestButtons();
  initOverlay();
  initBackButton();
})();
