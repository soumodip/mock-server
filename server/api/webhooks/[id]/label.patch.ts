import { getDatabase } from '../../../utils/db';

export default defineEventHandler(async (event) => {
  validatePermission(event);

  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Webhook ID is required',
      });
    }

    const body = await readBody(event);
    const label = body.label;

    const db = getDatabase();

    // Check if webhook exists
    const webhook = db.prepare(`SELECT * FROM webhooks WHERE id = ?`).get(id);

    if (!webhook) {
      throw createError({
        statusCode: 404,
        message: 'Webhook not found',
      });
    }

    // Update the label (can be null to clear it)
    db.prepare(`UPDATE webhooks SET label = ? WHERE id = ?`).run(label || null, id);

    return {
      success: true,
      label: label || null,
    };
  } catch (error) {
    console.error('Failed to update webhook label:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to update webhook label',
    });
  }
});
