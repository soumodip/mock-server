import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const id = getRouterParam(event, 'id');
    const filePath = resolve(process.cwd(), 'data/apis.json');
    const data = await readFile(filePath, 'utf-8');
    const apis = JSON.parse(data);

    const index = apis.findIndex((a: any) => a.id === id);

    if (index === -1) {
      throw createError({
        statusCode: 404,
        message: 'API not found',
      });
    }

    apis.splice(index, 1);
    await writeFile(filePath, JSON.stringify(apis, null, 2));

    return { success: true };
  } catch (error) {
    console.error('Error deleting API:', error);
    throw createError({
      statusCode: 400,
      message: 'Failed to delete API',
    });
  }
});
