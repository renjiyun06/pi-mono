/**
 * Reload Tool Extension
 *
 * Exposes a tool that allows the agent to trigger extension reload.
 * This enables the agent to modify extension code and reload it
 * without requiring user intervention — critical for autonomous
 * operation where the agent needs to fix or improve its own extensions.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function reloadToolExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "reload_extensions",
		label: "Reload Extensions",
		description:
			"Reload all extensions, skills, prompts, and themes. Use this after modifying extension code to make changes take effect without restarting pi.",
		parameters: Type.Object({}),
		execute: async (_toolCallId, _params, _signal, _onUpdate, ctx) => {
			try {
				await ctx.reload();
				return {
					resultForAssistant: "Extensions reloaded successfully.",
				};
			} catch (error) {
				return {
					resultForAssistant: `Reload failed: ${error instanceof Error ? error.message : String(error)}`,
					isError: true,
				};
			}
		},
	});
}
