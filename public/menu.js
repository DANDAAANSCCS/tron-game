// ═══════════════════════════════════════════
//  menu.js — Main menu keyboard/mouse navigation
//  Depends on: shared/bg-animation.js, shared/audio.js
// ═══════════════════════════════════════════

// ── Menu Keyboard Navigation ──
const menuItems = document.querySelectorAll('.menu-item');
let currentIndex = 0;

function setActive(index) {
  menuItems.forEach(item => item.classList.remove('active'));
  menuItems[index].classList.add('active');
  currentIndex = index;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 's') {
    e.preventDefault();
    setActive((currentIndex + 1) % menuItems.length);
    playHoverSound();
  }
  if (e.key === 'ArrowUp' || e.key === 'w') {
    e.preventDefault();
    setActive((currentIndex - 1 + menuItems.length) % menuItems.length);
    playHoverSound();
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    selectItem(currentIndex);
  }
});

menuItems.forEach((item, index) => {
  item.addEventListener('mouseenter', () => {
    setActive(index);
    playHoverSound();
  });
  item.addEventListener('click', (e) => {
    e.preventDefault();
    selectItem(index);
  });
});

function selectItem(index) {
  const item = menuItems[index];
  item.classList.add('flash');
  playSelectSound();
  setTimeout(() => item.classList.remove('flash'), 400);

  // Handle menu actions
  const actions = ['start', 'upgrades', 'abilities', 'controls', 'ranking'];
  if (actions[index] === 'start') {
    setTimeout(() => {
      window.location.href = '/levels.html';
    }, 500);
  }
  if (actions[index] === 'upgrades') {
    setTimeout(() => {
      window.location.href = '/upgrades.html';
    }, 500);
  }
  if (actions[index] === 'abilities') {
    setTimeout(() => {
      window.location.href = '/abilities.html';
    }, 500);
  }
}
