# Authentication Guide

The deployment notification worker uses Bearer token authentication to secure the `/notify` endpoint.

## Generating a Secure Token

### Option 1: Command Line (Recommended)

```bash
# Using OpenSSL (available on most systems)
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"

# Using /dev/urandom (Linux/Mac)
cat /dev/urandom | head -c 32 | base64
```

### Option 2: Online Generators

Use a reputable password generator to create a long, random string (32+ characters).

### Option 3: Using Cloudflare Workers Secrets

While Cloudflare doesn't provide a built-in token generation service, you can generate one using a Worker:

```javascript
// One-time token generator worker
export default {
  async fetch(request) {
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    return new Response(token);
  }
};
```

## Setting the Token

1. **In the notification worker:**
   ```bash
   wrangler secret put DEPLOY_NOTIFY_TOKEN
   # Enter your generated token when prompted
   ```

2. **In your deployment environment:**
   ```bash
   # As environment variable
   export DEPLOY_NOTIFY_TOKEN="your-generated-token"
   
   # In GitHub Actions secrets
   # Add DEPLOY_NOTIFY_TOKEN to your repository secrets
   
   # In .env file (for local development)
   echo "DEPLOY_NOTIFY_TOKEN=your-generated-token" >> .env
   ```

## Security Best Practices

1. **Token Requirements:**
   - Use at least 32 characters
   - Include mixed characters (letters, numbers, symbols)
   - Generate randomly, don't use predictable values
   - Never commit tokens to version control

2. **Token Rotation:**
   - Rotate tokens periodically (e.g., every 90 days)
   - Use different tokens for different environments
   - Revoke tokens when team members leave

3. **Storage:**
   - Always use environment variables or secrets management
   - Never hardcode tokens in your code
   - Use `.env` files only for local development

## Alternative: Cloudflare Access Integration

For enhanced security, you could modify the worker to use Cloudflare Access instead of bearer tokens:

```javascript
// Example: Using Cloudflare Access for authentication
export default {
  async fetch(request, env, ctx) {
    // Verify Cloudflare Access JWT
    const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!jwt) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Verify the JWT with Access
    const isValid = await verifyAccessJWT(jwt, env.ACCESS_AUD);
    if (!isValid) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Process the request...
  }
};
```

This would require:
1. Setting up Cloudflare Access on your worker domain
2. Configuring Access policies for who can send notifications
3. Modifying the notification sender to authenticate via Access

## Current Implementation

The current implementation uses a simple bearer token for simplicity and compatibility. The token:
- Is stored as a Cloudflare Worker secret (`DEPLOY_NOTIFY_TOKEN`)
- Must be included in the `Authorization` header as `Bearer <token>`
- Is checked on every request to the `/notify` endpoint

Example request:
```bash
curl -X POST https://your-worker.workers.dev/notify \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"deployment": {...}}'
```