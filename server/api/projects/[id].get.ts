import { readFile } from 'fs/promises';
import { resolve } from 'path';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const id = getRouterParam(event, 'id');
    const filePath = resolve(process.cwd(), 'data/projects.json');
    const data = await readFile(filePath, 'utf-8');
    const projects = JSON.parse(data);

    const project = projects.find((p: any) => p.id === id);

    if (!project) {
      throw createError({
        statusCode: 404,
        message: 'Project not found',
      });
    }

    return project;
  } catch (error: any) {
    console.error('Error fetching project:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch project',
    });
  }
});
