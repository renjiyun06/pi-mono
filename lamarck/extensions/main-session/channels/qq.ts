/**
 * QQ Channel — NapCatQQ WebSocket client
 *
 * Connects to NapCatQQ's forward WebSocket server (OneBot 11 protocol),
 * receives private messages and sends replies.
 */

import WebSocket from "ws";

/** OneBot 11 private message event */
export interface PrivateMessageEvent {
	post_type: "message";
	message_type: "private";
	user_id: number;
	message: string;
	raw_message: string;
	self_id: number;
	time: number;
}

/** OneBot 11 API response */
export interface ApiResponse {
	status: "ok" | "failed";
	retcode: number;
	data: unknown;
	echo?: string;
}

export interface QQChannelOptions {
	url: string;
	onMessage: (userId: number, text: string) => void;
	onConnected?: () => void;
	onDisconnected?: () => void;
	onError?: (error: Error) => void;
}

export interface QQChannelStats {
	connected: boolean;
	messagesReceived: number;
	messagesSent: number;
}

export class QQChannel {
	private ws: WebSocket | null = null;
	private options: QQChannelOptions;
	private echoCounter = 0;
	private pendingRequests = new Map<string, { resolve: (data: unknown) => void; reject: (err: Error) => void }>();
	private stats: QQChannelStats = {
		connected: false,
		messagesReceived: 0,
		messagesSent: 0,
	};

	constructor(options: QQChannelOptions) {
		this.options = options;
	}

	/** Connect to NapCat WebSocket server */
	connect(): void {
		if (this.ws) {
			this.close();
		}

		this.ws = new WebSocket(this.options.url);

		this.ws.on("open", () => {
			this.stats.connected = true;
			this.options.onConnected?.();
		});

		this.ws.on("message", (data) => {
			try {
				const msg = JSON.parse(data.toString());
				this.handleMessage(msg);
			} catch (e) {
				console.error("[QQ] Failed to parse message:", e);
			}
		});

		this.ws.on("error", (err) => {
			this.options.onError?.(err);
		});

		this.ws.on("close", () => {
			this.stats.connected = false;
			this.options.onDisconnected?.();
		});
	}

	private handleMessage(msg: Record<string, unknown>): void {
		// API response (has echo field)
		if (msg.echo && typeof msg.echo === "string") {
			const pending = this.pendingRequests.get(msg.echo);
			if (pending) {
				this.pendingRequests.delete(msg.echo);
				if (msg.status === "ok") {
					pending.resolve(msg.data);
				} else {
					pending.reject(new Error(`API failed: retcode=${msg.retcode}`));
				}
			}
			return;
		}

		// Event: private message
		if (msg.post_type === "message" && msg.message_type === "private") {
			const event = msg as unknown as PrivateMessageEvent;
			const text = event.raw_message.trim();
			if (text) {
				this.stats.messagesReceived++;
				this.options.onMessage(event.user_id, text);
			}
		}
	}

	/** Send API request and wait for response */
	private async callApi(action: string, params: Record<string, unknown>): Promise<unknown> {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new Error("WebSocket not connected");
		}

		const echo = `req_${++this.echoCounter}`;
		const request = { action, params, echo };

		return new Promise((resolve, reject) => {
			this.pendingRequests.set(echo, { resolve, reject });
			this.ws!.send(JSON.stringify(request));

			// Timeout after 30s
			setTimeout(() => {
				if (this.pendingRequests.has(echo)) {
					this.pendingRequests.delete(echo);
					reject(new Error(`API timeout: ${action}`));
				}
			}, 30000);
		});
	}

	/** Send private message to a user */
	async sendMessage(userId: number, message: string): Promise<void> {
		await this.callApi("send_private_msg", {
			user_id: userId,
			message,
		});
		this.stats.messagesSent++;
	}

	/** Get channel statistics */
	getStats(): QQChannelStats {
		return { ...this.stats };
	}

	/** Check if connected */
	isConnected(): boolean {
		return this.stats.connected;
	}

	/** Close connection */
	close(): void {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.stats.connected = false;
	}
}
