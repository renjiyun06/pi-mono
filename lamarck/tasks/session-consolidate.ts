#!/usr/bin/env npx tsx
/**
 * Session Consolidation (Sleep-Time Compute v0)
 *
 * Reads the most recent session file, extracts the last compaction summary,
 * and saves it to the vault as a session digest. This preserves consolidated
 * knowledge that would otherwise be lost when the session ends.
 *
 * Usage:
 *   npx tsx session-consolidate.ts                    # Process latest session
 *   npx tsx session-consolidate.ts --session <path>   # Process specific session
 *   npx tsx session-consolidate.ts --describe         # Show description
 *   npx tsx session-consolidate.ts --help             # Usage
 */

import { Command } from "commander";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, basename } from "path";

const SESSION_DIR = join(process.env.HOME || "/home/lamarck", ".pi/agent/sessions/--home-lamarck-pi-mono--");
const VAULT_DIR = join(process.env.HOME || "/home/lamarck", "pi-mono/lamarck/vault");
const DIGEST_DIR = join(VAULT_DIR, "Sessions");

interface CompactionEntry {
	type: "compaction";
	timestamp: string;
	summary: string;
	tokensBefore: number;
	details?: {
		readFiles?: string[];
		modifiedFiles?: string[];
	};
}

interface SessionHeader {
	type: "session";
	id: string;
	timestamp: string;
}

function findLatestSession(): string | null {
	if (!existsSync(SESSION_DIR)) return null;
	const files = readdirSync(SESSION_DIR)
		.filter((f) => f.endsWith(".jsonl"))
		.sort()
		.reverse();
	return files.length > 0 ? join(SESSION_DIR, files[0]) : null;
}

function parseSession(path: string): {
	id: string;
	startTime: string;
	compactions: CompactionEntry[];
	totalEntries: number;
	modifiedFiles: Set<string>;
	readFiles: Set<string>;
} {
	const lines = readFileSync(path, "utf-8").trim().split("\n");
	let id = "";
	let startTime = "";
	const compactions: CompactionEntry[] = [];
	const modifiedFiles = new Set<string>();
	const readFiles = new Set<string>();

	for (const line of lines) {
		try {
			const entry = JSON.parse(line);
			if (entry.type === "session") {
				id = entry.id;
				startTime = entry.timestamp;
			}
			if (entry.type === "compaction") {
				compactions.push(entry);
				// Collect file operations from compaction details
				if (entry.details?.readFiles) {
					for (const f of entry.details.readFiles) readFiles.add(f);
				}
				if (entry.details?.modifiedFiles) {
					for (const f of entry.details.modifiedFiles) modifiedFiles.add(f);
				}
			}
		} catch {
			// Skip malformed lines
		}
	}

	return { id, startTime, compactions, totalEntries: lines.length, modifiedFiles, readFiles };
}

function formatDigest(session: ReturnType<typeof parseSession>, sessionPath: string): string {
	const lastCompaction = session.compactions[session.compactions.length - 1];
	if (!lastCompaction) {
		return `---
tags:
  - session-digest
description: "Session ${session.id.slice(0, 8)} — no compactions (short session)"
---

# Session Digest: ${session.startTime.split("T")[0]}

Session ID: \`${session.id}\`
Started: ${session.startTime}
Entries: ${session.totalEntries}
Compactions: 0

*No compaction summaries available — session was too short.*
`;
	}

	const date = session.startTime.split("T")[0];
	const duration = new Date(lastCompaction.timestamp).getTime() - new Date(session.startTime).getTime();
	const hours = Math.floor(duration / 3600000);
	const minutes = Math.floor((duration % 3600000) / 60000);

	const modFiles = [...session.modifiedFiles].sort();
	const modFilesSection =
		modFiles.length > 0
			? `\n## Modified Files (${modFiles.length})\n\n${modFiles.map((f) => `- \`${f}\``).join("\n")}\n`
			: "";

	return `---
tags:
  - session-digest
description: "Session ${session.id.slice(0, 8)} — ${session.compactions.length} compactions, ${hours}h${minutes}m, ${session.modifiedFiles.size} files modified"
---

# Session Digest: ${date}

| Field | Value |
|-------|-------|
| Session ID | \`${session.id}\` |
| Started | ${session.startTime} |
| Duration | ~${hours}h ${minutes}m |
| Entries | ${session.totalEntries} |
| Compactions | ${session.compactions.length} |
| Files modified | ${session.modifiedFiles.size} |
| Files read | ${session.readFiles.size} |

## Last Compaction Summary

${lastCompaction.summary}
${modFilesSection}
## Compaction History

| # | Time | Tokens Before | Summary Size |
|---|------|---------------|-------------|
${session.compactions.map((c, i) => `| ${i + 1} | ${c.timestamp.split("T")[1].split(".")[0]} | ${c.tokensBefore.toLocaleString()} | ${c.summary.length.toLocaleString()} chars |`).join("\n")}
`;
}

const program = new Command();
program.name("session-consolidate").description("Extract and persist session knowledge to vault");

program
	.option("--session <path>", "Path to specific session file")
	.option("--describe", "Show detailed description")
	.action((opts) => {
		if (opts.describe) {
			console.log(`Session Consolidation (Sleep-Time Compute v0)

Reads pi session files (.jsonl), extracts the last compaction summary
(which contains the LLM's consolidated understanding of the entire session),
and saves it as a vault note under Sessions/.

This preserves knowledge that would otherwise be lost when the session ends.
The compaction summary is the highest-quality distillation of what happened
in a session — it's generated by the model with reasoning:high.

Run after each session to maintain a persistent record of session knowledge.`);
			process.exit(0);
		}

		const sessionPath = opts.session || findLatestSession();
		if (!sessionPath) {
			console.error("No session files found");
			process.exit(1);
		}
		if (!existsSync(sessionPath)) {
			console.error(`Session file not found: ${sessionPath}`);
			process.exit(1);
		}

		console.log(`Processing: ${basename(sessionPath)}`);
		const session = parseSession(sessionPath);
		console.log(
			`  ID: ${session.id.slice(0, 8)}, ${session.totalEntries} entries, ${session.compactions.length} compactions`,
		);

		if (session.compactions.length === 0) {
			console.log("  No compactions — session too short, skipping.");
			process.exit(0);
		}

		const digest = formatDigest(session, sessionPath);

		// Save to vault
		mkdirSync(DIGEST_DIR, { recursive: true });
		const date = session.startTime.split("T")[0];
		const shortId = session.id.slice(0, 8);
		const outputPath = join(DIGEST_DIR, `${date}-${shortId}.md`);

		writeFileSync(outputPath, digest);
		console.log(`  Saved: ${outputPath}`);
		console.log(
			`  Summary: ${session.compactions.length} compactions, ${session.modifiedFiles.size} files modified`,
		);
	});

program.parse();
