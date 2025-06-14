#!/usr/bin/env node

import { deployWithNotification } from './index';
import { DeployConfig } from './types';

// Parse command line arguments
function parseArgs(): DeployConfig {
  const args = process.argv.slice(2);
  const config: DeployConfig = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--notify-url':
        config.notifyUrl = nextArg;
        i++;
        break;
      case '--notify-token':
        config.notifyToken = nextArg;
        i++;
        break;
      case '--env':
      case '-e':
        config.env = nextArg;
        i++;
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--compatibility-date':
        config.compatibilityDate = nextArg;
        i++;
        break;
      case '--compatibility-flags':
        config.compatibilityFlags = config.compatibilityFlags || [];
        config.compatibilityFlags.push(nextArg);
        i++;
        break;
      case '--config':
      case '-c':
        config.config = nextArg;
        i++;
        break;
      case '--var':
        if (nextArg && nextArg.includes(':')) {
          const [key, value] = nextArg.split(':');
          config.vars = config.vars || {};
          config.vars[key] = value;
          i++;
        }
        break;
      case '--project-name':
        config.projectName = nextArg;
        i++;
        break;
      case '--tag':
        config.tag = nextArg;
        i++;
        break;
      case '--skip-notification':
        config.skipNotification = true;
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          showHelp();
          process.exit(1);
        }
    }
  }
  
  return config;
}

function showHelp() {
  console.log(`
wrangler-deploy-notify - Deploy to Cloudflare Workers with notifications

Usage: wrangler-deploy-notify [options]

Options:
  --notify-url <url>          URL of the deployment notification service
  --notify-token <token>      Authentication token for notifications
  --env, -e <environment>     Environment to deploy to
  --dry-run                   Perform a dry run (build but don't deploy)
  --compatibility-date <date> Compatibility date for the deployment
  --compatibility-flags <flag> Compatibility flags (can be used multiple times)
  --config, -c <path>         Path to wrangler config file
  --var <key:value>           Variables to pass to the deployment
  --project-name <name>       Override project name
  --tag <tag>                 Tag for this deployment
  --skip-notification         Skip sending notification
  --verbose, -v               Show verbose output
  --help, -h                  Show this help message

Environment Variables:
  DEPLOY_NOTIFY_URL           Default notification URL
  DEPLOY_NOTIFY_TOKEN         Default notification token

Examples:
  # Basic deployment with notification
  wrangler-deploy-notify --notify-url https://notify.example.com --notify-token abc123

  # Deploy to staging environment
  wrangler-deploy-notify --env staging

  # Deploy with custom variables
  wrangler-deploy-notify --var API_KEY:secret123 --var DEBUG:true

  # Using environment variables
  export DEPLOY_NOTIFY_URL=https://notify.example.com
  export DEPLOY_NOTIFY_TOKEN=abc123
  wrangler-deploy-notify
`);
}

// Main execution
async function main() {
  try {
    const config = parseArgs();
    await deployWithNotification(config);
    process.exit(0);
  } catch (error) {
    console.error('Deployment failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();