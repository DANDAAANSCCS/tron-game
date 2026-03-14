// ═══════════════════════════════════════════
//  waves.js — Wave system: startWave, spawnEnemy, updateWaveSpawning
//  Depends on: config.js, particles.js, rendering.js (showOverlay), server-data.js (saveProgress)
// ═══════════════════════════════════════════

// ── Wave System ──
function startWave() {
  waveTanksSpawned = 0;
  waveBossSpawned = 0;
  wavePhantomsSpawned = 0;
  waveSentinelSpawned = 0;
  waveOverlordSpawned = 0;

  if (currentLevel === 2) {
    // ── Level 2 wave composition ──
    if (wave <= 20) {
      // Waves 1-20: Runner + Tank (tank less frequent)
      waveEnemiesTotal = 5 + wave * 3;
      waveTanksToSpawn = Math.max(0, Math.floor(wave / 4));
      waveBossToSpawn = 0;
      wavePhantomsToSpawn = 0;
      waveSentinelToSpawn = 0;
      waveOverlordToSpawn = 0;
    } else if (wave <= 69) {
      // Waves 21-69: Only tanks
      waveEnemiesTotal = 4 + wave * 2;
      waveTanksToSpawn = waveEnemiesTotal;
      waveBossToSpawn = 0;
      wavePhantomsToSpawn = 0;
      waveSentinelToSpawn = 0;
      waveOverlordToSpawn = 0;
    } else if (wave === 70) {
      // Wave 70: Mini-boss (Sentinel) + tanks
      waveEnemiesTotal = 4 + wave * 2;
      waveTanksToSpawn = waveEnemiesTotal;
      waveSentinelToSpawn = 1;
      waveBossToSpawn = 0;
      wavePhantomsToSpawn = 0;
      waveOverlordToSpawn = 0;
      waveEnemiesTotal += waveSentinelToSpawn;
    } else if (wave <= 99) {
      // Waves 71-99: Tanks + Phantoms (gradually more)
      waveEnemiesTotal = 4 + wave * 2;
      wavePhantomsToSpawn = Math.min(Math.floor((wave - 70) / 2) + 1, 15);
      waveTanksToSpawn = waveEnemiesTotal - wavePhantomsToSpawn;
      waveBossToSpawn = 0;
      waveSentinelToSpawn = 0;
      waveOverlordToSpawn = 0;
    } else {
      // Wave 100: Overlord boss + tanks + phantoms
      waveEnemiesTotal = 4 + wave * 2;
      wavePhantomsToSpawn = 10;
      waveTanksToSpawn = waveEnemiesTotal - wavePhantomsToSpawn;
      waveOverlordToSpawn = 1;
      waveBossToSpawn = 0;
      waveSentinelToSpawn = 0;
      waveEnemiesTotal += waveOverlordToSpawn;
    }
  } else {
    // ── Level 1 (original) ──
    waveEnemiesTotal = 5 + wave * 3;
    waveTanksToSpawn = (wave >= TANK_START_WAVE) ? 1 + Math.floor(Math.random() * 2) : 0;
    waveBossToSpawn = (wave === BOSS_WAVE) ? 1 : 0;
    wavePhantomsToSpawn = 0;
    waveSentinelToSpawn = 0;
    waveOverlordToSpawn = 0;
    waveEnemiesTotal += waveTanksToSpawn + waveBossToSpawn;
  }

  waveEnemiesSpawned = 0;
  waveEnemiesKilled = 0;
  spawnInterval = Math.max(15, 60 - wave * 3);
  spawnTimer = 0;
  wavePaused = false;
}

function spawnEnemy(type = 'runner') {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 50;

  switch (side) {
    case 0: x = margin; y = margin + Math.random() * (MAP_H - margin * 2); break;
    case 1: x = MAP_W - margin; y = margin + Math.random() * (MAP_H - margin * 2); break;
    case 2: x = margin + Math.random() * (MAP_W - margin * 2); y = margin; break;
    case 3: x = margin + Math.random() * (MAP_W - margin * 2); y = MAP_H - margin; break;
  }

  // Stats base segun tipo de enemigo
  let baseHp, baseSpeed;
  if (type === 'overlord') {       // Enemigo 6
    baseHp = OVERLORD_BASE_HP;
    baseSpeed = OVERLORD_BASE_SPEED;
  } else if (type === 'sentinel') { // Enemigo 5
    baseHp = SENTINEL_BASE_HP;
    baseSpeed = SENTINEL_BASE_SPEED;
  } else if (type === 'phantom') {  // Enemigo 4
    baseHp = PHANTOM_BASE_HP;
    baseSpeed = PHANTOM_BASE_SPEED;
  } else if (type === 'boss') {     // Enemigo 3
    baseHp = BOSS_BASE_HP;
    baseSpeed = BOSS_BASE_SPEED;
  } else if (type === 'tank') {     // Enemigo 2
    baseHp = TANK_BASE_HP;
    baseSpeed = TANK_BASE_SPEED;
  } else {                          // Enemigo 1
    baseHp = ENEMY_BASE_HP;
    baseSpeed = ENEMY_BASE_SPEED;
  }

  const hpMult = (type === 'boss' || type === 'overlord' || type === 'sentinel') ? 0.1 : 0.3;
  const hpScale = 1 + (wave - 1) * hpMult;
  const speedScale = 1 + (wave - 1) * 0.08;

  enemies.push(new Enemy(x, y,
    Math.round(baseHp * hpScale),
    baseSpeed * speedScale,
    type
  ));
  waveEnemiesSpawned++;

  // Spawn flash at location
  const flashCol = type === 'overlord' ? COL.blue : type === 'sentinel' ? COL.teal : type === 'phantom' ? COL.blue : type === 'boss' ? COL.purple : type === 'tank' ? COL.red : COL.orange;
  spawnParticle(x, y, 0, 0, flashCol, 15, 10);
}

function updateWaveSpawning() {
  if (wavePaused) return;

  if (waveEnemiesSpawned < waveEnemiesTotal) {
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;

      // Spawn por prioridad: Boss/Overlord > Sentinel > Tank > Phantom > Runner
      if (waveOverlordSpawned < waveOverlordToSpawn && waveEnemiesSpawned >= Math.floor(waveEnemiesTotal / 2)) {
        spawnEnemy('overlord');    // Enemigo 6
        waveOverlordSpawned++;
        spawnRewardPopup('WARNING: OVERLORD INCOMING', '#0055ff');
      } else if (waveBossSpawned < waveBossToSpawn && waveEnemiesSpawned >= Math.floor(waveEnemiesTotal / 2)) {
        spawnEnemy('boss');        // Enemigo 3
        waveBossSpawned++;
        spawnRewardPopup('WARNING: BOSS INCOMING', '#aa00ff');
      } else if (waveSentinelSpawned < waveSentinelToSpawn && waveEnemiesSpawned >= Math.floor(waveEnemiesTotal / 3)) {
        spawnEnemy('sentinel');    // Enemigo 5
        waveSentinelSpawned++;
        spawnRewardPopup('WARNING: SENTINEL DETECTED', '#00ffaa');
      } else if (waveTanksSpawned < waveTanksToSpawn) {
        spawnEnemy('tank');        // Enemigo 2
        waveTanksSpawned++;
      } else if (wavePhantomsSpawned < wavePhantomsToSpawn) {
        spawnEnemy('phantom');     // Enemigo 4
        wavePhantomsSpawned++;
      } else {
        spawnEnemy('runner');      // Enemigo 1
      }
    }
  }

  if (waveEnemiesKilled >= waveEnemiesTotal) {
    wavePaused = true;

    // Rewards for completing current wave
    const completedWave = wave;
    let goldReward = 5;
    let gemReward = 0;

    // Bonus every 5 waves: 15 gold
    if (completedWave % 5 === 0) {
      goldReward = 15;
    }

    // Bonus every 10 waves: +15 gold extra
    if (completedWave % 10 === 0) {
      goldReward += 15;
    }

    // x2 gold cada 5 y 10 rondas
    if (completedWave % 5 === 0) {
      goldReward *= 2;
    }

    let rewardMsg = `+${goldReward} gold`;

    // Gem every 5 waves
    if (completedWave % 5 === 0) {
      gemReward = 1;
    }

    // Bonus gems every 10 waves
    if (completedWave % 10 === 0) {
      gemReward += 5;
    }

    gold += goldReward;
    gems += gemReward;
    score += (completedWave + 1) * 50;

    // Show reward popup
    spawnRewardPopup(rewardMsg, '#ffd700');
    if (gemReward > 0) {
      spawnRewardPopup(`+${gemReward} GEM${gemReward > 1 ? 'S' : ''}`, '#e040fb');
    }

    // Save progress after every wave
    saveProgress();

    // Check win condition
    if (wave >= MAX_WAVES) {
      gems += 25;
      gameState = 'victory';
      if (typeof stopMusic === 'function') stopMusic();
      if (typeof playLevelUpSound === 'function') playLevelUpSound();
      saveProgress(true);
      fetch('/api/autosave', { method: 'DELETE' }).catch(() => {});
      showOverlay('VICTORY!', `LEVEL ${currentLevel} COMPLETE — SCORE: ${score}`);
      spawnRewardPopup('LEVEL COMPLETE!', '#00ff66');
      spawnRewardPopup('+25 GEMS', '#e040fb');
      // Hide touch controls
      const upgBtn = document.getElementById('touch-upgrades-btn');
      if (upgBtn) upgBtn.style.display = 'none';
      // Start roulette after 3 seconds
      setTimeout(() => {
        hideOverlay();
        startRoulette(score, (coins) => {
          saveSilverCoins(coins);
          setTimeout(() => {
            window.location.href = '/levels.html';
          }, 500);
        });
        // Render loop for roulette during victory
        function victoryRouletteLoop() {
          if (!_rouletteActive) return;
          updateRoulette();
          // Redraw scene + roulette on top
          drawBackground();
          ctx.save();
          ctx.translate(-camera.x - camera.shakeX, -camera.y - camera.shakeY);
          drawGroundDecals(ctx);
          turret.draw(ctx);
          for (const enemy of enemies) enemy.draw(ctx);
          drawParticles(ctx);
          drawFloatingTexts(ctx);
          ctx.restore();
          drawWalls();
          drawVignette();
          drawRoulette();
          requestAnimationFrame(victoryRouletteLoop);
        }
        requestAnimationFrame(victoryRouletteLoop);
      }, 3000);
      return;
    }

    wave++;
    let waveMsg = 'INCOMING...';
    if (currentLevel === 2) {
      if (wave === 21) waveMsg = 'TANKS ONLY — BRACE YOURSELF...';
      else if (wave === 70) waveMsg = 'SENTINEL APPROACHING...';
      else if (wave === 71) waveMsg = 'NEW THREAT: PHANTOMS DETECTED...';
      else if (wave === BOSS_WAVE) waveMsg = 'FINAL WAVE — OVERLORD INCOMING';
    } else {
      if (wave === TANK_START_WAVE) waveMsg = 'NEW THREAT DETECTED...';
      else if (wave === BOSS_WAVE) waveMsg = 'FINAL WAVE — BOSS INCOMING';
    }
    if (typeof playWaveStartSound === 'function') playWaveStartSound();
    showOverlay(`WAVE ${wave}`, waveMsg);
    waveStartDelay = 210;
  }
}
