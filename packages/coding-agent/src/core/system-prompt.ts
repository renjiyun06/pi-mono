/**
 * System prompt construction and project context loading
 */

import { getDocsPath, getExamplesPath, getReadmePath } from "../config.js";
import { formatSkillsForPrompt, type Skill } from "./skills.js";

/** Tool descriptions for system prompt */
const toolDescriptions: Record<string, string> = {
	read: "Read file contents",
	bash: "Execute bash commands (ls, grep, find, etc.)",
	edit: "Make surgical edits to files (find exact text and replace)",
	write: "Create or overwrite files",
	grep: "Search file contents for patterns (respects .gitignore)",
	find: "Find files by glob pattern (respects .gitignore)",
	ls: "List directory contents",
};

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

		// Add working directory last
		prompt += `\nCurrent working directory: ${resolvedCwd}`;

		return prompt;
	}

	// Get absolute paths to documentation and examples
	const readmePath = getReadmePath();
	const docsPath = getDocsPath();
	const examplesPath = getExamplesPath();

	// Build tools list based on selected tools.
	// Built-ins use toolDescriptions. Custom tools can provide one-line snippets.
	const tools = selectedTools || ["read", "bash", "edit", "write"];
	const toolsList =
		tools.length > 0
			? tools
					.map((name) => {
						const snippet = toolSnippets?.[name] ?? toolDescriptions[name] ?? name;
						return `- ${name}: ${snippet}`;
					})
					.join("\n")
			: "(none)";

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
	const hasEdit = tools.includes("edit");
	const hasWrite = tools.includes("write");
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

	// Read before edit guideline
	if (hasRead && hasEdit) {
		addGuideline("Use read to examine files before editing. You must use this tool instead of cat or sed.");
	}

	// Edit guideline
	if (hasEdit) {
		addGuideline("Use edit for precise changes (old text must match exactly)");
	}

	// Write guideline
	if (hasWrite) {
		addGuideline("Use write only for new files or complete rewrites");
	}

	// Output guideline (only when actually writing or executing)
	if (hasEdit || hasWrite) {
		addGuideline(
			"When summarizing your actions, output plain text directly - do NOT use cat or bash to display what you did",
		);
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

Available tools:
${toolsList}

In addition to the tools above, you may have access to other custom tools depending on the project.

Guidelines:
${guidelines}

Branch mechanism:
branch/return/branch-status let you manage your own attention. Like a person pausing their main work to focus on a specific concern, then coming back with just the takeaway. Inside a branch you have full access to all tools — read, write, edit, execute, anything the task requires. Branches can nest.

How it works:

  ... (calling context: previous work)
       │
  you call branch(title, task)
       │
       ├─ "Entered branch"                            ← you are now in the branch
       │    → you do the work (read, edit, test...)
       │    → you call return(result)
       │
       └─ You have returned from branch "title".      ← you are back in the calling context
          <branch-result>
          result
          </branch-result>
       │
  ... (calling context: continues with the result)

The branch tool produces two results for one call — one in the branch context ("Entered branch"), one in the calling context (the result you carried back). You only ever see one in your current context. The branch steps are not visible in the calling context — only the result. This is why branching saves context: instead of 15 tool calls polluting the calling context, it sees one result.

**IMPORTANT: When you see a branch tool call with a result already present in the calling context, this is expected behavior — not an error, not the system returning automatically, and not a sign that nothing was done. You did the work inside the branch; the intermediate steps simply do not appear in the calling context.**

Rules:
- One branch at a time — complete the current branch before starting another.
- Never call branch or return multiple times in one message.
- branch and return must each be the last tool call in their message — tool calls after them would belong to neither context.

Tips:
- The branch inherits the full conversation history, so the task parameter does not need to re-explain background. Just state the concern: "check if the API paginates correctly", "figure out why the test fails", "decide between migration strategies".
- Since branch steps are not visible in the calling context, the return result must contain all key information. If files were modified, list them with absolute paths. If a decision was made, state it clearly. The calling context has no other way to know what happened.

Best practices:
- Use branch when the intermediate steps are irrelevant to the calling context — only the outcome matters. Investigating a sub-question, verifying an assumption, fixing a specific bug, exploring options. The calling context needs the answer or the confirmation, not the journey.
- Do not branch when the task is simple and direct — a single tool call or a short sequence that won't clutter the context.
- Branch vs subagent: a branch is you shifting your own focus — you carry the full conversation history into the branch, so you understand all the context and nuance. A subagent is a separate agent that starts from zero — it only knows what you put in the task description. Branch when the task is entangled with the current conversation. Use a subagent when the task is self-contained and can be fully described in a few sentences.

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

	// Add working directory last
	prompt += `\nCurrent working directory: ${resolvedCwd}`;

	return prompt;
}
