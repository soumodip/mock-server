export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/image", "@nuxt/fonts", "@pinia/nuxt", "@nuxtjs/tailwindcss", "@nuxt/icon"],
  devServer: {
    port: parseInt(process.env.PORT || '4001')
  },
  runtimeConfig: {
    public: {
      enableAuth: process.env.IS_AUTH || 'false',
      isDocsMode: process.env.IS_DOCS_MODE || 'false',
      isDataResetMode: process.env.IS_DATA_RESET_MODE || 'false',
      dataResetIntervalMs: parseInt(process.env.DATA_RESET_INTERVAL_MS || '3600000')
    }
  },
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  fonts: {
    defaults: {
      fallbacks: {
        serif: [],
        'sans-serif': [],
        monospace: [],
      },
    },
    families: [
      { name: 'Poppins', provider: 'google', weights: [300, 400, 500, 600, 700] },
      { name: 'Google Sans Code', provider: 'google' }
    ],
    experimental: {
      processCSSVariables: false,
    },
  },
  appConfig: {
    port: parseInt(process.env.PORT || '4001'),
    baseUri: process.env.BASE_URI || 'http://localhost:4001',
  },
});
