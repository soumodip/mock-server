import { getDatabase } from './db';

/**
 * Cleanup sessions that haven't been used in the last hour
 */
export function cleanupInactiveSessions() {
  try {
    const db = getDatabase();

    // Calculate the timestamp for 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Delete sessions that haven't been updated in the last hour
    const deleteStmt = db.prepare('DELETE FROM sessions WHERE updatedAt < ?');
    const result = deleteStmt.run(oneHourAgo);

    const deletedCount = result.changes;
    if (deletedCount > 0) {
      console.log(`[Session Cleanup] Deleted ${deletedCount} inactive session(s)`);
    }

    return deletedCount;
  } catch (error) {
    console.error('[Session Cleanup] Error cleaning up sessions:', error);
    return 0;
  }
}

/**
 * Start the session cleanup cron job (runs every 15 minutes)
 */
export function startSessionCleanupCron() {
  // Run cleanup immediately on startup
  cleanupInactiveSessions();

  // Run cleanup every 15 minutes
  setInterval(() => {
    cleanupInactiveSessions();
  }, 15 * 60 * 1000);

  console.log('[Session Cleanup] Cron job started - will run every 15 minutes');
}
