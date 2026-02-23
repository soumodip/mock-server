<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-lg border border-gray-700 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-200">Manage Environments</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Integrations List -->
      <div v-if="integrations.length > 0" class="space-y-2">
        <h4 class="text-sm font-medium text-gray-400 mb-3">Edit Environment Names</h4>
        <div
          v-for="integration in integrations"
          :key="integration.id"
          class="flex items-center justify-between p-2 bg-[#2d3142] rounded-lg hover:bg-[#353849] transition-colors"
        >
          <div class="flex-1" v-if="editingId !== integration.id">
            <span class="text-gray-200 text-xs ml-2">{{ integration.name }}</span>
          </div>
          <div class="flex-1" v-else>
            <input
              v-model="editingName"
              type="text"
              class="w-full px-3 py-1.5 border border-gray-600 bg-[#1a1d2e] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              @keyup.enter="handleSaveEdit(integration.id)"
              @keyup.esc="cancelEdit"
            />
          </div>
          <div class="flex gap-2 ml-3">
            <template v-if="editingId !== integration.id">
              <button
                @click="startEdit(integration.id, integration.name)"
                class="p-1.5 text-gray-400 hover:text-indigo-400 transition-colors rounded"
                title="Edit integration name"
              >
                <Icon name="mdi:pencil" class="w-4 h-4" />
              </button>
              <button
                @click="handleDeleteIntegration(integration.id, integration.name)"
                :disabled="loading"
                class="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded disabled:opacity-50"
                title="Delete integration"
              >
                <Icon name="mdi:delete" class="w-4 h-4" />
              </button>
            </template>
            <template v-else>
              <button
                @click="handleSaveEdit(integration.id)"
                :disabled="!editingName.trim() || loading"
                class="p-1.5 text-gray-400 hover:text-green-400 transition-colors rounded disabled:opacity-50"
                title="Save"
              >
                <Icon name="mdi:check" class="w-4 h-4" />
              </button>
              <button
                @click="cancelEdit"
                class="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded"
                title="Cancel"
              >
                <Icon name="mdi:close" class="w-4 h-4" />
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8">
        <Icon name="mdi:folder-off-outline" class="w-12 h-12 text-gray-600 mx-auto mb-2" />
        <p class="text-gray-400 text-sm">No integrations available</p>
      </div>

      <!-- Error Message -->
      <p v-if="error" class="text-red-400 text-sm mt-4">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Integration {
  id: string;
  name: string;
  projectId: string;
  isActive: boolean;
  allowedOrigins: string[];
  primaryFont?: string;
  codeFont?: string;
  heading?: string;
  allowPostmanDownload?: boolean;
  expandToFullPage?: boolean;
  createdAt: string;
  updatedAt: string;
}

const props = defineProps<{
  show: boolean;
  integrations: Integration[];
}>();

const emit = defineEmits<{
  close: [];
  update: [];
}>();

const { confirm } = useConfirmDialog();
const editingId = ref<string | null>(null);
const editingName = ref('');
const loading = ref(false);
const error = ref('');

const startEdit = (id: string, name: string) => {
  editingId.value = id;
  editingName.value = name;
  error.value = '';
};

const cancelEdit = () => {
  editingId.value = null;
  editingName.value = '';
  error.value = '';
};

const handleSaveEdit = async (id: string) => {
  if (!editingName.value.trim()) return;

  const integration = props.integrations.find(i => i.id === id);
  if (!integration) return;

  const oldName = integration.name;
  const newName = editingName.value.trim();

  // Check if name is the same
  if (oldName === newName) {
    cancelEdit();
    return;
  }

  // Check for duplicates
  if (props.integrations.some(i => i.name === newName && i.id !== id)) {
    error.value = 'Integration name already exists';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await $fetch(`/api/integrations/${id}`, {
      method: 'PUT',
      body: {
        name: newName,
      },
    });

    emit('update');
    cancelEdit();
  } catch (err) {
    error.value = 'Failed to update integration name';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleDeleteIntegration = async (id: string, name: string) => {
  // Confirm deletion
  if (!await confirm({ title: 'Delete Integration', message: `Are you sure you want to delete the integration "${name}"? This action cannot be undone.` })) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await $fetch(`/api/integrations/${id}`, {
      method: 'DELETE',
    });

    emit('update');
  } catch (err) {
    error.value = 'Failed to delete integration';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

watch(() => props.show, (newVal) => {
  if (!newVal) {
    editingId.value = null;
    editingName.value = '';
    error.value = '';
  }
});
</script>
