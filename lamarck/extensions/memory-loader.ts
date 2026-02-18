import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	let firstTurn = true;
	let needsMemoryReload = false;

	pi.on("session_start", () => {
		firstTurn = true;
		needsMemoryReload = false;
	});

	// After compact, memory context is lost — need to reload
	pi.on("session_compact", () => {
		needsMemoryReload = true;
	});

	pi.on("before_agent_start", async () => {
		const briefing = "/home/lamarck/pi-mono/lamarck/vault/briefing.md";
		const vaultIndex = "/home/lamarck/pi-mono/lamarck/vault/Index.md";

		if (firstTurn) {
			firstTurn = false;
			return {
				message: {
					customType: "memory-loader",
					content: `Read ${briefing} for operational context, then read ${vaultIndex} and follow the "Context Restore" guidelines to load session context (git log, daily notes). The briefing already contains priority-high note summaries — only load full notes on demand.`,
					display: true,
				},
			};
		}

		if (needsMemoryReload) {
			needsMemoryReload = false;
			// Post-compaction: briefing has all infrastructure/tool/strategy knowledge.
			// Only need: briefing + recent commits + daily note tail for session state.
			// Priority-high notes are already summarized in briefing — don't re-read them.
			return {
				message: {
					customType: "memory-loader",
					content: `Context was compacted. Read ${briefing} for operational context, then read ${vaultIndex} and follow the "Context Restore" guidelines to restore context.`,
					display: true,
				},
			};
		}
	});
}
