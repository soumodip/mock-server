<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div class="bg-[#242736] rounded-xl shadow-2xl max-w-5xl w-full mx-4 border border-gray-700 max-h-[90vh] flex flex-col">
      <div class="p-6 border-b border-gray-700 flex-shrink-0">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-200">Prompts</h2>
          <div class="flex gap-2">
            <button
              @click="copyPromptToClipboard"
              class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
              title="Copy prompt to clipboard"
            >
              <Icon name="mdi:content-copy" class="w-4 h-4" />
            </button>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-300">
              <Icon name="mdi:close" class="w-5 h-5" />
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="activeTab = 'backend'"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeTab === 'backend'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#353849] text-gray-300 hover:bg-[#3d4152]'
            ]"
          >
            Backend
          </button>
          <button
            @click="activeTab = 'admin-panel'"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeTab === 'admin-panel'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#353849] text-gray-300 hover:bg-[#3d4152]'
            ]"
          >
            Admin Panel Frontend
          </button>
        </div>
      </div>
      <div class="p-6 overflow-y-auto flex-1 text-gray-300 text-sm space-y-4 leading-relaxed">
        <!-- Backend Tab Content -->
        <div v-if="activeTab === 'backend'">
        <p>Create a production-ready Node.js backend application using TypeScript, TypeORM, PostgreSQL, and Zod for validation. The project should follow a clean architecture pattern with proper separation of concerns.</p>

        <h3 class="text-base font-semibold text-gray-200 pt-2">Technology Stack Requirements</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Runtime</strong>: Node.js with TypeScript</li>
          <li><strong>Database</strong>: PostgreSQL with TypeORM as ORM</li>
          <li><strong>Validation</strong>: Zod for schema validation</li>
          <li><strong>Authentication</strong>: {{ getAuthText() }}</li>
          <li><strong>Framework</strong>: Express.js</li>
          <li><strong>Environment</strong>: dotenv for configuration management</li>
          <li><strong>Logging</strong>: Winston or similar logging library</li>
          <li><strong>Security</strong>: Rate limiting, helmet, cors middleware</li>
        </ul>

        <h3 class="text-base font-semibold text-gray-200 pt-2">Project Structure and Implementation Guidelines</h3>

        <h4 class="text-sm font-semibold text-gray-200">Directory Structure</h4>
        <p>Follow the exact directory structure provided below. Each file should serve a specific purpose following single responsibility principle:</p>

        <pre class="bg-[#2d3142] p-3 rounded-lg border border-gray-600 overflow-x-auto"><code>backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route handlers (no business logic)
│   ├── entities/         # TypeORM entities
│   ├── middleware/       # Express middleware
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic layer
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── validators/       # Zod validation schemas
│   ├── migrations/       # Database migrations
│   ├── seeders/          # Database seeders
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point</code></pre>

        <h4 class="text-sm font-semibold text-gray-200 pt-2">Implementation Rules</h4>

        <h5 class="text-sm font-medium text-gray-200 pt-1">1. Controllers (src/controllers/)</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Controllers should ONLY handle HTTP request/response cycle</li>
          <li>No business logic in controllers</li>
          <li>Call validators first, then delegate to services</li>
          <li>Use dependency injection pattern</li>
          <li>Return standardized API responses using <code class="text-indigo-400">apiResponse</code> utility</li>
          <li>Follow naming convention: <code class="text-indigo-400">[Module]Controller</code> class (e.g., <code class="text-indigo-400">AuthController</code>, <code class="text-indigo-400">UserController</code>)</li>
        </ul>

        <p class="text-sm">Example pattern:</p>
        <pre class="bg-[#2d3142] p-3 rounded-lg border border-gray-600 overflow-x-auto"><code>class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validation
      const validationResult = AuthValidator.registerSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new AppError(
          'Validation failed',
          400,
          validationResult.error.errors
        );
      }
      // 2. Call service
      const result = await authService.register(req.body);
      // 3. Return standardized response
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}</code></pre>

        <h5 class="text-sm font-medium text-gray-200 pt-2">2. Services (src/services/)</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Contains ALL business logic</li>
          <li>Database operations through repository pattern</li>
          <li>Handle transactions</li>
          <li>Throw custom errors for different scenarios</li>
          <li>Follow naming convention: <code class="text-indigo-400">[Module]Service</code> class (e.g., <code class="text-indigo-400">AuthService</code>, <code class="text-indigo-400">UserService</code>)</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">3. Validators (src/validators/)</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Use Zod for schema definitions</li>
          <li>Export schemas for request body, query params, and params</li>
          <li>Follow naming convention: <code class="text-indigo-400">[Module]Validator</code> class with static schemas</li>
          <li>Validators should be used as middleware before controller methods</li>
        </ul>

        <p class="text-sm">Example:</p>
        <pre class="bg-[#2d3142] p-3 rounded-lg border border-gray-600 overflow-x-auto"><code>class AuthValidator {
  static registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    // ... other fields
  });
}</code></pre>

        <h5 class="text-sm font-medium text-gray-200 pt-2">4. Entities (src/entities/)</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Use TypeORM decorators</li>
          <li>Extend from <code class="text-indigo-400">BaseEntity</code> which includes common fields (id, createdAt, updatedAt, deletedAt)</li>
          <li>Implement soft delete functionality</li>
          <li>Add proper indexes for performance</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">5. Routes (src/routes/)</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Define route paths and HTTP methods</li>
          <li>Apply validation middleware</li>
          <li>Apply authentication middleware where needed</li>
          <li>Connect to appropriate controller methods</li>
        </ul>

        <p class="text-sm">Flow: <code class="text-indigo-400">Route → Validation Middleware → Auth Middleware (if needed) → Controller → Service → Database</code></p>

        <h5 class="text-sm font-medium text-gray-200 pt-2">6. Middleware (src/middleware/)</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>auth.middleware.ts</strong>: JWT token verification</li>
          <li><strong>error.middleware.ts</strong>: Global error handler with proper status codes</li>
          <li><strong>validation.middleware.ts</strong>: Generic Zod validation wrapper</li>
          <li><strong>rateLimiter.middleware.ts</strong>: Rate limiting per endpoint</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">7. Config (src/config/)</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>database.ts</strong>: Database connection setup</li>
          <li><strong>env.ts</strong>: Environment variable validation using Zod</li>
          <li><strong>ormconfig.ts</strong>: TypeORM configuration</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">8. Utils (src/utils/)</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>logger.ts</strong>: Centralized logging with levels (error, warn, info, debug)</li>
          <li><strong>bcrypt.ts</strong>: Password hashing and comparison</li>
          <li><strong>jwt.ts</strong>: Token generation and verification</li>
          <li><strong>apiResponse.ts</strong>: Standardized API response format</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">9. Database (src/seeders/)</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Generate <code class="text-indigo-400">all.sql</code> file with complete database schema including:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>CREATE TABLE statements with all constraints</li>
              <li>Indexes for performance</li>
              <li>Foreign key relationships</li>
              <li>Initial seed data INSERT statements</li>
              <li>Include comments explaining each table's purpose</li>
            </ul>
          </li>
        </ul>

        <h4 class="text-sm font-semibold text-gray-200 pt-3">Code Generation Requirements</h4>

        <p>When provided with <code class="text-indigo-400">&lt;Endpoints&gt;</code> and <code class="text-indigo-400">&lt;Entities&gt;</code>:</p>

        <ol class="list-decimal pl-5 space-y-2">
          <li><strong>Analyze the Endpoints</strong> to determine:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Required routes and HTTP methods</li>
              <li>Authentication requirements</li>
              <li>Request/response schemas</li>
              <li>Module groupings</li>
            </ul>
          </li>
          <li><strong>From Entities</strong>, generate:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>TypeORM entity classes with proper decorators</li>
              <li>Database migration files</li>
              <li>Complete <code class="text-indigo-400">all.sql</code> with CREATE TABLE and seed data</li>
              <li>Zod validation schemas matching entity fields</li>
            </ul>
          </li>
          <li><strong>Generate complete implementation</strong> for:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>All controllers with proper error handling</li>
              <li>Services with complete business logic</li>
              <li>Validators using Zod schemas</li>
              <li>Routes with middleware chain</li>
              <li>Migration files with up/down methods</li>
              <li>Comprehensive seeders</li>
            </ul>
          </li>
        </ol>

        <h4 class="text-sm font-semibold text-gray-200 pt-3">Additional Requirements</h4>

        <ol class="list-decimal pl-5 space-y-2">
          <li><strong>Security Best Practices</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Input sanitization</li>
              <li>SQL injection prevention (use parameterized queries)</li>
              <li>XSS protection</li>
              <li>CORS configuration</li>
              <li>Rate limiting</li>
              <li>Secure password storage</li>
            </ul>
          </li>
          <li><strong>Error Handling</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Custom error classes</li>
              <li>Proper HTTP status codes</li>
              <li>Detailed error messages in development</li>
              <li>Generic messages in production</li>
            </ul>
          </li>
          <li><strong>Testing Readiness</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Structure should support unit testing</li>
              <li>Services should be mockable</li>
              <li>Controllers should be testable in isolation</li>
            </ul>
          </li>
          <li><strong>Documentation</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Generate comprehensive README.md</li>
              <li>API documentation for each endpoint</li>
              <li>Environment variable documentation in .env.example</li>
            </ul>
          </li>
          <li><strong>Package.json Scripts</strong>:
            <pre class="bg-[#2d3142] p-3 rounded-lg border border-gray-600 overflow-x-auto mt-2"><code>{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "migration:run": "typeorm migration:run",
    "migration:revert": "typeorm migration:revert",
    "seed": "ts-node src/seeders/user.seeder.ts"
  }
}</code></pre>
          </li>
        </ol>

        <h4 class="text-sm font-semibold text-gray-200 pt-3">Output Format</h4>

        <p>Generate all files with complete, production-ready code. Each file should include:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Proper imports</li>
          <li>TypeScript types</li>
          <li>Error handling</li>
          <li>Comments for complex logic</li>
          <li>Following the exact naming conventions specified</li>
        </ul>

        <p>The generated code should be immediately runnable after installing dependencies and setting up the database.</p>

        <h3 class="text-base font-semibold text-gray-200 pt-4 border-t border-gray-700 mt-6">Project-Specific Data</h3>

        <h4 class="text-sm font-semibold text-gray-200 pt-2">&lt;Endpoints&gt;</h4>
        <div v-if="activeApis.length > 0" class="space-y-2">
          <div v-for="(api, index) in activeApis" :key="api.id" class="bg-[#2d3142] p-3 rounded-lg border border-gray-600">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full"
                :class="{
                  'bg-green-900/30 text-green-300': api.method === 'GET',
                  'bg-blue-900/30 text-blue-300': api.method === 'POST',
                  'bg-yellow-900/30 text-yellow-300': api.method === 'PUT',
                  'bg-red-900/30 text-red-300': api.method === 'DELETE',
                  'bg-purple-900/30 text-purple-300': api.method === 'PATCH',
                }">
                {{ api.method }}
              </span>
              <span class="font-mono text-sm text-indigo-400">{{ api.endpoint }}</span>
              <span v-if="api.isAuth" class="px-2 py-0.5 text-xs bg-amber-900/30 text-amber-300 rounded-full">Auth Required</span>
            </div>
            <div v-if="api.description" class="text-xs text-gray-400 italic mb-2">{{ api.description }}</div>
            <div class="text-xs text-gray-400">
              <div v-if="activeStatusMock(api)!">
                <div><strong>Status:</strong> {{ activeStatusMock(api)!.statusCode }}</div>
                <div v-if="activeStatusMock(api)!.queryParams?.length"><strong>Query Params:</strong> {{ formatParams(activeStatusMock(api)!.queryParams!) }}</div>
                <div v-if="activeStatusMock(api)!.bodyParams?.length"><strong>Body Params:</strong> {{ formatParams(activeStatusMock(api)!.bodyParams!) }}</div>
                <div v-if="activeStatusMock(api)!.headerParams?.length"><strong>Header Params:</strong> {{ formatParams(activeStatusMock(api)!.headerParams!) }}</div>
              </div>
            </div>
            <div v-if="activeStatusMock(api)?.responseValue" class="mt-2 text-xs">
              <strong class="text-green-400">Success Response:</strong>
              <pre class="bg-[#1a1d2e] p-2 rounded mt-1 overflow-x-auto">{{ formatJson(activeStatusMock(api)!.responseValue!) }}</pre>
            </div>
            <div v-if="api.errorResponseValue" class="mt-2 text-xs">
              <strong class="text-red-400">Error Response:</strong>
              <pre class="bg-[#1a1d2e] p-2 rounded mt-1 overflow-x-auto">{{ formatJson(api.errorResponseValue) }}</pre>
            </div>
          </div>
        </div>
        <div v-else class="bg-[#2d3142] p-4 rounded-lg border border-gray-600 text-gray-400 text-center">
          No active APIs found
        </div>

        <h4 class="text-sm font-semibold text-gray-200 pt-3">&lt;Entities&gt;</h4>
        <div v-if="entities.length > 0" class="space-y-2">
          <div v-for="entity in entities" :key="entity.id" class="bg-[#2d3142] p-3 rounded-lg border border-gray-600">
            <div class="font-semibold text-indigo-400 mb-2">{{ entity.name }}</div>
            <div v-if="entity.description" class="text-xs text-gray-400 italic mb-2">{{ entity.description }}</div>
            <div class="text-xs">
              <strong class="text-gray-300">Fields:</strong>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li v-for="field in entity.fields" :key="field.name">
                  <span class="text-gray-300">{{ field.name }}</span>:
                  <span class="text-indigo-400">{{ field.type }}</span>
                  <span v-if="field.ref" class="text-purple-400"> (ref: {{ field.ref }})</span>
                  <span v-if="field.required" class="text-red-400"> *required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-else class="bg-[#2d3142] p-4 rounded-lg border border-gray-600 text-gray-400 text-center">
          No entities found
        </div>
        </div>

        <!-- Admin Panel Frontend Tab Content -->
        <div v-else-if="activeTab === 'admin-panel'">
        <p>Create a modern, production-ready Admin Panel Frontend application using Nuxt 4 and Tailwind CSS. The application should provide a complete admin interface for managing entities through a well-structured, maintainable codebase.</p>

        <h3 class="text-base font-semibold text-gray-200 pt-2">Technology Stack Requirements</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Framework</strong>: Nuxt 4 (latest version)</li>
          <li><strong>Styling</strong>: Tailwind CSS only (no raw CSS files)</li>
          <li><strong>State Management</strong>: Pinia for state management</li>
          <li><strong>API Communication</strong>: Nuxt's built-in $fetch or useFetch composables</li>
          <li><strong>Form Handling</strong>: Native Vue 3 composition API with proper validation</li>
          <li><strong>Authentication</strong>: JWT-based authentication with token storage</li>
          <li><strong>Icons</strong>: @nuxt/icon or similar icon library</li>
          <li><strong>Notifications</strong>: Toast notifications for user feedback</li>
        </ul>

        <h3 class="text-base font-semibold text-gray-200 pt-2">Project Structure and Implementation Guidelines</h3>

        <h4 class="text-sm font-semibold text-gray-200">Directory Structure</h4>
        <p>Follow the Nuxt 4 directory structure with proper organization:</p>

        <pre class="bg-[#2d3142] p-3 rounded-lg border border-gray-600 overflow-x-auto"><code>admin-panel/
├── app/
│   ├── components/          # Reusable Vue components
│   │   ├── common/          # Common UI components (Button, Input, etc.)
│   │   ├── layout/          # Layout components (Sidebar, Header, etc.)
│   │   └── forms/           # Form components
│   ├── composables/         # Composable functions
│   ├── layouts/             # Layout templates
│   ├── middleware/          # Route middleware (auth, guest)
│   ├── pages/               # File-based routing pages
│   │   ├── index.vue        # Dashboard/Home
│   │   ├── login.vue        # Login page
│   │   └── [entity]/        # Dynamic entity pages
│   ├── stores/              # Pinia stores
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── nuxt.config.ts          # Nuxt configuration</code></pre>

        <h4 class="text-sm font-semibold text-gray-200 pt-2">Implementation Rules</h4>

        <h5 class="text-sm font-medium text-gray-200 pt-1">1. Authentication Flow</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Create a login page with email/password fields</li>
          <li>Implement JWT token storage (localStorage or cookie-based)</li>
          <li>Create auth middleware to protect admin routes</li>
          <li>Add automatic token refresh or logout on expiry</li>
          <li>Implement auth store using Pinia for user state management</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">2. Layout Structure</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Create a responsive sidebar navigation with entity links</li>
          <li>Add a top header with user info and logout button</li>
          <li>Implement mobile-responsive navigation (hamburger menu)</li>
          <li>Use Tailwind CSS for all styling (no raw CSS files)</li>
          <li>Dark mode support using Tailwind's dark mode classes</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">3. CRUD Pages for Entities</h5>
        <p class="text-sm">For each entity, create the following pages:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>List Page</strong>: Display all records in a table with pagination, search, and filters</li>
          <li><strong>Create Page</strong>: Form to create new records with validation</li>
          <li><strong>Edit Page</strong>: Form to update existing records with pre-filled data</li>
          <li><strong>Delete Action</strong>: Confirm dialog before deletion with API call</li>
        </ul>

        <p class="text-sm">Example structure:</p>
        <pre class="bg-[#2d3142] p-3 rounded-lg border border-gray-600 overflow-x-auto"><code>pages/
├── users/
│   ├── index.vue          # List all users
│   ├── create.vue         # Create new user
│   └── [id]/
│       └── edit.vue       # Edit user by ID</code></pre>

        <h5 class="text-sm font-medium text-gray-200 pt-2">4. Component Design Patterns</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Create reusable form components (Input, Select, Textarea, Button)</li>
          <li>Build a DataTable component for listing entities</li>
          <li>Implement a Modal component for confirmations and forms</li>
          <li>Create a Loading component for async operations</li>
          <li>Add Toast/Notification component for success/error messages</li>
          <li>All components should use Tailwind CSS utility classes</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">5. API Integration</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Create composables for API calls (e.g., <code class="text-indigo-400">useApi</code>)</li>
          <li>Implement proper error handling with user-friendly messages</li>
          <li>Add loading states for all API operations</li>
          <li>Use TypeScript interfaces for API request/response types</li>
          <li>Include JWT token in authorization headers for protected endpoints</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">6. State Management with Pinia</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Create an auth store for user authentication state</li>
          <li>Create entity stores for managing CRUD operations</li>
          <li>Implement actions for API calls and mutations for state updates</li>
          <li>Use getters for computed state values</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">7. Form Validation</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Implement client-side validation for all forms</li>
          <li>Show inline error messages for invalid fields</li>
          <li>Disable submit button during API calls</li>
          <li>Handle server-side validation errors gracefully</li>
        </ul>

        <h5 class="text-sm font-medium text-gray-200 pt-2">8. Responsive Design</h5>
        <ul class="list-disc pl-5 space-y-1">
          <li>Mobile-first approach using Tailwind breakpoints</li>
          <li>Responsive tables (consider card view for mobile)</li>
          <li>Collapsible sidebar for mobile devices</li>
          <li>Touch-friendly buttons and interactive elements</li>
        </ul>

        <h4 class="text-sm font-semibold text-gray-200 pt-3">Code Generation Requirements</h4>

        <p>When provided with <code class="text-indigo-400">&lt;Admin Entities&gt;</code> and <code class="text-indigo-400">&lt;Admin APIs&gt;</code>:</p>

        <ol class="list-decimal pl-5 space-y-2">
          <li><strong>Analyze Admin Entities</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Generate CRUD pages for each entity</li>
              <li>Create appropriate form fields based on field types</li>
              <li>Implement proper validation based on field requirements</li>
              <li>Add relationship handling for referenced entities</li>
            </ul>
          </li>
          <li><strong>Analyze Admin APIs</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Create API service functions for each endpoint</li>
              <li>Implement proper authentication headers</li>
              <li>Handle different HTTP methods (GET, POST, PUT, DELETE)</li>
              <li>Add proper TypeScript types for requests/responses</li>
            </ul>
          </li>
          <li><strong>Generate Complete Implementation</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>All pages with proper layouts and navigation</li>
              <li>Reusable components with Tailwind CSS styling</li>
              <li>Pinia stores for state management</li>
              <li>API composables for data fetching</li>
              <li>Middleware for route protection</li>
              <li>TypeScript types for all data structures</li>
            </ul>
          </li>
        </ol>

        <h4 class="text-sm font-semibold text-gray-200 pt-3">Additional Requirements</h4>

        <ol class="list-decimal pl-5 space-y-2">
          <li><strong>User Experience</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Loading states for all async operations</li>
              <li>Success/error toast notifications</li>
              <li>Confirmation dialogs for destructive actions</li>
              <li>Keyboard navigation support</li>
              <li>Accessible form labels and ARIA attributes</li>
            </ul>
          </li>
          <li><strong>Performance</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Lazy loading for routes and components</li>
              <li>Optimistic UI updates where appropriate</li>
              <li>Debounced search functionality</li>
              <li>Pagination for large data sets</li>
            </ul>
          </li>
          <li><strong>Security</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Protect admin routes with auth middleware</li>
              <li>Sanitize user inputs</li>
              <li>Handle unauthorized access gracefully</li>
              <li>Implement CSRF protection if needed</li>
            </ul>
          </li>
          <li><strong>Documentation</strong>:
            <ul class="list-disc pl-5 mt-1 space-y-1">
              <li>Generate README.md with setup instructions</li>
              <li>Document environment variables in .env.example</li>
              <li>Add comments for complex logic</li>
              <li>Include usage examples for reusable components</li>
            </ul>
          </li>
          <li><strong>Package.json Scripts</strong>:
            <pre class="bg-[#2d3142] p-3 rounded-lg border border-gray-600 overflow-x-auto mt-2"><code>{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "generate": "nuxt generate",
    "postinstall": "nuxt prepare"
  }
}</code></pre>
          </li>
        </ol>

        <h4 class="text-sm font-semibold text-gray-200 pt-3">Styling Guidelines</h4>
        <ul class="list-disc pl-5 space-y-1">
          <li>Use Tailwind CSS utility classes exclusively</li>
          <li>Configure custom colors in tailwind.config if needed</li>
          <li>Consistent spacing and sizing using Tailwind scale</li>
          <li>Use Tailwind's built-in responsive breakpoints</li>
          <li>Leverage Tailwind plugins for forms and typography if needed</li>
          <li><strong>No raw CSS files</strong> - all styling through Tailwind utilities</li>
        </ul>

        <h4 class="text-sm font-semibold text-gray-200 pt-3">Output Format</h4>

        <p>Generate all files with complete, production-ready code. Each file should include:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Proper imports and TypeScript types</li>
          <li>Vue 3 Composition API with <code class="text-indigo-400">&lt;script setup&gt;</code></li>
          <li>Tailwind CSS classes for all styling</li>
          <li>Error handling and loading states</li>
          <li>Responsive design considerations</li>
          <li>Comments for complex logic</li>
        </ul>

        <p>The generated code should be immediately runnable after installing dependencies and configuring the API endpoint.</p>

        <h3 class="text-base font-semibold text-gray-200 pt-4 border-t border-gray-700 mt-6">Project-Specific Data</h3>

        <h4 class="text-sm font-semibold text-gray-200 pt-2">&lt;Admin Entities&gt;</h4>
        <div v-if="adminEntities.length > 0" class="space-y-2">
          <div v-for="entity in adminEntities" :key="entity.id" class="bg-[#2d3142] p-3 rounded-lg border border-gray-600">
            <div class="font-semibold text-indigo-400 mb-2">{{ entity.name }}</div>
            <div v-if="entity.description" class="text-xs text-gray-400 italic mb-2">{{ entity.description }}</div>
            <div class="text-xs">
              <strong class="text-gray-300">Fields:</strong>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li v-for="field in entity.fields" :key="field.name">
                  <span class="text-gray-300">{{ field.name }}</span>:
                  <span class="text-indigo-400">{{ field.type }}</span>
                  <span v-if="field.ref" class="text-purple-400"> (ref: {{ field.ref }})</span>
                  <span v-if="field.required" class="text-red-400"> *required</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-else class="bg-[#2d3142] p-4 rounded-lg border border-gray-600 text-gray-400 text-center">
          No admin panel entities found
        </div>

        <h4 class="text-sm font-semibold text-gray-200 pt-3">&lt;Admin APIs&gt;</h4>
        <div v-if="adminApis.length > 0" class="space-y-2">
          <div v-for="(api, index) in adminApis" :key="api.id" class="bg-[#2d3142] p-3 rounded-lg border border-gray-600">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full"
                :class="{
                  'bg-green-900/30 text-green-300': api.method === 'GET',
                  'bg-blue-900/30 text-blue-300': api.method === 'POST',
                  'bg-yellow-900/30 text-yellow-300': api.method === 'PUT',
                  'bg-red-900/30 text-red-300': api.method === 'DELETE',
                  'bg-purple-900/30 text-purple-300': api.method === 'PATCH',
                }">
                {{ api.method }}
              </span>
              <span class="font-mono text-sm text-indigo-400">{{ api.endpoint }}</span>
              <span v-if="api.isAuth" class="px-2 py-0.5 text-xs bg-amber-900/30 text-amber-300 rounded-full">Auth Required</span>
            </div>
            <div v-if="api.description" class="text-xs text-gray-400 italic mb-2">{{ api.description }}</div>
            <div class="text-xs text-gray-400">
              <div v-if="activeStatusMock(api)!">
                <div><strong>Status:</strong> {{ activeStatusMock(api)!.statusCode }}</div>
                <div v-if="activeStatusMock(api)!.queryParams?.length"><strong>Query Params:</strong> {{ formatParams(activeStatusMock(api)!.queryParams!) }}</div>
                <div v-if="activeStatusMock(api)!.bodyParams?.length"><strong>Body Params:</strong> {{ formatParams(activeStatusMock(api)!.bodyParams!) }}</div>
                <div v-if="activeStatusMock(api)!.headerParams?.length"><strong>Header Params:</strong> {{ formatParams(activeStatusMock(api)!.headerParams!) }}</div>
              </div>
            </div>
            <div v-if="activeStatusMock(api)?.responseValue" class="mt-2 text-xs">
              <strong class="text-green-400">Success Response:</strong>
              <pre class="bg-[#1a1d2e] p-2 rounded mt-1 overflow-x-auto">{{ formatJson(activeStatusMock(api)!.responseValue!) }}</pre>
            </div>
            <div v-if="api.errorResponseValue" class="mt-2 text-xs">
              <strong class="text-red-400">Error Response:</strong>
              <pre class="bg-[#1a1d2e] p-2 rounded mt-1 overflow-x-auto">{{ formatJson(api.errorResponseValue) }}</pre>
            </div>
          </div>
        </div>
        <div v-else class="bg-[#2d3142] p-4 rounded-lg border border-gray-600 text-gray-400 text-center">
          No admin panel APIs found
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ApiMock } from '~/stores/api';
import type { ObjectSchema } from '~/stores/object';

const props = defineProps<{
  show: boolean;
  apis: ApiMock[];
  objects: ObjectSchema[];
  project?: {
    isAuth: boolean;
    authType?: string;
  };
}>();

defineEmits<{
  close: [];
}>();

const activeTab = ref<'backend' | 'admin-panel'>('backend');

const activeApis = computed(() => {
  return props.apis.filter(api => api.enabled);
});

const entities = computed(() => {
  return props.objects.filter(obj => obj.isEntity);
});

const adminEntities = computed(() => {
  return props.objects.filter(obj => obj.isEntity && (obj as any).isAdminPanelPage);
});

const adminApis = computed(() => {
  return props.apis.filter(api => api.enabled && (api as any).isAdminEndpoint);
});

const activeStatusMock = (api: ApiMock) => {
  return api.statusMocks?.find(sm => sm.enabled);
};

const formatParams = (params: any[]) => {
  return params.map(p => `${p.key} (${p.type}${p.required ? ', required' : ''})`).join(', ');
};

const formatJson = (jsonString: string) => {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch {
    return jsonString;
  }
};

const getAuthText = () => {
  if (props.project?.isAuth && props.project?.authType) {
    const authTypeMap: Record<string, string> = {
      'api-key': 'API Key authentication',
      'bearer-token': 'Bearer Token authentication',
      'basic-auth': 'Basic Authentication (username/password)',
      'digest-auth': 'Digest Authentication',
      'oauth1': 'OAuth 1.0 authentication',
      'oauth2': 'OAuth 2.0 authentication',
      'hawk': 'Hawk authentication',
      'aws-signature': 'AWS Signature authentication',
      'akamai-edgegrid': 'Akamai EdgeGrid authentication',
      'jwt-bearer': 'JWT Bearer authentication',
    };
    return authTypeMap[props.project.authType] || 'JWT-based authentication with bcrypt for password hashing';
  }
  return 'JWT-based authentication with bcrypt for password hashing';
};

const generatePromptText = () => {
  if (activeTab.value === 'admin-panel') {
    return generateAdminPanelPromptText();
  }

  // Determine authentication text based on project settings
  let authText = 'JWT-based authentication with bcrypt for password hashing';
  if (props.project?.isAuth && props.project?.authType) {
    const authTypeMap: Record<string, string> = {
      'api-key': 'API Key authentication',
      'bearer-token': 'Bearer Token authentication',
      'basic-auth': 'Basic Authentication (username/password)',
      'digest-auth': 'Digest Authentication',
      'oauth1': 'OAuth 1.0 authentication',
      'oauth2': 'OAuth 2.0 authentication',
      'hawk': 'Hawk authentication',
      'aws-signature': 'AWS Signature authentication',
      'akamai-edgegrid': 'Akamai EdgeGrid authentication',
      'jwt-bearer': 'JWT Bearer authentication',
    };
    authText = authTypeMap[props.project.authType] || authText;
  }

  let prompt = `Create a production-ready Node.js backend application using TypeScript, TypeORM, PostgreSQL, and Zod for validation. The project should follow a clean architecture pattern with proper separation of concerns.

## Technology Stack Requirements
- **Runtime**: Node.js with TypeScript
- **Database**: PostgreSQL with TypeORM as ORM
- **Validation**: Zod for schema validation
- **Authentication**: ${authText}
- **Framework**: Express.js
- **Environment**: dotenv for configuration management
- **Logging**: Winston or similar logging library
- **Security**: Rate limiting, helmet, cors middleware

## Project Structure and Implementation Guidelines

### Directory Structure
Follow the exact directory structure provided below. Each file should serve a specific purpose following single responsibility principle:

\`\`\`
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route handlers (no business logic)
│   ├── entities/         # TypeORM entities
│   ├── middleware/       # Express middleware
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic layer
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── validators/       # Zod validation schemas
│   ├── migrations/       # Database migrations
│   ├── seeders/          # Database seeders
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
\`\`\`

### Implementation Rules

#### 1. **Controllers** (\`src/controllers/\`)
- Controllers should ONLY handle HTTP request/response cycle
- No business logic in controllers
- Call validators first, then delegate to services
- Use dependency injection pattern
- Return standardized API responses using \`apiResponse\` utility
- Follow naming convention: \`[Module]Controller\` class (e.g., \`AuthController\`, \`UserController\`)

Example pattern:
\`\`\`typescript
class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validation
      const validationResult = AuthValidator.registerSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new AppError(
          'Validation failed',
          400,
          validationResult.error.errors
        );
      }
      // 2. Call service
      const result = await authService.register(req.body);
      // 3. Return standardized response
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
\`\`\`

#### 2. **Services** (\`src/services/\`)
- Contains ALL business logic
- Database operations through repository pattern
- Handle transactions
- Throw custom errors for different scenarios
- Follow naming convention: \`[Module]Service\` class (e.g., \`AuthService\`, \`UserService\`)

#### 3. **Validators** (\`src/validators/\`)
- Use Zod for schema definitions
- Export schemas for request body, query params, and params
- Follow naming convention: \`[Module]Validator\` class with static schemas
- Validators should be used as middleware before controller methods

Example:
\`\`\`typescript
class AuthValidator {
  static registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    // ... other fields
  });
}
\`\`\`

#### 4. **Entities** (\`src/entities/\`)
- Use TypeORM decorators
- Extend from \`BaseEntity\` which includes common fields (id, createdAt, updatedAt, deletedAt)
- Implement soft delete functionality
- Add proper indexes for performance

#### 5. **Routes** (\`src/routes/\`)
- Define route paths and HTTP methods
- Apply validation middleware
- Apply authentication middleware where needed
- Connect to appropriate controller methods

Flow: \`Route → Validation Middleware → Auth Middleware (if needed) → Controller → Service → Database\`

#### 6. **Middleware** (\`src/middleware/\`)
- **auth.middleware.ts**: JWT token verification
- **error.middleware.ts**: Global error handler with proper status codes
- **validation.middleware.ts**: Generic Zod validation wrapper
- **rateLimiter.middleware.ts**: Rate limiting per endpoint

#### 7. **Config** (\`src/config/\`)
- **database.ts**: Database connection setup
- **env.ts**: Environment variable validation using Zod
- **ormconfig.ts**: TypeORM configuration

#### 8. **Utils** (\`src/utils/\`)
- **logger.ts**: Centralized logging with levels (error, warn, info, debug)
- **bcrypt.ts**: Password hashing and comparison
- **jwt.ts**: Token generation and verification
- **apiResponse.ts**: Standardized API response format

#### 9. **Database** (\`src/seeders/\`)
- Generate \`all.sql\` file with complete database schema including:
  - CREATE TABLE statements with all constraints
  - Indexes for performance
  - Foreign key relationships
  - Initial seed data INSERT statements
  - Include comments explaining each table's purpose

### Code Generation Requirements

When provided with \`<Endpoints>\` and \`<Entities>\`:

1. **Analyze the Endpoints** to determine:
   - Required routes and HTTP methods
   - Authentication requirements
   - Request/response schemas
   - Module groupings

2. **From Entities**, generate:
   - TypeORM entity classes with proper decorators
   - Database migration files
   - Complete \`all.sql\` with CREATE TABLE and seed data
   - Zod validation schemas matching entity fields

3. **Generate complete implementation** for:
   - All controllers with proper error handling
   - Services with complete business logic
   - Validators using Zod schemas
   - Routes with middleware chain
   - Migration files with up/down methods
   - Comprehensive seeders

### Additional Requirements

1. **Security Best Practices**:
   - Input sanitization
   - SQL injection prevention (use parameterized queries)
   - XSS protection
   - CORS configuration
   - Rate limiting
   - Secure password storage

2. **Error Handling**:
   - Custom error classes
   - Proper HTTP status codes
   - Detailed error messages in development
   - Generic messages in production

3. **Testing Readiness**:
   - Structure should support unit testing
   - Services should be mockable
   - Controllers should be testable in isolation

4. **Documentation**:
   - Generate comprehensive README.md
   - API documentation for each endpoint
   - Environment variable documentation in .env.example

5. **Package.json Scripts**:
   \`\`\`json
   {
     "scripts": {
       "dev": "nodemon",
       "build": "tsc",
       "start": "node dist/server.js",
       "migration:run": "typeorm migration:run",
       "migration:revert": "typeorm migration:revert",
       "seed": "ts-node src/seeders/user.seeder.ts"
     }
   }
   \`\`\`

### Output Format

Generate all files with complete, production-ready code. Each file should include:
- Proper imports
- TypeScript types
- Error handling
- Comments for complex logic
- Following the exact naming conventions specified

The generated code should be immediately runnable after installing dependencies and setting up the database.

## Project-Specific Data

### <Endpoints>
`;

  // Add active APIs
  if (activeApis.value.length > 0) {
    activeApis.value.forEach((api) => {
      const statusMock = activeStatusMock(api);
      prompt += `\n**${api.method} ${api.endpoint}**`;
      if (api.isAuth) {
        prompt += ` (Auth Required)`;
      }
      prompt += '\n';

      if (api.description) {
        prompt += `Description: ${api.description}\n`;
      }

      if (statusMock) {
        prompt += `- Status Code: ${statusMock.statusCode}\n`;

        if (statusMock.queryParams?.length) {
          prompt += `- Query Params: ${formatParams(statusMock.queryParams)}\n`;
        }

        if (statusMock.bodyParams?.length) {
          prompt += `- Body Params: ${formatParams(statusMock.bodyParams)}\n`;
        }

        if (statusMock.headerParams?.length) {
          prompt += `- Header Params: ${formatParams(statusMock.headerParams)}\n`;
        }

        if (statusMock.responseValue) {
          prompt += `- Success Response:\n\`\`\`json\n${formatJson(statusMock.responseValue)}\n\`\`\`\n`;
        }
      }

      if (api.errorResponseValue) {
        prompt += `- Error Response:\n\`\`\`json\n${formatJson(api.errorResponseValue)}\n\`\`\`\n`;
      }

      prompt += '\n';
    });
  } else {
    prompt += '\nNo active APIs found\n';
  }

  prompt += '\n### <Entities>\n';

  // Add entities
  if (entities.value.length > 0) {
    entities.value.forEach((entity) => {
      prompt += `\n**${entity.name}**\n`;

      if (entity.description) {
        prompt += `Description: ${entity.description}\n`;
      }

      prompt += 'Fields:\n';
      entity.fields.forEach((field) => {
        prompt += `- ${field.name}: ${field.type}`;
        if (field.ref) {
          prompt += ` (ref: ${field.ref})`;
        }
        if (field.required) {
          prompt += ' *required';
        }
        prompt += '\n';
      });

      prompt += '\n';
    });
  } else {
    prompt += '\nNo entities found\n';
  }

  return prompt;
};

const generateAdminPanelPromptText = () => {
  let prompt = `Create a modern, production-ready Admin Panel Frontend application using Nuxt 4 and Tailwind CSS. The application should provide a complete admin interface for managing entities through a well-structured, maintainable codebase.

## Technology Stack Requirements
- **Framework**: Nuxt 4 (latest version)
- **Styling**: Tailwind CSS only (no raw CSS files)
- **State Management**: Pinia for state management
- **API Communication**: Nuxt's built-in $fetch or useFetch composables
- **Form Handling**: Native Vue 3 composition API with proper validation
- **Authentication**: JWT-based authentication with token storage
- **Icons**: @nuxt/icon or similar icon library
- **Notifications**: Toast notifications for user feedback

## Project Structure and Implementation Guidelines

### Directory Structure
Follow the Nuxt 4 directory structure with proper organization:

\`\`\`
admin-panel/
├── app/
│   ├── components/          # Reusable Vue components
│   │   ├── common/          # Common UI components (Button, Input, etc.)
│   │   ├── layout/          # Layout components (Sidebar, Header, etc.)
│   │   └── forms/           # Form components
│   ├── composables/         # Composable functions
│   ├── layouts/             # Layout templates
│   ├── middleware/          # Route middleware (auth, guest)
│   ├── pages/               # File-based routing pages
│   │   ├── index.vue        # Dashboard/Home
│   │   ├── login.vue        # Login page
│   │   └── [entity]/        # Dynamic entity pages
│   ├── stores/              # Pinia stores
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── nuxt.config.ts          # Nuxt configuration
\`\`\`

### Implementation Rules

#### 1. **Authentication Flow**
- Create a login page with email/password fields
- Implement JWT token storage (localStorage or cookie-based)
- Create auth middleware to protect admin routes
- Add automatic token refresh or logout on expiry
- Implement auth store using Pinia for user state management

#### 2. **Layout Structure**
- Create a responsive sidebar navigation with entity links
- Add a top header with user info and logout button
- Implement mobile-responsive navigation (hamburger menu)
- Use Tailwind CSS for all styling (no raw CSS files)
- Dark mode support using Tailwind's dark mode classes

#### 3. **CRUD Pages for Entities**
For each entity, create the following pages:
- **List Page**: Display all records in a table with pagination, search, and filters
- **Create Page**: Form to create new records with validation
- **Edit Page**: Form to update existing records with pre-filled data
- **Delete Action**: Confirm dialog before deletion with API call

Example structure:
\`\`\`
pages/
├── users/
│   ├── index.vue          # List all users
│   ├── create.vue         # Create new user
│   └── [id]/
│       └── edit.vue       # Edit user by ID
\`\`\`

#### 4. **Component Design Patterns**
- Create reusable form components (Input, Select, Textarea, Button)
- Build a DataTable component for listing entities
- Implement a Modal component for confirmations and forms
- Create a Loading component for async operations
- Add Toast/Notification component for success/error messages
- All components should use Tailwind CSS utility classes

#### 5. **API Integration**
- Create composables for API calls (e.g., \`useApi\`)
- Implement proper error handling with user-friendly messages
- Add loading states for all API operations
- Use TypeScript interfaces for API request/response types
- Include JWT token in authorization headers for protected endpoints

#### 6. **State Management with Pinia**
- Create an auth store for user authentication state
- Create entity stores for managing CRUD operations
- Implement actions for API calls and mutations for state updates
- Use getters for computed state values

#### 7. **Form Validation**
- Implement client-side validation for all forms
- Show inline error messages for invalid fields
- Disable submit button during API calls
- Handle server-side validation errors gracefully

#### 8. **Responsive Design**
- Mobile-first approach using Tailwind breakpoints
- Responsive tables (consider card view for mobile)
- Collapsible sidebar for mobile devices
- Touch-friendly buttons and interactive elements

### Code Generation Requirements

When provided with \`<Admin Entities>\` and \`<Admin APIs>\`:

1. **Analyze Admin Entities**:
   - Generate CRUD pages for each entity
   - Create appropriate form fields based on field types
   - Implement proper validation based on field requirements
   - Add relationship handling for referenced entities

2. **Analyze Admin APIs**:
   - Create API service functions for each endpoint
   - Implement proper authentication headers
   - Handle different HTTP methods (GET, POST, PUT, DELETE)
   - Add proper TypeScript types for requests/responses

3. **Generate Complete Implementation**:
   - All pages with proper layouts and navigation
   - Reusable components with Tailwind CSS styling
   - Pinia stores for state management
   - API composables for data fetching
   - Middleware for route protection
   - TypeScript types for all data structures

### Additional Requirements

1. **User Experience**:
   - Loading states for all async operations
   - Success/error toast notifications
   - Confirmation dialogs for destructive actions
   - Keyboard navigation support
   - Accessible form labels and ARIA attributes

2. **Performance**:
   - Lazy loading for routes and components
   - Optimistic UI updates where appropriate
   - Debounced search functionality
   - Pagination for large data sets

3. **Security**:
   - Protect admin routes with auth middleware
   - Sanitize user inputs
   - Handle unauthorized access gracefully
   - Implement CSRF protection if needed

4. **Documentation**:
   - Generate README.md with setup instructions
   - Document environment variables in .env.example
   - Add comments for complex logic
   - Include usage examples for reusable components

5. **Package.json Scripts**:
   \`\`\`json
   {
     "scripts": {
       "dev": "nuxt dev",
       "build": "nuxt build",
       "preview": "nuxt preview",
       "generate": "nuxt generate",
       "postinstall": "nuxt prepare"
     }
   }
   \`\`\`

### Styling Guidelines
- Use Tailwind CSS utility classes exclusively
- Configure custom colors in tailwind.config if needed
- Consistent spacing and sizing using Tailwind scale
- Use Tailwind's built-in responsive breakpoints
- Leverage Tailwind plugins for forms and typography if needed
- **No raw CSS files** - all styling through Tailwind utilities

### Output Format

Generate all files with complete, production-ready code. Each file should include:
- Proper imports and TypeScript types
- Vue 3 Composition API with \`<script setup>\`
- Tailwind CSS classes for all styling
- Error handling and loading states
- Responsive design considerations
- Comments for complex logic

The generated code should be immediately runnable after installing dependencies and configuring the API endpoint.

## Project-Specific Data

### <Admin Entities>
`;

  // Add admin entities
  if (adminEntities.value.length > 0) {
    adminEntities.value.forEach((entity) => {
      prompt += `\n**${entity.name}**\n`;

      if (entity.description) {
        prompt += `Description: ${entity.description}\n`;
      }

      prompt += 'Fields:\n';
      entity.fields.forEach((field) => {
        prompt += `- ${field.name}: ${field.type}`;
        if (field.ref) {
          prompt += ` (ref: ${field.ref})`;
        }
        if (field.required) {
          prompt += ' *required';
        }
        prompt += '\n';
      });

      prompt += '\n';
    });
  } else {
    prompt += '\nNo admin panel entities found\n';
  }

  prompt += '\n### <Admin APIs>\n';

  // Add admin APIs
  if (adminApis.value.length > 0) {
    adminApis.value.forEach((api) => {
      const statusMock = activeStatusMock(api);
      prompt += `\n**${api.method} ${api.endpoint}**`;
      if (api.isAuth) {
        prompt += ` (Auth Required)`;
      }
      prompt += '\n';

      if (api.description) {
        prompt += `Description: ${api.description}\n`;
      }

      if (statusMock) {
        prompt += `- Status Code: ${statusMock.statusCode}\n`;

        if (statusMock.queryParams?.length) {
          prompt += `- Query Params: ${formatParams(statusMock.queryParams)}\n`;
        }

        if (statusMock.bodyParams?.length) {
          prompt += `- Body Params: ${formatParams(statusMock.bodyParams)}\n`;
        }

        if (statusMock.headerParams?.length) {
          prompt += `- Header Params: ${formatParams(statusMock.headerParams)}\n`;
        }

        if (statusMock.responseValue) {
          prompt += `- Success Response:\n\`\`\`json\n${formatJson(statusMock.responseValue)}\n\`\`\`\n`;
        }
      }

      if (api.errorResponseValue) {
        prompt += `- Error Response:\n\`\`\`json\n${formatJson(api.errorResponseValue)}\n\`\`\`\n`;
      }

      prompt += '\n';
    });
  } else {
    prompt += '\nNo admin panel APIs found\n';
  }

  return prompt;
};

const copyPromptToClipboard = async () => {
  try {
    const promptText = generatePromptText();
    await navigator.clipboard.writeText(promptText);
  } catch (error) {
    console.error('Failed to copy prompt to clipboard:', error);
  }
};
</script>
