import { getDatabase } from './db';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

// Track the last reset timestamp
let lastResetTime: string | null = null;

/**
 * Get the data reset interval from environment variable
 * Returns 0 if disabled
 */
export function getDataResetIntervalMs(): number {
  return parseInt(process.env.DATA_RESET_INTERVAL_MS || '3600000');
}

/**
 * Check if data reset is enabled
 */
export function isDataResetEnabled(): boolean {
  return getDataResetIntervalMs() > 0;
}

/**
 * Get the last reset timestamp
 */
export function getLastResetTime(): string | null {
  return lastResetTime;
}

/**
 * Get the next reset time based on last reset and interval
 */
export function getNextResetTime(): string | null {
  if (!lastResetTime || !isDataResetEnabled()) return null;
  const intervalMs = getDataResetIntervalMs();
  const nextReset = new Date(new Date(lastResetTime).getTime() + intervalMs);
  return nextReset.toISOString();
}

/**
 * Delete all projects that have exceeded the data reset interval
 * This cascades to delete all related data (APIs, objects, webhooks, etc.)
 */
export async function deleteExpiredProjects(): Promise<number> {
  if (!isDataResetEnabled()) {
    return 0;
  }

  try {
    const db = getDatabase();
    const intervalMs = getDataResetIntervalMs();
    const cutoffTime = new Date(Date.now() - intervalMs).toISOString();

    const projectsPath = resolve(process.cwd(), 'data/projects.json');
    const apisPath = resolve(process.cwd(), 'data/apis.json');
    const objectsPath = resolve(process.cwd(), 'data/objects.json');

    // Read all data files
    const projectsData = await readFile(projectsPath, 'utf-8');
    const projects = JSON.parse(projectsData);

    // Find projects to delete (those older than the interval)
    const projectsToDelete = projects.filter((p: any) => {
      const createdAt = p.createdAt;
      if (!createdAt) return false; // Skip projects without createdAt
      return createdAt < cutoffTime;
    });

    if (projectsToDelete.length === 0) {
      return 0;
    }

    const projectIdsToDelete = projectsToDelete.map((p: any) => p.id);

    // Filter out deleted projects
    const remainingProjects = projects.filter((p: any) => !projectIdsToDelete.includes(p.id));

    // Filter APIs - remove all with matching projectId
    const apisData = await readFile(apisPath, 'utf-8');
    const apis = JSON.parse(apisData);
    const filteredApis = apis.filter((api: any) => !projectIdsToDelete.includes(api.projectId));

    // Filter Objects - remove all with matching projectId
    const objectsData = await readFile(objectsPath, 'utf-8');
    const objects = JSON.parse(objectsData);
    const filteredObjects = objects.filter((obj: any) => !projectIdsToDelete.includes(obj.projectId));

    // Write all changes to JSON files
    await Promise.all([
      writeFile(projectsPath, JSON.stringify(remainingProjects, null, 2)),
      writeFile(apisPath, JSON.stringify(filteredApis, null, 2)),
      writeFile(objectsPath, JSON.stringify(filteredObjects, null, 2))
    ]);

    // Cascade delete from SQLite tables for each deleted project
    for (const projectId of projectIdsToDelete) {
      // Delete webhook logs
      db.prepare('DELETE FROM webhook_logs WHERE projectId = ?').run(projectId);
      // Delete webhooks
      db.prepare('DELETE FROM webhooks WHERE projectId = ?').run(projectId);
      // Delete session_responses for sessions belonging to integrations of this project
      db.prepare(`
        DELETE FROM session_responses
        WHERE sessionId IN (
          SELECT s.id FROM sessions s
          INNER JOIN integrations i ON s.integrationId = i.id
          WHERE i.projectId = ?
        )
      `).run(projectId);
      // Delete sessions for integrations of this project
      db.prepare(`
        DELETE FROM sessions
        WHERE integrationId IN (
          SELECT id FROM integrations WHERE projectId = ?
        )
      `).run(projectId);
      // Delete integrations
      db.prepare('DELETE FROM integrations WHERE projectId = ?').run(projectId);
    }

    // Update last reset time
    lastResetTime = new Date().toISOString();

    console.log(`[Data Reset] Deleted ${projectsToDelete.length} expired project(s) and their associated data`);
    return projectsToDelete.length;
  } catch (error) {
    console.error('[Data Reset] Error deleting expired projects:', error);
    return 0;
  }
}

/**
 * Start the data reset cron job
 * Checks for expired projects based on the DATA_RESET_INTERVAL_MS setting
 */
export function startDataResetCron() {
  if (!isDataResetEnabled()) {
    console.log('[Data Reset] Disabled (DATA_RESET_INTERVAL_MS is 0 or not set)');
    return;
  }

  const intervalMs = getDataResetIntervalMs();
  const intervalMinutes = Math.round(intervalMs / 60000);

  // Set initial last reset time to now
  lastResetTime = new Date().toISOString();

  // Run cleanup immediately on startup
  deleteExpiredProjects();

  // Check for expired projects every minute (more responsive than the full interval)
  // The actual deletion happens only when projects exceed the configured interval
  setInterval(() => {
    deleteExpiredProjects();
  }, 60 * 1000); // Check every minute

  console.log(`[Data Reset] Cron job started - projects older than ${intervalMinutes} minutes will be deleted`);
}
