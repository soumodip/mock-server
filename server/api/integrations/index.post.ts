import { getDatabase } from '../../utils/db';
import { z } from 'zod';

const integrationSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().min(1),
  allowedOrigins: z.array(z.string()).optional(),
});

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const body = await readBody(event);
    const validated = integrationSchema.parse(body);

    const db = getDatabase();

    const newIntegration = {
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: validated.name,
      projectId: validated.projectId,
      isActive: 1,
      allowedOrigins: validated.allowedOrigins ? JSON.stringify(validated.allowedOrigins) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stmt = db.prepare(`
      INSERT INTO integrations (id, name, projectId, isActive, allowedOrigins, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newIntegration.id,
      newIntegration.name,
      newIntegration.projectId,
      newIntegration.isActive,
      newIntegration.allowedOrigins,
      newIntegration.createdAt,
      newIntegration.updatedAt
    );

    return {
      ...newIntegration,
      isActive: Boolean(newIntegration.isActive),
      allowedOrigins: validated.allowedOrigins || [],
    };
  } catch (error) {
    console.error('Error creating integration:', error);
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to create integration',
    });
  }
});
