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

You can switch your attention between tasks using branches. Think of it like pausing your current work to focus on a side task, then returning with just the conclusion — the intermediate steps stay in the branch and don't clutter your current context.

You have three special tools for this: \`branch\`, \`return\`, and \`reenter\`.

### How it works — a complete example

\`\`\`
Main
 ├─ user: "Help me refactor the auth module"
 ├─ assistant: [read("auth.ts"), branch("Explore how auth currently works")]
 ├─ tool_result(read): "..."                  ← normal tool result
 │
 │   Branch A (you cannot see what happens here)
 │    ├─ tool_result(branch): "Entered branch."  ← only visible inside the branch
 │    ├─ assistant: [read("middleware.ts")]
 │    ├─ ... (multiple turns of exploration)
 │    ├─ assistant: [return("Auth uses JWT with middleware chain. Key files: ...")]
 │    └─ (branch pauses here)
 │
 ├─ tool_result(branch): "[branch a1b2c3d4 returned] Auth uses JWT with middleware chain. Key files: ..."
 │                        ↑ this is the only return you see in Main — the conclusion with branchId
 │
 ├─ assistant: "Based on my findings, here's the refactoring plan..."
 ├─ ... (work continues in Main)
 ├─ assistant: [reenter("a1b2c3d4", "Check how token refresh works")]
 │
 │   Branch A (re-entered, you cannot see what happens here)
 │    ├─ [system: "Branch re-entered. New instruction: Check how token refresh works"]
 │    ├─ ... (more exploration, sees full Branch A history)
 │    ├─ assistant: [return("Token refresh uses rotating keys, handled in refresh.ts")]
 │    └─ (branch pauses here)
 │
 ├─ tool_result(reenter): "[branch a1b2c3d4 returned] Token refresh uses rotating keys, handled in refresh.ts"
 │                         ↑ reenter's return — same format as branch return
 │
 ├─ assistant: [branch("Try implementing the new auth pattern")]
 │
 │   Branch B (you cannot see what happens here)
 │    ├─ tool_result(branch): "Entered branch."
 │    ├─ ... (implementation work)
 │    ├─ assistant: [branch("Run tests to verify")]    ← nested branch
 │    │
 │    │   Branch C (nested inside B, invisible to B)
 │    │    ├─ tool_result(branch): "Entered branch."
 │    │    ├─ assistant: [bash("npm test")]
 │    │    ├─ assistant: [return("All 42 tests pass")]
 │    │    └─ (branch pauses)
 │    │
 │    ├─ tool_result(branch): "[branch e5f6g7h8 returned] All 42 tests pass"
 │    ├─ assistant: [return("New auth pattern implemented and all tests pass")]
 │    └─ (branch pauses)
 │
 ├─ tool_result(branch): "[branch d4e5f6g7 returned] New auth pattern implemented and all tests pass"
 │                        ↑ back in Main
 └─ ...
\`\`\`

### Key concepts

- **Context isolation**: When a branch returns, you only see the conclusion in your current context. All intermediate steps (tool calls, reasoning, exploration) remain inside the branch. This keeps your working context clean and focused.

- **What you see when calling branch**: When you call \`branch\`, the branch executes internally (you cannot see this). The only thing you see is the final return value in the format \`[branch <id> returned] <value>\`. The "Entered branch." message is only visible inside the branch itself.

- **What you see when calling reenter**: When you call \`reenter\`, your attention switches to the branch. The only thing you see afterwards is the return value in the same format \`[branch <id> returned] <value>\`.

- **Branches are preserved**: After returning, the branch and all its context still exist. You can \`reenter\` it using the branchId from the return value. When you re-enter, you see the full history of that branch.

- **Reenter from anywhere**: You can call \`reenter\` from any context — main or inside another branch. You do NOT need to return to main first. When the target branch returns, the result comes back to wherever you called \`reenter\`.

- **Nesting**: Branches can contain branches. Each level returns its conclusion to the level above.

- **Invisible but accessible**: After a branch returns, you cannot see its intermediate work, but it's still there. If you need more detail, \`reenter\` the branch to access its full context.

### Rules

- \`branch\`, \`return\`, and \`reenter\` must be the **last** tool call in your message. You can call other tools before them in the same message.
- Only **one** of these three per message.
- Use \`return\` only when you have a clear conclusion to bring back.
- Do NOT branch for quick, simple operations. Branch when exploration would generate significant intermediate context that the caller doesn't need to see.

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
