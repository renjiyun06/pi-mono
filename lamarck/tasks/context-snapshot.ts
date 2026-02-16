#!/usr/bin/env npx tsx
/**
 * context-snapshot — generates a pre-computed context summary for fast session restore
 *
 * Reads all priority:high vault notes, recent git log, and daily notes,
 * then writes a single markdown file that can be injected on session start.
 * This reduces context restore from 10+ tool calls to 1 file read.
 *
 * Usage:
 *   npx tsx context-snapshot.ts              Generate snapshot
 *   npx tsx context-snapshot.ts --describe   Show what this does
 *   npx tsx context-snapshot.ts --help       Show usage
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve, basename } from "path";

const VAULT = "/home/lamarck/pi-mono/lamarck/vault";
const REPO = "/home/lamarck/pi-mono";
const OUTPUT = resolve(VAULT, ".context-snapshot.md");

// Parse args
const args = process.argv.slice(2);
if (args.includes("--help")) {
	console.log(`context-snapshot — pre-compute session restore context

Usage:
  npx tsx context-snapshot.ts              Generate snapshot at ${OUTPUT}
  npx tsx context-snapshot.ts --describe   Show what this does
  npx tsx context-snapshot.ts --help       Show usage`);
	process.exit(0);
}

if (args.includes("--describe")) {
	console.log(
		"Reads priority:high vault notes, recent git log, and today's daily note. " +
			"Writes a single markdown file for fast session context restore.",
	);
	process.exit(0);
}

// 1. Find priority:high notes
function findPriorityHighNotes(): string[] {
	const dirs = ["Notes", "Meta"];
	const results: string[] = [];

	for (const dir of dirs) {
		const dirPath = resolve(VAULT, dir);
		if (!existsSync(dirPath)) continue;

		for (const file of readdirSync(dirPath)) {
			if (!file.endsWith(".md")) continue;
			const filePath = resolve(dirPath, file);
			const content = readFileSync(filePath, "utf-8");
			if (content.includes("priority: high")) {
				results.push(filePath);
			}
		}
	}

	return results;
}

// 2. Get recent git log
function getGitLog(count: number = 20): string {
	return execSync(`git -C "${REPO}" log --oneline -${count}`, { encoding: "utf-8" }).trim();
}

// 3. Get today's daily note
function getTodayNote(): string | null {
	const today = new Date().toISOString().slice(0, 10);
	const path = resolve(VAULT, "Daily", `${today}.md`);
	if (existsSync(path)) return readFileSync(path, "utf-8");
	return null;
}

// 4. Get open issues
function getOpenIssues(): string[] {
	const issuesDir = resolve(VAULT, "Issues");
	if (!existsSync(issuesDir)) return [];

	const results: string[] = [];
	for (const file of readdirSync(issuesDir)) {
		if (!file.endsWith(".md")) continue;
		const content = readFileSync(resolve(issuesDir, file), "utf-8");
		if (content.includes("status: open")) {
			// Extract description from frontmatter
			const descMatch = content.match(/description:\s*"?([^"\n]+)"?/);
			const desc = descMatch ? descMatch[1] : file.replace(".md", "");
			results.push(`- ${file.replace(".md", "")}: ${desc}`);
		}
	}
	return results;
}

// 5. Get current branch
function getCurrentBranch(): string {
	return execSync(`git -C "${REPO}" branch --show-current`, { encoding: "utf-8" }).trim();
}

// Generate snapshot
function generate() {
	const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
	const branch = getCurrentBranch();
	const gitLog = getGitLog(20);
	const todayNote = getTodayNote();
	const openIssues = getOpenIssues();
	const priorityNotes = findPriorityHighNotes();

	const sections: string[] = [];

	sections.push(`# Context Snapshot\n\nGenerated: ${timestamp}\nBranch: \`${branch}\`\n`);

	// Git log
	sections.push(`## Recent Commits\n\n\`\`\`\n${gitLog}\n\`\`\`\n`);

	// Open issues
	if (openIssues.length > 0) {
		sections.push(`## Open Issues\n\n${openIssues.join("\n")}\n`);
	}

	// Priority notes (just filenames — agent reads them separately if needed)
	if (priorityNotes.length > 0) {
		sections.push(
			`## Priority Notes\n\nThese files contain critical operational knowledge:\n${priorityNotes.map((p) => `- \`${p}\``).join("\n")}\n`,
		);
	}

	// Today's daily note (truncated to last 2000 chars to stay compact)
	if (todayNote) {
		const truncated = todayNote.length > 2000 ? "...\n" + todayNote.slice(-2000) : todayNote;
		sections.push(`## Today's Daily Note\n\n${truncated}\n`);
	}

	const output = sections.join("\n");
	writeFileSync(OUTPUT, output, "utf-8");
	console.log(`Snapshot written to ${OUTPUT} (${output.length} chars)`);
}

generate();
