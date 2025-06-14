import { describe, it, expect } from 'vitest';
import { MessageFormatter } from '../../src/utils/formatter';
import { WorkerDeployment, PageDeployment } from '../../src/types';

describe('MessageFormatter', () => {
	describe('formatWorkerDeployment', () => {
		it('should format worker deployment correctly', () => {
			const deployment: WorkerDeployment & { scriptName: string } = {
				id: 'deployment-123',
				scriptName: 'my-worker',
				source: 'upload',
				strategy: 'percentage',
				author_email: 'dev@example.com',
				created_on: '2025-01-15T10:00:00Z',
			};

			const result = MessageFormatter.formatWorkerDeployment(deployment);

			expect(result).toEqual({
				type: 'worker',
				projectName: 'my-worker',
				deploymentId: 'deployment-123',
				author: 'dev@example.com',
				timestamp: '2025-01-15T10:00:00Z',
				environment: 'production',
				branch: undefined,
				commitHash: undefined,
				commitMessage: undefined,
				tag: undefined,
				rollbackFrom: undefined,
			});
		});

		it('should include deployment annotations when present', () => {
			const deployment: WorkerDeployment & { scriptName: string } = {
				id: 'deployment-456',
				scriptName: 'api-worker',
				source: 'upload',
				strategy: 'percentage',
				author_email: 'dev@example.com',
				created_on: '2025-01-15T11:00:00Z',
				annotations: {
					'workers/message': 'Fix authentication bug',
					'workers/tag': 'v1.2.3',
					'workers/rollback_from': 'deployment-400',
				},
			};

			const result = MessageFormatter.formatWorkerDeployment(deployment);

			expect(result).toEqual({
				type: 'worker',
				projectName: 'api-worker',
				deploymentId: 'deployment-456',
				author: 'dev@example.com',
				timestamp: '2025-01-15T11:00:00Z',
				environment: 'production',
				branch: undefined,
				commitHash: undefined,
				commitMessage: 'Fix authentication bug',
				tag: 'v1.2.3',
				rollbackFrom: 'deployment-400',
			});
		});

		it('should parse git info from deployment message', () => {
			const deployment: WorkerDeployment & { scriptName: string } = {
				id: 'deployment-789',
				scriptName: 'api-worker',
				source: 'upload',
				strategy: 'percentage',
				author_email: 'dev@example.com',
				created_on: '2025-01-15T12:00:00Z',
				annotations: {
					'workers/message': 'main@abc1234: Fix critical authentication issue',
					'workers/tag': 'v2.0.0',
				},
			};

			const result = MessageFormatter.formatWorkerDeployment(deployment);

			expect(result).toEqual({
				type: 'worker',
				projectName: 'api-worker',
				deploymentId: 'deployment-789',
				author: 'dev@example.com',
				timestamp: '2025-01-15T12:00:00Z',
				environment: 'production',
				branch: 'main',
				commitHash: 'abc1234',
				commitMessage: 'Fix critical authentication issue',
				tag: 'v2.0.0',
				rollbackFrom: undefined,
			});
		});

		it('should handle multi-line deployment messages', () => {
			const deployment: WorkerDeployment & { scriptName: string } = {
				id: 'deployment-999',
				scriptName: 'api-worker',
				source: 'upload',
				strategy: 'percentage',
				author_email: 'dev@example.com',
				created_on: '2025-01-15T13:00:00Z',
				annotations: {
					'workers/message': 'main@def5678: Fix authentication bug\n\nThis fixes the following issues:\n- User sessions timing out\n- Invalid token errors',
				},
			};

			const result = MessageFormatter.formatWorkerDeployment(deployment);

			expect(result).toEqual({
				type: 'worker',
				projectName: 'api-worker',
				deploymentId: 'deployment-999',
				author: 'dev@example.com',
				timestamp: '2025-01-15T13:00:00Z',
				environment: 'production',
				branch: 'main',
				commitHash: 'def5678',
				commitMessage: 'Fix authentication bug',
				tag: undefined,
				rollbackFrom: undefined,
			});
		});
	});

	describe('formatPageDeployment', () => {
		it('should format page deployment correctly', () => {
			const deployment: PageDeployment & { projectName: string } = {
				id: 'page-deployment-456',
				projectName: 'my-site',
				project_name: 'my-site',
				url: 'https://deploy.pages.dev',
				environment: 'preview',
				created_on: '2025-01-15T11:00:00Z',
				latest_stage: {
					name: 'deploy',
					status: 'success',
					ended_on: '2025-01-15T11:05:00Z',
				},
				deployment_trigger: {
					type: 'github',
					metadata: {
						branch: 'feature/new-feature',
						commit_hash: 'abc123',
						commit_message: 'Add new feature',
					},
				},
			};

			const result = MessageFormatter.formatPageDeployment(deployment);

			expect(result).toEqual({
				type: 'page',
				projectName: 'my-site',
				deploymentId: 'page-deployment-456',
				timestamp: '2025-01-15T11:00:00Z',
				environment: 'preview',
				url: 'https://deploy.pages.dev',
				branch: 'feature/new-feature',
				commitHash: 'abc123',
				commitMessage: 'Add new feature',
			});
		});
	});

	describe('createTelegramMessage', () => {
		it('should create formatted message for worker deployment', () => {
			const notification = {
				type: 'worker' as const,
				projectName: 'api-worker',
				deploymentId: 'deploy-123',
				author: 'dev@example.com',
				timestamp: '2025-01-15T10:00:00Z',
				environment: 'production',
			};

			const message = MessageFormatter.createTelegramMessage(notification);

			expect(message).toContain('⚡ <b>New Worker Deployment</b>');
			expect(message).toContain('<b>Project:</b> api-worker');
			expect(message).toContain('<b>Environment:</b> 🚀 production');
			expect(message).toContain('<b>Deployment ID:</b> <code>deploy-123</code>');
			expect(message).toContain('<b>Author:</b> dev@example.com');
		});

		it('should create formatted message for page deployment with URL', () => {
			const notification = {
				type: 'page' as const,
				projectName: 'my-blog',
				deploymentId: 'page-789',
				timestamp: '2025-01-15T11:00:00Z',
				environment: 'preview',
				url: 'https://preview.pages.dev',
				branch: 'main',
				commitMessage: 'Update blog post',
			};

			const message = MessageFormatter.createTelegramMessage(notification);

			expect(message).toContain('📄 <b>New Pages Deployment</b>');
			expect(message).toContain('<b>Project:</b> my-blog');
			expect(message).toContain('<b>Environment:</b> 🔧 preview');
			expect(message).toContain('<b>Branch:</b> main');
			expect(message).toContain('<b>Message:</b> Update blog post');
			expect(message).toContain('<b>View Deployment:</b> <a href="https://preview.pages.dev">Open in browser</a>');
		});

		it('should escape HTML characters in messages', () => {
			const notification = {
				type: 'worker' as const,
				projectName: '<script>alert("xss")</script>',
				deploymentId: 'safe-id',
				timestamp: '2025-01-15T10:00:00Z',
			};

			const message = MessageFormatter.createTelegramMessage(notification);

			expect(message).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
			expect(message).not.toContain('<script>');
		});

		it('should truncate long commit messages', () => {
			const longMessage = 'a'.repeat(150);
			const notification = {
				type: 'page' as const,
				projectName: 'my-site',
				deploymentId: 'id-123',
				timestamp: '2025-01-15T10:00:00Z',
				commitMessage: longMessage,
			};

			const message = MessageFormatter.createTelegramMessage(notification);

			expect(message).toContain('<b>Message:</b> ' + 'a'.repeat(97) + '...');
		});

		it('should display unified format with commit info', () => {
			// Test Worker with git info
			const workerNotification = {
				type: 'worker' as const,
				projectName: 'api-worker',
				deploymentId: 'deploy-789',
				author: 'dev@example.com',
				timestamp: '2025-01-15T12:00:00Z',
				environment: 'production',
				branch: 'main',
				commitHash: 'abc1234567890',
				commitMessage: 'Fixed critical authentication issue',
				tag: 'v2.1.0',
			};

			const workerMessage = MessageFormatter.createTelegramMessage(workerNotification);
			expect(workerMessage).toContain('⚡ <b>New Worker Deployment</b>');
			expect(workerMessage).toContain('<b>Branch:</b> main');
			expect(workerMessage).toContain('<b>Commit:</b> <code>abc1234</code> - Fixed critical authentication issue');
			expect(workerMessage).toContain('<b>Tag:</b> v2.1.0');

			// Test Pages with git info
			const pageNotification = {
				type: 'page' as const,
				projectName: 'my-site',
				deploymentId: 'page-123',
				timestamp: '2025-01-15T13:00:00Z',
				environment: 'preview',
				branch: 'feature/new-ui',
				commitHash: 'def4567890123',
				commitMessage: 'Update landing page design',
				url: 'https://preview.pages.dev',
			};

			const pageMessage = MessageFormatter.createTelegramMessage(pageNotification);
			expect(pageMessage).toContain('📄 <b>New Pages Deployment</b>');
			expect(pageMessage).toContain('<b>Branch:</b> feature/new-ui');
			expect(pageMessage).toContain('<b>Commit:</b> <code>def4567</code> - Update landing page design');
		});
	});

	describe('createBatchSummaryMessage', () => {
		it('should create summary for multiple deployments', () => {
			const message = MessageFormatter.createBatchSummaryMessage(5, 3);

			expect(message).toContain('📊 <b>Deployment Summary</b>');
			expect(message).toContain('Found 8 new deployments:');
			expect(message).toContain('• 5 Worker deployments');
			expect(message).toContain('• 3 Pages deployments');
		});

		it('should handle singular deployment counts', () => {
			const message = MessageFormatter.createBatchSummaryMessage(1, 1);

			expect(message).toContain('Found 2 new deployments:');
			expect(message).toContain('• 1 Worker deployment');
			expect(message).toContain('• 1 Pages deployment');
		});

		it('should return empty string for zero deployments', () => {
			const message = MessageFormatter.createBatchSummaryMessage(0, 0);
			expect(message).toBe('');
		});
	});

	describe('createErrorMessage', () => {
		it('should format error messages', () => {
			const error = new Error('API rate limit exceeded');
			const message = MessageFormatter.createErrorMessage(error);

			expect(message).toContain('❌ <b>Error in Deployment Monitor</b>');
			expect(message).toContain('API rate limit exceeded');
		});

		it('should handle non-Error objects', () => {
			const message = MessageFormatter.createErrorMessage('String error');

			expect(message).toContain('❌ <b>Error in Deployment Monitor</b>');
			expect(message).toContain('Unknown error occurred');
		});
	});
});