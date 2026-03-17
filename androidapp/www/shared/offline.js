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

// ── Offline chest opening (replicates server logic) ──
const _CHEST_DEFS = {
  common: { cost: 150, rarities: ['common', 'rare'], weights: { common: 80, rare: 20 }, min: 25, max: 90 },
  rare:   { cost: 350, rarities: ['rare', 'epic'],   weights: { rare: 75, epic: 25 },   min: 10, max: 30 },
  epic:   { cost: 500, rarities: ['epic', 'legendary'], weights: { epic: 70, legendary: 30 }, min: 4, max: 8 },
};
const _ABILITY_RARITIES = {
  // Original 6
  emp: 'common', shield: 'common', rapidfire: 'rare', chain: 'rare', freeze: 'epic', orbital: 'legendary',
  // Common
  plasma_burst: 'common', static_field: 'common', repair_nanobots: 'common', shrapnel_mine: 'common',
  targeting_boost: 'common', poison_spray: 'common', energy_wall: 'common', scatter_shot: 'common',
  blind_flash: 'common', bullet_magnet: 'common', gravity_pull: 'common', armor_plating: 'common',
  spark_trail: 'common', micro_missiles: 'common', decoy_signal: 'common', voltaic_aura: 'common',
  grease_slick: 'common', ricochet_round: 'common', smoke_screen: 'common', overcharge_shot: 'common',
  seismic_tap: 'common', turret_overclock: 'common', acid_splash: 'common', burst_shield: 'common',
  energy_spike: 'common', hail_storm: 'common', crit_boost: 'common', web_trap: 'common',
  flare_launch: 'common', repulsor_blast: 'common',
  // Rare
  twin_barrels: 'rare', chain_burn: 'rare', void_rift: 'rare', kill_trigger_bomb: 'rare',
  drone_sentry: 'rare', lifesteal_rounds: 'rare', tesla_coil: 'rare', mirror_wall: 'rare',
  vulnerability_mark: 'rare', phantom_barrage: 'rare', time_slow_field: 'rare', concussive_blast: 'rare',
  orbital_mine_ring: 'rare', shockwave_pulse: 'rare', elemental_infusion: 'rare', spectral_copy: 'rare',
  execute_protocol: 'rare', nano_swarm: 'rare', kinetic_surge: 'rare', scatter_mines: 'rare',
  pulse_shield: 'rare', dark_matter_round: 'rare', beacon_of_weakness: 'rare', cluster_bomb: 'rare',
  sonic_boom: 'rare', sniper_scope: 'rare', overclock_ammo: 'rare', frost_nova: 'rare',
  momentum_field: 'rare', toxin_canister: 'rare',
  // Epic
  blackhole_seed: 'epic', bullet_storm: 'epic', time_reversal: 'epic', ion_cannon: 'epic',
  quantum_mirror: 'epic', plague_cloud: 'epic', turret_fortress: 'epic', gravity_inverter: 'epic',
  energy_leech: 'epic', cryo_freeze: 'epic', death_mark: 'epic', overload_field: 'epic',
  antimatter_shell: 'epic', phase_shift: 'epic', gravity_well_array: 'epic', singularity_bomb: 'epic',
  neural_disruptor: 'epic', gravity_lens: 'epic', chain_reaction: 'epic', temporal_stasis: 'epic',
  photon_barrier: 'epic', power_surge: 'epic', warp_field: 'epic', temporal_dilation: 'epic',
  spectral_bomb: 'epic', rewind_damage: 'epic', prism_array: 'epic', dark_resonance: 'epic',
  nanobot_swarm_repair: 'epic', nano_heal_aura: 'epic',
  // Legendary
  cosmic_ray: 'legendary', apocalypse_nova: 'legendary', time_stop: 'legendary', supernova_collapse: 'legendary',
  dimensional_rift: 'legendary', infinite_turret: 'legendary', total_annihilation: 'legendary',
  vampire_field: 'legendary', matrix_hack: 'legendary', solar_flare: 'legendary', omega_shield: 'legendary',
  god_mode: 'legendary', paradox_loop: 'legendary', wrath_of_cosmos: 'legendary', infinity_mirror: 'legendary',
  reaper_scythe: 'legendary', eternal_storm: 'legendary', void_collapse: 'legendary', entropy_bomb: 'legendary',
  legion_protocol: 'legendary', reality_fracture: 'legendary', mass_corruption: 'legendary',
  turret_ascension: 'legendary', overdrive_core: 'legendary', echo_blast: 'legendary',
};

function _offlineOpenChest(chestType) {
  const chest = _CHEST_DEFS[chestType];
  if (!chest) return null;

  const cached = _offlineCache.getField('gamedata') || {};
  const gems = cached.gems || 0;
  if (gems < chest.cost) return { error: 'NOT ENOUGH GEMS' };

  // Weighted card count (biased toward min)
  const range = chest.max - chest.min;
  const totalCards = chest.min + Math.floor(range * Math.pow(Math.random(), 2.5));

  // Pick rarity for each card
  const drop = {};
  const weightEntries = Object.entries(chest.weights);
  const totalWeight = weightEntries.reduce((s, [, w]) => s + w, 0);

  const ownedCards = cached.abilityCards || {};

  for (let i = 0; i < totalCards; i++) {
    let r = Math.random() * totalWeight;
    let rarity = weightEntries[0][0];
    for (const [rar, w] of weightEntries) { r -= w; if (r <= 0) { rarity = rar; break; } }
    // Pick ability: 80% chance to favor owned, 20% any
    const pool = Object.entries(_ABILITY_RARITIES).filter(([, r]) => r === rarity).map(([id]) => id);
    if (!pool.length) continue;
    const ownedPool = pool.filter(id => (ownedCards[id] || 0) > 0);
    let abilityId;
    if (ownedPool.length > 0 && Math.random() < 0.80) {
      abilityId = ownedPool[Math.floor(Math.random() * ownedPool.length)];
    } else {
      abilityId = pool[Math.floor(Math.random() * pool.length)];
    }
    drop[abilityId] = (drop[abilityId] || 0) + 1;
  }

  // Update local cache
  const newGems = gems - chest.cost;
  cached.gems = newGems;
  const cards = cached.abilityCards || {};
  const levels = cached.abilityLevels || {};
  for (const [id, count] of Object.entries(drop)) {
    cards[id] = (cards[id] || 0) + count;
    if (cards[id] >= 1 && (!levels[id] || levels[id] < 1)) levels[id] = 1;
  }
  cached.abilityCards = cards;
  cached.abilityLevels = levels;
  _offlineCache.set({ gamedata: cached });

  return { ok: true, gems: newGems, drop, totalCards, abilityCards: cards, abilityLevels: levels };
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

    // For POST requests, handle offline
    if (method === 'POST') {
      try {
        const body = JSON.parse(options.body || '{}');

        // Chest opening — run locally, don't queue (server can't replay randomness)
        if (urlStr.includes('/api/chest/open')) {
          const result = _offlineOpenChest(body.chestType);
          if (!result) return new Response(JSON.stringify({ error: 'INVALID CHEST' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          if (result.error) return new Response(JSON.stringify(result), { status: 400, headers: { 'Content-Type': 'application/json' } });
          // Queue a gamedata sync for when we're back online
          _offlineCache.queuePost(urlStr.replace('/chest/open', '/gamedata'), {
            gems: result.gems,
            // Server will reconcile cards on next online session
          });
          return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Ability equip/unequip — handle locally
        if (urlStr.includes('/api/abilities/equip')) {
          const cached = _offlineCache.getField('gamedata') || {};
          const equipped = cached.equippedAbilities || [];
          if (!equipped.includes(body.abilityId) && equipped.length < 5) {
            equipped.push(body.abilityId);
            cached.equippedAbilities = equipped;
            _offlineCache.set({ gamedata: cached });
          }
          _offlineCache.queuePost(urlStr, body);
          return new Response(JSON.stringify({ ok: true, equippedAbilities: equipped }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (urlStr.includes('/api/abilities/unequip')) {
          const cached = _offlineCache.getField('gamedata') || {};
          const equipped = (cached.equippedAbilities || []).filter(id => id !== body.abilityId);
          cached.equippedAbilities = equipped;
          _offlineCache.set({ gamedata: cached });
          _offlineCache.queuePost(urlStr, body);
          return new Response(JSON.stringify({ ok: true, equippedAbilities: equipped }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Ability upgrade — handle locally
        if (urlStr.includes('/api/abilities/upgrade')) {
          const cached = _offlineCache.getField('gamedata') || {};
          const levels = cached.abilityLevels || {};
          const currentLvl = levels[body.abilityId] || 0;
          if (currentLvl < 20) {
            levels[body.abilityId] = currentLvl + 1;
            // Deduct silver (approximate — server will reconcile)
            const rarity = _ABILITY_RARITIES[body.abilityId] || 'common';
            const baseCosts = { common: 1500, rare: 3000, epic: 5000, legendary: 8000 };
            const cost = Math.round((baseCosts[rarity] || 1500) * Math.pow(1.25, currentLvl - 1));
            cached.silverCoins = Math.max(0, (cached.silverCoins || 0) - cost);
            cached.abilityLevels = levels;
            _offlineCache.set({ gamedata: cached });
            _offlineCache.queuePost(urlStr, body);
            return new Response(JSON.stringify({ ok: true, newLevel: currentLvl + 1, silverCoins: cached.silverCoins, abilityLevels: levels }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }

        // Generic POST — queue for later
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
