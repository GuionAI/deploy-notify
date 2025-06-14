# Deploy Notify

A Cloudflare Worker that receives deployment notifications and sends them to Telegram.

## Features

- 📱 Sends real-time deployment notifications to Telegram
- ⚡ Instant push-based notifications from your build process
- 🎯 Optional project filtering to monitor specific projects only
- 💾 Persistent state tracking to prevent duplicate notifications
- 🛡️ Secure with bearer token authentication
- 🔄 Full git commit information (branch, hash, complete message)
- 🏷️ Support for version tags and deployment metadata

## Quick Start

### Option 1: Use the NPM Package (Easiest)

```bash
# Install globally
npm install -g wrangler-deploy-notify

# Set environment variables
export DEPLOY_NOTIFY_URL=https://deploy-notify.YOUR-SUBDOMAIN.workers.dev
export DEPLOY_NOTIFY_TOKEN=your-secure-token

# Deploy with automatic notifications
wrangler-deploy-notify --env production
```

### Option 2: Deploy the Worker Manually

1. **Clone and install dependencies:**
   ```bash
   git clone <repository>
   cd deploy-notify
   npm install
   ```

2. **Create a KV namespace:**
   ```bash
   wrangler kv:namespace create "DEPLOYMENT_STATE"
   ```

3. **Configure `wrangler.jsonc`:**
   - Update the KV namespace ID with the one created above

4. **Set secrets:**
   ```bash
   wrangler secret put DEPLOY_NOTIFY_TOKEN
   wrangler secret put TELEGRAM_BOT_TOKEN
   wrangler secret put TELEGRAM_CHAT_ID
   ```

5. **Deploy:**
   ```bash
   npm run deploy
   ```

See [SETUP.md](./SETUP.md) for detailed setup instructions and [AUTHENTICATION.md](./docs/AUTHENTICATION.md) for token generation.

## Configuration

### Environment Variables

- `WORKER_PROJECTS` (optional) - Comma-separated list of Worker names to monitor
- `PAGE_PROJECTS` (optional) - Comma-separated list of Pages projects to monitor

### Secrets

- `DEPLOY_NOTIFY_TOKEN` - Bearer token for authenticating incoming notifications
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_CHAT_ID` - Telegram chat ID for notifications

## Development

```bash
# Start local development server
npm run dev

# Run tests
npm run test

# Type check
npx tsc --noEmit

# View logs
wrangler tail
```

## Architecture

The worker consists of:
- **Push notification handler** - Receives deployment info via POST requests
- **TelegramService** - Sends formatted notifications
- **StateService** - Manages deployment state in KV storage to prevent duplicates
- **MessageFormatter** - Creates user-friendly notification messages

## API Endpoints

- `GET /` - Returns status message
- `GET /health` - Health check endpoint
- `POST /notify` - Receives deployment notifications (requires Authorization header)

## Notification Format

Notifications are sent in a unified format for both Workers and Pages:

```
⚡ New Worker Deployment

Project: api-worker
Environment: 🚀 production
Deployment ID: deploy-123abc
Author: dev@example.com
Branch: main
Commit: abc1234 - Fix authentication bug
Tag: v1.2.3
Time: Jan 15, 2025, 10:00 AM UTC
```

## How It Works

1. **Your build process** sends deployment information to the worker
2. **Worker receives** the notification via POST request
3. **Deduplication** check using KV storage
4. **Telegram notification** sent with formatted deployment details

## CI/CD Integration

Using the npm package:

```yaml
- name: Deploy with Notifications
  env:
    DEPLOY_NOTIFY_URL: ${{ secrets.DEPLOY_NOTIFY_URL }}
    DEPLOY_NOTIFY_TOKEN: ${{ secrets.DEPLOY_NOTIFY_TOKEN }}
  run: npx wrangler-deploy-notify --env production
```

See the [wrangler-deploy-notify package](./packages/wrangler-deploy-notify) for a complete solution that combines deployment and notifications.

See [docs/NPM_PACKAGE_GUIDE.md](./docs/NPM_PACKAGE_GUIDE.md) for detailed integration instructions.

## License

MIT