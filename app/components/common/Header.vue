<template>
  <div class="flex flex-row items-center text-sm gap-0 mb-6 w-full justify-between">
    <div class="flex flex-row items-center">
      <Icon name="ri:github-fill" class="w-4 h-4 text-white" />
      <Icon name="heroicons:slash-20-solid" class="w-4 h-4 text-white" />
      <span class="text-white text-sm">soumodip</span>
      <Icon name="heroicons:slash-20-solid" class="w-4 h-4 text-white" />
      <span class="text-white text-sm">mock-server</span>
      <button @click="copyToClipboard" class="ml-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
        <Icon name="heroicons:clipboard-document" class="w-4 h-4 mt-1" />
      </button>
      <button @click="navigateTo(githubRepositoryUri, { external: true, open: { target: '_blank' } })" class="ml-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
        <Icon name="akar-icons:link-out" class="w-4 h-4 mt-1" />
      </button>
    </div>
    <div class="flex flex-row items-center">
      <button @click="showSettingsModal = true" class="text-xs mr-4 flex items-center cursor-pointer relative top-[-2px] text-white hover:opacity-80 transition-opacity">
        <Icon name="hugeicons:settings-05" class="w-4 h-4 mr-0.5" />
        <span class="ml-1">Settings</span>
      </button>
      <button v-if="isAuthEnabled" @click="handleLogout" class="text-xs mr-4 flex items-center cursor-pointer relative top-[-2px] text-white hover:opacity-80 transition-opacity">
        <Icon name="ic:baseline-logout" class="w-4 h-4 mr-0.5" />
        <span class="ml-1">Logout</span>
      </button>
    </div>
  </div>
  <div class="flex flex-row justify-between items-center px-4 pt-2 bg-[#242736] border border-1 border-gray-500/35 rounded-lg">
    <div class="flex flex-row items-center">
      <div class="flex items-center mr-8">
        <div @click="navigateToPage('/')" class="pb-2 text-md font-medium text-white hover:text-gray-100 transition-all cursor-pointer" :class="route.path === '/' ? 'opacity-100' : 'opacity-35'">
          <span class="flex-row items-center">
            Mock Server
            <button @click.stop="openInfoModal('mockServer')"
              class="ml-1 text-gray-400 hover:text-gray-300 rounded-full p-1 transition-all">
              <Icon name="mdi:information-outline" class="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>
      <div class="flex items-center">
        <div @click="navigateToPage('/prompts')" class="pb-2 text-md font-medium text-white hover:text-gray-100 transition-all cursor-pointer" :class="route.path === '/prompts' ? 'opacity-100' : 'opacity-35'">
          <span class="flex-row items-center">
            Prompts
            <button @click.stop="openInfoModal('prompts')"
              class="ml-1 text-gray-400 hover:text-gray-300 rounded-full p-1 transition-all">
              <Icon name="mdi:information-outline" class="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <div @click="navigateToPage('/integrations')" class="text-sm flex items-center cursor-pointer relative top-[-2px] transition-all" :class="route.path === '/integrations' ? 'opacity-100' : 'opacity-35'">
        <Icon name="material-symbols-light:sdk" class="w-6 h-6 text-white hover:text-gray-300 transition-colors" />
        <span class="ml-2 text-white hover:text-gray-300 transition-colors">Integrate Docs with SDK</span>
      </div>
      <div class="px-1 text-sm text-gray-700">/</div>
      <div class="relative">
        <button @click="toggleAddonsDropdown" class="text-sm flex items-center cursor-pointer relative top-[-2px] transition-all hover:opacity-80" :class="['/webhook-logs'].includes(route.path) ? 'opacity-100' : 'opacity-35'">
          <span class="text-white">Addons</span>
          <Icon name="heroicons:chevron-down" class="w-4 h-4 text-white ml-1" :class="{ 'rotate-180': showAddonsDropdown }" />
        </button>
        <div v-if="showAddonsDropdown" class="absolute right-0 top-8 bg-[#1a1d2e] border border-gray-700 rounded-lg shadow-lg z-50 min-w-[165px]">
          <div @click="handleAddonClick('/webhook-logs')" class="px-4 py-2 text-sm text-white hover:bg-[#2a2d3e] cursor-pointer flex items-center rounded-lg transition-all" :class="route.path === '/webhook-logs' ? 'opacity-100' : 'opacity-35'">
            <Icon name="carbon:pull-request" class="w-4 h-4 mr-2" />
            <span>Test Webhooks</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <CommonInfoModal :show="showInfoModal" :title="modalTitle" :content="modalContent" @close="showInfoModal = false" />
  <ModalsSettings :show="showSettingsModal" @close="showSettingsModal = false" />
</template>

<script setup lang="ts">
import type { external } from 'jszip';

const route = useRoute();
const router = useRouter();
const showInfoModal = ref(false);
const modalTitle = ref('');
const modalContent = ref('');
const githubRepositoryUri = ref('https://github.com/soumodip/mock-server');
const showAddonsDropdown = ref(false);
const showSettingsModal = ref(false);

const toggleAddonsDropdown = () => {
  showAddonsDropdown.value = !showAddonsDropdown.value;
};

const handleAddonClick = (path: string) => {
  showAddonsDropdown.value = false;
  navigateToPage(path);
};

// Auth composable
const { logout, isAuthEnabled } = useAuth();

const handleLogout = () => {
  logout();
};

const infoContent = {
  mockServer: {
    title: 'Mock Server',
    content: `This mock server helps you quickly prototype and test your APIs without building the actual backend.

Features:

• Upload OpenAPI specifications to auto-generate mock endpoints
• Test your API endpoints, and change responses in real-time
• Share your API configurations with team members
• Generate Node.js server code from your mock definitions ( optional )

Use this to build your API structure before implementing the actual backend logic.`
  },
  prompts: {
    title: 'Prompts',
    content: `Using the API structure from your mock server, you can build complete applications systematically.

Development Flow:

1. <b>Mock Server</b> - Define your API structure and endpoints
2. <b>Frontend/App & Admin Panel</b> - Build your interfaces using the mock APIs
3. <b>Backend</b> - Once frontend is working, use prompts to generate the actual backend implementation

This approach ensures your frontend and backend are perfectly aligned, reducing integration issues and speeding up development.`
  }
};

const openInfoModal = (type: 'mockServer' | 'prompts') => {
  const info = infoContent[type];
  modalTitle.value = info.title;
  modalContent.value = info.content;
  showInfoModal.value = true;
};

const navigateToPage = (path: string) => {
  const currentPath = route.path;
  const projectId = route.query.project_id;

  if (path === '/integrations' || path === '/webhook-logs') {
    // Use window.location for navigation from integrations/webhook-logs page
    if (projectId) {
      window.location.href = `${path}?project_id=${projectId}`;
    } else {
      window.location.href = path;
    }
  } else {
    // Use router.push for other navigations
    if (projectId) {
      router.push({ path, query: { project_id: projectId } });
    } else {
      router.push(path);
    }
  }
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(githubRepositoryUri.value);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
</script>
