// =============================================================================
// NEON DEFENSE — Audio System
// Procedural synthesis only. No audio files required.
// Web Audio API throughout.
// =============================================================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// -----------------------------------------------------------------------------
// Master state
// -----------------------------------------------------------------------------

let audioEnabled = localStorage.getItem('neonDefenseAudio') !== 'false';

// Master gain node — all SFX and music route through here
const masterGain = audioCtx.createGain();
masterGain.gain.value = 1.0;
masterGain.connect(audioCtx.destination);

// Separate gain buses so music and SFX can be balanced independently
const sfxBus = audioCtx.createGain();
sfxBus.gain.value = 1.0;
sfxBus.connect(masterGain);

const musicBus = audioCtx.createGain();
musicBus.gain.value = 1.0;
musicBus.connect(masterGain);

// -----------------------------------------------------------------------------
// Music state
// -----------------------------------------------------------------------------

let musicNodes = null;   // holds references to running music oscillators/nodes
let musicRunning = false;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Tiny random spread so repeated sounds never sound identical.
 * @param {number} center  — base value
 * @param {number} spread  — max ± deviation (as a fraction, e.g. 0.05 = ±5%)
 */
function jitter(center, spread = 0.05) {
  return center * (1 + (Math.random() * 2 - 1) * spread);
}

/**
 * Create a buffer of white noise.
 * @param {number} duration — seconds
 * @returns {AudioBuffer}
 */
function createNoiseBuffer(duration = 1) {
  const sampleRate = audioCtx.sampleRate;
  const frameCount = Math.ceil(sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Create a BufferSourceNode loaded with white noise and connect it to a gain.
 * Returns { source, gainNode } — caller must call source.start() and source.stop().
 * @param {number} duration    — noise buffer length in seconds
 * @param {AudioNode} target   — destination node
 */
function createNoiseSource(duration, target) {
  const buffer = createNoiseBuffer(duration);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gainNode = audioCtx.createGain();
  source.connect(gainNode);
  gainNode.connect(target);
  return { source, gainNode };
}

/**
 * Resume the AudioContext if it was suspended (browser autoplay policy).
 */
function ensureContext() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// -----------------------------------------------------------------------------
// Master toggle
// -----------------------------------------------------------------------------

/**
 * Flip audioEnabled, persist to localStorage, start/stop music accordingly.
 * @returns {boolean} — new state of audioEnabled
 */
function toggleAudio() {
  audioEnabled = !audioEnabled;
  localStorage.setItem('neonDefenseAudio', String(audioEnabled));
  if (audioEnabled) {
    ensureContext();
    startMusic();
  } else {
    stopMusic();
  }
  return audioEnabled;
}

// -----------------------------------------------------------------------------
// Music system
// -----------------------------------------------------------------------------

/**
 * Start the ambient synth background music.
 * Composed of:
 *   1. Low drone pad  — bass oscillator with slow LFO tremolo + filter modulation
 *   2. Arpeggio layer — subtle minor-key note sequence cycling on a setInterval
 */
function startMusic() {
  if (musicRunning || !audioEnabled) return;
  ensureContext();
  musicRunning = true;

  // ---- 1. Drone pad ----
  const droneFreq = 55; // A1 — deep bass root

  const droneOsc = audioCtx.createOscillator();
  droneOsc.type = 'sawtooth';
  droneOsc.frequency.value = droneFreq;

  // Sub-octave sine layer for warmth
  const subOsc = audioCtx.createOscillator();
  subOsc.type = 'sine';
  subOsc.frequency.value = droneFreq / 2;

  // Low-pass filter on the drone
  const droneFilter = audioCtx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 600;
  droneFilter.Q.value = 2;

  // LFO that slowly wobbles the filter cutoff
  const filterLFO = audioCtx.createOscillator();
  filterLFO.type = 'sine';
  filterLFO.frequency.value = 0.15; // very slow sweep
  const filterLFOGain = audioCtx.createGain();
  filterLFOGain.gain.value = 300;
  filterLFO.connect(filterLFOGain);
  filterLFOGain.connect(droneFilter.frequency);

  // Amplitude LFO (tremolo)
  const ampLFO = audioCtx.createOscillator();
  ampLFO.type = 'sine';
  ampLFO.frequency.value = 0.08;
  const ampLFOGain = audioCtx.createGain();
  ampLFOGain.gain.value = 0.008;
  ampLFO.connect(ampLFOGain);

  const droneGain = audioCtx.createGain();
  droneGain.gain.value = 0.04;
  ampLFOGain.connect(droneGain.gain);

  droneOsc.connect(droneFilter);
  subOsc.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(musicBus);

  droneOsc.start();
  subOsc.start();
  filterLFO.start();
  ampLFO.start();

  // ---- 2. Arpeggio layer ----
  // D natural minor scale intervals (semitones from root D3 = 146.83 Hz)
  const rootFreq = 146.83;
  const minorScaleRatios = [1, 1.122, 1.260, 1.335, 1.498, 1.587, 1.782];
  // Build a 8-note arpeggio pattern across two octaves
  const arpPattern = [0, 2, 3, 5, 7, 5, 3, 2].map(
    (degree) => rootFreq * minorScaleRatios[degree % minorScaleRatios.length]
  );
  // Add octave-up variants for upper notes
  const fullArp = [
    ...arpPattern,
    arpPattern[4] * 2,
    arpPattern[2] * 2,
    arpPattern[0] * 2,
    arpPattern[2] * 2,
  ];

  let arpIndex = 0;
  let arpInterval = null;

  function playArpNote() {
    if (!musicRunning || !audioEnabled) return;

    const freq = fullArp[arpIndex % fullArp.length] * jitter(1, 0.005);
    arpIndex++;

    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq * 2;
    filter.Q.value = 3;

    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicBus);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Step through arp every ~420ms — feels spacious and not intrusive
  arpInterval = setInterval(playArpNote, 420);

  // Store refs for cleanup
  musicNodes = {
    droneOsc,
    subOsc,
    filterLFO,
    ampLFO,
    arpInterval,
  };
}

/**
 * Stop all music nodes cleanly.
 */
function stopMusic() {
  if (!musicRunning || !musicNodes) return;
  musicRunning = false;

  try { musicNodes.droneOsc.stop(); } catch (_) {}
  try { musicNodes.subOsc.stop(); } catch (_) {}
  try { musicNodes.filterLFO.stop(); } catch (_) {}
  try { musicNodes.ampLFO.stop(); } catch (_) {}
  if (musicNodes.arpInterval) clearInterval(musicNodes.arpInterval);

  musicNodes = null;
}

// -----------------------------------------------------------------------------
// UI SFX (existing, preserved + improved)
// -----------------------------------------------------------------------------

function playHoverSound() {
  if (!audioEnabled) return;
  ensureContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(sfxBus);

  osc.type = 'sine';
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(jitter(800, 0.04), now);
  osc.frequency.exponentialRampToValueAtTime(jitter(1200, 0.04), now + 0.05);
  gain.gain.setValueAtTime(0.07, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.start(now);
  osc.stop(now + 0.1);
}

function playSelectSound() {
  if (!audioEnabled) return;
  ensureContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(sfxBus);

  osc.type = 'square';
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(jitter(400, 0.03), now);
  osc.frequency.exponentialRampToValueAtTime(jitter(1600, 0.03), now + 0.15);
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.start(now);
  osc.stop(now + 0.2);
}

function playBuySound() {
  if (!audioEnabled) return;
  ensureContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(sfxBus);

  osc.type = 'sine';
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(jitter(600, 0.03), now);
  osc.frequency.exponentialRampToValueAtTime(jitter(1800, 0.03), now + 0.12);
  gain.gain.setValueAtTime(0.11, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.start(now);
  osc.stop(now + 0.25);
}

function playDenySound() {
  if (!audioEnabled) return;
  ensureContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(sfxBus);

  osc.type = 'sawtooth';
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(jitter(200, 0.04), now);
  osc.frequency.exponentialRampToValueAtTime(jitter(100, 0.04), now + 0.15);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.start(now);
  osc.stop(now + 0.2);
}

// -----------------------------------------------------------------------------
// Game SFX — new sounds
// -----------------------------------------------------------------------------

/**
 * Short laser/pew — high freq sine sweeping down, ~50ms.
 */
function playShootSound() {
  if (!audioEnabled) return;
  ensureContext();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(sfxBus);

  osc.type = 'sine';
  const now = audioCtx.currentTime;
  const startFreq = jitter(2800, 0.08);
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(startFreq * 0.25, now + 0.05);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.start(now);
  osc.stop(now + 0.06);
}

/**
 * Impact thud — noise burst mixed with low sine, ~80ms.
 */
function playEnemyHitSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const duration = 0.08;

  // Noise component
  const { source: noiseSrc, gainNode: noiseGain } = createNoiseSource(duration + 0.05, sfxBus);
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = jitter(400, 0.1);
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  // Disconnect the direct connection set up in createNoiseSource and reroute
  noiseSrc.disconnect();
  noiseSrc.connect(noiseFilter);
  noiseGain.gain.setValueAtTime(0.09, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  noiseSrc.start(now);
  noiseSrc.stop(now + duration + 0.01);

  // Low thud sine
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.connect(oscGain);
  oscGain.connect(sfxBus);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(jitter(120, 0.1), now);
  osc.frequency.exponentialRampToValueAtTime(40, now + duration);
  oscGain.gain.setValueAtTime(0.1, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * Explosion — filtered noise burst with slight pitch randomization, ~200ms.
 */
function playEnemyDeathSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const duration = 0.2;
  const pitchMod = jitter(1, 0.15);

  // Noise burst
  const buffer = createNoiseBuffer(duration + 0.05);
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = buffer;
  noiseSrc.playbackRate.value = pitchMod;

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = jitter(800, 0.2);
  bandpass.Q.value = 0.8;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.1, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noiseSrc.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(sfxBus);
  noiseSrc.start(now);
  noiseSrc.stop(now + duration + 0.01);

  // Short low thump
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.connect(oscGain);
  oscGain.connect(sfxBus);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(jitter(90, 0.1) * pitchMod, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
  oscGain.gain.setValueAtTime(0.1, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.start(now);
  osc.stop(now + 0.16);
}

/**
 * Boss explosion — layered noise + sine sweep, ~400ms, more bass.
 */
function playBossDeathSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const duration = 0.4;

  // Heavy noise burst
  const buffer = createNoiseBuffer(duration + 0.1);
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = buffer;
  noiseSrc.playbackRate.value = jitter(1, 0.05);

  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1200;
  lowpass.Q.value = 1;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noiseSrc.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(sfxBus);
  noiseSrc.start(now);
  noiseSrc.stop(now + duration + 0.01);

  // Deep sine punch
  const bassOsc = audioCtx.createOscillator();
  const bassGain = audioCtx.createGain();
  bassOsc.connect(bassGain);
  bassGain.connect(sfxBus);
  bassOsc.type = 'sine';
  bassOsc.frequency.setValueAtTime(jitter(60, 0.08), now);
  bassOsc.frequency.exponentialRampToValueAtTime(20, now + duration);
  bassGain.gain.setValueAtTime(0.12, now);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  bassOsc.start(now);
  bassOsc.stop(now + duration + 0.01);

  // High sweep descending
  const hiOsc = audioCtx.createOscillator();
  const hiGain = audioCtx.createGain();
  hiOsc.connect(hiGain);
  hiGain.connect(sfxBus);
  hiOsc.type = 'sawtooth';
  hiOsc.frequency.setValueAtTime(jitter(1800, 0.1), now);
  hiOsc.frequency.exponentialRampToValueAtTime(200, now + duration);
  hiGain.gain.setValueAtTime(0.07, now);
  hiGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  hiOsc.start(now);
  hiOsc.stop(now + duration + 0.01);
}

/**
 * EMP — electric discharge, noise + rapid frequency sweep, ~300ms.
 */
function playEMPSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const duration = 0.3;

  // Noise base
  const { source: noiseSrc, gainNode: noiseGain } = createNoiseSource(duration + 0.05, sfxBus);
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(jitter(3000, 0.1), now);
  bandpass.frequency.exponentialRampToValueAtTime(200, now + duration);
  bandpass.Q.value = 2;
  noiseSrc.disconnect();
  noiseSrc.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.gain.setValueAtTime(0.1, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  noiseSrc.start(now);
  noiseSrc.stop(now + duration + 0.01);

  // Rapid sweep oscillator
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.connect(oscGain);
  oscGain.connect(sfxBus);
  osc.type = 'sawtooth';
  // Simulate electrical stutter with several quick frequency jumps
  osc.frequency.setValueAtTime(jitter(2400, 0.1), now);
  osc.frequency.setValueAtTime(jitter(800, 0.1),  now + 0.05);
  osc.frequency.setValueAtTime(jitter(3200, 0.1), now + 0.10);
  osc.frequency.setValueAtTime(jitter(400, 0.1),  now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(100,  now + duration);
  oscGain.gain.setValueAtTime(0.08, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * Energy shield activation — ascending sine chord, ~250ms.
 */
function playShieldSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const duration = 0.25;
  // Major chord frequencies relative to root
  const root = jitter(440, 0.04);
  const chordRatios = [1, 1.25, 1.5, 2];

  chordRatios.forEach((ratio, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(sfxBus);
    osc.type = 'sine';
    const startFreq = root * ratio * 0.5;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(root * ratio, now + duration);
    const attackDelay = i * 0.03;
    gain.gain.setValueAtTime(0, now + attackDelay);
    gain.gain.linearRampToValueAtTime(0.06, now + attackDelay + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.05);
    osc.start(now);
    osc.stop(now + duration + 0.1);
  });
}

/**
 * Freeze / crystalline ice — high sine harmonics with slight detune, ~200ms.
 */
function playFreezeSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const duration = 0.2;
  const root = jitter(1200, 0.06);
  // Slightly detuned harmonics give a glassy, icy shimmer
  const detunes = [0, 7, -5, 12, -3];

  detunes.forEach((cents, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(sfxBus);
    osc.type = 'sine';
    osc.frequency.value = root * Math.pow(2, cents / 1200);
    osc.frequency.linearRampToValueAtTime(
      root * Math.pow(2, cents / 1200) * jitter(1.15, 0.02),
      now + duration
    );
    const delay = i * 0.015;
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(0.06, now + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.05);
    osc.start(now);
    osc.stop(now + duration + 0.1);
  });
}

/**
 * Chain lightning / electric arc — rapid noise bursts, ~150ms.
 */
function playChainSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const burstCount = 4;
  const burstInterval = 0.035;

  for (let i = 0; i < burstCount; i++) {
    const t = now + i * burstInterval;
    const burstDur = 0.025;

    const buffer = createNoiseBuffer(burstDur + 0.01);
    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = buffer;

    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = jitter(3500, 0.2);
    bandpass.Q.value = 3;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + burstDur);

    noiseSrc.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(sfxBus);
    noiseSrc.start(t);
    noiseSrc.stop(t + burstDur + 0.01);
  }
}

/**
 * Orbital strike — heavy impact from above, low rumble + high impact, ~500ms.
 */
function playOrbitalSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const duration = 0.5;

  // Descending whine (incoming projectile)
  const whineOsc = audioCtx.createOscillator();
  const whineGain = audioCtx.createGain();
  whineOsc.connect(whineGain);
  whineGain.connect(sfxBus);
  whineOsc.type = 'sawtooth';
  whineOsc.frequency.setValueAtTime(jitter(3000, 0.1), now);
  whineOsc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
  whineGain.gain.setValueAtTime(0.07, now);
  whineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  whineOsc.start(now);
  whineOsc.stop(now + 0.23);

  // Impact noise at t=0.2
  const impactTime = now + 0.2;
  const buffer = createNoiseBuffer(duration - 0.15);
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = buffer;

  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1800;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.12, impactTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, impactTime + (duration - 0.2));
  noiseSrc.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(sfxBus);
  noiseSrc.start(impactTime);
  noiseSrc.stop(impactTime + (duration - 0.15) + 0.01);

  // Sub rumble at impact
  const rumbleOsc = audioCtx.createOscillator();
  const rumbleGain = audioCtx.createGain();
  rumbleOsc.connect(rumbleGain);
  rumbleGain.connect(sfxBus);
  rumbleOsc.type = 'sine';
  rumbleOsc.frequency.setValueAtTime(jitter(50, 0.1), impactTime);
  rumbleOsc.frequency.exponentialRampToValueAtTime(20, impactTime + 0.3);
  rumbleGain.gain.setValueAtTime(0.12, impactTime);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.35);
  rumbleOsc.start(impactTime);
  rumbleOsc.stop(impactTime + 0.36);
}

/**
 * Wave start alarm — two-tone beep pattern, ~400ms.
 */
function playWaveStartSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const tones = [
    { freq: jitter(880, 0.03), start: 0,    dur: 0.12 },
    { freq: jitter(660, 0.03), start: 0.15, dur: 0.12 },
    { freq: jitter(880, 0.03), start: 0.30, dur: 0.10 },
  ];

  tones.forEach(({ freq, start, dur }) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(sfxBus);
    osc.type = 'square';
    osc.frequency.value = freq;
    const t = now + start;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.setValueAtTime(0.08, t + dur - 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  });
}

/**
 * Player death / system failure — descending harsh tones, ~600ms.
 */
function playDeathSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const duration = 0.6;

  // Harsh descending sawtooth
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.connect(gain1);
  gain1.connect(sfxBus);
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(jitter(800, 0.05), now);
  osc1.frequency.exponentialRampToValueAtTime(80, now + duration);
  gain1.gain.setValueAtTime(0.1, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc1.start(now);
  osc1.stop(now + duration + 0.01);

  // Glitchy square wave that cuts in and out
  const glitchTimes = [0, 0.1, 0.2, 0.3, 0.45];
  glitchTimes.forEach((offset) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(sfxBus);
    osc.type = 'square';
    osc.frequency.value = jitter(300 - offset * 300, 0.1);
    const t = now + offset;
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.start(t);
    osc.stop(t + 0.08);
  });

  // Low noise rumble
  const { source: noiseSrc, gainNode: noiseGain } = createNoiseSource(duration + 0.05, sfxBus);
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 300;
  noiseSrc.disconnect();
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.gain.setValueAtTime(0.06, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  noiseSrc.start(now);
  noiseSrc.stop(now + duration + 0.01);
}

/**
 * Level up / achievement — ascending major chord arpeggio, ~400ms.
 */
function playLevelUpSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const root = jitter(523.25, 0.02); // C5
  // Major arpeggio: root, major third, fifth, octave
  const ratios = [1, 1.2599, 1.4983, 2];
  const noteSpacing = 0.09;

  ratios.forEach((ratio, i) => {
    const t = now + i * noteSpacing;
    const freq = root * ratio;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(sfxBus);
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.22);
  });

  // Sparkle noise burst at the end
  const sparkleTime = now + ratios.length * noteSpacing;
  const buffer = createNoiseBuffer(0.1);
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = buffer;
  const hipass = audioCtx.createBiquadFilter();
  hipass.type = 'highpass';
  hipass.frequency.value = 4000;
  const sparkleGain = audioCtx.createGain();
  sparkleGain.gain.setValueAtTime(0.06, sparkleTime);
  sparkleGain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.1);
  noiseSrc.connect(hipass);
  hipass.connect(sparkleGain);
  sparkleGain.connect(sfxBus);
  noiseSrc.start(sparkleTime);
  noiseSrc.stop(sparkleTime + 0.11);
}

/**
 * Chest open / dramatic reveal — suspenseful rising tone + burst, ~500ms.
 */
function playChestOpenSound() {
  if (!audioEnabled) return;
  ensureContext();

  const now = audioCtx.currentTime;
  const duration = 0.5;

  // Suspenseful rising tremolo
  const riseOsc = audioCtx.createOscillator();
  const tremLFO = audioCtx.createOscillator();
  const tremLFOGain = audioCtx.createGain();
  const riseGain = audioCtx.createGain();

  riseOsc.type = 'triangle';
  riseOsc.frequency.setValueAtTime(jitter(200, 0.05), now);
  riseOsc.frequency.exponentialRampToValueAtTime(jitter(800, 0.05), now + 0.3);

  tremLFO.type = 'sine';
  tremLFO.frequency.value = 18; // fast tremolo
  tremLFOGain.gain.value = 0.04;
  tremLFO.connect(tremLFOGain);
  tremLFOGain.connect(riseGain.gain);

  riseGain.gain.setValueAtTime(0.08, now);
  riseGain.gain.setValueAtTime(0.08, now + 0.28);
  riseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  riseOsc.connect(riseGain);
  riseGain.connect(sfxBus);
  riseOsc.start(now);
  riseOsc.stop(now + 0.33);
  tremLFO.start(now);
  tremLFO.stop(now + 0.33);

  // Bright reveal burst at t=0.32
  const burstTime = now + 0.32;
  const burstFreqs = [
    jitter(1047, 0.03),  // C6
    jitter(1319, 0.03),  // E6
    jitter(1568, 0.03),  // G6
  ];
  burstFreqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(sfxBus);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = burstTime + i * 0.025;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.22);
  });
}

// -----------------------------------------------------------------------------
// Auto-start music if audio is enabled when the script loads.
// A user gesture is required by browsers to unlock AudioContext, so music will
// start on the first interaction if it was deferred by the browser.
// -----------------------------------------------------------------------------

(function initAudio() {
  if (audioEnabled) {
    // Attempt to start — will be a no-op if context is still suspended
    startMusic();

    // Fallback: unlock on first user interaction
    const unlock = () => {
      ensureContext();
      startMusic();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
  }
})();
