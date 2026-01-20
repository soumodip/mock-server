<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700">
      <h3 class="text-lg font-medium text-gray-200 mb-4">Create New Project</h3>

      <!-- Option Selector -->
      <div class="mb-4 flex gap-2 text-sm">
        <button
          @click="isUploadMode = false"
          :class="[
            'flex-1 px-3 py-2 rounded-full transition-colors',
            !isUploadMode
              ? 'bg-indigo-600 text-white'
              : 'bg-[#2d3142] text-gray-300 hover:bg-[#353849]'
          ]"
        >
          Create New
        </button>
        <button
          @click="isUploadMode = true"
          :class="[
            'flex-1 px-3 py-2 rounded-full transition-colors',
            isUploadMode
              ? 'bg-indigo-600 text-white'
              : 'bg-[#2d3142] text-gray-300 hover:bg-[#353849]'
          ]"
        >
          Upload Existing
        </button>
      </div>

      <!-- Create New Form -->
      <form v-if="!isUploadMode" @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Project Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="projectName"
            type="text"
            placeholder="My Project"
            class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            required
          />
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Create
          </button>
          <button
            type="button"
            @click="$emit('close')"
            class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>

      <!-- Upload Form -->
      <form v-else @submit.prevent="handleUpload">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Upload Project File <span class="text-red-400">*</span>
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
                accept=".json"
                @change="handleFileChange"
                class="hidden"
                required
              />
            </label>
          </div>
          <p v-if="uploadError" class="text-red-400 text-xs mt-2">{{ uploadError }}</p>
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="loading || !uploadedFile"
            class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Upload
          </button>
          <button
            type="button"
            @click="$emit('close')"
            class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  create: [name: string];
  upload: [data: { project: any; apis: any[]; objects: any[] }];
}>();

const projectName = ref('');
const isUploadMode = ref(false);
const uploadedFile = ref<File | null>(null);
const uploadError = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const handleSubmit = () => {
  if (projectName.value.trim()) {
    emit('create', projectName.value);
    projectName.value = '';
  }
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    uploadedFile.value = file;
    uploadError.value = '';
  }
};

const handleUpload = async () => {
  if (!uploadedFile.value) return;

  try {
    const fileContent = await uploadedFile.value.text();
    const projectData = JSON.parse(fileContent);

    // Validate the structure
    if (!projectData.project || !projectData.apis || !projectData.objects) {
      uploadError.value = 'Invalid project file format. Expected { project, apis, objects }';
      return;
    }

    emit('upload', projectData);
    uploadedFile.value = null;
    uploadError.value = '';
  } catch (error) {
    console.error('Error parsing project file:', error);
    uploadError.value = 'Failed to parse project file. Please ensure it is a valid JSON file.';
  }
};

watch(() => props.show, (newVal) => {
  if (!newVal) {
    projectName.value = '';
    isUploadMode.value = false;
    uploadedFile.value = null;
    uploadError.value = '';
  }
});
</script>
