<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium text-gray-200">React Native App</h2>
      <div class="flex gap-2">
        <button
          v-if="screens.length >= 1 || components.length >= 1"
          @click="downloadZip"
          class="px-4 py-2 bg-[#353849] hover:bg-gray-700 text-white text-sm rounded-full transition-colors flex items-center gap-1.5"
        >
          <Icon name="material-symbols:download" class="w-4 h-4" />
          Download Project Prompt
        </button>
        <button
          @click="openAddComponentModal"
          class="px-4 py-2 bg-[#4a4d5e] hover:bg-[#5a5d6e] text-white text-sm rounded-full transition-colors flex items-center gap-1.5"
        >
          <Icon name="mdi:plus" class="w-4 h-4" />
          Add Component
        </button>
        <button
          @click="openAddScreenModal"
          class="px-4 py-2 bg-[#353849] hover:bg-gray-700 text-white text-sm rounded-full transition-colors flex items-center gap-1.5"
        >
          <Icon name="mdi:plus" class="w-4 h-4" />
          Add Screen
        </button>
      </div>
    </div>

    <!-- Components List -->
    <div v-if="components.length > 0" class="mb-6">
      <h3 class="text-sm font-medium text-gray-300 mb-3">Components</h3>
      <div class="space-y-3">
        <div
          v-for="(component, index) in components"
          :key="index"
          class="bg-[#242736] rounded-xl border border-gray-700 p-4 flex gap-4"
        >
          <!-- Image Preview -->
          <div class="flex-shrink-0 flex gap-2">
            <div
              v-for="(img, imgIndex) in component.images.slice(0, 3)"
              :key="imgIndex"
              class="w-16 h-16 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="img.image"
                :src="img.image"
                :alt="img.label"
                class="w-full h-full object-cover"
              />
              <Icon v-else name="mdi:image-outline" class="w-6 h-6 text-gray-500" />
            </div>
            <div
              v-if="component.images.length > 3"
              class="w-16 h-16 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center"
            >
              <span class="text-xs text-gray-400">+{{ component.images.length - 3 }}</span>
            </div>
          </div>

          <!-- Component Info -->
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-200 mb-1">{{ component.name }}</div>
            <div class="text-xs text-gray-400 truncate">
              {{ component.description && component.description.length > 70 ? component.description.substring(0, 70) + '...' : component.description }}
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

    <!-- Screens List -->
    <div v-if="screens.length > 0" class="space-y-3 mb-4">
      <h3 class="text-sm font-medium text-gray-300 mb-3">Screens</h3>
      <div
        v-for="(screen, index) in screens"
        :key="index"
        class="bg-[#242736] rounded-xl border border-gray-700 p-4 flex gap-4"
      >
        <!-- Image Preview -->
        <div class="flex-shrink-0 flex gap-2">
          <div
            v-for="(img, imgIndex) in screen.images.slice(0, 3)"
            :key="imgIndex"
            class="w-16 h-16 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="img.image"
              :src="img.image"
              :alt="img.label"
              class="w-full h-full object-cover"
            />
            <Icon v-else name="mdi:cellphone" class="w-6 h-6 text-gray-500" />
          </div>
          <div
            v-if="screen.images.length > 3"
            class="w-16 h-16 bg-[#2d3142] rounded-lg border border-gray-600 flex items-center justify-center"
          >
            <span class="text-xs text-gray-400">+{{ screen.images.length - 3 }}</span>
          </div>
        </div>

        <!-- Screen Info -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-200 mb-1">{{ screen.route }}</div>
          <div class="text-xs text-gray-400 truncate">
            {{ screen.description && screen.description.length > 70 ? screen.description.substring(0, 70) + '...' : screen.description }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-start">
          <button
            @click="editScreen(index)"
            class="p-2 text-gray-400 hover:text-indigo-400 rounded-full transition-colors"
            title="Edit"
          >
            <Icon name="mdi:pencil" class="w-4 h-4" />
          </button>
          <button
            @click="deleteScreen(index)"
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
      <Icon name="mdi:cellphone-off" class="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <p class="text-gray-400 text-sm">No screens added yet. Click "Add Screen" to get started.</p>
    </div>

    <!-- Screen Modal -->
    <ModalsPromptsScreen
      :show="showModal"
      :page="currentScreen"
      :apis="filteredApis"
      :available-components="components"
      :is-edit="editingIndex !== null"
      @close="closeModal"
      @save="saveScreen"
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

const mockServerBaseUri = appConfig.baseUri || `http://localhost:4001`;

const selectedProject = computed(() =>
  projectStore.projects.find(p => p.id === projectStore.selectedProjectId)
);

// Fetch code.md content
const codeMd = ref('');

// Inject scrollToSteps from parent
const scrollToSteps = inject<(() => Promise<void>) | undefined>('scrollToSteps');

const screens = ref<Page[]>([]);
const showModal = ref(false);
const editingIndex = ref<number | null>(null);
const currentScreen = ref<Page | null>(null);

const components = ref<Component[]>([]);
const showComponentModal = ref(false);
const editingComponentIndex = ref<number | null>(null);
const currentComponent = ref<Component | null>(null);

onMounted(async () => {
  try {
    const response = await fetch('/code/app-react-native.md');
    codeMd.value = await response.text();

    await Promise.all([
      projectStore.fetchProjects(),
      apiStore.fetchApis()
    ]);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

const filteredApis = computed(() => {
  if (!projectStore.selectedProjectId) return [];
  return apiStore.apis.filter(api => api.projectId === projectStore.selectedProjectId && !api.isAdminEndpoint);
});

const openAddScreenModal = () => {
  editingIndex.value = null;
  currentScreen.value = null;
  showModal.value = true;
};

const editScreen = (index: number) => {
  editingIndex.value = index;
  currentScreen.value = screens.value[index]!;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingIndex.value = null;
  currentScreen.value = null;
};

const saveScreen = (screen: Page) => {
  if (editingIndex.value !== null) {
    screens.value[editingIndex.value] = screen;
  } else {
    screens.value.push(screen);
  }
  closeModal();
};

const deleteScreen = (index: number) => {
  if (confirm('Are you sure you want to delete this screen?')) {
    screens.value.splice(index, 1);
  }
};

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

const deleteComponent = (index: number) => {
  if (confirm('Are you sure you want to delete this component?')) {
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
const getSmartImageLabel = (index: number, total: number, context: 'screen' | 'component'): string => {
  const screenLabels = ['Screen Overview', 'Mobile View', 'Tablet View', 'Landscape View', 'Loading State', 'Empty State', 'Error State', 'Success State'];
  const componentLabels = ['Default State', 'Hover State', 'Active State', 'Disabled State', 'Loading State', 'Expanded View', 'Collapsed View', 'Error State'];

  const labels = context === 'screen' ? screenLabels : componentLabels;

  if (total === 1) {
    return context === 'screen' ? 'Screen Design Reference' : 'Component Design Reference';
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
      .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ''))
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

const generateScreenMarkdown = (screen: Page): string => {
  const screenName = screen.route.replace(/^\//, '').replace(/\//g, '-') || 'Home';

  let md = `# Screen: ${screenName}\n\n`;

  md += `## Screenshots\n`;
  if (screen.images && screen.images.length > 0) {
    const totalImages = screen.images.length;
    screen.images.forEach((img, idx) => {
      if (img.image) {
        const imageName = img.imageName || `${screenName}-${idx + 1}.jpg`;
        const label = img.label?.trim() || getSmartImageLabel(idx, totalImages, 'screen');
        md += `### ${label}\n`;
        md += `![${label}](../../assets/${imageName})\n`;
        md += `**Instruction:** Implement this view to match the screenshot exactly.\n\n`;
      }
    });
  } else {
    md += `*No reference screenshots provided for this screen.*\n`;
    md += `**Instruction:** Design this screen following the overall design system established in other screens. Match the styling patterns from screens that DO have screenshots.\n\n`;
  }

  md += `## Route\n`;
  md += `- **Screen Name**: \`${screen.route}\`\n`;
  md += `- **Component Name**: \`${screenName}Screen\`\n`;
  md += `- **File**: \`src/screens/${screenName}Screen.tsx\`\n\n`;

  if (screen.description?.trim()) {
    md += `## Description\n${screen.description}\n\n`;
  }

  const validComponents = screen.components?.filter((c: any) => c !== null) || [];
  if (validComponents.length > 0) {
    md += `## Components & UI Elements\n`;
    md += validComponents.map((c: any) => c.name).join(', ') + '\n\n';
  }

  if (screen.seo?.trim()) {
    md += `## Navigation & State Management\n${screen.seo}\n\n`;
  }

  // API Endpoints with full details
  const validEndpoints = screen.endpoints?.filter(e => e && e.method) || [];
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

const generateComponentMarkdown = (component: Component): string => {
  const componentName = component.name.replace(/\s+/g, '_');

  let md = `# Component: ${component.name}\n\n`;

  md += `## Screenshots\n`;
  if (component.images && component.images.length > 0) {
    const totalImages = component.images.length;
    component.images.forEach((img, idx) => {
      if (img.image) {
        const imageName = img.imageName || `component-${componentName}-${idx + 1}.jpg`;
        const label = img.label?.trim() || getSmartImageLabel(idx, totalImages, 'component');
        md += `### ${label}\n`;
        md += `![${label}](../../assets/${imageName})\n`;
        md += `**Instruction:** Implement this state/view to match the screenshot exactly.\n\n`;
      }
    });
  } else {
    md += `*No reference screenshots provided for this component.*\n`;
    md += `**Instruction:** Design this component following the overall design system established in other components. Match the styling patterns from components that DO have screenshots.\n\n`;
  }

  if (component.description?.trim()) {
    md += `## Description\n${component.description}\n\n`;
  }

  // API Endpoints with full details
  const validEndpoints = component.endpoints?.filter(e => e && e.method) || [];
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
  let md = `# React Native Mobile App Implementation\n\n`;

  // Context
  md += `## Context\n`;
  md += `You are an experienced mobile developer working on a React Native application for Android and iOS. This is a state-aware implementation where each screen is built incrementally based on provided specifications.\n\n`;

  // User Interface Reference (Source of Truth)
  md += `## User Interface Reference (Source of Truth)\n`;
  md += `The \`/assets\` folder contains reference screenshots showing the **EXACT UI design** to implement.\n\n`;
  md += `**CRITICAL INSTRUCTIONS:**\n`;
  md += `- These screenshots are the **source of truth** for visual implementation\n`;
  md += `- Your implementation **MUST** visually match these screenshots precisely\n`;
  md += `- Match exactly: colors, spacing, layout, typography, component styling, shadows, borders, border-radius\n`;
  md += `- If a screenshot shows a specific button style, list design, or card layout - replicate it exactly\n`;
  md += `- **DO NOT** improvise or redesign UI elements that are clearly shown in screenshots\n`;
  md += `- Pay attention to different states (loading, empty, error) if multiple screenshots are provided\n`;
  md += `- When no screenshot is provided for a screen/component, follow the design patterns established in other screens that DO have screenshots\n\n`;

  // Working Project Code
  md += `## Working Project Code\n`;
  md += `A working React Native project code is available in the file \`code.md\` (located in the same directory as this file). This code is production-ready and contains a fully functional implementation with all dependencies, configurations, and best practices already set up.\n\n`;
  md += `**IMPORTANT**: You MUST start your project using the code from \`code.md\`. This will ensure your project works without errors from the beginning. Extract all files from \`code.md\` to set up your initial project structure, then proceed to implement the specific requirements outlined below.\n\n`;
  md += `**The folder structure inside the referenced \`code.md\` is:**\n`;
  md += `\`\`\`\n`;
  md += `src/\n`;
  md += `├── app/\n`;
  md += `│   ├── providers/\n`;
  md += `│   │   ├── StoreProvider.tsx\n`;
  md += `│   │   ├── QueryProvider.tsx\n`;
  md += `│   │   ├── ThemeProvider.tsx\n`;
  md += `│   │   ├── AuthProvider.tsx       # Auth context wrapper\n`;
  md += `│   │   └── index.tsx               # Compose all providers\n`;
  md += `│   ├── navigation/\n`;
  md += `│   │   ├── RootNavigator.tsx\n`;
  md += `│   │   ├── linking.ts\n`;
  md += `│   │   ├── types.ts\n`;
  md += `│   │   └── hooks/                  # useNavigation typed\n`;
  md += `│   └── index.tsx\n`;
  md += `│\n`;
  md += `├── features/\n`;
  md += `│   └── [feature_name]/\n`;
  md += `│       ├── screens/\n`;
  md += `│       ├── components/\n`;
  md += `│       ├── api/\n`;
  md += `│       ├── store/\n`;
  md += `│       └── index.ts\n`;
  md += `│\n`;
  md += `├── shared/\n`;
  md += `│   ├── ui/                         # Design system components\n`;
  md += `│   │   ├── primitives/\n`;
  md += `│   │   ├── layouts/\n`;
  md += `│   │   └── feedback/\n`;
  md += `│   ├── theme/\n`;
  md += `│   │   ├── tokens/\n`;
  md += `│   │   └── provider.tsx\n`;
  md += `│   ├── hooks/\n`;
  md += `│   └── lib/\n`;
  md += `│\n`;
  md += `├── services/\n`;
  md += `│   ├── api/\n`;
  md += `│   │   ├── client/\n`;
  md += `│   │   └── base/\n`;
  md += `│   ├── storage/\n`;
  md += `│   └── monitoring/\n`;
  md += `│\n`;
  md += `└── App.tsx\n`;
  md += `\`\`\`\n\n`;
  md += `**Use the folder structure and code from \`code.md\` strictly for a clean start, and modify as per your needs.**\n\n`;

  // API Base URL Configuration
  md += `## API Configuration\n\n`;
  md += `**Base URL Configuration:**\n`;
  md += `Configure the mock server base URL in your environment configuration:\n\n`;
  md += `1. Create environment files using \`react-native-config\`\n`;
  md += `2. Add the following configuration:\n`;
  md += `   \`\`\`\n`;
  md += `   # .env\n`;
  if (selectedProject.value?.id) {
    md += `   API_BASE_URL=${mockServerBaseUri}/api/projects/${selectedProject.value.id}\n`;
  } else {
    md += `   API_BASE_URL=${mockServerBaseUri}/api/projects/YOUR_PROJECT_ID\n`;
  }
  md += `   \`\`\`\n`;
  md += `3. Use it in your Axios client:\n`;
  md += `   \`\`\`typescript\n`;
  md += `   import Config from 'react-native-config';\n`;
  md += `   \n`;
  md += `   const apiClient = axios.create({\n`;
  md += `     baseURL: Config.API_BASE_URL,\n`;
  md += `     timeout: 30000,\n`;
  md += `   });\n`;
  md += `   \`\`\`\n\n`;

  // Project Overview
  md += `## Project Overview\n`;
  md += `- **Framework**: React Native (Latest stable version)\n`;
  md += `- **Language**: TypeScript (strict mode)\n`;
  md += `- **Platform**: Android & iOS (cross-platform)\n`;
  md += `- **Styling**: StyleSheet API / NativeWind (Tailwind for React Native) [SPECIFY]\n`;
  md += `- **State Management**: Redux Toolkit / Zustand / React Context [SPECIFY]\n`;
  md += `- **HTTP Client**: Axios with interceptors\n`;
  md += `- **Navigation**: React Navigation 6.x (Stack, Tab, Drawer)\n`;
  md += `- **Validation**: React Hook Form + Zod / Yup [SPECIFY]\n`;
  md += `- **UI Components**: React Native Paper / Native Base / Custom [SPECIFY]\n`;
  md += `- **Package Manager**: npm / yarn / pnpm\n`;
  md += `- **Architecture**: Feature-first architecture with clear separation of concerns\n\n`;

  // Requirements
  md += `## Requirements\n\n`;

  md += `### Code Quality Standards\n`;
  md += `- Use TypeScript with strict mode enabled\n`;
  md += `- Follow React Native and React best practices\n`;
  md += `- Implement functional components with hooks exclusively\n`;
  md += `- Ensure type safety throughout the application\n`;
  md += `- Implement proper error handling and loading states\n`;
  md += `- Use proper memo optimization where needed\n`;
  md += `- Follow React Navigation patterns for navigation\n`;
  md += `- Strictly adhere to the project structure from \`code.md\`\n\n`;

  md += `### Design & UI Standards\n`;
  md += `- Use StyleSheet API or NativeWind for styling (NO inline styles except dynamic values)\n`;
  md += `- Ensure responsive design for different screen sizes and orientations\n`;
  md += `- Implement proper loading indicators and skeleton screens\n`;
  md += `- Add empty state designs for lists and collections\n`;
  md += `- Follow platform-specific design guidelines (Material Design for Android, iOS Human Interface Guidelines)\n`;
  md += `- Support both light and dark themes\n`;
  md += `- Ensure proper accessibility (screen reader support, touch targets)\n`;
  md += `- Consistent spacing, typography, and color schemes\n\n`;

  md += `### Component Architecture\n`;
  md += `- Create reusable components in \`shared/ui/\` following design system principles\n`;
  md += `- Feature-specific components go in \`features/[feature]/components/\`\n`;
  md += `- Implement modular components (modals, forms, cards, buttons, etc.)\n`;
  md += `- Keep components focused and single-purpose\n`;
  md += `- Separate presentation and business logic\n`;
  md += `- Use custom hooks in \`shared/hooks/\` for shared logic\n`;
  md += `- Feature-specific hooks go in \`features/[feature]/\`\n\n`;
  md += `**Modal/Bottom Sheet Pattern (React Native):**\n`;
  md += `- When you need a modal or bottom sheet, create it in \`shared/ui/feedback/\` or feature-specific \`components/\` folder\n`;
  md += `- Open modals using state management:\n`;
  md += `  \`\`\`typescript\n`;
  md += `  const [modalVisible, setModalVisible] = useState(false);\n`;
  md += `  const [modalData, setModalData] = useState(null);\n`;
  md += `  \n`;
  md += `  const openModal = (data = null) => {\n`;
  md += `    setModalData(data);\n`;
  md += `    setModalVisible(true);\n`;
  md += `  };\n`;
  md += `  \n`;
  md += `  // In render\n`;
  md += `  <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)}>\n`;
  md += `    <EditItemModal data={modalData} onClose={() => setModalVisible(false)} />\n`;
  md += `  </Modal>\n`;
  md += `  \`\`\`\n\n`;

  md += `### Technical Specifications\n`;
  md += `- Use Axios for all HTTP requests with interceptors in \`services/api/client/\`\n`;
  md += `- Implement proper TypeScript interfaces for all data structures\n`;
  md += `- Follow feature-first structure as outlined\n`;
  md += `- Each feature should have its own screens, components, api, store, and utils\n`;
  md += `- Use custom hooks for shared business logic\n`;
  md += `- Implement proper error boundaries\n`;
  md += `- Add proper loading and error states for async operations\n`;
  md += `- Handle platform differences using Platform API\n`;
  md += `- Implement proper deep linking support in \`app/navigation/linking.ts\`\n\n`;

  // Project Orchestration
  md += `## Project Orchestration\n`;
  md += `**IMPORTANT**: This is a state-aware architecture. Start by extracting the reference project from \`code.md\`, then incrementally build components and screens in the order specified.\n\n`;

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
  md += `3. **Implement** the component/screen completely, matching the screenshot exactly\n`;
  md += `4. **Verify** it matches the screenshot and works correctly\n`;
  md += `5. **Mark** the checkbox as complete: \`- [x]\`\n`;
  md += `6. **ONLY THEN** move to the next item\n\n`;

  md += `**⚠️ DO NOT attempt to implement multiple screens/components simultaneously.**\n\n`;

  md += `### Phase 1: Project Setup\n`;
  md += `<!-- Complete all setup tasks before building components/screens -->\n`;
  md += `- [ ] Extract all project files from \`code.md\` to set up the initial project structure\n`;
  md += `- [ ] Study the project structure, especially \`src/\` directory organization\n`;
  md += `- [ ] Review configuration files (\`package.json\`, \`tsconfig.json\`, \`babel.config.js\`)\n`;
  md += `- [ ] Install dependencies using \`npm install\` or \`yarn\`\n`;
  md += `- [ ] Verify the app runs successfully with \`npm run android\` or \`npm run ios\`\n`;
  md += `- [ ] Configure state management for your specific needs\n`;
  md += `- [ ] Setup Axios client with API base URL configuration\n\n`;

  // Component dependency section
  if (components.value.length > 0) {
    md += `### Phase 2: Reusable Components\n`;
    md += `**Build components BEFORE screens that use them.**\n\n`;

    // Determine which screens use which components
    md += `| Component | Used By |\n`;
    md += `|-----------|--------|\n`;
    components.value.forEach((comp) => {
      const componentName = comp.name.replace(/\s+/g, '');
      const usedByScreens = screens.value
        .filter(s => s.components?.some((c: any) => c?.name?.toLowerCase() === comp.name.toLowerCase()))
        .map(s => s.route === '/' ? 'Home' : s.route.replace(/^\//, '').replace(/\//g, '-'))
        .join(', ');
      md += `| ${componentName} | ${usedByScreens || 'Multiple screens'} |\n`;
    });
    md += `\n`;

    md += `#### Component Build Order\n`;
    components.value.forEach((comp, index) => {
      const componentName = comp.name.replace(/\s+/g, '_');
      const marker = index === 0 ? ' ← CURRENT' : '';
      md += `- [ ] **${index + 1}.** \`${componentName}\` component (ref: \`components/${componentName}.md\`)${marker}\n`;
    });
    md += `\n`;
  }

  // Screens section
  if (screens.value.length > 0) {
    const phaseNumber = components.value.length > 0 ? 3 : 2;
    md += `### Phase ${phaseNumber}: Screens\n`;
    md += `**Implement screens in the order below. Each screen should be fully functional before proceeding.**\n\n`;

    md += `#### Screen Build Order\n`;
    screens.value.forEach((screen, index) => {
      const fileName = screen.route.replace(/^\//, '').replace(/\//g, '-') || 'Home';
      const marker = (index === 0 && components.value.length === 0) ? ' ← CURRENT' : '';
      const apiCount = screen.endpoints?.filter(e => e && e.method).length || 0;
      md += `- [ ] **${index + 1}.** \`${fileName}Screen.tsx\` (ref: \`screens/${fileName}.md\`)${marker}\n`;
      if (apiCount > 0) {
        md += `      - APIs: ${apiCount} endpoint(s)\n`;
      }
      const screenComponents = screen.components?.filter((c: any) => c !== null) || [];
      if (screenComponents.length > 0) {
        const componentNames = screenComponents.map((c: any) => c.name).join(', ');
        md += `      - Components: ${componentNames.substring(0, 50)}${componentNames.length > 50 ? '...' : ''}\n`;
      }
    });
    md += `\n`;
  }

  const finalPhaseNumber = (components.value.length > 0 ? 3 : 2) + (screens.value.length > 0 ? 1 : 0);
  md += `### Phase ${finalPhaseNumber}: Final Verification\n`;
  md += `- [ ] Test all screens and API integrations\n`;
  md += `- [ ] Verify responsive design on phone and tablet\n`;
  md += `- [ ] Ensure proper loading states for all async operations\n`;
  md += `- [ ] Verify error handling and empty states\n`;
  md += `- [ ] Run TypeScript type checking (\`npx tsc --noEmit\`)\n`;
  md += `- [ ] Test on both Android and iOS platforms\n`;
  md += `- [ ] Final visual comparison against all screenshots\n\n`;

  // Deliverables
  md += `## Deliverables\n`;
  md += `- Fully functional React Native application with all specified screens\n`;
  md += `- Proper integration with provided API endpoints\n`;
  md += `- State management implementation with chosen library\n`;
  md += `- Reusable components for common UI elements\n`;
  md += `- TypeScript interfaces for all data structures\n`;
  md += `- Responsive design working on phone and tablet\n`;
  md += `- Proper error handling and loading states\n`;
  md += `- Support for both light and dark themes\n`;
  md += `- Cross-platform compatibility (Android & iOS)\n`;
  md += `- Clean, maintainable, and well-documented code\n`;
  md += `- Architecture consistent with the reference project\n\n`;

  // Component Details
  if (components.value.length > 0) {
    md += `## Component Details\n`;
    md += `Refer to individual component files in the \`components/\` directory for detailed specifications, including:\n`;
    md += `- Component screenshots and visual references\n`;
    md += `- Description and usage\n`;
    md += `- API endpoint details (if applicable)\n\n`;
  }

  md += `## Screen Details\n`;
  md += `Refer to individual screen files in the \`screens/\` directory for detailed specifications, including:\n`;
  md += `- Screen screenshots and visual references\n`;
  md += `- Navigation configurations\n`;
  md += `- Component requirements\n`;
  md += `- API endpoint details (headers, query params, body, responses)\n`;
  md += `- State management requirements\n\n`;

  // Acceptance Criteria
  md += `## Acceptance Criteria\n`;
  md += `Before considering any component or screen complete, verify against this checklist:\n\n`;
  md += `### Visual Accuracy\n`;
  md += `- [ ] UI matches the reference screenshot exactly (colors, spacing, typography)\n`;
  md += `- [ ] Responsive design works on phone (< 600dp) and tablet (> 600dp)\n`;
  md += `- [ ] Touch states and animations match the design system\n`;
  md += `- [ ] Icons, images, and assets are properly sized and positioned\n\n`;

  md += `### Functionality\n`;
  md += `- [ ] All API integrations working with proper request/response handling\n`;
  md += `- [ ] Form validations match API requirements and show appropriate error messages\n`;
  md += `- [ ] Loading states displayed during async operations\n`;
  md += `- [ ] Empty states designed for lists/collections with no data\n`;
  md += `- [ ] Error states handle API failures gracefully\n\n`;

  md += `### Code Quality\n`;
  md += `- [ ] No TypeScript errors (\`npx tsc --noEmit\` passes)\n`;
  md += `- [ ] Components are properly typed with TypeScript interfaces\n`;
  md += `- [ ] State management follows established patterns\n`;
  md += `- [ ] No console errors or warnings in Metro bundler\n`;
  md += `- [ ] Proper component composition (no mega-components)\n\n`;

  md += `### Accessibility\n`;
  md += `- [ ] Proper accessibility labels on interactive elements\n`;
  md += `- [ ] Touch targets are at least 48x48 dp\n`;
  md += `- [ ] Color contrast meets accessibility standards\n`;
  md += `- [ ] Screen reader support works correctly\n\n`;

  md += `---\n\n`;

  // Pre-implementation confirmation
  md += `## Before You Start\n\n`;
  md += `**IMPORTANT: Before implementing anything, please confirm:**\n\n`;
  md += `1. ✅ You have reviewed all screenshots in the \`/assets\` folder\n`;
  md += `2. ✅ You understand the overall screen/component structure\n`;
  md += `3. ✅ You have identified the item marked with "← CURRENT" to start with\n`;
  md += `4. ✅ You have read the corresponding \`.md\` specification file for that item\n\n`;

  md += `**Provide a brief implementation plan for the CURRENT item before writing any code.**\n\n`;
  md += `Your plan should include:\n`;
  md += `- Key UI elements/components to implement\n`;
  md += `- API endpoints to integrate\n`;
  md += `- State management approach\n`;
  md += `- Any reusable components to create or use\n`;
  md += `- Platform-specific considerations (Android vs iOS)\n\n`;

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
  const projectName = 'app-react-native';
  const projectFolder = zip.folder(projectName);
  const promptFolder = projectFolder?.folder('prompt');
  const assetsFolder = promptFolder?.folder('assets');
  const workflowsFolder = promptFolder?.folder('workflows');
  const screensFolder = workflowsFolder?.folder('screens');
  const componentsFolder = workflowsFolder?.folder('components');

  // Add component images to assets
  components.value.forEach((component) => {
    const componentName = component.name.replace(/\s+/g, '_');

    if (component.images && component.images.length > 0) {
      component.images.forEach((img, imgIdx) => {
        if (img.image) {
          const imageName = img.imageName || `component-${componentName}-${imgIdx + 1}.jpg`;
          const base64Data: any = img.image.split(',')[1];
          assetsFolder?.file(imageName, base64Data, { base64: true });
        }
      });
    }
  });

  // Add screen images to assets
  screens.value.forEach((screen) => {
    const screenName = screen.route.replace(/^\//, '').replace(/\//g, '-') || 'Home';

    if (screen.images && screen.images.length > 0) {
      screen.images.forEach((img, imgIdx) => {
        if (img.image) {
          const imageName = img.imageName || `${screenName}-${imgIdx + 1}.jpg`;
          const base64Data: any = img.image.split(',')[1];
          assetsFolder?.file(imageName, base64Data, { base64: true });
        }
      });
    }
  });

  // Add component markdown files
  components.value.forEach((component) => {
    const componentFileName = component.name.replace(/\s+/g, '_');
    const markdown = generateComponentMarkdown(component);
    componentsFolder?.file(`${componentFileName}.md`, markdown);
  });

  // Add screen markdown files
  screens.value.forEach((screen) => {
    const fileName = screen.route.replace(/^\//, '').replace(/\//g, '-') || 'Home';
    const markdown = generateScreenMarkdown(screen);
    screensFolder?.file(`${fileName}.md`, markdown);
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
