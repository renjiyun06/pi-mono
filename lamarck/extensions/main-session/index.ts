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
import { Type } from "@sinclair/typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import { acquireLock, releaseLock, isMainSession, hasActiveMainSession, readLock } from "./lock.js";
import { ChannelManager } from "./channels/index.js";

const MY_QQ = "1277260264";
const QQ_IMAGE_DIR = "/mnt/c/Users/wozai/Pictures/qq-images";

/**
 * Convert WSL path to Windows path
 * /mnt/c/Users/xxx → C:/Users/xxx
 */
function wslToWindows(wslPath: string): string {
	return wslPath.replace(/^\/mnt\/([a-z])\//, (_, drive) => `${drive.toUpperCase()}:/`);
}

/**
 * Process message text for QQ channel:
 * - Convert [image:/path/to/file] to CQ code
 * - Copy image to Windows-accessible directory
 */
function processMessageForQQ(text: string): string {
	// Ensure QQ image directory exists
	if (!fs.existsSync(QQ_IMAGE_DIR)) {
		fs.mkdirSync(QQ_IMAGE_DIR, { recursive: true });
	}

	// Match [image:/path/to/file.ext]
	return text.replace(/\[image:([^\]]+)\]/g, (match, imagePath) => {
		try {
			const srcPath = imagePath.trim();
			if (!fs.existsSync(srcPath)) {
				return `[图片不存在: ${srcPath}]`;
			}

			// Copy to QQ image directory
			const fileName = path.basename(srcPath);
			const destPath = path.join(QQ_IMAGE_DIR, fileName);
			fs.copyFileSync(srcPath, destPath);

			// Convert to Windows path and CQ code
			const winPath = wslToWindows(destPath);
			return `[CQ:image,file=file:///${winPath}]`;
		} catch (err: any) {
			return `[图片处理失败: ${err.message}]`;
		}
	});
}

const TOOL_NAME = "send_qq_message";

export default function mainSessionExtension(pi: ExtensionAPI) {
	let channelManager: ChannelManager | null = null;
	let currentExternalUser: { channel: string; userId: string } | null = null;
	let isExternalMessage = false;
	let savedCtx: ExtensionContext | null = null;
	let qqToolEnabled = false;

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

				// If agent is busy, abort first (like pressing ESC), wait for idle, then send
				if (savedCtx && !savedCtx.isIdle()) {
					savedCtx.abort();
					// Poll until idle, then send
					const waitAndSend = () => {
						if (savedCtx?.isIdle()) {
							pi.sendUserMessage(text);
						} else {
							setTimeout(waitAndSend, 100);
						}
					};
					setTimeout(waitAndSend, 100);
				} else {
					pi.sendUserMessage(text);
				}
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

	/** Enable or disable the QQ tool */
	function setQqToolEnabled(enabled: boolean): void {
		const active = pi.getActiveTools();
		if (enabled && !active.includes(TOOL_NAME)) {
			pi.setActiveTools([...active, TOOL_NAME]);
			qqToolEnabled = true;
		} else if (!enabled && active.includes(TOOL_NAME)) {
			pi.setActiveTools(active.filter((t) => t !== TOOL_NAME));
			qqToolEnabled = false;
		}
	}

	// Register send_qq_message tool
	pi.registerTool({
		name: TOOL_NAME,
		label: "Send QQ Message",
		description: "Send a message to QQ. Only works in main session. Use [image:/path/to/file] to include images.",
		parameters: Type.Object({
			message: Type.String({ description: "Message content to send. Use [image:/path/to/file] for images." }),
		}),
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			if (!channelManager) {
				return {
					content: [{ type: "text", text: "Error: Not main session. Run /main on first." }],
					details: {},
				};
			}
			try {
				// Process images before sending
				const processedMessage = processMessageForQQ(params.message);
				await channelManager.sendReply("qq", MY_QQ, processedMessage);
				return {
					content: [{ type: "text", text: `Message sent to QQ ${MY_QQ}` }],
					details: {},
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `Error: ${err.message}` }],
					details: {},
				};
			}
		},
	});

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
					let text = content.text.trim();
					if (text) {
						try {
							// Process images for QQ channel
							if (currentExternalUser.channel === "qq") {
								text = processMessageForQQ(text);
							}
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

	// Disable QQ tool by default on session start
	pi.on("session_start", async () => {
		setQqToolEnabled(false);
	});

	// Register /send_qq_message command to toggle the tool
	pi.registerCommand("send_qq_message", {
		description: "Toggle send_qq_message tool (on/off)",
		handler: async (args, ctx) => {
			const subcommand = args?.trim().toLowerCase();

			if (subcommand === "on") {
				setQqToolEnabled(true);
				ctx.ui.notify("send_qq_message tool enabled", "success");
				return;
			}

			if (subcommand === "off") {
				setQqToolEnabled(false);
				ctx.ui.notify("send_qq_message tool disabled", "info");
				return;
			}

			// Default: show status
			ctx.ui.notify(`send_qq_message: ${qqToolEnabled ? "enabled" : "disabled"}`, "info");
		},
	});
}
