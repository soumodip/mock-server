import { getDatabase } from '../../utils/db';
import { isDataResetEnabled, getDataResetIntervalMs } from '../../utils/data-reset';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Check if a specific project has expired and delete it if so.
 * This endpoint validates that the project's time has actually arrived
 * before deleting - it's not a direct delete endpoint.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { projectId } = body;

  if (!projectId) {
    throw createError({
      statusCode: 400,
      message: 'projectId is required'
    });
  }

  if (!isDataResetEnabled()) {
    return {
      deleted: false,
      reason: 'Data reset is not enabled'
    };
  }

  try {
    const intervalMs = getDataResetIntervalMs();
    const cutoffTime = new Date(Date.now() - intervalMs).toISOString();

    const projectsPath = resolve(process.cwd(), 'data/projects.json');
    const apisPath = resolve(process.cwd(), 'data/apis.json');
    const objectsPath = resolve(process.cwd(), 'data/objects.json');

    // Read projects
    const projectsData = await readFile(projectsPath, 'utf-8');
    const projects = JSON.parse(projectsData);

    // Find the specific project
    const project = projects.find((p: any) => p.id === projectId);

    if (!project) {
      return {
        deleted: false,
        reason: 'Project not found'
      };
    }

    // Check if project has actually expired
    if (!project.createdAt || project.createdAt >= cutoffTime) {
      return {
        deleted: false,
        reason: 'Project has not expired yet'
      };
    }

    // Project has expired - delete it and all related data
    const db = getDatabase();

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

    console.log(`[Data Reset] Immediately deleted expired project: ${projectId}`);

    return {
      deleted: true,
      projectId
    };
  } catch (error) {
    console.error('[Data Reset] Error checking/deleting project:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to check/delete project'
    });
  }
});
