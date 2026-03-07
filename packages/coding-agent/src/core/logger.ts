/**
 * Centralized logger for pi.
 *
 * Writes structured JSON logs to ~/.pi/agent/pi.log (or $PI_CODING_AGENT_DIR/pi.log).
 * Log level defaults to "info", configurable via PI_LOG_LEVEL environment variable.
 *
 * All log entries include an `agent` field (tmux session name or "unknown") to
 * distinguish logs from multiple concurrent agent processes.
 *
 * Usage:
 *   import { logger, createLog } from "@mariozechner/pi-coding-agent";
 *
 *   // Create a child logger with component context
 *   const log = createLog("compaction");
 *   log.info("something happened");
 *   log.debug({ detail: 42 }, "verbose info");
 */

import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import pino from "pino";
import { getAgentDir } from "../config.js";

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

function resolveLogLevel(): LogLevel {
	const env = process.env.PI_LOG_LEVEL?.toLowerCase();
	if (env && LOG_LEVELS.includes(env as LogLevel)) {
		return env as LogLevel;
	}
	return "info";
}

function resolveLogPath(): string {
	const agentDir = getAgentDir();
	mkdirSync(agentDir, { recursive: true });
	return join(agentDir, "pi.log");
}

function resolveAgentName(): string {
	try {
		return execSync("tmux display-message -p '#S'", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
	} catch {
		return "unknown";
	}
}

export const logger: pino.Logger = pino(
	{
		level: resolveLogLevel(),
		timestamp: pino.stdTimeFunctions.isoTime,
		base: { agent: resolveAgentName() },
	},
	pino.destination({ dest: resolveLogPath(), sync: false }),
);

/**
 * Create a child logger with component context.
 *
 * @param component - Module or extension identifier (e.g. "compaction", "ext:autonomous")
 */
export function createLog(component: string): pino.Logger {
	return logger.child({ component });
}
