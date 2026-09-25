const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const User = require('../models/User');
const GameSession = require('../models/GameSession');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');
const { getNextDifficultyForPatient } = require('../services/difficultyEngine');

/**
 * @route   GET /api/patients
 * @desc    Get linked patients for caregiver/healthworker, or all for admin
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'caregiver' || req.user.role === 'healthworker') {
      query = { caregiverIds: req.user._id };
    }

    const patients = await Patient.find(query).populate('userId', 'name phone preferredLanguage pin');
    res.json({ success: true, count: patients.length, data: patients });
  } catch (err) {
    console.error('Get patients error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving patients' });
  }
});

/**
 * @route   GET /api/patients/:id
 * @desc    Get single patient details
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'name phone preferredLanguage pin')
      .populate('caregiverIds', 'name phone email');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, data: patient });
  } catch (err) {
    console.error('Get patient error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving patient' });
  }
});

/**
 * @route   POST /api/patients
 * @desc    Create a new patient and link to creator (caregiver/healthworker/admin)
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, pin, age, cognitiveBaseline, region, preferredLanguage } = req.body;

    if (!name || !age) {
      return res.status(400).json({ success: false, message: 'Please provide patient name and age' });
    }

    // 1. Create User account for patient
    const patientUser = await User.create({
      name,
      phone: phone || '',
      pin: pin || String(Math.floor(1000 + Math.random() * 9000)), // default random 4-digit PIN
      role: 'patient',
      preferredLanguage: preferredLanguage || 'as',
    });

    // 2. Create Patient profile
    const patient = await Patient.create({
      userId: patientUser._id,
      age: Number(age),
      cognitiveBaseline: cognitiveBaseline || 'mild',
      currentDifficultyTier: { memory: 1, attention: 1, pattern: 1, routine: 1 },
      caregiverIds: [req.user._id],
      region: region || 'Assam',
      preferredLanguage: preferredLanguage || 'as',
    });

    // 3. Link back to caregiver
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { linkedPatients: patient._id },
    });

    const populatedPatient = await Patient.findById(patient._id).populate('userId', 'name phone pin preferredLanguage');

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: populatedPatient,
    });
  } catch (err) {
    console.error('Create patient error:', err);
    res.status(500).json({ success: false, message: 'Server error creating patient' });
  }
});

/**
 * @route   GET /api/patients/:id/next-difficulty/:gameType
 * @desc    Expose adaptive difficulty engine endpoint
 * @access  Public / Private (used by game client after sessions)
 */
router.get('/:id/next-difficulty/:gameType', async (req, res) => {
  try {
    const { id, gameType } = req.params;
    const result = await getNextDifficultyForPatient(id, gameType);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Adaptive difficulty evaluation error:', err);
    res.status(500).json({ success: false, message: err.message || 'Error evaluating adaptive difficulty' });
  }
});

/**
 * @route   GET /api/patients/:id/stats
 * @desc    Get detailed statistics, adherence %, and session history for caregiver view
 * @access  Private
 */
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const patientId = req.params.id;

    // Fetch recent 20 sessions
    const sessions = await GameSession.find({ patientId })
      .sort({ startTime: -1 })
      .limit(20);

    // Calculate reminder adherence this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const allWeekReminders = await Reminder.find({
      patientId,
      createdAt: { $gte: oneWeekAgo },
    });

    const acknowledgedCount = allWeekReminders.filter((r) => r.acknowledgedAt !== null).length;
    const adherenceRate = allWeekReminders.length > 0
      ? Math.round((acknowledgedCount / allWeekReminders.length) * 100)
      : 100;

    // Check for alerts
    const alerts = [];

    // Alert 1: No session in 3+ days
    if (sessions.length > 0) {
      const lastSessionTime = new Date(sessions[0].startTime);
      const diffDays = (new Date() - lastSessionTime) / (1000 * 60 * 60 * 24);
      if (diffDays >= 3) {
        alerts.push({
          type: 'warning',
          code: 'inactivity_3_days',
          message: `No cognitive gaming session logged in ${Math.floor(diffDays)} days.`,
        });
      }
    } else {
      alerts.push({
        type: 'info',
        code: 'no_sessions_yet',
        message: 'No game sessions logged yet. Encourage the patient to try Memory Match!',
      });
    }

    // Alert 2: Missed reminder > 2 hours
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const todayReminders = await Reminder.find({
      patientId,
      acknowledgedAt: null,
    });

    todayReminders.forEach((r) => {
      if (r.scheduleTime && r.scheduleTime.includes(':')) {
        const [rHour, rMin] = r.scheduleTime.split(':').map(Number);
        const diffMinutes = (currentHours * 60 + currentMinutes) - (rHour * 60 + rMin);
        if (diffMinutes > 120) {
          alerts.push({
            type: 'danger',
            code: 'missed_reminder',
            message: `Reminder "${r.label}" missed by more than 2 hours (scheduled for ${r.scheduleTime}).`,
          });
        }
      }
    });

    // Alert 3: Check fatigue flag from latest sessions
    if (sessions.length >= 2) {
      const newestTime = sessions[0].avgResponseTimeMs;
      const oldestTime = sessions[Math.min(2, sessions.length - 1)].avgResponseTimeMs;
      if (oldestTime > 0 && (newestTime - oldestTime) / oldestTime > 0.2) {
        alerts.push({
          type: 'warning',
          code: 'possible_fatigue',
          message: 'Adaptive engine detected >20% increase in response time. Possible mental fatigue or restlessness.',
        });
      }
    }

    res.json({
      success: true,
      data: {
        sessions,
        adherenceRate,
        totalSessions: sessions.length,
        alerts,
      },
    });
  } catch (err) {
    console.error('Get patient stats error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving patient statistics' });
  }
});

module.exports = router;
