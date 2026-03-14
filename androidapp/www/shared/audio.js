// =============================================================================
// NEON DEFENSE — Audio System
// Procedural synthesis. No audio files.
// When running inside an iframe, all calls proxy to the parent window
// so the AudioContext persists across page navigations.
// =============================================================================

// ── Iframe proxy mode ──
// If running inside an iframe where the parent already has the audio system,
// proxy all audio calls to the parent and skip creating a second AudioContext.
const _isAudioProxy = (window.parent !== window && window.parent._neonAudioReady);

if (_isAudioProxy) {
  [
    'playHoverSound','playSelectSound','playBuySound','playDenySound',
    'playShootSound','playEnemyHitSound','playEnemyDeathSound','playBossDeathSound',
    'playEMPSound','playShieldSound','playFreezeSound','playChainSound','playOrbitalSound',
    'playWaveStartSound','playDeathSound','playLevelUpSound','playChestOpenSound',
    'playRouletteTickSound','playRouletteStopSound','playRouletteRewardSound',
    'startMusic','stopMusic','toggleMusic','toggleSFX','toggleAudio','ensureContext',
    'nextTrack','prevTrack','getTrackName',
  ].forEach(name => {
    window[name] = function() { return window.parent[name]?.apply(window.parent, arguments); };
  });
  Object.defineProperty(window, 'sfxEnabled', { get() { return window.parent.sfxEnabled; }, set(v) { window.parent.sfxEnabled = v; } });
  Object.defineProperty(window, 'musicEnabled', { get() { return window.parent.musicEnabled; }, set(v) { window.parent.musicEnabled = v; } });
  Object.defineProperty(window, 'audioEnabled', { get() { return window.parent.audioEnabled; }, set(v) { window.parent.audioEnabled = v; } });
}

// Mark this window as the real audio host
if (!_isAudioProxy) window._neonAudioReady = true;

const audioCtx = !_isAudioProxy ? new (window.AudioContext || window.webkitAudioContext)() : null;

// If we're a proxy, everything is set up — skip the rest
if (!_isAudioProxy) {

// ── State (persisted) — use var for global scope inside if block ──
var sfxEnabled   = localStorage.getItem('neonDefenseSFX')   !== 'false';
var musicEnabled = localStorage.getItem('neonDefenseMusic') !== 'false';
var audioEnabled = sfxEnabled;

// ── Gain buses ──
var masterGain = audioCtx.createGain();
masterGain.gain.value = 1.0;
masterGain.connect(audioCtx.destination);

var sfxBus = audioCtx.createGain();
sfxBus.gain.value = 1.0;
sfxBus.connect(masterGain);

var musicBus = audioCtx.createGain();
musicBus.gain.value = 0.5;
musicBus.connect(masterGain);

// ── Music state ──
var musicNodes = null;
var musicRunning = false;

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
// MUSIC — Multi-track system with smooth crossfade
// Each track is a unique synth composition. Tracks rotate every 50-80 seconds
// with a 4-second crossfade so transitions feel seamless.
// =============================================================================

var _currentTrack = null;   // { gain, intervals, oscs, id }
var _trackIndex = 0;
var _trackTimer = null;
const TRACK_DURATION = 60000; // ms between track changes
const CROSSFADE_TIME = 4;     // seconds

// ── Track definitions ──
// Each returns { gain, intervals, oscs } connected to a given destination

function _createTrack1(dest) {
  // "Neon Drift" — Am pentatonic arpeggio + warm saw pad
  const g = audioCtx.createGain(); g.gain.value = 0; g.connect(dest);
  const now = audioCtx.currentTime;
  const oscs = [], intervals = [];

  // Pad: A2 + E3
  const padFilter = audioCtx.createBiquadFilter();
  padFilter.type = 'lowpass'; padFilter.frequency.value = 500; padFilter.Q.value = 2;
  const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.06;
  const lfoG = audioCtx.createGain(); lfoG.gain.value = 200;
  lfo.connect(lfoG); lfoG.connect(padFilter.frequency); lfo.start(now); oscs.push(lfo);
  [110, 164.8].forEach(f => {
    const o = audioCtx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const o2 = audioCtx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 1.004;
    o.connect(padFilter); o2.connect(padFilter); o.start(now); o2.start(now);
    oscs.push(o, o2);
  });
  const pg = audioCtx.createGain(); pg.gain.value = 0.03;
  padFilter.connect(pg); pg.connect(g);

  // Arp: A C D E G
  const arpNotes = [220,261.6,293.7,329.6,392,440,523.3,392,329.6,293.7,261.6,220];
  let ai = 0;
  intervals.push(setInterval(() => {
    if (!musicRunning) return;
    const o = audioCtx.createOscillator(); o.type = 'triangle';
    o.frequency.value = arpNotes[ai++ % arpNotes.length] * jitter(1, 0.003);
    const ng = audioCtx.createGain(); const t = audioCtx.currentTime;
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.04, t + 0.03);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(ng); ng.connect(g); o.start(t); o.stop(t + 0.55);
  }, 340));

  // Sub
  const sub = audioCtx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 55;
  const sg = audioCtx.createGain(); sg.gain.value = 0.035;
  sub.connect(sg); sg.connect(g); sub.start(now); oscs.push(sub);

  return { gain: g, intervals, oscs, id: 1 };
}

function _createTrack2(dest) {
  // "Digital Rain" — Dm7 ethereal pad + slow descending melody
  const g = audioCtx.createGain(); g.gain.value = 0; g.connect(dest);
  const now = audioCtx.currentTime;
  const oscs = [], intervals = [];

  // Pad: D3 + A3 + C4 (Dm7 voicing)
  const padFilter = audioCtx.createBiquadFilter();
  padFilter.type = 'lowpass'; padFilter.frequency.value = 350; padFilter.Q.value = 1.5;
  const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.04;
  const lfoG = audioCtx.createGain(); lfoG.gain.value = 150;
  lfo.connect(lfoG); lfoG.connect(padFilter.frequency); lfo.start(now); oscs.push(lfo);
  [146.8, 220, 261.6].forEach(f => {
    const o = audioCtx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const o2 = audioCtx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 0.997;
    o.connect(padFilter); o2.connect(padFilter); o.start(now); o2.start(now);
    oscs.push(o, o2);
  });
  const pg = audioCtx.createGain(); pg.gain.value = 0.025;
  padFilter.connect(pg); pg.connect(g);

  // Melody: slow descending Dm notes
  const melNotes = [587.3,523.3,440,392,349.2,293.7,261.6,293.7,349.2,392];
  let mi = 0;
  intervals.push(setInterval(() => {
    if (!musicRunning) return;
    const o = audioCtx.createOscillator(); o.type = 'sine';
    o.frequency.value = melNotes[mi++ % melNotes.length] * jitter(1, 0.002);
    const ng = audioCtx.createGain(); const t = audioCtx.currentTime;
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.035, t + 0.08);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    o.connect(ng); ng.connect(g); o.start(t); o.stop(t + 1);
  }, 700));

  // Sub pulse
  const sub = audioCtx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 73.4;
  const sg = audioCtx.createGain(); sg.gain.value = 0.04;
  sub.connect(sg); sg.connect(g); sub.start(now); oscs.push(sub);

  return { gain: g, intervals, oscs, id: 2 };
}

function _createTrack3(dest) {
  // "Grid Runner" — Em driving bass + fast arp + hi-hat
  const g = audioCtx.createGain(); g.gain.value = 0; g.connect(dest);
  const now = audioCtx.currentTime;
  const oscs = [], intervals = [];

  // Bass pulse: E2 octave pump
  const bassOsc = audioCtx.createOscillator(); bassOsc.type = 'square'; bassOsc.frequency.value = 82.4;
  const bassFilter = audioCtx.createBiquadFilter(); bassFilter.type = 'lowpass'; bassFilter.frequency.value = 300;
  const bassG = audioCtx.createGain(); bassG.gain.value = 0.04;
  bassOsc.connect(bassFilter); bassFilter.connect(bassG); bassG.connect(g);
  bassOsc.start(now); oscs.push(bassOsc);

  // Pulsing LFO on bass gain
  const bassLFO = audioCtx.createOscillator(); bassLFO.type = 'square'; bassLFO.frequency.value = 2.5;
  const bassLFOG = audioCtx.createGain(); bassLFOG.gain.value = 0.02;
  bassLFO.connect(bassLFOG); bassLFOG.connect(bassG.gain); bassLFO.start(now); oscs.push(bassLFO);

  // Fast arp: E minor pentatonic
  const arpNotes = [329.6,392,440,523.3,587.3,659.3,587.3,523.3,440,392];
  let ai = 0;
  intervals.push(setInterval(() => {
    if (!musicRunning) return;
    const o = audioCtx.createOscillator(); o.type = 'triangle';
    o.frequency.value = arpNotes[ai++ % arpNotes.length] * jitter(1, 0.004);
    const f = audioCtx.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.value = o.frequency.value * 2; f.Q.value = 1.5;
    const ng = audioCtx.createGain(); const t = audioCtx.currentTime;
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.035, t + 0.02);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(f); f.connect(ng); ng.connect(g); o.start(t); o.stop(t + 0.3);
  }, 200));

  // Hi-hat
  intervals.push(setInterval(() => {
    if (!musicRunning) return;
    const buf = createNoiseBuffer(0.015);
    const s = audioCtx.createBufferSource(); s.buffer = buf;
    const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 9000;
    const ng = audioCtx.createGain(); const t = audioCtx.currentTime;
    ng.gain.setValueAtTime(0.018, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    s.connect(hp); hp.connect(ng); ng.connect(g); s.start(t); s.stop(t + 0.02);
  }, 150));

  return { gain: g, intervals, oscs, id: 3 };
}

function _createTrack4(dest) {
  // "Cyber Void" — Cm spacey pad + slow bell melody + deep sub
  const g = audioCtx.createGain(); g.gain.value = 0; g.connect(dest);
  const now = audioCtx.currentTime;
  const oscs = [], intervals = [];

  // Pad: Cm (C + Eb + G)
  const padFilter = audioCtx.createBiquadFilter();
  padFilter.type = 'lowpass'; padFilter.frequency.value = 280; padFilter.Q.value = 1;
  const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.03;
  const lfoG = audioCtx.createGain(); lfoG.gain.value = 100;
  lfo.connect(lfoG); lfoG.connect(padFilter.frequency); lfo.start(now); oscs.push(lfo);
  [130.8, 155.6, 196].forEach(f => {
    const o = audioCtx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const o2 = audioCtx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 1.005;
    o.connect(padFilter); o2.connect(padFilter); o.start(now); o2.start(now);
    oscs.push(o, o2);
  });
  const pg = audioCtx.createGain(); pg.gain.value = 0.022;
  padFilter.connect(pg); pg.connect(g);

  // Bell melody: Cm pentatonic
  const bellNotes = [523.3,622.3,784,932.3,784,622.3,523.3,392,523.3,622.3];
  let bi = 0;
  intervals.push(setInterval(() => {
    if (!musicRunning) return;
    const freq = bellNotes[bi++ % bellNotes.length] * jitter(1, 0.002);
    // Bell = sine + sine at 2x freq (slightly detuned)
    [1, 2.01, 3.98].forEach((ratio, i) => {
      const o = audioCtx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * ratio;
      const ng = audioCtx.createGain(); const t = audioCtx.currentTime;
      const vol = 0.025 / (i + 1);
      ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(vol, t + 0.01);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      o.connect(ng); ng.connect(g); o.start(t); o.stop(t + 1.3);
    });
  }, 900));

  // Deep sub
  const sub = audioCtx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 32.7;
  const sg = audioCtx.createGain(); sg.gain.value = 0.04;
  sub.connect(sg); sg.connect(g); sub.start(now); oscs.push(sub);

  return { gain: g, intervals, oscs, id: 4 };
}

function _createTrack5(dest) {
  // "Horizon" — F major7 warm pad + gentle ascending arp
  const g = audioCtx.createGain(); g.gain.value = 0; g.connect(dest);
  const now = audioCtx.currentTime;
  const oscs = [], intervals = [];

  // Pad: Fmaj7 (F + A + C + E)
  const padFilter = audioCtx.createBiquadFilter();
  padFilter.type = 'lowpass'; padFilter.frequency.value = 450; padFilter.Q.value = 1.2;
  const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.05;
  const lfoG = audioCtx.createGain(); lfoG.gain.value = 180;
  lfo.connect(lfoG); lfoG.connect(padFilter.frequency); lfo.start(now); oscs.push(lfo);
  [87.3, 110, 130.8, 164.8].forEach(f => {
    const o = audioCtx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const o2 = audioCtx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 1.003;
    o.connect(padFilter); o2.connect(padFilter); o.start(now); o2.start(now);
    oscs.push(o, o2);
  });
  const pg = audioCtx.createGain(); pg.gain.value = 0.028;
  padFilter.connect(pg); pg.connect(g);

  // Gentle arp: F A C E ascending
  const arpNotes = [349.2,440,523.3,659.3,698.5,523.3,440,349.2,329.6,349.2];
  let ai = 0;
  intervals.push(setInterval(() => {
    if (!musicRunning) return;
    const o = audioCtx.createOscillator(); o.type = 'sine';
    o.frequency.value = arpNotes[ai++ % arpNotes.length] * jitter(1, 0.002);
    const ng = audioCtx.createGain(); const t = audioCtx.currentTime;
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.03, t + 0.05);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(ng); ng.connect(g); o.start(t); o.stop(t + 0.75);
  }, 500));

  // Sub
  const sub = audioCtx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 43.65;
  const sg = audioCtx.createGain(); sg.gain.value = 0.035;
  sub.connect(sg); sg.connect(g); sub.start(now); oscs.push(sub);

  return { gain: g, intervals, oscs, id: 5 };
}

var _trackCreators = [_createTrack1, _createTrack2, _createTrack3, _createTrack4, _createTrack5];
var _trackNames = ['NEON DRIFT', 'DIGITAL RAIN', 'GRID RUNNER', 'CYBER VOID', 'HORIZON'];

function getTrackName() {
  return _trackNames[_trackIndex] || 'TRACK ' + (_trackIndex + 1);
}

function nextTrack() {
  if (!musicRunning) return;
  _trackIndex = (_trackIndex + 1) % _trackCreators.length;
  _crossfadeTo(_trackIndex);
}

function prevTrack() {
  if (!musicRunning) return;
  _trackIndex = (_trackIndex - 1 + _trackCreators.length) % _trackCreators.length;
  _crossfadeTo(_trackIndex);
}

function _crossfadeTo(idx) {
  const now = audioCtx.currentTime;
  const newTrack = _trackCreators[idx](musicBus);
  newTrack.gain.gain.setValueAtTime(0, now);
  newTrack.gain.gain.linearRampToValueAtTime(1, now + CROSSFADE_TIME);
  const oldTrack = _currentTrack;
  if (oldTrack) {
    oldTrack.gain.gain.setValueAtTime(oldTrack.gain.gain.value, now);
    oldTrack.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_TIME);
    setTimeout(() => _killTrack(oldTrack), CROSSFADE_TIME * 1000 + 500);
  }
  _currentTrack = newTrack;
  // Reset auto-rotation timer
  if (_trackTimer) clearInterval(_trackTimer);
  _trackTimer = setInterval(() => {
    if (musicRunning && musicEnabled) _crossfadeToNext();
  }, TRACK_DURATION + Math.random() * 20000);
}

function _killTrack(track) {
  if (!track) return;
  track.intervals.forEach(id => clearInterval(id));
  track.oscs.forEach(o => { try { o.stop(); } catch(_){} });
  try { track.gain.disconnect(); } catch(_){}
}

function _crossfadeToNext() {
  if (!musicRunning || !musicEnabled) return;
  const now = audioCtx.currentTime;

  // Pick next track (avoid repeating)
  let nextIdx;
  do { nextIdx = Math.floor(Math.random() * _trackCreators.length); }
  while (_trackCreators.length > 1 && _currentTrack && _trackCreators[nextIdx] === _trackCreators[_trackIndex]);
  _trackIndex = nextIdx;

  const newTrack = _trackCreators[_trackIndex](musicBus);

  // Fade in new track
  newTrack.gain.gain.setValueAtTime(0, now);
  newTrack.gain.gain.linearRampToValueAtTime(1, now + CROSSFADE_TIME);

  // Fade out old track
  const oldTrack = _currentTrack;
  if (oldTrack) {
    oldTrack.gain.gain.setValueAtTime(oldTrack.gain.gain.value, now);
    oldTrack.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_TIME);
    setTimeout(() => _killTrack(oldTrack), CROSSFADE_TIME * 1000 + 500);
  }

  _currentTrack = newTrack;
}

function startMusic() {
  if (musicRunning || !musicEnabled) return;
  ensureContext();
  musicRunning = true;

  // Start first track immediately
  _trackIndex = Math.floor(Math.random() * _trackCreators.length);
  _currentTrack = _trackCreators[_trackIndex](musicBus);
  _currentTrack.gain.gain.setValueAtTime(0, audioCtx.currentTime);
  _currentTrack.gain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 2);

  // Schedule track rotation
  _trackTimer = setInterval(() => {
    if (musicRunning && musicEnabled) _crossfadeToNext();
  }, TRACK_DURATION + Math.random() * 20000); // 60-80 seconds
}

function stopMusic() {
  if (!musicRunning) return;
  musicRunning = false;
  if (_trackTimer) { clearInterval(_trackTimer); _trackTimer = null; }
  if (_currentTrack) {
    // Fade out over 1 second
    const now = audioCtx.currentTime;
    _currentTrack.gain.gain.setValueAtTime(_currentTrack.gain.gain.value, now);
    _currentTrack.gain.gain.linearRampToValueAtTime(0, now + 1);
    const old = _currentTrack;
    _currentTrack = null;
    setTimeout(() => _killTrack(old), 1500);
  }
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

// ── Auto-start music + unlock AudioContext ──
(function() {
  function tryStart() {
    ensureContext();
    if (musicEnabled && !musicRunning) startMusic();
  }
  // Try immediately
  tryStart();
  // Fallback: unlock on first user interaction (browser autoplay policy)
  const unlock = () => {
    tryStart();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
})();

} // end if (!_isAudioProxy)
