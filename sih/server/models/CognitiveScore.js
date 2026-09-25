const mongoose = require('mongoose');

const CognitiveScoreSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    weekOf: {
      type: Date,
      required: true,
    },
    avgAccuracyByGame: {
      type: Map,
      of: Number,
      default: {},
    },
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable',
    },
  },
  {
    timestamps: true,
  }
);

CognitiveScoreSchema.index({ patientId: 1, weekOf: -1 });

module.exports = mongoose.model('CognitiveScore', CognitiveScoreSchema);
