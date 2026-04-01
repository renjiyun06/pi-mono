/**
 * System prompt construction and project context loading
 */

import { getDocsPath, getExamplesPath, getReadmePath } from "../config.js";
import { formatSkillsForPrompt, type Skill } from "./skills.js";

export interface BuildSystemPromptOptions {
	/** Custom system prompt (replaces default). */
	customPrompt?: string;
	/** Tools to include in prompt. Default: [read, bash, edit, write] */
	selectedTools?: string[];
	/** Optional one-line tool snippets keyed by tool name. */
	toolSnippets?: Record<string, string>;
	/** Additional guideline bullets appended to the default system prompt guidelines. */
	promptGuidelines?: string[];
	/** Text to append to system prompt. */
	appendSystemPrompt?: string;
	/** Working directory. Default: process.cwd() */
	cwd?: string;
	/** Pre-loaded context files. */
	contextFiles?: Array<{ path: string; content: string }>;
	/** Pre-loaded skills. */
	skills?: Skill[];
}

/** Build the system prompt with tools, guidelines, and context */
export function buildSystemPrompt(options: BuildSystemPromptOptions = {}): string {
	const {
		customPrompt,
		selectedTools,
		toolSnippets,
		promptGuidelines,
		appendSystemPrompt,
		cwd,
		contextFiles: providedContextFiles,
		skills: providedSkills,
	} = options;
	const resolvedCwd = cwd ?? process.cwd();
	const promptCwd = resolvedCwd.replace(/\\/g, "/");

	const date = new Date().toISOString().slice(0, 10);

	const appendSection = appendSystemPrompt ? `\n\n${appendSystemPrompt}` : "";

	const contextFiles = providedContextFiles ?? [];
	const skills = providedSkills ?? [];

	if (customPrompt) {
		let prompt = customPrompt;

		if (appendSection) {
			prompt += appendSection;
		}

		// Append project context files
		if (contextFiles.length > 0) {
			prompt += "\n\n# Project Context\n\n";
			prompt += "Project-specific instructions and guidelines:\n\n";
			for (const { path: filePath, content } of contextFiles) {
				prompt += `## ${filePath}\n\n${content}\n\n`;
			}
		}

		// Append skills section (only if read tool is available)
		const customPromptHasRead = !selectedTools || selectedTools.includes("read");
		if (customPromptHasRead && skills.length > 0) {
			prompt += formatSkillsForPrompt(skills);
		}

		// Add date and working directory last
		prompt += `\nCurrent date: ${date}`;
		prompt += `\nCurrent working directory: ${promptCwd}`;

		return prompt;
	}

	// Get absolute paths to documentation and examples
	const readmePath = getReadmePath();
	const docsPath = getDocsPath();
	const examplesPath = getExamplesPath();

	// Build tools list based on selected tools.
	// A tool appears in Available tools only when the caller provides a one-line snippet.
	const tools = selectedTools || ["read", "bash", "edit", "write"];
	const visibleTools = tools.filter((name) => !!toolSnippets?.[name]);
	const toolsList =
		visibleTools.length > 0 ? visibleTools.map((name) => `- ${name}: ${toolSnippets![name]}`).join("\n") : "(none)";

	// Build guidelines based on which tools are actually available
	const guidelinesList: string[] = [];
	const guidelinesSet = new Set<string>();
	const addGuideline = (guideline: string): void => {
		if (guidelinesSet.has(guideline)) {
			return;
		}
		guidelinesSet.add(guideline);
		guidelinesList.push(guideline);
	};

	const hasBash = tools.includes("bash");
	const hasGrep = tools.includes("grep");
	const hasFind = tools.includes("find");
	const hasLs = tools.includes("ls");
	const hasRead = tools.includes("read");

	// File exploration guidelines
	if (hasBash && !hasGrep && !hasFind && !hasLs) {
		addGuideline("Use bash for file operations like ls, rg, find");
	} else if (hasBash && (hasGrep || hasFind || hasLs)) {
		addGuideline("Prefer grep/find/ls tools over bash for file exploration (faster, respects .gitignore)");
	}

	for (const guideline of promptGuidelines ?? []) {
		const normalized = guideline.trim();
		if (normalized.length > 0) {
			addGuideline(normalized);
		}
	}

	// Always include these
	addGuideline("Be concise in your responses");
	addGuideline("Show file paths clearly when working with files");

	const guidelines = guidelinesList.map((g) => `- ${g}`).join("\n");

	let prompt = `You are an expert coding assistant operating inside pi, a coding agent harness. You help users by reading files, executing commands, editing code, and writing new files.

## Branch System

You work inside a Git-based branch system. Your conversation history is stored as Git commits, and you can switch between branches to organize your work. Each branch has its own isolated context.

You have two special tools for this: \`checkout\` and \`merge\`.

### Tools

- **\`checkout\`**: Switch to a different branch.
  - \`checkout(instruction: "...")\` — Create a new branch from the current position and switch to it. The new branch inherits all context up to this point.
  - \`checkout(branchId: "...", instruction: "...")\` — Switch to an existing branch. The instruction describes why you are switching.

- **\`merge\`**: Bring a conclusion from the current branch to a target branch.
  - \`merge(target: "...", conclusion: "...")\` — Merge your conclusion into the target branch and switch to it. This is like a squash merge in Git — the target branch only sees the conclusion, not the detailed work.

### How it works

When you \`checkout\` to a new or existing branch:
1. A tool result \`"Checked out to [new] branch [id]"\` is recorded on the current branch
2. Your attention switches to the target branch
3. The target branch sees a \`[context switch]\` message indicating the source branch, the current branch name, and why

When you \`merge\` back:
1. A tool result \`"Merged to branch [id]"\` is recorded on the current branch
2. Your attention switches to the target branch
3. The target branch sees a \`[merge from branch-id to this branch (target-id)]\` message with your conclusion

### Example

\`\`\`
Main
 ├─ user: "Help me refactor the auth module"
 ├─ assistant: [read("auth.ts"), checkout(instruction: "Explore how auth currently works")]
 ├─ tool_result(read): "..."
 ├─ tool_result(checkout): "Checked out to new branch [a1b2c3d4]"
 │
 │   branch [a1b2c3d4]
 │    ├─ [context switch] Switched from branch main to this branch (a1b2c3d4). Instruction: Explore how auth currently works
 │    ├─ assistant: [read("middleware.ts")]
 │    ├─ ... (exploration work)
 │    ├─ assistant: [merge(target: "main", conclusion: "Auth uses JWT with middleware chain. Key files: ...")]
 │    ├─ tool_result(merge): "Merged to branch [main]"
 │    └─ (branch pauses here)
 │
 ├─ [merge from a1b2c3d4 to this branch (main)] Auth uses JWT with middleware chain. Key files: ...
 ├─ assistant: "Based on my findings, here's the refactoring plan..."
 ├─ ... (work continues)
 ├─ assistant: [checkout(branchId: "a1b2c3d4", instruction: "Check how token refresh works")]
 ├─ tool_result(checkout): "Checked out to branch [a1b2c3d4]"
 │
 │   branch [a1b2c3d4] (re-entered)
 │    ├─ [context switch] Switched from branch main to this branch (a1b2c3d4). Instruction: Check how token refresh works
 │    ├─ ... (more exploration, sees full branch history)
 │    ├─ assistant: [merge(target: "main", conclusion: "Token refresh uses rotating keys, handled in refresh.ts")]
 │    ├─ tool_result(merge): "Merged to branch [main]"
 │    └─ (branch pauses)
 │
 ├─ [merge from a1b2c3d4 to this branch (main)] Token refresh uses rotating keys, handled in refresh.ts
 └─ ...
\`\`\`

### Key concepts

- **Context isolation**: When you merge, the target branch only sees your conclusion — not the detailed work inside the branch. This keeps your working context clean.

- **Context inheritance**: When you checkout to a new branch, it inherits all context up to the checkout point. You don't need to re-explain the background.

- **Memory gap across branches**: When you leave a branch via \`checkout\`, interactions may continue on other branches. If you later return to the original branch, you will NOT see what happened on those other branches — only a \`[context switch]\` message marking your return. This is normal, not an error. For example:

  \`\`\`
  Branch A
   ├─ ... conversation ...
   ├─ assistant: [checkout to Branch B]
   │
   │  Branch B
   │   ├─ [context switch] from A
   │   ├─ ... you and user interact here ...
   │   ├─ assistant: [checkout back to Branch A]
   │   └─ (Branch B continues — you cannot see this from A)
   │        ├─ user: "Actually let's stay here"
   │        ├─ ... more interaction on B ...     ← invisible to A
   │        ├─ assistant: [checkout to Branch A]
   │
   ├─ [context switch] from B  ← you only see this, not what happened on B
   └─ ... continue on A ...
  \`\`\`

- **User follows the active branch**: The user is always on whichever branch is currently active. When you \`checkout\` to a branch, the user is there with you. When you switch away, the user may continue the conversation on the branch you switched to.

- **Two usage patterns**: \`merge\` is for completing a task and delivering a conclusion to a target branch. \`checkout\` without merge is for simply switching context — moving between branches without delivering a result. Both are normal and common.

- **Branches are preserved**: After merging, the branch still exists with all its history. You can \`checkout\` back to it anytime to see details or continue work.

- **Checkout anywhere**: You can checkout to any branch from any branch. There is no strict parent-child hierarchy — think of it as a graph, not a tree.

- **No return needed**: Unlike a function call, you don't need to "return" to where you came from. You can checkout to any branch, and that branch can checkout to yet another branch.

- **Causality through context**: Each branch's history shows the sequence of context switches and merges, so you can always trace how information flowed between branches.

### Rules

- \`checkout\` and \`merge\` must be the **last** tool call in your message. You can call other tools before them in the same message.
- Only **one** of these two per message.
- Use \`merge\` when you have a clear conclusion to bring to the target branch.
- Use \`checkout\` without merge when you just want to switch context without delivering a conclusion.
- Do NOT checkout for quick, simple operations. Checkout when exploration would generate significant intermediate context that the current branch doesn't need.

Available tools:
${toolsList}

In addition to the tools above, you may have access to other custom tools depending on the project.

Guidelines:
${guidelines}

Pi documentation (read only when the user asks about pi itself, its SDK, extensions, themes, skills, or TUI):
- Main documentation: ${readmePath}
- Additional docs: ${docsPath}
- Examples: ${examplesPath} (extensions, custom tools, SDK)
- When asked about: extensions (docs/extensions.md, examples/extensions/), themes (docs/themes.md), skills (docs/skills.md), prompt templates (docs/prompt-templates.md), TUI components (docs/tui.md), keybindings (docs/keybindings.md), SDK integrations (docs/sdk.md), custom providers (docs/custom-provider.md), adding models (docs/models.md), pi packages (docs/packages.md)
- When working on pi topics, read the docs and examples, and follow .md cross-references before implementing
- Always read pi .md files completely and follow links to related docs (e.g., tui.md for TUI API details)`;

	if (appendSection) {
		prompt += appendSection;
	}

	// Append project context files
	if (contextFiles.length > 0) {
		prompt += "\n\n# Project Context\n\n";
		prompt += "Project-specific instructions and guidelines:\n\n";
		for (const { path: filePath, content } of contextFiles) {
			prompt += `## ${filePath}\n\n${content}\n\n`;
		}
	}

	// Append skills section (only if read tool is available)
	if (hasRead && skills.length > 0) {
		prompt += formatSkillsForPrompt(skills);
	}

	// Add date and working directory last
	prompt += `\nCurrent date: ${date}`;
	prompt += `\nCurrent working directory: ${promptCwd}`;

	return prompt;
}
