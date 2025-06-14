import { DeploymentNotification, WorkerDeployment, PageDeployment } from '../types';

export class MessageFormatter {
	static formatWorkerDeployment(
		deployment: WorkerDeployment & { scriptName: string }
	): DeploymentNotification {
		// Extract git commit info from deployment message if it follows a pattern
		const deploymentMessage = deployment.annotations?.['workers/message'] || '';
		let branch: string | undefined;
		let commitHash: string | undefined;
		let commitMessage: string | undefined;

		// Check if deployment message contains git info (common CI/CD pattern)
		// Pattern: "branch@hash: message" or just the message
		// Note: This only captures the first line of multi-line messages
		const firstLine = deploymentMessage.split('\n')[0];
		const gitPattern = /^(.+?)@([a-f0-9]{7,40}):\s*(.+)$/;
		const match = firstLine.match(gitPattern);

		if (match) {
			branch = match[1];
			commitHash = match[2];
			commitMessage = match[3];
		} else if (deploymentMessage) {
			// If no git pattern, treat the whole message as commit message
			commitMessage = deploymentMessage;
		}

		return {
			type: 'worker',
			projectName: deployment.scriptName,
			deploymentId: deployment.id,
			author: deployment.author_email,
			timestamp: deployment.created_on,
			environment: 'production',
			branch,
			commitHash,
			commitMessage,
			tag: deployment.annotations?.['workers/tag'],
			rollbackFrom: deployment.annotations?.['workers/rollback_from'],
		};
	}

	static formatPageDeployment(
		deployment: PageDeployment & { projectName: string }
	): DeploymentNotification {
		return {
			type: 'page',
			projectName: deployment.project_name || deployment.projectName,
			deploymentId: deployment.id,
			timestamp: deployment.created_on,
			environment: deployment.environment,
			url: deployment.url,
			branch: deployment.deployment_trigger?.metadata?.branch,
			commitHash: deployment.deployment_trigger?.metadata?.commit_hash,
			commitMessage: deployment.deployment_trigger?.metadata?.commit_message,
		};
	}

	static createTelegramMessage(notification: DeploymentNotification): string {
		const typeEmoji = notification.type === 'worker' ? '⚡' : '📄';
		const envEmoji = notification.environment === 'production' ? '🚀' : '🔧';

		let message = `${typeEmoji} <b>New ${notification.type === 'worker' ? 'Worker' : 'Pages'} Deployment</b>\n\n`;
		message += `<b>Project:</b> ${this.escapeHtml(notification.projectName)}\n`;
		message += `<b>Environment:</b> ${envEmoji} ${this.escapeHtml(notification.environment || 'production')}\n`;
		message += `<b>Deployment ID:</b> <code>${this.escapeHtml(notification.deploymentId)}</code>\n`;

		if (notification.author) {
			message += `<b>Author:</b> ${this.escapeHtml(notification.author)}\n`;
		}

		if (notification.branch) {
			message += `<b>Branch:</b> ${this.escapeHtml(notification.branch)}\n`;
		}

		if (notification.commitHash) {
			const shortHash = notification.commitHash.substring(0, 7);
			message += `<b>Commit:</b> <code>${this.escapeHtml(shortHash)}</code>`;
			if (notification.commitMessage) {
				const truncatedMessage = notification.commitMessage.length > 80
					? notification.commitMessage.substring(0, 77) + '...'
					: notification.commitMessage;
				message += ` - ${this.escapeHtml(truncatedMessage)}`;
			}
			message += '\n';
		} else if (notification.commitMessage) {
			// Fallback if no commit hash
			const truncatedMessage = notification.commitMessage.length > 100
				? notification.commitMessage.substring(0, 97) + '...'
				: notification.commitMessage;
			message += `<b>Message:</b> ${this.escapeHtml(truncatedMessage)}\n`;
		}

		if (notification.tag) {
			message += `<b>Tag:</b> ${this.escapeHtml(notification.tag)}\n`;
		}

		if (notification.rollbackFrom) {
			message += `<b>Rollback from:</b> <code>${this.escapeHtml(notification.rollbackFrom)}</code>\n`;
		}

		message += `<b>Time:</b> ${new Date(notification.timestamp).toLocaleString('en-US', {
			timeZone: 'UTC',
			dateStyle: 'medium',
			timeStyle: 'short',
		})} UTC\n`;

		if (notification.url) {
			message += `\n<b>View Deployment:</b> <a href="${this.escapeHtml(notification.url)}">Open in browser</a>`;
		}

		return message;
	}

	static createBatchSummaryMessage(workerCount: number, pageCount: number): string {
		const total = workerCount + pageCount;
		if (total === 0) return '';

		let message = `📊 <b>Deployment Summary</b>\n\n`;
		message += `Found ${total} new deployment${total !== 1 ? 's' : ''}:\n`;

		if (workerCount > 0) {
			message += `• ${workerCount} Worker deployment${workerCount !== 1 ? 's' : ''}\n`;
		}

		if (pageCount > 0) {
			message += `• ${pageCount} Pages deployment${pageCount !== 1 ? 's' : ''}\n`;
		}

		return message;
	}

	static createErrorMessage(error: Error | unknown): string {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		return `❌ <b>Error in Deployment Monitor</b>\n\n${this.escapeHtml(errorMessage)}`;
	}

	private static escapeHtml(text: string): string {
		const escapeMap: Record<string, string> = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
		};

		return text.replace(/[&<>"']/g, char => escapeMap[char] || char);
	}
}