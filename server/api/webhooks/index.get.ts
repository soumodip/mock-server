import { getDatabase } from '../../utils/db';

interface Webhook {
  id: string;
  projectId: string;
  webhookIndex: number;
  isPinned: number;
  createdAt: string;
}

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const query = getQuery(event);
    const projectId = query.projectId as string;

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required',
      });
    }

    const db = getDatabase();
    const webhooks = db.prepare(`
      SELECT * FROM webhooks
      WHERE projectId = ?
      ORDER BY isPinned DESC, webhookIndex ASC
    `).all(projectId) as Webhook[];

    // Convert isPinned from integer to boolean for frontend
    const formattedWebhooks = webhooks.map(w => ({
      ...w,
      isPinned: w.isPinned === 1,
    }));

    return { webhooks: formattedWebhooks };
  } catch (error) {
    console.error('Failed to fetch webhooks:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to fetch webhooks',
    });
  }
});
