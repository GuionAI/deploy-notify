import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Deployment Monitor', () => {
	it('responds with status message (unit style)', async () => {
		const request = new IncomingRequest('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toBe('Deployment Monitor Active');
		expect(response.status).toBe(200);
	});

	it('responds with status message (integration style)', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(await response.text()).toBe('Deployment Monitor Active');
		expect(response.status).toBe(200);
	});

	it('health check endpoint returns OK', async () => {
		const request = new IncomingRequest('http://example.com/health');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toBe('OK');
		expect(response.status).toBe(200);
	});

	it('manual check endpoint requires authentication', async () => {
		const request = new IncomingRequest('http://example.com/check', {
			method: 'POST',
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(401);
		expect(await response.text()).toBe('Unauthorized');
	});
});
