<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 border border-gray-700">
      <div class="sticky top-0 bg-[#242736] border-b border-gray-700 p-6 flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-200">
          {{ isEdit ? 'Edit Component' : 'Add Component' }}
        </h3>
        <button
          @click="$emit('close')"
          class="p-1.5 text-gray-400 hover:text-gray-300 rounded-full transition-colors"
        >
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-5">
        <!-- Component Name -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Component Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localComponent.name"
            type="text"
            placeholder="e.g., AppHeader, ProductCard, LoginForm"
            class="w-full px-4 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
          />
        </div>

        <!-- Images Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">User Interface Images</label>
          <div class="space-y-3">
            <div
              v-for="(img, idx) in localComponent.images"
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
                      placeholder="e.g., Default State, Hover State, Mobile View"
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
                  v-if="localComponent.images.length > 1"
                  type="button"
                  @click="removeImage(idx)"
                  class="p-1.5 text-gray-400 hover:text-red-400 rounded-full transition-colors"
                >
                  <Icon name="mdi:delete-outline" class="w-4 h-4" />
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

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            v-model="localComponent.description"
            placeholder="Reusable card component displaying product information with image, title, price..."
            rows="3"
            class="w-full px-4 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
          ></textarea>
        </div>

        <!-- API Endpoints -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">API Endpoints</label>
          <div class="space-y-2">
            <div
              v-for="(endpoint, idx) in localComponent.endpoints"
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
          {{ isEdit ? 'Update' : 'Add' }} Component
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { ApiMock } from '~/stores/api';
import type { Component, PageImage } from '~/components/modals/prompts/Screen.vue';
import CommonDropdown from '~/components/common/Dropdown.vue';

const props = defineProps<{
  show: boolean;
  component: Component | null;
  apis: ApiMock[];
  isEdit: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [component: Component];
}>();

const fileInputRefs = ref<Map<number, HTMLInputElement | null>>(new Map());
const editingLabelIndex = ref<Set<number>>(new Set());
const originalLabels = ref<Map<number, string>>(new Map());
const localComponent = ref<Component>({
  name: '',
  images: [{ label: '', image: null, imageName: '' }],
  description: '',
  endpoints: [null]
});

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
  if (newVal && props.component) {
    localComponent.value = JSON.parse(JSON.stringify(props.component));
    // Initialize endpointIds from the endpoints
    endpointIds.value = localComponent.value.endpoints.map(ep => ep?.id ?? '');
    editingLabelIndex.value.clear();
  } else if (newVal && !props.component) {
    localComponent.value = {
      name: '',
      images: [{ label: '', image: null, imageName: '' }],
      description: '',
      endpoints: [null]
    };
    endpointIds.value = [''];
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
    localComponent.value.images[idx]!.imageName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      localComponent.value.images[idx]!.image = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const addImage = () => {
  localComponent.value.images.push({ label: '', image: null, imageName: '' });
};

const removeImage = (idx: number) => {
  localComponent.value.images.splice(idx, 1);
  fileInputRefs.value.delete(idx);
  editingLabelIndex.value.delete(idx);
};

const startEditingLabel = (idx: number) => {
  originalLabels.value.set(idx, localComponent.value.images[idx]?.label || '');
  editingLabelIndex.value.add(idx);
};

const stopEditingLabel = (idx: number) => {
  editingLabelIndex.value.delete(idx);
  originalLabels.value.delete(idx);
};

const cancelEditingLabel = (idx: number) => {
  const original = originalLabels.value.get(idx);
  if (original !== undefined && localComponent.value.images[idx]) {
    localComponent.value.images[idx]!.label = original;
  }
  editingLabelIndex.value.delete(idx);
  originalLabels.value.delete(idx);
};

const handleEndpointChange = (index: number, apiId: string | number) => {
  if (apiId === '' || apiId === null) {
    localComponent.value.endpoints[index] = null;
  } else {
    const selectedApi = props.apis.find(api => api.id === apiId);
    localComponent.value.endpoints[index] = selectedApi || null;
  }
};

const addEndpoint = () => {
  localComponent.value.endpoints.push(null);
  endpointIds.value.push('');
};

const removeEndpoint = (index: number) => {
  localComponent.value.endpoints.splice(index, 1);
  endpointIds.value.splice(index, 1);
};

const handleSave = () => {
  emit('save', JSON.parse(JSON.stringify(localComponent.value)));
};
</script>
