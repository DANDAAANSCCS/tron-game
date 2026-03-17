// =============================================================================
// NEON DEFENSE — Offline Cache & Sync System
// Caches server data locally. Works offline. Syncs when back online.
// Must be loaded BEFORE any game scripts that call fetch().
// =============================================================================

const _offlineCache = {
  _key: 'neonDefenseOfflineData',

  // Read cached data
  get() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  },

  // Write to cache
  set(data) {
    try {
      const existing = this.get() || {};
      const merged = { ...existing, ...data, _cachedAt: Date.now() };
      localStorage.setItem(this._key, JSON.stringify(merged));
    } catch (_) {}
  },

  // Get specific field
  getField(field) {
    const data = this.get();
    return data ? data[field] : undefined;
  },

  // Set specific field
  setField(field, value) {
    const data = this.get() || {};
    data[field] = value;
    data._cachedAt = Date.now();
    try { localStorage.setItem(this._key, JSON.stringify(data)); } catch (_) {}
  },

  // Queue a POST request for when we're back online
  queuePost(url, body) {
    try {
      const queue = JSON.parse(localStorage.getItem('neonDefensePostQueue') || '[]');
      queue.push({ url, body, time: Date.now() });
      localStorage.setItem('neonDefensePostQueue', JSON.stringify(queue));
    } catch (_) {}
  },

  // Process queued POST requests
  async flushQueue() {
    try {
      const raw = localStorage.getItem('neonDefensePostQueue');
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!queue.length) return;

      const remaining = [];
      for (const item of queue) {
        try {
          const res = await fetch(item.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.body),
          });
          if (!res.ok) remaining.push(item); // retry later
        } catch (_) {
          remaining.push(item); // still offline
          break; // stop trying
        }
      }
      localStorage.setItem('neonDefensePostQueue', JSON.stringify(remaining));
    } catch (_) {}
  }
};

// ── Session persistence ──
// Cache auth state so the user doesn't get kicked to login when offline
const _sessionKey = 'neonDefenseSession';

function cacheSession(userData) {
  try { localStorage.setItem(_sessionKey, JSON.stringify(userData)); } catch (_) {}
}

function getCachedSession() {
  try {
    const raw = localStorage.getItem(_sessionKey);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

// ── Override fetch for offline resilience ──
const _realFetch = window.fetch;

window.fetch = async function(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const urlStr = typeof url === 'string' ? url : url.toString();

  // Only intercept API calls
  if (!urlStr.includes('/api/') && !urlStr.includes('/auth/')) {
    return _realFetch.call(this, url, options);
  }

  try {
    // Try real fetch first
    const res = await _realFetch.call(this, url, options);

    // Cache successful GET responses
    if (method === 'GET' && res.ok) {
      const clone = res.clone();
      clone.json().then(data => {
        if (urlStr.includes('/api/gamedata')) {
          _offlineCache.set({ gamedata: data });
        } else if (urlStr.includes('/api/abilities')) {
          _offlineCache.set({ abilities: data });
        } else if (urlStr.includes('/api/me')) {
          cacheSession(data);
        } else if (urlStr.includes('/api/autosave') && !urlStr.includes('DELETE')) {
          _offlineCache.set({ autosave: data });
        }
      }).catch(() => {});
    }

    // Cache successful POST responses
    if (method === 'POST' && res.ok) {
      if (urlStr.includes('/api/gamedata')) {
        // Update cached gamedata with the posted changes
        try {
          const body = JSON.parse(options.body);
          const cached = _offlineCache.getField('gamedata') || {};
          if (body.gems !== undefined) cached.gems = body.gems;
          if (body.silverCoins !== undefined) cached.silverCoins = body.silverCoins;
          if (body.permUpgrades) cached.permUpgrades = { ...cached.permUpgrades, ...body.permUpgrades };
          _offlineCache.set({ gamedata: cached });
        } catch (_) {}
      }
    }

    // Try to flush any queued requests when online
    _offlineCache.flushQueue();

    return res;
  } catch (err) {
    // Network error — we're offline

    // For GET requests, return cached data
    if (method === 'GET') {
      if (urlStr.includes('/api/me')) {
        const session = getCachedSession();
        if (session) {
          return new Response(JSON.stringify(session), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      if (urlStr.includes('/api/gamedata')) {
        const cached = _offlineCache.getField('gamedata');
        if (cached) {
          return new Response(JSON.stringify(cached), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      if (urlStr.includes('/api/abilities')) {
        const cached = _offlineCache.getField('abilities');
        if (cached) {
          return new Response(JSON.stringify(cached), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      if (urlStr.includes('/api/autosave')) {
        const cached = _offlineCache.getField('autosave');
        if (cached) {
          return new Response(JSON.stringify(cached), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }
      if (urlStr.includes('/api/auth-config')) {
        return new Response(JSON.stringify({ googleEnabled: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // For POST requests, queue them for later and return fake success
    if (method === 'POST') {
      try {
        const body = JSON.parse(options.body || '{}');
        _offlineCache.queuePost(urlStr, body);

        // Update local cache optimistically
        if (urlStr.includes('/api/gamedata')) {
          const cached = _offlineCache.getField('gamedata') || {};
          if (body.gems !== undefined) cached.gems = body.gems;
          if (body.silverCoins !== undefined) cached.silverCoins = body.silverCoins;
          _offlineCache.set({ gamedata: cached });
        }
        if (urlStr.includes('/api/autosave')) {
          _offlineCache.set({ autosave: { sessionState: body } });
        }

        return new Response(JSON.stringify({ ok: true, offline: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (_) {}
    }

    // For DELETE, just succeed silently
    if (method === 'DELETE') {
      if (urlStr.includes('/api/autosave')) {
        _offlineCache.set({ autosave: { sessionState: null } });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Can't handle this request offline
    throw err;
  }
};

// ── Sync when coming back online ──
window.addEventListener('online', () => {
  _offlineCache.flushQueue();
});

// ── Try to flush queue on load ──
if (navigator.onLine) {
  setTimeout(() => _offlineCache.flushQueue(), 3000);
}
