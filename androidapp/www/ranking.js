// ═══════════════════════════════════════════
//  ranking.js — Leaderboard page
//  Depends on: shared/bg-animation.js, shared/audio.js, shared/i18n.js
// ═══════════════════════════════════════════

(function () {
  'use strict';

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Safe translation wrapper. Falls back to the raw key if t() is not loaded.
   * @param {string} key
   * @returns {string}
   */
  function tr(key) {
    return typeof t === 'function' ? t(key) : key;
  }

  /**
   * Format seconds into MM:SS string.
   * @param {number} seconds
   * @returns {string}
   */
  function formatTime(seconds) {
    var s = Math.max(0, Math.floor(Number(seconds) || 0));
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    return (mm < 10 ? '0' + mm : '' + mm) + ':' + (ss < 10 ? '0' + ss : '' + ss);
  }

  /**
   * Return the medal/rank color for positions 1–3, or a default dim color.
   * @param {number} rank  1-based
   * @returns {string}  CSS color value
   */
  function rankColor(rank) {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return null;
  }

  /**
   * Escape user-supplied text to prevent HTML injection.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Render helpers ───────────────────────────────────────────────────────────

  /**
   * Build a <tr> element for the levels table.
   * @param {Object} entry  { name, maxLevel, maxWave, totalScore }
   * @param {number} index  0-based position in the array
   * @returns {HTMLTableRowElement}
   */
  function buildLevelsRow(entry, index) {
    var rank = index + 1;
    var color = rankColor(rank);
    var tr = document.createElement('tr');

    if (rank <= 3) tr.classList.add('rank-' + rank);

    var rankCell = document.createElement('td');
    rankCell.className = 'col-rank';
    rankCell.textContent = '#' + rank;
    if (color) rankCell.style.color = color;
    tr.appendChild(rankCell);

    var nameCell = document.createElement('td');
    nameCell.textContent = escapeHtml(entry.name || '---');
    if (color) nameCell.style.color = color;
    tr.appendChild(nameCell);

    var levelCell = document.createElement('td');
    levelCell.className = 'col-value';
    levelCell.textContent = entry.maxLevel != null ? entry.maxLevel : '---';
    tr.appendChild(levelCell);

    var waveCell = document.createElement('td');
    waveCell.className = 'col-value';
    waveCell.textContent = entry.maxWave != null ? entry.maxWave : '---';
    tr.appendChild(waveCell);

    var scoreCell = document.createElement('td');
    scoreCell.className = 'col-value';
    scoreCell.style.textAlign = 'right';
    scoreCell.textContent = entry.totalScore != null
      ? Number(entry.totalScore).toLocaleString()
      : '---';
    tr.appendChild(scoreCell);

    return tr;
  }

  /**
   * Build a <tr> element for the infinite table.
   * @param {Object} entry  { name, score, wave, timePlayed }
   * @param {number} index  0-based position in the array
   * @returns {HTMLTableRowElement}
   */
  function buildInfiniteRow(entry, index) {
    var rank = index + 1;
    var color = rankColor(rank);
    var tr = document.createElement('tr');

    if (rank <= 3) tr.classList.add('rank-' + rank);

    var rankCell = document.createElement('td');
    rankCell.className = 'col-rank';
    rankCell.textContent = '#' + rank;
    if (color) rankCell.style.color = color;
    tr.appendChild(rankCell);

    var nameCell = document.createElement('td');
    nameCell.textContent = escapeHtml(entry.name || '---');
    if (color) nameCell.style.color = color;
    tr.appendChild(nameCell);

    var scoreCell = document.createElement('td');
    scoreCell.className = 'col-value';
    scoreCell.textContent = entry.score != null
      ? Number(entry.score).toLocaleString()
      : '---';
    tr.appendChild(scoreCell);

    var waveCell = document.createElement('td');
    waveCell.className = 'col-value';
    waveCell.textContent = entry.wave != null ? entry.wave : '---';
    tr.appendChild(waveCell);

    var timeCell = document.createElement('td');
    timeCell.className = 'col-value';
    timeCell.style.textAlign = 'right';
    timeCell.textContent = entry.timePlayed != null
      ? formatTime(entry.timePlayed)
      : '--:--';
    tr.appendChild(timeCell);

    return tr;
  }

  // ── Data loading ─────────────────────────────────────────────────────────────

  /**
   * Populate the levels table from the API.
   */
  function loadLevels() {
    var tbody = document.getElementById('levels-tbody');
    var emptyMsg = document.getElementById('levels-empty');

    if (!tbody) return;

    fetch('/api/leaderboard/levels')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        tbody.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
          emptyMsg.style.display = '';
          return;
        }
        emptyMsg.style.display = 'none';
        data.forEach(function (entry, i) {
          tbody.appendChild(buildLevelsRow(entry, i));
        });
      })
      .catch(function (err) {
        console.error('[ranking] levels fetch error:', err);
        tbody.innerHTML = '';
        emptyMsg.style.display = '';
      });
  }

  /**
   * Populate the infinite table from the API.
   */
  function loadInfinite() {
    var tbody = document.getElementById('infinite-tbody');
    var emptyMsg = document.getElementById('infinite-empty');

    if (!tbody) return;

    fetch('/api/leaderboard/infinite')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        tbody.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
          emptyMsg.style.display = '';
          return;
        }
        emptyMsg.style.display = 'none';
        data.forEach(function (entry, i) {
          tbody.appendChild(buildInfiniteRow(entry, i));
        });
      })
      .catch(function (err) {
        console.error('[ranking] infinite fetch error:', err);
        tbody.innerHTML = '';
        emptyMsg.style.display = '';
      });
  }

  // ── Tab switching ────────────────────────────────────────────────────────────

  var currentTab = 'levels';
  var dataLoaded = { levels: false, infinite: false };

  /**
   * Activate a tab by name ('levels' | 'infinite').
   * @param {string} name
   */
  function activateTab(name) {
    if (name === currentTab) return;
    currentTab = name;

    if (typeof playSelectSound === 'function') playSelectSound();

    var buttons = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.tab-panel');

    buttons.forEach(function (btn) {
      var isActive = btn.dataset.tab === name;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach(function (panel) {
      var isActive = panel.id === 'panel-' + name;
      panel.classList.toggle('active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    // Scroll content back to top when switching tabs
    var content = document.getElementById('ranking-content');
    if (content) content.scrollTop = 0;

    // Lazy-load data for the newly active tab
    if (name === 'infinite' && !dataLoaded.infinite) {
      dataLoaded.infinite = true;
      loadInfinite();
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    // Wire up tab buttons
    var tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activateTab(btn.dataset.tab);
      });
    });

    // Wire up back button sound
    var backBtn = document.getElementById('ranking-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (typeof playSelectSound === 'function') playSelectSound();
      });
    }

    // Load levels data immediately (default tab)
    dataLoaded.levels = true;
    loadLevels();
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
