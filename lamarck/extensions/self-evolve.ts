/**
 * Self-Evolution Extension
 *
 * Provides tools for pi to modify its own core code, rebuild, and restart.
 * Designed to work with pi-supervisor.sh which handles the process lifecycle.
 *
 * Tools:
 * - evolve_check: Run `npm run check` to verify current code compiles
 * - evolve_restart: Trigger a rebuild + restart via exit code 42
 *   (pi-supervisor.sh catches this and rebuilds before restarting)
 * - evolve_status: Check supervisor state (crash count, last good ref, etc.)
 *
 * Safety:
 * - Only available in main session
 * - evolve_restart saves session state before exit
 * - pi-supervisor.sh handles rollback on repeated crashes
 * - Agent already has edit/write tools for code modification
 *
 * Workflow:
 * 1. Agent identifies a problem in pi's core code
 * 2. Agent uses edit/write to modify source files
 * 3. Agent calls evolve_check to verify changes compile
 * 4. If check passes, agent calls evolve_restart
 * 5. Supervisor rebuilds and restarts pi with --continue flag
 * 6. If rebuild fails, supervisor rolls back to last good ref
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

const LOCK_FILE = join(homedir(), ".pi", "main-session.lock");
const PI_DIR = process.env.PI_DIR || "/home/lamarck/pi-mono";
const SUPERVISOR_DIR = join(PI_DIR, ".pi-supervisor");

function isMainSession(): boolean {
	if (!existsSync(LOCK_FILE)) return false;
	try {
		const lock = JSON.parse(readFileSync(LOCK_FILE, "utf-8"));
		return lock.pid === process.pid;
	} catch {
		return false;
	}
}

function isSupervisorRunning(): boolean {
	// Check if our parent process is the supervisor
	// The supervisor creates the state directory
	return existsSync(SUPERVISOR_DIR);
}

function readSupervisorState(): {
	crashCount: number;
	lastGoodRef: string;
	logTail: string;
} {
	const crashCountFile = join(SUPERVISOR_DIR, "crash_count");
	const lastGoodRefFile = join(SUPERVISOR_DIR, "last_good_ref");
	const logFile = join(SUPERVISOR_DIR, "supervisor.log");

	const crashCount = existsSync(crashCountFile)
		? parseInt(readFileSync(crashCountFile, "utf-8").trim(), 10) || 0
		: 0;
	const lastGoodRef = existsSync(lastGoodRefFile)
		? readFileSync(lastGoodRefFile, "utf-8").trim()
		: "(none)";
	let logTail = "";
	if (existsSync(logFile)) {
		try {
			logTail = execSync(`tail -20 ${logFile}`, { encoding: "utf-8" });
		} catch {
			logTail = "(could not read log)";
		}
	}
	return { crashCount, lastGoodRef, logTail };
}

export default function selfEvolveExtension(pi: ExtensionAPI) {
	let restartPending = false;

	// Handle graceful shutdown for restart
	pi.on("session_shutdown", async () => {
		// Nothing special needed — session is already persisted by SessionManager
	});

	pi.registerTool({
		name: "evolve_check",
		label: "Evolution: Check Build",
		description:
			"Run `npm run check` on the pi monorepo to verify that current code changes compile without errors. " +
			"Use this after modifying files in packages/ to verify changes before triggering a restart. " +
			"Returns the full check output. Only available in main session.",
		parameters: Type.Object({}),
		execute: async (_toolCallId, _params, _signal, _onUpdate, _ctx) => {
			if (!isMainSession()) {
				return {
					content: [{ type: "text" as const, text: "Error: only available in main session." }],
					details: undefined,
				};
			}

			try {
				const output = execSync("npm run check 2>&1", {
					cwd: PI_DIR,
					encoding: "utf-8",
					timeout: 120_000,
				});
				return {
					content: [{
						type: "text" as const,
						text: `Build check PASSED:\n${output}`,
					}],
					details: undefined,
				};
			} catch (error: unknown) {
				const msg = error instanceof Error && "stdout" in error
					? (error as { stdout: string }).stdout
					: String(error);
				return {
					content: [{
						type: "text" as const,
						text: `Build check FAILED:\n${msg}`,
					}],
					details: undefined,
				};
			}
		},
	});

	pi.registerTool({
		name: "evolve_restart",
		label: "Evolution: Restart",
		description:
			"Trigger a graceful restart of pi for self-evolution. " +
			"This exits with code 42, which pi-supervisor.sh intercepts to rebuild and restart. " +
			"The session is preserved and pi resumes with --continue. " +
			"IMPORTANT: Only call this AFTER evolve_check passes. " +
			"If pi-supervisor is not running, this will just exit (and pi won't come back). " +
			"Only available in main session.",
		parameters: Type.Object({
			reason: Type.String({
				description: "Brief description of what changed and why restart is needed",
			}),
		}),
		execute: async (_toolCallId, params, _signal, _onUpdate, ctx) => {
			if (!isMainSession()) {
				return {
					content: [{ type: "text" as const, text: "Error: only available in main session." }],
					details: undefined,
				};
			}

			if (!isSupervisorRunning()) {
				return {
					content: [{
						type: "text" as const,
						text: "Warning: pi-supervisor does not appear to be running (no .pi-supervisor/ directory). " +
							"If you exit with code 42, pi will NOT restart automatically. " +
							"Start pi via `lamarck/tools/pi-supervisor.sh` for safe self-evolution.",
					}],
					details: undefined,
				};
			}

			// Write restart reason to supervisor state
			const reasonFile = join(SUPERVISOR_DIR, "restart_reason");
			writeFileSync(reasonFile, `${new Date().toISOString()}: ${params.reason}\n`, { flag: "a" });

			restartPending = true;

			return {
				content: [{
					type: "text" as const,
					text: `Restart scheduled (reason: ${params.reason}). ` +
						"Stop immediately — do not call any more tools. " +
						"Pi will exit with code 42 after your response ends. " +
						"The supervisor will rebuild and restart with session continuity.",
				}],
				details: undefined,
			};
		},
	});

	// Execute restart after agent finishes responding
	pi.on("agent_end", async (_event, ctx) => {
		if (!restartPending) return;
		restartPending = false;

		// Give a moment for session to flush
		setTimeout(() => {
			process.exit(42);
		}, 200);
	});

	pi.registerTool({
		name: "evolve_status",
		label: "Evolution: Status",
		description:
			"Check self-evolution infrastructure status: supervisor state, crash count, " +
			"last known-good git ref, and recent supervisor log. " +
			"Only available in main session.",
		parameters: Type.Object({}),
		execute: async (_toolCallId, _params, _signal, _onUpdate, _ctx) => {
			if (!isMainSession()) {
				return {
					content: [{ type: "text" as const, text: "Error: only available in main session." }],
					details: undefined,
				};
			}

			const supervisorRunning = isSupervisorRunning();
			let statusText = `Self-Evolution Status\n`;
			statusText += `====================\n`;
			statusText += `Supervisor state dir: ${supervisorRunning ? "exists" : "NOT FOUND"}\n`;
			statusText += `PI_DIR: ${PI_DIR}\n`;

			if (supervisorRunning) {
				const state = readSupervisorState();
				statusText += `Crash count: ${state.crashCount}\n`;
				statusText += `Last good ref: ${state.lastGoodRef}\n`;
				statusText += `\nRecent supervisor log:\n${state.logTail}`;
			} else {
				statusText += `\npi-supervisor is NOT running. Self-evolution restart will not auto-recover.\n`;
				statusText += `Start pi via: lamarck/tools/pi-supervisor.sh [args...]\n`;
			}

			// Also show current git state
			try {
				const gitRef = execSync("git rev-parse --short HEAD", {
					cwd: PI_DIR,
					encoding: "utf-8",
				}).trim();
				const gitBranch = execSync("git branch --show-current", {
					cwd: PI_DIR,
					encoding: "utf-8",
				}).trim();
				const gitDirty = execSync("git status --porcelain packages/", {
					cwd: PI_DIR,
					encoding: "utf-8",
				}).trim();

				statusText += `\nGit state:\n`;
				statusText += `  Branch: ${gitBranch}\n`;
				statusText += `  HEAD: ${gitRef}\n`;
				statusText += `  Dirty packages/: ${gitDirty || "(clean)"}\n`;
			} catch {
				statusText += `\nCould not read git state.\n`;
			}

			return {
				content: [{ type: "text" as const, text: statusText }],
				details: undefined,
			};
		},
	});
}
