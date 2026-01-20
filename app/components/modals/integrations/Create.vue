<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')">
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-200">Create Environment</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-200 transition-colors">
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="text-xs text-gray-400 mb-2 block">Environment Name</label>
          <input v-model="integrationName" type="text" placeholder="e.g., Production Website"
            class="w-full px-3 py-2 border border-gray-600 bg-[#1a1d2e] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            required />
        </div>

        <div class="flex gap-2 justify-end">
          <button type="button" @click="$emit('close')"
            class="px-4 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm">
            Cancel
          </button>
          <button type="submit" :disabled="!integrationName.trim() || loading"
            class="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
  loading?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'create', name: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const integrationName = ref('');

const handleSubmit = () => {
  if (integrationName.value.trim()) {
    emit('create', integrationName.value.trim());
    integrationName.value = '';
  }
};

// Reset form when modal is closed
watch(() => props.show, (newVal) => {
  if (!newVal) {
    integrationName.value = '';
  }
});
</script>
