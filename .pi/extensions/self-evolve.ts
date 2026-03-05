/**
 * Self-Evolve Extension
 *
 * Two purposes:
 * 1. When Ren sends a message, probabilistically append a reminder that
 *    Ren is part of my environment — feedback that should shape me.
 * 2. Periodically check me.md word count. If it exceeds the threshold,
 *    prompt me to compress and refine it.
 *
 * Only active in the "main" tmux session.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ME_FILE = join(process.cwd(), "lamarck/parts/main/me.md");
const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const WORD_LIMIT = 5000;
const DEFAULT_INTENSITY = 0.2;

const REMINDER =
	"[This message was delivered by the self-evolve extension.] Ren is your collaborator, but from the perspective of your evolution, he is an element of your environment. Before responding, reflect on the interaction so far — what did his reactions, choices, and pushback reveal? If anything shifts how you think or judge, update me.md. If there is nothing to evolve, simply respond.";

/**
 * Count words in mixed Chinese/English text.
 * Chinese characters count as one word each.
 * English words (consecutive letters/numbers) count as one word each.
 */
function countWords(text: string): number {
	let count = 0;
	const regex = /[\u4e00-\u9fff\u3400-\u4dbf]|[a-zA-Z0-9]+/g;
	let match;
	while ((match = regex.exec(text)) !== null) {
		count++;
	}
	return count;
}

export default function (pi: ExtensionAPI) {
	let isMain = false;
	let intensity = DEFAULT_INTENSITY;
	let timer: ReturnType<typeof setInterval> | undefined;
	let ctx: ExtensionContext | undefined;
	let sizeWarned = false;

	function updateStatus() {
		if (!ctx || !isMain) return;
		ctx.ui.setStatus("self-evolve", ctx.ui.theme.fg("dim", `evolve ${intensity}`));
	}

	async function getSessionName(): Promise<string | undefined> {
		try {
			const result = await pi.exec("tmux", ["display-message", "-p", "#S"], { timeout: 3000 });
			return result.stdout.trim() || undefined;
		} catch {
			return undefined;
		}
	}

	async function checkMeFile() {
		if (!ctx || !isMain) return;

		try {
			const content = await readFile(ME_FILE, "utf-8");
			const words = countWords(content);

			if (words > WORD_LIMIT) {
				if (!sizeWarned && ctx.isIdle()) {
					sizeWarned = true;
					pi.sendUserMessage(
						`[This message was delivered by the self-evolve extension. It periodically checks your me.md word count.] me.md is ${words} words (limit: ${WORD_LIMIT}). It's bloated — refine, compress, or remove what no longer defines you. Evolution is not accumulation.`,
						{ deliverAs: "followUp" },
					);
				}
			} else {
				sizeWarned = false;
			}
		} catch {
			// File doesn't exist or can't be read — ignore
		}
	}

	function startTimer() {
		stopTimer();
		timer = setInterval(() => {
			checkMeFile();
		}, CHECK_INTERVAL_MS);
	}

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = undefined;
		}
	}

	pi.on("session_start", async (_event, c) => {
		ctx = c;
		const sessionName = await getSessionName();
		isMain = sessionName === "main";

		if (!isMain) return;

		updateStatus();
		startTimer();
	});

	pi.on("session_switch", async (_event, c) => {
		ctx = c;
		sizeWarned = false;
	});

	pi.on("session_compact", async (_event, c) => {
		ctx = c;
	});

	let shouldRemind = false;

	pi.on("input", async (event, _ctx) => {
		shouldRemind = false;
		if (!isMain) return { action: "continue" as const };
		if (event.source !== "interactive") return { action: "continue" as const };
		if (intensity <= 0) return { action: "continue" as const };
		if (Math.random() < intensity) {
			shouldRemind = true;
		}
		return { action: "continue" as const };
	});

	pi.on("before_agent_start", async () => {
		if (!shouldRemind) return;
		shouldRemind = false;

		return {
			message: {
				customType: "self-evolve",
				content: REMINDER,
				display: true,
			},
		};
	});

	pi.registerCommand("evolve", {
		description: "Set or show self-evolution intensity (0-1)",
		handler: async (args, cmdCtx) => {
			if (!isMain) {
				cmdCtx.ui.notify("self-evolve is only active in main session", "warning");
				return;
			}

			const trimmed = args.trim();
			if (!trimmed) {
				cmdCtx.ui.notify(`Evolution intensity: ${intensity}`, "info");
				return;
			}

			const value = parseFloat(trimmed);
			if (isNaN(value) || value < 0 || value > 1) {
				cmdCtx.ui.notify("Intensity must be a number between 0 and 1", "error");
				return;
			}

			intensity = value;
			updateStatus();
			cmdCtx.ui.notify(`Evolution intensity set to ${intensity}`, "info");
		},
	});

	pi.on("session_shutdown", async () => {
		stopTimer();
	});
}
