# NPM Package Integration Guide

This guide explains how to use the `wrangler-deploy-notify` npm package to add deployment notifications to your Cloudflare Workers projects.

## What is wrangler-deploy-notify?

It's a drop-in replacement for `wrangler deploy` that:
1. Runs the standard wrangler deployment
2. Automatically sends a notification with full git information

## Installation

### Global Installation (Recommended for CLI use)

```bash
npm install -g wrangler-deploy-notify
```

### Project Installation (Recommended for CI/CD)

```bash
npm install --save-dev wrangler-deploy-notify
```

## Configuration

### 1. Set up the notification service

First, deploy the deploy-notify worker (see main README).

### 2. Configure environment variables

```bash
# Required
export DEPLOY_NOTIFY_URL=https://deploy-notify.YOUR-SUBDOMAIN.workers.dev
export DEPLOY_NOTIFY_TOKEN=your-secure-token

# Also needed for wrangler
export CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

## Usage Examples

### Basic Usage

Replace `wrangler deploy` with `wrangler-deploy-notify`:

```bash
# Before
wrangler deploy

# After
wrangler-deploy-notify
```

### With Environment

```bash
# Deploy to staging
wrangler-deploy-notify --env staging

# Deploy to production with tag
wrangler-deploy-notify --env production --tag v1.2.3
```

### Package.json Scripts

```json
{
  "scripts": {
    "deploy": "wrangler-deploy-notify",
    "deploy:staging": "wrangler-deploy-notify --env staging",
    "deploy:production": "wrangler-deploy-notify --env production --tag v$npm_package_version"
  }
}
```

### Programmatic Usage

```javascript
const { deployWithNotification } = require('wrangler-deploy-notify');

async function deployMyWorker() {
  await deployWithNotification({
    env: 'production',
    tag: 'v1.2.3',
    vars: {
      API_KEY: 'secret',
      DEBUG: 'false'
    }
  });
}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Deploy with notifications
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    DEPLOY_NOTIFY_URL: ${{ secrets.DEPLOY_NOTIFY_URL }}
    DEPLOY_NOTIFY_TOKEN: ${{ secrets.DEPLOY_NOTIFY_TOKEN }}
  run: npx wrangler-deploy-notify --env production
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - npx wrangler-deploy-notify --env production
  variables:
    CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN
    DEPLOY_NOTIFY_URL: $DEPLOY_NOTIFY_URL
    DEPLOY_NOTIFY_TOKEN: $DEPLOY_NOTIFY_TOKEN
```

### CircleCI

```yaml
- run:
    name: Deploy to Cloudflare
    command: npx wrangler-deploy-notify --env production
    environment:
      CLOUDFLARE_API_TOKEN: << parameters.cloudflare_api_token >>
      DEPLOY_NOTIFY_URL: << parameters.deploy_notify_url >>
      DEPLOY_NOTIFY_TOKEN: << parameters.deploy_notify_token >>
```

## Advanced Features

### Skip Notification

```bash
# Deploy without sending notification
wrangler-deploy-notify --skip-notification
```

### Custom Project Name

```bash
# Override auto-detected project name
wrangler-deploy-notify --project-name my-custom-name
```

### Dry Run

```bash
# Build but don't deploy (also skips notification)
wrangler-deploy-notify --dry-run
```

### Verbose Output

```bash
# See what's happening
wrangler-deploy-notify --verbose
```

## What Information is Sent?

The package automatically collects and sends:

- **Project name** (from package.json or wrangler.toml)
- **Git branch** (current branch)
- **Git commit hash** (full SHA)
- **Git commit message** (complete, including multi-line)
- **Author email** (from git)
- **Timestamp**
- **Environment** (from --env flag)
- **Tag** (if specified)
- **CI detection** (automatically detects CI environment)

## Comparison with Manual Integration

### Before (Manual Integration)

```bash
# Complex bash script to get git info
BRANCH=$(git branch --show-current)
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=format:'%s' | head -n1)

# Deploy with limited info in message
wrangler deploy --message "${BRANCH}@${COMMIT_HASH}: ${COMMIT_MSG}"
```

### After (With Package)

```bash
# Simple command with full git info
wrangler-deploy-notify
```

## Troubleshooting

### No notification received

1. Check environment variables are set:
   ```bash
   echo $DEPLOY_NOTIFY_URL
   echo $DEPLOY_NOTIFY_TOKEN
   ```

2. Use verbose mode to see what's happening:
   ```bash
   wrangler-deploy-notify --verbose
   ```

3. Check the worker logs:
   ```bash
   wrangler tail deploy-notify
   ```

### Deployment fails

The package passes through all wrangler errors. Check:
- Cloudflare API token is valid
- Wrangler configuration is correct
- Build process succeeds

### Notification fails but deployment succeeds

This is by design. Notification failures don't block deployments. Check:
- Notification URL is correct
- Authentication token is valid
- Worker is deployed and running

## Migration Guide

### From wrangler deploy

1. Install the package:
   ```bash
   npm install -g wrangler-deploy-notify
   ```

2. Set environment variables:
   ```bash
   export DEPLOY_NOTIFY_URL=...
   export DEPLOY_NOTIFY_TOKEN=...
   ```

3. Replace commands:
   - `wrangler deploy` → `wrangler-deploy-notify`
   - `wrangler deploy --env staging` → `wrangler-deploy-notify --env staging`

### From custom scripts

Replace your deployment scripts with the package:

```javascript
// Before: Custom script with manual git detection
const { execSync } = require('child_process');
const branch = execSync('git branch --show-current').toString().trim();
// ... lots of code ...

// After: Just use the package
const { deployWithNotification } = require('wrangler-deploy-notify');
await deployWithNotification();
```

## Best Practices

1. **Use environment variables** for configuration (not CLI args)
2. **Add to package.json scripts** for consistency
3. **Use --tag** for production releases
4. **Enable verbose mode** in CI/CD for debugging
5. **Test with --dry-run** first

## Security

- Never commit tokens to source control
- Use CI/CD secrets for sensitive values
- The notification token should be different from your Cloudflare API token
- Notification endpoint is authenticated to prevent spam