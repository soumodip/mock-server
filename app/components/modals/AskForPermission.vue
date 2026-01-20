<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
      <h2 class="text-lg font-medium text-gray-200 mb-3">{{ title }}</h2>
      <p class="text-gray-400 mb-6 text-sm">{{ message }}</p>
      <div class="flex justify-end gap-2">
        <button
          @click="$emit('cancel')"
          :disabled="loading"
          class="px-3 py-2 border border-gray-600 text-gray-300 rounded-full hover:bg-[#2d3142] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Cancel
        </button>
        <button
          @click="$emit('confirm')"
          :disabled="loading"
          class="px-3 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
        >
          <Icon v-if="loading" name="mdi:loading" class="w-4 h-4 animate-spin" />
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  loading: false,
});

defineEmits(['confirm', 'cancel']);
</script>
