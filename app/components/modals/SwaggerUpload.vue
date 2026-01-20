<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-200">Import Swagger/OpenAPI Specification</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-200">
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Input Mode Selector -->
      <div class="mb-4 flex gap-2 text-sm">
        <button
          @click="inputMode = 'paste'"
          :class="[
            'flex-1 px-3 py-2 rounded-full transition-colors',
            inputMode === 'paste'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#2d3142] text-gray-300 hover:bg-[#353849]'
          ]"
        >
          <Icon name="mdi:content-paste" class="w-4 h-4 inline mr-1" />
          Paste Code
        </button>
        <button
          @click="inputMode = 'url'"
          :class="[
            'flex-1 px-3 py-2 rounded-full transition-colors',
            inputMode === 'url'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#2d3142] text-gray-300 hover:bg-[#353849]'
          ]"
        >
          <Icon name="mdi:link-variant" class="w-4 h-4 inline mr-1" />
          From URL
        </button>
        <button
          @click="inputMode = 'file'"
          :class="[
            'flex-1 px-3 py-2 rounded-full transition-colors',
            inputMode === 'file'
              ? 'bg-indigo-600 text-white'
              : 'bg-[#2d3142] text-gray-300 hover:bg-[#353849]'
          ]"
        >
          <Icon name="mdi:file-upload" class="w-4 h-4 inline mr-1" />
          Upload File
        </button>
      </div>

      <!-- Paste Mode -->
      <div v-if="inputMode === 'paste'" class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Paste Swagger/OpenAPI Specification (JSON or YAML)
        </label>
        <textarea
          v-model="pastedContent"
          placeholder="Paste your Swagger 2.0 or OpenAPI 3.x specification here..."
          class="font-google-sans-code w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
          rows="12"
        ></textarea>
      </div>

      <!-- URL Mode -->
      <div v-if="inputMode === 'url'" class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Swagger/OpenAPI Specification URL
        </label>
        <input
          v-model="specUrl"
          type="url"
          placeholder="https://example.com/swagger.json or https://example.com/openapi.yaml"
          class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
        />
        <p class="text-xs text-gray-400 mt-2">
          <Icon name="mdi:information" class="w-3 h-3 inline" />
          Supports both JSON and YAML formats
        </p>
      </div>

      <!-- File Upload Mode -->
      <div v-if="inputMode === 'file'" class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Upload Swagger/OpenAPI File
        </label>
        <div class="flex items-center gap-2">
          <label class="flex-1 cursor-pointer">
            <div class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-400 rounded-full hover:bg-[#353849] transition-colors text-sm flex items-center gap-2">
              <Icon name="material-symbols:upload" class="w-4 h-4" />
              <span v-if="!uploadedFile">Choose file...</span>
              <span v-else class="text-gray-200">{{ uploadedFile.name }}</span>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".json,.yaml,.yml"
              @change="handleFileChange"
              class="hidden"
            />
          </label>
        </div>
        <p class="text-xs text-gray-400 mt-2">
          <Icon name="mdi:information" class="w-3 h-3 inline" />
          Accepts .json, .yaml, or .yml files
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-4 bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
        <Icon name="mdi:alert-circle" class="w-4 h-4 inline mr-2" />
        {{ error }}
      </div>

      <!-- Success Message -->
      <div v-if="success" class="mb-4 bg-green-900/20 border border-green-800 text-green-300 px-4 py-3 rounded-lg text-sm">
        <Icon name="mdi:check-circle" class="w-4 h-4 inline mr-2" />
        {{ success }}
      </div>

      <!-- Loading State -->
      <div v-if="processing" class="mb-4 bg-blue-900/20 border border-blue-800 text-blue-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
        <Icon name="mdi:loading" class="w-4 h-4 animate-spin" />
        Processing specification... This may take a moment.
      </div>

      <!-- Preview Section -->
      <div v-if="parsedPreview && !processing" class="mb-4 bg-[#1f2230] rounded-lg border border-gray-600 p-4">
        <h4 class="text-sm font-medium text-gray-300 mb-2">Preview</h4>
        <div class="space-y-2 text-xs text-gray-400">
          <div><span class="text-gray-500">Title:</span> {{ parsedPreview.title }}</div>
          <div><span class="text-gray-500">Version:</span> {{ parsedPreview.version }}</div>
          <div><span class="text-gray-500">Format:</span> {{ parsedPreview.format }}</div>
          <div><span class="text-gray-500">Base URL:</span> {{ parsedPreview.baseUrl || 'N/A' }}</div>
          <div><span class="text-gray-500">Endpoints:</span> {{ parsedPreview.endpointCount }}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <button
          v-if="!success"
          @click="handleImport"
          :disabled="processing || loading || !!error"
          class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Icon v-if="processing" name="mdi:loading" class="w-4 h-4 inline animate-spin mr-1" />
          {{ processing ? 'Processing...' : 'Import APIs' }}
        </button>
        <button
          type="button"
          @click="$emit('close')"
          :disabled="processing"
          class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Node modules
import yaml from 'js-yaml';
import { useProjectStore } from '~/stores/project';

const props = defineProps<{
  show: boolean;
  projectId: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  imported: [count: number];
}>();

const inputMode = ref<'paste' | 'url' | 'file'>('paste');
const pastedContent = ref('');
const specUrl = ref('');
const uploadedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const error = ref('');
const success = ref('');
const processing = ref(false);
const parsedPreview = ref<{
  title: string;
  version: string;
  format: string;
  baseUrl: string;
  endpointCount: number;
} | null>(null);

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    uploadedFile.value = file;
    error.value = '';
    parsedPreview.value = null;
  }
};

// Generate a unique GUID token (same as in index.vue)
const generateGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const parseContent = (content: string): any => {
  try {
    // Try parsing as JSON first
    return JSON.parse(content);
  } catch {
    try {
      // If JSON fails, try YAML
      return yaml.load(content);
    } catch (yamlError) {
      throw new Error('Invalid JSON or YAML format. Please check your specification.');
    }
  }
};

const fetchFromUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch specification: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (err: any) {
    throw new Error(`Failed to fetch from URL: ${err.message}`);
  }
};

const getSpecContent = async (): Promise<string> => {
  if (inputMode.value === 'paste') {
    if (!pastedContent.value.trim()) {
      throw new Error('Please paste a specification');
    }
    return pastedContent.value;
  } else if (inputMode.value === 'url') {
    if (!specUrl.value.trim()) {
      throw new Error('Please enter a URL');
    }
    return await fetchFromUrl(specUrl.value);
  } else if (inputMode.value === 'file') {
    if (!uploadedFile.value) {
      throw new Error('Please select a file');
    }
    return await uploadedFile.value.text();
  }
  throw new Error('Invalid input mode');
};

const detectSpecVersion = (spec: any): 'swagger2' | 'openapi3' | 'unknown' => {
  if (spec.swagger && spec.swagger.startsWith('2')) {
    return 'swagger2';
  }
  if (spec.openapi && spec.openapi.startsWith('3')) {
    return 'openapi3';
  }
  return 'unknown';
};

const getBaseUrl = (spec: any, version: 'swagger2' | 'openapi3'): string => {
  if (version === 'swagger2') {
    const scheme = spec.schemes?.[0] || 'https';
    const host = spec.host || '';
    const basePath = spec.basePath || '';
    return host ? `${scheme}://${host}${basePath}` : basePath;
  } else if (version === 'openapi3') {
    return spec.servers?.[0]?.url || '';
  }
  return '';
};

const parseParameters = (params: any[] = [], version: 'swagger2' | 'openapi3'): {
  headerParams: any[];
  queryParams: any[];
  bodyParams: any[];
} => {
  const headerParams: any[] = [];
  const queryParams: any[] = [];
  const bodyParams: any[] = [];

  if (version === 'swagger2') {
    params.forEach(param => {
      const paramObj = {
        key: param.name || '',
        type: mapType(param.type || 'string', param.format),
        required: param.required || false,
      };

      if (param.in === 'header') {
        headerParams.push(paramObj);
      } else if (param.in === 'query') {
        queryParams.push(paramObj);
      } else if (param.in === 'body' && param.schema) {
        // Extract body parameters from schema
        const schemaProps = param.schema.properties || {};
        Object.keys(schemaProps).forEach(key => {
          bodyParams.push({
            key,
            type: mapType(schemaProps[key].type || 'string', schemaProps[key].format),
            required: param.schema.required?.includes(key) || false,
          });
        });
      }
    });
  } else if (version === 'openapi3') {
    params.forEach(param => {
      const schema = param.schema || {};
      const paramObj = {
        key: param.name || '',
        type: mapType(schema.type || 'string', schema.format),
        required: param.required || false,
      };

      if (param.in === 'header') {
        headerParams.push(paramObj);
      } else if (param.in === 'query') {
        queryParams.push(paramObj);
      }
    });
  }

  return { headerParams, queryParams, bodyParams };
};

const parseRequestBody = (requestBody: any): any[] => {
  const bodyParams: any[] = [];

  if (!requestBody) return bodyParams;

  const content = requestBody.content || {};
  const jsonContent = content['application/json'] || content['*/*'] || Object.values(content)[0];

  if (jsonContent?.schema?.properties) {
    const props = jsonContent.schema.properties;
    const required = jsonContent.schema.required || [];

    Object.keys(props).forEach(key => {
      bodyParams.push({
        key,
        type: mapType(props[key].type || 'string', props[key].format),
        required: required.includes(key),
      });
    });
  }

  return bodyParams;
};

const mapType = (type: string, format?: string): 'string' | 'number' | 'boolean' | 'array' | 'object' => {
  if (format === 'int32' || format === 'int64' || format === 'float' || format === 'double') {
    return 'number';
  }

  switch (type) {
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    default:
      return 'string';
  }
};

// Schema resolver to handle $ref references
const resolveRef = (ref: string, spec: any, version: 'swagger2' | 'openapi3'): any => {
  if (!ref || !ref.startsWith('#/')) {
    return null;
  }

  const parts = ref.split('/').slice(1); // Remove the '#' part
  let current = spec;

  for (const part of parts) {
    if (current[part] === undefined) {
      return null;
    }
    current = current[part];
  }

  return current;
};

// Generate mock data from schema with circular reference protection
const generateMockFromSchema = (
  schema: any,
  spec: any,
  version: 'swagger2' | 'openapi3',
  visited: Set<string> = new Set(),
  depth: number = 0
): any => {
  // Prevent infinite recursion
  if (depth > 10) {
    return null;
  }

  if (!schema) {
    return null;
  }

  // Handle $ref
  if (schema.$ref) {
    // Check if we've already visited this ref to prevent circular references
    if (visited.has(schema.$ref)) {
      return null;
    }

    visited.add(schema.$ref);
    const resolved = resolveRef(schema.$ref, spec, version);
    if (resolved) {
      return generateMockFromSchema(resolved, spec, version, visited, depth + 1);
    }
    return null;
  }

  // Handle allOf
  if (schema.allOf) {
    const merged: any = {};
    for (const subSchema of schema.allOf) {
      const mock = generateMockFromSchema(subSchema, spec, version, visited, depth + 1);
      if (mock && typeof mock === 'object') {
        Object.assign(merged, mock);
      }
    }
    return Object.keys(merged).length > 0 ? merged : null;
  }

  // Handle oneOf/anyOf - use first option
  if (schema.oneOf || schema.anyOf) {
    const options = schema.oneOf || schema.anyOf;
    if (options.length > 0) {
      return generateMockFromSchema(options[0], spec, version, visited, depth + 1);
    }
  }

  const type = schema.type;

  // Handle different types
  switch (type) {
    case 'object':
      const obj: any = {};
      const properties = schema.properties || {};

      for (const [key, propSchema] of Object.entries(properties)) {
        const mock = generateMockFromSchema(propSchema as any, spec, version, visited, depth + 1);
        if (mock !== null) {
          obj[key] = mock;
        } else {
          // Fallback to type-based defaults
          obj[key] = getDefaultValue(propSchema as any);
        }
      }

      return Object.keys(obj).length > 0 ? obj : { id: 1 };

    case 'array':
      const items = schema.items;
      if (items) {
        const itemMock = generateMockFromSchema(items, spec, version, visited, depth + 1);
        return itemMock !== null ? [itemMock] : [];
      }
      return [];

    case 'string':
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0];
      }
      if (schema.format === 'date') {
        return '2024-01-01';
      }
      if (schema.format === 'date-time') {
        return '2024-01-01T00:00:00Z';
      }
      if (schema.format === 'email') {
        return 'user@example.com';
      }
      if (schema.format === 'uuid') {
        return '123e4567-e89b-12d3-a456-426614174000';
      }
      if (schema.format === 'uri' || schema.format === 'url') {
        return 'https://example.com';
      }
      return schema.default || 'string';

    case 'integer':
    case 'number':
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0];
      }
      return schema.default !== undefined ? schema.default : 0;

    case 'boolean':
      return schema.default !== undefined ? schema.default : true;

    default:
      // If no type specified but has properties, treat as object
      if (schema.properties) {
        return generateMockFromSchema({ ...schema, type: 'object' }, spec, version, visited, depth);
      }
      return null;
  }
};

// Get default value for a schema
const getDefaultValue = (schema: any): any => {
  if (schema.default !== undefined) {
    return schema.default;
  }

  const type = schema.type;
  switch (type) {
    case 'string':
      return 'string';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return true;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
};

const parseResponses = (
  responses: any = {},
  spec: any,
  version: 'swagger2' | 'openapi3'
): {
  statusCode: number;
  example: any;
  contentType: string;
  isJson: boolean;
}[] => {
  const parsedResponses: {
    statusCode: number;
    example: any;
    contentType: string;
    isJson: boolean;
  }[] = [];

  Object.keys(responses).forEach(statusCode => {
    const status = parseInt(statusCode);
    if (isNaN(status)) return;

    const response = responses[statusCode];
    let example: any = null;
    let contentType = 'application/json';
    let isJson = true;

    // Try to get example from OpenAPI 3
    if (response.content) {
      const contentTypes = Object.keys(response.content);

      // Determine content type (prefer JSON)
      if (contentTypes.includes('application/json')) {
        contentType = 'application/json';
        isJson = true;
      } else if (contentTypes.includes('*/*')) {
        contentType = '*/*';
        isJson = true; // Assume JSON for */*
      } else if (contentTypes.some(ct => ct.startsWith('text/'))) {
        contentType = contentTypes.find(ct => ct.startsWith('text/')) || 'text/plain';
        isJson = false;
      } else {
        contentType = contentTypes[0] || 'application/json';
        isJson = contentType.includes('json');
      }

      const content = response.content[contentType];

      // Priority: explicit example > examples > schema example > generated from schema
      if (content?.example) {
        example = content.example;
      } else if (content?.examples) {
        const firstExample = Object.values(content.examples)[0] as any;
        example = firstExample?.value;
      } else if (content?.schema?.example) {
        example = content.schema.example;
      } else if (content?.schema && isJson) {
        // Generate mock from schema
        example = generateMockFromSchema(content.schema, spec, version);
      }
    }
    // Try Swagger 2 examples and schema
    else if (response.examples) {
      if (response.examples['application/json']) {
        example = response.examples['application/json'];
        contentType = 'application/json';
        isJson = true;
      } else if (response.examples['text/plain']) {
        example = response.examples['text/plain'];
        contentType = 'text/plain';
        isJson = false;
      } else {
        const firstContentType = Object.keys(response.examples)[0];
        example = response.examples[firstContentType!];
        contentType = firstContentType!;
        isJson = firstContentType!.includes('json');
      }
    } else if (response.schema) {
      // Swagger 2.0 schema handling
      if (response.schema.example) {
        example = response.schema.example;
      } else {
        // Generate mock from schema
        example = generateMockFromSchema(response.schema, spec, version);
      }
      contentType = 'application/json';
      isJson = true;
    }

    // If no content/schema/examples but has description, use description as text response
    if (example === null && response.description) {
      example = response.description;
      contentType = 'text/plain';
      isJson = false;
    }

    // Fallback to generic message if nothing worked
    if (example === null) {
      example = { message: `Response for ${statusCode}` };
      contentType = 'application/json';
      isJson = true;
    }

    parsedResponses.push({ statusCode: status, example, contentType, isJson });
  });

  // Ensure we have at least one success response
  if (!parsedResponses.some(r => r.statusCode >= 200 && r.statusCode < 300)) {
    parsedResponses.push({
      statusCode: 200,
      example: { message: 'Success' },
      contentType: 'application/json',
      isJson: true
    });
  }

  return parsedResponses;
};

const convertToApis = (spec: any) => {
  const version = detectSpecVersion(spec);

  if (version === 'unknown') {
    throw new Error('Unsupported specification format. Please provide a valid Swagger 2.0 or OpenAPI 3.x specification.');
  }

  const baseUrl = getBaseUrl(spec, version);
  const paths = spec.paths || {};
  const apis: any[] = [];
  let apiIndex = 0;

  // Generate preview
  parsedPreview.value = {
    title: spec.info?.title || 'Untitled API',
    version: spec.info?.version || '1.0.0',
    format: version === 'swagger2' ? 'Swagger 2.0' : 'OpenAPI 3.x',
    baseUrl,
    endpointCount: Object.keys(paths).reduce((count, path) => {
      return count + Object.keys(paths[path]).filter(m =>
        ['get', 'post', 'put', 'delete', 'patch'].includes(m.toLowerCase())
      ).length;
    }, 0),
  };

  Object.keys(paths).forEach(path => {
    const pathItem = paths[path];
    const methods = ['get', 'post', 'put', 'delete', 'patch'];

    methods.forEach(method => {
      if (!pathItem[method]) return;

      const operation = pathItem[method];
      const methodUpper = method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

      // Parse parameters
      const allParams = [
        ...(pathItem.parameters || []),
        ...(operation.parameters || [])
      ];

      let { headerParams, queryParams, bodyParams } = parseParameters(allParams, version);

      // For OpenAPI 3, also parse requestBody
      if (version === 'openapi3' && operation.requestBody) {
        const reqBodyParams = parseRequestBody(operation.requestBody);
        bodyParams = [...bodyParams, ...reqBodyParams];
      }

      // Check if endpoint requires authentication
      // Check operation-level security first, then fall back to global security
      const operationSecurity = operation.security;
      const globalSecurity = spec.security;
      const requiresAuth = operationSecurity !== undefined
        ? (Array.isArray(operationSecurity) && operationSecurity.length > 0)
        : (Array.isArray(globalSecurity) && globalSecurity.length > 0);

      // Parse responses
      const responses = parseResponses(operation.responses, spec, version);

      // Create status mocks for each response
      const statusMocks = responses.map(resp => {
        // Determine responseObjectId based on content type
        let responseObjectId = 'json-only'; // Default to JSON
        let responseValue = '';

        if (resp.isJson) {
          // JSON response
          responseObjectId = 'json-only';
          if (typeof resp.example === 'string') {
            // If example is already a string, use it as-is
            responseValue = resp.example;
          } else {
            // If example is an object, stringify it
            responseValue = JSON.stringify(resp.example, null, 2);
          }
        } else {
          // Text response
          responseObjectId = 'text-only';
          if (typeof resp.example === 'string') {
            responseValue = resp.example;
          } else {
            // If it's not a string, stringify it but mark as text
            responseValue = JSON.stringify(resp.example, null, 2);
          }
        }

        return {
          statusCode: resp.statusCode,
          headerParams: headerParams.length > 0 ? headerParams : undefined,
          queryParams: queryParams.length > 0 ? queryParams : undefined,
          bodyParams: bodyParams.length > 0 && methodUpper !== 'GET' ? bodyParams : undefined,
          validators: [],
          responseObjectId,
          responseValue,
          enabled: resp.statusCode >= 200 && resp.statusCode < 300, // Enable success responses by default
        };
      });

      // Ensure at least one status mock exists
      if (statusMocks.length === 0) {
        statusMocks.push({
          statusCode: 200,
          headerParams: headerParams.length > 0 ? headerParams : undefined,
          queryParams: queryParams.length > 0 ? queryParams : undefined,
          bodyParams: bodyParams.length > 0 && methodUpper !== 'GET' ? bodyParams : undefined,
          validators: [],
          responseObjectId: 'json-only',
          responseValue: JSON.stringify({ message: 'Success' }, null, 2),
          enabled: true,
        });
      }

      // Convert OpenAPI path parameters {param} to :param format
      const convertedPath = path.replace(/\{([^}]+)\}/g, ':$1');

      // Get group name from tags
      const groupName = operation.tags?.[0] || undefined;

      // Check if group name starts with "admin " (case-insensitive)
      const isAdminEndpoint = groupName ? groupName.toLowerCase().startsWith('admin ') : false;

      const api = {
        projectId: props.projectId,
        endpoint: convertedPath,
        description: operation.summary || operation.description || `${methodUpper} ${path}`,
        method: methodUpper,
        statusMocks,
        errorResponseObjectId: 'text-only',
        errorResponseValue: '',
        enabled: true,
        isAuth: requiresAuth,
        isAdminEndpoint,
        apiIndex: apiIndex++,
        group: groupName,
      };

      apis.push(api);
    });
  });

  return apis;
};

const handleImport = async () => {
  error.value = '';
  success.value = '';
  processing.value = true;

  try {
    // Get content based on input mode
    const content = await getSpecContent();

    // Parse the content
    const spec = parseContent(content);

    // Convert to API mocks
    const apis = convertToApis(spec);

    if (apis.length === 0) {
      throw new Error('No valid endpoints found in the specification');
    }

    // Check if any API requires authentication
    const hasAuthRequirement = apis.some(api => api.isAuth);

    // If any API requires auth, enable project auth and detect auth type
    if (hasAuthRequirement) {
      const projectStore = useProjectStore();
      const currentProject = projectStore.projects.find(p => p.id === props.projectId);

      if (currentProject && !currentProject.isAuth) {
        // Detect auth type from Swagger spec
        const version = detectSpecVersion(spec);
        let detectedAuthType: string = 'bearer-token'; // Default
        let authConfig: any = {};

        // Check security definitions/schemes to determine auth type
        if (version === 'swagger2' && spec.securityDefinitions) {
          const securityDef = Object.values(spec.securityDefinitions)[0] as any;
          if (securityDef) {
            switch (securityDef.type) {
              case 'apiKey':
                detectedAuthType = 'api-key';
                authConfig = {
                  apiKeyHeader: securityDef.name || 'X-API-Key',
                  apiKey: generateGuid()
                };
                break;
              case 'basic':
                detectedAuthType = 'basic-auth';
                authConfig = {
                  basicUsername: generateGuid(),
                  basicPassword: generateGuid()
                };
                break;
              case 'oauth2':
                detectedAuthType = 'oauth2';
                authConfig = {
                  oauth2AccessToken: generateGuid()
                };
                break;
              default:
                detectedAuthType = 'bearer-token';
                authConfig = {
                  bearerToken: generateGuid()
                };
            }
          }
        } else if (version === 'openapi3' && spec.components?.securitySchemes) {
          const securityScheme = Object.values(spec.components.securitySchemes)[0] as any;
          if (securityScheme) {
            switch (securityScheme.type) {
              case 'apiKey':
                detectedAuthType = 'api-key';
                authConfig = {
                  apiKeyHeader: securityScheme.name || 'X-API-Key',
                  apiKey: generateGuid()
                };
                break;
              case 'http':
                if (securityScheme.scheme === 'basic') {
                  detectedAuthType = 'basic-auth';
                  authConfig = {
                    basicUsername: generateGuid(),
                    basicPassword: generateGuid()
                  };
                } else if (securityScheme.scheme === 'bearer') {
                  detectedAuthType = 'bearer-token';
                  authConfig = {
                    bearerToken: generateGuid()
                  };
                }
                break;
              case 'oauth2':
                detectedAuthType = 'oauth2';
                authConfig = {
                  oauth2AccessToken: generateGuid()
                };
                break;
              default:
                detectedAuthType = 'bearer-token';
                authConfig = {
                  bearerToken: generateGuid()
                };
            }
          }
        }

        // Update project to enable auth
        // Extract the token value to also set as accessToken for response token replacement
        const tokenValue = authConfig.bearerToken || authConfig.apiKey || authConfig.oauth2AccessToken || generateGuid();
        await projectStore.updateProject(props.projectId, {
          ...currentProject,
          isAuth: true,
          authType: detectedAuthType as any,
          authConfig: authConfig,
          accessToken: tokenValue
        });
      }
    }

    // First, extract all unique groups from the APIs
    const uniqueGroups = new Set<string>();
    for (const api of apis) {
      if (api.group) {
        uniqueGroups.add(api.group);
      }
    }

    // Get the current project
    const projectStore = useProjectStore();
    const currentProject = projectStore.projects.find(p => p.id === props.projectId);

    if (currentProject && uniqueGroups.size > 0) {
      // Get existing groups
      const existingGroups = currentProject.groups || [];

      // Find groups that need to be created
      const groupsToCreate = Array.from(uniqueGroups).filter(
        group => !existingGroups.includes(group)
      );

      // Create new groups if any
      if (groupsToCreate.length > 0) {
        try {
          await projectStore.updateProject(props.projectId, {
            ...currentProject,
            groups: [...existingGroups, ...groupsToCreate]
          });
        } catch (err) {
          console.error('Failed to create groups:', err);
          // Continue even if group creation fails
        }
      }
    }

    // Now import APIs using the store
    const apiStore = useApiStore();
    let successCount = 0;
    let failCount = 0;

    for (const api of apis) {
      try {
        await apiStore.createApi(api);
        successCount++;
      } catch (err) {
        console.error('Failed to create API:', err);
        failCount++;
      }
    }

    if (successCount > 0) {
      success.value = `Successfully imported ${successCount} API${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`;
      emit('imported', successCount);

      // Close modal after a short delay
      setTimeout(() => {
        emit('close');
      }, 2000);
    } else {
      throw new Error('Failed to import any APIs');
    }

  } catch (err: any) {
    console.error('Import error:', err);
    error.value = err.message || 'Failed to import specification';
  } finally {
    processing.value = false;
  }
};

watch(() => props.show, (newVal) => {
  if (!newVal) {
    // Reset state when modal closes
    inputMode.value = 'paste';
    pastedContent.value = '';
    specUrl.value = '';
    uploadedFile.value = null;
    error.value = '';
    success.value = '';
    processing.value = false;
    parsedPreview.value = null;
  }
});

// Watch input changes to generate preview
watch([pastedContent, specUrl, uploadedFile], async () => {
  if (processing.value) return;

  parsedPreview.value = null;
  error.value = '';

  try {
    const content = await getSpecContent();
    const spec = parseContent(content);
    convertToApis(spec); // This will set the preview
  } catch (err) {
    // Silently fail for preview
  }
}, { deep: true });
</script>
