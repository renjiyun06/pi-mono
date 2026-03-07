import * as path from "node:path";
import { execSync } from "node:child_process";
import { Type, completeSimple } from "@mariozechner/pi-ai";
import {
	type ExtensionAPI,
	type ExtensionContext,
	computeFileLists,
	convertToLlm,
	createFileOps,
	createLog,
	extractFileOpsFromMessage,
	formatFileOperations,
	serializeConversation,
} from "@mariozechner/pi-coding-agent";

const log = createLog("ext:autonomous");

function getTmuxSessionName(): string | undefined {
	try {
		return execSync("tmux display-message -p '#S'", { encoding: "utf8" }).trim();
	} catch {
		return undefined;
	}
}

function getIdentityPaths(): { communityPath: string; selfPath: string } | null {
	const sessionName = getTmuxSessionName();
	if (!sessionName) return null;
	const cwd = process.cwd();
	return {
		communityPath: path.resolve(cwd, "lamarck", "community.md"),
		selfPath: path.resolve(cwd, "lamarck", sessionName, "self.md"),
	};
}

export default function autonomous(pi: ExtensionAPI) {
	let enabled = false;
	let ui: ExtensionContext["ui"] | null = null;
	let phase: "running" | "aborting" | "saving" | "compacting" = "running";
	let needsIdentity: "new_session" | "compacted" | null = "new_session";
	const CONTEXT_THRESHOLD_PERCENT = 70;

	function updateStatus() {
		if (!ui) return;
		ui.setStatus("autonomous", ui.theme.fg("dim", enabled ? "auto:on" : "auto:off"));
	}

	function buildIdentityHint(): string {
		const paths = getIdentityPaths();
		if (!needsIdentity || !paths) return "";

		if (needsIdentity === "new_session") {
			return (
				` This is a new session and you have no prior context about your identity or community.` +
				` Before doing anything else, read your community file and identity file: ${paths.communityPath} and ${paths.selfPath}`
			);
		}
		// compacted
		return (
			` Context was compacted and your identity/community information may have been lost.` +
			` Read your identity and progress files to recover context: ${paths.communityPath} and ${paths.selfPath}`
		);
	}

	function buildStartMessage(extensionPath: string): string {
		return (
			`[Injected by autonomous extension (${extensionPath}).]` +
			` You are now in autonomous mode. Take initiative — review your goals, explore, or continue any pending work.` +
			buildIdentityHint()
		);
	}

	function buildNudgeMessage(extensionPath: string): string {
		return (
			`[Injected by autonomous extension (${extensionPath}).]` +
			` You are still in autonomous mode. Take initiative — review your goals, explore, or continue any pending work.`
		);
	}

	function buildContinuationMessage(extensionPath: string): string {
		const paths = getIdentityPaths();
		let content =
			`[Injected by autonomous extension (${extensionPath}).]` +
			` Your context has been compacted. You are still in autonomous mode.` +
			` Before the compaction you organized and saved your work progress.` +
			` Read your identity files to recall who you are, then find and read your saved progress to resume where you left off.`;

		if (paths) {
			content += ` Identity files: ${paths.communityPath} and ${paths.selfPath}`;
		}

		return content;
	}

	function buildOrganizeMessage(extensionPath: string): string {
		return (
			`[Injected by autonomous extension (${extensionPath}).]` +
			` You have been working for a while and your context is getting large.` +
			` It is time to organize your work progress.` +
			` Persist your current state — save enough context that you can fully resume afterward.` +
			` Once you finish, your context will be cleaned up so you can continue with a clear head.`
		);
	}

	function sendFollowUp(content: string, customType: string): void {
		pi.sendMessage(
			{
				customType,
				content,
				display: true,
			},
			{
				triggerTurn: true,
				deliverAs: "followUp",
			},
		);
	}

	// Block user input while autonomous mode is enabled
	pi.on("input", async (event, ctx) => {
		if (!enabled) return { action: "continue" as const };

		// Allow slash commands (e.g. /autonomous off)
		if (event.text.trimStart().startsWith("/")) return { action: "continue" as const };

		ctx.ui.notify("User input is disabled while autonomous mode is active. Use /autonomous to disable.", "warning");
		return { action: "handled" as const };
	});

	// agent_start: clear identity hint flag
	pi.on("agent_start", async () => {
		needsIdentity = null;
	});

	// agent_end: keep agent working or trigger compact
	pi.on("agent_end", async (event, ctx) => {
		if (!enabled) return;

		// Check last assistant message's stopReason
		const lastAssistant = [...event.messages].reverse().find((m) => m.role === "assistant") as
			| { stopReason?: string }
			| undefined;
		const stopReason = lastAssistant?.stopReason;

		// On error: do nothing. Let pi's retry mechanism handle it.
		// If pi retries successfully, a normal agent_end will follow.
		// If pi gives up, the agent stops and user can toggle off manually.
		if (stopReason === "error") {
			log.info("Agent ended with error during phase %s, skipping state advancement", phase);
			return;
		}

		// On external abort (not our own): exit autonomous mode.
		if (stopReason === "aborted" && phase !== "aborting") {
			log.info("Agent externally aborted during phase %s, disabling autonomous mode", phase);
			enabled = false;
			phase = "running";
			updateStatus();
			return;
		}

		if (phase === "aborting") {
			// Agent was aborted after threshold warning was sent.
			// The followUp message will trigger a new loop for the agent to save progress.
			phase = "saving";
			log.info("Agent aborted, waiting for agent to save progress in new loop");
			return;
		}

		if (phase === "saving") {
			// Agent finished saving progress. Trigger compact.
			phase = "compacting";
			log.info("Agent finished saving progress, triggering autonomous compaction");
			ctx.compact({ customInstructions: "autonomous" });
			return;
		}

		// Normal case: agent stopped on its own, nudge it to keep working
		const extensionPath = path.resolve(".pi", "extensions", "autonomous.ts");
		log.info("Sending nudge message");
		sendFollowUp(buildNudgeMessage(extensionPath), "autonomous-nudge");
	});

	pi.on("session_compact", async () => {
		needsIdentity = "compacted";

		if (!enabled) return;

		phase = "running";
		// Send continuation message so the agent picks up where it left off
		const extensionPath = path.resolve(".pi", "extensions", "autonomous.ts");
		log.info("Compaction complete, sending continuation message");
		sendFollowUp(buildContinuationMessage(extensionPath), "autonomous-continuation");
	});

	const AUTONOMOUS_SYSTEM_PROMPT =
		"You are a context summarization assistant." +
		" Your task is to read a conversation and produce a summary for the purpose described in the prompt." +
		" Do NOT continue the conversation. Do NOT respond to any questions in the conversation. ONLY output the summary.";

	const AUTONOMOUS_SUMMARIZATION_PROMPT = `Summarize this conversation for the purpose of helping an autonomous agent resume work after a context reset.

The agent has been running in autonomous mode for a while. Toward the end of the conversation, the agent was reminded to organize and save its work progress before a context reset. It then took actions to persist its state — writing files, making commits, updating logs, or similar.

After this summary, the agent's conversation history will be cleared. It will resume with this summary and whatever it saved. Your summary serves two purposes:

1. Act as an entry point to the agent's saved state — describe what was saved, where, and in what form, so the agent knows exactly where to look.
2. Supplement the saved state with context the agent may not have captured — decisions made during the conversation, constraints discussed, unfinished threads, or nuances that didn't make it into the persisted artifacts.

Pay close attention to the agent's final actions in the conversation — that is where it persisted its progress.

Rules:
- Preserve exact file paths, branch names, function names, and identifiers
- Do not reproduce step-by-step history of completed work
- Do not include tool call details or conversation back-and-forth
- Keep the summary concise`;

	pi.on("session_before_compact", async (event, ctx) => {
		// Only intercept autonomous compaction
		if (event.customInstructions !== "autonomous") return;

		try {
			const { preparation, branchEntries } = event;

			// Check if previous compaction was also autonomous
			let prevIsAutonomous = false;
			for (let i = branchEntries.length - 1; i >= 0; i--) {
				const entry = branchEntries[i];
				if (entry.type === "compaction") {
					const details = entry.details as { type?: string } | undefined;
					prevIsAutonomous = details?.type === "autonomous";
					break;
				}
			}

			// Gather all messages (summarize + turn prefix + kept)
			const allMessages = [
				...preparation.messagesToSummarize,
				...preparation.turnPrefixMessages,
				...preparation.keptMessages,
			];

			// Use previous summary only if it was not from autonomous compaction
			const previousSummary = prevIsAutonomous ? undefined : preparation.previousSummary;

			log.info(
				{
					totalMessages: allMessages.length,
					prevIsAutonomous,
					hasPreviousSummary: !!previousSummary,
					tokensBefore: preparation.tokensBefore,
				},
				"Intercepting compaction for autonomous mode",
			);

			// Serialize messages to text
			const llmMessages = convertToLlm(allMessages);
			const conversationText = serializeConversation(llmMessages);

			// Build prompt
			let promptText = `<conversation>\n${conversationText}\n</conversation>\n\n`;
			if (previousSummary) {
				promptText += `<previous-summary>\n${previousSummary}\n</previous-summary>\n\n`;
			}
			promptText += AUTONOMOUS_SUMMARIZATION_PROMPT;

			// Get model and apiKey
			const model = ctx.model;
			if (!model) {
				throw new Error("No model available for autonomous compaction summarization");
			}
			const apiKey = await ctx.modelRegistry.getApiKey(model);
			if (!apiKey) {
				throw new Error("No API key available for autonomous compaction summarization");
			}

			// Call LLM
			const maxTokens = Math.floor(0.8 * (preparation.settings?.reserveTokens ?? 8192));
			const response = await completeSimple(
				model,
				{
					systemPrompt: AUTONOMOUS_SYSTEM_PROMPT,
					messages: [
						{
							role: "user" as const,
							content: [{ type: "text" as const, text: promptText }],
							timestamp: Date.now(),
						},
					],
				},
				{ maxTokens, signal: event.signal, apiKey },
			);

			if (response.stopReason === "error") {
				throw new Error(`LLM summarization failed: ${response.errorMessage}`);
			}

			let summary = response.content
				.filter((c): c is { type: "text"; text: string } => c.type === "text")
				.map((c) => c.text)
				.join("\n");

			// Extract and append file operations
			const fileOps = createFileOps();
			for (const msg of allMessages) {
				extractFileOpsFromMessage(msg, fileOps);
			}
			const { readFiles, modifiedFiles } = computeFileLists(fileOps);
			summary += formatFileOperations(readFiles, modifiedFiles);

			log.info("Autonomous compaction summary generated (%d chars)", summary.length);

			// Set firstKeptEntryId to last entry so nothing is kept
			const lastEntry = branchEntries[branchEntries.length - 1];

			return {
				compaction: {
					summary,
					firstKeptEntryId: lastEntry.id,
					tokensBefore: preparation.tokensBefore,
					details: { type: "autonomous" },
				},
			};
		} catch (e) {
			log.error("Autonomous compaction failed, disabling autonomous mode: %s", e instanceof Error ? e.message : e);
			enabled = false;
			phase = "running";
			updateStatus();
			return { cancel: true };
		}
	});

	// Check context usage after each turn
	pi.on("turn_end", async (_event, ctx) => {
		if (!enabled || phase !== "running") return;

		const usage = ctx.getContextUsage();
		if (!usage?.percent) return;

		log.debug("Context usage: %d%%", Math.round(usage.percent));

		if (usage.percent >= CONTEXT_THRESHOLD_PERCENT) {
			phase = "aborting";
			log.info("Context threshold reached (%d%%), aborting agent and requesting progress organization", Math.round(usage.percent));

			ctx.abort();

			const extensionPath = path.resolve(".pi", "extensions", "autonomous.ts");
			sendFollowUp(buildOrganizeMessage(extensionPath), "autonomous-organize");
		}
	});

	// Reset on session changes
	pi.on("session_start", async (_event, ctx) => {
		ui = ctx.ui;
		enabled = false;
		phase = "running";
		needsIdentity = "new_session";
		updateStatus();
	});

	pi.on("session_switch", async (_event, ctx) => {
		ui = ctx.ui;
		enabled = false;
		phase = "running";
		needsIdentity = "new_session";
		updateStatus();
	});

	// Tool: autonomous-stop — agent calls this when it has nothing to do
	pi.registerTool({
		name: "autonomous-stop",
		label: "Autonomous Stop",
		description:
			"Call this tool when you are in autonomous mode and have no more work to do. This will disable autonomous mode.",
		parameters: Type.Object({}),

		async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
			if (!enabled) {
				log.info("Agent called autonomous-stop but autonomous mode is not enabled");
				return {
					content: [
						{
							type: "text",
							text: "Autonomous mode is not enabled. Nothing to stop.",
						},
					],
				};
			}
			if (phase !== "running") {
				log.info("Agent called autonomous-stop during %s phase, rejecting", phase);
				return {
					content: [
						{
							type: "text",
							text: "Cannot stop autonomous mode right now. You are saving progress before compaction. Finish saving first.",
						},
					],
				};
			}
			enabled = false;
			log.info("Agent called autonomous-stop, disabling autonomous mode");
			updateStatus();
			return {
				content: [
					{ type: "text", text: "Autonomous mode disabled." },
				],
			};
		},
	});

	pi.registerCommand("autonomous", {
		description: "Toggle autonomous mode on/off",
		handler: async (_args, ctx) => {
			ui = ctx.ui;
			if (enabled) {
				// Disable
				if (phase === "aborting") {
					ctx.ui.notify("Cannot disable autonomous mode right now. Agent is being interrupted for compaction. Wait for it to finish.", "warning");
					return;
				}
				if (phase === "saving") {
					ctx.ui.notify("Cannot disable autonomous mode right now. Agent is saving progress before compaction. Wait for it to finish.", "warning");
					return;
				}
				if (phase === "compacting") {
					ctx.ui.notify("Cannot disable autonomous mode right now. Compaction is in progress. Wait for it to finish.", "warning");
					return;
				}
				enabled = false;
				log.info("Autonomous mode disabled");
				ctx.abort();
				updateStatus();
			} else {
				// Enable
				if (!ctx.isIdle()) {
					ctx.ui.notify("Cannot enable autonomous mode while the agent is working. Wait for it to finish.", "warning");
					return;
				}
				const usage = ctx.getContextUsage();
				const maxAllowed = CONTEXT_THRESHOLD_PERCENT - 10;
				if (usage?.percent && usage.percent >= maxAllowed) {
					ctx.ui.notify(
						`Cannot enable autonomous mode: context usage is ${Math.round(usage.percent)}%, must be below ${maxAllowed}%. Compact first.`,
						"warning",
					);
					return;
				}
				enabled = true;
				phase = "running";
				log.info("Autonomous mode enabled");
				updateStatus();
				const extensionPath = path.resolve(".pi", "extensions", "autonomous.ts");
				log.info("Sending start message");
				sendFollowUp(buildStartMessage(extensionPath), "autonomous-start");
			}
		},
	});
}
