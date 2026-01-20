<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 border border-gray-700">
      <div class="sticky top-0 bg-[#242736] border-b border-gray-700 p-6 flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-200">
          {{ isEdit ? 'Edit Page' : 'Add Page' }}
        </h3>
        <button
          @click="$emit('close')"
          class="p-1.5 text-gray-400 hover:text-gray-300 rounded-full transition-colors"
        >
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-5">
        <!-- Images Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">User Interface Images</label>
          <div class="space-y-3">
            <div
              v-for="(img, idx) in localPage.images"
              :key="idx"
              class="border border-gray-600 rounded-xl p-4 bg-[#2d3142]"
            >
              <div class="flex justify-between items-start mb-3">
                <!-- Label Section -->
                <div class="flex-1">
                  <!-- Add Label Button (when no label exists and not editing) -->
                  <button
                    v-if="!img.label && !editingLabelIndex.has(idx)"
                    type="button"
                    @click="startEditingLabel(idx)"
                    class="flex items-center gap-1 text-gray-400 hover:text-gray-300 transition-colors text-sm"
                  >
                    <Icon name="mdi:plus" class="w-4 h-4" />
                    <span>Label</span>
                  </button>

                  <!-- Existing Label (when label exists and not editing) -->
                  <div
                    v-else-if="img.label && !editingLabelIndex.has(idx)"
                    class="flex items-center gap-2"
                  >
                    <span class="text-sm font-medium text-gray-300">{{ img.label }}</span>
                    <button
                      type="button"
                      @click="startEditingLabel(idx)"
                      class="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <Icon name="mdi:pencil" class="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <!-- Label Input (when editing) -->
                  <div
                    v-else-if="editingLabelIndex.has(idx)"
                    class="flex items-center gap-2"
                  >
                    <input
                      v-model="img.label"
                      type="text"
                      placeholder="e.g., Hero Section, Mobile View, Modal State"
                      class="flex-1 px-3 py-1.5 border border-gray-600 bg-[#353849] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
                      @keyup.enter="stopEditingLabel(idx)"
                    />
                    <button
                      type="button"
                      @click="stopEditingLabel(idx)"
                      class="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <Icon name="mdi:check" class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      @click="cancelEditingLabel(idx)"
                      class="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <Icon name="mdi:close" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Remove Button -->
                <button
                  v-if="localPage.images.length > 1"
                  type="button"
                  @click="removeImage(idx)"
                  class="p-1.5 text-gray-400 hover:text-red-400 rounded-full transition-colors"
                >
                  <Icon name="mdi:close" class="w-4 h-4" />
                </button>
              </div>

              <!-- Image Preview/Upload -->
              <div class="flex justify-between items-start gap-3">
                <div class="flex justify-start" style="min-width: 150px;">
                  <input
                    type="file"
                    accept="image/*"
                    @change="(e) => handleImageUpload(e, idx)"
                    class="hidden"
                    :ref="(el) => setFileInputRef(el, idx)"
                  />
                  <div
                    v-if="img.image"
                    class="cursor-pointer hover:opacity-80 transition-opacity"
                    @click="triggerFileInput(idx)"
                  >
                    <img
                      :src="img.image"
                      alt="Preview"
                      class="h-auto object-contain rounded-lg"
                      style="max-height: 100px; max-width: 100%;"
                    />
                  </div>
                  <button
                    v-else
                    type="button"
                    @click="triggerFileInput(idx)"
                    class="w-full h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-gray-300 hover:border-gray-500 transition-colors"
                  >
                    <Icon name="mdi:image-plus" class="w-6 h-6 mb-1" />
                    <span class="text-xs">Upload</span>
                  </button>
                </div>

                <!-- Delete Group Button -->
                <button
                  v-if="img.image && localPage.images.length > 1"
                  type="button"
                  @click="removeImage(idx)"
                  class="p-1.5 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Delete image group"
                >
                  <Icon name="mdi:delete-outline" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Add Image Button -->
            <button
              type="button"
              @click="addImage"
              class="w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-gray-300 hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="mdi:plus" class="w-4 h-4" />
              Add Another Image
            </button>
          </div>
        </div>

        <!-- Route -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Route Path <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localPage.route"
            type="text"
            placeholder="/about"
            class="w-full px-4 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            v-model="localPage.description"
            placeholder="Landing page featuring hero section, feature highlights..."
            rows="3"
            class="w-full px-4 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
          ></textarea>
        </div>

        <!-- API Endpoints -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">API Endpoints</label>
          <div class="space-y-2">
            <div
              v-for="(endpoint, idx) in localPage.endpoints"
              :key="idx"
              class="flex gap-2"
            >
              <CommonDropdown
                v-model="endpointIds[idx]!"
                :options="getApiOptionsForIndex(idx)"
                placeholder="Select endpoint"
                @change="handleEndpointChange(idx, $event)"
                class="flex-1"
              />
              <button
                type="button"
                @click="removeEndpoint(idx)"
                class="p-2 text-gray-400 hover:text-red-400 hover:bg-[#2d3142] rounded-full transition-colors"
              >
                <Icon name="mdi:close" class="w-5 h-5" />
              </button>
            </div>
            <button
              v-if="!allEndpointsSelected"
              type="button"
              @click="addEndpoint"
              class="px-4 py-2 bg-[#2d3142] hover:bg-[#353849] text-gray-300 text-sm rounded-full transition-colors flex items-center gap-1.5"
            >
              <Icon name="mdi:plus" class="w-4 h-4" />
              Add Endpoint
            </button>
          </div>
        </div>

        <!-- Advanced Settings Toggle -->
        <div>
          <button
            type="button"
            @click="showAdvanced = !showAdvanced"
            class="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
          >
            <Icon :name="showAdvanced ? 'mdi:chevron-down' : 'mdi:chevron-right'" class="w-4 h-4" />
            Advanced Settings
          </button>
        </div>

        <!-- Advanced Settings Content -->
        <div v-if="showAdvanced" class="space-y-4 pl-4 border-l-2 border-indigo-600">
          <!-- Components -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Components</label>
            <div class="space-y-2">
              <div
                v-for="(component, idx) in localPage.components"
                :key="idx"
                class="flex gap-2"
              >
                <CommonDropdown
                  v-model="componentIds[idx]!"
                  :options="getComponentOptionsForIndex(idx)"
                  placeholder="Select component"
                  @change="handleComponentChange(idx, $event)"
                  class="flex-1"
                />
                <button
                  type="button"
                  @click="removeComponent(idx)"
                  class="p-2 text-gray-400 hover:text-red-400 hover:bg-[#2d3142] rounded-full transition-colors"
                >
                  <Icon name="mdi:close" class="w-5 h-5" />
                </button>
              </div>
              <button
                v-if="!allComponentsSelected && availableComponents.length > 0"
                type="button"
                @click="addComponent"
                class="px-4 py-2 bg-[#2d3142] hover:bg-[#353849] text-gray-300 text-sm rounded-full transition-colors flex items-center gap-1.5"
              >
                <Icon name="mdi:plus" class="w-4 h-4" />
                Add Component
              </button>
              <p v-else-if="availableComponents.length === 0" class="text-xs text-gray-500">
                No components available. Add components first to select them here.
              </p>
            </div>
          </div>

          <!-- SEO -->
          <div>
            <div class="flex flex-row justify-between w-full items-center">
              <label class="block text-sm font-medium text-gray-300 mb-2">SEO</label>
              <div v-if="`${localPage.description}`.trim() !== '' && llmConfig" class="mb-3">
                <button
                  type="button"
                  @click="generateSeo"
                  :disabled="isGeneratingSeo"
                  class="inline-flex items-center gap-2 px-3 py-1.5 disabled:from-gray-600 disabled:to-gray-600 text-white text-sm rounded-lg transition-all"
                >
                  <Icon
                    :name="isGeneratingSeo ? 'mdi:loading' : 'mdi:auto-fix'"
                    :class="['w-4 h-4', isGeneratingSeo ? 'animate-spin' : '']"
                  />
                  <span v-if="isGeneratingSeo">Generating...</span>
                  <span v-else>Generate with {{ providerDisplayName }}</span>
                </button>
              </div>
            </div>

            <textarea
              v-model="localPage.seo"
              placeholder="Title, description, keywords..."
              rows="3"
              class="w-full px-4 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="sticky bottom-0 bg-[#242736] border-t border-gray-700 p-6 flex justify-end gap-2">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSave"
          class="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors text-sm"
        >
          {{ isEdit ? 'Update' : 'Add' }} Page
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import type { ApiMock } from '~/stores/api';
import CommonDropdown from '~/components/common/Dropdown.vue';

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'azure' | 'ollama';
  config: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    endpoint?: string;
    deploymentName?: string;
    apiVersion?: string;
  };
  globalParams?: {
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
  };
}

export interface PageImage {
  label: string;
  image: string | null;
  imageName: string;
}

export interface Page {
  images: PageImage[];
  route: string;
  description: string;
  endpoints: any[]; // Full API objects
  components: Component[]; // Full Component objects
  seo: string;
}

export interface Component {
  name: string;
  images: PageImage[];
  description: string;
  endpoints: any[]; // Full API objects
}

const props = defineProps<{
  show: boolean;
  page: Page | null;
  apis: ApiMock[];
  availableComponents: Component[];
  isEdit: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [page: Page];
}>();

const fileInputRefs = ref<Map<number, HTMLInputElement | null>>(new Map());
const editingLabelIndex = ref<Set<number>>(new Set());
const originalLabels = ref<Map<number, string>>(new Map());
const showAdvanced = ref(false);
const llmConfig = ref<LLMConfig | null>(null);
const isGeneratingSeo = ref(false);
const localPage = ref<Page>({
  images: [{ label: '', image: null, imageName: '' }],
  route: '',
  description: '',
  endpoints: [null],
  components: [null] as any,
  seo: ''
});

// Track component IDs separately for the dropdown
const componentIds = ref<(string | number | null)[]>(['']);

// Create options for the component dropdown, filtering out already selected components
const getComponentOptionsForIndex = (currentIndex: number) => {
  const selectedIds = new Set(
    componentIds.value
      .filter((id, idx) => id !== '' && id !== null && idx !== currentIndex)
  );
  return props.availableComponents
    .map(comp => ({
      label: comp.name,
      value: comp.name // Use name as identifier since Component doesn't have an id
    }))
    .filter(opt => !selectedIds.has(opt.value));
};

// Check if all components have been selected
const allComponentsSelected = computed(() => {
  const selectedCount = componentIds.value.filter(id => id !== '' && id !== null).length;
  return selectedCount >= props.availableComponents.length;
});

const handleComponentChange = (index: number, componentName: string | number) => {
  if (componentName === '' || componentName === null) {
    localPage.value.components[index] = null as any;
  } else {
    const selectedComponent = props.availableComponents.find(comp => comp.name === componentName);
    localPage.value.components[index] = selectedComponent || (null as any);
  }
};

const addComponent = () => {
  localPage.value.components.push(null as any);
  componentIds.value.push('');
};

const removeComponent = (index: number) => {
  localPage.value.components.splice(index, 1);
  componentIds.value.splice(index, 1);
};

// Track endpoint IDs separately for the dropdown
const endpointIds = ref<(string | number | null)[]>(['']);

// Create options for the dropdown, filtering out already selected endpoints
const getApiOptionsForIndex = (currentIndex: number) => {
  const selectedIds = new Set(
    endpointIds.value
      .filter((id, idx) => id !== '' && id !== null && idx !== currentIndex)
  );
  return props.apis
    .filter(api => !selectedIds.has(api.id))
    .map(api => ({
      label: `${api.method} ${api.endpoint}`,
      value: api.id
    }));
};

// Check if all endpoints have been selected
const allEndpointsSelected = computed(() => {
  const selectedCount = endpointIds.value.filter(id => id !== '' && id !== null).length;
  return selectedCount >= props.apis.length;
});

watch(() => props.show, (newVal) => {
  if (newVal && props.page) {
    localPage.value = JSON.parse(JSON.stringify(props.page));
    // Handle migration from old string format to new array format
    if (typeof (localPage.value.components as any) === 'string') {
      localPage.value.components = [null] as any;
    }
    showAdvanced.value = !!(localPage.value.components?.some((c: any) => c !== null) || localPage.value.seo);
    // Initialize endpointIds from the endpoints
    endpointIds.value = localPage.value.endpoints.map(ep => ep?.id ?? '');
    // Initialize componentIds from the components
    componentIds.value = localPage.value.components.map((comp: any) => comp?.name ?? '');
    editingLabelIndex.value.clear();
  } else if (newVal && !props.page) {
    localPage.value = {
      images: [{ label: '', image: null, imageName: '' }],
      route: '',
      description: '',
      endpoints: [null],
      components: [null] as any,
      seo: ''
    };
    endpointIds.value = [''];
    componentIds.value = [''];
    showAdvanced.value = false;
    fileInputRefs.value.clear();
    editingLabelIndex.value.clear();
  }
});

const setFileInputRef = (el: any, idx: number) => {
  if (el) {
    fileInputRefs.value.set(idx, el as HTMLInputElement);
  }
};

const triggerFileInput = (idx: number) => {
  fileInputRefs.value.get(idx)?.click();
};

const handleImageUpload = (event: Event, idx: number) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    localPage.value.images[idx]!.imageName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      localPage.value.images[idx]!.image = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const addImage = () => {
  localPage.value.images.push({ label: '', image: null, imageName: '' });
};

const removeImage = (idx: number) => {
  localPage.value.images.splice(idx, 1);
  fileInputRefs.value.delete(idx);
  editingLabelIndex.value.delete(idx);
};

const startEditingLabel = (idx: number) => {
  originalLabels.value.set(idx, localPage.value.images[idx]?.label || '');
  editingLabelIndex.value.add(idx);
};

const stopEditingLabel = (idx: number) => {
  editingLabelIndex.value.delete(idx);
  originalLabels.value.delete(idx);
};

const cancelEditingLabel = (idx: number) => {
  const original = originalLabels.value.get(idx);
  if (original !== undefined && localPage.value.images[idx]) {
    localPage.value.images[idx]!.label = original;
  }
  editingLabelIndex.value.delete(idx);
  originalLabels.value.delete(idx);
};

const handleEndpointChange = (index: number, apiId: string | number) => {
  if (apiId === '' || apiId === null) {
    localPage.value.endpoints[index] = null;
  } else {
    const selectedApi = props.apis.find(api => api.id === apiId);
    localPage.value.endpoints[index] = selectedApi || null;
  }
};

const addEndpoint = () => {
  localPage.value.endpoints.push(null);
  endpointIds.value.push('');
};

const removeEndpoint = (index: number) => {
  localPage.value.endpoints.splice(index, 1);
  endpointIds.value.splice(index, 1);
};

const handleSave = () => {
  emit('save', JSON.parse(JSON.stringify(localPage.value)));
};

// Fetch LLM config on mount
const fetchLLMConfig = async () => {
  try {
    const response = await fetch('/api/llm');
    if (response.ok) {
      const data = await response.json();
      llmConfig.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch LLM config:', error);
  }
};

onMounted(() => {
  fetchLLMConfig();
});

// Also fetch when modal opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    fetchLLMConfig();
  }
});

const providerDisplayName = computed(() => {
  if (!llmConfig.value) return '';
  const names: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    azure: 'Azure OpenAI',
    ollama: 'Ollama'
  };
  return names[llmConfig.value.provider] || llmConfig.value.provider;
});

const generateSeo = async () => {
  if (!llmConfig.value || isGeneratingSeo.value) return;

  isGeneratingSeo.value = true;

  try {
    const pageContext = {
      route: localPage.value.route,
      description: localPage.value.description,
      components: localPage.value.components,
      endpoints: localPage.value.endpoints
        .filter(ep => ep)
        .map(ep => `${ep.method} ${ep.endpoint}`)
    };

    const prompt = `You are an SEO expert. Generate SEO metadata for a web page with the following details:

Route: ${pageContext.route || 'Not specified'}
Description: ${pageContext.description || 'Not specified'}
Components: ${pageContext.components || 'Not specified'}
API Endpoints used: ${pageContext.endpoints.length > 0 ? pageContext.endpoints.join(', ') : 'None'}

Generate a concise SEO recommendation including:
- Page title (50-60 characters)
- Meta description (150-160 characters)
- 3-5 relevant keywords

Format your response as plain text with clear labels for each section. Keep it concise and actionable.`;

    const response = await fetch('/api/llm/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: prompt }
        ],
        responseFormat: 'text'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate SEO');
    }

    const result = await response.json();
    localPage.value.seo = result.content;

    // Auto-expand advanced settings to show the generated SEO
    showAdvanced.value = true;
  } catch (error) {
    console.error('Failed to generate SEO:', error);
  } finally {
    isGeneratingSeo.value = false;
  }
};
</script>
