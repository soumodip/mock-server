import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const query = getQuery(event);
    const projectId = query.projectId as string | undefined;

    const db = getDatabase();

    let integrations;
    if (projectId) {
      const stmt = db.prepare('SELECT * FROM integrations WHERE projectId = ? ORDER BY createdAt DESC');
      integrations = stmt.all(projectId);
    } else {
      const stmt = db.prepare('SELECT * FROM integrations ORDER BY createdAt DESC');
      integrations = stmt.all();
    }

    return integrations.map((integration: any) => ({
      ...integration,
      isActive: Boolean(integration.isActive),
      allowedOrigins: integration.allowedOrigins ? JSON.parse(integration.allowedOrigins) : [],
      allowPostmanDownload: Boolean(integration.allowPostmanDownload),
      expandToFullPage: Boolean(integration.expandToFullPage),
      displayEntities: Boolean(integration.displayEntities),
      isPrimaryDocs: Boolean(integration.isPrimaryDocs),
    }));
  } catch (error) {
    console.error('Error reading integrations:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to read integrations',
    });
  }
});
