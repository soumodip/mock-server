<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-3xl border border-gray-700 max-h-[85vh] overflow-hidden flex flex-col">
      <h3 class="text-lg font-medium text-gray-200 mb-4">Download Project</h3>

      <!-- Tab Selector -->
      <div class="mb-4 flex gap-2 text-sm">
        <button
          @click="activeTab = 'share'"
          :class="[
            'flex-1 px-3 py-2 rounded-full transition-colors',
            activeTab === 'share'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#2d3142] text-gray-300 hover:bg-[#353849]'
          ]"
        >
          Download & Share
        </button>
        <button
          @click="activeTab = 'nodejs'"
          :class="[
            'flex-1 px-3 py-2 rounded-full transition-colors',
            activeTab === 'nodejs'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#2d3142] text-gray-300 hover:bg-[#353849]'
          ]"
        >
          Node.js Application
        </button>
      </div>

      <!-- Share Tab -->
      <div v-if="activeTab === 'share'" class="flex-1 flex flex-col items-center justify-center py-8">
        <button
          @click="downloadJSON"
          class="flex flex-row items-center gap-2 px-4 py-2 bg-[#2d3142] hover:bg-[#353849] rounded-xl transition-colors group"
        >
          <Icon name="material-symbols:download" class="w-6 h-6 text-white" />
          <span class="text-lg font-medium text-gray-200">{{projectName}}.json</span>
        </button>
        <p class="mt-6 text-sm text-gray-400 text-center max-w-md">
          This will download a <span class="font-mono text-indigo-400">{{ projectName }}.json</span> file which contains all the data, and can be shared with others for testing. <br/><br/>They can load this project on their machine while creating a new project.
        </p>
      </div>

      <!-- Node.js Application Tab -->
      <div v-if="activeTab === 'nodejs'" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-auto mb-4">
          <div class="relative">
            <pre class="bg-[#1e1e2e] text-gray-300 p-4 rounded-lg overflow-x-auto text-sm font-mono">{{ generatedCode }}</pre>
            <button
              @click="copyToClipboard"
              class="absolute top-2 right-2 px-3 py-1.5 text-white rounded-full text-xs transition-colors flex items-center gap-1.5"
            >
              <Icon :name="copied ? 'material-symbols:check' : 'material-symbols:content-copy'" class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="text-sm text-gray-400 space-y-2 border-t border-gray-700 pt-4">
          <p class="font-medium text-gray-300">Setup Instructions:</p>
          <ol class="list-decimal list-inside space-y-1 text-xs">
            <li>Save the above code as <span class="font-mono text-indigo-400">server.js</span></li>
            <li>Run: <span class="font-mono text-indigo-400">npm install express dotenv</span></li>
            <li>Run: <span class="font-mono text-indigo-400">node server.js</span></li>
            <li>Server will start running at <span class="font-mono text-indigo-400">http://localhost:5001</span></li>
          </ol>
        </div>
      </div>

      <!-- Close Button -->
      <div class="flex justify-end mt-4 pt-4 border-t border-gray-700">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean;
  projectData: {
    project: any;
    apis: any[];
    objects: any[];
  };
}>();

const emit = defineEmits<{
  close: [];
}>();

const activeTab = ref<'share' | 'nodejs'>('share');
const copied = ref(false);

const projectName = computed(() => {
  return props.projectData?.project?.name?.replace(/\s+/g, '_') || 'project';
});

const generatedCode = computed(() => {
  if (!props.projectData) return '';

  const { project, apis, objects } = props.projectData;

  // Filter enabled APIs only
  const enabledApis = apis.filter(api => api.enabled);

  // Helper function to recursively replace object references
  const replaceObjectReferences = (obj: any, objectsMap: Map<string, any>): any => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => replaceObjectReferences(item, objectsMap));
    }

    const result: any = {};
    for (const key in obj) {
      const value = obj[key];

      // Check if value is an object reference pattern
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const objectId = value.slice(2, -2).trim();
        const referencedObject = objectsMap.get(objectId);
        if (referencedObject) {
          result[key] = replaceObjectReferences(referencedObject, objectsMap);
        } else {
          result[key] = value;
        }
      } else {
        result[key] = replaceObjectReferences(value, objectsMap);
      }
    }
    return result;
  };

  // Helper function to check if a key represents an access token
  const isAccessTokenKey = (key: string): boolean => {
    const normalized = key.toLowerCase().replace(/_/g, '');
    return normalized === 'accesstoken' || normalized === 'token';
  };

  // Helper function to replace access_token fields with variable reference
  const replaceAccessTokens = (obj: any, tokenVariable: string): any => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => replaceAccessTokens(item, tokenVariable));
    }

    const result: any = {};
    for (const key in obj) {
      if (isAccessTokenKey(key)) {
        result[key] = `__TOKEN_VAR_${tokenVariable}__`;
      } else {
        result[key] = replaceAccessTokens(obj[key], tokenVariable);
      }
    }
    return result;
  };

  // Determine the token variable name based on auth type
  const getTokenVariable = (): string => {
    if (!project.isAuth) return 'accessToken';

    const authType = project.authType || 'bearer-token';
    switch (authType) {
      case 'api-key':
        return 'apiKey';
      case 'bearer-token':
        return 'bearerToken';
      case 'basic-auth':
        return 'basicPassword'; // Not typically used in responses, but keeping consistent
      case 'oauth2':
        return 'oauth2AccessToken';
      default:
        return 'accessToken';
    }
  };

  const tokenVariable = getTokenVariable();

  // Create objects map for reference resolution
  const objectsMap = new Map();
  objects.forEach(obj => {
    try {
      const parsedValue = JSON.parse(obj.value);
      objectsMap.set(obj.id, parsedValue);
    } catch {
      try {
        const evalValue = eval(`(${obj.value})`);
        objectsMap.set(obj.id, evalValue);
      } catch {
        objectsMap.set(obj.id, obj.value);
      }
    }
  });

  // Helper function to generate route code for a single endpoint with all status mocks
  const generateRouteForApi = (api: any) => {
    const method = api.method.toLowerCase();
    const endpoint = api.endpoint;

    if (!api.statusMocks || api.statusMocks.length === 0) return '';

    // Find the active status mock
    const activeStatusMock = api.statusMocks.find((sm: any) => sm.enabled);
    if (!activeStatusMock) return '';

    // Parse error response
    let errorResponse;
    try {
      errorResponse = JSON.parse(api.errorResponseValue || '{}');
    } catch {
      try {
        errorResponse = eval(`(${api.errorResponseValue})`);
      } catch {
        errorResponse = api.errorResponseValue || "BadRequest";
      }
    }

    // Replace object references in error response
    errorResponse = replaceObjectReferences(errorResponse, objectsMap);

    // Replace access tokens in error response
    if (project.isAuth || project.accessToken) {
      errorResponse = replaceAccessTokens(errorResponse, tokenVariable);
    }

    let errorJSON = JSON.stringify(errorResponse, null, 2);
    // Replace placeholder with variable reference
    errorJSON = errorJSON.replace(new RegExp(`"__TOKEN_VAR_${tokenVariable}__"`, 'g'), tokenVariable);

    // Build validations array for required params
    const validations: string[] = [];

    // Body params validation
    if (activeStatusMock.bodyParams && activeStatusMock.bodyParams.length > 0 && ['post', 'put', 'patch'].includes(method)) {
      const bodyChecks = activeStatusMock.bodyParams
        .filter((p: any) => p.required)
        .map((p: any) => `
    if (!req.body.${p.key}) {
        return res.status(400).json(${errorJSON});
    }`);
      if (bodyChecks.length > 0) {
        validations.push(`    // Body parameter validation${bodyChecks.join('')}`);
      }
    }

    // Query params validation
    if (activeStatusMock.queryParams && activeStatusMock.queryParams.length > 0) {
      const queryChecks = activeStatusMock.queryParams
        .filter((p: any) => p.required)
        .map((p: any) => `
    if (!req.query.${p.key}) {
        return res.status(400).json(${errorJSON});
    }`);
      if (queryChecks.length > 0) {
        validations.push(`    // Query parameter validation${queryChecks.join('')}`);
      }
    }

    // Header params validation
    if (activeStatusMock.headerParams && activeStatusMock.headerParams.length > 0) {
      const headerChecks = activeStatusMock.headerParams
        .filter((p: any) => p.required)
        .map((p: any) => `
    if (!req.get('${p.key}')) {
        return res.status(400).json(${errorJSON});
    }`);
      if (headerChecks.length > 0) {
        validations.push(`    // Header validation${headerChecks.join('')}`);
      }
    }

    const validationCode = validations.join('\n\n');

    // Generate response code for all status mocks
    const statusResponses: string[] = [];

    api.statusMocks.forEach((statusMock: any, index: number) => {
      const statusCode = statusMock.statusCode || 200;
      const isActive = statusMock.enabled;

      // Parse response value
      let responseValue;
      try {
        responseValue = JSON.parse(statusMock.responseValue);
      } catch {
        try {
          responseValue = eval(`(${statusMock.responseValue})`);
        } catch {
          responseValue = statusMock.responseValue;
        }
      }

      // Replace object references
      responseValue = replaceObjectReferences(responseValue, objectsMap);

      // Replace access tokens with placeholder
      if (project.isAuth || project.accessToken) {
        responseValue = replaceAccessTokens(responseValue, tokenVariable);
      }

      let responseJSON = JSON.stringify(responseValue, null, 2);
      // Replace placeholder with variable reference
      responseJSON = responseJSON.replace(new RegExp(`"__TOKEN_VAR_${tokenVariable}__"`, 'g'), tokenVariable);

      // Format response
      const formattedResponse = responseJSON.split('\n').map(line => '        ' + line).join('\n');

      if (isActive) {
        // Active status - uncommented
        statusResponses.push(`    // Status ${statusCode}
    res.status(${statusCode}).json(
${formattedResponse}
    );`);
      } else {
        // Inactive status - commented
        const commentedResponse = formattedResponse.split('\n').map(line => '    //' + line).join('\n');
        statusResponses.push(`    //   Status ${statusCode}
    //   res.status(${statusCode}).json(
${commentedResponse}
    //   );`);
      }
    });

    const authCheck = api.isAuth && project.isAuth
      ? `
    if (!isAuthorized(req, res)) {
        return;
    }
`
      : '';

    return `
// ${api.method} ${endpoint}
app.${method}('/api/projects/${project.id}${endpoint}', (req, res) => {
${authCheck}${validationCode ? validationCode + '\n\n' : ''}${statusResponses.join('\n\n')}

});`;
  };

  // Generate route handlers
  const routeHandlers = enabledApis.map(api => generateRouteForApi(api)).filter(Boolean).join('\n');

  // Generate auth configuration constants and isAuthorized function
  let authConstants = '';
  let isAuthorizedFunction = '';
  const hasAuth = project.isAuth && enabledApis.some(api => api.isAuth);

  if (hasAuth) {
    const authType = project.authType || 'bearer-token';
    const authConfig = project.authConfig || {};

    switch (authType) {
      case 'api-key':
        const headerName = authConfig.apiKeyHeader || 'X-API-Key';
        authConstants = `const apiKey = process.env.API_KEY || '${authConfig.apiKey}';\nconst apiKeyHeader = '${headerName}';`;
        isAuthorizedFunction = `const isAuthorized = (req, res) => {
    const providedApiKey = req.get(apiKeyHeader);
    if (!providedApiKey) {
        res.status(401).json({ "error": "Unauthorized: Missing API key header" });
        return false;
    }
    if (providedApiKey !== apiKey) {
        res.status(401).json({ "error": "Unauthorized: Invalid API key" });
        return false;
    }
    return true;
}`;
        break;

      case 'bearer-token':
        authConstants = `const accessToken = process.env.ACCESS_TOKEN || '${authConfig.bearerToken || project.accessToken}';`;
        isAuthorizedFunction = `const isAuthorized = (req, res) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        res.status(401).json({ "error": "Unauthorized: Missing Authorization header" });
        return false;
    }
    const token = authHeader.replace('Bearer ', '');
    if (token !== accessToken) {
        res.status(401).json({ "error": "Unauthorized: Invalid access token" });
        return false;
    }
    return true;
}`;
        break;

      case 'basic-auth':
        authConstants = `const basicUsername = process.env.BASIC_USERNAME || '${authConfig.basicUsername}';\nconst basicPassword = process.env.BASIC_PASSWORD || '${authConfig.basicPassword}';`;
        isAuthorizedFunction = `const isAuthorized = (req, res) => {
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.status(401).json({ "error": "Unauthorized: Missing or invalid Basic auth header" });
        return false;
    }
    const base64Credentials = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    if (username !== basicUsername || password !== basicPassword) {
        res.status(401).json({ "error": "Unauthorized: Invalid username or password" });
        return false;
    }
    return true;
}`;
        break;

      case 'oauth2':
        authConstants = `const accessToken = process.env.ACCESS_TOKEN || '${authConfig.oauth2AccessToken}';`;
        isAuthorizedFunction = `const isAuthorized = (req, res) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        res.status(401).json({ "error": "Unauthorized: Missing Authorization header" });
        return false;
    }
    const token = authHeader.replace('Bearer ', '');
    if (token !== accessToken) {
        res.status(401).json({ "error": "Unauthorized: Invalid OAuth 2.0 access token" });
        return false;
    }
    return true;
}`;
        break;

      default:
        authConstants = `const accessToken = process.env.ACCESS_TOKEN || '${project.accessToken}';`;
        isAuthorizedFunction = `const isAuthorized = (req, res) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        res.status(401).json({ "error": "Unauthorized: Missing Authorization header" });
        return false;
    }
    const token = authHeader.replace('Bearer ', '');
    if (token !== accessToken) {
        res.status(401).json({ "error": "Unauthorized: Invalid access token" });
        return false;
    }
    return true;
}`;
    }
  }

  return `const express = require('express');
const app = express();

require('dotenv').config();

// Configuration
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 5001;
${authConstants}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});
${hasAuth ? '\n' + isAuthorizedFunction + '\n' : ''}
// API Routes${routeHandlers}

// Start server
app.listen(port, host, () => {
    console.log(\`Server running at http://\${host}:\${port}\`);
    console.log(\`API endpoints available at http://\${host}:\${port}/api/projects/${project.id}\`);
});`;
});

const downloadJSON = () => {
  if (!props.projectData) return;

  const blob = new Blob([JSON.stringify(props.projectData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.value}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    activeTab.value = 'share';
    copied.value = false;
  }
});
</script>
