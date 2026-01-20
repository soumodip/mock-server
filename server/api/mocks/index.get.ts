import { readFile } from 'fs/promises';
import { resolve } from 'path';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const query = getQuery(event);
    const projectId = query.projectId as string | undefined;

    const filePath = resolve(process.cwd(), 'data/apis.json');
    const data = await readFile(filePath, 'utf-8');
    let apis = JSON.parse(data);

    if (projectId) {
      apis = apis.filter((api: any) => api.projectId === projectId);
    }

    return apis;
  } catch (error) {
    console.error('Error reading APIs:', error);
    return [];
  }
});
