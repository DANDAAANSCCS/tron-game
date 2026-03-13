// ═══════════════════════════════════════════
//  config.js — All constants, configuration, and global state variables
//  NEON DEFENSE — Tower Defense with Tron Style
// ═══════════════════════════════════════════

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

// ── Config ──
const MAP_W = 4000;
const MAP_H = 4000;
const CENTER_X = MAP_W / 2;
const CENTER_Y = MAP_H / 2;
const TURRET_RADIUS = 22;
const TURRET_RANGE = 500;
const BULLET_SPEED = 14;
const BULLET_DAMAGE = 25;
const FIRE_RATE_MANUAL = 8;
const FIRE_RATE_AUTO = Math.round(FIRE_RATE_MANUAL * 1.4); // 40% slower
const EMP_COOLDOWN = 600;
const EMP_RADIUS = 350;
const EMP_DAMAGE = 60;
const PLAYER_MAX_HP = 100;

// ── Level config ──
const urlParams = new URLSearchParams(window.location.search);
const currentLevel = parseInt(urlParams.get('level')) || 1;
const MAX_WAVES = 100;
const TANK_START_WAVE = 50;
const BOSS_WAVE = 100;
const STORAGE_KEY = 'neonDefenseProgress';
let levelStartTime = Date.now();

// ═══════════════════════════════════════════
//  ENEMY TYPES
//  Enemigo 1: Runner   (nivel 1: wave 1+)
//  Enemigo 2: Tank     (nivel 1: wave 50+ / nivel 2: wave 1+)
//  Enemigo 3: Boss     (nivel 1: wave 100)
//  Enemigo 4: Phantom  (nivel 2: wave 71+)
//  Enemigo 5: Sentinel (nivel 2: mini-boss wave 70)
//  Enemigo 6: Overlord (nivel 2: boss wave 100)
// ═══════════════════════════════════════════

// ── Enemigo 1: Runner ──
const ENEMY_BASE_HP = 50;
const ENEMY_BASE_SPEED = 1.2;
const ENEMY_RADIUS = 12;
const ENEMY_DAMAGE = 10;
const ENEMY_ATTACK_RANGE = 40;

// ── Enemigo 2: Tank ──
const TANK_BASE_HP = 300;
const TANK_BASE_SPEED = 0.6;
const TANK_RADIUS = 20;
const TANK_DAMAGE = 20;

// ── Enemigo 3: Boss ──
const BOSS_BASE_HP = 5000;
const BOSS_BASE_SPEED = 0.4;
const BOSS_RADIUS = 40;
const BOSS_DAMAGE = 35;

// ── Enemigo 4: Phantom (nivel 2, wave 71+) ──
const PHANTOM_BASE_HP = 150;
const PHANTOM_BASE_SPEED = 1.0;
const PHANTOM_RADIUS = 14;
const PHANTOM_DAMAGE = 15;

// ── Enemigo 5: Sentinel (mini-boss nivel 2, wave 70) ──
const SENTINEL_BASE_HP = 3000;
const SENTINEL_BASE_SPEED = 0.5;
const SENTINEL_RADIUS = 32;
const SENTINEL_DAMAGE = 25;

// ── Enemigo 6: Overlord (boss nivel 2, wave 100) ──
const OVERLORD_BASE_HP = 8000;
const OVERLORD_BASE_SPEED = 0.35;
const OVERLORD_RADIUS = 45;
const OVERLORD_DAMAGE = 40;

// ── Colors ──
const COL = {
  cyan: '#00fff2',
  orange: '#ff6600',
  red: '#ff0055',
  green: '#00ff66',
  yellow: '#ffdd00',
  purple: '#aa00ff',
  white: '#ffffff',
  blue: '#0088ff',
  teal: '#00ffaa',
};

// ── State ──
let gameState = 'starting';
let frameCount = 0;
let wave = 1;
let score = 0;
let totalKills = 0;

let turret = null;
let bullets = [];
let enemies = [];
let particles = [];
let floatingTexts = [];
let empWaves = [];
let groundDecals = [];

let camera = { x: 0, y: 0, shakeX: 0, shakeY: 0 };
let mouse = { x: 0, y: 0, worldX: CENTER_X, worldY: CENTER_Y };
let mouseDown = false;
let keys = {};

let fireTimer = 0;
let empCooldown = 0;
let autoAimTarget = null;

// ── Currency ──
let gold = 0;
let gems = 0;
let rewardPopups = [];
const BASE_BULLET_SPREAD = 0.32;

// ── Upgrades ──
const PIPS_PER_TIER = 10;
let upgrades = {
  damage:    { level: 0, tier: 0, basePerLevel: 0.10, label: 'DAMAGE',      icon: '⚔', descBase: 'DMG',      color: '#ff4444',  baseCost: 5 },
  fireRate:  { level: 0, tier: 0, basePerLevel: 0.04, label: 'FIRE RATE',   icon: '⚡', descBase: 'SPEED',    color: '#ffdd00',  baseCost: 5 },
  precision: { level: 0, tier: 0, basePerLevel: 0.10, label: 'PRECISION',   icon: '◎', descBase: 'SPREAD',   color: '#00fff2',  baseCost: 5 },
  doubleBul: { level: 0, tier: 0, basePerLevel: 0.04, label: 'DOUBLE SHOT', icon: '⟐', descBase: 'CHANCE',  color: '#e040fb',  baseCost: 5, max: 0.65 },
  health:    { level: 0, tier: 0, basePerLevel: 0.10, label: 'HEALTH',      icon: '♥', descBase: 'HP',       color: '#00ff66',  baseCost: 5 },
};
const UPGRADE_COST_SCALE = 1.20;
let upgradesPanelOpen = false;

// Wave management
let waveEnemiesTotal = 0;
let waveEnemiesSpawned = 0;
let waveEnemiesKilled = 0;
let spawnTimer = 0;
let spawnInterval = 60;
let wavePaused = false;
let waveStartDelay = 0;
let waveTanksToSpawn = 0;
let waveBossToSpawn = 0;
let waveTanksSpawned = 0;
let waveBossSpawned = 0;
let wavePhantomsToSpawn = 0;
let waveSentinelToSpawn = 0;
let waveOverlordToSpawn = 0;
let wavePhantomsSpawned = 0;
let waveSentinelSpawned = 0;
let waveOverlordSpawned = 0;

// Death state
let deathTimer = 0;
const DEATH_RETURN_DELAY = 180; // 3 seconds then go to menu

// ── Server data (loaded async before game starts) ──
let serverGameData = { gems: 0, permUpgrades: {}, levelProgress: {}, unlockedAbilities: [], equippedAbilities: [] };

// ── Permanent upgrades (set after loading from server) ──
const permBonus = { health: 0, damage: 0, regen: 0, precision: 0, fireRate: 0 };

// ── Auto-save periodico (cada 30 segundos) ──
let autoSaveTimer = 0;
const AUTOSAVE_INTERVAL = 30 * 60; // 30 seg * 60 fps

let gemsbanked = 0;
