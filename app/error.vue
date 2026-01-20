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