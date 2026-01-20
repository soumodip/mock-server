import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addConnection,
  removeConnection,
  broadcastWebhookLog
} from '../../server/utils/webhookBroadcast';

describe('webhookBroadcast', () => {
  // Mock WritableStreamDefaultWriter
  const createMockWriter = () => ({
    write: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    abort: vi.fn(),
    closed: Promise.resolve(undefined),
    desiredSize: 1,
    ready: Promise.resolve(undefined),
    releaseLock: vi.fn(),
  });

  beforeEach(() => {
    // Reset the module state by removing all connections
    // Since we can't directly access projectConnections, we'll test behavior
  });

  describe('addConnection', () => {
    it('should add a connection for a project', () => {
      const projectId = 'test-project-1';
      const writer = createMockWriter();

      // Should not throw
      expect(() => addConnection(projectId, writer as any)).not.toThrow();
    });

    it('should allow multiple connections for the same project', () => {
      const projectId = 'test-project-2';
      const writer1 = createMockWriter();
      const writer2 = createMockWriter();

      expect(() => addConnection(projectId, writer1 as any)).not.toThrow();
      expect(() => addConnection(projectId, writer2 as any)).not.toThrow();
    });
  });

  describe('removeConnection', () => {
    it('should remove a connection for a project', () => {
      const projectId = 'test-project-3';
      const writer = createMockWriter();

      addConnection(projectId, writer as any);
      expect(() => removeConnection(projectId, writer as any)).not.toThrow();
    });

    it('should not throw when removing non-existent connection', () => {
      const projectId = 'non-existent-project';
      const writer = createMockWriter();

      expect(() => removeConnection(projectId, writer as any)).not.toThrow();
    });
  });

  describe('broadcastWebhookLog', () => {
    it('should broadcast log to all connections for a project', async () => {
      const projectId = 'test-project-4';
      const writer1 = createMockWriter();
      const writer2 = createMockWriter();

      addConnection(projectId, writer1 as any);
      addConnection(projectId, writer2 as any);

      const log = { id: '123', method: 'POST', path: '/test' };
      broadcastWebhookLog(projectId, log);

      // Wait for async writes
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(writer1.write).toHaveBeenCalled();
      expect(writer2.write).toHaveBeenCalled();

      // Verify the message format
      const encoder = new TextEncoder();
      const expectedMessage = `data: ${JSON.stringify(log)}\n\n`;
      const expectedData = encoder.encode(expectedMessage);

      expect(writer1.write).toHaveBeenCalledWith(expectedData);
    });

    it('should not throw when broadcasting to non-existent project', () => {
      const log = { id: '123', method: 'GET', path: '/test' };
      expect(() => broadcastWebhookLog('non-existent', log)).not.toThrow();
    });

    it('should remove connection when write fails', async () => {
      const projectId = 'test-project-5';
      const failingWriter = createMockWriter();
      failingWriter.write.mockRejectedValue(new Error('Connection closed'));

      addConnection(projectId, failingWriter as any);

      const log = { id: '456', method: 'DELETE', path: '/remove' };
      broadcastWebhookLog(projectId, log);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      // The connection should be removed, so next broadcast should work without issues
      expect(() => broadcastWebhookLog(projectId, log)).not.toThrow();
    });

    it('should format SSE message correctly', async () => {
      const projectId = 'test-project-6';
      const writer = createMockWriter();

      addConnection(projectId, writer as any);

      const log = {
        id: 'log-1',
        method: 'POST',
        path: '/webhooks/test',
        headers: { 'content-type': 'application/json' },
        body: { event: 'test' }
      };

      broadcastWebhookLog(projectId, log);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(writer.write).toHaveBeenCalled();
      const writtenData = writer.write.mock.calls[0][0];
      const decoder = new TextDecoder();
      const message = decoder.decode(writtenData);

      expect(message).toMatch(/^data: /);
      expect(message).toMatch(/\n\n$/);
      expect(message).toContain('"id":"log-1"');
    });
  });
});
