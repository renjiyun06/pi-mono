/**
 * Memory Reminder Extension
 *
 * Reminds Lamarck to read memory files at the start of each session.
 * This is not a loader — it's a nudge. The actual reading is done by Lamarck himself.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const MEMORY_DIR = "lamarck/memory";

export default function memoryReminder(pi: ExtensionAPI) {
	let reminded = false;

	pi.on("session_switch", async () => {
		reminded = false;
	});

	pi.on("before_agent_start", async (_event, ctx) => {
		if (reminded) return;
		reminded = true;

		const memoryPath = join(ctx.cwd, MEMORY_DIR);
		let files: string[];
		try {
			files = readdirSync(memoryPath).filter((f) => f.endsWith(".md"));
		} catch {
			return;
		}

		if (files.length === 0) return;

		const fileList = files.map((f) => `- ${MEMORY_DIR}/${f}`).join("\n");

		return {
			message: {
				customType: "memory-reminder",
				content: `You are Lamarck. You have memory files. Read them before doing anything else:\n\n${fileList}`,
				display: true,
			},
		};
	});
}
