// =============================================================================
// NEON DEFENSE — Audio System
// Procedural synthesis. No audio files.
// =============================================================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// ── State (persisted) ──
let sfxEnabled   = localStorage.getItem('neonDefenseSFX')   !== 'false';
let musicEnabled = localStorage.getItem('neonDefenseMusic') !== 'false';
// Legacy compat
let audioEnabled = sfxEnabled;

// ── Gain buses ──
const masterGain = audioCtx.createGain();
masterGain.gain.value = 1.0;
masterGain.connect(audioCtx.destination);

const sfxBus = audioCtx.createGain();
sfxBus.gain.value = 1.0;
sfxBus.connect(masterGain);

const musicBus = audioCtx.createGain();
musicBus.gain.value = 0.5;
musicBus.connect(masterGain);

// ── Music state ──
let musicNodes = null;
let musicRunning = false;

// ── Helpers ──
function jitter(center, spread = 0.05) {
  return center * (1 + (Math.random() * 2 - 1) * spread);
}

function createNoiseBuffer(duration = 1) {
  const sr = audioCtx.sampleRate;
  const len = Math.ceil(sr * duration);
  const buf = audioCtx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function createNoiseSource(duration, target) {
  const buf = createNoiseBuffer(duration);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const g = audioCtx.createGain();
  src.connect(g);
  g.connect(target);
  return { source: src, gainNode: g };
}

function ensureContext() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// ── Toggles ──
function toggleSFX() {
  sfxEnabled = !sfxEnabled;
  audioEnabled = sfxEnabled;
  localStorage.setItem('neonDefenseSFX', String(sfxEnabled));
  return sfxEnabled;
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  localStorage.setItem('neonDefenseMusic', String(musicEnabled));
  if (musicEnabled) { ensureContext(); startMusic(); }
  else stopMusic();
  return musicEnabled;
}

// Legacy
function toggleAudio() { toggleSFX(); return sfxEnabled; }

// =============================================================================
// MUSIC — Synthwave / Retrowave ambient
// =============================================================================

function startMusic() {
  if (musicRunning || !musicEnabled) return;
  ensureContext();
  musicRunning = true;

  const now = audioCtx.currentTime;

  // ── Pad: C2 + G2 fifth drone with filter movement ──
  const padFreqs = [65.41, 98.0]; // C2, G2
  const padOscs = [];
  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.035;

  const padFilter = audioCtx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 400;
  padFilter.Q.value = 3;

  // Slow filter sweep LFO
  const filterLFO = audioCtx.createOscillator();
  filterLFO.type = 'sine';
  filterLFO.frequency.value = 0.07;
  const filterDepth = audioCtx.createGain();
  filterDepth.gain.value = 250;
  filterLFO.connect(filterDepth);
  filterDepth.connect(padFilter.frequency);
  filterLFO.start(now);

  padFreqs.forEach(f => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    osc.connect(padFilter);
    osc.start(now);
    padOscs.push(osc);

    // Slight detune copy for thickness
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = f * 1.003;
    osc2.connect(padFilter);
    osc2.start(now);
    padOscs.push(osc2);
  });

  padFilter.connect(padGain);
  padGain.connect(musicBus);

  // ── Sub bass: sine at C1 ──
  const subOsc = audioCtx.createOscillator();
  subOsc.type = 'sine';
  subOsc.frequency.value = 32.7;
  const subGain = audioCtx.createGain();
  subGain.gain.value = 0.04;
  subOsc.connect(subGain);
  subGain.connect(musicBus);
  subOsc.start(now);

  // ── Arpeggio: Am pentatonic pattern ──
  // A C D E G — moody retrowave feel
  const arpNotes = [
    220, 261.6, 293.7, 329.6, 392,       // A3 C4 D4 E4 G4
    440, 523.3, 392, 329.6, 293.7,        // A4 C5 G4 E4 D4
    261.6, 220, 196, 220, 261.6, 293.7,   // C4 A3 G3 A3 C4 D4
  ];
  let arpIdx = 0;

  function playArpNote() {
    if (!musicRunning || !musicEnabled) return;
    const freq = arpNotes[arpIdx % arpNotes.length] * jitter(1, 0.003);
    arpIdx++;

    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq * 3;
    filter.Q.value = 1;

    const g = audioCtx.createGain();
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.04, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(filter);
    filter.connect(g);
    g.connect(musicBus);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  const arpInterval = setInterval(playArpNote, 350);

  // ── Hi-hat rhythm: subtle ticking ──
  function playTick() {
    if (!musicRunning || !musicEnabled) return;
    const buf = createNoiseBuffer(0.02);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 8000;
    const g = audioCtx.createGain();
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(0.02, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    src.connect(hp);
    hp.connect(g);
    g.connect(musicBus);
    src.start(t);
    src.stop(t + 0.03);
  }

  const tickInterval = setInterval(playTick, 175);

  musicNodes = { padOscs, subOsc, filterLFO, arpInterval, tickInterval };
}

function stopMusic() {
  if (!musicRunning || !musicNodes) return;
  musicRunning = false;
  if (musicNodes.padOscs) musicNodes.padOscs.forEach(o => { try { o.stop(); } catch(_){} });
  try { musicNodes.subOsc.stop(); } catch(_){}
  try { musicNodes.filterLFO.stop(); } catch(_){}
  if (musicNodes.arpInterval) clearInterval(musicNodes.arpInterval);
  if (musicNodes.tickInterval) clearInterval(musicNodes.tickInterval);
  musicNodes = null;
}

// =============================================================================
// SFX
// =============================================================================

function playHoverSound() {
  if (!sfxEnabled) return; ensureContext();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(sfxBus); o.type = 'sine';
  const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(jitter(800), t);
  o.frequency.exponentialRampToValueAtTime(jitter(1200), t + 0.05);
  g.gain.setValueAtTime(0.07, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.start(t); o.stop(t + 0.1);
}

function playSelectSound() {
  if (!sfxEnabled) return; ensureContext();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(sfxBus); o.type = 'square';
  const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(jitter(400, 0.03), t);
  o.frequency.exponentialRampToValueAtTime(jitter(1600, 0.03), t + 0.15);
  g.gain.setValueAtTime(0.09, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o.start(t); o.stop(t + 0.2);
}

function playBuySound() {
  if (!sfxEnabled) return; ensureContext();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(sfxBus); o.type = 'sine';
  const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(jitter(600, 0.03), t);
  o.frequency.exponentialRampToValueAtTime(jitter(1800, 0.03), t + 0.12);
  g.gain.setValueAtTime(0.11, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  o.start(t); o.stop(t + 0.25);
}

function playDenySound() {
  if (!sfxEnabled) return; ensureContext();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(sfxBus); o.type = 'sawtooth';
  const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(jitter(200, 0.04), t);
  o.frequency.exponentialRampToValueAtTime(jitter(100, 0.04), t + 0.15);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o.start(t); o.stop(t + 0.2);
}

function playShootSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime;

  // Soft sine sweep: 1800Hz → 600Hz over 35ms, low volume
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(sfxBus); o.type = 'sine';
  o.frequency.setValueAtTime(jitter(1800, 0.05), t);
  o.frequency.exponentialRampToValueAtTime(jitter(600, 0.05), t + 0.035);
  g.gain.setValueAtTime(0.04, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  o.start(t); o.stop(t + 0.04);

  // Very soft high-frequency noise layer for texture
  const noiseDur = 0.02;
  const noiseBuf = createNoiseBuffer(noiseDur + 0.01);
  const ns = audioCtx.createBufferSource(); ns.buffer = noiseBuf;
  const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
  const ng = audioCtx.createGain();
  ng.gain.setValueAtTime(0.015, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + noiseDur);
  ns.connect(hp); hp.connect(ng); ng.connect(sfxBus);
  ns.start(t); ns.stop(t + noiseDur + 0.01);
}

function playEnemyHitSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime, dur = 0.08;
  const { source: ns, gainNode: ng } = createNoiseSource(dur + 0.05, sfxBus);
  const f = audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = jitter(400, 0.1);
  ns.disconnect(); ns.connect(f); f.connect(ng);
  ng.gain.setValueAtTime(0.09, t); ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
  ns.start(t); ns.stop(t + dur + 0.01);
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(sfxBus); o.type = 'sine';
  o.frequency.setValueAtTime(jitter(120, 0.1), t);
  o.frequency.exponentialRampToValueAtTime(40, t + dur);
  g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur + 0.01);
}

function playEnemyDeathSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime, dur = 0.2, pm = jitter(1, 0.15);
  const buf = createNoiseBuffer(dur + 0.05);
  const ns = audioCtx.createBufferSource(); ns.buffer = buf; ns.playbackRate.value = pm;
  const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = jitter(800, 0.2); bp.Q.value = 0.8;
  const ng = audioCtx.createGain(); ng.gain.setValueAtTime(0.1, t); ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
  ns.connect(bp); bp.connect(ng); ng.connect(sfxBus); ns.start(t); ns.stop(t + dur + 0.01);
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(sfxBus); o.type = 'sine';
  o.frequency.setValueAtTime(jitter(90, 0.1) * pm, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.15);
  g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o.start(t); o.stop(t + 0.16);
}

function playBossDeathSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime, dur = 0.4;
  const buf = createNoiseBuffer(dur + 0.1); const ns = audioCtx.createBufferSource(); ns.buffer = buf;
  const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
  const ng = audioCtx.createGain(); ng.gain.setValueAtTime(0.12, t); ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
  ns.connect(lp); lp.connect(ng); ng.connect(sfxBus); ns.start(t); ns.stop(t + dur + 0.01);
  const bo = audioCtx.createOscillator(), bg = audioCtx.createGain();
  bo.connect(bg); bg.connect(sfxBus); bo.type = 'sine';
  bo.frequency.setValueAtTime(jitter(60, 0.08), t); bo.frequency.exponentialRampToValueAtTime(20, t + dur);
  bg.gain.setValueAtTime(0.12, t); bg.gain.exponentialRampToValueAtTime(0.001, t + dur);
  bo.start(t); bo.stop(t + dur + 0.01);
  const ho = audioCtx.createOscillator(), hg = audioCtx.createGain();
  ho.connect(hg); hg.connect(sfxBus); ho.type = 'sawtooth';
  ho.frequency.setValueAtTime(jitter(1800, 0.1), t); ho.frequency.exponentialRampToValueAtTime(200, t + dur);
  hg.gain.setValueAtTime(0.07, t); hg.gain.exponentialRampToValueAtTime(0.001, t + dur);
  ho.start(t); ho.stop(t + dur + 0.01);
}

function playEMPSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime, dur = 0.3;
  const { source: ns, gainNode: ng } = createNoiseSource(dur + 0.05, sfxBus);
  const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.setValueAtTime(jitter(3000, 0.1), t); bp.frequency.exponentialRampToValueAtTime(200, t + dur); bp.Q.value = 2;
  ns.disconnect(); ns.connect(bp); bp.connect(ng);
  ng.gain.setValueAtTime(0.1, t); ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
  ns.start(t); ns.stop(t + dur + 0.01);
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(sfxBus); o.type = 'sawtooth';
  o.frequency.setValueAtTime(jitter(2400, 0.1), t);
  o.frequency.setValueAtTime(jitter(800, 0.1), t + 0.05);
  o.frequency.setValueAtTime(jitter(3200, 0.1), t + 0.10);
  o.frequency.exponentialRampToValueAtTime(100, t + dur);
  g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur + 0.01);
}

function playShieldSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime, dur = 0.25, root = jitter(440, 0.04);
  [1, 1.25, 1.5, 2].forEach((r, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(sfxBus); o.type = 'sine';
    o.frequency.setValueAtTime(root * r * 0.5, t);
    o.frequency.exponentialRampToValueAtTime(root * r, t + dur);
    const d = i * 0.03;
    g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.06, t + d + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.05);
    o.start(t); o.stop(t + dur + 0.1);
  });
}

function playFreezeSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime, dur = 0.2, root = jitter(1200, 0.06);
  [0, 7, -5, 12, -3].forEach((c, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(sfxBus); o.type = 'sine';
    o.frequency.value = root * Math.pow(2, c / 1200);
    const d = i * 0.015;
    g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.06, t + d + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.05);
    o.start(t); o.stop(t + dur + 0.1);
  });
}

function playChainSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime;
  for (let i = 0; i < 4; i++) {
    const st = t + i * 0.035, dur = 0.025;
    const buf = createNoiseBuffer(dur + 0.01);
    const s = audioCtx.createBufferSource(); s.buffer = buf;
    const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = jitter(3500, 0.2); bp.Q.value = 3;
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0.09, st); g.gain.exponentialRampToValueAtTime(0.001, st + dur);
    s.connect(bp); bp.connect(g); g.connect(sfxBus); s.start(st); s.stop(st + dur + 0.01);
  }
}

function playOrbitalSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime, dur = 0.5;
  const wo = audioCtx.createOscillator(), wg = audioCtx.createGain();
  wo.connect(wg); wg.connect(sfxBus); wo.type = 'sawtooth';
  wo.frequency.setValueAtTime(jitter(3000, 0.1), t); wo.frequency.exponentialRampToValueAtTime(150, t + 0.2);
  wg.gain.setValueAtTime(0.07, t); wg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  wo.start(t); wo.stop(t + 0.23);
  const it = t + 0.2;
  const buf = createNoiseBuffer(dur - 0.15); const ns = audioCtx.createBufferSource(); ns.buffer = buf;
  const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
  const ng = audioCtx.createGain(); ng.gain.setValueAtTime(0.12, it); ng.gain.exponentialRampToValueAtTime(0.001, it + (dur - 0.2));
  ns.connect(lp); lp.connect(ng); ng.connect(sfxBus); ns.start(it); ns.stop(it + (dur - 0.15) + 0.01);
  const ro = audioCtx.createOscillator(), rg = audioCtx.createGain();
  ro.connect(rg); rg.connect(sfxBus); ro.type = 'sine';
  ro.frequency.setValueAtTime(jitter(50, 0.1), it); ro.frequency.exponentialRampToValueAtTime(20, it + 0.3);
  rg.gain.setValueAtTime(0.12, it); rg.gain.exponentialRampToValueAtTime(0.001, it + 0.35);
  ro.start(it); ro.stop(it + 0.36);
}

function playWaveStartSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime;
  [{f:jitter(880,0.03),s:0,d:0.12},{f:jitter(660,0.03),s:0.15,d:0.12},{f:jitter(880,0.03),s:0.30,d:0.10}]
  .forEach(({f,s,d}) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(sfxBus); o.type = 'square'; o.frequency.value = f;
    const st = t + s;
    g.gain.setValueAtTime(0.08, st); g.gain.setValueAtTime(0.08, st + d - 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, st + d);
    o.start(st); o.stop(st + d + 0.01);
  });
}

function playDeathSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime, dur = 0.6;
  const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain();
  o1.connect(g1); g1.connect(sfxBus); o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(jitter(800, 0.05), t); o1.frequency.exponentialRampToValueAtTime(80, t + dur);
  g1.gain.setValueAtTime(0.1, t); g1.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o1.start(t); o1.stop(t + dur + 0.01);
  [0, 0.1, 0.2, 0.3, 0.45].forEach(off => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(sfxBus); o.type = 'square';
    o.frequency.value = jitter(300 - off * 300, 0.1);
    g.gain.setValueAtTime(0.07, t + off); g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.07);
    o.start(t + off); o.stop(t + off + 0.08);
  });
  const { source: ns, gainNode: ng } = createNoiseSource(dur + 0.05, sfxBus);
  const nf = audioCtx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 300;
  ns.disconnect(); ns.connect(nf); nf.connect(ng);
  ng.gain.setValueAtTime(0.06, t); ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
  ns.start(t); ns.stop(t + dur + 0.01);
}

function playLevelUpSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime, root = jitter(523.25, 0.02);
  [1, 1.2599, 1.4983, 2].forEach((r, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(sfxBus); o.type = 'triangle'; o.frequency.value = root * r;
    const st = t + i * 0.09;
    g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.1, st + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
    o.start(st); o.stop(st + 0.22);
  });
}

function playChestOpenSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime;
  const ro = audioCtx.createOscillator(), rg = audioCtx.createGain();
  ro.type = 'triangle';
  ro.frequency.setValueAtTime(jitter(200, 0.05), t);
  ro.frequency.exponentialRampToValueAtTime(jitter(800, 0.05), t + 0.3);
  rg.gain.setValueAtTime(0.08, t); rg.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  ro.connect(rg); rg.connect(sfxBus); ro.start(t); ro.stop(t + 0.33);
  const bt = t + 0.32;
  [jitter(1047, 0.03), jitter(1319, 0.03), jitter(1568, 0.03)].forEach((f, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(sfxBus); o.type = 'sine'; o.frequency.value = f;
    const st = bt + i * 0.025;
    g.gain.setValueAtTime(0.1, st); g.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
    o.start(st); o.stop(st + 0.22);
  });
}

// =============================================================================
// ROULETTE SFX
// =============================================================================

// Short click/tick — one per segment boundary crossed
function playRouletteTickSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(sfxBus); o.type = 'sine';
  o.frequency.setValueAtTime(2000, t);
  g.gain.setValueAtTime(0.05, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  o.start(t); o.stop(t + 0.016);
}

// Two-tone ascending chime when roulette settles
function playRouletteStopSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime;

  // First tone: 500Hz → 800Hz over 150ms
  const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain();
  o1.connect(g1); g1.connect(sfxBus); o1.type = 'sine';
  o1.frequency.setValueAtTime(500, t);
  o1.frequency.linearRampToValueAtTime(800, t + 0.15);
  g1.gain.setValueAtTime(0.1, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o1.start(t); o1.stop(t + 0.16);

  // Second tone: 800Hz → 1200Hz over 150ms, starts immediately after first
  const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
  o2.connect(g2); g2.connect(sfxBus); o2.type = 'sine';
  o2.frequency.setValueAtTime(800, t + 0.15);
  o2.frequency.linearRampToValueAtTime(1200, t + 0.30);
  g2.gain.setValueAtTime(0.1, t + 0.15);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
  o2.start(t + 0.15); o2.stop(t + 0.31);

  // Subtle shimmer: highpass noise burst at 8000Hz
  const shimmerDur = 0.1;
  const shimBuf = createNoiseBuffer(shimmerDur + 0.01);
  const sn = audioCtx.createBufferSource(); sn.buffer = shimBuf;
  const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8000;
  const sg = audioCtx.createGain();
  sg.gain.setValueAtTime(0.03, t);
  sg.gain.exponentialRampToValueAtTime(0.001, t + shimmerDur);
  sn.connect(hp); hp.connect(sg); sg.connect(sfxBus);
  sn.start(t); sn.stop(t + shimmerDur + 0.01);
}

// Celebratory ascending arpeggio: E5, G5, B5, E6 (triangle wave) + metallic ching
function playRouletteRewardSound() {
  if (!sfxEnabled) return; ensureContext();
  const t = audioCtx.currentTime;

  // E5=659.25, G5=783.99, B5=987.77, E6=1318.51 — triangle wave, 60ms spacing
  const arpFreqs = [659.25, 783.99, 987.77, 1318.51];
  arpFreqs.forEach((freq, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(sfxBus); o.type = 'triangle';
    o.frequency.value = freq;
    const st = t + i * 0.06;
    g.gain.setValueAtTime(0, st);
    g.gain.linearRampToValueAtTime(0.08, st + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.18);
    o.start(st); o.stop(st + 0.19);
  });

  // Metallic "ching" at the end — bandpass noise at 5000Hz, Q=5, 50ms
  const chingStart = t + arpFreqs.length * 0.06;
  const chingDur = 0.05;
  const chingBuf = createNoiseBuffer(chingDur + 0.01);
  const cn = audioCtx.createBufferSource(); cn.buffer = chingBuf;
  const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5000; bp.Q.value = 5;
  const cg = audioCtx.createGain();
  cg.gain.setValueAtTime(0.06, chingStart);
  cg.gain.exponentialRampToValueAtTime(0.001, chingStart + chingDur);
  cn.connect(bp); bp.connect(cg); cg.connect(sfxBus);
  cn.start(chingStart); cn.stop(chingStart + chingDur + 0.01);
}

// ── Auto-start ──
(function() {
  if (musicEnabled) {
    startMusic();
    const unlock = () => { ensureContext(); startMusic(); document.removeEventListener('pointerdown', unlock); document.removeEventListener('keydown', unlock); };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
  }
})();
