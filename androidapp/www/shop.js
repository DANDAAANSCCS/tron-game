// ═══════════════════════════════════════════════════════════
//  shop.js — Shop page with Clash Royale-style chest opening
//  Depends on: shared/bg-animation.js, shared/audio.js
// ═══════════════════════════════════════════════════════════

// ── Ability display data ──
const ABILITY_NAMES = {
  emp:       'EMP PULSE',
  shield:    'ESCUDO',
  rapidfire: 'FUEGO RAPIDO',
  chain:     'RAYO CADENA',
  freeze:    'ONDA GLACIAL',
  orbital:   'ATAQUE ORBITAL',
};

const ABILITY_ICONS = {
  emp:       '⚡',
  shield:    '🛡',
  rapidfire: '🔥',
  chain:     '⚛',
  freeze:    '❄',
  orbital:   '☄',
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
let isBusy = false;

// ── Gem icon (canvas draw) ──
function drawGemIcon(cvs) {
  if (!cvs) return;
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

// ── Gem count ──
async function loadGems() {
  try {
    const res = await fetch('/api/gamedata');
    if (res.ok) {
      const data = await res.json();
      currentGems = data.gems || 0;
    }
  } catch (_) {
    // Silent fail — shows 0
  }
  updateGemsDisplay();
}

function updateGemsDisplay() {
  const el = document.getElementById('shop-gems-count');
  if (el) el.textContent = currentGems;
}

// ── Floating particles on each chest card ──
function spawnChestParticles(card) {
  const count = 6;
  const rect  = card.getBoundingClientRect();
  const w     = rect.width;
  const h     = rect.height;

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'chest-particle';
    // Random horizontal position, start near bottom
    dot.style.left   = `${10 + Math.random() * 80}%`;
    dot.style.bottom = `${Math.random() * 30}%`;
    dot.style.animationDelay    = `${Math.random() * 3}s`;
    dot.style.animationDuration = `${3 + Math.random() * 3}s`;
    card.appendChild(dot);
  }
}

// ── Error feedback ──
function showCardError(card, message) {
  card.classList.remove('deny');
  void card.offsetWidth; // force reflow
  card.classList.add('deny');
  card.addEventListener('animationend', () => card.classList.remove('deny'), { once: true });

  const errEl = card.querySelector('.chest-error');
  if (errEl) {
    errEl.textContent = message;
    clearTimeout(errEl._timer);
    errEl._timer = setTimeout(() => { errEl.textContent = ''; }, 3000);
  }

  if (typeof playDenySound === 'function') playDenySound();
}

// ── Screen flash ──
function doScreenFlash() {
  const flash = document.getElementById('screen-flash');
  if (!flash) return;
  // Animate via JS for precise control
  flash.style.transition = 'none';
  flash.style.opacity = '0.85';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flash.style.transition = 'opacity 0.5s ease';
      flash.style.opacity = '0';
    });
  });
}

// ── Chest opening animation sequence ──
// 1. Lid opens  2. Light beam  3. Screen flash  4. Show overlay
function playChestOpenAnimation(card, data) {
  return new Promise((resolve) => {
    // Phase 1: lid opens
    card.classList.add('is-opening');

    const lid  = card.querySelector('.chest-icon-lid');
    const beam = card.querySelector('.chest-light-beam');

    // Play chest-open sound at start
    if (typeof playChestOpenSound === 'function') playChestOpenSound();

    // Phase 2: light beam shoots up after ~250ms (mid-open)
    setTimeout(() => {
      if (beam) {
        beam.style.transition = 'height 0.3s ease, opacity 0.3s ease';
        beam.style.height  = '120px';
        beam.style.opacity = '0.9';
      }
    }, 250);

    // Phase 3: screen flash at peak
    setTimeout(() => {
      doScreenFlash();
    }, 480);

    // Phase 4: resolve so caller shows overlay
    setTimeout(() => {
      // Reset card animation state
      card.classList.remove('is-opening');
      if (beam) {
        beam.style.transition = 'height 0.2s ease, opacity 0.2s ease';
        beam.style.height  = '0';
        beam.style.opacity = '0';
      }
      resolve();
    }, 700);
  });
}

// ── Open chest: request + full animation sequence ──
async function openChest(chestType, card) {
  if (isBusy) return;

  const cost = parseInt(card.dataset.cost, 10);

  if (currentGems < cost) {
    showCardError(card, (typeof t === 'function' ? t('shop.not_enough') : 'GEMAS INSUFICIENTES'));
    return;
  }

  isBusy = true;

  if (typeof playSelectSound === 'function') playSelectSound();

  const btn = card.querySelector('.chest-open-btn');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/chest/open', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chestType }),
    });

    if (!res.ok) {
      let msg = (typeof t === 'function' ? t('shop.error_open') : 'ERROR AL ABRIR');
      try {
        const body = await res.json();
        if (body && body.error) msg = body.error.toUpperCase();
      } catch (_) {}
      showCardError(card, msg);
      return;
    }

    const data = await res.json();

    // Update gem count from server (authoritative)
    if (typeof data.gems === 'number') {
      currentGems = data.gems;
    } else {
      currentGems = Math.max(0, currentGems - cost);
    }
    updateGemsDisplay();

    // Run the opening animation, then show the reveal
    await playChestOpenAnimation(card, data);
    showRevealOverlay(data);

  } catch (_) {
    showCardError(card, (typeof t === 'function' ? t('shop.error_network') : 'ERROR DE RED'));
    if (typeof playDenySound === 'function') playDenySound();
  } finally {
    if (btn) btn.disabled = false;
    isBusy = false;
  }
}

// ═══════════════════════════════════════════
//  REVEAL OVERLAY
// ═══════════════════════════════════════════

// Background floating dots
function startRevealParticles() {
  const container = document.getElementById('reveal-bg-particles');
  if (!container) return;
  container.innerHTML = '';

  const colors = ['#00fff2', '#4488ff', '#aa00ff', '#ffaa00', '#ff0055'];
  const count  = 30;

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'reveal-bg-dot';
    const color = colors[Math.floor(Math.random() * colors.length)];
    dot.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${color};
      box-shadow: 0 0 4px ${color};
      animation-duration: ${5 + Math.random() * 8}s;
      animation-delay: ${Math.random() * 6}s;
    `;
    container.appendChild(dot);
  }
}

function stopRevealParticles() {
  const container = document.getElementById('reveal-bg-particles');
  if (container) container.innerHTML = '';
}

// Sparkles that burst from a card when it appears
function spawnCardSparkles(cardEl, color) {
  const sparkCount = 8;
  for (let i = 0; i < sparkCount; i++) {
    const sp = document.createElement('div');
    sp.className = 'card-sparkle';
    const angle  = (i / sparkCount) * 360;
    const dist   = 30 + Math.random() * 40;
    const rad    = (angle * Math.PI) / 180;
    const sx     = Math.cos(rad) * dist;
    const sy     = Math.sin(rad) * dist;
    sp.style.cssText = `
      top: 50%; left: 50%;
      background: ${color};
      box-shadow: 0 0 4px ${color};
      animation-delay: ${Math.random() * 0.1}s;
      --sx: ${sx}px;
      --sy: ${sy}px;
    `;
    cardEl.appendChild(sp);
    // Remove after animation
    setTimeout(() => sp.remove(), 900);
  }
}

// Build a single ability card element (starts hidden/flipped for reveal)
function buildAbilityCard(abilityKey, count) {
  const name   = (typeof t === 'function' ? t('ability.' + abilityKey) : (ABILITY_NAMES[abilityKey] || abilityKey.toUpperCase()));
  const icon   = ABILITY_ICONS[abilityKey] || '?';
  const rarity = ABILITY_RARITY[abilityKey] || 'common';
  const color  = RARITY_COLORS[rarity] || '#00fff2';

  const rarityName = (typeof t === 'function' ? t('rarity.' + rarity) : ({
    common:    'COMUN',
    rare:      'RARO',
    epic:      'EPICO',
    legendary: 'LEGENDARIO',
  }[rarity] || rarity.toUpperCase()));

  const card = document.createElement('div');
  card.className = 'ability-card';
  card.setAttribute('aria-label', `${name} — ${rarityName} — +${count} cartas`);
  card.style.cssText = `
    border-color: ${color}55;
    box-shadow: 0 0 16px ${color}22, inset 0 0 20px ${color}08;
  `;

  card.innerHTML = `
    <div class="card-icon-area" style="border-color:${color}44; box-shadow:0 0 12px ${color}33;">
      <span aria-hidden="true">${icon}</span>
    </div>
    <div class="card-info">
      <div class="card-ability-name" style="color:${color}; text-shadow:0 0 10px ${color}88;">${name}</div>
      <div class="card-rarity-label" style="color:${color};">${rarityName}</div>
    </div>
    <div class="card-count" style="color:${color}; text-shadow:0 0 12px ${color};">+${count}</div>
  `;

  return { el: card, color };
}

// Reveal cards one by one with staggered 3D flip
function revealCardsSequentially(cards, viewport) {
  const continueBtn = document.getElementById('reveal-continue-btn');
  const STAGGER_MS  = 420;

  cards.forEach(({ el, color }, idx) => {
    viewport.appendChild(el);

    setTimeout(() => {
      // Trigger flip-in transition
      requestAnimationFrame(() => {
        el.classList.add('flipped-in');
      });

      // Card flip sound
      if (typeof playHoverSound === 'function') playHoverSound();

      // Sparkles burst on card
      spawnCardSparkles(el, color);

      // Scroll the new card into view
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Show continue button after last card
      if (idx === cards.length - 1) {
        setTimeout(() => {
          if (continueBtn) {
            continueBtn.classList.add('visible');
            continueBtn.focus();
          }
        }, 500);
      }
    }, idx * STAGGER_MS);
  });
}

function showRevealOverlay(data) {
  // Convert drop object { abilityId: count } to array
  const cards = Object.entries(data.drop || {}).map(([ability, count]) => ({
    ability,
    count,
  }));

  const total = typeof data.totalCards === 'number'
    ? data.totalCards
    : cards.reduce((sum, c) => sum + (c.count || 0), 0);

  const overlay    = document.getElementById('reveal-overlay');
  const totalEl    = document.getElementById('reveal-total');
  const viewport   = document.getElementById('reveal-cards-viewport');
  const continueBtn = document.getElementById('reveal-continue-btn');

  if (!overlay || !totalEl || !viewport) return;

  // Reset state
  viewport.innerHTML = '';
  if (continueBtn) continueBtn.classList.remove('visible');

  totalEl.textContent = (typeof t === 'function' ? t('shop.cards_obtained', {n: total}) : `${total} CARTA${total !== 1 ? 'S' : ''} OBTENIDA${total !== 1 ? 'S' : ''}`);

  // Show overlay with fade
  overlay.style.opacity = '0';
  overlay.classList.add('visible');
  requestAnimationFrame(() => {
    overlay.style.transition = 'opacity 0.35s ease';
    overlay.style.opacity    = '1';
  });

  // Start background particles
  startRevealParticles();

  // Build card elements
  const builtCards = cards.map(({ ability, count }) =>
    buildAbilityCard(ability, count)
  );

  // Start sequential reveal
  revealCardsSequentially(builtCards, viewport);
}

function hideRevealOverlay() {
  const overlay = document.getElementById('reveal-overlay');
  if (!overlay) return;

  overlay.style.transition = 'opacity 0.25s ease';
  overlay.style.opacity    = '0';

  setTimeout(() => {
    overlay.classList.remove('visible');
    overlay.style.opacity    = '';
    overlay.style.transition = '';
    stopRevealParticles();
  }, 280);
}

// ── Wire up overlay close ──
function initOverlay() {
  const continueBtn = document.getElementById('reveal-continue-btn');
  if (continueBtn) {
    continueBtn.textContent = (typeof t === 'function' ? t('shop.continue') : 'CONTINUAR');
    continueBtn.addEventListener('click', () => {
      if (typeof playSelectSound === 'function') playSelectSound();
      hideRevealOverlay();
    });
  }

  // Backdrop click (not on a card)
  const overlay = document.getElementById('reveal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      const vp = document.getElementById('reveal-cards-viewport');
      const contWrap = document.querySelector('.reveal-continue-wrap');
      const header   = document.querySelector('.reveal-header');
      const isPanel  = (vp && vp.contains(e.target))
                    || (contWrap && contWrap.contains(e.target))
                    || (header && header.contains(e.target));
      if (!isPanel) {
        const continueVisible = continueBtn && continueBtn.classList.contains('visible');
        if (continueVisible) {
          if (typeof playSelectSound === 'function') playSelectSound();
          hideRevealOverlay();
        }
      }
    });
  }

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const ov = document.getElementById('reveal-overlay');
      if (ov && ov.classList.contains('visible')) {
        const btn = document.getElementById('reveal-continue-btn');
        if (btn && btn.classList.contains('visible')) {
          if (typeof playSelectSound === 'function') playSelectSound();
          hideRevealOverlay();
        }
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

    // Touch feedback (passive for performance)
    btn.addEventListener('touchstart', () => {
      btn.style.opacity = '0.7';
    }, { passive: true });
    btn.addEventListener('touchend', () => {
      btn.style.opacity = '';
    }, { passive: true });

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
    window.location.href = '/menu.html';
  });
}

// ── Keyboard shortcuts (Escape / Backspace go back when overlay is closed) ──
document.addEventListener('keydown', (e) => {
  const overlay     = document.getElementById('reveal-overlay');
  const overlayOpen = overlay && overlay.classList.contains('visible');
  if (overlayOpen) return; // handled separately

  if (e.key === 'Escape' || e.key === 'Backspace') {
    if (typeof playSelectSound === 'function') playSelectSound();
    window.location.href = '/menu.html';
  }
});

// ── Init ──
(function init() {
  drawGemIcon(document.getElementById('shop-gem-icon'));
  loadGems();

  // Spawn floating particles on each chest card
  document.querySelectorAll('.chest-card').forEach(spawnChestParticles);

  initChestButtons();
  initOverlay();
  initBackButton();
})();
