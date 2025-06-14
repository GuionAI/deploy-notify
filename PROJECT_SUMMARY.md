# Deploy-Notify Project Summary

## Overview
Push-based deployment notification system for Cloudflare Workers/Pages that sends Telegram notifications.

## Architecture
1. **Notification Worker** (`deploy-notify`)
   - Receives POST requests at `/notify` endpoint
   - Authenticates via Bearer token (`DEPLOY_NOTIFY_TOKEN`)
   - Sends formatted Telegram messages
   - Uses KV storage for deduplication

2. **NPM Package** (`wrangler-deploy-notify`)
   - Wraps `wrangler deploy` command
   - Extracts git info (branch, commit, message, author)
   - Sends deployment data to notification worker
   - CLI usage: `wrangler-deploy-notify` or `wdn`

## Key Features
- No polling - pure push notifications
- Git commit info included in notifications
- Supports Workers and Pages deployments
- Bearer token authentication
- Deployment deduplication via KV

## Setup Flow
1. Deploy worker with KV namespace
2. Set secrets: `DEPLOY_NOTIFY_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
3. Install npm package: `npm install -g wrangler-deploy-notify`
4. Set environment variables:
   ```bash
   export DEPLOY_NOTIFY_URL=https://deploy-notify.YOUR.workers.dev
   export DEPLOY_NOTIFY_TOKEN=your-token
   ```
5. Deploy with: `wrangler-deploy-notify --env production`

## Authentication
- Same token (`DEPLOY_NOTIFY_TOKEN`) used on both sides
- Generate with: `openssl rand -hex 32`
- Worker validates: `Authorization: Bearer <token>`

## Publishing NPM Package
```bash
npm run publish:patch -- --otp=YOUR_OTP  # Bug fixes
npm run publish:minor -- --otp=YOUR_OTP  # New features
npm run publish:major -- --otp=YOUR_OTP  # Breaking changes
```

## Project Evolution
1. Started with dual polling + push system
2. Added git commit info parsing for Workers
3. Created npm package for easy integration
4. Removed all polling logic - now push-only
5. Published to npm as `wrangler-deploy-notify`