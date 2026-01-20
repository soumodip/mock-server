<template>
  <div v-if="isAuthEnabled" class="min-h-screen bg-[#1a1d2e] h-screen w-screen flex items-center justify-center p-6">
    <div class="bg-[#242736] rounded-xl shadow-lg p-8 w-[480px] max-w-[400px]">
      <h1 class="text-2xl font-medium text-gray-300 mb-6 text-center">Login</h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="text-sm text-gray-400 mb-2 block">Username</label>
          <input
            v-model="username"
            type="text"
            placeholder="Enter username"
            class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500"
            required
          />
        </div>

        <div>
          <label class="text-sm text-gray-400 mb-2 block">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter password"
            class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500"
            required
          />
        </div>

        <div v-if="errorMessage" class="text-red-500 text-sm text-center">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Logging in...' : 'Submit' }}
        </button>
      </form>
    </div>
  </div>
  <div v-else class="min-h-screen bg-[#1B1D2E] h-screen w-screen flex items-center justify-center">
    <p class="text-gray-300 text-md">Auth is disabled.</p>
  </div>
</template>

<script setup lang="ts">

const config = useRuntimeConfig();
const isAuthEnabled = config.public.enableAuth === 'true';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

// Redirect authenticated users to home page
onMounted(() => {
  if (isAuthEnabled) {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      navigateTo('/');
    }
  }
});

const handleLogin = async () => {
  if (!isAuthEnabled) return;

  errorMessage.value = '';
  loading.value = true;

  try {
    const response: any = await $fetch('/api/auth', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value
      }
    });

    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
      // Store permissions if provided
      if (response.user?.permissions) {
        localStorage.setItem('permissions', JSON.stringify(response.user.permissions));
      }
      navigateTo('/');
    }
  } catch (error: any) {
    errorMessage.value = error.data?.message || 'Invalid username or password';
  } finally {
    loading.value = false;
  }
};
</script>
