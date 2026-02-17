/**
 * Session lock management
 *
 * Ensures only one pi instance can be the "main session" at a time.
 * Lock file location: ~/.pi/main-session.lock
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

export interface LockInfo {
	pid: number;
	sessionId: string;
	startedAt: string;
	autopilot?: boolean;
}

const PI_DIR = join(homedir(), ".pi");
const LOCK_FILE = join(PI_DIR, "main-session.lock");

/** Check if a process is alive */
function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0); // Signal 0 doesn't kill, just checks existence
		return true;
	} catch {
		return false;
	}
}

/** Read current lock info, or null if no valid lock */
export function readLock(): LockInfo | null {
	if (!existsSync(LOCK_FILE)) {
		return null;
	}

	try {
		const content = readFileSync(LOCK_FILE, "utf-8");
		const lock = JSON.parse(content) as LockInfo;

		// Validate lock has required fields
		if (typeof lock.pid !== "number" || typeof lock.startedAt !== "string") {
			return null;
		}

		return lock;
	} catch {
		return null;
	}
}

/** Check if there's an active main session (lock exists and process alive) */
export function hasActiveMainSession(): { active: boolean; lock: LockInfo | null } {
	const lock = readLock();

	if (!lock) {
		return { active: false, lock: null };
	}

	if (!isProcessAlive(lock.pid)) {
		// Stale lock, process is dead
		return { active: false, lock };
	}

	return { active: true, lock };
}

/** Check if current process holds the lock */
export function isMainSession(): boolean {
	const lock = readLock();
	return lock !== null && lock.pid === process.pid;
}

export interface AcquireResult {
	success: boolean;
	existingLock?: LockInfo;
}

/** Try to acquire the lock */
export function acquireLock(sessionId: string): AcquireResult {
	const { active, lock } = hasActiveMainSession();

	if (active) {
		return { success: false, existingLock: lock! };
	}

	// Clean up stale lock if exists
	if (lock && !active) {
		try {
			unlinkSync(LOCK_FILE);
		} catch {
			// Ignore
		}
	}

	// Ensure directory exists
	if (!existsSync(PI_DIR)) {
		mkdirSync(PI_DIR, { recursive: true });
	}

	// Write new lock
	const newLock: LockInfo = {
		pid: process.pid,
		sessionId,
		startedAt: new Date().toISOString(),
	};

	writeFileSync(LOCK_FILE, JSON.stringify(newLock, null, 2));
	return { success: true };
}

/** Update autopilot state in the lock file (only if we own it) */
export function updateLockAutopilot(autopilot: boolean): boolean {
	const lock = readLock();
	if (!lock || lock.pid !== process.pid) {
		return false;
	}

	lock.autopilot = autopilot;
	writeFileSync(LOCK_FILE, JSON.stringify(lock, null, 2));
	return true;
}

/** Release the lock (only if we own it) */
export function releaseLock(): boolean {
	const lock = readLock();

	if (!lock || lock.pid !== process.pid) {
		return false;
	}

	try {
		unlinkSync(LOCK_FILE);
		return true;
	} catch {
		return false;
	}
}
