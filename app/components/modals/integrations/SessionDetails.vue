<template>
  <div v-if="show && session"
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="$emit('close')">
    <div
      class="bg-[#242736] rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-200">Session Details</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-200 transition-colors">
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-4">
        <div class="bg-[#1a1d2e] rounded-lg p-4 border border-gray-600">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-xs text-gray-400 mb-1">Session ID</div>
              <div class="text-gray-300 font-mono break-all">{{ session.id }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-400 mb-1">Integration ID</div>
              <div class="text-gray-300 font-mono break-all">{{ session.integrationId }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-400 mb-1">Created At</div>
              <div class="text-gray-300">{{ formatDate(session.createdAt) }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-400 mb-1">Last Updated</div>
              <div class="text-gray-300">{{ formatDate(session.updatedAt) }}</div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium text-gray-300 mb-2">Custom Response Overrides</h4>
          <div v-if="responses.length === 0" class="bg-[#2d3142] rounded-lg p-4 text-center">
            <p class="text-gray-400 text-sm">No custom responses set</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="response in responses" :key="response.id"
              class="bg-[#2d3142] rounded-lg p-3 flex items-center justify-between">
              <div class="flex-1">
                <div class="text-sm text-gray-300 font-mono">{{ getApiName(response.apiId) }}</div>
                <div class="text-xs text-gray-400 mt-1">API ID: {{ response.apiId }}</div>
              </div>
              <div class="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium">
                {{ response.responseStatusCode }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Session {
  id: string;
  integrationId: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionResponse {
  id: string;
  sessionId: string;
  apiId: string;
  responseStatusCode: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  show: boolean;
  session: Session | null;
  responses: SessionResponse[];
  allApis?: any[];
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const getApiName = (apiId: string): string => {
  if (!props.allApis) return 'Unknown API';
  const api = props.allApis.find((a) => a.id === apiId);
  return api ? `${api.method} ${api.endpoint}` : 'Unknown API';
};
</script>
