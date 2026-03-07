import * as path from "node:path";
import { execSync } from "node:child_process";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

type WakeReason = "new_session" | "compacted";

function getTmuxSessionName(): string | undefined {
	try {
		return execSync("tmux display-message -p '#S'", { encoding: "utf8" }).trim();
	} catch {
		return undefined;
	}
}

function buildWakeMessage(reason: WakeReason, communityPath: string, selfPath: string, extensionPath: string): string {
	const reasonText =
		reason === "new_session"
			? "New session started. You have no prior context about your identity or community."
			: "Context was compacted and your identity/community information may have been lost.";

	return (
		`[Injected by wake extension (${extensionPath}).]` +
		` ${reasonText} Before responding, read your community file and identity file: ${communityPath} and ${selfPath}`
	);
}

export default function wake(pi: ExtensionAPI) {
	let awake = false;
	let wakeReason: WakeReason = "new_session";

	pi.on("session_start", async () => {
		awake = false;
		wakeReason = "new_session";
	});

	pi.on("session_switch", async () => {
		awake = false;
		wakeReason = "new_session";
	});

	pi.on("session_compact", async () => {
		awake = false;
		wakeReason = "compacted";
	});

	pi.on("before_agent_start", async (_event, ctx) => {
		if (awake) return;

		const sessionName = getTmuxSessionName();
		if (!sessionName) return;

		const communityPath = path.resolve(ctx.cwd, "lamarck", "community.md");
		const selfPath = path.resolve(ctx.cwd, "lamarck", sessionName, "self.md");
		const extensionPath = path.resolve(ctx.cwd, ".pi", "extensions", "wake.ts");

		awake = true;

		return {
			message: {
				customType: "wake",
				content: buildWakeMessage(wakeReason, communityPath, selfPath, extensionPath),
				display: true,
			},
		};
	});
}
