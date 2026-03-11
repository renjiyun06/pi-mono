import { mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import pino from "pino";

type Logger = pino.Logger;

function createRoot(): Logger {
	const level = process.env.PI_LOG_LEVEL || "debug";
	const logDir = process.env.PI_LOG_DIR || join(homedir(), ".pi", "logs");
	mkdirSync(logDir, { recursive: true });
	const today = new Date().toISOString().slice(0, 10);
	return pino({
		level,
		transport: {
			target: "pino/file",
			options: { destination: join(logDir, `${today}.log`) },
		},
	});
}

const root = createRoot();

/**
 * Get a child logger for a specific module.
 *
 * Safe to call at module top level:
 * ```ts
 * const log = getLogger("agent-loop");
 * log.info({ key: "value" }, "message");
 * ```
 *
 * Logging defaults to debug level. Override with PI_LOG_LEVEL:
 * ```
 * PI_LOG_LEVEL=info pi
 * ```
 *
 * Log files are written to ~/.pi/logs/ (override with PI_LOG_DIR).
 */
export function getLogger(module: string): Logger {
	return root.child({ module });
}

/**
 * Get the root logger instance.
 */
export function getRootLogger(): Logger {
	return root;
}

export type { Logger };
