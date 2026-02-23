<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-200">FastAPI Backend</h2>
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
import type { ApiMock } from '~/stores/api';
import Dropdown from '~/components/common/Dropdown.vue';
import JSZip from 'jszip';

const projectStore = useProjectStore();
const apiStore = useApiStore();
const objectStore = useObjectStore();
const toast = useToast();

// Inject scrollToSteps from parent
const scrollToSteps = inject<(() => Promise<void>) | undefined>('scrollToSteps');

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
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

const handleDatabaseChange = async () => {
  // Trigger reactivity for prompt regeneration
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

const formatJson = (jsonString: string) => {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch {
    return jsonString;
  }
};

// Map field types to Python types
const mapFieldTypeToPython = (type: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'str',
    'number': 'float',
    'boolean': 'bool',
    'date': 'date',
    'datetime': 'datetime',
    'object': 'dict[str, Any]',
    'object-json': 'dict[str, Any]',
    'array': 'list[Any]',
    'array-string': 'list[str]',
    'array-number': 'list[float]',
    'uuid': 'UUID',
    'text': 'str',
    'integer': 'int',
    'float': 'float',
    'decimal': 'Decimal',
  };
  return typeMap[type.toLowerCase()] || 'Any';
};

// Generate Pydantic schema from entity
const generatePydanticSchema = (entity: any): string => {
  let schemaStr = `class ${entity.name}Base(BaseModel):\n`;

  if (entity.fields && entity.fields.length > 0) {
    entity.fields.forEach((field: any) => {
      const pyType = mapFieldTypeToPython(field.type);
      const optional = field.required ? '' : ' | None = None';
      schemaStr += `    ${field.name}: ${pyType}${optional}\n`;
    });
  }

  schemaStr += '\n';
  schemaStr += `class ${entity.name}Create(${entity.name}Base):\n`;
  schemaStr += '    pass\n\n';

  schemaStr += `class ${entity.name}Update(BaseModel):\n`;
  if (entity.fields && entity.fields.length > 0) {
    entity.fields.forEach((field: any) => {
      const pyType = mapFieldTypeToPython(field.type);
      schemaStr += `    ${field.name}: ${pyType} | None = None\n`;
    });
  }
  schemaStr += '\n';

  schemaStr += `class ${entity.name}Response(${entity.name}Base):\n`;
  schemaStr += '    id: UUID\n';
  schemaStr += '    created_at: datetime\n';
  schemaStr += '    updated_at: datetime\n\n';
  schemaStr += '    model_config = ConfigDict(from_attributes=True)';

  return schemaStr;
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
    return authTypeMap[selectedProject.value.authType] || 'JWT-based authentication with passlib for password hashing';
  }
  return 'JWT-based authentication with passlib for password hashing';
};

// Find entities mentioned in response
const getRelatedEntities = (responseValue: string) => {
  const entityNames = entities.value.map(e => e.name);
  const relatedEntities: string[] = [];

  try {
    const response = JSON.parse(responseValue);
    const responseStr = JSON.stringify(response).toLowerCase();

    entityNames.forEach(entityName => {
      if (responseStr.includes(entityName.toLowerCase())) {
        relatedEntities.push(entityName);
      }
    });
  } catch {
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
  const asyncDriver = selectedDatabase.value === 'sqlite' ? 'aiosqlite' : 'asyncpg';

  // ==================== CONTEXT ====================
  promptText += '# FastAPI Backend Implementation\n\n';

  promptText += '## Context\n';
  promptText += `You are an experienced Python backend developer implementing a production-ready FastAPI backend API with ${dbName}. `;
  promptText += 'Follow modern FastAPI best practices (2025), async-first architecture, and clean code principles.\n\n';

  // ==================== PURPOSE ====================
  promptText += '## Purpose\n';
  promptText += 'Implement a production-ready RESTful API with the entities and endpoints specified below, following FastAPI best practices and async-first patterns.\n\n';

  // ==================== TECHNOLOGY STACK ====================
  promptText += '## Technology Stack\n\n';
  promptText += '- **Framework**: FastAPI (>=0.115.0)\n';
  promptText += `- **Database**: ${dbName} with SQLAlchemy 2.0+ (async mode)\n`;
  promptText += `- **Database Driver**: ${asyncDriver} (async driver)\n`;
  promptText += '- **Validation**: Pydantic v2 (>=2.9.0) for schema validation\n';
  promptText += `- **Authentication**: ${getAuthText()}\n`;
  promptText += '- **Environment**: pydantic-settings for configuration management\n';
  promptText += '- **Migrations**: Alembic for database migrations\n';
  promptText += '- **Security**: slowapi for rate limiting, CORS middleware\n';
  promptText += '- **ASGI Server**: Uvicorn (>=0.30.0)\n';
  promptText += '- **Password Hashing**: passlib with bcrypt\n\n';

  // ==================== TASK (STEP-BY-STEP) ====================
  promptText += '## Task (Execute in Order)\n\n';

  promptText += '### Step 1: Environment Setup\n';
  promptText += '- Create virtual environment and install dependencies\n';
  promptText += '- Review and set up `.env` configuration (see Environment Configuration section below)\n';
  promptText += `- Configure async database connection for ${dbName}\n`;
  promptText += '- Verify all required environment variables are set\n\n';

  promptText += '### Step 2: Understand Project Structure\n';
  promptText += '- Review the directory structure below\n';
  promptText += '- Understand the Router -> Dependency -> Service -> Repository pattern\n';
  promptText += '- Note the async-first approach for all database operations\n\n';

  promptText += '### Step 3: Implement Models\n';
  promptText += '- Create SQLAlchemy 2.0 models using `Mapped[]` and `mapped_column()`\n';
  promptText += '- Add proper type hints for all columns\n';
  promptText += '- Implement relationships where applicable\n';
  promptText += '- Include soft delete (`deleted_at` column) for all models\n\n';

  promptText += '### Step 4: Implement Schemas\n';
  promptText += '- Create Pydantic v2 schemas for each entity\n';
  promptText += '- Follow naming convention: `[Entity]Create`, `[Entity]Update`, `[Entity]Response`\n';
  promptText += '- Use `ConfigDict(from_attributes=True)` for ORM mode\n';
  promptText += '- Add field validators where needed\n\n';

  promptText += '### Step 5: Implement Services\n';
  promptText += '- Create async service classes with all business logic\n';
  promptText += '- Use async SQLAlchemy sessions for database operations\n';
  promptText += '- Raise `HTTPException` with proper status codes for errors\n';
  promptText += '- Add pagination support for list operations\n\n';

  promptText += '### Step 6: Implement Routers\n';
  promptText += '- Create router modules using `APIRouter`\n';
  promptText += '- Use dependency injection for services and database sessions\n';
  promptText += '- Define proper `response_model` for type safety\n';
  promptText += '- NO business logic in routers - only request/response handling\n\n';

  promptText += '### Step 7: Register Routes\n';
  promptText += '- Include routers in `main.py` with proper prefixes and tags\n';
  promptText += '- Apply authentication dependencies where required\n';
  promptText += '- Follow RESTful conventions\n\n';

  promptText += '### Step 8: Test & Verify\n';
  promptText += '- Run `uvicorn app.main:app --reload` to start the server\n';
  promptText += '- Verify database connection and table creation\n';
  promptText += '- Test each endpoint via `/docs` (Swagger UI)\n';
  promptText += '- Ensure error responses are consistent\n\n';

  // ==================== ENVIRONMENT CONFIGURATION ====================
  promptText += '## Environment Configuration\n\n';

  if (selectedDatabase.value === 'sqlite') {
    promptText += '### SQLite Configuration (Async)\n';
    promptText += 'Create `.env` with the following:\n\n';
    promptText += '```env\n';
    promptText += '# Server Configuration\n';
    promptText += 'APP_ENV=development\n';
    promptText += 'DEBUG=true\n';
    promptText += 'API_V1_PREFIX=/api/v1\n\n';
    promptText += '# Database Configuration (SQLite Async)\n';
    promptText += 'DATABASE_URL=sqlite+aiosqlite:///./app.db\n\n';
    promptText += '# JWT Configuration\n';
    promptText += 'SECRET_KEY=your-256-bit-secret-key-here\n';
    promptText += 'ALGORITHM=HS256\n';
    promptText += 'ACCESS_TOKEN_EXPIRE_MINUTES=1440\n\n';
    promptText += '# CORS Configuration\n';
    promptText += 'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001\n\n';
    promptText += '# Rate Limiting\n';
    promptText += 'RATE_LIMIT_PER_MINUTE=100\n';
    promptText += '```\n\n';
  } else {
    promptText += '### PostgreSQL Configuration (Async)\n';
    promptText += 'Create `.env` with the following:\n\n';
    promptText += '```env\n';
    promptText += '# Server Configuration\n';
    promptText += 'APP_ENV=development\n';
    promptText += 'DEBUG=true\n';
    promptText += 'API_V1_PREFIX=/api/v1\n\n';
    promptText += '# Database Configuration (PostgreSQL Async)\n';
    promptText += 'DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/your_database\n\n';
    promptText += '# JWT Configuration\n';
    promptText += 'SECRET_KEY=your-256-bit-secret-key-here\n';
    promptText += 'ALGORITHM=HS256\n';
    promptText += 'ACCESS_TOKEN_EXPIRE_MINUTES=1440\n\n';
    promptText += '# CORS Configuration\n';
    promptText += 'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001\n\n';
    promptText += '# Rate Limiting\n';
    promptText += 'RATE_LIMIT_PER_MINUTE=100\n';
    promptText += '```\n\n';
  }

  // ==================== PROJECT STRUCTURE ====================
  promptText += '## Project Structure\n\n';
  promptText += '```\n';
  promptText += 'backend/\n';
  promptText += '  app/\n';
  promptText += '    api/\n';
  promptText += '      v1/\n';
  promptText += '        routers/          # Route handlers (user_router.py, product_router.py)\n';
  promptText += '        __init__.py\n';
  promptText += '    core/\n';
  promptText += '      config.py          # Settings using pydantic-settings\n';
  promptText += '      database.py        # Async SQLAlchemy engine and session\n';
  promptText += '      security.py        # JWT and password utilities\n';
  promptText += '    models/              # SQLAlchemy 2.0 models\n';
  promptText += '      base.py            # Base model with common fields\n';
  promptText += '      user.py\n';
  promptText += '    schemas/             # Pydantic v2 schemas\n';
  promptText += '      user.py\n';
  promptText += '      common.py          # Shared schemas (pagination, responses)\n';
  promptText += '    services/            # Business logic layer\n';
  promptText += '      user_service.py\n';
  promptText += '    dependencies/        # FastAPI dependencies\n';
  promptText += '      auth.py            # Authentication dependencies\n';
  promptText += '      database.py        # Database session dependency\n';
  promptText += '    exceptions/          # Custom exception handlers\n';
  promptText += '      handlers.py\n';
  promptText += '    main.py              # FastAPI app initialization\n';
  promptText += '  alembic/               # Database migrations\n';
  promptText += '  tests/                 # Test files\n';
  promptText += '  requirements.txt\n';
  promptText += '  .env\n';
  promptText += '```\n\n';

  // ==================== ASYNC-FIRST ARCHITECTURE ====================
  promptText += '## Async-First Architecture\n\n';
  promptText += '**IMPORTANT**: FastAPI is designed for async operations. Follow these guidelines:\n\n';
  promptText += '1. **All database operations MUST be async** - Use `async_sessionmaker` and `AsyncSession`\n';
  promptText += '2. **Route handlers should be `async def`** when doing I/O operations\n';
  promptText += `3. **Use async database driver** - \`${asyncDriver}\` (not sync drivers)\n`;
  promptText += '4. **Await all database calls** - `await session.execute()`, `await session.commit()`\n';
  promptText += '5. **Use `select()` instead of `query()`** - SQLAlchemy 2.0 style\n\n';

  // ==================== CODE QUALITY STANDARDS ====================
  promptText += '## Code Quality Standards\n\n';

  promptText += '### Type Hints (Mandatory)\n';
  promptText += '- All functions must have type hints for parameters and return values\n';
  promptText += '- Use `from __future__ import annotations` for forward references\n';
  promptText += '- Use `Mapped[]` for SQLAlchemy model attributes\n\n';

  promptText += '### Error Handling Pattern\n';
  promptText += 'Follow this consistent error pattern:\n\n';
  promptText += '```python\n';
  promptText += 'from fastapi import HTTPException, status\n\n';
  promptText += '# In services - raise HTTPException\n';
  promptText += 'async def get_by_id(self, id: UUID) -> Model:\n';
  promptText += '    result = await self.session.execute(\n';
  promptText += '        select(Model).where(Model.id == id)\n';
  promptText += '    )\n';
  promptText += '    item = result.scalar_one_or_none()\n';
  promptText += '    if not item:\n';
  promptText += '        raise HTTPException(\n';
  promptText += '            status_code=status.HTTP_404_NOT_FOUND,\n';
  promptText += '            detail="Resource not found"\n';
  promptText += '        )\n';
  promptText += '    return item\n';
  promptText += '```\n\n';

  promptText += '### Naming Conventions\n';
  promptText += '- **Models**: PascalCase, singular (`User`, `Product`)\n';
  promptText += '- **Schemas**: PascalCase with suffix (`UserCreate`, `UserUpdate`, `UserResponse`)\n';
  promptText += '- **Services**: PascalCase with Service suffix (`UserService`)\n';
  promptText += '- **Routers**: snake_case files (`user_router.py`, `product_router.py`)\n';
  promptText += '- **Routes**: kebab-case endpoints (`/api/v1/users`, `/api/v1/product-categories`)\n';
  promptText += '- **Database tables**: snake_case plural (`users`, `product_categories`)\n';
  promptText += '- **Python files**: snake_case (`user_service.py`, `auth_dependency.py`)\n\n';

  promptText += '### Response Format (Mandatory)\n';
  promptText += 'All API responses MUST follow this structure:\n\n';
  promptText += '```python\n';
  promptText += '# Success response schema\n';
  promptText += 'class SuccessResponse(BaseModel, Generic[T]):\n';
  promptText += '    success: bool = True\n';
  promptText += '    message: str\n';
  promptText += '    data: T\n\n';
  promptText += '# Error response (automatic via HTTPException)\n';
  promptText += '{\n';
  promptText += '    "detail": "Error description"\n';
  promptText += '}\n\n';
  promptText += '# Paginated list response\n';
  promptText += 'class PaginatedResponse(BaseModel, Generic[T]):\n';
  promptText += '    items: list[T]\n';
  promptText += '    total: int\n';
  promptText += '    page: int\n';
  promptText += '    size: int\n';
  promptText += '    pages: int\n';
  promptText += '```\n\n';

  // ==================== CODE PATTERN EXAMPLES ====================
  promptText += '## Code Patterns\n\n';

  promptText += '### Model Pattern (SQLAlchemy 2.0)\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'from datetime import datetime\n';
  promptText += 'from uuid import UUID, uuid4\n';
  promptText += 'from sqlalchemy import String, Text, Index\n';
  promptText += 'from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase\n';
  if (selectedDatabase.value === 'sqlite') {
    promptText += 'from sqlalchemy import DateTime\n\n';
  } else {
    promptText += 'from sqlalchemy.dialects.postgresql import UUID as PG_UUID, TIMESTAMP\n\n';
  }
  promptText += 'class Base(DeclarativeBase):\n';
  promptText += '    pass\n\n';
  promptText += 'class TimestampMixin:\n';
  promptText += '    """Mixin for created_at, updated_at, deleted_at fields"""\n';
  if (selectedDatabase.value === 'sqlite') {
    promptText += '    created_at: Mapped[datetime] = mapped_column(\n';
    promptText += '        DateTime, default=datetime.utcnow, nullable=False\n';
    promptText += '    )\n';
    promptText += '    updated_at: Mapped[datetime] = mapped_column(\n';
    promptText += '        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False\n';
    promptText += '    )\n';
    promptText += '    deleted_at: Mapped[datetime | None] = mapped_column(\n';
    promptText += '        DateTime, nullable=True, default=None\n';
    promptText += '    )\n\n';
  } else {
    promptText += '    created_at: Mapped[datetime] = mapped_column(\n';
    promptText += '        TIMESTAMP(timezone=True), default=datetime.utcnow, nullable=False\n';
    promptText += '    )\n';
    promptText += '    updated_at: Mapped[datetime] = mapped_column(\n';
    promptText += '        TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False\n';
    promptText += '    )\n';
    promptText += '    deleted_at: Mapped[datetime | None] = mapped_column(\n';
    promptText += '        TIMESTAMP(timezone=True), nullable=True, default=None\n';
    promptText += '    )\n\n';
  }
  promptText += 'class Product(Base, TimestampMixin):\n';
  promptText += '    __tablename__ = "products"\n\n';
  if (selectedDatabase.value === 'sqlite') {
    promptText += '    id: Mapped[str] = mapped_column(\n';
    promptText += '        String(36), primary_key=True, default=lambda: str(uuid4())\n';
    promptText += '    )\n';
  } else {
    promptText += '    id: Mapped[UUID] = mapped_column(\n';
    promptText += '        PG_UUID(as_uuid=True), primary_key=True, default=uuid4\n';
    promptText += '    )\n';
  }
  promptText += '    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)\n';
  promptText += '    price: Mapped[float] = mapped_column(nullable=False)\n';
  promptText += '    description: Mapped[str | None] = mapped_column(Text, nullable=True)\n\n';
  promptText += '    __table_args__ = (\n';
  promptText += '        Index("ix_products_name", "name"),\n';
  promptText += '    )\n';
  promptText += '```\n\n';

  promptText += '### Schema Pattern (Pydantic v2)\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'from datetime import datetime\n';
  promptText += 'from uuid import UUID\n';
  promptText += 'from pydantic import BaseModel, ConfigDict, Field, field_validator\n\n';
  promptText += 'class ProductBase(BaseModel):\n';
  promptText += '    name: str = Field(..., min_length=2, max_length=255)\n';
  promptText += '    price: float = Field(..., gt=0)\n';
  promptText += '    description: str | None = Field(None, max_length=1000)\n\n';
  promptText += 'class ProductCreate(ProductBase):\n';
  promptText += '    pass\n\n';
  promptText += 'class ProductUpdate(BaseModel):\n';
  promptText += '    name: str | None = Field(None, min_length=2, max_length=255)\n';
  promptText += '    price: float | None = Field(None, gt=0)\n';
  promptText += '    description: str | None = Field(None, max_length=1000)\n\n';
  promptText += 'class ProductResponse(ProductBase):\n';
  promptText += '    id: UUID\n';
  promptText += '    created_at: datetime\n';
  promptText += '    updated_at: datetime\n\n';
  promptText += '    model_config = ConfigDict(from_attributes=True)\n';
  promptText += '```\n\n';

  promptText += '### Service Pattern (Async)\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'from uuid import UUID\n';
  promptText += 'from sqlalchemy import select, func\n';
  promptText += 'from sqlalchemy.ext.asyncio import AsyncSession\n';
  promptText += 'from fastapi import HTTPException, status\n';
  promptText += 'from app.models.product import Product\n';
  promptText += 'from app.schemas.product import ProductCreate, ProductUpdate\n';
  promptText += 'import logging\n\n';
  promptText += 'logger = logging.getLogger(__name__)\n\n';
  promptText += 'class ProductService:\n';
  promptText += '    def __init__(self, session: AsyncSession):\n';
  promptText += '        self.session = session\n\n';
  promptText += '    async def create(self, data: ProductCreate) -> Product:\n';
  promptText += '        # Check for duplicates\n';
  promptText += '        existing = await self.session.execute(\n';
  promptText += '            select(Product).where(Product.name == data.name)\n';
  promptText += '        )\n';
  promptText += '        if existing.scalar_one_or_none():\n';
  promptText += '            raise HTTPException(\n';
  promptText += '                status_code=status.HTTP_409_CONFLICT,\n';
  promptText += '                detail="Product already exists"\n';
  promptText += '            )\n\n';
  promptText += '        product = Product(**data.model_dump())\n';
  promptText += '        self.session.add(product)\n';
  promptText += '        await self.session.commit()\n';
  promptText += '        await self.session.refresh(product)\n';
  promptText += '        logger.info(f"Product created: {product.id}")\n';
  promptText += '        return product\n\n';
  promptText += '    async def get_all(\n';
  promptText += '        self, \n';
  promptText += '        page: int = 1, \n';
  promptText += '        size: int = 10,\n';
  promptText += '        search: str | None = None\n';
  promptText += '    ) -> tuple[list[Product], int]:\n';
  promptText += '        query = select(Product).where(Product.deleted_at.is_(None))\n\n';
  promptText += '        if search:\n';
  promptText += '            query = query.where(Product.name.ilike(f"%{search}%"))\n\n';
  promptText += '        # Get total count\n';
  promptText += '        count_query = select(func.count()).select_from(query.subquery())\n';
  promptText += '        total = (await self.session.execute(count_query)).scalar() or 0\n\n';
  promptText += '        # Apply pagination\n';
  promptText += '        query = query.offset((page - 1) * size).limit(size)\n';
  promptText += '        query = query.order_by(Product.created_at.desc())\n\n';
  promptText += '        result = await self.session.execute(query)\n';
  promptText += '        return result.scalars().all(), total\n\n';
  promptText += '    async def get_by_id(self, id: UUID) -> Product:\n';
  promptText += '        result = await self.session.execute(\n';
  promptText += '            select(Product).where(\n';
  promptText += '                Product.id == id,\n';
  promptText += '                Product.deleted_at.is_(None)\n';
  promptText += '            )\n';
  promptText += '        )\n';
  promptText += '        product = result.scalar_one_or_none()\n';
  promptText += '        if not product:\n';
  promptText += '            raise HTTPException(\n';
  promptText += '                status_code=status.HTTP_404_NOT_FOUND,\n';
  promptText += '                detail="Product not found"\n';
  promptText += '            )\n';
  promptText += '        return product\n\n';
  promptText += '    async def update(self, id: UUID, data: ProductUpdate) -> Product:\n';
  promptText += '        product = await self.get_by_id(id)\n';
  promptText += '        update_data = data.model_dump(exclude_unset=True)\n';
  promptText += '        for field, value in update_data.items():\n';
  promptText += '            setattr(product, field, value)\n';
  promptText += '        await self.session.commit()\n';
  promptText += '        await self.session.refresh(product)\n';
  promptText += '        logger.info(f"Product updated: {product.id}")\n';
  promptText += '        return product\n\n';
  promptText += '    async def delete(self, id: UUID) -> None:\n';
  promptText += '        product = await self.get_by_id(id)\n';
  promptText += '        # Soft delete\n';
  promptText += '        from datetime import datetime\n';
  promptText += '        product.deleted_at = datetime.utcnow()\n';
  promptText += '        await self.session.commit()\n';
  promptText += '        logger.info(f"Product deleted: {id}")\n';
  promptText += '```\n\n';

  promptText += '### Router Pattern\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'from uuid import UUID\n';
  promptText += 'from fastapi import APIRouter, Depends, Query, status\n';
  promptText += 'from sqlalchemy.ext.asyncio import AsyncSession\n';
  promptText += 'from app.core.database import get_session\n';
  promptText += 'from app.services.product_service import ProductService\n';
  promptText += 'from app.schemas.product import (\n';
  promptText += '    ProductCreate, ProductUpdate, ProductResponse\n';
  promptText += ')\n';
  promptText += 'from app.schemas.common import PaginatedResponse\n';
  promptText += 'from app.dependencies.auth import get_current_user, require_admin\n\n';
  promptText += 'router = APIRouter(prefix="/products", tags=["Products"])\n\n';
  promptText += '@router.get("", response_model=PaginatedResponse[ProductResponse])\n';
  promptText += 'async def get_products(\n';
  promptText += '    page: int = Query(1, ge=1),\n';
  promptText += '    size: int = Query(10, ge=1, le=100),\n';
  promptText += '    search: str | None = Query(None),\n';
  promptText += '    session: AsyncSession = Depends(get_session)\n';
  promptText += '):\n';
  promptText += '    """Get all products with pagination"""\n';
  promptText += '    service = ProductService(session)\n';
  promptText += '    items, total = await service.get_all(page=page, size=size, search=search)\n';
  promptText += '    return PaginatedResponse(\n';
  promptText += '        items=items,\n';
  promptText += '        total=total,\n';
  promptText += '        page=page,\n';
  promptText += '        size=size,\n';
  promptText += '        pages=(total + size - 1) // size\n';
  promptText += '    )\n\n';
  promptText += '@router.get("/{id}", response_model=ProductResponse)\n';
  promptText += 'async def get_product(\n';
  promptText += '    id: UUID,\n';
  promptText += '    session: AsyncSession = Depends(get_session)\n';
  promptText += '):\n';
  promptText += '    """Get a single product by ID"""\n';
  promptText += '    service = ProductService(session)\n';
  promptText += '    return await service.get_by_id(id)\n\n';
  promptText += '@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)\n';
  promptText += 'async def create_product(\n';
  promptText += '    data: ProductCreate,\n';
  promptText += '    session: AsyncSession = Depends(get_session),\n';
  promptText += '    _: dict = Depends(require_admin)  # Requires admin role\n';
  promptText += '):\n';
  promptText += '    """Create a new product (admin only)"""\n';
  promptText += '    service = ProductService(session)\n';
  promptText += '    return await service.create(data)\n\n';
  promptText += '@router.patch("/{id}", response_model=ProductResponse)\n';
  promptText += 'async def update_product(\n';
  promptText += '    id: UUID,\n';
  promptText += '    data: ProductUpdate,\n';
  promptText += '    session: AsyncSession = Depends(get_session),\n';
  promptText += '    _: dict = Depends(require_admin)\n';
  promptText += '):\n';
  promptText += '    """Update a product (admin only)"""\n';
  promptText += '    service = ProductService(session)\n';
  promptText += '    return await service.update(id, data)\n\n';
  promptText += '@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)\n';
  promptText += 'async def delete_product(\n';
  promptText += '    id: UUID,\n';
  promptText += '    session: AsyncSession = Depends(get_session),\n';
  promptText += '    _: dict = Depends(require_admin)\n';
  promptText += '):\n';
  promptText += '    """Delete a product (admin only)"""\n';
  promptText += '    service = ProductService(session)\n';
  promptText += '    await service.delete(id)\n';
  promptText += '```\n\n';

  promptText += '### Database Session Dependency\n';
  promptText += '```python\n';
  promptText += 'from sqlalchemy.ext.asyncio import (\n';
  promptText += '    create_async_engine, AsyncSession, async_sessionmaker\n';
  promptText += ')\n';
  promptText += 'from app.core.config import settings\n\n';
  promptText += 'engine = create_async_engine(\n';
  promptText += '    settings.DATABASE_URL,\n';
  promptText += '    echo=settings.DEBUG,\n';
  promptText += '    pool_pre_ping=True,\n';
  promptText += ')\n\n';
  promptText += 'async_session = async_sessionmaker(\n';
  promptText += '    engine, class_=AsyncSession, expire_on_commit=False\n';
  promptText += ')\n\n';
  promptText += 'async def get_session():\n';
  promptText += '    async with async_session() as session:\n';
  promptText += '        try:\n';
  promptText += '            yield session\n';
  promptText += '        finally:\n';
  promptText += '            await session.close()\n';
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

      // Generate Pydantic schema
      promptText += '**Pydantic Schema**:\n```python\n';
      promptText += generatePydanticSchema(entity);
      promptText += '\n```\n\n';

      // List fields
      if (entity.fields && entity.fields.length > 0) {
        promptText += '**Fields**:\n';
        entity.fields.forEach((field: any) => {
          const pyType = mapFieldTypeToPython(field.type);
          promptText += `  - \`${field.name}\`: ${pyType}${field.required ? ' (required)' : ''}${field.ref ? ` (ref: ${field.ref})` : ''}\n`;
        });
        promptText += '\n';
      }

      // Generate required service methods based on allowed operations
      if (entity.allowedOperations && entity.allowedOperations.length > 0) {
        promptText += '**Required Service Methods**:\n';
        const operations = entity.allowedOperations;

        if (operations.includes('GET')) {
          promptText += `  - \`async def get_all(page: int, size: int) -> tuple[list[${entity.name}], int]\`\n`;
          promptText += `  - \`async def get_by_id(id: UUID) -> ${entity.name}\`\n`;
        }
        if (operations.includes('POST')) {
          promptText += `  - \`async def create(data: ${entity.name}Create) -> ${entity.name}\`\n`;
        }
        if (operations.includes('PUT') || operations.includes('PATCH')) {
          promptText += `  - \`async def update(id: UUID, data: ${entity.name}Update) -> ${entity.name}\`\n`;
        }
        if (operations.includes('DELETE')) {
          promptText += `  - \`async def delete(id: UUID) -> None\` (soft delete)\n`;
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

  promptText += '### 1. Model File (`app/models/[entity].py`)\n';
  promptText += '- SQLAlchemy 2.0 model with `Mapped[]` and `mapped_column()`\n';
  promptText += '- Inherit from `Base` and `TimestampMixin`\n';
  promptText += '- Add indexes on frequently queried fields\n';
  promptText += '- Relationships if applicable\n';
  promptText += '- Soft delete support (`deleted_at` column)\n\n';

  promptText += '### 2. Schema File (`app/schemas/[entity].py`)\n';
  promptText += '- Pydantic v2 schemas: `[Entity]Base`, `[Entity]Create`, `[Entity]Update`, `[Entity]Response`\n';
  promptText += '- Use `Field()` for validation constraints\n';
  promptText += '- Use `ConfigDict(from_attributes=True)` for response schemas\n';
  promptText += '- Add `@field_validator` for custom validation where needed\n\n';

  promptText += '### 3. Service File (`app/services/[entity]_service.py`)\n';
  promptText += '- Async service class with all CRUD operations\n';
  promptText += '- Proper error handling with `HTTPException`\n';
  promptText += '- Pagination support for list operations\n';
  promptText += '- Logging for important operations\n\n';

  promptText += '### 4. Router File (`app/api/v1/routers/[entity]_router.py`)\n';
  promptText += '- `APIRouter` with proper prefix and tags\n';
  promptText += '- Dependency injection for services and sessions\n';
  promptText += '- `response_model` for type safety\n';
  promptText += '- Authentication dependencies where required\n';
  promptText += '- NO business logic\n\n';

  promptText += '### 5. Route Registration (update `app/main.py`)\n';
  promptText += '- Include router with proper prefix\n';
  promptText += '- Example: `app.include_router(product_router.router, prefix="/api/v1")`\n\n';

  // ==================== ACCEPTANCE CRITERIA ====================
  promptText += '## Acceptance Criteria\n\n';
  promptText += '- [ ] All models use SQLAlchemy 2.0 `Mapped[]` syntax\n';
  promptText += '- [ ] Schemas use Pydantic v2 `ConfigDict` (not `class Config`)\n';
  promptText += '- [ ] All services use `async/await` for database operations\n';
  promptText += '- [ ] Routers use dependency injection for sessions and services\n';
  promptText += '- [ ] Authentication dependencies applied to protected routes\n';
  promptText += '- [ ] Pagination implemented for list endpoints\n';
  promptText += '- [ ] Soft delete implemented (`deleted_at` column)\n';
  promptText += '- [ ] Type hints on all functions and methods\n';
  promptText += '- [ ] Database uses async driver (`asyncpg` or `aiosqlite`)\n';
  promptText += '- [ ] API responses match documented formats\n';
  promptText += '- [ ] Error responses use proper HTTP status codes\n';
  promptText += '- [ ] No business logic in routers\n';
  promptText += '- [ ] All file naming conventions followed\n';
  promptText += '- [ ] OpenAPI documentation accessible at `/docs`\n\n';

  // ==================== DEPENDENCIES ====================
  promptText += '## Dependencies (requirements.txt)\n\n';
  promptText += '```\n';
  promptText += 'fastapi>=0.115.0\n';
  promptText += 'uvicorn[standard]>=0.30.0\n';
  promptText += 'sqlalchemy[asyncio]>=2.0.30\n';
  promptText += 'alembic>=1.13.0\n';
  if (selectedDatabase.value === 'postgres') {
    promptText += 'asyncpg>=0.29.0\n';
  } else {
    promptText += 'aiosqlite>=0.19.0\n';
  }
  promptText += 'pydantic>=2.9.0\n';
  promptText += 'pydantic-settings>=2.5.0\n';
  promptText += 'python-jose[cryptography]>=3.3.0\n';
  promptText += 'passlib[bcrypt]>=1.7.4\n';
  promptText += 'python-multipart>=0.0.9\n';
  promptText += 'slowapi>=0.1.9\n';
  promptText += 'httpx>=0.27.0\n';
  promptText += '```\n\n';

  // ==================== CLOSING INSTRUCTION ====================
  promptText += '---\n\n';
  promptText += '## Implementation Instructions\n\n';
  promptText += '**IMPORTANT: Follow these guidelines:**\n\n';
  promptText += '1. Use async-first approach for all database operations\n';
  promptText += '2. Follow the exact patterns shown in the Code Patterns section\n';
  promptText += '3. Map each entity to its required endpoints and operations\n';
  promptText += '4. Implement entity by entity, completing each fully before moving to the next\n';
  promptText += '5. Ensure all type hints are present\n';
  promptText += '6. Test via FastAPI\'s automatic `/docs` endpoint\n\n';
  promptText += '**Generate all files with complete, production-ready code. The code should be immediately runnable after `pip install -r requirements.txt` and database setup.**\n';

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
  const projectName = `backend-fastapi${dbSuffix}`;
  const projectFolder = zip.folder(projectName);
  const promptFolder = projectFolder?.folder('prompt');
  const workflowsFolder = promptFolder?.folder('workflows');

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
    toast.error('Failed to copy to clipboard. Please check browser permissions.');
  }
};
</script>
