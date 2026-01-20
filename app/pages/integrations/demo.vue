<template>
  <div class="min-h-screen flex flex-col">
    <!-- API Playground -->
    <div class="flex items-center justify-end flex-1 p-8">
      <div id="api-playground" class="max-h-[calc(100vh-4rem)] w-[480px] overflow-y-auto rounded-2xl"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '~/stores/project';

const projectStore = useProjectStore();
const appConfig = useAppConfig();

const integrationId = ref<string | null>(null);
const projectId = ref<string | null>(null);
const mockServerBaseUri = appConfig.baseUri || `http://localhost:4001`;

// Load integration ID and inject SDK script
const loadSdk = async () => {
  try {
    // Get query parameters
    const route = useRoute();
    const queryProjectId = route.query.projectId;
    const queryIntegrationId = route.query.integrationId;

    if (queryProjectId && typeof queryProjectId === 'string') {
      projectId.value = queryProjectId;
    }

    if (queryIntegrationId && typeof queryIntegrationId === 'string') {
      integrationId.value = queryIntegrationId;
    }

    if (!integrationId.value) {
      console.error('No integrationId found in URL');
      return;
    }

    // Inject SDK script
    const script = document.createElement('script');
    script.src = `${mockServerBaseUri}/sdk/${integrationId.value}`;
    document.body.appendChild(script);
  } catch (error) {
    console.error('Failed to load SDK:', error);
  }
};

onMounted(async () => {
  await loadSdk();

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
