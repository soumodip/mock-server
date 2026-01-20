# Code Documentation

Generated on: 2025-11-12T19:59:31.064Z

Total files: 19

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

## app/components/modals/Info.vue

```vue
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="$emit('close')"
    >
      <div class="bg-[#1a2332] rounded-xl border border-gray-800 w-full max-w-lg mx-4 shadow-xl">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">Project Details</h2>
          <button
            @click="$emit('close')"
            class="p-1 text-gray-400 hover:text-white hover:bg-[#0f1419] rounded-lg transition"
          >
            <Icon name="mdi:close" class="text-xl" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Project Icon & Name -->
          <div class="flex items-center space-x-4 pb-4 border-b border-gray-800">
            <div class="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center">
              <Icon name="mdi:folder" class="text-indigo-400 text-3xl" />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-white">{{ item?.name }}</h3>
              <p class="text-sm text-gray-400">{{ item?.email }}</p>
            </div>
          </div>

          <!-- Details -->
          <div class="space-y-3">
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-400">Status</span>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                :class="item?.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full mr-1.5"
                  :class="item?.status === 'Active' ? 'bg-green-400' : 'bg-gray-400'"
                ></span>
                {{ item?.status }}
              </span>
            </div>

            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-400">Created Date</span>
              <span class="text-sm text-white">{{ formatDate(item?.createdAt) }}</span>
            </div>

            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-400">Project ID</span>
              <span class="text-sm text-white font-mono">#{{ item?.id }}</span>
            </div>
          </div>

          <!-- Additional Info -->
          <div class="bg-[#0f1419] rounded-lg p-4 border border-gray-800">
            <div class="flex items-start space-x-3">
              <Icon name="mdi:information-outline" class="text-indigo-400 text-lg mt-0.5" />
              <div>
                <h4 class="text-sm font-medium text-white mb-1">Project Information</h4>
                <p class="text-xs text-gray-400">
                  This project is managed through the admin panel. You can edit or delete this project from the main dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            @click="$emit('close')"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { CrudItem } from '~/stores/crud'

defineProps<{
  item: CrudItem | null
}>()

defineEmits<{
  close: []
}>()

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

```

---

## app/components/modals/crud/Create.vue

```vue
<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="$emit('close')">
      <div class="bg-[#1a2332] rounded-xl border border-gray-800 w-full max-w-md mx-4 shadow-xl">
        <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">Create New Project</h2>
          <button @click="$emit('close')" class="p-1 text-gray-400 hover:text-white transition rounded-lg">
            <Icon name="mdi:close" class="text-xl" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input v-model="formData.name" type="text" required placeholder="Project name"
              class="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input v-model="formData.email" type="email" required placeholder="email@example.com"
              class="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <div class="relative">
              <select v-model="formData.status"
                class="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <Icon name="mdi:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition rounded-lg hover:bg-[#0f1419]">
              Cancel
            </button>
            <button type="submit"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useCrudStore } from '~/stores/crud'

const emit = defineEmits(['close'])
const crudStore = useCrudStore()

const formData = ref({
  name: '',
  email: '',
  status: 'Active',
  createdAt: new Date().toISOString().split('T')[0]
})

const handleSubmit = () => {
  crudStore.addItem(formData.value)
  emit('close')
}
</script>

```

---

## app/components/modals/crud/Delete.vue

```vue
<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="$emit('close')">
      <div class="bg-[#1a2332] rounded-xl border border-gray-800 w-full max-w-sm mx-4 shadow-xl">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
              <Icon name="mdi:alert-circle-outline" class="text-red-400 text-2xl" />
            </div>
            <button @click="$emit('close')" class="p-1 text-gray-400 hover:text-white transition rounded-lg">
              <Icon name="mdi:close" class="text-xl" />
            </button>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Delete Project</h3>
          <p class="text-sm text-gray-400 mb-6">
            Are you sure you want to delete <span class="text-white font-medium">{{ item.name }}</span>? This
            action cannot be undone.
          </p>
          <div class="flex justify-end space-x-3">
            <button @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition rounded-lg hover:bg-[#0f1419]">
              Cancel
            </button>
            <button @click="handleDelete"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useCrudStore, type CrudItem } from '~/stores/crud'

const props = defineProps<{
  item: CrudItem
}>()

const emit = defineEmits(['close'])
const crudStore = useCrudStore()

const handleDelete = () => {
  crudStore.deleteItem(props.item.id)
  emit('close')
}
</script>

```

---

## app/components/modals/crud/Edit.vue

```vue
<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="$emit('close')">
      <div class="bg-[#1a2332] rounded-xl border border-gray-800 w-full max-w-md mx-4 shadow-xl">
        <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">Edit Project</h2>
          <button @click="$emit('close')" class="p-1 text-gray-400 hover:text-white transition rounded-lg">
            <Icon name="mdi:close" class="text-xl" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input v-model="formData.name" type="text" required placeholder="Project name"
              class="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input v-model="formData.email" type="email" required placeholder="email@example.com"
              class="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <div class="relative">
              <select v-model="formData.status"
                class="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <Icon name="mdi:chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition rounded-lg hover:bg-[#0f1419]">
              Cancel
            </button>
            <button type="submit"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useCrudStore, type CrudItem } from '~/stores/crud'

const props = defineProps<{
  item: CrudItem
}>()

const emit = defineEmits(['close'])
const crudStore = useCrudStore()

const formData = ref({ ...props.item })

const handleSubmit = () => {
  crudStore.updateItem(props.item.id, formData.value)
  emit('close')
}
</script>

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

## app/layouts/dashboard.vue

```vue
<template>
  <div class="flex h-screen bg-[#0f1419] font-poppins">
    <!-- Sidebar -->
    <aside class="w-64 bg-[#1a2332] border-r border-gray-800 flex flex-col">
      <!-- Logo -->
      <div class="p-6 border-b border-gray-800">
        <div class="flex items-center space-x-3">
          <Icon name="si:projects-line" class="text-white text-xl" />
          <span class="text-white font-semibold text-lg">Admin Panel</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4">
        <div class="mb-6">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">Navigation</p>
          <ul class="space-y-1">
            <li>
              <NuxtLink
                to="/dashboard/crud"
                class="flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition hover:bg-[#0f1419]"
                :class="isActive('/dashboard/crud') ? 'bg-[#0f1419] text-white' : 'text-gray-400'"
              >
                <Icon name="mdi:folder-outline" class="text-lg" />
                <span>Projects</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="#"
                class="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-400 rounded-lg transition hover:bg-[#0f1419]"
              >
                <Icon name="mdi:cog-outline" class="text-lg" />
                <span>Settings</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- User Section -->
      <div class="p-4 border-t border-gray-800">
        <div class="flex items-center gap-3 px-3 py-2">
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="text-white text-xs font-medium">{{ userInitials }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ userEmail }}</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="text-gray-400 hover:text-white transition flex-shrink-0 mt-1"
            title="Logout"
          >
            <Icon name="icon-park-outline:power" class="text-lg" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">

      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const userEmail = computed(() => authStore.user?.email || 'User')
const userInitials = computed(() => {
  const email = authStore.user?.email || ''
  return email.charAt(0).toUpperCase()
})

const isActive = (path: string) => {
  return route.path === path
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}

// Protect dashboard routes
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
  }
})
</script>

```

---

## app/layouts/default.vue

```vue
<template>
    <div class="w-full h-full font-poppins p-0 m-0 antialiased">
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

## app/pages/dashboard/crud.vue

```vue
<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-row items-start justify-between">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-white mb-1">All projects</h1>
        <p class="text-sm text-gray-400">Manage your projects and their deployments</p>
      </div>
      <button @click="openCreateModal"
        class="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition">
        <Icon name="mdi:plus" class="text-lg" />
        <span>New Project</span>
      </button>
    </div>

    <!-- Search Bar -->
    <div class="mb-4 flex justify-end">
      <div class="relative w-64">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search projects..."
          class="w-full px-4 py-2 pr-10 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Icon name="mdi:magnify" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-[#1a2332] rounded-lg border border-gray-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0f1419] border-b border-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr v-for="item in filteredItems" :key="item.id" class="hover:bg-[#0f1419] transition">
              <td class="px-6 py-2.5 whitespace-nowrap">
                <div class="flex items-center">
                  <span class="text-sm font-medium text-white">{{ item.name }}</span>
                </div>
              </td>
              <td class="px-6 py-2.5 whitespace-nowrap">
                <span class="text-sm text-gray-400">{{ item.email }}</span>
              </td>
              <td class="px-6 py-2.5 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="item.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'">
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5"
                    :class="item.status === 'Active' ? 'bg-green-400' : 'bg-gray-400'"></span>
                  {{ item.status }}
                </span>
              </td>
              <td class="px-6 py-2.5 whitespace-nowrap text-sm text-gray-400">
                {{ formatDate(item.createdAt) }}
              </td>
              <td class="px-6 py-2.5 whitespace-nowrap text-right text-xs">
                <div class="flex items-center justify-end space-x-2">
                  <button @click="openViewModal(item)"
                    class="p-2 text-gray-400 hover:text-indigo-400 rounded-lg transition"
                    title="View">
                    <Icon name="mdi:eye-outline" class="h-3.5 w-3.5" />
                  </button>
                  <button @click="openEditModal(item)"
                    class="p-2 text-gray-400 hover:text-blue-400 rounded-lg transition"
                    title="Edit">
                    <Icon name="mdi:pencil-outline" class="h-3.5 w-3.5" />
                  </button>
                  <button @click="confirmDelete(item)"
                    class="p-2 text-gray-400 hover:text-red-400 rounded-lg transition"
                    title="Delete">
                    <Icon name="mdi:delete-outline" class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredItems.length === 0" class="text-center py-12">
        <Icon name="mdi:folder-outline" class="text-gray-600 text-5xl mb-4 mx-auto" />
        <p class="text-gray-400 text-sm">{{ searchQuery ? 'No matching projects found' : 'No projects yet' }}</p>
      </div>
    </div>

    <!-- Modals -->
    <ModalsCrudCreate v-if="modal?.type === 'create'" @close="closeModal" />
    <ModalsCrudEdit v-if="modal?.type === 'edit' && modal.data" :item="modal.data" @close="closeModal" />
    <ModalsCrudDelete v-if="modal?.type === 'delete' && modal.data" :item="modal.data" @close="closeModal" />
    <ModalsInfo v-if="modal?.type === 'view' && modal.data" :item="modal.data" @close="closeModal" />
  </div>
</template>

<script setup lang="ts">
import { useCrudStore, type CrudItem } from '~/stores/crud'
import type { Modal } from '~/types'

definePageMeta({
  layout: 'dashboard'
})

const crudStore = useCrudStore()

const modal = ref(null as Modal | null)
const searchQuery = ref('')

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return crudStore.items
  }

  const query = searchQuery.value.toLowerCase()
  return crudStore.items.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.email.toLowerCase().includes(query) ||
    item.status.toLowerCase().includes(query)
  )
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const openModal = (type: string, data?: any) => {
  modal.value = { type, data }
}

const closeModal = () => {
  modal.value = null
}

const openCreateModal = () => {
  openModal('create')
}

const openEditModal = (item: CrudItem) => {
  openModal('edit', item)
}

const openViewModal = (item: CrudItem) => {
  openModal('view', item)
}

const confirmDelete = (item: CrudItem) => {
  openModal('delete', item)
}
</script>

```

---

## app/pages/index.vue

```vue
<template>
  <div class="flex flex-col h-screen w-screen justify-center items-center bg-[#0f1419]">
    <div class="w-full max-w-md px-8">

      <!-- Login Form -->
      <div class="bg-[#1a2332] rounded-2xl p-8 shadow-xl border border-gray-800">
        <h1 class="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Icon name="si:projects-line" class="text-white text-lg" />Admin Panel
        </h1>
        <p class="text-sm text-gray-400 mb-6">Sign in to your dashboard.</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email Input -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="Enter your password"
              class="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="text-red-400 text-xs">{{ error }}</div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm flex flex-row justify-between items-center font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Signing in...' : 'Submit' }}
            <Icon name="ooui:next-ltr" class="text-white text-sm" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default'
})

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const success = await authStore.login(email.value, password.value)

    if (success) {
      await router.push('/dashboard/crud')
    } else {
      error.value = 'Invalid email or password'
    }
  } catch (e) {
    error.value = 'An error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
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

## app/stores/auth.ts

```ts
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as { email: string } | null,
    isAuthenticated: false,
  }),

  actions: {
    async login(email: string, password: string) {
      // Simulate API call - replace with actual API endpoint
      try {
        // Mock login - replace with actual API call
        if (email && password) {
          this.user = { email }
          this.isAuthenticated = true
          return true
        }
        return false
      } catch (error) {
        console.error('Login failed:', error)
        return false
      }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
    }
  }
})

```

---

## app/stores/crud.ts

```ts
import { defineStore } from 'pinia'

export interface CrudItem {
  id: number
  name: string
  email: string
  status: string
  createdAt: string
}

export const useCrudStore = defineStore('crud', {
  state: () => ({
    items: [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', createdAt: '2025-01-15' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive', createdAt: '2025-01-16' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active', createdAt: '2025-01-17' },
    ] as CrudItem[],
  }),

  actions: {
    addItem(item: Omit<CrudItem, 'id'>) {
      const newId = Math.max(...this.items.map(i => i.id), 0) + 1
      this.items.push({ ...item, id: newId })
    },

    updateItem(id: number, updatedItem: Partial<CrudItem>) {
      const index = this.items.findIndex(item => item.id === id)
      if (index !== -1) {
        this.items[index] = { ...this.items[index], ...updatedItem }
      }
    },

    deleteItem(id: number) {
      const index = this.items.findIndex(item => item.id === id)
      if (index !== -1) {
        this.items.splice(index, 1)
      }
    },

    getItem(id: number) {
      return this.items.find(item => item.id === id)
    }
  }
})

```

---

## app/types/index.ts

```ts
export interface Modal {
    type: string;
    data?: any;
}
```

---

## nuxt.config.ts

```ts
// nuxt-config documentation
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/image", "@nuxt/fonts", "@pinia/nuxt", "@nuxtjs/tailwindcss", "@nuxt/icon"],
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
  "name": "admin-frontend-nuxt",
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
    "@nuxt/icon": "^2.1.0",
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

