import { getDatabase } from '../../../utils/db';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

export default defineEventHandler(async (event) => {
  try {
    const integrationId = getRouterParam(event, 'integrationId');
    const baseUrl = process.env.BASE_URI || 'http://localhost:4001';

    if (!integrationId) {
      throw createError({
        statusCode: 400,
        message: 'Integration ID is required',
      });
    }

    // Get query parameters for filtering
    const query = getQuery(event);
    const filterGroup = query.group as string | undefined;
    const filterApiId = query.apiId as string | undefined;

    // Verify integration exists and is active
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM integrations WHERE id = ? AND isActive = 1');
    const integration = stmt.get(integrationId) as any;

    if (!integration) {
      throw createError({
        statusCode: 404,
        message: 'Integration not found or inactive',
      });
    }

    // Check CORS: Validate Origin header
    const origin = getRequestHeader(event, 'origin') || getRequestHeader(event, 'referer');

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
        }

        if (!isAllowed) {
          throw createError({
            statusCode: 403,
            message: 'Origin not allowed by CORS policy',
          });
        }
      }
    }

    // Create a new session for this integration
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO sessions (id, integrationId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `);

    insertStmt.run(sessionId, integrationId, now, now);

    // Get all APIs for this project to set default active responses
    const apisPath = resolve(process.cwd(), 'data/apis.json');
    const apisData = await readFile(apisPath, 'utf-8');
    const allApis = JSON.parse(apisData);
    let projectApis = allApis.filter((api: any) => api.projectId === integration.projectId && api.enabled);

    // Set the first response status as active for each API in this session
    const insertSessionResponseStmt = db.prepare(`
      INSERT INTO session_responses (id, sessionId, apiId, responseStatusCode, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const api of projectApis) {
      if (api.statusMocks && api.statusMocks.length > 0) {
        // Get the first status mock's status code
        const firstStatusCode = parseInt(api.statusMocks[0].statusCode, 10);
        const responseId = `sr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        insertSessionResponseStmt.run(responseId, sessionId, api.id, firstStatusCode, now, now);
      }
    }

    // Apply filters if provided
    if (filterGroup) {
      projectApis = projectApis.filter((api: any) => api.group === filterGroup);
    }
    if (filterApiId) {
      projectApis = projectApis.filter((api: any) => api.id === filterApiId);
    }

    // Get project data for auth configuration
    const projectsPath = resolve(process.cwd(), 'data/projects.json');
    const projectsData = await readFile(projectsPath, 'utf-8');
    const allProjects = JSON.parse(projectsData);
    const project = allProjects.find((p: any) => p.id === integration.projectId);

    // Get font and heading settings
    const primaryFontName = integration.primaryFont || 'Poppins';
    const codeFontName = integration.codeFont || 'Google Sans Code';
    const heading = integration.heading || '';
    const allowPostmanDownload = integration.allowPostmanDownload || false;
    const expandToFullPage = integration.expandToFullPage || false;
    const displayEntities = integration.displayEntities || false;
    const theme = integration.theme || 'dark';

    // Get objects/entities if displayEntities is true
    let entityList: any[] = [];
    if (displayEntities) {
      const objectsPath = resolve(process.cwd(), 'data/objects.json');
      const objectsData = await readFile(objectsPath, 'utf-8');
      const allObjects = JSON.parse(objectsData);

      // Filter objects that belong to this project and are entities
      entityList = allObjects
        .filter((obj: any) => obj.projectId === integration.projectId && obj.isEntity === true)
        .map((obj: any) => ({
          id: obj.id,
          name: obj.name,
          description: obj.description || '',
          fields: obj.fields || [],
        }));
    }

    // Load Google fonts data
    const googleFontsPath = resolve(process.cwd(), 'public/fonts/google.json');
    const googleFontsData = await readFile(googleFontsPath, 'utf-8');
    const googleFonts = JSON.parse(googleFontsData);

    // Get font details from google.json
    const primaryFontData = googleFonts.find((f: any) => f.family === primaryFontName);
    const codeFontData = googleFonts.find((f: any) => f.family === codeFontName);

    // Build Google Fonts URL (always use normal/400 weight)
    const primaryFont = primaryFontData?.family || 'Poppins';
    const codeFont = codeFontData?.family || 'Google Sans Code';

    // Build API list for the SDK
    const apiList = projectApis.map((api: any) => ({
      id: api.id,
      name: api.name || '',
      method: api.method,
      endpoint: api.endpoint,
      description: api.description || '',
      group: api.group || '-', // Use '-' for unnamed groups, previously 'Ungrouped'
      isAuth: api.isAuth || false,
      authType: project?.authType || 'bearer-token',
      authConfig: project?.authConfig || {},
      headerParams: api.headerParams || [],
      queryParams: api.queryParams || [],
      bodyParams: api.bodyParams || [],
      statusMocks: api.statusMocks
        ?.map((sm: any) => ({
          statusCode: sm.statusCode,
          name: sm.name || `${sm.statusCode} Response`,
          headerParams: sm.headerParams || [],
          queryParams: sm.queryParams || [],
          bodyParams: sm.bodyParams || [],
          responseValue: sm.responseValue,
        })) || [],
    }));

    // Generate SDK JavaScript
    const sdkScript = `
(function() {
  const integrationId = '${integrationId}';
  const sessionId = '${sessionId}';
  const baseUrl = '${baseUrl}';
  const apiEndpoint = baseUrl + '/api/integrations/' + integrationId + '/' + sessionId;
  const projectId = '${integration.projectId}';

  // SDK Configuration
  const primaryFont = '${primaryFont}';
  const codeFont = '${codeFont}';
  const heading = '${heading}';
  const allowPostmanDownload = ${allowPostmanDownload};
  const expandToFullPage = ${expandToFullPage};
  const displayEntities = ${displayEntities};
  const theme = '${theme}';

  // Theme colors
  const themeColors = {
    dark: {
      bg: '#1a1d2e',
      bgSecondary: '#242736',
      bgTertiary: '#2d3142',
      border: '#4a5568',
      text: '#e5e7eb',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
    },
    light: {
      bg: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#f3f4f6',
      border: '#e5e7eb',
      text: '#111827',
      textSecondary: '#4b5563',
      textMuted: '#9ca3af',
    }
  };

  const colors = themeColors[theme] || themeColors.dark;

  // Available APIs
  const apis = ${JSON.stringify(apiList, null, 2)};

  // Available Entities (if displayEntities is enabled)
  const entities = ${JSON.stringify(entityList, null, 2)};

  // Load Google Fonts (always use normal/400 weight)
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + (primaryFont.replace(/ /g, '+')) + ':wght@400&family=' + (codeFont.replace(/ /g, '+')) + ':wght@400&display=swap';
    document.head.appendChild(link);
  }

  // Add SEO meta tags when expandToFullPage is enabled
  if (expandToFullPage) {
    // Build dynamic description from APIs
    const apiMethods = [...new Set(apis.map(api => api.method))].join(', ');
    const apiGroups = [...new Set(apis.map(api => api.group).filter(Boolean))].join(', ');
    const apiCount = apis.length;

    const seoTitle = heading ? heading + ' - API Documentation' : 'API Documentation';
    const seoDescription = 'Interactive API documentation with ' + apiCount + ' endpoint' + (apiCount !== 1 ? 's' : '') + '. ' +
      (apiGroups ? 'Categories: ' + apiGroups + '. ' : '') +
      'Supports ' + apiMethods + ' methods. Test APIs directly in your browser with live request/response examples.';
    const seoKeywords = [
      'API documentation',
      'REST API',
      'API reference',
      'developer docs',
      apiMethods.split(', ').map(m => m + ' API').join(', '),
      apiGroups
    ].filter(Boolean).join(', ');

    // Set document title
    document.title = seoTitle;

    // Helper function to set or create meta tag
    const setMetaTag = (name, content, isProperty) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector('meta[' + attr + '="' + name + '"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Standard meta tags
    setMetaTag('description', seoDescription, false);
    setMetaTag('keywords', seoKeywords, false);
    setMetaTag('author', 'API Documentation', false);
    setMetaTag('robots', 'index, follow', false);

    // Open Graph meta tags
    setMetaTag('og:title', seoTitle, true);
    setMetaTag('og:description', seoDescription, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', window.location.href, true);

    // Twitter Card meta tags
    setMetaTag('twitter:card', 'summary', false);
    setMetaTag('twitter:title', seoTitle, false);
    setMetaTag('twitter:description', seoDescription, false);

    // Add structured data for API documentation (JSON-LD)
    const existingJsonLd = document.querySelector('script[type="application/ld+json"]');
    if (!existingJsonLd) {
      const jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      jsonLd.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'headline': seoTitle,
        'description': seoDescription,
        'articleSection': 'API Documentation',
        'keywords': seoKeywords,
        'mainEntity': {
          '@type': 'SoftwareApplication',
          'applicationCategory': 'DeveloperApplication',
          'name': heading || 'API',
          'description': 'RESTful API with ' + apiCount + ' endpoints'
        }
      });
      document.head.appendChild(jsonLd);
    }
  }

  // Find target container or create SDK UI
  const targetContainer = document.getElementById('api-playground');
  const sdkContainer = document.createElement('div');
  sdkContainer.id = 'mock-server-sdk';

  if (expandToFullPage) {
    // Render inside target container or full page
    sdkContainer.style.cssText = \`
      position: fixed;
      top: 0px;
      left: 0px;
      width: 100vw;
      height: 100vh;
      background: \${colors.bg};
      border: 1px solid \${colors.border};
      border-radius: !expandToFullPage ? '12px' : '0';
      font-family: '\${primaryFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    \`;
  } else {
    // Fallback to fixed positioning
    sdkContainer.style.cssText = \`
      height: 100%;
      width: 100%;
      background: \${colors.bg};
      border: 1px solid \${colors.border};
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      z-index: 999999;
      font-family: '\${primaryFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    \`;
  }

  // Header
  const header = document.createElement('div');
  header.style.cssText = \`
    background: \${colors.bgSecondary};
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    \${expandToFullPage ? 'position: sticky; top: 0; z-index: 100;' : ''}
  \`;

  // Header left section (heading)
  const headerLeft = document.createElement('div');
  headerLeft.style.cssText = 'color: ' + colors.text + '; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;';

  // Mobile menu toggle button (only shown when expandToFullPage is enabled and screen < 600px)
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.id = 'sdk-mobile-menu-btn';
  mobileMenuBtn.style.cssText = \`
    display: none;
    background: none;
    border: none;
    color: \${colors.text};
    cursor: pointer;
    padding: 4px;
    margin-right: 4px;
    border-radius: 4px;
    transition: background 0.2s;
  \`;
  mobileMenuBtn.innerHTML = \`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  \`;
  mobileMenuBtn.onmouseover = () => mobileMenuBtn.style.background = colors.bgTertiary;
  mobileMenuBtn.onmouseout = () => mobileMenuBtn.style.background = 'none';
  headerLeft.appendChild(mobileMenuBtn);

  // Icon and heading text
  const headerIcon = document.createElement('span');
  headerIcon.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2M7 7h10M7 12h10M7 17h6"/></svg>\`;
  headerIcon.style.cssText = 'display: flex; align-items: center;';
  headerLeft.appendChild(headerIcon);

  const headerTitle = document.createElement('span');
  headerTitle.id = 'sdk-header-title';
  headerTitle.textContent = heading;
  headerLeft.appendChild(headerTitle);

  // Header right section (search + download + close)
  const headerRight = document.createElement('div');
  headerRight.style.cssText = 'display: flex; align-items: center; gap: 8px;';

  // Search button
  const searchBtn = document.createElement('button');
  searchBtn.id = 'sdk-search-btn';
  searchBtn.style.cssText = \`
    background: \${colors.bgTertiary};
    border: 1px solid \${colors.border};
    color: \${colors.textSecondary};
    cursor: pointer;
    font-size: 12px;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 6px;
    transition: all 0.2s;
    min-width: 180px;
  \`;
  searchBtn.innerHTML = \`
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
    <span style="flex: 1; text-align: left;">Search APIs...</span>
    <span style="font-size: 10px; color: \${colors.textMuted}; background: \${colors.bg}; padding: 2px 6px; border-radius: 4px;">⌘K</span>
  \`;
  searchBtn.onmouseover = () => {
    searchBtn.style.borderColor = '#6366f1';
    searchBtn.style.color = colors.text;
  };
  searchBtn.onmouseout = () => {
    searchBtn.style.borderColor = colors.border;
    searchBtn.style.color = colors.textSecondary;
  };
  headerRight.appendChild(searchBtn);

  // Postman download button (if enabled)
  if (allowPostmanDownload) {
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'sdk-download-postman';
    downloadBtn.style.cssText = \`
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      font-size: 14px;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      gap: 4px;
      border-radius: 4px;
      transition: background 0.2s;
    \`;
    downloadBtn.innerHTML = \`
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
      </svg>
      <span style="font-size: 12px;">Postman</span>
    \`;
    downloadBtn.onmouseover = () => downloadBtn.style.background = '#2d3142';
    downloadBtn.onmouseout = () => downloadBtn.style.background = 'none';
    headerRight.appendChild(downloadBtn);
  }

  header.appendChild(headerLeft);
  header.appendChild(headerRight);

  // Search Modal
  const searchModal = document.createElement('div');
  searchModal.id = 'sdk-search-modal';
  searchModal.style.cssText = \`
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 999999;
    align-items: flex-start;
    justify-content: center;
    padding-top: 100px;
    padding-left: 16px;
    padding-right: 16px;
  \`;

  const searchModalContent = document.createElement('div');
  searchModalContent.id = 'sdk-search-modal-content';
  searchModalContent.style.cssText = \`
    background: \${colors.bgSecondary};
    border: 1px solid \${colors.border};
    border-radius: 12px;
    width: 100%;
    max-width: 560px;
    max-height: 480px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    font-family: '\${primaryFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  \`;

  // Search input container
  const searchInputContainer = document.createElement('div');
  searchInputContainer.style.cssText = \`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid \${colors.border};
  \`;

  const searchIcon = document.createElement('div');
  searchIcon.innerHTML = \`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="\${colors.textSecondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  \`;
  searchIcon.style.cssText = 'display: flex; align-items: center; flex-shrink: 0;';

  const searchInput = document.createElement('input');
  searchInput.id = 'sdk-search-input';
  searchInput.type = 'text';
  searchInput.placeholder = 'Search APIs by name, endpoint, or method...';
  searchInput.style.cssText = \`
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: \${colors.text};
    font-size: 15px;
    font-family: inherit;
  \`;

  const searchClose = document.createElement('button');
  searchClose.style.cssText = \`
    background: \${colors.bgTertiary};
    border: none;
    color: \${colors.textSecondary};
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-family: inherit;
  \`;
  searchClose.textContent = 'ESC';

  searchInputContainer.appendChild(searchIcon);
  searchInputContainer.appendChild(searchInput);
  searchInputContainer.appendChild(searchClose);

  // Search results container
  const searchResults = document.createElement('div');
  searchResults.id = 'sdk-search-results';
  searchResults.style.cssText = \`
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  \`;

  // Empty state
  const searchEmptyState = document.createElement('div');
  searchEmptyState.id = 'sdk-search-empty';
  searchEmptyState.style.cssText = \`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: \${colors.textSecondary};
  \`;
  searchEmptyState.innerHTML = \`
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin-bottom: 16px;">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
    <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">Search for APIs</div>
    <div style="font-size: 12px; opacity: 0.7;">Type to search by name, endpoint, or HTTP method</div>
  \`;
  searchResults.appendChild(searchEmptyState);

  // No results state
  const searchNoResults = document.createElement('div');
  searchNoResults.id = 'sdk-search-no-results';
  searchNoResults.style.cssText = \`
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: \${colors.textSecondary};
  \`;
  searchNoResults.innerHTML = \`
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin-bottom: 16px;">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="m15 9-6 6"></path>
      <path d="m9 9 6 6"></path>
    </svg>
    <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">No results found</div>
    <div style="font-size: 12px; opacity: 0.7;">Try a different search term</div>
  \`;
  searchResults.appendChild(searchNoResults);

  // Results list container
  const searchResultsList = document.createElement('div');
  searchResultsList.id = 'sdk-search-results-list';
  searchResultsList.style.cssText = 'display: none;';
  searchResults.appendChild(searchResultsList);

  searchModalContent.appendChild(searchInputContainer);
  searchModalContent.appendChild(searchResults);
  searchModal.appendChild(searchModalContent);

  // Search functionality
  let searchTimeout;
  const performSearch = (query) => {
    const normalizedQuery = query.toLowerCase().trim();
    const emptyState = document.getElementById('sdk-search-empty');
    const noResults = document.getElementById('sdk-search-no-results');
    const resultsList = document.getElementById('sdk-search-results-list');

    if (!normalizedQuery) {
      emptyState.style.display = 'flex';
      noResults.style.display = 'none';
      resultsList.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';

    // Filter APIs based on query
    const filteredApis = apis.filter(api => {
      const nameMatch = (api.name || '').toLowerCase().includes(normalizedQuery);
      const endpointMatch = api.endpoint.toLowerCase().includes(normalizedQuery);
      const methodMatch = api.method.toLowerCase().includes(normalizedQuery);
      const groupMatch = (api.group || '').toLowerCase().includes(normalizedQuery);
      const descMatch = (api.description || '').toLowerCase().includes(normalizedQuery);
      return nameMatch || endpointMatch || methodMatch || groupMatch || descMatch;
    });

    if (filteredApis.length === 0) {
      noResults.style.display = 'flex';
      resultsList.style.display = 'none';
      return;
    }

    noResults.style.display = 'none';
    resultsList.style.display = 'block';
    resultsList.innerHTML = '';

    // Group results by group
    const groupedResults = {};
    filteredApis.forEach(api => {
      const group = api.group || '-';
      if (!groupedResults[group]) {
        groupedResults[group] = [];
      }
      groupedResults[group].push(api);
    });

    // Render results
    Object.keys(groupedResults).forEach(groupName => {
      const groupHeader = document.createElement('div');
      groupHeader.style.cssText = \`
        font-size: 10px;
        font-weight: 600;
        color: \${colors.textMuted};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 8px 12px 4px;
        margin-top: 4px;
      \`;
      groupHeader.textContent = groupName;
      resultsList.appendChild(groupHeader);

      groupedResults[groupName].forEach(api => {
        const resultItem = document.createElement('button');
        resultItem.style.cssText = \`
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
          color: \${colors.text};
        \`;

        const methodBadge = document.createElement('span');
        methodBadge.style.cssText = \`
          display: inline-block;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          min-width: 44px;
          text-align: center;
          flex-shrink: 0;
          background: \${api.method === 'GET' ? '#10b981' : api.method === 'POST' ? '#3b82f6' : api.method === 'PUT' ? '#f59e0b' : api.method === 'DELETE' ? '#ef4444' : '#6366f1'};
          color: white;
        \`;
        methodBadge.textContent = api.method;

        const resultInfo = document.createElement('div');
        resultInfo.style.cssText = 'flex: 1; min-width: 0;';

        const resultName = document.createElement('div');
        resultName.style.cssText = \`
          font-size: 13px;
          font-weight: 500;
          color: \${colors.text};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        \`;
        resultName.textContent = api.name || api.endpoint;

        const resultEndpoint = document.createElement('div');
        resultEndpoint.style.cssText = \`
          font-size: 11px;
          color: \${colors.textSecondary};
          font-family: '\${codeFont}', monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        \`;
        resultEndpoint.textContent = api.endpoint;

        resultInfo.appendChild(resultName);
        if (api.name) {
          resultInfo.appendChild(resultEndpoint);
        }

        const arrowIcon = document.createElement('div');
        arrowIcon.innerHTML = \`
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="\${colors.textMuted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        \`;
        arrowIcon.style.cssText = 'display: flex; align-items: center; flex-shrink: 0; opacity: 0; transition: opacity 0.15s;';

        resultItem.appendChild(methodBadge);
        resultItem.appendChild(resultInfo);
        resultItem.appendChild(arrowIcon);

        resultItem.onmouseover = () => {
          resultItem.style.background = colors.bgTertiary;
          arrowIcon.style.opacity = '1';
        };
        resultItem.onmouseout = () => {
          resultItem.style.background = 'transparent';
          arrowIcon.style.opacity = '0';
        };

        resultItem.addEventListener('click', () => {
          // Close modal
          searchModal.style.display = 'none';
          searchInput.value = '';
          performSearch('');

          // Scroll to API card
          const apiCard = document.getElementById('api-card-' + api.id);
          if (apiCard) {
            const scrollContainer = apiCard.closest('[style*="overflow-y: auto"]') || window;
            const cardRect = apiCard.getBoundingClientRect();
            const offset = 20;

            if (scrollContainer === window) {
              window.scrollTo({
                top: window.scrollY + cardRect.top - offset,
                behavior: 'smooth'
              });
            } else {
              const containerRect = scrollContainer.getBoundingClientRect();
              scrollContainer.scrollTo({
                top: scrollContainer.scrollTop + cardRect.top - containerRect.top - offset,
                behavior: 'smooth'
              });
            }

            // Highlight effect
            apiCard.style.border = '2px solid #6366f1';
            apiCard.style.transition = 'border 0.3s';
            setTimeout(() => {
              apiCard.style.border = '';
            }, 2000);
          }
        });

        resultsList.appendChild(resultItem);
      });
    });
  };

  // Event listeners for search
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value);
    }, 150);
  });

  // Open modal
  const openSearchModal = () => {
    searchModal.style.display = 'flex';
    setTimeout(() => searchInput.focus(), 50);
  };

  // Close modal
  const closeSearchModal = () => {
    searchModal.style.display = 'none';
    searchInput.value = '';
    performSearch('');
  };

  searchBtn.addEventListener('click', openSearchModal);
  searchClose.addEventListener('click', closeSearchModal);

  // Close on overlay click
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      closeSearchModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K to open search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (searchModal.style.display === 'none' || searchModal.style.display === '') {
        openSearchModal();
      } else {
        closeSearchModal();
      }
    }
    // Escape to close
    if (e.key === 'Escape' && searchModal.style.display === 'flex') {
      closeSearchModal();
    }
  });

  // Content
  const content = document.createElement('div');
  content.style.cssText = \`
    padding: 16px;
    overflow-y: auto;
    flex: 1;
    color: \${colors.text};
  \`;

  // Base URL info with copy button and collapse toggle
  const baseUrlInfo = document.createElement('div');
  baseUrlInfo.style.cssText = \`
    background: \${colors.bgTertiary};
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 12px;
  \`;

  const baseUrlText = baseUrl + '/api/integrations/${integrationId}/' + sessionId;

  baseUrlInfo.innerHTML = \`
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
      <div style="color: \${colors.textSecondary};">Base URL</div>
      <button id="toggle-base-url" style="background: none; border: none; color: \${colors.textSecondary}; cursor: pointer; padding: 4px; font-size: 14px; display: flex; align-items: center;" title="Toggle Base URL">
        <svg id="toggle-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
        </svg>
      </button>
    </div>
    <div id="base-url-content" style="display: block;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="color: \${colors.text}; font-family: '\${codeFont}', monospace; word-break: break-all; flex: 1;">\${baseUrlText}</div>
        <button id="copy-base-url" style="background: none; border: none; color: \${colors.textSecondary}; cursor: pointer; padding: 4px; font-size: 14px;" title="Copy to clipboard">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 11c0-2.828 0-4.243.879-5.121C7.757 5 9.172 5 12 5h3c2.828 0 4.243 0 5.121.879C21 6.757 21 8.172 21 11v5c0 2.828 0 4.243-.879 5.121C19.243 22 17.828 22 15 22h-3c-2.828 0-4.243 0-5.121-.879C6 20.243 6 18.828 6 16z"/><path d="M6 19a3 3 0 0 1-3-3v-6c0-3.771 0-5.657 1.172-6.828S7.229 2 11 2h4a3 3 0 0 1 3 3"/></g></svg>
        </button>
      </div>
      <div style="color: #fbbf24; margin-top: 8px; font-size: 11px; line-height: 1.4;">
        ⚠️ Sessions are deleted if unused for 1 hour. Refresh the page to get a new session.
      </div>
    </div>
  \`;

  // Add toggle functionality
  setTimeout(() => {
    const toggleBtn = document.getElementById('toggle-base-url');
    const toggleIcon = document.getElementById('toggle-icon');
    const content = document.getElementById('base-url-content');
    let isExpanded = true;

    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      content.style.display = isExpanded ? 'block' : 'none';

      // Update icon (up arrow when expanded, down arrow when collapsed)
      toggleIcon.innerHTML = isExpanded
        ? '<path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>'
        : '<path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>';
    });

    // Copy functionality
    document.getElementById('copy-base-url').addEventListener('click', () => {
      navigator.clipboard.writeText(baseUrlText).then(() => {
        const btn = document.getElementById('copy-base-url');
        btn.style.color = '#10b981';
        setTimeout(() => {
          btn.style.color = '#9ca3af';
        }, 1000);
      });
    });
  }, 100);

  // Helper function to get auth header based on auth type
  function getAuthHeader(authType, authConfig) {
    switch (authType) {
      case 'api-key':
        return {
          key: authConfig.apiKeyHeader || 'X-API-Key',
          type: 'API Key',
          required: true
        };
      case 'bearer-token':
        return {
          key: 'Authorization: Bearer <token>',
          type: 'Bearer Token',
          required: true
        };
      case 'oauth2':
        return {
          key: 'Authorization: Bearer <access_token>',
          type: 'OAuth 2.0',
          required: true
        };
      case 'jwt-bearer':
        return {
          key: 'Authorization: Bearer <jwt_token>',
          type: 'JWT Bearer',
          required: true
        };
      case 'basic-auth':
        return {
          key: 'Authorization: Basic <credentials>',
          type: 'Basic Auth',
          required: true
        };
      case 'digest-auth':
        return {
          key: 'Authorization: Digest <credentials>',
          type: 'Digest Auth',
          required: true
        };
      case 'oauth1':
        return {
          key: 'Authorization: OAuth <oauth_params>',
          type: 'OAuth 1.0',
          required: true
        };
      case 'hawk':
        return {
          key: 'Authorization: Hawk <hawk_params>',
          type: 'Hawk Auth',
          required: true
        };
      case 'aws-signature':
        return {
          key: 'Authorization: AWS4-HMAC-SHA256 <credentials>',
          type: 'AWS Signature',
          required: true
        };
      case 'akamai-edgegrid':
        return {
          key: 'Authorization: EG1-HMAC-SHA256 <edgegrid_params>',
          type: 'Akamai EdgeGrid',
          required: true
        };
      default:
        return null;
    }
  }

  // Helper function to generate code examples
  function generateCode(language, api, statusMock) {
    const fullUrl = baseUrlText + api.endpoint;
    const headers = {};
    const queryParams = {};
    const bodyParams = {};

    // Collect headers
    if (api.isAuth) {
      const authHeader = getAuthHeader(api.authType, api.authConfig);
      if (authHeader && authHeader.key.includes(':')) {
        const [key, value] = authHeader.key.split(':').map(s => s.trim());
        headers[key] = value;
      }
    }
    if (api.headerParams) {
      api.headerParams.forEach(param => {
        headers[param.key] = \`<\${param.key}>\`;
      });
    }
    if (statusMock?.headerParams) {
      statusMock.headerParams.forEach(param => {
        headers[param.key] = \`<\${param.key}>\`;
      });
    }

    // Collect query params
    if (api.queryParams) {
      api.queryParams.forEach(param => {
        queryParams[param.key] = \`<\${param.key}>\`;
      });
    }
    if (statusMock?.queryParams) {
      statusMock.queryParams.forEach(param => {
        queryParams[param.key] = \`<\${param.key}>\`;
      });
    }

    // Collect body params
    if (api.bodyParams) {
      api.bodyParams.forEach(param => {
        bodyParams[param.key] = param.type === 'number' ? 0 : param.type === 'boolean' ? false : \`<\${param.key}>\`;
      });
    }
    if (statusMock?.bodyParams) {
      statusMock.bodyParams.forEach(param => {
        bodyParams[param.key] = param.type === 'number' ? 0 : param.type === 'boolean' ? false : \`<\${param.key}>\`;
      });
    }

    const hasBody = Object.keys(bodyParams).length > 0;
    const hasQuery = Object.keys(queryParams).length > 0;
    const queryString = hasQuery ? '?' + Object.keys(queryParams).map(k => \`\${k}=\${queryParams[k]}\`).join('&') : '';

    switch (language) {
      case 'curl':
        let curlCmd = \`curl -X \${api.method} "\${fullUrl}\${queryString}"\`;
        Object.keys(headers).forEach(key => {
          curlCmd += \` \\\\\n  -H "\${key}: \${headers[key]}"\`;
        });
        if (hasBody && (api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH')) {
          curlCmd += \` \\\\\n  -H "Content-Type: application/json"\`;
          curlCmd += \` \\\\\n  -d '\${JSON.stringify(bodyParams, null, 2)}'\`;
        }
        return curlCmd;

      case 'nodejs':
        let nodeCode = \`// Using axios (npm install axios)\\nimport axios from 'axios';\\n\\n\`;
        nodeCode += \`const response = await axios({\n\`;
        nodeCode += \`  method: '\${api.method.toLowerCase()}',\\n\`;
        nodeCode += \`  url: '\${fullUrl}\${queryString}',\\n\`;
        if (Object.keys(headers).length > 0) {
          nodeCode += \`  headers: \${JSON.stringify(headers, null, 4).split('\\n').map((line, i) => i === 0 ? line : '  ' + line).join('\\n')},\\n\`;
        }
        if (hasBody && (api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH')) {
          nodeCode += \`  data: \${JSON.stringify(bodyParams, null, 4).split('\\n').map((line, i) => i === 0 ? line : '  ' + line).join('\\n')}\\n\`;
        }
        nodeCode += \`});\\n\\nconsole.log(response.data);\`;
        return nodeCode;

      case 'python':
        let pythonCode = \`# Using requests (pip install requests)\\nimport requests\\nimport json\\n\\n\`;
        pythonCode += \`response = requests.\${api.method.toLowerCase()}(\\n\`;
        pythonCode += \`    '\${fullUrl}\${queryString}',\\n\`;
        if (Object.keys(headers).length > 0) {
          pythonCode += \`    headers=\${JSON.stringify(headers, null, 4).replace(/"/g, "'")}\\n\`;
        }
        if (hasBody && (api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH')) {
          pythonCode += \`    ,json=\${JSON.stringify(bodyParams, null, 4).replace(/"/g, "'")}\\n\`;
        }
        pythonCode += \`)\\n\\nprint(response.json())\`;
        return pythonCode;

      case 'java':
        let javaCode = \`// Using OkHttp (implementation 'com.squareup.okhttp3:okhttp:4.12.0')\\nimport okhttp3.*;\\nimport java.io.IOException;\\n\\n\`;
        javaCode += \`OkHttpClient client = new OkHttpClient();\\n\\n\`;
        if (hasBody && (api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH')) {
          javaCode += \`MediaType JSON = MediaType.parse("application/json");\\n\`;
          javaCode += \`RequestBody body = RequestBody.create(JSON, "\${JSON.stringify(bodyParams).replace(/"/g, '\\\\"')}");\\n\\n\`;
        }
        javaCode += \`Request request = new Request.Builder()\\n\`;
        javaCode += \`    .url("\${fullUrl}\${queryString}")\\n\`;
        javaCode += \`    .\${api.method.toLowerCase()}(\${hasBody && (api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH') ? 'body' : ''})\\n\`;
        Object.keys(headers).forEach(key => {
          javaCode += \`    .addHeader("\${key}", "\${headers[key]}")\\n\`;
        });
        javaCode += \`    .build();\\n\\n\`;
        javaCode += \`Response response = client.newCall(request).execute();\`;
        return javaCode;

      case 'net':
        let netCode = \`// Using HttpClient (.NET 6+)\\nusing System.Net.Http;\\nusing System.Text;\\nusing System.Text.Json;\\n\\n\`;
        netCode += \`var client = new HttpClient();\\n\`;
        Object.keys(headers).forEach(key => {
          netCode += \`client.DefaultRequestHeaders.Add("\${key}", "\${headers[key]}");\\n\`;
        });
        netCode += \`\\n\`;
        if (hasBody && (api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH')) {
          netCode += \`var json = JsonSerializer.Serialize(\${JSON.stringify(bodyParams, null, 4)});\\n\`;
          netCode += \`var content = new StringContent(json, Encoding.UTF8, "application/json");\\n\\n\`;
          netCode += \`var response = await client.\${api.method === 'POST' ? 'Post' : api.method === 'PUT' ? 'Put' : 'Patch'}Async("\${fullUrl}\${queryString}", content);\\n\`;
        } else {
          netCode += \`var response = await client.\${api.method === 'GET' ? 'Get' : api.method === 'DELETE' ? 'Delete' : api.method}Async("\${fullUrl}\${queryString}");\\n\`;
        }
        netCode += \`var result = await response.Content.ReadAsStringAsync();\\nConsole.WriteLine(result);\`;
        return netCode;

      case 'php':
        let phpCode = \`<?php\\n// Using Guzzle (composer require guzzlehttp/guzzle)\\nrequire 'vendor/autoload.php';\\nuse GuzzleHttp\\\\Client;\\n\\n\`;
        phpCode += \`$client = new Client();\\n\\n\`;
        phpCode += \`$response = $client->request('\${api.method}', '\${fullUrl}\${queryString}', [\\n\`;
        if (Object.keys(headers).length > 0) {
          phpCode += \`    'headers' => \${JSON.stringify(headers, null, 8).replace(/"/g, "'")}\\n\`;
        }
        if (hasBody && (api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH')) {
          phpCode += \`    ,'json' => \${JSON.stringify(bodyParams, null, 8).replace(/"/g, "'")}\\n\`;
        }
        phpCode += \`]);\\n\\necho $response->getBody();\`;
        return phpCode;

      case 'ruby':
        let rubyCode = \`# Using net/http (standard library)\\nrequire 'net/http'\\nrequire 'uri'\\nrequire 'json'\\n\\n\`;
        rubyCode += \`uri = URI.parse('\${fullUrl}\${queryString}')\\n\`;
        rubyCode += \`http = Net::HTTP.new(uri.host, uri.port)\\n\`;
        rubyCode += \`http.use_ssl = true if uri.scheme == 'https'\\n\\n\`;
        rubyCode += \`request = Net::HTTP::\${api.method.charAt(0) + api.method.slice(1).toLowerCase()}.new(uri)\\n\`;
        Object.keys(headers).forEach(key => {
          rubyCode += \`request["\${key}"] = "\${headers[key]}"\\n\`;
        });
        if (hasBody && (api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH')) {
          rubyCode += \`request.body = \${JSON.stringify(bodyParams, null, 2).replace(/"/g, "'")}\\n\`;
        }
        rubyCode += \`\\nresponse = http.request(request)\\nputs response.body\`;
        return rubyCode;

      case 'go':
        let goCode = \`// Using net/http (standard library)\\npackage main\\n\\nimport (\\n    "bytes"\\n    "fmt"\\n    "io"\\n    "net/http"\\n)\\n\\n\`;
        goCode += \`func main() {\\n\`;
        if (hasBody && (api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH')) {
          goCode += \`    jsonData := []byte(\\\`\${JSON.stringify(bodyParams, null, 8)}\\\`)\\n\`;
          goCode += \`    req, _ := http.NewRequest("\${api.method}", "\${fullUrl}\${queryString}", bytes.NewBuffer(jsonData))\\n\`;
        } else {
          goCode += \`    req, _ := http.NewRequest("\${api.method}", "\${fullUrl}\${queryString}", nil)\\n\`;
        }
        Object.keys(headers).forEach(key => {
          goCode += \`    req.Header.Set("\${key}", "\${headers[key]}")\\n\`;
        });
        if (hasBody) {
          goCode += \`    req.Header.Set("Content-Type", "application/json")\\n\`;
        }
        goCode += \`\\n    client := &http.Client{}\\n\`;
        goCode += \`    resp, _ := client.Do(req)\\n\`;
        goCode += \`    defer resp.Body.Close()\\n\\n\`;
        goCode += \`    body, _ := io.ReadAll(resp.Body)\\n\`;
        goCode += \`    fmt.Println(string(body))\\n}\`;
        return goCode;

      default:
        return '';
    }
  }

  // API list
  const apiListContainer = document.createElement('div');
  apiListContainer.style.cssText = \`
    margin-top: 16px;
  \`;

  // Store for tracking active status codes per API
  // Key: apiId, Value: statusCode that is currently active
  // Initialize with the first status code for each API (server sets this as default)
  const activeStatusStore = {};
  apis.forEach(api => {
    if (api.statusMocks && api.statusMocks.length > 0) {
      activeStatusStore[api.id] = api.statusMocks[0].statusCode;
    }
  });

  // Group APIs by group field
  const groupedApis = {};
  apis.forEach(api => {
    const group = api.group || '-';
    if (!groupedApis[group]) {
      groupedApis[group] = [];
    }
    groupedApis[group].push(api);
  });

  // Render grouped APIs
  Object.keys(groupedApis).forEach(groupName => {
    // Group header
    const groupHeader = document.createElement('div');
    groupHeader.style.cssText = \`
      color: \${colors.text};
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.25px;
      margin-bottom: 12px;
      margin-top: 16px;
    \`;
    groupHeader.textContent = groupName;
    apiListContainer.appendChild(groupHeader);

    groupedApis[groupName].forEach((api, index) => {
    const apiCard = document.createElement('div');
    apiCard.id = 'api-card-' + api.id;
    apiCard.style.cssText = \`
      background: \${colors.bgTertiary};
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      transition: border 0.3s;
    \`;

    // Name (at the top)
    if (api.name) {
      const apiName = document.createElement('div');
      apiName.style.cssText = 'font-size: 14px; font-weight: 600; color: ' + colors.text + '; margin-bottom: 8px;';
      apiName.textContent = api.name;
      apiCard.appendChild(apiName);
    }

    // Description (below name)
    if (api.description) {
      const apiDescription = document.createElement('div');
      apiDescription.style.cssText = 'font-size: 13px; color: ' + colors.textSecondary + '; margin-bottom: 8px; line-height: 1.4;';
      apiDescription.innerHTML = api.description;
      apiCard.appendChild(apiDescription);
    }

    // Method + Endpoint row with framework selector and copy button
    const apiHeader = document.createElement('div');
    apiHeader.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';

    const methodBadge = document.createElement('span');
    methodBadge.style.cssText = \`
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
      background: \${api.method === 'GET' ? '#10b981' : api.method === 'POST' ? '#3b82f6' : api.method === 'PUT' ? '#f59e0b' : api.method === 'DELETE' ? '#ef4444' : '#6366f1'};
      color: white;
    \`;
    methodBadge.textContent = api.method;

    const apiEndpoint = document.createElement('div');
    apiEndpoint.style.cssText = 'font-size: 12px; font-weight: 600; color: ' + colors.textPrimary + '; font-family: \\'' + codeFont + '\\', monospace; flex: 1; word-break: break-all; overflow-wrap: break-word;';
    apiEndpoint.textContent = api.endpoint;

    // Custom Language/Framework dropdown
    const langDropdownContainer = document.createElement('div');
    langDropdownContainer.id = 'lang-dropdown-' + api.id;
    langDropdownContainer.style.cssText = 'position: relative; display: inline-block; flex-shrink: 0;';

    // Hidden input to store selected value
    const languageDropdown = document.createElement('input');
    languageDropdown.type = 'hidden';
    languageDropdown.id = 'lang-selector-' + api.id;
    languageDropdown.value = 'default';

    // Dropdown trigger button
    const langTrigger = document.createElement('button');
    langTrigger.type = 'button';
    langTrigger.style.cssText = \`
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0;
      background: transparent;
      border: none;
      color: \${colors.text};
      font-size: 11px;
      cursor: pointer;
      outline: none;
    \`;

    const langTriggerText = document.createElement('span');
    langTriggerText.textContent = 'Framework';
    langTriggerText.style.cssText = 'color: ' + colors.textSecondary + ';';

    const langTriggerArrow = document.createElement('span');
    langTriggerArrow.innerHTML = \`
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="color: \${colors.textSecondary};">
        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
      </svg>
    \`;
    langTriggerArrow.style.cssText = 'display: flex; align-items: center; transition: transform 0.2s;';

    langTrigger.appendChild(langTriggerText);
    langTrigger.appendChild(langTriggerArrow);

    // Dropdown menu
    const langDropdownMenu = document.createElement('div');
    langDropdownMenu.style.cssText = \`
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      min-width: 120px;
      background: \${colors.bgSecondary};
      border: 1px solid \${colors.border};
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: none;
      overflow: hidden;
    \`;

    const languages = [
      { value: 'default', label: 'Default' },
      { value: 'curl', label: 'CURL' },
      { value: 'nodejs', label: 'Node.js' },
      { value: 'java', label: 'Java' },
      { value: 'net', label: '.NET' },
      { value: 'php', label: 'PHP' },
      { value: 'ruby', label: 'Ruby' },
      { value: 'python', label: 'Python' },
      { value: 'go', label: 'Go' }
    ];

    languages.forEach((lang) => {
      const langOption = document.createElement('div');
      langOption.style.cssText = \`
        padding: 8px 12px;
        font-size: 11px;
        color: \${colors.text};
        cursor: pointer;
        transition: background 0.15s;
      \`;
      langOption.textContent = lang.label;
      langOption.dataset.value = lang.value;

      langOption.addEventListener('mouseenter', () => {
        langOption.style.background = colors.bgTertiary;
      });
      langOption.addEventListener('mouseleave', () => {
        langOption.style.background = 'transparent';
      });

      langOption.addEventListener('click', () => {
        // Update hidden input value
        languageDropdown.value = lang.value;

        // Update trigger text
        if (lang.value === 'default') {
          langTriggerText.textContent = 'Framework';
          langTriggerText.style.color = colors.textSecondary;
        } else {
          langTriggerText.textContent = lang.label;
          langTriggerText.style.color = colors.text;
        }

        // Close dropdown
        langDropdownMenu.style.display = 'none';
        langTriggerArrow.style.transform = 'rotate(0deg)';

        // Dispatch change event for compatibility
        languageDropdown.dispatchEvent(new Event('change'));
      });

      langDropdownMenu.appendChild(langOption);
    });

    // Toggle dropdown on trigger click
    let isLangDropdownOpen = false;
    langTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      isLangDropdownOpen = !isLangDropdownOpen;
      langDropdownMenu.style.display = isLangDropdownOpen ? 'block' : 'none';
      langTriggerArrow.style.transform = isLangDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!langDropdownContainer.contains(e.target)) {
        isLangDropdownOpen = false;
        langDropdownMenu.style.display = 'none';
        langTriggerArrow.style.transform = 'rotate(0deg)';
      }
    });

    langDropdownContainer.appendChild(languageDropdown);
    langDropdownContainer.appendChild(langTrigger);
    langDropdownContainer.appendChild(langDropdownMenu);

    const copyEndpointBtn = document.createElement('button');
    copyEndpointBtn.className = 'copy-endpoint-btn';
    copyEndpointBtn.id = 'copy-btn-' + api.id;
    copyEndpointBtn.style.cssText = \`
      background: none;
      border: none;
      color: \${colors.textSecondary};
      cursor: pointer;
      padding: 4px;
      font-size: 14px;
      flex-shrink: 0;
    \`;
    copyEndpointBtn.innerHTML = \`
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 11c0-2.828 0-4.243.879-5.121C7.757 5 9.172 5 12 5h3c2.828 0 4.243 0 5.121.879C21 6.757 21 8.172 21 11v5c0 2.828 0 4.243-.879 5.121C19.243 22 17.828 22 15 22h-3c-2.828 0-4.243 0-5.121-.879C6 20.243 6 18.828 6 16z"/><path d="M6 19a3 3 0 0 1-3-3v-6c0-3.771 0-5.657 1.172-6.828S7.229 2 11 2h4a3 3 0 0 1 3 3"/></g></svg>
    \`;
    copyEndpointBtn.title = 'Copy endpoint';

    copyEndpointBtn.addEventListener('click', () => {
      const currentLang = languageDropdown.value;
      // Use full URL (baseUrl + endpoint) when copying endpoint
      let textToCopy = baseUrlText + api.endpoint;

      if (currentLang !== 'default') {
        const codeBlock = document.getElementById('code-block-' + api.id);
        if (codeBlock) {
          textToCopy = codeBlock.textContent;
        }
      }

      navigator.clipboard.writeText(textToCopy).then(() => {
        copyEndpointBtn.style.color = '#10b981';
        setTimeout(() => {
          copyEndpointBtn.style.color = '#9ca3af';
        }, 1000);
      });
    });

    apiHeader.appendChild(methodBadge);
    apiHeader.appendChild(apiEndpoint);
    apiHeader.appendChild(langDropdownContainer);
    apiHeader.appendChild(copyEndpointBtn);
    apiCard.appendChild(apiHeader);

    // Code view container (initially hidden)
    const codeViewContainer = document.createElement('div');
    codeViewContainer.id = 'code-view-' + api.id;
    codeViewContainer.style.cssText = 'display: none; margin-top: 8px;';

    const codeBlock = document.createElement('pre');
    codeBlock.id = 'code-block-' + api.id;
    codeBlock.style.cssText = \`
      font-size: 12px;
      color: \${colors.text};
      background: \${colors.bg};
      padding: 12px;
      border-radius: 6px;
      border: 1px solid \${colors.border};
      overflow-x: auto;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: '\${codeFont}', monospace;
      line-height: 1.5;
    \`;

    codeViewContainer.appendChild(codeBlock);
    apiCard.appendChild(codeViewContainer);

    // Default view container
    const defaultViewContainer = document.createElement('div');
    defaultViewContainer.id = 'default-view-' + api.id;

    // Add status mock selector and details
    if (api.statusMocks && api.statusMocks.length > 0) {
      // Status label
      const statusLabel = document.createElement('div');
      statusLabel.style.cssText = 'font-size: 12px; color: ' + colors.textSecondary + '; font-weight: 600; margin-top: 8px; margin-bottom: 4px;';
      statusLabel.textContent = 'Status';
      defaultViewContainer.appendChild(statusLabel);

      // Container for dropdown and Set Active button
      const statusRow = document.createElement('div');
      statusRow.style.cssText = 'display: flex; align-items: center; gap: 8px;';

      // Custom dropdown implementation
      const customDropdown = document.createElement('div');
      customDropdown.id = 'status-dropdown-' + api.id;
      customDropdown.style.cssText = 'position: relative; display: inline-block;';

      // Hidden input to store selected value (for compatibility with existing code)
      const statusSelector = document.createElement('input');
      statusSelector.type = 'hidden';
      statusSelector.id = 'status-selector-' + api.id;
      statusSelector.value = '';

      // Dropdown trigger button
      const dropdownTrigger = document.createElement('button');
      dropdownTrigger.type = 'button';
      dropdownTrigger.style.cssText = \`
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0;
        background: transparent;
        border: none;
        color: \${colors.text};
        font-size: 11px;
        cursor: pointer;
        outline: none;
      \`;

      const triggerText = document.createElement('span');
      triggerText.textContent = 'Select Status';
      triggerText.style.cssText = 'color: ' + colors.textSecondary + ';';

      const triggerArrow = document.createElement('span');
      triggerArrow.innerHTML = \`
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="color: \${colors.textSecondary};">
          <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
        </svg>
      \`;
      triggerArrow.style.cssText = 'display: flex; align-items: center; transition: transform 0.2s;';

      dropdownTrigger.appendChild(triggerText);
      dropdownTrigger.appendChild(triggerArrow);

      // Dropdown menu
      const dropdownMenu = document.createElement('div');
      dropdownMenu.style.cssText = \`
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        min-width: 120px;
        background: \${colors.bgSecondary};
        border: 1px solid \${colors.border};
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: none;
        overflow: hidden;
      \`;

      // Sort status mocks and create options
      api.statusMocks.sort((a, b) => parseInt(a.statusCode) - parseInt(b.statusCode));
      api.statusMocks.forEach((sm, index) => {
        const optionItem = document.createElement('div');
        optionItem.style.cssText = \`
          padding: 8px 12px;
          font-size: 11px;
          color: \${colors.text};
          cursor: pointer;
          transition: background 0.15s;
        \`;
        optionItem.textContent = sm.statusCode;
        optionItem.dataset.value = JSON.stringify(sm);

        optionItem.addEventListener('mouseenter', () => {
          optionItem.style.background = colors.bgTertiary;
        });
        optionItem.addEventListener('mouseleave', () => {
          optionItem.style.background = 'transparent';
        });

        optionItem.addEventListener('click', () => {
          // Update hidden input value
          statusSelector.value = JSON.stringify(sm);

          // Update trigger text
          triggerText.textContent = sm.statusCode;
          triggerText.style.color = colors.text;

          // Close dropdown
          dropdownMenu.style.display = 'none';
          triggerArrow.style.transform = 'rotate(0deg)';

          // Dispatch change event for compatibility
          statusSelector.dispatchEvent(new Event('change'));
        });

        dropdownMenu.appendChild(optionItem);
      });

      // Toggle dropdown on trigger click
      let isDropdownOpen = false;
      dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
        dropdownMenu.style.display = isDropdownOpen ? 'block' : 'none';
        triggerArrow.style.transform = isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!customDropdown.contains(e.target)) {
          isDropdownOpen = false;
          dropdownMenu.style.display = 'none';
          triggerArrow.style.transform = 'rotate(0deg)';
        }
      });

      customDropdown.appendChild(statusSelector);
      customDropdown.appendChild(dropdownTrigger);
      customDropdown.appendChild(dropdownMenu);

      // Set Active Button next to dropdown
      const setActiveBtn = document.createElement('button');
      setActiveBtn.id = 'set-active-' + api.id;
      setActiveBtn.style.cssText = \`
        background: none;
        border: none;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 600;
        color: #4571FF;
        transition: color 0.2s;
        white-space: nowrap;
      \`;
      // Helper function to update button state based on store
      const updateButtonState = () => {
        const currentValue = statusSelector.value;
        if (!currentValue) {
          setActiveBtn.textContent = 'Set Active';
          setActiveBtn.style.color = '#4571FF';
          setActiveBtn.style.cursor = 'pointer';
          return;
        }

        const statusMock = JSON.parse(currentValue);
        const activeStatusCode = activeStatusStore[api.id];

        if (activeStatusCode === statusMock.statusCode) {
          setActiveBtn.textContent = 'Active';
          setActiveBtn.style.color = '#86efac';
          setActiveBtn.style.cursor = 'default';
        } else {
          setActiveBtn.textContent = 'Set Active';
          setActiveBtn.style.color = '#4571FF';
          setActiveBtn.style.cursor = 'pointer';
        }
      };

      // Initialize button state based on activeStatusStore
      updateButtonState();

      setActiveBtn.addEventListener('click', async () => {
        const currentValue = statusSelector.value;
        if (!currentValue) {
          return; // No status selected
        }

        const statusMock = JSON.parse(currentValue);

        // Check if already active for this status
        if (activeStatusStore[api.id] === statusMock.statusCode) {
          return; // Already active, do nothing
        }

        try {
          setActiveBtn.textContent = 'Setting...';

          await fetch(baseUrl + '/api/session-responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              apiId: api.id,
              responseStatusCode: parseInt(statusMock.statusCode)
            })
          });

          // Store the active status code for this API
          activeStatusStore[api.id] = statusMock.statusCode;

          setActiveBtn.textContent = 'Active';
          setActiveBtn.style.color = '#86efac';
          setActiveBtn.style.cursor = 'default';

          console.log('Set active response for ' + api.endpoint + ' to ' + statusMock.statusCode);
        } catch (err) {
          console.error('Failed to set active response:', err);
          setActiveBtn.textContent = 'Error - Retry';
          setActiveBtn.style.color = '#ef4444';
          setTimeout(() => {
            updateButtonState();
          }, 2000);
        }
      });

      // Update button state when status changes
      statusSelector.addEventListener('change', () => {
        updateButtonState();
      });

      statusRow.appendChild(customDropdown);
      statusRow.appendChild(setActiveBtn);
      defaultViewContainer.appendChild(statusRow);

      // Details container (shown when status is selected)
      const detailsContainer = document.createElement('div');
      detailsContainer.id = 'details-' + api.id;
      detailsContainer.style.cssText = 'display: none; margin-top: 12px;';

      const handleStatusChange = (e) => {
        const value = e.target.value;
        if (!value) {
          detailsContainer.style.display = 'none';
          return;
        }

        const statusMock = JSON.parse(value);
        detailsContainer.innerHTML = '';
        detailsContainer.style.display = 'block';

        // API-level Headers (combined with status mock headers and auth headers)
        let allHeaders = [...(api.headerParams || []), ...(statusMock.headerParams || [])];

        // Add auth header if isAuth is enabled
        if (api.isAuth) {
          const authHeader = getAuthHeader(api.authType, api.authConfig);
          if (authHeader) {
            allHeaders = [authHeader, ...allHeaders];
          }
        }

        // Remove duplicate headers by key, keeping the last occurrence (API headers take precedence over auth headers)
        const uniqueHeaders = [];
        const seenKeys = new Set();
        for (let i = allHeaders.length - 1; i >= 0; i--) {
          const headerKey = allHeaders[i].key;
          if (!seenKeys.has(headerKey)) {
            seenKeys.add(headerKey);
            uniqueHeaders.unshift(allHeaders[i]);
          }
        }
        allHeaders = uniqueHeaders;

        // Only show Headers section if there are headers
        if (allHeaders.length > 0) {
          const headersSection = createParamsSection('Headers', allHeaders);
          detailsContainer.appendChild(headersSection);
        }

        // API-level Query Params (combined with status mock query params)
        const allQueryParams = [...(api.queryParams || []), ...(statusMock.queryParams || [])];

        // Only show Query Params section if there are query params
        if (allQueryParams.length > 0) {
          const querySection = createParamsSection('Query Params', allQueryParams);
          detailsContainer.appendChild(querySection);
        }

        // API-level Body Params (combined with status mock body params)
        const allBodyParams = [...(api.bodyParams || []), ...(statusMock.bodyParams || [])];

        // Only show Body Params section if there are body params
        if (allBodyParams.length > 0) {
          const bodySection = createParamsSection('Body Params', allBodyParams);
          detailsContainer.appendChild(bodySection);
        }

        // Response Section
        const responseSection = document.createElement('div');
        responseSection.style.cssText = 'margin-top: 8px;';

        const responseTitle = document.createElement('div');
        responseTitle.style.cssText = 'font-size: 12px; color: ' + colors.textSecondary + '; font-weight: 600; margin-bottom: 4px;';
        responseTitle.textContent = 'Response';

        const responseValue = document.createElement('pre');
        responseValue.style.cssText = \`
          font-size: 12px;
          color: \${colors.text};
          background: \${colors.bg};
          padding: 8px;
          border-radius: 6px;
          border: 1px solid \${colors.border};
          overflow-x: auto;
          max-height: 200px;
          overflow-y: auto;
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        \`;

        try {
          const parsed = JSON.parse(statusMock.responseValue);
          responseValue.textContent = JSON.stringify(parsed, null, 2);
        } catch {
          responseValue.textContent = statusMock.responseValue;
        }

        responseSection.appendChild(responseTitle);
        responseSection.appendChild(responseValue);
        detailsContainer.appendChild(responseSection);
      };

      statusSelector.addEventListener('change', handleStatusChange);

      // Auto-select the first status mock if available
      if (api.statusMocks && api.statusMocks.length > 0) {
        const firstMock = api.statusMocks[0];
        statusSelector.value = JSON.stringify(firstMock);
        triggerText.textContent = firstMock.statusCode;
        triggerText.style.color = colors.text;
        statusSelector.dispatchEvent(new Event('change'));
      }

      defaultViewContainer.appendChild(detailsContainer);
    }

    // Append default view to API card
    apiCard.appendChild(defaultViewContainer);

    // Language dropdown change handler
    languageDropdown.addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      const statusSelector = document.getElementById('status-selector-' + api.id);
      let currentStatusMock = null;

      // Get the currently selected status mock if any
      if (statusSelector && statusSelector.value) {
        try {
          currentStatusMock = JSON.parse(statusSelector.value);
        } catch (err) {
          console.error('Failed to parse status mock:', err);
        }
      }

      if (selectedLang === 'default') {
        // Hide code view when default is selected
        codeViewContainer.style.display = 'none';
        copyEndpointBtn.title = 'Copy endpoint';
      } else {
        // Show code view alongside default view (Response section stays visible)
        const code = generateCode(selectedLang, api, currentStatusMock);
        codeBlock.textContent = code;
        codeViewContainer.style.display = 'block';
        copyEndpointBtn.title = 'Copy code';
      }
      // Default view (with Response section) always stays visible
    });

    // Update code when status changes (if in code view)
    if (api.statusMocks && api.statusMocks.length > 0) {
      const statusSelector = document.getElementById('status-selector-' + api.id);
      if (statusSelector) {
        statusSelector.addEventListener('change', () => {
          const selectedLang = languageDropdown.value;
          if (selectedLang !== 'default') {
            let currentStatusMock = null;
            if (statusSelector.value) {
              try {
                currentStatusMock = JSON.parse(statusSelector.value);
              } catch (err) {
                console.error('Failed to parse status mock:', err);
              }
            }
            const code = generateCode(selectedLang, api, currentStatusMock);
            codeBlock.textContent = code;
          }
        });
      }
    }

    apiListContainer.appendChild(apiCard);
    });
  });

  // Helper function to create params section
  function createParamsSection(title, params) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-top: 8px;';

    const sectionTitle = document.createElement('div');
    sectionTitle.style.cssText = 'font-size: 12px; color: ' + colors.textSecondary + '; font-weight: 600; margin-bottom: 4px;';
    sectionTitle.textContent = title;

    const paramsList = document.createElement('div');
    paramsList.style.cssText = \`
      font-size: 12px;
      color: \${colors.text};
      background: \${colors.bg};
      padding: 8px;
      border-radius: 4px;
      border: 1px solid \${colors.border};
    \`;

    params.forEach((param, idx) => {
      const paramItem = document.createElement('div');
      paramItem.style.cssText = 'padding: 4px 0;' + (idx > 0 ? ' border-top: 1px solid #374151;' : '');

      const paramKey = document.createElement('span');
      paramKey.style.cssText = 'color: #93c5fd; font-family: \\'' + codeFont + '\\', monospace;';
      paramKey.textContent = param.key || param;

      const paramType = document.createElement('span');
      paramType.style.cssText = 'color: ' + colors.textSecondary + '; margin-left: 8px;';
      paramType.textContent = param.type ? '(' + param.type + ')' : '';

      const paramRequired = document.createElement('span');
      if (param.required) {
        paramRequired.style.cssText = 'color: #fbbf24; margin-left: 4px; font-size: 9px;';
        paramRequired.textContent = '* required';
      }

      paramItem.appendChild(paramKey);
      if (param.type) paramItem.appendChild(paramType);
      if (param.required) paramItem.appendChild(paramRequired);

      paramsList.appendChild(paramItem);
    });

    section.appendChild(sectionTitle);
    section.appendChild(paramsList);
    return section;
  }

  // Conditionally render layout based on expandToFullPage
  if (expandToFullPage) {
    // Create main content wrapper with flex layout
    const mainWrapper = document.createElement('div');
    mainWrapper.id = 'sdk-main-wrapper';
    mainWrapper.style.cssText = \`
      display: flex;
      height: calc(100vh - 65px);
      position: relative;
    \`;

    // Create sidebar overlay backdrop (for mobile)
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.id = 'sdk-sidebar-overlay';
    sidebarOverlay.style.cssText = \`
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;
    \`;

    // Create sidebar for API endpoints
    const sidebar = document.createElement('div');
    sidebar.id = 'sdk-sidebar';
    sidebar.style.cssText = \`
      width: 280px;
      background: \${colors.bgSecondary};
      overflow-y: auto;
      padding: 16px;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: calc(100vh - 65px);
      transition: transform 0.3s ease;
      z-index: 1000;
    \`;

    // Sidebar header with close button (for mobile)
    const sidebarHeader = document.createElement('div');
    sidebarHeader.style.cssText = \`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    \`;

    const sidebarHeading = document.createElement('div');
    sidebarHeading.style.cssText = \`
      color: \${colors.text};
      font-size: 14px;
      font-weight: 600;
    \`;
    sidebarHeading.textContent = 'API Endpoints';

    // Close button for mobile sidebar
    const sidebarCloseBtn = document.createElement('button');
    sidebarCloseBtn.id = 'sdk-sidebar-close';
    sidebarCloseBtn.style.cssText = \`
      display: none;
      background: none;
      border: none;
      color: \${colors.textSecondary};
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s;
    \`;
    sidebarCloseBtn.innerHTML = \`
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    \`;
    sidebarCloseBtn.onmouseover = () => sidebarCloseBtn.style.background = colors.bgTertiary;
    sidebarCloseBtn.onmouseout = () => sidebarCloseBtn.style.background = 'none';

    sidebarHeader.appendChild(sidebarHeading);
    sidebarHeader.appendChild(sidebarCloseBtn);

    // Create sidebar API list
    const sidebarApiList = document.createElement('div');
    sidebarApiList.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

    // Group APIs by group field for sidebar
    Object.keys(groupedApis).forEach(groupName => {
      // Group header in sidebar
      const sidebarGroupHeader = document.createElement('div');
      sidebarGroupHeader.style.cssText = \`
        color: \${colors.textSecondary};
        font-size: 11px;
        font-weight: 600;
        margin-top: 12px;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      \`;
      sidebarGroupHeader.textContent = groupName;
      sidebarApiList.appendChild(sidebarGroupHeader);

      groupedApis[groupName].forEach(api => {
        const sidebarApiItem = document.createElement('button');
        sidebarApiItem.id = 'sidebar-api-' + api.id;
        sidebarApiItem.style.cssText = \`
          display: flex;
          align-items: center;
          border-radius: 6px;
          padding: 8px 8px 8px 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          color: \${colors.text};
          background: transparent;
          border: none;
        \`;

        const methodBadgeContainer = document.createElement('div');
        methodBadgeContainer.style.cssText = \`
          display: flex;
          align-items: center;
          min-width: 44px;
          margin-right: 6px;
        \`;
        const methodBadge = document.createElement('span');
        methodBadge.style.cssText = \`
          display: inline-block;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          background: \${api.method === 'GET' ? '#10b981' : api.method === 'POST' ? '#3b82f6' : api.method === 'PUT' ? '#f59e0b' : api.method === 'DELETE' ? '#ef4444' : '#6366f1'};
          color: white;
        \`;
        methodBadge.textContent = api.method;
        methodBadgeContainer.appendChild(methodBadge);

        const nameText = document.createElement('span');
        nameText.style.cssText = \`
          font-size: 11.5px;
          font-family: '\${codeFont}', monospace;
          font-weight: 500;
          letter-spacing: -0.25px;
          word-break: break-all;
        \`;
        nameText.textContent = api.name || api.endpoint;

        sidebarApiItem.appendChild(methodBadgeContainer);
        sidebarApiItem.appendChild(nameText);

        sidebarApiItem.addEventListener('click', () => {
          // Remove background from all sidebar API items
          const allSidebarApiItems = document.querySelectorAll('[id^="sidebar-api-"]');
          allSidebarApiItems.forEach(item => {
            item.style.background = 'transparent';
          });

          // Set background on the clicked item
          sidebarApiItem.style.background = colors.bgTertiary;

          const apiCard = document.getElementById('api-card-' + api.id);
          if (apiCard) {
            // Scroll with 20px offset from top
            const scrollContainer = apiCard.closest('[style*="overflow-y: auto"]') || window;
            const cardRect = apiCard.getBoundingClientRect();
            const offset = 20;

            if (scrollContainer === window) {
              window.scrollTo({
                top: window.scrollY + cardRect.top - offset,
                behavior: 'smooth'
              });
            } else {
              const containerRect = scrollContainer.getBoundingClientRect();
              scrollContainer.scrollTo({
                top: scrollContainer.scrollTop + cardRect.top - containerRect.top - offset,
                behavior: 'smooth'
              });
            }

            // Highlight effect
            apiCard.style.border = '2px solid #6366f1';
            setTimeout(() => {
              apiCard.style.border = '';
            }, 1500);
          }
        });

        sidebarApiList.appendChild(sidebarApiItem);
      });
    });

    sidebar.appendChild(sidebarHeader);
    sidebar.appendChild(sidebarApiList);

    // Add Entities section if displayEntities is enabled
    if (displayEntities && entities.length > 0) {
      const entitiesHeading = document.createElement('div');
      entitiesHeading.style.cssText = \`
        color: \${colors.text};
        font-size: 14px;
        font-weight: 600;
        margin-top: 24px;
        margin-bottom: 16px;
      \`;
      entitiesHeading.textContent = 'Models';

      const sidebarEntitiesList = document.createElement('div');
      sidebarEntitiesList.id = 'sdk-sidebar-entities-list';
      sidebarEntitiesList.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

      entities.forEach(entity => {
        const sidebarEntityItem = document.createElement('button');
        sidebarEntityItem.id = 'sidebar-entity-' + entity.id;
        sidebarEntityItem.style.cssText = \`
          background: \${colors.bgTertiary};
          border: 1px solid \${colors.border};
          border-radius: 6px;
          padding: 8px 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          color: \${colors.text};
        \`;

        const entityName = document.createElement('div');
        entityName.style.cssText = \`
          font-size: 12px;
          font-weight: 600;
          word-break: break-all;
        \`;
        entityName.textContent = entity.name;

        sidebarEntityItem.appendChild(entityName);

        sidebarEntityItem.addEventListener('click', () => {
          const entityCard = document.getElementById('entity-card-' + entity.id);
          if (entityCard) {
            // Scroll with 20px offset from top
            const scrollContainer = entityCard.closest('[style*="overflow-y: auto"]') || window;
            const cardRect = entityCard.getBoundingClientRect();
            const offset = 20;

            if (scrollContainer === window) {
              window.scrollTo({
                top: window.scrollY + cardRect.top - offset,
                behavior: 'smooth'
              });
            } else {
              const containerRect = scrollContainer.getBoundingClientRect();
              scrollContainer.scrollTo({
                top: scrollContainer.scrollTop + cardRect.top - containerRect.top - offset,
                behavior: 'smooth'
              });
            }

            // Highlight effect
            entityCard.style.border = '2px solid #6366f1';
            setTimeout(() => {
              entityCard.style.border = '';
            }, 1500);
          }
        });

        sidebarEntityItem.addEventListener('mouseenter', () => {
          sidebarEntityItem.style.background = colors.bg;
          sidebarEntityItem.style.borderColor = '#6366f1';
        });

        sidebarEntityItem.addEventListener('mouseleave', () => {
          sidebarEntityItem.style.background = colors.bgTertiary;
          sidebarEntityItem.style.borderColor = colors.border;
        });

        sidebarEntitiesList.appendChild(sidebarEntityItem);
      });

      sidebar.appendChild(entitiesHeading);
      sidebar.appendChild(sidebarEntitiesList);
    }

    // Modify content styling for expandToFullPage
    content.style.cssText = \`
      padding: 36px;
      overflow-y: auto;
      flex: 1;
      color: \${colors.text};
      height: 100%;
    \`;

    content.appendChild(baseUrlInfo);
    content.appendChild(apiListContainer);

    // Add entity cards if displayEntities is enabled
    if (displayEntities && entities.length > 0) {
      const entitiesContainer = document.createElement('div');
      entitiesContainer.style.cssText = 'margin-top: 32px;';

      const entitiesTitle = document.createElement('h2');
      entitiesTitle.style.cssText = \`
        color: \${colors.text};
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.25px;
        margin-bottom: 12px;
      \`;
      entitiesTitle.textContent = 'Models';
      entitiesContainer.appendChild(entitiesTitle);

      entities.forEach(entity => {
        const entityCard = document.createElement('div');
        entityCard.id = 'entity-card-' + entity.id;
        entityCard.style.cssText = \`
          background: \${colors.bgTertiary};
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          transition: border 0.3s;
        \`;

        // Entity name
        const entityName = document.createElement('div');
        entityName.style.cssText = \`
          font-size: 15px;
          font-weight: 600;
          color: \${colors.text};
          margin-bottom: 8px;
        \`;
        entityName.textContent = entity.name;
        entityCard.appendChild(entityName);

        // Entity description
        if (entity.description) {
          const entityDescription = document.createElement('div');
          entityDescription.style.cssText = \`
            font-size: 13px;
            color: \${colors.textSecondary};
            margin-bottom: 12px;
            line-height: 1.4;
          \`;
          entityDescription.textContent = entity.description;
          entityCard.appendChild(entityDescription);
        }

        // Entity fields
        if (entity.fields && entity.fields.length > 0) {
          const fieldsTitle = document.createElement('div');
          fieldsTitle.style.cssText = \`
            font-size: 12px;
            color: \${colors.textSecondary};
            font-weight: 600;
            margin-bottom: 8px;
            margin-top: 12px;
          \`;
          fieldsTitle.textContent = 'Fields';
          entityCard.appendChild(fieldsTitle);

          const fieldsList = document.createElement('div');
          fieldsList.style.cssText = \`
            background: \${colors.bg};
            padding: 12px;
            border-radius: 6px;
            border: 1px solid \${colors.border};
          \`;

          entity.fields.forEach((field, idx) => {
            const fieldItem = document.createElement('div');
            fieldItem.style.cssText = 'padding: 6px 0;' + (idx > 0 ? ' border-top: 1px solid #374151;' : '');

            const fieldName = document.createElement('span');
            fieldName.style.cssText = \`
              color: #93c5fd;
              font-family: '\${codeFont}', monospace;
              font-size: 12px;
            \`;
            fieldName.textContent = field.name;

            const fieldType = document.createElement('span');
            fieldType.style.cssText = \`
              color: \${colors.textSecondary};
              margin-left: 8px;
              font-size: 12px;
            \`;
            fieldType.textContent = '(' + field.type + ')';

            fieldItem.appendChild(fieldName);
            fieldItem.appendChild(fieldType);
            fieldsList.appendChild(fieldItem);
          });

          entityCard.appendChild(fieldsList);
        }

        entitiesContainer.appendChild(entityCard);
      });

      content.appendChild(entitiesContainer);
    }

    mainWrapper.appendChild(sidebar);
    mainWrapper.appendChild(content);

    sdkContainer.appendChild(header);
    sdkContainer.appendChild(mainWrapper);

    // Add sidebar overlay to sdkContainer (will be shown on mobile when sidebar is open)
    sdkContainer.appendChild(sidebarOverlay);

    // Mobile responsive handling for sidebar
    let isMobileView = null; // null to force first run
    let isSidebarOpen = false;

    const updateMobileView = () => {
      const isMobile = window.innerWidth < 600;

      if (isMobile !== isMobileView) {
        isMobileView = isMobile;

        const mobileBtn = document.getElementById('sdk-mobile-menu-btn');
        const sidebarEl = document.getElementById('sdk-sidebar');
        const closeBtn = document.getElementById('sdk-sidebar-close');
        const overlay = document.getElementById('sdk-sidebar-overlay');
        const headerTitleEl = document.getElementById('sdk-header-title');
        const searchBtnEl = document.getElementById('sdk-search-btn');

        if (isMobile) {
          // Mobile mode: show hamburger, hide sidebar initially
          if (mobileBtn) mobileBtn.style.display = 'flex';
          if (closeBtn) closeBtn.style.display = 'flex';

          if (sidebarEl) {
            sidebarEl.style.position = 'fixed';
            sidebarEl.style.top = '0';
            sidebarEl.style.left = '0';
            sidebarEl.style.height = '100vh';
            sidebarEl.style.transform = 'translateX(-100%)';
            sidebarEl.style.boxShadow = '4px 0 20px rgba(0, 0, 0, 0.3)';
          }

          // Mobile header adjustments
          if (headerTitleEl) {
            headerTitleEl.style.fontSize = '14px';
          }
          if (searchBtnEl) {
            searchBtnEl.style.minWidth = 'auto';
            searchBtnEl.style.padding = '8px';
            searchBtnEl.innerHTML = \`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            \`;
          }

          // Mobile search modal adjustments
          const searchModalEl = document.getElementById('sdk-search-modal');
          const searchModalContentEl = document.getElementById('sdk-search-modal-content');
          const searchInputEl = document.getElementById('sdk-search-input');
          if (searchModalEl) {
            searchModalEl.style.paddingTop = '60px';
          }
          if (searchModalContentEl) {
            searchModalContentEl.style.maxHeight = '70vh';
            searchModalContentEl.style.fontSize = '13px';
          }
          if (searchInputEl) {
            searchInputEl.style.fontSize = '14px';
          }

          isSidebarOpen = false;
        } else {
          // Desktop mode: hide hamburger, show sidebar
          if (mobileBtn) mobileBtn.style.display = 'none';
          if (closeBtn) closeBtn.style.display = 'none';
          if (overlay) overlay.style.display = 'none';

          if (sidebarEl) {
            sidebarEl.style.position = 'sticky';
            sidebarEl.style.top = '0';
            sidebarEl.style.left = '';
            sidebarEl.style.height = 'calc(100vh - 65px)';
            sidebarEl.style.transform = 'translateX(0)';
            sidebarEl.style.boxShadow = 'none';
          }

          // Desktop header adjustments
          if (headerTitleEl) {
            headerTitleEl.style.fontSize = '16px';
          }
          if (searchBtnEl) {
            searchBtnEl.style.minWidth = '180px';
            searchBtnEl.style.padding = '6px 12px';
            searchBtnEl.innerHTML = \`
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <span style="flex: 1; text-align: left;">Search APIs...</span>
              <span style="font-size: 10px; color: \${colors.textMuted}; background: \${colors.bg}; padding: 2px 6px; border-radius: 4px;">⌘K</span>
            \`;
          }

          // Desktop search modal adjustments
          const searchModalEl = document.getElementById('sdk-search-modal');
          const searchModalContentEl = document.getElementById('sdk-search-modal-content');
          const searchInputEl = document.getElementById('sdk-search-input');
          if (searchModalEl) {
            searchModalEl.style.paddingTop = '100px';
          }
          if (searchModalContentEl) {
            searchModalContentEl.style.maxHeight = '480px';
            searchModalContentEl.style.fontSize = '14px';
          }
          if (searchInputEl) {
            searchInputEl.style.fontSize = '15px';
          }

          isSidebarOpen = false;
        }
      }
    };

    const openSidebar = () => {
      const sidebarEl = document.getElementById('sdk-sidebar');
      const overlay = document.getElementById('sdk-sidebar-overlay');

      if (sidebarEl) {
        sidebarEl.style.transform = 'translateX(0)';
      }
      if (overlay) {
        overlay.style.display = 'block';
      }
      isSidebarOpen = true;
    };

    const closeSidebar = () => {
      const sidebarEl = document.getElementById('sdk-sidebar');
      const overlay = document.getElementById('sdk-sidebar-overlay');

      if (sidebarEl) {
        sidebarEl.style.transform = 'translateX(-100%)';
      }
      if (overlay) {
        overlay.style.display = 'none';
      }
      isSidebarOpen = false;
    };

    // Event listeners for mobile menu
    mobileMenuBtn.addEventListener('click', () => {
      if (isSidebarOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    sidebarCloseBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Close sidebar when clicking on a sidebar item (for mobile UX)
    sidebarApiList.addEventListener('click', (e) => {
      if (isMobileView && e.target.closest('button')) {
        closeSidebar();
      }
    });

    // Close sidebar when clicking on entities list items (for mobile UX)
    const entitiesListEl = document.getElementById('sdk-sidebar-entities-list');
    if (entitiesListEl) {
      entitiesListEl.addEventListener('click', (e) => {
        if (isMobileView && e.target.closest('button')) {
          closeSidebar();
        }
      });
    }

    // Listen for window resize
    window.addEventListener('resize', updateMobileView);

    // Initialize on load - use setTimeout to ensure DOM is fully ready
    setTimeout(updateMobileView, 0);
  } else {
    // Original layout
    content.appendChild(baseUrlInfo);
    content.appendChild(apiListContainer);

    sdkContainer.appendChild(header);
    sdkContainer.appendChild(content);
  }

  if (targetContainer) {
    targetContainer.appendChild(sdkContainer);
  } else if (expandToFullPage) {
    // For full page, add to body and make it fill the viewport
    sdkContainer.style.position = 'fixed';
    sdkContainer.style.top = '0';
    sdkContainer.style.left = '0';
    sdkContainer.style.right = '0';
    sdkContainer.style.bottom = '0';
    sdkContainer.style.margin = '0';
    sdkContainer.style.borderRadius = '0';
    sdkContainer.style.border = 'none';
    document.body.appendChild(sdkContainer);
  } else {
    document.body.appendChild(sdkContainer);
  }

  // Append search modal to body (so it's always on top)
  document.body.appendChild(searchModal);

  // Postman download button
  if (allowPostmanDownload) {
    const downloadPostmanBtn = document.getElementById('sdk-download-postman');
    if (downloadPostmanBtn) {
      downloadPostmanBtn.addEventListener('click', async () => {
        try {
          // Fetch project data
          const projectResponse = await fetch(baseUrl + '/api/projects/' + projectId);
          const project = await projectResponse.json();

          // Fetch all APIs for the project
          const apisResponse = await fetch(baseUrl + '/api/mocks?projectId=' + projectId);
          const allApis = await apisResponse.json();

          // Build Postman collection (similar to pages/index.vue)
          const groups = {};
          allApis.forEach(api => {
            const groupName = api.group || '-';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(api);
          });

          const collectionItems = Object.keys(groups).map(groupName => ({
            name: groupName,
            item: groups[groupName].map(api => {
              const activeStatusMock = api.statusMocks?.find(sm => sm.enabled);

              const headers = [{ key: 'Content-Type', value: 'application/json', type: 'text' }];
              if (activeStatusMock?.headerParams) {
                activeStatusMock.headerParams.forEach(param => {
                  headers.push({ key: param.key, value: param.type === 'number' ? '0' : '', type: 'text' });
                });
              }

              const queryParams = [];
              if (activeStatusMock?.queryParams) {
                activeStatusMock.queryParams.forEach(param => {
                  queryParams.push({ key: param.key, value: param.type === 'number' ? '0' : '' });
                });
              }

              const requestConfig = {
                method: api.method,
                header: headers,
                url: {
                  raw: '{{base_url}}' + api.endpoint,
                  host: ['{{base_url}}'],
                  path: api.endpoint.split('/').filter(Boolean),
                  query: queryParams.length > 0 ? queryParams : undefined
                }
              };

              if (activeStatusMock?.bodyParams && activeStatusMock.bodyParams.length > 0) {
                const bodyObj = {};
                activeStatusMock.bodyParams.forEach(param => {
                  bodyObj[param.key] = param.type === 'number' ? 0 : param.type === 'boolean' ? false : '';
                });
                requestConfig.body = {
                  mode: 'raw',
                  raw: JSON.stringify(bodyObj, null, 2),
                  options: { raw: { language: 'json' } }
                };
              }

              return { name: api.method + ' ' + api.endpoint, request: requestConfig };
            })
          }));

          const collection = {
            info: {
              name: project.name,
              schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
              description: 'API Collection for ' + project.name
            },
            variable: [{ key: 'base_url', value: baseUrl + '/api', type: 'string' }],
            item: collectionItems
          };

          const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = project.name.replace(/\\s+/g, '_') + '_postman_collection.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to download Postman collection:', error);
          alert('Failed to download Postman collection');
        }
      });
    }
  }

  console.log('Mock Server SDK loaded. Session ID:', sessionId);
  console.log('Available APIs:', apis.length);
})();
`;

    // Return JavaScript with proper content type
    setResponseHeader(event, 'Content-Type', 'application/javascript');
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*');
    return sdkScript;
  } catch (error) {
    console.error('Error serving SDK:', error);
    throw createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      message: error instanceof Error ? error.message : 'Failed to serve SDK',
    });
  }
});
