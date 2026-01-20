<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-200 ml-1">Edit Group</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSave" class="space-y-4">
        <!-- Group Name -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Group Name
          </label>
          <input
            v-model="formName"
            type="text"
            placeholder="Enter group name"
            class="w-full px-3 py-2 border border-gray-600 bg-[#1a1d2e] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            required
          />
        </div>

        <!-- isAdminPanelPage Checkbox -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="formIsAdminPanelPage = !formIsAdminPanelPage"
            class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
            :class="formIsAdminPanelPage
              ? 'bg-indigo-600 border-indigo-600'
              : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
          >
            <Icon
              name="mdi:check"
              class="w-4 h-4 text-white transition-all duration-200"
              :class="formIsAdminPanelPage ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
            />
          </button>
          <label class="text-sm text-gray-300 cursor-pointer" @click="formIsAdminPanelPage = !formIsAdminPanelPage">
            Enable Admin Panel Page
          </label>
        </div>

        <!-- Error Message -->
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <!-- Action Buttons -->
        <div class="flex gap-2 pt-2">
          <button
            type="submit"
            :disabled="!formName.trim() || loading"
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 bg-[#2d3142] text-gray-300 rounded-lg hover:bg-[#353849] transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project, ProjectGroup } from '~/stores/project';
import { normalizeGroup } from '~/stores/project';

const props = defineProps<{
  show: boolean;
  project?: Project | null;
  groupName?: string;
}>();

const emit = defineEmits<{
  close: [];
  update: [];
}>();

const formName = ref('');
const formIsAdminPanelPage = ref(false);
const loading = ref(false);
const error = ref('');

// Find the current group from project
const currentGroup = computed<ProjectGroup | null>(() => {
  if (!props.project?.groups || !props.groupName) return null;
  const group = props.project.groups.find(g => {
    const normalized = normalizeGroup(g);
    return normalized.name === props.groupName;
  });
  return group ? normalizeGroup(group) : null;
});

// Get all normalized groups
const normalizedGroups = computed<ProjectGroup[]>(() => {
  if (!props.project?.groups) return [];
  return props.project.groups.map(g => normalizeGroup(g));
});

// Initialize form when modal opens
watch(() => props.show, (newVal) => {
  if (newVal && currentGroup.value) {
    formName.value = currentGroup.value.name;
    formIsAdminPanelPage.value = currentGroup.value.isAdminPanelPage;
    error.value = '';
  }
}, { immediate: true });

const handleSave = async () => {
  if (!formName.value.trim() || !props.project || !props.groupName) return;

  const newName = formName.value.trim();

  // Check if nothing changed
  if (currentGroup.value?.name === newName && currentGroup.value?.isAdminPanelPage === formIsAdminPanelPage.value) {
    emit('close');
    return;
  }

  // Check for duplicates (if name changed)
  if (currentGroup.value?.name !== newName) {
    const existingNames = normalizedGroups.value.map(g => g.name);
    if (existingNames.includes(newName)) {
      error.value = 'Group name already exists';
      return;
    }
  }

  loading.value = true;
  error.value = '';

  try {
    // Update the groups array
    const updatedGroups: ProjectGroup[] = normalizedGroups.value.map(g => {
      if (g.name === props.groupName) {
        return {
          name: newName,
          isAdminPanelPage: formIsAdminPanelPage.value,
        };
      }
      return g;
    });

    // Update project
    await $fetch(`/api/projects/${props.project.id}`, {
      method: 'PUT',
      body: {
        name: props.project.name,
        isAuth: props.project.isAuth,
        authType: props.project.authType,
        authConfig: props.project.authConfig,
        accessToken: props.project.accessToken,
        groups: updatedGroups,
      },
    });

    // If name changed, update APIs
    if (currentGroup.value?.name !== newName) {
      const apis = await $fetch<any[]>(`/api/mocks?projectId=${props.project.id}`);
      const updatePromises = apis
        .filter((api) => api.group === props.groupName)
        .map((api) =>
          $fetch(`/api/mocks/${api.id}`, {
            method: 'PUT',
            body: {
              ...api,
              group: newName,
            },
          })
        );
      await Promise.all(updatePromises);
    }

    emit('update');
    emit('close');
  } catch (err) {
    error.value = 'Failed to update group';
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>
