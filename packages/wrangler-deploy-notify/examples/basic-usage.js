// Example: Using wrangler-deploy-notify programmatically

const { deployWithNotification } = require('wrangler-deploy-notify');

async function deploy() {
  try {
    await deployWithNotification({
      // Notification settings (optional if using env vars)
      notifyUrl: process.env.DEPLOY_NOTIFY_URL,
      notifyToken: process.env.DEPLOY_NOTIFY_TOKEN,
      
      // Wrangler options
      env: 'production',
      
      // Optional: Override git information
      tag: `v${require('./package.json').version}`,
      
      // Optional: Add variables
      vars: {
        API_VERSION: '2.0',
        FEATURE_FLAGS: 'auth,analytics'
      },
      
      // Show what's happening
      verbose: true
    });
    
    console.log('Deployment completed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deploy();
}

module.exports = { deploy };