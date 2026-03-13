// ═══════════════════════════════════════════
//  input.js — Keyboard and mouse event listeners, bullet collision detection
//  Depends on: config.js, upgrades-panel.js (buyUpgrade), particles.js, emp.js (triggerEMP)
// ═══════════════════════════════════════════

// ── Input ──
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') { keys.space = true; e.preventDefault(); }
  // Toggle upgrades panel
  if (e.key.toLowerCase() === 'b' && gameState === 'playing') {
    upgradesPanelOpen = !upgradesPanelOpen;
  }
  // Buy upgrades 1-4
  if (upgradesPanelOpen && gameState === 'playing') {
    const upgradeKeys = ['damage', 'fireRate', 'precision', 'doubleBul', 'health'];
    const num = parseInt(e.key);
    if (num >= 1 && num <= 5) {
      buyUpgrade(upgradeKeys[num - 1]);
    }
  }
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === ' ') keys.space = false;
});
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.worldX = e.clientX + camera.x;
  mouse.worldY = e.clientY + camera.y;
});
window.addEventListener('mousedown', e => {
  if (e.button === 0) mouseDown = true;
});
window.addEventListener('mouseup', e => {
  if (e.button === 0) mouseDown = false;
});

// ── Collision: Bullets vs Enemies ──
function checkBulletCollisions() {
  for (const bullet of bullets) {
    if (!bullet.alive) continue;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
      if (dist < bullet.radius + enemy.radius) {
        bullet.alive = false;
        enemy.takeDamage(Math.round(getCurrentDamage()));
        // Impact particles
        const impactAngle = Math.atan2(bullet.vy, bullet.vx);
        for (let i = 0; i < 8; i++) {
          const a = impactAngle + Math.PI + (Math.random() - 0.5) * 1.5;
          const s = 2 + Math.random() * 4;
          spawnParticle(bullet.x, bullet.y, Math.cos(a) * s, Math.sin(a) * s,
            i < 4 ? COL.cyan : COL.orange, 10 + Math.random() * 10, 1.5);
        }
        // Bright flash
        spawnParticle(bullet.x, bullet.y, 0, 0, COL.white, 5, 6);
        break;
      }
    }
  }
}
