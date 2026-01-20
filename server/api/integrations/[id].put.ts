import { getDatabase } from '../../utils/db';
import { z } from 'zod';

const integrationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  allowedOrigins: z.array(z.string()).optional(),
  primaryFont: z.string().optional(),
  codeFont: z.string().optional(),
  heading: z.string().optional(),
  allowPostmanDownload: z.boolean().optional(),
  expandToFullPage: z.boolean().optional(),
  displayEntities: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  isPrimaryDocs: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Integration ID is required',
      });
    }

    const body = await readBody(event);
    const validated = integrationUpdateSchema.parse(body);

    const db = getDatabase();

    // Check if integration exists
    const checkStmt = db.prepare('SELECT * FROM integrations WHERE id = ?');
    const existing = checkStmt.get(id);

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Integration not found',
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (validated.name !== undefined) {
      updates.push('name = ?');
      values.push(validated.name);
    }

    if (validated.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(validated.isActive ? 1 : 0);
    }

    if (validated.allowedOrigins !== undefined) {
      updates.push('allowedOrigins = ?');
      values.push(JSON.stringify(validated.allowedOrigins));
    }

    if (validated.primaryFont !== undefined) {
      updates.push('primaryFont = ?');
      values.push(validated.primaryFont);
    }

    if (validated.codeFont !== undefined) {
      updates.push('codeFont = ?');
      values.push(validated.codeFont);
    }

    if (validated.heading !== undefined) {
      updates.push('heading = ?');
      values.push(validated.heading);
    }

    if (validated.allowPostmanDownload !== undefined) {
      updates.push('allowPostmanDownload = ?');
      values.push(validated.allowPostmanDownload ? 1 : 0);
    }

    if (validated.expandToFullPage !== undefined) {
      updates.push('expandToFullPage = ?');
      values.push(validated.expandToFullPage ? 1 : 0);
    }

    if (validated.displayEntities !== undefined) {
      updates.push('displayEntities = ?');
      values.push(validated.displayEntities ? 1 : 0);
    }

    if (validated.theme !== undefined) {
      updates.push('theme = ?');
      values.push(validated.theme);
    }

    if (validated.isPrimaryDocs !== undefined) {
      // If setting as primary docs, clear any existing primary docs for the same project
      if (validated.isPrimaryDocs) {
        const existingData = existing as any;
        const clearPrimaryStmt = db.prepare(`
          UPDATE integrations SET isPrimaryDocs = 0 WHERE projectId = ? AND id != ?
        `);
        clearPrimaryStmt.run(existingData.projectId, id);
      }
      updates.push('isPrimaryDocs = ?');
      values.push(validated.isPrimaryDocs ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const updateStmt = db.prepare(`
        UPDATE integrations
        SET ${updates.join(', ')}
        WHERE id = ?
      `);

      updateStmt.run(...values);
    }

    // Fetch and return updated integration
    const updatedIntegration = checkStmt.get(id) as any;

    return {
      ...updatedIntegration,
      isActive: Boolean(updatedIntegration.isActive),
      allowedOrigins: updatedIntegration.allowedOrigins ? JSON.parse(updatedIntegration.allowedOrigins) : [],
      allowPostmanDownload: Boolean(updatedIntegration.allowPostmanDownload),
      expandToFullPage: Boolean(updatedIntegration.expandToFullPage),
      displayEntities: Boolean(updatedIntegration.displayEntities),
      isPrimaryDocs: Boolean(updatedIntegration.isPrimaryDocs),
    };
  } catch (error) {
    console.error('Error updating integration:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 400,
      message: error instanceof Error ? error.message : 'Failed to update integration',
    });
  }
});
