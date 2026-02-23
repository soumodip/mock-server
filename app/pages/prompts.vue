<template>
  <div class="min-h-screen bg-[#1a1d2e] p-6">
    <div class="max-w-7xl mx-auto">
      <HeaderContainer />

      <!-- Projects Section -->
      <div class="bg-[#252836] rounded-lg p-6 mb-6 mt-12">
        <h2 class="text-md font-medium text-gray-300 mb-3">Projects</h2>
        <div class="flex gap-2 items-center mb-2">
          <CommonDropdown v-model="projectStore.selectedProjectId" :options="projectOptions"
            placeholder="Select a project" @change="handleProjectChange" />
        </div>
        <p v-if="projectOptions.length === 0" class="text-xs text-gray-500 mb-6 ml-2">
          No projects found. Go to <strong class="text-gray-400">Mock Server</strong> tab and create a new project
        </p>
        <div v-else class="mb-4"></div>

        <div :class="['transition-opacity duration-300', !hasProjectSelected ? 'opacity-50' : '']">
          <div class="mb-2 w-full border-t border-gray-700 pt-5">
            <p class="text-sm font-regular text-gray-200">System:</p>
          </div>
          <div class="flex gap-2">
            <button
              v-for="system in promptsStore.systems"
              :key="system.id"
              @click="hasProjectSelected && promptsStore.setActiveSystem(system.value)"
              :disabled="!hasProjectSelected"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                !hasProjectSelected
                  ? 'cursor-not-allowed opacity-60'
                  : '',
                promptsStore.activeSystem === system.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#353849] text-gray-300',
                hasProjectSelected && promptsStore.activeSystem !== system.value
                  ? 'hover:bg-[#3d4152]'
                  : ''
              ]"
            >
              {{ system.name }}
            </button>
          </div>
        </div>
        <div :class="['transition-opacity duration-300', !hasProjectSelected ? 'opacity-30' : '']">
          <p class="text-sm font-regular text-gray-200 mt-3">Framework:</p>
          <div class="flex gap-2 mt-2">
            <button
              v-for="framework in promptsStore.currentSystem?.frameworks"
              :key="framework.id"
              @click="hasProjectSelected && promptsStore.setActiveFramework(framework.value)"
              :disabled="!hasProjectSelected"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                !hasProjectSelected
                  ? 'cursor-not-allowed opacity-60'
                  : '',
                promptsStore.activeFramework === framework.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#353849] text-gray-300',
                hasProjectSelected && promptsStore.activeFramework !== framework.value
                  ? 'hover:bg-[#3d4152]'
                  : ''
              ]"
            >
              {{ framework.name }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <div
          :class="[
            'pt-6 pb-12 overflow-y-auto flex-1 text-gray-300 text-sm space-y-4 leading-relaxed transition-all duration-300',
            !hasProjectSelected ? 'pointer-events-none' : ''
          ]"
          :style="!hasProjectSelected ? 'mask-image: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%);' : ''"
        >
          <!-- App System Components -->
          <div v-if="promptsStore.activeSystem === 'app'">
            <Flutter v-if="promptsStore.activeFramework === 'flutter'" />
            <ReactNative v-if="promptsStore.activeFramework === 'react-native'" />
          </div>

          <!-- Frontend System Components -->
          <div v-if="promptsStore.activeSystem === 'frontend'">
            <FrontendNuxtjs v-if="promptsStore.activeFramework === 'nuxtjs'" />
            <FrontendNextjs v-if="promptsStore.activeFramework === 'nextjs'" />
          </div>

          <!-- Backend System Components -->
          <div v-if="promptsStore.activeSystem === 'backend'">
            <NodejsTypeorm v-if="promptsStore.activeFramework === 'nodejs-typeorm'" />
            <FastAPI v-if="promptsStore.activeFramework === 'fastapi'" />
            <Flask v-if="promptsStore.activeFramework === 'flask'" />
          </div>

          <!-- Admin Frontend System Components -->
          <div v-if="promptsStore.activeSystem === 'admin-frontend'">
            <AdminNuxtjs v-if="promptsStore.activeFramework === 'nuxtjs'" />
            <AdminNextjs v-if="promptsStore.activeFramework === 'nextjs'" />
          </div>
        </div>

        <div ref="stepsSection" :class="[
          'border rounded-xl p-4 my-6 transition-all duration-500',
          isHighlighted ? 'border-purple-500 shadow-lg shadow-purple-500/50' : 'border-gray-800',
          isStepsExpanded ? 'mb-12' : ''
        ]">
          <div class="flex items-center justify-between" @click="toggleSteps">
            <h2 class="text-md font-medium text-gray-300 flex items-center m-0">
              <Icon name="iconoir:google-docs" class="h-4 w-4 mr-4 ml-2 opacity-75" />
              Setup guide
            </h2>
            <button
              class="p-2 text-gray-400 hover:text-gray-300 transition-colors rounded-lg"
              :title="isStepsExpanded ? 'Collapse' : 'Expand'"
            >
              <Icon :name="isStepsExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-5 h-5" />
            </button>
          </div>
          <div v-show="isStepsExpanded" class="space-y-3 mt-8 text-sm text-gray-500">
            <div class="flex items-start gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full text-gray-400 flex items-center justify-center text-xs font-medium">1.</span>
              <div>
                <p class="text-gray-400 font-medium">Download the Project Prompt Folder</p>
                <p class="mt-1">Click the download button to get the project prompt folder as a ZIP file for your selected framework.</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full text-gray-400 flex items-center justify-center text-xs font-medium">2.</span>
              <div>
                <p class="text-gray-400 font-medium">Unzip the Downloaded File</p>
                <p class="mt-1">Extract the contents of the ZIP file to a location on your computer.</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full text-gray-400 flex items-center justify-center text-xs font-medium">3.</span>
              <div>
                <p class="text-gray-400 font-medium">Navigate to the Folder</p>
                <p class="mt-1">Open your terminal and navigate to the extracted folder:</p>
                <code class="block mt-2 bg-[#1a1d2e] px-3 py-2 rounded text-gray-400">cd &lt;folder_name&gt;</code>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full text-gray-400 flex items-center justify-center text-xs font-medium">4.</span>
              <div>
                <p class="text-gray-400 font-medium">Open an AI CLI Tool</p>
                <p class="mt-1">Launch your preferred AI-powered CLI tool such as:</p>
                <ul class="mt-2 list-disc list-inside space-y-1 ml-2">
                  <li><span class="text-gray-400">Claude Code</span> - Anthropic's official CLI</li>
                  <li><span class="text-gray-400">Gemini CLI</span> - Google's AI CLI</li>
                  <li><span class="text-gray-400">Visual Studio Code</span> - Use <code class="bg-[#1a1d2e] px-2 py-0.5 rounded text-gray-400">code .</code> to open VS Code</li>
                </ul>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full text-gray-400 flex items-center justify-center text-xs font-medium">5.</span>
              <div>
                <p class="text-gray-400 font-medium">Execute the Workflow</p>
                <p class="mt-1">In your AI CLI tool, type the following command to start generating your project:</p>
                <div class="relative group">
                  <code class="block mt-2 bg-[#1a1d2e] px-3 py-2 pr-12 rounded text-gray-300">Execute the workflow in prompt/workflows/project.md</code>
                  <button
                    @click="copyToClipboard"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-400 rounded transition-colors"
                    :title="copied ? 'Copied!' : 'Copy to clipboard'"
                  >
                    <Icon v-if="!copied" name="mdi:content-copy" class="w-4 h-4" />
                    <Icon v-else name="mdi:check" class="w-4 h-4 text-indigo-400" />
                  </button>
                </div>
                <p class="mt-2 text-indigo-400">The AI will read the workflow file and automatically start creating your entire project structure, installing dependencies, and setting up all necessary files.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalsGettingStarted
        v-if="modal?.type == 'getting-started'"
        :heading="gettingStartedData.heading"
        :youtube-video-link="gettingStartedData.youtubeVideoLink"
        :description="gettingStartedData.description"
        :is-sandbox="isDataResetEnabled"
        :next-reset-time="nextResetTime"
        @close="closeModal" />
    </div>

    <!-- Floating Info Button -->
    <div class="fixed bottom-6 right-6 flex items-center gap-2">
      <button @click="openModal('getting-started', null)"
        class="relative bg-[#2d3142] text-gray-300 rounded-xl shadow-lg transition-colors flex items-center justify-center w-10 h-10 hover:bg-[#353849]"
        title="Info">
        <Icon name="teenyicons:screen-outline" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, provide, nextTick } from 'vue';
import { usePromptsStore } from '~/stores/prompts';
import { useProjectStore } from '~/stores/project';
import { useDataReset } from '~/composables/useDataReset';
import HeaderContainer from '~/components/common/Header.vue';
import CommonDropdown from '~/components/common/Dropdown.vue';
import NodejsTypeorm from '~/components/prompts/backend/nodejs-typeorm.vue';
import FastAPI from '~/components/prompts/backend/fastapi.vue';
import Flask from '~/components/prompts/backend/flask.vue';
import Flutter from '~/components/prompts/app/flutter.vue';
import ReactNative from '~/components/prompts/app/react-native.vue';
import FrontendNuxtjs from '~/components/prompts/frontend/nuxtjs.vue';
import FrontendNextjs from '~/components/prompts/frontend/nextjs.vue';
import AdminNuxtjs from '~/components/prompts/admin-frontend/nuxtjs.vue';
import AdminNextjs from '~/components/prompts/admin-frontend/nextjs.vue';

const promptsStore = usePromptsStore();
const projectStore = useProjectStore();

// Data reset (singleton — intervals are managed by DataResetOverlay in layout)
const { isDataResetEnabled, nextResetTime } = useDataReset();

// Check if a project is selected
const hasProjectSelected = computed(() => !!projectStore.selectedProjectId);

// Steps section refs
const stepsSection = ref<HTMLElement | null>(null);
const isHighlighted = ref(false);
const copied = ref(false);
const isStepsExpanded = ref(false);

// Copy to clipboard function
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText('Execute the workflow in prompt/workflows/project.md');
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// Toggle steps section
const toggleSteps = () => {
  isStepsExpanded.value = !isStepsExpanded.value;
};

// Scroll and highlight steps section - returns a Promise that resolves after animation
const scrollToSteps = (): Promise<void> => {
  return new Promise((resolve) => {
    // Expand the section when download is clicked
    isStepsExpanded.value = true;

    // Wait for Vue to update the DOM after expansion
    nextTick(() => {
      if (stepsSection.value) {
        stepsSection.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
        isHighlighted.value = true;

        // Wait for scroll animation to complete, then resolve
        setTimeout(() => {
          resolve();
        }, 600);

        // Remove highlight after 2 seconds
        setTimeout(() => {
          isHighlighted.value = false;
        }, 2000);
      } else {
        resolve();
      }
    });
  });
};

// Provide scrollToSteps to child components
provide('scrollToSteps', scrollToSteps);

// Modal management
interface Modal {
  type: string;
  data?: any;
}

const modal = ref<Modal | null>(null);

// Getting Started Modal
const GETTING_STARTED_STORAGE_KEY = 'prompts-getting-started-modal-shown';
const gettingStartedData = {
  heading: 'Getting Started with Prompts',
  youtubeVideoLink: 'https://youtu.be/hjq5W9-jh6I?t=270',
  description: 'Learn how to use prompts to generate code for your projects across different frameworks.'
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

// Fetch projects on mount
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
      title: 'Build Apps with the Mock APIs.'
    });

    // Update favicon with cache busting
    if (typeof document !== 'undefined') {
      const links = document.querySelectorAll("link[rel*='icon']");
      links.forEach(link => link.remove());

      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.type = 'image/svg+xml';
      newLink.href = `/api-mocks-logo-prompts.svg?v=${Date.now()}`;
      document.head.appendChild(newLink);
    }
  }, 1000);
});

// Project dropdown options
const projectOptions = computed(() => {
  return projectStore.projects.map(project => ({
    label: project.name,
    value: project.id
  }));
});

// Handle project change
const handleProjectChange = (projectId: string | number) => {
  projectStore.selectProject(projectId as string);

  // Update URL with project_id
  const router = useRouter();
  if (projectId) {
    router.push({ query: { project_id: projectId } });
  } else {
    router.push({ query: {} });
  }
};

</script>
