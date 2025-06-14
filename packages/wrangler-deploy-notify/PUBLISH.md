# Publishing Guide

## Quick Publish

```bash
# For bug fixes (1.0.1 -> 1.0.2)
npm run publish:patch -- --otp=YOUR_OTP

# For new features (1.0.1 -> 1.1.0)
npm run publish:minor -- --otp=YOUR_OTP

# For breaking changes (1.0.1 -> 2.0.0)
npm run publish:major -- --otp=YOUR_OTP
```

## Manual Steps

1. **Update version**:
   ```bash
   # Choose one:
   npm version patch  # 1.0.1 -> 1.0.2
   npm version minor  # 1.0.1 -> 1.1.0
   npm version major  # 1.0.1 -> 2.0.0
   ```

2. **Update CHANGELOG.md** with changes for the new version

3. **Build and test**:
   ```bash
   npm run build
   npm pack --dry-run  # Verify package contents
   ```

4. **Publish**:
   ```bash
   npm publish --otp=YOUR_OTP
   ```

5. **Push tags**:
   ```bash
   git push --tags
   ```

## Version Guidelines

- **Patch** (x.x.Z): Bug fixes, typos, small improvements
- **Minor** (x.Y.x): New features, non-breaking changes
- **Major** (X.x.x): Breaking changes, major refactors

## Pre-publish Checklist

- [ ] All tests pass (when implemented)
- [ ] CHANGELOG.md updated
- [ ] README.md is accurate
- [ ] No debug logs in code
- [ ] Package builds successfully
- [ ] Version number makes sense

## NPM Commands Reference

```bash
# Check current version
npm version

# See what will be published
npm pack --dry-run

# Check if name is available
npm view wrangler-deploy-notify

# Update npm
npm install -g npm@latest
```