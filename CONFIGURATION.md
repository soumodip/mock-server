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

## Port Configuration

By default, Mock Server runs on port `4001`. You can change this by modifying the `PORT` variable in your `.env` file.

## JWT Configuration

If authentication is enabled, configure your JWT settings:

- **AUTH_JWT_SECRET**: Your secret key for signing JWT tokens (change this to a secure random string)
- **AUTH_JWT_EXPIRES_IN**: Token expiration time (default: 1 hour)
