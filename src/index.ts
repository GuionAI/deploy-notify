import { TelegramService } from './services/telegram';
import { StateService } from './services/state';
import { MessageFormatter } from './utils/formatter';
import { DeploymentNotification, PushDeploymentPayload } from './types';

export interface Env {
	// KV Namespace binding
	DEPLOYMENT_STATE: KVNamespace;

	// Environment variables
	TELEGRAM_BOT_TOKEN: string;
	TELEGRAM_CHAT_ID: string;

	// Notification auth token
	DEPLOY_NOTIFY_TOKEN: string;

	// Optional: specific projects to monitor (comma-separated)
	WORKER_PROJECTS?: string;
	PAGE_PROJECTS?: string;
}

async function handlePushNotification(env: Env, deployment: PushDeploymentPayload): Promise<void> {
	const telegram = new TelegramService(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
	const state = new StateService(env.DEPLOYMENT_STATE);

	try {
		// Check if we've already processed this deployment
		const isProcessed = await state.isDeploymentProcessed(
			deployment.deploymentId,
			deployment.type || 'worker'
		);

		if (isProcessed) {
			console.log(`Deployment ${deployment.deploymentId} already processed, skipping`);
			return;
		}

		// Format the notification
		const notification: DeploymentNotification = {
			type: deployment.type || 'worker',
			projectName: deployment.projectName,
			deploymentId: deployment.deploymentId,
			author: deployment.author,
			timestamp: deployment.timestamp || new Date().toISOString(),
			environment: deployment.environment || 'production',
			branch: deployment.branch,
			commitHash: deployment.commitHash,
			commitMessage: deployment.commitMessage,
			tag: deployment.tag,
			url: deployment.url,
		};

		// Send notification
		const message = MessageFormatter.createTelegramMessage(notification);
		await telegram.sendMessage(message);
		console.log(`Sent notification for ${deployment.type} deployment: ${deployment.projectName}`);

		// Mark as processed
		if (deployment.type === 'page') {
			await state.addProcessedDeployments([], [deployment.deploymentId]);
		} else {
			await state.addProcessedDeployments([deployment.deploymentId], []);
		}
	} catch (error) {
		console.error('Error handling push notification:', error);
		// Send error notification
		try {
			const errorMessage = MessageFormatter.createErrorMessage(error);
			await telegram.sendMessage(errorMessage);
		} catch (notifyError) {
			console.error('Failed to send error notification:', notifyError);
		}
	}
}


export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Push notification endpoint - receives deployment info directly
		if (url.pathname === '/notify' && request.method === 'POST') {
			// Verify authorization
			const authHeader = request.headers.get('Authorization');
			
			if (!authHeader || authHeader !== `Bearer ${env.DEPLOY_NOTIFY_TOKEN}`) {
				return new Response('Unauthorized', { status: 401 });
			}

			try {
				const body = await request.json() as { deployment: PushDeploymentPayload };
				ctx.waitUntil(handlePushNotification(env, body.deployment));
				return new Response(JSON.stringify({ success: true, message: 'Notification queued' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				console.error('Invalid request body:', error);
				return new Response(JSON.stringify({ error: 'Invalid request body' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		// Health check endpoint
		if (url.pathname === '/health') {
			return new Response('OK', { status: 200 });
		}

		return new Response('Deployment Monitor Active', { status: 200 });
	},
} satisfies ExportedHandler<Env>;
