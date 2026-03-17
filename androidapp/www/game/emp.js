// ═══════════════════════════════════════════
//  emp.js — Generic ability engine supporting 120+ abilities
//  Uses mechanic_type dispatch instead of per-ability functions
//  Original 6 abilities keep exact mechanics; all others use generic handlers
//  Depends on: config.js, server-data.js, particles.js
// ═══════════════════════════════════════════

// ── ABILITY_DEFS: compact stats + mechanic_type for all abilities ──
const ABILITY_DEFS = {
  // ── Original 6 (exact mechanics preserved) ──
  emp:       { type: 'emp_original',      stats: { baseDamage: 60, damagePerLevel: 8, baseRadius: 350, radiusPerLevel: 15, baseCooldown: 600, cooldownPerLevel: -15 } },
  shield:    { type: 'shield_original',   stats: { baseAbsorb: 50, absorbPerLevel: 10, baseDuration: 300, durationPerLevel: 10, baseCooldown: 900, cooldownPerLevel: -20 } },
  rapidfire: { type: 'rapidfire_original',stats: { baseBoost: 0.5, boostPerLevel: 0.03, baseDuration: 240, durationPerLevel: 8, baseCooldown: 1200, cooldownPerLevel: -25 } },
  chain:     { type: 'chain_original',    stats: { baseDamage: 40, damagePerLevel: 6, baseBounces: 3, bouncesPerLevel: 0.5, baseCooldown: 720, cooldownPerLevel: -15 } },
  freeze:    { type: 'freeze_original',   stats: { baseSlow: 0.5, slowPerLevel: 0.015, baseDuration: 180, durationPerLevel: 8, baseCooldown: 1500, cooldownPerLevel: -30, baseRadius: 400, radiusPerLevel: 15 } },
  orbital:   { type: 'orbital_original',  stats: { baseDamage: 300, damagePerLevel: 25, baseRadius: 500, radiusPerLevel: 20, baseCooldown: 2700, cooldownPerLevel: -50 } },

  // ── New abilities ──
  plasma_burst:          { type: 'instant_damage', stats: { baseDamage: 40, damagePerLevel: 8, baseCooldown: 420, cooldownPerLevel: -15, baseProjectiles: 8, projectilesPerLevel: 0, baseRange: 300, rangePerLevel: 10 } },
  static_field:          { type: 'zone',           stats: { baseDamage: 10, damagePerLevel: 2, baseCooldown: 600, cooldownPerLevel: -20, baseRadius: 120, radiusPerLevel: 8, baseDuration: 300, durationPerLevel: 10 } },
  repair_nanobots:       { type: 'heal',           stats: { baseHeal: 30, healPerLevel: 10, baseCooldown: 720, cooldownPerLevel: -20 } },
  shrapnel_mine:         { type: 'summon',         stats: { baseDamage: 80, damagePerLevel: 15, baseCooldown: 480, cooldownPerLevel: -15, baseMines: 1, minesPerLevel: 0, baseTriggerRadius: 40, triggerRadiusPerLevel: 3 } },
  targeting_boost:       { type: 'buff',           stats: { baseBoost: 0.3, boostPerLevel: 0.05, baseCooldown: 540, cooldownPerLevel: -15, baseDuration: 360, durationPerLevel: 12 } },
  poison_spray:          { type: 'dot',            stats: { baseDotDamage: 8, dotDamagePerLevel: 2, baseCooldown: 480, cooldownPerLevel: -12, baseDuration: 240, durationPerLevel: 8, baseConeAngle: 60, coneAnglePerLevel: 2, baseConeRange: 250, coneRangePerLevel: 10 } },
  energy_wall:           { type: 'zone',           stats: { baseSlowAmount: 0.4, slowAmountPerLevel: 0.05, baseCooldown: 540, cooldownPerLevel: -15, baseDuration: 180, durationPerLevel: 10, baseRadius: 150, radiusPerLevel: 8 } },
  scatter_shot:          { type: 'instant_damage', stats: { baseDamage: 25, damagePerLevel: 5, baseCooldown: 360, cooldownPerLevel: -10, baseProjectiles: 12, projectilesPerLevel: 1, baseRange: 280, rangePerLevel: 8 } },
  blind_flash:           { type: 'debuff',         stats: { baseStunDuration: 90, stunDurationPerLevel: 8, baseCooldown: 600, cooldownPerLevel: -15, baseRadius: 200, radiusPerLevel: 10 } },
  bullet_magnet:         { type: 'buff',           stats: { baseBoost: 0.08, boostPerLevel: 0.01, baseCooldown: 480, cooldownPerLevel: -12, baseDuration: 240, durationPerLevel: 10 } },
  gravity_pull:          { type: 'utility',        stats: { basePullForce: 80, pullForcePerLevel: 10, baseCooldown: 540, cooldownPerLevel: -12, baseDuration: 60, durationPerLevel: 5 } },
  armor_plating:         { type: 'buff',           stats: { baseBoost: 10, boostPerLevel: 3, baseCooldown: 720, cooldownPerLevel: -18, baseDuration: 360, durationPerLevel: 12 } },
  spark_trail:           { type: 'buff',           stats: { baseBoost: 5, boostPerLevel: 1, baseCooldown: 600, cooldownPerLevel: -15, baseDuration: 180, durationPerLevel: 8 } },
  micro_missiles:        { type: 'instant_damage', stats: { baseDamage: 35, damagePerLevel: 7, baseCooldown: 480, cooldownPerLevel: -12, baseProjectiles: 4, projectilesPerLevel: 1, baseRange: 400, rangePerLevel: 10 } },
  decoy_signal:          { type: 'utility',        stats: { baseCooldown: 720, cooldownPerLevel: -20, baseDuration: 240, durationPerLevel: 12 } },
  voltaic_aura:          { type: 'zone',           stats: { baseDamage: 8, damagePerLevel: 2, baseCooldown: 600, cooldownPerLevel: -15, baseRadius: 100, radiusPerLevel: 5, baseDuration: 300, durationPerLevel: 10 } },
  grease_slick:          { type: 'zone',           stats: { baseSlowAmount: 0.5, slowAmountPerLevel: 0.03, baseCooldown: 480, cooldownPerLevel: -12, baseDuration: 360, durationPerLevel: 15, baseRadius: 90, radiusPerLevel: 6 } },
  ricochet_round:        { type: 'instant_damage', stats: { baseDamage: 55, damagePerLevel: 10, baseCooldown: 360, cooldownPerLevel: -10, baseRange: 350, rangePerLevel: 10 } },
  smoke_screen:          { type: 'debuff',         stats: { baseSlowAmount: 0.3, slowAmountPerLevel: 0.03, baseCooldown: 540, cooldownPerLevel: -12, baseDuration: 300, durationPerLevel: 12, baseRadius: 180, radiusPerLevel: 8 } },
  overcharge_shot:       { type: 'instant_damage', stats: { baseDamage: 90, damagePerLevel: 15, baseCooldown: 480, cooldownPerLevel: -12, baseRange: 500, rangePerLevel: 10 } },
  seismic_tap:           { type: 'utility',        stats: { baseKnockback: 60, knockbackPerLevel: 8, baseCooldown: 420, cooldownPerLevel: -10, baseRadius: 250, radiusPerLevel: 10 } },
  turret_overclock:      { type: 'buff',           stats: { baseBoost: 0.5, boostPerLevel: 0.05, baseCooldown: 720, cooldownPerLevel: -18, baseDuration: 240, durationPerLevel: 10 } },
  acid_splash:           { type: 'debuff',         stats: { baseDamageAmplify: 0.2, damageAmplifyPerLevel: 0.03, baseCooldown: 540, cooldownPerLevel: -12, baseDuration: 300, durationPerLevel: 10, baseRadius: 200, radiusPerLevel: 10 } },
  burst_shield:          { type: 'shield',         stats: { baseAbsorb: 999, absorbPerLevel: 0, baseCooldown: 600, cooldownPerLevel: -15, baseDuration: 120, durationPerLevel: 0 } },
  energy_spike:          { type: 'instant_damage', stats: { baseDamage: 70, damagePerLevel: 12, baseCooldown: 420, cooldownPerLevel: -10, baseRadius: 50, radiusPerLevel: 3 } },
  hail_storm:            { type: 'aoe',            stats: { baseDamage: 12, damagePerLevel: 2, baseCooldown: 480, cooldownPerLevel: -12, baseRadius: 300, radiusPerLevel: 10 } },
  crit_boost:            { type: 'buff',           stats: { baseBoost: 0.4, boostPerLevel: 0.05, baseCooldown: 720, cooldownPerLevel: -18, baseDuration: 360, durationPerLevel: 12 } },
  web_trap:              { type: 'debuff',         stats: { baseStunDuration: 180, stunDurationPerLevel: 12, baseCooldown: 480, cooldownPerLevel: -12, baseRadius: 150, radiusPerLevel: 8 } },
  flare_launch:          { type: 'utility',        stats: { baseCooldown: 600, cooldownPerLevel: -15, baseDuration: 300, durationPerLevel: 10 } },
  repulsor_blast:        { type: 'utility',        stats: { baseRepulseForce: 120, repulseForcePerLevel: 15, baseCooldown: 540, cooldownPerLevel: -12 } },
  twin_barrels:          { type: 'buff',           stats: { baseBoost: 0.5, boostPerLevel: 0.05, baseCooldown: 900, cooldownPerLevel: -25, baseDuration: 300, durationPerLevel: 12 } },
  chain_burn:            { type: 'dot',            stats: { baseDotDamage: 12, dotDamagePerLevel: 2, baseCooldown: 720, cooldownPerLevel: -20, baseDuration: 240, durationPerLevel: 8, baseRadius: 100, radiusPerLevel: 8 } },
  void_rift:             { type: 'zone',           stats: { baseDamage: 15, damagePerLevel: 3, baseCooldown: 1080, cooldownPerLevel: -25, baseDuration: 240, durationPerLevel: 10, baseRadius: 100, radiusPerLevel: 8 } },
  kill_trigger_bomb:     { type: 'triggered',      stats: { baseDamage: 90, damagePerLevel: 18, baseCooldown: 840, cooldownPerLevel: -20, baseRadius: 150, radiusPerLevel: 10 } },
  drone_sentry:          { type: 'summon',         stats: { baseDamage: 20, damagePerLevel: 4, baseCooldown: 1200, cooldownPerLevel: -30, baseDuration: 600, durationPerLevel: 20, baseCount: 1, countPerLevel: 0 } },
  lifesteal_rounds:      { type: 'buff',           stats: { baseBoost: 0.1, boostPerLevel: 0.02, baseCooldown: 1080, cooldownPerLevel: -25, baseDuration: 360, durationPerLevel: 12 } },
  tesla_coil:            { type: 'summon',         stats: { baseDamage: 18, damagePerLevel: 4, baseCooldown: 1080, cooldownPerLevel: -25, baseDuration: 480, durationPerLevel: 15, baseCount: 1, countPerLevel: 0 } },
  mirror_wall:           { type: 'summon',         stats: { baseDamage: 15, damagePerLevel: 3, baseCooldown: 900, cooldownPerLevel: -22, baseDuration: 300, durationPerLevel: 12, baseCount: 1, countPerLevel: 0 } },
  vulnerability_mark:    { type: 'debuff',         stats: { baseDamageAmplify: 0.35, damageAmplifyPerLevel: 0.05, baseCooldown: 900, cooldownPerLevel: -22, baseDuration: 480, durationPerLevel: 15, baseRadius: 400, radiusPerLevel: 10 } },
  phantom_barrage:       { type: 'instant_damage', stats: { baseDamage: 30, damagePerLevel: 6, baseCooldown: 840, cooldownPerLevel: -20, baseProjectiles: 20, projectilesPerLevel: 2, baseRange: 400, rangePerLevel: 10 } },
  time_slow_field:       { type: 'zone',           stats: { baseSlowAmount: 0.8, slowAmountPerLevel: 0.02, baseCooldown: 1200, cooldownPerLevel: -28, baseDuration: 300, durationPerLevel: 12, baseRadius: 180, radiusPerLevel: 10 } },
  concussive_blast:      { type: 'aoe',            stats: { baseDamage: 60, damagePerLevel: 12, baseCooldown: 900, cooldownPerLevel: -22, baseRadius: 220, radiusPerLevel: 10 } },
  orbital_mine_ring:     { type: 'summon',         stats: { baseDamage: 75, damagePerLevel: 15, baseCooldown: 1080, cooldownPerLevel: -25, baseCount: 6, countPerLevel: 1, baseRadius: 200, radiusPerLevel: 10 } },
  shockwave_pulse:       { type: 'aoe',            stats: { baseDamage: 45, damagePerLevel: 9, baseCooldown: 840, cooldownPerLevel: -20, baseRadius: 300, radiusPerLevel: 12 } },
  elemental_infusion:    { type: 'buff',           stats: { baseBoost: 0.3, boostPerLevel: 0.03, baseCooldown: 960, cooldownPerLevel: -22, baseDuration: 360, durationPerLevel: 12 } },
  spectral_copy:         { type: 'summon',         stats: { baseDamage: 15, damagePerLevel: 3, baseCooldown: 1080, cooldownPerLevel: -25, baseDuration: 240, durationPerLevel: 10, baseCount: 1, countPerLevel: 0 } },
  execute_protocol:      { type: 'instant_damage', stats: { baseDamage: 99999, damagePerLevel: 0, baseCooldown: 1500, cooldownPerLevel: -35, baseRange: 9999, rangePerLevel: 0 } },
  nano_swarm:            { type: 'dot',            stats: { baseDotDamage: 10, dotDamagePerLevel: 2, baseCooldown: 900, cooldownPerLevel: -22, baseDuration: 360, durationPerLevel: 12, baseRadius: 250, radiusPerLevel: 10 } },
  kinetic_surge:         { type: 'instant_damage', stats: { baseDamage: 120, damagePerLevel: 20, baseCooldown: 1200, cooldownPerLevel: -28, baseRange: 500, rangePerLevel: 10 } },
  scatter_mines:         { type: 'summon',         stats: { baseDamage: 65, damagePerLevel: 12, baseCooldown: 900, cooldownPerLevel: -22, baseCount: 8, countPerLevel: 1, baseRadius: 35, radiusPerLevel: 2 } },
  pulse_shield:          { type: 'shield',         stats: { baseAbsorb: 150, absorbPerLevel: 25, baseCooldown: 1080, cooldownPerLevel: -25, baseDuration: 240, durationPerLevel: 10 } },
  dark_matter_round:     { type: 'instant_damage', stats: { baseDamage: 50, damagePerLevel: 10, baseCooldown: 840, cooldownPerLevel: -20, baseRange: 500, rangePerLevel: 10 } },
  beacon_of_weakness:    { type: 'debuff',         stats: { baseDamageAmplify: 0.3, damageAmplifyPerLevel: 0.03, baseCooldown: 1080, cooldownPerLevel: -25, baseDuration: 480, durationPerLevel: 15, baseRadius: 200, radiusPerLevel: 10 } },
  blackhole_seed:        { type: 'unique',         stats: { baseDamage: 200, damagePerLevel: 35, baseCooldown: 1800, cooldownPerLevel: -40, baseDuration: 360, durationPerLevel: 12, baseRadius: 300, radiusPerLevel: 15 } },
  bullet_storm:          { type: 'aoe',            stats: { baseDamage: 15, damagePerLevel: 3, baseCooldown: 1800, cooldownPerLevel: -40, baseRadius: 600, radiusPerLevel: 10 } },
  time_reversal:         { type: 'unique',         stats: { baseCooldown: 2100, cooldownPerLevel: -45, baseDamage: 0, damagePerLevel: 0 } },
  ion_cannon:            { type: 'instant_damage', stats: { baseDamage: 150, damagePerLevel: 25, baseCooldown: 1800, cooldownPerLevel: -40, baseRange: 9999, rangePerLevel: 0 } },
  quantum_mirror:        { type: 'buff',           stats: { baseBoost: 0.7, boostPerLevel: 0.05, baseCooldown: 1500, cooldownPerLevel: -35, baseDuration: 300, durationPerLevel: 12 } },
  plague_cloud:          { type: 'zone',           stats: { baseDamage: 15, damagePerLevel: 3, baseSlowAmount: 0.4, slowAmountPerLevel: 0.03, baseCooldown: 2100, cooldownPerLevel: -45, baseDuration: 480, durationPerLevel: 15, baseRadius: 300, radiusPerLevel: 15 } },
  turret_fortress:       { type: 'summon',         stats: { baseDamage: 25, damagePerLevel: 5, baseCooldown: 1800, cooldownPerLevel: -40, baseDuration: 600, durationPerLevel: 20, baseCount: 4, countPerLevel: 0 } },
  gravity_inverter:      { type: 'unique',         stats: { baseRepulseForce: 200, repulseForcePerLevel: 20, baseCooldown: 1500, cooldownPerLevel: -35, baseDuration: 180, durationPerLevel: 8 } },
  energy_leech:          { type: 'unique',         stats: { baseDamage: 30, damagePerLevel: 5, baseCooldown: 1800, cooldownPerLevel: -40, baseRadius: 350, radiusPerLevel: 15 } },
  cryo_freeze:           { type: 'debuff',         stats: { baseStunDuration: 180, stunDurationPerLevel: 10, baseCooldown: 2100, cooldownPerLevel: -45, baseRadius: 9999, radiusPerLevel: 0 } },
  death_mark:            { type: 'triggered',      stats: { baseDamage: 80, damagePerLevel: 15, baseCooldown: 1500, cooldownPerLevel: -35, baseRadius: 100, radiusPerLevel: 8 } },
  overload_field:        { type: 'unique',         stats: { baseCooldown: 1800, cooldownPerLevel: -40, baseDamage: 0, damagePerLevel: 0 } },
  antimatter_shell:      { type: 'instant_damage', stats: { baseDamage: 100, damagePerLevel: 18, baseCooldown: 1500, cooldownPerLevel: -35, baseRadius: 250, radiusPerLevel: 12 } },
  phase_shift:           { type: 'unique',         stats: { baseDamage: 120, damagePerLevel: 20, baseCooldown: 1800, cooldownPerLevel: -40, baseDuration: 120, durationPerLevel: 8, baseRadius: 200, radiusPerLevel: 10 } },
  gravity_well_array:    { type: 'summon',         stats: { baseDamage: 12, damagePerLevel: 2, baseCooldown: 2100, cooldownPerLevel: -45, baseDuration: 360, durationPerLevel: 12, baseCount: 4, countPerLevel: 0 } },
  singularity_bomb:      { type: 'unique',         stats: { baseDamage: 80, damagePerLevel: 12, baseCooldown: 1800, cooldownPerLevel: -40, baseRadius: 280, radiusPerLevel: 12 } },
  neural_disruptor:      { type: 'debuff',         stats: { baseStunDuration: 300, stunDurationPerLevel: 12, baseCooldown: 1800, cooldownPerLevel: -40, baseRadius: 9999, radiusPerLevel: 0 } },
  gravity_lens:          { type: 'buff',           stats: { baseBoost: 0.2, boostPerLevel: 0.03, baseCooldown: 1500, cooldownPerLevel: -35, baseDuration: 300, durationPerLevel: 12 } },
  chain_reaction:        { type: 'triggered',      stats: { baseDamage: 80, damagePerLevel: 15, baseCooldown: 1800, cooldownPerLevel: -40, baseRadius: 100, radiusPerLevel: 8 } },
  temporal_stasis:       { type: 'unique',         stats: { baseStunDuration: 240, stunDurationPerLevel: 12, baseCooldown: 2100, cooldownPerLevel: -45, baseDamage: 0, damagePerLevel: 0 } },
  photon_barrier:        { type: 'zone',           stats: { baseDamage: 30, damagePerLevel: 6, baseCooldown: 1800, cooldownPerLevel: -40, baseDuration: 360, durationPerLevel: 15, baseRadius: 500, radiusPerLevel: 0 } },
  power_surge:           { type: 'buff',           stats: { baseBoost: 3, boostPerLevel: 0.2, baseCooldown: 2100, cooldownPerLevel: -45, baseDuration: 240, durationPerLevel: 10 } },
  cosmic_ray:            { type: 'aoe',            stats: { baseDamage: 400, damagePerLevel: 60, baseCooldown: 2700, cooldownPerLevel: -55, baseRadius: 600, radiusPerLevel: 10 } },
  apocalypse_nova:       { type: 'aoe',            stats: { baseDamage: 250, damagePerLevel: 40, baseCooldown: 2400, cooldownPerLevel: -50, baseRadius: 9999, radiusPerLevel: 0 } },
  time_stop:             { type: 'unique',         stats: { baseStunDuration: 360, stunDurationPerLevel: 15, baseBoost: 2, boostPerLevel: 0.1, baseCooldown: 3000, cooldownPerLevel: -60, baseDuration: 360, durationPerLevel: 15 } },
  supernova_collapse:    { type: 'aoe',            stats: { baseDamage: 500, damagePerLevel: 80, baseCooldown: 2700, cooldownPerLevel: -55, baseRadius: 9999, radiusPerLevel: 0 } },
  dimensional_rift:      { type: 'unique',         stats: { baseDamage: 300, damagePerLevel: 50, baseCooldown: 2400, cooldownPerLevel: -50, baseRadius: 400, radiusPerLevel: 15 } },
  infinite_turret:       { type: 'summon',         stats: { baseDamage: 20, damagePerLevel: 3, baseCooldown: 2700, cooldownPerLevel: -55, baseDuration: 720, durationPerLevel: 25, baseCount: 8, countPerLevel: 1 } },
  total_annihilation:    { type: 'instant_damage', stats: { baseDamage: 999999, damagePerLevel: 0, baseCooldown: 3000, cooldownPerLevel: -60, baseRange: 9999, rangePerLevel: 0 } },
  vampire_field:         { type: 'unique',         stats: { baseDamage: 30, damagePerLevel: 5, baseCooldown: 2700, cooldownPerLevel: -55, baseDuration: 720, durationPerLevel: 20, baseRadius: 500, radiusPerLevel: 20 } },
  matrix_hack:           { type: 'unique',         stats: { baseDamage: 50, damagePerLevel: 8, baseCooldown: 2700, cooldownPerLevel: -55, baseDuration: 900, durationPerLevel: 25 } },
  solar_flare:           { type: 'unique',         stats: { baseDamage: 25, damagePerLevel: 5, baseBoost: 1, boostPerLevel: 0.1, baseCooldown: 2400, cooldownPerLevel: -50, baseDuration: 600, durationPerLevel: 20, baseRadius: 9999, radiusPerLevel: 0 } },
  omega_shield:          { type: 'shield',         stats: { baseAbsorb: 500, absorbPerLevel: 50, baseCooldown: 2700, cooldownPerLevel: -55, baseDuration: 480, durationPerLevel: 15 } },
  god_mode:              { type: 'buff',           stats: { baseBoost: 5, boostPerLevel: 0.3, baseCooldown: 3000, cooldownPerLevel: -60, baseDuration: 600, durationPerLevel: 20 } },
  paradox_loop:          { type: 'unique',         stats: { baseDamage: 0, damagePerLevel: 0, baseCooldown: 2700, cooldownPerLevel: -55, baseDuration: 480, durationPerLevel: 15 } },
  wrath_of_cosmos:       { type: 'aoe',            stats: { baseDamage: 120, damagePerLevel: 20, baseCooldown: 2400, cooldownPerLevel: -50, baseRadius: 80, radiusPerLevel: 5 } },
  infinity_mirror:       { type: 'unique',         stats: { baseBoost: 0.5, boostPerLevel: 0.05, baseCooldown: 2700, cooldownPerLevel: -55, baseDuration: 600, durationPerLevel: 20 } },
  reaper_scythe:         { type: 'aoe',            stats: { baseDamage: 350, damagePerLevel: 55, baseCooldown: 2700, cooldownPerLevel: -55, baseRadius: 9999, radiusPerLevel: 0 } },
  eternal_storm:         { type: 'unique',         stats: { baseDamage: 200, damagePerLevel: 30, baseCooldown: 3000, cooldownPerLevel: -60, baseDuration: 900, durationPerLevel: 25 } },
  void_collapse:         { type: 'unique',         stats: { baseDamage: 50, damagePerLevel: 5, baseCooldown: 2700, cooldownPerLevel: -55, baseRadius: 9999, radiusPerLevel: 0 } },
  cluster_bomb:          { type: 'aoe',            stats: { baseDamage: 55, damagePerLevel: 10, baseCooldown: 840, cooldownPerLevel: -20, baseRadius: 70, radiusPerLevel: 4 } },
  sonic_boom:            { type: 'debuff',         stats: { baseStunDuration: 180, stunDurationPerLevel: 10, baseKnockback: 80, knockbackPerLevel: 8, baseCooldown: 900, cooldownPerLevel: -22, baseRadius: 300, radiusPerLevel: 12 } },
  sniper_scope:          { type: 'buff',           stats: { baseBoost: 5, boostPerLevel: 0.3, baseCooldown: 1200, cooldownPerLevel: -28, baseDuration: 300, durationPerLevel: 12 } },
  overclock_ammo:        { type: 'buff',           stats: { baseBoost: 0.5, boostPerLevel: 0.05, baseCooldown: 900, cooldownPerLevel: -22, baseDuration: 300, durationPerLevel: 10 } },
  frost_nova:            { type: 'aoe',            stats: { baseDamage: 70, damagePerLevel: 12, baseCooldown: 1080, cooldownPerLevel: -25, baseRadius: 220, radiusPerLevel: 10 } },
  momentum_field:        { type: 'buff',           stats: { baseBoost: 0.3, boostPerLevel: 0.04, baseCooldown: 900, cooldownPerLevel: -22, baseDuration: 240, durationPerLevel: 10 } },
  toxin_canister:        { type: 'zone',           stats: { baseDamage: 8, damagePerLevel: 2, baseSlowAmount: 0.35, slowAmountPerLevel: 0.03, baseCooldown: 960, cooldownPerLevel: -22, baseDuration: 360, durationPerLevel: 12, baseRadius: 60, radiusPerLevel: 4 } },
  warp_field:            { type: 'buff',           stats: { baseBoost: 0.1, boostPerLevel: 0.02, baseCooldown: 1500, cooldownPerLevel: -35, baseDuration: 300, durationPerLevel: 12 } },
  temporal_dilation:     { type: 'unique',         stats: { baseBoost: 3, boostPerLevel: 0.2, baseCooldown: 2100, cooldownPerLevel: -45, baseDuration: 240, durationPerLevel: 10, baseRadius: 9999, radiusPerLevel: 0 } },
  spectral_bomb:         { type: 'triggered',      stats: { baseDamage: 180, damagePerLevel: 30, baseCooldown: 1800, cooldownPerLevel: -40, baseRadius: 180, radiusPerLevel: 10 } },
  rewind_damage:         { type: 'unique',         stats: { baseDamage: 0, damagePerLevel: 0, baseCooldown: 2100, cooldownPerLevel: -45 } },
  prism_array:           { type: 'buff',           stats: { baseBoost: 0.7, boostPerLevel: 0.05, baseCooldown: 1500, cooldownPerLevel: -35, baseDuration: 300, durationPerLevel: 12 } },
  dark_resonance:        { type: 'debuff',         stats: { baseDamageAmplify: 0.3, damageAmplifyPerLevel: 0.03, baseCooldown: 1800, cooldownPerLevel: -40, baseDuration: 480, durationPerLevel: 15, baseRadius: 9999, radiusPerLevel: 0 } },
  nanobot_swarm_repair:  { type: 'heal',           stats: { baseHeal: 80, healPerLevel: 15, baseCooldown: 1800, cooldownPerLevel: -40, baseDuration: 480, durationPerLevel: 15 } },
  entropy_bomb:          { type: 'unique',         stats: { baseDamage: 100, damagePerLevel: 15, baseCooldown: 2700, cooldownPerLevel: -55 } },
  legion_protocol:       { type: 'summon',         stats: { baseDamage: 30, damagePerLevel: 5, baseCooldown: 3000, cooldownPerLevel: -60, baseDuration: 900, durationPerLevel: 25, baseCount: 12, countPerLevel: 1 } },
  reality_fracture:      { type: 'unique',         stats: { baseBoost: 6, boostPerLevel: 0.5, baseCooldown: 3000, cooldownPerLevel: -60, baseDuration: 480, durationPerLevel: 15 } },
  mass_corruption:       { type: 'debuff',         stats: { baseDamageAmplify: 1, damageAmplifyPerLevel: 0.1, baseCooldown: 2700, cooldownPerLevel: -55, baseDuration: 600, durationPerLevel: 20, baseRadius: 9999, radiusPerLevel: 0 } },
  turret_ascension:      { type: 'buff',           stats: { baseBoost: 2, boostPerLevel: 0.1, baseCooldown: 3000, cooldownPerLevel: -60, baseDuration: 720, durationPerLevel: 25 } },
  nano_heal_aura:        { type: 'heal',           stats: { baseHeal: 50, healPerLevel: 10, baseCooldown: 1800, cooldownPerLevel: -40, baseDuration: 600, durationPerLevel: 20 } },
  overdrive_core:        { type: 'buff',           stats: { baseBoost: 3, boostPerLevel: 0.2, baseCooldown: 3000, cooldownPerLevel: -60, baseDuration: 600, durationPerLevel: 20 } },
  echo_blast:            { type: 'aoe',            stats: { baseDamage: 180, damagePerLevel: 30, baseCooldown: 2400, cooldownPerLevel: -50, baseRadius: 350, radiusPerLevel: 15 } },
};

// ── Runtime state ──
let abilityCooldowns    = {};
let abilityCooldownsMax = {};
let _globalAbilityDelay = 0;
const ABILITY_DELAY     = 60;

// Original 6 shared state (referenced by turret.js / enemies.js)
let shieldActive          = false;
let shieldHp              = 0;
let shieldTimer           = 0;

let rapidfireActive       = false;
let rapidfireTimer        = 0;
let currentRapidfireBoost = 0;

let freezeActive          = false;
let freezeTimer           = 0;
let currentFreezeSlowAmount = 0;

// Generic buff/debuff state
let _activeBuff   = null;
let _activeDebuff = null;

// Zone pool
let _activeZones = [];

// Summon pool
let _summons = [];

// Triggered ability state
let _triggeredAbilities = {};

// Unique ability state
let _uniqueState = {};

// Visual effect pools
let chainLightningLines = [];
let orbitalExplosions   = [];
let freezeRings         = [];
let shieldRingPulse     = 0;
let _genericRings       = []; // { x, y, radius, maxRadius, life, maxLife, color, style }
let _buffGlowTimer      = 0;
let _buffGlowColor      = '#00fff2';
let _droneAngleOffset   = 0;
// Projectile lines: { x1,y1,x2,y2,life,maxLife,color }
let _projectileLines    = [];
// Heal particles: { x, y, vy, life, maxLife }
let _healParticles      = [];
// DoT puff indicators: { x, y, life, maxLife, color }
let _dotPuffs           = [];
// Tendril lines for debuffs: { x1,y1,x2,y2,life,maxLife }
let _debuffTendrils     = [];
// Buff sparkles: { angle, dist, life, maxLife }
let _buffSparkles       = [];

// ── Reset (called from initGame) ──
function resetAbilities() {
  abilityCooldowns    = {};
  abilityCooldownsMax = {};
  _globalAbilityDelay = 0;

  shieldActive          = false;
  shieldHp              = 0;
  shieldTimer           = 0;
  rapidfireActive       = false;
  rapidfireTimer        = 0;
  currentRapidfireBoost = 0;
  freezeActive          = false;
  freezeTimer           = 0;
  currentFreezeSlowAmount = 0;

  _activeBuff   = null;
  _activeDebuff = null;
  _activeZones  = [];
  _summons      = [];
  _triggeredAbilities = {};
  _uniqueState  = {};

  chainLightningLines = [];
  orbitalExplosions   = [];
  freezeRings         = [];
  shieldRingPulse     = 0;
  _genericRings       = [];
  _buffGlowTimer      = 0;
  _droneAngleOffset   = 0;
  _projectileLines    = [];
  _healParticles      = [];
  _dotPuffs           = [];
  _debuffTendrils     = [];
  _buffSparkles       = [];
  abilityEffects      = [];
}

// ════════════════════════════════════════════
//  STAT HELPERS
// ════════════════════════════════════════════

function getAbilityStat(abilityId, statName) {
  const def = ABILITY_DEFS[abilityId];
  if (!def) return 0;
  const level = getAbilityLevel(abilityId);
  if (level <= 0) return 0;
  const Key = statName.charAt(0).toUpperCase() + statName.slice(1);
  const base = def.stats['base' + Key];
  const perLevel = def.stats[statName + 'PerLevel'];
  if (base === undefined) return 0;
  return base + (level - 1) * (perLevel || 0);
}

function getAbilityStatsComputed(id) {
  const def = ABILITY_DEFS[id];
  if (!def || !def.stats) return {};
  const level = Math.max(getAbilityLevel(id), 1);
  const out = {};
  for (const key in def.stats) {
    if (!key.startsWith('base')) continue;
    const rawName  = key.slice(4);
    const statName = rawName.charAt(0).toLowerCase() + rawName.slice(1);
    const perKey   = statName + 'PerLevel';
    out[statName]  = def.stats[key] + (level - 1) * (def.stats[perKey] || 0);
  }
  return out;
}

function _getMechanicType(id) {
  return ABILITY_DEFS[id] ? ABILITY_DEFS[id].type : null;
}

// ════════════════════════════════════════════
//  ORIGINAL 6 TRIGGER FUNCTIONS (exact mechanics)
// ════════════════════════════════════════════

function triggerEMP() {
  if (!turret.alive) return;
  if (typeof playEMPSound === 'function') playEMPSound();
  const damage = getAbilityStat('emp', 'damage');
  const radius = getAbilityStat('emp', 'radius');

  empWaves.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: radius, life: 35 });

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dist = Math.hypot(enemy.x - turret.x, enemy.y - turret.y);
    if (dist < radius) {
      enemy.takeDamage(damage);
      const angle = Math.atan2(enemy.y - turret.y, enemy.x - turret.x);
      enemy.x += Math.cos(angle) * 50;
      enemy.y += Math.sin(angle) * 50;
    }
  }
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    spawnParticle(
      turret.x + Math.cos(a) * r, turret.y + Math.sin(a) * r,
      Math.cos(a) * 3, Math.sin(a) * 3,
      i % 3 === 0 ? COL.white : COL.cyan,
      15 + Math.random() * 25, 1.5 + Math.random() * 2);
  }
  camera.shakeX = (Math.random() - 0.5) * 12;
  camera.shakeY = (Math.random() - 0.5) * 12;
}

function triggerShield() {
  if (!turret.alive) return;
  if (typeof playShieldSound === 'function') playShieldSound();
  const absorb   = getAbilityStat('shield', 'absorb');
  const duration = getAbilityStat('shield', 'duration');

  shieldActive     = true;
  shieldHp         = absorb;
  shieldTimer      = Math.round(duration);
  shieldRingPulse  = 0;

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    spawnParticle(
      turret.x + Math.cos(a) * 38, turret.y + Math.sin(a) * 38,
      Math.cos(a) * 1.5, Math.sin(a) * 1.5,
      COL.cyan, 20 + Math.random() * 20, 2);
  }
}

function triggerRapidfire() {
  if (!turret.alive) return;
  if (typeof playLevelUpSound === 'function') playLevelUpSound();
  const boost    = getAbilityStat('rapidfire', 'boost');
  const duration = getAbilityStat('rapidfire', 'duration');

  rapidfireActive       = true;
  rapidfireTimer        = Math.round(duration);
  currentRapidfireBoost = boost;

  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 20 + Math.random() * 20;
    spawnParticle(
      turret.x + Math.cos(a) * r, turret.y + Math.sin(a) * r,
      Math.cos(a) * 2, Math.sin(a) * 2,
      COL.orange, 15 + Math.random() * 15, 2);
  }
}

function triggerChain() {
  if (!turret.alive) return;
  if (typeof playChainSound === 'function') playChainSound();
  const damage  = getAbilityStat('chain', 'damage');
  const bounces = Math.floor(getAbilityStat('chain', 'bounces'));
  const BOUNCE_RANGE = 200;

  const aliveEnemies = enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) return;

  let current = null, minDist = Infinity;
  for (const e of aliveEnemies) {
    const d = Math.hypot(e.x - turret.x, e.y - turret.y);
    if (d < minDist) { minDist = d; current = e; }
  }
  if (!current) return;

  const hit = new Set([current]);
  chainLightningLines.push({ x1: turret.x, y1: turret.y, x2: current.x, y2: current.y, life: 20, maxLife: 20 });
  current.takeDamage(damage);

  for (let b = 0; b < bounces; b++) {
    let next = null, nextDist = Infinity;
    for (const e of aliveEnemies) {
      if (hit.has(e)) continue;
      const d = Math.hypot(e.x - current.x, e.y - current.y);
      if (d < BOUNCE_RANGE && d < nextDist) { nextDist = d; next = e; }
    }
    if (!next) break;
    chainLightningLines.push({ x1: current.x, y1: current.y, x2: next.x, y2: next.y, life: 20, maxLife: 20 });
    next.takeDamage(damage);
    hit.add(next);
    current = next;
  }
}

function triggerFreeze() {
  if (!turret.alive) return;
  if (typeof playFreezeSound === 'function') playFreezeSound();
  const slow     = getAbilityStat('freeze', 'slow');
  const duration = getAbilityStat('freeze', 'duration');
  const radius   = getAbilityStat('freeze', 'radius');

  freezeActive          = true;
  freezeTimer           = Math.round(duration);
  currentFreezeSlowAmount = slow;

  freezeRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: radius, life: 30, maxLife: 30 });
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    spawnParticle(
      turret.x + Math.cos(a) * r, turret.y + Math.sin(a) * r,
      Math.cos(a) * 1.5, Math.sin(a) * 1.5,
      COL.blue, 15 + Math.random() * 15, 1.5);
  }
}

function triggerOrbital() {
  if (!turret.alive) return;
  if (typeof playOrbitalSound === 'function') playOrbitalSound();
  const damage = getAbilityStat('orbital', 'damage');
  const radius = getAbilityStat('orbital', 'radius');

  const aliveEnemies = enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) return;

  const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  const cx = target.x, cy = target.y;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (Math.hypot(enemy.x - cx, enemy.y - cy) < radius) enemy.takeDamage(damage);
  }

  orbitalExplosions.push({ x: cx, y: cy, radius: 0, maxRadius: radius, life: 40, maxLife: 40 });
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    spawnParticle(
      cx + Math.cos(a) * r, cy + Math.sin(a) * r,
      Math.cos(a) * (2 + Math.random() * 4), Math.sin(a) * (2 + Math.random() * 4),
      i % 3 === 0 ? COL.yellow : i % 3 === 1 ? COL.orange : COL.red,
      20 + Math.random() * 30, 2 + Math.random() * 2);
  }
  camera.shakeX = (Math.random() - 0.5) * 20;
  camera.shakeY = (Math.random() - 0.5) * 20;
}

// ════════════════════════════════════════════
//  GENERIC MECHANIC HANDLERS
// ════════════════════════════════════════════

function triggerInstantDamage(id, s) {
  if (!turret.alive) return;
  const aliveEnemies = enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) return;

  const range  = s.range  || s.radius || 400;
  const damage = s.damage || 50;

  let targets = aliveEnemies.filter(e => Math.hypot(e.x - turret.x, e.y - turret.y) < range);
  if (targets.length === 0) targets = [aliveEnemies[0]];

  const count  = s.projectiles || 1;
  const picked = [];
  for (let i = 0; i < Math.min(count, targets.length); i++) {
    picked.push(targets[Math.floor(Math.random() * targets.length)]);
  }

  if (id === 'execute_protocol') {
    for (const e of aliveEnemies) {
      if ((e.hp / e.maxHp) <= 0.2) e.takeDamage(e.hp + 9999);
    }
  } else {
    for (const e of picked) {
      if (!e.alive) continue;
      e.takeDamage(damage);
      _spawnImpactParticles(e.x, e.y, COL.cyan, 12);
      // Colored projectile line from turret to target
      _projectileLines.push({ x1: turret.x, y1: turret.y, x2: e.x, y2: e.y, life: 12, maxLife: 12, color: COL.cyan });
    }
    if (count > 1) {
      for (const e of targets) {
        if (picked.includes(e)) continue;
        e.takeDamage(damage * 0.5);
        _projectileLines.push({ x1: turret.x, y1: turret.y, x2: e.x, y2: e.y, life: 8, maxLife: 8, color: COL.cyan });
      }
    }
  }

  _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: Math.min(range, 400), life: 20, maxLife: 20, color: COL.cyan, style: 'damage' });
  camera.shakeX = (Math.random() - 0.5) * 6;
  camera.shakeY = (Math.random() - 0.5) * 6;
}

function triggerAoE(id, s) {
  if (!turret.alive) return;
  const aliveEnemies = enemies.filter(e => e.alive);
  const radius = s.radius || 250;
  const damage = s.damage || 40;

  let cx = turret.x, cy = turret.y;
  if (aliveEnemies.length > 0) {
    const t = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    cx = t.x; cy = t.y;
  }

  for (const e of enemies) {
    if (!e.alive) continue;
    if (Math.hypot(e.x - cx, e.y - cy) < radius) e.takeDamage(damage);
  }

  orbitalExplosions.push({ x: cx, y: cy, radius: 0, maxRadius: radius, life: 35, maxLife: 35 });
  _spawnImpactParticles(cx, cy, COL.orange, 30);
  camera.shakeX = (Math.random() - 0.5) * 10;
  camera.shakeY = (Math.random() - 0.5) * 10;
}

function triggerDoT(id, s) {
  if (!turret.alive) return;
  const aliveEnemies = enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) return;

  const radius   = s.radius || s.coneRange || 300;
  const duration = s.duration || 180;
  const dotDmg   = s.dotDamage || 8;
  // poison = green/teal, burn = orange
  const dotColor = (id === 'chain_burn' || id === 'solar_flare' || id === 'eternal_storm' || id === 'overload_field') ? COL.orange : COL.teal;

  for (const e of aliveEnemies) {
    if (Math.hypot(e.x - turret.x, e.y - turret.y) > radius) continue;
    if (!e._dotStack) e._dotStack = [];
    e._dotStack.push({ damage: dotDmg, timer: duration, tickTimer: 30, color: dotColor });
    _spawnImpactParticles(e.x, e.y, dotColor, 6);
    // Dark tendril from turret to each target
    _debuffTendrils.push({ x1: turret.x, y1: turret.y, x2: e.x, y2: e.y, life: 18, maxLife: 18, color: dotColor });
  }

  _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: radius, life: 25, maxLife: 25, color: dotColor, style: 'dot' });
}

function triggerZone(id, s) {
  if (!turret.alive) return;
  const radius   = s.radius || 120;
  const duration = s.duration || 300;
  const damage   = s.damage || 8;
  const slow     = s.slowAmount || 0;

  // Pick zone color by type
  let zoneColor = COL.cyan;
  if (slow > 0.5) zoneColor = COL.blue;
  else if (slow > 0) zoneColor = '#4488ff';
  else if (id === 'void_rift' || id === 'plague_cloud') zoneColor = COL.purple;

  _activeZones.push({
    x: turret.x, y: turret.y,
    radius, timer: Math.round(duration),
    damage, slowAmount: slow,
    color: zoneColor,
    tickTimer: 30,
    id,
  });

  _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: radius, life: 20, maxLife: 20, color: zoneColor, style: 'zone' });
}

function triggerBuff(id, s) {
  if (!turret.alive) return;
  const duration = s.duration || 240;
  const boost    = s.boost    || 0.3;

  if (id === 'turret_overclock' || id === 'god_mode' || id === 'turret_ascension' || id === 'power_surge') {
    rapidfireActive       = true;
    rapidfireTimer        = Math.round(duration);
    currentRapidfireBoost = boost;
  } else {
    rapidfireActive       = true;
    rapidfireTimer        = Math.max(rapidfireTimer, Math.round(duration));
    currentRapidfireBoost = Math.max(currentRapidfireBoost, boost * 0.3);
  }

  _activeBuff = { id, timer: Math.round(duration), stats: s };
  _buffGlowTimer = Math.round(duration);
  _buffGlowColor = '#ffaa00';

  // Spawn rotating sparkles around turret
  for (let i = 0; i < 8; i++) {
    _buffSparkles.push({ angle: (i / 8) * Math.PI * 2, dist: 32 + Math.random() * 10, life: Math.round(duration), maxLife: Math.round(duration) });
  }

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    spawnParticle(
      turret.x + Math.cos(a) * 30, turret.y + Math.sin(a) * 30,
      Math.cos(a) * 2, Math.sin(a) * 2,
      COL.orange, 20, 2);
  }
}

function triggerDebuff(id, s) {
  if (!turret.alive) return;
  const aliveEnemies = enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) return;

  const radius   = s.radius || 300;
  const duration = s.stunDuration || s.duration || 120;
  const slow     = s.slowAmount  || 0;
  const amplify  = s.damageAmplify || 0;
  const knockback = s.knockback || 0;

  const inRange = radius >= 9000
    ? aliveEnemies
    : aliveEnemies.filter(e => Math.hypot(e.x - turret.x, e.y - turret.y) < radius);

  for (const e of inRange) {
    if (slow > 0)    { e._debuffSlow = slow;    e._debuffSlowTimer    = duration; }
    if (amplify > 0) { e._debuffAmplify = amplify; e._debuffAmplifyTimer = duration; }
    if (s.stunDuration) { e._stunTimer = duration; }
    if (knockback > 0) {
      const a = Math.atan2(e.y - turret.y, e.x - turret.x);
      e.x += Math.cos(a) * knockback;
      e.y += Math.sin(a) * knockback;
    }
    _spawnImpactParticles(e.x, e.y, COL.blue, 5);
    // Dark tendril to each debuffed enemy
    _debuffTendrils.push({ x1: turret.x, y1: turret.y, x2: e.x, y2: e.y, life: 20, maxLife: 20, color: '#cc44ff' });
  }

  _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: Math.min(radius, 500), life: 22, maxLife: 22, color: '#cc44ff', style: 'debuff' });

  // Also propagate radius-wide slows through global freeze system
  if (slow > 0 && radius >= 9000) {
    freezeActive            = true;
    freezeTimer             = Math.max(freezeTimer, duration);
    currentFreezeSlowAmount = Math.max(currentFreezeSlowAmount, slow);
    freezeRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 450, life: 25, maxLife: 25 });
  }
  // Per-enemy slow also piggybacked onto freeze for movement
  if (slow > 0 && radius < 9000) {
    freezeActive            = true;
    freezeTimer             = Math.max(freezeTimer, duration);
    currentFreezeSlowAmount = Math.max(currentFreezeSlowAmount, slow);
  }
}

function triggerShieldGeneric(id, s) {
  if (!turret.alive) return;
  const absorb   = s.absorb   || s.shieldHP   || 100;
  const duration = s.duration || 300;

  shieldActive    = true;
  shieldHp        = absorb;
  shieldTimer     = Math.round(duration);
  shieldRingPulse = 0;

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    spawnParticle(
      turret.x + Math.cos(a) * 44, turret.y + Math.sin(a) * 44,
      Math.cos(a) * 1.5, Math.sin(a) * 1.5,
      COL.cyan, 20 + Math.random() * 15, 2);
  }
}

function triggerHeal(id, s) {
  if (!turret.alive) return;
  const amount = s.heal || s.healPerSecond || 30;
  turret.hp = Math.min(turret.hp + amount, turret.maxHp);

  // Spawn upward-floating heal particles
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 10 + Math.random() * 25;
    _healParticles.push({
      x: turret.x + Math.cos(a) * r,
      y: turret.y + Math.sin(a) * r,
      vy: -(1.5 + Math.random() * 1.5),
      vx: (Math.random() - 0.5) * 0.8,
      life: 35 + Math.random() * 20,
      maxLife: 55,
    });
  }

  _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 80, life: 22, maxLife: 22, color: COL.teal, style: 'heal' });
}

function triggerSummon(id, s) {
  if (!turret.alive) return;
  const count    = s.count    || s.mines    || s.droneCount || 1;
  const damage   = s.damage   || s.droneDamage || 20;
  const duration = s.duration || 300;
  const radius   = s.radius   || s.triggerRadius || 120;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    _summons.push({
      type:        'drone',
      x:           turret.x + Math.cos(angle) * 80,
      y:           turret.y + Math.sin(angle) * 80,
      angle,
      orbitRadius: 80 + Math.random() * 20,
      orbitSpeed:  0.04 + Math.random() * 0.02,
      timer:       Math.round(duration),
      damage,
      triggerRadius: radius,
      fireTimer:   0,
      fireRate:    60,
      alive:       true,
    });
  }

  _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 120, life: 18, maxLife: 18, color: COL.teal, style: 'summon' });
}

function triggerUtility(id, s) {
  if (!turret.alive) return;
  const aliveEnemies = enemies.filter(e => e.alive);

  if (id === 'repulsor_blast' || id === 'seismic_tap') {
    const force  = s.repulseForce || s.knockback || 100;
    const radius = s.radius || 9999;
    for (const e of aliveEnemies) {
      if (Math.hypot(e.x - turret.x, e.y - turret.y) > radius) continue;
      const a = Math.atan2(e.y - turret.y, e.x - turret.x);
      e.x += Math.cos(a) * force;
      e.y += Math.sin(a) * force;
    }
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: Math.min(radius, 400), life: 20, maxLife: 20, color: COL.white, style: 'damage' });
    camera.shakeX = (Math.random() - 0.5) * 8;
    camera.shakeY = (Math.random() - 0.5) * 8;

  } else if (id === 'gravity_pull') {
    const force = s.pullForce || 80;
    for (const e of aliveEnemies) {
      const a = Math.atan2(turret.y - e.y, turret.x - e.x);
      e.x += Math.cos(a) * force;
      e.y += Math.sin(a) * force;
    }
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 350, life: 20, maxLife: 20, color: COL.teal, style: 'zone' });

  } else {
    for (const e of aliveEnemies) {
      e._debuffAmplify      = 0.15;
      e._debuffAmplifyTimer = s.duration || 180;
    }
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 300, life: 18, maxLife: 18, color: COL.yellow, style: 'buff' });
  }
}

function triggerTriggered(id, s) {
  if (!turret.alive) return;
  _triggeredAbilities[id] = {
    armed:  true,
    damage: s.damage || 80,
    radius: s.radius || s.blastRadius || 120,
    timer:  600,
  };
  _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 200, life: 18, maxLife: 18, color: COL.red, style: 'debuff' });
}

function triggerUnique(id, s) {
  if (!turret.alive) return;
  const aliveEnemies = enemies.filter(e => e.alive);

  if (id === 'time_reversal' || id === 'temporal_stasis' || id === 'time_stop') {
    const dur = s.stunDuration || s.freezeDuration || 240;
    freezeActive            = true;
    freezeTimer             = Math.max(freezeTimer, dur);
    currentFreezeSlowAmount = 0.98;
    freezeRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 600, life: 30, maxLife: 30 });
    // Blue time-flash ring
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 600, life: 28, maxLife: 28, color: COL.blue, style: 'time' });
    if (s.boost) { rapidfireActive = true; rapidfireTimer = Math.max(rapidfireTimer, dur); currentRapidfireBoost = Math.max(currentRapidfireBoost, s.boost); }

  } else if (id === 'temporal_dilation') {
    const dur = s.duration || 240;
    freezeActive            = true;
    freezeTimer             = Math.max(freezeTimer, dur);
    currentFreezeSlowAmount = Math.max(currentFreezeSlowAmount, 0.7);
    rapidfireActive         = true;
    rapidfireTimer          = Math.max(rapidfireTimer, dur);
    currentRapidfireBoost   = Math.max(currentRapidfireBoost, 2);
    freezeRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 500, life: 28, maxLife: 28 });
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 500, life: 26, maxLife: 26, color: COL.blue, style: 'time' });

  } else if (id === 'gravity_inverter' || id === 'dimensional_rift') {
    const force = s.repulseForce || s.repelForce || 200;
    for (const e of aliveEnemies) {
      const a = Math.atan2(e.y - turret.y, e.x - turret.x);
      e.x += Math.cos(a) * force;
      e.y += Math.sin(a) * force;
    }
    if (s.damage > 0) {
      for (const e of aliveEnemies) {
        e.takeDamage(s.damage || 50);
        _projectileLines.push({ x1: turret.x, y1: turret.y, x2: e.x, y2: e.y, life: 10, maxLife: 10, color: COL.orange });
      }
    }
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 500, life: 30, maxLife: 30, color: COL.orange, style: 'damage' });
    camera.shakeX = (Math.random() - 0.5) * 14;
    camera.shakeY = (Math.random() - 0.5) * 14;

  } else if (id === 'energy_leech' || id === 'vampire_field' || id === 'singularity_bomb' || id === 'void_collapse') {
    const radius = s.radius || 9999;
    let totalHealed = 0;
    for (const e of aliveEnemies) {
      if (radius < 9000 && Math.hypot(e.x - turret.x, e.y - turret.y) > radius) continue;
      const dmg = Math.max(s.damage || 30, e.hp * 0.3);
      e.takeDamage(dmg);
      totalHealed += dmg * 0.2;
      _spawnImpactParticles(e.x, e.y, COL.teal, 5);
      _projectileLines.push({ x1: e.x, y1: e.y, x2: turret.x, y2: turret.y, life: 12, maxLife: 12, color: COL.teal });
    }
    if (turret.hp !== undefined) turret.hp = Math.min(turret.hp + totalHealed, turret.maxHp);
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: Math.min(radius, 500), life: 28, maxLife: 28, color: COL.teal, style: 'heal' });

  } else if (id === 'phase_shift') {
    shieldActive = true;
    shieldHp     = 999999;
    shieldTimer  = s.duration || 120;
    _uniqueState[id] = { returnTimer: s.duration || 120, damage: s.damage || 120, radius: s.radius || 200 };

  } else if (id === 'solar_flare' || id === 'eternal_storm' || id === 'overload_field') {
    const dur = s.duration || 300;
    if (s.damage > 0) {
      for (const e of aliveEnemies) {
        if (!e._dotStack) e._dotStack = [];
        e._dotStack.push({ damage: s.damage, timer: dur, tickTimer: 30, color: COL.orange });
        _debuffTendrils.push({ x1: turret.x, y1: turret.y, x2: e.x, y2: e.y, life: 20, maxLife: 20, color: COL.orange });
      }
    }
    if (s.boost) { rapidfireActive = true; rapidfireTimer = Math.max(rapidfireTimer, dur); currentRapidfireBoost = Math.max(currentRapidfireBoost, s.boost); }
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 500, life: 30, maxLife: 30, color: COL.yellow, style: 'damage' });
    camera.shakeX = (Math.random() - 0.5) * 12;
    camera.shakeY = (Math.random() - 0.5) * 12;

  } else if (id === 'reality_fracture' || id === 'infinity_mirror' || id === 'matrix_hack') {
    const dur   = s.duration || 480;
    const boost = s.boost    || 3;
    rapidfireActive       = true;
    rapidfireTimer        = Math.max(rapidfireTimer, dur);
    currentRapidfireBoost = Math.max(currentRapidfireBoost, boost * 0.3);
    _buffGlowTimer = dur;
    _buffGlowColor = '#cc44ff';
    for (let i = 0; i < 8; i++) {
      _buffSparkles.push({ angle: (i / 8) * Math.PI * 2, dist: 36 + Math.random() * 10, life: dur, maxLife: dur });
    }
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 300, life: 24, maxLife: 24, color: '#cc44ff', style: 'unique' });

  } else if (id === 'blackhole_seed') {
    // Pull all enemies toward center then AoE
    const radius = s.radius || 300;
    for (const e of aliveEnemies) {
      const a = Math.atan2(turret.y - e.y, turret.x - e.x);
      const dist = Math.hypot(e.x - turret.x, e.y - turret.y);
      const pullStr = Math.min(dist * 0.5, 120);
      e.x += Math.cos(a) * pullStr;
      e.y += Math.sin(a) * pullStr;
      if (Math.hypot(e.x - turret.x, e.y - turret.y) < radius) e.takeDamage(s.damage || 200);
    }
    orbitalExplosions.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: radius, life: 40, maxLife: 40 });
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: radius, life: 30, maxLife: 30, color: '#cc44ff', style: 'unique' });
    camera.shakeX = (Math.random() - 0.5) * 18;
    camera.shakeY = (Math.random() - 0.5) * 18;

  } else if (id === 'paradox_loop' || id === 'rewind_damage') {
    // Heal turret and apply DoT to all enemies
    const dur = s.duration || 480;
    for (const e of aliveEnemies) {
      if (!e._dotStack) e._dotStack = [];
      e._dotStack.push({ damage: 15, timer: dur, tickTimer: 30, color: '#cc44ff' });
    }
    if (turret.hp !== undefined) turret.hp = Math.min(turret.hp + 50, turret.maxHp);
    _genericRings.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 400, life: 26, maxLife: 26, color: '#cc44ff', style: 'unique' });

  } else if (id === 'entropy_bomb') {
    // AoE + debuff amplify
    for (const e of aliveEnemies) {
      e.takeDamage(s.damage || 100);
      e._debuffAmplify = 0.5;
      e._debuffAmplifyTimer = 180;
      _projectileLines.push({ x1: turret.x, y1: turret.y, x2: e.x, y2: e.y, life: 12, maxLife: 12, color: '#cc44ff' });
    }
    orbitalExplosions.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: 450, life: 38, maxLife: 38 });
    camera.shakeX = (Math.random() - 0.5) * 16;
    camera.shakeY = (Math.random() - 0.5) * 16;

  } else {
    // Fallback: AoE damage
    const radius = s.radius || 350;
    const damage = s.damage || 80;
    for (const e of aliveEnemies) {
      if (radius < 9000 && Math.hypot(e.x - turret.x, e.y - turret.y) > radius) continue;
      e.takeDamage(damage);
      _spawnImpactParticles(e.x, e.y, COL.orange, 8);
    }
    orbitalExplosions.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: Math.min(radius, 600), life: 40, maxLife: 40 });
    camera.shakeX = (Math.random() - 0.5) * 14;
    camera.shakeY = (Math.random() - 0.5) * 14;
  }
}

// ── Generic dispatch ──
function triggerAbilityByType(id) {
  const mechType = _getMechanicType(id);
  const stats    = getAbilityStatsComputed(id);

  switch (mechType) {
    case 'emp_original':       triggerEMP();                    break;
    case 'shield_original':    triggerShield();                 break;
    case 'rapidfire_original': triggerRapidfire();              break;
    case 'chain_original':     triggerChain();                  break;
    case 'freeze_original':    triggerFreeze();                 break;
    case 'orbital_original':   triggerOrbital();                break;
    case 'instant_damage':     triggerInstantDamage(id, stats); break;
    case 'aoe':                triggerAoE(id, stats);           break;
    case 'dot':                triggerDoT(id, stats);           break;
    case 'zone':               triggerZone(id, stats);          break;
    case 'buff':               triggerBuff(id, stats);          break;
    case 'debuff':             triggerDebuff(id, stats);        break;
    case 'shield':             triggerShieldGeneric(id, stats); break;
    case 'heal':               triggerHeal(id, stats);          break;
    case 'summon':             triggerSummon(id, stats);        break;
    case 'utility':            triggerUtility(id, stats);       break;
    case 'triggered':          triggerTriggered(id, stats);     break;
    case 'unique':             triggerUnique(id, stats);        break;
    case 'passive':            triggerZone(id, stats);          break;
  }
}

// ════════════════════════════════════════════
//  MAIN UPDATE — called once per frame
// ════════════════════════════════════════════

function updateAbilities() {
  const equipped     = serverGameData.equippedAbilities || [];
  const hasLiveEnemy = enemies.some(e => e.alive);

  if (_globalAbilityDelay > 0) _globalAbilityDelay--;

  // ── Ability cooldowns + auto-trigger ──
  for (const id of equipped) {
    if (!hasAbility(id)) continue;
    const def = ABILITY_DEFS[id];
    if (!def) continue;

    if (abilityCooldowns[id] === undefined) abilityCooldowns[id] = 0;
    if (abilityCooldowns[id] > 0) abilityCooldowns[id]--;

    if (abilityCooldowns[id] <= 0 && hasLiveEnemy && _globalAbilityDelay <= 0) {
      const cooldown = Math.max(1, Math.round(getAbilityStat(id, 'cooldown')));
      triggerAbilityByType(id);
      abilityCooldowns[id]    = cooldown;
      abilityCooldownsMax[id] = cooldown;
      _globalAbilityDelay     = ABILITY_DELAY;
    }
  }

  // ── Original 6 timers ──
  if (shieldActive) {
    shieldTimer--;
    shieldRingPulse++;
    if (shieldTimer <= 0 || shieldHp <= 0) { shieldActive = false; shieldHp = 0; }
  }
  if (rapidfireActive) {
    rapidfireTimer--;
    if (rapidfireTimer <= 0) { rapidfireActive = false; currentRapidfireBoost = 0; }
  }
  if (freezeActive) {
    freezeTimer--;
    if (freezeTimer <= 0) { freezeActive = false; currentFreezeSlowAmount = 0; }
  }

  // ── Buff/debuff timers ──
  if (_buffGlowTimer > 0) _buffGlowTimer--;
  if (_activeBuff) { _activeBuff.timer--; if (_activeBuff.timer <= 0) _activeBuff = null; }
  if (_activeDebuff) { _activeDebuff.timer--; if (_activeDebuff.timer <= 0) _activeDebuff = null; }

  // ── Zone update: damage + slow enemies inside each zone ──
  for (let i = _activeZones.length - 1; i >= 0; i--) {
    const z = _activeZones[i];
    z.timer--;
    z.tickTimer--;
    if (z.tickTimer <= 0) {
      z.tickTimer = 30;
      for (const e of enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - z.x, e.y - z.y) < z.radius) {
          if (z.damage > 0) e.takeDamage(z.damage);
          if (z.slowAmount > 0) {
            e._debuffSlow      = z.slowAmount;
            e._debuffSlowTimer = 35;
            // Also maintain global freeze so enemies.js movement is slowed
            freezeActive            = true;
            freezeTimer             = Math.max(freezeTimer, 35);
            currentFreezeSlowAmount = Math.max(currentFreezeSlowAmount, z.slowAmount);
          }
        }
      }
    }
    if (z.timer <= 0) _activeZones.splice(i, 1);
  }

  // ── DoT tick on enemies ──
  for (const e of enemies) {
    if (!e.alive || !e._dotStack) continue;
    for (let i = e._dotStack.length - 1; i >= 0; i--) {
      const dot = e._dotStack[i];
      dot.timer--;
      dot.tickTimer--;
      if (dot.tickTimer <= 0) {
        dot.tickTimer = 30;
        e.takeDamage(dot.damage);
        // Spawn a puff visual on the enemy
        _dotPuffs.push({ x: e.x, y: e.y - (e.radius || 12), life: 20, maxLife: 20, color: dot.color || COL.teal });
      }
      if (dot.timer <= 0) e._dotStack.splice(i, 1);
    }
  }

  // ── Enemy debuff timers ──
  for (const e of enemies) {
    if (!e.alive) continue;
    if (e._debuffSlowTimer    > 0) e._debuffSlowTimer--;
    if (e._debuffAmplifyTimer > 0) e._debuffAmplifyTimer--;
    if (e._stunTimer          > 0) e._stunTimer--;
    if (e._debuffSlowTimer    <= 0) e._debuffSlow    = 0;
    if (e._debuffAmplifyTimer <= 0) e._debuffAmplify = 0;
    // Apply per-enemy slow through global freeze (enemies.js reads freezeActive)
    if (e._debuffSlow > 0 && e._debuffSlowTimer > 0) {
      freezeActive            = true;
      freezeTimer             = Math.max(freezeTimer, e._debuffSlowTimer);
      currentFreezeSlowAmount = Math.max(currentFreezeSlowAmount, e._debuffSlow);
    }
  }

  // ── Summon update: orbit turret, auto-fire ──
  _droneAngleOffset += 0.03;
  for (let i = _summons.length - 1; i >= 0; i--) {
    const d = _summons[i];
    if (!d.alive) { _summons.splice(i, 1); continue; }
    d.timer--;
    if (d.timer <= 0) { _summons.splice(i, 1); continue; }

    d.angle += d.orbitSpeed;
    d.x = turret.x + Math.cos(d.angle) * d.orbitRadius;
    d.y = turret.y + Math.sin(d.angle) * d.orbitRadius;

    d.fireTimer--;
    if (d.fireTimer <= 0) {
      d.fireTimer = d.fireRate;
      let nearest = null, nd = Infinity;
      for (const e of enemies) {
        if (!e.alive) continue;
        const dist = Math.hypot(e.x - d.x, e.y - d.y);
        if (dist < nd) { nd = dist; nearest = e; }
      }
      if (nearest) {
        nearest.takeDamage(d.damage);
        // Bullet-line from drone to target
        _projectileLines.push({ x1: d.x, y1: d.y, x2: nearest.x, y2: nearest.y, life: 10, maxLife: 10, color: COL.teal });
      }
    }
  }

  // ── Triggered ability check: fire when enemy dies this frame ──
  for (const id in _triggeredAbilities) {
    const t = _triggeredAbilities[id];
    if (!t.armed) continue;
    t.timer--;
    if (t.timer <= 0) { delete _triggeredAbilities[id]; continue; }

    for (const e of enemies) {
      if (e.alive) continue;
      if (!e._justDied) continue;
      if (Math.hypot(e.x - turret.x, e.y - turret.y) < (t.radius * 1.5)) {
        for (const target of enemies) {
          if (!target.alive) continue;
          if (Math.hypot(target.x - e.x, target.y - e.y) < t.radius) target.takeDamage(t.damage);
        }
        orbitalExplosions.push({ x: e.x, y: e.y, radius: 0, maxRadius: t.radius, life: 30, maxLife: 30 });
        _spawnImpactParticles(e.x, e.y, COL.red, 20);
        delete _triggeredAbilities[id];
        break;
      }
    }
  }

  // Clear _justDied flag after triggered check
  for (const e of enemies) {
    if (e._justDied) e._justDied = false;
  }

  // ── Unique state update ──
  for (const id in _uniqueState) {
    const u = _uniqueState[id];
    if (id === 'phase_shift' && u.returnTimer !== undefined) {
      u.returnTimer--;
      if (u.returnTimer <= 0) {
        for (const e of enemies) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - turret.x, e.y - turret.y) < u.radius) e.takeDamage(u.damage);
        }
        orbitalExplosions.push({ x: turret.x, y: turret.y, radius: 0, maxRadius: u.radius, life: 35, maxLife: 35 });
        delete _uniqueState[id];
      }
    }
  }

  // ── Visual effect updates ──
  for (let i = chainLightningLines.length - 1; i >= 0; i--) {
    chainLightningLines[i].life--;
    if (chainLightningLines[i].life <= 0) chainLightningLines.splice(i, 1);
  }
  for (let i = orbitalExplosions.length - 1; i >= 0; i--) {
    const o = orbitalExplosions[i];
    o.radius += (o.maxRadius - o.radius) * 0.10;
    o.life--;
    if (o.life <= 0) orbitalExplosions.splice(i, 1);
  }
  for (let i = freezeRings.length - 1; i >= 0; i--) {
    const f = freezeRings[i];
    f.radius += (f.maxRadius - f.radius) * 0.12;
    f.life--;
    if (f.life <= 0) freezeRings.splice(i, 1);
  }
  for (let i = _genericRings.length - 1; i >= 0; i--) {
    const r = _genericRings[i];
    r.radius += (r.maxRadius - r.radius) * 0.14;
    r.life--;
    if (r.life <= 0) _genericRings.splice(i, 1);
  }
  for (let i = _projectileLines.length - 1; i >= 0; i--) {
    _projectileLines[i].life--;
    if (_projectileLines[i].life <= 0) _projectileLines.splice(i, 1);
  }
  for (let i = _healParticles.length - 1; i >= 0; i--) {
    const h = _healParticles[i];
    h.x += h.vx;
    h.y += h.vy;
    h.life--;
    if (h.life <= 0) _healParticles.splice(i, 1);
  }
  for (let i = _dotPuffs.length - 1; i >= 0; i--) {
    _dotPuffs[i].life--;
    if (_dotPuffs[i].life <= 0) _dotPuffs.splice(i, 1);
  }
  for (let i = _debuffTendrils.length - 1; i >= 0; i--) {
    _debuffTendrils[i].life--;
    if (_debuffTendrils[i].life <= 0) _debuffTendrils.splice(i, 1);
  }
  for (let i = _buffSparkles.length - 1; i >= 0; i--) {
    _buffSparkles[i].life--;
    _buffSparkles[i].angle += 0.08;
    if (_buffSparkles[i].life <= 0) _buffSparkles.splice(i, 1);
  }
}

// ════════════════════════════════════════════
//  DRAW — called inside world-space ctx block
// ════════════════════════════════════════════

function drawAbilityEffects(ctx) {

  // ── Active zones: filled semi-transparent circle with pulsing border ──
  for (const z of _activeZones) {
    const fade  = Math.min(1, z.timer / 60);
    const pulse = 0.5 + Math.sin(frameCount * 0.08) * 0.3;
    const col   = z.color || COL.cyan;
    ctx.save();
    // Filled area
    const grad = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius);
    grad.addColorStop(0, `rgba(${_hexToRgb(col)}, ${fade * 0.18})`);
    grad.addColorStop(0.7, `rgba(${_hexToRgb(col)}, ${fade * 0.10})`);
    grad.addColorStop(1, `rgba(${_hexToRgb(col)}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
    ctx.fill();
    // Pulsing border
    ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${fade * (0.4 + pulse * 0.4)})`;
    ctx.lineWidth   = 2;
    ctx.shadowColor = col;
    ctx.shadowBlur  = 12;
    ctx.stroke();
    // Inner tick ring
    ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${fade * 0.25})`;
    ctx.lineWidth   = 1;
    ctx.shadowBlur  = 0;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ── Projectile lines from turret / drones to targets ──
  for (const line of _projectileLines) {
    const alpha = line.life / line.maxLife;
    const col   = line.color || COL.cyan;
    ctx.save();
    ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${alpha})`;
    ctx.lineWidth   = 2 * alpha + 0.5;
    ctx.shadowColor = col;
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
    // Bright core
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.6})`;
    ctx.lineWidth   = 0.8;
    ctx.shadowBlur  = 0;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
    ctx.restore();
  }

  // ── Heal particles: rising green/teal dots ──
  ctx.save();
  for (const h of _healParticles) {
    const alpha = h.life / h.maxLife;
    ctx.fillStyle   = `rgba(0, 255, 180, ${alpha * 0.9})`;
    ctx.shadowColor = COL.teal;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 3 * alpha + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // ── DoT puffs on enemies ──
  for (const p of _dotPuffs) {
    const alpha = p.life / p.maxLife;
    const col   = p.color || COL.teal;
    ctx.save();
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle   = col;
    ctx.shadowColor = col;
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5 + (1 - alpha) * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    ctx.restore();
  }

  // ── Debuff tendrils: jagged lines to enemies ──
  for (const t of _debuffTendrils) {
    const alpha = (t.life / t.maxLife) * 0.7;
    const col   = t.color || '#cc44ff';
    const mx    = (t.x1 + t.x2) / 2 + (Math.random() - 0.5) * 20;
    const my    = (t.y1 + t.y2) / 2 + (Math.random() - 0.5) * 20;
    ctx.save();
    ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${alpha})`;
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = col;
    ctx.shadowBlur  = 6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(t.x1, t.y1);
    ctx.quadraticCurveTo(mx, my, t.x2, t.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Shield ring: hexagonal pattern ──
  if (shieldActive && turret && turret.alive) {
    const pulse       = 0.6 + Math.sin(shieldRingPulse * 0.12) * 0.3;
    const shieldRadius = 46;
    ctx.save();
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur  = 20;
    // Main circle
    ctx.strokeStyle = `rgba(0, 255, 242, ${pulse * 0.5})`;
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();
    // Hexagonal shimmer segments
    const hexRot = shieldRingPulse * 0.015;
    ctx.strokeStyle = `rgba(0, 255, 242, ${pulse * 0.3})`;
    ctx.lineWidth   = 1.5;
    for (let i = 0; i < 6; i++) {
      const a1 = hexRot + (i / 6) * Math.PI * 2;
      const a2 = hexRot + ((i + 0.5) / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(turret.x + Math.cos(a1) * shieldRadius, turret.y + Math.sin(a1) * shieldRadius);
      ctx.lineTo(turret.x + Math.cos(a2) * (shieldRadius - 8), turret.y + Math.sin(a2) * (shieldRadius - 8));
      ctx.lineTo(turret.x + Math.cos(a2 + (0.5 / 6) * Math.PI * 2) * shieldRadius, turret.y + Math.sin(a2 + (0.5 / 6) * Math.PI * 2) * shieldRadius);
      ctx.stroke();
    }
    // Filled gradient interior
    const grad = ctx.createRadialGradient(turret.x, turret.y, shieldRadius * 0.5, turret.x, turret.y, shieldRadius);
    grad.addColorStop(0, `rgba(0, 255, 242, ${pulse * 0.04})`);
    grad.addColorStop(1, `rgba(0, 255, 242, ${pulse * 0.10})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, shieldRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Rapidfire / buff glow + rotating sparkles ──
  if ((rapidfireActive || _buffGlowTimer > 0) && turret && turret.alive) {
    const pulse = 0.5 + Math.sin(frameCount * 0.2) * 0.3;
    const col   = _buffGlowTimer > 0 ? _buffGlowColor : COL.orange;
    ctx.save();
    ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${pulse * 0.6})`;
    ctx.lineWidth   = 3;
    ctx.shadowColor = col;
    ctx.shadowBlur  = 25;
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Buff sparkles: rotating diamonds around turret ──
  if (_buffSparkles.length > 0 && turret && turret.alive) {
    ctx.save();
    for (const sp of _buffSparkles) {
      const alpha = sp.life / sp.maxLife;
      const sx    = turret.x + Math.cos(sp.angle) * sp.dist;
      const sy    = turret.y + Math.sin(sp.angle) * sp.dist;
      const size  = 3 + alpha * 2;
      ctx.fillStyle   = `rgba(255, 200, 0, ${alpha * 0.9})`;
      ctx.shadowColor = COL.yellow;
      ctx.shadowBlur  = 6;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(sp.angle + frameCount * 0.05);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.5, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Freeze rings (expanding blue ring on trigger) ──
  for (const f of freezeRings) {
    const alpha = f.life / f.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(0, 136, 255, ${alpha * 0.8})`;
    ctx.lineWidth   = 3;
    ctx.shadowColor = COL.blue;
    ctx.shadowBlur  = 18;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.4})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Freeze indicator on active enemies ──
  if (freezeActive) {
    ctx.save();
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const pulse = 0.4 + Math.sin(frameCount * 0.1 + (enemy.wobble || 0)) * 0.2;
      ctx.strokeStyle = `rgba(0, 136, 255, ${pulse * 0.6})`;
      ctx.lineWidth   = 2;
      ctx.shadowColor = COL.blue;
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, (enemy.radius || 12) + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Debuff rings on enemies ──
  ctx.save();
  for (const e of enemies) {
    if (!e.alive) continue;
    if (e._stunTimer > 0) {
      ctx.strokeStyle = `rgba(255, 220, 0, 0.6)`;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, (e.radius || 12) + 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e._debuffAmplify > 0) {
      ctx.strokeStyle = `rgba(255, 80, 80, 0.5)`;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, (e.radius || 12) + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // ── Chain lightning lines ──
  for (const line of chainLightningLines) {
    const alpha = line.life / line.maxLife;
    const mx    = (line.x1 + line.x2) / 2 + (Math.random() - 0.5) * 30;
    const my    = (line.y1 + line.y2) / 2 + (Math.random() - 0.5) * 30;
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 242, ${alpha})`;
    ctx.lineWidth   = 2 + alpha * 2;
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(mx, my);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    ctx.lineWidth   = 1;
    ctx.shadowBlur  = 0;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(mx, my);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Orbital explosion rings ──
  for (const o of orbitalExplosions) {
    const alpha = o.life / o.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 102, 0, ${alpha * 0.8})`;
    ctx.lineWidth   = 3;
    ctx.shadowColor = COL.orange;
    ctx.shadowBlur  = 30;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.stroke();
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
    grad.addColorStop(0, `rgba(255, 220, 0, ${alpha * 0.12})`);
    grad.addColorStop(0.5, `rgba(255, 102, 0, ${alpha * 0.06})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 220, 0, ${alpha * 0.5})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Generic expanding rings — styled by type ──
  for (const r of _genericRings) {
    const alpha = r.life / r.maxLife;
    const col   = r.color || COL.cyan;
    const style = r.style || 'default';
    ctx.save();

    if (style === 'time') {
      // Blue crystalline ring with sparkle dashes
      ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${alpha * 0.8})`;
      ctx.lineWidth   = 2.5;
      ctx.shadowColor = col;
      ctx.shadowBlur  = 20;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.5})`;
      ctx.lineWidth   = 1;
      ctx.shadowBlur  = 0;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * 0.75, 0, Math.PI * 2);
      ctx.stroke();

    } else if (style === 'damage') {
      // Solid ring with particles suggestion
      ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${alpha * 0.8})`;
      ctx.lineWidth   = 2.5;
      ctx.shadowColor = col;
      ctx.shadowBlur  = 18;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      // Inner bright flash
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
      ctx.lineWidth   = 1;
      ctx.shadowBlur  = 0;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * 0.4, 0, Math.PI * 2);
      ctx.stroke();

    } else if (style === 'heal') {
      // Soft green glow ring
      ctx.strokeStyle = `rgba(0, 255, 180, ${alpha * 0.7})`;
      ctx.lineWidth   = 2;
      ctx.shadowColor = COL.teal;
      ctx.shadowBlur  = 22;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

    } else if (style === 'debuff' || style === 'dot') {
      // Purple/dark dashed ring
      ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${alpha * 0.75})`;
      ctx.lineWidth   = 2;
      ctx.shadowColor = col;
      ctx.shadowBlur  = 14;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

    } else if (style === 'zone') {
      // Concentric pulsing rings
      ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${alpha * 0.7})`;
      ctx.lineWidth   = 2;
      ctx.shadowColor = col;
      ctx.shadowBlur  = 16;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${alpha * 0.35})`;
      ctx.lineWidth   = 1;
      ctx.shadowBlur  = 0;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * 0.55, 0, Math.PI * 2);
      ctx.stroke();

    } else if (style === 'unique') {
      // Spiral-like: rotating arc segments
      ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${alpha * 0.8})`;
      ctx.lineWidth   = 2.5;
      ctx.shadowColor = col;
      ctx.shadowBlur  = 20;
      const rot = frameCount * 0.05;
      for (let seg = 0; seg < 4; seg++) {
        const a = rot + (seg / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, a, a + Math.PI * 0.4);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

    } else {
      // Default: plain ring with glow
      ctx.strokeStyle = `rgba(${_hexToRgb(col)}, ${alpha * 0.7})`;
      ctx.lineWidth   = 2;
      ctx.shadowColor = col;
      ctx.shadowBlur  = 14;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // ── Summon drones: glowing diamonds that orbit ──
  if (_summons.length > 0 && turret && turret.alive) {
    ctx.save();
    for (const d of _summons) {
      const pulse = 0.6 + Math.sin(frameCount * 0.15 + d.angle) * 0.3;
      const size  = 6;
      ctx.fillStyle   = `rgba(0, 255, 200, ${pulse})`;
      ctx.strokeStyle = `rgba(0, 255, 200, ${pulse * 0.5})`;
      ctx.lineWidth   = 1.5;
      ctx.shadowColor = COL.teal;
      ctx.shadowBlur  = 14;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle + frameCount * 0.04);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.6, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Triggered arms indicator ──
  for (const id in _triggeredAbilities) {
    const t = _triggeredAbilities[id];
    if (!t.armed) continue;
    const pulse = 0.4 + Math.sin(frameCount * 0.15) * 0.3;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 50, 50, ${pulse})`;
    ctx.lineWidth   = 2;
    ctx.shadowColor = COL.red;
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(turret.x, turret.y, 55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ════════════════════════════════════════════
//  EMP WAVE VISUALS (kept from original)
// ════════════════════════════════════════════

function updateEMPWaves() {
  for (let i = empWaves.length - 1; i >= 0; i--) {
    const w = empWaves[i];
    w.radius += (w.maxRadius - w.radius) * 0.12;
    w.life--;
    if (w.life <= 0) empWaves.splice(i, 1);
  }
}

function drawEMPWaves(ctx) {
  for (const w of empWaves) {
    const alpha = w.life / 35;
    ctx.strokeStyle = `rgba(0, 255, 242, ${alpha * 0.7})`;
    ctx.lineWidth   = 3;
    ctx.shadowColor = COL.cyan;
    ctx.shadowBlur  = 25;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.stroke();
    const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.radius);
    grad.addColorStop(0, `rgba(0, 255, 242, ${alpha * 0.08})`);
    grad.addColorStop(0.7, `rgba(0, 255, 242, ${alpha * 0.03})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// ════════════════════════════════════════════
//  INTERNAL HELPERS
// ════════════════════════════════════════════

function _spawnImpactParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1.5 + Math.random() * 2.5;
    spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, 12 + Math.random() * 12, 1.5);
  }
}

// Convert hex color to "r, g, b" string for rgba()
function _hexToRgb(hex) {
  if (!hex || hex[0] !== '#') return '0, 255, 242';
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
