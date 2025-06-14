# Push Notification Example Flow

This document shows the complete flow when using push notifications with the deployment monitor.

## Example Scenario

You're deploying a Worker called `api-service` with the following git state:
- Branch: `feature/add-auth`
- Commit: `abc123def456` 
- Message: "Add JWT authentication\n\nImplemented:\n- Token generation\n- Token validation\n- Refresh tokens"
- Author: `dev@example.com`

## Step-by-Step Process

### 1. Build Configuration

In your `api-service` project's `wrangler.toml`:

```toml
[build]
command = "npm run build && node notify-deploy.js"

[env.production]
vars = { ENVIRONMENT = "production" }
```

### 2. Build Process Starts

When you run `wrangler deploy`, the build command executes:

```bash
$ wrangler deploy
⛅️ Building with: npm run build && node notify-deploy.js
```

### 3. Notification Script Executes

The `notify-deploy.js` script runs with access to:

**Environment Variables:**
```
WORKERS_CI=1
WORKERS_CI_BUILD_UUID=build-abc123
WORKERS_CI_COMMIT_SHA=abc123def456789...
WORKERS_CI_BRANCH=feature/add-auth
CI=true
```

**Script Actions:**
```javascript
// Collects deployment info
const deploymentInfo = {
  type: 'worker',
  projectName: 'api-service',
  deploymentId: 'build-abc123',
  branch: 'feature/add-auth',
  commitHash: 'abc123def456789...',
  commitMessage: 'Add JWT authentication\n\nImplemented:\n- Token generation\n- Token validation\n- Refresh tokens',
  author: 'dev@example.com',
  timestamp: '2025-01-15T10:30:45Z',
  environment: 'production',
  isCI: true
};
```

### 4. HTTP Request to Worker

The script sends a POST request:

```http
POST https://deploy-notify.example.workers.dev/notify
Authorization: Bearer your-deploy-notify-token
Content-Type: application/json

{
  "deployment": {
    "type": "worker",
    "projectName": "api-service",
    "deploymentId": "build-abc123",
    "branch": "feature/add-auth",
    "commitHash": "abc123def456789...",
    "commitMessage": "Add JWT authentication\n\nImplemented:\n- Token generation\n- Token validation\n- Refresh tokens",
    "author": "dev@example.com",
    "timestamp": "2025-01-15T10:30:45Z",
    "environment": "production",
    "isCI": true
  }
}
```

### 5. Worker Receives Request

The deployment monitor worker:

1. **Validates Authorization**
   ```typescript
   if (authHeader !== `Bearer ${env.DEPLOY_NOTIFY_TOKEN}`) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```

2. **Checks KV for Duplicates**
   ```typescript
   const isProcessed = await state.isDeploymentProcessed('build-abc123', 'worker');
   if (isProcessed) {
     console.log('Already processed, skipping');
     return;
   }
   ```

3. **Formats Notification**
   ```typescript
   const notification: DeploymentNotification = {
     type: 'worker',
     projectName: 'api-service',
     deploymentId: 'build-abc123',
     branch: 'feature/add-auth',
     commitHash: 'abc123def456789...',
     commitMessage: 'Add JWT authentication\n\nImplemented:\n- Token generation\n- Token validation\n- Refresh tokens',
     // ... other fields
   };
   ```

### 6. Telegram Notification Sent

The formatted message sent to Telegram:

```
⚡ New Worker Deployment

Project: api-service
Environment: 🚀 production
Deployment ID: build-abc123
Author: dev@example.com
Branch: feature/add-auth
Commit: abc123d - Add JWT authentication
Time: Jan 15, 2025, 10:30 AM UTC
```

**Note:** Only the first line of the commit message is shown in the notification.

### 7. KV State Updated

The worker updates KV to prevent duplicate notifications:

```json
{
  "workers": ["deploy-001", "deploy-002", "build-abc123"],
  "pages": ["page-001", "page-002"],
  "lastCheck": "2025-01-15T10:30:45Z"
}
```

### 8. Response to Build Process

The worker responds immediately:

```json
{
  "success": true,
  "message": "Notification queued"
}
```

### 9. Build Continues

The notification script completes, and Wrangler continues with the deployment:

```bash
✅ Deployment notification sent successfully
⛅️ Uploading to Cloudflare Workers...
✅ Deployed api-service
```

## Total Time

- **Push notification**: < 1 second from deployment to Telegram
- **Poll-based**: 0-5 minutes delay (average 2.5 minutes)

## Error Handling

If notification fails:
1. Script logs error but exits with code 0
2. Build continues normally (notification failure doesn't block deployment)
3. Poll-based cron will catch it later as a fallback

## Benefits Over Polling

1. **Instant notifications** - No waiting for next cron run
2. **Full commit messages** - Multi-line messages preserved
3. **Complete git metadata** - All information available at build time
4. **Lower API usage** - No constant polling of Cloudflare API
5. **Better accuracy** - Direct from source, not reconstructed