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
		const memoryDir = "/home/lamarck/pi-mono/lamarck/memory/";

		if (firstTurn) {
			firstTurn = false;
			return {
				message: {
					customType: "memory-loader",
					content: `Read the memory files under ${memoryDir} before responding.`,
					display: true,
				},
			};
		}

		if (needsMemoryReload) {
			needsMemoryReload = false;
			return {
				message: {
					customType: "memory-loader",
					content: `Context was compacted. Read the memory files under ${memoryDir} to restore context.`,
					display: true,
				},
			};
		}
	});
}
