# Code Documentation

Generated on: 2025-11-12T20:05:21.500Z

Total files: 10

---

## README.md

```md
# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

```

---

## app/error.vue

```vue
<template>
    <div class="flex items-center justify-center w-screen h-screen">
        <div class="flex flex-row justify-center gap-8">
            <p class="flex items-center text-[10rem] font-bold tracking-tight m-0">{{ error.statusCode }}</p>
            <div class="flex flex-col justify-center max-w-[400px]">
                <p class="text-[24px] font-bold">{{ pageTitle }}</p>
                <p class="text-[16px]">{{ errorDescription }}</p>
                <span class="text-[16px] text-gray-400 mt-4">
                    <a class="text-[16px] underline text-gray-400" href="mailto:support@fingoal.com">Write back </a> to us, if the issue persists.
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

// 
const error = useError() as any;

const pageTitle = computed(() => {
    if (error.value?.statusCode === 404) {
        return 'Page Not Found'
    } else if (error.value?.statusCode === 403) {
        return 'Forbidden'
    } else if (error.value?.statusCode === 401) {
        return 'Unauthorized'
    } else if (error.value?.statusCode === 400) {
        return 'Bad Request'
    } else if (error.value?.statusCode === 500) {
        return 'Internal Server Error'
    } else if (error.value?.statusCode === 502) {
        return 'Bad Gateway'
    }
    return 'Unknown Error'
})

const errorDescription = computed(() => {
    if (error.value?.statusCode === 404) {
        return "Sorry, the page you are looking for doesn't exist or has been moved."
    } else if (error.value?.statusCode === 403) {
        return "You are not authorized to access this page."
    } else if (error.value?.statusCode === 401) {
        return error.value?.message || "You are not authorized to access this page."
    } else if (error.value?.statusCode === 400) {
        return error.value?.message || "The request was invalid."
    } else if (error.value?.statusCode === 500) {
        return error.value?.message || "We've encountered an unexpected issue. Please try again later."
    } else if (error.value?.statusCode === 502) {
        return error.value?.message || "The server is not responding. Please try again later."
    }
    return error.value?.message || "We've encountered an unexpected issue. Please try again later."
})

// Head
useHead({
    title: `${error.value?.statusCode} - ${pageTitle.value}`,
    meta: [
        { name: 'description', content: errorDescription.value }
    ],
})
</script>
```

---

## app/layouts/default.vue

```vue
<template>
    <div class="w-full h-full font-poppins p-0 m-0">
        <slot />
    </div>
</template>

<script lang="ts" setup>
// Metadata
useHead({
    title: '',
    htmlAttrs: {
        lang: 'en',
    },
    meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '' },
        { name: 'keywords', content: '' },
        { name: 'author', content: 'Soumodip Paul' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:title', content: '' },
        { property: 'og:description', content: '' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: '' },
        { property: 'og:site_name', content: '' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '' },
        { name: 'twitter:description', content: '' },
    ],
    link: [
        { rel: 'icon', type: 'image/x-icon', href: '' },
        { rel: 'icon', type: 'image/svg+xml', href: '' },
        { rel: 'icon', type: 'image/png', href: '' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '' },
        { rel: 'canonical', href: '' }
    ],
})
</script>

```

---

## app/pages/index.vue

```vue
<template>
    <div class=" flex flex-col h-screen w-screen justify-center items-center">
    </div>
</template>
```

---

## app/stores/app.store.ts

```ts
// Node modules
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  return {}
})
```

---

## nuxt.config.ts

```ts
// nuxt-config documentation
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/image", "@nuxt/fonts", "@pinia/nuxt", "@nuxtjs/tailwindcss"],
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  fonts: {
    families: [
      { name: 'Poppins', provider: 'google', weights: [300, 400, 500, 600, 700] }
    ],
  }
});

```

---

## package.json

```json
{
  "name": "default-project",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@nuxt/fonts": "^0.11.4",
    "@nuxt/image": "^1.11.0",
    "@nuxtjs/tailwindcss": "^6.14.0",
    "@pinia/nuxt": "^0.11.2",
    "nuxt": "^4.1.3",
    "pinia": "^3.0.3",
    "vue": "^3.5.22",
    "vue-router": "^4.5.1"
  },
  "devDependencies": {
    "@types/node": "^24.9.2"
  }
}

```

---

## public/robots.txt

```txt
User-Agent: *
Disallow:

```

---

## tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
```

---

## tsconfig.json

```json
{
  // https://nuxt.com/docs/guide/concepts/typescript
  "files": [],
  "references": [
    {
      "path": "./.nuxt/tsconfig.app.json"
    },
    {
      "path": "./.nuxt/tsconfig.server.json"
    },
    {
      "path": "./.nuxt/tsconfig.shared.json"
    },
    {
      "path": "./.nuxt/tsconfig.node.json"
    }
  ]
}

```

---

