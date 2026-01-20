import { readFile } from 'fs/promises';
import { resolve } from 'path';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const id = getRouterParam(event, 'id');
    const filePath = resolve(process.cwd(), 'data/objects.json');
    const data = await readFile(filePath, 'utf-8');
    const objects = JSON.parse(data);

    const object = objects.find((o: any) => o.id === id);

    if (!object) {
      throw createError({
        statusCode: 404,
        message: 'Object not found',
      });
    }

    return object;
  } catch (error) {
    console.error('Error reading object:', error);
    throw createError({
      statusCode: 404,
      message: 'Object not found',
    });
  }
});
