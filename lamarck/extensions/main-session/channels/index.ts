/**
 * Channel manager — manages all external message channels
 *
 * Currently supports:
 * - QQ (via NapCatQQ)
 *
 * Future:
 * - WeChat
 * - Telegram
 * - etc.
 */

import { QQChannel, type QQChannelStats } from "./qq.js";

export interface ChannelManagerOptions {
	/** Called when a message is received from any channel */
	onMessage: (channel: string, userId: string, text: string) => void;
	/** Called when a channel connects */
	onConnected?: (channel: string) => void;
	/** Called when a channel disconnects */
	onDisconnected?: (channel: string) => void;
	/** Called when a channel has an error */
	onError?: (channel: string, error: Error) => void;
}

export interface ChannelStatus {
	name: string;
	connected: boolean;
	stats: {
		messagesReceived: number;
		messagesSent: number;
	};
}

// Configuration
const NAPCAT_WS_URL = process.env.NAPCAT_WS_URL || "ws://172.30.144.1:3001";

export class ChannelManager {
	private options: ChannelManagerOptions;
	private qq: QQChannel | null = null;
	private pendingReplies = new Map<string, number>(); // channel:userId -> QQ userId

	constructor(options: ChannelManagerOptions) {
		this.options = options;
	}

	/** Start all channels */
	start(): void {
		// Start QQ channel
		this.qq = new QQChannel({
			url: NAPCAT_WS_URL,
			onMessage: (userId, text) => {
				// Track for reply routing
				this.pendingReplies.set(`qq:${userId}`, userId);
				this.options.onMessage("qq", String(userId), text);
			},
			onConnected: () => {
				this.options.onConnected?.("qq");
			},
			onDisconnected: () => {
				this.options.onDisconnected?.("qq");
			},
			onError: (error) => {
				this.options.onError?.("qq", error);
			},
		});

		this.qq.connect();
	}

	/** Send a reply to a specific channel/user */
	async sendReply(channel: string, userId: string, message: string): Promise<void> {
		if (channel === "qq" && this.qq) {
			await this.qq.sendMessage(parseInt(userId, 10), message);
		}
	}

	/** Get status of all channels */
	getStatus(): ChannelStatus[] {
		const statuses: ChannelStatus[] = [];

		if (this.qq) {
			const stats = this.qq.getStats();
			statuses.push({
				name: "QQ",
				connected: stats.connected,
				stats: {
					messagesReceived: stats.messagesReceived,
					messagesSent: stats.messagesSent,
				},
			});
		}

		return statuses;
	}

	/** Stop all channels */
	stop(): void {
		if (this.qq) {
			this.qq.close();
			this.qq = null;
		}
	}
}
