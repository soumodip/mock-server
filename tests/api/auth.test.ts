import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import jwt from 'jsonwebtoken';

const TEST_BASE_DIR = resolve(process.cwd(), 'tests/test-data');
const TEST_DATA_DIR = resolve(TEST_BASE_DIR, 'data');

function setupTestDir() {
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }

  // Create auth.json with test users
  writeFileSync(resolve(TEST_DATA_DIR, 'auth.json'), JSON.stringify([
    { username: 'testuser', password: 'testpass', isActive: true },
    { username: 'admin', password: 'adminpass', isActive: true },
    { username: 'inactive', password: 'inactivepass', isActive: false },
    { username: 'noActiveFlag', password: 'pass' }, // No isActive flag (defaults to true)
  ]));
}

function setupMocks() {
  vi.stubGlobal('readBody', vi.fn());
  vi.stubGlobal('defineEventHandler', vi.fn().mockImplementation((handler) => handler));
  vi.stubGlobal('createError', vi.fn().mockImplementation((opts) => {
    const error = new Error(opts.message || opts.statusMessage);
    (error as any).statusCode = opts.statusCode;
    (error as any).statusMessage = opts.statusMessage;
    return error;
  }));
}

describe('Auth API', () => {
  const TEST_JWT_SECRET = 'test-secret-key';

  beforeEach(() => {
    setupTestDir();
    setupMocks();
    vi.resetModules();
    vi.spyOn(process, 'cwd').mockReturnValue(TEST_BASE_DIR);

    // Set environment variables
    process.env.AUTH_JWT_SECRET = TEST_JWT_SECRET;
    process.env.AUTH_JWT_EXPIRES_IN = '1h';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.AUTH_JWT_SECRET;
    delete process.env.AUTH_JWT_EXPIRES_IN;
  });

  describe('POST /api/auth', () => {
    it('should return access token for valid credentials', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'testuser',
        password: 'testpass',
      });

      const { default: handler } = await import('../../server/api/auth');
      const result = await handler({} as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe('testuser');

      // Verify JWT is valid
      const decoded = jwt.verify(result.accessToken, TEST_JWT_SECRET) as any;
      expect(decoded.username).toBe('testuser');
    });

    it('should return token for admin user', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'admin',
        password: 'adminpass',
      });

      const { default: handler } = await import('../../server/api/auth');
      const result = await handler({} as any);

      expect(result.accessToken).toBeDefined();
      expect(result.user.username).toBe('admin');
    });

    it('should authenticate user without explicit isActive flag', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'noActiveFlag',
        password: 'pass',
      });

      const { default: handler } = await import('../../server/api/auth');
      const result = await handler({} as any);

      expect(result.accessToken).toBeDefined();
      expect(result.user.username).toBe('noActiveFlag');
    });

    it('should reject inactive user', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'inactive',
        password: 'inactivepass',
      });

      const { default: handler } = await import('../../server/api/auth');

      await expect(handler({} as any)).rejects.toThrow();
      expect(vi.mocked(globalThis.createError)).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should reject invalid username', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'nonexistent',
        password: 'testpass',
      });

      const { default: handler } = await import('../../server/api/auth');

      await expect(handler({} as any)).rejects.toThrow();
      expect(vi.mocked(globalThis.createError)).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          statusMessage: 'Invalid username or password'
        })
      );
    });

    it('should reject invalid password', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'testuser',
        password: 'wrongpassword',
      });

      const { default: handler } = await import('../../server/api/auth');

      await expect(handler({} as any)).rejects.toThrow();
      expect(vi.mocked(globalThis.createError)).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });

    it('should reject missing username', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        password: 'testpass',
      });

      const { default: handler } = await import('../../server/api/auth');

      await expect(handler({} as any)).rejects.toThrow();
      expect(vi.mocked(globalThis.createError)).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          statusMessage: 'Username and password are required'
        })
      );
    });

    it('should reject missing password', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'testuser',
      });

      const { default: handler } = await import('../../server/api/auth');

      await expect(handler({} as any)).rejects.toThrow();
      expect(vi.mocked(globalThis.createError)).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('should reject empty username', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: '',
        password: 'testpass',
      });

      const { default: handler } = await import('../../server/api/auth');

      await expect(handler({} as any)).rejects.toThrow();
    });

    it('should reject empty password', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'testuser',
        password: '',
      });

      const { default: handler } = await import('../../server/api/auth');

      await expect(handler({} as any)).rejects.toThrow();
    });

    it('should use default JWT secret if not configured', async () => {
      delete process.env.AUTH_JWT_SECRET;

      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'testuser',
        password: 'testpass',
      });

      const { default: handler } = await import('../../server/api/auth');
      const result = await handler({} as any);

      expect(result.accessToken).toBeDefined();

      // Verify with default secret
      const decoded = jwt.verify(result.accessToken, 'your_jwt_secret_key') as any;
      expect(decoded.username).toBe('testuser');
    });

    it('should use configured expiration time', async () => {
      process.env.AUTH_JWT_EXPIRES_IN = '2h';

      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'testuser',
        password: 'testpass',
      });

      const { default: handler } = await import('../../server/api/auth');
      const result = await handler({} as any);

      const decoded = jwt.verify(result.accessToken, TEST_JWT_SECRET) as any;

      // Check expiration is roughly 2 hours from now
      const twoHoursFromNow = Math.floor(Date.now() / 1000) + (2 * 60 * 60);
      expect(decoded.exp).toBeGreaterThan(twoHoursFromNow - 60); // Allow 1 minute tolerance
      expect(decoded.exp).toBeLessThan(twoHoursFromNow + 60);
    });

    it('should use default expiration if not configured', async () => {
      delete process.env.AUTH_JWT_EXPIRES_IN;

      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'testuser',
        password: 'testpass',
      });

      const { default: handler } = await import('../../server/api/auth');
      const result = await handler({} as any);

      const decoded = jwt.verify(result.accessToken, TEST_JWT_SECRET) as any;

      // Default is 1h
      const oneHourFromNow = Math.floor(Date.now() / 1000) + (1 * 60 * 60);
      expect(decoded.exp).toBeGreaterThan(oneHourFromNow - 60);
      expect(decoded.exp).toBeLessThan(oneHourFromNow + 60);
    });

    it('should not expose password in response', async () => {
      vi.mocked(globalThis.readBody).mockResolvedValue({
        username: 'testuser',
        password: 'testpass',
      });

      const { default: handler } = await import('../../server/api/auth');
      const result = await handler({} as any);

      expect(result.user).not.toHaveProperty('password');
      expect(JSON.stringify(result)).not.toContain('testpass');
    });
  });
});
