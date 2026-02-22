<template>
    <div class="w-full h-full font-poppins p-0 m-0">
        <slot />
        <!-- Data reset overlay: timer badge + reset modal (mounted once, shared across all pages) -->
        <DataResetOverlay />
    </div>
</template>

<script lang="ts" setup>
const route = useRoute();

// Check if we're on the docs integration page
const isDocsIntegrationPage = computed(() => {
    return route.path.startsWith('/docs/') && route.params.projectId && route.params.integrationId;
});

// Metadata - only apply if not on docs integration page
useHead({
    title: isDocsIntegrationPage.value ? '' : 'Mock APIs with ease.',
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
        { rel: 'icon', type: 'image/svg+xml', href: '/api-mocks-logo.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '' },
        { rel: 'canonical', href: '' }
    ],
});
</script>
