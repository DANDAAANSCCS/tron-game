// ═══════════════════════════════════════════
//  main.js — Entry point: initGame, gameLoop, startGame, sleep
//  Depends on: all other modules
// ═══════════════════════════════════════════

// ── Init ──
function initGame() {
  turret = new Turret();
  bullets = [];
  enemies = [];
  particles = [];
  floatingTexts = [];
  empWaves = [];
  groundDecals = [];
  frameCount = 0;
  wave = 1;
  score = 0;
  totalKills = 0;
  empCooldown = 0;
  fireTimer = 0;
  deathTimer = 0;
  autoAimTarget = null;
  gold = 0;
  gems = 0;
  rewardPopups = [];
  upgradesPanelOpen = false;
  waveTanksToSpawn = 0;
  waveBossToSpawn = 0;
  waveTanksSpawned = 0;
  waveBossSpawned = 0;
  wavePhantomsToSpawn = 0;
  waveSentinelToSpawn = 0;
  waveOverlordToSpawn = 0;
  wavePhantomsSpawned = 0;
  waveSentinelSpawned = 0;
  waveOverlordSpawned = 0;
  levelStartTime = Date.now();
  gemsbanked = 0;
  for (const key in upgrades) { upgrades[key].level = 0; upgrades[key].tier = 0; }

  camera.x = turret.x - canvas.width / 2;
  camera.y = turret.y - canvas.height / 2;
  camera.shakeX = 0;
  camera.shakeY = 0;

  startWave();
}

// ── Main Game Loop ──
function gameLoop() {
  if (gameState !== 'playing' && gameState !== 'victory') return;
  if (gameState === 'victory') {
    // Keep rendering but no updates, just wait for redirect
    requestAnimationFrame(gameLoop);
    return;
  }
  frameCount++;

  // Auto-save periodico
  autoSaveTimer++;
  if (autoSaveTimer >= AUTOSAVE_INTERVAL) {
    autoSaveTimer = 0;
    doAutoSave();
  }

  // EMP input (solo si esta desbloqueado)
  if (keys.space && empCooldown <= 0 && hasAbility('emp')) {
    triggerEMP();
  }
  if (empCooldown > 0) empCooldown--;

  // Wave delay
  if (wavePaused) {
    waveStartDelay--;
    if (waveStartDelay <= 0) {
      hideOverlay();
      startWave();
    }
  }

  // Update
  turret.update();
  updateWaveSpawning();

  for (const enemy of enemies) enemy.update();
  for (const bullet of bullets) bullet.update();

  checkBulletCollisions();
  updateParticles();
  updateFloatingTexts();
  updateRewardPopups();
  updateEMPWaves();
  updateCamera();

  // Cleanup
  bullets = bullets.filter(b => b.alive);
  enemies = enemies.filter(e => e.alive);

  // Draw
  drawBackground();

  ctx.save();
  ctx.translate(-camera.x - camera.shakeX, -camera.y - camera.shakeY);

  drawGroundDecals(ctx);
  turret.draw(ctx);
  for (const enemy of enemies) enemy.draw(ctx);
  for (const bullet of bullets) bullet.draw(ctx);
  drawParticles(ctx);
  drawFloatingTexts(ctx);
  drawEMPWaves(ctx);

  ctx.restore();

  drawWalls();
  drawVignette();
  drawCrosshair();
  drawRewardPopups();
  drawMinimap();
  drawHUDIcons();
  drawUpgradesPanel();
  updateHUD();

  // Game over: go back to levels after delay
  if (!turret.alive) {
    deathTimer++;
    drawDeathEffect();

    if (deathTimer === 1) {
      saveProgress();
      // Limpiar auto-save al morir (ya se guardo el progreso final)
      fetch('/api/autosave', { method: 'DELETE' }).catch(() => {});
      showOverlay('SYSTEM OFFLINE', `WAVE ${wave} / ${MAX_WAVES} | SCORE: ${score} — RETURNING TO LEVELS...`);
    }

    if (deathTimer >= DEATH_RETURN_DELAY) {
      window.location.href = '/levels.html';
      return;
    }
  }

  requestAnimationFrame(gameLoop);
}

// ── Countdown & Start ──
async function startGame() {
  // Load server data (perm upgrades, gems, abilities) before starting
  await loadServerGameData();
  applyPermBonuses();
  buildAbilityBar();

  initGame();
  gameState = 'countdown';

  for (let i = 3; i >= 1; i--) {
    showOverlay(i.toString(), 'INITIALIZING DEFENSE GRID...');
    await sleep(700);
  }

  showOverlay('DEFEND!', '');
  await sleep(500);
  hideOverlay();

  gameState = 'playing';
  requestAnimationFrame(gameLoop);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

canvas.style.cursor = 'none';

// ── Auto-save al cerrar/salir de la pagina ──
window.addEventListener('beforeunload', () => {
  if (gameState === 'playing' && turret && turret.alive) {
    navigator.sendBeacon('/api/autosave', new Blob([JSON.stringify({
      wave, score, gold, gems, hp: turret.hp, totalKills, level: currentLevel,
    })], { type: 'application/json' }));
  }
});

// ── Start ──
startGame();
