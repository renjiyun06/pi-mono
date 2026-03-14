import {
	type AgentTool,
	type AgentToolExecutionContext,
	SkipRemainingToolCallsError,
} from "@mariozechner/pi-agent-core";
import { getLogger } from "@mariozechner/pi-logger";
import { Type } from "@sinclair/typebox";

const log = getLogger("branch");

/**
 * A single frame in the branch stack, representing an active branch.
 */
export interface BranchFrame {
	branchToolCallId: string;
	title: string;
	task: string;
	pendingReturn: { result: string; toolCallId: string } | null;
}

/**
 * Shared mutable state for branch tools.
 * Created by AgentSession, captured by closure in all three tools.
 */
export interface BranchState {
	stack: BranchFrame[];
}

const branchSchema = Type.Object({
	title: Type.String({
		description: "Short label for the branch. Keep it to a few words.",
	}),
	task: Type.String({
		description: "What to focus on. Just state the concern.",
	}),
});

const returnSchema = Type.Object({
	result: Type.String({
		description: "The value to carry back to the calling context.",
	}),
});

/**
 * Validate that the branch tool call is well-formed within its batch.
 * Returns an error message if invalid, undefined if ok.
 */
function validateBranchCall(context?: AgentToolExecutionContext): string | undefined {
	if (!context) return undefined;

	const branchCount = context.toolCalls.filter((tc) => tc.name === "branch").length;
	if (branchCount > 1) {
		return "Multiple branch calls in one message. Only one branch call per message is allowed.";
	}

	if (context.index !== context.toolCalls.length - 1) {
		return "Branch must be the last tool call in the message. Tool calls after branch would not belong to any context.";
	}

	return undefined;
}

/**
 * Create the branch tool.
 *
 * Shifts attention to a specific concern by forking into a branch.
 * The full conversation history is available in the branch.
 * Call `return` when done to go back to the calling context.
 */
export function createBranchTool(state: BranchState): AgentTool<typeof branchSchema> {
	return {
		name: "branch",
		label: "branch",
		description: "Fork into a branch to focus on a specific concern.",
		parameters: branchSchema,
		execute: async (toolCallId, params, _signal, _onUpdate, context) => {
			const validationError = validateBranchCall(context);
			if (validationError) {
				throw new SkipRemainingToolCallsError(validationError);
			}

			state.stack.push({
				branchToolCallId: toolCallId,
				title: params.title,
				task: params.task,
				pendingReturn: null,
			});

			return {
				content: [{ type: "text", text: "Entered branch" }],
				details: {},
			};
		},
	};
}

/**
 * Validate that the propose-branch-result-and-wait tool call is well-formed within its batch.
 * Returns an error message if invalid, undefined if ok.
 */
function validateProposeCall(context?: AgentToolExecutionContext): string | undefined {
	if (!context) return undefined;

	const proposeCount = context.toolCalls.filter((tc) => tc.name === "propose-branch-result-and-wait").length;
	if (proposeCount > 1) {
		return "Multiple propose-branch-result-and-wait calls in one message. Only one proposal per message is allowed.";
	}

	if (context.index !== context.toolCalls.length - 1) {
		return "propose-branch-result-and-wait must be the last tool call in the message.";
	}

	return undefined;
}

/**
 * Create the propose-branch-result-and-wait tool.
 *
 * Proposes a result to carry back to the calling context and waits for confirmation.
 * Only works inside a branch (stack depth > 0).
 */
export function createProposeTool(state: BranchState): AgentTool<typeof returnSchema> {
	return {
		name: "propose-branch-result-and-wait",
		label: "propose-branch-result-and-wait",
		description: "Propose a result to carry back to the calling context and wait for confirmation.",
		parameters: returnSchema,
		execute: async (toolCallId, params, _signal, _onUpdate, context) => {
			const validationError = validateProposeCall(context);
			if (validationError) {
				throw new SkipRemainingToolCallsError(validationError);
			}

			if (state.stack.length === 0) {
				return {
					content: [{ type: "text", text: "Not in a branch. Nothing to return from." }],
					details: {},
				};
			}
			const currentFrame = state.stack[state.stack.length - 1];
			if (currentFrame.pendingReturn) {
				log.info(
					{ previousToolCallId: currentFrame.pendingReturn.toolCallId, newToolCallId: toolCallId },
					"overwriting pending return",
				);
			}
			currentFrame.pendingReturn = { result: params.result, toolCallId };
			return {
				content: [
					{
						type: "text",
						text: "Waiting for confirmation.",
					},
				],
				details: {},
				stopLoop: true,
			};
		},
	};
}

/**
 * Create the branch-status tool.
 *
 * Read-only tool to check the current position in the branch structure.
 * Useful for reorienting after a long sequence of work or after context compaction.
 */
export function createBranchStatusTool(state: BranchState): AgentTool {
	return {
		name: "branch-status",
		label: "branch-status",
		description: "Check your current position in the branch structure.",
		parameters: Type.Object({}),
		execute: async () => {
			let text: string;
			if (state.stack.length === 0) {
				text = "Not in a branch (top level).";
			} else {
				const lines = [`Branch stack (depth ${state.stack.length}):`];
				for (let i = 0; i < state.stack.length; i++) {
					const frame = state.stack[i];
					const current = i === state.stack.length - 1 ? " (current)" : "";
					lines.push(`  ${i + 1}. ${frame.title}${current} — ${frame.task}`);
				}
				text = lines.join("\n");
			}
			return {
				content: [{ type: "text", text }],
				details: {},
			};
		},
	};
}

/**
 * Create all branch-related tools sharing the same state.
 */
export function createBranchTools(state: BranchState): Record<string, AgentTool<any>> {
	return {
		branch: createBranchTool(state),
		"propose-branch-result-and-wait": createProposeTool(state),
		"branch-status": createBranchStatusTool(state),
	};
}
