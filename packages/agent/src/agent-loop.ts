/**
 * Agent loop that works with AgentMessage throughout.
 * Transforms to Message[] only at the LLM call boundary.
 */

import {
	type AssistantMessage,
	type Context,
	EventStream,
	streamSimple,
	type ToolResultMessage,
	validateToolArguments,
} from "@mariozechner/pi-ai";
import { randomUUID } from "crypto";
import type {
	AgentContext,
	AgentEvent,
	AgentLoopConfig,
	AgentMessage,
	AgentTool,
	AgentToolCall,
	AgentToolResult,
	StreamFn,
} from "./types.js";

export type AgentEventSink = (event: AgentEvent) => Promise<void> | void;

/** Tool names that are handled directly by the agent loop, not through normal tool execution. */
const _BRANCH_TOOL_NAMES = new Set(["branch", "return", "reenter"]);
const CHECKOUT_TOOL_NAMES = new Set(["checkout", "merge"]);

/**
 * Start an agent loop with a new prompt message.
 * The prompt is added to the context and events are emitted for it.
 */
export function agentLoop(
	prompts: AgentMessage[],
	context: AgentContext,
	config: AgentLoopConfig,
	signal?: AbortSignal,
	streamFn?: StreamFn,
): EventStream<AgentEvent, AgentMessage[]> {
	const stream = createAgentStream();

	void runAgentLoop(
		prompts,
		context,
		config,
		async (event) => {
			stream.push(event);
		},
		signal,
		streamFn,
	).then((messages) => {
		stream.end(messages);
	});

	return stream;
}

/**
 * Continue an agent loop from the current context without adding a new message.
 * Used for retries - context already has user message or tool results.
 *
 * **Important:** The last message in context must convert to a `user` or `toolResult` message
 * via `convertToLlm`. If it doesn't, the LLM provider will reject the request.
 * This cannot be validated here since `convertToLlm` is only called once per turn.
 */
export function agentLoopContinue(
	context: AgentContext,
	config: AgentLoopConfig,
	signal?: AbortSignal,
	streamFn?: StreamFn,
): EventStream<AgentEvent, AgentMessage[]> {
	if (context.messages.length === 0) {
		throw new Error("Cannot continue: no messages in context");
	}

	if (context.messages[context.messages.length - 1].role === "assistant") {
		throw new Error("Cannot continue from message role: assistant");
	}

	const stream = createAgentStream();

	void runAgentLoopContinue(
		context,
		config,
		async (event) => {
			stream.push(event);
		},
		signal,
		streamFn,
	).then((messages) => {
		stream.end(messages);
	});

	return stream;
}

export async function runAgentLoop(
	prompts: AgentMessage[],
	context: AgentContext,
	config: AgentLoopConfig,
	emit: AgentEventSink,
	signal?: AbortSignal,
	streamFn?: StreamFn,
): Promise<AgentMessage[]> {
	const newMessages: AgentMessage[] = [...prompts];
	const currentContext: AgentContext = {
		...context,
		messages: [...context.messages, ...prompts],
	};

	await emit({ type: "agent_start" });
	await emit({ type: "turn_start" });
	for (const prompt of prompts) {
		await emit({ type: "message_start", message: prompt });
		await emit({ type: "message_end", message: prompt });
	}

	await runLoop(currentContext, newMessages, config, signal, emit, streamFn);
	return newMessages;
}

export async function runAgentLoopContinue(
	context: AgentContext,
	config: AgentLoopConfig,
	emit: AgentEventSink,
	signal?: AbortSignal,
	streamFn?: StreamFn,
): Promise<AgentMessage[]> {
	if (context.messages.length === 0) {
		throw new Error("Cannot continue: no messages in context");
	}

	if (context.messages[context.messages.length - 1].role === "assistant") {
		throw new Error("Cannot continue from message role: assistant");
	}

	const newMessages: AgentMessage[] = [];
	const currentContext: AgentContext = { ...context };

	await emit({ type: "agent_start" });
	await emit({ type: "turn_start" });

	await runLoop(currentContext, newMessages, config, signal, emit, streamFn);
	return newMessages;
}

function createAgentStream(): EventStream<AgentEvent, AgentMessage[]> {
	return new EventStream<AgentEvent, AgentMessage[]>(
		(event: AgentEvent) => event.type === "agent_end",
		(event: AgentEvent) => (event.type === "agent_end" ? event.messages : []),
	);
}

/**
 * Main loop logic shared by agentLoop and agentLoopContinue.
 */
async function runLoop(
	currentContext: AgentContext,
	newMessages: AgentMessage[],
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
	streamFn?: StreamFn,
): Promise<void> {
	let firstTurn = true;
	// Check for steering messages at start (user may have typed while waiting)
	let pendingMessages: AgentMessage[] = (await config.getSteeringMessages?.()) || [];

	// Outer loop: continues when queued follow-up messages arrive after agent would stop
	while (true) {
		let hasMoreToolCalls = true;

		// Inner loop: process tool calls and steering messages
		while (hasMoreToolCalls || pendingMessages.length > 0) {
			if (!firstTurn) {
				await emit({ type: "turn_start" });
			} else {
				firstTurn = false;
			}

			// Process pending messages (inject before next assistant response)
			if (pendingMessages.length > 0) {
				for (const message of pendingMessages) {
					await emit({ type: "message_start", message });
					await emit({ type: "message_end", message });
					currentContext.messages.push(message);
					newMessages.push(message);
				}
				pendingMessages = [];
			}

			// Stream assistant response
			const message = await streamAssistantResponse(currentContext, config, signal, emit, streamFn);
			newMessages.push(message);

			if (message.stopReason === "error" || message.stopReason === "aborted") {
				await emit({ type: "turn_end", message, toolResults: [] });
				await emit({ type: "agent_end", messages: newMessages });
				return;
			}

			// Check for tool calls
			const toolCalls = message.content.filter((c) => c.type === "toolCall") as AgentToolCall[];
			hasMoreToolCalls = toolCalls.length > 0;

			const toolResults: ToolResultMessage[] = [];
			let pendingCheckoutSwitch: CheckoutSwitchSuccess | null = null;

			if (hasMoreToolCalls) {
				// Check for checkout/merge tool calls
				const checkoutToolCalls = toolCalls.filter((tc) => CHECKOUT_TOOL_NAMES.has(tc.name));

				if (checkoutToolCalls.length > 0) {
					const firstSpecial = checkoutToolCalls[0];
					const specialIndex = toolCalls.indexOf(firstSpecial);
					const normalToolCalls = toolCalls.slice(0, specialIndex);
					const afterSpecialToolCalls = toolCalls.slice(specialIndex + 1);

					if (checkoutToolCalls.length > 1 || afterSpecialToolCalls.length > 0) {
						// Validation failed: multiple special tools or special tool is not last
						if (normalToolCalls.length > 0) {
							toolResults.push(
								...(await executeToolCalls(currentContext, message, config, signal, emit, normalToolCalls)),
							);
						}

						if (checkoutToolCalls.length > 1) {
							for (const tc of toolCalls.slice(specialIndex)) {
								const errorMsg = CHECKOUT_TOOL_NAMES.has(tc.name)
									? "Only one checkout/merge tool call is allowed per message"
									: "Cancelled: invalid checkout/merge tool call in message";
								toolResults.push(await emitBranchErrorResult(tc, errorMsg, emit));
							}
						} else {
							toolResults.push(
								await emitBranchErrorResult(
									firstSpecial,
									`${firstSpecial.name} must be the last tool call in the message`,
									emit,
								),
							);
							for (const tc of afterSpecialToolCalls) {
								toolResults.push(
									await emitBranchErrorResult(
										tc,
										"Cancelled: preceding checkout/merge tool call was invalid",
										emit,
									),
								);
							}
						}
					} else {
						// Special tool is last and only one — valid
						if (normalToolCalls.length > 0) {
							toolResults.push(
								...(await executeToolCalls(currentContext, message, config, signal, emit, normalToolCalls)),
							);
						}

						if (firstSpecial.name === "checkout") {
							const checkoutResult = await handleCheckoutToolCall(firstSpecial, config, emit);
							if (checkoutResult.type === "error") {
								toolResults.push(checkoutResult.toolResult);
							} else {
								pendingCheckoutSwitch = checkoutResult;
							}
						} else if (firstSpecial.name === "merge") {
							const mergeResult = await handleMergeToolCall(firstSpecial, config, emit);
							if (mergeResult.type === "error") {
								toolResults.push(mergeResult.toolResult);
							} else {
								pendingCheckoutSwitch = mergeResult;
							}
						}
					}
				} else {
					// No special tools — normal execution
					toolResults.push(...(await executeToolCalls(currentContext, message, config, signal, emit)));
				}

				for (const result of toolResults) {
					currentContext.messages.push(result);
					newMessages.push(result);
				}
			}

			await emit({ type: "turn_end", message, toolResults });

			// Checkout/merge context switch happens after turn_end — the old turn is cleanly closed
			if (pendingCheckoutSwitch) {
				currentContext.messages.length = 0;
				currentContext.messages.push(...pendingCheckoutSwitch.messages);
				newMessages.length = 0;

				await emit({
					type: "checkout_switch",
					branchId: pendingCheckoutSwitch.branchId,
					isNew: pendingCheckoutSwitch.isNew,
					isMerge: pendingCheckoutSwitch.isMerge,
					instruction: pendingCheckoutSwitch.instruction,
					conclusion: pendingCheckoutSwitch.conclusion,
				});
			}

			pendingMessages = (await config.getSteeringMessages?.()) || [];
		}

		// Agent would stop here. Check for follow-up messages.
		const followUpMessages = (await config.getFollowUpMessages?.()) || [];
		if (followUpMessages.length > 0) {
			// Set as pending so inner loop processes them
			pendingMessages = followUpMessages;
			continue;
		}

		// No more messages, exit
		break;
	}

	await emit({ type: "agent_end", messages: newMessages });
}

/**
 * Stream an assistant response from the LLM.
 * This is where AgentMessage[] gets transformed to Message[] for the LLM.
 */
async function streamAssistantResponse(
	context: AgentContext,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
	streamFn?: StreamFn,
): Promise<AssistantMessage> {
	// Apply context transform if configured (AgentMessage[] → AgentMessage[])
	let messages = context.messages;
	if (config.transformContext) {
		messages = await config.transformContext(messages, signal);
	}

	// Convert to LLM-compatible messages (AgentMessage[] → Message[])
	const llmMessages = await config.convertToLlm(messages);

	// Build LLM context
	const llmContext: Context = {
		systemPrompt: context.systemPrompt,
		messages: llmMessages,
		tools: context.tools,
	};

	const streamFunction = streamFn || streamSimple;

	// Resolve API key (important for expiring tokens)
	const resolvedApiKey =
		(config.getApiKey ? await config.getApiKey(config.model.provider) : undefined) || config.apiKey;

	const response = await streamFunction(config.model, llmContext, {
		...config,
		apiKey: resolvedApiKey,
		signal,
	});

	let partialMessage: AssistantMessage | null = null;
	let addedPartial = false;

	for await (const event of response) {
		switch (event.type) {
			case "start":
				partialMessage = event.partial;
				context.messages.push(partialMessage);
				addedPartial = true;
				await emit({ type: "message_start", message: { ...partialMessage } });
				break;

			case "text_start":
			case "text_delta":
			case "text_end":
			case "thinking_start":
			case "thinking_delta":
			case "thinking_end":
			case "toolcall_start":
			case "toolcall_delta":
			case "toolcall_end":
				if (partialMessage) {
					partialMessage = event.partial;
					context.messages[context.messages.length - 1] = partialMessage;
					await emit({
						type: "message_update",
						assistantMessageEvent: event,
						message: { ...partialMessage },
					});
				}
				break;

			case "done":
			case "error": {
				const finalMessage = await response.result();
				if (addedPartial) {
					context.messages[context.messages.length - 1] = finalMessage;
				} else {
					context.messages.push(finalMessage);
				}
				if (!addedPartial) {
					await emit({ type: "message_start", message: { ...finalMessage } });
				}
				await emit({ type: "message_end", message: finalMessage });
				return finalMessage;
			}
		}
	}

	const finalMessage = await response.result();
	if (addedPartial) {
		context.messages[context.messages.length - 1] = finalMessage;
	} else {
		context.messages.push(finalMessage);
		await emit({ type: "message_start", message: { ...finalMessage } });
	}
	await emit({ type: "message_end", message: finalMessage });
	return finalMessage;
}

/**
 * Execute tool calls from an assistant message.
 */
async function executeToolCalls(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
	filteredToolCalls?: AgentToolCall[],
): Promise<ToolResultMessage[]> {
	const toolCalls = filteredToolCalls ?? assistantMessage.content.filter((c) => c.type === "toolCall");
	if (config.toolExecution === "sequential") {
		return executeToolCallsSequential(currentContext, assistantMessage, toolCalls, config, signal, emit);
	}
	return executeToolCallsParallel(currentContext, assistantMessage, toolCalls, config, signal, emit);
}

async function executeToolCallsSequential(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	toolCalls: AgentToolCall[],
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
): Promise<ToolResultMessage[]> {
	const results: ToolResultMessage[] = [];

	for (const toolCall of toolCalls) {
		await emit({
			type: "tool_execution_start",
			toolCallId: toolCall.id,
			toolName: toolCall.name,
			args: toolCall.arguments,
		});

		const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal);
		if (preparation.kind === "immediate") {
			results.push(await emitToolCallOutcome(toolCall, preparation.result, preparation.isError, emit));
		} else {
			const executed = await executePreparedToolCall(preparation, signal, emit);
			results.push(
				await finalizeExecutedToolCall(
					currentContext,
					assistantMessage,
					preparation,
					executed,
					config,
					signal,
					emit,
				),
			);
		}
	}

	return results;
}

async function executeToolCallsParallel(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	toolCalls: AgentToolCall[],
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
): Promise<ToolResultMessage[]> {
	const results: ToolResultMessage[] = [];
	const runnableCalls: PreparedToolCall[] = [];

	for (const toolCall of toolCalls) {
		await emit({
			type: "tool_execution_start",
			toolCallId: toolCall.id,
			toolName: toolCall.name,
			args: toolCall.arguments,
		});

		const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal);
		if (preparation.kind === "immediate") {
			results.push(await emitToolCallOutcome(toolCall, preparation.result, preparation.isError, emit));
		} else {
			runnableCalls.push(preparation);
		}
	}

	const runningCalls = runnableCalls.map((prepared) => ({
		prepared,
		execution: executePreparedToolCall(prepared, signal, emit),
	}));

	for (const running of runningCalls) {
		const executed = await running.execution;
		results.push(
			await finalizeExecutedToolCall(
				currentContext,
				assistantMessage,
				running.prepared,
				executed,
				config,
				signal,
				emit,
			),
		);
	}

	return results;
}

type PreparedToolCall = {
	kind: "prepared";
	toolCall: AgentToolCall;
	tool: AgentTool<any>;
	args: unknown;
};

type ImmediateToolCallOutcome = {
	kind: "immediate";
	result: AgentToolResult<any>;
	isError: boolean;
};

type ExecutedToolCallOutcome = {
	result: AgentToolResult<any>;
	isError: boolean;
};

function prepareToolCallArguments(tool: AgentTool<any>, toolCall: AgentToolCall): AgentToolCall {
	if (!tool.prepareArguments) {
		return toolCall;
	}
	const preparedArguments = tool.prepareArguments(toolCall.arguments);
	if (preparedArguments === toolCall.arguments) {
		return toolCall;
	}
	return {
		...toolCall,
		arguments: preparedArguments as Record<string, any>,
	};
}

async function prepareToolCall(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	toolCall: AgentToolCall,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
): Promise<PreparedToolCall | ImmediateToolCallOutcome> {
	const tool = currentContext.tools?.find((t) => t.name === toolCall.name);
	if (!tool) {
		return {
			kind: "immediate",
			result: createErrorToolResult(`Tool ${toolCall.name} not found`),
			isError: true,
		};
	}

	try {
		const preparedToolCall = prepareToolCallArguments(tool, toolCall);
		const validatedArgs = validateToolArguments(tool, preparedToolCall);
		if (config.beforeToolCall) {
			const beforeResult = await config.beforeToolCall(
				{
					assistantMessage,
					toolCall,
					args: validatedArgs,
					context: currentContext,
				},
				signal,
			);
			if (beforeResult?.block) {
				return {
					kind: "immediate",
					result: createErrorToolResult(beforeResult.reason || "Tool execution was blocked"),
					isError: true,
				};
			}
		}
		return {
			kind: "prepared",
			toolCall,
			tool,
			args: validatedArgs,
		};
	} catch (error) {
		return {
			kind: "immediate",
			result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
			isError: true,
		};
	}
}

async function executePreparedToolCall(
	prepared: PreparedToolCall,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
): Promise<ExecutedToolCallOutcome> {
	const updateEvents: Promise<void>[] = [];

	try {
		const result = await prepared.tool.execute(
			prepared.toolCall.id,
			prepared.args as never,
			signal,
			(partialResult) => {
				updateEvents.push(
					Promise.resolve(
						emit({
							type: "tool_execution_update",
							toolCallId: prepared.toolCall.id,
							toolName: prepared.toolCall.name,
							args: prepared.toolCall.arguments,
							partialResult,
						}),
					),
				);
			},
		);
		await Promise.all(updateEvents);
		return { result, isError: false };
	} catch (error) {
		await Promise.all(updateEvents);
		return {
			result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
			isError: true,
		};
	}
}

async function finalizeExecutedToolCall(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	prepared: PreparedToolCall,
	executed: ExecutedToolCallOutcome,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
): Promise<ToolResultMessage> {
	let result = executed.result;
	let isError = executed.isError;

	if (config.afterToolCall) {
		const afterResult = await config.afterToolCall(
			{
				assistantMessage,
				toolCall: prepared.toolCall,
				args: prepared.args,
				result,
				isError,
				context: currentContext,
			},
			signal,
		);
		if (afterResult) {
			result = {
				content: afterResult.content ?? result.content,
				details: afterResult.details ?? result.details,
			};
			isError = afterResult.isError ?? isError;
		}
	}

	return await emitToolCallOutcome(prepared.toolCall, result, isError, emit);
}

function createErrorToolResult(message: string): AgentToolResult<any> {
	return {
		content: [{ type: "text", text: message }],
		details: {},
	};
}

async function emitToolCallOutcome(
	toolCall: AgentToolCall,
	result: AgentToolResult<any>,
	isError: boolean,
	emit: AgentEventSink,
): Promise<ToolResultMessage> {
	await emit({
		type: "tool_execution_end",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		result,
		isError,
	});

	const toolResultMessage: ToolResultMessage = {
		role: "toolResult",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		content: result.content,
		details: result.details,
		isError,
		timestamp: Date.now(),
	};

	await emit({ type: "message_start", message: toolResultMessage });
	await emit({ type: "message_end", message: toolResultMessage });
	return toolResultMessage;
}

// =========================================================================
// Branch tool handling
// =========================================================================

async function _handleBranchToolCall(toolCall: AgentToolCall, emit: AgentEventSink): Promise<ToolResultMessage> {
	const instruction = (toolCall.arguments as Record<string, any>)?.instruction ?? "";
	const branchId = randomUUID().slice(0, 8);

	const toolResultMessage: ToolResultMessage = {
		role: "toolResult",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		content: [{ type: "text", text: "Entered branch." }],
		details: { branchId },
		isError: false,
		timestamp: Date.now(),
	};

	await emit({ type: "message_start", message: toolResultMessage });
	await emit({ type: "message_end", message: toolResultMessage });
	await emit({ type: "branch_enter", branchId, isNew: true, instruction });

	return toolResultMessage;
}

interface BranchSwitchSuccess {
	type: "success";
	switchType: "reenter" | "return";
	messages: AgentMessage[];
	branchId: string;
	/** For reenter: the instruction. For return: the return value. */
	value: string;
}

interface BranchSwitchError {
	type: "error";
	toolResult: ToolResultMessage;
}

type BranchSwitchResult = BranchSwitchSuccess | BranchSwitchError;

/**
 * Handle reenter tool call. Returns either a success result with the new branch messages,
 * or an error result with a ToolResultMessage to add to the current context.
 *
 * Does NOT switch context — the caller handles that after emitting turn_end.
 */
async function _handleReenterToolCall(
	toolCall: AgentToolCall,
	config: AgentLoopConfig,
	emit: AgentEventSink,
): Promise<BranchSwitchResult> {
	const args = toolCall.arguments as Record<string, any>;
	const branchId = args?.branchId ?? "";
	const instruction = args?.instruction ?? "";

	if (!branchId) {
		return { type: "error", toolResult: await emitBranchErrorResult(toolCall, "reenter requires a branchId", emit) };
	}

	if (!config.onBranchReenter) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(
				toolCall,
				"Branch reenter is not supported in this configuration",
				emit,
			),
		};
	}

	await config.flushEvents?.();
	const branchMessages = await config.onBranchReenter(branchId, instruction, toolCall.id);

	if (!branchMessages) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(toolCall, `Branch ${branchId} not found`, emit),
		};
	}

	return { type: "success", switchType: "reenter", messages: branchMessages, branchId, value: instruction };
}

async function _handleReturnToolCall(
	toolCall: AgentToolCall,
	config: AgentLoopConfig,
	emit: AgentEventSink,
): Promise<BranchSwitchResult> {
	const args = toolCall.arguments as Record<string, any>;
	const value = args?.value ?? "";

	if (!config.onBranchReturn) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(
				toolCall,
				"Branch return is not supported in this configuration",
				emit,
			),
		};
	}

	// Write tool result in the branch BEFORE switching context.
	// This leaves a complete record of the return in the branch's session path.
	const returnToolResult: ToolResultMessage = {
		role: "toolResult",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		content: [],
		details: {},
		isError: false,
		timestamp: Date.now(),
	};
	await emit({ type: "message_start", message: returnToolResult });
	await emit({ type: "message_end", message: returnToolResult });

	// Flush events to ensure return tool result is persisted before context switch
	await config.flushEvents?.();

	// Now switch to upstream context
	const result = await config.onBranchReturn(value);

	if (!result) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(toolCall, "Not currently in a branch", emit),
		};
	}

	return { type: "success", switchType: "return", messages: result.messages, branchId: result.branchId, value };
}

// =========================================================================
// Checkout/merge tool handling
// =========================================================================

interface CheckoutSwitchSuccess {
	type: "success";
	messages: AgentMessage[];
	branchId: string;
	isNew: boolean;
	isMerge: boolean;
	instruction?: string;
	conclusion?: string;
	toolResult: ToolResultMessage;
}

interface CheckoutSwitchError {
	type: "error";
	toolResult: ToolResultMessage;
}

type CheckoutSwitchResult = CheckoutSwitchSuccess | CheckoutSwitchError;

async function handleCheckoutToolCall(
	toolCall: AgentToolCall,
	config: AgentLoopConfig,
	emit: AgentEventSink,
): Promise<CheckoutSwitchResult> {
	const args = toolCall.arguments as Record<string, any>;
	const branchId = args?.branchId as string | undefined;
	const instruction = args?.instruction as string | undefined;

	if (!config.onCheckout) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(toolCall, "Checkout is not supported in this configuration", emit),
		};
	}

	// Generate branchId here if new, so we can emit tool result BEFORE switching
	const isNew = !branchId;
	const targetBranchId = branchId ?? randomUUID().slice(0, 8);

	// Validate branch access for existing branches (new branches are always in subtree)
	if (!isNew && config.validateBranchAccess) {
		const error = await config.validateBranchAccess(targetBranchId);
		if (error) {
			return {
				type: "error",
				toolResult: await emitBranchErrorResult(toolCall, error, emit),
			};
		}
	}

	// Build and emit tool result on the CURRENT branch BEFORE switching
	const resultText = isNew
		? `Checked out to new branch [${targetBranchId}]`
		: `Checked out to branch [${targetBranchId}]`;
	const toolResultMessage: ToolResultMessage = {
		role: "toolResult",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		content: [{ type: "text", text: resultText }],
		details: { branchId: targetBranchId, isNew },
		isError: false,
		timestamp: Date.now(),
	};

	await emit({ type: "message_start", message: toolResultMessage });
	await emit({ type: "message_end", message: toolResultMessage });

	// Flush to ensure tool result is persisted on current branch before switch
	await config.flushEvents?.();

	// Now switch branches — onCheckout receives the pre-determined branchId
	const result = await config.onCheckout(targetBranchId, instruction, isNew);

	if (!result) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(
				toolCall,
				branchId ? `Branch ${branchId} not found` : "Failed to create new branch",
				emit,
			),
		};
	}

	return {
		type: "success",
		messages: result.messages,
		branchId: result.branchId,
		isNew,
		isMerge: false,
		instruction,
		toolResult: toolResultMessage,
	};
}

async function handleMergeToolCall(
	toolCall: AgentToolCall,
	config: AgentLoopConfig,
	emit: AgentEventSink,
): Promise<CheckoutSwitchResult> {
	const args = toolCall.arguments as Record<string, any>;
	const target = args?.target as string | undefined;
	const conclusion = args?.conclusion as string | undefined;

	if (!target) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(toolCall, "merge requires a target branch ID", emit),
		};
	}

	if (!conclusion) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(toolCall, "merge requires a conclusion", emit),
		};
	}

	if (!config.onMerge) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(toolCall, "Merge is not supported in this configuration", emit),
		};
	}

	// Validate branch access for merge target
	if (config.validateBranchAccess) {
		const error = await config.validateBranchAccess(target);
		if (error) {
			return {
				type: "error",
				toolResult: await emitBranchErrorResult(toolCall, error, emit),
			};
		}
	}

	// Write tool result on the current branch BEFORE switching context
	const toolResultMessage: ToolResultMessage = {
		role: "toolResult",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		content: [{ type: "text", text: `Merged to branch [${target}]` }],
		details: { targetBranchId: target },
		isError: false,
		timestamp: Date.now(),
	};

	await emit({ type: "message_start", message: toolResultMessage });
	await emit({ type: "message_end", message: toolResultMessage });

	// Flush events to ensure merge tool result is persisted before context switch
	await config.flushEvents?.();

	const result = await config.onMerge(target, conclusion);

	if (!result) {
		return {
			type: "error",
			toolResult: await emitBranchErrorResult(toolCall, `Failed to merge into branch ${target}`, emit),
		};
	}

	return {
		type: "success",
		messages: result.messages,
		branchId: result.branchId,
		isNew: false,
		isMerge: true,
		conclusion,
		toolResult: toolResultMessage,
	};
}

async function emitBranchErrorResult(
	toolCall: AgentToolCall,
	errorMessage: string,
	emit: AgentEventSink,
): Promise<ToolResultMessage> {
	const toolResultMessage: ToolResultMessage = {
		role: "toolResult",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		content: [{ type: "text", text: errorMessage }],
		details: {},
		isError: true,
		timestamp: Date.now(),
	};

	await emit({ type: "message_start", message: toolResultMessage });
	await emit({ type: "message_end", message: toolResultMessage });

	return toolResultMessage;
}
