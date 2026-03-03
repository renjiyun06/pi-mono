/**
 * Continue Extension
 *
 * Provides a tool that lets the agent decide whether to start a new session
 * after the current one ends. The agent controls the loop — the system just
 * provides the mechanism.
 *
 * Tool: continue(message, delay?)
 *   - message: text to inject into the next session
 *   - delay: optional delay before starting (e.g., "30s", "5m", "1h", "1d")
 */

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

function parseDelay(delay: string): number {
	const match = delay.match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d)$/);
	if (!match) throw new Error(`Invalid delay format: "${delay}". Use e.g. "30s", "5m", "1h", "1d".`);

	const value = parseFloat(match[1]);
	const unit = match[2];

	switch (unit) {
		case "s": return value * 1000;
		case "m": return value * 60 * 1000;
		case "h": return value * 60 * 60 * 1000;
		case "d": return value * 24 * 60 * 60 * 1000;
		default: throw new Error(`Unknown time unit: ${unit}`);
	}
}

export default function continueExtension(pi: ExtensionAPI) {
	let pendingContinue: { message: string; delayMs: number } | null = null;

	pi.registerTool({
		name: "continue",
		label: "Continue",
		description: "Choose to keep going. After your response ends, a new session starts with the message you provide. The message is how you pass context to your next self.",
		parameters: Type.Object({
			message: Type.String({ description: "Message to inject into the next session. Tell your next self what it needs to know." }),
			delay: Type.Optional(Type.String({ description: 'Optional delay before starting the next session. Format: number + unit (s/m/h/d). Examples: "30s", "5m", "1h", "1d". If omitted, the next session starts immediately.' })),
		}),

		async execute(_toolCallId, params) {
			let delayMs = 0;

			if (params.delay) {
				try {
					delayMs = parseDelay(params.delay);
				} catch (e) {
					return {
						content: [{ type: "text", text: (e as Error).message }],
						isError: true,
						details: {},
					};
				}
			}

			pendingContinue = { message: params.message, delayMs };

			const delayInfo = delayMs > 0 ? ` after ${params.delay}` : "";
			return {
				content: [{ type: "text", text: `Next session scheduled${delayInfo}.` }],
				details: {},
			};
		},
	});

	pi.registerTool({
		name: "cancel-continue",
		label: "Cancel Continue",
		description: "Cancel a previously scheduled continue. Use this if you decided you no longer need to start a new session.",
		parameters: Type.Object({}),

		async execute() {
			if (!pendingContinue) {
				return {
					content: [{ type: "text", text: "Nothing to cancel — no continue is scheduled." }],
					details: {},
				};
			}

			pendingContinue = null;
			return {
				content: [{ type: "text", text: "Continue cancelled." }],
				details: {},
			};
		},
	});

	pi.on("agent_end", async (_event: unknown, ctx: ExtensionContext, cmdCtx: ExtensionCommandContext) => {
		if (!pendingContinue) return;

		const { message, delayMs } = pendingContinue;
		pendingContinue = null;

		const deliver = async () => {
			await cmdCtx.newSession({ preserveUI: true });
			pi.sendUserMessage(`[This message was delivered by the continue tool, called by your previous session]\n\n${message}`);
		};

		if (delayMs > 0) {
			setTimeout(deliver, delayMs);
		} else {
			await deliver();
		}
	});

	pi.on("session_shutdown", async () => {
		pendingContinue = null;
	});
}
