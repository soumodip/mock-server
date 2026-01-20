import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { z } from 'zod';

const paramSchema = z.object({
  key: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  required: z.boolean(),
});

const validatorSchema = z.object({
  field: z.string(),
  rule: z.string(),
  message: z.string(),
});

const statusMockSchema = z.object({
  statusCode: z.number(),
  headerParams: z.array(paramSchema).optional(),
  queryParams: z.array(paramSchema).optional(),
  bodyParams: z.array(paramSchema).optional(),
  validators: z.array(validatorSchema).optional(),
  responseObjectId: z.string(),
  responseValue: z.string().optional(),
  enabled: z.boolean(),
});

const contentTypeSchema = z.enum([
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'application/xml',
  'text/xml',
  'application/graphql',
]);

const apiSchema = z.object({
  projectId: z.string().optional(),
  endpoint: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
  contentType: contentTypeSchema.optional(),
  statusMocks: z.array(statusMockSchema).optional(),
  errorResponseObjectId: z.string().optional(),
  errorResponseValue: z.string().optional(),
  enabled: z.boolean().optional(),
  isAuth: z.boolean().optional(),
  apiIndex: z.number().optional(),
  group: z.string().optional(),
  isAdminEndpoint: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    const validated = apiSchema.parse(body);

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

    apis[index] = {
      ...apis[index],
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    await writeFile(filePath, JSON.stringify(apis, null, 2));

    return apis[index];
  } catch (error) {
    console.error('Error updating API:', error);
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to update API',
    });
  }
});
