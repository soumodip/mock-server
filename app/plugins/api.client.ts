export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const isAuthEnabled = config.public.enableAuth === 'true';

  if (!isAuthEnabled) {
    return;
  }

  // Intercept all fetch requests
  const originalFetch = globalThis.$fetch;

  globalThis.$fetch = ((url: any, options: any = {}) => {
    // Only add auth header for API calls (not for auth endpoint itself)
    if (typeof url === 'string' && url.startsWith('/api') && url !== '/api/auth') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }

    // Handle 401 responses (skip redirect for docs pages)
    options.onResponseError = options.onResponseError || (({ response }: any) => {
      if (response.status === 401 && !window.location.pathname.startsWith('/docs/')) {
        localStorage.removeItem('accessToken');
        navigateTo('/auth');
      }
    });

    return originalFetch(url, options);
  }) as typeof originalFetch;
});
