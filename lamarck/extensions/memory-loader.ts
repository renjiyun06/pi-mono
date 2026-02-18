import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync } from "fs";

const PINS_FILE = "/home/lamarck/pi-mono/lamarck/vault/.pins.json";

function loadPinnedContent(): string | null {
	try {
		const pins = JSON.parse(readFileSync(PINS_FILE, "utf-8")) as Array<{
			text: string;
			label?: string;
		}>;
		if (pins.length === 0) return null;
		return pins.map((p) => `- ${p.label ? `**${p.label}**: ` : ""}${p.text}`).join("\n");
	} catch {
		return null;
	}
}

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
			const pinned = loadPinnedContent();
			const pinnedSection = pinned
				? `\n\nPinned context (preserved across compaction):\n${pinned}`
				: "";
			return {
				message: {
					customType: "memory-loader",
					content: `Read ${briefing} for operational context, then read ${vaultIndex} and follow the "Context Restore" guidelines to load session context (git log, daily notes). The briefing already contains priority-high note summaries — only load full notes on demand.${pinnedSection}`,
					display: true,
				},
			};
		}

		if (needsMemoryReload) {
			needsMemoryReload = false;
			const pinned = loadPinnedContent();
			const pinnedSection = pinned
				? `\n\nPinned context (preserved across compaction):\n${pinned}`
				: "";
			return {
				message: {
					customType: "memory-loader",
					content: `Context was compacted. Read ${briefing} for operational context, then read ${vaultIndex} and follow the "Context Restore" guidelines to restore context.${pinnedSection}`,
					display: true,
				},
			};
		}
	});
}
