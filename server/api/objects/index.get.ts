import { readFile } from 'fs/promises';
import { resolve } from 'path';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const query = getQuery(event);
    const projectId = query.projectId as string | undefined;

    const filePath = resolve(process.cwd(), 'data/objects.json');
    const data = await readFile(filePath, 'utf-8');
    let objects = JSON.parse(data);

    if (projectId) {
      objects = objects.filter((obj: any) => obj.projectId === projectId);
    }

    return objects;
  } catch (error) {
    console.error('Error reading objects:', error);
    return [];
  }
});
