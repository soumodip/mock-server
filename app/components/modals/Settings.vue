<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" @click.self="closeModal">
    <div class="bg-[#242736] rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-lg font-medium text-gray-200">Settings</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-300">
            <Icon name="mdi:close" class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Provider Selection Buttons -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-3">Select Provider</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="provider in providers"
                :key="provider.id"
                @click="selectedProvider = provider.id"
                :class="[
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  selectedProvider === provider.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#353849] text-gray-300 hover:bg-[#3d4152]'
                ]"
              >
                {{ provider.name }}
              </button>
            </div>
          </div>

          <p class="text-xs text-gray-400 mb-2 mt-1">
            The following providers also support OpenAI standard: <b>vLLM</b>, <b>DeepSeek</b>, <b>Groq</b>, <b>Together AI</b>, <b>Perplexity</b>, <b>Mistral</b>, and <b>LM Studio</b>. So, you can select "OpenAI" and use their API keys and endpoints accordingly.
          </p>

          <!-- Provider Configuration Forms -->
          <div v-if="selectedProvider">
            <!-- OpenAI Configuration -->
            <div v-if="selectedProvider === 'openai'" class="space-y-4">
              <h3 class="text-sm font-medium text-gray-200 mb-3">OpenAI Configuration</h3>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                <input
                  v-model="settings.llm.providers.openai.baseUrl"
                  type="text"
                  :placeholder="placeholders.openai.baseUrl"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                <input
                  v-model="settings.llm.providers.openai.apiKey"
                  type="password"
                  :placeholder="placeholders.openai.apiKey"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Model</label>
                <input
                  v-model="settings.llm.providers.openai.model"
                  type="text"
                  :placeholder="placeholders.openai.model"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
            </div>

            <!-- Anthropic Configuration -->
            <div v-if="selectedProvider === 'anthropic'" class="space-y-4">
              <h3 class="text-sm font-medium text-gray-200 mb-3">Anthropic Configuration</h3>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                <input
                  v-model="settings.llm.providers.anthropic.baseUrl"
                  type="text"
                  :placeholder="placeholders.anthropic.baseUrl"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                <input
                  v-model="settings.llm.providers.anthropic.apiKey"
                  type="password"
                  :placeholder="placeholders.anthropic.apiKey"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Model</label>
                <input
                  v-model="settings.llm.providers.anthropic.model"
                  type="text"
                  :placeholder="placeholders.anthropic.model"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
            </div>

            <!-- Ollama Configuration -->
            <div v-if="selectedProvider === 'ollama'" class="space-y-4">
              <h3 class="text-sm font-medium text-gray-200 mb-3">Ollama Configuration</h3>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                <input
                  v-model="settings.llm.providers.ollama.baseUrl"
                  type="text"
                  :placeholder="placeholders.ollama.baseUrl"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Model</label>
                <input
                  v-model="settings.llm.providers.ollama.model"
                  type="text"
                  :placeholder="placeholders.ollama.model"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
            </div>

            <!-- Azure OpenAI Configuration -->
            <div v-if="selectedProvider === 'azure'" class="space-y-4">
              <h3 class="text-sm font-medium text-gray-200 mb-3">Azure OpenAI Configuration</h3>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Endpoint</label>
                <input
                  v-model="settings.llm.providers.azure.endpoint"
                  type="text"
                  :placeholder="placeholders.azure.endpoint"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                <input
                  v-model="settings.llm.providers.azure.apiKey"
                  type="password"
                  :placeholder="placeholders.azure.apiKey"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Deployment Name</label>
                <input
                  v-model="settings.llm.providers.azure.deploymentName"
                  type="text"
                  :placeholder="placeholders.azure.deploymentName"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">API Version</label>
                <input
                  v-model="settings.llm.providers.azure.apiVersion"
                  type="text"
                  :placeholder="placeholders.azure.apiVersion"
                  class="w-full bg-[#2d3142] border border-gray-600 rounded-full px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          <!-- Success Message -->
          <div v-if="showSuccess" class="text-green-400 text-xs text-center py-2">
            Settings saved successfully!
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 pt-2">
            <button
              @click="saveSettings"
              :disabled="saving"
              class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {{ saving ? 'Saving...' : 'Save Settings' }}
            </button>
            <button
              @click="closeModal"
              class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const toast = useToast();
const saving = ref(false);
const showSuccess = ref(false);
const selectedProvider = ref<'openai' | 'anthropic' | 'ollama' | 'azure'>('openai');

const providers = [
  { id: 'openai' as const, name: 'OpenAI' },
  { id: 'anthropic' as const, name: 'Anthropic' },
  { id: 'ollama' as const, name: 'Ollama' },
  { id: 'azure' as const, name: 'Azure OpenAI' },
];

// User input values (empty by default)
const settings = ref({
  llm: {
    active_provider: 'openai',
    providers: {
      openai: {
        baseUrl: '',
        apiKey: '',
        model: ''
      },
      anthropic: {
        baseUrl: '',
        apiKey: '',
        model: ''
      },
      ollama: {
        baseUrl: '',
        model: ''
      },
      azure: {
        endpoint: '',
        apiKey: '',
        deploymentName: '',
        apiVersion: ''
      }
    }
  }
});

// Static placeholder values (shown only when no value is set)
const placeholders = {
  openai: {
    baseUrl: 'Enter API base URL or leave blank for default',
    apiKey: 'Enter API key',
    model: 'Enter model name or leave blank for default'
  },
  anthropic: {
    baseUrl: 'Enter API base URL or leave blank for default',
    apiKey: 'Enter API key',
    model: 'Enter model name or leave blank for default'
  },
  ollama: {
    baseUrl: 'Enter API base URL or leave blank for default',
    model: 'Enter model name or leave blank for default'
  },
  azure: {
    endpoint: 'Enter endpoint URL',
    apiKey: 'Enter API key',
    deploymentName: 'Enter deployment name',
    apiVersion: 'Enter API version'
  }
};

// Load settings when modal opens
watch(() => props.show, async (isShowing) => {
  if (isShowing) {
    await loadSettings();
  }
});

const loadSettings = async () => {
  try {
    const response = await $fetch('/api/settings');
    if (response && response.llm) {
      // Set the selected provider to the active one
      selectedProvider.value = response.llm.active_provider as 'openai' | 'anthropic' | 'ollama' | 'azure';

      // Prefill values if they exist, otherwise leave empty (placeholder will show)
      const providers = response.llm.providers;
      settings.value = {
        llm: {
          active_provider: response.llm.active_provider,
          providers: {
            openai: {
              baseUrl: providers.openai?.baseUrl || '',
              apiKey: providers.openai?.apiKey || '',
              model: providers.openai?.model || ''
            },
            anthropic: {
              baseUrl: providers.anthropic?.baseUrl || '',
              apiKey: providers.anthropic?.apiKey || '',
              model: providers.anthropic?.model || ''
            },
            ollama: {
              baseUrl: providers.ollama?.baseUrl || '',
              model: providers.ollama?.model || ''
            },
            azure: {
              endpoint: providers.azure?.endpoint || '',
              apiKey: providers.azure?.apiKey || '',
              deploymentName: providers.azure?.deploymentName || '',
              apiVersion: providers.azure?.apiVersion || ''
            }
          }
        }
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

const saveSettings = async () => {
  saving.value = true;
  showSuccess.value = false;

  try {
    // Update active provider based on selected provider
    settings.value.llm.active_provider = selectedProvider.value;

    await $fetch('/api/settings', {
      method: 'POST',
      body: settings.value
    });

    showSuccess.value = true;
    setTimeout(() => {
      showSuccess.value = false;
      emit('close');
    }, 1500);
  } catch (error) {
    console.error('Error saving settings:', error);
    toast.error('Failed to save settings. Please try again.');
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showSuccess.value = false;
  emit('close');
};
</script>
