# Deployment Notification Setup Guide

This guide will help you set up the Cloudflare Worker that receives deployment notifications and sends them to Telegram.

## Prerequisites

1. A Cloudflare account with Workers and Pages projects
2. A Telegram bot (created via BotFather)
3. Node.js and npm installed

## Step 1: Create a Telegram Bot

1. Open Telegram and search for @BotFather
2. Send `/newbot` and follow the prompts
3. Save the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. Get your chat ID:
   - Send a message to your bot
   - Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find the `chat.id` value in the response

## Step 2: Generate a Secure Token

Generate a secure token for authenticating incoming notifications:

```bash
# Generate a random token
openssl rand -hex 32

# Or use any password generator
```

Save this token securely - you'll need it for both the worker configuration and your deployment scripts.

## Step 3: Configure the Worker

1. Clone this repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a KV namespace:
   ```bash
   wrangler kv:namespace create "DEPLOYMENT_STATE"
   ```
   Copy the generated ID and update `wrangler.jsonc` with the actual KV namespace ID.

3. Update `wrangler.jsonc`:
   - Replace `deployment_state_kv_id` with the KV namespace ID from step 2

4. Set secrets:
   ```bash
   wrangler secret put DEPLOY_NOTIFY_TOKEN
   wrangler secret put TELEGRAM_BOT_TOKEN
   wrangler secret put TELEGRAM_CHAT_ID
   ```

## Step 4: Deploy

1. Generate TypeScript types:
   ```bash
   npm run cf-typegen
   ```

2. Deploy the worker:
   ```bash
   npm run deploy
   ```

## Step 5: Set Up Your Projects

Install the npm package in your projects:

```bash
npm install -g wrangler-deploy-notify
```

Configure environment variables:

```bash
export DEPLOY_NOTIFY_URL=https://deploy-notify.<YOUR_SUBDOMAIN>.workers.dev
export DEPLOY_NOTIFY_TOKEN=<YOUR_DEPLOY_NOTIFY_TOKEN>
```

Deploy with notifications:

```bash
wrangler-deploy-notify --env production
```

## Configuration Options

### Monitor Specific Projects

To monitor only specific projects, add these to `wrangler.jsonc`:

```json
"vars": {
  "CLOUDFLARE_ACCOUNT_ID": "your_account_id",
  "WORKER_PROJECTS": "api,web-app,auth-service",
  "PAGE_PROJECTS": "marketing-site,blog,docs"
}
```


## Troubleshooting

1. **No notifications received**:
   - Check worker logs: `wrangler tail`
   - Verify Telegram bot token and chat ID
   - Ensure the bot has sent at least one message to the chat

2. **Authentication errors**:
   - Verify DEPLOY_NOTIFY_TOKEN matches in both worker and client
   - Check the Authorization header format: `Bearer <token>`

3. **KV errors**:
   - Ensure KV namespace is created and ID is correct in `wrangler.jsonc`

## Message Format

The bot sends formatted messages with:
- Deployment type (Worker/Pages)
- Project name
- Environment (production/preview)
- Author email
- Timestamp
- Direct link to deployment (for Pages)
- Branch and commit info (for Pages)
- Deployment message and tag (for Workers)
- Rollback information if applicable

## Adding Git Commit Information to Deployments

### For Workers

Since the Cloudflare Workers API doesn't directly expose git commit information, you need to include it manually in the deployment message:

1. **Manual deployment with message:**
   ```bash
   # Simple message
   wrangler deploy --message "Fix authentication bug"
   
   # With git info format (branch@hash: message)
   wrangler deploy --message "main@abc1234: Fix authentication bug"
   ```

2. **Automated CI/CD deployment:**
   ```bash
   # In your GitHub Actions or CI/CD pipeline
   # Note: Only the first line of commit message is used to avoid issues with multi-line commits
   COMMIT_MSG=$(git log -1 --pretty=format:"%s" | head -n1)
   COMMIT_HASH=$(git rev-parse --short HEAD)
   BRANCH=$(git branch --show-current)
   
   wrangler deploy --message "${BRANCH}@${COMMIT_HASH}: ${COMMIT_MSG}"
   ```

3. **Using version tags:**
   ```bash
   wrangler versions upload --tag "v1.2.3"
   ```

**Important Notes:**
- Only the first line of multi-line commit messages is captured
- The deployment message has a character limit, so very long commit messages will be truncated
- This is a workaround since the Workers API doesn't expose git metadata directly

### For Pages

Pages deployments automatically include git information when connected to a git repository. The deployment will include:
- Branch name
- Commit hash
- Commit message

### Unified Display Format

Both Worker and Pages deployments now display git information in the same format:
- **Commit:** `abc1234` - Fix authentication bug

This makes it easy to track what changes were deployed across both Workers and Pages projects.