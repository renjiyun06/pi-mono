/**
 * Reload Tool Extension
 *
 * Exposes a tool that allows the agent to trigger extension reload.
 * This enables the agent to modify extension code and reload it
 * without requiring user intervention — critical for autonomous
 * operation where the agent needs to fix or improve its own extensions.
 *
 * Constraints:
 * - Only callable in the main session (checked via lock file).
 *   Outside main session there's no need for autonomous reload.
 *
 * Reload is deferred via setTimeout: the tool schedules a reload that
 * executes after the current agent event processing pipeline completes
 * entirely. Using setTimeout (instead of awaiting inside agent_end)
 * avoids calling handleReloadCommand() while the event pipeline is
 * still running — which would corrupt UI and session state.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const LOCK_FILE = join(homedir(), ".pi", "main-session.lock");

function isMainSession(): boolean {
	if (!existsSync(LOCK_FILE)) return false;
	try {
		const lock = JSON.parse(readFileSync(LOCK_FILE, "utf-8"));
		return lock.pid === process.pid;
	} catch {
		return false;
	}
}

/** Event channel used to notify other extensions that a reload is pending */
export const RELOAD_PENDING_CHANNEL = "reload_pending";

export default function reloadToolExtension(pi: ExtensionAPI) {
	let reloadPending = false;

	pi.on("agent_end", async (_event, ctx) => {
		if (!reloadPending) return;
		reloadPending = false;

		setTimeout(async () => {
			try {
				await ctx.reload();
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`Reload failed: ${msg}`, "error");
			}
		}, 50);
	});

	pi.registerTool({
		name: "reload_extensions",
		label: "Reload Extensions",
		description:
			"Reload all extensions, skills, prompts, and themes. Use this after modifying extension code to make changes take effect without restarting pi. Only available in main session.",
		parameters: Type.Object({}),
		execute: async (_toolCallId, _params, _signal, _onUpdate, _ctx) => {
			if (!isMainSession()) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Error: reload_extensions is only available in main session. Use /reload command manually instead.",
						},
					],
					details: undefined,
				};
			}

			reloadPending = true;
			// Notify other extensions (e.g., main-session autopilot) to skip
			// their agent_end actions since reload will happen first
			pi.events.emit(RELOAD_PENDING_CHANNEL, true);
			return {
				content: [
					{
						type: "text" as const,
						text: "Reload scheduled. Stop immediately — do not call any more tools or produce further output. The reload will execute after your response ends.",
					},
				],
				details: undefined,
			};
		},
	});
}
