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
import { join, resolve } from "path";

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
	const prompt = `You are a code comprehension expert. Given the following code, generate ${count} questions that test whether a developer truly understands THIS SPECIFIC code — not general software engineering principles.

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

Respond in JSON array format:
[
  {
    "question": "...",
    "key_concepts": ["...", "..."],
    "difficulty": "medium"
  }
]

Return ONLY the JSON array, no markdown fences.`;

	for (let attempt = 0; attempt < 3; attempt++) {
		const result = await callLLM([{ role: "user", content: prompt }]);
		try {
			const cleaned = result.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim();
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
			const cleaned = result.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim();
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
