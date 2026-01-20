import { getDatabase } from './db';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { H3Event } from 'h3';

/**
 * Handles API requests through the SDK with session-specific response overrides
 */
export async function handleSdkRequest(
  event: H3Event,
  integrationId: string,
  sessionId: string,
  apiPath: string
) {
  // Verify session exists
  const db = getDatabase();
  const sessionStmt = db.prepare('SELECT * FROM sessions WHERE id = ? AND integrationId = ?');
  const session = sessionStmt.get(sessionId, integrationId) as any;

  if (!session) {
    throw createError({
      statusCode: 404,
      message: 'Session not found',
    });
  }

  // Update session's updatedAt timestamp
  const updateSessionStmt = db.prepare('UPDATE sessions SET updatedAt = ? WHERE id = ?');
  updateSessionStmt.run(new Date().toISOString(), sessionId);

  // Get integration
  const integrationStmt = db.prepare('SELECT * FROM integrations WHERE id = ?');
  const integration = integrationStmt.get(integrationId) as any;

  if (!integration || !integration.isActive) {
    throw createError({
      statusCode: 404,
      message: 'Integration not found or inactive',
    });
  }

  // Check CORS: Validate Origin header
  const origin = getRequestHeader(event, 'origin') || getRequestHeader(event, 'referer');
  let allowedOrigin = '*';

  if (integration.allowedOrigins) {
    const allowedOrigins = JSON.parse(integration.allowedOrigins);

    // If allowedOrigins is not empty, enforce CORS
    if (allowedOrigins.length > 0) {
      let isAllowed = false;

      if (origin) {
        // Extract origin from referer if needed
        let requestOrigin = origin;
        if (origin.includes('://')) {
          try {
            const url = new URL(origin);
            requestOrigin = `${url.protocol}//${url.host}`;
          } catch (e) {
            // Invalid URL, use as-is
          }
        }

        // Check if origin matches any allowed origin
        isAllowed = allowedOrigins.some((allowed: string) => {
          // Normalize both origins for comparison
          const normalizedAllowed = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
          const normalizedRequest = requestOrigin.endsWith('/') ? requestOrigin.slice(0, -1) : requestOrigin;
          return normalizedAllowed === normalizedRequest;
        });

        if (isAllowed) {
          allowedOrigin = requestOrigin;
        }
      }

      if (!isAllowed) {
        throw createError({
          statusCode: 403,
          message: 'Origin not allowed by CORS policy',
        });
      }
    }
  }

  // Set CORS headers with validated origin
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  });

  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204);
    return '';
  }

  // Build the API path
  const normalizedApiPath = apiPath.startsWith('/') ? apiPath : '/' + apiPath;
  const method = event.method;

  // Read all APIs
  const apisPath = resolve(process.cwd(), 'data/apis.json');
  const apisData = await readFile(apisPath, 'utf-8');
  const allApis = JSON.parse(apisData);

  // Find matching API with route pattern support
  const matchingApis = allApis
    .filter((a: any) =>
      a.projectId === integration.projectId &&
      a.method === method &&
      a.enabled === true
    )
    .map((a: any) => ({
      api: a,
      match: matchRoute(a.endpoint, normalizedApiPath),
    }))
    .filter((item: any) => item.match !== null)
    .sort((a: any, b: any) => {
      // Exact matches first
      if (a.api.endpoint === normalizedApiPath && b.api.endpoint !== normalizedApiPath) return -1;
      if (b.api.endpoint === normalizedApiPath && a.api.endpoint !== normalizedApiPath) return 1;

      // Routes with more segments are more specific (e.g., /endpoints/:id > /endpoints/)
      const aSegments = a.api.endpoint.split('/').filter(Boolean).length;
      const bSegments = b.api.endpoint.split('/').filter(Boolean).length;
      if (aSegments !== bSegments) return bSegments - aSegments;

      // For same segment count, more static segments = more specific
      const aParams = (a.api.endpoint.match(/:[^/]+/g) || []).length;
      const bParams = (b.api.endpoint.match(/:[^/]+/g) || []).length;
      return aParams - bParams;
    });

  const api = matchingApis.length > 0 ? matchingApis[0].api : null;

  if (!api) {
    throw createError({
      statusCode: 404,
      message: `No API found for ${method} ${normalizedApiPath}`,
    });
  }

  // Check if there's a session-specific response override
  const responseStmt = db.prepare('SELECT * FROM session_responses WHERE sessionId = ? AND apiId = ?');
  const sessionResponse = responseStmt.get(sessionId, api.id) as any;

  let activeStatusMock;

  if (sessionResponse) {
    // Use session-specific status code (compare as integers to handle string/number mismatch)
    activeStatusMock = api.statusMocks?.find((sm: any) =>
      parseInt(sm.statusCode, 10) === parseInt(sessionResponse.responseStatusCode, 10)
    );
  }

  if (!activeStatusMock) {
    // Fall back to default enabled status mock
    activeStatusMock = api.statusMocks?.find((sm: any) => sm.enabled);
  }

  if (!activeStatusMock) {
    throw createError({
      statusCode: 500,
      message: `No active status mock configured for ${method} ${normalizedApiPath}`,
    });
  }

  // Parse and return the response
  let response;

  if (activeStatusMock.responseObjectId === 'text-only') {
    const value = activeStatusMock.responseValue || '';
    if (value.trim().toLowerCase() === 'null') {
      response = null;
    } else if (value.trim().toLowerCase() === 'undefined') {
      response = undefined;
    } else if (value.trim() === '') {
      response = '';
    } else {
      response = value;
    }
  } else {
    try {
      response = JSON.parse(activeStatusMock.responseValue);
    } catch {
      try {
        response = eval(`(${activeStatusMock.responseValue})`);
      } catch {
        response = activeStatusMock.responseValue;
      }
    }

    // Replace access_token fields if needed
    const projectsPath = resolve(process.cwd(), 'data/projects.json');
    const projectsData = await readFile(projectsPath, 'utf-8');
    const projects = JSON.parse(projectsData);
    const project = projects.find((p: any) => p.id === integration.projectId);

    if (project && project.accessToken) {
      response = replaceAccessTokens(response, project.accessToken);
    }
  }

  setResponseStatus(event, activeStatusMock.statusCode || 200);
  return response;
}

/**
 * Matches a route pattern against an actual path
 * Supports :param style route parameters
 * Returns matched params object or null if no match
 */
function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  // Must have same number of segments
  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      // This is a parameter, extract the value
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      // Static segment doesn't match
      return null;
    }
  }

  return params;
}

function replaceAccessTokens(obj: any, accessToken: string): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceAccessTokens(item, accessToken));
  }

  const result: any = {};
  for (const key in obj) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'access_token' || lowerKey === 'accesstoken') {
      result[key] = accessToken;
    } else {
      result[key] = replaceAccessTokens(obj[key], accessToken);
    }
  }
  return result;
}
