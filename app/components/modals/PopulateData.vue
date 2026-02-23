<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-200">Populate APIs with Real Data</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-200">
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <p class="text-sm text-gray-400 mb-1">
        Configure status codes and reasons for each API. The LLM will generate realistic response data.
      </p>
      <div class="flex flex-row mb-4 gap-2">
        <Icon name="material-symbols:info" class="h-5 w-5 text-gray-600" />
        <p class="text-gray-400 text-xs">You can describe the response you want, or just specify a quantity (e.g., "5"). Leaving it blank generates a single response matching the existing structure.</p>
      </div>

      <!-- API Cards -->
      <div class="space-y-4 mb-6">
        <div v-for="(card, cardIndex) in apiCards" :key="card.apiId"
          class="bg-[#1f2230] rounded-lg border border-gray-700 p-4">
          <!-- API Header -->
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full" :class="{
              'bg-green-900/30 text-green-300': card.method === 'GET',
              'bg-blue-900/30 text-blue-300': card.method === 'POST',
              'bg-yellow-900/30 text-yellow-300': card.method === 'PUT',
              'bg-red-900/30 text-red-300': card.method === 'DELETE',
              'bg-purple-900/30 text-purple-300': card.method === 'PATCH',
            }">
              {{ card.method }}
            </span>
            <span class="text-sm font-medium text-gray-300">{{ card.endpoint }}</span>
            <!-- Per-card status indicator -->
            <span v-if="card.status === 'generating'" class="ml-auto flex items-center gap-1 text-xs text-indigo-400">
              <Icon name="mdi:loading" class="w-3 h-3 animate-spin" /> Generating...
            </span>
            <span v-else-if="card.status === 'done'" class="ml-auto flex items-center gap-1 text-xs text-green-400">
              <Icon name="mdi:check-circle" class="w-3 h-3" /> Done
            </span>
            <span v-else-if="card.status === 'error'" class="ml-auto flex items-center gap-1 text-xs text-red-400">
              <Icon name="mdi:alert-circle" class="w-3 h-3" /> Error
            </span>
          </div>

          <!-- Status Entries -->
          <div class="space-y-3">
            <div v-for="(entry, entryIndex) in card.entries" :key="entryIndex"
              class="flex items-start gap-3 bg-[#242736] rounded-lg p-3">
              <!-- Status Code -->
              <div class="flex-shrink-0">
                <label class="block text-xs text-gray-500 mb-1">Status</label>
                <div class="flex items-center gap-1 mt-2">
                  <span class="py-1 text-xs font-semibold text-gray-300">
                    {{ entry.statusCode }}
                  </span>
                  <IconDropdown
                    v-if="card.availableStatusCodes.length > 1 && !isGenerating"
                    :options="getStatusOptions(card, entry.statusCode)"
                    title="Change status code"
                    @option-selected="(opt) => changeEntryStatus(cardIndex, entryIndex, opt.value as number)"
                  />
                </div>
              </div>

              <!-- Reason -->
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">Reason / Description</label>
                <textarea
                  v-model="entry.reason"
                  rows="1"
                  :placeholder="getReasonPlaceholder(entry.statusCode)"
                  class="w-full px-2 py-1.5 border border-gray-600 bg-[#1f2230] text-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  :disabled="isGenerating"
                />
              </div>

              <!-- Remove Button -->
              <button v-if="card.entries.length > 1"
                @click="removeEntry(cardIndex, entryIndex)"
                class="flex-shrink-0 mt-5 text-gray-500 hover:text-red-400 transition-colors p-1"
                :disabled="isGenerating"
                title="Remove status">
                <Icon name="mdi:close" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Add Status Button -->
          <button @click="addEntry(cardIndex)"
            class="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            :disabled="isGenerating">
            <Icon name="mdi:plus" class="w-3.5 h-3.5" />
            Add Status
          </button>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="errorMessage" class="mb-4 bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">
        {{ errorMessage }}
      </div>

      <!-- Footer -->
      <div class="flex items-center gap-3">
        <button @click="$emit('close')"
          class="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
          :disabled="isGenerating">
          Cancel
        </button>
        <button @click="generateAll"
          class="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isGenerating">
          <Icon v-if="isGenerating" name="mdi:loading" class="w-4 h-4 animate-spin" />
          <Icon v-else name="carbon:data-bin" class="w-4 h-4" />
          {{ isGenerating ? 'Generating...' : 'Generate Response Data' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useApiStore } from '~/stores/api';
import type { ApiMock, StatusMock } from '~/stores/api';
import { usePopulateWithAI } from '~/composables/usePopulateWithAI';

interface StatusEntry {
  statusCode: number;
  reason: string;
}

interface ApiCard {
  apiId: string;
  endpoint: string;
  method: string;
  availableStatusCodes: number[];
  entries: StatusEntry[];
  status: 'idle' | 'generating' | 'done' | 'error';
}

const props = defineProps<{
  show: boolean;
  apis: ApiMock[];
}>();

const emit = defineEmits<{
  close: [];
  generated: [];
}>();

const apiStore = useApiStore();
const { llmConfig, fetchLLMConfig, generateResponse } = usePopulateWithAI();
const apiCards = ref<ApiCard[]>([]);
const isGenerating = ref(false);
const errorMessage = ref('');

// Initialize cards and fetch LLM config when modal opens
watch(() => props.show, async (newVal) => {
  if (newVal && props.apis.length > 0) {
    apiCards.value = props.apis.map(api => {
      const statusCodes = (api.statusMocks || []).map(sm => sm.statusCode ?? 200);
      const defaultStatus: number = statusCodes.length > 0 ? statusCodes[0]! : 200;
      return {
        apiId: api.id,
        endpoint: api.endpoint,
        method: api.method,
        availableStatusCodes: statusCodes,
        entries: [{ statusCode: defaultStatus, reason: '' }],
        status: 'idle' as const,
      };
    });
    errorMessage.value = '';
    isGenerating.value = false;

    // Fetch LLM config
    const config = await fetchLLMConfig();
    if (!config) {
      errorMessage.value = 'Failed to load LLM configuration.';
    }
  }
});

const getReasonPlaceholder = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) return 'e.g., successful response with list of items';
  if (statusCode >= 400 && statusCode < 500) return 'e.g., validation error for missing fields';
  if (statusCode >= 500) return 'e.g., internal server error';
  return 'e.g., describe the expected response';
};

const addEntry = (cardIndex: number) => {
  (apiCards as any).value[cardIndex].entries.push({ statusCode: 200, reason: '' });
};

const removeEntry = (cardIndex: number, entryIndex: number) => {
  (apiCards as any).value[cardIndex].entries.splice(entryIndex, 1);
};

const getStatusOptions = (card: ApiCard, currentStatusCode: number) => {
  return card.availableStatusCodes.map(code => ({
    value: code,
    label: String(code),
    active: code === currentStatusCode,
  }));
};

const changeEntryStatus = (cardIndex: number, entryIndex: number, statusCode: number) => {
  (apiCards as any).value[cardIndex].entries[entryIndex].statusCode = statusCode;
};

const generateAll = async () => {
  if (!llmConfig.value) {
    errorMessage.value = 'No LLM provider configured.';
    return;
  }

  isGenerating.value = true;
  errorMessage.value = '';

  // Reset all card statuses
  apiCards.value.forEach(card => { card.status = 'idle'; });

  for (const card of apiCards.value) {
    card.status = 'generating';

    try {
      // Find the current API data from store
      const currentApi = apiStore.apis.find(a => a.id === card.apiId);
      if (!currentApi) {
        card.status = 'error';
        continue;
      }

      // Build updated statusMocks
      const updatedStatusMocks: StatusMock[] = [...(currentApi.statusMocks || [])];

      for (const entry of card.entries) {
        // Get existing response for this status code (if any) to preserve shape
        const existingMock = updatedStatusMocks.find(sm => sm.statusCode === entry.statusCode);
        const existingResponse = existingMock?.responseValue?.trim() || '';

        const responseValue = await generateResponse({
          method: card.method,
          endpoint: card.endpoint,
          statusCode: entry.statusCode,
          reason: entry.reason,
          existingResponse,
        });

        // Find existing statusMock with this status code
        const existingIndex = updatedStatusMocks.findIndex(
          sm => sm.statusCode === entry.statusCode
        );

        if (existingIndex !== -1) {
          // Update existing
          (updatedStatusMocks as any)[existingIndex] = {
            ...updatedStatusMocks[existingIndex],
            responseValue,
          };
        } else {
          // Add new statusMock
          updatedStatusMocks.push({
            statusCode: entry.statusCode,
            responseObjectId: '',
            responseValue,
            enabled: updatedStatusMocks.length === 0,
            headerParams: [],
            queryParams: [],
            bodyParams: [],
            validators: [],
          });
        }
      }

      // Update the API with new statusMocks
      await apiStore.updateApi(card.apiId, {
        statusMocks: updatedStatusMocks,
      });

      card.status = 'done';
    } catch (err: any) {
      console.error(`Failed to generate for ${card.endpoint}:`, err);
      card.status = 'error';
      const axiosMsg = err?.response?.data?.error?.message;
      errorMessage.value = axiosMsg || err?.message || 'Failed to generate response data';
    }
  }

  isGenerating.value = false;

  // If all succeeded, emit generated
  const allDone = apiCards.value.every(c => c.status === 'done');
  if (allDone) {
    emit('generated');
  }
};
</script>
