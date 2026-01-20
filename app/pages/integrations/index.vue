<template>
  <div class="min-h-screen bg-[#1a1d2e] p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <HeaderContainer />

      <!-- Integrations Section -->
      <div class="mb-12 mt-12">
        <div class="flex items-center gap-2 mb-5 ml-4">
          <h2 class="text-xl font-medium text-gray-300">SDK Integrations</h2>
        </div>
        <div class="bg-[#242736] rounded-xl shadow-lg p-4 space-y-4">
          <!-- Project Selection -->
          <div>
            <label class="text-xs text-gray-400 mb-2 ml-2 block">Project</label>
            <CommonDropdown v-model="selectedProjectId" :options="projectOptions" placeholder="Select a project"
              @change="handleProjectChange" />
            <p v-if="projectOptions.length === 0" class="text-xs text-gray-500 mt-2 ml-2">
              No projects found. Go to <strong class="text-gray-400">Mock Server</strong> tab and create a new project
            </p>
          </div>

          <!-- Integration Selection/Creation -->
          <div v-if="selectedProjectId">
            <div class="flex items-center gap-2 mb-2">
              <label class="text-xs text-gray-400 ml-2 block">Environments</label>
              <button
                v-if="selectedProjectId && integrations.length > 0"
                @click="openEditIntegrationsModal"
                class="text-gray-400 text-xs flex flex-row items-center gap-1"
                title="Edit environments"
              >
                Edit <Icon name="mingcute:edit-4-line" class="w-3 h-3" />
              </button>
            </div>
            <div class="flex gap-2">
              <CommonDropdown v-model="selectedIntegrationId" :options="integrationOptions"
                :placeholder="integrationOptions.length > 0 ? 'Select an environment' : 'No environments found. Create one using +New environment.'"
                @change="handleIntegrationChange" class="flex-1" />
              <button v-if="canWrite()" @click="openCreateIntegrationModal"
                class="px-4 py-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm">
                <Icon name="mdi:plus" class="w-4 h-4" />
                New
              </button>
            </div>

            <!-- Integration ID Display -->
            <div v-if="selectedIntegration" class="mt-2 ml-2 text-xs text-gray-500">
              ID: {{ selectedIntegration.id }}
            </div>
          </div>

          <div v-if="canWrite()" class="flex flex-col space-y-4">
            <div class="border-b border-b-1 border-gray-700 opacity-60 my-3" />
            <!-- Heading -->
            <div v-if="selectedIntegration">
              <label class="text-xs text-gray-400 mb-2 ml-2 block">Heading</label>
              <input v-model="heading" type="text" placeholder="Mock Server SDK"
                class="w-full px-3 py-1.5 border border-gray-600 bg-[#1a1d2e] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500" />
            </div>

            <!-- Font Settings -->
            <div v-if="selectedIntegration" class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-400 mb-2 ml-2 block">Primary Font</label>
                <CommonDropdown v-model="primaryFont" :options="fontOptions" placeholder="Select primary font" />
              </div>
              <div>
                <label class="text-xs text-gray-400 mb-2 ml-2 block">Code Font</label>
                <CommonDropdown v-model="codeFont" :options="fontOptions" placeholder="Select code font" />
              </div>
            </div>

            <!-- Theme Setting -->
            <div v-if="selectedIntegration">
              <label class="text-xs text-gray-400 mb-2 ml-2 block">Theme</label>
              <CommonDropdown v-model="theme" :options="themeOptions" placeholder="Select theme" />
            </div>

            <!-- Allow Postman Download -->
            <div v-if="selectedIntegration">
              <div class="flex items-center gap-3 mt-2 ml-2">
                <button type="button" @click="togglePostmanDownload"
                  class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                  :class="allowPostmanDownload
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'">
                  <Icon name="mdi:check" class="w-4 h-4 text-white transition-all duration-200"
                    :class="allowPostmanDownload ? 'opacity-100 scale-100' : 'opacity-0 scale-0'" />
                </button>
                <label class="text-sm font-medium text-gray-300 cursor-pointer" @click="togglePostmanDownload">
                  Allow Postman Download
                </label>
              </div>
              <p class="text-xs text-gray-500 ml-8 mt-1">
                Enable users to download the API collection from the SDK
              </p>
            </div>

            <!-- Expand to Full Page -->
            <div v-if="selectedIntegration">
              <div class="flex items-center gap-3 mb-1 ml-2">
                <button type="button" @click="toggleExpandToFullPage"
                  class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                  :class="expandToFullPage
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'">
                  <Icon name="mdi:check" class="w-4 h-4 text-white transition-all duration-200"
                    :class="expandToFullPage ? 'opacity-100 scale-100' : 'opacity-0 scale-0'" />
                </button>
                <label class="text-sm font-medium text-gray-300 cursor-pointer" @click="toggleExpandToFullPage">
                  Expand to Full Page
                </label>
              </div>
              <p class="text-xs text-gray-500 ml-8 mt-1">
                Display API endpoints in a sidebar on the left with content on the right
              </p>
            </div>

            <!-- Display Entities -->
            <div v-if="selectedIntegration && expandToFullPage">
              <div class="flex items-center gap-3 mb-1 ml-2">
                <button type="button" @click="toggleDisplayEntities"
                  class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                  :class="displayEntities
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'">
                  <Icon name="mdi:check" class="w-4 h-4 text-white transition-all duration-200"
                    :class="displayEntities ? 'opacity-100 scale-100' : 'opacity-0 scale-0'" />
                </button>
                <label class="text-sm font-medium text-gray-300 cursor-pointer" @click="toggleDisplayEntities">
                  Display Entities
                </label>
              </div>
              <p class="text-xs text-gray-500 ml-8 mt-1">
                Show entity objects in the sidebar where isEntity is set to true
              </p>
            </div>

            <!-- Primary Documentation -->
            <div v-if="selectedIntegration && expandToFullPage">
              <div class="flex items-center gap-3 mb-1 ml-2">
                <button type="button" @click="toggleIsPrimaryDocs"
                  class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                  :class="isPrimaryDocs
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'">
                  <Icon name="mdi:check" class="w-4 h-4 text-white transition-all duration-200"
                    :class="isPrimaryDocs ? 'opacity-100 scale-100' : 'opacity-0 scale-0'" />
                </button>
                <label class="text-sm font-medium text-gray-300 cursor-pointer" @click="toggleIsPrimaryDocs">
                  Primary Documentation
                </label>
              </div>
              <p class="text-xs text-gray-500 ml-8 mt-1">
                Set this as the primary documentation. When IS_DOCS_MODE is enabled, all pages will redirect here.
              </p>
            </div>

            <!-- Allowed Websites (CORS) -->
            <div v-if="selectedIntegration">
              <label class="text-xs text-gray-400 mb-2 ml-2 block">Allowed Websites (CORS)</label>
              <div class="space-y-2">
                <div v-for="(origin, index) in allowedOrigins" :key="index" class="flex gap-2">
                  <input v-model="allowedOrigins[index]" type="text" placeholder="https://example.com"
                    class="flex-1 px-3 py-1.5 border border-gray-600 bg-[#1a1d2e] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500" />
                  <button @click="removeOrigin(index)"
                    class="px-3 py-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center text-sm">
                    <Icon name="mdi:minus" class="w-4 h-4" />
                  </button>
                </div>
                <button @click="addOrigin"
                  class="w-full px-3 py-1.5 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors flex items-center justify-center gap-1.5 text-sm">
                  <Icon name="mdi:plus" class="w-4 h-4" />
                  Add Website
                </button>
                <p class="text-xs text-gray-500 ml-2">
                  Only websites in this list can load the SDK. Leave empty to allow all origins.
                </p>
              </div>
            </div>

            <!-- Save Button -->
            <div v-if="selectedIntegration" class="flex justify-end pt-2">
              <button @click="saveAllSettings"
                class="pl-4 pr-2 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm">
                Save Changes
                <Icon name="icon-park-outline:right" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Docs URI (only shown if full page is enabled) -->
      <div v-if="selectedIntegration && expandToFullPage" class="mb-12 px-4">
        <h2 class="text-xl font-medium text-gray-300 mb-2">Documentation URL</h2>
        <div class="w-full flex justify-between items-center">
          <div class="flex items-center gap-2">
            <code class="text-sm text-gray-400 break-all font-google-sans-code">
              {{ docsUri }}
            </code>
            <button @click="saveAndPerformAction(() => navigateTo(docsUri, { open: { target: '_blank' }, external: true }))" class="text-gray-400 hover:text-gray-300 transition-colors">
              <Icon name="akar-icons:link-out" class="w-3 h-3" />
            </button>
          </div>
          <button @click="saveAndPerformAction(() => copyToClipboard(docsUri))" class="text-gray-400 hover:text-gray-300 transition-colors">
            <Icon name="mdi:content-copy" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- SDK Integration Guide -->
      <div v-if="selectedIntegration" class="mb-12">
        <div class="flex items-center gap-2 mb-5 ml-4 cursor-pointer" @click="integrationGuideOpen = !integrationGuideOpen">
          <h2 class="text-xl font-medium text-gray-300">Integration Guide</h2>
          <Icon
            :name="integrationGuideOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
            class="w-5 h-5 text-gray-400 transition-transform duration-200"
          />
        </div>
        <div v-show="integrationGuideOpen" class="bg-[#242736] rounded-xl shadow-lg p-6 space-y-4">
          <p v-if="selectedIntegration && expandToFullPage" class="text-gray-200 text-sm font-medium">Note: As you have enabled full page mode, the documentation URL is the recommended way to access the documentation. The document integration steps below makes less of an use case in this scenario, as it is intended for widgets in your webpage.</p>
          <p class="text-gray-400 text-sm">
            Add this script to your website to load the Mock Server SDK. This will display a customizable API
            playground where users can select different response scenarios for testing.
          </p>

          <div class="bg-[#2d3142] rounded-lg p-4 border border-gray-600">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-400">Integration Script</span>
              <button @click="saveAndPerformAction(() => copyToClipboard(integrationScript))"
                class="text-gray-400 hover:text-gray-300 transition-colors">
                <Icon name="mdi:content-copy" class="w-4 h-4" />
              </button>
            </div>
            <code class="text-sm text-green-400 break-all font-google-sans-code">
              {{ '<div id="api-playground"></div>' }}
              <br/>..<br/>
              {{ integrationScript }}
            </code>
          </div>

          <div class="bg-[#2d3142] rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-300 mb-2">How it works:</h3>
            <ul class="list-disc list-inside text-xs text-gray-400 space-y-1">
              <li>The script loads a floating SDK panel on the right side of your page</li>
              <li>Each page load creates a unique session for that user</li>
              <li>Users can customize API responses in real-time using the SDK panel</li>
              <li>Perfect for testing different scenarios without changing code</li>
            </ul>
          </div>

          <div class="bg-[#2d3142] rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-300 mb-2">Filtering Options:</h3>
            <ul class="list-disc list-inside text-xs text-gray-400 space-y-1">
              <li>Filter by group: Add <code
                  class="text-gray-400 bg-[#1a1d2e] px-1 py-0.5 rounded">?group=&lt;group_name&gt;</code> to the script
                src to only load APIs from a specific group</li>
              <li>Filter by API ID: Add <code
                  class="text-gray-400 bg-[#1a1d2e] px-1 py-0.5 rounded">?apiId=&lt;api_id&gt;</code> to the script src
                to only show a specific API</li>
              <li>Example: <code
                  class="text-gray-400 bg-[#1a1d2e] px-1 py-0.5 rounded">&lt;script src="...?group=Users"&gt;&lt;/script&gt;</code>
              </li>
            </ul>
          </div>

          <div class="flex justify-end">
            <button @click="saveAndPerformAction(() => navigateTo(`/integrations/demo?projectId=${selectedProjectId}&integrationId=${selectedIntegrationId}`, { open: { target: '_blank' } }))"
              class="px-4 py-2 text-gray-300 rounded-full flex items-center gap-2 text-sm">
              <Icon name="mdi:play-circle-outline" class="w-4 h-4" />
              See Demo
            </button>
          </div>
        </div>
      </div>

      <!-- Sessions Table -->
      <div v-if="selectedIntegration" class="mb-8">
        <div class="flex items-center justify-between mb-5 ml-4">
          <h2 class="text-xl font-medium text-gray-300">Active Sessions</h2>
          <div class="flex items-center gap-2">
            <button v-if="canDelete()" @click="clearSessions"
              class="text-gray-500 rounded-full hover:text-white transition-colors flex items-center gap-1.5 text-sm">
              <Icon name="material-symbols:layers-clear-rounded" class="w-4 h-4" />
              Clear
            </button>
            <button @click="loadSessions"
              class="text-gray-400 rounded-full hover:text-white transition-colors flex items-center gap-1.5 text-sm">
              <Icon name="mdi:refresh" class="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div class="bg-[#242736] rounded-xl shadow-lg overflow-hidden">
          <div v-if="sessions.length === 0" class="p-8 text-center">
            <Icon name="mdi:clipboard-text-outline" class="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p class="text-gray-400 text-sm">No sessions yet</p>
            <p class="text-gray-500 text-xs mt-1">Sessions will appear when users load your integration</p>
          </div>

          <div v-else class="w-full">
            <table class="w-full table-fixed">
              <thead class="bg-[#2d3142] block w-full">
                <tr class="flex w-full">
                  <th class="flex-1 px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Session
                    ID</th>
                  <th class="flex-1 px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created At
                  </th>
                  <th class="flex-1 px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last
                    Updated</th>
                  <th class="flex-1 px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Overrides
                  </th>
                </tr>
              </thead>
              <tbody class="block w-full max-h-[480px] overflow-y-auto divide-y divide-gray-700">
                <tr v-for="session in sessions" :key="session.id"
                  class="flex w-full hover:bg-[#2d3142] transition-colors cursor-pointer"
                  @click="viewSessionDetails(session)">
                  <td class="flex-1 px-4 py-3 text-sm text-gray-300 font-mono">{{ session.id }}</td>
                  <td class="flex-1 px-4 py-3 text-sm text-gray-400">{{ formatDate(session.createdAt) }}</td>
                  <td class="flex-1 px-4 py-3 text-sm text-gray-400">{{ formatDate(session.updatedAt) }}</td>
                  <td class="flex-1 px-4 py-3 text-sm text-gray-400">
                    <span v-if="sessionResponseCounts[session.id]"
                      class="py-1 text-gray-500 rounded-full text-xs">
                      {{ sessionResponseCounts[session.id] }} custom responses
                    </span>
                    <span v-else class="text-gray-500 text-xs">None</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-gray-500 text-sm mt-2 ml-2">Note: whenever someone opens your documentation page, it is recorded as a session.</p>
      </div>

      <div class="flex justify-center items-center w-full text-white text-xs gap-1.5 mt-24 mb-2">
        <Icon name="mdi:code" class="w-4 h-4" />
        <p>by
          <a href="https://in.linkedin.com/in/soumodippaul" target="_blank">Soumodip Paul</a>
        </p>
      </div>
    </div>

    <!-- Create Integration Modal -->
    <ModalsIntegrationsCreate
      :show="showCreateModal"
      :loading="loading"
      @close="closeCreateModal"
      @create="createIntegration"
    />

    <!-- Session Details Modal -->
    <ModalsIntegrationsSessionDetails
      :show="showSessionModal"
      :session="selectedSession"
      :responses="sessionResponses"
      :all-apis="allApis"
      @close="closeSessionModal"
    />

    <!-- Getting Started Modal -->
    <ModalsGettingStarted v-if="modal?.type == 'getting-started'" :heading="gettingStartedData.heading"
      :youtube-video-link="gettingStartedData.youtubeVideoLink" :description="gettingStartedData.description"
      @close="closeModal" />

    <!-- Integrations CRUD Modal -->
    <IntegrationsModal
      :show="showEditIntegrationsModal"
      :integrations="integrations"
      @close="closeEditIntegrationsModal"
      @update="handleIntegrationsUpdate"
    />

    <!-- Floating Info Button -->
    <button @click="openModal('getting-started', null)"
      class="fixed bottom-6 right-6 bg-[#2d3142] text-gray-300 rounded-full shadow-lg transition-colors flex items-center justify-center w-10 h-10 hover:bg-[#353849]"
      title="Info">
      <Icon name="teenyicons:screen-outline" class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
// Components
import HeaderContainer from '~/components/common/Header.vue';
import CommonDropdown from '~/components/common/Dropdown.vue';
import IntegrationsModal from '~/components/modals/integrations/Crud.vue'
// Stores
import { useProjectStore } from '~/stores/project';

interface Integration {
  id: string;
  name: string;
  projectId: string;
  isActive: boolean;
  allowedOrigins: string[];
  primaryFont?: string;
  codeFont?: string;
  heading?: string;
  allowPostmanDownload?: boolean;
  expandToFullPage?: boolean;
  createdAt: string;
  updatedAt: string;
}

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

const projectStore = useProjectStore();

const appConfig = useAppConfig();
const mockServerBaseUri = appConfig.baseUri || `http://localhost:4001`;

// Modal management
interface Modal {
  type: string;
  data?: any;
}

const modal = ref<Modal | null>(null);

const selectedProjectId = ref<string | null>(null);
const selectedIntegrationId = ref<string | null>(null);
const integrations = ref<Integration[]>([]);
const sessions = ref<Session[]>([]);
const sessionResponseCounts = ref<Record<string, number>>({});
const sessionResponses = ref<SessionResponse[]>([]);
const selectedSession = ref<Session | null>(null);
const allApis = ref<any[]>([]);

const showCreateModal = ref(false);
const showSessionModal = ref(false);
const showEditIntegrationsModal = ref(false);
const loading = ref(false);
const allowedOrigins = ref<string[]>([]);
const primaryFont = ref('Poppins');
const codeFont = ref('Google Sans Code');
const heading = ref('');
const allowPostmanDownload = ref(false);
const expandToFullPage = ref(false);
const displayEntities = ref(false);
const isPrimaryDocs = ref(false);
const theme = ref('dark');
const googleFonts = ref<any[]>([]);
const integrationGuideOpen = ref(true);

const projectOptions = computed(() => {
  return projectStore.projects?.map((p) => ({
    label: p.name,
    value: p.id,
  })) || [];
});

const integrationOptions = computed(() => {
  return integrations.value.map((i) => ({
    label: i.name,
    value: i.id,
  }));
});

const themeOptions = computed(() => {
  return [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
  ];
});

const fontOptions = computed(() => {
  return googleFonts.value.map((font) => ({
    label: font.family,
    value: font.family,
  }));
});

const selectedIntegration = computed(() => {
  return integrations.value.find((i) => i.id === selectedIntegrationId.value) || null;
});

const integrationScript = computed(() => {
  if (!selectedIntegration.value) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : `${mockServerBaseUri}`;
  return `<script src="${origin}/sdk/${selectedIntegration.value.id}"><\/script>`;
});

const docsUri = computed(() => {
  if (!selectedProjectId.value || !selectedIntegrationId.value) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : `${mockServerBaseUri}`;
  return `${origin}/docs/${selectedProjectId.value}/${selectedIntegrationId.value}`;
});

const { canWrite, canDelete } = useAuth();

const handleProjectChange = async () => {
  // Update URL with project_id
  const router = useRouter();
  if (selectedProjectId.value) {
    router.push({ query: { project_id: selectedProjectId.value } });
  } else {
    router.push({ query: {} });
  }

  selectedIntegrationId.value = null;
  sessions.value = [];
  sessionResponseCounts.value = {};
  await loadIntegrations();
  await loadApis();
  await autoSelectIntegration();
};

const handleIntegrationChange = async () => {
  // Update URL with both project_id and integration_id
  const router = useRouter();
  if (selectedProjectId.value && selectedIntegrationId.value) {
    router.push({
      query: {
        project_id: selectedProjectId.value,
        integration_id: selectedIntegrationId.value
      }
    });
  } else if (selectedProjectId.value) {
    router.push({ query: { project_id: selectedProjectId.value } });
  }

  await loadSessions();
  if (selectedIntegration.value) {
    allowedOrigins.value = selectedIntegration.value.allowedOrigins || [];
    primaryFont.value = selectedIntegration.value.primaryFont || 'Poppins';
    codeFont.value = selectedIntegration.value.codeFont || 'Google Sans Code';
    heading.value = selectedIntegration.value.heading || '';
    allowPostmanDownload.value = selectedIntegration.value.allowPostmanDownload || false;
    expandToFullPage.value = selectedIntegration.value.expandToFullPage || false;
    displayEntities.value = (selectedIntegration.value as any).displayEntities || false;
    isPrimaryDocs.value = (selectedIntegration.value as any).isPrimaryDocs || false;
    theme.value = (selectedIntegration.value as any).theme || 'dark';
    // Set Integration Guide open state based on expandToFullPage
    integrationGuideOpen.value = !expandToFullPage.value;
  }
};

const loadIntegrations = async () => {
  if (!selectedProjectId.value) {
    integrations.value = [];
    return;
  }

  try {
    const data = await $fetch<Integration[]>(`/api/integrations?projectId=${selectedProjectId.value}`);
    integrations.value = data;
  } catch (error) {
    console.error('Failed to load integrations:', error);
    integrations.value = [];
  }
};

const autoSelectIntegration = async () => {
  if (integrations.value.length === 0) return;

  // Check if 'sandbox' integration exists (case-insensitive)
  const sandboxIntegration = integrations.value.find(
    (i) => i.name.toLowerCase() === 'sandbox'
  );

  if (sandboxIntegration) {
    selectedIntegrationId.value = sandboxIntegration.id;
  } else {
    // Select the first integration
    const firstIntegration = integrations.value[0];
    if (firstIntegration) {
      selectedIntegrationId.value = firstIntegration.id;
    }
  }

  await handleIntegrationChange();
};

const loadSessions = async () => {
  if (!selectedIntegrationId.value) {
    sessions.value = [];
    return;
  }

  try {
    const data = await $fetch<Session[]>(`/api/sessions?integrationId=${selectedIntegrationId.value}`);
    sessions.value = data;
    await loadSessionResponseCounts();
  } catch (error) {
    console.error('Failed to load sessions:', error);
    sessions.value = [];
  }
};

const clearSessions = async () => {
  if (!selectedIntegrationId.value) return;

  if (!confirm('Are you sure you want to clear all sessions for this integration? This action cannot be undone.')) {
    return;
  }

  try {
    await $fetch(`/api/sessions/clear?integrationId=${selectedIntegrationId.value}`, {
      method: 'DELETE',
    });
    sessions.value = [];
    sessionResponseCounts.value = {};
  } catch (error) {
    console.error('Failed to clear sessions:', error);
    alert('Failed to clear sessions');
  }
};

const loadSessionResponseCounts = async () => {
  const counts: Record<string, number> = {};

  for (const session of sessions.value) {
    try {
      const responses = await $fetch<SessionResponse[]>(`/api/session-responses?sessionId=${session.id}`);
      counts[session.id] = responses.length;
    } catch (error) {
      console.error('Failed to load session responses count:', error);
      counts[session.id] = 0;
    }
  }

  sessionResponseCounts.value = counts;
};

const loadApis = async () => {
  if (!selectedProjectId.value) {
    allApis.value = [];
    return;
  }

  try {
    const data = await $fetch<any[]>(`/api/mocks?projectId=${selectedProjectId.value}`);
    allApis.value = data;
  } catch (error) {
    console.error('Failed to load APIs:', error);
    allApis.value = [];
  }
};

const openCreateIntegrationModal = () => {
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

const createIntegration = async (name: string) => {
  if (!name || !selectedProjectId.value) return;

  loading.value = true;
  try {
    const newIntegration = await $fetch<Integration>('/api/integrations', {
      method: 'POST',
      body: {
        name: name,
        projectId: selectedProjectId.value,
      },
    });

    integrations.value.push(newIntegration);
    selectedIntegrationId.value = newIntegration.id;
    closeCreateModal();
  } catch (error) {
    console.error('Failed to create integration:', error);
    alert('Failed to create integration');
  } finally {
    loading.value = false;
  }
};

const viewSessionDetails = async (session: Session) => {
  selectedSession.value = session;
  try {
    const responses = await $fetch<SessionResponse[]>(`/api/session-responses?sessionId=${session.id}`);
    sessionResponses.value = responses;
    showSessionModal.value = true;
  } catch (error) {
    console.error('Failed to load session details:', error);
    alert('Failed to load session details');
  }
};

const closeSessionModal = () => {
  showSessionModal.value = false;
  selectedSession.value = null;
  sessionResponses.value = [];
};

const getApiName = (apiId: string): string => {
  const api = allApis.value.find((a) => a.id === apiId);
  return api ? `${api.method} ${api.endpoint}` : 'Unknown API';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const saveAndPerformAction = async (action: () => unknown) => {
  if (selectedIntegrationId.value && canWrite()) {
    await saveAllSettings();
  }
  await action();
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const addOrigin = () => {
  allowedOrigins.value.push('');
};

const removeOrigin = (index: number) => {
  allowedOrigins.value.splice(index, 1);
};

const togglePostmanDownload = () => {
  allowPostmanDownload.value = !allowPostmanDownload.value;
};

const toggleExpandToFullPage = () => {
  expandToFullPage.value = !expandToFullPage.value;
  // If expandToFullPage is turned off, also turn off displayEntities and open Integration Guide
  if (!expandToFullPage.value) {
    displayEntities.value = false;
    integrationGuideOpen.value = true;
  } else {
    // If expandToFullPage is turned on, close Integration Guide
    integrationGuideOpen.value = false;
  }
};

const toggleDisplayEntities = () => {
  displayEntities.value = !displayEntities.value;
};

const toggleIsPrimaryDocs = () => {
  isPrimaryDocs.value = !isPrimaryDocs.value;
};

const saveAllSettings = async () => {
  if (!selectedIntegrationId.value) return;

  try {
    // Filter out empty origins
    const validOrigins = allowedOrigins.value.filter(o => o.trim() !== '');

    const response = await $fetch(`/api/integrations/${selectedIntegrationId.value}`, {
      method: 'PUT' as any,
      body: {
        primaryFont: primaryFont.value || 'Poppins',
        codeFont: codeFont.value || 'Google Sans Code',
        heading: heading.value || '',
        allowPostmanDownload: allowPostmanDownload.value || false,
        expandToFullPage: expandToFullPage.value || false,
        displayEntities: displayEntities.value || false,
        isPrimaryDocs: isPrimaryDocs.value || false,
        allowedOrigins: validOrigins,
        theme: theme.value || 'dark',
      },
    });

    // Update local integration with response data
    const integration = integrations.value.find(i => i.id === selectedIntegrationId.value);
    if (integration && response) {
      integration.primaryFont = (response as any).primaryFont;
      integration.codeFont = (response as any).codeFont;
      integration.heading = (response as any).heading;
      integration.allowPostmanDownload = (response as any).allowPostmanDownload;
      integration.expandToFullPage = (response as any).expandToFullPage;
      (integration as any).displayEntities = (response as any).displayEntities;
      (integration as any).isPrimaryDocs = (response as any).isPrimaryDocs;
      integration.allowedOrigins = (response as any).allowedOrigins || validOrigins;
      (integration as any).theme = (response as any).theme;
    }

    // If isPrimaryDocs was set to true, update other integrations in the local state
    if (isPrimaryDocs.value) {
      integrations.value.forEach(i => {
        if (i.id !== selectedIntegrationId.value) {
          (i as any).isPrimaryDocs = false;
        }
      });
    }

    // Sync local state with what was actually saved
    allowedOrigins.value = validOrigins;
  } catch (error: any) {
    console.error('Failed to save settings:', error);
    const errorMessage = error?.data?.message || error?.message || 'Unknown error occurred';
    alert(`Failed to save settings: ${errorMessage}`);
  }
};

const updateIntegrationSettings = async () => {
  if (!selectedIntegrationId.value) return;

  try {
    const response = await $fetch(`/api/integrations/${selectedIntegrationId.value}`, {
      method: 'PUT' as any,
      body: {
        primaryFont: primaryFont.value || 'Poppins',
        codeFont: codeFont.value || 'Google Sans Code',
        heading: heading.value || '',
        allowPostmanDownload: allowPostmanDownload.value || false,
      },
    });

    // Update local integration with response data
    const integration = integrations.value.find(i => i.id === selectedIntegrationId.value);
    if (integration && response) {
      integration.primaryFont = (response as any).primaryFont;
      integration.codeFont = (response as any).codeFont;
      integration.heading = (response as any).heading;
      integration.allowPostmanDownload = (response as any).allowPostmanDownload;
    }
  } catch (error: any) {
    console.error('Failed to update integration settings:', error);
    const errorMessage = error?.data?.message || error?.message || 'Unknown error occurred';
    alert(`Failed to update integration settings: ${errorMessage}`);
  }
};

const updateCorsSettings = async () => {
  if (!selectedIntegrationId.value) return;

  // Filter out empty origins
  const validOrigins = allowedOrigins.value.filter(o => o.trim() !== '');

  try {
    const response = await $fetch(`/api/integrations/${selectedIntegrationId.value}`, {
      method: 'PUT' as any,
      body: {
        allowedOrigins: validOrigins,
      },
    });

    // Update local integration with response data
    const integration = integrations.value.find(i => i.id === selectedIntegrationId.value);
    if (integration && response) {
      integration.allowedOrigins = (response as any).allowedOrigins || validOrigins;
    }

    // Sync local state with what was actually saved
    allowedOrigins.value = validOrigins;
  } catch (error: any) {
    console.error('Failed to update CORS settings:', error);
    const errorMessage = error?.data?.message || error?.message || 'Unknown error occurred';
    alert(`Failed to update CORS settings: ${errorMessage}`);
  }
};

const loadProjects = async () => {
  await projectStore.fetchProjects();
};

const loadGoogleFonts = async () => {
  try {
    const data = await $fetch<any[]>('/fonts/google.json');
    googleFonts.value = data;
  } catch (error) {
    console.error('Failed to load Google fonts:', error);
    googleFonts.value = [];
  }
};

// Getting Started Modal
const GETTING_STARTED_STORAGE_KEY = 'integrations-getting-started-modal-shown';
const gettingStartedData = {
  heading: 'Getting Started with Integrations',
  youtubeVideoLink: 'https://youtu.be/hjq5W9-jh6I?t=1029', // Replace with your actual video
  description: 'Learn how to integrate your API mocks with your applications using our SDK.'
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

const openEditIntegrationsModal = () => {
  showEditIntegrationsModal.value = true;
};

const closeEditIntegrationsModal = () => {
  showEditIntegrationsModal.value = false;
};

const handleIntegrationsUpdate = async () => {
  await loadIntegrations();
  // If the currently selected integration was deleted, clear the selection
  if (selectedIntegrationId.value && !integrations.value.find(i => i.id === selectedIntegrationId.value)) {
    selectedIntegrationId.value = null;
    sessions.value = [];
    sessionResponseCounts.value = {};
  }
};

onMounted(async () => {
  await loadProjects();
  await loadGoogleFonts();

  // Check if project_id and integration_id are in URL and auto-select them
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
  const integrationId = route.query.integration_id;

  if (projectId && typeof projectId === 'string') {
    selectedProjectId.value = projectId;
    await loadIntegrations();
    await loadApis();

    if (integrationId && typeof integrationId === 'string') {
      selectedIntegrationId.value = integrationId;
      await handleIntegrationChange();
    } else {
      // Auto-select integration if none specified in URL
      await autoSelectIntegration();
    }
  } else {
    // No project in URL, auto-select first project and its integration
    const firstProject = projectStore.projects?.[0];
    if (firstProject) {
      selectedProjectId.value = firstProject.id;
      await loadIntegrations();
      await loadApis();
      await autoSelectIntegration();
    }
  }

  // Check if getting started modal was already shown
  if (typeof window !== 'undefined') {
    const hasSeenModal = localStorage.getItem(GETTING_STARTED_STORAGE_KEY);
    console.log('Has seen modal:', hasSeenModal);
    if (!hasSeenModal) {
      openModal('getting-started');
    }
  }

  // Update logo and title after 2 seconds
  setTimeout(() => {
    useHead({
      title: 'Integrate Mock APIs at your application.'
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
</script>