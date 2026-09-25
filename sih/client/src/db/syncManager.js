import { db } from './dexieDb';

class SyncManager {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
    this.listeners = new Set();
  }

  init() {
    // Listen for online events to sync immediately
    window.addEventListener('online', () => {
      console.log('[SyncManager] Browser is online. Triggering sync...');
      this.notifyListeners({ status: 'online' });
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      console.log('[SyncManager] Browser went offline.');
      this.notifyListeners({ status: 'offline' });
    });

    // Run periodic sync check every 25 seconds if online
    if (!this.syncInterval) {
      this.syncInterval = setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.syncNow();
        }
      }, 25000);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('Error in sync listener:', e);
      }
    });
  }

  async syncNow() {
    if (!navigator.onLine || this.isSyncing) return;

    this.isSyncing = true;
    this.notifyListeners({ status: 'syncing' });

    try {
      // 1. Sync unsynced game sessions
      const unsyncedSessions = await db.gameSessions.where('synced').equals(0).or('synced').equals(false).toArray();
      if (unsyncedSessions.length > 0) {
        console.log(`[SyncManager] Pushing ${unsyncedSessions.length} offline game sessions to server...`);
        const res = await fetch('/api/game-sessions/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessions: unsyncedSessions }),
        });

        if (res.ok) {
          // Mark all as synced
          for (const s of unsyncedSessions) {
            await db.gameSessions.update(s.id, { synced: true, syncedAt: new Date().toISOString() });
          }
          console.log(`[SyncManager] Successfully synced ${unsyncedSessions.length} sessions.`);
        }
      }

      // 2. Sync queued offline actions (e.g. reminder acknowledgments)
      const pendingQueue = await db.offlineQueue.where('status').equals('pending').toArray();
      const acksToSync = pendingQueue
        .filter((q) => q.action === 'ACKNOWLEDGE_REMINDER')
        .map((q) => q.payload);

      if (acksToSync.length > 0) {
        console.log(`[SyncManager] Pushing ${acksToSync.length} reminder acknowledgments to server...`);
        const ackRes = await fetch('/api/reminders/batch-acknowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acknowledgments: acksToSync }),
        });

        if (ackRes.ok) {
          for (const q of pendingQueue) {
            await db.offlineQueue.update(q.id, { status: 'synced' });
          }
          console.log(`[SyncManager] Successfully synced reminder acknowledgments.`);
        }
      }

      this.notifyListeners({ status: 'synced', lastSynced: new Date().toLocaleTimeString() });
    } catch (err) {
      console.warn('[SyncManager] Sync failed or server unreachable:', err.message);
      this.notifyListeners({ status: 'error', error: err.message });
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncManager = new SyncManager();
