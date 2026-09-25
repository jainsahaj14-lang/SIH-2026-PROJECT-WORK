const GameSession = require('../models/GameSession');
const Patient = require('../models/Patient');

/**
 * Core adaptive engine evaluation interface.
 * Decoupled from the database query so it can evaluate any list of recent session objects
 * and easily be swapped with a scikit-learn / ONNX classifier in Phase 2.
 *
 * @param {Array} sessions - Last N session records (ordered newest to oldest)
 * @param {number} currentTier - Current difficulty tier (1, 2, or 3)
 * @returns {Object} { nextTier, currentTier, tierChange, flags, reason, stats }
 */
function evaluateDifficulty(sessions, currentTier = 1) {
  const flags = [];
  let tierChange = 0;
  let reason = 'Tier maintained based on current performance stability';

  if (!sessions || sessions.length === 0) {
    return {
      nextTier: currentTier,
      currentTier,
      tierChange: 0,
      flags: ['initial_baseline'],
      reason: 'No prior sessions found; maintaining starting baseline tier.',
      stats: { avgAccuracy: 0, avgResponseTimeMs: 0, sessionsAnalyzed: 0 },
    };
  }

  // Calculate averages across the available sessions (up to 3)
  const totalAcc = sessions.reduce((sum, s) => sum + s.accuracy, 0);
  const avgAccuracy = Math.round(totalAcc / sessions.length);

  const totalTime = sessions.reduce((sum, s) => sum + s.avgResponseTimeMs, 0);
  const avgResponseTimeMs = Math.round(totalTime / sessions.length);

  // Response time trend analysis: compare newest session to oldest in the window
  let responseTimeTrendPercent = 0;
  if (sessions.length >= 2) {
    const newestTime = sessions[0].avgResponseTimeMs;
    const oldestTime = sessions[sessions.length - 1].avgResponseTimeMs;
    if (oldestTime > 0) {
      responseTimeTrendPercent = Math.round(((newestTime - oldestTime) / oldestTime) * 100);
    }
  }

  // Check rules:
  // 1. If accuracy > 85%: increase difficultyTier by 1 (max 3)
  if (avgAccuracy > 85) {
    if (currentTier < 3) {
      tierChange = 1;
      reason = `Average accuracy (${avgAccuracy}%) exceeded 85%. Advancing difficulty tier.`;
    } else {
      tierChange = 0;
      reason = `Average accuracy (${avgAccuracy}%) exceeded 85%, already at maximum tier 3.`;
    }
  }
  // 2. If accuracy < 50%: decrease difficultyTier by 1 (min 1)
  else if (avgAccuracy < 50) {
    if (currentTier > 1) {
      tierChange = -1;
      reason = `Average accuracy (${avgAccuracy}%) dropped below 50%. Lowering difficulty tier for cognitive comfort.`;
    } else {
      tierChange = 0;
      reason = `Average accuracy (${avgAccuracy}%) is below 50%, already at minimum tier 1.`;
    }
  }
  // 3. If accuracy is stable (50-85%) but response time is trending up > 20%: flag "possible_fatigue"
  else if (responseTimeTrendPercent > 20) {
    flags.push('possible_fatigue');
    tierChange = 0;
    reason = `Performance stable (${avgAccuracy}%) but response time lengthened by ${responseTimeTrendPercent}%. Flagged potential fatigue.`;
  }

  const nextTier = Math.max(1, Math.min(3, currentTier + tierChange));

  return {
    nextTier,
    currentTier,
    tierChange,
    flags,
    reason,
    stats: {
      avgAccuracy,
      avgResponseTimeMs,
      responseTimeTrendPercent,
      sessionsAnalyzed: sessions.length,
    },
  };
}

/**
 * Database wrapper that fetches patient & last 3 sessions, then evaluates.
 * Updates the patient's currentDifficultyTier in the database.
 *
 * @param {string} patientId
 * @param {string} gameType - 'memory_match' | 'routine_recall' | etc.
 */
async function getNextDifficultyForPatient(patientId, gameType) {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  // Determine current tier property mapping
  // 'memory_match' -> 'memory', 'routine_recall' -> 'routine', etc.
  const tierKey = gameType.includes('memory')
    ? 'memory'
    : gameType.includes('routine')
    ? 'routine'
    : gameType.includes('pattern')
    ? 'pattern'
    : 'attention';

  const currentTier = patient.currentDifficultyTier?.[tierKey] || 1;

  // Pull last 3 GameSession records for this patient and gameType (newest first)
  const recentSessions = await GameSession.find({
    patientId,
    gameType,
    completed: true,
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  const result = evaluateDifficulty(recentSessions, currentTier);

  // If tier changed, update patient record
  if (result.nextTier !== currentTier) {
    if (!patient.currentDifficultyTier) {
      patient.currentDifficultyTier = { memory: 1, routine: 1, pattern: 1, attention: 1 };
    }
    patient.currentDifficultyTier[tierKey] = result.nextTier;
    await patient.save();
  }

  return {
    ...result,
    gameType,
    patientId,
    tierKey,
  };
}

module.exports = {
  evaluateDifficulty,
  getNextDifficultyForPatient,
};
