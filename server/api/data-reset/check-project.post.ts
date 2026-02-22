import { isDataResetEnabled, isProjectExpired, deleteProject } from '../../utils/data-reset';
import { validateAuth } from '../../utils/auth';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Check if a specific project has expired and delete it if so.
 * This endpoint validates that the project's time has actually arrived
 * before deleting - it's not a direct delete endpoint.
 *
 * Auth: Requires valid auth when IS_AUTH is enabled, preventing
 * unauthenticated users from triggering project deletion.
 */
export default defineEventHandler(async (event) => {
  // Validate auth when enabled — prevents unauthenticated deletion triggers
  validateAuth(event);

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
    const projectsPath = resolve(process.cwd(), 'data/projects.json');
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
    if (!project.createdAt || !isProjectExpired(project.createdAt)) {
      return {
        deleted: false,
        reason: 'Project has not expired yet'
      };
    }

    // Project has expired — delegate to the shared deleteProject utility
    // which handles race-condition locking internally
    const deleted = await deleteProject(projectId);

    if (deleted) {
      console.log(`[Data Reset] Immediately deleted expired project: ${projectId}`);
    }

    return {
      deleted,
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
