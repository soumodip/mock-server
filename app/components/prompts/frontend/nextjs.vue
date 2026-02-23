<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium text-gray-200">Next.js Frontend</h2>
      <div class="flex gap-2">
        <button
          v-if="pages.length >= 1 || components.length >= 1"
          @click="downloadZip"
          class="px-4 py-2 bg-[#353849] hover:bg-gray-700 text-white text-sm rounded-full transition-colors flex items-center gap-1.5"
        >
          <Icon name="material-symbols:download" class="w-4 h-4" />
          Download Project Prompt
        </button>
        <button
          @click="openAddComponentModal"
          class="px-4 py-2 text-gray-300 text-sm rounded-full transition-colors flex items-center gap-1.5 border border-gray-600"
        >
          <Icon name="mdi:plus" class="w-4 h-4" />
          Add Component
        </button>
        <button
          @click="openAddPageModal"
          class="px-4 py-2 bg-[#353849] hover:bg-gray-700 text-white text-sm rounded-full transition-colors flex items-center gap-1.5"
        >
          <Icon name="mdi:plus" class="w-4 h-4" />
          Add Page
        </button>
      </div>
    </div>

    <!-- Components List -->
    <div v-if="components.length > 0" class="mb-6">
      <h3 class="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
        <Icon name="mdi:puzzle" class="w-4 h-4" />
        Components ({{ components.length }})
      </h3>
      <div class="space-y-3">
        <div
          v-for="(comp, index) in components"
          :key="'comp-' + index"
          class="bg-[#242736] rounded-xl border border-gray-600 p-4 flex gap-4"
        >
          <!-- Images Preview -->
          <div class="flex-shrink-0 flex gap-1">
            <template v-if="comp.images && comp.images.length > 0">
              <div
                v-for="(img, imgIdx) in comp.images.slice(0, 3)"
                :key="imgIdx"
                class="w-14 h-14 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden relative group"
                :title="img.label || `Image ${imgIdx + 1}`"
              >
                <img
                  v-if="img.image"
                  :src="img.image"
                  :alt="img.label || comp.name"
                  class="w-full h-full object-cover"
                />
                <Icon v-else name="mdi:image-outline" class="w-5 h-5 text-gray-500" />
                <div v-if="img.label" class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-[9px] text-gray-200 text-center py-0.5 truncate px-1">
                  {{ img.label }}
                </div>
              </div>
              <div
                v-if="comp.images.length > 3"
                class="w-14 h-14 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center text-gray-400 text-xs"
              >
                +{{ comp.images.length - 3 }}
              </div>
            </template>
            <div
              v-else
              class="w-14 h-14 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center"
            >
              <Icon name="mdi:puzzle-outline" class="w-5 h-5 text-gray-500" />
            </div>
          </div>

          <!-- Component Info -->
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
              <Icon name="mdi:puzzle" class="w-3.5 h-3.5 text-gray-500" />
              {{ comp.name }}
            </div>
            <div class="text-xs text-gray-400 truncate">
              {{ comp.description && comp.description.length > 70 ? comp.description.substring(0, 70) + '...' : comp.description }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-start">
            <button
              @click="editComponent(index)"
              class="p-2 text-gray-400 hover:text-indigo-400 rounded-full transition-colors"
              title="Edit"
            >
              <Icon name="mdi:pencil" class="w-4 h-4" />
            </button>
            <button
              @click="deleteComponent(index)"
              class="p-2 text-gray-400 hover:text-red-400 rounded-full transition-colors"
              title="Delete"
            >
              <Icon name="mdi:delete" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pages List -->
    <div v-if="pages.length > 0" class="space-y-3 mb-4">
      <h3 v-if="components.length > 0" class="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
        <Icon name="mdi:file-document" class="w-4 h-4" />
        Pages ({{ pages.length }})
      </h3>
      <div
        v-for="(page, index) in pages"
        :key="index"
        class="bg-[#242736] rounded-xl border border-gray-700 p-4 flex gap-4"
      >
        <!-- Images Preview -->
        <div class="flex-shrink-0 flex gap-1">
          <template v-if="page.images && page.images.length > 0">
            <div
              v-for="(img, imgIdx) in page.images.slice(0, 3)"
              :key="imgIdx"
              class="w-16 h-16 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden relative group"
              :title="img.label || `Image ${imgIdx + 1}`"
            >
              <img
                v-if="img.image"
                :src="img.image"
                :alt="img.label || page.route"
                class="w-full h-full object-cover"
              />
              <Icon v-else name="mdi:image-outline" class="w-6 h-6 text-gray-500" />
              <div v-if="img.label" class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-[10px] text-gray-200 text-center py-0.5 truncate px-1">
                {{ img.label }}
              </div>
            </div>
            <div
              v-if="page.images.length > 3"
              class="w-16 h-16 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center text-gray-400 text-sm"
            >
              +{{ page.images.length - 3 }}
            </div>
          </template>
          <div
            v-else
            class="w-16 h-16 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center"
          >
            <Icon name="mdi:image-outline" class="w-6 h-6 text-gray-500" />
          </div>
        </div>

        <!-- Page Info -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-200 mb-1">{{ page.route }}</div>
          <div class="text-xs text-gray-400 truncate">
            {{ page.description && page.description.length > 70 ? page.description.substring(0, 70) + '...' : page.description }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-start">
          <button
            @click="editPage(index)"
            class="p-2 text-gray-400 hover:text-indigo-400 rounded-full transition-colors"
            title="Edit"
          >
            <Icon name="mdi:pencil" class="w-4 h-4" />
          </button>
          <button
            @click="deletePage(index)"
            class="p-2 text-gray-400 hover:text-red-400 rounded-full transition-colors"
            title="Delete"
          >
            <Icon name="mdi:delete" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-[#242736] rounded-xl border border-gray-700 p-12 text-center">
      <Icon name="mdi:file-document-outline" class="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <p class="text-gray-400 text-sm">No pages added yet. Click "Add Page" to get started.</p>
    </div>

    <!-- Screen Modal -->
    <ModalsPromptsScreen
      :show="showPageModal"
      :page="currentPage"
      :apis="filteredApis"
      :available-components="components"
      :is-edit="editingPageIndex !== null"
      @close="closePageModal"
      @save="savePage"
    />

    <!-- Component Modal -->
    <ModalsPromptsComponent
      :show="showComponentModal"
      :component="currentComponent"
      :apis="filteredApis"
      :is-edit="editingComponentIndex !== null"
      @close="closeComponentModal"
      @save="saveComponent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useProjectStore } from '~/stores/project';
import { useApiStore } from '~/stores/api';
import JSZip from 'jszip';
import type { Page, Component } from '~/components/modals/prompts/Screen.vue';

const projectStore = useProjectStore();
const apiStore = useApiStore();
const appConfig = useAppConfig();
const { confirm } = useConfirmDialog();

// Inject scrollToSteps from parent
const scrollToSteps = inject<(() => Promise<void>) | undefined>('scrollToSteps');

const mockServerBaseUri = appConfig.baseUri || `http://localhost:4001`;

const selectedProject = computed(() =>
  projectStore.projects.find(p => p.id === projectStore.selectedProjectId)
);

// Fetch code.md content
const codeMd = ref('');
onMounted(async () => {
  try {
    const response = await fetch('/code/frontend-nextjs.md');
    codeMd.value = await response.text();

    await Promise.all([
      projectStore.fetchProjects(),
      apiStore.fetchApis()
    ]);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

// Pages state
const pages = ref<Page[]>([]);
const showPageModal = ref(false);
const editingPageIndex = ref<number | null>(null);
const currentPage = ref<Page | null>(null);

// Components state
const components = ref<Component[]>([]);
const showComponentModal = ref(false);
const editingComponentIndex = ref<number | null>(null);
const currentComponent = ref<Component | null>(null);

const filteredApis = computed(() => {
  if (!projectStore.selectedProjectId) return [];
  return apiStore.apis.filter(api => api.projectId === projectStore.selectedProjectId && !api.isAdminEndpoint);
});

// Page functions
const openAddPageModal = () => {
  editingPageIndex.value = null;
  currentPage.value = null;
  showPageModal.value = true;
};

const editPage = (index: number) => {
  editingPageIndex.value = index;
  currentPage.value = pages.value[index]!;
  showPageModal.value = true;
};

const closePageModal = () => {
  showPageModal.value = false;
  editingPageIndex.value = null;
  currentPage.value = null;
};

const savePage = (page: Page) => {
  if (editingPageIndex.value !== null) {
    pages.value[editingPageIndex.value] = page;
  } else {
    pages.value.push(page);
  }
  closePageModal();
};

const deletePage = async (index: number) => {
  if (await confirm({ title: 'Delete Page', message: 'Are you sure you want to delete this page?' })) {
    pages.value.splice(index, 1);
  }
};

// Component functions
const openAddComponentModal = () => {
  editingComponentIndex.value = null;
  currentComponent.value = null;
  showComponentModal.value = true;
};

const editComponent = (index: number) => {
  editingComponentIndex.value = index;
  currentComponent.value = components.value[index]!;
  showComponentModal.value = true;
};

const closeComponentModal = () => {
  showComponentModal.value = false;
  editingComponentIndex.value = null;
  currentComponent.value = null;
};

const saveComponent = (component: Component) => {
  if (editingComponentIndex.value !== null) {
    components.value[editingComponentIndex.value] = component;
  } else {
    components.value.push(component);
  }
  closeComponentModal();
};

const deleteComponent = async (index: number) => {
  if (await confirm({ title: 'Delete Component', message: 'Are you sure you want to delete this component?' })) {
    components.value.splice(index, 1);
  }
};

const formatJson = (jsonString: string) => {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch {
    return jsonString;
  }
};

// Smart label generation for images without labels
const getSmartImageLabel = (index: number, total: number, context: 'page' | 'component'): string => {
  const pageLabels = ['Page Overview', 'Mobile View', 'Tablet View', 'Hover State', 'Active State', 'Loading State', 'Empty State', 'Error State'];
  const componentLabels = ['Default State', 'Hover State', 'Active State', 'Disabled State', 'Loading State', 'Mobile View', 'Expanded View', 'Collapsed View'];

  const labels = context === 'page' ? pageLabels : componentLabels;

  if (total === 1) {
    return context === 'page' ? 'Page Design Reference' : 'Component Design Reference';
  }

  return labels[index] || `View ${index + 1}`;
};

// Generate TypeScript interface from API response
const generateApiResponseInterface = (api: any): string => {
  if (!api.statusMocks || api.statusMocks.length === 0) return '';

  const enabledMock = api.statusMocks.find((m: any) => m.enabled) || api.statusMocks[0];
  if (!enabledMock?.responseValue) return '';

  try {
    const response = JSON.parse(enabledMock.responseValue);
    const interfaceName = api.endpoint
      .split('/')
      .filter((p: string) => p && !p.startsWith(':') && !p.startsWith('['))
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('') + 'Response';

    return generateInterfaceFromObject(interfaceName, response);
  } catch {
    return '';
  }
};

const generateInterfaceFromObject = (name: string, obj: any, indent: string = ''): string => {
  if (obj === null) return 'null';
  if (Array.isArray(obj)) {
    if (obj.length === 0) return 'any[]';
    const itemType = typeof obj[0] === 'object' ? generateInterfaceFromObject('Item', obj[0], indent) : typeof obj[0];
    return `${itemType}[]`;
  }
  if (typeof obj !== 'object') return typeof obj;

  let result = `interface ${name} {\n`;
  for (const [key, value] of Object.entries(obj)) {
    const valueType = typeof value;
    if (value === null) {
      result += `${indent}  ${key}: null;\n`;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        result += `${indent}  ${key}: any[];\n`;
      } else if (typeof value[0] === 'object') {
        result += `${indent}  ${key}: ${JSON.stringify(value[0]).length > 100 ? 'Record<string, any>' : 'object'}[];\n`;
      } else {
        result += `${indent}  ${key}: ${typeof value[0]}[];\n`;
      }
    } else if (valueType === 'object') {
      result += `${indent}  ${key}: Record<string, any>;\n`;
    } else {
      result += `${indent}  ${key}: ${valueType};\n`;
    }
  }
  result += `${indent}}`;
  return result;
};

const generatePageMarkdown = (page: Page): string => {
  const routeName = page.route === '/' ? 'index' : page.route.replace(/^\//, '').replace(/\//g, '-');

  let md = `# Page: ${routeName}\n\n`;

  md += `## Screenshots\n`;
  if (page.images && page.images.length > 0) {
    const totalImages = page.images.length;
    page.images.forEach((img, idx) => {
      const imageName = img.imageName || `${routeName}-${idx + 1}.jpg`;
      const label = img.label?.trim() || getSmartImageLabel(idx, totalImages, 'page');
      md += `### ${label}\n`;
      md += `![${label}](../../assets/${imageName})\n`;
      md += `**Instruction:** Implement this view to match the screenshot exactly.\n\n`;
    });
  } else {
    md += `*No reference screenshots provided for this page.*\n`;
    md += `**Instruction:** Design this page following the overall design system established in other pages. Match the styling patterns from pages that DO have screenshots.\n\n`;
  }

  md += `## Route\n`;
  md += `- **Path**: \`${page.route}\`\n`;
  md += `- **Name**: \`${routeName}\`\n\n`;

  if (page.description?.trim()) {
    md += `## Description\n${page.description}\n\n`;
  }

  const validComponents = page.components?.filter((c: any) => c !== null) || [];
  if (validComponents.length > 0) {
    md += `## Components\n`;
    md += validComponents.map((c: any) => c.name).join(', ') + '\n\n';
  }

  if (page.seo?.trim()) {
    md += `## SEO\n${page.seo}\n\n`;
  }

  // API Endpoints with full details
  const validEndpoints = page.endpoints?.filter(e => e && e.method) || [];
  if (validEndpoints.length > 0) {
    md += `## API Endpoints\n\n`;

    validEndpoints.forEach((api: any) => {
      md += `### ${api.method} ${api.endpoint}\n`;
      if (api.description) md += `**Description:** ${api.description}\n`;
      if (api.isAuth) md += `**Authentication:** Required\n`;

      // Generate TypeScript interface for response
      const tsInterface = generateApiResponseInterface(api);
      if (tsInterface) {
        md += `\n**TypeScript Response Interface:**\n\`\`\`typescript\n${tsInterface}\n\`\`\`\n`;
      }
      md += '\n';

      if (api.statusMocks && api.statusMocks.length > 0) {
        api.statusMocks.forEach((statusMock: any, index: number) => {
          md += `**Response ${index + 1} (${statusMock.statusCode})**${statusMock.enabled ? ' [Active]' : ''}\n\n`;

          if (statusMock.headerParams && statusMock.headerParams.length > 0) {
            md += '**Headers:**\n';
            statusMock.headerParams.forEach((p: any) => {
              md += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
            });
            md += '\n';
          }

          if (statusMock.queryParams && statusMock.queryParams.length > 0) {
            md += '**Query Parameters:**\n';
            statusMock.queryParams.forEach((p: any) => {
              md += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
            });
            md += '\n';
          }

          if (statusMock.bodyParams && statusMock.bodyParams.length > 0) {
            md += '**Body Parameters:**\n';
            statusMock.bodyParams.forEach((p: any) => {
              md += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
            });
            md += '\n';
          }

          if (statusMock.validators && statusMock.validators.length > 0) {
            md += '**Validation Rules:**\n';
            statusMock.validators.forEach((v: any) => {
              md += `  - ${v.field}: ${v.rule} - ${v.message}\n`;
            });
            md += '\n';
          }

          if (statusMock.responseValue) {
            md += '**Response:**\n```json\n';
            md += formatJson(statusMock.responseValue);
            md += '\n```\n\n';
          }
        });
      }

      md += '---\n\n';
    });
  }

  return md;
};

const generateComponentMarkdown = (comp: Component): string => {
  const componentName = comp.name.replace(/\s+/g, '');

  let md = `# Component: ${comp.name}\n\n`;

  md += `## Screenshots\n`;
  if (comp.images && comp.images.length > 0) {
    const totalImages = comp.images.length;
    comp.images.forEach((img, idx) => {
      const imageName = img.imageName || `component-${componentName}-${idx + 1}.jpg`;
      const label = img.label?.trim() || getSmartImageLabel(idx, totalImages, 'component');
      md += `### ${label}\n`;
      md += `![${label}](../../assets/${imageName})\n`;
      md += `**Instruction:** Implement this state/view to match the screenshot exactly.\n\n`;
    });
  } else {
    md += `*No reference screenshots provided for this component.*\n`;
    md += `**Instruction:** Design this component following the overall design system established in other components. Match the styling patterns from components that DO have screenshots.\n\n`;
  }

  if (comp.description?.trim()) {
    md += `## Description\n${comp.description}\n\n`;
  }

  // API Endpoints with full details
  const validEndpoints = comp.endpoints?.filter(e => e && e.method) || [];
  if (validEndpoints.length > 0) {
    md += `## API Endpoints\n\n`;

    validEndpoints.forEach((api: any) => {
      md += `### ${api.method} ${api.endpoint}\n`;
      if (api.description) md += `**Description:** ${api.description}\n`;
      if (api.isAuth) md += `**Authentication:** Required\n`;

      // Generate TypeScript interface for response
      const tsInterface = generateApiResponseInterface(api);
      if (tsInterface) {
        md += `\n**TypeScript Response Interface:**\n\`\`\`typescript\n${tsInterface}\n\`\`\`\n`;
      }
      md += '\n';

      if (api.statusMocks && api.statusMocks.length > 0) {
        api.statusMocks.forEach((statusMock: any, index: number) => {
          md += `**Response ${index + 1} (${statusMock.statusCode})**${statusMock.enabled ? ' [Active]' : ''}\n\n`;

          if (statusMock.headerParams && statusMock.headerParams.length > 0) {
            md += '**Headers:**\n';
            statusMock.headerParams.forEach((p: any) => {
              md += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
            });
            md += '\n';
          }

          if (statusMock.queryParams && statusMock.queryParams.length > 0) {
            md += '**Query Parameters:**\n';
            statusMock.queryParams.forEach((p: any) => {
              md += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
            });
            md += '\n';
          }

          if (statusMock.bodyParams && statusMock.bodyParams.length > 0) {
            md += '**Body Parameters:**\n';
            statusMock.bodyParams.forEach((p: any) => {
              md += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
            });
            md += '\n';
          }

          if (statusMock.validators && statusMock.validators.length > 0) {
            md += '**Validation Rules:**\n';
            statusMock.validators.forEach((v: any) => {
              md += `  - ${v.field}: ${v.rule} - ${v.message}\n`;
            });
            md += '\n';
          }

          if (statusMock.responseValue) {
            md += '**Response:**\n```json\n';
            md += formatJson(statusMock.responseValue);
            md += '\n```\n\n';
          }
        });
      }

      md += '---\n\n';
    });
  }

  return md;
};

const generateProjectMarkdown = (): string => {
  let md = `# Next.js Frontend Implementation\n\n`;

  // Context
  md += `## Context\n`;
  md += `You are an experienced frontend developer working on a Next.js-based web application. This is a state-aware implementation where each page is built incrementally based on provided specifications.\n\n`;

  // User Interface Reference (Source of Truth)
  md += `## User Interface Reference (Source of Truth)\n`;
  md += `The \`/assets\` folder contains reference screenshots showing the **EXACT UI design** to implement.\n\n`;
  md += `**CRITICAL INSTRUCTIONS:**\n`;
  md += `- These screenshots are the **source of truth** for visual implementation\n`;
  md += `- Your implementation **MUST** visually match these screenshots precisely\n`;
  md += `- Match exactly: colors, spacing, layout, typography, component styling, shadows, borders, border-radius\n`;
  md += `- If a screenshot shows a specific button style, table design, or card layout - replicate it exactly\n`;
  md += `- **DO NOT** improvise or redesign UI elements that are clearly shown in screenshots\n`;
  md += `- Pay attention to hover states, active states, and responsive breakpoints if multiple screenshots are provided\n`;
  md += `- When no screenshot is provided for a page/component, follow the design patterns established in other pages that DO have screenshots\n\n`;

  // Working Project Code
  md += `## Working Project Code\n`;
  md += `A working Next.js project code is available in the file \`code.md\` (located in the same directory as this file). This code is production-ready and contains a fully functional implementation with all dependencies, configurations, and best practices already set up.\n\n`;
  md += `**IMPORTANT**: You MUST start your project using the code from \`code.md\`. This will ensure your project works without errors from the beginning. Extract all files from \`code.md\` to set up your initial project structure, then proceed to implement the specific requirements outlined below.\n\n`;
  md += `**The folder structure inside the referenced code.md is:**\n`;
  md += `\`\`\`\n`;
  md += `├── app/\n`;
  md += `│   ├── dashboard/\n`;
  md += `│   ├── error.tsx\n`;
  md += `│   ├── favicon.ico\n`;
  md += `│   ├── globals.css\n`;
  md += `│   ├── layout.tsx\n`;
  md += `│   ├── not-found.tsx\n`;
  md += `│   └── page.tsx\n`;
  md += `├── components/\n`;
  md += `├── public/\n`;
  md += `├── stores/\n`;
  md += `├── types/\n`;
  md += `├── .gitignore\n`;
  md += `├── code.md\n`;
  md += `├── eslint.config.mjs\n`;
  md += `├── next-env.d.ts\n`;
  md += `├── next.config.ts\n`;
  md += `├── package.json\n`;
  md += `├── postcss.config.mjs\n`;
  md += `├── README.md\n`;
  md += `└── tsconfig.json\n`;
  md += `\`\`\`\n\n`;
  md += `**Use the folder structure and code from code.md strictly for a clean start, and modify as per your needs.**\n\n`;

  // API Base URL Configuration
  md += `## API Configuration\n\n`;
  md += `**Base URL Configuration:**\n`;
  md += `Configure the mock server base URL in your environment configuration:\n\n`;
  md += `1. Create a \`.env.local\` file in your project root\n`;
  md += `2. Add the following environment variable:\n`;
  md += `   \`\`\`\n`;
  if (selectedProject.value?.id) {
    md += `   NEXT_PUBLIC_API_BASE_URL=${mockServerBaseUri}/api/projects/${selectedProject.value.id}\n`;
  } else {
    md += `   NEXT_PUBLIC_API_BASE_URL=${mockServerBaseUri}/api/projects/YOUR_PROJECT_ID\n`;
  }
  md += `   \`\`\`\n`;
  md += `3. Access it in your API configuration/client:\n`;
  md += `   \`\`\`typescript\n`;
  if (selectedProject.value?.id) {
    md += `   const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '${mockServerBaseUri}/api/projects/${selectedProject.value.id}';\n`;
  } else {
    md += `   const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '${mockServerBaseUri}/api/projects/YOUR_PROJECT_ID';\n`;
  }
  md += `   \`\`\`\n\n`;

  // Project Overview
  md += `## Project Overview\n`;
  md += `- **Framework**: Next.js 15.x with App Router (under \`app/*\`)\n`;
  md += `- **React**: 18.x with TypeScript strict mode\n`;
  md += `- **Styling**: Tailwind CSS (NO custom CSS - use utility classes only)\n`;
  md += `- **State Management**: [SPECIFY: Zustand/Redux Toolkit/TanStack Query/Context API]\n`;
  md += `- **HTTP Client**: [SPECIFY: fetch/axios/TanStack Query] for all API requests\n`;
  md += `- **Validation**: [SPECIFY: zod/react-hook-form/yup]\n`;
  md += `- **UI Kit**: [SPECIFY: e.g., Tailwind + shadcn/ui/MUI/Ant Design]\n`;
  md += `- **Routing**: App Router under \`app/*\` (analyze reference repo for structure)\n`;
  md += `- **Package Manager**: pnpm/npm/yarn/bun\n\n`;

  // Requirements
  md += `## Requirements\n\n`;

  md += `### Code Quality Standards\n`;
  md += `- Use React 18+ with TypeScript strict mode exclusively\n`;
  md += `- Ensure type safety throughout with TypeScript strict mode\n`;
  md += `- Implement proper error handling and loading states\n`;
  md += `- Follow React and Next.js 15 best practices\n`;
  md += `- Use proper state management patterns with chosen library\n`;
  md += `- Implement proper custom hooks for shared logic\n`;
  md += `- Study the reference repository's component architecture and patterns\n\n`;

  md += `### Design & UI Standards\n`;
  md += `- Use ONLY Tailwind CSS utility classes - NO custom CSS\n`;
  md += `- Ensure responsive design for all screen sizes\n`;
  md += `- Implement proper loading states and skeleton screens\n`;
  md += `- Add empty state designs for lists/tables\n`;
  md += `- Follow accessibility standards (WCAG AA)\n`;
  md += `- Consistent spacing, typography, and color schemes\n`;
  md += `- Reference the example project's component styling patterns\n\n`;

  md += `### Component Architecture\n`;
  md += `- Study the \`app/\` directory structure in the reference repository\n`;
  md += `- Examine how components are organized and used\n`;
  md += `- Understand Server vs Client Component patterns used in the reference\n`;
  md += `- Follow the same component patterns and structure\n`;
  md += `- Create reusable components for common UI elements\n`;
  md += `- Implement modular components (modals, forms, cards, etc.)\n`;
  md += `- Keep components focused and single-purpose\n`;
  md += `- Place components in appropriate directories matching the reference structure\n`;
  md += `- Proper separation of Server and Client Components\n\n`;
  md += `**Modal Component Pattern (React/Next.js):**\n`;
  md += `- When you think a modal needs to be created for a functionality, create it inside \`components/modals/\` folder\n`;
  md += `- Open modals inside pages using state management:\n`;
  md += `  \`\`\`typescript\n`;
  md += `  const [modal, setModal] = useState({ type: null, data: null });\n`;
  md += `  const openModal = (type, data = null) => setModal({ type, data });\n`;
  md += `  const closeModal = () => setModal({ type: null, data: null });\n`;
  md += `  \n`;
  md += `  // Render modal conditionally\n`;
  md += `  {modal.type === 'create' && <CreateModal onClose={closeModal} />}\n`;
  md += `  {modal.type === 'edit' && <EditModal data={modal.data} onClose={closeModal} />}\n`;
  md += `  \`\`\`\n\n`;

  md += `### Technical Specifications\n`;
  md += `- Use chosen HTTP client for all requests with proper error handling\n`;
  md += `- Implement proper TypeScript interfaces for all data structures\n`;
  md += `- Follow App Router conventions (analyze \`app/*\` in reference repo)\n`;
  md += `- Use custom hooks for shared business logic\n`;
  md += `- Implement proper SEO metadata for each page\n`;
  md += `- Add proper loading and error states (loading.tsx, error.tsx)\n`;
  md += `- Implement proper Server/Client Component patterns\n`;
  md += `- Review \`next.config.ts\` and configuration files from the reference project\n\n`;

  // Project Orchestration
  md += `## Project Orchestration\n`;
  md += `**IMPORTANT**: This is a state-aware architecture. Start by extracting the reference project from \`code.md\`, then incrementally build components and pages in the order specified.\n\n`;

  // Step-by-step execution flow
  md += `## Execution Flow (ONE AT A TIME)\n`;
  md += `**CRITICAL: Build incrementally. Complete ONE item fully before moving to the next.**\n\n`;

  md += `### Why This Approach?\n`;
  md += `- Prevents context overload and ensures focus\n`;
  md += `- Each piece is production-ready before moving on\n`;
  md += `- Allows for focused debugging and testing\n`;
  md += `- Produces cleaner, more maintainable code\n`;
  md += `- Easier to catch and fix issues early\n\n`;

  md += `### Workflow Rules\n`;
  md += `1. **Read** the specification for the NEXT item (marked with ← CURRENT)\n`;
  md += `2. **Study** the corresponding screenshot(s) in \`/assets\` folder\n`;
  md += `3. **Implement** the component/page completely, matching the screenshot exactly\n`;
  md += `4. **Verify** it matches the screenshot and works correctly\n`;
  md += `5. **Mark** the checkbox as complete: \`- [x]\`\n`;
  md += `6. **ONLY THEN** move to the next item\n\n`;

  md += `**⚠️ DO NOT attempt to implement multiple pages/components simultaneously.**\n\n`;

  md += `### Phase 1: Project Setup\n`;
  md += `<!-- Complete all setup tasks before building components/pages -->\n`;
  md += `- [ ] Extract all project files from \`code.md\` to set up the initial project structure\n`;
  md += `- [ ] Study the project structure, especially \`app/\` directory and component organization\n`;
  md += `- [ ] Review configuration files (\`next.config.ts\`, \`tsconfig.json\`, \`eslint.config.mjs\`)\n`;
  md += `- [ ] Examine the state management setup (check \`stores/\` directory)\n`;
  md += `- [ ] Install dependencies using the appropriate package manager\n`;
  md += `- [ ] Verify the development server runs successfully\n`;
  md += `- [ ] Configure state management for your specific needs\n`;
  md += `- [ ] Setup HTTP client and API configuration\n\n`;

  // Component dependency section
  if (components.value.length > 0) {
    md += `### Phase 2: Reusable Components\n`;
    md += `**Build components BEFORE pages that use them.**\n\n`;

    // Determine which pages use which components
    md += `| Component | Used By |\n`;
    md += `|-----------|--------|\n`;
    components.value.forEach((comp) => {
      const componentName = comp.name.replace(/\s+/g, '');
      const usedByPages = pages.value
        .filter(p => p.components?.some((c: any) => c?.name?.toLowerCase() === comp.name.toLowerCase()))
        .map(p => p.route === '/' ? 'index' : p.route.replace(/^\//, ''))
        .join(', ');
      md += `| ${componentName} | ${usedByPages || 'Multiple pages'} |\n`;
    });
    md += `\n`;

    md += `#### Component Build Order\n`;
    components.value.forEach((comp, index) => {
      const componentName = comp.name.replace(/\s+/g, '');
      const marker = index === 0 ? ' ← CURRENT' : '';
      md += `- [ ] **${index + 1}.** \`components/${componentName}.tsx\` (ref: \`components/${componentName}.md\`)${marker}\n`;
    });
    md += `\n`;
  }

  // Pages section
  if (pages.value.length > 0) {
    const phaseNumber = components.value.length > 0 ? 3 : 2;
    md += `### Phase ${phaseNumber}: Pages\n`;
    md += `**Implement pages in the order below. Each page should be fully functional before proceeding.**\n\n`;

    md += `#### Page Build Order\n`;
    pages.value.forEach((page, index) => {
      const fileName = page.route === '/' ? 'page' : page.route.replace(/^\//, '').replace(/\//g, '-') + '/page';
      const displayName = page.route === '/' ? 'index' : page.route.replace(/^\//, '').replace(/\//g, '-');
      const marker = (index === 0 && components.value.length === 0) ? ' ← CURRENT' : '';
      const apiCount = page.endpoints?.filter(e => e && e.method).length || 0;
      md += `- [ ] **${index + 1}.** \`app/${fileName}.tsx\` (ref: \`pages/${displayName}.md\`)${marker}\n`;
      if (apiCount > 0) {
        md += `      - APIs: ${apiCount} endpoint(s)\n`;
      }
      const pageComponents = page.components?.filter((c: any) => c !== null) || [];
      if (pageComponents.length > 0) {
        const componentNames = pageComponents.map((c: any) => c.name).join(', ');
        md += `      - Components: ${componentNames.substring(0, 50)}${componentNames.length > 50 ? '...' : ''}\n`;
      }
    });
    md += `\n`;
  }

  const finalPhaseNumber = (components.value.length > 0 ? 3 : 2) + (pages.value.length > 0 ? 1 : 0);
  md += `### Phase ${finalPhaseNumber}: Final Verification\n`;
  md += `- [ ] Test all pages and API integrations\n`;
  md += `- [ ] Verify responsive design on mobile, tablet, and desktop\n`;
  md += `- [ ] Ensure proper loading states for all async operations\n`;
  md += `- [ ] Verify error handling and empty states\n`;
  md += `- [ ] Run TypeScript type checking (\`npx tsc --noEmit\`)\n`;
  md += `- [ ] Final visual comparison against all screenshots\n\n`;

  // Deliverables
  md += `## Deliverables\n`;
  md += `- Fully functional Next.js 15 application with all specified pages\n`;
  md += `- Proper integration with provided API endpoints\n`;
  md += `- State management implementation with chosen library\n`;
  md += `- Reusable components for common UI elements\n`;
  md += `- TypeScript interfaces for all data structures\n`;
  md += `- Responsive design working on all screen sizes\n`;
  md += `- Proper error handling and loading states\n`;
  md += `- Clean, maintainable, and well-documented code\n`;
  md += `- Architecture consistent with the reference repository\n\n`;

  // Component Details
  if (components.value.length > 0) {
    md += `## Component Details\n`;
    md += `Refer to individual component files in the \`components/\` directory for detailed specifications, including:\n`;
    md += `- Component screenshots and visual references\n`;
    md += `- Description and usage\n`;
    md += `- API endpoint details (if applicable)\n\n`;
  }

  md += `## Page Details\n`;
  md += `Refer to individual page files in the \`pages/\` directory for detailed specifications, including:\n`;
  md += `- Page screenshots and visual references\n`;
  md += `- Route configurations\n`;
  md += `- Component requirements\n`;
  md += `- API endpoint details (headers, query params, body, responses)\n`;
  md += `- SEO requirements\n\n`;

  // Acceptance Criteria
  md += `## Acceptance Criteria\n`;
  md += `Before considering any component or page complete, verify against this checklist:\n\n`;
  md += `### Visual Accuracy\n`;
  md += `- [ ] UI matches the reference screenshot exactly (colors, spacing, typography)\n`;
  md += `- [ ] Responsive design works on mobile (< 640px), tablet (640-1024px), and desktop (> 1024px)\n`;
  md += `- [ ] Hover states, focus states, and transitions match the design system\n`;
  md += `- [ ] Icons, images, and assets are properly sized and positioned\n\n`;

  md += `### Functionality\n`;
  md += `- [ ] All API integrations working with proper request/response handling\n`;
  md += `- [ ] Form validations match API requirements and show appropriate error messages\n`;
  md += `- [ ] Loading states displayed during async operations\n`;
  md += `- [ ] Empty states designed for lists/tables with no data\n`;
  md += `- [ ] Error states handle API failures gracefully\n\n`;

  md += `### Code Quality\n`;
  md += `- [ ] No TypeScript errors (\`npx tsc --noEmit\` passes)\n`;
  md += `- [ ] Only Tailwind CSS utility classes used - NO custom CSS\n`;
  md += `- [ ] Components are properly typed with TypeScript interfaces\n`;
  md += `- [ ] State management follows established patterns\n`;
  md += `- [ ] No console errors or warnings in browser\n`;
  md += `- [ ] Proper Server/Client Component separation\n\n`;

  md += `### Accessibility\n`;
  md += `- [ ] Proper ARIA labels on interactive elements\n`;
  md += `- [ ] Keyboard navigation works correctly\n`;
  md += `- [ ] Focus management is handled properly\n`;
  md += `- [ ] Color contrast meets WCAG AA standards\n\n`;

  md += `---\n\n`;

  // Pre-implementation confirmation
  md += `## Before You Start\n\n`;
  md += `**IMPORTANT: Before implementing anything, please confirm:**\n\n`;
  md += `1. ✅ You have reviewed all screenshots in the \`/assets\` folder\n`;
  md += `2. ✅ You understand the overall page/component structure\n`;
  md += `3. ✅ You have identified the item marked with "← CURRENT" to start with\n`;
  md += `4. ✅ You have read the corresponding \`.md\` specification file for that item\n\n`;

  md += `**Provide a brief implementation plan for the CURRENT item before writing any code.**\n\n`;
  md += `Your plan should include:\n`;
  md += `- Key UI elements to implement\n`;
  md += `- API endpoints to integrate\n`;
  md += `- State management approach\n`;
  md += `- Any reusable components to create or use\n`;
  md += `- Whether this is a Server or Client Component\n\n`;

  md += `**Wait for approval before proceeding with implementation.**\n`;

  return md;
};

const downloadZip = async () => {
  // Scroll to steps section in parent and wait for animation
  if (scrollToSteps) {
    await scrollToSteps();
  }

  const zip = new JSZip();

  // Create project folder structure: <project_name>/prompt/workflows and assets
  const projectName = 'frontend-nextjs';
  const projectFolder = zip.folder(projectName);
  const promptFolder = projectFolder?.folder('prompt');
  const assetsFolder = promptFolder?.folder('assets');
  const workflowsFolder = promptFolder?.folder('workflows');
  const pagesFolder = workflowsFolder?.folder('pages');
  const componentsFolder = workflowsFolder?.folder('components');

  // Add component images to assets
  components.value.forEach((comp) => {
    const componentName = comp.name.replace(/\s+/g, '');

    if (comp.images && comp.images.length > 0) {
      comp.images.forEach((img, imgIdx) => {
        if (img.image) {
          const imageName = img.imageName || `component-${componentName}-${imgIdx + 1}.jpg`;
          // Convert base64 to blob
          const base64Data: any = img.image.split(',')[1];
          assetsFolder?.file(imageName, base64Data, { base64: true });
        }
      });
    }
  });

  // Add page images to assets
  pages.value.forEach((page) => {
    const fileName = page.route === '/' ? 'index' : page.route.replace(/^\//, '').replace(/\//g, '-');

    if (page.images && page.images.length > 0) {
      page.images.forEach((img, imgIdx) => {
        if (img.image) {
          const imageName = img.imageName || `${fileName}-${imgIdx + 1}.jpg`;
          // Convert base64 to blob
          const base64Data: any = img.image.split(',')[1];
          assetsFolder?.file(imageName, base64Data, { base64: true });
        }
      });
    }
  });

  // Add component markdown files
  components.value.forEach((comp) => {
    const componentName = comp.name.replace(/\s+/g, '');
    const markdown = generateComponentMarkdown(comp);
    componentsFolder?.file(`${componentName}.md`, markdown);
  });

  // Add page markdown files
  pages.value.forEach((page) => {
    const fileName = page.route === '/' ? 'index' : page.route.replace(/^\//, '').replace(/\//g, '-');
    const markdown = generatePageMarkdown(page);
    pagesFolder?.file(`${fileName}.md`, markdown);
  });

  // Add project.md
  const projectMd = generateProjectMarkdown();
  workflowsFolder?.file('project.md', projectMd);

  // Add code.md
  workflowsFolder?.file('code.md', codeMd.value);

  // Add .gitignore file at project root
  const gitignoreContent = 'prompt\n';
  projectFolder?.file('.gitignore', gitignoreContent);

  // Generate and download zip
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${projectName}.zip`;
  link.click();
  URL.revokeObjectURL(link.href);
};
</script>
