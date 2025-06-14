import { DeployConfig, DeploymentInfo } from './types';
import { getGitInfo, getProjectName } from './git';
import { sendNotification } from './notify';
import { runWranglerDeploy } from './deploy';

export * from './types';

export async function deployWithNotification(config: DeployConfig = {}): Promise<void> {
  // Get configuration from environment variables or config
  const notifyUrl = config.notifyUrl || process.env.DEPLOY_NOTIFY_URL;
  const notifyToken = config.notifyToken || process.env.DEPLOY_NOTIFY_TOKEN;
  const skipNotification = config.skipNotification;
  
  if (config.verbose) {
    console.log('Debug: Config:', JSON.stringify(config, null, 2));
    console.log('Debug: Notify URL:', notifyUrl || 'not set');
    console.log('Debug: Notify Token:', notifyToken ? '***' + notifyToken.slice(-4) : 'not set');
  }
  
  // Get git information
  const gitInfo = getGitInfo();
  const projectName = config.projectName || getProjectName();
  
  // Build deployment info
  const deploymentInfo: DeploymentInfo = {
    type: 'worker',
    projectName,
    deploymentId: process.env.WORKERS_CI_BUILD_UUID || `deploy-${Date.now()}`,
    branch: config.branch || gitInfo.branch,
    commitHash: config.commitHash || gitInfo.commitHash,
    commitMessage: config.commitMessage || gitInfo.commitMessage,
    author: gitInfo.author,
    timestamp: new Date().toISOString(),
    environment: config.env || process.env.ENVIRONMENT || 'production',
    tag: config.tag || gitInfo.tag,
    isCI: process.env.CI === 'true' || process.env.WORKERS_CI === '1',
  };
  
  try {
    // Run wrangler deploy
    await runWranglerDeploy(config);
    
    // Send notification if configured
    if (skipNotification) {
      console.log('ℹ️  Deployment notification skipped (--skip-notification flag)');
    } else if (!notifyUrl || !notifyToken) {
      console.log('ℹ️  Deployment notification skipped (no URL or token configured)');
      if (config.verbose) {
        console.log('   Missing:', !notifyUrl ? 'DEPLOY_NOTIFY_URL' : '', !notifyToken ? 'DEPLOY_NOTIFY_TOKEN' : '');
      }
    } else {
      console.log('📤 Sending deployment notification...');
      try {
        const response = await sendNotification(notifyUrl, notifyToken, deploymentInfo);
        console.log('✅ Notification sent successfully:', response.message);
      } catch (error) {
        console.error('⚠️  Failed to send notification:', error instanceof Error ? error.message : error);
        // Don't fail the deployment if notification fails
      }
    }
  } catch (error) {
    console.error('❌ Deployment failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

// For programmatic use
export default deployWithNotification;