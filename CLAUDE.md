# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers project called `deploy-notify` that receives deployment notifications via push and sends them to Telegram.

## Development Commands

```bash
# Install dependencies
npm install

# Start local development server (port 8787)
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# Run tests
npm run test

# Generate TypeScript types for Cloudflare bindings
npm run cf-typegen

# View live logs
wrangler tail

# Create KV namespace
wrangler kv:namespace create "DEPLOYMENT_STATE"

# Set secrets
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

## Architecture

### Core Services (`src/services/`)
- **TelegramService**: Sends formatted notifications to Telegram
- **StateService**: Manages deployment state in KV to prevent duplicates

### Utilities (`src/utils/`)
- **MessageFormatter**: Creates formatted Telegram messages with deployment details

### Main Worker (`src/index.ts`)
- Push notification endpoint at `/notify` (requires auth)
- Health check endpoint at `/health`

### Configuration
- **wrangler.jsonc**: Worker config with KV namespace
- **Environment variables**: Optional project filters
- **Secrets**: Authentication token and Telegram credentials

## Key Implementation Details

1. **State Persistence**: Uses KV to track processed deployments, preventing duplicate notifications. Automatically trims old entries to prevent unbounded growth.

2. **Push-based Architecture**: Receives deployment info via POST requests from build processes.

3. **Error Handling**: Sends error notifications to Telegram if processing fails.

4. **Project Filtering**: Optional `WORKER_PROJECTS` and `PAGE_PROJECTS` env vars to monitor specific projects only.

5. **Message Formatting**: HTML-formatted messages with deployment details, emojis, and clickable links.

6. **Authentication**: Uses bearer token authentication for incoming requests.

## Testing Strategy

- **Unit tests** for services with mocked dependencies
- **Mock KV namespace** implementation for state service tests
- **Mock fetch** for external API calls
- Test files in `test/services/` and `test/utils/`

## Deployment Checklist

1. Create KV namespace and update ID in `wrangler.jsonc`
2. Set all required secrets (see SETUP.md)
3. Run `npm run cf-typegen` before deploying
4. Deploy with `npm run deploy`
5. Configure client projects with npm package
6. Test by deploying a project with notifications enabled