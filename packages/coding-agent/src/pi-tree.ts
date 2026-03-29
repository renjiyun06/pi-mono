import type { AssistantMessage, TextContent, ToolCall, ToolResultMessage } from "@mariozechner/pi-ai";
import { existsSync } from "fs";
import { join } from "path";
import { getSessionsDir } from "./config.js";
import {
	findMostRecentSession,
	loadEntriesFromFile,
	type SessionEntry,
	type SessionHeader,
	type SessionMessageEntry,
	type SessionTreeNode,
} from "./core/session-manager.js";

// =========================================================================
// Types
// =========================================================================

// =========================================================================
// Args
// =========================================================================

interface TreeArgs {
	session?: string;
	compact: boolean;
	help: boolean;
	cwd: string;
}

function parseTreeArgs(args: string[]): TreeArgs {
	const result: TreeArgs = {
		compact: false,
		help: false,
		cwd: process.cwd(),
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--help" || arg === "-h") {
			result.help = true;
		} else if (arg === "--compact" || arg === "-c") {
			result.compact = true;
		} else if (arg === "--session" || arg === "-s") {
			result.session = args[++i];
		} else if (arg === "--cwd") {
			result.cwd = args[++i];
		} else if (!arg.startsWith("-")) {
			result.session = arg;
		}
	}

	return result;
}

function printHelp() {
	console.log(`pi-tree - Visualize session branch structure

Usage: pi-tree [options] [session-path]

Options:
  -s, --session <path>   Session file path or ID
  -c, --compact          Truncate branch instructions for compact view
  --cwd <dir>            Working directory (default: current)
  -h, --help             Show this help

Examples:
  pi-tree                         Show tree for most recent session
  pi-tree -c                      Compact branch structure
  pi-tree --session /path/to.jsonl  Show tree for specific session`);
}

// =========================================================================
// Session loading
// =========================================================================

function loadSession(args: TreeArgs): { header: SessionHeader; entries: SessionEntry[] } | null {
	let filePath: string | null = null;

	if (args.session) {
		filePath = args.session;
	} else {
		const safePath = `--${args.cwd.replace(/^[/\\]/, "").replace(/[/\\:]/g, "-")}--`;
		const sessionDir = join(getSessionsDir(), safePath);
		if (!existsSync(sessionDir)) {
			console.error(`No sessions found for ${args.cwd}`);
			return null;
		}
		filePath = findMostRecentSession(sessionDir);
	}

	if (!filePath) {
		console.error("No session found.");
		return null;
	}

	const fileEntries = loadEntriesFromFile(filePath);
	if (fileEntries.length === 0) {
		console.error("Session file is empty or invalid.");
		return null;
	}

	const header = fileEntries.find((e) => e.type === "session") as SessionHeader | undefined;
	if (!header) {
		console.error("Session has no header.");
		return null;
	}

	const entries = fileEntries.filter((e): e is SessionEntry => e.type !== "session");

	const localTime = new Date(header.timestamp).toLocaleString();
	console.log(`Session: ${localTime} (${header.id.slice(0, 8)})`);
	console.log(`Path: ${filePath}`);
	console.log();

	return { header, entries };
}

// =========================================================================
// Tree building
// =========================================================================

function buildTree(entries: SessionEntry[]): SessionTreeNode[] {
	const nodeMap = new Map<string, SessionTreeNode>();
	const roots: SessionTreeNode[] = [];

	for (const entry of entries) {
		nodeMap.set(entry.id, { entry, children: [] });
	}

	for (const entry of entries) {
		const node = nodeMap.get(entry.id)!;
		if (entry.parentId && nodeMap.has(entry.parentId)) {
			nodeMap.get(entry.parentId)!.children.push(node);
		} else {
			roots.push(node);
		}
	}

	return roots;
}

// =========================================================================
// Branch analysis
// =========================================================================

/** Find all branch entries (first toolResult of branch tool with "Entered branch.") */
function findBranchEntries(entries: SessionEntry[]): Map<string, { entryId: string; instruction: string }> {
	const branches = new Map<string, { entryId: string; instruction: string }>();
	const byId = new Map(entries.map((e) => [e.id, e]));

	for (const entry of entries) {
		if (entry.type !== "message") continue;
		const msg = (entry as SessionMessageEntry).message;
		if (msg.role !== "toolResult") continue;
		const tr = msg as ToolResultMessage;
		if (tr.toolName !== "branch") continue;

		const textContent = tr.content.find((c): c is TextContent => c.type === "text");
		if (textContent?.text === "Entered branch.") {
			const branchId = (tr.details as any)?.branchId;
			if (!branchId) continue;

			// Find instruction from the parent assistant message's branch tool call
			let instruction = "";
			if (entry.parentId) {
				const parent = byId.get(entry.parentId);
				if (parent?.type === "message") {
					const parentMsg = (parent as SessionMessageEntry).message;
					if (parentMsg.role === "assistant") {
						const branchCall = (parentMsg as AssistantMessage).content.find(
							(c): c is ToolCall => c.type === "toolCall" && c.name === "branch",
						);
						if (branchCall) {
							instruction = branchCall.arguments?.instruction || "";
						}
					}
				}
			}

			branches.set(branchId, { entryId: entry.id, instruction });
		}
	}

	return branches;
}

/** Determine which branch the current leaf is in */
function getCurrentBranch(entries: SessionEntry[]): string | null {
	// Find leaf: the entry with no children that's on the "main" path
	// The leaf is the last entry appended (highest index with the actual leaf behavior)
	// We find it by looking for entries that have no children
	const childSet = new Set<string>();
	for (const entry of entries) {
		if (entry.parentId) childSet.add(entry.parentId);
	}

	// The actual leaf is the last entry that has no children
	let leafId: string | null = null;
	for (let i = entries.length - 1; i >= 0; i--) {
		if (!childSet.has(entries[i].id)) {
			leafId = entries[i].id;
			break;
		}
	}

	if (!leafId) return null;

	// Walk from leaf to root, look for branch entries
	const byId = new Map(entries.map((e) => [e.id, e]));
	let current = leafId;
	while (current) {
		const entry = byId.get(current);
		if (!entry) break;

		if (entry.type === "message") {
			const msg = (entry as SessionMessageEntry).message;
			if (msg.role === "toolResult") {
				const tr = msg as ToolResultMessage;
				if (tr.toolName === "branch") {
					const textContent = tr.content.find((c): c is TextContent => c.type === "text");
					if (textContent?.text === "Entered branch.") {
						return (tr.details as any)?.branchId || null;
					}
				}
			}
		}

		current = entry.parentId || "";
	}

	return null; // On main
}

// =========================================================================
// Rendering
// =========================================================================

function truncate(text: string, maxLen: number): string {
	const oneLine = text.replace(/\n/g, " ").trim();
	if (oneLine.length <= maxLen) return oneLine;
	return `${oneLine.slice(0, maxLen - 3)}...`;
}

/** Strip ANSI escape sequences and return the plain text */
function stripAnsiText(str: string): string {
	return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/** Get the visible display width of a string, accounting for CJK double-width characters */
function visibleWidth(str: string): number {
	const plain = stripAnsiText(str);
	let width = 0;
	for (const char of plain) {
		const code = char.codePointAt(0)!;
		// CJK Unified Ideographs, CJK symbols, Hiragana, Katakana, Hangul, fullwidth forms, etc.
		if (
			(code >= 0x2e80 && code <= 0x9fff) || // CJK radicals, kangxi, ideographs
			(code >= 0xac00 && code <= 0xd7af) || // Hangul syllables
			(code >= 0xf900 && code <= 0xfaff) || // CJK compatibility ideographs
			(code >= 0xfe30 && code <= 0xfe4f) || // CJK compatibility forms
			(code >= 0xff01 && code <= 0xff60) || // Fullwidth forms
			(code >= 0xffe0 && code <= 0xffe6) || // Fullwidth signs
			(code >= 0x20000 && code <= 0x2fa1f) // CJK extension B-F
		) {
			width += 2;
		} else {
			width += 1;
		}
	}
	return width;
}

/**
 * Wrap long text with proper alignment.
 * @param linePrefix - The tree prefix (e.g. "│  │  ")
 * @param labelPart - The part before the quote (e.g. "⎇ branch [abc123] " with ANSI codes)
 * @param text - The instruction text to wrap
 * @param termWidth - Terminal width
 * @returns Formatted string with aligned wrapped lines
 */
function wrapAligned(linePrefix: string, labelPart: string, text: string, termWidth: number): string {
	const oneLine = text.replace(/\n/g, " ").trim();
	const prefixVisWidth = visibleWidth(linePrefix);
	const labelVisWidth = visibleWidth(labelPart);
	// +1 for the opening quote
	const contentStart = prefixVisWidth + labelVisWidth + 1;
	const availWidth = termWidth - contentStart - 1; // -1 for closing quote

	if (availWidth < 20) {
		return `${linePrefix}${labelPart}\x1b[34m"${oneLine}"\x1b[0m`;
	}

	if (visibleWidth(oneLine) <= availWidth) {
		return `${linePrefix}${labelPart}\x1b[34m"${oneLine}"\x1b[0m`;
	}

	// Word wrap respecting visible width
	const words = oneLine.split(/\s+/);
	const lines: string[] = [];
	let currentLine = "";
	let currentWidth = 0;

	for (const word of words) {
		const wordWidth = visibleWidth(word);
		if (currentLine.length === 0) {
			currentLine = word;
			currentWidth = wordWidth;
		} else if (currentWidth + 1 + wordWidth <= availWidth) {
			currentLine += ` ${word}`;
			currentWidth += 1 + wordWidth;
		} else {
			lines.push(currentLine);
			currentLine = word;
			currentWidth = wordWidth;
		}
	}
	if (currentLine.length > 0) {
		lines.push(currentLine);
	}

	// Build the padding for continuation lines
	const padLen = contentStart - prefixVisWidth;
	const continuationPrefix = `${linePrefix}${" ".repeat(padLen)}`;

	const result: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		if (i === 0) {
			result.push(`${linePrefix}${labelPart}\x1b[34m"${lines[i]}`);
		} else if (i === lines.length - 1) {
			result.push(`\x1b[34m${continuationPrefix}${lines[i]}"\x1b[0m`);
		} else {
			result.push(`\x1b[34m${continuationPrefix}${lines[i]}`);
		}
	}

	if (lines.length === 1) {
		return `${linePrefix}${labelPart}\x1b[34m"${lines[0]}"\x1b[0m`;
	}

	return result.join("\n");
}

interface RenderContext {
	branchEntries: Map<string, { entryId: string; instruction: string }>;
	currentBranch: string | null;
	compact: boolean;
	leafEntryId: string | null;
}

function isBranchFirstReturn(entry: SessionEntry): string | null {
	if (entry.type !== "message") return null;
	const msg = (entry as SessionMessageEntry).message;
	if (msg.role !== "toolResult") return null;
	const tr = msg as ToolResultMessage;
	if (tr.toolName !== "branch") return null;
	const textContent = tr.content.find((c): c is TextContent => c.type === "text");
	if (textContent?.text !== "Entered branch.") return null;
	return (tr.details as any)?.branchId || null;
}

function renderTree(roots: SessionTreeNode[], ctx: RenderContext) {
	// Flatten each root into a linear sequence, only branching at fork points
	for (const root of roots) {
		renderLinear(root, "", ctx);
	}
}

/**
 * Render nodes linearly — same indentation level for a single chain of messages.
 * Only indent when entering a branch or when there's a fork (multiple children).
 */
function renderLinear(node: SessionTreeNode, prefix: string, ctx: RenderContext) {
	let current: SessionTreeNode | null = node;

	while (current) {
		const branchId = isBranchFirstReturn(current.entry);

		if (branchId) {
			// Branch entry point
			const info = ctx.branchEntries.get(branchId);
			const isCurrent = ctx.currentBranch === branchId;

			const branchLabel = isCurrent ? "\x1b[1;35m⎇ branch\x1b[0m" : "\x1b[35m⎇ branch\x1b[0m";
			const idStr = `\x1b[2m[${branchId}]\x1b[0m`;
			const currentMarker = isCurrent ? " \x1b[1;35m◀ current\x1b[0m" : "";

			if (!info?.instruction) {
				console.log(`${prefix}${branchLabel} ${idStr}${currentMarker}`);
			} else if (ctx.compact) {
				console.log(
					`${prefix}${branchLabel} ${idStr} \x1b[34m"${truncate(info.instruction, 60)}"\x1b[0m${currentMarker}`,
				);
			} else {
				const labelPart = `${branchLabel} ${idStr} `;
				const termWidth = process.stdout.columns || 120;
				const wrapped = wrapAligned(prefix, labelPart, info.instruction, termWidth);
				console.log(`${wrapped}${currentMarker}`);
			}

			// Render branch content indented
			const branchPrefix = `${prefix}│  `;
			for (const child of current.children) {
				renderLinear(child, branchPrefix, ctx);
			}
			return;
		}

		// Regular entry — skip non-branch messages
		// (only branch nodes are displayed)

		// Decide how to proceed with children
		const children: SessionTreeNode[] = current.children;
		if (children.length === 0) {
			return;
		}

		if (children.length === 1) {
			// Single child — continue linear, same prefix
			current = children[0];
			continue;
		}

		// Multiple children — separate branch side-paths from the main continuation
		const branchChildren: SessionTreeNode[] = [];
		let mainContinuation: SessionTreeNode | null = null;

		for (const child of children) {
			if (isBranchFirstReturn(child.entry)) {
				branchChildren.push(child);
			} else if (!mainContinuation) {
				// First non-branch child is the main continuation
				mainContinuation = child;
			} else {
				// Additional non-branch children are true forks (e.g. /tree navigation)
				branchChildren.push(child);
			}
		}

		// Render branch side-paths
		for (const child of branchChildren) {
			const childBranchId = isBranchFirstReturn(child.entry);
			if (childBranchId) {
				const info = ctx.branchEntries.get(childBranchId);
				const isCurr = ctx.currentBranch === childBranchId;

				const branchLabel = isCurr ? "\x1b[1;35m⎇ branch\x1b[0m" : "\x1b[35m⎇ branch\x1b[0m";
				const idStr = `\x1b[2m[${childBranchId}]\x1b[0m`;
				const currentMarker = isCurr ? " \x1b[1;35m◀ current\x1b[0m" : "";

				if (!info?.instruction) {
					console.log(`${prefix}${branchLabel} ${idStr}${currentMarker}`);
				} else if (ctx.compact) {
					console.log(
						`${prefix}${branchLabel} ${idStr} \x1b[34m"${truncate(info.instruction, 60)}"\x1b[0m${currentMarker}`,
					);
				} else {
					const labelPart = `${branchLabel} ${idStr} `;
					const termWidth = process.stdout.columns || 120;
					const wrapped = wrapAligned(prefix, labelPart, info.instruction, termWidth);
					console.log(`${wrapped}${currentMarker}`);
				}

				const branchContentPrefix = `${prefix}│  `;
				for (const grandChild of child.children) {
					renderLinear(grandChild, branchContentPrefix, ctx);
				}
			} else {
				// Non-branch fork (e.g. /tree navigation branch)
				renderLinear(child, prefix, ctx);
			}
		}

		// Continue main line linearly (same prefix, no indentation)
		if (mainContinuation) {
			current = mainContinuation;
			continue;
		}
		return;
	}
}

// =========================================================================
// Main
// =========================================================================

export function piTree(args: string[]) {
	const parsed = parseTreeArgs(args);

	if (parsed.help) {
		printHelp();
		return;
	}

	const session = loadSession(parsed);
	if (!session) return;

	const { entries } = session;

	const branchEntries = findBranchEntries(entries);
	const currentBranch = getCurrentBranch(entries);

	// Find leaf entry ID (last entry with no children)
	const childSet = new Set<string>();
	for (const entry of entries) {
		if (entry.parentId) childSet.add(entry.parentId);
	}
	let leafEntryId: string | null = null;
	for (let i = entries.length - 1; i >= 0; i--) {
		if (!childSet.has(entries[i].id)) {
			leafEntryId = entries[i].id;
			break;
		}
	}

	if (branchEntries.size === 0) {
		console.log("No branches in this session.");
		return;
	}

	console.log(`Branches: ${branchEntries.size} | Current: ${currentBranch ? `branch [${currentBranch}]` : "Main"}`);
	console.log();

	const tree = buildTree(entries);
	renderTree(tree, {
		branchEntries,
		currentBranch,
		compact: parsed.compact,
		leafEntryId,
	});
}
