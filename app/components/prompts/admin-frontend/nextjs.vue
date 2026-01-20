<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-200">Next.js Admin Panel</h2>
      <button
        @click="downloadPrompt"
        class="px-4 py-2 bg-[#353849] hover:bg-gray-700 text-white text-sm rounded-full transition-colors flex items-center gap-1.5"
      >
        <Icon name="material-symbols:download" class="w-4 h-4" />
        Download Project Prompt
      </button>
    </div>

    <div class="bg-[#2d3142] rounded-lg border border-gray-600 max-h-[70vh] overflow-y-auto relative">
      <button
        @click="copyPromptToClipboard"
        :class="[
          'sticky top-0 right-0 ml-auto px-2 py-1 m-2 rounded transition-colors flex items-center z-10',
          copySuccess
            ? 'bg-gray-600 text-white'
            : 'text-gray-400 hover:text-gray-300 hover:bg-[#353849] bg-[#2d3142]'
        ]"
        title="Copy entire prompt to clipboard"
      >
        <Icon :name="copySuccess ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4 mt-1" />
      </button>
      <pre class="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed p-6 pt-0">{{ generatePromptText() }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, inject } from 'vue';
import { useProjectStore, normalizeGroup } from '~/stores/project';
import type { ProjectGroup } from '~/stores/project';
import { useApiStore } from '~/stores/api';
import { useObjectStore } from '~/stores/object';
import type { ApiMock } from '~/stores/api';
import JSZip from 'jszip';

const projectStore = useProjectStore();
const apiStore = useApiStore();
const objectStore = useObjectStore();
const appConfig = useAppConfig();

// Inject scrollToSteps from parent
const scrollToSteps = inject<(() => Promise<void>) | undefined>('scrollToSteps');

const demoProjectCode = ref<string>('');
const mockServerBaseUri = appConfig.baseUri || `http://localhost:4001`;

// Fetch data on component mount
onMounted(async () => {
  try {
    await Promise.all([
      projectStore.fetchProjects(),
      apiStore.fetchApis(),
      objectStore.fetchObjects()
    ]);
    console.log('Selected Project ID:', projectStore.selectedProjectId);
    console.log('All APIs:', apiStore.apis);
    console.log('Filtered Admin APIs:', adminApis.value);
    console.log('All Objects:', objectStore.objects);
    console.log('Entities:', entities.value);

    // Fetch demo project code from code.md
    const response = await fetch('/code/admin-frontend-nextjs.md');
    if (response.ok) {
      demoProjectCode.value = await response.text();
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

const selectedProject = computed(() =>
  projectStore.projects.find(p => p.id === projectStore.selectedProjectId)
);

const filteredApis = computed(() => {
  if (!projectStore.selectedProjectId) return [];
  return apiStore.apis.filter(api => api.projectId === projectStore.selectedProjectId);
});

// Filter only admin endpoints
const adminApis = computed(() => {
  return filteredApis.value.filter(api => api.isAdminEndpoint);
});

const filteredObjects = computed(() => {
  if (!projectStore.selectedProjectId) return [];
  return objectStore.objects.filter(obj => obj.projectId === projectStore.selectedProjectId);
});

// Filter only entities
const entities = computed(() => {
  return filteredObjects.value.filter(obj => obj.isEntity);
});

// Get groups with isAdminPanelPage enabled
const adminPanelGroups = computed<ProjectGroup[]>(() => {
  if (!selectedProject.value?.groups) return [];
  return selectedProject.value.groups
    .map(g => normalizeGroup(g))
    .filter(g => g.isAdminPanelPage);
});

const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatJson = (jsonString: string) => {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch {
    return jsonString;
  }
};

// Generate TypeScript interface from entity
const generateEntityInterface = (entity: any) => {
  let interfaceStr = `interface ${entity.name} {\n`;

  if (entity.fields && entity.fields.length > 0) {
    entity.fields.forEach((field: any) => {
      const tsType = mapTypeToTS(field.type);
      const optional = field.required ? '' : '?';
      interfaceStr += `  ${field.name}${optional}: ${tsType};\n`;
    });
  }

  interfaceStr += '}';
  return interfaceStr;
};

const mapTypeToTS = (type: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'object': 'Record<string, any>',
    'object-json': 'Record<string, any>',
    'array': 'any[]',
    'array-string': 'string[]',
    'array-number': 'number[]'
  };
  return typeMap[type] || 'any';
};

// Generate full prompt text for copying
const generatePromptText = () => {
  let promptText = '';

  // Header
  promptText += '# Next.js Admin Panel CRUD Implementation\n\n';

  // Context
  promptText += '## Context\n';
  promptText += 'You are an experienced frontend developer working on a Next.js-based admin panel. You have access to the reference implementation in `code.md` (included in this prompt package) which serves as the source of truth for our team\'s patterns, architecture, and design standards.\n\n';

  // Initial Setup
  promptText += '## Initial Setup\n';
  promptText += '**IMPORTANT: Before starting development:**\n';
  promptText += '**IMPORTANT**: There is a working project code file called `code.md` (included in this prompt package) that contains a fully functional Next.js admin panel implementation. Use this as your starting point to ensure the project works without errors.\n\n';
  promptText += '**The folder structure inside the referenced code.md is:**\n';
  promptText += '```\n';
  promptText += '├── app/\n';
  promptText += '│   ├── dashboard/\n';
  promptText += '│   ├── error.tsx\n';
  promptText += '│   ├── favicon.ico\n';
  promptText += '│   ├── globals.css\n';
  promptText += '│   ├── layout.tsx\n';
  promptText += '│   ├── not-found.tsx\n';
  promptText += '│   └── page.tsx\n';
  promptText += '├── components/\n';
  promptText += '├── public/\n';
  promptText += '├── stores/\n';
  promptText += '├── types/\n';
  promptText += '├── .gitignore\n';
  promptText += '├── code.md\n';
  promptText += '├── eslint.config.mjs\n';
  promptText += '├── next-env.d.ts\n';
  promptText += '├── next.config.ts\n';
  promptText += '├── package.json\n';
  promptText += '├── postcss.config.mjs\n';
  promptText += '├── README.md\n';
  promptText += '└── tsconfig.json\n';
  promptText += '```\n\n';
  promptText += '**Use the folder structure and code from code.md strictly for a clean start, and modify as per your needs.**\n\n';
  promptText += '**IMPORTANT - Reference-Only Elements:**\n';
  promptText += 'The `code.md` file contains certain pages and UI elements that are included solely for demonstrating patterns and architecture. Unless explicitly requested by the user, **DO NOT include** the following in the final output:\n';
  promptText += '- **Projects page** (`app/dashboard/projects/page.tsx`) and its associated components - this is a sample CRUD page for reference only\n';
  promptText += '- **"Projects" navigation link** in the sidebar - remove or replace with your actual entity pages\n';
  promptText += '- **"Settings" button** in the navigation bar - this is a placeholder and not required\n\n';
  promptText += 'These elements exist to demonstrate how to structure CRUD pages, navigation links, and component patterns. Use them as templates for implementing the actual entities specified in this prompt, then remove or replace them accordingly.\n\n';
  promptText += '1. Start with the working project code from `code.md` - this is a tested, error-free implementation\n';
  promptText += '2. Review the complete folder structure from code.md (as shown above)\n';
  promptText += '3. Study existing CRUD page implementations in code.md thoroughly - understand the patterns before coding\n';
  promptText += '4. Examine how components are structured and reused across pages in the code.md project\n';
  promptText += '5. Review the state management approach (context, custom hooks, or state library) from code.md\n';
  promptText += '6. Install dependencies (`npm install` or preferred package manager)\n';
  promptText += '7. Build upon the code.md implementation for the specific entities and APIs defined below\n';
  promptText += '8. Remove or replace the reference-only elements (Projects page, Settings button) with your actual implementation\n\n';

  // Purpose
  promptText += '## Purpose\n';
  promptText += 'Implement CRUD operations for the entities specified below in our Next.js admin panel, matching existing patterns exactly and meeting all acceptance criteria.\n\n';

  // Tech Context
  promptText += '## Tech Stack (Reference Repository)\n';
  promptText += '- **Next.js:** Check version in package.json (14.x/15.x) and routing strategy (App Router/Pages Router)\n';
  promptText += '- **React:** 18.x+ with TypeScript strict mode\n';
  promptText += '- **State Management:** Review the repository for state approach (Context API/Zustand/Redux/TanStack Query)\n';
  promptText += '- **HTTP Client:** Check existing API calls to identify pattern (`fetch`, `axios`, or TanStack Query)\n';
  promptText += '- **Styling:** Tailwind CSS with utility classes - NO custom CSS files\n';
  promptText += '- **UI Components:** Check repository for specific component library (shadcn/ui, MUI, Ant Design, etc.)\n';
  promptText += '- **Validation:** Review forms to identify validation library (zod, yup, etc.)\n';
  promptText += '- **Forms:** Check for form library usage (react-hook-form, formik, etc.)\n';
  promptText += '- **Routing:** App Router (`app/*`) or Pages Router (`pages/*`) - follow existing convention\n';
  promptText += '- **Authentication:** Middleware-based auth guards (check `middleware.ts` or auth patterns)\n';
  promptText += '- **i18n:** Check if internationalization is configured in the project\n';
  promptText += '- **Accessibility:** Follow WCAG AA standards as implemented in existing components\n\n';

  // Task
  promptText += '## Task\n';
  promptText += 'Using the existing repository code as your complete reference guide:\n\n';
  promptText += '1. **Study the existing CRUD implementations** - Look at how pages are structured, component organization, and data flow\n';
  promptText += '2. **Understand the component architecture** - Note which components are reusable (modals, forms, tables) and composition patterns\n';
  promptText += '3. **Review page structure** - Examine how CRUD pages are built, their layouts, and navigation flows\n';
  promptText += '4. **Check Server vs Client Components** - If using App Router, understand the SSR/CSR split\n';
  promptText += '5. **Implement CRUD functionality** - Create equivalent pages for the specified entities below that match existing implementations in design, structure, and behavior\n\n';

  // Requirements
  promptText += '## Requirements\n\n';

  promptText += '### Code Quality Standards\n';
  promptText += '- Strictly adhere to the patterns, folder structure, and architectural decisions present in the existing codebase\n';
  promptText += '- Match the current approach to Server Components, Client Components, and data fetching strategies\n';
  promptText += '- Ensure type safety using TypeScript strict mode with proper interfaces/types\n';
  promptText += '- Implement error boundaries and error handling consistent with current patterns\n';
  promptText += '- Follow established code style, formatting, linting rules, and naming conventions\n';
  promptText += '- Maintain the same file organization and component structure\n';
  promptText += '- Use proper React hooks patterns as per existing implementations\n\n';

  promptText += '### Design & UI Consistency\n';
  promptText += '**Reference the existing CRUD pages in the repository for:**\n';
  promptText += '- Exact page layouts, grid systems, and component arrangements\n';
  promptText += '- Table/data grid designs, column structures, and row actions\n';
  promptText += '- Pagination controls styling and functionality\n';
  promptText += '- Button designs, icons, and interactive element states (hover, active, disabled)\n';
  promptText += '- Modal components for create, edit, delete, and view operations\n';
  promptText += '- Form designs, input components, labels, and validation error displays\n';
  promptText += '- Loading indicators, skeleton loaders, and empty state illustrations\n';
  promptText += '- Color palette, spacing system, typography, and shadow styles (using UI kit classes only)\n';
  promptText += '- Responsive design patterns and mobile-first considerations\n';
  promptText += '- Toast/notification designs and animations\n\n';

  promptText += '### Functional Requirements\n';
  promptText += '**Follow the existing CRUD implementations for:**\n';
  promptText += '- List/index pages with identical table features (sorting, filtering, search, pagination)\n';
  promptText += '- Create and edit pages with the same form structure, validation logic, and submission handling\n';
  promptText += '- Delete functionality with matching confirmation dialog behavior and feedback\n';
  promptText += '- API integration patterns using the specified HTTP client with proper configurations\n';
  promptText += '- Success and error notification positioning and animation\n';
  promptText += '- Loading and skeleton state implementations\n';
  promptText += '- Navigation patterns, back buttons, and breadcrumb behavior\n';
  promptText += '- Data refresh, revalidation, and optimistic update strategies\n';
  promptText += '- Authentication guards and permission checks\n\n';

  promptText += '### Component Structure\n';
  promptText += '**Create modular, reusable components:**\n';
  promptText += '- Modal/Dialog components for create/edit/delete operations\n';
  promptText += '- Form components with proper validation and error handling\n';
  promptText += '- Table/DataGrid components with server-side or client-side features\n';
  promptText += '- Filter, search, and sort components\n';
  promptText += '- Reusable UI blocks following existing component patterns\n';
  promptText += '- All components should follow existing directory structure (`components/*` or `app/components/*`)\n';
  promptText += '- Proper separation of Server and Client Components (if using App Router)\n\n';
  promptText += '**Modal Component Pattern (React/Next.js):**\n';
  promptText += '- When you think a modal needs to be created for a functionality, create it inside `components/modals/` folder\n';
  promptText += '- Open modals inside pages using state management:\n';
  promptText += '  ```typescript\n';
  promptText += '  const [modal, setModal] = useState({ type: null, data: null });\n';
  promptText += '  const openModal = (type, data = null) => setModal({ type, data });\n';
  promptText += '  const closeModal = () => setModal({ type: null, data: null });\n';
  promptText += '  \n';
  promptText += '  // Render modal conditionally\n';
  promptText += '  {modal.type === \'create\' && <CreateModal onClose={closeModal} />}\n';
  promptText += '  {modal.type === \'edit\' && <EditModal data={modal.data} onClose={closeModal} />}\n';
  promptText += '  ```\n\n';

  promptText += '### Technical Specifications\n';
  promptText += '- Use the specified UI component library exclusively - NO custom CSS\n';
  promptText += '- Implement state management following existing patterns and store structure\n';
  promptText += '- Use the specified HTTP client with the same interceptor/middleware patterns\n';
  promptText += '- Follow existing routing conventions with proper layout and middleware\n';
  promptText += '- Implement the same validation library and form handling patterns\n';
  promptText += '- Match current custom hooks usage for shared logic\n';
  promptText += '- Include proper TypeScript interfaces/types for all entities, props, and API responses\n';
  promptText += '- Maintain the same accessibility features (ARIA labels, keyboard navigation, focus management)\n';
  promptText += '- Follow i18n patterns for all user-facing text if i18n is enabled\n';
  promptText += '- Implement proper loading, error, and suspense boundaries using existing patterns\n';
  promptText += '- Use the same data fetching strategy (SSR/SSG/ISR/Client-side) as existing pages\n\n';

  // State Architecture & CRUD Pages
  promptText += '## State-Aware Architecture\n';
  promptText += '**For each admin entity listed below, implement complete CRUD pages:**\n\n';

  promptText += '### Dashboard Integration\n';
  promptText += '**IMPORTANT: Create dashboard widgets for CRUD-enabled entities:**\n';
  if (entities.value.length > 0) {
    promptText += '- Create the following dashboard components in `components/Dashboard/` (or appropriate location):\n';
    entities.value.forEach(entity => {
      promptText += `  - \`Dashboard/${entity.name}.tsx\` - Widget for ${entity.name} entity\n`;
    });
    promptText += '\n';
    promptText += '- Each dashboard widget should display:\n';
    promptText += '  - Summary statistics (total count, recent additions, etc.)\n';
    promptText += '  - Quick actions (Create New, View All)\n';
    promptText += '  - Preview of recent/important records\n';
    promptText += '  - Link to the full CRUD page\n\n';
  } else {
    promptText += '- Create dashboard components in `components/Dashboard/[EntityName].tsx` for each entity below\n';
    promptText += '- Each widget should show summary stats and quick actions\n\n';
  }

  promptText += '### Required Pages Per Entity\n';
  promptText += '1. **List/Index Page** (`app/admin/[entity]/page.tsx` or `pages/admin/[entity]/index.tsx`)\n';
  promptText += '   - Display all records in a table/grid format\n';
  promptText += '   - Include pagination, sorting, and filtering\n';
  promptText += '   - Action buttons: View, Edit, Delete\n';
  promptText += '   - "Create New" button to add records\n\n';
  promptText += '2. **Create Page** (`app/admin/[entity]/create/page.tsx` or `pages/admin/[entity]/create.tsx`)\n';
  promptText += '   - Form to add a new entity record\n';
  promptText += '   - Validation matching API requirements\n';
  promptText += '   - Cancel and Submit actions\n';
  promptText += '   - Success/error notifications\n\n';
  promptText += '3. **Edit Page** (`app/admin/[entity]/[id]/edit/page.tsx` or `pages/admin/[entity]/[id]/edit.tsx`)\n';
  promptText += '   - Pre-populated form with existing data\n';
  promptText += '   - Same validation as create form\n';
  promptText += '   - Update and Cancel actions\n';
  promptText += '   - Success/error notifications\n\n';
  promptText += '4. **View/Detail Page** (Optional, based on existing patterns)\n';
  promptText += '   - Read-only display of entity details\n';
  promptText += '   - Action buttons to Edit or Delete\n\n';
  promptText += '### State Management Pattern\n';
  promptText += '- Follow existing state management approach in the repository\n';
  promptText += '- If using Context API: Create context for each entity with providers\n';
  promptText += '- If using Zustand/Redux: Create store slices for each entity\n';
  promptText += '- If using TanStack Query: Create query hooks for CRUD operations\n';
  promptText += '- State should manage: list data, current item, loading states, errors\n';
  promptText += '- Actions/hooks: fetchAll, fetchOne, create, update, delete\n\n';

  // Deliverables
  promptText += '## Deliverables\n';
  promptText += '- Complete CRUD pages (list, create, edit, view) for each admin entity\n';
  promptText += '- Dashboard widget components (`components/Dashboard/[EntityName].tsx`) for each entity\n';
  promptText += '- State management implementation following existing patterns\n';
  promptText += '- Clean integration with provided API endpoints using established patterns\n';
  promptText += '- Reusable components for modals, forms, and feature blocks\n';
  promptText += '- TypeScript interfaces for all entities, props, and API contracts\n';
  promptText += '- Proper Server/Client Component separation (if App Router)\n';
  promptText += '- Navigation and routing that integrates with existing admin layout\n';
  promptText += '- Code that maintains perfect consistency with existing codebase patterns and introduces zero new conventions\n\n';

  promptText += '---\n\n';

  // Admin API Endpoints
  promptText += '## Admin API Endpoints\n\n';
  promptText += '**Base URL Configuration:**\n';
  promptText += 'Configure the mock server base URL in your environment configuration:\n\n';
  promptText += '1. Create a `.env.local` file in your project root\n';
  promptText += '2. Add the following environment variable:\n';
  promptText += '   ```\n';
  if (selectedProject.value?.id) {
    promptText += `   NEXT_PUBLIC_API_BASE_URL=${mockServerBaseUri}/api/projects/${selectedProject.value.id}\n`;
  } else {
    promptText += `   NEXT_PUBLIC_API_BASE_URL=${mockServerBaseUri}/api/projects/YOUR_PROJECT_ID\n`;
  }
  promptText += '   ```\n';
  promptText += '3. Access it in your API configuration/client:\n';
  promptText += '   ```typescript\n';
  if (selectedProject.value?.id) {
    promptText += `   const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '${mockServerBaseUri}/api/projects/${selectedProject.value.id}';\n`;
  } else {
    promptText += `   const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '${mockServerBaseUri}/api/projects/YOUR_PROJECT_ID';\n`;
  }
  promptText += '   ```\n\n';
  promptText += '**All API endpoints listed below are admin endpoints (isAdminEndpoint: true) and should be used for admin panel operations.**\n\n';

  if (adminApis.value.length > 0) {
    adminApis.value.forEach(api => {
      promptText += `### ${api.method} ${api.endpoint}\n`;
      if (api.description) promptText += `**Description:** ${api.description}\n`;
      if (api.isAuth) promptText += `**Authentication:** Required\n`;
      promptText += '\n';

      if (api.statusMocks && api.statusMocks.length > 0) {
        api.statusMocks.forEach((statusMock, index) => {
          promptText += `**Response ${index + 1} (${statusMock.statusCode})**${statusMock.enabled ? ' [Active]' : ''}\n\n`;

          if (statusMock.headerParams && statusMock.headerParams.length > 0) {
            promptText += '**Headers:**\n';
            statusMock.headerParams.forEach(p => {
              promptText += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
            });
            promptText += '\n';
          }

          if (statusMock.queryParams && statusMock.queryParams.length > 0) {
            promptText += '**Query Parameters:**\n';
            statusMock.queryParams.forEach(p => {
              promptText += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
            });
            promptText += '\n';
          }

          if (statusMock.bodyParams && statusMock.bodyParams.length > 0) {
            promptText += '**Body Parameters:**\n';
            statusMock.bodyParams.forEach(p => {
              promptText += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
            });
            promptText += '\n';
          }

          if (statusMock.validators && statusMock.validators.length > 0) {
            promptText += '**Validation Rules:**\n';
            statusMock.validators.forEach(v => {
              promptText += `  - ${v.field}: ${v.rule} - ${v.message}\n`;
            });
            promptText += '\n';
          }

          if (statusMock.responseValue) {
            promptText += '**Response:**\n```json\n';
            promptText += formatJson(statusMock.responseValue);
            promptText += '\n```\n\n';
          }
        });
      }

      promptText += '---\n\n';
    });
  } else {
    promptText += 'No admin endpoints defined yet.\n\n';
  }

  // Entities to Implement
  promptText += '## Entities to Implement\n\n';

  if (entities.value.length > 0) {
    entities.value.forEach(entity => {
      promptText += `### ${entity.name}\n`;
      if (entity.description) promptText += `**Description:** ${entity.description}\n`;

      // Add allowed operations info
      if (entity.isAdminPanelPage && entity.allowedOperations && entity.allowedOperations.length > 0) {
        promptText += `**Allowed CRUD Operations:** ${entity.allowedOperations.join(', ')}\n`;
        promptText += '\n**Implementation Requirements:**\n';

        const operations = entity.allowedOperations;
        if (operations.includes('GET')) {
          promptText += '- Implement **List/Index page** to fetch and display all records\n';
          promptText += '- Implement **View/Detail page** to fetch and display a single record\n';
        }
        if (operations.includes('POST')) {
          promptText += '- Implement **Create page/modal** to add new records\n';
        }
        if (operations.includes('PUT')) {
          promptText += '- Implement **Edit page/modal** to update existing records\n';
        }
        if (operations.includes('DELETE')) {
          promptText += '- Implement **Delete functionality** with confirmation dialog\n';
        }

        promptText += '\n**Note:** Only implement the operations listed above. Do not create pages or functionality for operations not included in the allowed list.\n';
      }

      promptText += '\n**TypeScript Interface:**\n```typescript\n';
      promptText += generateEntityInterface(entity);
      promptText += '\n```\n\n';

      if (entity.fields && entity.fields.length > 0) {
        promptText += '**Fields:**\n';
        entity.fields.forEach(field => {
          promptText += `  - \`${field.name}\`: ${field.type}${field.required ? ' (required)' : ''}${field.ref ? ` (ref: ${field.ref})` : ''}\n`;
        });
      }

      promptText += '\n---\n\n';
    });
  } else {
    promptText += 'No entities defined yet.\n\n';
  }

  // Admin Panel Groups (Groups with isAdminPanelPage enabled)
  if (adminPanelGroups.value.length > 0) {
    promptText += '## Admin Panel Groups\n\n';
    promptText += '**The following groups have Admin Panel Page enabled. Create dedicated admin pages for APIs belonging to these groups:**\n\n';

    adminPanelGroups.value.forEach(group => {
      promptText += `### ${group.name}\n`;
      promptText += `**Group Name:** ${group.name}\n`;
      promptText += '**Admin Panel Page:** Enabled\n\n';

      // Find APIs that belong to this group
      const groupApis = adminApis.value.filter(api => api.group === group.name);
      if (groupApis.length > 0) {
        promptText += '**APIs in this group:**\n';
        groupApis.forEach(api => {
          promptText += `- \`${api.method} ${api.endpoint}\`${api.description ? ` - ${api.description}` : ''}\n`;
        });
        promptText += '\n';
      }

      promptText += '**Implementation Requirements:**\n';
      promptText += `- Create admin pages under \`app/admin/${group.name.toLowerCase().replace(/\s+/g, '-')}/\` directory\n`;
      promptText += '- Implement List/Index page to display all records from APIs in this group\n';
      promptText += '- Implement Create/Edit/Delete functionality based on available API endpoints\n';
      promptText += '- Add navigation link in admin sidebar for this group\n';
      promptText += '- Create dashboard widget for quick access and statistics\n\n';
      promptText += '---\n\n';
    });
  }

  // Acceptance Criteria
  promptText += '## Acceptance Criteria\n';
  promptText += '- [ ] All CRUD operations functional and tested\n';
  promptText += '- [ ] UI matches existing pages pixel-perfect\n';
  promptText += '- [ ] No custom CSS written - only UI kit classes used\n';
  promptText += '- [ ] TypeScript strict mode compliance with no errors\n';
  promptText += '- [ ] Proper error handling, loading states, and error boundaries\n';
  promptText += '- [ ] Authentication/authorization implemented correctly\n';
  promptText += '- [ ] Components are modular, reusable, and properly typed\n';
  promptText += '- [ ] State management follows existing patterns\n';
  promptText += '- [ ] Accessibility standards met (WCAG AA)\n';
  promptText += '- [ ] Code passes existing linting and formatting rules\n';
  promptText += '- [ ] Proper Server/Client Component usage (if App Router)\n';
  promptText += '- [ ] Data fetching follows existing patterns (caching, revalidation)\n\n';

  promptText += '---\n\n';
  promptText += '**Please thoroughly analyze the existing CRUD pages in the repository, understand all design patterns and UI/UX conventions, and outline your implementation approach before beginning development.**\n';

  return promptText;
};

const downloadPrompt = async () => {
  // Scroll to steps section in parent and wait for animation
  if (scrollToSteps) {
    await scrollToSteps();
  }

  const zip = new JSZip();

  // Create project folder structure: <project_name>/prompt/workflows
  const projectName = 'admin-frontend-nextjs';
  const projectFolder = zip.folder(projectName);
  const promptFolder = projectFolder?.folder('prompt');
  const workflowsFolder = promptFolder?.folder('workflows');

  // Add code.md with the demo project code
  if (demoProjectCode.value) {
    workflowsFolder?.file('code.md', demoProjectCode.value);
  }

  // Add project.md with the prompt text
  const projectMd = generatePromptText();
  workflowsFolder?.file('project.md', projectMd);

  // Add .gitignore file at project root
  const gitignoreContent = 'prompt\n';
  projectFolder?.file('.gitignore', gitignoreContent);

  // Generate and download zip
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${projectName}.zip`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const copySuccess = ref(false);

const copyPromptToClipboard = async () => {
  try {
    const promptText = generatePromptText();

    if (!promptText) {
      console.error('No prompt text generated');
      return;
    }

    await navigator.clipboard.writeText(promptText);
    console.log('Prompt copied to clipboard successfully!');
    console.log('Prompt length:', promptText.length, 'characters');

    // Show success feedback
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy prompt to clipboard:', error);
    alert('Failed to copy to clipboard. Please check browser permissions.');
  }
};
</script>
