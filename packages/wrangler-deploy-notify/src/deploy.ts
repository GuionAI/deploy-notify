import { spawn } from 'child_process';
import { DeployConfig } from './types';

export async function runWranglerDeploy(config: DeployConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['deploy'];
    
    // Add wrangler options
    if (config.env) args.push('--env', config.env);
    if (config.dryRun) args.push('--dry-run');
    if (config.compatibilityDate) args.push('--compatibility-date', config.compatibilityDate);
    if (config.compatibilityFlags) {
      config.compatibilityFlags.forEach(flag => {
        args.push('--compatibility-flags', flag);
      });
    }
    if (config.config) args.push('--config', config.config);
    if (config.vars) {
      Object.entries(config.vars).forEach(([key, value]) => {
        args.push('--var', `${key}:${value}`);
      });
    }
    
    console.log('🚀 Running wrangler deploy...');
    if (config.verbose) {
      console.log('Command: npx wrangler', args.join(' '));
    }
    
    const wrangler = spawn('npx', ['wrangler', ...args], {
      stdio: 'inherit',
      shell: true,
    });
    
    wrangler.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Deployment successful!');
        resolve();
      } else {
        reject(new Error(`Wrangler deploy failed with code ${code}`));
      }
    });
    
    wrangler.on('error', (error) => {
      reject(error);
    });
  });
}