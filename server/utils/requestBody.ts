import type { H3Event } from 'h3';
import { getRequestHeader, readBody, readRawBody } from 'h3';

/**
 * Handles reading request body from both regular requests and piped/streamed requests
 * Supports:
 * - Regular JSON/form data via readBody()
 * - Piped streams (e.g., curl --data-binary @file, echo "data" | curl)
 * - Large payloads that come in chunks
 */
export async function readRequestBody(event: H3Event): Promise<any> {
  const method = event.method;

  // Only read body for methods that typically have a body
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return null;
  }

  try {
    const contentType = getRequestHeader(event, 'content-type') || '';

    // Check if we're dealing with a stream or need to read raw data
    const contentLength = getRequestHeader(event, 'content-length');
    const transferEncoding = getRequestHeader(event, 'transfer-encoding');

    // If transfer-encoding is chunked or no content-length, we might be dealing with a stream
    if (transferEncoding === 'chunked' || !contentLength) {
      // Read raw body as text first to handle streams properly
      const rawBody = await readRawBody(event, false); // false = don't parse as UTF-8 yet

      if (!rawBody) {
        return null;
      }

      // Try to parse based on content type
      if (contentType.includes('application/json')) {
        try {
          return JSON.parse(rawBody);
        } catch {
          // If JSON parsing fails, return as string
          return rawBody;
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Parse form data
        const params = new URLSearchParams(rawBody);
        return Object.fromEntries(params.entries());
      } else if (contentType.includes('text/')) {
        // Return as text
        return rawBody;
      } else {
        // For binary or unknown types, try to return as string or parsed JSON
        try {
          return JSON.parse(rawBody);
        } catch {
          return rawBody;
        }
      }
    }

    // For regular requests, use readBody which handles most cases
    const body = await readBody(event).catch(() => null);
    return body;

  } catch (error) {
    console.error('Error reading request body:', error);

    // Fallback: try to read raw body as last resort
    try {
      const rawBody = await readRawBody(event, false);
      if (rawBody) {
        try {
          return JSON.parse(rawBody);
        } catch {
          return rawBody;
        }
      }
    } catch {
      // If everything fails, return null
      return null;
    }

    return null;
  }
}

/**
 * Alternative approach: Read body and preserve both raw and parsed versions
 * Useful when you need both the original stream data and parsed content
 */
export async function readRequestBodyWithRaw(event: H3Event): Promise<{
  parsed: any;
  raw: string | null;
  contentType: string;
}> {
  const method = event.method;
  const contentType = getRequestHeader(event, 'content-type') || '';

  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { parsed: null, raw: null, contentType };
  }

  try {
    // Always read raw body first to handle streams
    const rawBody = await readRawBody(event, false);

    if (!rawBody) {
      return { parsed: null, raw: null, contentType };
    }

    let parsed = rawBody;

    // Try to parse based on content type
    if (contentType.includes('application/json')) {
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        // Keep as string if parsing fails
        parsed = rawBody;
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const params = new URLSearchParams(rawBody);
        parsed = Object.fromEntries(params.entries());
      } catch {
        parsed = rawBody;
      }
    }

    return {
      parsed,
      raw: rawBody,
      contentType
    };
  } catch (error) {
    console.error('Error reading request body:', error);
    return { parsed: null, raw: null, contentType };
  }
}
