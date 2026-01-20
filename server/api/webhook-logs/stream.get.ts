import { addConnection, removeConnection } from '../../utils/webhookBroadcast';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const projectId = query.projectId as string;

  if (!projectId) {
    throw createError({
      statusCode: 400,
      message: 'Project ID is required',
    });
  }

  // Set headers for SSE
  setResponseHeader(event, 'Content-Type', 'text/event-stream');
  setResponseHeader(event, 'Cache-Control', 'no-cache');
  setResponseHeader(event, 'Connection', 'keep-alive');
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*');

  // Create a readable stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Create a writer wrapper that uses the controller
      const writer = {
        write: async (data: Uint8Array) => {
          try {
            controller.enqueue(data);
          } catch (e) {
            // Stream closed
          }
        },
        close: () => controller.close(),
      } as unknown as WritableStreamDefaultWriter;

      // Add this connection to the broadcast list
      addConnection(projectId, writer);

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Handle client disconnect
      event.node.req.on('close', () => {
        clearInterval(pingInterval);
        removeConnection(projectId, writer);
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});
