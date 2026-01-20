import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Log ID is required',
      });
    }

    const db = getDatabase();

    // Check if log exists
    const checkStmt = db.prepare('SELECT id FROM webhook_logs WHERE id = ?');
    const existing = checkStmt.get(id);

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Webhook log not found',
      });
    }

    // Delete the log
    const deleteStmt = db.prepare('DELETE FROM webhook_logs WHERE id = ?');
    deleteStmt.run(id);

    return {
      success: true,
      message: 'Webhook log deleted',
    };
  } catch (error) {
    console.error('Error deleting webhook log:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to delete webhook log',
    });
  }
});
