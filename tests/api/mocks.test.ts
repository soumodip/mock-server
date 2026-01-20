import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const TEST_BASE_DIR = resolve(process.cwd(), 'tests/test-data');
const TEST_DATA_DIR = resolve(TEST_BASE_DIR, 'data');

function setupTestDir() {
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  writeFileSync(resolve(TEST_DATA_DIR, 'apis.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'projects.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'objects.json'), '[]');
}

function readJson(filename: string): any[] {
  return JSON.parse(readFileSync(resolve(TEST_DATA_DIR, filename), 'utf-8'));
}

function writeJson(filename: string, data: any[]) {
  writeFileSync(resolve(TEST_DATA_DIR, filename), JSON.stringify(data, null, 2));
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

describe('Mocks API', () => {
  beforeEach(() => {
    setupTestDir();
    setupMocks();
    vi.resetModules();
    vi.spyOn(process, 'cwd').mockReturnValue(TEST_BASE_DIR);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('GET /api/mocks', () => {
    it('should return empty array when no mocks exist', async () => {
      const { default: handler } = await import('../../server/api/mocks/index.get');
      const result = await handler({} as any);
      expect(result).toEqual([]);
    });

    it('should return all mocks', async () => {
      const mocks = [
        { id: '1', projectId: 'proj_1', endpoint: '/users', method: 'GET' },
        { id: '2', projectId: 'proj_1', endpoint: '/products', method: 'POST' },
      ];
      writeJson('apis.json', mocks);

      const { default: handler } = await import('../../server/api/mocks/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(2);
    });

    it('should filter mocks by projectId', async () => {
      const mocks = [
        { id: '1', projectId: 'proj_1', endpoint: '/users', method: 'GET' },
        { id: '2', projectId: 'proj_2', endpoint: '/products', method: 'POST' },
        { id: '3', projectId: 'proj_1', endpoint: '/orders', method: 'GET' },
      ];
      writeJson('apis.json', mocks);

      vi.mocked(globalThis.getQuery).mockReturnValue({ projectId: 'proj_1' });

      const { default: handler } = await import('../../server/api/mocks/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(2);
      expect(result.every((m: any) => m.projectId === 'proj_1')).toBe(true);
    });
  });

  describe('POST /api/mocks', () => {
    it('should create a new mock with valid data', async () => {
      const mockBody = {
        projectId: 'proj_1',
        endpoint: '/users',
        method: 'GET',
        statusMocks: [{
          statusCode: 200,
          headerParams: [],
          queryParams: [],
          bodyParams: [],
          validators: [],
          responseObjectId: '',
          responseValue: '[]',
          enabled: true,
        }],
        errorResponseObjectId: '',
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/mocks/index.post');
      const result = await handler({} as any);

      expect(result).toMatchObject({
        projectId: 'proj_1',
        endpoint: '/users',
        method: 'GET',
        enabled: true,
        isAuth: false,
      });
      expect(result.id).toBeDefined();
      expect(result.apiIndex).toBe(0);
    });

    it('should auto-increment apiIndex for same project', async () => {
      const existingApis = [
        { id: '1', projectId: 'proj_1', endpoint: '/users', apiIndex: 0 },
        { id: '2', projectId: 'proj_1', endpoint: '/products', apiIndex: 1 },
      ];
      writeJson('apis.json', existingApis);

      const mockBody = {
        projectId: 'proj_1',
        endpoint: '/orders',
        method: 'GET',
        statusMocks: [{
          statusCode: 200,
          responseObjectId: '',
          enabled: true,
        }],
        errorResponseObjectId: '',
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/mocks/index.post');
      const result = await handler({} as any);

      expect(result.apiIndex).toBe(2);
    });

    it('should create mock with all parameters', async () => {
      const mockBody = {
        projectId: 'proj_1',
        endpoint: '/users/:id',
        name: 'Get User',
        description: 'Get user by ID',
        method: 'GET',
        contentType: 'application/json',
        statusMocks: [{
          statusCode: 200,
          headerParams: [{ key: 'X-Custom', type: 'string', required: true }],
          queryParams: [{ key: 'include', type: 'string', required: false }],
          bodyParams: [],
          validators: [{ field: 'id', rule: 'minLength:1', message: 'ID required' }],
          responseObjectId: 'obj_1',
          responseValue: '{"id":"1","name":"John"}',
          enabled: true,
        }, {
          statusCode: 404,
          responseObjectId: '',
          responseValue: '{"error":"Not found"}',
          enabled: true,
        }],
        errorResponseObjectId: 'err_obj',
        errorResponseValue: '{"error":"Server error"}',
        enabled: true,
        isAuth: true,
        group: 'Users',
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/mocks/index.post');
      const result = await handler({} as any);

      expect(result).toMatchObject({
        name: 'Get User',
        description: 'Get user by ID',
        isAuth: true,
        group: 'Users',
      });
      expect(result.statusMocks).toHaveLength(2);
    });

    it('should reject invalid method', async () => {
      const mockBody = {
        projectId: 'proj_1',
        endpoint: '/users',
        method: 'INVALID',
        statusMocks: [{ statusCode: 200, responseObjectId: '', enabled: true }],
        errorResponseObjectId: '',
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/mocks/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });

    it('should reject invalid content type', async () => {
      const mockBody = {
        projectId: 'proj_1',
        endpoint: '/users',
        method: 'POST',
        contentType: 'text/invalid',
        statusMocks: [{ statusCode: 200, responseObjectId: '', enabled: true }],
        errorResponseObjectId: '',
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/mocks/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('GET /api/mocks/:id', () => {
    it('should return a single mock by id', async () => {
      const mocks = [
        { id: '123', projectId: 'proj_1', endpoint: '/users', method: 'GET' },
      ];
      writeJson('apis.json', mocks);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });

      const { default: handler } = await import('../../server/api/mocks/[id].get');
      const result = await handler({} as any);

      expect(result).toMatchObject({ id: '123', endpoint: '/users' });
    });

    it('should return 404 for non-existent mock', async () => {
      writeJson('apis.json', []);
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/mocks/[id].get');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('PUT /api/mocks/:id', () => {
    it('should update an existing mock', async () => {
      const mocks = [
        { id: '123', projectId: 'proj_1', endpoint: '/users', method: 'GET', enabled: true },
      ];
      writeJson('apis.json', mocks);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });
      vi.mocked(globalThis.readBody).mockResolvedValue({ enabled: false, endpoint: '/customers' });

      const { default: handler } = await import('../../server/api/mocks/[id].put');
      const result = await handler({} as any);

      expect(result.enabled).toBe(false);
      expect(result.endpoint).toBe('/customers');
    });

    it('should return 404 for non-existent mock', async () => {
      writeJson('apis.json', []);
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });
      vi.mocked(globalThis.readBody).mockResolvedValue({ enabled: false });

      const { default: handler } = await import('../../server/api/mocks/[id].put');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('DELETE /api/mocks/:id', () => {
    it('should delete an existing mock', async () => {
      const mocks = [
        { id: '123', projectId: 'proj_1', endpoint: '/users', method: 'GET' },
        { id: '456', projectId: 'proj_1', endpoint: '/products', method: 'POST' },
      ];
      writeJson('apis.json', mocks);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });

      const { default: handler } = await import('../../server/api/mocks/[id].delete');
      const result = await handler({} as any);

      expect(result.success).toBe(true);

      const remaining = readJson('apis.json');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('456');
    });

    it('should return 404 for non-existent mock', async () => {
      writeJson('apis.json', []);
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/mocks/[id].delete');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });
});
