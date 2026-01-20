export default defineNuxtRouteMiddleware((to, from) => {
  const config = useRuntimeConfig();
  const isAuthEnabled = config.public.enableAuth === 'true';

  // Only apply auth middleware if IS_AUTH is true
  if (!isAuthEnabled) {
    return;
  }

  // Skip auth check for the auth page and docs pages
  if (to.path === '/auth' || to.path.startsWith('/docs/')) {
    return;
  }

  // Check if running on client side
  if (import.meta.client) {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      navigateTo('/auth', { replace: true });
    }
  }
});
