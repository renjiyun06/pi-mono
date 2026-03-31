import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "../extensions/types.js";
import { wrapToolDefinition } from "./tool-definition-wrapper.js";

// =========================================================================
// checkout
// =========================================================================

const checkoutSchema = Type.Object({
	branchId: Type.Optional(Type.String({ description: "The branch ID to switch to. Omit to create a new branch." })),
	instruction: Type.Optional(
		Type.String({ description: "What to accomplish in the target branch, or why you are switching." }),
	),
});

export const checkoutToolDefinition: ToolDefinition<typeof checkoutSchema, any> = {
	name: "checkout",
	label: "checkout",
	description:
		"Switch to a different branch. If branchId is omitted, a new branch is created from the current position. " +
		"If branchId is provided, switches to that existing branch. " +
		"The instruction describes what to accomplish or why you are switching.",
	promptSnippet: "Switch to a new or existing branch",
	parameters: checkoutSchema,
	async execute() {
		throw new Error("checkout tool is handled directly by the agent loop and should never be executed");
	},
	renderCall(args, theme, context) {
		const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
		const branchId = args?.branchId;
		const instruction = args?.instruction || "...";
		if (branchId) {
			text.setText(
				`${theme.fg("toolTitle", theme.bold("checkout"))} ${theme.fg("warning", branchId)} ${theme.fg("accent", instruction)}`,
			);
		} else {
			text.setText(`${theme.fg("toolTitle", theme.bold("checkout"))} ${theme.fg("accent", instruction)}`);
		}
		return text;
	},
	renderResult() {
		return new Text("", 0, 0);
	},
};

export function createCheckoutToolDefinition(): ToolDefinition<typeof checkoutSchema, any> {
	return checkoutToolDefinition;
}

export const checkoutTool: AgentTool<typeof checkoutSchema> = wrapToolDefinition(checkoutToolDefinition);

// =========================================================================
// merge
// =========================================================================

const mergeSchema = Type.Object({
	target: Type.String({ description: "The branch ID to merge into" }),
	conclusion: Type.String({ description: "The conclusion or result to bring to the target branch" }),
});

export const mergeToolDefinition: ToolDefinition<typeof mergeSchema, any> = {
	name: "merge",
	label: "merge",
	description:
		"Merge the current branch's conclusion into a target branch. " +
		"This switches your attention to the target branch and delivers the conclusion as a merge commit. " +
		"The current branch is preserved and can be checked out again later.",
	promptSnippet: "Merge conclusion into a target branch",
	parameters: mergeSchema,
	async execute() {
		throw new Error("merge tool is handled directly by the agent loop and should never be executed");
	},
	renderCall(args, theme, context) {
		const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
		const target = args?.target || "?";
		const conclusion = args?.conclusion || "...";
		text.setText(
			`${theme.fg("toolTitle", theme.bold("merge"))} ${theme.fg("warning", target)} ${theme.fg("accent", conclusion)}`,
		);
		return text;
	},
	renderResult() {
		return new Text("", 0, 0);
	},
};

export function createMergeToolDefinition(): ToolDefinition<typeof mergeSchema, any> {
	return mergeToolDefinition;
}

export const mergeTool: AgentTool<typeof mergeSchema> = wrapToolDefinition(mergeToolDefinition);
