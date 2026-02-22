<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
      <!-- Header -->
      <div class="flex items-center justify-center p-6 border-b border-gray-700">
        <div class="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center">
          <Icon name="mdi:refresh" class="w-8 h-8 text-indigo-400" />
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 text-center">
        <h3 class="text-xl font-semibold text-gray-200 mb-3">Data Has Been Reset</h3>
        <p class="text-gray-400 text-sm mb-4">
          This is a sandbox environment. All data has been automatically reset as part of the scheduled cleanup.
        </p>
        <p class="text-gray-500 text-xs">
          Please refresh the page to continue with a clean state.
        </p>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-700">
        <button
          @click="handleRefresh"
          class="w-full px-4 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Icon name="mdi:refresh" class="w-4 h-4" />
          Refresh Page
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const handleRefresh = () => {
  emit('refresh');
  if (typeof window !== 'undefined') {
    window.location.href = window.location.pathname;
  }
};
</script>
