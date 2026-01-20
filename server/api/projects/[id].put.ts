import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { z } from 'zod';
import { generateMockData } from '~/utils/generateMockData';
import type { ObjectSchema } from '~/stores/object';

const groupSchema = z.union([
  z.string(),
  z.object({
    name: z.string(),
    isAdminPanelPage: z.boolean().default(false),
  }),
]);

const projectSchema = z.object({
  name: z.string(),
  isAuth: z.boolean().optional().default(false),
  accessToken: z.string().optional().default(''),
  authType: z.enum([
    'api-key',
    'bearer-token',
    'basic-auth',
    'digest-auth',
    'oauth1',
    'oauth2',
    'hawk',
    'aws-signature',
    'akamai-edgegrid',
    'jwt-bearer'
  ]).optional(),
  authConfig: z.any(),
  groups: z.array(groupSchema).optional(),
});

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    const validated = projectSchema.parse(body);

    const projectsFilePath = resolve(process.cwd(), 'data/projects.json');
    const projectsData = await readFile(projectsFilePath, 'utf-8');
    const projects = JSON.parse(projectsData);

    const index = projects.findIndex((p: any) => p.id === id);

    if (index === -1) {
      throw createError({
        statusCode: 404,
        message: 'Project not found',
      });
    }

    const oldAccessToken = projects[index].accessToken;
    const newAccessToken = validated.accessToken;
    const accessTokenChanged = oldAccessToken !== newAccessToken;

    projects[index] = {
      ...projects[index],
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    await writeFile(projectsFilePath, JSON.stringify(projects, null, 2));

    // If access token changed, regenerate all API responses for this project
    if (accessTokenChanged) {
      const apisFilePath = resolve(process.cwd(), 'data/apis.json');
      const apisData = await readFile(apisFilePath, 'utf-8');
      const apis = JSON.parse(apisData);

      const objectsFilePath = resolve(process.cwd(), 'data/objects.json');
      const objectsData = await readFile(objectsFilePath, 'utf-8');
      const objects = JSON.parse(objectsData);

      const objectsMap = new Map<string, ObjectSchema>(
        objects.map((obj: ObjectSchema) => [obj.id, obj])
      );

      // Regenerate response values for all APIs in this project
      for (let i = 0; i < apis.length; i++) {
        if (apis[i].projectId === id && apis[i].responseObjectId) {
          const schema = objectsMap.get(apis[i].responseObjectId);
          if (schema) {
            const mockData = generateMockData(schema, objectsMap, 0, newAccessToken);
            apis[i].responseValue = JSON.stringify(mockData, null, 2);
          }
        }
      }

      await writeFile(apisFilePath, JSON.stringify(apis, null, 2));
    }

    return projects[index];
  } catch (error) {
    console.error('Error updating project:', error);
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to update project',
    });
  }
});
