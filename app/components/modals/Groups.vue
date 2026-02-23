<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-lg border border-gray-700 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-200 ml-1">Manage Groups</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Add New Group Form -->
      <div class="mb-6">
        <form v-if="canWrite()" @submit.prevent="handleAddGroup">
          <div class="flex flex-col gap-3">
            <div class="flex gap-2">
              <input
                v-model="newGroupName"
                type="text"
                placeholder="Enter group name"
                class="flex-1 px-3 py-2 border border-gray-600 bg-[#1a1d2e] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
                required
              />
              <button
                type="submit"
                :disabled="!newGroupName.trim() || loading"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1.5"
              >
                <Icon name="mdi:plus" class="w-4 h-4" />
                Add
              </button>
            </div>
            <!-- <div class="flex items-center gap-3 ml-1">
              <button
                type="button"
                @click="newGroupIsAdminPanelPage = !newGroupIsAdminPanelPage"
                class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                :class="newGroupIsAdminPanelPage
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
              >
                <Icon
                  name="mdi:check"
                  class="w-4 h-4 text-white transition-all duration-200"
                  :class="newGroupIsAdminPanelPage ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                />
              </button>
              <label class="text-sm text-gray-300 cursor-pointer" @click="newGroupIsAdminPanelPage = !newGroupIsAdminPanelPage">
                Enable Admin Panel Page
              </label>
            </div> -->
          </div>
        </form>
      </div>

      <!-- Groups List -->
      <div v-if="normalizedGroups.length > 0" class="space-y-2">
        <h4 class="text-sm font-medium text-gray-400 mb-3 pl-3">Existing Groups</h4>
        <div
          v-for="(group, index) in normalizedGroups"
          :key="index"
          class="flex items-center justify-between p-2 bg-[#2d3142] rounded-lg hover:bg-[#353849] transition-colors"
        >
          <div class="flex-1" v-if="editingIndex !== index">
            <div class="flex items-center gap-2">
              <span class="text-gray-200 text-xs ml-2">{{ group.name }}</span>
              <span v-if="group.isAdminPanelPage" class="text-xs text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded">Admin Page</span>
            </div>
          </div>
          <div class="flex-1 flex flex-col items-start justify-start" v-else>
            <div class="flex flex-col gap-2">
              <input
                v-model="editingGroupName"
                type="text"
                class="w-full px-3 py-1.5 border border-gray-600 bg-[#1a1d2e] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                @keyup.enter="handleSaveEdit(index)"
                @keyup.esc="cancelEdit"
              />
              <div class="flex items-center gap-3 ml-1 mt-2">
                <button
                  type="button"
                  @click="editingIsAdminPanelPage = !editingIsAdminPanelPage"
                  class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                  :class="editingIsAdminPanelPage
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                >
                  <Icon
                    name="mdi:check"
                    class="w-4 h-4 text-white transition-all duration-200"
                    :class="editingIsAdminPanelPage ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                  />
                </button>
                <label class="text-sm text-gray-300 cursor-pointer" @click="editingIsAdminPanelPage = !editingIsAdminPanelPage">
                  Enable Admin Panel Page
                </label>
              </div>
            </div>
          </div>
          <div class="flex gap-2 ml-3">
            <template v-if="editingIndex !== index">
              <button
                v-if="canWrite()"
                @click="startEdit(index, group)"
                class="p-1.5 text-gray-400 hover:text-indigo-400 transition-colors rounded"
                title="Edit group"
              >
                <Icon name="mdi:pencil" class="w-4 h-4" />
              </button>
              <button
                v-if="canDelete()"
                @click="handleDeleteGroup(index, group.name)"
                :disabled="loading"
                class="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded disabled:opacity-50"
                title="Delete group"
              >
                <Icon name="mdi:delete" class="w-4 h-4" />
              </button>
            </template>
            <template v-else>
              <button
                @click="handleSaveEdit(index)"
                :disabled="!editingGroupName.trim() || loading"
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
        <Icon name="mdi:group-off" class="w-12 h-12 text-gray-600 mx-auto mb-2" />
        <p class="text-gray-400 text-sm">No groups created yet</p>
      </div>

      <!-- Error Message -->
      <p v-if="error" class="text-red-400 text-sm mt-4">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project, ProjectGroup } from '~/stores/project';
import { normalizeGroup, getGroupName } from '~/stores/project';

const props = defineProps<{
  show: boolean;
  project?: Project | null;
}>();

const emit = defineEmits<{
  close: [];
  update: [];
}>();

const newGroupName = ref('');
const newGroupIsAdminPanelPage = ref(false);
const editingIndex = ref<number | null>(null);
const editingGroupName = ref('');
const editingIsAdminPanelPage = ref(false);
const { confirm } = useConfirmDialog();
const loading = ref(false);
const error = ref('');

const groups = computed(() => props.project?.groups || []);

// Normalize groups to always be ProjectGroup objects
const normalizedGroups = computed<ProjectGroup[]>(() => {
  return groups.value.map(g => normalizeGroup(g));
});

const { canWrite, canDelete } = useAuth();

const handleAddGroup = async () => {
  if (!newGroupName.value.trim() || !props.project) return;

  // Check for duplicates
  const existingNames = normalizedGroups.value.map(g => g.name);
  if (existingNames.includes(newGroupName.value.trim())) {
    error.value = 'Group name already exists';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const newGroup: ProjectGroup = {
      name: newGroupName.value.trim(),
      isAdminPanelPage: newGroupIsAdminPanelPage.value,
    };
    const updatedGroups: ProjectGroup[] = [...normalizedGroups.value, newGroup];
    await updateProjectGroups(updatedGroups);
    newGroupName.value = '';
    newGroupIsAdminPanelPage.value = false;
  } catch (err) {
    error.value = 'Failed to add group';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const startEdit = (index: number, group: ProjectGroup) => {
  editingIndex.value = index;
  editingGroupName.value = group.name;
  editingIsAdminPanelPage.value = group.isAdminPanelPage;
  error.value = '';
};

const cancelEdit = () => {
  editingIndex.value = null;
  editingGroupName.value = '';
  editingIsAdminPanelPage.value = false;
  error.value = '';
};

const handleSaveEdit = async (index: number) => {
  if (!editingGroupName.value.trim() || !props.project) return;

  const oldGroup = normalizedGroups.value[index];
  const newName = editingGroupName.value.trim();

  // Check if nothing changed
  if (oldGroup?.name === newName && oldGroup?.isAdminPanelPage === editingIsAdminPanelPage.value) {
    cancelEdit();
    return;
  }

  // Check for duplicates (if name changed)
  if (oldGroup?.name !== newName) {
    const existingNames = normalizedGroups.value.map(g => g.name);
    if (existingNames.includes(newName)) {
      error.value = 'Group name already exists';
      return;
    }
  }

  loading.value = true;
  error.value = '';

  try {
    const updatedGroups: ProjectGroup[] = [...normalizedGroups.value];
    updatedGroups[index] = {
      name: newName,
      isAdminPanelPage: editingIsAdminPanelPage.value,
    };

    // Update project groups and APIs that use this group (if name changed)
    await updateProjectGroups(updatedGroups);
    if (oldGroup?.name !== newName) {
      await updateApisWithGroupName(oldGroup!.name, newName);
    }

    cancelEdit();
  } catch (err) {
    error.value = 'Failed to update group';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleDeleteGroup = async (index: number, groupName: string) => {
  if (!props.project) return;

  // Confirm deletion
  if (!await confirm({ title: 'Delete Group', message: `Are you sure you want to delete the group "${groupName}"? This will also remove it from all APIs.` })) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const updatedGroups = normalizedGroups.value.filter((_, i) => i !== index);

    // Update project groups and remove from APIs
    await updateProjectGroups(updatedGroups);
    await removeGroupFromApis(groupName);
  } catch (err) {
    error.value = 'Failed to delete group';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const updateProjectGroups = async (updatedGroups: ProjectGroup[]) => {
  if (!props.project) return;

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

  emit('update');
};

const updateApisWithGroupName = async (oldName: string, newName: string) => {
  if (!props.project) return;

  // Fetch all APIs for this project
  const apis = await $fetch<any[]>(`/api/mocks?projectId=${props.project.id}`);

  // Update APIs that have the old group name
  const updatePromises = apis
    .filter((api) => api.group === oldName)
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
};

const removeGroupFromApis = async (groupName: string) => {
  if (!props.project) return;

  // Fetch all APIs for this project
  const apis = await $fetch<any[]>(`/api/mocks?projectId=${props.project.id}`);

  // Remove group from APIs that have this group
  const updatePromises = apis
    .filter((api) => api.group === groupName)
    .map((api) =>
      $fetch(`/api/mocks/${api.id}`, {
        method: 'PUT',
        body: {
          ...api,
          group: undefined,
        },
      })
    );

  await Promise.all(updatePromises);
};

watch(() => props.show, (newVal) => {
  if (!newVal) {
    newGroupName.value = '';
    newGroupIsAdminPanelPage.value = false;
    editingIndex.value = null;
    editingGroupName.value = '';
    editingIsAdminPanelPage.value = false;
    error.value = '';
  }
});
</script>
