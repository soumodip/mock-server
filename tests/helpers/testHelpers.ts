import { vi } from 'vitest';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';

export const TEST_DATA_DIR = resolve(process.cwd(), 'tests/test-data');
export const TEST_DB_PATH = resolve(TEST_DATA_DIR, 'test.sqlite');

// Initialize test data directory with fresh data
export function initTestDataDir() {
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }

  writeFileSync(resolve(TEST_DATA_DIR, 'projects.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'apis.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'objects.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'auth.json'), JSON.stringify([
    { username: 'testuser', password: 'testpass', isActive: true },
    { username: 'inactive', password: 'pass', isActive: false }
  ]));
}

// Read test JSON file
export function readTestJson(filename: string): any[] {
  const filePath = resolve(TEST_DATA_DIR, filename);
  if (!existsSync(filePath)) {
    return [];
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

// Write test JSON file
export function writeTestJson(filename: string, data: any[]) {
  const filePath = resolve(TEST_DATA_DIR, filename);
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Create test database with full schema
export function createTestDatabase(): Database.Database {
  if (existsSync(TEST_DB_PATH)) {
    rmSync(TEST_DB_PATH);
  }

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

// Create a mock H3 event
export function createMockEvent(options: {
  method?: string;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
} = {}) {
  return {
    method: options.method || 'GET',
    _body: options.body,
    _query: options.query || {},
    _params: options.params || {},
    _headers: options.headers || {},
    node: { req: {}, res: {} },
    context: { params: options.params || {} },
  };
}

// Mock Nuxt/H3 global functions
export function setupGlobalMocks(options: {
  authEnabled?: boolean;
  event?: ReturnType<typeof createMockEvent>;
  db?: Database.Database;
} = {}) {
  const { authEnabled = false, event } = options;

  // Set environment
  if (authEnabled) {
    process.env.IS_AUTH = 'true';
  } else {
    delete process.env.IS_AUTH;
  }

  // Mock validateAuth
  vi.stubGlobal('validateAuth', vi.fn().mockReturnValue(true));

  // Mock readBody
  vi.stubGlobal('readBody', vi.fn().mockImplementation(async (e: any) => e._body));

  // Mock getQuery
  vi.stubGlobal('getQuery', vi.fn().mockImplementation((e: any) => e._query));

  // Mock getRouterParams
  vi.stubGlobal('getRouterParams', vi.fn().mockImplementation((e: any) => e._params || e.context?.params || {}));

  // Mock getHeader
  vi.stubGlobal('getHeader', vi.fn().mockImplementation((e: any, name: string) => e._headers?.[name.toLowerCase()]));

  // Mock createError
  vi.stubGlobal('createError', vi.fn().mockImplementation((opts) => {
    const error = new Error(opts.message || opts.statusMessage);
    (error as any).statusCode = opts.statusCode;
    (error as any).statusMessage = opts.statusMessage;
    (error as any).message = opts.message || opts.statusMessage;
    return error;
  }));

  // Mock defineEventHandler - just returns the handler function
  vi.stubGlobal('defineEventHandler', vi.fn().mockImplementation((handler) => handler));

  return {
    validateAuth: vi.mocked(globalThis.validateAuth),
    readBody: vi.mocked(globalThis.readBody),
    getQuery: vi.mocked(globalThis.getQuery),
    getRouterParams: vi.mocked(globalThis.getRouterParams),
    getHeader: vi.mocked(globalThis.getHeader),
    createError: vi.mocked(globalThis.createError),
  };
}

// Sample test data factories
export const testFactories = {
  project: (overrides = {}) => ({
    id: `proj_${Date.now()}`,
    name: 'Test Project',
    isAuth: false,
    accessToken: '',
    authType: undefined,
    authConfig: undefined,
    groups: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  api: (projectId: string, overrides = {}) => ({
    id: `api_${Date.now()}`,
    projectId,
    endpoint: '/test',
    name: 'Test API',
    description: 'Test API description',
    method: 'GET',
    contentType: 'application/json',
    statusMocks: [{
      statusCode: 200,
      headerParams: [],
      queryParams: [],
      bodyParams: [],
      validators: [],
      responseObjectId: '',
      responseValue: '{"message":"success"}',
      enabled: true,
    }],
    errorResponseObjectId: '',
    errorResponseValue: '{"error":"error"}',
    enabled: true,
    isAuth: false,
    apiIndex: 0,
    group: '',
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  object: (projectId: string, overrides = {}) => ({
    id: `obj_${Date.now()}`,
    projectId,
    name: 'TestObject',
    description: 'Test object description',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
    ],
    isEntity: false,
    isAdminPanelPage: false,
    allowedOperations: [],
    objectIndex: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  integration: (projectId: string, overrides = {}) => ({
    id: `int_${Date.now()}`,
    name: 'Test Integration',
    projectId,
    isActive: 1,
    allowedOrigins: null,
    primaryFont: 'Poppins',
    codeFont: 'Google Sans Code',
    heading: '',
    allowPostmanDownload: 0,
    expandToFullPage: 0,
    theme: 'dark',
    displayEntities: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  session: (integrationId: string, overrides = {}) => ({
    id: `sess_${Date.now()}`,
    integrationId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  sessionResponse: (sessionId: string, apiId: string, overrides = {}) => ({
    id: `sr_${Date.now()}`,
    sessionId,
    apiId,
    responseStatusCode: 200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  webhookLog: (projectId: string, overrides = {}) => ({
    id: `log_${Date.now()}`,
    projectId,
    method: 'POST',
    path: '/webhooks/test',
    headers: JSON.stringify({ 'content-type': 'application/json' }),
    query: JSON.stringify({}),
    body: JSON.stringify({ event: 'test' }),
    ip: '127.0.0.1',
    userAgent: 'Test Agent',
    contentType: 'application/json',
    contentLength: 100,
    createdAt: new Date().toISOString(),
    ...overrides,
  }),
};
