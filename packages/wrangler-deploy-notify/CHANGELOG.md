# Changelog

## [1.0.2] - 2025-01-15

### Changed
- Removed debug console logs for cleaner output
- Only show "notification skipped" message when verbose flag is used

### Added
- Publishing scripts for easier npm releases
- PUBLISH.md guide for maintainers

## [1.0.1] - 2025-01-15

### Fixed
- Improved notification logging to always show when notifications are skipped
- Added verbose debug output for troubleshooting missing environment variables
- Fixed logic to properly distinguish between skip reasons (flag vs missing config)

### Added
- Debug logging with `--verbose` flag shows which environment variables are missing

## [1.0.0] - 2025-01-15

### Initial Release
- Wraps `wrangler deploy` with automatic deployment notifications
- Supports all standard wrangler deploy options
- Sends notifications with full git information (branch, commit hash, message, author)
- Configurable via CLI arguments or environment variables
- Can be used as CLI tool (`wrangler-deploy-notify` or `wdn`) or programmatically
- Automatic project name detection from package.json or wrangler.toml
- Support for deployment tags and environment specification
- Graceful error handling - notification failures don't fail deployments