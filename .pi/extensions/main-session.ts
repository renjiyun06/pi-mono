/**
 * Main Session Extension
 *
 * Provides a lock mechanism so only one pi instance can be the "main session".
 * Other extensions can check main session status via the exported helpers.
 *
 * Commands:
 *   /main on   — Acquire main session lock
 *   /main off  — Release lock
 *   /main      — Show current status
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
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
// Extension
// ============================================================================

export default function mainSessionExtension(pi: ExtensionAPI) {
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

				releaseLock();
				ctx.ui.notify("Main session released", "info");
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

	// Clean up lock on shutdown if we own it
	pi.on("session_shutdown", async () => {
		if (isMainSession()) {
			releaseLock();
		}
	});
}

// Export for other extensions to check
export { isMainSession, readLock };
