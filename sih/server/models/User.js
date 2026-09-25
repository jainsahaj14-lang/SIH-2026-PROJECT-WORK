const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['patient', 'caregiver', 'healthworker', 'admin'],
      default: 'patient',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    password: {
      type: String,
      // Optional for patient with PIN
    },
    pin: {
      type: String, // 4-digit PIN for patient simplified login (e.g., '1234')
      trim: true,
    },
    preferredLanguage: {
      type: String,
      default: 'as', // 'as' for Assamese, 'en' for English
    },
    linkedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
