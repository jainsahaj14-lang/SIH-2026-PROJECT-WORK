const express = require('express');
const router = express.Router();
const GameSession = require('../models/GameSession');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');
const { getNextDifficultyForPatient } = require('../services/difficultyEngine');

/**
 * @route   POST /api/game-sessions
 * @desc    Record a completed or in-progress game session
 * @access  Public / Private (patients sync without strict JWT if session has patientId)
 */
router.post('/', async (req, res) => {
  try {
    const {
      patientId,
      gameType,
      difficultyTier,
      startTime,
      endTime,
      accuracy,
      avgResponseTimeMs,
      hesitationCount,
      completed,
    } = req.body;

    if (!patientId || !gameType || accuracy === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required game session fields' });
    }

    const session = await GameSession.create({
      patientId,
      gameType,
      difficultyTier: Number(difficultyTier) || 1,
      startTime: startTime || new Date(),
      endTime: endTime || new Date(),
      accuracy: Math.round(Number(accuracy)),
      avgResponseTimeMs: Math.round(Number(avgResponseTimeMs)) || 0,
      hesitationCount: Number(hesitationCount) || 0,
      completed: completed !== undefined ? completed : true,
      syncedAt: new Date(),
    });

    // Check adaptive difficulty update
    let difficultyUpdate = null;
    try {
      difficultyUpdate = await getNextDifficultyForPatient(patientId, gameType);
    } catch (e) {
      console.warn('Could not auto-update difficulty after session:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Game session recorded successfully',
      data: session,
      difficultyUpdate,
    });
  } catch (err) {
    console.error('Record game session error:', err);
    res.status(500).json({ success: false, message: 'Server error recording game session' });
  }
});

/**
 * @route   POST /api/game-sessions/batch
 * @desc    Batch sync game sessions queued offline in IndexedDB
 * @access  Public / Private
 */
router.post('/batch', async (req, res) => {
  try {
    const { sessions } = req.body;

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ success: false, message: 'No sessions provided for batch sync' });
    }

    const createdSessions = [];

    for (const s of sessions) {
      // Avoid duplicate insertion by matching patientId, gameType and startTime
      const existing = await GameSession.findOne({
        patientId: s.patientId,
        gameType: s.gameType,
        startTime: new Date(s.startTime),
      });

      if (!existing) {
        const created = await GameSession.create({
          patientId: s.patientId,
          gameType: s.gameType,
          difficultyTier: Number(s.difficultyTier) || 1,
          startTime: s.startTime ? new Date(s.startTime) : new Date(),
          endTime: s.endTime ? new Date(s.endTime) : new Date(),
          accuracy: Math.round(Number(s.accuracy)),
          avgResponseTimeMs: Math.round(Number(s.avgResponseTimeMs)) || 0,
          hesitationCount: Number(s.hesitationCount) || 0,
          completed: s.completed !== undefined ? s.completed : true,
          syncedAt: new Date(),
        });
        createdSessions.push(created);
      } else {
        createdSessions.push(existing);
      }
    }

    res.json({
      success: true,
      message: `Batch synced ${createdSessions.length} game sessions`,
      syncedCount: createdSessions.length,
      data: createdSessions,
    });
  } catch (err) {
    console.error('Batch sync game sessions error:', err);
    res.status(500).json({ success: false, message: 'Server error during batch session sync' });
  }
});

/**
 * @route   GET /api/game-sessions/patient/:patientId
 * @desc    Get session history for a specific patient
 * @access  Public / Private
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { gameType, limit = 20 } = req.query;

    const query = { patientId };
    if (gameType) query.gameType = gameType;

    const sessions = await GameSession.find(query)
      .sort({ startTime: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (err) {
    console.error('Get patient sessions error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching patient sessions' });
  }
});

module.exports = router;
