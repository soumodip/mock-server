<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div class="bg-[#242736] rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-200">{{ title }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-300">
            <Icon name="mdi:close" class="w-5 h-5" />
          </button>
        </div>
        <div class="text-gray-300 space-y-3 text-sm whitespace-pre-line" v-html="content" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  title: string;
  content: string;
}>();

defineEmits<{
  close: [];
}>();
</script>
