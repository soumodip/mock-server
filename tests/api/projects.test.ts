import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';

const TEST_BASE_DIR = resolve(process.cwd(), 'tests/test-data');
const TEST_DATA_DIR = resolve(TEST_BASE_DIR, 'data');

// Setup test data directory
function setupTestDir() {
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  writeFileSync(resolve(TEST_DATA_DIR, 'projects.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'apis.json'), '[]');
  writeFileSync(resolve(TEST_DATA_DIR, 'objects.json'), '[]');
}

// Read JSON file
function readJson(filename: string): any[] {
  return JSON.parse(readFileSync(resolve(TEST_DATA_DIR, filename), 'utf-8'));
}

// Write JSON file
function writeJson(filename: string, data: any[]) {
  writeFileSync(resolve(TEST_DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// Mock global functions
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

describe('Projects API', () => {
  beforeEach(() => {
    setupTestDir();
    setupMocks();
    vi.resetModules();

    // Mock process.cwd to return test base directory (so data/projects.json resolves correctly)
    vi.spyOn(process, 'cwd').mockReturnValue(TEST_BASE_DIR);

    // Mock the generateMockData module
    vi.doMock('~/utils/generateMockData', () => ({
      generateMockData: vi.fn().mockReturnValue({}),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('GET /api/projects', () => {
    it('should return empty array when no projects exist', async () => {
      // Import handler after mocks are set up
      const { default: handler } = await import('../../server/api/projects/index.get');

      const result = await handler({} as any);

      expect(result).toEqual([]);
    });

    it('should return all projects', async () => {
      const projects = [
        { id: '1', name: 'Project 1', createdAt: new Date().toISOString() },
        { id: '2', name: 'Project 2', createdAt: new Date().toISOString() },
      ];
      writeJson('projects.json', projects);

      const { default: handler } = await import('../../server/api/projects/index.get');
      const result = await handler({} as any);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Project 1');
      expect(result[1].name).toBe('Project 2');
    });

    it('should call validatePermission', async () => {
      const { default: handler } = await import('../../server/api/projects/index.get');
      await handler({} as any);

      expect(vi.mocked(globalThis.validatePermission)).toHaveBeenCalled();
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const mockBody = { name: 'New Project' };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/projects/index.post');
      const result = await handler({} as any);

      expect(result).toMatchObject({
        name: 'New Project',
        isAuth: false,
        accessToken: '',
        groups: [],
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();

      // Verify it was saved
      const projects = readJson('projects.json');
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('New Project');
    });

    it('should create a project with auth settings', async () => {
      const mockBody = {
        name: 'Auth Project',
        isAuth: true,
        accessToken: 'secret-token',
        authType: 'bearer-token',
        authConfig: { headerName: 'Authorization' },
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/projects/index.post');
      const result = await handler({} as any);

      expect(result).toMatchObject({
        name: 'Auth Project',
        isAuth: true,
        accessToken: 'secret-token',
        authType: 'bearer-token',
        authConfig: { headerName: 'Authorization' },
      });
    });

    it('should create a project with groups', async () => {
      const mockBody = {
        name: 'Grouped Project',
        groups: ['Users', 'Products', 'Orders'],
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/projects/index.post');
      const result = await handler({} as any);

      expect(result.groups).toEqual(['Users', 'Products', 'Orders']);
    });

    it('should handle bulk import mode', async () => {
      const mockBody = {
        project: { id: 'old_id', name: 'Imported Project' },
        apis: [
          { id: 'api_1', projectId: 'old_id', endpoint: '/users', method: 'GET' },
        ],
        objects: [
          { id: 'obj_1', projectId: 'old_id', name: 'User', fields: [] },
        ],
      };
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/projects/index.post');
      const result = await handler({} as any);

      expect(result.success).toBe(true);
      expect(result.projectId).toBeDefined();

      // Verify all data was imported
      const projects = readJson('projects.json');
      const apis = readJson('apis.json');
      const objects = readJson('objects.json');

      expect(projects).toHaveLength(1);
      expect(apis).toHaveLength(1);
      expect(objects).toHaveLength(1);

      // New IDs should be generated
      expect(projects[0].id).not.toBe('old_id');
      expect(apis[0].projectId).toBe(projects[0].id);
      expect(objects[0].projectId).toBe(projects[0].id);
    });

    it('should reject invalid project data', async () => {
      const mockBody = { invalidField: 'value' }; // Missing required 'name'
      vi.mocked(globalThis.readBody).mockResolvedValue(mockBody);

      const { default: handler } = await import('../../server/api/projects/index.post');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a single project by id', async () => {
      const projects = [
        { id: '123', name: 'Project 1', createdAt: new Date().toISOString() },
        { id: '456', name: 'Project 2', createdAt: new Date().toISOString() },
      ];
      writeJson('projects.json', projects);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });

      const { default: handler } = await import('../../server/api/projects/[id].get');
      const result = await handler({} as any);

      expect(result).toMatchObject({ id: '123', name: 'Project 1' });
    });

    it('should return 404 for non-existent project', async () => {
      writeJson('projects.json', []);
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/projects/[id].get');

      await expect(handler({} as any)).rejects.toThrow();
      expect(vi.mocked(globalThis.createError)).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 })
      );
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update an existing project', async () => {
      const projects = [
        { id: '123', name: 'Original Name', isAuth: false, createdAt: new Date().toISOString() },
      ];
      writeJson('projects.json', projects);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });
      vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'Updated Name' });

      const { default: handler } = await import('../../server/api/projects/[id].put');
      const result = await handler({} as any);

      expect(result.name).toBe('Updated Name');

      // Verify it was saved
      const savedProjects = readJson('projects.json');
      expect(savedProjects[0].name).toBe('Updated Name');
    });

    it('should return 404 for non-existent project', async () => {
      writeJson('projects.json', []);
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });
      vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'New Name' });

      const { default: handler } = await import('../../server/api/projects/[id].put');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project and its related data', async () => {
      const projects = [
        { id: '123', name: 'To Delete', createdAt: new Date().toISOString() },
        { id: '456', name: 'Keep This', createdAt: new Date().toISOString() },
      ];
      const apis = [
        { id: 'api_1', projectId: '123', endpoint: '/test', method: 'GET' },
        { id: 'api_2', projectId: '456', endpoint: '/other', method: 'POST' },
      ];
      const objects = [
        { id: 'obj_1', projectId: '123', name: 'Object1' },
        { id: 'obj_2', projectId: '456', name: 'Object2' },
      ];

      writeJson('projects.json', projects);
      writeJson('apis.json', apis);
      writeJson('objects.json', objects);

      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: '123' });

      const { default: handler } = await import('../../server/api/projects/[id].delete');
      const result = await handler({} as any);

      expect(result.success).toBe(true);

      // Verify cascade delete
      const remainingProjects = readJson('projects.json');
      const remainingApis = readJson('apis.json');
      const remainingObjects = readJson('objects.json');

      expect(remainingProjects).toHaveLength(1);
      expect(remainingProjects[0].id).toBe('456');
      expect(remainingApis).toHaveLength(1);
      expect(remainingApis[0].projectId).toBe('456');
      expect(remainingObjects).toHaveLength(1);
      expect(remainingObjects[0].projectId).toBe('456');
    });

    it('should return 404 for non-existent project', async () => {
      writeJson('projects.json', []);
      vi.mocked(globalThis.getRouterParams).mockReturnValue({ id: 'nonexistent' });

      const { default: handler } = await import('../../server/api/projects/[id].delete');

      await expect(handler({} as any)).rejects.toThrow();
    });
  });
});
