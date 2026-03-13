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
}

/**
 * Shared mutable state for branch tools.
 * Created by AgentSession, captured by closure in all three tools.
 */
export interface BranchState {
	stack: BranchFrame[];
	pendingReturn: { result: string; toolCallId: string } | null;
}

const branchSchema = Type.Object({
	title: Type.String({
		description: "Short label for the branch. Keep it to a few words.",
	}),
	task: Type.String({
		description:
			"What to focus on. The branch inherits the full conversation history, " +
			"so there is no need to re-explain background. Just state the concern: " +
			'"check if the API paginates correctly", ' +
			'"figure out why the test fails", ' +
			'"decide between migration strategies".',
	}),
});

const returnSchema = Type.Object({
	result: Type.String({
		description:
			"The value to carry back to the calling context. Everything else from this branch " +
			"is discarded. What you write here depends on what the branch was for: " +
			'a finding ("API needs an offset parameter"), ' +
			'a status ("fixed the bug, test passes"), ' +
			"a detailed report, a decision, or just an acknowledgment. " +
			"No required format — write whatever the calling context needs to continue.",
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
		description:
			"An attention mechanism: temporarily narrow your focus to a specific concern " +
			"by forking into a branch. The branch inherits the full conversation history. " +
			"This tool returns twice:\n" +
			'- First return: "Entered branch". Do whatever is needed, ' +
			"then call return() when done.\n" +
			"- Second return: the result you passed to return(). The intermediate steps " +
			"are gone — you already did the work, you just don't carry the details anymore.\n" +
			"Branches can nest.",
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
			});

			return {
				content: [{ type: "text", text: "Entered branch" }],
				details: {},
			};
		},
	};
}

/**
 * Create the return tool.
 *
 * Proposes ending the current branch and returning a result to the calling context.
 * Only works inside a branch (stack depth > 0).
 */
export function createReturnTool(state: BranchState): AgentTool<typeof returnSchema> {
	return {
		name: "return",
		label: "return",
		description:
			"Propose ending the current branch and going back to the calling context. " +
			"The result you provide is the only thing that carries over — " +
			"all intermediate messages from this branch are discarded. " +
			"There is no required format or length — write whatever the calling context " +
			"needs to continue its work. " +
			"The actual return will only happen when the user or the system executes the confirm-return command.",
		parameters: returnSchema,
		execute: async (toolCallId, params) => {
			if (state.stack.length === 0) {
				return {
					content: [{ type: "text", text: "Not in a branch. Nothing to return from." }],
					details: {},
				};
			}
			if (state.pendingReturn) {
				log.info(
					{ previousToolCallId: state.pendingReturn.toolCallId, newToolCallId: toolCallId },
					"overwriting pending return",
				);
			}
			state.pendingReturn = { result: params.result, toolCallId };
			return {
				content: [{ type: "text", text: "Return proposed." }],
				details: {},
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
		description:
			"Check your current position in the branch structure. " +
			"Returns the full branch stack: which branches are active, their titles and tasks, " +
			"and which one you are currently in. Useful when you need to reorient yourself " +
			"after a long sequence of work, or after context compaction.",
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
		return: createReturnTool(state),
		"branch-status": createBranchStatusTool(state),
	};
}
