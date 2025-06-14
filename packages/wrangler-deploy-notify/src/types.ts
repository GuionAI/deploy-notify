export interface DeployConfig {
  // Notification settings
  notifyUrl?: string;
  notifyToken?: string;
  
  // Wrangler options
  env?: string;
  dryRun?: boolean;
  compatibilityDate?: string;
  compatibilityFlags?: string[];
  config?: string;
  vars?: Record<string, string>;
  
  // Git information (auto-detected if not provided)
  branch?: string;
  commitHash?: string;
  commitMessage?: string;
  
  // Project info
  projectName?: string;
  tag?: string;
  
  // Other options
  skipNotification?: boolean;
  verbose?: boolean;
}

export interface DeploymentInfo {
  type: 'worker';
  projectName: string;
  deploymentId: string;
  branch?: string;
  commitHash?: string;
  commitMessage?: string;
  author?: string;
  timestamp: string;
  environment?: string;
  tag?: string;
  isCI: boolean;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}