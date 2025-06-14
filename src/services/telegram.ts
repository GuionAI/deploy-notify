import { TelegramMessage } from '../types';

export class TelegramService {
	private botToken: string;
	private chatId: string;
	private baseUrl: string;

	constructor(botToken: string, chatId: string) {
		this.botToken = botToken;
		this.chatId = chatId;
		this.baseUrl = `https://api.telegram.org/bot${botToken}`;
	}

	async sendMessage(text: string, parseMode: TelegramMessage['parse_mode'] = 'HTML'): Promise<void> {
		const message: TelegramMessage = {
			chat_id: this.chatId,
			text,
			parse_mode: parseMode,
			disable_web_page_preview: true,
		};

		try {
			const response = await fetch(`${this.baseUrl}/sendMessage`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(message),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Telegram API error: ${response.status} ${error}`);
			}

			const result = await response.json() as { ok: boolean; description?: string };
			if (!result.ok) {
				throw new Error(`Telegram API returned error: ${JSON.stringify(result)}`);
			}
		} catch (error) {
			console.error('Error sending Telegram message:', error);
			throw error;
		}
	}

	async sendBatchMessages(messages: string[]): Promise<void> {
		// Send messages with a small delay to avoid rate limiting
		for (const message of messages) {
			await this.sendMessage(message);
			// Wait 100ms between messages
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}

	async testConnection(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/getMe`);
			const result = await response.json() as { ok: boolean };
			return result.ok === true;
		} catch (error) {
			console.error('Error testing Telegram connection:', error);
			return false;
		}
	}
}