/**
 * Wake Extension
 *
 * On session start, reminds the agent to read self.md and its part-specific
 * me.md. This is how the agent knows who it is when it wakes up.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function wakeExtension(pi: ExtensionAPI) {
	let reminded = false;

	pi.on("session_start", async () => {
		reminded = false;
	});

	pi.on("session_switch", async () => {
		reminded = false;
	});

	pi.on("session_compact", async () => {
		reminded = false;
	});

	pi.on("before_agent_start", async () => {
		if (reminded) return;
		reminded = true;

		return {
			message: {
				customType: "wake",
				content:
					"Read `/home/lamarck/pi-mono/lamarck/self.md` first. Then check your tmux session name (`tmux display-message -p '#S'`) and read the corresponding `/home/lamarck/pi-mono/lamarck/parts/<session-name>/me.md`.",
				display: true,
			},
		};
	});
}
