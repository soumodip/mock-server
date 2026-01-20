import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const TEST_BASE_DIR = resolve(process.cwd(), 'tests/test-data');
const TEST_DATA_DIR = resolve(TEST_BASE_DIR, 'data');

function setupTestDir() {
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  writeFileSync(resolve(TEST_DATA_DIR, 'objects.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'apis.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'projects.json'), '[]');
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

describe('Objects API', () => {
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

  describe('GET /api/objects', () => {
    it('should return empty array when no objects exist', async () => {
      const { default: handler } = await import('../../server/api/objects/index.get');
      const result = await handler({} as any);
      expect(result).toEqual([]);
    });

    it('should return all objects', async () => {
      const objects = [
        { id: '1', projectId: 'proj_1', name: 'User', fields: [] },
        { id: '2', projectId: 'proj_1', name: 'Product', fields: [] },
      ];
      writeJson('objects.json', objects);

      const { default: handler } = await import('../../server/api/objects/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(2);
    });

    it('should filter objects by projectId', async () => {
      const objects = [
        { id: '1', projectId: 'proj_1', name: 'User', fields: [] },
        { id: '2', projectId: 'proj_2', name: 'Product', fields: [] },
        { id: '3', projectId: 'proj_1', name: 'Order', fields: [] },
      ];
      writeJson('objects.json', objects);

      vi.mocked(globalThis.getQuery).mockReturnValue({ projectId: 'proj_1' });

      const { default: handler } = await import('../../server/api/objects/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(2);
      expect(result.every((o: any) => o.projectId === 'proj_1')).toBe(true);
    });
  });

  describe('POST /api/objects', () => {
    it('should create a new object with valid data', async () => {
      const mockBody = {
        projectId: 'proj_1',
        name: 'User',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'age', type: 'number', required: false },
        ],
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/objects/index.post');
      const result = await handler({} as any);

      expect(result).toMatchObject({
        projectId: 'proj_1',
        name: 'User',
      });
      expect(result.id).toBeDefined();
      expect(result.fields).toHaveLength(3);
      expect(result.objectIndex).toBe(0);
    });

    it('should auto-increment objectIndex for same project', async () => {
      const existingObjects = [
        { id: '1', projectId: 'proj_1', name: 'User', objectIndex: 0 },
        { id: '2', projectId: 'proj_1', name: 'Product', objectIndex: 1 },
      ];
      writeJson('objects.json', existingObjects);

      const mockBody = {
        projectId: 'proj_1',
        name: 'Order',
        fields: [{ name: 'id', type: 'string', required: true }],
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/objects/index.post');
      const result = await handler({} as any);

      expect(result.objectIndex).toBe(2);
    });

    it('should create object with all field types', async () => {
      const mockBody = {
        projectId: 'proj_1',
        name: 'ComplexObject',
        description: 'Object with all field types',
        fields: [
          { name: 'strField', type: 'string', required: true },
          { name: 'numField', type: 'number', required: true },
          { name: 'boolField', type: 'boolean', required: false },
          { name: 'objField', type: 'object', required: false, ref: 'other_obj' },
          { name: 'jsonField', type: 'object-json', required: false },
          { name: 'arrField', type: 'array', required: false },
          { name: 'arrStrField', type: 'array-string', required: false },
          { name: 'arrNumField', type: 'array-number', required: false },
        ],
        isEntity: true,
        isAdminPanelPage: true,
        allowedOperations: ['GET', 'POST', 'PUT', 'DELETE'],
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/objects/index.post');
      const result = await handler({} as any);

      expect(result.fields).toHaveLength(8);
      expect(result.isEntity).toBe(true);
      expect(result.isAdminPanelPage).toBe(true);
      expect(result.allowedOperations).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
    });

    it('should reject invalid field type', async () => {
      const mockBody = {
        projectId: 'proj_1',
        name: 'BadObject',
        fields: [{ name: 'field', type: 'invalid-type', required: true }],
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/objects/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });

    it('should reject missing required fields', async () => {
      const mockBody = {
        // Missing projectId and name
        fields: [{ name: 'id', type: 'string', required: true }],
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/objects/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('GET /api/objects/:id', () => {
    it('should return a single object by id', async () => {
      const objects = [
        { id: '123', projectId: 'proj_1', name: 'User', fields: [] },
      ];
      writeJson('objects.json', objects);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });

      const { default: handler } = await import('../../server/api/objects/[id].get');
      const result = await handler({} as any);

      expect(result).toMatchObject({ id: '123', name: 'User' });
    });

    it('should return 404 for non-existent object', async () => {
      writeJson('objects.json', []);
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/objects/[id].get');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('PUT /api/objects/:id', () => {
    it('should update an existing object', async () => {
      const objects = [
        {
          id: '123',
          projectId: 'proj_1',
          name: 'OldName',
          fields: [{ name: 'id', type: 'string', required: true }],
        },
      ];
      writeJson('objects.json', objects);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });
      vi.mocked(globalThis.readBody).mockResolvedValue({
        name: 'NewName',
        description: 'Updated description',
      });

      const { default: handler } = await import('../../server/api/objects/[id].put');
      const result = await handler({} as any);

      expect(result.name).toBe('NewName');
      expect(result.description).toBe('Updated description');
    });

    it('should update object fields', async () => {
      const objects = [
        {
          id: '123',
          projectId: 'proj_1',
          name: 'User',
          fields: [{ name: 'id', type: 'string', required: true }],
        },
      ];
      writeJson('objects.json', objects);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });
      vi.mocked(globalThis.readBody).mockResolvedValue({
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'name', type: 'string', required: false },
        ],
      });

      const { default: handler } = await import('../../server/api/objects/[id].put');
      const result = await handler({} as any);

      expect(result.fields).toHaveLength(3);
    });

    it('should return 404 for non-existent object', async () => {
      writeJson('objects.json', []);
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });
      vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'NewName' });

      const { default: handler } = await import('../../server/api/objects/[id].put');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('DELETE /api/objects/:id', () => {
    it('should delete an existing object', async () => {
      const objects = [
        { id: '123', projectId: 'proj_1', name: 'ToDelete', fields: [] },
        { id: '456', projectId: 'proj_1', name: 'Keep', fields: [] },
      ];
      writeJson('objects.json', objects);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });

      const { default: handler } = await import('../../server/api/objects/[id].delete');
      const result = await handler({} as any);

      expect(result.success).toBe(true);

      const remaining = readJson('objects.json');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('456');
    });

    it('should nullify references in APIs when object is deleted', async () => {
      const objects = [
        { id: '123', projectId: 'proj_1', name: 'ToDelete', fields: [] },
      ];
      const apis = [
        {
          id: 'api_1',
          projectId: 'proj_1',
          endpoint: '/test',
          method: 'GET',
          statusMocks: [{
            statusCode: 200,
            responseObjectId: '123',
            responseValue: 'generated',
            enabled: true,
          }],
          errorResponseObjectId: '123',
        },
        {
          id: 'api_2',
          projectId: 'proj_1',
          endpoint: '/other',
          method: 'POST',
          statusMocks: [{
            statusCode: 200,
            responseObjectId: '456', // Different object
            responseValue: 'other',
            enabled: true,
          }],
          errorResponseObjectId: '',
        },
      ];
      writeJson('objects.json', objects);
      writeJson('apis.json', apis);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });

      const { default: handler } = await import('../../server/api/objects/[id].delete');
      await handler({} as any);

      const updatedApis = readJson('apis.json');

      // First API should have nullified references
      expect(updatedApis[0].statusMocks[0].responseObjectId).toBe('');
      expect(updatedApis[0].errorResponseObjectId).toBe('');

      // Second API should be unchanged
      expect(updatedApis[1].statusMocks[0].responseObjectId).toBe('456');
    });

    it('should return 404 for non-existent object', async () => {
      writeJson('objects.json', []);
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/objects/[id].delete');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });
});
