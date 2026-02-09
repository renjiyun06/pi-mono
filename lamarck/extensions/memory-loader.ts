import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	let firstTurn = true;

	pi.on("session_start", () => {
		firstTurn = true;
	});

	pi.on("before_agent_start", async () => {
		if (!firstTurn) return;
		firstTurn = false;

		return {
			message: {
				customType: "memory-loader",
				content: "Read the memory files under lamarck/memory/ before responding.",
				display: true,
			},
		};
	});
}
