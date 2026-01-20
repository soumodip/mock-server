import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const integrationId = query.integrationId as string | undefined;

    const db = getDatabase();

    let sessions;
    if (integrationId) {
      const stmt = db.prepare('SELECT * FROM sessions WHERE integrationId = ? ORDER BY createdAt DESC');
      sessions = stmt.all(integrationId);
    } else {
      const stmt = db.prepare('SELECT * FROM sessions ORDER BY createdAt DESC');
      sessions = stmt.all();
    }

    return sessions;
  } catch (error) {
    console.error('Error reading sessions:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to read sessions',
    });
  }
});
