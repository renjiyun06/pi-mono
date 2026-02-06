/**
 * NapCatQQ WebSocket client — OneBot 11 protocol
 *
 * Connects to NapCatQQ's forward WebSocket server,
 * receives message events and sends replies via API calls.
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

export interface NapCatClientOptions {
	url: string;
	onPrivateMessage?: (event: PrivateMessageEvent) => void;
	onConnected?: () => void;
	onDisconnected?: (code: number, reason: string) => void;
	onError?: (error: Error) => void;
}

export class NapCatClient {
	private ws: WebSocket | null = null;
	private options: NapCatClientOptions;
	private echoCounter = 0;
	private pendingRequests = new Map<string, { resolve: (data: unknown) => void; reject: (err: Error) => void }>();

	constructor(options: NapCatClientOptions) {
		this.options = options;
	}

	connect(): void {
		this.ws = new WebSocket(this.options.url);

		this.ws.on("open", () => {
			console.log(`[NapCat] Connected to ${this.options.url}`);
			this.options.onConnected?.();
		});

		this.ws.on("message", (data) => {
			try {
				const msg = JSON.parse(data.toString());
				this.handleMessage(msg);
			} catch (e) {
				console.error("[NapCat] Failed to parse message:", e);
			}
		});

		this.ws.on("error", (err) => {
			console.error("[NapCat] WebSocket error:", err.message);
			this.options.onError?.(err);
		});

		this.ws.on("close", (code, reason) => {
			console.log(`[NapCat] Disconnected: ${code} ${reason}`);
			this.options.onDisconnected?.(code, reason.toString());
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
			this.options.onPrivateMessage?.(msg as unknown as PrivateMessageEvent);
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

	/** Send private message */
	async sendPrivateMessage(userId: number, message: string): Promise<number> {
		const result = (await this.callApi("send_private_msg", {
			user_id: userId,
			message,
		})) as { message_id: number };
		return result.message_id;
	}

	close(): void {
		this.ws?.close();
	}
}
