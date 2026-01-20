import { getDatabase } from '../../utils/db';

export default defineEventHandler(async (event) => {
  // This endpoint is public - no auth required for docs mode redirect
  try {
    const db = getDatabase();

    // Find the integration with isPrimaryDocs = 1 and expandToFullPage = 1
    const stmt = db.prepare(`
      SELECT id, projectId
      FROM integrations
      WHERE isPrimaryDocs = 1 AND expandToFullPage = 1
      LIMIT 1
    `);
    const integration = stmt.get() as { id: string; projectId: string } | undefined;

    if (!integration) {
      return null;
    }

    return {
      projectId: integration.projectId,
      integrationId: integration.id,
    };
  } catch (error) {
    console.error('Error fetching primary docs integration:', error);
    return null;
  }
});
