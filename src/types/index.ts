export interface WorkerDeployment {
	id: string;
	source: string;
	strategy: string;
	author_email: string;
	created_on: string;
	annotations?: {
		"workers/triggered_by"?: string;
		"workers/rollback_from"?: string;
		"workers/message"?: string;
		"workers/tag"?: string;
	};
	versions?: Array<{
		version_id: string;
		percentage: number;
	}>;
}

export interface PageDeployment {
	id: string;
	url: string;
	environment: string;
	created_on: string;
	latest_stage: {
		name: string;
		status: string;
		ended_on: string | null;
	};
	deployment_trigger: {
		type: string;
		metadata: {
			branch?: string;
			commit_hash?: string;
			commit_message?: string;
		};
	};
	project_name: string;
	production_branch?: string;
	aliases?: string[];
}

export interface CloudflareApiResponse<T> {
	result: T[];
	success: boolean;
	errors: any[];
	messages: string[];
	result_info?: {
		page: number;
		per_page: number;
		count: number;
		total_count: number;
	};
}

export interface TelegramMessage {
	chat_id: string;
	text: string;
	parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
	disable_web_page_preview?: boolean;
}

export interface DeploymentNotification {
	type: "worker" | "page";
	projectName: string;
	deploymentId: string;
	author?: string;
	timestamp: string;
	environment?: string;
	url?: string;
	branch?: string;
	commitHash?: string;
	commitMessage?: string;
	tag?: string;
	rollbackFrom?: string;
}

export interface ProcessedDeployments {
	workers: string[];
	pages: string[];
	lastCheck: string;
}

export interface PushDeploymentPayload {
	type: 'worker' | 'page';
	projectName: string;
	deploymentId: string;
	branch?: string;
	commitHash?: string;
	commitMessage?: string;
	author?: string;
	timestamp?: string;
	environment?: string;
	tag?: string;
	url?: string;
	isCI?: boolean;
}