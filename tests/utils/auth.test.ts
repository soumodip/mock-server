import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock H3 functions
const mockGetHeader = vi.fn();
const mockCreateError = vi.fn((opts) => {
  const error = new Error(opts.statusMessage);
  (error as any).statusCode = opts.statusCode;
  (error as any).statusMessage = opts.statusMessage;
  return error;
});

// Setup globals that Nuxt auto-imports
vi.stubGlobal('getHeader', mockGetHeader);
vi.stubGlobal('createError', mockCreateError);

// Import after mocking globals
import { validateAuth } from '../../server/utils/auth';

describe('validateAuth', () => {
  const mockEvent = {} as any;
  const TEST_SECRET = 'test-jwt-secret';

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AUTH_JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.IS_AUTH;
    delete process.env.AUTH_JWT_SECRET;
  });

  describe('when auth is disabled', () => {
    it('should return true when IS_AUTH is not set', () => {
      delete process.env.IS_AUTH;
      const result = validateAuth(mockEvent);
      expect(result).toBe(true);
    });

    it('should return true when IS_AUTH is false', () => {
      process.env.IS_AUTH = 'false';
      const result = validateAuth(mockEvent);
      expect(result).toBe(true);
    });
  });

  describe('when auth is enabled', () => {
    beforeEach(() => {
      process.env.IS_AUTH = 'true';
    });

    it('should throw 401 when no authorization header', () => {
      mockGetHeader.mockReturnValue(undefined);

      expect(() => validateAuth(mockEvent)).toThrow();
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Unauthorized - No token provided'
      });
    });

    it('should throw 401 when authorization header does not start with Bearer', () => {
      mockGetHeader.mockReturnValue('Basic sometoken');

      expect(() => validateAuth(mockEvent)).toThrow();
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Unauthorized - No token provided'
      });
    });

    it('should throw 401 for invalid JWT token', () => {
      mockGetHeader.mockReturnValue('Bearer invalid-token');

      expect(() => validateAuth(mockEvent)).toThrow();
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Unauthorized - Invalid token'
      });
    });

    it('should return decoded token for valid JWT', () => {
      const payload = { username: 'testuser' };
      const token = jwt.sign(payload, TEST_SECRET);
      mockGetHeader.mockReturnValue(`Bearer ${token}`);

      const result = validateAuth(mockEvent);

      expect(result).toMatchObject({ username: 'testuser' });
    });

    it('should throw 401 for expired JWT token', () => {
      const payload = { username: 'testuser' };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1h' });
      mockGetHeader.mockReturnValue(`Bearer ${token}`);

      expect(() => validateAuth(mockEvent)).toThrow();
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Unauthorized - Invalid token'
      });
    });

    it('should throw 401 for JWT signed with wrong secret', () => {
      const payload = { username: 'testuser' };
      const token = jwt.sign(payload, 'wrong-secret');
      mockGetHeader.mockReturnValue(`Bearer ${token}`);

      expect(() => validateAuth(mockEvent)).toThrow();
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        statusMessage: 'Unauthorized - Invalid token'
      });
    });

    it('should use default secret when AUTH_JWT_SECRET is not set', () => {
      delete process.env.AUTH_JWT_SECRET;
      const defaultSecret = 'your_jwt_secret_key';
      const payload = { username: 'testuser' };
      const token = jwt.sign(payload, defaultSecret);
      mockGetHeader.mockReturnValue(`Bearer ${token}`);

      const result = validateAuth(mockEvent);

      expect(result).toMatchObject({ username: 'testuser' });
    });
  });
});
