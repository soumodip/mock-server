<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-200">Node.js + TypeORM Backend</h2>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400">Database:</span>
          <Dropdown
            v-model="selectedDatabase"
            :options="databaseOptions"
            placeholder="Select Database"
            @change="handleDatabaseChange"
          />
        </div>
        <button
          @click="downloadPrompt"
          class="px-4 py-2 bg-[#353849] hover:bg-gray-700 text-white text-sm rounded-full transition-colors flex items-center gap-1.5"
        >
          <Icon name="material-symbols:download" class="w-4 h-4" />
          Download Project Prompt
        </button>
      </div>
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
import { useProjectStore } from '~/stores/project';
import { useApiStore } from '~/stores/api';
import { useObjectStore } from '~/stores/object';
import type { ApiMock, StatusMock } from '~/stores/api';
import JSZip from 'jszip';
import Dropdown from '~/components/common/Dropdown.vue';

const projectStore = useProjectStore();
const apiStore = useApiStore();
const objectStore = useObjectStore();

// Inject scrollToSteps from parent
const scrollToSteps = inject<(() => Promise<void>) | undefined>('scrollToSteps');

const demoProjectCode = ref<string>('');
const selectedDatabase = ref<string>('postgres');

const databaseOptions = [
  { label: 'Postgres', value: 'postgres' },
  { label: 'SQLite', value: 'sqlite' }
];

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
    console.log('Filtered APIs:', filteredApis.value);
    console.log('All Objects:', objectStore.objects);
    console.log('Entities:', entities.value);

    // Fetch demo project code based on selected database
    await loadDemoProjectCode();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

const loadDemoProjectCode = async () => {
  try {
    const fileName = selectedDatabase.value === 'sqlite'
      ? '/code/backend-nodejs-sqlite.md'
      : '/code/backend-nodejs.md';
    const response = await fetch(fileName);
    if (response.ok) {
      demoProjectCode.value = await response.text();
    }
  } catch (error) {
    console.error('Error fetching demo project code:', error);
  }
};

const handleDatabaseChange = async () => {
  await loadDemoProjectCode();
};

const selectedProject = computed(() =>
  projectStore.projects.find(p => p.id === projectStore.selectedProjectId)
);

const filteredApis = computed(() => {
  if (!projectStore.selectedProjectId) return [];
  return apiStore.apis.filter(api => api.projectId === projectStore.selectedProjectId);
});

const filteredObjects = computed(() => {
  if (!projectStore.selectedProjectId) return [];
  return objectStore.objects.filter(obj => obj.projectId === projectStore.selectedProjectId);
});

const entities = computed(() => {
  return filteredObjects.value.filter(obj => obj.isEntity);
});

// Group APIs by their base path or module
const groupedApis = computed(() => {
  const groups: Record<string, ApiMock[]> = {};

  filteredApis.value.forEach(api => {
    // Extract group name from endpoint (e.g., /api/users/... -> Users)
    const parts = api.endpoint.split('/').filter(p => p && !p.startsWith(':'));
    const groupName = parts.length > 1 ? capitalizeFirst(parts[1]!) : 'General';

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(api);
  });

  return Object.entries(groups).map(([name, apis]) => ({
    name,
    apis: apis.sort((a, b) => a.endpoint.localeCompare(b.endpoint))
  }));
});

const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const toCamelCase = (str: string) => {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

const formatJson = (jsonString: string) => {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch {
    return jsonString;
  }
};

// Map field types to TypeScript types
const mapFieldTypeToTS = (type: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'date': 'Date',
    'datetime': 'Date',
    'object': 'Record<string, any>',
    'object-json': 'Record<string, any>',
    'array': 'any[]',
    'array-string': 'string[]',
    'array-number': 'number[]',
    'uuid': 'string',
    'text': 'string',
    'integer': 'number',
    'float': 'number',
    'decimal': 'number',
  };
  return typeMap[type.toLowerCase()] || 'any';
};

// Generate TypeScript interface from entity
const generateEntityInterface = (entity: any): string => {
  let interfaceStr = `export interface ${entity.name} {\n`;
  interfaceStr += `  id: string;\n`;

  if (entity.fields && entity.fields.length > 0) {
    entity.fields.forEach((field: any) => {
      const tsType = mapFieldTypeToTS(field.type);
      const optional = field.required ? '' : '?';
      interfaceStr += `  ${field.name}${optional}: ${tsType};\n`;
    });
  }

  interfaceStr += `  createdAt: Date;\n`;
  interfaceStr += `  updatedAt: Date;\n`;
  interfaceStr += `  deletedAt?: Date | null;\n`;
  interfaceStr += `}`;
  return interfaceStr;
};

const getAuthText = () => {
  if (selectedProject.value?.isAuth && selectedProject.value?.authType) {
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
    return authTypeMap[selectedProject.value.authType] || 'JWT-based authentication with bcrypt for password hashing';
  }
  return 'JWT-based authentication with bcrypt for password hashing';
};

// Get validation rules from status mock parameters
const hasValidationRules = (statusMock: StatusMock) => {
  const allParams = [
    ...(statusMock.queryParams || []),
    ...(statusMock.bodyParams || []),
    ...(statusMock.headerParams || [])
  ];
  return allParams.some(p => p.required) || (statusMock.validators && statusMock.validators.length > 0);
};

const getValidationRules = (statusMock: StatusMock) => {
  const rules: string[] = [];
  const allParams = [
    ...(statusMock.queryParams || []),
    ...(statusMock.bodyParams || []),
    ...(statusMock.headerParams || [])
  ];

  allParams.forEach(param => {
    if (param.required) {
      rules.push(`${param.key} is required`);
    }
    if (param.type === 'string' && param.key.toLowerCase().includes('email')) {
      rules.push(`${param.key} must be a valid email`);
    }
    if (param.type === 'string' && param.key.toLowerCase().includes('password')) {
      rules.push(`${param.key} must be at least 8 characters`);
    }
  });

  // Add custom validators
  if (statusMock.validators && statusMock.validators.length > 0) {
    statusMock.validators.forEach(validator => {
      rules.push(`${validator.field}: ${validator.rule} - ${validator.message}`);
    });
  }

  return rules;
};

// Find entities mentioned in response
const getRelatedEntities = (responseValue: string) => {
  const entityNames = entities.value.map(e => e.name);
  const relatedEntities: string[] = [];

  try {
    const response = JSON.parse(responseValue);
    const responseStr = JSON.stringify(response).toLowerCase();

    entityNames.forEach(entityName => {
      // Check if entity name appears in response keys or structure
      if (responseStr.includes(entityName.toLowerCase())) {
        relatedEntities.push(entityName);
      }
    });
  } catch {
    // If JSON parsing fails, do simple string matching
    entityNames.forEach(entityName => {
      if (responseValue.toLowerCase().includes(entityName.toLowerCase())) {
        relatedEntities.push(entityName);
      }
    });
  }

  return [...new Set(relatedEntities)];
};

// Generate full prompt text for copying
const generatePromptText = () => {
  let promptText = '';
  const dbName = selectedDatabase.value === 'sqlite' ? 'SQLite' : 'PostgreSQL';

  // ==================== CONTEXT ====================
  promptText += '# Node.js + TypeORM Backend Implementation\n\n';

  promptText += '## Context\n';
  promptText += `You are an experienced backend developer implementing a production-ready Node.js + TypeORM backend API with ${dbName}. `;
  promptText += 'You have access to the reference implementation in `code.md` (included in this prompt package) which serves as the source of truth for architecture patterns, code conventions, and proven implementations.\n\n';

  // ==================== PURPOSE ====================
  promptText += '## Purpose\n';
  promptText += 'Implement a production-ready RESTful API with the entities and endpoints specified below, following the exact patterns established in the reference implementation (`code.md`).\n\n';

  // ==================== TECHNOLOGY STACK ====================
  promptText += '## Technology Stack\n\n';
  promptText += '- **Runtime**: Node.js with TypeScript (strict mode)\n';
  promptText += `- **Database**: ${dbName} with TypeORM as ORM\n`;
  promptText += '- **Validation**: Joi for schema validation\n';
  promptText += `- **Authentication**: ${getAuthText()}\n`;
  promptText += '- **Framework**: Express.js\n';
  promptText += '- **Environment**: dotenv for configuration management\n';
  promptText += '- **Security**: Helmet, CORS, express-rate-limit\n';
  promptText += '- **Logging**: Sentry for error tracking (optional)\n';
  promptText += '- **Password Hashing**: bcryptjs\n\n';

  // ==================== INITIAL SETUP ====================
  promptText += '## Initial Setup\n\n';
  promptText += '**IMPORTANT: Before starting development:**\n\n';
  promptText += 'There is a working project code file called `code.md` (included in this prompt package) that contains a fully functional Node.js + TypeORM backend implementation. Use this as your starting point to ensure the project works without errors.\n\n';

  // ==================== REFERENCE-ONLY ELEMENTS ====================
  promptText += '### Reference-Only Elements (DO NOT Copy Directly)\n\n';
  promptText += 'The `code.md` file contains certain implementations for demonstration purposes only:\n\n';
  promptText += '- **User/Auth entities and services** - These demonstrate patterns; implement your own entities based on the specifications below\n';
  promptText += '- **Sample routes in routes.ts** - Replace with your project-specific routes\n';
  promptText += '- **Seeder SQL files** - Adapt table structures for your entities\n';
  promptText += '- **RefreshToken entity** - Include only if refresh token functionality is needed\n\n';
  promptText += 'Use these as templates to understand the patterns, then implement the actual entities/endpoints specified in this prompt.\n\n';

  // ==================== TASK (STEP-BY-STEP) ====================
  promptText += '## Task (Execute in Order)\n\n';

  promptText += '### Step 1: Environment Setup\n';
  promptText += '- Review and set up `.env.local` configuration (see Environment Configuration section below)\n';
  promptText += `- Configure database connection for ${dbName}\n`;
  promptText += '- Verify all required environment variables are set\n\n';

  promptText += '### Step 2: Study Reference Implementation\n';
  promptText += '- Examine folder structure in `code.md`\n';
  promptText += '- Understand the controller → service → repository pattern\n';
  promptText += '- Review middleware chain: Route → Validation → Auth → Controller → Service\n';
  promptText += '- Note the standardized response format used throughout\n\n';

  promptText += '### Step 3: Implement Entities\n';
  promptText += '- Create TypeORM entities following patterns from `code.md`\n';
  promptText += '- Add proper decorators (@Entity, @Column, @Index, etc.)\n';
  promptText += '- Implement relationships where applicable\n';
  promptText += '- Include soft delete (deletedAt column) for all entities\n\n';

  promptText += '### Step 4: Implement Validators\n';
  promptText += '- Create Joi validation schemas for each endpoint\n';
  promptText += '- Follow naming convention: `[entity].validator.ts`\n';
  promptText += '- Include schemas for create, update, and query operations\n\n';

  promptText += '### Step 5: Implement Services\n';
  promptText += '- Create service classes with all business logic\n';
  promptText += '- Use repository pattern for database operations\n';
  promptText += '- Implement proper error handling with `{ statusCode, message }` pattern\n';
  promptText += '- Add pagination support for list operations\n\n';

  promptText += '### Step 6: Implement Controllers\n';
  promptText += '- Create controller classes that delegate to services\n';
  promptText += '- Use standardized response format: `{ success, message, data }`\n';
  promptText += '- NO business logic in controllers - only request/response handling\n\n';

  promptText += '### Step 7: Register Routes\n';
  promptText += '- Add routes to `routes.ts`\n';
  promptText += '- Apply validation middleware using `validate()` and `validateQuery()`\n';
  promptText += '- Apply auth middleware where required (`authenticateToken`, `requireAdminRole`)\n';
  promptText += '- Follow RESTful conventions\n\n';

  promptText += '### Step 8: Test & Verify\n';
  promptText += '- Run `npm run dev` to start the server\n';
  promptText += '- Verify database synchronization works\n';
  promptText += '- Test each endpoint manually\n';
  promptText += '- Ensure error responses are consistent\n\n';

  // ==================== ENVIRONMENT CONFIGURATION ====================
  promptText += '## Environment Configuration\n\n';

  if (selectedDatabase.value === 'sqlite') {
    promptText += '### SQLite Configuration\n';
    promptText += 'Create `.env.local` with the following:\n\n';
    promptText += '```env\n';
    promptText += '# Server Configuration\n';
    promptText += 'NODE_ENV=development\n';
    promptText += 'PORT=3002\n';
    promptText += 'API_VERSION=1\n\n';
    promptText += '# Database Configuration (SQLite)\n';
    promptText += 'DB_NAME=your_database.sqlite\n\n';
    promptText += '# JWT Configuration\n';
    promptText += 'JWT_SECRET=your-256-bit-secret-key-here\n';
    promptText += 'JWT_EXPIRES_IN=24h\n\n';
    promptText += '# CORS Configuration\n';
    promptText += 'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001\n\n';
    promptText += '# Rate Limiting\n';
    promptText += 'RATE_LIMIT_WINDOW_MS=900000\n';
    promptText += 'RATE_LIMIT_MAX=100\n';
    promptText += '```\n\n';
  } else {
    promptText += '### PostgreSQL Configuration\n';
    promptText += 'Create `.env.local` with the following:\n\n';
    promptText += '```env\n';
    promptText += '# Server Configuration\n';
    promptText += 'NODE_ENV=development\n';
    promptText += 'PORT=3002\n';
    promptText += 'API_VERSION=1\n\n';
    promptText += '# Database Configuration (PostgreSQL)\n';
    promptText += 'DB_HOST=localhost\n';
    promptText += 'DB_PORT=5432\n';
    promptText += 'DB_USERNAME=postgres\n';
    promptText += 'DB_PASSWORD=your_password\n';
    promptText += 'DB_NAME=your_database\n\n';
    promptText += '# JWT Configuration\n';
    promptText += 'JWT_SECRET=your-256-bit-secret-key-here\n';
    promptText += 'JWT_EXPIRES_IN=24h\n\n';
    promptText += '# CORS Configuration\n';
    promptText += 'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001\n\n';
    promptText += '# Rate Limiting\n';
    promptText += 'RATE_LIMIT_WINDOW_MS=900000\n';
    promptText += 'RATE_LIMIT_MAX=100\n';
    promptText += '```\n\n';
  }

  // ==================== CODE QUALITY STANDARDS ====================
  promptText += '## Code Quality Standards\n\n';

  promptText += '### TypeScript Strict Mode\n';
  promptText += '- Enable `strict: true` in tsconfig.json\n';
  promptText += '- No implicit `any` types\n';
  promptText += '- All function parameters and returns must be typed\n';
  promptText += '- Use interfaces for all request/response shapes\n\n';

  promptText += '### Error Handling Pattern\n';
  promptText += 'Follow the established error pattern from `code.md`:\n\n';
  promptText += '```typescript\n';
  promptText += '// In services - throw structured errors\n';
  promptText += 'throw { statusCode: 404, message: \'Resource not found\' };\n';
  promptText += 'throw { statusCode: 409, message: \'Resource already exists\' };\n';
  promptText += 'throw { statusCode: 401, message: \'Invalid credentials\' };\n\n';
  promptText += '// In controllers - catch and respond consistently\n';
  promptText += 'try {\n';
  promptText += '  const result = await this.service.method(data);\n';
  promptText += '  res.status(200).json({\n';
  promptText += '    success: true,\n';
  promptText += '    message: \'Operation successful\',\n';
  promptText += '    data: result\n';
  promptText += '  });\n';
  promptText += '} catch (error: any) {\n';
  promptText += '  if (error.statusCode) {\n';
  promptText += '    return res.status(error.statusCode).json({\n';
  promptText += '      success: false,\n';
  promptText += '      message: error.message\n';
  promptText += '    });\n';
  promptText += '  }\n';
  promptText += '  logError(error, { context: \'Operation failed\' });\n';
  promptText += '  res.status(500).json({\n';
  promptText += '    success: false,\n';
  promptText += '    message: \'Internal server error\'\n';
  promptText += '  });\n';
  promptText += '}\n';
  promptText += '```\n\n';

  promptText += '### Naming Conventions\n';
  promptText += '- **Entities**: PascalCase, singular (`User.entity.ts`, `Product.entity.ts`)\n';
  promptText += '- **Services**: PascalCase with Service suffix (`UserService`, `ProductService`)\n';
  promptText += '- **Controllers**: PascalCase with Controller suffix (`UserController`)\n';
  promptText += '- **Validators**: camelCase schemas (`createUserSchema`, `updateProductSchema`)\n';
  promptText += '- **Routes**: kebab-case endpoints (`/api/users`, `/api/product-categories`)\n';
  promptText += '- **Database tables**: snake_case plural (`users`, `product_categories`)\n\n';

  promptText += '### Response Format (Mandatory)\n';
  promptText += 'All API responses MUST follow this structure:\n\n';
  promptText += '```typescript\n';
  promptText += '// Success response\n';
  promptText += '{\n';
  promptText += '  success: true,\n';
  promptText += '  message: \'Operation successful\',\n';
  promptText += '  data: { ... }\n';
  promptText += '}\n\n';
  promptText += '// Error response\n';
  promptText += '{\n';
  promptText += '  success: false,\n';
  promptText += '  message: \'Error description\',\n';
  promptText += '  errors?: string[] // Optional validation errors array\n';
  promptText += '}\n\n';
  promptText += '// Paginated list response\n';
  promptText += '{\n';
  promptText += '  success: true,\n';
  promptText += '  data: {\n';
  promptText += '    items: [...],\n';
  promptText += '    pagination: {\n';
  promptText += '      page: number,\n';
  promptText += '      limit: number,\n';
  promptText += '      total: number,\n';
  promptText += '      totalPages: number\n';
  promptText += '    }\n';
  promptText += '  }\n';
  promptText += '}\n';
  promptText += '```\n\n';

  // ==================== CODE PATTERN EXAMPLES ====================
  promptText += '## Code Patterns (From Reference Implementation)\n\n';

  promptText += '### Entity Pattern\n';
  promptText += '```typescript\n';
  promptText += 'import {\n';
  promptText += '  Entity,\n';
  promptText += '  PrimaryGeneratedColumn,\n';
  promptText += '  Column,\n';
  promptText += '  CreateDateColumn,\n';
  promptText += '  UpdateDateColumn,\n';
  promptText += '  DeleteDateColumn,\n';
  promptText += '  Index,\n';
  promptText += '} from \'typeorm\';\n\n';
  promptText += '@Entity(\'products\')\n';
  promptText += 'export class Product {\n';
  promptText += '  @PrimaryGeneratedColumn(\'uuid\')\n';
  promptText += '  id: string;\n\n';
  promptText += '  @Column({ type: \'varchar\', length: 255 })\n';
  promptText += '  @Index()\n';
  promptText += '  name: string;\n\n';
  promptText += '  @Column({ type: \'decimal\', precision: 10, scale: 2 })\n';
  promptText += '  price: number;\n\n';
  promptText += '  @Column({ type: \'text\', nullable: true })\n';
  promptText += '  description: string | null;\n\n';
  if (selectedDatabase.value === 'sqlite') {
    promptText += '  @CreateDateColumn({ type: \'datetime\' })\n';
    promptText += '  createdAt: Date;\n\n';
    promptText += '  @UpdateDateColumn({ type: \'datetime\' })\n';
    promptText += '  updatedAt: Date;\n\n';
    promptText += '  @DeleteDateColumn({ type: \'datetime\', nullable: true })\n';
  } else {
    promptText += '  @CreateDateColumn({ type: \'timestamp\' })\n';
    promptText += '  createdAt: Date;\n\n';
    promptText += '  @UpdateDateColumn({ type: \'timestamp\' })\n';
    promptText += '  updatedAt: Date;\n\n';
    promptText += '  @DeleteDateColumn({ type: \'timestamp\', nullable: true })\n';
  }
  promptText += '  deletedAt: Date | null;\n';
  promptText += '}\n';
  promptText += '```\n\n';

  promptText += '### Service Pattern\n';
  promptText += '```typescript\n';
  promptText += 'import { AppDataSource } from \'../configs/database.config\';\n';
  promptText += 'import { Product } from \'../entities/Product.entity\';\n';
  promptText += 'import { logInfo } from \'../utils/logger.util\';\n\n';
  promptText += 'export class ProductService {\n';
  promptText += '  private productRepository = AppDataSource.getRepository(Product);\n\n';
  promptText += '  async create(data: { name: string; price: number; description?: string }) {\n';
  promptText += '    // Check for duplicates\n';
  promptText += '    const existing = await this.productRepository.findOne({\n';
  promptText += '      where: { name: data.name }\n';
  promptText += '    });\n';
  promptText += '    if (existing) {\n';
  promptText += '      throw { statusCode: 409, message: \'Product already exists\' };\n';
  promptText += '    }\n\n';
  promptText += '    const product = this.productRepository.create(data);\n';
  promptText += '    const saved = await this.productRepository.save(product);\n';
  promptText += '    logInfo(\'Product created\', { productId: saved.id });\n';
  promptText += '    return { product: saved };\n';
  promptText += '  }\n\n';
  promptText += '  async findAll(query: { page?: number; limit?: number; search?: string }) {\n';
  promptText += '    const { page = 1, limit = 10, search } = query;\n';
  promptText += '    const skip = (page - 1) * limit;\n\n';
  promptText += '    const queryBuilder = this.productRepository\n';
  promptText += '      .createQueryBuilder(\'product\')\n';
  promptText += '      .orderBy(\'product.createdAt\', \'DESC\')\n';
  promptText += '      .skip(skip)\n';
  promptText += '      .take(limit);\n\n';
  promptText += '    if (search) {\n';
  promptText += '      queryBuilder.andWhere(\'product.name ILIKE :search\', { search: `%${search}%` });\n';
  promptText += '    }\n\n';
  promptText += '    const [items, total] = await queryBuilder.getManyAndCount();\n\n';
  promptText += '    return {\n';
  promptText += '      items,\n';
  promptText += '      pagination: {\n';
  promptText += '        page,\n';
  promptText += '        limit,\n';
  promptText += '        total,\n';
  promptText += '        totalPages: Math.ceil(total / limit)\n';
  promptText += '      }\n';
  promptText += '    };\n';
  promptText += '  }\n\n';
  promptText += '  async findById(id: string) {\n';
  promptText += '    const product = await this.productRepository.findOne({ where: { id } });\n';
  promptText += '    if (!product) {\n';
  promptText += '      throw { statusCode: 404, message: \'Product not found\' };\n';
  promptText += '    }\n';
  promptText += '    return { product };\n';
  promptText += '  }\n\n';
  promptText += '  async update(id: string, data: { name?: string; price?: number; description?: string }) {\n';
  promptText += '    const product = await this.productRepository.findOne({ where: { id } });\n';
  promptText += '    if (!product) {\n';
  promptText += '      throw { statusCode: 404, message: \'Product not found\' };\n';
  promptText += '    }\n\n';
  promptText += '    Object.assign(product, data);\n';
  promptText += '    const updated = await this.productRepository.save(product);\n';
  promptText += '    logInfo(\'Product updated\', { productId: updated.id });\n';
  promptText += '    return { product: updated };\n';
  promptText += '  }\n\n';
  promptText += '  async delete(id: string) {\n';
  promptText += '    const product = await this.productRepository.findOne({ where: { id } });\n';
  promptText += '    if (!product) {\n';
  promptText += '      throw { statusCode: 404, message: \'Product not found\' };\n';
  promptText += '    }\n\n';
  promptText += '    await this.productRepository.softDelete(id);\n';
  promptText += '    logInfo(\'Product deleted\', { productId: id });\n';
  promptText += '    return { message: \'Product deleted successfully\' };\n';
  promptText += '  }\n';
  promptText += '}\n';
  promptText += '```\n\n';

  promptText += '### Controller Pattern\n';
  promptText += '```typescript\n';
  promptText += 'import { Request, Response } from \'express\';\n';
  promptText += 'import { ProductService } from \'../services/product.service\';\n';
  promptText += 'import { logError } from \'../utils/logger.util\';\n\n';
  promptText += 'export class ProductController {\n';
  promptText += '  private productService = new ProductService();\n\n';
  promptText += '  create = async (req: Request, res: Response) => {\n';
  promptText += '    try {\n';
  promptText += '      const result = await this.productService.create(req.body);\n';
  promptText += '      res.status(201).json({\n';
  promptText += '        success: true,\n';
  promptText += '        message: \'Product created successfully\',\n';
  promptText += '        data: result\n';
  promptText += '      });\n';
  promptText += '    } catch (error: any) {\n';
  promptText += '      if (error.statusCode) {\n';
  promptText += '        return res.status(error.statusCode).json({\n';
  promptText += '          success: false,\n';
  promptText += '          message: error.message\n';
  promptText += '        });\n';
  promptText += '      }\n';
  promptText += '      logError(error, { context: \'Create product failed\' });\n';
  promptText += '      res.status(500).json({\n';
  promptText += '        success: false,\n';
  promptText += '        message: \'Failed to create product\'\n';
  promptText += '      });\n';
  promptText += '    }\n';
  promptText += '  };\n\n';
  promptText += '  // ... other methods follow same pattern\n';
  promptText += '}\n';
  promptText += '```\n\n';

  promptText += '### Validator Pattern\n';
  promptText += '```typescript\n';
  promptText += 'import Joi from \'joi\';\n\n';
  promptText += 'export const createProductSchema = Joi.object({\n';
  promptText += '  name: Joi.string().min(2).max(255).required(),\n';
  promptText += '  price: Joi.number().positive().required(),\n';
  promptText += '  description: Joi.string().max(1000).optional()\n';
  promptText += '});\n\n';
  promptText += 'export const updateProductSchema = Joi.object({\n';
  promptText += '  name: Joi.string().min(2).max(255).optional(),\n';
  promptText += '  price: Joi.number().positive().optional(),\n';
  promptText += '  description: Joi.string().max(1000).optional()\n';
  promptText += '});\n\n';
  promptText += 'export const getProductsSchema = Joi.object({\n';
  promptText += '  page: Joi.number().integer().min(1).optional(),\n';
  promptText += '  limit: Joi.number().integer().min(1).max(100).optional(),\n';
  promptText += '  search: Joi.string().optional()\n';
  promptText += '});\n';
  promptText += '```\n\n';

  promptText += '### Route Registration Pattern\n';
  promptText += '```typescript\n';
  promptText += '// In routes.ts\n';
  promptText += 'import { Router } from \'express\';\n';
  promptText += 'import { ProductController } from \'./controllers/product.controller\';\n';
  promptText += 'import { validate, validateQuery } from \'./middlewares/validation.middleware\';\n';
  promptText += 'import { authenticateToken, requireAdminRole } from \'./middlewares/auth.middleware\';\n';
  promptText += 'import { createProductSchema, updateProductSchema, getProductsSchema } from \'./validators/product.validator\';\n\n';
  promptText += 'const router = Router();\n';
  promptText += 'const productController = new ProductController();\n\n';
  promptText += '// Public routes\n';
  promptText += 'router.get(\'/api/products\', validateQuery(getProductsSchema), productController.findAll);\n';
  promptText += 'router.get(\'/api/products/:id\', productController.findById);\n\n';
  promptText += '// Protected routes (require authentication)\n';
  promptText += 'router.post(\'/api/products\', authenticateToken, requireAdminRole, validate(createProductSchema), productController.create);\n';
  promptText += 'router.put(\'/api/products/:id\', authenticateToken, requireAdminRole, validate(updateProductSchema), productController.update);\n';
  promptText += 'router.delete(\'/api/products/:id\', authenticateToken, requireAdminRole, productController.delete);\n\n';
  promptText += 'export default router;\n';
  promptText += '```\n\n';

  // ==================== PROJECT STRUCTURE ====================
  promptText += '## Project Structure\n\n';
  promptText += 'Follow the exact directory structure from `code.md`:\n\n';
  promptText += '```\n';
  promptText += 'backend/\n';
  promptText += '  src/\n';
  promptText += '    configs/           # Configuration files (app.config.ts, database.config.ts)\n';
  promptText += '    controllers/       # Route handlers (no business logic)\n';
  promptText += '    entities/          # TypeORM entities\n';
  promptText += '    middlewares/       # Express middleware (auth, validation, common)\n';
  promptText += '    services/          # Business logic layer\n';
  promptText += '    types/             # TypeScript type definitions\n';
  promptText += '    utils/             # Utility functions (jwt, password, logger)\n';
  promptText += '    validators/        # Joi validation schemas\n';
  promptText += '    seeders/           # Database seeders (SQL files)\n';
  promptText += '    routes.ts          # Route definitions\n';
  promptText += '    server.ts          # Server entry point\n';
  promptText += '  .env.local           # Environment variables\n';
  promptText += '  package.json\n';
  promptText += '  tsconfig.json\n';
  promptText += '```\n\n';

  // ==================== ENDPOINTS ====================
  promptText += '---\n\n';
  promptText += '# Project-Specific Implementation\n\n';
  promptText += '## API Endpoints\n\n';

  if (groupedApis.value.length > 0) {
    groupedApis.value.forEach(group => {
      promptText += `### ${group.name} Module\n\n`;

      group.apis.forEach(api => {
        promptText += `#### ${api.method} ${api.endpoint}\n`;
        if (api.description) promptText += `**Description**: ${api.description}\n`;
        if (api.isAuth) promptText += `**Authentication**: Required\n`;
        promptText += '\n';

        if (api.statusMocks && api.statusMocks.length > 0) {
          api.statusMocks.forEach((statusMock) => {
            promptText += `**Response (${statusMock.statusCode})**${statusMock.enabled ? ' [Active]' : ''}\n\n`;

            if (statusMock.headerParams && statusMock.headerParams.length > 0) {
              promptText += '**Headers**:\n';
              statusMock.headerParams.forEach(p => {
                promptText += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
              });
              promptText += '\n';
            }

            if (statusMock.queryParams && statusMock.queryParams.length > 0) {
              promptText += '**Query Parameters**:\n';
              statusMock.queryParams.forEach(p => {
                promptText += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
              });
              promptText += '\n';
            }

            if (statusMock.bodyParams && statusMock.bodyParams.length > 0) {
              promptText += '**Body Parameters**:\n';
              statusMock.bodyParams.forEach(p => {
                promptText += `  - \`${p.key}\`: ${p.type}${p.required ? ' (required)' : ''}\n`;
              });
              promptText += '\n';
            }

            if (statusMock.validators && statusMock.validators.length > 0) {
              promptText += '**Validation Rules**:\n';
              statusMock.validators.forEach(v => {
                promptText += `  - ${v.field}: ${v.rule} - ${v.message}\n`;
              });
              promptText += '\n';
            }

            if (statusMock.responseValue) {
              promptText += '**Response Example**:\n```json\n';
              promptText += formatJson(statusMock.responseValue);
              promptText += '\n```\n\n';

              const relatedEntities = getRelatedEntities(statusMock.responseValue);
              if (relatedEntities.length > 0) {
                promptText += `**Related Entities**: ${relatedEntities.join(', ')}\n\n`;
              }
            }
          });
        }

        promptText += '---\n\n';
      });
    });
  } else {
    promptText += 'No endpoints defined yet.\n\n';
  }

  // ==================== ENTITIES ====================
  promptText += '## Entities to Implement\n\n';

  if (entities.value.length > 0) {
    entities.value.forEach((entity: any) => {
      promptText += `### ${entity.name}\n`;
      if (entity.description) promptText += `**Description**: ${entity.description}\n\n`;

      // Generate TypeScript interface
      promptText += '**TypeScript Interface**:\n```typescript\n';
      promptText += generateEntityInterface(entity);
      promptText += '\n```\n\n';

      // List fields
      if (entity.fields && entity.fields.length > 0) {
        promptText += '**Fields**:\n';
        entity.fields.forEach((field: any) => {
          promptText += `  - \`${field.name}\`: ${field.type}${field.required ? ' (required)' : ''}${field.ref ? ` (ref: ${field.ref})` : ''}\n`;
        });
        promptText += '\n';
      }

      // Generate required service methods based on allowed operations
      if (entity.allowedOperations && entity.allowedOperations.length > 0) {
        promptText += '**Required Service Methods**:\n';
        const operations = entity.allowedOperations;
        const entityNameLower = toCamelCase(entity.name);

        if (operations.includes('GET')) {
          promptText += `  - \`findAll(query: PaginationQuery)\` - List all ${entityNameLower}s with pagination\n`;
          promptText += `  - \`findById(id: string)\` - Get single ${entityNameLower} by ID\n`;
        }
        if (operations.includes('POST')) {
          promptText += `  - \`create(data: Create${entity.name}Dto)\` - Create new ${entityNameLower}\n`;
        }
        if (operations.includes('PUT') || operations.includes('PATCH')) {
          promptText += `  - \`update(id: string, data: Update${entity.name}Dto)\` - Update existing ${entityNameLower}\n`;
        }
        if (operations.includes('DELETE')) {
          promptText += `  - \`delete(id: string)\` - Soft delete ${entityNameLower}\n`;
        }
        promptText += '\n';
      }

      promptText += '---\n\n';
    });
  } else {
    promptText += 'No entities defined yet.\n\n';
  }

  // ==================== DELIVERABLES ====================
  promptText += '## Deliverables\n\n';
  promptText += 'For each entity specified above, generate:\n\n';

  promptText += '### 1. Entity File (`src/entities/[Entity].entity.ts`)\n';
  promptText += '- TypeORM entity with proper decorators\n';
  promptText += '- Indexes on frequently queried fields\n';
  promptText += '- Relationships if applicable (@ManyToOne, @OneToMany, etc.)\n';
  promptText += '- Soft delete support (deletedAt column)\n\n';

  promptText += '### 2. Service File (`src/services/[entity].service.ts`)\n';
  promptText += '- All CRUD operations based on allowed operations\n';
  promptText += '- Proper error handling with `{ statusCode, message }` pattern\n';
  promptText += '- Pagination support for list operations\n';
  promptText += '- Logging for important operations\n\n';

  promptText += '### 3. Controller File (`src/controllers/[entity].controller.ts`)\n';
  promptText += '- Route handlers delegating to service\n';
  promptText += '- Standardized `{ success, message, data }` response format\n';
  promptText += '- Error catching and logging\n';
  promptText += '- NO business logic\n\n';

  promptText += '### 4. Validator File (`src/validators/[entity].validator.ts`)\n';
  promptText += '- Joi schemas for create, update, and query operations\n';
  promptText += '- Proper validation messages\n';
  promptText += '- Type-appropriate validations (email, min/max, etc.)\n\n';

  promptText += '### 5. Route Registration (update `src/routes.ts`)\n';
  promptText += '- RESTful endpoints following conventions\n';
  promptText += '- Proper middleware chain (validation → auth → controller)\n';
  promptText += '- Authentication where required\n\n';

  promptText += '### 6. TypeScript Types (`src/types/[entity].types.ts`) - Optional\n';
  promptText += '- DTOs for create/update operations\n';
  promptText += '- Query parameter interfaces\n';
  promptText += '- Response interfaces\n\n';

  // ==================== ACCEPTANCE CRITERIA ====================
  promptText += '## Acceptance Criteria\n\n';
  promptText += '- [ ] All entities have TypeORM decorators and compile without errors\n';
  promptText += '- [ ] Services follow repository pattern with proper error handling\n';
  promptText += '- [ ] Controllers return standardized `{ success, message, data }` format\n';
  promptText += '- [ ] All endpoints have Joi validation schemas\n';
  promptText += '- [ ] Authentication middleware applied to protected routes\n';
  promptText += '- [ ] Pagination implemented for list endpoints\n';
  promptText += '- [ ] Soft delete implemented (deletedAt column)\n';
  promptText += '- [ ] TypeScript strict mode passes without errors\n';
  promptText += '- [ ] Database synchronization works on startup\n';
  promptText += '- [ ] API responses match documented formats\n';
  promptText += '- [ ] Error responses include appropriate HTTP status codes\n';
  promptText += '- [ ] No business logic in controllers\n';
  promptText += '- [ ] All file naming conventions followed\n\n';

  // ==================== CLOSING INSTRUCTION ====================
  promptText += '---\n\n';
  promptText += '## Implementation Instructions\n\n';
  promptText += '**IMPORTANT: Before writing any code:**\n\n';
  promptText += '1. Review the complete `code.md` reference implementation thoroughly\n';
  promptText += '2. Understand the established patterns for entities, services, controllers, and validators\n';
  promptText += '3. Map each entity to its required endpoints and operations\n';
  promptText += '4. Confirm understanding of the middleware chain (Route → Validation → Auth → Controller → Service)\n';
  promptText += '5. Proceed with implementation entity by entity, completing each fully before moving to the next\n\n';
  promptText += '**Generate all files with complete, production-ready code following the exact patterns from `code.md`. The code should be immediately runnable after `npm install` and database setup.**\n';

  return promptText;
};

const downloadPrompt = async () => {
  // Scroll to steps section in parent and wait for animation
  if (scrollToSteps) {
    await scrollToSteps();
  }

  const zip = new JSZip();

  // Create project folder structure: <project_name>/prompt/workflows
  const dbSuffix = selectedDatabase.value === 'sqlite' ? '-sqlite' : '';
  const projectName = `backend-nodejs${dbSuffix}`;
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
