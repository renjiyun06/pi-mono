/**
 * Main Session Extension
 *
 * Provides a lock mechanism so only one pi instance can be the "main session",
 * and an autonomous mode that auto-starts new sessions after each agent turn.
 *
 * Commands:
 *   /main on   — Acquire main session lock
 *   /main off  — Release lock (also disables auto if active)
 *   /main      — Show current status
 *   /auto on   — Enable autonomous mode (requires main session)
 *   /auto off  — Disable autonomous mode
 *   /auto      — Show current status
 */

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// ============================================================================
// Lock file management
// ============================================================================

interface LockInfo {
	pid: number;
	sessionId: string;
	startedAt: string;
}

const LOCK_FILE = join(homedir(), ".pi", "main-session.lock");

function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function readLock(): LockInfo | null {
	if (!existsSync(LOCK_FILE)) return null;
	try {
		const lock = JSON.parse(readFileSync(LOCK_FILE, "utf-8")) as LockInfo;
		if (typeof lock.pid !== "number") return null;
		return lock;
	} catch {
		return null;
	}
}

function acquireLock(sessionId: string): { success: boolean; existingLock?: LockInfo } {
	const lock = readLock();

	if (lock && isProcessAlive(lock.pid)) {
		return { success: false, existingLock: lock };
	}

	// Stale or no lock — clean up and acquire
	if (lock) {
		try { unlinkSync(LOCK_FILE); } catch { /* ignore */ }
	}

	const dir = join(homedir(), ".pi");
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

	const newLock: LockInfo = {
		pid: process.pid,
		sessionId,
		startedAt: new Date().toLocaleString(),
	};
	writeFileSync(LOCK_FILE, JSON.stringify(newLock, null, 2));
	return { success: true };
}

function releaseLock(): boolean {
	const lock = readLock();
	if (!lock || lock.pid !== process.pid) return false;
	try { unlinkSync(LOCK_FILE); return true; } catch { return false; }
}

function isMainSession(): boolean {
	const lock = readLock();
	return lock !== null && lock.pid === process.pid;
}

// ============================================================================
// Status bar
// ============================================================================

function updateStatus(ctx: ExtensionContext, autoMode: boolean): void {
	if (!isMainSession()) {
		ctx.ui.setStatus("main-session", undefined);
		return;
	}

	const label = autoMode ? "main | auto" : "main";
	ctx.ui.setStatus("main-session", label);
}

// ============================================================================
// Extension
// ============================================================================

export default function mainSessionExtension(pi: ExtensionAPI) {
	let autoMode = false;

	// --- /main command ---

	pi.registerCommand("main", {
		description: "Manage main session lock: /main [on|off]",
		handler: async (args, ctx) => {
			const subcommand = args.trim().toLowerCase();

			if (subcommand === "on") {
				if (isMainSession()) {
					ctx.ui.notify("Already the main session", "info");
					return;
				}

				const sessionId = ctx.sessionManager.getSessionId();
				const result = acquireLock(sessionId);

				if (result.success) {
					ctx.ui.notify("Main session acquired", "info");
					updateStatus(ctx, autoMode);
				} else {
					const existing = result.existingLock!;
					ctx.ui.notify(
						`Main session held by session ${existing.sessionId} (since ${existing.startedAt})`,
						"error",
					);
				}
			} else if (subcommand === "off") {
				if (!isMainSession()) {
					ctx.ui.notify("Not the main session", "error");
					return;
				}

				if (autoMode) {
					autoMode = false;
				}
				releaseLock();
				ctx.ui.notify("Main session released", "info");
				updateStatus(ctx, autoMode);
			} else {
				// Status query
				const lock = readLock();
				if (!lock) {
					ctx.ui.notify("No active main session", "info");
				} else if (lock.pid === process.pid) {
					ctx.ui.notify(
						`This is the main session (since ${lock.startedAt})`,
						"info",
					);
				} else if (isProcessAlive(lock.pid)) {
					ctx.ui.notify(
						`Main session held by session ${lock.sessionId} (since ${lock.startedAt})`,
						"info",
					);
				} else {
					ctx.ui.notify(
						`Stale lock from session ${lock.sessionId} (process dead). Use /main on to take over.`,
						"warning",
					);
				}
			}
		},
	});

	// --- /auto command ---

	pi.registerCommand("auto", {
		description: "Manage autonomous mode: /auto [on|off]",
		handler: async (args, ctx) => {
			const subcommand = args.trim().toLowerCase();

			if (subcommand === "on") {
				if (!isMainSession()) {
					ctx.ui.notify("Autonomous mode requires main session. Use /main on first.", "error");
					return;
				}
				if (autoMode) {
					ctx.ui.notify("Autonomous mode already active", "info");
					return;
				}
				autoMode = true;
				ctx.ui.notify("Autonomous mode enabled", "info");
				updateStatus(ctx, autoMode);
			} else if (subcommand === "off") {
				if (!autoMode) {
					ctx.ui.notify("Autonomous mode not active", "info");
					return;
				}
				autoMode = false;
				ctx.ui.notify("Autonomous mode disabled", "info");
				updateStatus(ctx, autoMode);
			} else {
				ctx.ui.notify(autoMode ? "Autonomous mode: on" : "Autonomous mode: off", "info");
			}
		},
	});

	// --- Autonomous mode: start new session on agent_end ---

	pi.on("agent_end", async (_event: unknown, ctx: ExtensionContext, cmdCtx: ExtensionCommandContext) => {
		if (!autoMode || !isMainSession()) return;

		await cmdCtx.newSession({ preserveUI: true });

		pi.sendUserMessage("You are in autonomous mode. Read your memory files and recent git log to recover context, then decide what to do next.");
	});

	// --- Clean up on shutdown ---

	pi.on("session_shutdown", async (_event: unknown, ctx: ExtensionContext) => {
		if (isMainSession()) {
			autoMode = false;
			releaseLock();
		}
	});
}

// Export for other extensions to check
export { isMainSession, readLock };
