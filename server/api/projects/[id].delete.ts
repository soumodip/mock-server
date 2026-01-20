import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const id = getRouterParam(event, 'id');
    const projectsPath = resolve(process.cwd(), 'data/projects.json');
    const apisPath = resolve(process.cwd(), 'data/apis.json');
    const objectsPath = resolve(process.cwd(), 'data/objects.json');

    // Read all data files
    const projectsData = await readFile(projectsPath, 'utf-8');
    const projects = JSON.parse(projectsData);

    const index = projects.findIndex((p: any) => p.id === id);

    if (index === -1) {
      throw createError({
        statusCode: 404,
        message: 'Project not found',
      });
    }

    // Delete the project
    projects.splice(index, 1);

    // Cascade delete: Remove all APIs associated with this project
    const apisData = await readFile(apisPath, 'utf-8');
    const apis = JSON.parse(apisData);
    const filteredApis = apis.filter((api: any) => api.projectId !== id);

    // Cascade delete: Remove all Objects associated with this project
    const objectsData = await readFile(objectsPath, 'utf-8');
    const objects = JSON.parse(objectsData);
    const filteredObjects = objects.filter((obj: any) => obj.projectId !== id);

    // Write all changes
    await Promise.all([
      writeFile(projectsPath, JSON.stringify(projects, null, 2)),
      writeFile(apisPath, JSON.stringify(filteredApis, null, 2)),
      writeFile(objectsPath, JSON.stringify(filteredObjects, null, 2))
    ]);

    // Cascade delete: Remove all webhooks and webhook logs for this project
    const db = getDatabase();
    db.prepare('DELETE FROM webhook_logs WHERE projectId = ?').run(id);
    db.prepare('DELETE FROM webhooks WHERE projectId = ?').run(id);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to delete project',
    });
  }
});
