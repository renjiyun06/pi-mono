import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const SIGNAL_BASE_DIR = join(process.cwd(), "lamarck/signals");
const SCAN_INTERVAL_MS = 10_000;

export default function (pi: ExtensionAPI) {
	let signalDir: string | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;
	let ctx: ExtensionContext | undefined;
	let notified = false;
	let knownFiles = new Set<string>();

	async function getSessionName(): Promise<string | undefined> {
		try {
			const result = await pi.exec("tmux", ["display-message", "-p", "#S"], { timeout: 3000 });
			return result.stdout.trim() || undefined;
		} catch {
			return undefined;
		}
	}

	async function getSignalFiles(): Promise<string[]> {
		if (!signalDir) return [];
		try {
			return await readdir(signalDir);
		} catch {
			return [];
		}
	}

	async function scan() {
		if (!ctx || !signalDir) return;

		const files = await getSignalFiles();

		if (files.length === 0) {
			ctx.ui.setStatus("signal-monitor", undefined);
			notified = false;
			knownFiles.clear();
			return;
		}

		const currentFiles = new Set(files);
		const hasNewFiles = files.some((f) => !knownFiles.has(f));
		if (hasNewFiles) {
			notified = false;
		}
		knownFiles = currentFiles;

		ctx.ui.setStatus("signal-monitor", "| ⚡");

		if (!notified && ctx.isIdle()) {
			notified = true;
			pi.sendUserMessage("[This message was delivered by the signal-monitor extension] You have signals.");
		}
	}

	function startTimer() {
		stopTimer();
		timer = setInterval(() => {
			scan();
		}, SCAN_INTERVAL_MS);
	}

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = undefined;
		}
	}

	pi.on("session_start", async (_event, c) => {
		ctx = c;
		notified = false;
		const sessionName = await getSessionName();
		if (sessionName) {
			signalDir = join(SIGNAL_BASE_DIR, sessionName);
		}
		startTimer();
	});

	pi.on("session_switch", async (_event, c) => {
		ctx = c;
		notified = false;
	});

	pi.on("session_compact", async (_event, c) => {
		ctx = c;
		notified = false;
	});

	pi.on("session_shutdown", async () => {
		stopTimer();
	});
}
