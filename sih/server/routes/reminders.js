const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/reminders/patient/:patientId
 * @desc    Get all reminders for a patient
 * @access  Public / Private
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const reminders = await Reminder.find({ patientId }).sort({ scheduleTime: 1 });

    res.json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (err) {
    console.error('Get patient reminders error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving reminders' });
  }
});

/**
 * @route   POST /api/reminders
 * @desc    Create a new reminder
 * @access  Public / Private
 */
router.post('/', async (req, res) => {
  try {
    const { patientId, type, scheduleTime, recurrence, label, photoUrl } = req.body;

    if (!patientId || !type || !scheduleTime || !label) {
      return res.status(400).json({
        success: false,
        message: 'Please provide patientId, type, scheduleTime, and label',
      });
    }

    const reminder = await Reminder.create({
      patientId,
      type,
      scheduleTime,
      recurrence: recurrence || 'daily',
      label,
      photoUrl: photoUrl || '',
      acknowledgedAt: null,
    });

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: reminder,
    });
  } catch (err) {
    console.error('Create reminder error:', err);
    res.status(500).json({ success: false, message: 'Server error creating reminder' });
  }
});

/**
 * @route   POST /api/reminders/:id/acknowledge
 * @desc    Acknowledge a reminder (patient one-tap acknowledgement)
 * @access  Public / Private
 */
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { acknowledgedAt } = req.body;
    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      { acknowledgedAt: acknowledgedAt ? new Date(acknowledgedAt) : new Date() },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    res.json({
      success: true,
      message: 'Reminder acknowledged',
      data: reminder,
    });
  } catch (err) {
    console.error('Acknowledge reminder error:', err);
    res.status(500).json({ success: false, message: 'Server error acknowledging reminder' });
  }
});

/**
 * @route   POST /api/reminders/batch-acknowledge
 * @desc    Sync acknowledgments queued offline in IndexedDB
 * @access  Public / Private
 */
router.post('/batch-acknowledge', async (req, res) => {
  try {
    const { acknowledgments } = req.body;

    if (!acknowledgments || !Array.isArray(acknowledgments)) {
      return res.status(400).json({ success: false, message: 'Invalid acknowledgments array' });
    }

    const updated = [];
    for (const item of acknowledgments) {
      if (item.reminderId) {
        const doc = await Reminder.findByIdAndUpdate(
          item.reminderId,
          { acknowledgedAt: item.acknowledgedAt ? new Date(item.acknowledgedAt) : new Date() },
          { new: true }
        );
        if (doc) updated.push(doc);
      }
    }

    res.json({
      success: true,
      message: `Synced ${updated.length} reminder acknowledgments`,
      data: updated,
    });
  } catch (err) {
    console.error('Batch acknowledge error:', err);
    res.status(500).json({ success: false, message: 'Server error syncing acknowledgments' });
  }
});

/**
 * @route   PUT /api/reminders/:id
 * @desc    Update a reminder
 * @access  Public / Private
 */
router.put('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, data: reminder });
  } catch (err) {
    console.error('Update reminder error:', err);
    res.status(500).json({ success: false, message: 'Server error updating reminder' });
  }
});

/**
 * @route   DELETE /api/reminders/:id
 * @desc    Delete a reminder
 * @access  Public / Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    console.error('Delete reminder error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting reminder' });
  }
});

module.exports = router;
