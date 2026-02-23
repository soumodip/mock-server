<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-200">Flask Backend</h2>
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

// Map field types to Marshmallow field types
const mapFieldTypeToMarshmallow = (type: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'fields.String',
    'number': 'fields.Float',
    'boolean': 'fields.Boolean',
    'date': 'fields.Date',
    'datetime': 'fields.DateTime',
    'object': 'fields.Dict',
    'object-json': 'fields.Dict',
    'array': 'fields.List(fields.Raw)',
    'array-string': 'fields.List(fields.String)',
    'array-number': 'fields.List(fields.Float)',
    'uuid': 'fields.UUID',
    'text': 'fields.String',
    'integer': 'fields.Integer',
    'float': 'fields.Float',
    'decimal': 'fields.Decimal',
  };
  return typeMap[type.toLowerCase()] || 'fields.Raw';
};

// Generate Marshmallow schema from entity
const generateMarshmallowSchema = (entity: any): string => {
  let schemaStr = `class ${entity.name}Schema(ma.SQLAlchemyAutoSchema):\n`;
  schemaStr += '    class Meta:\n';
  schemaStr += `        model = ${entity.name}\n`;
  schemaStr += '        load_instance = True\n';
  schemaStr += '        include_fk = True\n\n';

  schemaStr += `class ${entity.name}CreateSchema(ma.Schema):\n`;
  if (entity.fields && entity.fields.length > 0) {
    entity.fields.forEach((field: any) => {
      const maType = mapFieldTypeToMarshmallow(field.type);
      const required = field.required ? 'required=True' : 'required=False';
      schemaStr += `    ${field.name} = ${maType}(${required})\n`;
    });
  } else {
    schemaStr += '    pass\n';
  }

  schemaStr += '\n';
  schemaStr += `class ${entity.name}UpdateSchema(ma.Schema):\n`;
  if (entity.fields && entity.fields.length > 0) {
    entity.fields.forEach((field: any) => {
      const maType = mapFieldTypeToMarshmallow(field.type);
      schemaStr += `    ${field.name} = ${maType}(required=False)\n`;
    });
  } else {
    schemaStr += '    pass\n';
  }

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
    return authTypeMap[selectedProject.value.authType] || 'JWT-based authentication with Flask-JWT-Extended';
  }
  return 'JWT-based authentication with Flask-JWT-Extended';
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
  const dbDriver = selectedDatabase.value === 'sqlite' ? 'sqlite3' : 'psycopg2';

  // ==================== CONTEXT ====================
  promptText += '# Flask Backend Implementation\n\n';

  promptText += '## Context\n';
  promptText += `You are an experienced Python backend developer implementing a production-ready Flask backend API with ${dbName}. `;
  promptText += 'Follow modern Flask best practices (2025), application factory pattern, and clean code principles.\n\n';

  // ==================== PURPOSE ====================
  promptText += '## Purpose\n';
  promptText += 'Implement a production-ready RESTful API with the entities and endpoints specified below, following Flask best practices and Blueprint-based modular architecture.\n\n';

  // ==================== TECHNOLOGY STACK ====================
  promptText += '## Technology Stack\n\n';
  promptText += '- **Framework**: Flask (>=3.1.0)\n';
  promptText += `- **Database**: ${dbName} with SQLAlchemy 2.0+ ORM\n`;
  promptText += `- **Database Driver**: ${dbDriver}\n`;
  promptText += '- **Validation**: Marshmallow (>=3.22.0) for schema validation and serialization\n';
  promptText += `- **Authentication**: ${getAuthText()}\n`;
  promptText += '- **Environment**: python-dotenv for configuration management\n';
  promptText += '- **Migrations**: Flask-Migrate (Alembic wrapper) for database migrations\n';
  promptText += '- **Security**: Flask-CORS, Flask-Limiter for rate limiting\n';
  promptText += '- **WSGI Server**: Gunicorn (>=23.0.0) for production deployment\n';
  promptText += '- **Password Hashing**: Werkzeug security utilities with bcrypt\n\n';

  // ==================== TASK (STEP-BY-STEP) ====================
  promptText += '## Task (Execute in Order)\n\n';

  promptText += '### Step 1: Environment Setup\n';
  promptText += '- Create virtual environment and install dependencies\n';
  promptText += '- Review and set up `.env` configuration (see Environment Configuration section below)\n';
  promptText += `- Configure database connection for ${dbName}\n`;
  promptText += '- Verify all required environment variables are set\n\n';

  promptText += '### Step 2: Understand Project Structure\n';
  promptText += '- Review the directory structure below\n';
  promptText += '- Understand the Blueprint -> Service -> Model pattern\n';
  promptText += '- Note the Application Factory pattern for Flask initialization\n\n';

  promptText += '### Step 3: Implement Models\n';
  promptText += '- Create SQLAlchemy 2.0 models using `Mapped[]` and `mapped_column()`\n';
  promptText += '- Add proper type hints for all columns\n';
  promptText += '- Implement relationships where applicable\n';
  promptText += '- Include soft delete (`deleted_at` column) for all models\n\n';

  promptText += '### Step 4: Implement Schemas\n';
  promptText += '- Create Marshmallow schemas for each entity\n';
  promptText += '- Follow naming convention: `[Entity]Schema`, `[Entity]CreateSchema`, `[Entity]UpdateSchema`\n';
  promptText += '- Use `SQLAlchemyAutoSchema` for automatic ORM integration\n';
  promptText += '- Add field validators where needed\n\n';

  promptText += '### Step 5: Implement Services\n';
  promptText += '- Create service classes with all business logic\n';
  promptText += '- Use SQLAlchemy sessions for database operations\n';
  promptText += '- Raise custom exceptions for error scenarios\n';
  promptText += '- Add pagination support for list operations\n\n';

  promptText += '### Step 6: Implement Blueprints\n';
  promptText += '- Create Blueprint modules for each resource\n';
  promptText += '- Use Marshmallow for request validation via `schema.load()`\n';
  promptText += '- Serialize responses via `schema.dump()`\n';
  promptText += '- NO business logic in blueprints - only request/response handling\n\n';

  promptText += '### Step 7: Register Blueprints\n';
  promptText += '- Include blueprints in application factory with proper url_prefix\n';
  promptText += '- Apply authentication decorators where required\n';
  promptText += '- Follow RESTful conventions\n\n';

  promptText += '### Step 8: Test & Verify\n';
  promptText += '- Run `flask run` to start the development server\n';
  promptText += '- Run `flask db upgrade` to apply migrations\n';
  promptText += '- Test each endpoint manually or via Swagger UI\n';
  promptText += '- Ensure error responses are consistent\n\n';

  // ==================== ENVIRONMENT CONFIGURATION ====================
  promptText += '## Environment Configuration\n\n';

  if (selectedDatabase.value === 'sqlite') {
    promptText += '### SQLite Configuration\n';
    promptText += 'Create `.env` with the following:\n\n';
    promptText += '```env\n';
    promptText += '# Server Configuration\n';
    promptText += 'FLASK_APP=wsgi.py\n';
    promptText += 'FLASK_ENV=development\n';
    promptText += 'FLASK_DEBUG=true\n';
    promptText += 'SECRET_KEY=your-256-bit-secret-key-here\n\n';
    promptText += '# Database Configuration (SQLite)\n';
    promptText += 'DATABASE_URL=sqlite:///app.db\n\n';
    promptText += '# JWT Configuration\n';
    promptText += 'JWT_SECRET_KEY=your-jwt-secret-key-here\n';
    promptText += 'JWT_ACCESS_TOKEN_EXPIRES=1440\n\n';
    promptText += '# CORS Configuration\n';
    promptText += 'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001\n\n';
    promptText += '# Rate Limiting\n';
    promptText += 'RATELIMIT_DEFAULT=100 per minute\n';
    promptText += '```\n\n';
  } else {
    promptText += '### PostgreSQL Configuration\n';
    promptText += 'Create `.env` with the following:\n\n';
    promptText += '```env\n';
    promptText += '# Server Configuration\n';
    promptText += 'FLASK_APP=wsgi.py\n';
    promptText += 'FLASK_ENV=development\n';
    promptText += 'FLASK_DEBUG=true\n';
    promptText += 'SECRET_KEY=your-256-bit-secret-key-here\n\n';
    promptText += '# Database Configuration (PostgreSQL)\n';
    promptText += 'DATABASE_URL=postgresql://postgres:password@localhost:5432/your_database\n\n';
    promptText += '# JWT Configuration\n';
    promptText += 'JWT_SECRET_KEY=your-jwt-secret-key-here\n';
    promptText += 'JWT_ACCESS_TOKEN_EXPIRES=1440\n\n';
    promptText += '# CORS Configuration\n';
    promptText += 'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001\n\n';
    promptText += '# Rate Limiting\n';
    promptText += 'RATELIMIT_DEFAULT=100 per minute\n';
    promptText += '```\n\n';
  }

  // ==================== PROJECT STRUCTURE ====================
  promptText += '## Project Structure\n\n';
  promptText += '```\n';
  promptText += 'backend/\n';
  promptText += '  app/\n';
  promptText += '    __init__.py           # Application factory (create_app)\n';
  promptText += '    extensions.py         # Flask extensions initialization\n';
  promptText += '    config.py             # Configuration classes (Dev, Prod, Test)\n';
  promptText += '    blueprints/\n';
  promptText += '      __init__.py\n';
  promptText += '      auth_bp.py          # Authentication routes\n';
  promptText += '      user_bp.py          # User routes\n';
  promptText += '    models/\n';
  promptText += '      __init__.py\n';
  promptText += '      base.py             # Base model with common fields\n';
  promptText += '      user.py             # User model\n';
  promptText += '    schemas/\n';
  promptText += '      __init__.py\n';
  promptText += '      user.py             # User Marshmallow schemas\n';
  promptText += '      common.py           # Shared schemas (pagination, responses)\n';
  promptText += '    services/\n';
  promptText += '      __init__.py\n';
  promptText += '      user_service.py     # User business logic\n';
  promptText += '    exceptions/\n';
  promptText += '      __init__.py\n';
  promptText += '      handlers.py         # Custom exception handlers\n';
  promptText += '    utils/\n';
  promptText += '      __init__.py\n';
  promptText += '      auth.py             # Authentication utilities\n';
  promptText += '  migrations/             # Flask-Migrate database migrations\n';
  promptText += '  tests/                  # Test files\n';
  promptText += '  requirements.txt\n';
  promptText += '  wsgi.py                 # WSGI entry point\n';
  promptText += '  .env\n';
  promptText += '```\n\n';

  // ==================== APPLICATION FACTORY PATTERN ====================
  promptText += '## Application Factory Pattern\n\n';
  promptText += '**IMPORTANT**: Flask applications should use the factory pattern. Follow these guidelines:\n\n';
  promptText += '1. **Use `create_app()` function** - Initialize app in `app/__init__.py`\n';
  promptText += '2. **Initialize extensions separately** - Use `init_app()` pattern in `extensions.py`\n';
  promptText += '3. **Register blueprints in factory** - Keep route registration centralized\n';
  promptText += '4. **Load config based on environment** - Development, Testing, Production\n';
  promptText += '5. **Set up error handlers** - Global exception handling in factory\n\n';

  // ==================== CODE QUALITY STANDARDS ====================
  promptText += '## Code Quality Standards\n\n';

  promptText += '### Type Hints (Mandatory)\n';
  promptText += '- All functions must have type hints for parameters and return values\n';
  promptText += '- Use `from __future__ import annotations` for forward references\n';
  promptText += '- Use `Mapped[]` for SQLAlchemy model attributes (SQLAlchemy 2.0+)\n\n';

  promptText += '### Error Handling Pattern\n';
  promptText += 'Follow this consistent error pattern:\n\n';
  promptText += '```python\n';
  promptText += 'from flask import jsonify\n';
  promptText += 'from werkzeug.exceptions import HTTPException\n\n';
  promptText += '# In services - raise custom exceptions\n';
  promptText += 'class ResourceNotFoundError(Exception):\n';
  promptText += '    def __init__(self, message: str = "Resource not found"):\n';
  promptText += '        self.message = message\n';
  promptText += '        super().__init__(self.message)\n\n';
  promptText += '# In app factory - register error handlers\n';
  promptText += '@app.errorhandler(ResourceNotFoundError)\n';
  promptText += 'def handle_not_found(error):\n';
  promptText += '    return jsonify({"error": error.message}), 404\n\n';
  promptText += '@app.errorhandler(HTTPException)\n';
  promptText += 'def handle_http_exception(error):\n';
  promptText += '    return jsonify({"error": error.description}), error.code\n';
  promptText += '```\n\n';

  promptText += '### Naming Conventions\n';
  promptText += '- **Models**: PascalCase, singular (`User`, `Product`)\n';
  promptText += '- **Schemas**: PascalCase with suffix (`UserSchema`, `UserCreateSchema`, `UserUpdateSchema`)\n';
  promptText += '- **Services**: PascalCase with Service suffix (`UserService`)\n';
  promptText += '- **Blueprints**: snake_case files with _bp suffix (`user_bp.py`, `auth_bp.py`)\n';
  promptText += '- **Routes**: kebab-case endpoints (`/api/v1/users`, `/api/v1/product-categories`)\n';
  promptText += '- **Database tables**: snake_case plural (`users`, `product_categories`)\n';
  promptText += '- **Python files**: snake_case (`user_service.py`, `auth_utils.py`)\n\n';

  promptText += '### Response Format (Mandatory)\n';
  promptText += 'All API responses MUST follow this structure:\n\n';
  promptText += '```python\n';
  promptText += '# Success response schema\n';
  promptText += 'class SuccessResponseSchema(ma.Schema):\n';
  promptText += '    success = fields.Boolean(dump_default=True)\n';
  promptText += '    message = fields.String()\n';
  promptText += '    data = fields.Raw()\n\n';
  promptText += '# Error response (automatic via error handlers)\n';
  promptText += '{\n';
  promptText += '    "error": "Error description"\n';
  promptText += '}\n\n';
  promptText += '# Paginated list response\n';
  promptText += 'class PaginatedResponseSchema(ma.Schema):\n';
  promptText += '    items = fields.List(fields.Raw())\n';
  promptText += '    total = fields.Integer()\n';
  promptText += '    page = fields.Integer()\n';
  promptText += '    size = fields.Integer()\n';
  promptText += '    pages = fields.Integer()\n';
  promptText += '```\n\n';

  // ==================== CODE PATTERN EXAMPLES ====================
  promptText += '## Code Patterns\n\n';

  promptText += '### Extensions Pattern (app/extensions.py)\n';
  promptText += '```python\n';
  promptText += 'from flask_sqlalchemy import SQLAlchemy\n';
  promptText += 'from flask_migrate import Migrate\n';
  promptText += 'from flask_jwt_extended import JWTManager\n';
  promptText += 'from flask_cors import CORS\n';
  promptText += 'from flask_limiter import Limiter\n';
  promptText += 'from flask_limiter.util import get_remote_address\n';
  promptText += 'from flask_marshmallow import Marshmallow\n\n';
  promptText += 'db = SQLAlchemy()\n';
  promptText += 'migrate = Migrate()\n';
  promptText += 'jwt = JWTManager()\n';
  promptText += 'cors = CORS()\n';
  promptText += 'limiter = Limiter(key_func=get_remote_address)\n';
  promptText += 'ma = Marshmallow()\n';
  promptText += '```\n\n';

  promptText += '### Application Factory Pattern (app/__init__.py)\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'from flask import Flask\n';
  promptText += 'from app.extensions import db, migrate, jwt, cors, limiter, ma\n';
  promptText += 'from app.config import config\n\n';
  promptText += 'def create_app(config_name: str = "development") -> Flask:\n';
  promptText += '    app = Flask(__name__)\n';
  promptText += '    app.config.from_object(config[config_name])\n\n';
  promptText += '    # Initialize extensions\n';
  promptText += '    db.init_app(app)\n';
  promptText += '    migrate.init_app(app, db)\n';
  promptText += '    jwt.init_app(app)\n';
  promptText += '    cors.init_app(app, origins=app.config["ALLOWED_ORIGINS"])\n';
  promptText += '    limiter.init_app(app)\n';
  promptText += '    ma.init_app(app)\n\n';
  promptText += '    # Register blueprints\n';
  promptText += '    from app.blueprints.auth_bp import auth_bp\n';
  promptText += '    from app.blueprints.user_bp import user_bp\n';
  promptText += '    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")\n';
  promptText += '    app.register_blueprint(user_bp, url_prefix="/api/v1/users")\n\n';
  promptText += '    # Register error handlers\n';
  promptText += '    from app.exceptions.handlers import register_error_handlers\n';
  promptText += '    register_error_handlers(app)\n\n';
  promptText += '    return app\n';
  promptText += '```\n\n';

  promptText += '### Model Pattern (SQLAlchemy 2.0)\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'from datetime import datetime\n';
  promptText += 'from uuid import UUID, uuid4\n';
  promptText += 'from sqlalchemy import String, Text, Index\n';
  promptText += 'from sqlalchemy.orm import Mapped, mapped_column\n';
  promptText += 'from app.extensions import db\n';
  if (selectedDatabase.value === 'sqlite') {
    promptText += 'from sqlalchemy import DateTime\n\n';
  } else {
    promptText += 'from sqlalchemy.dialects.postgresql import UUID as PG_UUID, TIMESTAMP\n\n';
  }
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
  promptText += 'class Product(db.Model, TimestampMixin):\n';
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

  promptText += '### Schema Pattern (Marshmallow)\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'from marshmallow import fields, validate, validates, ValidationError\n';
  promptText += 'from app.extensions import ma\n';
  promptText += 'from app.models.product import Product\n\n';
  promptText += 'class ProductSchema(ma.SQLAlchemyAutoSchema):\n';
  promptText += '    class Meta:\n';
  promptText += '        model = Product\n';
  promptText += '        load_instance = True\n';
  promptText += '        include_fk = True\n\n';
  promptText += 'class ProductCreateSchema(ma.Schema):\n';
  promptText += '    name = fields.String(\n';
  promptText += '        required=True,\n';
  promptText += '        validate=validate.Length(min=2, max=255)\n';
  promptText += '    )\n';
  promptText += '    price = fields.Float(\n';
  promptText += '        required=True,\n';
  promptText += '        validate=validate.Range(min=0, min_inclusive=False)\n';
  promptText += '    )\n';
  promptText += '    description = fields.String(\n';
  promptText += '        required=False,\n';
  promptText += '        validate=validate.Length(max=1000)\n';
  promptText += '    )\n\n';
  promptText += 'class ProductUpdateSchema(ma.Schema):\n';
  promptText += '    name = fields.String(\n';
  promptText += '        required=False,\n';
  promptText += '        validate=validate.Length(min=2, max=255)\n';
  promptText += '    )\n';
  promptText += '    price = fields.Float(\n';
  promptText += '        required=False,\n';
  promptText += '        validate=validate.Range(min=0, min_inclusive=False)\n';
  promptText += '    )\n';
  promptText += '    description = fields.String(\n';
  promptText += '        required=False,\n';
  promptText += '        validate=validate.Length(max=1000)\n';
  promptText += '    )\n';
  promptText += '```\n\n';

  promptText += '### Service Pattern\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'from uuid import UUID\n';
  promptText += 'from datetime import datetime\n';
  promptText += 'from sqlalchemy import select, func\n';
  promptText += 'from app.extensions import db\n';
  promptText += 'from app.models.product import Product\n';
  promptText += 'from app.exceptions import ResourceNotFoundError, ConflictError\n';
  promptText += 'import logging\n\n';
  promptText += 'logger = logging.getLogger(__name__)\n\n';
  promptText += 'class ProductService:\n';
  promptText += '    @staticmethod\n';
  promptText += '    def create(data: dict) -> Product:\n';
  promptText += '        # Check for duplicates\n';
  promptText += '        existing = db.session.execute(\n';
  promptText += '            select(Product).where(Product.name == data["name"])\n';
  promptText += '        ).scalar_one_or_none()\n';
  promptText += '        if existing:\n';
  promptText += '            raise ConflictError("Product already exists")\n\n';
  promptText += '        product = Product(**data)\n';
  promptText += '        db.session.add(product)\n';
  promptText += '        db.session.commit()\n';
  promptText += '        logger.info(f"Product created: {product.id}")\n';
  promptText += '        return product\n\n';
  promptText += '    @staticmethod\n';
  promptText += '    def get_all(\n';
  promptText += '        page: int = 1,\n';
  promptText += '        size: int = 10,\n';
  promptText += '        search: str | None = None\n';
  promptText += '    ) -> tuple[list[Product], int]:\n';
  promptText += '        query = select(Product).where(Product.deleted_at.is_(None))\n\n';
  promptText += '        if search:\n';
  promptText += '            query = query.where(Product.name.ilike(f"%{search}%"))\n\n';
  promptText += '        # Get total count\n';
  promptText += '        count_query = select(func.count()).select_from(query.subquery())\n';
  promptText += '        total = db.session.execute(count_query).scalar() or 0\n\n';
  promptText += '        # Apply pagination\n';
  promptText += '        query = query.offset((page - 1) * size).limit(size)\n';
  promptText += '        query = query.order_by(Product.created_at.desc())\n\n';
  promptText += '        result = db.session.execute(query)\n';
  promptText += '        return list(result.scalars().all()), total\n\n';
  promptText += '    @staticmethod\n';
  promptText += '    def get_by_id(id: UUID) -> Product:\n';
  promptText += '        result = db.session.execute(\n';
  promptText += '            select(Product).where(\n';
  promptText += '                Product.id == id,\n';
  promptText += '                Product.deleted_at.is_(None)\n';
  promptText += '            )\n';
  promptText += '        )\n';
  promptText += '        product = result.scalar_one_or_none()\n';
  promptText += '        if not product:\n';
  promptText += '            raise ResourceNotFoundError("Product not found")\n';
  promptText += '        return product\n\n';
  promptText += '    @staticmethod\n';
  promptText += '    def update(id: UUID, data: dict) -> Product:\n';
  promptText += '        product = ProductService.get_by_id(id)\n';
  promptText += '        for field, value in data.items():\n';
  promptText += '            if value is not None:\n';
  promptText += '                setattr(product, field, value)\n';
  promptText += '        db.session.commit()\n';
  promptText += '        logger.info(f"Product updated: {product.id}")\n';
  promptText += '        return product\n\n';
  promptText += '    @staticmethod\n';
  promptText += '    def delete(id: UUID) -> None:\n';
  promptText += '        product = ProductService.get_by_id(id)\n';
  promptText += '        # Soft delete\n';
  promptText += '        product.deleted_at = datetime.utcnow()\n';
  promptText += '        db.session.commit()\n';
  promptText += '        logger.info(f"Product deleted: {id}")\n';
  promptText += '```\n\n';

  promptText += '### Blueprint Pattern\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'from uuid import UUID\n';
  promptText += 'from flask import Blueprint, request, jsonify\n';
  promptText += 'from flask_jwt_extended import jwt_required, get_jwt_identity\n';
  promptText += 'from marshmallow import ValidationError\n';
  promptText += 'from app.services.product_service import ProductService\n';
  promptText += 'from app.schemas.product import (\n';
  promptText += '    ProductSchema, ProductCreateSchema, ProductUpdateSchema\n';
  promptText += ')\n\n';
  promptText += 'product_bp = Blueprint("products", __name__)\n';
  promptText += 'product_schema = ProductSchema()\n';
  promptText += 'products_schema = ProductSchema(many=True)\n';
  promptText += 'create_schema = ProductCreateSchema()\n';
  promptText += 'update_schema = ProductUpdateSchema()\n\n';
  promptText += '@product_bp.route("", methods=["GET"])\n';
  promptText += 'def get_products():\n';
  promptText += '    """Get all products with pagination"""\n';
  promptText += '    page = request.args.get("page", 1, type=int)\n';
  promptText += '    size = request.args.get("size", 10, type=int)\n';
  promptText += '    search = request.args.get("search", None, type=str)\n\n';
  promptText += '    items, total = ProductService.get_all(page=page, size=size, search=search)\n';
  promptText += '    return jsonify({\n';
  promptText += '        "items": products_schema.dump(items),\n';
  promptText += '        "total": total,\n';
  promptText += '        "page": page,\n';
  promptText += '        "size": size,\n';
  promptText += '        "pages": (total + size - 1) // size\n';
  promptText += '    })\n\n';
  promptText += '@product_bp.route("/<uuid:id>", methods=["GET"])\n';
  promptText += 'def get_product(id: UUID):\n';
  promptText += '    """Get a single product by ID"""\n';
  promptText += '    product = ProductService.get_by_id(id)\n';
  promptText += '    return jsonify(product_schema.dump(product))\n\n';
  promptText += '@product_bp.route("", methods=["POST"])\n';
  promptText += '@jwt_required()\n';
  promptText += 'def create_product():\n';
  promptText += '    """Create a new product (authenticated)"""\n';
  promptText += '    data = create_schema.load(request.get_json())\n';
  promptText += '    product = ProductService.create(data)\n';
  promptText += '    return jsonify(product_schema.dump(product)), 201\n\n';
  promptText += '@product_bp.route("/<uuid:id>", methods=["PATCH"])\n';
  promptText += '@jwt_required()\n';
  promptText += 'def update_product(id: UUID):\n';
  promptText += '    """Update a product (authenticated)"""\n';
  promptText += '    data = update_schema.load(request.get_json())\n';
  promptText += '    product = ProductService.update(id, data)\n';
  promptText += '    return jsonify(product_schema.dump(product))\n\n';
  promptText += '@product_bp.route("/<uuid:id>", methods=["DELETE"])\n';
  promptText += '@jwt_required()\n';
  promptText += 'def delete_product(id: UUID):\n';
  promptText += '    """Delete a product (authenticated)"""\n';
  promptText += '    ProductService.delete(id)\n';
  promptText += '    return "", 204\n';
  promptText += '```\n\n';

  promptText += '### Configuration Pattern (app/config.py)\n';
  promptText += '```python\n';
  promptText += 'from __future__ import annotations\n';
  promptText += 'import os\n';
  promptText += 'from datetime import timedelta\n\n';
  promptText += 'class Config:\n';
  promptText += '    """Base configuration"""\n';
  promptText += '    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")\n';
  promptText += '    SQLALCHEMY_TRACK_MODIFICATIONS = False\n';
  promptText += '    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}\n';
  promptText += '    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key")\n';
  promptText += '    JWT_ACCESS_TOKEN_EXPIRES = timedelta(\n';
  promptText += '        minutes=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 1440))\n';
  promptText += '    )\n';
  promptText += '    ALLOWED_ORIGINS = os.environ.get(\n';
  promptText += '        "ALLOWED_ORIGINS", "http://localhost:3000"\n';
  promptText += '    ).split(",")\n\n';
  promptText += 'class DevelopmentConfig(Config):\n';
  promptText += '    """Development configuration"""\n';
  promptText += '    DEBUG = True\n';
  promptText += '    SQLALCHEMY_DATABASE_URI = os.environ.get(\n';
  promptText += '        "DATABASE_URL", "sqlite:///app.db"\n';
  promptText += '    )\n\n';
  promptText += 'class ProductionConfig(Config):\n';
  promptText += '    """Production configuration"""\n';
  promptText += '    DEBUG = False\n';
  promptText += '    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")\n\n';
  promptText += 'class TestingConfig(Config):\n';
  promptText += '    """Testing configuration"""\n';
  promptText += '    TESTING = True\n';
  promptText += '    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"\n\n';
  promptText += 'config = {\n';
  promptText += '    "development": DevelopmentConfig,\n';
  promptText += '    "production": ProductionConfig,\n';
  promptText += '    "testing": TestingConfig,\n';
  promptText += '    "default": DevelopmentConfig\n';
  promptText += '}\n';
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

      // Generate Marshmallow schema
      promptText += '**Marshmallow Schema**:\n```python\n';
      promptText += generateMarshmallowSchema(entity);
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
          promptText += `  - \`def get_all(page: int, size: int) -> tuple[list[${entity.name}], int]\`\n`;
          promptText += `  - \`def get_by_id(id: UUID) -> ${entity.name}\`\n`;
        }
        if (operations.includes('POST')) {
          promptText += `  - \`def create(data: dict) -> ${entity.name}\`\n`;
        }
        if (operations.includes('PUT') || operations.includes('PATCH')) {
          promptText += `  - \`def update(id: UUID, data: dict) -> ${entity.name}\`\n`;
        }
        if (operations.includes('DELETE')) {
          promptText += `  - \`def delete(id: UUID) -> None\` (soft delete)\n`;
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
  promptText += '- Inherit from `db.Model` and `TimestampMixin`\n';
  promptText += '- Add indexes on frequently queried fields\n';
  promptText += '- Relationships if applicable\n';
  promptText += '- Soft delete support (`deleted_at` column)\n\n';

  promptText += '### 2. Schema File (`app/schemas/[entity].py`)\n';
  promptText += '- Marshmallow schemas: `[Entity]Schema`, `[Entity]CreateSchema`, `[Entity]UpdateSchema`\n';
  promptText += '- Use `validate` decorators for validation constraints\n';
  promptText += '- Use `SQLAlchemyAutoSchema` for automatic ORM integration\n';
  promptText += '- Add `@validates` for custom validation where needed\n\n';

  promptText += '### 3. Service File (`app/services/[entity]_service.py`)\n';
  promptText += '- Service class with all CRUD operations as static methods\n';
  promptText += '- Proper error handling with custom exceptions\n';
  promptText += '- Pagination support for list operations\n';
  promptText += '- Logging for important operations\n\n';

  promptText += '### 4. Blueprint File (`app/blueprints/[entity]_bp.py`)\n';
  promptText += '- `Blueprint` with proper name\n';
  promptText += '- Marshmallow schema instances for serialization\n';
  promptText += '- `@jwt_required()` decorator for protected routes\n';
  promptText += '- NO business logic\n\n';

  promptText += '### 5. Blueprint Registration (update `app/__init__.py`)\n';
  promptText += '- Register blueprint with proper url_prefix\n';
  promptText += '- Example: `app.register_blueprint(product_bp, url_prefix="/api/v1/products")`\n\n';

  // ==================== ACCEPTANCE CRITERIA ====================
  promptText += '## Acceptance Criteria\n\n';
  promptText += '- [ ] All models use SQLAlchemy 2.0 `Mapped[]` syntax\n';
  promptText += '- [ ] Schemas use Marshmallow `SQLAlchemyAutoSchema` for ORM integration\n';
  promptText += '- [ ] All services use `db.session` for database operations\n';
  promptText += '- [ ] Blueprints use Marshmallow for request validation and response serialization\n';
  promptText += '- [ ] Authentication decorators applied to protected routes\n';
  promptText += '- [ ] Pagination implemented for list endpoints\n';
  promptText += '- [ ] Soft delete implemented (`deleted_at` column)\n';
  promptText += '- [ ] Type hints on all functions and methods\n';
  promptText += '- [ ] Application factory pattern used (`create_app()`)\n';
  promptText += '- [ ] Extensions initialized in `extensions.py`\n';
  promptText += '- [ ] Error handlers registered globally\n';
  promptText += '- [ ] API responses match documented formats\n';
  promptText += '- [ ] Error responses use proper HTTP status codes\n';
  promptText += '- [ ] No business logic in blueprints\n';
  promptText += '- [ ] All file naming conventions followed\n';
  promptText += '- [ ] Configuration classes for different environments\n\n';

  // ==================== DEPENDENCIES ====================
  promptText += '## Dependencies (requirements.txt)\n\n';
  promptText += '```\n';
  promptText += 'Flask>=3.1.0\n';
  promptText += 'Flask-SQLAlchemy>=3.1.0\n';
  promptText += 'Flask-Migrate>=4.0.0\n';
  promptText += 'Flask-JWT-Extended>=4.7.0\n';
  promptText += 'Flask-CORS>=5.0.0\n';
  promptText += 'Flask-Limiter>=3.8.0\n';
  promptText += 'flask-marshmallow>=1.2.0\n';
  promptText += 'marshmallow>=3.22.0\n';
  promptText += 'marshmallow-sqlalchemy>=1.1.0\n';
  promptText += 'SQLAlchemy>=2.0.35\n';
  if (selectedDatabase.value === 'postgres') {
    promptText += 'psycopg2-binary>=2.9.10\n';
  }
  promptText += 'python-dotenv>=1.0.1\n';
  promptText += 'gunicorn>=23.0.0\n';
  promptText += 'bcrypt>=4.2.0\n';
  promptText += 'email-validator>=2.2.0\n';
  promptText += '```\n\n';

  // ==================== CLOSING INSTRUCTION ====================
  promptText += '---\n\n';
  promptText += '## Implementation Instructions\n\n';
  promptText += '**IMPORTANT: Follow these guidelines:**\n\n';
  promptText += '1. Use application factory pattern for Flask initialization\n';
  promptText += '2. Follow the exact patterns shown in the Code Patterns section\n';
  promptText += '3. Map each entity to its required endpoints and operations\n';
  promptText += '4. Implement entity by entity, completing each fully before moving to the next\n';
  promptText += '5. Ensure all type hints are present\n';
  promptText += '6. Test via `flask run` and manual API testing\n\n';
  promptText += '**Generate all files with complete, production-ready code. The code should be immediately runnable after `pip install -r requirements.txt`, `flask db upgrade`, and proper `.env` setup.**\n';

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
  const projectName = `backend-flask${dbSuffix}`;
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
