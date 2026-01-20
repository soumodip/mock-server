import jwt from 'jsonwebtoken';
import type { H3Event } from 'h3';

export type Permission = 'read' | 'write' | 'delete';

export interface AuthPayload {
  username: string;
  permissions: Permission[];
}

export function validateAuth(event: H3Event, options?: { skip?: boolean }): AuthPayload | true {
  const isAuthEnabled = process.env.IS_AUTH === 'true';

  if (!isAuthEnabled || options?.skip) {
    return true;
  }

  const authHeader = getHeader(event, 'authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No token provided'
    });
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.AUTH_JWT_SECRET || 'your_jwt_secret_key';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthPayload;
    return decoded;
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Invalid token'
    });
  }
}

/**
 * Validates that the user has the required permission for the operation.
 * - read: GET requests
 * - write: POST, PUT, PATCH requests
 * - delete: DELETE requests
 */
export function validatePermission(event: H3Event, options?: { skip?: boolean }) {
  const authResult = validateAuth(event, options);

  // If auth is disabled or skipped, allow all operations
  if (authResult === true) {
    return true;
  }

  const method = event.method;
  const permissions = authResult.permissions || [];

  // Map HTTP methods to required permissions
  let requiredPermission: Permission | null = null;

  if (method === 'GET') {
    requiredPermission = 'read';
  } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    requiredPermission = 'write';
  } else if (method === 'DELETE') {
    requiredPermission = 'delete';
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Forbidden - Missing '${requiredPermission}' permission`
    });
  }

  return authResult;
}
