<template>
  <div class="min-h-screen bg-[#1a1d2e] p-6">
    <div class="max-w-7xl mx-auto">
      <HeaderContainer />

      <!-- Project Selection Section -->
      <div class="bg-[#252836] rounded-lg p-6 mb-6 mt-12">
        <h2 class="text-md font-medium text-gray-300 mb-3">Project</h2>
        <div class="flex gap-2 items-center">
          <CommonDropdown v-model="projectStore.selectedProjectId" :options="projectOptions"
            placeholder="Select a project" @change="handleProjectChange" />
        </div>
        <p v-if="projectOptions.length === 0" class="text-xs text-gray-500 mt-2 ml-2">
          No projects found. Go to <strong class="text-gray-400">Mock Server</strong> tab and create a new project
        </p>
      </div>

      <!-- No Project Selected State -->
      <div v-if="!projectStore.selectedProjectId" class="bg-[#252836] rounded-lg p-6">
        <div class="text-center py-12">
          <Icon name="carbon:pull-request" class="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500">Select a project to view and manage webhooks</p>
        </div>
      </div>

      <!-- Webhooks Section -->
      <div v-else>
        <!-- Add Webhook Button -->
        <div class="flex justify-center mb-6">
          <button v-if="canWrite()" @click="createWebhook" :disabled="isCreatingWebhook"
            class="px-4 py-2  text-white rounded-full hover:opacity-75 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon name="mdi:plus" class="w-4 h-4" />
            {{ isCreatingWebhook ? 'Creating...' : 'Create Webhook' }}
          </button>
        </div>

        <!-- No Webhooks State -->
        <div v-if="webhooks.length === 0 && !isLoadingWebhooks" class="bg-[#252836] rounded-lg p-6">
          <div class="text-center py-12">
            <Icon name="mdi:webhook" class="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p class="text-gray-500 mb-2">No webhooks created yet</p>
            <p class="text-xs text-gray-600">Click the button above to create your first webhook</p>
          </div>
        </div>

        <!-- Loading Webhooks State -->
        <div v-else-if="isLoadingWebhooks" class="bg-[#252836] rounded-lg p-6">
          <div class="text-center py-12">
            <Icon name="mdi:loading" class="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
            <p class="text-gray-500">Loading webhooks...</p>
          </div>
        </div>

        <!-- Webhook Containers -->
        <div v-else class="space-y-6">
          <div v-for="webhook in webhooks" :key="webhook.id">
            <div class="flex items-center justify-between mb-4 px-6">
              <div class="flex items-center gap-2">
                <button v-if="!webhook.label && canWrite()" @click="openLabelModal(webhook)"
                  class="text-white text-xs hover:opacity-75 transition-opacity flex items-center gap-1">
                  <Icon name="mdi:plus" class="w-3 h-3" />
                  Label
                </button>
                <div v-else class="flex items-center gap-1.5">
                  <span class="text-indigo-400 hover:text-indigo-500 text-sm">{{ webhook.label ? webhook.label : '-' }}</span>
                  <button v-if="canWrite()" @click="openLabelModal(webhook)" class="flex flex-row items-center text-gray-400 hover:text-gray-300 transition-colors text-xs"
                    title="Edit label">
                    <Icon name="cuida:edit-outline" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button @click="downloadWebhookLogs(webhook)"
                :disabled="getWebhookLogs(webhook.id).length === 0"
                class="text-gray-400 hover:text-gray-300 text-xs transition-opacity flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download logs as JSON">
                <Icon name="material-symbols:download" class="w-3.5 h-3.5" />
                Logs
              </button>
            </div>
            <div class="bg-[#252836] rounded-lg p-6">
              <!-- Webhook Header with URI and Delete -->
              <div class="border-b border-gray-700 pb-5 mb-4">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <p class="text-sm font-regular text-gray-200 m-0">Webhook URI:</p>
                    <div class="flex justify-start items-center gap-2">
                      <code class="text-sm text-indigo-400 break-all">{{ getWebhookUri(webhook.webhookIndex) }}</code>
                      <button @click="copyToClipboard(getWebhookUri(webhook.webhookIndex))"
                        class="p-2 text-gray-400 hover:text-white transition-colors" title="Copy to clipboard">
                        <Icon name="mdi:content-copy" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p class="text-xs text-gray-500 m-0 mt-1">
                      Send POST, GET, PUT, PATCH, or DELETE requests to any path under this base URI to log them here.
                    </p>
                  </div>
                  <div class="flex items-center gap-1 ml-4">
                    <button v-if="canWrite()" @click="togglePinWebhook(webhook)" class="p-2 transition-colors"
                      :class="webhook.isPinned ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-gray-300'"
                      :title="webhook.isPinned ? 'Unpin webhook' : 'Pin webhook'">
                      <Icon :name="webhook.isPinned ? 'mdi:pin' : 'mdi:pin-outline'" class="w-4 h-4" />
                    </button>
                    <button v-if="canDelete()" @click="deleteWebhook(webhook)"
                      class="p-2 text-red-400 hover:text-red-500 transition-colors" title="Delete webhook">
                      <Icon name="mdi:delete" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Request Logs Section -->
              <div>
                <div class="flex justify-between items-center mb-4">
                  <div class="flex items-center gap-2">
                    <h2 class="text-md font-medium text-gray-300">Request Logs</h2>
                    <span v-if="isConnected" class="flex items-center gap-1 text-xs text-green-400">
                      <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Live
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <button v-if="canDelete()" @click="clearWebhookLogs(webhook)" :disabled="getWebhookLogs(webhook.id).length === 0"
                      class="px-3 py-1.5 text-red-400 rounded-full hover:bg-[#353849] transition-colors flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                      <Icon name="material-symbols:layers-clear-rounded" class="w-4 h-4" />
                      Clear All
                    </button>
                  </div>
                </div>

                <!-- Loading State -->
                <div v-if="isLoadingLogs" class="text-center py-8">
                  <Icon name="mdi:loading" class="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
                  <p class="text-gray-500">Loading logs...</p>
                </div>

                <!-- Empty State -->
                <div v-else-if="getWebhookLogs(webhook.id).length === 0" class="text-center py-8">
                  <Icon name="mdi:inbox-outline" class="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p class="text-gray-500 mb-2">No webhook requests received yet</p>
                  <p class="text-xs text-gray-600">Send a request to the webhook URI above to see it logged here</p>
                </div>

                <!-- Logs List -->
                <div v-else class="space-y-3">
                  <div v-for="log in getWebhookLogs(webhook.id)" :key="log.id"
                    class="bg-[#1a1d2e] rounded-lg overflow-hidden">
                    <!-- Log Header -->
                    <div
                      class="flex items-center justify-between p-3 cursor-pointer hover:bg-[#1f2335] transition-colors"
                      @click="toggleLog(log.id)">
                      <div class="flex items-center gap-3">
                        <!-- Method Badge -->
                        <span class="px-1 py-0.5 rounded text-xs font-semibold" :class="getMethodClass(log.method)">
                          {{ log.method }}
                        </span>
                        <!-- Path -->
                        <span class="text-gray-300 text-sm font-mono">{{ log.path }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <!-- Timestamp -->
                        <span class="text-xs text-gray-500">{{ formatTimestamp(log.createdAt) }}</span>
                        <!-- Expand Icon -->
                        <Icon :name="expandedLogs.has(log.id) ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                          class="w-5 h-5 text-gray-500" />
                      </div>
                    </div>

                    <!-- Log Details (Expanded) -->
                    <div v-if="expandedLogs.has(log.id)" class="border-t border-gray-700 p-4 space-y-4">
                      <!-- Request Info -->
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span class="text-gray-500">IP Address:</span>
                          <span class="text-gray-600 text-xs ml-2">{{ log.ip }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500">Content-Type:</span>
                          <span class="text-gray-600 text-xs ml-2">{{ log.contentType || 'N/A' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500">Content-Length:</span>
                          <span class="text-gray-600 text-xs ml-2">{{ log.contentLength || 0 }} bytes</span>
                        </div>
                        <div class="col-span-2">
                          <span class="text-gray-500">User-Agent:</span>
                          <span class="text-gray-600 text-xs ml-2 break-all">{{ log.userAgent || 'N/A' }}</span>
                        </div>
                      </div>

                      <!-- Headers -->
                      <div v-if="log.headers && Object.keys(log.headers).length > 0">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Headers</h4>
                          <button @click="copyToClipboard(JSON.stringify(log.headers, null, 2))"
                            class="p-1 text-gray-500 hover:text-white transition-colors rounded hover:bg-[#353849]"
                            title="Copy headers">
                            <Icon name="mdi:content-copy" class="w-3 h-3" />
                          </button>
                        </div>
                        <pre
                          class="bg-[#252836] rounded p-3 text-xs text-gray-300 overflow-x-auto">{{ formatJson(log.headers) }}</pre>
                      </div>

                      <!-- Query Parameters -->
                      <div v-if="log.query && Object.keys(log.query).length > 0">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Query Parameters</h4>
                          <button @click="copyToClipboard(JSON.stringify(log.query, null, 2))"
                            class="p-1 text-gray-500 hover:text-white transition-colors rounded hover:bg-[#353849]"
                            title="Copy query params">
                            <Icon name="mdi:content-copy" class="w-3 h-3" />
                          </button>
                        </div>
                        <pre
                          class="bg-[#252836] rounded p-3 text-xs text-gray-300 overflow-x-auto">{{ formatJson(log.query) }}</pre>
                      </div>

                      <!-- Body -->
                      <div v-if="log.body">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Body</h4>
                          <button
                            @click="copyToClipboard(typeof log.body === 'string' ? log.body : JSON.stringify(log.body, null, 2))"
                            class="p-1 text-gray-500 hover:text-white transition-colors rounded hover:bg-[#353849]"
                            title="Copy body">
                            <Icon name="mdi:content-copy" class="w-3 h-3" />
                          </button>
                        </div>
                        <pre
                          class="bg-[#252836] rounded p-3 text-xs text-gray-300 overflow-x-auto max-h-64">{{ formatJson(log.body) }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Webhook Validation Section -->
      <div v-if="projectStore.selectedProjectId && webhooks.length > 0"
        class="mt-8 flex flex-row items-center mb-4 cursor-pointer self-start grow-0"
        @click="showWebhookValidation = !showWebhookValidation">
        <h2 class="text-md font-medium text-gray-500">Perform end-to-end webhook validation</h2>
        <button class="text-gray-400 hover:text-gray-300 transition-transform ml-3 mt-1">
          <Icon :name="`mingcute:${showWebhookValidation ? 'up' : 'down'}-line`" class="w-4 h-4" />
        </button>
      </div>
      <div v-if="projectStore.selectedProjectId && webhooks.length > 0 && showWebhookValidation"
        class="bg-[#242736] rounded-xl shadow-lg p-6 mb-6">
        <p class="text-gray-500 text-sm mb-4">Test your webhook integration by sending a sample request directly from
          our API Playground.</p>
        <button @click="openWebhookPlayground" class="text-gray-300 rounded-full flex items-center gap-2 text-sm">
          <Icon name="mdi:link-variant" class="w-4 h-4" />
          Open in API Playground
        </button>
      </div>

      <ModalsGettingStarted v-if="modal?.type == 'getting-started'" :heading="gettingStartedData.heading"
        :youtube-video-link="gettingStartedData.youtubeVideoLink" :description="gettingStartedData.description"
        @close="closeModal" />

      <ModalsApiPlayground :show="modal?.type === 'apiPlayground'" :api="webhookPlaygroundApi" @close="closeModal" />

      <ModalsWebhookLogsLabel :show="modal?.type === 'label'" :current-label="modal?.data?.currentLabel"
        @close="closeModal" @save="saveLabel" @clear="clearLabel" />
    </div>

    <!-- Floating Info Button -->
    <button @click="openModal('getting-started', null)"
      class="fixed bottom-6 right-6 bg-[#2d3142] text-gray-300 rounded-full shadow-lg transition-colors flex items-center justify-center w-10 h-10 hover:bg-[#353849]"
      title="Info">
      <Icon name="teenyicons:screen-outline" class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useProjectStore } from '~/stores/project';
import HeaderContainer from '~/components/common/Header.vue';
import CommonDropdown from '~/components/common/Dropdown.vue';

interface Webhook {
  id: string;
  projectId: string;
  webhookIndex: number;
  isPinned: boolean;
  label: string | null;
  createdAt: string;
}

interface WebhookLog {
  id: string;
  projectId: string;
  webhookId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: any;
  ip: string;
  userAgent: string;
  contentType: string;
  contentLength: number;
  createdAt: string;
}

const projectStore = useProjectStore();
const webhooks = ref<Webhook[]>([]);
const logs = ref<WebhookLog[]>([]);
const expandedLogs = ref<Set<string>>(new Set());
const isLoadingWebhooks = ref(false);
const isLoadingLogs = ref(false);
const isCreatingWebhook = ref(false);
const isConnected = ref(false);
const showWebhookValidation = ref(false);
const selectedWebhookForLabel = ref<Webhook | null>(null);
let eventSource: EventSource | null = null;

// Modal management
interface Modal {
  type: string;
  data?: any;
}

const modal = ref<Modal | null>(null);

const { canWrite, canDelete } = useAuth();

// Getting Started Modal
const GETTING_STARTED_STORAGE_KEY = 'webhook-logs-getting-started-modal-shown';
const gettingStartedData = {
  heading: 'Getting Started with Webhook Logs',
  youtubeVideoLink: 'https://youtu.be/hjq5W9-jh6I?t=170', // Replace with your actual video
  description: 'Learn how to test and monitor webhook requests in real-time using the webhook logging system.'
};

const openModal = (type: string, data: any = null) => {
  modal.value = { type, data };
};

const closeModal = () => {
  if (modal.value?.type === 'getting-started') {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GETTING_STARTED_STORAGE_KEY, 'true');
    }
  }
  modal.value = null;
};

// Label management
const openLabelModal = (webhook: Webhook) => {
  selectedWebhookForLabel.value = webhook;
  openModal('label', { currentLabel: webhook.label || '' });
};

const saveLabel = async (label: string) => {
  if (!selectedWebhookForLabel.value) return;

  try {
    await $fetch(`/api/webhooks/${selectedWebhookForLabel.value.id}/label`, {
      method: 'PATCH',
      body: { label },
    });

    // Update local state
    const index = webhooks.value.findIndex(w => w.id === selectedWebhookForLabel.value!.id);
    if (index !== -1 && webhooks.value[index]) {
      webhooks.value[index].label = label;
    }
  } catch (error) {
    console.error('Failed to save label:', error);
  }
  closeModal();
};

const clearLabel = async () => {
  if (!selectedWebhookForLabel.value) return;

  try {
    await $fetch(`/api/webhooks/${selectedWebhookForLabel.value.id}/label`, {
      method: 'PATCH',
      body: { label: null },
    });

    // Update local state
    const index = webhooks.value.findIndex(w => w.id === selectedWebhookForLabel.value!.id);
    if (index !== -1 && webhooks.value[index]) {
      webhooks.value[index].label = null;
    }
  } catch (error) {
    console.error('Failed to clear label:', error);
  }
  closeModal();
};

// Get webhook URI
const getWebhookUri = (webhookIndex: number) => {
  if (typeof window === 'undefined') return '';
  const baseUrl = window.location.origin;
  return `${baseUrl}/webhooks/projects/${projectStore.selectedProjectId}/${webhookIndex}`;
};

// Open webhook playground with POST request and sample body
const openWebhookPlayground = () => {
  openModal('apiPlayground', {
    endpoint: '',
    method: 'POST',
    projectId: projectStore.selectedProjectId,
    description: 'Send a test webhook request to validate your integration',
    isWebhook: true,
    defaultBody: JSON.stringify({ key: 'value' }, null, 2)
  });
};

// Compute API config for webhook playground (use first webhook)
const webhookPlaygroundApi = computed(() => {
  if (!projectStore.selectedProjectId || typeof window === 'undefined' || webhooks.value.length === 0) return null;
  const firstWebhook = webhooks.value[0];
  if (!firstWebhook) return null;
  return {
    endpoint: getWebhookUri(firstWebhook.webhookIndex),
    method: 'POST',
    description: 'Send a test webhook request to validate your integration',
    body: {
      "event": "test",
      "created_at": "2025-05-15T14:30:00Z",
      "data": {
        "key": "value"
      }
    }
  };
});

// Project dropdown options
const projectOptions = computed(() => {
  return projectStore.projects.map(project => ({
    label: project.name,
    value: project.id
  }));
});

// Get logs for a specific webhook
const getWebhookLogs = (webhookId: string): WebhookLog[] => {
  return logs.value.filter(log => log.webhookId === webhookId);
};

// Fetch webhooks for the project
const fetchWebhooks = async () => {
  if (!projectStore.selectedProjectId) return;

  isLoadingWebhooks.value = true;
  try {
    const response = await $fetch<{ webhooks: Webhook[] }>('/api/webhooks', {
      query: { projectId: projectStore.selectedProjectId },
    });
    webhooks.value = response.webhooks;
  } catch (error) {
    console.error('Failed to fetch webhooks:', error);
  } finally {
    isLoadingWebhooks.value = false;
  }
};

// Create a new webhook
const createWebhook = async () => {
  if (!projectStore.selectedProjectId) return;

  isCreatingWebhook.value = true;
  try {
    const response = await $fetch<{ webhook: Webhook }>('/api/webhooks', {
      method: 'POST',
      body: { projectId: projectStore.selectedProjectId },
    });
    webhooks.value.push(response.webhook);
  } catch (error) {
    console.error('Failed to create webhook:', error);
  } finally {
    isCreatingWebhook.value = false;
  }
};

// Delete a webhook
const deleteWebhook = async (webhook: Webhook) => {
  if (!confirm('Are you sure you want to delete this webhook? All associated logs will also be deleted.')) return;

  try {
    await $fetch(`/api/webhooks/${webhook.id}`, {
      method: 'DELETE',
    });
    webhooks.value = webhooks.value.filter(w => w.id !== webhook.id);
    // Remove logs for this webhook from local state
    logs.value = logs.value.filter(log => log.webhookId !== webhook.id);
  } catch (error) {
    console.error('Failed to delete webhook:', error);
  }
};

// Toggle pin status for a webhook
const togglePinWebhook = async (webhook: Webhook) => {
  try {
    const response = await $fetch<{ success: boolean; isPinned: boolean }>(`/api/webhooks/${webhook.id}/pin`, {
      method: 'PATCH',
    });

    // Update local state
    const index = webhooks.value.findIndex(w => w.id === webhook.id);
    if (index !== -1) {
      const webhookToUpdate = webhooks.value[index];
      if (webhookToUpdate) {
        webhookToUpdate.isPinned = response.isPinned;
        // Re-sort webhooks: pinned first, then by webhookIndex
        webhooks.value.sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return a.webhookIndex - b.webhookIndex;
        });
      }
    }
  } catch (error) {
    console.error('Failed to toggle webhook pin status:', error);
  }
};

// Clear logs for a specific webhook
const clearWebhookLogs = async (webhook: Webhook) => {
  if (!confirm('Are you sure you want to clear all logs for this webhook?')) return;

  try {
    await $fetch('/api/webhook-logs/clear', {
      method: 'DELETE',
      query: { webhookId: webhook.id },
    });
    logs.value = logs.value.filter(log => log.webhookId !== webhook.id);
    expandedLogs.value.clear();
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
};

// Download logs for a specific webhook as JSON
const downloadWebhookLogs = (webhook: Webhook) => {
  const webhookLogs = getWebhookLogs(webhook.id);
  if (webhookLogs.length === 0) return;

  // Format logs with detailed information (same as shown in frontend)
  const logsReport = webhookLogs.map(log => ({
    id: log.id,
    method: log.method,
    path: log.path,
    timestamp: log.createdAt,
    ip: log.ip,
    userAgent: log.userAgent,
    contentType: log.contentType,
    contentLength: log.contentLength,
    headers: log.headers,
    query: log.query,
    body: log.body
  }));

  const report = {
    webhook: {
      id: webhook.id,
      label: webhook.label,
      uri: getWebhookUri(webhook.webhookIndex),
      createdAt: webhook.createdAt
    },
    exportedAt: new Date().toISOString(),
    totalLogs: logsReport.length,
    logs: logsReport
  };

  const jsonContent = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'webhook_logs.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Connect to SSE stream for real-time updates
const connectToStream = () => {
  if (!projectStore.selectedProjectId || typeof window === 'undefined') return;

  // Close existing connection
  disconnectFromStream();

  const url = `/api/webhook-logs/stream?projectId=${projectStore.selectedProjectId}`;
  eventSource = new EventSource(url);

  eventSource.onopen = () => {
    isConnected.value = true;
    console.log('SSE connection established');
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Skip connection messages
      if (data.type === 'connected') {
        console.log('SSE connected message received');
        return;
      }

      console.log('Received new webhook log via SSE:', data);

      // Add new log to the beginning of the list
      logs.value = [data, ...logs.value];
    } catch (e) {
      console.error('Failed to parse SSE message:', e);
    }
  };

  eventSource.onerror = () => {
    isConnected.value = false;
    console.log('SSE connection error, will retry...');
    // Try to reconnect after 5 seconds
    setTimeout(() => {
      if (projectStore.selectedProjectId) {
        connectToStream();
      }
    }, 5000);
  };
};

const disconnectFromStream = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    isConnected.value = false;
  }
};

// Fetch all logs for the project (we'll filter by webhookId in the template)
const fetchLogs = async () => {
  if (!projectStore.selectedProjectId) return;

  isLoadingLogs.value = true;
  try {
    const response = await $fetch<{ logs: WebhookLog[] }>('/api/webhook-logs', {
      query: {
        projectId: projectStore.selectedProjectId,
        limit: 500, // Fetch more since we're showing per webhook
      },
    });
    logs.value = response.logs;
  } catch (error) {
    console.error('Failed to fetch webhook logs:', error);
  } finally {
    isLoadingLogs.value = false;
  }
};

// Toggle log expansion
const toggleLog = (id: string) => {
  if (expandedLogs.value.has(id)) {
    expandedLogs.value.delete(id);
  } else {
    expandedLogs.value.add(id);
  }
};

// Handle project change
const handleProjectChange = (projectId: string | number) => {
  projectStore.selectProject(projectId as string);
  expandedLogs.value.clear();
  webhooks.value = [];
  logs.value = [];

  // Update URL with project_id
  const router = useRouter();
  if (projectId) {
    router.push({ query: { project_id: projectId } });
  } else {
    router.push({ query: {} });
  }

  // Fetch data for the new project
  fetchWebhooks();
  connectToStream();
  fetchLogs();
};

// Get method badge class
const getMethodClass = (method: string) => {
  const classes: Record<string, string> = {
    GET: 'bg-green-600 text-white',
    POST: 'bg-blue-600 text-white',
    PUT: 'bg-yellow-600 text-white',
    PATCH: 'bg-orange-600 text-white',
    DELETE: 'bg-red-600 text-white',
  };
  return classes[method] || 'bg-gray-600 text-white';
};

// Format timestamp - Mon 24th Jul 2025 format
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  // Get ordinal suffix
  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${dayName} ${day}${getOrdinalSuffix(day)} ${month} ${year}`;
};

// Format JSON for display
const formatJson = (data: any) => {
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
};

// Copy to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// Watch for project changes
watch(() => projectStore.selectedProjectId, (newId) => {
  if (newId) {
    webhooks.value = [];
    logs.value = [];
    fetchWebhooks();
    connectToStream();
    fetchLogs();
  } else {
    disconnectFromStream();
  }
});

// Fetch projects and data on mount
onMounted(async () => {
  await projectStore.fetchProjects();

  // Check if project_id is in URL and auto-select it
  const route = useRoute();
  let projectId: string | null = null;
  if (projectStore.projects.length > 0) {
    if (projectId && typeof projectId === 'string') {
      const exists = projectStore.projects.find(p => p.id === projectId);
      if (exists) {
        projectId = route.query.project_id as string;
        projectStore.selectedProjectId = projectId;
      }
    }
  }
  if (projectId && typeof projectId === 'string') {
    projectStore.selectedProjectId = projectId;
    fetchWebhooks();
    connectToStream();
    fetchLogs();
  }

  // Check if getting started modal was already shown
  if (typeof window !== 'undefined') {
    const hasSeenModal = localStorage.getItem(GETTING_STARTED_STORAGE_KEY);
    if (!hasSeenModal) {
      openModal('getting-started');
    }
  }

  // Update logo and title after 2 seconds
  setTimeout(() => {
    useHead({
      title: 'Perform end-to-end webhook validation.'
    });

    // Update favicon with cache busting
    if (typeof document !== 'undefined') {
      const links = document.querySelectorAll("link[rel*='icon']");
      links.forEach(link => link.remove());

      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.type = 'image/svg+xml';
      newLink.href = `/api-mocks-logo-integrations.svg?v=${Date.now()}`;
      document.head.appendChild(newLink);
    }
  }, 1000);
});

// Cleanup on unmount
onUnmounted(() => {
  disconnectFromStream();
});
</script>
