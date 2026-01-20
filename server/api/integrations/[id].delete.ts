import { getDatabase } from '../../utils/db';

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

    // Manually delete related sessions and session_responses (SQLite CASCADE may not be enabled)
    const deleteSessionResponsesStmt = db.prepare(`
      DELETE FROM session_responses
      WHERE sessionId IN (SELECT id FROM sessions WHERE integrationId = ?)
    `);
    deleteSessionResponsesStmt.run(id);

    const deleteSessionsStmt = db.prepare('DELETE FROM sessions WHERE integrationId = ?');
    deleteSessionsStmt.run(id);

    // Delete integration
    const deleteStmt = db.prepare('DELETE FROM integrations WHERE id = ?');
    deleteStmt.run(id);

    return { success: true };
  } catch (error) {
    console.error('Error deleting integration:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to delete integration',
    });
  }
});
