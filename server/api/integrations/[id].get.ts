import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const isPublicRequest = query.public === 'true';

  validatePermission(event, { skip: isPublicRequest });

  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Integration ID is required',
      });
    }

    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM integrations WHERE id = ?');
    const integration = stmt.get(id) as any;

    if (!integration) {
      throw createError({
        statusCode: 404,
        message: 'Integration not found',
      });
    }

    return {
      ...integration,
      isActive: Boolean(integration.isActive),
      allowedOrigins: integration.allowedOrigins ? JSON.parse(integration.allowedOrigins) : [],
      allowPostmanDownload: Boolean(integration.allowPostmanDownload),
      expandToFullPage: Boolean(integration.expandToFullPage),
      displayEntities: Boolean(integration.displayEntities),
      isPrimaryDocs: Boolean(integration.isPrimaryDocs),
    };
  } catch (error) {
    console.error('Error reading integration:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to read integration',
    });
  }
});
