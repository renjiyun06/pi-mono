/**
 * Main Session Extension
 *
 * Allows a pi instance to become the "main session" that receives
 * external messages from QQ, WeChat, etc.
 *
 * Commands:
 * - /main on   — Set current session as main, start receiving external messages
 * - /main off  — Release main session, stop receiving external messages
 * - /main      — Show current status
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { acquireLock, releaseLock, isMainSession, hasActiveMainSession, readLock } from "./lock.js";
import { ChannelManager } from "./channels/index.js";

export default function mainSessionExtension(pi: ExtensionAPI) {
	let channelManager: ChannelManager | null = null;
	let currentExternalUser: { channel: string; userId: string } | null = null;
	let isExternalMessage = false;
	let savedCtx: ExtensionContext | null = null;

	/** Start the main session */
	async function startMainSession(ctx: ExtensionContext): Promise<boolean> {
		const sessionId = ctx.sessionManager.getSessionId();
		const result = acquireLock(sessionId);

		if (!result.success) {
			const lock = result.existingLock!;
			if (ctx.hasUI) {
				ctx.ui.notify(
					`Session ${lock.sessionId} is already main session. Run /main off there first.`,
					"error"
				);
			}
			return false;
		}

		// Save ctx for use in callbacks
		savedCtx = ctx;

		// Start channel manager
		channelManager = new ChannelManager({
			onMessage: async (channel, userId, text) => {
				const trimmed = text.trim();

				// Handle special commands
				if (trimmed === "/new") {
					if (savedCtx) {
						await savedCtx.newSession();
						channelManager?.sendReply(channel, userId, "Session reset.");
					}
					return;
				}

				if (trimmed === "/compact") {
					if (savedCtx) {
						channelManager?.sendReply(channel, userId, "Compacting...");
						savedCtx.compact({
							onComplete: (result) => {
								const msg = `Compacted (was ${result.tokensBefore} tokens)`;
								channelManager?.sendReply(channel, userId, msg);
								if (savedCtx?.hasUI) {
									savedCtx.ui.notify(msg, "success");
								}
							},
							onError: (error) => {
								const msg = `Compact failed: ${error.message}`;
								channelManager?.sendReply(channel, userId, msg);
								if (savedCtx?.hasUI) {
									savedCtx.ui.notify(msg, "error");
								}
							},
						});
					}
					return;
				}

				if (trimmed === "/session") {
					if (savedCtx) {
						const id = savedCtx.sessionManager.getSessionId();
						const usage = savedCtx.getContextUsage();

						const lines: string[] = [];
						lines.push(`ID: ${id}`);
						if (usage) {
							lines.push(`Tokens: ${usage.tokens.toLocaleString()} (${usage.percent.toFixed(1)}%)`);
						}
						channelManager?.sendReply(channel, userId, lines.join("\n"));
					}
					return;
				}

				if (trimmed === "/help") {
					const help = [
						"/new - Reset session",
						"/compact - Compact context",
						"/session - Session info",
						"/help - This help",
					].join("\n");
					channelManager?.sendReply(channel, userId, help);
					return;
				}

				// Track external user for reply routing
				currentExternalUser = { channel, userId };
				isExternalMessage = true;

				// Send message to pi
				pi.sendUserMessage(text);
			},
			onConnected: () => {},
			onDisconnected: () => {},
			onError: (channel, error) => {
				console.error(`[MainSession] Channel error (${channel}):`, error.message);
			},
		});

		channelManager.start();
		return true;
	}

	/** Stop the main session */
	function stopMainSession(): void {
		if (channelManager) {
			channelManager.stop();
			channelManager = null;
		}
		releaseLock();
		currentExternalUser = null;
		isExternalMessage = false;
	}

	/** Get status info */
	function getStatusInfo(ctx: ExtensionContext): string {
		const { active, lock } = hasActiveMainSession();

		if (!active) {
			return "Status: No main session";
		}

		const currentSessionId = ctx.sessionManager.getSessionId();
		const isSelf = lock?.sessionId === currentSessionId;
		let info = `Status: ${isSelf ? "This is the main session" : `Session ${lock?.sessionId} is main session`}\n`;

		if (isSelf && channelManager) {
			const statuses = channelManager.getStatus();
			info += "\nChannels:\n";
			for (const status of statuses) {
				const connIcon = status.connected ? "✓" : "✗";
				info += `  ${connIcon} ${status.name}: recv ${status.stats.messagesReceived} / sent ${status.stats.messagesSent}\n`;
			}
		}

		return info.trim();
	}

	// Register /main command
	pi.registerCommand("main", {
		description: "Manage main session (receive external messages)",
		handler: async (args, ctx) => {
			const subcommand = args?.trim().toLowerCase();

			if (subcommand === "on") {
				if (isMainSession()) {
					ctx.ui.notify("Already main session", "info");
					return;
				}

				const success = await startMainSession(ctx);
				if (success) {
					ctx.ui.notify("Now main session, receiving external messages", "success");
				} else {
					ctx.ui.notify("Failed to acquire main session", "error");
				}
				return;
			}

			if (subcommand === "off") {
				if (!isMainSession()) {
					ctx.ui.notify("Not main session", "info");
					return;
				}

				stopMainSession();
				ctx.ui.notify("Released main session", "info");
				return;
			}

			// Default: show status
			const info = getStatusInfo(ctx);
			ctx.ui.notify(info, "info");
		},
	});

	// Subscribe to turn_end to send replies back to external channels
	pi.on("turn_end", async (event) => {
		// Only send replies for external messages
		if (!channelManager || !currentExternalUser || !isExternalMessage) {
			return;
		}

		// Extract text from assistant message
		const message = event.message;
		if (message.role === "assistant") {
			for (const content of message.content) {
				if (content.type === "text" && content.text) {
					const text = content.text.trim();
					if (text) {
						try {
							await channelManager.sendReply(
								currentExternalUser.channel,
								currentExternalUser.userId,
								text
							);
						} catch (error) {
							console.error("[MainSession] Failed to send reply:", error);
						}
					}
				}
			}
		}
	});

	// Clear external message flag when agent finishes
	pi.on("agent_end", async () => {
		isExternalMessage = false;
	});

	// Clean up on shutdown
	pi.on("session_shutdown", async () => {
		if (isMainSession()) {
			stopMainSession();
		}
	});
}
