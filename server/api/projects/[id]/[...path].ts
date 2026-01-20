import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { z } from 'zod';
import { createHash, randomUUID, createHmac } from 'crypto';

/**
 * Checks if a request path matches an endpoint pattern with route parameters
 * e.g., /api/v0/institutions/:id/segments matches /api/v0/institutions/123/segments
 * Also handles {id} format from OpenAPI/Swagger specs
 */
function pathMatches(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    // If pattern part is a parameter (starts with : or is wrapped in {}), it matches any value
    if (patternPart.startsWith(':') || (patternPart.startsWith('{') && patternPart.endsWith('}'))) {
      continue;
    }

    // Otherwise, must be exact match
    if (patternPart !== pathPart) {
      return false;
    }
  }

  return true;
}

/**
 * Recursively replaces access_token or accessToken fields with the project's current access token
 */
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

/**
 * Parses request body based on content type
 */
function parseRequestBody(contentType: string | undefined, rawBody: any): any {
  // Normalize content type (remove charset, lowercase)
  const normalizedType = contentType?.split(';')[0].trim().toLowerCase();

  // If rawBody is already parsed (object), return it directly for JSON types
  if (typeof rawBody === 'object' && rawBody !== null) {
    return rawBody;
  }

  const bodyString = rawBody?.toString() || '';

  try {
    switch (normalizedType) {
      case 'application/json':
        return JSON.parse(bodyString);

      case 'application/x-www-form-urlencoded':
        return Object.fromEntries(new URLSearchParams(bodyString));

      case 'multipart/form-data':
        // For multipart/form-data, H3/Nitro usually parses this automatically
        // If we receive a string, we return it as-is since proper parsing requires
        // boundary extraction and binary handling
        if (typeof rawBody === 'object') {
          return rawBody;
        }
        // Return raw body - multipart needs special handling
        return rawBody;

      case 'application/xml':
      case 'text/xml':
        // Return as string - XML parsing would require a library
        // The mock server can work with the raw XML string for validation
        return { _xml: bodyString, _raw: true };

      case 'application/graphql':
        // GraphQL can be sent as JSON with "query" field or as raw query string
        try {
          return JSON.parse(bodyString);
        } catch {
          // If not valid JSON, treat as raw GraphQL query
          return { query: bodyString };
        }

      default:
        // For unknown content types, try JSON first, then return raw
        try {
          return JSON.parse(bodyString);
        } catch {
          return rawBody;
        }
    }
  } catch (error) {
    // If parsing fails, return the raw body
    return rawBody;
  }
}

export default defineEventHandler(async (event) => {
  // Enable CORS for all origins
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  });

  // Handle preflight OPTIONS requests
  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204);
    return '';
  }

  try {
    // Extract project ID from the path
    // Path format: /api/projects/:projectId/...rest
    const projectId = event.context.params?.id;

    if (!projectId) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required',
      });
    }

    // Get the request path and method (without query string)
    // Remove /api/projects/:projectId prefix to get the actual endpoint path
    const fullPath = event.path.replace(/^\/api\/projects\/[^\/]+/, '');
    // Remove query string and decode URL encoding (e.g., %7B becomes {)
    const path = decodeURIComponent(fullPath.split('?')[0]);
    const method = event.method;

    // Skip if it's a mocks management endpoint
    if (path.startsWith('/mocks')) {
      return;
    }

    // Read all mocks
    const filePath = resolve(process.cwd(), 'data/apis.json');
    const data = await readFile(filePath, 'utf-8');
    const mocks = JSON.parse(data);

    // Find matching mocks for this specific project
    // Sort so exact matches come first, then by specificity (fewer params = more specific)
    const matchingMocks = mocks
      .filter((m: any) =>
        pathMatches(m.endpoint, path) &&
        m.method === method &&
        m.enabled === true &&
        m.projectId === projectId
      )
      .sort((a: any, b: any) => {
        // Exact matches first
        if (a.endpoint === path && b.endpoint !== path) return -1;
        if (b.endpoint === path && a.endpoint !== path) return 1;

        // Routes with more segments are more specific (e.g., /links/:id > /:shortCode)
        const aSegments = a.endpoint.split('/').filter(Boolean).length;
        const bSegments = b.endpoint.split('/').filter(Boolean).length;
        if (aSegments !== bSegments) return bSegments - aSegments;

        // For same segment count, more static segments = more specific
        const aParams = (a.endpoint.match(/:[^/]+|\{[^}]+\}/g) || []).length;
        const bParams = (b.endpoint.match(/:[^/]+|\{[^}]+\}/g) || []).length;
        return aParams - bParams;
      });

    const mock = matchingMocks[0];


    if (!mock) {
      throw createError({
        statusCode: 404,
        message: `No mock found for ${method} ${path}`,
      });
    }

    // Find active status mock
    const activeStatusMock = mock.statusMocks?.find((sm: any) => sm.enabled);
    if (!activeStatusMock) {
      throw createError({
        statusCode: 500,
        message: `No active status mock configured for ${method} ${path}`,
      });
    }


    // Helper function to return error response
    const returnErrorResponse = async (statusCode: number = 400, errorMessage?: string) => {
      // Handle text-only responses
      if (mock.errorResponseObjectId === 'text-only') {
        setResponseStatus(event, statusCode);
        setResponseHeader(event, 'Content-Type', 'text/plain');

        // If errorMessage is provided, return it directly
        if (errorMessage) {
          return errorMessage;
        }

        const value = mock.errorResponseValue || '';

        // Handle special text values
        if (value.trim().toLowerCase() === 'null') return null;
        if (value.trim().toLowerCase() === 'undefined') return undefined;
        if (value.trim() === '') return '';

        return value;
      }

      // Handle json-only and regular object responses
      let errorResponse;
      try {
        errorResponse = JSON.parse(mock.errorResponseValue || '{}');
      } catch {
        try {
          errorResponse = eval(`(${mock.errorResponseValue})`);
        } catch {
          errorResponse = mock.errorResponseValue || { error: 'Validation failed' };
        }
      }

      // If errorMessage is provided, find and update error-related fields
      if (errorMessage && typeof errorResponse === 'object' && errorResponse !== null) {
        // Find key that matches "errormessage", "message", or "error" (case-insensitive, ignoring underscores)
        let foundKey = false;
        for (const key in errorResponse) {
          const normalizedKey = key.toLowerCase().replace(/_/g, '');
          if (normalizedKey === 'errormessage' || normalizedKey === 'message' || normalizedKey === 'error') {
            errorResponse[key] = errorMessage;
            foundKey = true;
            break;
          }
        }

        // If no matching key found, add it with 'error' key
        if (!foundKey) {
          errorResponse.error = errorMessage;
        }
      }

      // Replace access_token fields with the current project's access token
      if (mock.projectId) {
        const projectsFilePath = resolve(process.cwd(), 'data/projects.json');
        const projectsData = await readFile(projectsFilePath, 'utf-8');
        const projects = JSON.parse(projectsData);
        const project = projects.find((p: any) => p.id === mock.projectId);

        if (project && project.accessToken) {
          errorResponse = replaceAccessTokens(errorResponse, project.accessToken);
        }
      }

      setResponseStatus(event, statusCode);
      return errorResponse;
    };

    // Validate authentication if isAuth is enabled
    if (mock.isAuth) {
      // Read project data to get auth config
      const projectsFilePath = resolve(process.cwd(), 'data/projects.json');
      const projectsData = await readFile(projectsFilePath, 'utf-8');
      const projects = JSON.parse(projectsData);

      const project = projects.find((p: any) => p.id === mock.projectId);

      if (!project || !project.isAuth) {
        return await returnErrorResponse(401, 'Unauthorized: Authentication not configured');
      }

      const authType = project.authType || 'bearer-token';
      const authConfig = project.authConfig || {};

      // Validate based on auth type
      switch (authType) {
        case 'api-key': {
          const headerName = authConfig.apiKeyHeader || 'X-API-Key';
          const apiKey = getHeader(event, headerName);

          if (!apiKey) {
            return await returnErrorResponse(401, `Unauthorized: Missing ${headerName} header`);
          }

          if (apiKey !== authConfig.apiKey) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid API key');
          }
          break;
        }

        case 'bearer-token': {
          const authHeader = getHeader(event, 'Authorization');

          if (!authHeader) {
            return await returnErrorResponse(401, 'Unauthorized: Missing Authorization header');
          }

          const token = authHeader.replace('Bearer ', '');

          if (token !== authConfig.bearerToken && token !== project.accessToken) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid bearer token');
          }
          break;
        }

        case 'basic-auth': {
          const authHeader = getHeader(event, 'Authorization');

          if (!authHeader || !authHeader.startsWith('Basic ')) {
            return await returnErrorResponse(401, 'Unauthorized: Missing or invalid Basic auth header');
          }

          const base64Credentials = authHeader.replace('Basic ', '');
          const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
          const [username, password] = credentials.split(':');

          if (username !== authConfig.basicUsername || password !== authConfig.basicPassword) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid username or password');
          }
          break;
        }

        case 'digest-auth': {
          const authHeader = getHeader(event, 'Authorization');

          if (!authHeader || !authHeader.startsWith('Digest ')) {
            // Return 401 with WWW-Authenticate challenge header
            setResponseStatus(event, 401);
            setResponseHeader(event, 'WWW-Authenticate', `Digest realm="${authConfig.digestRealm || 'API'}", qop="auth", nonce="${randomUUID()}", opaque="${randomUUID()}"`);
            return await returnErrorResponse(401, 'Unauthorized: Digest authentication required');
          }

          // Parse digest auth parameters
          const digestParams = authHeader.replace('Digest ', '').split(', ').reduce((acc: any, param) => {
            const [key, value] = param.split('=');
            acc[key] = value?.replace(/"/g, '');
            return acc;
          }, {});

          // Validate username
          if (digestParams.username !== authConfig.digestUsername) {
            setResponseStatus(event, 401);
            setResponseHeader(event, 'WWW-Authenticate', `Digest realm="${authConfig.digestRealm || 'API'}", qop="auth", nonce="${randomUUID()}", opaque="${randomUUID()}"`);
            return await returnErrorResponse(401, 'Unauthorized: Invalid digest credentials');
          }

          // Validate password by computing expected response hash
          if (!digestParams.response || !authConfig.digestPassword) {
            setResponseStatus(event, 401);
            setResponseHeader(event, 'WWW-Authenticate', `Digest realm="${authConfig.digestRealm || 'API'}", qop="auth", nonce="${randomUUID()}", opaque="${randomUUID()}"`);
            return await returnErrorResponse(401, 'Unauthorized: Invalid digest credentials');
          }

          // Compute the expected digest response to validate password
          const realm = authConfig.digestRealm || 'API';
          const ha1 = createHash('md5').update(`${authConfig.digestUsername}:${realm}:${authConfig.digestPassword}`).digest('hex');
          const ha2 = createHash('md5').update(`${method}:${digestParams.uri || path}`).digest('hex');
          const expectedResponse = createHash('md5').update(`${ha1}:${digestParams.nonce}:${digestParams.nc}:${digestParams.cnonce}:${digestParams.qop}:${ha2}`).digest('hex');

          if (digestParams.response !== expectedResponse) {
            setResponseStatus(event, 401);
            setResponseHeader(event, 'WWW-Authenticate', `Digest realm="${authConfig.digestRealm || 'API'}", qop="auth", nonce="${randomUUID()}", opaque="${randomUUID()}"`);
            return await returnErrorResponse(401, 'Unauthorized: Invalid digest credentials');
          }
          break;
        }

        case 'oauth1': {
          const authHeader = getHeader(event, 'Authorization');
          const query = getQuery(event);
          let requestBody: any = {};

          // Get the original request path (before any modifications)
          const originalPath = event.path;

          // Read body for POST/PUT/PATCH requests
          if (['POST', 'PUT', 'PATCH'].includes(method)) {
            try {
              const rawBody = await readBody(event);
              const requestContentType = getHeader(event, 'content-type');
              const configuredContentType = mock.contentType || requestContentType;
              requestBody = parseRequestBody(configuredContentType, rawBody);
              // Handle XML or raw bodies
              if (requestBody?._raw) {
                requestBody = {};
              }
            } catch {
              requestBody = {};
            }
          }

          // OAuth 1.0 parameters can be in three places:
          // 1. Authorization header (OAuth realm="...", oauth_consumer_key="...")
          // 2. Query parameters (most common with Postman)
          // 3. Request body (for POST requests with application/x-www-form-urlencoded)

          let oauthParams: any = {};

          // Check Authorization header first
          if (authHeader && authHeader.startsWith('OAuth ')) {
            const headerContent = authHeader.replace('OAuth ', '');
            headerContent.split(',').forEach((param) => {
              const trimmedParam = param.trim();
              const eqIndex = trimmedParam.indexOf('=');
              if (eqIndex > 0) {
                const key = trimmedParam.substring(0, eqIndex).trim();
                const value = trimmedParam.substring(eqIndex + 1).trim().replace(/^"/, '').replace(/"$/, '');
                if (key.startsWith('oauth_') && key !== 'realm') {
                  try {
                    oauthParams[key] = decodeURIComponent(value);
                  } catch {
                    oauthParams[key] = value;
                  }
                }
              }
            });
          }

          // Check query parameters (Postman sends OAuth params here)
          const oauthQueryKeys = ['oauth_consumer_key', 'oauth_signature_method', 'oauth_signature',
                                   'oauth_timestamp', 'oauth_nonce', 'oauth_token', 'oauth_version'];
          oauthQueryKeys.forEach(key => {
            if (query[key]) {
              oauthParams[key] = String(query[key]);
            }
          });

          // Check request body for OAuth params (works with form-urlencoded which is already parsed)
          const contentType = getHeader(event, 'content-type');
          if (contentType?.includes('application/x-www-form-urlencoded') && typeof requestBody === 'object') {
            oauthQueryKeys.forEach(key => {
              if (requestBody[key]) {
                oauthParams[key] = String(requestBody[key]);
              }
            });
          }

          // Validate consumer key (required)
          if (!oauthParams.oauth_consumer_key) {
            return await returnErrorResponse(401, 'Unauthorized: Missing oauth_consumer_key');
          }

          if (oauthParams.oauth_consumer_key !== authConfig.oauth1ConsumerKey) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid OAuth consumer key');
          }

          // If signature is provided, validate it fully (Postman mode)
          if (oauthParams.oauth_signature) {
            // Validate required parameters for signature validation
            const requiredParams = ['oauth_signature_method', 'oauth_timestamp', 'oauth_nonce'];
            for (const param of requiredParams) {
              if (!oauthParams[param]) {
                return await returnErrorResponse(401, `Unauthorized: Missing OAuth 1.0 parameter: ${param}`);
              }
            }

            // Validate signature method
            if (oauthParams.oauth_signature_method !== 'HMAC-SHA1' && oauthParams.oauth_signature_method !== 'HMAC-SHA256') {
              return await returnErrorResponse(401, 'Unauthorized: Unsupported signature method');
            }

            // Validate timestamp (prevent replay attacks - allow 5 minute window)
            const timestamp = parseInt(oauthParams.oauth_timestamp);
            const now = Math.floor(Date.now() / 1000);
            if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
              return await returnErrorResponse(401, 'Unauthorized: Invalid or expired timestamp');
            }

            // Build signature base string according to OAuth 1.0 spec
            const allParams: Record<string, string> = {};

            // Add query parameters (excluding OAuth params which will be added separately)
            Object.entries(query).forEach(([key, value]) => {
              if (!key.startsWith('oauth_')) {
                allParams[key] = String(value);
              }
            });

            // Add body parameters if content-type is application/x-www-form-urlencoded
            if (contentType?.includes('application/x-www-form-urlencoded') && typeof requestBody === 'object') {
              Object.entries(requestBody).forEach(([key, value]) => {
                if (!key.startsWith('oauth_')) {
                  allParams[key] = String(value);
                }
              });
            }

            // Add OAuth parameters (exclude signature itself)
            Object.entries(oauthParams).forEach(([key, value]) => {
              if (key !== 'oauth_signature') {
                allParams[key] = String(value);
              }
            });

            // Sort parameters and create parameter string
            const sortedKeys = Object.keys(allParams).sort();
            const paramString = sortedKeys
              .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
              .join('&');

            // Build base URL (without query parameters)
            // Use the original request path, not the modified fullPath
            const protocol = getHeader(event, 'x-forwarded-proto') || 'http';
            const host = getHeader(event, 'host') || 'localhost';
            const pathWithoutQuery = originalPath.split('?')[0];
            const baseUrl = `${protocol}://${host}${pathWithoutQuery}`;

            // Create signature base string: METHOD&URL&PARAMS
            const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;

            // Create signing key: consumer_secret&token_secret
            const consumerSecret = authConfig.oauth1ConsumerSecret || '';
            const tokenSecret = authConfig.oauth1TokenSecret || '';
            const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

            // Generate expected signature
            let expectedSignature: string;
            if (oauthParams.oauth_signature_method === 'HMAC-SHA256') {
              expectedSignature = createHmac('sha256', signingKey)
                .update(signatureBaseString)
                .digest('base64');
            } else { // HMAC-SHA1
              expectedSignature = createHmac('sha1', signingKey)
                .update(signatureBaseString)
                .digest('base64');
            }

            // Compare signatures
            if (oauthParams.oauth_signature !== expectedSignature) {
              return await returnErrorResponse(401, 'Unauthorized: Invalid OAuth 1.0 signature');
            }
          }

          // Optionally validate token if provided and configured
          if (oauthParams.oauth_token && authConfig.oauth1Token) {
            if (oauthParams.oauth_token !== authConfig.oauth1Token) {
              return await returnErrorResponse(401, 'Unauthorized: Invalid OAuth token');
            }
          }

          break;
        }

        case 'oauth2': {
          const authHeader = getHeader(event, 'Authorization');

          if (!authHeader) {
            return await returnErrorResponse(401, 'Unauthorized: Missing Authorization header');
          }

          const token = authHeader.replace('Bearer ', '');

          if (token !== authConfig.oauth2AccessToken) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid OAuth 2.0 access token');
          }
          break;
        }

        case 'hawk': {
          const authHeader = getHeader(event, 'Authorization');

          if (!authHeader || !authHeader.startsWith('Hawk ')) {
            return await returnErrorResponse(401, 'Unauthorized: Missing or invalid Hawk auth header');
          }

          // Parse Hawk parameters from Authorization header
          const hawkParams = authHeader.replace('Hawk ', '').split(', ').reduce((acc: any, param) => {
            const [key, value] = param.split('=');
            acc[key] = value?.replace(/"/g, '');
            return acc;
          }, {});

          // Validate Hawk ID (only required validation for mock server)
          if (!hawkParams.id) {
            return await returnErrorResponse(401, 'Unauthorized: Missing Hawk ID');
          }

          if (hawkParams.id !== authConfig.hawkId) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid Hawk credentials');
          }

          break;
        }

        case 'aws-signature': {
          const authHeader = getHeader(event, 'Authorization');

          if (!authHeader || !authHeader.startsWith('AWS4-HMAC-SHA256')) {
            return await returnErrorResponse(401, 'Unauthorized: Missing or invalid AWS Signature header');
          }

          // Parse AWS Signature V4 Authorization header
          // Format: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-date, Signature=fe5f80f77d5fa3beca038a248ff027d0445342fe2855ddc963176630326f1024
          const credentialMatch = authHeader.match(/Credential=([^/]+)/);
          const accessKeyId = credentialMatch ? credentialMatch[1] : null;

          if (!accessKeyId) {
            return await returnErrorResponse(401, 'Unauthorized: Missing AWS Access Key ID in Authorization header');
          }

          if (accessKeyId !== authConfig.awsAccessKeyId) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid AWS credentials');
          }

          // For mock server purposes, we validate the access key ID
          // Full signature validation would require reconstructing the canonical request
          // which is complex and not necessary for a mock server
          // If signature validation is needed, check that signature exists
          const signatureMatch = authHeader.match(/Signature=([a-f0-9]+)/);
          if (!signatureMatch) {
            return await returnErrorResponse(401, 'Unauthorized: Missing signature in AWS Authorization header');
          }

          break;
        }

        case 'akamai-edgegrid': {
          const authHeader = getHeader(event, 'Authorization');

          if (!authHeader || !authHeader.startsWith('EG1-HMAC-SHA256')) {
            return await returnErrorResponse(401, 'Unauthorized: Missing or invalid Akamai EdgeGrid header');
          }

          // Parse EdgeGrid parameters from Authorization header
          // Format: EG1-HMAC-SHA256 client_token={token};access_token={token};timestamp={timestamp};nonce={nonce};signature={signature}
          const clientTokenMatch = authHeader.match(/client_token=([^;]+)/);
          const accessTokenMatch = authHeader.match(/access_token=([^;]+)/);
          const timestampMatch = authHeader.match(/timestamp=([^;]+)/);
          const nonceMatch = authHeader.match(/nonce=([^;]+)/);
          const signatureMatch = authHeader.match(/signature=([^;$]+)/);

          const clientToken = clientTokenMatch ? clientTokenMatch[1] : null;
          const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
          const timestamp = timestampMatch ? timestampMatch[1] : null;
          const nonce = nonceMatch ? nonceMatch[1] : null;
          const signature = signatureMatch ? signatureMatch[1] : null;

          // Validate required parameters
          if (!clientToken) {
            return await returnErrorResponse(401, 'Unauthorized: Missing client_token in EdgeGrid header');
          }

          if (!accessToken) {
            return await returnErrorResponse(401, 'Unauthorized: Missing access_token in EdgeGrid header');
          }

          if (!timestamp) {
            return await returnErrorResponse(401, 'Unauthorized: Missing timestamp in EdgeGrid header');
          }

          if (!nonce) {
            return await returnErrorResponse(401, 'Unauthorized: Missing nonce in EdgeGrid header');
          }

          if (!signature) {
            return await returnErrorResponse(401, 'Unauthorized: Missing signature in EdgeGrid header');
          }

          // Validate client token
          if (clientToken !== authConfig.akamaiClientToken) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid client_token');
          }

          // Validate access token
          if (accessToken !== authConfig.akamaiAccessToken) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid access_token');
          }

          // Validate timestamp (prevent replay attacks - allow 5 minute window)
          try {
            const requestTime = new Date(timestamp.replace('+0000', 'Z')).getTime();
            const now = Date.now();
            const timeDiff = Math.abs(now - requestTime);

            // Allow 5 minute window (300000 ms)
            if (timeDiff > 300000) {
              return await returnErrorResponse(401, 'Unauthorized: Request timestamp too old or too far in future');
            }
          } catch {
            return await returnErrorResponse(401, 'Unauthorized: Invalid timestamp format');
          }

          // For mock server purposes, we accept any signature format
          // In real EdgeGrid, you would validate: signature = Base64(HMAC-SHA256(signing_key, data_to_sign))
          // where signing_key = Base64(HMAC-SHA256(client_secret, timestamp))
          // and data_to_sign includes method, host, path, headers, and body hash

          break;
        }

        case 'jwt-bearer': {
          const authHeader = getHeader(event, 'Authorization');

          if (!authHeader) {
            return await returnErrorResponse(401, 'Unauthorized: Missing Authorization header');
          }

          const token = authHeader.replace('Bearer ', '');

          if (token !== authConfig.jwtToken) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid JWT token');
          }
          break;
        }

        default: {
          // Fallback to legacy bearer token validation
          const authHeader = getHeader(event, 'Authorization');

          if (!authHeader) {
            return await returnErrorResponse(401, 'Unauthorized: Missing Authorization header');
          }

          const token = authHeader.replace('Bearer ', '');

          if (token !== project.accessToken) {
            return await returnErrorResponse(401, 'Unauthorized: Invalid access token');
          }
        }
      }
    }


    // Validate query parameters
    if (activeStatusMock.queryParams && activeStatusMock.queryParams.length > 0) {
      const query = getQuery(event);

      for (const param of activeStatusMock.queryParams) {
        if (param.required && !query[param.key]) {
          return await returnErrorResponse(400, `Missing required query parameter: ${param.key}`);
        }

        // Type validation
        if (query[param.key]) {
          const value = query[param.key];

          if (param.type === 'number' && isNaN(Number(value))) {
            return await returnErrorResponse(400, `Query parameter ${param.key} must be a number`);
          }

          if (param.type === 'boolean' && value !== 'true' && value !== 'false') {
            return await returnErrorResponse(400, `Query parameter ${param.key} must be a boolean`);
          }

          if (param.type === 'array' && !Array.isArray(value)) {
            return await returnErrorResponse(400, `Query parameter ${param.key} must be an array`);
          }

          if (param.type === 'object' && typeof value !== 'object') {
            return await returnErrorResponse(400, `Query parameter ${param.key} must be an object`);
          }
        }
      }
    }

    // Validate header parameters
    if (activeStatusMock.headerParams && activeStatusMock.headerParams.length > 0) {
      for (const param of activeStatusMock.headerParams) {
        const headerValue = getHeader(event, param.key);
        if (param.required && !headerValue) {
          return await returnErrorResponse(400, `Missing required header: ${param.key}`);
        }

        // Type validation for headers
        if (headerValue) {
          if (param.type === 'number' && isNaN(Number(headerValue))) {
            return await returnErrorResponse(400, `Header ${param.key} must be a number`);
          }

          if (param.type === 'boolean' && headerValue !== 'true' && headerValue !== 'false') {
            return await returnErrorResponse(400, `Header ${param.key} must be a boolean`);
          }

          if (param.type === 'array') {
            try {
              const parsed = JSON.parse(headerValue);
              if (!Array.isArray(parsed)) {
                return await returnErrorResponse(400, `Header ${param.key} must be an array`);
              }
            } catch {
              return await returnErrorResponse(400, `Header ${param.key} must be a valid JSON array`);
            }
          }

          if (param.type === 'object') {
            try {
              const parsed = JSON.parse(headerValue);
              if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                return await returnErrorResponse(400, `Header ${param.key} must be an object`);
              }
            } catch {
              return await returnErrorResponse(400, `Header ${param.key} must be a valid JSON object`);
            }
          }
        }
      }
    }


    // Validate body parameters
    if (activeStatusMock.bodyParams && activeStatusMock.bodyParams.length > 0 && ['POST', 'PUT', 'PATCH'].includes(method)) {
      let body;
      try {
        const rawBody = await readBody(event);
        const requestContentType = getHeader(event, 'content-type');
        // Use the mock's configured contentType if available, otherwise use the request's content-type
        const configuredContentType = mock.contentType || requestContentType;
        body = parseRequestBody(configuredContentType, rawBody);

        // Check if body is null or not an object (skip for XML which returns special format)
        if (body === null || body === undefined) {
          return await returnErrorResponse(400, 'Request body cannot be null or empty');
        }

        // For non-XML content types, validate that body is an object
        if (typeof body !== 'object' && !body._raw) {
          return await returnErrorResponse(400, 'Request body must be a valid object');
        }
      } catch (error) {
        return await returnErrorResponse(400, 'Invalid request body format');
      }

      // Skip body param validation for XML (it's returned as raw string wrapper)
      if (!body._raw) {
        for (const param of activeStatusMock.bodyParams) {
          if (param.required && !body[param.key]) {
            return await returnErrorResponse(400, `Missing required body parameter: ${param.key}`);
          }

          // Type validation for body params
          if (body[param.key] !== undefined) {
            const value = body[param.key];

            if (param.type === 'string' && typeof value !== 'string') {
              return await returnErrorResponse(400, `Body parameter ${param.key} must be a string`);
            }

            if (param.type === 'number' && typeof value !== 'number') {
              return await returnErrorResponse(400, `Body parameter ${param.key} must be a number`);
            }

            if (param.type === 'boolean' && typeof value !== 'boolean') {
              return await returnErrorResponse(400, `Body parameter ${param.key} must be a boolean`);
            }

            if (param.type === 'array' && !Array.isArray(value)) {
              return await returnErrorResponse(400, `Body parameter ${param.key} must be an array`);
            }

            if (param.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
              return await returnErrorResponse(400, `Body parameter ${param.key} must be an object`);
            }
          }
        }
      }
    }


    // Apply custom validators
    if (activeStatusMock.validators && activeStatusMock.validators.length > 0) {
      let body: any = {};
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          const rawBody = await readBody(event) || {};
          const requestContentType = getHeader(event, 'content-type');
          const configuredContentType = mock.contentType || requestContentType;
          body = parseRequestBody(configuredContentType, rawBody);
          // If body has _raw flag (XML), use empty object for validation
          if (body._raw) {
            body = {};
          }
        } catch {
          body = {};
        }
      }
      const query = getQuery(event);
      const allParams: any = { ...query, ...body };

      for (const validator of activeStatusMock.validators) {
        const value = allParams[validator.field];
        const rule = validator.rule;

        // equals: - value must equal the specified value
        if (rule.startsWith('equals:')) {
          const expectedValue = rule.substring(7);
          if (value !== undefined && value.toString() !== expectedValue) {
            return await returnErrorResponse(400, `Field ${validator.field} must equal '${expectedValue}'`);
          }
          continue;
        }

        // notEquals: - value must not equal the specified value
        if (rule.startsWith('notEquals:')) {
          const forbiddenValue = rule.substring(10);
          if (value !== undefined && value.toString() === forbiddenValue) {
            return await returnErrorResponse(400, `Field ${validator.field} must not equal '${forbiddenValue}'`);
          }
          continue;
        }

        // minLength: - string length must be at least N
        if (rule.startsWith('minLength:')) {
          const minLen = parseInt(rule.substring(10));
          if (value !== undefined && value.toString().length < minLen) {
            return await returnErrorResponse(400, `Field ${validator.field} must be at least ${minLen} characters`);
          }
          continue;
        }

        // maxLength: - string length must be at most N
        if (rule.startsWith('maxLength:')) {
          const maxLen = parseInt(rule.substring(10));
          if (value !== undefined && value.toString().length > maxLen) {
            return await returnErrorResponse(400, `Field ${validator.field} must be at most ${maxLen} characters`);
          }
          continue;
        }

        // length: - string length must be exactly N
        if (rule.startsWith('length:')) {
          const exactLen = parseInt(rule.substring(7));
          if (value !== undefined && value.toString().length !== exactLen) {
            return await returnErrorResponse(400, `Field ${validator.field} must be exactly ${exactLen} characters`);
          }
          continue;
        }

        // min: - numeric minimum value
        if (rule.startsWith('min:')) {
          const minVal = parseFloat(rule.substring(4));
          if (value !== undefined && parseFloat(value.toString()) < minVal) {
            return await returnErrorResponse(400, `Field ${validator.field} must be at least ${minVal}`);
          }
          continue;
        }

        // max: - numeric maximum value
        if (rule.startsWith('max:')) {
          const maxVal = parseFloat(rule.substring(4));
          if (value !== undefined && parseFloat(value.toString()) > maxVal) {
            return await returnErrorResponse(400, `Field ${validator.field} must be at most ${maxVal}`);
          }
          continue;
        }

        // email: - value must be a valid email (with optional domain check)
        if (rule.startsWith('email:') || rule === 'email') {
          if (value !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.toString())) {
              return await returnErrorResponse(400, `Field ${validator.field} must be a valid email`);
            }
            // Check domain if specified (email:domain.com)
            if (rule.startsWith('email:')) {
              const expectedDomain = rule.substring(6);
              const actualDomain = value.toString().split('@')[1];
              if (actualDomain !== expectedDomain) {
                return await returnErrorResponse(400, `Field ${validator.field} must be an email from domain '${expectedDomain}'`);
              }
            }
          }
          continue;
        }

        // Default: exact match (if none of the above patterns matched)
        if (value !== undefined && value.toString() !== rule) {
          return await returnErrorResponse(400, `Field ${validator.field} must equal '${rule}'`);
        }
      }
    }

    // Parse and return the mock response
    let response;

    // Handle text-only responses
    if (activeStatusMock.responseObjectId === 'text-only') {
      setResponseStatus(event, activeStatusMock.statusCode || 200);
      setResponseHeader(event, 'Content-Type', 'text/plain');
      const value = activeStatusMock.responseValue || '';

      // Handle special text values
      if (value.trim().toLowerCase() === 'null') {
        return null;
      } else if (value.trim().toLowerCase() === 'undefined') {
        return undefined;
      } else if (value.trim() === '') {
        return '';
      } else {
        return value;
      }
    } else {
      // Handle JSON/Object responses
      try {
        // Try to parse as JSON
        response = JSON.parse(activeStatusMock.responseValue);
      } catch {
        // If not valid JSON, try to evaluate as JS object
        try {
          response = eval(`(${activeStatusMock.responseValue})`);
        } catch {
          // Return as string if all else fails
          response = activeStatusMock.responseValue;
        }
      }

      // Replace access_token fields with the current project's access token
      if (mock.projectId) {
        const projectsFilePath = resolve(process.cwd(), 'data/projects.json');
        const projectsData = await readFile(projectsFilePath, 'utf-8');
        const projects = JSON.parse(projectsData);
        const project = projects.find((p: any) => p.id === mock.projectId);

        if (project && project.accessToken) {
          response = replaceAccessTokens(response, project.accessToken);
        }
      }
    }

    // Set status code and return response
    setResponseStatus(event, activeStatusMock.statusCode || 200);
    return response;
  } catch (error: any) {
    // If it's an H3 error with statusCode, throw it as-is
    if (error.statusCode) {
      throw error;
    }

    // Try to find the mock to use the configured error response format
    try {
      const projectId = event.context.params?.id;
      const fullPath = event.path.replace(/^\/api\/projects\/[^\/]+/, '');
      const path = decodeURIComponent(fullPath.split('?')[0]);
      const method = event.method;

      if (projectId && !path.startsWith('/mocks')) {
        const filePath = resolve(process.cwd(), 'data/apis.json');
        const data = await readFile(filePath, 'utf-8');
        const mocks = JSON.parse(data);

        const mock = mocks.find((m: any) =>
          pathMatches(m.endpoint, path) &&
          m.method === method &&
          m.enabled === true &&
          m.projectId === projectId
        );

        if (mock) {
          // Use the configured error response format
          if (mock.errorResponseObjectId === 'text-only') {
            setResponseStatus(event, 500);
            setResponseHeader(event, 'Content-Type', 'text/plain');
            return mock.errorResponseValue || 'Internal server error';
          } else {
            let errorResponse;
            try {
              errorResponse = JSON.parse(mock.errorResponseValue || '{}');
            } catch {
              try {
                errorResponse = eval(`(${mock.errorResponseValue})`);
              } catch {
                errorResponse = { error: 'Internal server error' };
              }
            }

            // Find and set error message in the appropriate field
            if (typeof errorResponse === 'object' && errorResponse !== null) {
              let foundKey = false;
              for (const key in errorResponse) {
                const normalizedKey = key.toLowerCase().replace(/_/g, '');
                if (normalizedKey === 'errormessage' || normalizedKey === 'message' || normalizedKey === 'error') {
                  errorResponse[key] = error.message || 'Internal server error';
                  foundKey = true;
                  break;
                }
              }
              if (!foundKey) {
                errorResponse.error = error.message || 'Internal server error';
              }
            }

            setResponseStatus(event, 500);
            return errorResponse;
          }
        }
      }
    } catch (innerError) {
      // If we can't read the mock config, fall through to default error
      console.error('Error reading mock config for error response:', innerError);
    }

    // Fallback to default error format
    throw createError({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
});
