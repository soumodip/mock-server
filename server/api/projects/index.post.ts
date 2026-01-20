import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { z } from 'zod';
import { getDatabase } from '../../utils/db';

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
  authConfig: z.any().optional(),
  groups: z.array(groupSchema).optional(),
});

const bulkImportSchema = z.object({
  project: z.any(),
  apis: z.array(z.any()),
  objects: z.array(z.any()),
});

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const body = await readBody(event);

    // Check if this is a bulk import (has project, apis, objects)
    if (body.project && body.apis && body.objects) {
      // Bulk import mode
      const validated = bulkImportSchema.parse(body);

      const projectsPath = resolve(process.cwd(), 'data/projects.json');
      const apisPath = resolve(process.cwd(), 'data/apis.json');
      const objectsPath = resolve(process.cwd(), 'data/objects.json');

      // Read existing data
      const projectsData = await readFile(projectsPath, 'utf-8');
      const apisData = await readFile(apisPath, 'utf-8');
      const objectsData = await readFile(objectsPath, 'utf-8');

      const projects = JSON.parse(projectsData);
      const apis = JSON.parse(apisData);
      const objects = JSON.parse(objectsData);

      // Generate new IDs for the imported data
      const oldProjectId = validated.project.id;
      const newProjectId = Date.now().toString();

      // Create ID mappings for objects
      const objectIdMap = new Map();
      validated.objects.forEach((obj: any) => {
        const oldId = obj.id;
        const newId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        objectIdMap.set(oldId, newId);
      });

      // Add project with new ID
      const newProject = {
        ...validated.project,
        id: newProjectId,
        createdAt: new Date().toISOString(),
      };
      projects.push(newProject);

      // Add APIs with new project ID and new IDs
      validated.apis.forEach((api: any, index: number) => {
        const newApi = {
          ...api,
          id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          projectId: newProjectId,
        };
        apis.push(newApi);
      });

      // Add objects with new project ID and new IDs, update references
      validated.objects.forEach((obj: any) => {
        const newObject = {
          ...obj,
          id: objectIdMap.get(obj.id),
          projectId: newProjectId,
          fields: obj.fields?.map((field: any) => {
            // Update object references in fields
            if (field.type === 'object' && field.ref) {
              return {
                ...field,
                ref: objectIdMap.get(field.ref) || field.ref,
              };
            }
            return field;
          }),
        };
        objects.push(newObject);
      });

      // Write updated data
      await writeFile(projectsPath, JSON.stringify(projects, null, 2));
      await writeFile(apisPath, JSON.stringify(apis, null, 2));
      await writeFile(objectsPath, JSON.stringify(objects, null, 2));

      // Create a default webhook for the imported project
      const db = getDatabase();
      const webhookId = `wbhk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO webhooks (id, projectId, webhookIndex, createdAt)
        VALUES (?, ?, ?, ?)
      `).run(webhookId, newProjectId, 1, now);

      return { success: true, projectId: newProjectId };
    } else {
      // Single project creation mode
      const validated = projectSchema.parse(body);

      const filePath = resolve(process.cwd(), 'data/projects.json');
      const data = await readFile(filePath, 'utf-8');
      const projects = JSON.parse(data);

      const newProject = {
        id: Date.now().toString(),
        name: validated.name,
        isAuth: validated.isAuth,
        accessToken: validated.accessToken,
        authType: validated.authType,
        authConfig: validated.authConfig,
        groups: validated.groups || [],
        createdAt: new Date().toISOString(),
      };

      projects.push(newProject);
      await writeFile(filePath, JSON.stringify(projects, null, 2));

      // Create a default webhook for the new project
      const db = getDatabase();
      const webhookId = `wbhk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO webhooks (id, projectId, webhookIndex, createdAt)
        VALUES (?, ?, ?, ?)
      `).run(webhookId, newProject.id, 1, now);

      return newProject;
    }
  } catch (error) {
    console.error('Error creating project:', error);
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to create project',
    });
  }
});
