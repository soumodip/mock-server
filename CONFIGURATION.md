# Configuration

This document explains how to configure Mock Server for your needs.

## Environment Variables

Mock Server uses a `.env` file for configuration. Here's the default setup:

```env
PORT=4001
BASE_URI=http://localhost:4001

IS_AUTH=false
AUTH_JWT_SECRET=your_jwt_secret_key
AUTH_JWT_EXPIRES_IN=1h
```

### Authentication Settings

#### Enabling Authentication

When you set `IS_AUTH=true`, authentication is enabled and users will be redirected to the `/auth` page for login.

#### Setting Up Users

You can configure custom usernames and passwords in `/data/auth.json`:

```json
[
    {
        "username": "username",
        "password": "password",
        "isActive": true
    }
]
```

**Note**: If `isActive` is set to `false`, that user account will be disabled and cannot be used for login.

## Data Storage

Mock Server stores all your data in JSON files and databases located in the `/data` directory:

### APIs, Objects, and Projects

All main entities like APIs, Objects, and Projects are stored in their respective JSON files:

- **APIs**: `/data/apis.json`
- **Objects**: `/data/objects.json`
- **Projects**: `/data/projects.json`

These files maintain the structure and configuration of your mock server setup.

### Integrations

Integrations are stored in a SQLite database: `/data/integrations.db`

#### How Integrations Work

1. **Select a Project**: First, you need to select a project to work with
2. **Create an Integration**: Integrations can be created as either:
   - Full page integration
   - Embedded integration
3. **Customize Responses**: Think of integrations like a documentation page, but with the ability to customize the response for every API in every session you run

Each integration is tied to a project and allows you to test and document your APIs with real-time response customization.

### Docs Mode

#### Enabling Docs Mode

When you set `IS_DOCS_MODE=true`, the entire application switches to a read-only documentation mode. Every page automatically redirects to your primary docs integration — the one marked as full-page and primary in your integrations setup.

```env
# Docs mode - when true, redirects all pages to the primary docs integration
IS_DOCS_MODE=false
```

#### What Happens When Docs Mode is Enabled

1. **All pages redirect**: Any visitor hitting any route gets redirected to `/docs/{projectId}/{integrationId}` — your primary docs integration
2. **All mutations are blocked**: Every write operation (POST, PUT, PATCH, DELETE) across projects, APIs, objects, integrations, webhooks, and settings returns a `403` error
3. **Read-only access only**: The server essentially becomes a static documentation site backed by your mock data

#### When to Use This

This is designed for **production documentation deployments** — when you want to host your API docs publicly without exposing any editing capabilities. Think of it as flipping the switch from "workspace" to "published docs".

**Note**: You must have at least one integration configured as both `isPrimaryDocs` and `expandToFullPage` for the redirect to work. Without it, the redirect has nowhere to go.

### Data Reset Mode

#### Enabling Automatic Data Reset

When you set `IS_DATA_RESET_MODE=true`, the server automatically deletes projects (and all their associated data) after a configured time interval. This turns your Mock Server into a self-cleaning sandbox.

```env
# Data reset interval in milliseconds (default: 1 hour = 3600000ms)
# Set to 0 to disable auto data reset
IS_DATA_RESET_MODE=false
DATA_RESET_INTERVAL_MS=3600000
```

#### What Happens When Data Reset is Enabled

1. **Background cleanup starts**: On server startup, a background job begins checking for expired projects every 60 seconds
2. **Projects expire based on age**: Any project whose `createdAt` timestamp is older than `DATA_RESET_INTERVAL_MS` gets flagged for deletion
3. **Cascade deletion**: When a project is deleted, everything tied to it goes with it — APIs, objects, integrations, sessions, session responses, webhooks, and webhook logs
4. **Frontend countdown**: Users see a live countdown timer showing how much time their project has left before it's wiped
5. **Deletion notification**: When a user's active project is deleted, they're shown a modal informing them the data has been reset

#### Configuration Examples

| Interval | `DATA_RESET_INTERVAL_MS` | Use Case |
|----------|--------------------------|----------|
| 2 minutes | `120000` | Quick demos and testing |
| 30 minutes | `1800000` | Workshop environments |
| 1 hour | `3600000` | Standard sandbox (default) |
| 24 hours | `86400000` | Daily cleanup |

#### When to Use This

This is designed for **sandbox and demo deployments** — when you want users to experiment freely but need the environment to clean itself up automatically. Set `IS_DATA_RESET_MODE=true` with an interval that matches your use case, and the server handles the rest.

**Note**: Both `IS_DATA_RESET_MODE` must be `true` and `DATA_RESET_INTERVAL_MS` must be greater than `0` for the cleanup to activate. Setting either to its disabled state turns off auto-reset entirely.

## Port Configuration

By default, Mock Server runs on port `4001`. You can change this by modifying the `PORT` variable in your `.env` file.

## JWT Configuration

If authentication is enabled, configure your JWT settings:

- **AUTH_JWT_SECRET**: Your secret key for signing JWT tokens (change this to a secure random string)
- **AUTH_JWT_EXPIRES_IN**: Token expiration time (default: 1 hour)
