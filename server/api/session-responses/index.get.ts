import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const sessionId = query.sessionId as string | undefined;

    const db = getDatabase();

    let responses;
    if (sessionId) {
      const stmt = db.prepare('SELECT * FROM session_responses WHERE sessionId = ? ORDER BY createdAt DESC');
      responses = stmt.all(sessionId);
    } else {
      const stmt = db.prepare('SELECT * FROM session_responses ORDER BY createdAt DESC');
      responses = stmt.all();
    }

    return responses;
  } catch (error) {
    console.error('Error reading session responses:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to read session responses',
    });
  }
});
