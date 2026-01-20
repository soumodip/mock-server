<template>
  <div v-if="canWrite()" class="min-h-screen bg-[#1a1d2e] p-6">
    <ModalsProjectSelector
      :show="showProjectSelector"
      @close="handleProjectSelectorClose"
      @select="handleProjectSelect"
    />

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div class="bg-[#242736] rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium text-gray-200">Error</h2>
            <button @click="handleErrorModalClose" class="text-gray-400 hover:text-gray-300">
              <Icon name="mdi:close" class="w-5 h-5" />
            </button>
          </div>
          <div class="text-gray-300 text-sm">
            <p>{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto">
      <div class="mb-6 flex justify-between items-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 text-gray-300 hover:text-gray-100 transition-colors text-sm"
        >
          <Icon name="weui:back-filled" class="w-4 h-4" />
          Back
        </NuxtLink>
        <button v-if="isAuthEnabled" @click="handleLogout" class="inline-flex items-center gap-1.5 text-gray-300 hover:text-red-400 transition-colors text-xs">
          <Icon name="ic:baseline-logout" class="w-4 h-4" />
          Logout
        </button>
      </div>

      <div class="bg-[#242736] rounded-xl shadow-lg p-6">
        <h1 class="text-xl font-medium text-gray-200 mb-6">
          {{ isNew ? 'Create New Object' : 'Edit Object' }}
        </h1>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Object Name <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="User"
              class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Describe what this object represents..."
              class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm placeholder-gray-500 resize-none"
            />
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="toggleIsEntity"
              class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
              :class="form.isEntity
                ? 'bg-purple-600 border-purple-600'
                : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
            >
              <Icon
                name="mdi:check"
                class="w-4 h-4 text-white transition-all duration-200"
                :class="form.isEntity ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
              />
            </button>
            <label class="text-sm font-medium text-gray-300 cursor-pointer" @click="toggleIsEntity">
              Is Entity
            </label>
          </div>

          <div v-if="form.isEntity" class="flex items-center gap-3 mb-6">
            <button
              type="button"
              @click="form.isAdminPanelPage = !form.isAdminPanelPage"
              class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
              :class="form.isAdminPanelPage
                ? 'bg-purple-600 border-purple-600'
                : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
            >
              <Icon
                name="mdi:check"
                class="w-4 h-4 text-white transition-all duration-200"
                :class="form.isAdminPanelPage ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
              />
            </button>
            <label class="text-sm font-medium text-gray-300 cursor-pointer" @click="form.isAdminPanelPage = !form.isAdminPanelPage">
              Enable Admin Panel Page
            </label>
          </div>

          <div v-if="form.isEntity && form.isAdminPanelPage" class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-3">
              Allowed Operations
            </label>
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  @click="toggleOperation('GET')"
                  class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                  :class="form.allowedOperations.includes('GET')
                    ? 'bg-purple-600 border-purple-600'
                    : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                >
                  <Icon
                    name="mdi:check"
                    class="w-4 h-4 text-white transition-all duration-200"
                    :class="form.allowedOperations.includes('GET') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                  />
                </button>
                <label class="text-sm text-gray-300 cursor-pointer" @click="toggleOperation('GET')">
                  GET
                </label>
              </div>

              <div class="flex items-center gap-3">
                <button
                  type="button"
                  @click="toggleOperation('POST')"
                  class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                  :class="form.allowedOperations.includes('POST')
                    ? 'bg-purple-600 border-purple-600'
                    : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                >
                  <Icon
                    name="mdi:check"
                    class="w-4 h-4 text-white transition-all duration-200"
                    :class="form.allowedOperations.includes('POST') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                  />
                </button>
                <label class="text-sm text-gray-300 cursor-pointer" @click="toggleOperation('POST')">
                  POST
                </label>
              </div>

              <div class="flex items-center gap-3">
                <button
                  type="button"
                  @click="toggleOperation('PUT')"
                  class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                  :class="form.allowedOperations.includes('PUT')
                    ? 'bg-purple-600 border-purple-600'
                    : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                >
                  <Icon
                    name="mdi:check"
                    class="w-4 h-4 text-white transition-all duration-200"
                    :class="form.allowedOperations.includes('PUT') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                  />
                </button>
                <label class="text-sm text-gray-300 cursor-pointer" @click="toggleOperation('PUT')">
                  PUT/PATCH
                </label>
              </div>

              <div class="flex items-center gap-3">
                <button
                  type="button"
                  @click="toggleOperation('DELETE')"
                  class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                  :class="form.allowedOperations.includes('DELETE')
                    ? 'bg-purple-600 border-purple-600'
                    : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                >
                  <Icon
                    name="mdi:check"
                    class="w-4 h-4 text-white transition-all duration-200"
                    :class="form.allowedOperations.includes('DELETE') ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                  />
                </button>
                <label class="text-sm text-gray-300 cursor-pointer" @click="toggleOperation('DELETE')">
                  DELETE
                </label>
              </div>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-300">
                Fields <span class="text-red-400">*</span>
              </label>
              <button
                type="button"
                @click="addField"
                class="text-sm text-gray-300 hover:text-gray-100 flex items-center gap-1"
              >
                <Icon name="mdi:plus" class="w-4 h-4" />
                Add Field
              </button>
            </div>
            <div v-if="form.fields && form.fields.length > 0" class="space-y-3">
              <div
                v-for="(field, index) in form.fields"
                :key="index"
                class="border border-gray-600 rounded-xl p-4 space-y-3 bg-[#1f2230]"
              >
                <div class="flex gap-2 items-start">
                  <input
                    v-model="field.name"
                    type="text"
                    placeholder="Field name"
                    class="flex-1 px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm placeholder-gray-500"
                  />
                  <CommonDropdown
                    v-model="field.type"
                    :options="fieldTypeOptions"
                    placeholder="Type"
                    @change="() => handleTypeChange(index)"
                  />
                  <label class="flex items-center gap-2 px-3 py-2 cursor-pointer">
                    <button
                      type="button"
                      @click="field.required = !field.required"
                      class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                      :class="field.required
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                    >
                      <Icon
                        name="mdi:check"
                        class="w-4 h-4 text-white transition-all duration-200"
                        :class="field.required ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                      />
                    </button>
                    <span class="text-sm text-gray-300">Required</span>
                  </label>
                  <button
                    type="button"
                    @click="removeField(index)"
                    class="p-1.5 text-red-400 rounded transition-colors"
                  >
                    <Icon name="mdi:delete" class="w-5 h-5" />
                  </button>
                </div>

                <div v-if="field.type === 'object' || field.type === 'array'" class="">
                  <label class="block text-sm font-medium text-gray-400 mb-1">
                    Reference Object
                  </label>
                  <CommonDropdown
                    v-model="field.ref as string"
                    :options="availableObjectOptions"
                    placeholder="Select an object"
                  />
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 border-2 border-dashed border-gray-600 rounded-xl bg-[#1f2230]">
              <Icon name="mdi:cube-outline" class="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p class="text-gray-400 text-sm">No fields added yet. Click "Add Field" to get started.</p>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 px-3 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm"
            >
              <Icon v-if="loading" name="mdi:loading" class="w-4 h-4 animate-spin" />
              <span>{{ isNew ? 'Create' : 'Update' }}</span>
            </button>
            <NuxtLink
              to="/"
              class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-center text-sm"
            >
              Cancel
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useObjectStore } from '~/stores/object';
import { useProjectStore } from '~/stores/project';
import type { ObjectField } from '~/stores/object';

const route = useRoute();
const router = useRouter();
const objectStore = useObjectStore();
const projectStore = useProjectStore();

// Auth composable
const { logout, isAuthEnabled, canWrite, canDelete } = useAuth();

const handleLogout = () => {
  logout();
};

const isNew = computed(() => route.params.id === 'new');
const loading = ref(false);
const showProjectSelector = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref('');

const form = reactive({
  name: '',
  description: '',
  fields: [] as ObjectField[],
  isEntity: false,
  isAdminPanelPage: false,
  allowedOperations: ['GET', 'POST', 'PUT', 'DELETE'] as ('GET' | 'POST' | 'PUT' | 'DELETE')[],
});

const fieldTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Object (Reference)', value: 'object' },
  { label: 'Object', value: 'object-json' },
  { label: 'Array (of Objects)', value: 'array' },
  { label: 'Array (of Strings)', value: 'array-string' },
  { label: 'Array (of Numbers)', value: 'array-number' },
];

const availableObjects = computed(() => {
  return objectStore.objects.filter(obj => {
    // Filter by current project
    if (obj.projectId !== projectStore.selectedProjectId) return false;
    // Exclude self-reference for existing objects
    if (!isNew.value && obj.id === route.params.id) return false;
    return true;
  });
});

const availableObjectOptions = computed(() => {
  return availableObjects.value.map(obj => ({
    label: obj.name,
    value: obj.id
  }));
});

onMounted(async () => {
  await objectStore.fetchObjects();

  if (!isNew.value) {
    // For existing object, load it first and auto-select the project
    try {
      const object = await objectStore.fetchObject(route.params.id as string);

      // Auto-select the project from the object
      if (object.projectId) {
        projectStore.selectProject(object.projectId);
      }

      Object.assign(form, {
        name: object.name,
        description: object.description || '',
        fields: object.fields || [],
        isEntity: object.isEntity || false,
        isAdminPanelPage: object.isAdminPanelPage || false,
        allowedOperations: object.allowedOperations || ['GET', 'POST', 'PUT', 'DELETE'],
      });
    } catch (error) {
      console.error('Failed to load object:', error);
      // Show error modal if object doesn't exist
      errorMessage.value = 'Object does not exist';
      showErrorModal.value = true;
    }
  } else {
    // For new object, check if a project is selected
    if (!projectStore.selectedProjectId) {
      showProjectSelector.value = true;
    }
  }
});

const addField = () => {
  form.fields.push({
    name: '',
    type: 'string',
    required: false,
  });
};

const removeField = (index: number) => {
  form.fields.splice(index, 1);
};

const handleTypeChange = (index: number) => {
  const field = form.fields[index];
  if (field!.type !== 'object' && field!.type !== 'array') {
    delete field!.ref;
  }
};

const toggleIsEntity = () => {
  form.isEntity = !form.isEntity;
  if (!form.isEntity) {
    form.isAdminPanelPage = false;
    form.allowedOperations = ['GET', 'POST', 'PUT', 'DELETE'];
  }
};

const toggleOperation = (operation: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
  const index = form.allowedOperations.indexOf(operation);
  if (index > -1) {
    form.allowedOperations.splice(index, 1);
  } else {
    form.allowedOperations.push(operation);
  }
};

const handleProjectSelectorClose = () => {
  showProjectSelector.value = false;
  router.push('/');
};

const handleProjectSelect = (projectId: string) => {
  projectStore.selectProject(projectId);
  showProjectSelector.value = false;
};

const handleErrorModalClose = () => {
  showErrorModal.value = false;
  router.push('/');
};

const handleSubmit = async () => {
  if (form.fields.length === 0) {
    alert('Please add at least one field');
    return;
  }

  loading.value = true;
  try {
    if (!projectStore.selectedProjectId) {
      alert('Please select a project first');
      loading.value = false;
      return;
    }

    const payload = {
      objectIndex: -1, // Will be set in the backend anyways
      projectId: projectStore.selectedProjectId,
      name: form.name,
      description: form.description,
      fields: form.fields.filter(f => f.name),
      isEntity: form.isEntity,
      isAdminPanelPage: form.isEntity ? form.isAdminPanelPage : false,
      allowedOperations: form.isEntity && form.isAdminPanelPage ? form.allowedOperations : undefined,
    };

    if (isNew.value) {
      await objectStore.createObject(payload);
    } else {
      await objectStore.updateObject(route.params.id as string, payload);
    }

    router.push('/');
  } catch (error) {
    console.error('Failed to save object:', error);
    alert('Failed to save object. Please check your input and try again.');
  } finally {
    loading.value = false;
  }
};
</script>
