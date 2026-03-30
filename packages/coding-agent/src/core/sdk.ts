import { join } from "node:path";
import { Agent, type AgentMessage, type ThinkingLevel } from "@mariozechner/pi-agent-core";
import { type Message, type Model, streamSimple, type ToolResultMessage } from "@mariozechner/pi-ai";
import { getAgentDir, getDocsPath } from "../config.js";
import { AgentSession } from "./agent-session.js";
import { AuthStorage } from "./auth-storage.js";
import { DEFAULT_THINKING_LEVEL } from "./defaults.js";
import type { ExtensionRunner, LoadExtensionsResult, ToolDefinition } from "./extensions/index.js";
import { convertToLlm } from "./messages.js";
import { ModelRegistry } from "./model-registry.js";
import { findInitialModel } from "./model-resolver.js";
import type { ResourceLoader } from "./resource-loader.js";
import { DefaultResourceLoader } from "./resource-loader.js";
import { getDefaultSessionDir, SessionManager, type SessionMessageEntry } from "./session-manager.js";
import { SettingsManager } from "./settings-manager.js";
import { time } from "./timings.js";
import {
	allTools,
	bashTool,
	codingTools,
	createBashTool,
	createCodingTools,
	createEditTool,
	createFindTool,
	createGrepTool,
	createLsTool,
	createReadOnlyTools,
	createReadTool,
	createWriteTool,
	editTool,
	findTool,
	grepTool,
	lsTool,
	readOnlyTools,
	readTool,
	type Tool,
	type ToolName,
	withFileMutationQueue,
	writeTool,
} from "./tools/index.js";

export interface CreateAgentSessionOptions {
	/** Working directory for project-local discovery. Default: process.cwd() */
	cwd?: string;
	/** Global config directory. Default: ~/.pi/agent */
	agentDir?: string;

	/** Auth storage for credentials. Default: AuthStorage.create(agentDir/auth.json) */
	authStorage?: AuthStorage;
	/** Model registry. Default: ModelRegistry.create(authStorage, agentDir/models.json) */
	modelRegistry?: ModelRegistry;

	/** Model to use. Default: from settings, else first available */
	model?: Model<any>;
	/** Thinking level. Default: from settings, else 'medium' (clamped to model capabilities) */
	thinkingLevel?: ThinkingLevel;
	/** Models available for cycling (Ctrl+P in interactive mode) */
	scopedModels?: Array<{ model: Model<any>; thinkingLevel?: ThinkingLevel }>;

	/** Built-in tools to use. Default: codingTools [read, bash, edit, write] */
	tools?: Tool[];
	/** Custom tools to register (in addition to built-in tools). */
	customTools?: ToolDefinition[];

	/** Resource loader. When omitted, DefaultResourceLoader is used. */
	resourceLoader?: ResourceLoader;

	/** Session manager. Default: SessionManager.create(cwd) */
	sessionManager?: SessionManager;

	/** Settings manager. Default: SettingsManager.create(cwd, agentDir) */
	settingsManager?: SettingsManager;
}

/** Result from createAgentSession */
export interface CreateAgentSessionResult {
	/** The created session */
	session: AgentSession;
	/** Extensions result (for UI context setup in interactive mode) */
	extensionsResult: LoadExtensionsResult;
	/** Warning if session was restored with a different model than saved */
	modelFallbackMessage?: string;
}

// Re-exports

export type {
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionContext,
	ExtensionFactory,
	SlashCommandInfo,
	SlashCommandSource,
	ToolDefinition,
} from "./extensions/index.js";
export type { PromptTemplate } from "./prompt-templates.js";
export type { Skill } from "./skills.js";
export type { Tool } from "./tools/index.js";

export {
	// Pre-built tools (use process.cwd())
	readTool,
	bashTool,
	editTool,
	writeTool,
	grepTool,
	findTool,
	lsTool,
	codingTools,
	readOnlyTools,
	allTools as allBuiltInTools,
	withFileMutationQueue,
	// Tool factories (for custom cwd)
	createCodingTools,
	createReadOnlyTools,
	createReadTool,
	createBashTool,
	createEditTool,
	createWriteTool,
	createGrepTool,
	createFindTool,
	createLsTool,
};

// Helper Functions

function getDefaultAgentDir(): string {
	return getAgentDir();
}

/**
 * Create an AgentSession with the specified options.
 *
 * @example
 * ```typescript
 * // Minimal - uses defaults
 * const { session } = await createAgentSession();
 *
 * // With explicit model
 * import { getModel } from '@mariozechner/pi-ai';
 * const { session } = await createAgentSession({
 *   model: getModel('anthropic', 'claude-opus-4-5'),
 *   thinkingLevel: 'high',
 * });
 *
 * // Continue previous session
 * const { session, modelFallbackMessage } = await createAgentSession({
 *   continueSession: true,
 * });
 *
 * // Full control
 * const loader = new DefaultResourceLoader({
 *   cwd: process.cwd(),
 *   agentDir: getAgentDir(),
 *   settingsManager: SettingsManager.create(),
 * });
 * await loader.reload();
 * const { session } = await createAgentSession({
 *   model: myModel,
 *   tools: [readTool, bashTool],
 *   resourceLoader: loader,
 *   sessionManager: SessionManager.inMemory(),
 * });
 * ```
 */
export async function createAgentSession(options: CreateAgentSessionOptions = {}): Promise<CreateAgentSessionResult> {
	const cwd = options.cwd ?? process.cwd();
	const agentDir = options.agentDir ?? getDefaultAgentDir();
	let resourceLoader = options.resourceLoader;

	// Use provided or create AuthStorage and ModelRegistry
	const authPath = options.agentDir ? join(agentDir, "auth.json") : undefined;
	const modelsPath = options.agentDir ? join(agentDir, "models.json") : undefined;
	const authStorage = options.authStorage ?? AuthStorage.create(authPath);
	const modelRegistry = options.modelRegistry ?? ModelRegistry.create(authStorage, modelsPath);

	const settingsManager = options.settingsManager ?? SettingsManager.create(cwd, agentDir);
	const sessionManager = options.sessionManager ?? SessionManager.create(cwd, getDefaultSessionDir(cwd, agentDir));

	if (!resourceLoader) {
		resourceLoader = new DefaultResourceLoader({ cwd, agentDir, settingsManager });
		await resourceLoader.reload();
		time("resourceLoader.reload");
	}

	// Check if session has existing data to restore
	const existingSession = sessionManager.buildSessionContext();
	const hasExistingSession = existingSession.messages.length > 0;
	const hasThinkingEntry = sessionManager.getBranch().some((entry) => entry.type === "thinking_level_change");

	let model = options.model;
	let modelFallbackMessage: string | undefined;

	// If session has data, try to restore model from it
	if (!model && hasExistingSession && existingSession.model) {
		const restoredModel = modelRegistry.find(existingSession.model.provider, existingSession.model.modelId);
		if (restoredModel && modelRegistry.hasConfiguredAuth(restoredModel)) {
			model = restoredModel;
		}
		if (!model) {
			modelFallbackMessage = `Could not restore model ${existingSession.model.provider}/${existingSession.model.modelId}`;
		}
	}

	// If still no model, use findInitialModel (checks settings default, then provider defaults)
	if (!model) {
		const result = await findInitialModel({
			scopedModels: [],
			isContinuing: hasExistingSession,
			defaultProvider: settingsManager.getDefaultProvider(),
			defaultModelId: settingsManager.getDefaultModel(),
			defaultThinkingLevel: settingsManager.getDefaultThinkingLevel(),
			modelRegistry,
		});
		model = result.model;
		if (!model) {
			modelFallbackMessage = `No models available. Use /login or set an API key environment variable. See ${join(getDocsPath(), "providers.md")}. Then use /model to select a model.`;
		} else if (modelFallbackMessage) {
			modelFallbackMessage += `. Using ${model.provider}/${model.id}`;
		}
	}

	let thinkingLevel = options.thinkingLevel;

	// If session has data, restore thinking level from it
	if (thinkingLevel === undefined && hasExistingSession) {
		thinkingLevel = hasThinkingEntry
			? (existingSession.thinkingLevel as ThinkingLevel)
			: (settingsManager.getDefaultThinkingLevel() ?? DEFAULT_THINKING_LEVEL);
	}

	// Fall back to settings default
	if (thinkingLevel === undefined) {
		thinkingLevel = settingsManager.getDefaultThinkingLevel() ?? DEFAULT_THINKING_LEVEL;
	}

	// Clamp to model capabilities
	if (!model || !model.reasoning) {
		thinkingLevel = "off";
	}

	const defaultActiveToolNames: ToolName[] = ["read", "bash", "edit", "write", "branch", "return", "reenter"];
	const initialActiveToolNames: ToolName[] = options.tools
		? options.tools.map((t) => t.name).filter((n): n is ToolName => n in allTools)
		: defaultActiveToolNames;

	let agent: Agent;

	// Create convertToLlm wrapper that filters images if blockImages is enabled (defense-in-depth)
	const convertToLlmWithBlockImages = (messages: AgentMessage[]): Message[] => {
		const converted = convertToLlm(messages);
		// Check setting dynamically so mid-session changes take effect
		if (!settingsManager.getBlockImages()) {
			return converted;
		}
		// Filter out ImageContent from all messages, replacing with text placeholder
		return converted.map((msg) => {
			if (msg.role === "user" || msg.role === "toolResult") {
				const content = msg.content;
				if (Array.isArray(content)) {
					const hasImages = content.some((c) => c.type === "image");
					if (hasImages) {
						const filteredContent = content
							.map((c) =>
								c.type === "image" ? { type: "text" as const, text: "Image reading is disabled." } : c,
							)
							.filter(
								(c, i, arr) =>
									// Dedupe consecutive "Image reading is disabled." texts
									!(
										c.type === "text" &&
										c.text === "Image reading is disabled." &&
										i > 0 &&
										arr[i - 1].type === "text" &&
										(arr[i - 1] as { type: "text"; text: string }).text === "Image reading is disabled."
									),
							);
						return { ...msg, content: filteredContent };
					}
				}
			}
			return msg;
		});
	};

	const extensionRunnerRef: { current?: ExtensionRunner } = {};
	const agentSessionRef: { current?: AgentSession } = {};

	agent = new Agent({
		initialState: {
			systemPrompt: "",
			model,
			thinkingLevel,
			tools: [],
		},
		convertToLlm: convertToLlmWithBlockImages,
		streamFn: async (model, context, options) => {
			const auth = await modelRegistry.getApiKeyAndHeaders(model);
			if (!auth.ok) {
				throw new Error(auth.error);
			}
			return streamSimple(model, context, {
				...options,
				apiKey: auth.apiKey,
				headers: auth.headers || options?.headers ? { ...auth.headers, ...options?.headers } : undefined,
			});
		},
		onPayload: async (payload, _model) => {
			const runner = extensionRunnerRef.current;
			if (!runner?.hasHandlers("before_provider_request")) {
				return payload;
			}
			return runner.emitBeforeProviderRequest(payload);
		},
		sessionId: sessionManager.getSessionId(),
		transformContext: async (messages) => {
			const runner = extensionRunnerRef.current;
			if (!runner) return messages;
			return runner.emitContext(messages);
		},
		steeringMode: settingsManager.getSteeringMode(),
		followUpMode: settingsManager.getFollowUpMode(),
		transport: settingsManager.getTransport(),
		thinkingBudgets: settingsManager.getThinkingBudgets(),
		maxRetryDelayMs: settingsManager.getRetrySettings().maxDelayMs,
		flushEvents: async () => {
			await agentSessionRef.current?.flushEventQueue();
		},
		onBranchReenter: async (branchId, instruction, toolCallId) => {
			// The current leafId points to the last entry in the calling context.
			// This is the return point — where we'll come back to when the branch returns.
			const returnEntryId = sessionManager.getLeafId();

			// Find the branch tool result entry (the branch's entry point) by branchId
			const entries = sessionManager.getEntries();
			const branchEntry = entries.find(
				(e) =>
					e.type === "message" &&
					e.message.role === "toolResult" &&
					e.message.toolName === "branch" &&
					(e.message as ToolResultMessage).details?.branchId === branchId,
			);
			if (!branchEntry) return undefined;

			// Walk the tree from branch entry to find the actual latest leaf.
			// At each node: if multiple children, skip branch first returns
			// (sub-branch entries that have branchId but no branchLeafId).
			let leafId = branchEntry.id;
			while (true) {
				const children = sessionManager.getChildren(leafId);
				if (children.length === 0) break;
				if (children.length === 1) {
					leafId = children[0].id;
				} else {
					// Multiple children — skip sub-branch entry points (first returns)
					const nonSubBranch = children.filter((c) => {
						if (
							c.type === "message" &&
							c.message.role === "toolResult" &&
							c.message.toolName === "branch" &&
							(c.message as ToolResultMessage).details?.branchId &&
							!(c.message as ToolResultMessage).details?.branchLeafId
						) {
							return false; // This is a sub-branch first return, skip it
						}
						return true;
					});
					// Follow the last remaining child (most recent path)
					leafId = (
						nonSubBranch.length > 0 ? nonSubBranch[nonSubBranch.length - 1] : children[children.length - 1]
					).id;
				}
			}

			// Move leafId to the branch's actual latest position
			sessionManager.branch(leafId);

			// Append re-entry notification as custom message with return point in details
			sessionManager.appendCustomMessageEntry(
				"branch_reentry",
				`Branch re-entered. New instruction: ${instruction}`,
				false,
				{ returnEntryId, toolCallId },
			);

			// Rebuild and return the message sequence, sync agent state
			const context = sessionManager.buildSessionContext();
			agent.replaceMessages(context.messages);
			return context.messages;
		},
		onBranchReturn: async (value) => {
			// Find the current branch by walking the session path from leaf to root.
			// Look for the branch tool result entry (the entry point of this branch).
			const branch = sessionManager.getBranch();
			let branchEntry: SessionMessageEntry | null = null;
			let lastReentryDetails: { returnEntryId: string; toolCallId: string } | null = null;

			// Walk from leaf toward root, looking for branch entry point and reentry markers
			for (let i = branch.length - 1; i >= 0; i--) {
				const entry = branch[i];

				// Check for branch_reentry custom message (most recent reenter)
				if (
					!lastReentryDetails &&
					entry.type === "custom_message" &&
					entry.customType === "branch_reentry" &&
					entry.details
				) {
					lastReentryDetails = entry.details as { returnEntryId: string; toolCallId: string };
				}

				// Check for the original branch tool result (first return only — no branchLeafId).
				// Skip second returns (completed sub-branches) which have branchLeafId.
				if (
					entry.type === "message" &&
					entry.message.role === "toolResult" &&
					entry.message.toolName === "branch" &&
					(entry.message as ToolResultMessage).details?.branchId &&
					!(entry.message as ToolResultMessage).details?.branchLeafId
				) {
					branchEntry = entry as SessionMessageEntry;
					break;
				}
			}

			if (!branchEntry) return undefined;

			const branchId = (branchEntry.message as ToolResultMessage).details?.branchId as string;

			// Determine the return point
			let returnPointId: string;
			if (lastReentryDetails?.returnEntryId) {
				// Entered via reenter — return to the reenter call site
				returnPointId = lastReentryDetails.returnEntryId;
			} else {
				// Entered via original branch — return to the parent of the branch tool result
				if (!branchEntry.parentId) return undefined;
				returnPointId = branchEntry.parentId;
			}

			// Record the current branch leaf before switching (for future reenter)
			const branchLeafId = sessionManager.getLeafId();

			// Move leaf to the return point
			sessionManager.branch(returnPointId);

			// Write the return value as the branch/reenter tool result
			// This tool result pairs with the original branch or reenter tool call
			const toolCallId = lastReentryDetails?.toolCallId ?? (branchEntry.message as ToolResultMessage).toolCallId;

			sessionManager.appendMessage({
				role: "toolResult",
				toolCallId,
				toolName: lastReentryDetails ? "reenter" : "branch",
				content: [{ type: "text", text: `[branch ${branchId} returned] ${value}` }],
				details: { branchId, branchLeafId },
				isError: false,
				timestamp: Date.now(),
			} as ToolResultMessage);

			// Rebuild and return the calling context's message sequence, sync agent state
			const context = sessionManager.buildSessionContext();
			agent.replaceMessages(context.messages);
			return { messages: context.messages, branchId };
		},
		getApiKey: async (provider) => {
			// Use the provider argument from the in-flight request;
			// agent.state.model may already be switched mid-turn.
			const resolvedProvider = provider || agent.state.model?.provider;
			if (!resolvedProvider) {
				throw new Error("No model selected");
			}
			const key = await modelRegistry.getApiKeyForProvider(resolvedProvider);
			if (!key) {
				const model = agent.state.model;
				const isOAuth = model && modelRegistry.isUsingOAuth(model);
				if (isOAuth) {
					throw new Error(
						`Authentication failed for "${resolvedProvider}". ` +
							`Credentials may have expired or network is unavailable. ` +
							`Run '/login ${resolvedProvider}' to re-authenticate.`,
					);
				}
				throw new Error(
					`No API key found for "${resolvedProvider}". ` +
						`Set an API key environment variable or run '/login ${resolvedProvider}'.`,
				);
			}
			return key;
		},
	});

	// Restore messages if session has existing data
	if (hasExistingSession) {
		agent.replaceMessages(existingSession.messages);
		if (!hasThinkingEntry) {
			sessionManager.appendThinkingLevelChange(thinkingLevel);
		}
	} else {
		// Save initial model and thinking level for new sessions so they can be restored on resume
		if (model) {
			sessionManager.appendModelChange(model.provider, model.id);
		}
		sessionManager.appendThinkingLevelChange(thinkingLevel);
	}

	const session = new AgentSession({
		agent,
		sessionManager,
		settingsManager,
		cwd,
		scopedModels: options.scopedModels,
		resourceLoader,
		customTools: options.customTools,
		modelRegistry,
		initialActiveToolNames,
		extensionRunnerRef,
	});
	agentSessionRef.current = session;
	const extensionsResult = resourceLoader.getExtensions();

	return {
		session,
		extensionsResult,
		modelFallbackMessage,
	};
}
