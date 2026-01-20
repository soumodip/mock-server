<template>
  <div v-if="!isFullPageEnabled" class="min-h-screen flex items-center justify-center bg-[#1a1d2e]">
    <div class="text-center">
      <h1 class="text-2xl font-medium text-gray-300 mb-2">This page is disabled</h1>
      <p class="text-sm text-gray-500">Full page mode is not enabled for this integration</p>
    </div>
  </div>
  <div v-else class="min-h-screen flex flex-col">
    <!-- API Playground -->
    <div class="flex items-center justify-end flex-1 p-8">
      <div id="api-playground" class="max-h-[calc(100vh-4rem)] w-[480px] overflow-y-auto rounded-2xl"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const appConfig = useAppConfig();

const projectId = ref<string | null>(null);
const integrationId = ref<string | null>(null);
const isFullPageEnabled = ref(false);
const integrationHeading = ref<string>('');
const mockServerBaseUri = appConfig.baseUri || `http://localhost:4001`;

// Check if full page is enabled for this integration
const checkFullPageEnabled = async () => {
  try {
    if (!integrationId.value) return;

    const integration = await $fetch(`/api/integrations/${integrationId.value}?public=true`);
    isFullPageEnabled.value = (integration as any)?.expandToFullPage || false;
    integrationHeading.value = (integration as any)?.heading || '';
  } catch (error) {
    console.error('Failed to check full page setting:', error);
    isFullPageEnabled.value = false;
  }
};

// Load integration ID and inject SDK script
const loadSdk = async () => {
  try {
    // Get route parameters
    const routeProjectId = route.params.projectId;
    const routeIntegrationId = route.params.integrationId;

    if (routeProjectId && typeof routeProjectId === 'string') {
      projectId.value = routeProjectId;
    }

    if (routeIntegrationId && typeof routeIntegrationId === 'string') {
      integrationId.value = routeIntegrationId;
    }

    if (!integrationId.value) {
      console.error('No integrationId found in URL');
      return;
    }

    // Check if full page is enabled
    await checkFullPageEnabled();

    // Only load SDK if full page is enabled
    if (!isFullPageEnabled.value) {
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

  useHead({
    title: integrationHeading.value || 'Integrate Mock APIs at your application.'
  });

  if (typeof document !== 'undefined') {
    const links = document.querySelectorAll("link[rel*='icon']");
    links.forEach(link => link.remove());

    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.type = 'image/svg+xml';
    newLink.href = `/docs-logo.svg?v=${Date.now()}`;
    document.head.appendChild(newLink);
  }
});
</script>
