import { getRequestIP } from 'h3';
import { getDatabase } from '../../../../../utils/db';
import { broadcastWebhookLog } from '../../../../../utils/webhookBroadcast';
import { readRequestBody } from '../../../../../utils/requestBody';

export default defineEventHandler(async (event) => {
  try {
    const projectId = getRouterParam(event, 'projectId');
    const webhookIndex = getRouterParam(event, 'webhookIndex');
    const method = event.method;

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required',
      });
    }

    if (!webhookIndex) {
      throw createError({
        statusCode: 400,
        message: 'Webhook index is required',
      });
    }

    // Find the webhook by projectId and webhookIndex
    const db = getDatabase();
    const webhook = db.prepare(`
      SELECT * FROM webhooks WHERE projectId = ? AND webhookIndex = ?
    `).get(projectId, parseInt(webhookIndex, 10)) as { id: string } | undefined;

    if (!webhook) {
      throw createError({
        statusCode: 404,
        message: 'Webhook not found',
      });
    }

    // Get request details - store all headers for display
    const allHeaders = getHeaders(event);
    const headers = Object.fromEntries(
      Object.entries(allHeaders).filter(([key]) =>
        key !== 'host' && key !== 'connection'
      )
    );
    const query = getQuery(event);

    // Read body handling both regular and piped/streamed requests
    const body = await readRequestBody(event);

    // Get IP address using the robust built-in helper
    let ip = getRequestIP(event, { xForwardedFor: true });

    console.log('Determined IP address:', ip);
    if (!ip) {
      ip = event.node.req.socket?.remoteAddress || 'unknown';
      console.log('Fallback IP address from socket:', event.node.req.socket?.remoteAddress);
    }

    // Normalize IPv6 addresses
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    } else if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }

    const userAgent = getRequestHeader(event, 'user-agent') || '';
    const contentType = getRequestHeader(event, 'content-type') || '';
    const contentLength = parseInt(getRequestHeader(event, 'content-length') || '0', 10);

    // Generate unique ID
    const id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Store in database
    const stmt = db.prepare(`
      INSERT INTO webhook_logs (id, projectId, webhookId, method, path, headers, query, body, ip, userAgent, contentType, contentLength, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const headersJson = JSON.stringify(headers);
    const queryJson = JSON.stringify(query);
    const bodyJson = body ? JSON.stringify(body) : null;

    stmt.run(
      id,
      projectId,
      webhook.id,
      method,
      '/',
      headersJson,
      queryJson,
      bodyJson,
      ip,
      userAgent,
      contentType,
      contentLength,
      now
    );

    // Broadcast to connected clients
    const logEntry = {
      id,
      projectId,
      webhookId: webhook.id,
      method,
      path: '/',
      headers,
      query,
      body,
      ip,
      userAgent,
      contentType,
      contentLength,
      createdAt: now,
    };
    broadcastWebhookLog(projectId, logEntry);

    // Return success response
    return {
      success: true,
      message: 'Webhook received and logged',
      id,
      timestamp: now,
    };
  } catch (error) {
    console.error('Error logging webhook:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to log webhook',
    });
  }
});
