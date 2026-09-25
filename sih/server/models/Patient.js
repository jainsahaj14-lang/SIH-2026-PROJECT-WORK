const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 50,
      max: 120,
    },
    cognitiveBaseline: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild',
    },
    currentDifficultyTier: {
      memory: { type: Number, default: 1, min: 1, max: 3 },
      attention: { type: Number, default: 1, min: 1, max: 3 },
      pattern: { type: Number, default: 1, min: 1, max: 3 },
      routine: { type: Number, default: 1, min: 1, max: 3 },
    },
    caregiverIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    region: {
      type: String,
      default: 'Assam',
    },
    preferredLanguage: {
      type: String,
      default: 'as',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Patient', PatientSchema);
