<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div class="bg-[#242736] rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-200">Info</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-300">
            <Icon name="mdi:close" class="w-5 h-5" />
          </button>
        </div>
        <div class="text-gray-300 space-y-3 text-sm">
          <p>We recommend using <strong class="text-gray-200">ngrok</strong> during testing.</p>
          <div class="bg-[#2d3142] p-3 rounded-lg border border-gray-600">
            <p class="font-mono text-sm mb-2">Usage: <code class="text-indigo-400">ngrok http &lt;PORT&gt;</code></p>
            <p class="text-sm text-gray-400">
              For example: If <code class="text-indigo-400">.env</code> has <code class="text-indigo-400">PORT=4001</code>,
              then run it on another terminal as:
            </p>
            <p class="font-mono text-sm mt-2 text-indigo-400">ngrok http 4001</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
}>();

defineEmits<{
  close: [];
}>();
</script>
