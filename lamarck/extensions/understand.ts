/**
 * Understand Extension
 *
 * Tracks file modifications during a pi session and provides
 * comprehension quizzes on changes made by the agent.
 *
 * Commands:
 * - /understand       — Show modified files and quiz options
 * - /understand quiz  — Quiz on the most significant changes
 * - /understand files — List all files modified this session
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const UNDERSTAND_CLI = "/home/lamarck/pi-mono/lamarck/projects/understand/understand.ts";

export default function understandExtension(pi: ExtensionAPI) {
	// Track files modified during this session
	const modifiedFiles = new Map<string, number>(); // path → modification count

	// Listen for edit tool results
	pi.on("tool_result", async (event) => {
		if (event.toolName === "edit" && !event.isError) {
			const filePath = (event.input as any).path;
			if (filePath && typeof filePath === "string") {
				modifiedFiles.set(filePath, (modifiedFiles.get(filePath) || 0) + 1);
			}
		}

		if (event.toolName === "write" && !event.isError) {
			const filePath = (event.input as any).path;
			if (filePath && typeof filePath === "string") {
				modifiedFiles.set(filePath, (modifiedFiles.get(filePath) || 0) + 1);
			}
		}
	});

	// Reset on new session
	pi.on("session_start", () => {
		modifiedFiles.clear();
	});

	// Register /understand command
	pi.registerCommand("understand", {
		description: "Comprehension check on files modified this session",
		handler: async (args, ctx) => {
			const subcommand = args?.trim().toLowerCase() || "";

			if (subcommand === "files" || subcommand === "") {
				if (modifiedFiles.size === 0) {
					ctx.ui.notify("No files modified this session.", "info");
					return;
				}

				const sorted = [...modifiedFiles.entries()]
					.sort((a, b) => b[1] - a[1])
					.filter(([p]) => {
						// Skip non-code files
						return !p.endsWith(".md") && !p.endsWith(".json") && !p.endsWith(".txt");
					});

				if (sorted.length === 0) {
					ctx.ui.notify("No code files modified this session (only docs/config).", "info");
					return;
				}

				const lines = sorted.map(([p, count]) => {
					const rel = p.startsWith("/") ? path.relative("/home/lamarck/pi-mono", p) : p;
					return `  ${count}× ${rel}`;
				});

				ctx.ui.notify(
					`Modified code files (${sorted.length}):\n${lines.join("\n")}\n\nRun /understand quiz to test comprehension.`,
					"info"
				);
				return;
			}

			if (subcommand === "quiz") {
				const codeFiles = [...modifiedFiles.entries()]
					.filter(([p]) => !p.endsWith(".md") && !p.endsWith(".json") && !p.endsWith(".txt"))
					.sort((a, b) => b[1] - a[1]);

				if (codeFiles.length === 0) {
					ctx.ui.notify("No code files to quiz on.", "info");
					return;
				}

				// Pick the most-modified file
				const targetFile = codeFiles[0][0];
				const rel = path.relative("/home/lamarck/pi-mono", targetFile);

				ctx.ui.notify(`Starting comprehension quiz on: ${rel}`, "info");

				// Run the understand CLI in dry-run mode to get questions
				try {
					const output = execSync(
						`cd /home/lamarck/pi-mono && npx tsx ${UNDERSTAND_CLI} "${targetFile}" --dry-run 2>&1`,
						{ encoding: "utf-8", timeout: 30000 }
					);
					ctx.ui.notify(output.trim(), "info");
				} catch (err: any) {
					ctx.ui.notify(`Failed to generate questions: ${err.message}`, "error");
				}
				return;
			}

			if (subcommand === "summary") {
				try {
					const output = execSync(
						`cd /home/lamarck/pi-mono && npx tsx ${UNDERSTAND_CLI} summary 2>&1`,
						{ encoding: "utf-8", timeout: 10000 }
					);
					ctx.ui.notify(output.trim(), "info");
				} catch (err: any) {
					ctx.ui.notify(`Failed to load summary: ${err.message}`, "error");
				}
				return;
			}

			ctx.ui.notify(
				"Usage:\n  /understand       — List modified code files\n  /understand quiz   — Quiz on most-changed file\n  /understand summary — Show understanding scores",
				"info"
			);
		},
	});
}
