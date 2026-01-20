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
  projectId: z.string(),
  endpoint: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  contentType: contentTypeSchema.optional(),
  statusMocks: z.array(statusMockSchema),
  errorResponseObjectId: z.string(),
  errorResponseValue: z.string().optional(),
  enabled: z.boolean().default(true),
  isAuth: z.boolean().default(false),
  apiIndex: z.number().optional(),
  group: z.string().optional(),
  isAdminEndpoint: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const body = await readBody(event);
    const validated = apiSchema.parse(body);

    const filePath = resolve(process.cwd(), 'data/apis.json');
    const data = await readFile(filePath, 'utf-8');
    const apis = JSON.parse(data);

    // If apiIndex is not provided, auto-generate it
    let apiIndex = validated.apiIndex;
    if (apiIndex === undefined || apiIndex === null) {
      // Find max apiIndex for this project and add 1
      const projectApis = apis.filter((a: any) => a.projectId === validated.projectId);
      const maxIndex = projectApis.reduce((max: number, api: any) => {
        const idx = api.apiIndex ?? -1;
        return idx > max ? idx : max;
      }, -1);
      apiIndex = maxIndex + 1;
    }

    const newApi = {
      id: Date.now().toString(),
      ...validated,
      apiIndex,
      createdAt: new Date().toISOString(),
    };

    apis.push(newApi);
    await writeFile(filePath, JSON.stringify(apis, null, 2));

    return newApi;
  } catch (error) {
    console.error('Error creating API:', error);
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to create API',
    });
  }
});
