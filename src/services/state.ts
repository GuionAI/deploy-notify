import { ProcessedDeployments } from '../types';

export class StateService {
	constructor(private kv: KVNamespace) {}

	private getStateKey(): string {
		return 'processed-deployments';
	}

	async getProcessedDeployments(): Promise<ProcessedDeployments> {
		const key = this.getStateKey();
		const stored = await this.kv.get(key, 'json');

		if (!stored) {
			return {
				workers: [],
				pages: [],
				lastCheck: new Date().toISOString(),
			};
		}

		return stored as ProcessedDeployments;
	}

	async saveProcessedDeployments(state: ProcessedDeployments): Promise<void> {
		const key = this.getStateKey();
		await this.kv.put(key, JSON.stringify(state));
	}

	async addProcessedDeployments(workerIds: string[], pageIds: string[]): Promise<void> {
		const current = await this.getProcessedDeployments();

		// Add new IDs, avoiding duplicates
		const updatedWorkers = [...new Set([...current.workers, ...workerIds])];
		const updatedPages = [...new Set([...current.pages, ...pageIds])];

		// Keep only the last 1000 deployments to prevent unbounded growth
		const maxDeployments = 1000;
		const trimmedWorkers = updatedWorkers.slice(-maxDeployments);
		const trimmedPages = updatedPages.slice(-maxDeployments);

		await this.saveProcessedDeployments({
			workers: trimmedWorkers,
			pages: trimmedPages,
			lastCheck: new Date().toISOString(),
		});
	}

	async isDeploymentProcessed(deploymentId: string, type: 'worker' | 'page'): Promise<boolean> {
		const state = await this.getProcessedDeployments();
		const deployments = type === 'worker' ? state.workers : state.pages;
		return deployments.includes(deploymentId);
	}

	async getNewDeployments(
		workerDeployments: Array<{ id: string }>,
		pageDeployments: Array<{ id: string }>
	): Promise<{
		newWorkers: string[];
		newPages: string[];
	}> {
		const state = await this.getProcessedDeployments();

		const newWorkers = workerDeployments
			.map(d => d.id)
			.filter(id => !state.workers.includes(id));

		const newPages = pageDeployments
			.map(d => d.id)
			.filter(id => !state.pages.includes(id));

		return { newWorkers, newPages };
	}

	async clearState(): Promise<void> {
		const key = this.getStateKey();
		await this.kv.delete(key);
	}
}