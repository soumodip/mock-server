import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const projectId = query.projectId as string | undefined;
    const webhookId = query.webhookId as string | undefined;
    const limit = parseInt(query.limit as string || '100', 10);
    const offset = parseInt(query.offset as string || '0', 10);

    const db = getDatabase();

    let logs;
    let total;

    if (webhookId) {
      // Filter by specific webhook
      const stmt = db.prepare(`
        SELECT * FROM webhook_logs
        WHERE webhookId = ?
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `);
      logs = stmt.all(webhookId, limit, offset);

      const countStmt = db.prepare('SELECT COUNT(*) as count FROM webhook_logs WHERE webhookId = ?');
      total = (countStmt.get(webhookId) as any).count;
    } else if (projectId) {
      const stmt = db.prepare(`
        SELECT * FROM webhook_logs
        WHERE projectId = ?
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `);
      logs = stmt.all(projectId, limit, offset);

      const countStmt = db.prepare('SELECT COUNT(*) as count FROM webhook_logs WHERE projectId = ?');
      total = (countStmt.get(projectId) as any).count;
    } else {
      const stmt = db.prepare(`
        SELECT * FROM webhook_logs
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `);
      logs = stmt.all(limit, offset);

      const countStmt = db.prepare('SELECT COUNT(*) as count FROM webhook_logs');
      total = (countStmt.get() as any).count;
    }

    // Parse JSON fields
    const parsedLogs = (logs as any[]).map(log => ({
      ...log,
      headers: log.headers ? JSON.parse(log.headers) : {},
      query: log.query ? JSON.parse(log.query) : {},
      body: log.body ? JSON.parse(log.body) : null,
    }));

    return {
      logs: parsedLogs,
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error('Error reading webhook logs:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to read webhook logs',
    });
  }
});
