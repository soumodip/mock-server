# Code Documentation

Generated on: 2025-11-11T21:04:03.850Z

Total files: 22

---

## .env.local

```local
# Server Configuration
NODE_ENV=development
PORT=3002

API_VERSION=1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=postgres

# JWT Configuration
JWT_SECRET=95e7d8102b7ceb4221e0832a7c76d1ff2ecba21ffa20fd62ca3b1020c6ee83d335ad09f8245794ce4cbcec60e001b9c461fbcc22c6bf47761f532ad66086b807
JWT_EXPIRES_IN=24h

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Sentry Configuration (Optional)
SENTRY_DSN=https://4c5483c5264ecd74df3123ac9167ac83@o4509937218813952.ingest.us.sentry.io/4509937220714496

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## .gitignore

```txt
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Claude
.claude
.claude-prompts

# Production build
dist/
build/

# Environment files
.env
.env.local
.env.production
.env.development

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# Database
*.db
*.sqlite

# Uploads
uploads/
temp/
```

---

## README.md

```md
# Franchise India Backend

A comprehensive Node.js/TypeScript backend API for the Franchise India marketplace application, built with industry-standard practices and enterprise-grade architecture.

## 🚀 Features

- **RESTful API** with comprehensive franchise marketplace functionality
- **TypeScript** for type-safe development
- **TypeORM** with PostgreSQL for robust data management
- **JWT Authentication** with role-based access control
- **Email Service** with Gmail SMTP integration
- **Sentry Integration** for error tracking and monitoring
- **Rate Limiting** and security middleware
- **Input Validation** with Joi schemas
- **Admin Panel** with full CRUD operations
- **Lead Management** system
- **Inquiry System** with duplicate prevention

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** JWT
- **Validation:** Joi
- **Email:** Nodemailer
- **Security:** Helmet, CORS, Rate Limiting
- **Logging:** Sentry
- **Environment:** dotenv

## 📋 Prerequisites

- Node.js (v16+ recommended)
- PostgreSQL (v12+ recommended)
- npm or yarn package manager
- Gmail account for SMTP (or other email provider)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Install TypeScript globally if not already installed
npm install -g typescript ts-node-dev
```

### 2. Environment Setup

Copy the `.env.local` file and update the values:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=franchise_india

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Email Configuration
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASSWORD=your_app_specific_password

# Optional: Sentry for error tracking
SENTRY_DSN=your_sentry_dsn
```

### 3. Database Setup

```bash
# Create the database
createdb franchise_india

# Generate and run migrations
npm run migration:generate migrations/InitialSchema
npm run migration:run
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The server will be available at `http://localhost:3000`

## 🔒 Security Features

- **JWT-based authentication** with secure token handling
- **Password hashing** with bcrypt
- **Rate limiting** to prevent abuse
- **CORS protection** with configurable origins
- **Input validation** and sanitization
- **SQL injection prevention** via TypeORM
- **Security headers** with Helmet.js

## 📊 Monitoring & Logging

- **Sentry integration** for error tracking
- **Structured logging** with context information
- **Health check endpoint** for monitoring
- **Database connection monitoring**

## 🚀 Deployment

### Environment Configuration

For production deployment, ensure:

1. **Database**: Use managed PostgreSQL service
2. **Environment Variables**: Set all required environment variables
3. **SSL/HTTPS**: Configure SSL certificates
4. **Process Management**: Use PM2 or similar
5. **Reverse Proxy**: Configure Nginx or similar

### Build Commands

```bash
# Production build
npm run build

# Start production server
npm start

# Run with PM2
pm2 start dist/server.js --name franchise-india-backend
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typeorm` - Run TypeORM CLI commands
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

### Project Structure

```
src/
├── configs/         # Configuration files
├── controllers/     # Route controllers
├── entities/        # TypeORM entities
├── middlewares/     # Express middlewares
├── services/        # Business logic services
├── utils/           # Utility functions
├── validators/      # Joi validation schemas
├── routes.ts        # API route definitions
└── server.ts        # Application entry point
```
```

---

## package.json

```json
{
  "name": "franchise-india-backend",
  "version": "1.0.0",
  "description": "Backend API for Franchise India application",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only --env-file .env.local src/server.ts",
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/configs/database.config.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/configs/database.config.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/configs/database.config.ts"
  },
  "keywords": ["franchise", "marketplace", "nodejs", "typescript", "typeorm"],
  "author": "Franchise India Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "typeorm": "^0.3.17",
    "pg": "^8.11.3",
    "reflect-metadata": "^0.1.13",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "joi": "^17.9.2",
    "nodemailer": "^6.9.4",
    "@sentry/node": "^7.64.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.5.0",
    "@types/bcryptjs": "^2.4.2",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/cors": "^2.8.13",
    "@types/joi": "^17.2.3",
    "@types/nodemailer": "^6.4.9",
    "@types/pg": "^8.10.2",
    "typescript": "^5.1.6",
    "ts-node": "^10.9.1",
    "ts-node-dev": "^2.0.0"
  }
}
```

---

## src/configs/app.config.ts

```ts
export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  api: {
    version: process.env.API_VERSION || '1',
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
};
```

---

## src/configs/database.config.ts

```ts
import { DataSource } from 'typeorm';
import { User } from '../entities/User.entity';
import { Role } from '../entities/Role.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'franchise_india',
  synchronize: false,
  logging: false,
  entities: [
    User,
    Role,
    RefreshToken
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};
```

---

## src/controllers/user.controller.ts

```ts
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';
import { logError } from '../utils/logger.util';

export class UserController {
  private userService = new UserService();

  // Register new user
  register = async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await this.userService.registerUser({
        email,
        password,
        firstName,
        lastName,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });

    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      logError(error as Error, { context: 'User registration failed' });
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  };

  // Login user
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const result = await this.userService.loginUser({
        email,
        password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });

    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      logError(error as Error, { context: 'User login failed' });
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  };

  // Admin login
  adminLogin = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const result = await this.userService.adminLogin({ email, password });

      res.json({
        success: true,
        message: 'Admin login successful',
        data: result
      });

    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      logError(error as Error, { context: 'Admin login failed' });
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  };

  // Get current user profile
  getMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      const result = await this.userService.getUserProfile(userId!);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      logError(error as Error, { context: 'Get user profile failed' });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile'
      });
    }
  };

  // Update user profile
  updateUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { firstName, lastName, email } = req.body;
      const currentUserId = req.user?.id;

      const result = await this.userService.updateUserProfile(
        userId,
        currentUserId!,
        { firstName, lastName, email }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result
      });

    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      logError(error as Error, { context: 'Update user profile failed' });
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  };

  // Get all users (Admin only)
  getUsers = async (req: Request, res: Response) => {
    try {
      const { page, limit, search, role } = req.query;

      const result = await this.userService.getUsers({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        role: role as string
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      logError(error as Error, { context: 'Get users failed' });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  };

  // Get user by ID (Admin only)
  getUserById = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const result = await this.userService.getUserById(userId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      logError(error as Error, { context: 'Get user by ID failed' });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user'
      });
    }
  };
}

```

---

## src/entities/RefreshToken.entity.ts

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  @Index()
  token: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // Helper method to check if token is expired
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Helper method to check if token is valid (not expired and not revoked)
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked;
  }

  // Helper method to revoke token
  revoke(): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
  }
}

```

---

## src/entities/Role.entity.ts

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { User } from './User.entity';

export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Admin permissions
  ADMIN_READ = 'admin:read',
  ADMIN_CREATE = 'admin:create',
  ADMIN_UPDATE = 'admin:update',
  ADMIN_DELETE = 'admin:delete',
  ADMIN_MANAGE_USERS = 'admin:manage_users',
  ADMIN_VIEW_STATS = 'admin:view_stats',
}

export enum RoleName {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column('simple-array')
  permissions: string[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Helper method to check if role has a specific permission
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  // Helper method to add a permission
  addPermission(permission: string): void {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
    }
  }

  // Helper method to remove a permission
  removePermission(permission: string): void {
    this.permissions = this.permissions.filter((p) => p !== permission);
  }
}

```

---

## src/entities/User.entity.ts

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from 'typeorm';
import { Role } from './Role.entity';
import { RefreshToken } from './RefreshToken.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date | null;

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  // Virtual property to get user's full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Helper method to check if user has a specific role
  hasRole(roleName: string): boolean {
    return this.roles.some((role) => role.name === roleName);
  }

  // Helper method to check if user has a specific permission
  hasPermission(permission: string): boolean {
    return this.roles.some((role) => role.permissions.includes(permission));
  }
}

```

---

## src/middlewares/auth.middleware.ts

```ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.util';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has any of the allowed roles
    const hasRole = req.user.roles?.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const requireAdminRole = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.roles?.includes('admin')) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

export const requireUserRole = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.roles?.includes('user') && !req.user.roles?.includes('admin')) {
    return res.status(403).json({
      success: false,
      message: 'User access required'
    });
  }

  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // For now, we'll just check if user has the role that typically has this permission
    // In a full implementation, you'd fetch the user's permissions from the database
    const hasPermission = req.user.roles?.some(role => {
      if (permission.startsWith('admin:')) {
        return role === 'admin';
      }
      return role === 'user' || role === 'admin';
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

```

---

## src/middlewares/common.middleware.ts

```ts
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '../configs/app.config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false,
};

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details?.map((detail: any) => detail.message) || []
    });
  }

  if (error.code === '23505') { // PostgreSQL unique constraint violation
    return res.status(409).json({
      success: false,
      message: 'Resource already exists'
    });
  }

  if (error.code === '23503') { // PostgreSQL foreign key constraint violation
    return res.status(400).json({
      success: false,
      message: 'Invalid reference to related resource'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
};

export const securityMiddlewares = [
  helmet(),
  cors(corsOptions),
  rateLimiter
];
```

---

## src/middlewares/validation.middleware.ts

```ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    req.query = value;
    next();
  };
};
```

---

## src/routes.ts

```ts
import { Router } from 'express';
import { UserController } from './controllers/user.controller';
import { authenticateToken, requireAdminRole, requireUserRole } from './middlewares/auth.middleware';
import { validate, validateQuery } from './middlewares/validation.middleware';
import {
  registerUserSchema,
  loginUserSchema,
  adminLoginSchema,
  updateUserSchema,
  getUsersSchema
} from './validators/user.validator';

const router = Router();

const userController = new UserController();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 
router.post('/api/auth/register', validate(registerUserSchema), userController.register);
router.post('/api/auth/login', validate(loginUserSchema), userController.login);

router.get('/api/users/me', authenticateToken, requireUserRole, userController.getMe);
router.put('/api/users/:userId', authenticateToken, requireUserRole, validate(updateUserSchema), userController.updateUser);

// Admin routes
router.post('/api/admin/auth/login', validate(adminLoginSchema), userController.adminLogin);

router.get('/api/admins/users', authenticateToken, requireAdminRole, validateQuery(getUsersSchema), userController.getUsers);
router.get('/api/admins/users/:userId', authenticateToken, requireAdminRole, userController.getUserById);

export default router;
```

---

## src/seeders/all.sql

```sql

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  permissions TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  "lastLogin" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMP NOT NULL,
  "ipAddress" VARCHAR(45),
  "userAgent" VARCHAR(500),
  "isRevoked" BOOLEAN DEFAULT FALSE,
  "revokedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster token lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_userId ON refresh_tokens("userId");

```

---

## src/server.ts

```ts
import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import { initializeDatabase } from './configs/database.config';
import { config } from './configs/app.config';
import { initializeSentry, logError, logInfo } from './utils/logger.util';
import { securityMiddlewares, errorHandler, notFoundHandler } from './middlewares/common.middleware';
import routes from './routes';

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local' });

const app = express();

// Initialize Sentry for error tracking
// initializeSentry();

// Apply security middlewares
app.use(...securityMiddlewares);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use(`/v${config.api.version}`, routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Server startup function
const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await initializeDatabase();
    logInfo('Database initialized successfully');
    
    // Start the server
    const PORT = config.port;
    app.listen(PORT, () => {
      logInfo(`🚀 Server is running on port ${PORT}`);
      logInfo(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logInfo(`🔗 Health check: http://localhost:${PORT}/api/health`);
      
      console.log('\n=== Franchise India Backend Server ===');
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/v${config.api.version}/health`);
      console.log(`🔐 Admin Panel: http://localhost:${PORT}/v${config.api.version}/admin`);
      console.log('=====================================\n');
      
    });

  } catch (error) {
    logError(error as Error, { context: 'Server startup failed' });
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logInfo('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(error, { context: 'Uncaught exception' });
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(reason as Error, { context: 'Unhandled rejection', promise });
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
```

---

## src/services/user.service.ts

```ts
import { AppDataSource } from '../configs/database.config';
import { User } from '../entities/User.entity';
import { Role, RoleName } from '../entities/Role.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { logError, logInfo } from '../utils/logger.util';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private roleRepository = AppDataSource.getRepository(Role);
  private refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

  async registerUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { email, password, firstName, lastName, ipAddress, userAgent } = data;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw { statusCode: 409, message: 'User already exists with this email' };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Get default user role
    let userRole = await this.roleRepository.findOne({ where: { name: RoleName.USER } });
    if (!userRole) {
      // Create default user role if it doesn't exist
      userRole = this.roleRepository.create({
        name: RoleName.USER,
        description: 'Regular user role',
        permissions: ['user:read', 'user:create', 'user:update']
      });
      userRole = await this.roleRepository.save(userRole);
    }

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roles: [userRole]
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const accessToken = generateToken({
      id: savedUser.id,
      email: savedUser.email,
      roles: savedUser.roles.map(r => r.name)
    });

    const refreshTokenValue = generateRefreshToken({
      id: savedUser.id,
      email: savedUser.email
    });

    // Save refresh token
    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenValue,
      userId: savedUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress,
      userAgent
    });

    await this.refreshTokenRepository.save(refreshToken);

    logInfo('User registered successfully', { userId: savedUser.id, email });

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        roles: savedUser.roles.map(r => r.name)
      },
      accessToken,
      refreshToken: refreshTokenValue
    };
  }

  async loginUser(data: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { email, password, ipAddress, userAgent } = data;

    // Find user with roles
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles']
    });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      roles: user.roles.map(r => r.name)
    });

    const refreshTokenValue = generateRefreshToken({
      id: user.id,
      email: user.email
    });

    // Save refresh token
    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress,
      userAgent
    });

    await this.refreshTokenRepository.save(refreshToken);

    logInfo('User logged in successfully', { userId: user.id, email });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map(r => r.name)
      },
      accessToken,
      refreshToken: refreshTokenValue
    };
  }

  async adminLogin(data: {
    email: string;
    password: string;
  }) {
    const { email, password } = data;

    // Find admin user
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles']
    });

    if (!user || !user.hasRole(RoleName.ADMIN)) {
      throw { statusCode: 401, message: 'Invalid admin credentials' };
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Invalid admin credentials' };
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      roles: user.roles.map(r => r.name)
    });

    logInfo('Admin logged in successfully', { userId: user.id, email });

    return {
      admin: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map(r => r.name)
      },
      token
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        roles: user.roles.map(r => ({
          name: r.name,
          description: r.description,
          permissions: r.permissions
        })),
        createdAt: user.createdAt
      }
    };
  }

  async updateUserProfile(userId: string, currentUserId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    const { firstName, lastName, email } = data;

    // Check if user is updating their own profile
    if (userId !== currentUserId) {
      throw { statusCode: 403, message: 'You can only update your own profile' };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw { statusCode: 409, message: 'Email already in use' };
      }
      user.email = email;
      user.emailVerified = false; // Reset email verification
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    const updatedUser = await this.userRepository.save(user);

    logInfo('User profile updated', { userId: updatedUser.id });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        emailVerified: updatedUser.emailVerified
      }
    };
  }

  async getUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const { page = 1, limit = 10, search, role } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(Number(limit));

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (role) {
      queryBuilder.andWhere('roles.name = :role', { role });
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        roles: user.roles.map(r => r.name),
        createdAt: user.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        roles: user.roles.map(r => ({
          name: r.name,
          description: r.description,
          permissions: r.permissions
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  }
}

```

---

## src/utils/jwt.util.ts

```ts
import jwt from 'jsonwebtoken';
import { config } from '../configs/app.config';

export interface JwtPayload {
  id: string;
  email: string;
  roles: string[];
}

export interface RefreshTokenPayload {
  id: string;
  email: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d',
  });
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
```

---

## src/utils/logger.util.ts

```ts
import * as Sentry from '@sentry/node';
import { config } from '../configs/app.config';

export const initializeSentry = (): void => {
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    
    console.log('Sentry initialized successfully');
  } else {
    console.warn('Sentry DSN not configured. Error tracking is disabled.');
  }
};

export const logError = (error: Error, context?: any): void => {  
  if (config.sentry.dsn) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional_info', context);
      }
      Sentry.captureException(error);
    });
  }
};

export const logInfo = (message: string, extra?: any): void => {  
  if (config.sentry.dsn) {
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: extra,
    });
  }
};

export const logWarning = (message: string, extra?: any): void => {  
  if (config.sentry.dsn) {
    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: extra,
    });
  }
};

export { Sentry };
```

---

## src/utils/password.util.ts

```ts
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
```

---

## src/validators/user.validator.ts

```ts
import Joi from 'joi';

export const registerUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    }),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required()
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).optional(),
  lastName: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional()
});

export const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
  role: Joi.string().optional()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

