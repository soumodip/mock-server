import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

async function nullifyObjectReferences(objectId: string) {
  // Read APIs
  const apisPath = resolve(process.cwd(), 'data/apis.json');
  const apisData = await readFile(apisPath, 'utf-8');
  const apis = JSON.parse(apisData);

  let hasChanges = false;

  // Nullify all references to the deleted object
  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];

    // Check errorResponseObjectId
    if (api.errorResponseObjectId === objectId) {
      apis[i].errorResponseObjectId = '';
      hasChanges = true;
    }

    // Check statusMocks
    if (api.statusMocks && Array.isArray(api.statusMocks)) {
      for (let j = 0; j < api.statusMocks.length; j++) {
        if (api.statusMocks[j].responseObjectId === objectId) {
          apis[i].statusMocks[j].responseObjectId = '';
          hasChanges = true;
        }
      }
    }
  }

  // Save updated APIs if there were changes
  if (hasChanges) {
    await writeFile(apisPath, JSON.stringify(apis, null, 2));
  }
}

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const id = getRouterParam(event, 'id');
    const filePath = resolve(process.cwd(), 'data/objects.json');
    const data = await readFile(filePath, 'utf-8');
    const objects = JSON.parse(data);

    const index = objects.findIndex((o: any) => o.id === id);

    if (index === -1) {
      throw createError({
        statusCode: 404,
        message: 'Object not found',
      });
    }

    // Nullify object references in APIs before deleting the object
    await nullifyObjectReferences(id);

    objects.splice(index, 1);
    await writeFile(filePath, JSON.stringify(objects, null, 2));

    return { success: true };
  } catch (error) {
    console.error('Error deleting object:', error);
    throw createError({
      statusCode: 400,
      message: 'Failed to delete object',
    });
  }
});
