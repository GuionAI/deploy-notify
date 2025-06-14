# Git Integration Guide

This document explains how git commit information is handled in the deployment monitor.

## Current Limitations

### Cloudflare API Limitations

1. **Workers API**: Does not expose git metadata (branch, commit hash, message) directly
2. **Pages API**: Exposes branch and commit hash, but NOT the commit message
3. **Build Environment Variables**:
   - Pages: `CF_PAGES_BRANCH` and `CF_PAGES_COMMIT_SHA` available
   - Workers: No git-related environment variables

### Our Workaround

Since we can't get git information directly from the API, we embed it in the deployment message field for Workers:

```
Format: branch@hash: message
Example: main@abc1234: Fix authentication bug
```

## Handling Multi-line Commit Messages

Multi-line commit messages pose a challenge because:

1. The deployment message field has character limits
2. Multi-line strings can break shell scripts
3. Only the subject line (first line) is typically most important

### Solution

We only capture the first line of commit messages:

```bash
# Get only the first line
COMMIT_MSG=$(git log -1 --pretty=format:'%s' | head -n1)
```

The parser also only looks at the first line when extracting git info:

```typescript
const firstLine = deploymentMessage.split('\n')[0];
const gitPattern = /^(.+?)@([a-f0-9]{7,40}):\s*(.+)$/;
const match = firstLine.match(gitPattern);
```

## Best Practices

### 1. Use Conventional Commits

Follow the conventional commits format where the first line is a concise summary:

```
feat: add user authentication
fix: resolve memory leak in worker
docs: update API documentation
```

### 2. CI/CD Integration

Always extract git info in your CI/CD pipeline:

```yaml
- name: Deploy with Git Info
  run: |
    BRANCH=$(git branch --show-current)
    COMMIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_MSG=$(git log -1 --pretty=format:'%s' | head -n1)
    
    wrangler deploy --message "${BRANCH}@${COMMIT_HASH}: ${COMMIT_MSG}"
```

### 3. Character Limits

Be aware of Wrangler's message field limits:
- Keep commit messages concise
- The entire formatted message should be under 500 characters
- Long messages will be truncated in notifications

## Future Improvements

If Cloudflare adds git metadata to their APIs, we could:

1. Directly fetch commit messages from the API
2. Support full multi-line commit messages
3. Access additional git metadata (author, date, etc.)

Until then, this workaround provides a reasonable solution for tracking code changes across deployments.

## Alternative Approaches

### 1. External Git Service

You could query GitHub/GitLab APIs using the commit hash to get full commit details:

```typescript
// Pseudo-code
const commitDetails = await fetch(`https://api.github.com/repos/owner/repo/commits/${commitHash}`);
const fullMessage = commitDetails.message;
```

### 2. Build-time Metadata File

Generate a metadata file during build that includes full git info:

```bash
# In your build script
cat > .deployment-metadata.json << EOF
{
  "branch": "$(git branch --show-current)",
  "hash": "$(git rev-parse HEAD)",
  "message": "$(git log -1 --pretty=format:'%B')",
  "author": "$(git log -1 --pretty=format:'%an <%ae>')"
}
EOF
```

However, both approaches add complexity and external dependencies.