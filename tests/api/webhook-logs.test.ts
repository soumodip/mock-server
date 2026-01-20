import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';

const TEST_DATA_DIR = resolve(process.cwd(), 'tests/test-data');
const TEST_DB_PATH = resolve(TEST_DATA_DIR, 'webhook-logs-test.sqlite');

let testDb: Database.Database | null = null;

function setupTestDir() {
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  if (existsSync(TEST_DB_PATH)) {
    rmSync(TEST_DB_PATH);
  }
}

function createTestDb(): Database.Database {
  const db = new Database(TEST_DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      headers TEXT,
      query TEXT,
      body TEXT,
      ip TEXT,
      userAgent TEXT,
      contentType TEXT,
      contentLength INTEGER,
      createdAt TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_projectId ON webhook_logs(projectId);
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_createdAt ON webhook_logs(createdAt);
  `);

  return db;
}

function setupMocks() {
  vi.stubGlobal('validateAuth', vi.fn().mockReturnValue(true));
  vi.stubGlobal('validatePermission', vi.fn().mockReturnValue(true));
  vi.stubGlobal('validateDocsMode', vi.fn().mockReturnValue(undefined));
  vi.stubGlobal('readBody', vi.fn());
  vi.stubGlobal('getQuery', vi.fn().mockReturnValue({}));
  vi.stubGlobal('getRouterParams', vi.fn().mockReturnValue({}));
  vi.stubGlobal('getRouterParam', vi.fn().mockImplementation((event, key) => {
    const params = vi.mocked(globalThis.getRouterParams)(event);
    return params[key];
  }));
  vi.stubGlobal('defineEventHandler', vi.fn().mockImplementation((handler) => handler));
  vi.stubGlobal('createError', vi.fn().mockImplementation((opts) => {
    const error = new Error(opts.message || opts.statusMessage);
    (error as any).statusCode = opts.statusCode;
    return error;
  }));
}

function insertWebhookLog(db: Database.Database, data: Partial<{
  id: string;
  projectId: string;
  method: string;
  path: string;
  headers: string;
  query: string;
  body: string;
  ip: string;
  userAgent: string;
  contentType: string;
  contentLength: number;
  createdAt: string;
}>) {
  const log = {
    id: data.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    projectId: data.projectId || 'proj_1',
    method: data.method || 'POST',
    path: data.path || '/webhooks/test',
    headers: data.headers || JSON.stringify({ 'content-type': 'application/json' }),
    query: data.query || JSON.stringify({}),
    body: data.body || JSON.stringify({ event: 'test' }),
    ip: data.ip || '127.0.0.1',
    userAgent: data.userAgent || 'Test Agent',
    contentType: data.contentType || 'application/json',
    contentLength: data.contentLength || 100,
    createdAt: data.createdAt || new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO webhook_logs (id, projectId, method, path, headers, query, body, ip, userAgent, contentType, contentLength, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    log.id, log.projectId, log.method, log.path, log.headers, log.query,
    log.body, log.ip, log.userAgent, log.contentType, log.contentLength, log.createdAt
  );

  return log;
}

describe('Webhook Logs API', () => {
  beforeEach(() => {
    setupTestDir();
    setupMocks();
    vi.resetModules();

    testDb = createTestDb();

    vi.doMock('../../server/utils/db', () => ({
      getDatabase: () => testDb,
    }));
  });

  afterEach(() => {
    if (testDb) {
      testDb.close();
      testDb = null;
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('GET /api/webhook-logs', () => {
    it('should return empty array when no logs exist', async () => {
      const { default: handler } = await import('../../server/api/webhook-logs/index.get');
      const result = await handler({} as any);
      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return all webhook logs', async () => {
      insertWebhookLog(testDb!, { id: 'log_1' });
      insertWebhookLog(testDb!, { id: 'log_2' });
      insertWebhookLog(testDb!, { id: 'log_3' });

      const { default: handler } = await import('../../server/api/webhook-logs/index.get');
      const result = await handler({} as any);

      expect(result.logs).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter logs by projectId', async () => {
      insertWebhookLog(testDb!, { id: 'log_1', projectId: 'proj_1' });
      insertWebhookLog(testDb!, { id: 'log_2', projectId: 'proj_2' });
      insertWebhookLog(testDb!, { id: 'log_3', projectId: 'proj_1' });

      vi.mocked(globalThis.getQuery).mockReturnValue({ projectId: 'proj_1' });

      const { default: handler } = await import('../../server/api/webhook-logs/index.get');
      const result = await handler({} as any);

      expect(result.logs).toHaveLength(2);
      expect(result.logs.every((l: any) => l.projectId === 'proj_1')).toBe(true);
      expect(result.total).toBe(2);
    });

    it('should support pagination with limit', async () => {
      for (let i = 0; i < 50; i++) {
        insertWebhookLog(testDb!, { id: `log_${i}` });
      }

      vi.mocked(globalThis.getQuery).mockReturnValue({ limit: '10' });

      const { default: handler } = await import('../../server/api/webhook-logs/index.get');
      const result = await handler({} as any);

      expect(result.logs).toHaveLength(10);
      expect(result.total).toBe(50);
      expect(result.limit).toBe(10);
    });

    it('should support pagination with offset', async () => {
      for (let i = 0; i < 20; i++) {
        insertWebhookLog(testDb!, { id: `log_${i.toString().padStart(2, '0')}` });
      }

      vi.mocked(globalThis.getQuery).mockReturnValue({ limit: '5', offset: '10' });

      const { default: handler } = await import('../../server/api/webhook-logs/index.get');
      const result = await handler({} as any);

      expect(result.logs).toHaveLength(5);
      expect(result.total).toBe(20);
      expect(result.offset).toBe(10);
    });

    it('should order logs by createdAt descending', async () => {
      const now = new Date();
      insertWebhookLog(testDb!, {
        id: 'log_old',
        createdAt: new Date(now.getTime() - 3600000).toISOString()
      });
      insertWebhookLog(testDb!, {
        id: 'log_new',
        createdAt: now.toISOString()
      });
      insertWebhookLog(testDb!, {
        id: 'log_mid',
        createdAt: new Date(now.getTime() - 1800000).toISOString()
      });

      const { default: handler } = await import('../../server/api/webhook-logs/index.get');
      const result = await handler({} as any);

      expect(result.logs[0].id).toBe('log_new');
      expect(result.logs[1].id).toBe('log_mid');
      expect(result.logs[2].id).toBe('log_old');
    });

    it('should return logs with all fields', async () => {
      const log = insertWebhookLog(testDb!, {
        id: 'log_full',
        projectId: 'proj_test',
        method: 'POST',
        path: '/webhooks/payment',
        headers: JSON.stringify({ 'x-custom': 'value' }),
        query: JSON.stringify({ source: 'stripe' }),
        body: JSON.stringify({ event: 'payment.completed' }),
        ip: '192.168.1.1',
        userAgent: 'Stripe/1.0',
        contentType: 'application/json',
        contentLength: 256,
      });

      const { default: handler } = await import('../../server/api/webhook-logs/index.get');
      const result = await handler({} as any);

      expect(result.logs[0]).toMatchObject({
        id: 'log_full',
        projectId: 'proj_test',
        method: 'POST',
        path: '/webhooks/payment',
        ip: '192.168.1.1',
        userAgent: 'Stripe/1.0',
        contentType: 'application/json',
        contentLength: 256,
      });
    });
  });

  describe('DELETE /api/webhook-logs/:id', () => {
    it('should delete a single webhook log', async () => {
      insertWebhookLog(testDb!, { id: 'log_to_delete' });
      insertWebhookLog(testDb!, { id: 'log_to_keep' });

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'log_to_delete' });

      const { default: handler } = await import('../../server/api/webhook-logs/[id].delete');
      const result = await handler({} as any);

      expect(result.success).toBe(true);

      const remaining = testDb!.prepare('SELECT * FROM webhook_logs').all();
      expect(remaining).toHaveLength(1);
      expect((remaining[0] as any).id).toBe('log_to_keep');
    });

    it('should return 404 for non-existent log', async () => {
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/webhook-logs/[id].delete');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('DELETE /api/webhook-logs/clear', () => {
    it('should delete all logs for a project', async () => {
      insertWebhookLog(testDb!, { id: 'log_1', projectId: 'proj_1' });
      insertWebhookLog(testDb!, { id: 'log_2', projectId: 'proj_1' });
      insertWebhookLog(testDb!, { id: 'log_3', projectId: 'proj_2' });

      vi.mocked(globalThis.getQuery).mockReturnValue({ projectId: 'proj_1' });

      const { default: handler } = await import('../../server/api/webhook-logs/clear.delete');
      const result = await handler({} as any);

      expect(result.success).toBe(true);

      const remaining = testDb!.prepare('SELECT * FROM webhook_logs').all();
      expect(remaining).toHaveLength(1);
      expect((remaining[0] as any).projectId).toBe('proj_2');
    });

    it('should delete all logs when no projectId provided', async () => {
      insertWebhookLog(testDb!, { id: 'log_1', projectId: 'proj_1' });
      insertWebhookLog(testDb!, { id: 'log_2', projectId: 'proj_2' });
      insertWebhookLog(testDb!, { id: 'log_3', projectId: 'proj_3' });

      vi.mocked(globalThis.getQuery).mockReturnValue({});

      const { default: handler } = await import('../../server/api/webhook-logs/clear.delete');
      const result = await handler({} as any);

      expect(result.success).toBe(true);

      const remaining = testDb!.prepare('SELECT * FROM webhook_logs').all();
      expect(remaining).toHaveLength(0);
    });

    it('should return success even if no logs exist', async () => {
      vi.mocked(globalThis.getQuery).mockReturnValue({ projectId: 'nonexistent' });

      const { default: handler } = await import('../../server/api/webhook-logs/clear.delete');
      const result = await handler({} as any);

      expect(result.success).toBe(true);
    });
  });
});
