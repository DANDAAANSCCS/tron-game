// Configuración central para la app Android (Capacitor)
// Todas las llamadas API apuntan al servidor de Railway
const APP_CONFIG = {
  API_BASE: 'https://tron-game-production-888b.up.railway.app',
  IS_APP: true
};

// Override global fetch para redirigir rutas relativas al servidor
const _originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  if (typeof url === 'string' && url.startsWith('/')) {
    url = APP_CONFIG.API_BASE + url;
    options.credentials = 'include';
  }
  return _originalFetch.call(this, url, options);
};

// Redirigir enlaces de Google OAuth al servidor
document.addEventListener('DOMContentLoaded', () => {
  const googleBtn = document.getElementById('google-btn');
  if (googleBtn) {
    googleBtn.href = APP_CONFIG.API_BASE + '/auth/google';
  }
});
