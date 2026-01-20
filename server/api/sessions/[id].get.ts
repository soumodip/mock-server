import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Session ID is required',
      });
    }

    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    const session = stmt.get(id);

    if (!session) {
      throw createError({
        statusCode: 404,
        message: 'Session not found',
      });
    }

    return session;
  } catch (error) {
    console.error('Error reading session:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to read session',
    });
  }
});
