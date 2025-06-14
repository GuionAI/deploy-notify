import { execSync } from 'child_process';

export function getGitInfo() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim() ||
                  execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=format:%B', { encoding: 'utf8' }).trim();
    const author = execSync('git log -1 --pretty=format:%ae', { encoding: 'utf8' }).trim();
    
    // Try to get tag
    let tag: string | undefined;
    try {
      tag = execSync('git describe --tags --exact-match 2>/dev/null', { encoding: 'utf8' }).trim();
    } catch {
      // No tag on current commit
    }
    
    return {
      branch,
      commitHash,
      commitMessage,
      author,
      tag
    };
  } catch (error) {
    console.warn('Failed to get git information:', error instanceof Error ? error.message : error);
    return {
      branch: process.env.WORKERS_CI_BRANCH || 'unknown',
      commitHash: process.env.WORKERS_CI_COMMIT_SHA || 'unknown',
      commitMessage: 'No commit message available',
      author: process.env.USER || 'unknown',
      tag: undefined
    };
  }
}

export function getProjectName(): string {
  // Try to get from package.json
  try {
    const packageJson = require(`${process.cwd()}/package.json`);
    return packageJson.name || 'unknown-project';
  } catch {
    // Try to get from wrangler.toml
    try {
      const wranglerToml = execSync('cat wrangler.toml', { encoding: 'utf8' });
      const match = wranglerToml.match(/name\s*=\s*"([^"]+)"/);
      return match ? match[1] : 'unknown-project';
    } catch {
      return process.env.CLOUDFLARE_PROJECT_NAME || 'unknown-project';
    }
  }
}