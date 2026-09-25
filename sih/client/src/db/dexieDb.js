import Dexie from 'dexie';

export const db = new Dexie('CogniCareNER_DB');

db.version(1).stores({
  gameSessions: '++id, patientId, gameType, difficultyTier, startTime, accuracy, synced',
  reminders: '++id, serverId, patientId, type, scheduleTime, recurrence, label, acknowledgedAt, synced',
  offlineQueue: '++id, action, createdAt, status',
  patientCache: '++id, serverId, pin, name',
});

/**
 * Save a newly played game session to local IndexedDB first
 */
export async function saveLocalGameSession(sessionData) {
  try {
    const record = {
      ...sessionData,
      startTime: sessionData.startTime || new Date().toISOString(),
      endTime: sessionData.endTime || new Date().toISOString(),
      synced: false,
    };
    const id = await db.gameSessions.add(record);
    return { ...record, id };
  } catch (err) {
    console.error('[Dexie DB] Error saving local game session:', err);
    throw err;
  }
}

/**
 * Cache server reminders locally in IndexedDB
 */
export async function cacheRemindersLocally(remindersList) {
  try {
    for (const r of remindersList) {
      const existing = await db.reminders.where('serverId').equals(r._id).first();
      if (!existing) {
        await db.reminders.add({
          serverId: r._id,
          patientId: r.patientId,
          type: r.type,
          scheduleTime: r.scheduleTime,
          recurrence: r.recurrence,
          label: r.label,
          photoUrl: r.photoUrl || '',
          acknowledgedAt: r.acknowledgedAt,
          synced: true,
        });
      } else {
        await db.reminders.update(existing.id, {
          type: r.type,
          scheduleTime: r.scheduleTime,
          label: r.label,
          photoUrl: r.photoUrl || '',
          acknowledgedAt: r.acknowledgedAt,
        });
      }
    }
  } catch (err) {
    console.error('[Dexie DB] Error caching reminders:', err);
  }
}

/**
 * Acknowledge a reminder locally (sets acknowledgedAt and marks synced: false)
 */
export async function acknowledgeReminderLocally(reminderId) {
  try {
    const timestamp = new Date().toISOString();
    // Try finding by internal id or serverId
    let record = await db.reminders.get(reminderId);
    if (!record) {
      record = await db.reminders.where('serverId').equals(reminderId).first();
    }

    if (record) {
      await db.reminders.update(record.id, {
        acknowledgedAt: timestamp,
        synced: false,
      });

      // Queue acknowledgment action for backend sync
      await db.offlineQueue.add({
        action: 'ACKNOWLEDGE_REMINDER',
        payload: {
          reminderId: record.serverId || record.id,
          acknowledgedAt: timestamp,
        },
        createdAt: timestamp,
        status: 'pending',
      });

      return { ...record, acknowledgedAt: timestamp };
    }
  } catch (err) {
    console.error('[Dexie DB] Error acknowledging reminder locally:', err);
  }
}
