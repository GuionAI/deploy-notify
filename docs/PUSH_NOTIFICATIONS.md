# Push-Based Deployment Notifications

This document explains how the push notification system works for receiving deployment notifications.

## Overview

With push notifications, your build process sends deployment information directly to the monitor worker, providing:
- **Instant notifications** - No 2-minute delay
- **Full git information** - Access to all git data during build
- **Lower resource usage** - No constant polling
- **More accurate data** - Direct from the source

## Setup Guide

### 1. Configure Environment Variables

In your project that will send notifications:

```bash
# .env or CI/CD secrets
DEPLOY_NOTIFY_URL=https://deploy-notify.YOUR-SUBDOMAIN.workers.dev
DEPLOY_NOTIFY_TOKEN=your-secure-token-here
```

### 2. Update Build Configuration

#### For Cloudflare Workers

In your `wrangler.toml` or `wrangler.json`:

```toml
[build]
command = "npm run build && npx wrangler-deploy-notify"
```

Or if using npm scripts in `package.json`:

```json
{
  "scripts": {
    "build": "your-build-command",
    "deploy": "npm run build && wrangler-deploy-notify",
    "deploy:production": "wrangler-deploy-notify --env production"
  }
}
```

#### For GitHub Actions

```yaml
- name: Build and Deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    DEPLOY_NOTIFY_URL: ${{ secrets.DEPLOY_NOTIFY_URL }}
    DEPLOY_NOTIFY_TOKEN: ${{ secrets.DEPLOY_NOTIFY_TOKEN }}
  run: |
    npm run build
    npx wrangler-deploy-notify --env production
```

### 3. Use the NPM Package

Install and use the `wrangler-deploy-notify` package:

```bash
# Install globally or as a dev dependency
npm install -g wrangler-deploy-notify

# Or for project-specific installation
npm install --save-dev wrangler-deploy-notify
```

## How It Works

### Build Time Flow

1. **Build starts** with git information available
2. **Script runs** during build process
3. **Collects data**:
   - Git commit hash (full)
   - Git branch
   - Full commit message (multi-line supported)
   - Author email
   - Build UUID
   - Environment variables
4. **Sends POST request** to `/notify` endpoint
5. **Worker processes** immediately and sends Telegram notification

### Data Sent to Worker

```json
{
  "deployment": {
    "type": "worker",
    "projectName": "api-service",
    "deploymentId": "build-uuid-123",
    "branch": "main",
    "commitHash": "abc123def456...",
    "commitMessage": "Fix authentication bug\n\nThis commit addresses:\n- Session timeout issues\n- Token validation",
    "author": "dev@example.com",
    "timestamp": "2025-01-15T10:00:00Z",
    "environment": "production",
    "tag": "v1.2.3",
    "isCI": true
  }
}
```

## Environment Variables Available

When using Workers Builds, these variables are automatically available:

| Variable | Description | Example |
|----------|-------------|---------|
| `WORKERS_CI` | Set to "1" in Workers Builds | `1` |
| `WORKERS_CI_BUILD_UUID` | Unique build identifier | `abc123-def456` |
| `WORKERS_CI_COMMIT_SHA` | Git commit hash | `abc123def456...` |
| `WORKERS_CI_BRANCH` | Git branch name | `main` |
| `CI` | Standard CI indicator | `true` |


## Security

The `/notify` endpoint requires authentication:

```bash
Authorization: Bearer YOUR_DEPLOY_NOTIFY_TOKEN
```

This can be:
- A separate token (`DEPLOY_NOTIFY_TOKEN`)
- The same as your Cloudflare API token (fallback)

## Testing

Test the push notification locally:

```bash
# Set environment variables
export DEPLOY_NOTIFY_URL=https://deploy-notify.YOUR-SUBDOMAIN.workers.dev
export DEPLOY_NOTIFY_TOKEN=your-token

# Deploy with notifications
wrangler-deploy-notify
```

Or test with curl:

```bash
curl -X POST https://deploy-notify.YOUR-SUBDOMAIN.workers.dev/notify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deployment": {
      "type": "worker",
      "projectName": "test-project",
      "deploymentId": "test-123",
      "branch": "main",
      "commitHash": "abc123",
      "commitMessage": "Test deployment",
      "author": "test@example.com"
    }
  }'
```

## Troubleshooting

1. **No notification received**:
   - Check `DEPLOY_NOTIFY_TOKEN` is set
   - Verify worker URL is correct
   - Check worker logs: `wrangler tail`

2. **Build fails**:
   - The script exits with code 0 even on error
   - Check console output for error messages

3. **Duplicate notifications**:
   - KV deduplication prevents duplicates
   - Check if both push and poll are triggering