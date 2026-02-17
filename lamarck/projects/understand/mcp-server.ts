#!/usr/bin/env npx tsx
/**
 * Understand MCP Server
 *
 * Exposes code comprehension tools via the Model Context Protocol.
 * Any MCP-compatible client (VS Code, Cursor, pi, etc.) can use these tools
 * to quiz developers on code understanding.
 *
 * Tools:
 *   understand_quiz    — Generate comprehension questions for a code snippet
 *   understand_evaluate — Evaluate a developer's answer to a comprehension question
 *   understand_score   — Get comprehension scores for tracked files
 *
 * Usage:
 *   npx tsx mcp-server.ts                     # Start stdio MCP server
 *   mcporter call understand_quiz ...         # Call via mcporter
 *
 * Configuration:
 *   OPENROUTER_API_KEY — Required for LLM-based question generation and evaluation
 *   UNDERSTAND_MODEL   — Model to use (default: google/gemini-2.0-flash-001)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { join, resolve, relative } from "path";

// ============================================================================
// Environment
// ============================================================================

function loadEnvFile(): void {
	const candidates: string[] = [resolve(process.cwd(), ".env")];
	try {
		const gitRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
		candidates.push(resolve(gitRoot, ".env"));
	} catch { /* not in a git repo */ }
	const home = process.env.HOME || process.env.USERPROFILE;
	if (home) candidates.push(resolve(home, ".env"));

	for (const envPath of candidates) {
		if (existsSync(envPath)) {
			const envContent = readFileSync(envPath, "utf-8");
			for (const line of envContent.split("\n")) {
				const match = line.match(/^([^#=]+)=(.*)$/);
				if (match) {
					const key = match[1].trim();
					if (!process.env[key]) process.env[key] = match[2].trim();
				}
			}
			break;
		}
	}
}
loadEnvFile();

// ============================================================================
// LLM Integration
// ============================================================================

const API_KEY = process.env.OPENROUTER_API_KEY || "";
const MODEL = process.env.UNDERSTAND_MODEL || "google/gemini-2.0-flash-001";

interface LLMMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

async function callLLM(messages: LLMMessage[]): Promise<string> {
	if (!API_KEY) {
		throw new Error("OPENROUTER_API_KEY not set. Required for question generation and evaluation.");
	}

	const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${API_KEY}`,
		},
		body: JSON.stringify({
			model: MODEL,
			messages,
			temperature: 0.3,
			max_tokens: 2000,
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`LLM API error ${response.status}: ${text}`);
	}

	const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
	return data.choices[0]?.message?.content || "";
}

// ============================================================================
// Score Persistence
// ============================================================================

const HISTORY_DIR = ".understand";
const HISTORY_FILE = "history.json";

interface ScoreEntry {
	file: string;
	score: number;
	timestamp: string;
	questions: number;
}

function getHistoryPath(cwd: string): string {
	return join(cwd, HISTORY_DIR, HISTORY_FILE);
}

function loadHistory(cwd: string): ScoreEntry[] {
	const path = getHistoryPath(cwd);
	if (!existsSync(path)) return [];
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch {
		return [];
	}
}

function saveScore(cwd: string, entry: ScoreEntry): void {
	const dir = join(cwd, HISTORY_DIR);
	mkdirSync(dir, { recursive: true });
	const history = loadHistory(cwd);
	history.push(entry);
	writeFileSync(getHistoryPath(cwd), JSON.stringify(history, null, 2));
}

// ============================================================================
// Question Generation
// ============================================================================

interface Question {
	question: string;
	key_concepts: string[];
	difficulty: "easy" | "medium" | "hard";
}

async function generateQuestions(code: string, filename: string, count: number = 3): Promise<Question[]> {
	const systemPrompt = `You are a code comprehension quiz generator. You MUST respond with ONLY a JSON array. No explanations, no markdown, no text before or after the JSON. Your entire response must be parseable by JSON.parse().

Output format (respond with ONLY this, nothing else):
[{"question": "...", "key_concepts": ["..."], "difficulty": "medium"}]`;

	const userPrompt = `Generate ${count} questions that test whether a developer truly understands THIS SPECIFIC code — not general software engineering principles.

CRITICAL: Questions must be answerable ONLY by someone who understands this particular file.

Good questions test:
- Library/framework-specific behavior used in this code (e.g., "What does X do here and why was it chosen over Y?")
- Runtime behavior: "What happens if input Z is provided?" or "What state exists after line N executes?"
- Failure modes specific to this code's dependencies and data flow
- Why a specific approach was chosen over alternatives IN THIS CONTEXT

Bad questions (avoid these):
- Generic refactoring suggestions ("How would you make this more maintainable?")
- General design pattern identification ("What pattern is this?")
- Questions answerable by anyone who knows the programming language but hasn't read this file

File: ${filename}

\`\`\`
${code.slice(0, 8000)}
\`\`\`

For each question, provide:
- The question (1-2 sentences, specific to THIS code)
- Key concepts a good answer should mention (3-5 items, referencing specific functions/variables/behaviors in the code)
- Difficulty (easy/medium/hard)

Respond with ONLY the JSON array. No other text.`;

	for (let attempt = 0; attempt < 3; attempt++) {
		const result = await callLLM([
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		]);
		try {
			// Strip markdown fences and any text before/after the JSON array
			let cleaned = result.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim();
			// If the model produced text before the JSON, find the first [ and last ]
			const firstBracket = cleaned.indexOf("[");
			const lastBracket = cleaned.lastIndexOf("]");
			if (firstBracket !== -1 && lastBracket > firstBracket) {
				cleaned = cleaned.slice(firstBracket, lastBracket + 1);
			}
			return JSON.parse(cleaned);
		} catch {
			if (attempt === 2) throw new Error(`Failed to parse questions after 3 attempts. Last response: ${result.slice(0, 200)}`);
		}
	}
	return [];
}

// ============================================================================
// Answer Evaluation
// ============================================================================

interface Evaluation {
	score: number;
	feedback: string;
	missed: string[];
}

async function evaluateAnswer(
	question: string,
	keyConcepts: string[],
	answer: string,
	code: string,
): Promise<Evaluation> {
	const prompt = `You are evaluating a developer's understanding of code.

Question: ${question}
Key concepts a correct answer should mention: ${keyConcepts.join(", ")}

Developer's answer: "${answer}"

Code context (first 4000 chars):
\`\`\`
${code.slice(0, 4000)}
\`\`\`

Score 0-10:
- 0-3: Doesn't understand
- 4-6: Partial understanding
- 7-8: Good understanding
- 9-10: Deep understanding

Respond in JSON:
{"score": <number>, "feedback": "<1-2 sentences>", "missed": ["<missed concepts>"]}

Return ONLY JSON.`;

	for (let attempt = 0; attempt < 3; attempt++) {
		const result = await callLLM([{ role: "user", content: prompt }]);
		try {
			let cleaned = result.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim();
			// Extract JSON object if model produced surrounding text
			const firstBrace = cleaned.indexOf("{");
			const lastBrace = cleaned.lastIndexOf("}");
			if (firstBrace !== -1 && lastBrace > firstBrace) {
				cleaned = cleaned.slice(firstBrace, lastBrace + 1);
			}
			return JSON.parse(cleaned);
		} catch {
			if (attempt === 2) throw new Error(`Failed to parse evaluation after 3 attempts`);
		}
	}
	return { score: 0, feedback: "Evaluation failed", missed: keyConcepts };
}

// ============================================================================
// MCP Server
// ============================================================================

const server = new McpServer(
	{
		name: "understand",
		version: "0.1.0",
	},
	{
		capabilities: {
			tools: {},
		},
		instructions:
			"Understand is an anti-cognitive-debt tool. Use understand_quiz to generate comprehension " +
			"questions for code, understand_evaluate to check answers, and understand_score to track " +
			"comprehension across files.",
	},
);

// Tool: Generate quiz questions
server.registerTool(
	"understand_quiz",
	{
		title: "Generate Comprehension Quiz",
		description:
			"Generate comprehension questions for a code file. Tests design decisions, failure modes, " +
			"and architectural understanding — not just syntax. Requires OPENROUTER_API_KEY.",
		inputSchema: {
			code: z.string().describe("The code to generate questions for"),
			filename: z.string().describe("Filename for context (e.g., 'rate-limiter.ts')"),
			count: z.number().optional().default(3).describe("Number of questions (default: 3)"),
		},
		annotations: {
			readOnlyHint: true,
		},
	},
	async ({ code, filename, count }) => {
		try {
			// Check minimum complexity — trivial files don't have meaningful questions
			const lines = code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("*")).length;
			if (lines < 5) {
				return {
					content: [
						{
							type: "text" as const,
							text: `File too simple (${lines} non-comment lines). Understand works best on files with 10+ lines of logic. Try a more complex file.`,
						},
					],
				};
			}

			const questions = await generateQuestions(code, filename, count || 3);
			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(questions, null, 2),
					},
				],
			};
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error);
			return {
				content: [{ type: "text" as const, text: `Error: ${msg}` }],
				isError: true,
			};
		}
	},
);

// Tool: Evaluate an answer
server.registerTool(
	"understand_evaluate",
	{
		title: "Evaluate Comprehension Answer",
		description:
			"Evaluate a developer's answer to a comprehension question. Returns score (0-10), " +
			"feedback, and missed concepts. Requires OPENROUTER_API_KEY.",
		inputSchema: {
			question: z.string().describe("The comprehension question"),
			key_concepts: z.array(z.string()).describe("Key concepts the answer should cover"),
			answer: z.string().describe("The developer's answer"),
			code: z.string().describe("The relevant code"),
			filename: z.string().optional().describe("Filename for score tracking"),
		},
	},
	async ({ question, key_concepts, answer, code, filename }) => {
		try {
			const evaluation = await evaluateAnswer(question, key_concepts, answer, code);

			// Save score if filename provided
			if (filename) {
				const cwd = process.cwd();
				saveScore(cwd, {
					file: filename,
					score: evaluation.score,
					timestamp: new Date().toISOString(),
					questions: 1,
				});
			}

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(evaluation, null, 2),
					},
				],
			};
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error);
			return {
				content: [{ type: "text" as const, text: `Error: ${msg}` }],
				isError: true,
			};
		}
	},
);

// Tool: Get comprehension scores
server.registerTool(
	"understand_score",
	{
		title: "Get Comprehension Scores",
		description:
			"Get comprehension score history for tracked files. Shows per-file scores, " +
			"trends, and files below a configurable threshold.",
		inputSchema: {
			directory: z.string().optional().describe("Project directory to check (default: current directory)"),
			threshold: z.number().optional().default(6).describe("Score threshold for 'at risk' files (default: 6)"),
		},
		annotations: {
			readOnlyHint: true,
		},
	},
	async ({ directory, threshold }) => {
		const cwd = directory || process.cwd();
		const history = loadHistory(cwd);
		const t = threshold || 6;

		if (history.length === 0) {
			return {
				content: [
					{
						type: "text" as const,
						text: "No comprehension scores recorded yet. Use understand_quiz and understand_evaluate to start tracking.",
					},
				],
			};
		}

		// Aggregate by file (latest score)
		const byFile = new Map<string, ScoreEntry>();
		for (const entry of history) {
			byFile.set(entry.file, entry);
		}

		const files = Array.from(byFile.entries()).map(([file, entry]) => ({
			file,
			score: entry.score,
			timestamp: entry.timestamp,
			atRisk: entry.score < t,
		}));

		files.sort((a, b) => a.score - b.score);

		const atRisk = files.filter((f) => f.atRisk);
		const avg = files.reduce((sum, f) => sum + f.score, 0) / files.length;

		const summary = {
			totalFiles: files.length,
			averageScore: Math.round(avg * 10) / 10,
			atRiskCount: atRisk.length,
			threshold: t,
			files,
		};

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(summary, null, 2),
				},
			],
		};
	},
);

// Tool: Quiz on git diff
server.registerTool(
	"understand_git_diff",
	{
		title: "Quiz on Git Changes",
		description:
			"Generate comprehension questions for recent git changes. Uses staged changes (git diff --cached) " +
			"or falls back to the last commit (git diff HEAD~1). Ideal for verifying understanding after " +
			"accepting AI-generated code changes.",
		inputSchema: {
			directory: z.string().optional().describe("Git repository directory (default: current directory)"),
			count: z.number().optional().default(3).describe("Number of questions (default: 3)"),
		},
		annotations: {
			readOnlyHint: true,
		},
	},
	async ({ directory, count }) => {
		const cwd = directory || process.cwd();
		try {
			let diff = "";
			try {
				diff = execSync("git diff --cached", { cwd, encoding: "utf-8" });
			} catch { /* ignore */ }
			if (!diff.trim()) {
				try {
					diff = execSync("git diff HEAD~1", { cwd, encoding: "utf-8" });
				} catch { /* ignore */ }
			}
			if (!diff.trim()) {
				return {
					content: [{ type: "text" as const, text: "No git changes found (staged or last commit)." }],
				};
			}
			const questions = await generateQuestions(diff, "git diff", count || 3);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(questions, null, 2) }],
			};
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error);
			return {
				content: [{ type: "text" as const, text: `Error: ${msg}` }],
				isError: true,
			};
		}
	},
);

// Tool: Understanding debt analysis
server.registerTool(
	"understand_debt",
	{
		title: "Understanding Debt Dashboard",
		description:
			"Analyze which code files have been changed but never quizzed on. Shows files sorted by " +
			"change volume, highlighting unreviewed cognitive debt. Optionally specify a git ref to " +
			"analyze changes since a branch point or tag.",
		inputSchema: {
			directory: z.string().optional().describe("Git repository directory (default: current directory)"),
			since: z.string().optional().describe("Git ref to analyze changes since (branch, tag, commit). Default: last 50 commits."),
			limit: z.number().optional().default(20).describe("Max files to return (default: 20)"),
		},
		annotations: {
			readOnlyHint: true,
		},
	},
	async ({ directory, since, limit }) => {
		const cwd = directory || process.cwd();
		const maxFiles = limit || 20;

		try {
			let gitRoot: string;
			try {
				gitRoot = execSync("git rev-parse --show-toplevel", { cwd, encoding: "utf-8" }).trim();
			} catch {
				return {
					content: [{ type: "text" as const, text: "Not in a git repository." }],
					isError: true,
				};
			}

			const logCmd = since
				? `git log --numstat --pretty=format:"%H|%ai" ${since}..HEAD`
				: `git log --numstat --pretty=format:"%H|%ai" -50`;

			let logOutput: string;
			try {
				logOutput = execSync(logCmd, { cwd: gitRoot, encoding: "utf-8" });
			} catch {
				return {
					content: [{ type: "text" as const, text: `Failed to read git log${since ? ` since ${since}` : ""}.` }],
					isError: true,
				};
			}

			// Parse git log
			const fileStats = new Map<string, { added: number; removed: number; commits: number; lastDate: string }>();
			let currentDate = "";

			for (const line of logOutput.split("\n")) {
				if (line.includes("|")) {
					const parts = line.split("|");
					if (parts.length >= 2) currentDate = parts[1].trim().slice(0, 10);
					continue;
				}
				const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
				if (!match) continue;
				const added = match[1] === "-" ? 0 : parseInt(match[1]);
				const removed = match[2] === "-" ? 0 : parseInt(match[2]);
				const file = match[3];
				if (/\.(md|json|txt|jpg|png|mp4|mp3|csv|lock)$/i.test(file)) continue;
				if (file.includes("node_modules/")) continue;

				const existing = fileStats.get(file) || { added: 0, removed: 0, commits: 0, lastDate: "" };
				existing.added += added;
				existing.removed += removed;
				existing.commits += 1;
				if (!existing.lastDate || currentDate > existing.lastDate) existing.lastDate = currentDate;
				fileStats.set(file, existing);
			}

			if (fileStats.size === 0) {
				return {
					content: [{ type: "text" as const, text: "No code file changes found." }],
				};
			}

			// Load quiz history
			const history = loadHistory(gitRoot);
			const latestQuiz = new Map<string, ScoreEntry>();
			for (const entry of history) {
				latestQuiz.set(entry.file, entry);
			}

			// Build debt list
			interface DebtEntry {
				file: string;
				totalChanges: number;
				commits: number;
				lastChanged: string;
				lastQuizzed: string | null;
				quizScore: number | null;
			}

			const debts: DebtEntry[] = [];
			for (const [file, stats] of fileStats) {
				const quiz = latestQuiz.get(file);
				debts.push({
					file,
					totalChanges: stats.added + stats.removed,
					commits: stats.commits,
					lastChanged: stats.lastDate,
					lastQuizzed: quiz?.timestamp?.slice(0, 10) || null,
					quizScore: quiz?.score ?? null,
				});
			}

			debts.sort((a, b) => {
				const aUnquizzed = a.lastQuizzed === null ? 1 : 0;
				const bUnquizzed = b.lastQuizzed === null ? 1 : 0;
				if (aUnquizzed !== bUnquizzed) return bUnquizzed - aUnquizzed;
				return b.totalChanges - a.totalChanges;
			});

			const top = debts.slice(0, maxFiles);
			const unquizzed = debts.filter(d => d.lastQuizzed === null).length;
			const totalChanges = debts.reduce((sum, d) => sum + d.totalChanges, 0);

			return {
				content: [{
					type: "text" as const,
					text: JSON.stringify({
						totalFiles: debts.length,
						unquizzedFiles: unquizzed,
						totalLineChanges: totalChanges,
						suggestion: debts.find(d => d.lastQuizzed === null && d.totalChanges > 50)?.file || null,
						files: top,
					}, null, 2),
				}],
			};
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error);
			return {
				content: [{ type: "text" as const, text: `Error: ${msg}` }],
				isError: true,
			};
		}
	},
);

// Start the server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	// Server is now listening on stdio
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
