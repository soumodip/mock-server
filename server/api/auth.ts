import { readFile } from 'fs/promises';
import { resolve } from 'path';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { Permission } from '../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body;

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username and password are required'
      });
    }

    // Read auth data
    const filePath = resolve(process.cwd(), 'data/auth.json');
    const data = await readFile(filePath, 'utf-8');
    const users = JSON.parse(data);

    // Find matching user (isActive is optional, defaults to true if not present)
    const user = users.find((u: any) =>
      u.username === username &&
      u.password === password &&
      (u.isActive === undefined || u.isActive === true)
    );

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid username or password'
      });
    }

    // Get user permissions with validation
    const validPermissions: Permission[] = ['read', 'write', 'delete'];
    let permissions: Permission[] = ['read']; // Default to read-only
    let showWarning = false;
    let warningReason = '';

    if (!user.permissions) {
      // Case 1: permissions key is missing
      showWarning = true;
      warningReason = 'permissions key is missing';
    } else if (!Array.isArray(user.permissions) || user.permissions.length === 0) {
      // Case 2: permissions is empty array or not an array
      showWarning = true;
      warningReason = 'permissions array is empty or invalid';
    } else {
      // Filter to only valid permissions
      const filteredPermissions = user.permissions.filter(
        (p: string) => validPermissions.includes(p as Permission)
      ) as Permission[];

      if (filteredPermissions.length === 0) {
        // Case 3: permissions contains only invalid values
        showWarning = true;
        warningReason = 'permissions array contains no valid permission values (valid: read, write, delete)';
      } else if (filteredPermissions.length !== user.permissions.length) {
        // Some permissions were invalid but some were valid - use the valid ones
        permissions = filteredPermissions;
        console.warn(`[Auth] Warning: User "${user.username}" has some invalid permission values. Only valid permissions (${filteredPermissions.join(', ')}) will be used.`);
      } else {
        // All permissions are valid
        permissions = filteredPermissions;
      }
    }

    if (showWarning) {
      console.warn(`[Auth] Warning: User "${user.username}" - ${warningReason}. Defaulting to read-only permissions.`);
    }

    // Generate JWT token with permissions
    const jwtSecret = process.env.AUTH_JWT_SECRET || 'your_jwt_secret_key';
    const jwtExpiresIn = (process.env.AUTH_JWT_EXPIRES_IN || '1h') as StringValue;

    const accessToken = jwt.sign(
      { username: user.username, permissions },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return {
      accessToken,
      user: {
        username: user.username,
        permissions
      }
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Error during authentication:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});
