# wrangler-deploy-notify

Deploy to Cloudflare Workers with automatic deployment notifications. This package wraps `wrangler deploy` and sends deployment information to a notification service.

## Features

- 🚀 Wraps `wrangler deploy` with all its options
- 📤 Sends deployment notifications with git information
- 🔧 Configurable via CLI arguments or environment variables
- 📦 Can be used as a CLI tool or programmatically
- 🎯 Automatic git information extraction
- ⚡ Zero configuration needed (uses env vars)

## Installation

```bash
# Global installation
npm install -g wrangler-deploy-notify

# Or as a dev dependency
npm install --save-dev wrangler-deploy-notify
```

## Quick Start

### Using Environment Variables

```bash
# Set up once
export DEPLOY_NOTIFY_URL=https://deploy-notify.your-domain.workers.dev
export DEPLOY_NOTIFY_TOKEN=your-secret-token

# Deploy with automatic notifications
wrangler-deploy-notify
```

### Using CLI Arguments

```bash
wrangler-deploy-notify \
  --notify-url https://deploy-notify.your-domain.workers.dev \
  --notify-token your-secret-token \
  --env production
```

### Short Command Alias

The package also provides a shorter `wdn` command:

```bash
wdn --env production
```

## CLI Options

All standard `wrangler deploy` options are supported, plus:

| Option | Description |
|--------|-------------|
| `--notify-url <url>` | URL of the deployment notification service |
| `--notify-token <token>` | Authentication token for notifications |
| `--skip-notification` | Skip sending notification |
| `--project-name <name>` | Override project name detection |
| `--tag <tag>` | Add a tag to the deployment |
| `--verbose` | Show verbose output |

### Wrangler Options

| Option | Description |
|--------|-------------|
| `--env <environment>` | Environment to deploy to |
| `--dry-run` | Build but don't deploy |
| `--compatibility-date <date>` | Compatibility date |
| `--compatibility-flags <flag>` | Compatibility flags (repeatable) |
| `--config <path>` | Path to wrangler config file |
| `--var <key:value>` | Variables to pass to deployment |

## Programmatic Usage

```javascript
import { deployWithNotification } from 'wrangler-deploy-notify';

await deployWithNotification({
  notifyUrl: 'https://deploy-notify.your-domain.workers.dev',
  notifyToken: 'your-secret-token',
  env: 'production',
  vars: {
    API_KEY: 'secret123',
    DEBUG: 'true'
  }
});
```

## Package.json Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "deploy": "wrangler-deploy-notify",
    "deploy:staging": "wrangler-deploy-notify --env staging",
    "deploy:production": "wrangler-deploy-notify --env production --tag v$npm_package_version"
  }
}
```

## GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy with notifications
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          DEPLOY_NOTIFY_URL: ${{ secrets.DEPLOY_NOTIFY_URL }}
          DEPLOY_NOTIFY_TOKEN: ${{ secrets.DEPLOY_NOTIFY_TOKEN }}
        run: npx wrangler-deploy-notify --env production
```

## What Gets Sent

The notification includes:

- Project name (auto-detected from package.json or wrangler.toml)
- Git branch
- Git commit hash (full)
- Git commit message (full, including multi-line)
- Author email
- Timestamp
- Environment
- Tag (if specified)
- CI detection

Example notification payload:

```json
{
  "deployment": {
    "type": "worker",
    "projectName": "my-api",
    "deploymentId": "deploy-1234567890",
    "branch": "main",
    "commitHash": "abc123def456789...",
    "commitMessage": "Add user authentication\n\nImplemented JWT tokens...",
    "author": "dev@example.com",
    "timestamp": "2025-01-15T10:30:00Z",
    "environment": "production",
    "tag": "v1.2.3",
    "isCI": true
  }
}
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DEPLOY_NOTIFY_URL` | Default notification service URL |
| `DEPLOY_NOTIFY_TOKEN` | Default authentication token |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (for wrangler) |

### Auto-Detection

The package automatically detects:

- **Project name** from (in order):
  1. `--project-name` argument
  2. `package.json` name field
  3. `wrangler.toml` name field
  4. `CLOUDFLARE_PROJECT_NAME` env var

- **Git information** using git commands
- **CI environment** from `CI` or `WORKERS_CI` env vars

## Error Handling

- Deployment failures will exit with code 1
- Notification failures will log a warning but won't fail the deployment
- Git detection failures will use fallback values

## License

MIT