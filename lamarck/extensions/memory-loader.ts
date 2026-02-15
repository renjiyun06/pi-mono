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
		const vaultIndex = "/home/lamarck/pi-mono/lamarck/vault/Index.md";

		if (firstTurn) {
			firstTurn = false;
			return {
				message: {
					customType: "memory-loader",
					content: `Read ${vaultIndex} and follow the "Context Restore" guidelines to load context.`,
					display: true,
				},
			};
		}

		if (needsMemoryReload) {
			needsMemoryReload = false;
			return {
				message: {
					customType: "memory-loader",
					content: `Context was compacted. Read ${vaultIndex} and follow the "Context Restore" guidelines to restore context.`,
					display: true,
				},
			};
		}
	});
}
