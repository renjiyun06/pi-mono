/**
 * Idle Timer Extension
 *
 * Displays tmux session name and idle time in the footer status area.
 * When idle exceeds a threshold, prompts the agent to enter autonomous mode.
 *
 * Idle = neither the user nor the agent is doing anything.
 * Idle starts on: session_start, session_switch, agent_end.
 * Idle ends on: input (user sends a message).
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const AUTONOMOUS_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export default function (pi: ExtensionAPI) {
	let idleStart: number | undefined;
	let intervalId: ReturnType<typeof setInterval> | undefined;
	let tmuxSession: string | undefined;
	let autonomousTriggered = false;
	let statusCtx: { ui: { setStatus: (id: string, text: string | undefined) => void; theme: { fg: (color: string, text: string) => string } } } | undefined;

	function enterIdle() {
		idleStart = Date.now();
		autonomousTriggered = false;
	}

	function exitIdle() {
		idleStart = undefined;
		autonomousTriggered = false;
		updateStatus();
	}

	function formatDuration(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		if (minutes < 60) return `${minutes}m${remainingSeconds}s`;
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours}h${remainingMinutes}m`;
	}

	function updateStatus() {
		if (!statusCtx) return;
		const theme = statusCtx.ui.theme;
		const parts: string[] = [];

		if (tmuxSession) {
			parts.push(theme.fg("dim", tmuxSession));
		}

		if (idleStart !== undefined) {
			const elapsed = Date.now() - idleStart;
			if (elapsed >= 1000) {
				parts.push(theme.fg("dim", `idle ${formatDuration(elapsed)}`));
			}

			if (tmuxSession === "main" && elapsed >= AUTONOMOUS_THRESHOLD_MS && !autonomousTriggered) {
				autonomousTriggered = true;
				pi.sendUserMessage(
					"[This message was delivered by the idle-timer extension. You have been idle for 30 minutes, which means Ren is likely absent.]\n\nConsider entering autonomous mode.",
					{ deliverAs: "followUp" },
				);
			}
		}

		if (parts.length > 0) {
			statusCtx.ui.setStatus("idle-timer", parts.join(theme.fg("dim", " | ")));
		} else {
			statusCtx.ui.setStatus("idle-timer", undefined);
		}
	}

	// Idle starts
	pi.on("session_start", async (_event, ctx) => {
		statusCtx = ctx;

		const result = await pi.exec("tmux", ["display-message", "-p", "#S"]);
		tmuxSession = result.code === 0 ? result.stdout.trim() || undefined : undefined;

		enterIdle();
		if (intervalId) clearInterval(intervalId);
		intervalId = setInterval(updateStatus, 1000);
		updateStatus();
	});

	pi.on("session_switch", async (_event, _ctx) => {
		enterIdle();
	});

	pi.on("agent_end", async (_event, _ctx) => {
		enterIdle();
	});

	// Idle ends
	pi.on("input", async (_event, _ctx) => {
		exitIdle();
		return { action: "continue" as const };
	});

	pi.on("session_shutdown", async (_event, _ctx) => {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = undefined;
		}
	});
}
