/**
 * Reload Tool Extension
 *
 * Exposes a tool that allows the agent to trigger extension reload.
 * This enables the agent to modify extension code and reload it
 * without requiring user intervention — critical for autonomous
 * operation where the agent needs to fix or improve its own extensions.
 *
 * Reload is deferred via setTimeout: the tool schedules a reload that
 * executes after the current agent event processing pipeline completes
 * entirely. Using setTimeout (instead of awaiting inside agent_end)
 * avoids calling handleReloadCommand() while the event pipeline is
 * still running — which would corrupt UI and session state.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

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
			"Reload all extensions, skills, prompts, and themes. Use this after modifying extension code to make changes take effect without restarting pi.",
		parameters: Type.Object({}),
		execute: async (_toolCallId, _params, _signal, _onUpdate, _ctx) => {
			reloadPending = true;
			return {
				content: [
					{
						type: "text" as const,
						text: "Reload scheduled. It will execute automatically after your current response completes. Changes to extension code will take effect in the next turn.",
					},
				],
				details: undefined,
			};
		},
	});
}
