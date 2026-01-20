import Database from 'better-sqlite3';
import { resolve } from 'path';

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    const dbPath = resolve(process.cwd(), 'data/db.sqlite');
    db = new Database(dbPath);
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create integrations table
  database.exec(`
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

  // Migrations: Add new columns if they don't exist
  try {
    const columns = database.prepare("PRAGMA table_info(integrations)").all() as any[];
    const columnNames = columns.map((col: any) => col.name);

    if (!columnNames.includes('allowedOrigins')) {
      database.exec(`ALTER TABLE integrations ADD COLUMN allowedOrigins TEXT DEFAULT NULL`);
      console.log('✓ Added allowedOrigins column to integrations table');
    }

    if (!columnNames.includes('primaryFont')) {
      database.exec(`ALTER TABLE integrations ADD COLUMN primaryFont TEXT DEFAULT 'Poppins'`);
      console.log('✓ Added primaryFont column to integrations table');
    }

    if (!columnNames.includes('codeFont')) {
      database.exec(`ALTER TABLE integrations ADD COLUMN codeFont TEXT DEFAULT 'Google Sans Code'`);
      console.log('✓ Added codeFont column to integrations table');
    }

    if (!columnNames.includes('heading')) {
      database.exec(`ALTER TABLE integrations ADD COLUMN heading TEXT DEFAULT ''`);
      console.log('✓ Added heading column to integrations table');
    }

    if (!columnNames.includes('allowPostmanDownload')) {
      database.exec(`ALTER TABLE integrations ADD COLUMN allowPostmanDownload INTEGER DEFAULT 0`);
      console.log('✓ Added allowPostmanDownload column to integrations table');
    }

    if (!columnNames.includes('expandToFullPage')) {
      database.exec(`ALTER TABLE integrations ADD COLUMN expandToFullPage INTEGER DEFAULT 0`);
      console.log('✓ Added expandToFullPage column to integrations table');
    }

    if (!columnNames.includes('theme')) {
      database.exec(`ALTER TABLE integrations ADD COLUMN theme TEXT DEFAULT 'dark'`);
      console.log('✓ Added theme column to integrations table');
    }

    if (!columnNames.includes('displayEntities')) {
      database.exec(`ALTER TABLE integrations ADD COLUMN displayEntities INTEGER DEFAULT 0`);
      console.log('✓ Added displayEntities column to integrations table');
    }

    if (!columnNames.includes('isPrimaryDocs')) {
      database.exec(`ALTER TABLE integrations ADD COLUMN isPrimaryDocs INTEGER DEFAULT 0`);
      console.log('✓ Added isPrimaryDocs column to integrations table');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  // Create sessions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      integrationId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (integrationId) REFERENCES integrations(id) ON DELETE CASCADE
    )
  `);

  // Create session_responses table
  database.exec(`
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

  // Create indexes for better query performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_integrations_projectId ON integrations(projectId);
    CREATE INDEX IF NOT EXISTS idx_sessions_integrationId ON sessions(integrationId);
    CREATE INDEX IF NOT EXISTS idx_session_responses_sessionId ON session_responses(sessionId);
  `);

  // Create webhook_logs table for storing webhook requests
  database.exec(`
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

  // Create index for webhook_logs
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_projectId ON webhook_logs(projectId);
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_createdAt ON webhook_logs(createdAt);
  `);

  // Create webhooks table for storing webhook configurations per project
  database.exec(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      webhookIndex INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(projectId, webhookIndex)
    )
  `);

  // Create index for webhooks
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_webhooks_projectId ON webhooks(projectId);
  `);

  // Add webhookId column to webhook_logs if it doesn't exist
  try {
    const webhookLogsColumns = database.prepare("PRAGMA table_info(webhook_logs)").all() as any[];
    const webhookLogsColumnNames = webhookLogsColumns.map((col: any) => col.name);

    if (!webhookLogsColumnNames.includes('webhookId')) {
      database.exec(`ALTER TABLE webhook_logs ADD COLUMN webhookId TEXT DEFAULT NULL`);
      console.log('✓ Added webhookId column to webhook_logs table');
    }
  } catch (error) {
    console.error('Migration error for webhook_logs:', error);
  }

  // Add isPinned column to webhooks if it doesn't exist
  try {
    const webhooksColumns = database.prepare("PRAGMA table_info(webhooks)").all() as any[];
    const webhooksColumnNames = webhooksColumns.map((col: any) => col.name);

    if (!webhooksColumnNames.includes('isPinned')) {
      database.exec(`ALTER TABLE webhooks ADD COLUMN isPinned INTEGER DEFAULT 0`);
      console.log('✓ Added isPinned column to webhooks table');
    }

    if (!webhooksColumnNames.includes('label')) {
      database.exec(`ALTER TABLE webhooks ADD COLUMN label TEXT DEFAULT NULL`);
      console.log('✓ Added label column to webhooks table');
    }
  } catch (error) {
    console.error('Migration error for webhooks:', error);
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
