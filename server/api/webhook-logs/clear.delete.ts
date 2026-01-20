import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const query = getQuery(event);
    const projectId = query.projectId as string | undefined;
    const webhookId = query.webhookId as string | undefined;

    const db = getDatabase();

    if (webhookId) {
      const stmt = db.prepare('DELETE FROM webhook_logs WHERE webhookId = ?');
      const result = stmt.run(webhookId);
      return {
        success: true,
        message: `Cleared ${result.changes} webhook logs for webhook`,
        deleted: result.changes,
      };
    } else if (projectId) {
      const stmt = db.prepare('DELETE FROM webhook_logs WHERE projectId = ?');
      const result = stmt.run(projectId);
      return {
        success: true,
        message: `Cleared ${result.changes} webhook logs for project`,
        deleted: result.changes,
      };
    } else {
      const stmt = db.prepare('DELETE FROM webhook_logs');
      const result = stmt.run();
      return {
        success: true,
        message: `Cleared all ${result.changes} webhook logs`,
        deleted: result.changes,
      };
    }
  } catch (error) {
    console.error('Error clearing webhook logs:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to clear webhook logs',
    });
  }
});
