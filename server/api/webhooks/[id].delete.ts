import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Webhook ID is required',
      });
    }

    const db = getDatabase();

    // Get the webhook first to return its info
    const webhook = db.prepare(`SELECT * FROM webhooks WHERE id = ?`).get(id);

    if (!webhook) {
      throw createError({
        statusCode: 404,
        message: 'Webhook not found',
      });
    }

    // Delete all logs associated with this webhook
    db.prepare(`DELETE FROM webhook_logs WHERE webhookId = ?`).run(id);

    // Delete the webhook
    db.prepare(`DELETE FROM webhooks WHERE id = ?`).run(id);

    return {
      success: true,
      message: 'Webhook deleted successfully',
    };
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to delete webhook',
    });
  }
});
