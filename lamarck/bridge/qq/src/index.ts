/**
 * QQ Bridge — entry point
 *
 * Connects to NapCatQQ via WebSocket, routes incoming
 * QQ messages to AgentSession, and sends replies back.
 */

import { resolve } from "node:path";
import { NapCatClient, type PrivateMessageEvent } from "./napcat.js";
import { SessionPool } from "./session-pool.js";

// Configuration
const NAPCAT_WS_URL = process.env.NAPCAT_WS_URL || "ws://172.30.144.1:3001";
const CWD = process.env.BRIDGE_CWD || resolve(import.meta.dirname, "../../../..");

console.log("[Bridge] Starting QQ Bridge...");
console.log(`[Bridge] NapCat URL: ${NAPCAT_WS_URL}`);
console.log(`[Bridge] Working directory: ${CWD}`);

// Session pool
const pool = new SessionPool({ cwd: CWD });

// NapCat client
const client = new NapCatClient({
	url: NAPCAT_WS_URL,
	onConnected: () => {
		console.log("[Bridge] Ready to receive messages");
	},
	onPrivateMessage: (event) => {
		handlePrivateMessage(event).catch((err) => {
			console.error("[Bridge] Error handling message:", err);
		});
	},
	onError: (err) => {
		console.error("[Bridge] NapCat error:", err);
	},
	onDisconnected: (code, reason) => {
		console.log(`[Bridge] Disconnected (${code}), will not auto-reconnect`);
	},
});

async function handlePrivateMessage(event: PrivateMessageEvent): Promise<void> {
	const userId = String(event.user_id);
	const text = event.raw_message.trim();

	console.log(`[Bridge] Message from ${userId}: ${text.slice(0, 50)}${text.length > 50 ? "..." : ""}`);

	// Handle /new command
	if (text === "/new") {
		pool.reset(userId);
		await client.sendPrivateMessage(event.user_id, "新会话已开启");
		return;
	}

	// Handle /session command
	if (text === "/session") {
		const session = await pool.getOrCreate(userId);
		const stats = session.getSessionStats();

		let info = `会话统计\n\n`;
		info += `ID: ${stats.sessionId}\n`;
		info += `消息数: ${stats.totalMessages}\n`;
		info += `  用户: ${stats.userMessages}\n`;
		info += `  助手: ${stats.assistantMessages}\n`;
		info += `  工具调用: ${stats.toolCalls}\n\n`;
		info += `Token 用量:\n`;
		info += `  输入: ${stats.tokens.input.toLocaleString()}\n`;
		info += `  输出: ${stats.tokens.output.toLocaleString()}\n`;
		info += `  总计: ${stats.tokens.total.toLocaleString()}`;
		if (stats.cost > 0) {
			info += `\n\n费用: $${stats.cost.toFixed(4)}`;
		}

		await client.sendPrivateMessage(event.user_id, info);
		return;
	}

	// Get or create session
	const session = await pool.getOrCreate(userId);

	// Send each text block as it completes
	let sentCount = 0;

	const unsubscribe = session.subscribe((agentEvent) => {
		if (agentEvent.type === "message_update") {
			const evt = agentEvent.assistantMessageEvent;
			if (evt.type === "text_end" && evt.content.trim()) {
				client.sendPrivateMessage(event.user_id, evt.content.trim()).then(() => {
					console.log(`[Bridge] Sent text block to ${userId}, length: ${evt.content.length}`);
					sentCount++;
				}).catch((err) => {
					console.error(`[Bridge] Failed to send text block:`, err);
				});
			}
		}
	});

	try {
		// Send prompt to agent
		console.log(`[Bridge] Sending prompt to agent for ${userId}...`);
		await session.prompt(text);
		console.log(`[Bridge] Agent finished, sent ${sentCount} text blocks`);
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		console.error(`[Bridge] Agent error for ${userId}:`, errorMsg);
		await client.sendPrivateMessage(event.user_id, `错误: ${errorMsg}`);
	} finally {
		unsubscribe();
		// Small delay to ensure async sends complete
		await new Promise((r) => setTimeout(r, 100));
	}
}

// Start
client.connect();

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("\n[Bridge] Shutting down...");
	client.close();
	process.exit(0);
});
