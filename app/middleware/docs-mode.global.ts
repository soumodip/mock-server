export default defineNuxtRouteMiddleware(async (to, from) => {
  const config = useRuntimeConfig();
  const isDocsMode = config.public.isDocsMode === 'true';

  // Only apply docs mode middleware if IS_DOCS_MODE is true
  if (!isDocsMode) {
    return;
  }

  // Skip if already on a docs page
  if (to.path.startsWith('/docs/')) {
    return;
  }

  // Skip API routes and static files
  if (to.path.startsWith('/api/') || to.path.startsWith('/sdk/') || to.path.startsWith('/_nuxt/')) {
    return;
  }

  // On client side, fetch the primary docs integration and redirect
  if (import.meta.client) {
    try {
      const response = await $fetch<{ projectId: string; integrationId: string } | null>('/api/integrations/primary-docs');

      if (response && response.projectId && response.integrationId) {
        return navigateTo(`/docs/${response.projectId}/${response.integrationId}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to fetch primary docs integration:', error);
    }
  }

  // On server side, do the same
  if (import.meta.server) {
    try {
      const response = await $fetch<{ projectId: string; integrationId: string } | null>('/api/integrations/primary-docs');

      if (response && response.projectId && response.integrationId) {
        return navigateTo(`/docs/${response.projectId}/${response.integrationId}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to fetch primary docs integration:', error);
    }
  }
});
