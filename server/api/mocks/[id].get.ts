import { readFile } from 'fs/promises';
import { resolve } from 'path';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const id = getRouterParam(event, 'id');
    const filePath = resolve(process.cwd(), 'data/apis.json');
    const data = await readFile(filePath, 'utf-8');
    const apis = JSON.parse(data);

    const api = apis.find((a: any) => a.id === id);

    if (!api) {
      throw createError({
        statusCode: 404,
        message: 'API not found',
      });
    }

    return api;
  } catch (error) {
    console.error('Error reading API:', error);
    throw createError({
      statusCode: 404,
      message: 'API not found',
    });
  }
});
