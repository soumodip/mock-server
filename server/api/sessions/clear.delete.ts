import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  validatePermission(event);
  validateDocsMode(event);

  try {
    const query = getQuery(event);
    const integrationId = query.integrationId as string | undefined;

    if (!integrationId) {
      throw createError({
        statusCode: 400,
        message: 'integrationId is required',
      });
    }

    const db = getDatabase();

    // First delete all session_responses for sessions belonging to this integration
    const deleteResponsesStmt = db.prepare(`
      DELETE FROM session_responses
      WHERE sessionId IN (SELECT id FROM sessions WHERE integrationId = ?)
    `);
    deleteResponsesStmt.run(integrationId);

    // Then delete all sessions for this integration
    const deleteSessionsStmt = db.prepare('DELETE FROM sessions WHERE integrationId = ?');
    const result = deleteSessionsStmt.run(integrationId);

    return {
      success: true,
      message: `Cleared ${result.changes} sessions for integration`,
      deleted: result.changes,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Error clearing sessions:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to clear sessions',
    });
  }
});
