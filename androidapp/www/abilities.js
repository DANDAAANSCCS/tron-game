// ═══════════════════════════════════════════
//  abilities.js — Card Collection System
//  Depends on: shared/bg-animation.js, shared/audio.js
// ═══════════════════════════════════════════

// ── Gem Icon ──
function drawGemIcon() {
  const gc = document.getElementById('gem-icon');
  if (!gc) return;
  const gx = gc.getContext('2d');
  const cx = 9, cy = 9;
  gx.clearRect(0, 0, 18, 18);
  gx.fillStyle = '#e040fb';
  gx.shadowColor = '#e040fb';
  gx.shadowBlur = 6;
  gx.beginPath();
  gx.moveTo(cx, cy - 7);
  gx.lineTo(cx + 5, cy - 2);
  gx.lineTo(cx + 3, cy + 7);
  gx.lineTo(cx - 3, cy + 7);
  gx.lineTo(cx - 5, cy - 2);
  gx.closePath();
  gx.fill();
  gx.shadowBlur = 0;
  gx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  gx.lineWidth = 0.5;
  gx.beginPath();
  gx.moveTo(cx - 5, cy - 2);
  gx.lineTo(cx + 5, cy - 2);
  gx.moveTo(cx, cy - 7);
  gx.lineTo(cx - 1, cy - 2);
  gx.lineTo(cx - 3, cy + 7);
  gx.moveTo(cx, cy - 7);
  gx.lineTo(cx + 1, cy - 2);
  gx.lineTo(cx + 3, cy + 7);
  gx.stroke();
}
drawGemIcon();

// ═══════════════════════════════════════════
//  ABILITY DEFINITIONS
// ═══════════════════════════════════════════

const ABILITIES = [
  // ── Original 6 ──
  { id: 'emp',       name: 'EMP PULSE',      rarity: 'common',    icon: '\u26A1',         description: 'Onda electromagn\u00e9tica que da\u00f1a y empuja enemigos.',      baseStats: 'DMG: 60 | RADIO: 350 | CD: 10s' },
  { id: 'shield',    name: 'ESCUDO',          rarity: 'common',    icon: '\uD83D\uDEE1',   description: 'Escudo temporal que absorbe da\u00f1o.',                           baseStats: 'ABSORBE: 50 | DUR: 5s | CD: 15s' },
  { id: 'rapidfire', name: 'FUEGO RAPIDO',    rarity: 'rare',      icon: '\uD83D\uDD25',   description: 'Aumenta temporalmente la velocidad de disparo.',                  baseStats: 'BOOST: +50% | DUR: 4s | CD: 20s' },
  { id: 'chain',     name: 'RAYO CADENA',     rarity: 'rare',      icon: '\u269B',         description: 'Rayo que rebota entre enemigos cercanos.',                        baseStats: 'DMG: 40 | REBOTES: 3 | CD: 12s' },
  { id: 'freeze',    name: 'ONDA GLACIAL',    rarity: 'epic',      icon: '\u2744',         description: 'Congela y ralentiza a todos los enemigos en rango.',              baseStats: 'SLOW: 50% | DUR: 3s | CD: 25s' },
  { id: 'orbital',   name: 'ATAQUE ORBITAL',  rarity: 'legendary', icon: '\u2604',         description: 'Bombardeo orbital masivo en un \u00e1rea grande.',               baseStats: 'DMG: 300 | RADIO: 500 | CD: 45s' },
  // ── Common ──
  { id: 'plasma_burst',      name: 'PLASMA BURST',          rarity: 'common', icon: '\uD83D\uDD35', description: 'Dispara una rafaga radial de proyectiles de plasma en las 8 direcciones, cada uno causando da\u00f1o moderado.',            baseStats: 'DMG: 40 | PROY: 8 | CD: 7s' },
  { id: 'static_field',      name: 'CAMPO ESTATICO',         rarity: 'common', icon: '\u26A1',       description: 'Crea un campo el\u00e9ctrico persistente alrededor de la torreta durante 5 segundos que da\u00f1a a los enemigos al contacto.', baseStats: 'DMG: 10/tick | RADIO: 120 | CD: 10s' },
  { id: 'repair_nanobots',   name: 'NANOBOTS DE REPARACION', rarity: 'common', icon: '\uD83D\uDD27', description: 'Libera nanobots que restauran una porci\u00f3n de la salud perdida de la torreta.',                                          baseStats: 'CURA: 30 | CD: 12s' },
  { id: 'shrapnel_mine',     name: 'MINA DE METRALLA',       rarity: 'common', icon: '\uD83D\uDCA3', description: 'Coloca una mina de proximidad en la ubicaci\u00f3n de la torreta que explota cuando un enemigo la pisa.',                     baseStats: 'DMG: 80 | RADIO: 40 | CD: 8s' },
  { id: 'targeting_boost',   name: 'IMPULSO DE PUNTERIA',    rarity: 'common', icon: '\uD83C\uDFAF', description: 'Aumenta temporalmente el alcance efectivo y la velocidad de bala de la torreta durante 6 segundos.',                          baseStats: 'RANGO: +100 | DUR: 6s | CD: 9s' },
  { id: 'poison_spray',      name: 'ROCIO VENENOSO',         rarity: 'common', icon: '\u2620\uFE0F', description: 'Roc\u00eda un cono de niebla t\u00f3xica en la direcci\u00f3n de apuntado de la torreta, envenenando a los enemigos durante 4 segundos.', baseStats: 'DOT: 8/tick | DUR: 4s | CD: 8s' },
  { id: 'energy_wall',       name: 'MURO DE ENERGIA',        rarity: 'common', icon: '\uD83D\uDEA7', description: 'Erige una barrera de energ\u00eda corta que frena a los enemigos que la atraviesan durante 3 segundos.',                       baseStats: 'SLOW: 40% | DUR: 3s | CD: 9s' },
  { id: 'scatter_shot',      name: 'DISPARO DISPERSO',       rarity: 'common', icon: '\uD83D\uDCA5', description: 'Dispara instant\u00e1neamente una amplia rafaga de 12 balas en un arco de 180 grados frente a la torreta.',                    baseStats: 'DMG: 25 | PROY: 12 | CD: 6s' },
  { id: 'blind_flash',       name: 'DESTELLO CEGADOR',       rarity: 'common', icon: '\uD83C\uDF1F', description: 'Emite un destello cegador que aturde a todos los enemigos cercanos durante 1.5 segundos.',                                    baseStats: 'STUN: 1.5s | RADIO: 200 | CD: 10s' },
  { id: 'bullet_magnet',     name: 'IMAN DE BALAS',          rarity: 'common', icon: '\uD83E\uDDF2', description: 'Activa un campo magn\u00e9tico que hace que todas las balas activas se curven hacia el enemigo m\u00e1s cercano durante 4 segundos.', baseStats: 'DUR: 4s | CD: 8s' },
  { id: 'gravity_pull',      name: 'ATRACCION GRAVITATORIA', rarity: 'common', icon: '\uD83C\uDF00', description: 'Atrae brevemente a todos los enemigos en pantalla hacia el centro de la torreta.',                                            baseStats: 'FUERZA: 80 | DUR: 1s | CD: 9s' },
  { id: 'armor_plating',     name: 'BLINDAJE',               rarity: 'common', icon: '\uD83D\uDEE1\uFE0F', description: 'Aplica una reducci\u00f3n de da\u00f1o plana temporal a todos los impactos entrantes durante 6 segundos.',             baseStats: 'REDUC: 10 | DUR: 6s | CD: 12s' },
  { id: 'spark_trail',       name: 'RASTRO DE CHISPAS',      rarity: 'common', icon: '\u2728',       description: 'Cada bala deja un rastro de chispas da\u00f1ino durante 3 segundos despu\u00e9s de que se activa esta habilidad.',             baseStats: 'RASTRO: 5/tick | DUR: 3s | CD: 10s' },
  { id: 'micro_missiles',    name: 'MICRO MISILES',          rarity: 'common', icon: '\uD83D\uDE80', description: 'Lanza 4 micro-misiles teledirigidos que rastrean a un enemigo aleatorio y explotan al impacto.',                             baseStats: 'DMG: 35 | MISILES: 4 | CD: 8s' },
  { id: 'decoy_signal',      name: 'SENAL SENUELO',          rarity: 'common', icon: '\uD83D\uDCE1', description: 'Despliega una baliza se\u00f1uelo que distrae a todos los enemigos, haciendo que la ataquen durante 4 segundos.',             baseStats: 'HP: 50 | DUR: 4s | CD: 12s' },
  { id: 'voltaic_aura',      name: 'AURA VOLTAICA',          rarity: 'common', icon: '\u2B55',       description: 'Activa un aura el\u00e9ctrica de corta duraci\u00f3n que causa peque\u00f1o da\u00f1o a todos los enemigos en un radio cercano cada segundo.', baseStats: 'DMG: 8/tick | RADIO: 100 | CD: 10s' },
  { id: 'grease_slick',      name: 'CHARCO RESBALADIZO',     rarity: 'common', icon: '\uD83D\uDEE2\uFE0F', description: 'Deja un charco resbaladizo bajo la torreta que frena a los enemigos que lo atraviesan en un 50%.',                  baseStats: 'SLOW: 50% | DUR: 6s | CD: 8s' },
  { id: 'ricochet_round',    name: 'BALA REBOTIN',           rarity: 'common', icon: '\u21A9\uFE0F', description: 'Dispara una sola bala de alta velocidad que rebota en los bordes de la pantalla hasta 4 veces.',                             baseStats: 'DMG: 55 | REBOTES: 4 | CD: 6s' },
  { id: 'smoke_screen',      name: 'CORTINA DE HUMO',        rarity: 'common', icon: '\uD83D\uDCA8', description: 'Despliega una cortina de humo que reduce la velocidad de movimiento de los enemigos en un 30% durante 5 segundos.',           baseStats: 'SLOW: 30% | DUR: 5s | CD: 9s' },
  { id: 'overcharge_shot',   name: 'DISPARO SOBRECARGADO',   rarity: 'common', icon: '\uD83D\uDD0B', description: 'Dispara una sola bala masivamente sobrecargada que causa el triple del da\u00f1o normal y perfora hasta 3 enemigos.',         baseStats: 'DMG: x3 | PENETRA: 3 | CD: 8s' },
  { id: 'seismic_tap',       name: 'GOLPE SISMICO',          rarity: 'common', icon: '\uD83D\uDCA2', description: 'Golpea el suelo y env\u00eda una onda de choque radialmente hacia afuera, empujando brevemente a los enemigos.',             baseStats: 'EMPUJE: 60 | RADIO: 250 | CD: 7s' },
  { id: 'turret_overclock',  name: 'SOBREVELOCIDAD TORRETA', rarity: 'common', icon: '\u2699\uFE0F', description: 'Sobrecarga temporalmente la torreta, aumentando su cadencia de fuego en un 50% durante 4 segundos.',                         baseStats: 'CADENCIA: +50% | DUR: 4s | CD: 12s' },
  { id: 'acid_splash',       name: 'SALPICADURA ACIDA',      rarity: 'common', icon: '\uD83E\uDDEA', description: 'Salpica \u00e1cido en los 3 enemigos m\u00e1s cercanos, reduciendo su armadura y haciendo que reciban un 20% m\u00e1s de da\u00f1o durante 5 segundos.', baseStats: 'AMP: 20% | OBJETIVOS: 3 | CD: 9s' },
  { id: 'burst_shield',      name: 'ESCUDO DE RAFAGA',       rarity: 'common', icon: '\uD83D\uDD35', description: 'Absorbe instant\u00e1neamente el siguiente impacto entrante por completo, independientemente del da\u00f1o.',                baseStats: 'ABSORBE: 1 impacto | CD: 10s' },
  { id: 'energy_spike',      name: 'PICO DE ENERGIA',        rarity: 'common', icon: '\uD83D\uDCCC', description: 'Planta un pico de energ\u00eda en la posici\u00f3n de un enemigo aleatorio que causa da\u00f1o pesado instant\u00e1neo al activarse.', baseStats: 'DMG: 70 | RADIO: 50 | CD: 7s' },
  { id: 'hail_storm',        name: 'TORMENTA DE GRANIZO',    rarity: 'common', icon: '\uD83C\uDF28\uFE0F', description: 'Cubre un \u00e1rea aleatoria de la pantalla con 20 peque\u00f1os proyectiles de hielo que causan poco da\u00f1o cada uno.', baseStats: 'DMG: 12 | PROY: 20 | CD: 8s' },
  { id: 'crit_boost',        name: 'IMPULSO CRITICO',        rarity: 'common', icon: '\uD83C\uDFB0', description: 'Otorga un 40% de probabilidad de golpe cr\u00edtico durante los pr\u00f3ximos 6 segundos, causando que los cr\u00edticos hagan el doble de da\u00f1o.', baseStats: 'CRIT: 40% | DUR: 6s | CD: 12s' },
  { id: 'web_trap',          name: 'TRAMPA DE TELARANA',     rarity: 'common', icon: '\uD83D\uDD78\uFE0F', description: 'Dispara una telara\u00f1a que inmoviliza al enemigo m\u00e1s cercano durante 3 segundos.',                           baseStats: 'ROOT: 3s | CD: 8s' },
  { id: 'flare_launch',      name: 'BENGALA',                rarity: 'common', icon: '\uD83D\uDD06', description: 'Lanza una bengala que revela a todos los enemigos en el minimapa y los marca para recibir un 15% de da\u00f1o adicional durante 5 segundos.', baseStats: 'AMP: 15% | DUR: 5s | CD: 10s' },
  { id: 'repulsor_blast',    name: 'EXPLOSION REPULSORA',    rarity: 'common', icon: '\uD83D\uDCAB', description: 'Empuja a todos los enemigos en pantalla lejos de la torreta con fuerza moderada.',                                           baseStats: 'FUERZA: 120 | CD: 9s' },
  // ── Rare ──
  { id: 'twin_barrels',        name: 'CANONES GEMELOS',        rarity: 'rare', icon: '\uD83D\uDD2B', description: 'Dobla temporalmente el n\u00famero de balas disparadas por tiro durante 5 segundos, con cada bala extra causando el 50% del da\u00f1o.', baseStats: 'EXTRA: +1 | DUR: 5s | CD: 15s' },
  { id: 'chain_burn',          name: 'QUEMADURA EN CADENA',    rarity: 'rare', icon: '\uD83D\uDD25', description: 'Inflama al enemigo m\u00e1s cercano; el fuego se propaga a los enemigos adyacentes en rango, quemando a cada uno durante 4 segundos.', baseStats: 'QUEMA: 12/tick | DUR: 4s | CD: 12s' },
  { id: 'void_rift',           name: 'GRIETA DEL VACIO',       rarity: 'rare', icon: '\uD83D\uDD73\uFE0F', description: 'Abre una grieta en un grupo aleatorio de enemigos que causa da\u00f1o continuo y atrae a los enemigos cercanos durante 4 segundos.', baseStats: 'DMG: 15/tick | DUR: 4s | CD: 18s' },
  { id: 'kill_trigger_bomb',   name: 'BOMBA DETONADORA',       rarity: 'rare', icon: '\uD83D\uDC80', description: 'Coloca una bomba activada por muerte: cuando cualquier enemigo muere en rango, detona causando da\u00f1o en \u00e1rea a los enemigos cercanos.', baseStats: 'DMG: 90 | RADIO: 120 | CD: 14s' },
  { id: 'drone_sentry',        name: 'DRON CENTINELA',         rarity: 'rare', icon: '\uD83E\uDD16', description: 'Despliega un dr\u00f3n aut\u00f3nomo que orbita la torreta y dispara al enemigo m\u00e1s cercano durante 10 segundos.',              baseStats: 'DMG: 20 | DUR: 10s | CD: 20s' },
  { id: 'lifesteal_rounds',    name: 'MUNICION VAMPIRICA',     rarity: 'rare', icon: '\uD83E\uDE78', description: 'Carga munici\u00f3n de robo de vida durante 6 segundos; cada bala cura la torreta por el 10% del da\u00f1o infligido.',           baseStats: 'ROBO: 10% | DUR: 6s | CD: 18s' },
  { id: 'tesla_coil',          name: 'BOBINA TESLA',           rarity: 'rare', icon: '\uD83D\uDDFC', description: 'Despliega una bobina Tesla estacionaria que sacude a hasta 3 enemigos por segundo durante 8 segundos.',                         baseStats: 'DMG: 18/zap | OBJETIVOS: 3 | CD: 18s' },
  { id: 'mirror_wall',         name: 'MURO ESPEJO',            rarity: 'rare', icon: '\uD83E\uDEDE', description: 'Genera una pared reflectante que rebota las balas de vuelta hacia los enemigos durante 5 segundos.',                            baseStats: 'MULT: x1.5 | DUR: 5s | CD: 15s' },
  { id: 'vulnerability_mark',  name: 'MARCA DE VULNERABILIDAD',rarity: 'rare', icon: '\uD83C\uDFAF', description: 'Marca a los 3 enemigos con m\u00e1s vida en pantalla para recibir un 35% m\u00e1s de da\u00f1o durante 8 segundos.',            baseStats: 'AMP: 35% | OBJETIVOS: 3 | CD: 15s' },
  { id: 'phantom_barrage',     name: 'BARRAGE FANTASMA',       rarity: 'rare', icon: '\uD83D\uDC7B', description: 'Dispara 20 balas fantasma en c\u00edrculo completo que atraviesan paredes pero causan da\u00f1o reducido.',                      baseStats: 'DMG: 30 | PROY: 20 | CD: 14s' },
  { id: 'time_slow_field',     name: 'CAMPO RALENTIZADOR',     rarity: 'rare', icon: '\u23F1\uFE0F', description: 'Proyecta un campo localizado que frena a todos los enemigos dentro de \u00e9l al 20% de velocidad durante 5 segundos.',         baseStats: 'SLOW: 80% | DUR: 5s | CD: 20s' },
  { id: 'concussive_blast',    name: 'EXPLOSION CONCUSIVA',    rarity: 'rare', icon: '\uD83D\uDCA3', description: 'Detona una explosi\u00f3n concusiva que causa da\u00f1o moderado y desactiva las habilidades especiales de los enemigos durante 5 segundos.', baseStats: 'DMG: 60 | RADIO: 220 | CD: 15s' },
  { id: 'orbital_mine_ring',   name: 'ANILLO DE MINAS',        rarity: 'rare', icon: '\uD83D\uDCA0', description: 'Despliega un anillo de 6 minas de proximidad a distancia fija alrededor de la torreta.',                                       baseStats: 'DMG: 75 | MINAS: 6 | CD: 18s' },
  { id: 'shockwave_pulse',     name: 'PULSO DE ONDA DE CHOQUE',rarity: 'rare', icon: '\u3030\uFE0F', description: 'Emite 3 anillos de onda de choque expansivos secuenciales que cada uno causa da\u00f1o, con un ligero retraso entre ellos.',     baseStats: 'DMG: 45 | ONDAS: 3 | CD: 14s' },
  { id: 'elemental_infusion',  name: 'INFUSION ELEMENTAL',     rarity: 'rare', icon: '\uD83C\uDF08', description: 'Infunde balas con energ\u00eda elemental durante 6 segundos: cada 3a bala aplica un estado aleatorio (quema, congela o descarga).', baseStats: 'ESTADO: random | DUR: 6s | CD: 16s' },
  { id: 'spectral_copy',       name: 'COPIA ESPECTRAL',        rarity: 'rare', icon: '\uD83D\uDC65', description: 'Crea una copia espectral de la torreta que dispara balas fantasma en direcci\u00f3n opuesta durante 4 segundos.',                baseStats: 'DMG: 60% | DUR: 4s | CD: 18s' },
  { id: 'execute_protocol',    name: 'PROTOCOLO DE EJECUCION', rarity: 'rare', icon: '\u2620\uFE0F', description: 'Mata instant\u00e1neamente a todos los enemigos con menos del 20% de salud en pantalla.',                                       baseStats: 'UMBRAL: 20% | CD: 25s' },
  { id: 'nano_swarm',          name: 'ENJAMBRE NANO',          rarity: 'rare', icon: '\uD83D\uDC1D', description: 'Libera un enjambre de nanobots que se propagan entre enemigos cercanos causando da\u00f1o continuo durante 6 segundos.',          baseStats: 'DMG: 10/tick | DUR: 6s | CD: 15s' },
  { id: 'kinetic_surge',       name: 'OLEADA CINETICA',        rarity: 'rare', icon: '\u26A1',       description: 'Se carga durante 1 segundo y luego libera un devastador rayo cinem\u00e1tico dirigido que causa da\u00f1o masivo a todos los enemigos en l\u00ednea.', baseStats: 'DMG: 120 | CD: 20s' },
  { id: 'scatter_mines',       name: 'MINAS DISPERSAS',        rarity: 'rare', icon: '\uD83C\uDF10', description: 'Dispersa 8 minas aleatoriamente por la arena que detonan al contacto con enemigos.',                                             baseStats: 'DMG: 65 | MINAS: 8 | CD: 15s' },
  { id: 'pulse_shield',        name: 'ESCUDO DE PULSO',        rarity: 'rare', icon: '\uD83D\uDD37', description: 'Erige un escudo que absorbe hasta 150 de da\u00f1o y, al destruirse, libera una r\u00e1faga EMP da\u00f1ina.',                   baseStats: 'ESCUDO: 150 | DMG EMP: 60 | CD: 18s' },
  { id: 'dark_matter_round',   name: 'MATERIA OSCURA',         rarity: 'rare', icon: '\u26AB',       description: 'Dispara un proyectil de materia oscura que perfora a todos los enemigos en su trayectoria y deja un rastro da\u00f1ino durante 3 segundos.', baseStats: 'DMG: 50 | RASTRO: 8/tick | CD: 14s' },
  { id: 'beacon_of_weakness',  name: 'BALIZA DE DEBILIDAD',    rarity: 'rare', icon: '\uD83D\uDCC9', description: 'Planta una baliza que reduce el da\u00f1o de todos los enemigos cercanos en un 30% durante 8 segundos.',                          baseStats: 'REDUC: 30% | DUR: 8s | CD: 18s' },
  { id: 'cluster_bomb',        name: 'BOMBA DE RACIMO',        rarity: 'rare', icon: '\uD83D\uDCA3', description: 'Lanza una bomba que se divide en 5 granadas de racimo en el aire, cada una causando da\u00f1o en \u00e1rea en impactos separados.', baseStats: 'DMG: 55 | RACIMOS: 5 | CD: 14s' },
  { id: 'sonic_boom',          name: 'BOOM SONICO',            rarity: 'rare', icon: '\uD83D\uDCE2', description: 'Libera una onda de choque s\u00f3nica que silencia a todos los enemigos (desactivando sus habilidades especiales) y los empuja durante 3 segundos.', baseStats: 'SILENCIO: 3s | RADIO: 300 | CD: 15s' },
  { id: 'sniper_scope',        name: 'MIRA DE FRANCOTIRADOR',  rarity: 'rare', icon: '\uD83D\uDD2D', description: 'Activa el modo francotirador durante 5 segundos: la cadencia de fuego se reduce a la mitad pero cada bala causa 5x da\u00f1o y tiene alcance infinito.', baseStats: 'DMG: x5 | DUR: 5s | CD: 20s' },
  { id: 'overclock_ammo',      name: 'MUNICION SOBRECARGADA',  rarity: 'rare', icon: '\uD83D\uDD04', description: 'Carga munici\u00f3n sobrecargada especial durante 5 segundos: las balas tienen el 50% de da\u00f1o en \u00e1rea en un peque\u00f1o radio al impactar.', baseStats: 'AREA: 50% | DUR: 5s | CD: 15s' },
  { id: 'frost_nova',          name: 'NOVA DE ESCARCHA',       rarity: 'rare', icon: '\uD83C\uDF2C\uFE0F', description: 'Explota en una r\u00e1faga de escarcha que congela a todos los enemigos en rango medio durante 2 segundos y luego los rompe por da\u00f1o adicional.', baseStats: 'CONG: 2s | DMG: 70 | CD: 18s' },
  { id: 'momentum_field',      name: 'CAMPO DE IMPULSO',       rarity: 'rare', icon: '\uD83C\uDF00', description: 'Crea un campo de momentum que acelera todas las balas activas, aumentando su da\u00f1o en un 30% y su velocidad en un 50% durante 4 segundos.', baseStats: 'DMG: +30% | DUR: 4s | CD: 15s' },
  { id: 'toxin_canister',      name: 'BOTE DE TOXINAS',        rarity: 'rare', icon: '\uD83E\uDDEB', description: 'Lanza un bote de toxinas que se rompe al impactar, creando 4 charcos t\u00f3xicos que cada uno frena y da\u00f1a a los enemigos durante 6 segundos.', baseStats: 'DMG: 8/tick | CHARCOS: 4 | CD: 16s' },
  // ── Epic ──
  { id: 'blackhole_seed',       name: 'SEMILLA DE AGUJERO NEGRO', rarity: 'epic', icon: '\uD83C\uDF11', description: 'Despliega un mini agujero negro que crece durante 6 segundos, atrayendo a todos los enemigos hacia adentro y aplast\u00e1ndolos por da\u00f1o masivo en \u00e1rea al colapsar.', baseStats: 'DMG: 200 | DUR: 6s | CD: 30s' },
  { id: 'bullet_storm',         name: 'TORMENTA DE BALAS',        rarity: 'epic', icon: '\uD83C\uDF2A\uFE0F', description: 'Desata una tormenta de balas de 5 segundos que dispara 5 balas por fotograma en direcciones aleatorias llenando toda la arena.', baseStats: 'DMG: 15 | DUR: 5s | CD: 30s' },
  { id: 'time_reversal',        name: 'INVERSION TEMPORAL',       rarity: 'epic', icon: '\u23EA',       description: 'Teletransporta a todos los enemigos de vuelta a sus posiciones de aparici\u00f3n en el borde de la pantalla, reiniciando su avance.', baseStats: 'TODOS | CD: 35s' },
  { id: 'ion_cannon',           name: 'CANON DE IONES',           rarity: 'epic', icon: '\uD83D\uDD2D', description: 'Carga y dispara un rayo i\u00f3nico sostenido en la direcci\u00f3n apuntada durante 3 segundos, causando da\u00f1o pesado por segundo a todo lo que golpea.', baseStats: 'DMG: 150/s | DUR: 3s | CD: 30s' },
  { id: 'quantum_mirror',       name: 'ESPEJO CUANTICO',          rarity: 'epic', icon: '\uD83E\uDE9F', description: 'Crea un espejo cu\u00e1ntico que duplica cada bala disparada durante 5 segundos, con los duplicados causando el 70% del da\u00f1o.', baseStats: 'DUP: 70% | DUR: 5s | CD: 25s' },
  { id: 'plague_cloud',         name: 'NUBE DE PLAGA',            rarity: 'epic', icon: '\u2601\uFE0F', description: 'Genera una nube t\u00f3xica masiva que llena el 40% de la pantalla, causando da\u00f1o de veneno acumulativo y reduciendo la velocidad de los enemigos en un 40% durante 8 segundos.', baseStats: 'DOT: 15 | SLOW: 40% | CD: 35s' },
  { id: 'turret_fortress',      name: 'FORTALEZA DE TORRETAS',    rarity: 'epic', icon: '\uD83C\uDFF0', description: 'Despliega 4 mini-torretas en las direcciones cardinales que disparan autom\u00e1ticamente de forma independiente durante 10 segundos.', baseStats: 'DMG: 25 | TORRETAS: 4 | CD: 30s' },
  { id: 'gravity_inverter',     name: 'INVERSOR DE GRAVEDAD',     rarity: 'epic', icon: '\uD83D\uDD04', description: 'Invierte la gravedad para todos los enemigos durante 3 segundos, haciendo que se alejen r\u00e1pidamente de la torreta en lugar de acercarse.', baseStats: 'FUERZA: 200 | DUR: 3s | CD: 25s' },
  { id: 'energy_leech',         name: 'SANGUIJUELA DE ENERGIA',   rarity: 'epic', icon: '\uD83E\uDDA0', description: 'Drena vida de todos los enemigos en rango, curando la torreta por el 2% del HP m\u00e1ximo de cada enemigo y causando el mismo como da\u00f1o.', baseStats: 'ROBO: 2% HP | RADIO: 350 | CD: 30s' },
  { id: 'cryo_freeze',          name: 'CONGELACION CRIOGENICA',   rarity: 'epic', icon: '\u2744\uFE0F', description: 'Congela instant\u00e1neamente a todos los enemigos en pantalla durante 3 segundos, impidi\u00e9ndoles moverse y causando que se rompan con da\u00f1o adicional al ser golpeados.', baseStats: 'CONG: 3s | BONUS: 50% | CD: 35s' },
  { id: 'death_mark',           name: 'MARCA DE MUERTE',          rarity: 'epic', icon: '\uD83D\uDC80', description: 'Marca a los 5 enemigos m\u00e1s cercanos con una marca de muerte; cuando un enemigo marcado recibe suficiente da\u00f1o, muere instant\u00e1neamente y explota causando da\u00f1o en \u00e1rea.', baseStats: 'UMBRAL: 40% | DMG: 80 | CD: 25s' },
  { id: 'overload_field',       name: 'CAMPO DE SOBRECARGA',      rarity: 'epic', icon: '\u26A1',       description: 'Sobrecarga cada habilidad activa simult\u00e1neamente para que se active una vez m\u00e1s, luego todas las habilidades entran en un bloqueo de 3 segundos.', baseStats: 'RECARGA x2 | CD: 30s' },
  { id: 'antimatter_shell',     name: 'PROYECTIL DE ANTIMATERIA', rarity: 'epic', icon: '\uD83D\uDCA0', description: 'Dispara un proyectil de antimateria que atraviesa a todos los enemigos y luego detona al m\u00e1ximo alcance, revirtiendo la explosi\u00f3n hacia adentro.', baseStats: 'DMG: 100 | RADIO: 250 | CD: 25s' },
  { id: 'phase_shift',          name: 'CAMBIO DE FASE',           rarity: 'epic', icon: '\uD83C\uDF0A', description: 'Lleva la torreta a una dimensi\u00f3n de fase durante 2 segundos, volvi\u00e9ndola inmune a todo da\u00f1o, luego regresa causando da\u00f1o en \u00e1rea.', baseStats: 'INMUNE: 2s | DMG: 120 | CD: 30s' },
  { id: 'gravity_well_array',   name: 'MATRIZ GRAVITATORIA',      rarity: 'epic', icon: '\uD83D\uDD18', description: 'Genera 4 pozos de gravedad en las esquinas de la pantalla que cada uno atrae y comprime a los enemigos hacia su centro durante 6 segundos.', baseStats: 'FUERZA: 70 | DUR: 6s | CD: 35s' },
  { id: 'singularity_bomb',     name: 'BOMBA DE SINGULARIDAD',    rarity: 'epic', icon: '\uD83C\uDF20', description: 'Lanza una bomba de singularidad que implosiona, convirtiendo el 30% de la vida actual de todos los enemigos cercanos en da\u00f1o directo aplicado a ellos mismos.', baseStats: 'HP%: 30% | RADIO: 280 | CD: 30s' },
  { id: 'neural_disruptor',     name: 'DISRUPTOR NEURAL',         rarity: 'epic', icon: '\uD83E\uDDE0', description: 'Desordena el objetivo enemigo, haciendo que todos los enemigos cambien aleatoriamente de direcci\u00f3n y se ataquen mutuamente durante 5 segundos.', baseStats: 'DUR: 5s | CD: 30s' },
  { id: 'gravity_lens',         name: 'LENTE GRAVITATORIA',       rarity: 'epic', icon: '\uD83D\uDD0D', description: 'Dobla todas las balas disparadas en los pr\u00f3ximos 5 segundos para curvarlas y golpear al enemigo con m\u00e1s vida.', baseStats: 'DUR: 5s | CD: 25s' },
  { id: 'chain_reaction',       name: 'REACCION EN CADENA',       rarity: 'epic', icon: '\uD83D\uDCA5', description: 'El siguiente enemigo muerto crea una explosi\u00f3n que activa que la siguiente muerte cree una explosi\u00f3n mayor, encadenando hasta 8 muertes.', baseStats: 'DMG: 80 | CADENA: x8 | CD: 30s' },
  { id: 'temporal_stasis',      name: 'ESTASIS TEMPORAL',         rarity: 'epic', icon: '\u23F8\uFE0F', description: 'Pausa a todos los enemigos en su lugar durante 4 segundos mientras la torreta contin\u00faa disparando normalmente.', baseStats: 'PAUSA: 4s | CD: 35s' },
  { id: 'photon_barrier',       name: 'BARRERA DE FOTONES',       rarity: 'epic', icon: '\uD83D\uDD36', description: 'Erige una barrera de fotones circular completa alrededor del borde de la arena que refleja proyectiles y da\u00f1a a los enemigos que la tocan durante 6 segundos.', baseStats: 'DMG: 30 | DUR: 6s | CD: 30s' },
  { id: 'power_surge',          name: 'OLEADA DE PODER',          rarity: 'epic', icon: '\uD83D\uDD0C', description: 'Canaliza toda la energ\u00eda de la torreta en una r\u00e1faga de 4 segundos donde el da\u00f1o se triplica y todos los tiempos de recarga se regeneran a 3x velocidad.', baseStats: 'DMG: x3 | DUR: 4s | CD: 35s' },
  { id: 'warp_field',           name: 'CAMPO DE DISTORSION',      rarity: 'epic', icon: '\uD83C\uDF0C', description: 'Abre un campo de distoris\u00f3n que teletransporta todas las balas disparadas durante 5 segundos para aparecer directamente frente a un enemigo aleatorio.', baseStats: 'DUR: 5s | CD: 25s' },
  { id: 'temporal_dilation',    name: 'DILATACION TEMPORAL',      rarity: 'epic', icon: '\uD83D\uDD2E', description: 'Dilata el tiempo alrededor de la torreta, haciendo que la torreta opere a 3x velocidad normal mientras los enemigos se mueven al 30% de velocidad durante 4 segundos.', baseStats: 'TORRETA: x3 | DUR: 4s | CD: 35s' },
  { id: 'spectral_bomb',        name: 'BOMBA ESPECTRAL',          rarity: 'epic', icon: '\uD83D\uDC41\uFE0F', description: 'Despliega una bomba espectral invisible para los enemigos que detona cuando 5 o m\u00e1s enemigos est\u00e1n en su radio, causando da\u00f1o masivo.', baseStats: 'DMG: 180 | ACTIVA: 5 ENE | CD: 30s' },
  { id: 'rewind_damage',        name: 'REBOBINAR DANO',           rarity: 'epic', icon: '\u23EE\uFE0F', description: 'Rebobina a todos los enemigos a sus posiciones y valores de vida de hace 4 segundos, revirtiendo efectivamente los \u00faltimos 4 segundos de su curaci\u00f3n/avance.', baseStats: 'REBOBINA: 4s | CD: 35s' },
  { id: 'prism_array',          name: 'MATRIZ PRISMATICA',        rarity: 'epic', icon: '\uD83D\uDD3A', description: 'Despliega un prisma que divide el fuego de la torreta en 3 rayos en diferentes direcciones durante 5 segundos.', baseStats: 'RAYOS: 3 | DUR: 5s | CD: 25s' },
  { id: 'dark_resonance',       name: 'RESONANCIA OSCURA',        rarity: 'epic', icon: '\uD83C\uDF11', description: 'Aplica resonancia oscura a todos los enemigos: cada vez que un enemigo resonado es golpeado, todos los dem\u00e1s enemigos resonados reciben tambi\u00e9n el 30% de ese da\u00f1o.', baseStats: 'RESONANCIA: 30% | DUR: 8s | CD: 30s' },
  { id: 'nanobot_swarm_repair', name: 'REPARACION NANOBOT',       rarity: 'epic', icon: '\uD83E\uDD16', description: 'Despliega un enjambre de nanobots de reparaci\u00f3n sostenida durante 8 segundos que cura 10 HP por segundo y aumenta la capacidad del escudo en 50.', baseStats: 'CURA: 10/s | ESCUDO: +50 | CD: 30s' },
  { id: 'nano_heal_aura',       name: 'AURA CURATIVA NANO',       rarity: 'epic', icon: '\uD83D\uDC89', description: 'Activa un aura de nano-curaci\u00f3n durante 10 segundos que regenera 5 HP por segundo y otorga inmunidad a los pr\u00f3ximos 2 golpes.', baseStats: 'CURA: 5/s | INMUNE: 2 golpes | CD: 30s' },
  // ── Legendary ──
  { id: 'cosmic_ray',          name: 'RAYO COSMICO',          rarity: 'legendary', icon: '\u2600\uFE0F', description: 'Llama a un rayo c\u00f3smico masivo desde arriba que barre toda la arena causando 400 de da\u00f1o a todo lo que toca.', baseStats: 'DMG: 400 | CD: 45s' },
  { id: 'apocalypse_nova',     name: 'NOVA APOCALIPTICA',     rarity: 'legendary', icon: '\uD83C\uDF0B', description: 'Desata una nova catastr\u00f3fica que causa 250 de da\u00f1o a todos los enemigos en pantalla y deja un campo ardiente de 10 segundos que cubre toda la arena.', baseStats: 'DMG: 250 | CAMPO: 20/tick | CD: 40s' },
  { id: 'time_stop',           name: 'DETENCION TEMPORAL',    rarity: 'legendary', icon: '\uD83D\uDD70\uFE0F', description: 'Detiene todo el tiempo para los enemigos durante 6 segundos \u2014 se congelan completamente mientras la torreta dispara a doble velocidad durante este periodo.', baseStats: 'PAUSA: 6s | DISPARO: x2 | CD: 50s' },
  { id: 'supernova_collapse',  name: 'SUPERNOVA',             rarity: 'legendary', icon: '\uD83C\uDF1F', description: 'Crea una estrella que se expande r\u00e1pidamente por toda la pantalla en 3 segundos, causando 500 de da\u00f1o total distribuido entre todos los enemigos golpeados.', baseStats: 'DMG: 500 total | CD: 45s' },
  { id: 'dimensional_rift',    name: 'GRIETA DIMENSIONAL',    rarity: 'legendary', icon: '\uD83C\uDF00', description: 'Desgarra un portal dimensional que teletransporta aleatoriamente a cada enemigo a una posici\u00f3n diferente del mapa, luego detona causando 300 de da\u00f1o en \u00e1rea.', baseStats: 'DMG: 300 | RADIO: 400 | CD: 40s' },
  { id: 'infinite_turret',     name: 'TORRETA INFINITA',      rarity: 'legendary', icon: '\u267E\uFE0F', description: 'Genera 8 copias id\u00e9nticas de la torreta que disparan en todas direcciones simult\u00e1neamente durante 12 segundos.', baseStats: 'COPIAS: 8 | DUR: 12s | CD: 45s' },
  { id: 'total_annihilation',  name: 'ANIQUILACION TOTAL',    rarity: 'legendary', icon: '\uD83D\uDCA5', description: 'Mata instant\u00e1neamente a todos los enemigos actualmente en pantalla, independientemente de su vida, con una explosi\u00f3n devastadora.', baseStats: 'MATA TODOS | CD: 50s' },
  { id: 'vampire_field',       name: 'CAMPO VAMPIRICO',       rarity: 'legendary', icon: '\uD83E\uDDDB', description: 'Crea un campo de 12 segundos que drena el 5% del HP m\u00e1ximo por segundo de cada enemigo en rango, curando completamente la torreta.', baseStats: 'DRENA: 5%/s | DUR: 12s | CD: 45s' },
  { id: 'matrix_hack',         name: 'HACKEO DE LA MATRIX',   rarity: 'legendary', icon: '\uD83D\uDCBB', description: 'Hackea la realidad misma, convirtiendo 3 enemigos aleatorios en unidades aliadas que luchan por ti durante 15 segundos.', baseStats: 'ALIADOS: 3 | DUR: 15s | CD: 45s' },
  { id: 'solar_flare',         name: 'LLAMARADA SOLAR',       rarity: 'legendary', icon: '\uD83C\uDF1E', description: 'Desata una intensa llamarada solar que ciega y quema a todos los enemigos durante 10 segundos mientras aumenta el da\u00f1o de la torreta en un 100%.', baseStats: 'QUEMA: 25/tick | DMG: +100% | CD: 40s' },
  { id: 'omega_shield',        name: 'ESCUDO OMEGA',          rarity: 'legendary', icon: '\uD83D\uDEE1\uFE0F', description: 'Activa un escudo impenetrable durante 8 segundos; cuando expira, detona absorbiendo todo el da\u00f1o recibido y devolvi\u00e9ndolo como \u00e1rea.', baseStats: 'INMUNE: 8s | RETORNO: x1.5 | CD: 45s' },
  { id: 'god_mode',            name: 'MODO DIOS',             rarity: 'legendary', icon: '\uD83D\uDC51', description: 'Otorga 10 segundos de poder absoluto: perforaci\u00f3n infinita, triple da\u00f1o, inmunidad al da\u00f1o y 500% de cadencia de fuego.', baseStats: 'DMG: x3 | CADENCIA: x5 | CD: 50s' },
  { id: 'paradox_loop',        name: 'BUCLE PARADOJA',        rarity: 'legendary', icon: '\uD83D\uDD01', description: 'Crea un bucle temporal: los pr\u00f3ximos 8 segundos de da\u00f1o infligido se graban y luego se reproducen instant\u00e1neamente sobre todos los enemigos.', baseStats: 'GRABA: 8s | REPITE | CD: 45s' },
  { id: 'wrath_of_cosmos',     name: 'IRA DEL COSMOS',        rarity: 'legendary', icon: '\uD83C\uDF0C', description: 'Llueve 50 meteoros por la arena durante 5 segundos, cada uno causando 120 de da\u00f1o en un radio de explosi\u00f3n de 80px al impactar.', baseStats: 'DMG: 120 | METEOROS: 50 | CD: 40s' },
  { id: 'infinity_mirror',     name: 'ESPEJO INFINITO',       rarity: 'legendary', icon: '\uD83E\uDEDE', description: 'Crea 6 espejos alrededor de la arena; durante 10 segundos, cada bala disparada se clona en cada punto espejo, creando 7x de producci\u00f3n de balas.', baseStats: 'ESPEJOS: 6 | DUR: 10s | CD: 45s' },
  { id: 'reaper_scythe',       name: 'GUADANA DEL SEGADOR',   rarity: 'legendary', icon: '\u2694\uFE0F', description: 'Invoca la guada\u00f1a del Segador que barre la pantalla 3 veces, cada barrido causando 350 de da\u00f1o a todos los enemigos en su arco.', baseStats: 'DMG: 350 | BARRIDOS: 3 | CD: 45s' },
  { id: 'eternal_storm',       name: 'TORMENTA ETERNA',       rarity: 'legendary', icon: '\u26C8\uFE0F', description: 'Invoca una tormenta eterna que dura 15 segundos: rayos aleatorios golpean enemigos cada 0.5 segundos por 200 de da\u00f1o cada uno.', baseStats: 'DMG: 200/rayo | DUR: 15s | CD: 50s' },
  { id: 'void_collapse',       name: 'COLAPSO DEL VACIO',     rarity: 'legendary', icon: '\uD83D\uDD2E', description: 'Colapsa toda la materia del vac\u00edo en la arena, causando da\u00f1o igual al 50% de la vida actual de cada enemigo simult\u00e1neamente a todos los enemigos.', baseStats: 'DMG: 50% HP | CD: 45s' },
  { id: 'entropy_bomb',        name: 'BOMBA DE ENTROPIA',     rarity: 'legendary', icon: '\u2622\uFE0F', description: 'Planta una bomba de entrop\u00eda que acumula poder durante 5 segundos; luego detona causando da\u00f1o igual al da\u00f1o total recibido por la torreta durante esa ventana x10.', baseStats: 'MULT: x10 | CD: 45s' },
  { id: 'legion_protocol',     name: 'PROTOCOLO LEGION',      rarity: 'legendary', icon: '\u2694\uFE0F', description: 'Activa el Protocolo Legi\u00f3n: despliega 12 drones de combate aut\u00f3nomos que cada uno dispara independientemente durante 15 segundos.', baseStats: 'DMG: 30 | DRONES: 12 | CD: 50s' },
  { id: 'reality_fracture',    name: 'FRACTURA DE REALIDAD',  rarity: 'legendary', icon: '\uD83D\uDC8E', description: 'Fractura la realidad en 6 realidades paralelas durante 8 segundos: en cada realidad la torreta dispara, multiplicando la producci\u00f3n de da\u00f1o efectiva por 6.', baseStats: 'REALIDADES: 6 | DUR: 8s | CD: 50s' },
  { id: 'mass_corruption',     name: 'CORRUPCION MASIVA',     rarity: 'legendary', icon: '\uD83D\uDDA4', description: 'Corrompe a todos los enemigos en pantalla: reciben 100% m\u00e1s da\u00f1o de todas las fuentes y causan un 50% menos de da\u00f1o durante 10 segundos.', baseStats: 'DMG IN: x2 | DMG OUT: -50% | CD: 45s' },
  { id: 'turret_ascension',    name: 'ASCENSION DE TORRETA',  rarity: 'legendary', icon: '\uD83C\uDFC6', description: 'Asciende la torreta a su forma definitiva durante 12 segundos: todas las estad\u00edsticas se duplican, los disparos perforan infinitamente y un aura da\u00f1ina rodea la torreta.', baseStats: 'STATS: x2 | DUR: 12s | CD: 50s' },
  { id: 'overdrive_core',      name: 'NUCLEO SOBREVELOCIDAD', rarity: 'legendary', icon: '\u269B\uFE0F', description: 'Sobrecarga el n\u00facleo de la torreta durante 10 segundos: las balas se dividen en 3 al golpear cada enemigo, cada una causando el 40% del da\u00f1o original.', baseStats: 'SPLIT: x3 | DUR: 10s | CD: 50s' },
  { id: 'echo_blast',          name: 'EXPLOSION ECO',         rarity: 'legendary', icon: '\uD83D\uDCE1', description: 'Dispara una explosi\u00f3n que resuena hacia afuera 5 veces, cada eco causando el mismo da\u00f1o con un retraso de 0.5 segundos entre cada anillo.', baseStats: 'DMG: 180 | ECOS: 5 | CD: 40s' },
];

const RARITY = {
  common:    { label: 'COMUN',      color: '#00fff2', border: 'rgba(0, 255, 242, 0.3)'  },
  rare:      { label: 'RARO',       color: '#4488ff', border: 'rgba(68, 136, 255, 0.3)' },
  epic:      { label: 'EPICO',      color: '#aa00ff', border: 'rgba(170, 0, 255, 0.3)'  },
  legendary: { label: 'LEGENDARIO', color: '#ffaa00', border: 'rgba(255, 170, 0, 0.3)'  },
};

const CARDS_PER_LEVEL = [1, 2, 4, 8, 12, 18, 25, 35, 45, 60, 80, 100, 130, 160, 200, 250, 300, 380, 460];

const MAX_EQUIPPED = 5;
const MAX_LEVEL = 20;

let SILVER_BASE = { common: 1500, rare: 3000, epic: 5000, legendary: 8000 };
let SILVER_SCALE = 1.25;

// ── Stat definitions per ability ──
const ABILITY_STATS = {
  // ── Original 6 ──
  emp: {
    damage:   { label: 'DAÑO',      base: 60,   perLvl: 8,    unit: '' },
    radius:   { label: 'RADIO',     base: 350,  perLvl: 15,   unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 600,  perLvl: -15,  unit: 'f', display: 's', divisor: 60 },
  },
  shield: {
    absorb:   { label: 'ABSORBE',   base: 50,   perLvl: 10,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 300,  perLvl: 10,   unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 900,  perLvl: -20,  unit: 'f', display: 's', divisor: 60 },
  },
  rapidfire: {
    boost:    { label: 'BOOST',     base: 50,   perLvl: 3,    unit: '%' },
    duration: { label: 'DURACIÓN',  base: 240,  perLvl: 8,    unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1200, perLvl: -25,  unit: 'f', display: 's', divisor: 60 },
  },
  chain: {
    damage:   { label: 'DAÑO',      base: 40,   perLvl: 6,    unit: '' },
    bounces:  { label: 'REBOTES',   base: 3,    perLvl: 0.5,  unit: '', floor: true },
    cooldown: { label: 'COOLDOWN',  base: 720,  perLvl: -15,  unit: 'f', display: 's', divisor: 60 },
  },
  freeze: {
    slow:     { label: 'SLOW',      base: 50,   perLvl: 1.5,  unit: '%' },
    duration: { label: 'DURACIÓN',  base: 180,  perLvl: 8,    unit: 'f', display: 's', divisor: 60 },
    radius:   { label: 'RADIO',     base: 400,  perLvl: 15,   unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 1500, perLvl: -30,  unit: 'f', display: 's', divisor: 60 },
  },
  orbital: {
    damage:   { label: 'DAÑO',      base: 300,  perLvl: 25,   unit: '' },
    radius:   { label: 'RADIO',     base: 500,  perLvl: 20,   unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 2700, perLvl: -50,  unit: 'f', display: 's', divisor: 60 },
  },
  // ── Common ──
  plasma_burst: {
    damage:     { label: 'DAÑO',      base: 40,  perLvl: 8,   unit: '' },
    projectiles:{ label: 'PROYECT.',  base: 8,   perLvl: 0,   unit: '' },
    cooldown:   { label: 'COOLDOWN',  base: 420, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  static_field: {
    damage:   { label: 'DAÑO/TICK', base: 10,  perLvl: 2,   unit: '' },
    radius:   { label: 'RADIO',     base: 120, perLvl: 8,   unit: 'px' },
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 600, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  repair_nanobots: {
    heal:     { label: 'CURA',      base: 30,  perLvl: 10,  unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 720, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  shrapnel_mine: {
    damage:   { label: 'DAÑO',      base: 80,  perLvl: 15,  unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 480, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  targeting_boost: {
    range:    { label: 'RANGO +',   base: 100, perLvl: 20,  unit: 'px' },
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 540, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  poison_spray: {
    damage:   { label: 'DOT/TICK',  base: 8,   perLvl: 2,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 240, perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 480, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  energy_wall: {
    slow:     { label: 'SLOW',      base: 40,  perLvl: 5,   unit: '%' },
    duration: { label: 'DURACIÓN',  base: 180, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 540, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  scatter_shot: {
    damage:     { label: 'DAÑO',     base: 25,  perLvl: 5,   unit: '' },
    projectiles:{ label: 'PROYECT.', base: 12,  perLvl: 1,   unit: '' },
    cooldown:   { label: 'COOLDOWN', base: 360, perLvl: -10, unit: 'f', display: 's', divisor: 60 },
  },
  blind_flash: {
    stun:     { label: 'ATURD.',    base: 90,  perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    radius:   { label: 'RADIO',     base: 200, perLvl: 10,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 600, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  bullet_magnet: {
    duration: { label: 'DURACIÓN',  base: 240, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 480, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  gravity_pull: {
    duration: { label: 'DURACIÓN',  base: 60,  perLvl: 5,   unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 540, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  armor_plating: {
    reduce:   { label: 'REDUCCION', base: 10,  perLvl: 3,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 720, perLvl: -18, unit: 'f', display: 's', divisor: 60 },
  },
  spark_trail: {
    damage:   { label: 'DAÑO/TICK', base: 5,   perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 180, perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 600, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  micro_missiles: {
    damage:   { label: 'DAÑO',      base: 35,  perLvl: 7,   unit: '' },
    missiles: { label: 'MISILES',   base: 4,   perLvl: 1,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 480, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  decoy_signal: {
    hp:       { label: 'HP SEÑUELO',base: 50,  perLvl: 15,  unit: '' },
    duration: { label: 'DURACIÓN',  base: 240, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 720, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  voltaic_aura: {
    damage:   { label: 'DAÑO/TICK', base: 8,   perLvl: 2,   unit: '' },
    radius:   { label: 'RADIO',     base: 100, perLvl: 5,   unit: 'px' },
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 600, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  grease_slick: {
    slow:     { label: 'SLOW',      base: 50,  perLvl: 3,   unit: '%' },
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 480, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  ricochet_round: {
    damage:   { label: 'DAÑO',      base: 55,  perLvl: 10,  unit: '' },
    bounces:  { label: 'REBOTES',   base: 4,   perLvl: 1,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 360, perLvl: -10, unit: 'f', display: 's', divisor: 60 },
  },
  smoke_screen: {
    slow:     { label: 'SLOW',      base: 30,  perLvl: 3,   unit: '%' },
    radius:   { label: 'RADIO',     base: 180, perLvl: 8,   unit: 'px' },
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 540, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  overcharge_shot: {
    multiplier:{ label: 'MULT DMG', base: 3,   perLvl: 0.2, unit: 'x' },
    pierce:    { label: 'PENETRA',  base: 3,   perLvl: 1,   unit: '' },
    cooldown:  { label: 'COOLDOWN', base: 480, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  seismic_tap: {
    knockback:{ label: 'EMPUJE',    base: 60,  perLvl: 8,   unit: '' },
    radius:   { label: 'RADIO',     base: 250, perLvl: 10,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 420, perLvl: -10, unit: 'f', display: 's', divisor: 60 },
  },
  turret_overclock: {
    boost:    { label: 'CADENCIA +',base: 50,  perLvl: 5,   unit: '%' },
    duration: { label: 'DURACIÓN',  base: 240, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 720, perLvl: -18, unit: 'f', display: 's', divisor: 60 },
  },
  acid_splash: {
    amplify:  { label: 'AMP DMG',   base: 20,  perLvl: 3,   unit: '%' },
    targets:  { label: 'OBJETIVOS', base: 3,   perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 540, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  burst_shield: {
    hits:     { label: 'ABSORBE',   base: 1,   perLvl: 0,   unit: ' golpe(s)' },
    cooldown: { label: 'COOLDOWN',  base: 600, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  energy_spike: {
    damage:   { label: 'DAÑO',      base: 70,  perLvl: 12,  unit: '' },
    radius:   { label: 'RADIO',     base: 50,  perLvl: 3,   unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 420, perLvl: -10, unit: 'f', display: 's', divisor: 60 },
  },
  hail_storm: {
    damage:     { label: 'DAÑO',     base: 12,  perLvl: 2,   unit: '' },
    projectiles:{ label: 'PROYECT.',base: 20,  perLvl: 2,   unit: '' },
    cooldown:   { label: 'COOLDOWN', base: 480, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  crit_boost: {
    critChance:{ label: 'CRIT %',   base: 40,  perLvl: 5,   unit: '%' },
    duration:  { label: 'DURACIÓN', base: 360, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 720, perLvl: -18, unit: 'f', display: 's', divisor: 60 },
  },
  web_trap: {
    root:     { label: 'ROOT',      base: 180, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 480, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  flare_launch: {
    amplify:  { label: 'BONUS DMG', base: 15,  perLvl: 3,   unit: '%' },
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 600, perLvl: -15, unit: 'f', display: 's', divisor: 60 },
  },
  repulsor_blast: {
    force:    { label: 'FUERZA',    base: 120, perLvl: 15,  unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 540, perLvl: -12, unit: 'f', display: 's', divisor: 60 },
  },
  // ── Rare ──
  twin_barrels: {
    extraBullets:{ label: 'BALAS +', base: 1,   perLvl: 1,   unit: '' },
    duration:    { label: 'DURACIÓN',base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown:    { label: 'COOLDOWN',base: 900, perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  chain_burn: {
    damage:   { label: 'QUEMA/TICK',base: 12,  perLvl: 2,   unit: '' },
    targets:  { label: 'OBJETIVOS', base: 5,   perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 240, perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 720, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  void_rift: {
    damage:   { label: 'DAÑO/TICK', base: 15,  perLvl: 3,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 240, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    radius:   { label: 'RADIO',     base: 100, perLvl: 8,   unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 1080,perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  kill_trigger_bomb: {
    damage:   { label: 'DAÑO',      base: 90,  perLvl: 18,  unit: '' },
    radius:   { label: 'RADIO',     base: 120, perLvl: 8,   unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 840, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  drone_sentry: {
    damage:   { label: 'DAÑO DRONE',base: 20,  perLvl: 4,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 600, perLvl: 20,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1200,perLvl: -30, unit: 'f', display: 's', divisor: 60 },
  },
  lifesteal_rounds: {
    leech:    { label: 'ROBO VIDA', base: 10,  perLvl: 2,   unit: '%' },
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1080,perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  tesla_coil: {
    damage:   { label: 'DAÑO/ZAP',  base: 18,  perLvl: 4,   unit: '' },
    targets:  { label: 'OBJETIVOS', base: 3,   perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 480, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1080,perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  mirror_wall: {
    multiplier:{ label: 'MULT DMG', base: 1.5, perLvl: 0.1, unit: 'x' },
    duration:  { label: 'DURACIÓN', base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 900, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  vulnerability_mark: {
    amplify:  { label: 'AMP DMG',   base: 35,  perLvl: 5,   unit: '%' },
    targets:  { label: 'OBJETIVOS', base: 3,   perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 480, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 900, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  phantom_barrage: {
    damage:     { label: 'DAÑO',     base: 30,  perLvl: 6,   unit: '' },
    projectiles:{ label: 'PROYECT.',base: 20,  perLvl: 2,   unit: '' },
    cooldown:   { label: 'COOLDOWN', base: 840, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  time_slow_field: {
    slow:     { label: 'SLOW',      base: 80,  perLvl: 2,   unit: '%' },
    radius:   { label: 'RADIO',     base: 180, perLvl: 10,  unit: 'px' },
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1200,perLvl: -28, unit: 'f', display: 's', divisor: 60 },
  },
  concussive_blast: {
    damage:   { label: 'DAÑO',      base: 60,  perLvl: 12,  unit: '' },
    radius:   { label: 'RADIO',     base: 220, perLvl: 10,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 900, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  orbital_mine_ring: {
    damage:   { label: 'DAÑO',      base: 75,  perLvl: 15,  unit: '' },
    mines:    { label: 'MINAS',     base: 6,   perLvl: 1,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 1080,perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  shockwave_pulse: {
    damage:   { label: 'DAÑO',      base: 45,  perLvl: 9,   unit: '' },
    waves:    { label: 'ONDAS',     base: 3,   perLvl: 0,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 840, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  elemental_infusion: {
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 960, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  spectral_copy: {
    multiplier:{ label: 'DMG COPIA',base: 60,  perLvl: 5,   unit: '%' },
    duration:  { label: 'DURACIÓN', base: 240, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 1080,perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  execute_protocol: {
    threshold:{ label: 'UMBRAL',    base: 20,  perLvl: 2,   unit: '%' },
    cooldown: { label: 'COOLDOWN',  base: 1500,perLvl: -35, unit: 'f', display: 's', divisor: 60 },
  },
  nano_swarm: {
    damage:   { label: 'DAÑO/TICK', base: 10,  perLvl: 2,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 900, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  kinetic_surge: {
    damage:   { label: 'DAÑO',      base: 120, perLvl: 20,  unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 1200,perLvl: -28, unit: 'f', display: 's', divisor: 60 },
  },
  scatter_mines: {
    damage:   { label: 'DAÑO',      base: 65,  perLvl: 12,  unit: '' },
    mines:    { label: 'MINAS',     base: 8,   perLvl: 1,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 900, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  pulse_shield: {
    shieldHP: { label: 'ESCUDO HP', base: 150, perLvl: 25,  unit: '' },
    burst:    { label: 'DMG EMP',   base: 60,  perLvl: 12,  unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 1080,perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  dark_matter_round: {
    damage:   { label: 'DAÑO',      base: 50,  perLvl: 10,  unit: '' },
    trail:    { label: 'RASTRO/TICK',base: 8,  perLvl: 2,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 840, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  beacon_of_weakness: {
    reduce:   { label: 'REDUC DMG', base: 30,  perLvl: 3,   unit: '%' },
    radius:   { label: 'RADIO',     base: 200, perLvl: 10,  unit: 'px' },
    duration: { label: 'DURACIÓN',  base: 480, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1080,perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  cluster_bomb: {
    damage:   { label: 'DAÑO',      base: 55,  perLvl: 10,  unit: '' },
    count:    { label: 'RACIMOS',   base: 5,   perLvl: 1,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 840, perLvl: -20, unit: 'f', display: 's', divisor: 60 },
  },
  sonic_boom: {
    silence:  { label: 'SILENCIO',  base: 180, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    radius:   { label: 'RADIO',     base: 300, perLvl: 12,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 900, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  sniper_scope: {
    multiplier:{ label: 'MULT DMG', base: 5,   perLvl: 0.3, unit: 'x' },
    duration:  { label: 'DURACIÓN', base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 1200,perLvl: -28, unit: 'f', display: 's', divisor: 60 },
  },
  overclock_ammo: {
    splash:   { label: 'AREA DMG',  base: 50,  perLvl: 5,   unit: '%' },
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 900, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  frost_nova: {
    freeze:   { label: 'CONGELA',   base: 120, perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    damage:   { label: 'DMG ROTURA',base: 70,  perLvl: 12,  unit: '' },
    radius:   { label: 'RADIO',     base: 220, perLvl: 10,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 1080,perLvl: -25, unit: 'f', display: 's', divisor: 60 },
  },
  momentum_field: {
    damageBonus:{ label: 'DMG +',   base: 30,  perLvl: 4,   unit: '%' },
    duration:   { label: 'DURACIÓN',base: 240, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown:   { label: 'COOLDOWN',base: 900, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  toxin_canister: {
    damage:   { label: 'DAÑO/TICK', base: 8,   perLvl: 2,   unit: '' },
    puddles:  { label: 'CHARCOS',   base: 4,   perLvl: 0,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 960, perLvl: -22, unit: 'f', display: 's', divisor: 60 },
  },
  // ── Epic ──
  blackhole_seed: {
    damage:   { label: 'DMG COLAPSO',base: 200,perLvl: 35,  unit: '' },
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  bullet_storm: {
    damage:   { label: 'DAÑO',      base: 15,  perLvl: 3,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  time_reversal: {
    cooldown: { label: 'COOLDOWN',  base: 2100,perLvl: -45, unit: 'f', display: 's', divisor: 60 },
  },
  ion_cannon: {
    damage:   { label: 'DAÑO/SEG',  base: 150, perLvl: 25,  unit: '' },
    duration: { label: 'DURACIÓN',  base: 180, perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  quantum_mirror: {
    multiplier:{ label: 'DMG COPIA',base: 70,  perLvl: 5,   unit: '%' },
    duration:  { label: 'DURACIÓN', base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 1500,perLvl: -35, unit: 'f', display: 's', divisor: 60 },
  },
  plague_cloud: {
    damage:   { label: 'VENENO/TICK',base: 15, perLvl: 3,   unit: '' },
    slow:     { label: 'SLOW',      base: 40,  perLvl: 3,   unit: '%' },
    duration: { label: 'DURACIÓN',  base: 480, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2100,perLvl: -45, unit: 'f', display: 's', divisor: 60 },
  },
  turret_fortress: {
    damage:   { label: 'DMG TORRETA',base: 25, perLvl: 5,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 600, perLvl: 20,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  gravity_inverter: {
    force:    { label: 'FUERZA',    base: 200, perLvl: 20,  unit: '' },
    duration: { label: 'DURACIÓN',  base: 180, perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1500,perLvl: -35, unit: 'f', display: 's', divisor: 60 },
  },
  energy_leech: {
    leech:    { label: 'ROBO HP%',  base: 2,   perLvl: 0.5, unit: '%' },
    radius:   { label: 'RADIO',     base: 350, perLvl: 15,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  cryo_freeze: {
    freeze:   { label: 'CONGELA',   base: 180, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    bonus:    { label: 'BONUS DMG', base: 50,  perLvl: 5,   unit: '%' },
    cooldown: { label: 'COOLDOWN',  base: 2100,perLvl: -45, unit: 'f', display: 's', divisor: 60 },
  },
  death_mark: {
    threshold:{ label: 'UMBRAL',    base: 40,  perLvl: 3,   unit: '%' },
    damage:   { label: 'DMG EXPLOS',base: 80,  perLvl: 15,  unit: '' },
    targets:  { label: 'OBJETIVOS', base: 5,   perLvl: 1,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 1500,perLvl: -35, unit: 'f', display: 's', divisor: 60 },
  },
  overload_field: {
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  antimatter_shell: {
    damage:   { label: 'DAÑO',      base: 100, perLvl: 18,  unit: '' },
    radius:   { label: 'RADIO EXPLOS',base:250,perLvl: 12,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 1500,perLvl: -35, unit: 'f', display: 's', divisor: 60 },
  },
  phase_shift: {
    immunity: { label: 'INMUNIDAD', base: 120, perLvl: 8,   unit: 'f', display: 's', divisor: 60 },
    damage:   { label: 'DMG RETORNO',base:120, perLvl: 20,  unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  gravity_well_array: {
    force:    { label: 'FUERZA',    base: 70,  perLvl: 8,   unit: '' },
    damage:   { label: 'DAÑO/TICK', base: 12,  perLvl: 2,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2100,perLvl: -45, unit: 'f', display: 's', divisor: 60 },
  },
  singularity_bomb: {
    hpRatio:  { label: 'HP% DAÑO',  base: 30,  perLvl: 3,   unit: '%' },
    radius:   { label: 'RADIO',     base: 280, perLvl: 12,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  neural_disruptor: {
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  gravity_lens: {
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1500,perLvl: -35, unit: 'f', display: 's', divisor: 60 },
  },
  chain_reaction: {
    damage:   { label: 'DMG INICIAL',base: 80, perLvl: 15,  unit: '' },
    chains:   { label: 'MAX CADENA',base: 8,   perLvl: 1,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  temporal_stasis: {
    freeze:   { label: 'PAUSA',     base: 240, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2100,perLvl: -45, unit: 'f', display: 's', divisor: 60 },
  },
  photon_barrier: {
    damage:   { label: 'DAÑO/CONT', base: 30,  perLvl: 6,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 360, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  power_surge: {
    multiplier:{ label: 'MULT DMG', base: 3,   perLvl: 0.2, unit: 'x' },
    duration:  { label: 'DURACIÓN', base: 240, perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 2100,perLvl: -45, unit: 'f', display: 's', divisor: 60 },
  },
  warp_field: {
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1500,perLvl: -35, unit: 'f', display: 's', divisor: 60 },
  },
  temporal_dilation: {
    turretSpeed:{ label: 'VEL TORRETA',base: 3,perLvl: 0.2, unit: 'x' },
    duration:   { label: 'DURACIÓN', base: 240,perLvl: 10,  unit: 'f', display: 's', divisor: 60 },
    cooldown:   { label: 'COOLDOWN', base: 2100,perLvl: -45,unit: 'f', display: 's', divisor: 60 },
  },
  spectral_bomb: {
    damage:   { label: 'DAÑO',      base: 180, perLvl: 30,  unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  rewind_damage: {
    rewind:   { label: 'REBOBINA',  base: 240, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2100,perLvl: -45, unit: 'f', display: 's', divisor: 60 },
  },
  prism_array: {
    beams:    { label: 'RAYOS',     base: 3,   perLvl: 0,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 300, perLvl: 12,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1500,perLvl: -35, unit: 'f', display: 's', divisor: 60 },
  },
  dark_resonance: {
    ratio:    { label: 'RESONANCIA',base: 30,  perLvl: 3,   unit: '%' },
    duration: { label: 'DURACIÓN',  base: 480, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  nanobot_swarm_repair: {
    healAmount:{ label: 'CURA/SEG', base: 10,  perLvl: 2,   unit: '' },
    shield:    { label: 'ESCUDO +', base: 50,  perLvl: 10,  unit: '' },
    duration:  { label: 'DURACIÓN', base: 480, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  nano_heal_aura: {
    healAmount:{ label: 'CURA/SEG', base: 5,   perLvl: 1,   unit: '' },
    immunity:  { label: 'INMUNE',   base: 2,   perLvl: 1,   unit: ' golpe(s)' },
    duration:  { label: 'DURACIÓN', base: 600, perLvl: 20,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 1800,perLvl: -40, unit: 'f', display: 's', divisor: 60 },
  },
  // ── Legendary ──
  cosmic_ray: {
    damage:   { label: 'DAÑO',      base: 400, perLvl: 60,  unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  apocalypse_nova: {
    damage:   { label: 'DAÑO NOVA', base: 250, perLvl: 40,  unit: '' },
    fieldDmg: { label: 'CAMPO/TICK',base: 20,  perLvl: 4,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 2400,perLvl: -50, unit: 'f', display: 's', divisor: 60 },
  },
  time_stop: {
    freeze:   { label: 'CONGELACION',base:360, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 3000,perLvl: -60, unit: 'f', display: 's', divisor: 60 },
  },
  supernova_collapse: {
    damage:   { label: 'DAÑO TOTAL',base: 500, perLvl: 80,  unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  dimensional_rift: {
    damage:   { label: 'DAÑO',      base: 300, perLvl: 50,  unit: '' },
    radius:   { label: 'RADIO',     base: 400, perLvl: 15,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 2400,perLvl: -50, unit: 'f', display: 's', divisor: 60 },
  },
  infinite_turret: {
    copies:   { label: 'COPIAS',    base: 8,   perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 720, perLvl: 25,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  total_annihilation: {
    cooldown: { label: 'COOLDOWN',  base: 3000,perLvl: -60, unit: 'f', display: 's', divisor: 60 },
  },
  vampire_field: {
    drain:    { label: 'DRENA/SEG', base: 5,   perLvl: 0.5, unit: '% HP' },
    duration: { label: 'DURACIÓN',  base: 720, perLvl: 20,  unit: 'f', display: 's', divisor: 60 },
    radius:   { label: 'RADIO',     base: 500, perLvl: 20,  unit: 'px' },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  matrix_hack: {
    converts: { label: 'CONVIERTE', base: 3,   perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 900, perLvl: 25,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  solar_flare: {
    burn:     { label: 'QUEMA/TICK',base: 25,  perLvl: 5,   unit: '' },
    boost:    { label: 'DMG +',     base: 100, perLvl: 10,  unit: '%' },
    duration: { label: 'DURACIÓN',  base: 600, perLvl: 20,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2400,perLvl: -50, unit: 'f', display: 's', divisor: 60 },
  },
  omega_shield: {
    duration: { label: 'INMUNIDAD', base: 480, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  god_mode: {
    multiplier:{ label: 'MULT DMG', base: 3,   perLvl: 0.2, unit: 'x' },
    fireRate:  { label: 'CADENCIA', base: 500, perLvl: 30,  unit: '%' },
    duration:  { label: 'DURACIÓN', base: 600, perLvl: 20,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 3000,perLvl: -60, unit: 'f', display: 's', divisor: 60 },
  },
  paradox_loop: {
    record:   { label: 'GRABA',     base: 480, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  wrath_of_cosmos: {
    damage:   { label: 'DMG METEORO',base:120, perLvl: 20,  unit: '' },
    count:    { label: 'METEOROS',  base: 50,  perLvl: 5,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 2400,perLvl: -50, unit: 'f', display: 's', divisor: 60 },
  },
  infinity_mirror: {
    mirrors:  { label: 'ESPEJOS',   base: 6,   perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 600, perLvl: 20,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  reaper_scythe: {
    damage:   { label: 'DAÑO',      base: 350, perLvl: 55,  unit: '' },
    sweeps:   { label: 'BARRIDOS',  base: 3,   perLvl: 0,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  eternal_storm: {
    damage:   { label: 'DMG/RAYO',  base: 200, perLvl: 30,  unit: '' },
    duration: { label: 'DURACIÓN',  base: 900, perLvl: 25,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 3000,perLvl: -60, unit: 'f', display: 's', divisor: 60 },
  },
  void_collapse: {
    hpRatio:  { label: 'HP% DAÑO',  base: 50,  perLvl: 3,   unit: '%' },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  entropy_bomb: {
    multiplier:{ label: 'MULT DMG', base: 10,  perLvl: 1,   unit: 'x' },
    cooldown:  { label: 'COOLDOWN', base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  legion_protocol: {
    damage:   { label: 'DMG DRONE', base: 30,  perLvl: 5,   unit: '' },
    drones:   { label: 'DRONES',    base: 12,  perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 900, perLvl: 25,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 3000,perLvl: -60, unit: 'f', display: 's', divisor: 60 },
  },
  reality_fracture: {
    realities:{ label: 'REALIDADES',base: 6,   perLvl: 1,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 480, perLvl: 15,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 3000,perLvl: -60, unit: 'f', display: 's', divisor: 60 },
  },
  mass_corruption: {
    amplify:  { label: 'DMG IN +',  base: 100, perLvl: 10,  unit: '%' },
    reduce:   { label: 'DMG OUT -', base: 50,  perLvl: 3,   unit: '%' },
    duration: { label: 'DURACIÓN',  base: 600, perLvl: 20,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 2700,perLvl: -55, unit: 'f', display: 's', divisor: 60 },
  },
  turret_ascension: {
    multiplier:{ label: 'MULT STATS',base: 2,  perLvl: 0.1, unit: 'x' },
    duration:  { label: 'DURACIÓN', base: 720, perLvl: 25,  unit: 'f', display: 's', divisor: 60 },
    cooldown:  { label: 'COOLDOWN', base: 3000,perLvl: -60, unit: 'f', display: 's', divisor: 60 },
  },
  overdrive_core: {
    splits:   { label: 'SPLITS',    base: 3,   perLvl: 0,   unit: '' },
    duration: { label: 'DURACIÓN',  base: 600, perLvl: 20,  unit: 'f', display: 's', divisor: 60 },
    cooldown: { label: 'COOLDOWN',  base: 3000,perLvl: -60, unit: 'f', display: 's', divisor: 60 },
  },
  echo_blast: {
    damage:   { label: 'DAÑO',      base: 180, perLvl: 30,  unit: '' },
    echoes:   { label: 'ECOS',      base: 5,   perLvl: 1,   unit: '' },
    cooldown: { label: 'COOLDOWN',  base: 2400,perLvl: -50, unit: 'f', display: 's', divisor: 60 },
  },
};

function getSilverCost(rarity, level) {
  if (level < 1) return 0;
  const base = SILVER_BASE[rarity] || 1500;
  return Math.round(base * Math.pow(SILVER_SCALE, level - 1));
}

// ── State ──
let serverGems = 0;
let serverSilver = 0;
let abilityCards = {};
let abilityLevels = {};
let equippedAbilities = [];

// ── Helpers ──

function computeLevel(totalCards) {
  let cardsConsumed = 0;
  for (let lvl = 0; lvl < CARDS_PER_LEVEL.length; lvl++) {
    cardsConsumed += CARDS_PER_LEVEL[lvl];
    if (totalCards < cardsConsumed) return lvl;
  }
  return MAX_LEVEL;
}

function cardsForLevel(level) {
  let sum = 0;
  for (let i = 0; i < level; i++) sum += CARDS_PER_LEVEL[i];
  return sum;
}

function getProgressInfo(id) {
  const totalCards = abilityCards[id] || 0;
  let level = (abilityLevels[id] !== undefined) ? abilityLevels[id] : computeLevel(totalCards);

  if (level === 0 && totalCards === 0) {
    return { level: 0, totalCards: 0, cardsTowardNext: 0, cardsNeeded: CARDS_PER_LEVEL[0], pct: 0 };
  }

  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, totalCards, cardsTowardNext: 0, cardsNeeded: 0, pct: 1 };
  }

  const consumed = cardsForLevel(level);
  const cardsTowardNext = totalCards - consumed;
  const cardsNeeded = CARDS_PER_LEVEL[level];
  const pct = cardsNeeded > 0 ? Math.min(cardsTowardNext / cardsNeeded, 1) : 1;

  return { level, totalCards, cardsTowardNext, cardsNeeded, pct };
}

// ── Stat value calculator ──
function getStatValue(statDef, level) {
  // level 0 = base stats (no levels applied)
  const rawLevel = Math.max(0, level);
  let val = statDef.base + statDef.perLvl * rawLevel;
  if (statDef.floor) val = Math.floor(val);
  if (statDef.display === 's' && statDef.divisor) {
    return (val / statDef.divisor).toFixed(1) + 's';
  }
  if (statDef.unit && statDef.unit !== 'f' && statDef.unit !== '') {
    return val + statDef.unit;
  }
  return statDef.floor ? val : (Number.isInteger(val) ? val : Math.round(val * 10) / 10);
}

// ── Data loading ──
async function loadData() {
  try {
    const [gemsRes, abRes] = await Promise.all([
      fetch('/api/gamedata'),
      fetch('/api/abilities'),
    ]);
    if (gemsRes.ok) {
      const gd = await gemsRes.json();
      serverGems = gd.gems || 0;
      serverSilver = gd.silverCoins || 0;
      if (gd.silverBaseCost) SILVER_BASE = gd.silverBaseCost;
      if (gd.silverScale) SILVER_SCALE = gd.silverScale;
      if (gd.cardsToUpgrade) CARDS_PER_LEVEL.splice(0, CARDS_PER_LEVEL.length, ...gd.cardsToUpgrade);
    }
    if (abRes.ok) {
      const ad = await abRes.json();
      abilityCards      = ad.abilityCards      || {};
      abilityLevels     = ad.abilityLevels     || {};
      equippedAbilities = ad.equippedAbilities || [];
    }
  } catch (e) {
    // Silent fail — UI will show zeroed state
  }
  updateUI();
}

function updateUI() {
  const gemsEl = document.getElementById('gems-count');
  if (gemsEl) gemsEl.textContent = serverGems;
  const silverEl = document.getElementById('silver-count');
  if (silverEl) silverEl.textContent = serverSilver;
  updateEquipCounter();
  renderAbilities();
}

function updateEquipCounter() {
  const el = document.getElementById('equip-counter');
  if (el) el.textContent = `${equippedAbilities.length} / ${MAX_EQUIPPED}`;
}

// ═══════════════════════════════════════════
//  DETAIL MODAL
// ═══════════════════════════════════════════

function buildStatsTableHTML(ab, info) {
  const statDefs = ABILITY_STATS[ab.id];
  if (!statDefs) return '';

  const rarity = RARITY[ab.rarity];
  const level = info.level;
  const isMax = level >= MAX_LEVEL;

  let rows = '';
  for (const key of Object.keys(statDefs)) {
    const def = statDefs[key];
    const currentVal = getStatValue(def, level);
    let nextCell;

    if (isMax) {
      nextCell = `<span style="color:#ffaa00;font-size:0.55rem;letter-spacing:2px;">MAX</span>`;
    } else {
      const nextVal = getStatValue(def, level + 1);
      const improved = def.perLvl > 0 || (def.display === 's'); // cooldown goes down = improvement
      // For cooldown, smaller is better; detect by perLvl sign
      const isImprovement = def.perLvl < 0
        ? (parseFloat(String(nextVal)) < parseFloat(String(currentVal)))
        : (parseFloat(String(nextVal)) > parseFloat(String(currentVal)));
      const arrowColor = isImprovement ? '#00fff2' : '#ff6644';
      const valColor = isImprovement ? '#00ff66' : '#ff6644';
      nextCell = `
        <span style="color:${arrowColor};margin:0 4px;">&#8594;</span>
        <span style="color:${valColor};">${nextVal}</span>
      `;
    }

    rows += `
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:5px 0;
        border-bottom:1px solid rgba(255,255,255,0.06);
        font-family:'Share Tech Mono',monospace;
        font-size:0.6rem;
        letter-spacing:1px;
      ">
        <span style="color:rgba(255,255,255,0.45);min-width:90px;">${(typeof t === 'function' ? t('stat.' + key) : '') || def.label}</span>
        <span style="display:flex;align-items:center;gap:2px;">
          <span style="color:#fff;">${currentVal}</span>
          ${nextCell}
        </span>
      </div>
    `;
  }

  return `
    <div style="margin:10px 0 4px;">
      <div style="
        font-family:'Share Tech Mono',monospace;
        font-size:0.5rem;
        letter-spacing:3px;
        color:rgba(255,255,255,0.25);
        margin-bottom:6px;
      ">${(typeof t === 'function' ? t('abilities.stats') : 'ESTADISTICAS')}</div>
      ${rows}
    </div>
  `;
}

function openModal(ab) {
  if (typeof playSelectSound === 'function') playSelectSound();

  const rarity = RARITY[ab.rarity];
  const info = getProgressInfo(ab.id);
  const isEquipped = equippedAbilities.includes(ab.id);
  const hasCards = info.level >= 1;
  const slotsAvailable = equippedAbilities.length < MAX_EQUIPPED;
  const isMax = info.level >= MAX_LEVEL;

  // ── Progress bar ──
  const progressPct = Math.round(info.pct * 100);
  const progressBarHTML = `
    <div style="
      width:100%;
      height:4px;
      background:rgba(255,255,255,0.08);
      border-radius:2px;
      overflow:hidden;
      margin:6px 0 3px;
    ">
      <div style="
        width:${progressPct}%;
        height:100%;
        background:${rarity.color};
        box-shadow:0 0 6px ${rarity.color};
        border-radius:2px;
        transition:width 0.4s ease;
      "></div>
    </div>
  `;

  // ── Level label ──
  let levelLabel;
  if (info.level === 0) {
    levelLabel = `<span style="color:rgba(255,255,255,0.25);font-size:0.6rem;letter-spacing:2px;">${(typeof t === 'function' ? t('abilities.no_cards') : 'SIN CARTAS')}</span>`;
  } else if (isMax) {
    levelLabel = `<span style="color:#ffaa00;text-shadow:0 0 8px rgba(255,170,0,0.6);font-size:0.65rem;letter-spacing:2px;">${(typeof t === 'function' ? t('abilities.lvl_max') : 'LVL MAX')}</span>`;
  } else {
    levelLabel = `<span style="color:${rarity.color};text-shadow:0 0 6px ${rarity.color};font-size:0.65rem;letter-spacing:2px;">${(typeof t === 'function' ? t('abilities.lvl') : 'LVL')} ${info.level}</span>`;
  }

  // ── Upgrade section ──
  let upgradeHTML = '';
  if (hasCards && !isMax) {
    const silverCost = getSilverCost(ab.rarity, info.level);
    const cardsReady = info.cardsTowardNext >= info.cardsNeeded;
    const silverReady = serverSilver >= silverCost;
    const canUpgrade = cardsReady && silverReady;
    const cardsMissing = Math.max(0, info.cardsNeeded - info.cardsTowardNext);

    let hintHTML = '';
    if (!cardsReady) {
      hintHTML = `<div style="
        font-family:'Share Tech Mono',monospace;
        font-size:0.5rem;
        color:rgba(255,100,68,0.7);
        letter-spacing:1px;
        margin-top:4px;
      ">${(typeof t === 'function' ? t('abilities.missing_cards', {n: cardsMissing}) : 'FALTAN ' + cardsMissing + ' CARTAS')}</div>`;
    } else if (!silverReady) {
      hintHTML = `<div style="
        font-family:'Share Tech Mono',monospace;
        font-size:0.5rem;
        color:rgba(255,100,68,0.7);
        letter-spacing:1px;
        margin-top:4px;
      ">${(typeof t === 'function' ? t('abilities.missing_silver') : 'FALTA PLATA')}</div>`;
    }

    upgradeHTML = `
      <div style="margin-top:14px;">
        <button id="modal-upgrade-btn" style="
          font-family:'Orbitron',sans-serif;
          font-size:0.6rem;
          font-weight:700;
          letter-spacing:2px;
          padding:10px 20px;
          width:100%;
          border:1px solid ${canUpgrade ? 'rgba(0,255,102,0.45)' : 'rgba(192,192,192,0.2)'};
          background:${canUpgrade ? 'rgba(0,255,102,0.07)' : 'rgba(192,192,192,0.04)'};
          color:${canUpgrade ? '#00ff66' : 'rgba(192,192,192,0.35)'};
          cursor:${canUpgrade ? 'pointer' : 'not-allowed'};
          text-shadow:${canUpgrade ? '0 0 8px rgba(0,255,102,0.4)' : 'none'};
          box-shadow:${canUpgrade ? '0 0 8px rgba(0,255,102,0.08)' : 'none'};
          transition:all 0.2s ease;
        " ${canUpgrade ? '' : 'disabled'}>
          ${(typeof t === 'function' ? t('abilities.upgrade') : 'MEJORAR')}
          <span style="
            display:block;
            font-family:'Share Tech Mono',monospace;
            font-size:0.55rem;
            letter-spacing:1px;
            opacity:0.75;
            margin-top:2px;
          ">${silverCost.toLocaleString()} <span style="color:#c0c0c0;">SLV</span></span>
        </button>
        ${hintHTML}
      </div>
    `;
  }

  // ── Equip / Unequip button ──
  let equipHTML = '';
  if (hasCards) {
    if (isEquipped) {
      equipHTML = `
        <button id="modal-equip-btn" style="
          font-family:'Orbitron',sans-serif;
          font-size:0.6rem;
          font-weight:700;
          letter-spacing:2px;
          padding:10px 20px;
          width:100%;
          margin-top:8px;
          border:1px solid rgba(255,102,68,0.4);
          background:rgba(255,68,34,0.07);
          color:#ff6644;
          cursor:pointer;
          text-shadow:0 0 8px rgba(255,102,68,0.4);
          box-shadow:0 0 8px rgba(255,68,34,0.08);
          transition:all 0.2s ease;
        ">${(typeof t === 'function' ? t('abilities.unequip') : 'DESEQUIPAR')}</button>
      `;
    } else {
      const noSlots = !slotsAvailable;
      equipHTML = `
        <button id="modal-equip-btn" style="
          font-family:'Orbitron',sans-serif;
          font-size:0.6rem;
          font-weight:700;
          letter-spacing:2px;
          padding:10px 20px;
          width:100%;
          margin-top:8px;
          border:1px solid ${noSlots ? 'rgba(255,255,255,0.1)' : 'rgba(0,255,242,0.4)'};
          background:${noSlots ? 'transparent' : 'rgba(0,255,242,0.07)'};
          color:${noSlots ? 'rgba(255,255,255,0.22)' : '#00fff2'};
          cursor:${noSlots ? 'not-allowed' : 'pointer'};
          text-shadow:${noSlots ? 'none' : '0 0 8px rgba(0,255,242,0.4)'};
          box-shadow:${noSlots ? 'none' : '0 0 8px rgba(0,255,242,0.08)'};
          transition:all 0.2s ease;
        " ${noSlots ? 'disabled' : ''}>${(typeof t === 'function' ? t('abilities.equip') : 'EQUIPAR')}</button>
      `;
    }
  }

  // ── Stats table ──
  const statsTableHTML = buildStatsTableHTML(ab, info);

  // ── Assemble modal ──
  const overlay = document.createElement('div');
  overlay.id = 'ability-modal-overlay';
  overlay.style.cssText = `
    position:fixed;
    top:0;left:0;right:0;bottom:0;
    background:rgba(0,0,5,0.92);
    z-index:9999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    box-sizing:border-box;
  `;

  overlay.innerHTML = `
    <div style="
      background:rgba(4,4,18,0.98);
      border:1px solid ${rarity.border};
      box-shadow:0 0 30px ${rarity.color}22, inset 0 0 30px rgba(0,0,0,0.5);
      max-width:340px;
      width:100%;
      max-height:90vh;
      overflow-y:auto;
      padding:20px;
      box-sizing:border-box;
      position:relative;
    ">

      <!-- HEADER -->
      <div style="
        display:flex;
        align-items:center;
        gap:14px;
        padding-bottom:14px;
        border-bottom:1px solid rgba(255,255,255,0.07);
        margin-bottom:14px;
      ">
        <div style="
          font-size:2.4rem;
          color:${rarity.color};
          text-shadow:0 0 20px ${rarity.color}, 0 0 40px ${rarity.color}66;
          flex-shrink:0;
        ">${ab.icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="
            font-family:'Orbitron',sans-serif;
            font-size:0.9rem;
            font-weight:900;
            letter-spacing:3px;
            color:${rarity.color};
            text-shadow:0 0 8px ${rarity.color}88;
            margin-bottom:5px;
          ">${(typeof t === 'function' ? t('ability.' + ab.id) : ab.name)}</div>
          <span style="
            font-family:'Share Tech Mono',monospace;
            font-size:0.5rem;
            letter-spacing:3px;
            padding:2px 7px;
            border:1px solid ${rarity.border};
            color:${rarity.color};
          ">${(typeof t === 'function' ? t('rarity.' + ab.rarity) : rarity.label)}</span>
          ${isEquipped ? `<span style="
            font-family:'Share Tech Mono',monospace;
            font-size:0.48rem;
            letter-spacing:2px;
            color:#00ff66;
            padding:1px 6px;
            border:1px solid rgba(0,255,102,0.35);
            background:rgba(0,255,102,0.08);
            margin-left:6px;
          ">${(typeof t === 'function' ? t('abilities.equipped_badge') : 'EQUIPADO')}</span>` : ''}
        </div>
      </div>

      <!-- DESCRIPTION -->
      <div style="
        font-family:'Share Tech Mono',monospace;
        font-size:0.63rem;
        letter-spacing:1px;
        color:rgba(255,255,255,0.45);
        line-height:1.5;
        margin-bottom:14px;
      ">${(typeof t === 'function' ? t('ability.' + ab.id + '.desc') : ab.description)}</div>

      <!-- LEVEL + PROGRESS -->
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom:2px;
      ">
        ${levelLabel}
        <span style="
          font-family:'Share Tech Mono',monospace;
          font-size:0.52rem;
          letter-spacing:1px;
          color:rgba(255,255,255,0.3);
        ">${info.level > 0 && !isMax ? info.cardsTowardNext + ' / ' + info.cardsNeeded + ' ' + (typeof t === 'function' ? t('abilities.cards') : 'CARTAS') : ''}</span>
      </div>
      ${!isMax ? progressBarHTML : ''}

      <!-- STATS TABLE -->
      ${statsTableHTML}

      <!-- UPGRADE -->
      ${upgradeHTML}

      <!-- EQUIP / UNEQUIP -->
      ${equipHTML}

      <!-- CLOSE -->
      <button id="modal-close-btn" style="
        font-family:'Orbitron',sans-serif;
        font-size:0.55rem;
        font-weight:700;
        letter-spacing:3px;
        padding:10px 20px;
        width:100%;
        margin-top:12px;
        border:1px solid rgba(255,255,255,0.12);
        background:rgba(255,255,255,0.03);
        color:rgba(255,255,255,0.4);
        cursor:pointer;
        transition:all 0.2s ease;
      ">${(typeof t === 'function' ? t('settings.close') : 'CERRAR')}</button>

    </div>
  `;

  document.body.appendChild(overlay);

  // ── Wire modal buttons ──
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.07)';
      closeBtn.style.borderColor = 'rgba(255,255,255,0.25)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.03)';
      closeBtn.style.borderColor = 'rgba(255,255,255,0.12)';
    });
  }

  const upgradeBtn = document.getElementById('modal-upgrade-btn');
  if (upgradeBtn && !upgradeBtn.disabled) {
    upgradeBtn.addEventListener('click', async () => {
      await upgradeAbility(ab.id);
      closeModal(false);
      openModal(ab);
    });
    upgradeBtn.addEventListener('mouseenter', () => {
      upgradeBtn.style.background = 'rgba(0,255,102,0.13)';
      upgradeBtn.style.borderColor = 'rgba(0,255,102,0.65)';
    });
    upgradeBtn.addEventListener('mouseleave', () => {
      upgradeBtn.style.background = 'rgba(0,255,102,0.07)';
      upgradeBtn.style.borderColor = 'rgba(0,255,102,0.45)';
    });
  }

  const equipBtn = document.getElementById('modal-equip-btn');
  if (equipBtn && !equipBtn.disabled) {
    equipBtn.addEventListener('click', async () => {
      if (typeof playSelectSound === 'function') playSelectSound();
      if (isEquipped) {
        await unequipAbility(ab.id);
      } else {
        await equipAbility(ab.id);
      }
      closeModal(false);
      openModal(ab);
    });
  }

  // Close on overlay backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function closeModal(playSound = true) {
  if (playSound && typeof playSelectSound === 'function') playSelectSound();
  const overlay = document.getElementById('ability-modal-overlay');
  if (overlay) overlay.remove();
}

// ═══════════════════════════════════════════
//  RENDER — Simplified grid cards
// ═══════════════════════════════════════════

function renderAbilities() {
  const grid = document.getElementById('abilities-grid');
  grid.innerHTML = '';

  ABILITIES.forEach(ab => {
    const rarity = RARITY[ab.rarity];
    const info = getProgressInfo(ab.id);
    const isEquipped = equippedAbilities.includes(ab.id);
    const hasCards = info.level >= 1;
    const isMax = info.level >= MAX_LEVEL;

    // Upgrade available indicator
    let canUpgrade = false;
    if (hasCards && !isMax) {
      const silverCost = getSilverCost(ab.rarity, info.level);
      const cardsReady = info.cardsTowardNext >= info.cardsNeeded;
      const silverReady = serverSilver >= silverCost;
      canUpgrade = cardsReady && silverReady;
    }

    const card = document.createElement('div');
    card.className = [
      'ability-card',
      hasCards ? 'has-cards' : '',
      isEquipped ? 'equipped' : '',
    ].filter(Boolean).join(' ');
    card.style.setProperty('--rarity-color', rarity.color);
    card.style.cursor = 'pointer';
    card.style.userSelect = 'none';

    const iconColor = hasCards ? rarity.color : 'rgba(255,255,255,0.14)';
    const iconGlow  = hasCards ? `0 0 14px ${rarity.color}` : 'none';

    // LVL badge
    let lvlBadgeHTML;
    if (!hasCards) {
      lvlBadgeHTML = `<span style="
        font-family:'Orbitron',sans-serif;
        font-size:0.48rem;
        letter-spacing:2px;
        color:rgba(255,255,255,0.18);
      ">${(typeof t === 'function' ? t('abilities.no_cards') : 'SIN CARTAS')}</span>`;
    } else if (isMax) {
      lvlBadgeHTML = `<span style="
        font-family:'Orbitron',sans-serif;
        font-size:0.52rem;
        font-weight:700;
        letter-spacing:2px;
        color:#ffaa00;
        text-shadow:0 0 6px rgba(255,170,0,0.6);
      ">${(typeof t === 'function' ? t('abilities.lvl_max') : 'LVL MAX')}</span>`;
    } else {
      lvlBadgeHTML = `<span style="
        font-family:'Orbitron',sans-serif;
        font-size:0.52rem;
        font-weight:700;
        letter-spacing:2px;
        color:${rarity.color};
        text-shadow:0 0 5px ${rarity.color};
      ">${(typeof t === 'function' ? t('abilities.lvl') : 'LVL')} ${info.level}</span>`;
    }

    // Upgrade arrow indicator (top-right)
    const upgradeArrow = canUpgrade ? `
      <div style="
        position:absolute;
        top:6px;
        right:8px;
        color:#00ff66;
        font-size:0.75rem;
        text-shadow:0 0 8px #00ff66;
        line-height:1;
      ">&#11014;</div>
    ` : '';

    // Equipped dot indicator
    const equippedDot = isEquipped ? `
      <div style="
        width:7px;
        height:7px;
        border-radius:50%;
        background:#00ff66;
        box-shadow:0 0 6px #00ff66;
        flex-shrink:0;
      "></div>
    ` : '';

    card.innerHTML = `
      ${upgradeArrow}

      <!-- Icon -->
      <div class="ab-icon-col" style="color:${iconColor};text-shadow:${iconGlow};">${ab.icon}</div>

      <!-- Center body -->
      <div style="
        flex:1;
        display:flex;
        flex-direction:column;
        justify-content:center;
        gap:5px;
        padding:14px 10px 14px 0;
        min-width:0;
      ">
        <!-- Name row -->
        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
          <span style="
            font-family:'Orbitron',sans-serif;
            font-size:0.82rem;
            font-weight:900;
            letter-spacing:2px;
            color:${hasCards ? rarity.color : 'rgba(255,255,255,0.22)'};
          ">${(typeof t === 'function' ? t('ability.' + ab.id) : ab.name)}</span>
          <span style="
            font-family:'Share Tech Mono',monospace;
            font-size:0.48rem;
            letter-spacing:2px;
            padding:2px 6px;
            border:1px solid ${rarity.border};
            color:${rarity.color};
            opacity:${hasCards ? 1 : 0.4};
          ">${(typeof t === 'function' ? t('rarity.' + ab.rarity) : rarity.label)}</span>
        </div>

        <!-- Level + equipped dot -->
        <div style="display:flex;align-items:center;gap:8px;">
          ${lvlBadgeHTML}
          ${equippedDot}
        </div>
      </div>
    `;

    // Tap to open detail modal
    card.addEventListener('click', () => openModal(ab));

    grid.appendChild(card);
  });

  // ── Back button sound (wired once) ──
  const backBtn = document.querySelector('.back-btn');
  if (backBtn && !backBtn._soundBound) {
    backBtn._soundBound = true;
    backBtn.addEventListener('click', () => {
      if (typeof playSelectSound === 'function') playSelectSound();
    });
  }
}

// ── Upgrade (costs cards + silver) ──
async function upgradeAbility(abilityId) {
  try {
    const res = await fetch('/api/abilities/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abilityId }),
    });
    const data = await res.json();
    if (res.ok) {
      if (typeof playBuySound === 'function') playBuySound();
      abilityLevels[abilityId] = data.newLevel;
      serverSilver = data.silverCoins;
      updateUI();
    } else {
      if (typeof playDenySound === 'function') playDenySound();
    }
  } catch (e) {
    if (typeof playDenySound === 'function') playDenySound();
  }
}

// ── Equip / Unequip ──
async function equipAbility(abilityId) {
  if (equippedAbilities.length >= MAX_EQUIPPED) return;
  try {
    const res = await fetch('/api/abilities/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abilityId }),
    });
    if (res.ok) {
      const data = await res.json();
      equippedAbilities = data.equippedAbilities;
      updateUI();
    }
  } catch (e) {}
}

async function unequipAbility(abilityId) {
  try {
    const res = await fetch('/api/abilities/unequip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abilityId }),
    });
    if (res.ok) {
      const data = await res.json();
      equippedAbilities = data.equippedAbilities;
      updateUI();
    }
  } catch (e) {}
}

// ── Init ──
loadData();
