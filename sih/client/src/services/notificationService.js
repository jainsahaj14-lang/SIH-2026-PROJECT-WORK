import { db } from '../db/dexieDb';

class NotificationService {
  constructor() {
    this.intervalId = null;
    this.alertListeners = new Set();
    this.audioCtx = null;
  }

  async requestPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }

  onReminderDue(callback) {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  notifyAlertListeners(reminder) {
    this.alertListeners.forEach((cb) => {
      try {
        cb(reminder);
      } catch (e) {
        console.error('Error notifying reminder listener:', e);
      }
    });
  }

  /**
   * Synthesize a gentle audio chime using Web Audio API (works completely offline, no external audio files)
   */
  playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      // Harmonic pleasant chord (523Hz - C5)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Web Audio chime unavailable:', e);
    }
  }

  startReminderScheduler() {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      try {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeString = `${currentHours}:${currentMinutes}`;

        // Query Dexie for today's active unacknowledged reminders
        const dueReminders = await db.reminders
          .where('scheduleTime')
          .equals(currentTimeString)
          .and((r) => !r.acknowledgedAt)
          .toArray();

        for (const reminder of dueReminders) {
          // Play gentle chime
          this.playChime();

          // Dispatch in-app modal alert
          this.notifyAlertListeners(reminder);

          // Fire Browser Notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('CogniCare NER — Care Reminder', {
              body: `${reminder.label} (Scheduled at ${reminder.scheduleTime})`,
              icon: '/brain-icon.svg',
              tag: `reminder-${reminder.id}`,
            });
          }
        }
      } catch (err) {
        console.warn('[NotificationService] Scheduler check error:', err);
      }
    }, 20000); // Check every 20s
  }

  stopReminderScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const notificationService = new NotificationService();
