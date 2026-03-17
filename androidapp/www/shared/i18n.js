/**
 * i18n.js — Centralized internationalization for Neon Defense
 *
 * Usage:
 *   t('menu.play')                          → 'INICIAR JUEGO' (es) / 'START GAME' (en)
 *   t('abilities.missing_cards', { n: 3 })  → 'FALTAN 3 CARTAS'
 *   setLanguage('en')
 *   getLanguage()  → 'en'
 *   toggleLanguage()
 */

const LANGS = {
  es: {
    // Menu
    'menu.play': 'INICIAR JUEGO',
    'menu.upgrades': 'MEJORAS',
    'menu.abilities': 'HABILIDADES',
    'menu.shop': 'TIENDA',
    'menu.controls': 'CONTROLES',
    'menu.ranking': 'RANKING',
    'menu.subtitle': 'SISTEMA DE DEFENSA EN LINEA',
    'menu.connected': 'CONECTADO AL GRID',
    'menu.logout': '[SALIR]',

    // Settings
    'settings.title': 'CONFIG',
    'settings.music': 'MUSICA',
    'settings.sfx': 'EFECTOS',
    'settings.save_quit': 'GUARDAR Y SALIR',
    'settings.restart': 'REINICIAR',
    'settings.continue': 'CONTINUAR',
    'pause.title': 'PAUSA',
    'settings.close': 'CERRAR',
    'settings.language': 'IDIOMA',

    // HUD
    'hud.gold': 'ORO',
    'hud.gems': 'GEM',
    'hud.silver': 'SLV',
    'hud.score': 'PUNTOS',
    'hud.kills': 'BAJAS',
    'hud.enemies': 'ENE',
    'hud.wave': 'OLEADA',
    'hud.level': 'NVL',
    'hud.auto': 'AUTO',
    'hud.manual': 'MANUAL',
    'hud.idle': 'INACTIVO',

    // Levels
    'levels.title': 'SELECCIONAR NIVEL',
    'levels.subtitle': 'GRID DE DEFENSA — SELECCION DE MISION',
    'levels.back': 'VOLVER',

    // Upgrades
    'upgrades.title': 'MEJORAS',
    'upgrades.subtitle': 'MEJORAS PERMANENTES',
    'upgrades.back': 'VOLVER',
    'upgrades.gold_label': 'ORO',

    // Abilities
    'abilities.title': 'HABILIDADES',
    'abilities.subtitle': 'MODULO DE COLECCION',
    'abilities.equipped': 'EQUIPADAS',
    'abilities.go_shop': 'IR A TIENDA',
    'abilities.back': 'VOLVER',
    'abilities.no_cards': 'SIN CARTAS',
    'abilities.lvl': 'NVL',
    'abilities.lvl_max': 'NVL MAX',
    'abilities.cards': 'CARTAS',
    'abilities.upgrade': 'MEJORAR',
    'abilities.missing_cards': 'FALTAN {n} CARTAS',
    'abilities.missing_silver': 'FALTA PLATA',
    'abilities.equip': 'EQUIPAR',
    'abilities.unequip': 'DESEQUIPAR',
    'abilities.equipped_badge': 'EQUIPADO',
    'abilities.stats': 'ESTADISTICAS',
    'abilities.current': 'ACTUAL',
    'abilities.next': 'SIGUIENTE',

    // Ability names
    'ability.emp': 'PULSO EMP',
    'ability.shield': 'ESCUDO',
    'ability.rapidfire': 'FUEGO RAPIDO',
    'ability.chain': 'RAYO CADENA',
    'ability.freeze': 'ONDA GLACIAL',
    'ability.orbital': 'ATAQUE ORBITAL',

    // Ability descriptions
    'ability.emp.desc': 'Onda electromagnética que daña y empuja enemigos.',
    'ability.shield.desc': 'Escudo temporal que absorbe daño.',
    'ability.rapidfire.desc': 'Aumenta temporalmente la velocidad de disparo.',
    'ability.chain.desc': 'Rayo que rebota entre enemigos cercanos.',
    'ability.freeze.desc': 'Congela y ralentiza a todos los enemigos en rango.',
    'ability.orbital.desc': 'Bombardeo orbital masivo en un área grande.',

    // Rarities
    'rarity.common': 'COMUN',
    'rarity.rare': 'RARO',
    'rarity.epic': 'EPICO',
    'rarity.legendary': 'LEGENDARIO',

    // Shop
    'shop.title': 'TIENDA',
    'shop.subtitle': 'MODULO DE CARTAS',
    'shop.chest_common': 'COFRE COMUN',
    'shop.chest_rare': 'COFRE RARO',
    'shop.chest_epic': 'COFRE EPICO',
    'shop.chest_common_desc': 'Cartas comunes y raras',
    'shop.chest_rare_desc': 'Cartas raras y épicas',
    'shop.chest_epic_desc': 'Cartas épicas y legendarias',
    'shop.cards_range': '{min} – {max} cartas',
    'shop.gems_label': 'GEMAS',
    'shop.open': 'ABRIR',
    'shop.opened': 'COFRE ABIERTO',
    'shop.cards_obtained': '{n} CARTAS OBTENIDAS',
    'shop.continue': 'CONTINUAR',
    'shop.back': 'VOLVER',
    'shop.not_enough': 'GEMAS INSUFICIENTES',
    'shop.error_open': 'ERROR AL ABRIR',
    'shop.error_network': 'ERROR DE RED',

    // Login
    'login.title': 'NEON DEFENSE',
    'login.subtitle': 'AUTENTICACION REQUERIDA',
    'login.tab_login': 'ENTRAR',
    'login.tab_register': 'REGISTRO',
    'login.email_or_user': 'EMAIL O USUARIO',
    'login.password': 'CONTRASEÑA',
    'login.placeholder_email': 'Ingresa email o usuario',
    'login.placeholder_pass': 'Ingresa contraseña',
    'login.submit_login': 'ACCEDER',
    'login.username': 'USUARIO',
    'login.email': 'EMAIL',
    'login.placeholder_user': 'Elige un usuario (min 3)',
    'login.placeholder_email_reg': 'Ingresa tu email',
    'login.placeholder_pass_new': 'Elige contraseña (min 4)',
    'login.confirm_pass': 'CONFIRMAR CONTRASEÑA',
    'login.placeholder_confirm': 'Confirma contraseña',
    'login.submit_register': 'CREAR CUENTA',
    'login.or': 'O',
    'login.google': 'ENTRAR CON GOOGLE',
    'login.footer': 'AUTENTICACION DEL GRID',
    'login.error_fields': 'COMPLETA TODOS LOS CAMPOS',
    'login.error_email': 'FORMATO DE EMAIL INVALIDO',
    'login.error_password': 'LAS CONTRASEÑAS NO COINCIDEN',
    'login.error_login': 'ERROR AL INICIAR SESION',
    'login.error_register': 'ERROR AL REGISTRARSE',
    'login.error_connection': 'ERROR DE CONEXION',

    // Game overlays
    'game.countdown': 'INICIALIZANDO GRID DE DEFENSA...',
    'game.defend': 'DEFIENDE!',
    'game.wave': 'OLEADA',
    'game.incoming': 'EN CAMINO...',
    'game.system_offline': 'SISTEMA FUERA DE LINEA',
    'game.returning': 'VOLVIENDO A NIVELES...',
    'game.victory': 'VICTORIA!',
    'game.level_complete': 'NIVEL {n} COMPLETADO — PUNTOS: {s}',
    'game.session_restored': 'SESION RESTAURADA — REANUDANDO...',
    'game.upgraded': 'MEJORADO!',

    // Roulette
    'roulette.title': 'MONEDAS DE PLATA',
    'roulette.silver_coins': 'MONEDAS DE PLATA',

    // Wave messages
    'wave.tanks_only': 'SOLO TANQUES — PREPARATE...',
    'wave.sentinel': 'SENTINEL ACERCANDOSE...',
    'wave.phantoms': 'NUEVA AMENAZA: FANTASMAS DETECTADOS...',
    'wave.boss_final': 'OLEADA FINAL — JEFE EN CAMINO',
    'wave.overlord_final': 'OLEADA FINAL — OVERLORD EN CAMINO',
    'wave.tank_threat': 'NUEVA AMENAZA DETECTADA...',

    // Upgrades panel (in-game)
    'panel.upgrades': 'MEJORAS',
    'panel.tap_buy': 'TOCA MEJORA PARA COMPRAR | TOCA X PARA CERRAR',
    'panel.max': 'MAX',

    // Update
    'update.title': 'NUEVA VERSION',
    'update.download': 'DESCARGAR',
    'update.skip': 'AHORA NO',
    'update.downloading': 'DESCARGANDO...',
    'update.install': 'INSTALA EL APK DESCARGADO',
  },

  en: {
    // Menu
    'menu.play': 'START GAME',
    'menu.upgrades': 'UPGRADES',
    'menu.abilities': 'ABILITIES',
    'menu.shop': 'SHOP',
    'menu.controls': 'CONTROLS',
    'menu.ranking': 'RANKING',
    'menu.subtitle': 'DEFENSE GRID ONLINE',
    'menu.connected': 'CONNECTED TO GRID',
    'menu.logout': '[LOGOUT]',

    // Settings
    'settings.title': 'CONFIG',
    'settings.music': 'MUSIC',
    'settings.sfx': 'SFX',
    'settings.save_quit': 'SAVE & QUIT',
    'settings.restart': 'RESTART',
    'settings.continue': 'CONTINUE',
    'pause.title': 'PAUSE',
    'settings.close': 'CLOSE',
    'settings.language': 'LANGUAGE',

    // HUD
    'hud.gold': 'GOLD',
    'hud.gems': 'GEM',
    'hud.silver': 'SLV',
    'hud.score': 'SCORE',
    'hud.kills': 'KILLS',
    'hud.enemies': 'ENE',
    'hud.wave': 'WAVE',
    'hud.level': 'LVL',
    'hud.auto': 'AUTO',
    'hud.manual': 'MANUAL',
    'hud.idle': 'IDLE',

    // Levels
    'levels.title': 'SELECT LEVEL',
    'levels.subtitle': 'DEFENSE GRID — MISSION SELECT',
    'levels.back': 'BACK',

    // Upgrades
    'upgrades.title': 'UPGRADES',
    'upgrades.subtitle': 'PERMANENT ENHANCEMENTS',
    'upgrades.back': 'BACK',
    'upgrades.gold_label': 'GOLD',

    // Abilities
    'abilities.title': 'ABILITIES',
    'abilities.subtitle': 'CARD COLLECTION MODULE',
    'abilities.equipped': 'EQUIPPED',
    'abilities.go_shop': 'GO TO SHOP',
    'abilities.back': 'BACK',
    'abilities.no_cards': 'NO CARDS',
    'abilities.lvl': 'LVL',
    'abilities.lvl_max': 'LVL MAX',
    'abilities.cards': 'CARDS',
    'abilities.upgrade': 'UPGRADE',
    'abilities.missing_cards': '{n} CARDS NEEDED',
    'abilities.missing_silver': 'NOT ENOUGH SILVER',
    'abilities.equip': 'EQUIP',
    'abilities.unequip': 'UNEQUIP',
    'abilities.equipped_badge': 'EQUIPPED',
    'abilities.stats': 'STATISTICS',
    'abilities.current': 'CURRENT',
    'abilities.next': 'NEXT',

    // Ability names
    'ability.emp': 'EMP PULSE',
    'ability.shield': 'SHIELD',
    'ability.rapidfire': 'RAPID FIRE',
    'ability.chain': 'CHAIN LIGHTNING',
    'ability.freeze': 'FREEZE WAVE',
    'ability.orbital': 'ORBITAL STRIKE',

    // Ability descriptions
    'ability.emp.desc': 'Electromagnetic wave that damages and pushes enemies.',
    'ability.shield.desc': 'Temporary shield that absorbs damage.',
    'ability.rapidfire.desc': 'Temporarily increases fire rate.',
    'ability.chain.desc': 'Lightning bolt that bounces between nearby enemies.',
    'ability.freeze.desc': 'Freezes and slows all enemies in range.',
    'ability.orbital.desc': 'Massive orbital bombardment in a large area.',

    // Rarities
    'rarity.common': 'COMMON',
    'rarity.rare': 'RARE',
    'rarity.epic': 'EPIC',
    'rarity.legendary': 'LEGENDARY',

    // Shop
    'shop.title': 'SHOP',
    'shop.subtitle': 'CARD SHOP MODULE',
    'shop.chest_common': 'COMMON CHEST',
    'shop.chest_rare': 'RARE CHEST',
    'shop.chest_epic': 'EPIC CHEST',
    'shop.chest_common_desc': 'Common and rare cards',
    'shop.chest_rare_desc': 'Rare and epic cards',
    'shop.chest_epic_desc': 'Epic and legendary cards',
    'shop.cards_range': '{min} – {max} cards',
    'shop.gems_label': 'GEMS',
    'shop.open': 'OPEN',
    'shop.opened': 'CHEST OPENED',
    'shop.cards_obtained': '{n} CARDS OBTAINED',
    'shop.continue': 'CONTINUE',
    'shop.back': 'BACK',
    'shop.not_enough': 'NOT ENOUGH GEMS',
    'shop.error_open': 'ERROR OPENING',
    'shop.error_network': 'NETWORK ERROR',

    // Login
    'login.title': 'NEON DEFENSE',
    'login.subtitle': 'AUTHENTICATION REQUIRED',
    'login.tab_login': 'LOGIN',
    'login.tab_register': 'REGISTER',
    'login.email_or_user': 'EMAIL OR USERNAME',
    'login.password': 'PASSWORD',
    'login.placeholder_email': 'Enter email or username',
    'login.placeholder_pass': 'Enter password',
    'login.submit_login': 'ACCESS GRID',
    'login.username': 'USERNAME',
    'login.email': 'EMAIL',
    'login.placeholder_user': 'Choose username (min 3)',
    'login.placeholder_email_reg': 'Enter your email',
    'login.placeholder_pass_new': 'Choose password (min 4)',
    'login.confirm_pass': 'CONFIRM PASSWORD',
    'login.placeholder_confirm': 'Confirm password',
    'login.submit_register': 'CREATE ACCOUNT',
    'login.or': 'OR',
    'login.google': 'GOOGLE LOGIN',
    'login.footer': 'GRID AUTHENTICATION',
    'login.error_fields': 'FILL ALL FIELDS',
    'login.error_email': 'INVALID EMAIL FORMAT',
    'login.error_password': 'PASSWORDS DO NOT MATCH',
    'login.error_login': 'LOGIN FAILED',
    'login.error_register': 'REGISTER FAILED',
    'login.error_connection': 'CONNECTION ERROR',

    // Game overlays
    'game.countdown': 'INITIALIZING DEFENSE GRID...',
    'game.defend': 'DEFEND!',
    'game.wave': 'WAVE',
    'game.incoming': 'INCOMING...',
    'game.system_offline': 'SYSTEM OFFLINE',
    'game.returning': 'RETURNING TO LEVELS...',
    'game.victory': 'VICTORY!',
    'game.level_complete': 'LEVEL {n} COMPLETE — SCORE: {s}',
    'game.session_restored': 'SESSION RESTORED — RESUMING...',
    'game.upgraded': 'UPGRADED!',

    // Roulette
    'roulette.title': 'SILVER COINS',
    'roulette.silver_coins': 'SILVER COINS',

    // Wave messages
    'wave.tanks_only': 'TANKS ONLY — BRACE YOURSELF...',
    'wave.sentinel': 'SENTINEL APPROACHING...',
    'wave.phantoms': 'NEW THREAT: PHANTOMS DETECTED...',
    'wave.boss_final': 'FINAL WAVE — BOSS INCOMING',
    'wave.overlord_final': 'FINAL WAVE — OVERLORD INCOMING',
    'wave.tank_threat': 'NEW THREAT DETECTED...',

    // Upgrades panel (in-game)
    'panel.upgrades': 'UPGRADES',
    'panel.tap_buy': 'TAP UPGRADE TO BUY | TAP X TO CLOSE',
    'panel.max': 'MAX',

    // Update
    'update.title': 'NEW VERSION',
    'update.download': 'DOWNLOAD',
    'update.skip': 'NOT NOW',
    'update.downloading': 'DOWNLOADING...',
    'update.install': 'INSTALL THE DOWNLOADED APK',
  }
};

// ---------------------------------------------------------------------------
// Internal state — persisted in localStorage
// ---------------------------------------------------------------------------

let _currentLang = (function () {
  try {
    return localStorage.getItem('neonDefenseLang') || 'es';
  } catch (e) {
    return 'es';
  }
})();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Translate a key to the current language string.
 * Supports named interpolation via a params object.
 *
 * @param {string} key    - Dot-notation key, e.g. 'menu.play'
 * @param {Object} params - Optional replacement map, e.g. { n: 3 }
 * @returns {string}
 *
 * @example
 *   t('menu.play')                          // 'INICIAR JUEGO'
 *   t('abilities.missing_cards', { n: 5 })  // 'FALTAN 5 CARTAS'
 *   t('shop.cards_range', { min: 3, max: 6 }) // '3 – 6 cartas'
 */
function t(key, params) {
  const lang = LANGS[_currentLang] || LANGS.es;
  let str = lang[key];

  // Fall back to Spanish if the key is missing in the active language
  if (str === undefined) {
    str = LANGS.es[key];
  }

  // Last resort: return the raw key so callers always get a string
  if (str === undefined) {
    str = key;
  }

  // Named parameter interpolation: replace {name} placeholders
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace('{' + k + '}', v);
    }
  }

  return str;
}

/**
 * Return the active language code ('es' or 'en').
 * @returns {string}
 */
function getLanguage() {
  return _currentLang;
}

/**
 * Set the active language and persist the choice.
 * Silently ignores unknown language codes.
 *
 * @param {string} lang - 'es' or 'en'
 */
function setLanguage(lang) {
  if (!LANGS[lang]) return;
  _currentLang = lang;
  try {
    localStorage.setItem('neonDefenseLang', lang);
  } catch (e) {
    // localStorage unavailable (e.g. private browsing edge cases) — ignore
  }
}

/**
 * Toggle between 'es' and 'en', persist the choice, and return the new code.
 * @returns {string} The newly active language code
 */
function toggleLanguage() {
  const newLang = _currentLang === 'es' ? 'en' : 'es';
  setLanguage(newLang);
  return newLang;
}
