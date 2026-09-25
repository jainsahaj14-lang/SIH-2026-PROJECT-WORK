const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    type: {
      type: String,
      enum: ['medicine', 'hydration', 'activity', 'appointment'],
      required: true,
    },
    scheduleTime: {
      type: String, // e.g. "09:00" or ISO Date string
      required: true,
    },
    recurrence: {
      type: String,
      enum: ['daily', 'weekly', 'hourly', 'once'],
      default: 'daily',
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '', // base64 or upload path for medicine strip
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ReminderSchema.index({ patientId: 1, scheduleTime: 1 });

module.exports = mongoose.model('Reminder', ReminderSchema);
