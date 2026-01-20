import { getDatabase } from '../../utils/db';
import { z } from 'zod';

const sessionResponseSchema = z.object({
  sessionId: z.string().min(1),
  apiId: z.string().min(1),
  responseStatusCode: z.number().int(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validated = sessionResponseSchema.parse(body);

    const db = getDatabase();
    const now = new Date().toISOString();

    // Check if a session response already exists for this session/API
    const existingStmt = db.prepare('SELECT * FROM session_responses WHERE sessionId = ? AND apiId = ?');
    const existing = existingStmt.get(validated.sessionId, validated.apiId) as any;

    if (existing) {
      // Update existing record
      const updateStmt = db.prepare(`
        UPDATE session_responses
        SET responseStatusCode = ?, updatedAt = ?
        WHERE sessionId = ? AND apiId = ?
      `);
      updateStmt.run(validated.responseStatusCode, now, validated.sessionId, validated.apiId);

      return {
        ...existing,
        responseStatusCode: validated.responseStatusCode,
        updatedAt: now,
      };
    } else {
      // Insert new record
      const newResponse = {
        id: `sr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: validated.sessionId,
        apiId: validated.apiId,
        responseStatusCode: validated.responseStatusCode,
        createdAt: now,
        updatedAt: now,
      };

      const insertStmt = db.prepare(`
        INSERT INTO session_responses (id, sessionId, apiId, responseStatusCode, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        newResponse.id,
        newResponse.sessionId,
        newResponse.apiId,
        newResponse.responseStatusCode,
        newResponse.createdAt,
        newResponse.updatedAt
      );

      return newResponse;
    }
  } catch (error) {
    console.error('Error creating session response:', error);
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to create session response',
    });
  }
});
