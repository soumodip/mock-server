import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';

const TEST_DATA_DIR = resolve(process.cwd(), 'tests/test-data');
const TEST_DB_PATH = resolve(TEST_DATA_DIR, 'integrations-test.sqlite');

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
      allowedOrigins TEXT DEFAULT NULL,
      primaryFont TEXT DEFAULT 'Poppins',
      codeFont TEXT DEFAULT 'Google Sans Code',
      heading TEXT DEFAULT '',
      allowPostmanDownload INTEGER DEFAULT 0,
      expandToFullPage INTEGER DEFAULT 0,
      theme TEXT DEFAULT 'dark',
      displayEntities INTEGER DEFAULT 0,
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
      createdAt TEXT NOT NULL
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

describe('Integrations API', () => {
  beforeEach(() => {
    setupTestDir();
    setupMocks();
    vi.resetModules();

    testDb = createTestDb();

    // Mock the database module
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

  describe('GET /api/integrations', () => {
    it('should return empty array when no integrations exist', async () => {
      const { default: handler } = await import('../../server/api/integrations/index.get');
      const result = await handler({} as any);
      expect(result).toEqual([]);
    });

    it('should return all integrations', async () => {
      const now = new Date().toISOString();
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Integration 1', 'proj_1', 1, now, now);
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_2', 'Integration 2', 'proj_1', 1, now, now);

      const { default: handler } = await import('../../server/api/integrations/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(2);
      expect(result[0].isActive).toBe(true); // Should be converted to boolean
    });

    it('should filter integrations by projectId', async () => {
      const now = new Date().toISOString();
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Integration 1', 'proj_1', 1, now, now);
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_2', 'Integration 2', 'proj_2', 1, now, now);

      vi.mocked(globalThis.getQuery).mockReturnValue({ projectId: 'proj_1' });

      const { default: handler } = await import('../../server/api/integrations/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('proj_1');
    });

    it('should parse allowedOrigins JSON', async () => {
      const now = new Date().toISOString();
      const origins = ['http://localhost:3000', 'https://example.com'];
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, allowedOrigins, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Integration', 'proj_1', 1, JSON.stringify(origins), now, now);

      const { default: handler } = await import('../../server/api/integrations/index.get');
      const result = await handler({} as any);

      expect(result[0].allowedOrigins).toEqual(origins);
    });
  });

  describe('POST /api/integrations', () => {
    it('should create a new integration', async () => {
      const mockBody = {
        name: 'New Integration',
        projectId: 'proj_1',
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/integrations/index.post');
      const result = await handler({} as any);

      expect(result).toMatchObject({
        name: 'New Integration',
        projectId: 'proj_1',
        isActive: true,
        allowedOrigins: [],
      });
      expect(result.id).toMatch(/^int_/);

      // Verify it was saved
      const saved = testDb!.prepare('SELECT * FROM integrations WHERE id = ?').get(result.id);
      expect(saved).toBeDefined();
    });

    it('should create integration with allowed origins', async () => {
      const mockBody = {
        name: 'Integration with origins',
        projectId: 'proj_1',
        allowedOrigins: ['http://localhost:3000', 'https://app.example.com'],
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/integrations/index.post');
      const result = await handler({} as any);

      expect(result.allowedOrigins).toEqual(['http://localhost:3000', 'https://app.example.com']);

      // Verify stored as JSON
      const saved = testDb!.prepare('SELECT allowedOrigins FROM integrations WHERE id = ?').get(result.id) as any;
      expect(JSON.parse(saved.allowedOrigins)).toEqual(mockBody.allowedOrigins);
    });

    it('should reject empty name', async () => {
      const mockBody = {
        name: '',
        projectId: 'proj_1',
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/integrations/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });

    it('should reject missing projectId', async () => {
      const mockBody = {
        name: 'Integration',
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/integrations/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('GET /api/integrations/:id', () => {
    it('should return a single integration by id', async () => {
      const now = new Date().toISOString();
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_123', 'Test Integration', 'proj_1', 1, now, now);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'int_123' });

      const { default: handler } = await import('../../server/api/integrations/[id].get');
      const result = await handler({} as any);

      expect(result).toMatchObject({
        id: 'int_123',
        name: 'Test Integration',
        isActive: true,
      });
    });

    it('should return 404 for non-existent integration', async () => {
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/integrations/[id].get');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('PUT /api/integrations/:id', () => {
    it('should update an existing integration', async () => {
      const now = new Date().toISOString();
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_123', 'Original Name', 'proj_1', 1, now, now);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'int_123' });
      vi.mocked(globalThis.readBody).mockResolvedValue({
        name: 'Updated Name',
        isActive: false,
      });

      const { default: handler } = await import('../../server/api/integrations/[id].put');
      const result = await handler({} as any);

      expect(result.name).toBe('Updated Name');
      expect(result.isActive).toBe(false);
    });

    it('should update theme and font settings', async () => {
      const now = new Date().toISOString();
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, theme, primaryFont, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('int_123', 'Integration', 'proj_1', 1, 'dark', 'Poppins', now, now);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'int_123' });
      vi.mocked(globalThis.readBody).mockResolvedValue({
        theme: 'light',
        primaryFont: 'Inter',
        codeFont: 'Fira Code',
      });

      const { default: handler } = await import('../../server/api/integrations/[id].put');
      const result = await handler({} as any);

      expect(result.theme).toBe('light');
      expect(result.primaryFont).toBe('Inter');
      expect(result.codeFont).toBe('Fira Code');
    });

    it('should return 404 for non-existent integration', async () => {
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });
      vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'New Name' });

      const { default: handler } = await import('../../server/api/integrations/[id].put');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('DELETE /api/integrations/:id', () => {
    it('should delete an existing integration', async () => {
      const now = new Date().toISOString();
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_123', 'To Delete', 'proj_1', 1, now, now);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'int_123' });

      const { default: handler } = await import('../../server/api/integrations/[id].delete');
      const result = await handler({} as any);

      expect(result.success).toBe(true);

      const remaining = testDb!.prepare('SELECT * FROM integrations').all();
      expect(remaining).toHaveLength(0);
    });

    it('should cascade delete sessions', async () => {
      const now = new Date().toISOString();
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_123', 'Integration', 'proj_1', 1, now, now);
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_1', 'int_123', now, now);
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_2', 'int_123', now, now);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'int_123' });

      const { default: handler } = await import('../../server/api/integrations/[id].delete');
      await handler({} as any);

      const remainingSessions = testDb!.prepare('SELECT * FROM sessions').all();
      expect(remainingSessions).toHaveLength(0);
    });

    it('should return 404 for non-existent integration', async () => {
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/integrations/[id].delete');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });
});
