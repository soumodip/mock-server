import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { z } from 'zod';

const fieldSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'object-json', 'array', 'array-string', 'array-number']),
  required: z.boolean(),
  ref: z.string().optional(),
});

const objectSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  fields: z.array(fieldSchema),
  isEntity: z.boolean().optional(),
  isAdminPanelPage: z.boolean().optional(),
  allowedOperations: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE'])).optional(),
});

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const body = await readBody(event);
    const validated = objectSchema.parse(body);

    const filePath = resolve(process.cwd(), 'data/objects.json');
    const data = await readFile(filePath, 'utf-8');
    const objects = JSON.parse(data);

    // Find max objectIndex for this project and increment
    const projectObjects = objects.filter((o: any) => o.projectId === validated.projectId);
    const maxIndex = projectObjects.reduce((max: number, obj: any) => {
      const objIndex = obj.objectIndex ?? 0;
      return objIndex > max ? objIndex : max;
    }, -1);

    const newObject = {
      id: Date.now().toString(),
      ...validated,
      objectIndex: maxIndex + 1,
      createdAt: new Date().toISOString(),
    };

    objects.push(newObject);
    await writeFile(filePath, JSON.stringify(objects, null, 2));

    return newObject;
  } catch (error) {
    console.error('Error creating object:', error);
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to create object',
    });
  }
});
