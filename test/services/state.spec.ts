import { describe, it, expect, beforeEach } from 'vitest';
import { StateService } from '../../src/services/state';
import { ProcessedDeployments } from '../../src/types';

// Mock KV namespace
class MockKVNamespace implements KVNamespace {
	private store: Map<string, string> = new Map();

	async get(key: string, options?: any): Promise<any> {
		const value = this.store.get(key);
		if (!value) return null;
		if (options === 'json') return JSON.parse(value);
		return value;
	}

	async put(key: string, value: string): Promise<void> {
		this.store.set(key, value);
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}

	// Other required methods (not used in tests)
	async list(): Promise<any> { return { keys: [] }; }
	async getWithMetadata(): Promise<any> { return null; }
}

describe('StateService', () => {
	let mockKV: MockKVNamespace;
	let service: StateService;

	beforeEach(() => {
		mockKV = new MockKVNamespace();
		service = new StateService(mockKV as any);
	});

	describe('getProcessedDeployments', () => {
		it('should return empty state when no data exists', async () => {
			const result = await service.getProcessedDeployments();

			expect(result.workers).toEqual([]);
			expect(result.pages).toEqual([]);
			expect(result.lastCheck).toBeDefined();
		});

		it('should return stored state', async () => {
			const mockState: ProcessedDeployments = {
				workers: ['w1', 'w2'],
				pages: ['p1', 'p2'],
				lastCheck: '2025-01-01T00:00:00Z',
			};

			await mockKV.put('processed-deployments', JSON.stringify(mockState));

			const result = await service.getProcessedDeployments();
			expect(result).toEqual(mockState);
		});
	});

	describe('addProcessedDeployments', () => {
		it('should add new deployment IDs without duplicates', async () => {
			// Add initial deployments
			await service.addProcessedDeployments(['w1', 'w2'], ['p1', 'p2']);

			// Add more with some duplicates
			await service.addProcessedDeployments(['w2', 'w3'], ['p2', 'p3']);

			const result = await service.getProcessedDeployments();
			expect(result.workers).toEqual(['w1', 'w2', 'w3']);
			expect(result.pages).toEqual(['p1', 'p2', 'p3']);
		});

		it('should limit stored deployments to prevent unbounded growth', async () => {
			// Create arrays with more than 1000 items
			const manyWorkers = Array.from({ length: 1100 }, (_, i) => `w${i}`);
			const manyPages = Array.from({ length: 1100 }, (_, i) => `p${i}`);

			await service.addProcessedDeployments(manyWorkers, manyPages);

			const result = await service.getProcessedDeployments();
			expect(result.workers.length).toBe(1000);
			expect(result.pages.length).toBe(1000);
			
			// Should keep the latest items
			expect(result.workers[999]).toBe('w1099');
			expect(result.pages[999]).toBe('p1099');
		});
	});

	describe('isDeploymentProcessed', () => {
		it('should correctly identify processed deployments', async () => {
			await service.addProcessedDeployments(['w1', 'w2'], ['p1', 'p2']);

			expect(await service.isDeploymentProcessed('w1', 'worker')).toBe(true);
			expect(await service.isDeploymentProcessed('w3', 'worker')).toBe(false);
			expect(await service.isDeploymentProcessed('p1', 'page')).toBe(true);
			expect(await service.isDeploymentProcessed('p3', 'page')).toBe(false);
		});
	});

	describe('getNewDeployments', () => {
		it('should identify new deployments', async () => {
			await service.addProcessedDeployments(['w1', 'w2'], ['p1', 'p2']);

			const workerDeployments = [{ id: 'w2' }, { id: 'w3' }, { id: 'w4' }];
			const pageDeployments = [{ id: 'p2' }, { id: 'p3' }, { id: 'p4' }];

			const result = await service.getNewDeployments(workerDeployments, pageDeployments);

			expect(result.newWorkers).toEqual(['w3', 'w4']);
			expect(result.newPages).toEqual(['p3', 'p4']);
		});
	});

	describe('clearState', () => {
		it('should clear all stored state', async () => {
			await service.addProcessedDeployments(['w1', 'w2'], ['p1', 'p2']);
			await service.clearState();

			const result = await service.getProcessedDeployments();
			expect(result.workers).toEqual([]);
			expect(result.pages).toEqual([]);
		});
	});
});