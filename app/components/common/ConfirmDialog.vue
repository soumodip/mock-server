<template>
  <div v-if="state.show" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" @click.self="handleCancel" @keydown.escape="handleCancel">
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
      <h2 class="text-lg font-medium text-gray-200 mb-3">{{ state.title }}</h2>
      <p class="text-gray-400 mb-6 text-sm">{{ state.message }}</p>
      <div class="flex justify-end gap-2">
        <button
          @click="handleCancel"
          class="px-3 py-2 border border-gray-600 text-gray-300 rounded-full hover:bg-[#2d3142] transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          ref="confirmBtn"
          @click="handleConfirm"
          class="px-3 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors text-sm"
        >
          {{ state.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref as vueRef, nextTick } from 'vue';
import { useConfirmDialog } from '~/composables/useConfirmDialog';

const { state, handleConfirm, handleCancel } = useConfirmDialog();

const confirmBtn = vueRef<HTMLButtonElement | null>(null);

// Focus confirm button when dialog opens for keyboard accessibility
watch(() => state.value.show, async (show) => {
  if (show) {
    await nextTick();
    confirmBtn.value?.focus();
  }
});
</script>
