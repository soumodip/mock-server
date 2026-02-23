<template>
  <div class="mt-3 bg-[#1f2230] rounded-lg border border-gray-700 p-4">
    <label class="block text-xs text-gray-400 mb-1.5">Describe the changes you need in this data</label>
    <textarea
      v-model="reason"
      rows="2"
      placeholder="e.g., 5 users with realistic names, or leave blank for a fresh response"
      class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder-gray-500"
      :disabled="isGenerating"
    />
    <!-- Error -->
    <div v-if="errorMessage" class="mt-2 text-xs text-red-400">
      {{ errorMessage }}
    </div>
    <div class="flex justify-end mt-2">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-3 py-1.5 text-gray-400 hover:text-gray-200 text-sm transition-colors mr-2"
        :disabled="isGenerating"
      >
        Cancel
      </button>
      <button
        type="button"
        @click="handleGenerate"
        class="px-4 py-1.5 text-white rounded-full flex items-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isGenerating"
      >
        <Icon v-if="isGenerating" name="mdi:loading" class="w-3.5 h-3.5 animate-spin" />
        <Icon v-else name="carbon:data-bin" class="w-3.5 h-3.5" />
        {{ isGenerating ? 'Generating...' : 'Generate' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePopulateWithAI } from '~/composables/usePopulateWithAI';

const props = defineProps<{
  method: string;
  endpoint: string;
  statusCode: number;
  currentResponse: string;
}>();

const emit = defineEmits<{
  cancel: [];
  generated: [responseValue: string];
}>();

const { fetchLLMConfig, generateResponse, llmConfig } = usePopulateWithAI();

const reason = ref('');
const isGenerating = ref(false);
const errorMessage = ref('');

const handleGenerate = async () => {
  isGenerating.value = true;
  errorMessage.value = '';

  try {
    if (!llmConfig.value) {
      await fetchLLMConfig();
    }
    if (!llmConfig.value) {
      errorMessage.value = 'No LLM provider configured. Go to Settings > LLM to configure one.';
      return;
    }

    const responseValue = await generateResponse({
      method: props.method,
      endpoint: props.endpoint,
      statusCode: props.statusCode,
      reason: reason.value,
      existingResponse: props.currentResponse,
    });

    emit('generated', responseValue);
  } catch (err: any) {
    const axiosMsg = err?.response?.data?.error?.message;
    errorMessage.value = axiosMsg || err?.message || 'Failed to generate response data';
  } finally {
    isGenerating.value = false;
  }
};
</script>
