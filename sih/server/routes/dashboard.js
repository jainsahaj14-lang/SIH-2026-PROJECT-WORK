const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const User = require('../models/User');
const GameSession = require('../models/GameSession');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');

/**
 * Helper to calculate playing streak in consecutive days
 */
function calculateStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  // Extract unique calendar dates
  const days = [
    ...new Set(
      sessions.map((s) => new Date(s.startTime).toISOString().split('T')[0])
    ),
  ].sort((a, b) => new Date(b) - new Date(a));

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If last played was neither today nor yesterday, streak is 0
  if (days[0] !== todayStr && days[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(days[0]);

  for (let i = 0; i < days.length; i++) {
    const expected = checkDate.toISOString().split('T')[0];
    if (days[i] === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * @route   GET /api/dashboard/caregiver
 * @desc    Get aggregated dashboard data for all linked patients
 * @access  Private
 */
router.get('/caregiver', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'caregiver' || req.user.role === 'healthworker') {
      query = { caregiverIds: req.user._id };
    }

    const patients = await Patient.find(query).populate('userId', 'name phone preferredLanguage pin');

    const patientSummaries = [];
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    for (const patient of patients) {
      // 1. Fetch recent sessions
      const sessions = await GameSession.find({ patientId: patient._id })
        .sort({ startTime: -1 })
        .limit(20);

      const lastActive = sessions.length > 0 ? sessions[0].startTime : null;
      const streak = calculateStreak(sessions);

      // 2. Average accuracy across recent sessions
      const avgAccuracy = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length)
        : 0;

      // 3. Reminders adherence this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekReminders = await Reminder.find({
        patientId: patient._id,
        createdAt: { $gte: oneWeekAgo },
      });
      const ackCount = weekReminders.filter((r) => r.acknowledgedAt !== null).length;
      const adherenceRate = weekReminders.length > 0 ? Math.round((ackCount / weekReminders.length) * 100) : 100;

      // 4. Alerts
      const alerts = [];

      // Alert: No session in 3+ days
      if (lastActive) {
        const daysDiff = (now - new Date(lastActive)) / (1000 * 60 * 60 * 24);
        if (daysDiff >= 3) {
          alerts.push({
            type: 'warning',
            code: 'inactivity_3_days',
            message: `No game session logged in ${Math.floor(daysDiff)} days`,
          });
        }
      } else {
        alerts.push({
          type: 'info',
          code: 'no_sessions_yet',
          message: 'No game activity logged yet',
        });
      }

      // Alert: Missed reminder > 2 hours
      const todayReminders = await Reminder.find({
        patientId: patient._id,
        acknowledgedAt: null,
      });

      for (const r of todayReminders) {
        if (r.scheduleTime && r.scheduleTime.includes(':')) {
          const [rHour, rMin] = r.scheduleTime.split(':').map(Number);
          const diffMinutes = currentHours * 60 + currentMinutes - (rHour * 60 + rMin);
          if (diffMinutes > 120) {
            alerts.push({
              type: 'danger',
              code: 'missed_reminder',
              message: `Missed "${r.label}" scheduled for ${r.scheduleTime}`,
            });
            break; // only need 1 missed alert per patient summary
          }
        }
      }

      // Alert: Fatigue flag
      if (sessions.length >= 2) {
        const newestTime = sessions[0].avgResponseTimeMs;
        const oldestTime = sessions[Math.min(2, sessions.length - 1)].avgResponseTimeMs;
        if (oldestTime > 0 && (newestTime - oldestTime) / oldestTime > 0.2) {
          alerts.push({
            type: 'warning',
            code: 'possible_fatigue',
            message: 'Adaptive engine flagged possible cognitive fatigue',
          });
        }
      }

      patientSummaries.push({
        patient,
        lastActive,
        streak,
        avgAccuracy,
        adherenceRate,
        sessionCount: sessions.length,
        currentTiers: patient.currentDifficultyTier,
        alerts,
      });
    }

    res.json({
      success: true,
      data: {
        totalPatients: patients.length,
        patients: patientSummaries,
      },
    });
  } catch (err) {
    console.error('Caregiver dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving dashboard data' });
  }
});

module.exports = router;
