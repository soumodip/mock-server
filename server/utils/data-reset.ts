import { getDatabase } from './db';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

// Track the last reset timestamp
let lastResetTime: string | null = null;

// Track project IDs currently being deleted to prevent race conditions
const deletionsInProgress = new Set<string>();

/**
 * Get the data reset interval from environment variable
 * Returns 0 if disabled
 */
export function getDataResetIntervalMs(): number {
  return parseInt(process.env.DATA_RESET_INTERVAL_MS || '3600000');
}

/**
 * Check if data reset is enabled.
 * Requires IS_DATA_RESET_MODE=true AND a positive interval.
 */
export function isDataResetEnabled(): boolean {
  return process.env.IS_DATA_RESET_MODE === 'true' && getDataResetIntervalMs() > 0;
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
 * Check if a project has expired based on its createdAt time
 */
export function isProjectExpired(createdAt: string): boolean {
  if (!isDataResetEnabled()) return false;
  const intervalMs = getDataResetIntervalMs();
  const cutoffTime = new Date(Date.now() - intervalMs).toISOString();
  return createdAt < cutoffTime;
}

/**
 * Delete a single project and all its associated data.
 * Uses a lock set to prevent concurrent deletions of the same project.
 * Returns true if the project was actually deleted.
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  // Prevent concurrent deletion of the same project (race condition guard)
  if (deletionsInProgress.has(projectId)) {
    return false;
  }

  deletionsInProgress.add(projectId);

  try {
    const db = getDatabase();
    const projectsPath = resolve(process.cwd(), 'data/projects.json');
    const apisPath = resolve(process.cwd(), 'data/apis.json');
    const objectsPath = resolve(process.cwd(), 'data/objects.json');

    // Read projects
    const projectsData = await readFile(projectsPath, 'utf-8');
    const projects = JSON.parse(projectsData);

    // Verify the project actually exists before attempting deletion
    const projectExists = projects.some((p: any) => p.id === projectId);
    if (!projectExists) {
      return false;
    }

    // Filter out the project from projects.json
    const remainingProjects = projects.filter((p: any) => p.id !== projectId);

    // Filter APIs
    const apisData = await readFile(apisPath, 'utf-8');
    const apis = JSON.parse(apisData);
    const filteredApis = apis.filter((api: any) => api.projectId !== projectId);

    // Filter Objects
    const objectsData = await readFile(objectsPath, 'utf-8');
    const objects = JSON.parse(objectsData);
    const filteredObjects = objects.filter((obj: any) => obj.projectId !== projectId);

    // Write all changes to JSON files
    await Promise.all([
      writeFile(projectsPath, JSON.stringify(remainingProjects, null, 2)),
      writeFile(apisPath, JSON.stringify(filteredApis, null, 2)),
      writeFile(objectsPath, JSON.stringify(filteredObjects, null, 2))
    ]);

    // Cascade delete from SQLite tables
    db.prepare('DELETE FROM webhook_logs WHERE projectId = ?').run(projectId);
    db.prepare('DELETE FROM webhooks WHERE projectId = ?').run(projectId);
    db.prepare(`
      DELETE FROM session_responses
      WHERE sessionId IN (
        SELECT s.id FROM sessions s
        INNER JOIN integrations i ON s.integrationId = i.id
        WHERE i.projectId = ?
      )
    `).run(projectId);
    db.prepare(`
      DELETE FROM sessions
      WHERE integrationId IN (
        SELECT id FROM integrations WHERE projectId = ?
      )
    `).run(projectId);
    db.prepare('DELETE FROM integrations WHERE projectId = ?').run(projectId);

    return true;
  } catch (error) {
    console.error(`[Data Reset] Error deleting project ${projectId}:`, error);
    return false;
  } finally {
    deletionsInProgress.delete(projectId);
  }
}

/**
 * Delete all projects that have exceeded the data reset interval
 */
export async function deleteExpiredProjects(): Promise<number> {
  if (!isDataResetEnabled()) {
    return 0;
  }

  try {
    const intervalMs = getDataResetIntervalMs();
    const cutoffTime = new Date(Date.now() - intervalMs).toISOString();

    const projectsPath = resolve(process.cwd(), 'data/projects.json');
    const projectsData = await readFile(projectsPath, 'utf-8');
    const projects = JSON.parse(projectsData);

    // Find projects to delete (those older than the interval)
    const projectsToDelete = projects.filter((p: any) => {
      const createdAt = p.createdAt;
      if (!createdAt) return false;
      return createdAt < cutoffTime;
    });

    if (projectsToDelete.length === 0) {
      return 0;
    }

    let deletedCount = 0;
    for (const project of projectsToDelete) {
      const deleted = await deleteProject(project.id);
      if (deleted) deletedCount++;
    }

    if (deletedCount > 0) {
      // Update last reset time
      lastResetTime = new Date().toISOString();
      console.log(`[Data Reset] Deleted ${deletedCount} expired project(s) and their associated data`);
    }

    return deletedCount;
  } catch (error) {
    console.error('[Data Reset] Error deleting expired projects:', error);
    return 0;
  }
}

/**
 * Start the data reset cron job
 */
export function startDataResetCron() {
  if (!isDataResetEnabled()) {
    console.log('[Data Reset] Disabled (IS_DATA_RESET_MODE is not true or DATA_RESET_INTERVAL_MS is 0)');
    return;
  }

  const intervalMs = getDataResetIntervalMs();
  const intervalMinutes = Math.round(intervalMs / 60000);

  // Set initial last reset time to now
  lastResetTime = new Date().toISOString();

  // Run cleanup immediately on startup
  deleteExpiredProjects();

  // Check for expired projects every minute
  setInterval(() => {
    deleteExpiredProjects();
  }, 60 * 1000);

  console.log(`[Data Reset] Cron job started - projects older than ${intervalMinutes} minutes will be deleted`);
}
