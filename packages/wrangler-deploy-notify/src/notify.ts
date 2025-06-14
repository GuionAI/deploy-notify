import https from 'https';
import { URL } from 'url';
import { DeploymentInfo, NotificationResponse } from './types';

export async function sendNotification(
  notifyUrl: string,
  notifyToken: string,
  deployment: DeploymentInfo
): Promise<NotificationResponse> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ deployment });
    const url = new URL(`${notifyUrl}/notify`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${notifyToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(responseData) as NotificationResponse;
            resolve(response);
          } catch {
            resolve({ success: true, message: responseData });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}