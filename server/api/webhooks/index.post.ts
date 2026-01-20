import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const body = await readBody(event);
    const { projectId } = body;

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required',
      });
    }

    const db = getDatabase();

    // Get the next webhook index for this project
    const maxIndexResult = db.prepare(`
      SELECT MAX(webhookIndex) as maxIndex FROM webhooks WHERE projectId = ?
    `).get(projectId) as { maxIndex: number | null };

    const nextIndex = (maxIndexResult?.maxIndex ?? 0) + 1;

    // Generate unique ID
    const id = `wbhk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Insert new webhook
    db.prepare(`
      INSERT INTO webhooks (id, projectId, webhookIndex, createdAt)
      VALUES (?, ?, ?, ?)
    `).run(id, projectId, nextIndex, now);

    return {
      webhook: {
        id,
        projectId,
        webhookIndex: nextIndex,
        createdAt: now,
      }
    };
  } catch (error) {
    console.error('Failed to create webhook:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to create webhook',
    });
  }
});
