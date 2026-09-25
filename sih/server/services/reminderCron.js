const cron = require('node-cron');
const Reminder = require('../models/Reminder');

/**
 * Initializes server-side reminder monitoring.
 * Runs every minute to log due reminders and flag missed medications.
 */
function initReminderScheduler() {
  console.log('[CogniCare Cron] Reminder scheduler initialized (checking every minute)');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;

      // Find active reminders for today matching current minute
      const dueReminders = await Reminder.find({
        scheduleTime: currentTimeString,
        acknowledgedAt: null,
      }).populate('patientId');

      if (dueReminders.length > 0) {
        console.log(`[CogniCare Cron] ${dueReminders.length} reminder(s) due at ${currentTimeString}`);
      }
    } catch (err) {
      console.error('[CogniCare Cron] Error running reminder cron job:', err.message);
    }
  });
}

module.exports = { initReminderScheduler };
