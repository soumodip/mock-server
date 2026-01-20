<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="handleCancel"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700">
      <h3 class="text-lg font-medium text-gray-200 mb-4">Select a Project</h3>
      <p class="text-sm text-gray-400 mb-4">Please select a project to continue</p>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Project <span class="text-red-400">*</span>
        </label>
        <CommonDropdown
          v-model="selectedProject"
          :options="projectOptions"
          placeholder="Select a project"
        />
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          @click="handleConfirm"
          :disabled="!selectedProject"
          class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Confirm
        </button>
        <button
          type="button"
          @click="handleCancel"
          class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '~/stores/project';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
  select: [projectId: string];
}>();

const projectStore = useProjectStore();
const selectedProject = ref('');

const projectOptions = computed(() => {
  return projectStore.projects.map(project => ({
    label: project.name,
    value: project.id
  }));
});

const handleConfirm = () => {
  if (selectedProject.value) {
    emit('select', selectedProject.value);
    selectedProject.value = '';
  }
};

const handleCancel = () => {
  selectedProject.value = '';
  emit('close');
};

watch(() => props.show, async (newVal) => {
  if (newVal) {
    // Fetch projects when modal opens
    await projectStore.fetchProjects();
  } else {
    selectedProject.value = '';
  }
});
</script>
