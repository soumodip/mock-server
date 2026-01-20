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
  objectIndex: z.number().optional(),
});

async function regenerateApiResponses(objectId: string, objects: any[]) {
  // Read APIs
  const apisPath = resolve(process.cwd(), 'data/apis.json');
  const apisData = await readFile(apisPath, 'utf-8');
  const apis = JSON.parse(apisData);

  // Check which APIs use this object
  const affectedApis = apis.filter((api: any) => api.responseObjectId === objectId);

  if (affectedApis.length === 0) return;

  // Build objects map for mock generation
  const objectsMap = new Map();
  objects.forEach((obj: any) => {
    objectsMap.set(obj.id, obj);
  });

  // Regenerate response for each affected API
  for (const api of affectedApis) {
    const apiIndex = apis.findIndex((a: any) => a.id === api.id);
    if (apiIndex === -1) continue;

    const responseObject = objectsMap.get(api.responseObjectId);
    if (responseObject) {
      // Generate new mock data
      const mockData = generateMockDataForObject(responseObject, objectsMap);
      apis[apiIndex].responseValue = JSON.stringify(mockData, null, 2);
    }
  }

  // Save updated APIs
  await writeFile(apisPath, JSON.stringify(apis, null, 2));
}

function generateMockDataForObject(schema: any, objectsMap: Map<string, any>, depth = 0): any {
  if (depth > 3) return null;

  const result: any = {};

  for (const field of schema.fields) {
    result[field.name] = generateFieldValue(field, objectsMap, depth);
  }

  return result;
}

function generateFieldValue(field: any, objectsMap: Map<string, any>, depth: number): any {
  switch (field.type) {
    case 'string':
      return generateRandomString(field.name);
    case 'number':
      return generateRandomNumber(field.name);
    case 'boolean':
      return Math.random() > 0.5;
    case 'object':
      if (field.ref && objectsMap.has(field.ref)) {
        const refSchema = objectsMap.get(field.ref);
        return generateMockDataForObject(refSchema, objectsMap, depth + 1);
      }
      return {};
    case 'object-json':
      return {};
    case 'array':
      if (field.ref && objectsMap.has(field.ref)) {
        const refSchema = objectsMap.get(field.ref);
        const arrayLength = Math.floor(Math.random() * 3) + 1;
        return Array.from({ length: arrayLength }, () =>
          generateMockDataForObject(refSchema, objectsMap, depth + 1)
        );
      }
      return [];
    case 'array-string': {
      const arrayLength = Math.floor(Math.random() * 3) + 1;
      return Array.from({ length: arrayLength }, () =>
        generateRandomString(field.name)
      );
    }
    case 'array-number': {
      const arrayLength = Math.floor(Math.random() * 3) + 1;
      return Array.from({ length: arrayLength }, () =>
        generateRandomNumber(field.name)
      );
    }
    default:
      return null;
  }
}

function generateRandomString(fieldName: string): string {
  const lowerFieldName = fieldName.toLowerCase();

  if (lowerFieldName.includes('email')) {
    return `user${Math.floor(Math.random() * 1000)}@example.com`;
  }
  if (lowerFieldName.includes('name') || lowerFieldName.includes('first')) {
    const names = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana'];
    return names[Math.floor(Math.random() * names.length)]!;
  }
  if (lowerFieldName.includes('last')) {
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    return lastNames[Math.floor(Math.random() * lastNames.length)]!;
  }
  if (lowerFieldName.includes('phone')) {
    return `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }
  if (lowerFieldName.includes('url') || lowerFieldName.includes('link')) {
    return `https://example.com/${Math.random().toString(36).substring(7)}`;
  }
  if (lowerFieldName.includes('date') || lowerFieldName.includes('time') || lowerFieldName.includes('created') || lowerFieldName.includes('updated')) {
    return new Date(Date.now() - Math.random() * 31536000000).toISOString();
  }
  if (lowerFieldName.includes('id')) {
    return Math.random().toString(36).substring(2, 11);
  }
  if (lowerFieldName.includes('password')) {
    return '********';
  }
  if (lowerFieldName.includes('description') || lowerFieldName.includes('message') || lowerFieldName.includes('bio')) {
    return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  }
  if (lowerFieldName.includes('title') || lowerFieldName.includes('subject')) {
    const titles = ['Hello World', 'Sample Title', 'Test Subject', 'Mock Data'];
    return titles[Math.floor(Math.random() * titles.length)]!;
  }
  if (lowerFieldName.includes('address')) {
    return `${Math.floor(Math.random() * 9999) + 1} Main St, Anytown, USA`;
  }
  if (lowerFieldName.includes('city')) {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    return cities[Math.floor(Math.random() * cities.length)]!;
  }
  if (lowerFieldName.includes('country')) {
    const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany'];
    return countries[Math.floor(Math.random() * countries.length)]!;
  }
  if (lowerFieldName.includes('color')) {
    const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];
    return colors[Math.floor(Math.random() * colors.length)]!;
  }
  if (lowerFieldName.includes('company')) {
    const companies = ['Acme Corp', 'Globex Inc', 'Soylent Corp', 'Initech', 'Umbrella Corp'];
    return companies[Math.floor(Math.random() * companies.length)]!;
  }

  return `sample_${Math.random().toString(36).substring(2, 10)}`;
}

function generateRandomNumber(fieldName: string): number {
  const lowerFieldName = fieldName.toLowerCase();

  if (lowerFieldName.includes('age')) {
    return Math.floor(Math.random() * 60) + 18;
  }
  if (lowerFieldName.includes('price') || lowerFieldName.includes('amount') || lowerFieldName.includes('cost')) {
    return Math.floor(Math.random() * 10000) / 100;
  }
  if (lowerFieldName.includes('quantity') || lowerFieldName.includes('count')) {
    return Math.floor(Math.random() * 100) + 1;
  }
  if (lowerFieldName.includes('year')) {
    return Math.floor(Math.random() * 30) + 1994;
  }

  return Math.floor(Math.random() * 1000);
}

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    const validated = objectSchema.partial().parse(body);

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

    objects[index] = {
      ...objects[index],
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    await writeFile(filePath, JSON.stringify(objects, null, 2));

    // Regenerate API responses that use this object
    await regenerateApiResponses(id as any, objects);

    return objects[index];
  } catch (error) {
    console.error('Error updating object:', error);
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to update object',
    });
  }
});
