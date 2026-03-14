const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  displayName: { type: String },
  createdAt: { type: Date, default: Date.now },
  gameData: {
    gems: { type: Number, default: 0 },
    silverCoins: { type: Number, default: 0 },
    permUpgrades: {
      health: { type: Number, default: 0 },
      damage: { type: Number, default: 0 },
      regen: { type: Number, default: 0 },
      precision: { type: Number, default: 0 },
      fireRate: { type: Number, default: 0 },
    },
    levelProgress: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Card-based ability system
    abilityCards: { type: mongoose.Schema.Types.Mixed, default: {} },  // { id: totalCards }
    abilityLevels: { type: mongoose.Schema.Types.Mixed, default: {} }, // { id: currentLevel }
    // Habilidades equipadas (max 5)
    equippedAbilities: { type: [String], default: [] },
    // Auto-save: estado de partida en curso
    sessionState: { type: mongoose.Schema.Types.Mixed, default: null },
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
