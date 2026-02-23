<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl w-full max-w-5xl border border-gray-700 max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 class="text-lg font-medium text-gray-200">API Playground</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-300 px-1 pt-1 rounded hover:bg-[#353849] transition-colors"
        >
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Request Section -->
      <div class="p-4 border-b border-gray-700">
        <div class="flex gap-2 items-stretch">
          <!-- Method Selector -->
          <Dropdown
            v-model="requestMethod"
            :options="methodOptions"
            placeholder="Method"
            class="min-w-[110px]"
          />

          <!-- URL Input -->
          <input
            v-model="requestUrl"
            type="text"
            placeholder="Enter request URL"
            class="flex-1 px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
          />

          <!-- Send Button -->
          <button
            @click="sendRequest"
            :disabled="loading || !requestUrl"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
          >
            <Icon v-if="loading" name="mdi:loading" class="w-4 h-4 animate-spin" />
            <span>{{ loading ? 'Sending...' : 'Send' }}</span>
          </button>
        </div>
        <p v-if="api?.description" class="text-xs text-gray-400 mt-3 ml-2">
          {{ api.description }}
        </p>
      </div>

      <!-- Tabs Section -->
      <div class="border-b border-gray-700">
        <div class="flex gap-1 px-4">
          <button
            v-for="tab in tabs"
            :key="tab"
            @click="activeTab = tab"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors relative',
              activeTab === tab
                ? 'text-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            ]"
          >
            {{ tab }}
            <div
              v-if="activeTab === tab"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
            ></div>
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <!-- Params Tab -->
        <div v-if="activeTab === 'Params'" class="space-y-2">
          <div v-if="pathParams.length === 0" class="text-gray-400 text-sm text-center py-8">
            No path parameters found in the URL
          </div>
          <div
            v-for="(param, index) in pathParams"
            :key="index"
            class="flex gap-2 items-center"
          >
            <input
              v-model="param.key"
              type="text"
              placeholder="Parameter name"
              disabled
              class="flex-1 px-3 py-2 border border-gray-600 bg-[#1a1d2e] text-gray-400 rounded-lg text-sm placeholder-gray-500 cursor-not-allowed"
            />
            <input
              v-model="param.value"
              type="text"
              placeholder="Value"
              class="flex-1 px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            />
          </div>
        </div>

        <!-- Headers Tab -->
        <div v-if="activeTab === 'Headers'" class="space-y-2">
          <div
            v-for="(header, index) in headers"
            :key="index"
            class="flex gap-2 items-center"
          >
            <input
              v-model="header.key"
              type="text"
              placeholder="Header name"
              class="flex-1 px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            />
            <input
              v-model="header.value"
              type="text"
              placeholder="Value"
              class="flex-1 px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            />
            <button
              @click="removeHeader(index)"
              class="text-gray-400 hover:text-red-400 p-2 rounded hover:bg-[#353849] transition-colors"
            >
              <Icon name="mdi:delete" class="w-4 h-4" />
            </button>
          </div>
          <button
            @click="addHeader"
            class="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
          >
            <Icon name="mdi:plus" class="w-4 h-4" />
            Add Header
          </button>
        </div>

        <!-- Query Tab -->
        <div v-if="activeTab === 'Query'" class="space-y-2">
          <div
            v-for="(param, index) in queryParams"
            :key="index"
            class="flex gap-2 items-center"
          >
            <input
              v-model="param.key"
              type="text"
              placeholder="Parameter name"
              class="flex-1 px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            />
            <input
              v-model="param.value"
              type="text"
              placeholder="Value"
              class="flex-1 px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            />
            <button
              @click="removeQueryParam(index)"
              class="text-gray-400 hover:text-red-400 p-2 rounded hover:bg-[#353849] transition-colors"
            >
              <Icon name="mdi:delete" class="w-4 h-4" />
            </button>
          </div>
          <button
            @click="addQueryParam"
            class="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
          >
            <Icon name="mdi:plus" class="w-4 h-4" />
            Add Query Parameter
          </button>
        </div>

        <!-- Body Tab -->
        <div v-if="activeTab === 'Body'">
          <div class="relative">
            <textarea
              v-model="requestBody"
              placeholder='{"key": "value"}'
              class="w-full h-64 px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500 font-mono"
            ></textarea>
            <button
              type="button"
              @click="beautifyRequestBody"
              class="absolute top-2 right-2 px-1 pt-1 text-indigo-400 hover:text-indigo-300 bg-[#1a1d2e] rounded-lg transition-colors"
              title="Beautify JSON"
            >
              <Icon name="hugeicons:ai-beautify" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Response Section -->
      <div v-if="hasResponse" class="border-t border-gray-700">
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-gray-300">Response</h4>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'px-2 py-1 text-xs font-semibold rounded-full',
                  responseStatus >= 200 && responseStatus < 300
                    ? 'bg-green-900/30 text-green-300'
                    : responseStatus >= 400
                    ? 'bg-red-900/30 text-red-300'
                    : 'bg-yellow-900/30 text-yellow-300'
                ]"
              >
                {{ responseStatus }} {{ responseStatusText }}
              </span>
              <span class="text-xs text-gray-400">{{ responseTime }}ms</span>
            </div>
          </div>
          <div class="bg-[#1a1d2e] rounded-lg p-3 max-h-64 overflow-y-auto border border-gray-600">
            <pre class="text-sm text-gray-300 font-mono whitespace-pre-wrap">{{ formattedResponse }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Components
import Dropdown from '../common/Dropdown.vue';

const props = defineProps<{
  show: boolean;
  api?: {
    endpoint: string;
    method: string;
    projectId?: string;
    description?: string;
    body?: Record<string, any>;
    contentType?: string;
  } | null;
  isAuth?: boolean;
  authHeaders?: Record<string, string>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const toast = useToast();
const tabs = ['Params', 'Headers', 'Query', 'Body'];
const activeTab = ref('Params');

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
];

const requestMethod = ref('GET');
const requestUrl = ref('');
const pathParams = ref<Array<{ key: string; value: string }>>([]);
const headers = ref<Array<{ key: string; value: string }>>([
  { key: 'Content-Type', value: 'application/json' }
]);
const queryParams = ref<Array<{ key: string; value: string }>>([]);
const requestBody = ref('');

const loading = ref(false);
const hasResponse = ref(false);
const responseStatus = ref(0);
const responseStatusText = ref('');
const responseTime = ref(0);
const responseData = ref<any>(null);

const formattedResponse = computed(() => {
  if (!responseData.value) return '';
  try {
    return JSON.stringify(responseData.value, null, 2);
  } catch {
    return responseData.value;
  }
});

const hasPathParams = computed(() => {
  return pathParams.value.length > 0;
});

// Extract path parameters from URL
const extractPathParams = (url: string) => {
  try {
    // Parse URL to separate protocol, host, port, and path
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Match :param pattern only in the path (not in port numbers)
    const matches = path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    if (!matches) {
      pathParams.value = [];
      return;
    }

    const newParams = matches.map(match => {
      const key = match.substring(1); // Remove the : prefix
      // Keep existing value if the param already exists
      const existingParam = pathParams.value.find(p => p.key === key);
      return {
        key,
        value: existingParam?.value || ''
      };
    });

    pathParams.value = newParams;
  } catch (error) {
    // If URL parsing fails, try simple path extraction
    const matches = url.match(/\/(:([a-zA-Z_][a-zA-Z0-9_]*))/g);
    if (!matches) {
      pathParams.value = [];
      return;
    }

    const newParams = matches.map(match => {
      const key = match.substring(2); // Remove /: prefix
      const existingParam = pathParams.value.find(p => p.key === key);
      return {
        key,
        value: existingParam?.value || ''
      };
    });

    pathParams.value = newParams;
  }
};

const addPathParam = () => {
  pathParams.value.push({ key: '', value: '' });
};

const removePathParam = (index: number) => {
  pathParams.value.splice(index, 1);
};

const addHeader = () => {
  headers.value.push({ key: '', value: '' });
};

const removeHeader = (index: number) => {
  headers.value.splice(index, 1);
};

const addQueryParam = () => {
  queryParams.value.push({ key: '', value: '' });
};

const removeQueryParam = (index: number) => {
  queryParams.value.splice(index, 1);
};

const beautifyRequestBody = () => {
  if (!requestBody.value) return;

  try {
    const parsed = JSON.parse(requestBody.value);
    requestBody.value = JSON.stringify(parsed, null, 2);
  } catch (error) {
    toast.error('Invalid JSON format. Please check your JSON syntax.');
  }
};

const sendRequest = async () => {
  loading.value = true;
  hasResponse.value = false;

  const startTime = Date.now();

  try {
    // Replace path parameters in URL
    let url = requestUrl.value;
    pathParams.value.forEach(param => {
      if (param.key && param.value) {
        url = url.replace(`:${param.key}`, param.value);
      }
    });

    // Build URL with query parameters
    const validQueryParams = queryParams.value.filter(p => p.key && p.value);
    if (validQueryParams.length > 0) {
      const queryString = validQueryParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    // Build headers from the UI headers array only
    // This ensures that user modifications (including removals) are respected
    const requestHeaders: Record<string, string> = {};
    headers.value
      .filter(h => h.key && h.value)
      .forEach(h => {
        requestHeaders[h.key] = h.value;
      });

    // Prepare request options
    const options: RequestInit = {
      method: requestMethod.value,
      headers: requestHeaders,
    };

    // Add body for non-GET requests
    if (requestMethod.value !== 'GET' && requestBody.value) {
      options.body = requestBody.value;
    }

    // Send request
    const response = await fetch(url, options);
    const endTime = Date.now();

    responseStatus.value = response.status;
    responseStatusText.value = response.statusText;
    responseTime.value = endTime - startTime;

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      responseData.value = await response.json();
    } else {
      responseData.value = await response.text();
    }

    hasResponse.value = true;
  } catch (error: any) {
    responseStatus.value = 0;
    responseStatusText.value = 'Error';
    responseTime.value = Date.now() - startTime;
    responseData.value = {
      error: error.message || 'Failed to send request'
    };
    hasResponse.value = true;
  } finally {
    loading.value = false;
  }
};

// Initialize with API data when provided
watch(() => props.api, (newApi) => {
  if (newApi) {
    requestMethod.value = newApi.method;
    // Include projectId in the URL path
    if (newApi.projectId) {
      requestUrl.value = window.location.origin + '/api/projects/' + newApi.projectId + newApi.endpoint;
    } else {
      if (newApi.endpoint.startsWith('http')) {
        requestUrl.value = newApi.endpoint;
      } else {
        requestUrl.value = window.location.origin + '/api' + newApi.endpoint;
      }
    }
    // Extract path parameters from the URL
    extractPathParams(requestUrl.value);

    // Initialize request body if provided
    if (newApi.body) {
      requestBody.value = JSON.stringify(newApi.body, null, 2);
    } else {
      requestBody.value = '';
    }
  }
}, { immediate: true });

// Watch for URL changes to update path params
watch(requestUrl, (newUrl) => {
  extractPathParams(newUrl);
});

// Initialize headers with auth headers if isAuth is true
// Only initialize when modal opens (show changes from false to true)
watch(() => props.show, (newShow, oldShow) => {
  if (newShow && !oldShow) {
    // Modal just opened, initialize headers
    // Use the API's configured contentType, or default to application/json
    const contentTypeValue = props.api?.contentType || 'application/json';

    if (props.isAuth && props.authHeaders) {
      const authHeaderEntries = Object.entries(props.authHeaders).map(([key, value]) => ({
        key,
        value
      }));
      headers.value = [
        { key: 'Content-Type', value: contentTypeValue },
        ...authHeaderEntries
      ];
    } else {
      // Reset to default if not auth
      headers.value = [
        { key: 'Content-Type', value: contentTypeValue }
      ];
    }
  }
});

// Reset when modal closes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    hasResponse.value = false;
    responseData.value = null;
  }
});
</script>
