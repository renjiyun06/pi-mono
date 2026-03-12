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
import { getLogger } from "@mariozechner/pi-logger";
import type {
	AgentContext,
	AgentEvent,
	AgentLoopConfig,
	AgentMessage,
	AgentTool,
	AgentToolResult,
	StreamFn,
} from "./types.js";

const log = getLogger("agent-loop");

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

	(async () => {
		const newMessages: AgentMessage[] = [...prompts];
		const currentContext: AgentContext = {
			...context,
			messages: [...context.messages, ...prompts],
		};

		log.info(
			{
				promptCount: prompts.length,
				contextMessages: context.messages.length,
				toolCount: context.tools?.length ?? 0,
			},
			"agentLoop started",
		);

		stream.push({ type: "agent_start" });
		stream.push({ type: "turn_start" });
		for (const prompt of prompts) {
			stream.push({ type: "message_start", message: prompt });
			stream.push({ type: "message_end", message: prompt });
		}

		await runLoop(currentContext, newMessages, config, signal, stream, streamFn);
	})();

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

	(async () => {
		const newMessages: AgentMessage[] = [];
		const currentContext: AgentContext = { ...context };

		log.info(
			{
				contextMessages: context.messages.length,
				lastMessageRole: context.messages[context.messages.length - 1].role,
			},
			"agentLoopContinue started",
		);

		stream.push({ type: "agent_start" });
		stream.push({ type: "turn_start" });

		await runLoop(currentContext, newMessages, config, signal, stream, streamFn);
	})();

	return stream;
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
	stream: EventStream<AgentEvent, AgentMessage[]>,
	streamFn?: StreamFn,
): Promise<void> {
	let firstTurn = true;
	let outerIteration = 0;
	// Check for steering messages at start (user may have typed while waiting)
	let pendingMessages: AgentMessage[] = (await config.getSteeringMessages?.()) || [];
	if (pendingMessages.length > 0) {
		log.debug({ count: pendingMessages.length }, "initial steering messages");
	}

	// Outer loop: continues when queued follow-up messages arrive after agent would stop
	while (true) {
		outerIteration++;
		let hasMoreToolCalls = true;
		let steeringAfterTools: AgentMessage[] | null = null;
		let innerIteration = 0;

		// Inner loop: process tool calls and steering messages
		while (hasMoreToolCalls || pendingMessages.length > 0) {
			innerIteration++;
			log.debug(
				{ outerIteration, innerIteration, hasMoreToolCalls, pendingCount: pendingMessages.length },
				"inner loop iteration",
			);

			if (!firstTurn) {
				stream.push({ type: "turn_start" });
			} else {
				firstTurn = false;
			}

			// Process pending messages (inject before next assistant response)
			if (pendingMessages.length > 0) {
				log.debug({ count: pendingMessages.length }, "injecting pending messages");
				for (const message of pendingMessages) {
					stream.push({ type: "message_start", message });
					stream.push({ type: "message_end", message });
					currentContext.messages.push(message);
					newMessages.push(message);
				}
				pendingMessages = [];
			}

			// Stream assistant response
			const message = await streamAssistantResponse(currentContext, config, signal, stream, streamFn);
			newMessages.push(message);

			if (message.stopReason === "error" || message.stopReason === "aborted") {
				log.info({ stopReason: message.stopReason }, "loop ending early");
				stream.push({ type: "turn_end", message, toolResults: [] });
				stream.push({ type: "agent_end", messages: newMessages });
				stream.end(newMessages);
				return;
			}

			// Check for tool calls
			const toolCalls = message.content.filter((c) => c.type === "toolCall");
			hasMoreToolCalls = toolCalls.length > 0;

			const toolResults: ToolResultMessage[] = [];
			if (hasMoreToolCalls) {
				log.debug({ toolCallCount: toolCalls.length }, "executing tool calls");
				const toolExecution = await executeToolCalls(
					currentContext.tools,
					message,
					signal,
					stream,
					config.getSteeringMessages,
				);
				toolResults.push(...toolExecution.toolResults);
				steeringAfterTools = toolExecution.steeringMessages ?? null;

				for (const result of toolResults) {
					currentContext.messages.push(result);
					newMessages.push(result);
				}
			}

			stream.push({ type: "turn_end", message, toolResults });

			// Get steering messages after turn completes
			if (steeringAfterTools && steeringAfterTools.length > 0) {
				log.debug({ count: steeringAfterTools.length }, "steering messages after tools");
				pendingMessages = steeringAfterTools;
				steeringAfterTools = null;
			} else {
				pendingMessages = (await config.getSteeringMessages?.()) || [];
				if (pendingMessages.length > 0) {
					log.debug({ count: pendingMessages.length }, "steering messages after turn");
				}
			}
		}

		// Agent would stop here. Check for follow-up messages.
		const followUpMessages = (await config.getFollowUpMessages?.()) || [];
		if (followUpMessages.length > 0) {
			log.debug({ count: followUpMessages.length }, "follow-up messages, continuing outer loop");
			// Set as pending so inner loop processes them
			pendingMessages = followUpMessages;
			continue;
		}

		// No more messages, exit
		break;
	}

	log.info({ newMessageCount: newMessages.length, totalMessages: currentContext.messages.length }, "loop completed");
	stream.push({ type: "agent_end", messages: newMessages });
	stream.end(newMessages);
}

/**
 * Stream an assistant response from the LLM.
 * This is where AgentMessage[] gets transformed to Message[] for the LLM.
 */
async function streamAssistantResponse(
	context: AgentContext,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	stream: EventStream<AgentEvent, AgentMessage[]>,
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

	log.debug(
		{
			model: `${config.model.provider}/${config.model.id}`,
			messageCount: llmMessages.length,
			toolCount: llmContext.tools?.length ?? 0,
			hasSystemPrompt: !!llmContext.systemPrompt,
		},
		"streaming assistant response",
	);
	const startTime = Date.now();

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
				stream.push({ type: "message_start", message: { ...partialMessage } });
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
					stream.push({
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
					stream.push({ type: "message_start", message: { ...finalMessage } });
				}
				const elapsed = Date.now() - startTime;
				log.info(
					{
						stopReason: finalMessage.stopReason,
						durationMs: elapsed,
						usage: finalMessage.usage,
					},
					"assistant response complete",
				);
				stream.push({ type: "message_end", message: finalMessage });
				return finalMessage;
			}
		}
	}

	return await response.result();
}

/**
 * Execute tool calls from an assistant message.
 */
async function executeToolCalls(
	tools: AgentTool<any>[] | undefined,
	assistantMessage: AssistantMessage,
	signal: AbortSignal | undefined,
	stream: EventStream<AgentEvent, AgentMessage[]>,
	getSteeringMessages?: AgentLoopConfig["getSteeringMessages"],
): Promise<{ toolResults: ToolResultMessage[]; steeringMessages?: AgentMessage[] }> {
	const toolCalls = assistantMessage.content.filter((c) => c.type === "toolCall");
	const results: ToolResultMessage[] = [];
	let steeringMessages: AgentMessage[] | undefined;

	for (let index = 0; index < toolCalls.length; index++) {
		const toolCall = toolCalls[index];
		const tool = tools?.find((t) => t.name === toolCall.name);

		stream.push({
			type: "tool_execution_start",
			toolCallId: toolCall.id,
			toolName: toolCall.name,
			args: toolCall.arguments,
		});

		let result: AgentToolResult<any>;
		let isError = false;
		const toolStart = Date.now();

		try {
			if (!tool) throw new Error(`Tool ${toolCall.name} not found`);

			const validatedArgs = validateToolArguments(tool, toolCall);

			log.debug({ tool: toolCall.name, toolCallId: toolCall.id }, "tool execution start");

			result = await tool.execute(
				toolCall.id,
				validatedArgs,
				signal,
				(partialResult) => {
					stream.push({
						type: "tool_execution_update",
						toolCallId: toolCall.id,
						toolName: toolCall.name,
						args: toolCall.arguments,
						partialResult,
					});
				},
				{ toolCalls, index },
			);
		} catch (e) {
			result = {
				content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }],
				details: {},
			};
			isError = true;
		}

		const toolElapsed = Date.now() - toolStart;
		log.info(
			{
				tool: toolCall.name,
				toolCallId: toolCall.id,
				durationMs: toolElapsed,
				isError,
			},
			"tool execution end",
		);

		stream.push({
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

		results.push(toolResultMessage);
		stream.push({ type: "message_start", message: toolResultMessage });
		stream.push({ type: "message_end", message: toolResultMessage });

		// Check if tool requested skipping remaining calls
		if (result.skipRemainingToolCalls) {
			const remainingCalls = toolCalls.slice(index + 1);
			if (remainingCalls.length > 0) {
				log.debug(
					{ tool: toolCall.name, remainingTools: remainingCalls.length, reason: result.skipReason },
					"tool requested skip, skipping remaining tools",
				);
				for (const skipped of remainingCalls) {
					results.push(skipToolCall(skipped, stream, result.skipReason));
				}
			}
			break;
		}

		// Check for steering messages - skip remaining tools if user interrupted
		if (getSteeringMessages) {
			const steering = await getSteeringMessages();
			if (steering.length > 0) {
				log.debug(
					{ steeringCount: steering.length, remainingTools: toolCalls.length - index - 1 },
					"steering interrupt, skipping remaining tools",
				);
				steeringMessages = steering;
				const remainingCalls = toolCalls.slice(index + 1);
				for (const skipped of remainingCalls) {
					results.push(skipToolCall(skipped, stream));
				}
				break;
			}
		}
	}

	return { toolResults: results, steeringMessages };
}

function skipToolCall(
	toolCall: Extract<AssistantMessage["content"][number], { type: "toolCall" }>,
	stream: EventStream<AgentEvent, AgentMessage[]>,
	reason = "Skipped due to queued user message.",
): ToolResultMessage {
	const result: AgentToolResult<any> = {
		content: [{ type: "text", text: reason }],
		details: {},
	};

	log.debug({ tool: toolCall.name, toolCallId: toolCall.id }, "tool call skipped");

	stream.push({
		type: "tool_execution_start",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		args: toolCall.arguments,
	});
	stream.push({
		type: "tool_execution_end",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		result,
		isError: true,
	});

	const toolResultMessage: ToolResultMessage = {
		role: "toolResult",
		toolCallId: toolCall.id,
		toolName: toolCall.name,
		content: result.content,
		details: {},
		isError: true,
		timestamp: Date.now(),
	};

	stream.push({ type: "message_start", message: toolResultMessage });
	stream.push({ type: "message_end", message: toolResultMessage });

	return toolResultMessage;
}
