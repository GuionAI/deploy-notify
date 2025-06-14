import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramService } from '../../src/services/telegram';

// Mock fetch
global.fetch = vi.fn();

describe('TelegramService', () => {
	const mockToken = 'test-bot-token';
	const mockChatId = '-1001234567890';
	let service: TelegramService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new TelegramService(mockToken, mockChatId);
	});

	describe('sendMessage', () => {
		it('should send a message successfully', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ ok: true, result: {} }),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			await service.sendMessage('Test message');

			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.telegram.org/bot${mockToken}/sendMessage`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						chat_id: mockChatId,
						text: 'Test message',
						parse_mode: 'HTML',
						disable_web_page_preview: true,
					}),
				}
			);
		});

		it('should throw error on API failure', async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				text: async () => 'Bad Request',
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			await expect(service.sendMessage('Test')).rejects.toThrow('Telegram API error: 400 Bad Request');
		});
	});

	describe('testConnection', () => {
		it('should return true when connection is successful', async () => {
			const mockResponse = {
				json: async () => ({ ok: true }),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await service.testConnection();

			expect(result).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(`https://api.telegram.org/bot${mockToken}/getMe`);
		});

		it('should return false when connection fails', async () => {
			(global.fetch as any).mockRejectedValue(new Error('Network error'));

			const result = await service.testConnection();

			expect(result).toBe(false);
		});
	});

	describe('sendBatchMessages', () => {
		it('should send multiple messages with delay', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({ ok: true, result: {} }),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const messages = ['Message 1', 'Message 2', 'Message 3'];
			
			await service.sendBatchMessages(messages);

			expect(global.fetch).toHaveBeenCalledTimes(3);
		});
	});
});