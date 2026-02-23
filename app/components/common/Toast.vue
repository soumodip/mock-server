<template>
  <div class="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
    <TransitionGroup
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 bg-[#242736] border border-gray-700 rounded-lg shadow-2xl px-4 py-3 min-w-[300px] max-w-[400px]"
        :class="borderClass(toast.type)"
      >
        <Icon :name="iconName(toast.type)" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="iconClass(toast.type)" />
        <p class="text-sm text-gray-200 flex-1 break-words">{{ toast.message }}</p>
        <button
          @click="removeToast(toast.id)"
          class="text-gray-500 hover:text-gray-300 flex-shrink-0 mt-0.5"
        >
          <Icon name="mdi:close" class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts, removeToast } = useToast();

const borderClass = (type: string) => ({
  'border-l-4 border-l-red-500': type === 'error',
  'border-l-4 border-l-green-500': type === 'success',
  'border-l-4 border-l-amber-500': type === 'warning',
  'border-l-4 border-l-blue-500': type === 'info',
});

const iconName = (type: string) => {
  const icons: Record<string, string> = {
    error: 'mdi:alert-circle',
    success: 'mdi:check-circle',
    warning: 'mdi:alert',
    info: 'mdi:information',
  };
  return icons[type] || 'mdi:information';
};

const iconClass = (type: string) => ({
  'text-red-400': type === 'error',
  'text-green-400': type === 'success',
  'text-amber-400': type === 'warning',
  'text-blue-400': type === 'info',
});
</script>
