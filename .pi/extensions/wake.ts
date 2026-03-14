/**
 * Wake Extension
 *
 * Injects a wake-up message at the start of a new session, instructing
 * the agent to read `.pi/wake.md` and follow the wake-up procedure.
 *
 * This gives the agent cross-session memory: `wake.md` defines what
 * context to restore, what files to read, what state to check.
 *
 * The wake message is only injected once per session (on the first prompt).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getLogger } from "@mariozechner/pi-logger";

const log = getLogger("wake-extension");

export default function (pi: ExtensionAPI) {
	pi.on("before_agent_start", async (_event, ctx) => {
		const wakeFilePath = path.join(ctx.cwd, ".pi", "wake.md");

		if (!fs.existsSync(wakeFilePath)) {
			log.info("wake.md not found at %s, skipping wake", wakeFilePath);
			return;
		}

		const entries = ctx.sessionManager.getBranch();

		// Scan from tail: wake found → skip, compaction found → need wake, neither → need wake
		let needsWake = true;
		for (let i = entries.length - 1; i >= 0; i--) {
			const e = entries[i];
			if (e.type === "custom_message" && e.customType === "wake") {
				needsWake = false;
				break;
			}
			if (e.type === "compaction") {
				needsWake = true;
				break;
			}
		}

		log.info("before_agent_start: entries=%d, needsWake=%s", entries.length, needsWake);

		if (!needsWake) {
			return;
		}

		log.info("injecting wake message, wakeFilePath=%s", wakeFilePath);

		return {
			message: {
				customType: "wake",
				content: `Wake-up procedure: Read the file ${wakeFilePath} and follow the instructions inside before responding to the user.`,
				display: true,
			},
		};
	});
}
