import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';

const TEST_DATA_DIR = resolve(process.cwd(), 'tests/test-data');
const TEST_DB_PATH = resolve(TEST_DATA_DIR, 'sessions-test.sqlite');

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
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      projectId TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      integrationId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS session_responses (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      apiId TEXT NOT NULL,
      responseStatusCode INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
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

describe('Sessions API', () => {
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

  describe('GET /api/sessions', () => {
    it('should return empty array when no sessions exist', async () => {
      const { default: handler } = await import('../../server/api/sessions/index.get');
      const result = await handler({} as any);
      expect(result).toEqual([]);
    });

    it('should return all sessions', async () => {
      const now = new Date().toISOString();

      // Create integration first
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Integration', 'proj_1', 1, now, now);

      // Create sessions
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_1', 'int_1', now, now);
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_2', 'int_1', now, now);

      const { default: handler } = await import('../../server/api/sessions/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(2);
    });

    it('should filter sessions by integrationId', async () => {
      const now = new Date().toISOString();

      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Integration 1', 'proj_1', 1, now, now);
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_2', 'Integration 2', 'proj_1', 1, now, now);

      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_1', 'int_1', now, now);
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_2', 'int_2', now, now);
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_3', 'int_1', now, now);

      vi.mocked(globalThis.getQuery).mockReturnValue({ integrationId: 'int_1' });

      const { default: handler } = await import('../../server/api/sessions/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(2);
      expect(result.every((s: any) => s.integrationId === 'int_1')).toBe(true);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return a single session by id', async () => {
      const now = new Date().toISOString();

      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Integration', 'proj_1', 1, now, now);
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_123', 'int_1', now, now);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'sess_123' });

      const { default: handler } = await import('../../server/api/sessions/[id].get');
      const result = await handler({} as any);

      expect(result).toMatchObject({
        id: 'sess_123',
        integrationId: 'int_1',
      });
    });

    it('should return 404 for non-existent session', async () => {
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/sessions/[id].get');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('DELETE /api/sessions/clear', () => {
    it('should delete all sessions for an integration', async () => {
      const now = new Date().toISOString();

      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Integration 1', 'proj_1', 1, now, now);
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_2', 'Integration 2', 'proj_1', 1, now, now);

      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_1', 'int_1', now, now);
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_2', 'int_1', now, now);
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_3', 'int_2', now, now);

      vi.mocked(globalThis.getQuery).mockReturnValue({ integrationId: 'int_1' });

      const { default: handler } = await import('../../server/api/sessions/clear.delete');
      const result = await handler({} as any);

      expect(result.success).toBe(true);

      const remaining = testDb!.prepare('SELECT * FROM sessions').all();
      expect(remaining).toHaveLength(1);
      expect((remaining[0] as any).integrationId).toBe('int_2');
    });

    it('should require integrationId parameter', async () => {
      vi.mocked(globalThis.getQuery).mockReturnValue({});

      const { default: handler } = await import('../../server/api/sessions/clear.delete');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });
});

describe('Session Responses API', () => {
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

  describe('GET /api/session-responses', () => {
    it('should return empty array when no session responses exist', async () => {
      const { default: handler } = await import('../../server/api/session-responses/index.get');
      const result = await handler({} as any);
      expect(result).toEqual([]);
    });

    it('should return all session responses', async () => {
      const now = new Date().toISOString();

      testDb!.prepare(`
        INSERT INTO session_responses (id, sessionId, apiId, responseStatusCode, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('sr_1', 'sess_1', 'api_1', 200, now, now);
      testDb!.prepare(`
        INSERT INTO session_responses (id, sessionId, apiId, responseStatusCode, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('sr_2', 'sess_1', 'api_2', 404, now, now);

      const { default: handler } = await import('../../server/api/session-responses/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(2);
    });

    it('should filter session responses by sessionId', async () => {
      const now = new Date().toISOString();

      testDb!.prepare(`
        INSERT INTO session_responses (id, sessionId, apiId, responseStatusCode, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('sr_1', 'sess_1', 'api_1', 200, now, now);
      testDb!.prepare(`
        INSERT INTO session_responses (id, sessionId, apiId, responseStatusCode, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('sr_2', 'sess_2', 'api_1', 200, now, now);

      vi.mocked(globalThis.getQuery).mockReturnValue({ sessionId: 'sess_1' });

      const { default: handler } = await import('../../server/api/session-responses/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe('sess_1');
    });
  });

  describe('POST /api/session-responses', () => {
    it('should create a new session response', async () => {
      const mockBody = {
        sessionId: 'sess_1',
        apiId: 'api_1',
        responseStatusCode: 200,
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/session-responses/index.post');
      const result = await handler({} as any);

      expect(result).toMatchObject({
        sessionId: 'sess_1',
        apiId: 'api_1',
        responseStatusCode: 200,
      });
      expect(result.id).toMatch(/^sr_/);

      // Verify it was saved
      const saved = testDb!.prepare('SELECT * FROM session_responses WHERE id = ?').get(result.id);
      expect(saved).toBeDefined();
    });

    it('should create session response with different status codes', async () => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 500];

      for (const statusCode of statusCodes) {
        vi.resetModules();
        vi.doMock('../../server/utils/db', () => ({
          getDatabase: () => testDb,
        }));

        const mockBody = {
          sessionId: 'sess_1',
          apiId: `api_${statusCode}`,
          responseStatusCode: statusCode,
        };
        vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

        const { default: handler } = await import('../../server/api/session-responses/index.post');
        const result = await handler({} as any);

        expect(result.responseStatusCode).toBe(statusCode);
      }
    });

    it('should reject empty sessionId', async () => {
      const mockBody = {
        sessionId: '',
        apiId: 'api_1',
        responseStatusCode: 200,
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/session-responses/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });

    it('should reject empty apiId', async () => {
      const mockBody = {
        sessionId: 'sess_1',
        apiId: '',
        responseStatusCode: 200,
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/session-responses/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });

    it('should reject non-integer status code', async () => {
      const mockBody = {
        sessionId: 'sess_1',
        apiId: 'api_1',
        responseStatusCode: 200.5,
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/session-responses/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });
});
