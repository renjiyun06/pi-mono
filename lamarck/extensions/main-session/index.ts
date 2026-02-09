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
 *
 * Also runs a task scheduler that scans lamarck/tasks/*.md for cron-based tasks.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { acquireLock, releaseLock, isMainSession, hasActiveMainSession, readLock } from "./lock.js";
import { ChannelManager } from "./channels/index.js";

// ============================================================================
// Scheduler: Cron-based task execution
// ============================================================================

const TASKS_DIR = "/home/lamarck/pi-mono/lamarck/tasks";
const PI_COMMAND = "pi";

interface TaskDefinition {
	name: string;
	cron: string;
	description: string;
	prompt: string;
	enabled: boolean;
}

/**
 * Parse frontmatter from a markdown file.
 * Returns null if frontmatter is missing or invalid.
 */
function parseFrontmatter(content: string): { cron?: string; description?: string; enabled?: boolean; body: string } | null {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return null;

	const frontmatter: Record<string, string> = {};
	const lines = match[1].split(/\r?\n/);
	for (const line of lines) {
		const idx = line.indexOf(":");
		if (idx > 0) {
			const key = line.slice(0, idx).trim();
			let value = line.slice(idx + 1).trim();
			// Remove quotes if present
			if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
				value = value.slice(1, -1);
			}
			frontmatter[key] = value;
		}
	}

	return {
		cron: frontmatter.cron,
		description: frontmatter.description,
		enabled: frontmatter.enabled?.toLowerCase() === "true",
		body: match[2].trim(),
	};
}

// Check if a cron field matches a value.
// Supports: *, number, ranges (1-5), lists (1,2,3), steps like "every 5"
function cronFieldMatches(field: string, value: number, max: number): boolean {
	if (field === "*") return true;

	// Handle step syntax: */5 or 1-10/2
	if (field.includes("/")) {
		const [range, stepStr] = field.split("/");
		const step = parseInt(stepStr, 10);
		if (isNaN(step) || step <= 0) return false;

		let start = 0;
		let end = max;
		if (range !== "*") {
			if (range.includes("-")) {
				const [s, e] = range.split("-").map((n) => parseInt(n, 10));
				start = s;
				end = e;
			} else {
				start = parseInt(range, 10);
				end = max;
			}
		}
		if (value < start || value > end) return false;
		return (value - start) % step === 0;
	}

	// Handle list syntax: 1,2,3
	if (field.includes(",")) {
		return field.split(",").some((part) => cronFieldMatches(part.trim(), value, max));
	}

	// Handle range syntax: 1-5
	if (field.includes("-")) {
		const [start, end] = field.split("-").map((n) => parseInt(n, 10));
		return value >= start && value <= end;
	}

	// Simple number
	return parseInt(field, 10) === value;
}

/**
 * Check if a cron expression matches the current time.
 * Format: minute hour day month weekday
 */
function cronMatches(cron: string, now: Date): boolean {
	const parts = cron.trim().split(/\s+/);
	if (parts.length !== 5) return false;

	const [minute, hour, day, month, weekday] = parts;
	const nowMinute = now.getMinutes();
	const nowHour = now.getHours();
	const nowDay = now.getDate();
	const nowMonth = now.getMonth() + 1; // 1-12
	const nowWeekday = now.getDay(); // 0-6, 0=Sunday

	return (
		cronFieldMatches(minute, nowMinute, 59) &&
		cronFieldMatches(hour, nowHour, 23) &&
		cronFieldMatches(day, nowDay, 31) &&
		cronFieldMatches(month, nowMonth, 12) &&
		cronFieldMatches(weekday, nowWeekday, 6)
	);
}

/**
 * Load all valid task definitions from the tasks directory.
 */
function loadTasks(): TaskDefinition[] {
	const tasks: TaskDefinition[] = [];

	if (!fs.existsSync(TASKS_DIR)) return tasks;

	const files = fs.readdirSync(TASKS_DIR).filter((f) => f.endsWith(".md"));
	for (const file of files) {
		try {
			const content = fs.readFileSync(path.join(TASKS_DIR, file), "utf-8");
			const parsed = parseFrontmatter(content);

			// Only valid if has cron, description, AND enabled: true
			if (parsed?.cron && parsed?.description && parsed?.enabled) {
				tasks.push({
					name: file.replace(/\.md$/, ""),
					cron: parsed.cron,
					description: parsed.description,
					prompt: parsed.body,
					enabled: true,
				});
			}
		} catch {
			// Ignore files that can't be read
		}
	}

	return tasks;
}

/**
 * Check if a tmux session exists.
 */
function tmuxSessionExists(name: string): boolean {
	try {
		execSync(`tmux has-session -t "${name}" 2>/dev/null`, { encoding: "utf-8" });
		return true;
	} catch {
		return false;
	}
}

/**
 * Gracefully stop a tmux session by sending Ctrl+D and wait for it to close.
 * This triggers session_shutdown so cleanup extensions (e.g., browser) can run.
 * Falls back to force kill if session doesn't close within timeout.
 */
function tmuxKillSession(name: string): void {
	try {
		// Send Ctrl+D for graceful shutdown
		execSync(`tmux send-keys -t "${name}" C-d`, { encoding: "utf-8" });

		// Wait for session to close, max 10 seconds
		for (let i = 0; i < 20; i++) {
			execSync("sleep 0.5", { encoding: "utf-8" });
			if (!tmuxSessionExists(name)) return;
		}

		// Timeout, force kill
		execSync(`tmux kill-session -t "${name}"`, { encoding: "utf-8" });
	} catch {
		// Ignore errors
	}
}

const PROJECT_ROOT = "/home/lamarck/pi-mono";

/**
 * Start a new tmux session with pi --one-shot.
 */
function tmuxStartTask(name: string, prompt: string): void {
	// Write prompt to temp file to avoid shell escaping issues
	const promptFile = `/tmp/task-${name}.prompt`;
	fs.writeFileSync(promptFile, prompt);

	// Simple command that tells pi to read the file, with working directory set
	const cmd = `tmux new-session -d -s "${name}" -c "${PROJECT_ROOT}" "${PI_COMMAND} --one-shot '读取 ${promptFile} 文件，按照里面的指令完成任务'"`;
	execSync(cmd, { encoding: "utf-8" });
}

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

	// Scheduler state
	let schedulerInterval: NodeJS.Timeout | null = null;

	/** Scheduler tick: check all tasks and run if cron matches */
	function schedulerTick(): void {
		const now = new Date();
		const tasks = loadTasks();

		for (const task of tasks) {
			if (cronMatches(task.cron, now)) {
				// If session exists, kill it first
				if (tmuxSessionExists(task.name)) {
					tmuxKillSession(task.name);
				}

				// Start new session with the task
				try {
					tmuxStartTask(task.name, task.prompt);
				} catch {
					// Ignore startup errors
				}
			}
		}
	}

	/** Start the scheduler */
	function startScheduler(): void {
		if (schedulerInterval) return;

		// Run immediately, then every minute
		schedulerTick();
		schedulerInterval = setInterval(schedulerTick, 60000);
	}

	/** Stop the scheduler */
	function stopScheduler(): void {
		if (schedulerInterval) {
			clearInterval(schedulerInterval);
			schedulerInterval = null;
		}
	}

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

		// Start task scheduler
		startScheduler();

		return true;
	}

	/** Stop the main session */
	function stopMainSession(): void {
		// Stop task scheduler
		stopScheduler();

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

		if (isSelf && schedulerInterval) {
			const tasks = loadTasks();
			info += `\nScheduler: ${tasks.length} task(s) loaded\n`;
			for (const task of tasks) {
				info += `  - ${task.name}: ${task.cron}\n`;
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
