import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { resolve } from 'path';
import Database from 'better-sqlite3';

// Test data directory
export const TEST_DATA_DIR = resolve(process.cwd(), 'tests/test-data');
export const TEST_DB_PATH = resolve(TEST_DATA_DIR, 'test-db.sqlite');

// Initialize test data directory
export function setupTestDataDir() {
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }

  // Create empty JSON files
  writeFileSync(resolve(TEST_DATA_DIR, 'projects.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'apis.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'objects.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'auth.json'), JSON.stringify([
    { username: 'testuser', password: 'testpass', isActive: true },
    { username: 'inactive', password: 'pass', isActive: false }
  ]));
}

// Create test database
export function createTestDatabase(): Database.Database {
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
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (integrationId) REFERENCES integrations(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_integrations_projectId ON integrations(projectId);
    CREATE INDEX IF NOT EXISTS idx_sessions_integrationId ON sessions(integrationId);
    CREATE INDEX IF NOT EXISTS idx_session_responses_sessionId ON session_responses(sessionId);
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_projectId ON webhook_logs(projectId);
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_createdAt ON webhook_logs(createdAt);
  `);

  return db;
}

// Clean up test data
export function cleanupTestData() {
  if (existsSync(TEST_DATA_DIR)) {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
}

// Global setup
beforeAll(() => {
  setupTestDataDir();
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Global teardown
afterAll(() => {
  cleanupTestData();
});
