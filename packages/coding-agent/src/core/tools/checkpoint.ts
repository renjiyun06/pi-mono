import {
	type AgentTool,
	type AgentToolExecutionContext,
	SkipRemainingToolCallsError,
} from "@mariozechner/pi-agent-core";
import { Type } from "@sinclair/typebox";

const checkpointSchema = Type.Object({
	summary: Type.String({
		description: "Self-contained work summary: what was done, current state, next steps, relevant file paths.",
	}),
});

/**
 * Create the checkpoint tool.
 *
 * Allows the agent to discard all intermediate conversation history and replace it
 * with a concise work summary. Unlike compaction (which is system-triggered and
 * produces an LLM-generated summary of the process), checkpoint is agent-triggered
 * and preserves only the work results, not the process.
 *
 * Constraints:
 * - Only one checkpoint call per assistant message
 * - Must be the last tool call in the message
 */
export function createCheckpointTool(): AgentTool<typeof checkpointSchema> {
	return {
		name: "checkpoint",
		label: "checkpoint",
		description: "Save a work summary and clear all previous conversation history.",
		parameters: checkpointSchema,
		execute: async (_toolCallId, _params, _signal, _onUpdate, context) => {
			const validationError = validateCheckpointCall(context);
			if (validationError) {
				throw new SkipRemainingToolCallsError(validationError);
			}

			// TODO: Implement context replacement and agent loop interruption
			return {
				content: [],
				details: {},
			};
		},
	};
}

/**
 * Validate that the checkpoint tool call is well-formed within its batch.
 * Returns an error message if invalid, undefined if ok.
 */
function validateCheckpointCall(context?: AgentToolExecutionContext): string | undefined {
	if (!context) return undefined;

	const checkpointCount = context.toolCalls.filter((tc) => tc.name === "checkpoint").length;
	if (checkpointCount > 1) {
		return "Multiple checkpoint calls in one message. Only one checkpoint per message is allowed.";
	}

	if (context.index !== context.toolCalls.length - 1) {
		return "Checkpoint must be the last tool call in the message. Tool calls after checkpoint would execute without context.";
	}

	return undefined;
}
