import { getDatabase } from '../../../utils/db';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Webhook ID is required',
      });
    }

    const db = getDatabase();

    // Get current webhook
    const webhook = db.prepare(`SELECT * FROM webhooks WHERE id = ?`).get(id) as { id: string; isPinned: number } | undefined;

    if (!webhook) {
      throw createError({
        statusCode: 404,
        message: 'Webhook not found',
      });
    }

    // Toggle the pin status
    const newPinStatus = webhook.isPinned ? 0 : 1;
    db.prepare(`UPDATE webhooks SET isPinned = ? WHERE id = ?`).run(newPinStatus, id);

    return {
      success: true,
      isPinned: newPinStatus === 1,
    };
  } catch (error) {
    console.error('Failed to toggle webhook pin status:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to toggle webhook pin status',
    });
  }
});
