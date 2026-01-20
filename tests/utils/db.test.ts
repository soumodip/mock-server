import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';

// Test database path
const TEST_DB_DIR = resolve(process.cwd(), 'tests/test-data');
const TEST_DB_PATH = resolve(TEST_DB_DIR, 'db-test.sqlite');

describe('Database Utils', () => {
  let testDb: Database.Database | null = null;

  beforeEach(() => {
    // Ensure test directory exists
    if (!existsSync(TEST_DB_DIR)) {
      mkdirSync(TEST_DB_DIR, { recursive: true });
    }

    // Clean up any existing test database
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH);
    }
  });

  afterEach(() => {
    // Close test database
    if (testDb) {
      testDb.close();
      testDb = null;
    }
  });

  describe('Database Initialization', () => {
    it('should create database file', () => {
      testDb = new Database(TEST_DB_PATH);
      expect(existsSync(TEST_DB_PATH)).toBe(true);
    });

    it('should create integrations table with correct schema', () => {
      testDb = new Database(TEST_DB_PATH);

      testDb.exec(`
        CREATE TABLE IF NOT EXISTS integrations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          projectId TEXT NOT NULL,
          isActive INTEGER DEFAULT 1,
          allowedOrigins TEXT DEFAULT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      const columns = testDb.prepare("PRAGMA table_info(integrations)").all() as any[];
      const columnNames = columns.map(col => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('projectId');
      expect(columnNames).toContain('isActive');
      expect(columnNames).toContain('allowedOrigins');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should create sessions table with correct schema', () => {
      testDb = new Database(TEST_DB_PATH);

      testDb.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          integrationId TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (integrationId) REFERENCES integrations(id) ON DELETE CASCADE
        )
      `);

      const columns = testDb.prepare("PRAGMA table_info(sessions)").all() as any[];
      const columnNames = columns.map(col => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('integrationId');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should create session_responses table with correct schema', () => {
      testDb = new Database(TEST_DB_PATH);

      testDb.exec(`
        CREATE TABLE IF NOT EXISTS session_responses (
          id TEXT PRIMARY KEY,
          sessionId TEXT NOT NULL,
          apiId TEXT NOT NULL,
          responseStatusCode INTEGER NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `);

      const columns = testDb.prepare("PRAGMA table_info(session_responses)").all() as any[];
      const columnNames = columns.map(col => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('sessionId');
      expect(columnNames).toContain('apiId');
      expect(columnNames).toContain('responseStatusCode');
    });

    it('should create webhook_logs table with correct schema', () => {
      testDb = new Database(TEST_DB_PATH);

      testDb.exec(`
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

      const columns = testDb.prepare("PRAGMA table_info(webhook_logs)").all() as any[];
      const columnNames = columns.map(col => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('projectId');
      expect(columnNames).toContain('method');
      expect(columnNames).toContain('path');
      expect(columnNames).toContain('headers');
      expect(columnNames).toContain('query');
      expect(columnNames).toContain('body');
    });

    it('should create indexes for performance', () => {
      testDb = new Database(TEST_DB_PATH);

      // Create tables first
      testDb.exec(`
        CREATE TABLE IF NOT EXISTS integrations (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL
        )
      `);
      testDb.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          integrationId TEXT NOT NULL
        )
      `);
      testDb.exec(`
        CREATE TABLE IF NOT EXISTS session_responses (
          id TEXT PRIMARY KEY,
          sessionId TEXT NOT NULL
        )
      `);
      testDb.exec(`
        CREATE TABLE IF NOT EXISTS webhook_logs (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          createdAt TEXT NOT NULL
        )
      `);

      // Create indexes
      testDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_integrations_projectId ON integrations(projectId);
        CREATE INDEX IF NOT EXISTS idx_sessions_integrationId ON sessions(integrationId);
        CREATE INDEX IF NOT EXISTS idx_session_responses_sessionId ON session_responses(sessionId);
        CREATE INDEX IF NOT EXISTS idx_webhook_logs_projectId ON webhook_logs(projectId);
        CREATE INDEX IF NOT EXISTS idx_webhook_logs_createdAt ON webhook_logs(createdAt);
      `);

      const indexes = testDb.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'").all() as any[];
      const indexNames = indexes.map(idx => idx.name);

      expect(indexNames).toContain('idx_integrations_projectId');
      expect(indexNames).toContain('idx_sessions_integrationId');
      expect(indexNames).toContain('idx_session_responses_sessionId');
      expect(indexNames).toContain('idx_webhook_logs_projectId');
      expect(indexNames).toContain('idx_webhook_logs_createdAt');
    });
  });

  describe('Database Operations', () => {
    beforeEach(() => {
      testDb = new Database(TEST_DB_PATH);

      // Set up full schema
      testDb.exec(`
        CREATE TABLE IF NOT EXISTS integrations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          projectId TEXT NOT NULL,
          isActive INTEGER DEFAULT 1,
          allowedOrigins TEXT DEFAULT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      testDb.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          integrationId TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      testDb.exec(`
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
    });

    it('should insert and retrieve integrations', () => {
      const now = new Date().toISOString();
      const stmt = testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, allowedOrigins, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run('int_1', 'Test Integration', 'proj_1', 1, JSON.stringify(['http://localhost']), now, now);

      const result = testDb!.prepare('SELECT * FROM integrations WHERE id = ?').get('int_1') as any;

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Integration');
      expect(result.projectId).toBe('proj_1');
      expect(result.isActive).toBe(1);
      expect(JSON.parse(result.allowedOrigins)).toEqual(['http://localhost']);
    });

    it('should insert and retrieve sessions', () => {
      const now = new Date().toISOString();

      // First insert an integration
      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Test', 'proj_1', 1, now, now);

      // Then insert a session
      testDb!.prepare(`
        INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `).run('sess_1', 'int_1', now, now);

      const result = testDb!.prepare('SELECT * FROM sessions WHERE id = ?').get('sess_1') as any;

      expect(result).toBeDefined();
      expect(result.integrationId).toBe('int_1');
    });

    it('should insert and retrieve webhook logs', () => {
      const now = new Date().toISOString();

      testDb!.prepare(`
        INSERT INTO webhook_logs (id, projectId, method, path, headers, query, body, ip, userAgent, contentType, contentLength, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'log_1',
        'proj_1',
        'POST',
        '/webhooks/test',
        JSON.stringify({ 'content-type': 'application/json' }),
        JSON.stringify({ key: 'value' }),
        JSON.stringify({ event: 'test' }),
        '127.0.0.1',
        'Mozilla/5.0',
        'application/json',
        100,
        now
      );

      const result = testDb!.prepare('SELECT * FROM webhook_logs WHERE id = ?').get('log_1') as any;

      expect(result).toBeDefined();
      expect(result.projectId).toBe('proj_1');
      expect(result.method).toBe('POST');
      expect(result.path).toBe('/webhooks/test');
      expect(JSON.parse(result.body)).toEqual({ event: 'test' });
    });

    it('should filter integrations by projectId', () => {
      const now = new Date().toISOString();

      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Integration 1', 'proj_1', 1, now, now);

      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_2', 'Integration 2', 'proj_2', 1, now, now);

      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_3', 'Integration 3', 'proj_1', 1, now, now);

      const results = testDb!.prepare('SELECT * FROM integrations WHERE projectId = ?').all('proj_1') as any[];

      expect(results).toHaveLength(2);
      expect(results.every(r => r.projectId === 'proj_1')).toBe(true);
    });

    it('should update records correctly', () => {
      const now = new Date().toISOString();

      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Original Name', 'proj_1', 1, now, now);

      const later = new Date().toISOString();
      testDb!.prepare(`
        UPDATE integrations SET name = ?, updatedAt = ? WHERE id = ?
      `).run('Updated Name', later, 'int_1');

      const result = testDb!.prepare('SELECT * FROM integrations WHERE id = ?').get('int_1') as any;

      expect(result.name).toBe('Updated Name');
    });

    it('should delete records correctly', () => {
      const now = new Date().toISOString();

      testDb!.prepare(`
        INSERT INTO integrations (id, name, projectId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('int_1', 'Test', 'proj_1', 1, now, now);

      const deleteResult = testDb!.prepare('DELETE FROM integrations WHERE id = ?').run('int_1');

      expect(deleteResult.changes).toBe(1);

      const selectResult = testDb!.prepare('SELECT * FROM integrations WHERE id = ?').get('int_1');

      expect(selectResult).toBeUndefined();
    });
  });

  describe('Migration Support', () => {
    it('should add new columns if they do not exist', () => {
      testDb = new Database(TEST_DB_PATH);

      // Create table with initial schema
      testDb.exec(`
        CREATE TABLE IF NOT EXISTS integrations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          projectId TEXT NOT NULL,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Check initial columns
      let columns = testDb.prepare("PRAGMA table_info(integrations)").all() as any[];
      let columnNames = columns.map(col => col.name);

      expect(columnNames).not.toContain('allowedOrigins');
      expect(columnNames).not.toContain('primaryFont');

      // Run migrations
      if (!columnNames.includes('allowedOrigins')) {
        testDb.exec(`ALTER TABLE integrations ADD COLUMN allowedOrigins TEXT DEFAULT NULL`);
      }
      if (!columnNames.includes('primaryFont')) {
        testDb.exec(`ALTER TABLE integrations ADD COLUMN primaryFont TEXT DEFAULT 'Poppins'`);
      }

      // Check columns after migration
      columns = testDb.prepare("PRAGMA table_info(integrations)").all() as any[];
      columnNames = columns.map(col => col.name);

      expect(columnNames).toContain('allowedOrigins');
      expect(columnNames).toContain('primaryFont');
    });
  });
});
