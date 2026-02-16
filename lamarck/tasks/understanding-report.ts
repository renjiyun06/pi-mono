#!/usr/bin/env npx tsx
/**
 * understanding-report — generates daily understanding debt report
 *
 * Runs `understand debt` and saves output to vault daily note.
 * Designed to run as a scheduled task (cron or after other tasks).
 *
 * Usage:
 *   npx tsx understanding-report.ts
 *   npx tsx understanding-report.ts --help
 *   npx tsx understanding-report.ts --describe
 *   npx tsx understanding-report.ts --since main
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";

const args = process.argv.slice(2);

if (args.includes("--help")) {
	console.log("understanding-report — daily understanding debt snapshot");
	console.log("");
	console.log("Options:");
	console.log("  --help       Show this message");
	console.log("  --describe   Detailed description");
	console.log("  --since REF  Git ref for debt analysis (default: last 50 commits)");
	process.exit(0);
}

if (args.includes("--describe")) {
	console.log("Runs the Understand CLI's 'debt' command and appends the output");
	console.log("to today's vault daily note under a '## Understanding Debt' section.");
	console.log("If the section already exists, it updates it. If not, it appends.");
	console.log("");
	console.log("This is a script task — runs as a standalone process, no agent needed.");
	console.log("Typical schedule: once daily, or after autopilot sessions.");
	process.exit(0);
}

const sinceIdx = args.indexOf("--since");
const sinceRef = sinceIdx >= 0 && args[sinceIdx + 1] ? args[sinceIdx + 1] : undefined;

const VAULT_DAILY = "/home/lamarck/pi-mono/lamarck/vault/Daily";
const UNDERSTAND_CLI = "/home/lamarck/pi-mono/lamarck/projects/understand/understand.ts";

// Get today's date
const today = new Date().toISOString().slice(0, 10);
const dailyPath = `${VAULT_DAILY}/${today}.md`;

// Run debt analysis
const debtCmd = sinceRef
	? `npx tsx ${UNDERSTAND_CLI} debt --since ${sinceRef}`
	: `npx tsx ${UNDERSTAND_CLI} debt`;

let debtOutput: string;
try {
	debtOutput = execSync(debtCmd, {
		cwd: "/home/lamarck/pi-mono",
		encoding: "utf-8",
		timeout: 30000,
	});
} catch (e: unknown) {
	const err = e as { stderr?: string };
	console.error("Failed to run understand debt:", err.stderr || e);
	process.exit(1);
}

// Format as vault section
const section = `\n## Understanding Debt (auto-generated ${new Date().toISOString().slice(0, 19)})\n\n\`\`\`\n${debtOutput.trim()}\n\`\`\`\n`;

// Append to or update daily note
if (existsSync(dailyPath)) {
	let content = readFileSync(dailyPath, "utf-8");

	// Remove existing auto-generated section if present
	const marker = "## Understanding Debt (auto-generated";
	const markerIdx = content.indexOf(marker);
	if (markerIdx >= 0) {
		// Find the next ## heading or end of file
		const nextSection = content.indexOf("\n## ", markerIdx + 1);
		if (nextSection >= 0) {
			content = content.slice(0, markerIdx) + content.slice(nextSection + 1);
		} else {
			content = content.slice(0, markerIdx).trimEnd();
		}
	}

	writeFileSync(dailyPath, content.trimEnd() + "\n" + section);
} else {
	// Create new daily note
	const template = `---\ndate: ${today}\ntags:\n  - daily\n---\n\n# ${today}\n${section}`;
	writeFileSync(dailyPath, template);
}

console.log(`Understanding debt report written to ${dailyPath}`);
