import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock H3 functions
const mockGetRequestHeader = vi.fn();
const mockReadBody = vi.fn();
const mockReadRawBody = vi.fn();

vi.mock('h3', () => ({
  getRequestHeader: (...args: any[]) => mockGetRequestHeader(...args),
  readBody: (...args: any[]) => mockReadBody(...args),
  readRawBody: (...args: any[]) => mockReadRawBody(...args),
}));

// Import after mocking
import { readRequestBody, readRequestBodyWithRaw } from '../../server/utils/requestBody';

describe('requestBody utils', () => {
  const createMockEvent = (method: string) => ({
    method,
    node: { req: {}, res: {} },
  } as any);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('readRequestBody', () => {
    describe('method filtering', () => {
      it('should return null for GET requests', async () => {
        const event = createMockEvent('GET');
        const result = await readRequestBody(event);
        expect(result).toBeNull();
      });

      it('should return null for HEAD requests', async () => {
        const event = createMockEvent('HEAD');
        const result = await readRequestBody(event);
        expect(result).toBeNull();
      });

      it('should return null for OPTIONS requests', async () => {
        const event = createMockEvent('OPTIONS');
        const result = await readRequestBody(event);
        expect(result).toBeNull();
      });

      it('should process POST requests', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader.mockReturnValue('application/json');
        mockReadBody.mockResolvedValue({ test: 'data' });

        const result = await readRequestBody(event);
        expect(result).toEqual({ test: 'data' });
      });

      it('should process PUT requests', async () => {
        const event = createMockEvent('PUT');
        mockGetRequestHeader.mockReturnValue('application/json');
        mockReadBody.mockResolvedValue({ test: 'data' });

        const result = await readRequestBody(event);
        expect(result).toEqual({ test: 'data' });
      });

      it('should process PATCH requests', async () => {
        const event = createMockEvent('PATCH');
        mockGetRequestHeader.mockReturnValue('application/json');
        mockReadBody.mockResolvedValue({ test: 'data' });

        const result = await readRequestBody(event);
        expect(result).toEqual({ test: 'data' });
      });

      it('should process DELETE requests', async () => {
        const event = createMockEvent('DELETE');
        mockGetRequestHeader.mockReturnValue('application/json');
        mockReadBody.mockResolvedValue({ test: 'data' });

        const result = await readRequestBody(event);
        expect(result).toEqual({ test: 'data' });
      });
    });

    describe('chunked/streamed requests', () => {
      it('should handle chunked transfer encoding with JSON', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader
          .mockReturnValueOnce('application/json') // content-type
          .mockReturnValueOnce(undefined) // content-length
          .mockReturnValueOnce('chunked'); // transfer-encoding

        mockReadRawBody.mockResolvedValue('{"chunked":"data"}');

        const result = await readRequestBody(event);
        expect(result).toEqual({ chunked: 'data' });
      });

      it('should handle chunked form-urlencoded data', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader
          .mockReturnValueOnce('application/x-www-form-urlencoded')
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce('chunked');

        mockReadRawBody.mockResolvedValue('key1=value1&key2=value2');

        const result = await readRequestBody(event);
        expect(result).toEqual({ key1: 'value1', key2: 'value2' });
      });

      it('should handle text content type', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader
          .mockReturnValueOnce('text/plain')
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce('chunked');

        mockReadRawBody.mockResolvedValue('plain text content');

        const result = await readRequestBody(event);
        expect(result).toBe('plain text content');
      });

      it('should return null when raw body is empty', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader
          .mockReturnValueOnce('application/json')
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce('chunked');

        mockReadRawBody.mockResolvedValue(null);

        const result = await readRequestBody(event);
        expect(result).toBeNull();
      });

      it('should fallback to string when JSON parsing fails', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader
          .mockReturnValueOnce('application/json')
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce('chunked');

        mockReadRawBody.mockResolvedValue('invalid json {');

        const result = await readRequestBody(event);
        expect(result).toBe('invalid json {');
      });

      it('should try to parse unknown content type as JSON', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader
          .mockReturnValueOnce('application/octet-stream')
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce('chunked');

        mockReadRawBody.mockResolvedValue('{"binary":"data"}');

        const result = await readRequestBody(event);
        expect(result).toEqual({ binary: 'data' });
      });
    });

    describe('regular requests', () => {
      it('should use readBody for requests with content-length', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader
          .mockReturnValueOnce('application/json')
          .mockReturnValueOnce('123')
          .mockReturnValueOnce(undefined);

        mockReadBody.mockResolvedValue({ regular: 'body' });

        const result = await readRequestBody(event);
        expect(result).toEqual({ regular: 'body' });
        expect(mockReadBody).toHaveBeenCalled();
      });

      it('should return null when readBody fails', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader
          .mockReturnValueOnce('application/json')
          .mockReturnValueOnce('123')
          .mockReturnValueOnce(undefined);

        mockReadBody.mockRejectedValue(new Error('Parse error'));

        const result = await readRequestBody(event);
        expect(result).toBeNull();
      });
    });

    describe('error handling', () => {
      it('should return null and try fallback on general error', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader.mockImplementation(() => {
          throw new Error('Header error');
        });
        mockReadRawBody.mockResolvedValue('{"fallback":"data"}');

        const result = await readRequestBody(event);
        expect(result).toEqual({ fallback: 'data' });
      });

      it('should return null when everything fails', async () => {
        const event = createMockEvent('POST');
        mockGetRequestHeader.mockImplementation(() => {
          throw new Error('Header error');
        });
        mockReadRawBody.mockRejectedValue(new Error('Raw body error'));

        const result = await readRequestBody(event);
        expect(result).toBeNull();
      });
    });
  });

  describe('readRequestBodyWithRaw', () => {
    it('should return null values for GET requests', async () => {
      const event = createMockEvent('GET');
      mockGetRequestHeader.mockReturnValue('application/json');

      const result = await readRequestBodyWithRaw(event);

      expect(result).toEqual({
        parsed: null,
        raw: null,
        contentType: 'application/json'
      });
    });

    it('should return both parsed and raw body for JSON', async () => {
      const event = createMockEvent('POST');
      mockGetRequestHeader.mockReturnValue('application/json');
      mockReadRawBody.mockResolvedValue('{"test":"value"}');

      const result = await readRequestBodyWithRaw(event);

      expect(result).toEqual({
        parsed: { test: 'value' },
        raw: '{"test":"value"}',
        contentType: 'application/json'
      });
    });

    it('should return both parsed and raw body for form-urlencoded', async () => {
      const event = createMockEvent('POST');
      mockGetRequestHeader.mockReturnValue('application/x-www-form-urlencoded');
      mockReadRawBody.mockResolvedValue('name=John&age=30');

      const result = await readRequestBodyWithRaw(event);

      expect(result).toEqual({
        parsed: { name: 'John', age: '30' },
        raw: 'name=John&age=30',
        contentType: 'application/x-www-form-urlencoded'
      });
    });

    it('should keep raw as parsed when JSON parsing fails', async () => {
      const event = createMockEvent('POST');
      mockGetRequestHeader.mockReturnValue('application/json');
      mockReadRawBody.mockResolvedValue('not valid json');

      const result = await readRequestBodyWithRaw(event);

      expect(result).toEqual({
        parsed: 'not valid json',
        raw: 'not valid json',
        contentType: 'application/json'
      });
    });

    it('should return null values when raw body is empty', async () => {
      const event = createMockEvent('POST');
      mockGetRequestHeader.mockReturnValue('application/json');
      mockReadRawBody.mockResolvedValue(null);

      const result = await readRequestBodyWithRaw(event);

      expect(result).toEqual({
        parsed: null,
        raw: null,
        contentType: 'application/json'
      });
    });

    it('should handle empty content-type header', async () => {
      const event = createMockEvent('POST');
      mockGetRequestHeader.mockReturnValue('');
      mockReadRawBody.mockResolvedValue('some data');

      const result = await readRequestBodyWithRaw(event);

      expect(result).toEqual({
        parsed: 'some data',
        raw: 'some data',
        contentType: ''
      });
    });

    it('should handle errors gracefully', async () => {
      const event = createMockEvent('POST');
      mockGetRequestHeader.mockReturnValue('application/json');
      mockReadRawBody.mockRejectedValue(new Error('Read error'));

      const result = await readRequestBodyWithRaw(event);

      expect(result).toEqual({
        parsed: null,
        raw: null,
        contentType: 'application/json'
      });
    });
  });
});
