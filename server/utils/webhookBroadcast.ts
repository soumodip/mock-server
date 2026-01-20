// Simple in-memory store for SSE connections per project
const projectConnections = new Map<string, Set<WritableStreamDefaultWriter>>();

export function addConnection(projectId: string, writer: WritableStreamDefaultWriter) {
  if (!projectConnections.has(projectId)) {
    projectConnections.set(projectId, new Set());
  }
  projectConnections.get(projectId)!.add(writer);
}

export function removeConnection(projectId: string, writer: WritableStreamDefaultWriter) {
  const connections = projectConnections.get(projectId);
  if (connections) {
    connections.delete(writer);
    if (connections.size === 0) {
      projectConnections.delete(projectId);
    }
  }
}

export function broadcastWebhookLog(projectId: string, log: any) {
  const connections = projectConnections.get(projectId);
  if (!connections) return;

  const message = `data: ${JSON.stringify(log)}\n\n`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  connections.forEach(async (writer) => {
    try {
      await writer.write(data);
    } catch (error) {
      // Connection closed, remove it
      removeConnection(projectId, writer);
    }
  });
}
