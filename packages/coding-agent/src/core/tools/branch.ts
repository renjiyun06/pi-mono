import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "../extensions/types.js";
import { wrapToolDefinition } from "./tool-definition-wrapper.js";

// =========================================================================
// branch
// =========================================================================

const branchSchema = Type.Object({
	instruction: Type.String({ description: "What to accomplish in the branch" }),
});

export const branchToolDefinition: ToolDefinition<typeof branchSchema, any> = {
	name: "branch",
	label: "branch",
	description:
		"Create a new branch and switch your attention to it. The branch inherits your full current context. You must call return from within the branch to bring back a conclusion. See the Branch System section in your instructions for details.",
	promptSnippet: "Create a new branch for focused exploration",
	parameters: branchSchema,
	async execute() {
		throw new Error("branch tool is handled directly by the agent loop and should never be executed");
	},
	renderCall(args, theme, context) {
		const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
		const instruction = args?.instruction || "...";
		text.setText(`${theme.fg("toolTitle", theme.bold("branch"))} ${theme.fg("accent", instruction)}`);
		return text;
	},
	renderResult() {
		return new Text("", 0, 0);
	},
};

export function createBranchToolDefinition(): ToolDefinition<typeof branchSchema, any> {
	return branchToolDefinition;
}

export const branchTool: AgentTool<typeof branchSchema> = wrapToolDefinition(branchToolDefinition);

// =========================================================================
// return
// =========================================================================

const returnSchema = Type.Object({
	value: Type.String({ description: "The conclusion or result to bring back to the calling context" }),
});

export const returnToolDefinition: ToolDefinition<typeof returnSchema, any> = {
	name: "return",
	label: "return",
	description:
		"Return from the current branch with a value. The value becomes the branch or reenter tool's result in the calling context. Can only be used inside a branch.",
	promptSnippet: "Return from current branch with a result",
	parameters: returnSchema,
	async execute() {
		throw new Error("return tool is handled directly by the agent loop and should never be executed");
	},
	renderCall(args, theme, context) {
		const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
		const value = args?.value || "...";
		text.setText(`${theme.fg("toolTitle", theme.bold("return"))} ${theme.fg("accent", value)}`);
		return text;
	},
	renderResult() {
		return new Text("", 0, 0);
	},
};

export function createReturnToolDefinition(): ToolDefinition<typeof returnSchema, any> {
	return returnToolDefinition;
}

export const returnTool: AgentTool<typeof returnSchema> = wrapToolDefinition(returnToolDefinition);

// =========================================================================
// reenter
// =========================================================================

const reenterSchema = Type.Object({
	branchId: Type.String({ description: "The branch ID to re-enter (from a previous branch/reenter return value)" }),
	instruction: Type.String({ description: "What to accomplish in this re-entry" }),
});

export const reenterToolDefinition: ToolDefinition<typeof reenterSchema, any> = {
	name: "reenter",
	label: "reenter",
	description:
		"Re-enter a previously returned branch. The branch's full history is preserved. You will continue from where the branch left off, with the new instruction appended. Can use the branchId from a previous branch or reenter return value.",
	promptSnippet: "Re-enter a previous branch to continue work",
	parameters: reenterSchema,
	async execute() {
		throw new Error("reenter tool is handled directly by the agent loop and should never be executed");
	},
	renderCall(args, theme, context) {
		const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
		const branchId = args?.branchId || "?";
		const instruction = args?.instruction || "...";
		text.setText(
			`${theme.fg("toolTitle", theme.bold("reenter"))} ${theme.fg("warning", branchId)} ${theme.fg("accent", instruction)}`,
		);
		return text;
	},
	renderResult() {
		return new Text("", 0, 0);
	},
};

export function createReenterToolDefinition(): ToolDefinition<typeof reenterSchema, any> {
	return reenterToolDefinition;
}

export const reenterTool: AgentTool<typeof reenterSchema> = wrapToolDefinition(reenterToolDefinition);
