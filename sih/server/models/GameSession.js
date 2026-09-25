const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    gameType: {
      type: String,
      required: true,
      enum: ['memory_match', 'routine_recall', 'pattern_recognition', 'attention'],
    },
    difficultyTier: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    avgResponseTimeMs: {
      type: Number,
      required: true,
    },
    hesitationCount: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by patient & gameType for difficultyEngine
GameSessionSchema.index({ patientId: 1, gameType: 1, createdAt: -1 });

module.exports = mongoose.model('GameSession', GameSessionSchema);
