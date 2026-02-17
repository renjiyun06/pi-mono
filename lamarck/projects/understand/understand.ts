#!/usr/bin/env npx tsx
/**
 * understand — anti-cognitive-debt code comprehension tool
 *
 * Reads a code file, generates understanding questions via LLM,
 * quizzes the developer, and scores their comprehension.
 * Tracks scores over time in .understand/history.json.
 *
 * Usage:
 *   npx tsx understand.ts <file>                   Quiz on a code file
 *   npx tsx understand.ts --git-diff               Quiz on staged git changes
 *   npx tsx understand.ts <file> --dry-run         Show questions only (no quiz)
 *   npx tsx understand.ts summary                  Show understanding scores
 *   npx tsx understand.ts summary --below <N>      Show files scoring below N%
 *   npx tsx understand.ts debt                     Show files with understanding debt (unreviewed AI changes)
 *   npx tsx understand.ts debt --since <ref>       Show debt since git ref (branch, tag, commit)
 *
 * Requires OPENROUTER_API_KEY in environment or ../.env
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { createInterface } from "readline";
import { resolve, basename, relative } from "path";

// Load .env from current directory, git root, or home directory
function loadEnvFile(): void {
	const candidates: string[] = [
		resolve(process.cwd(), ".env"),
	];
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
					// Don't override existing env vars
					if (!process.env[key]) {
						process.env[key] = match[2].trim();
					}
				}
			}
			break; // use first .env found
		}
	}
}
loadEnvFile();

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
	console.error("Error: OPENROUTER_API_KEY not set.");
	console.error("Set it in your environment, or create a .env file in your project root.");
	process.exit(1);
}
const MODEL = process.env.UNDERSTAND_MODEL || "anthropic/claude-sonnet-4";

// --- LLM Call ---

interface Message {
	role: "system" | "user" | "assistant";
	content: string;
}

async function llm(messages: Message[]): Promise<string> {
	const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: MODEL,
			messages,
			temperature: 0.3,
			max_tokens: 2000,
		}),
	});
	const data = await res.json();
	if (!data.choices?.[0]?.message?.content) {
		console.error("LLM error:", JSON.stringify(data, null, 2));
		process.exit(1);
	}
	return data.choices[0].message.content;
}

// --- Question Generation ---

interface Question {
	question: string;
	hint: string;
	key_concepts: string[];
}

async function generateQuestions(code: string, filename: string): Promise<Question[]> {
	const systemPrompt = `You are a code comprehension quiz generator. You MUST respond with ONLY a JSON array. No explanations, no markdown, no text before or after the JSON. Your entire response must be parseable by JSON.parse().

Output format (respond with ONLY this, nothing else):
[{"question": "...", "hint": "...", "key_concepts": ["..."]}]`;

	const userPrompt = `Generate exactly 3 questions that test whether a developer truly understands THIS SPECIFIC code — not general software engineering principles.

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

Each question should be answerable in 1-3 sentences.
Include a hint that points the developer in the right direction without giving the answer.
Include key concepts (referencing specific functions/variables/behaviors in the code).

File: ${filename}

\`\`\`
${code.slice(0, 8000)}
\`\`\`

Respond with ONLY the JSON array. No other text.`;

	for (let attempt = 0; attempt < 3; attempt++) {
		const response = await llm([
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		]);
		try {
			// Strip markdown code fences if present
			let cleaned = response.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim();
			// Extract JSON array if model produced surrounding text
			const firstBracket = cleaned.indexOf("[");
			const lastBracket = cleaned.lastIndexOf("]");
			if (firstBracket !== -1 && lastBracket > firstBracket) {
				cleaned = cleaned.slice(firstBracket, lastBracket + 1);
			}
			return JSON.parse(cleaned);
		} catch {
			if (attempt < 2) {
				console.log(`  (retrying question generation, attempt ${attempt + 2}/3...)`);
				continue;
			}
			console.error("Failed to parse questions after 3 attempts. Last response:", response.slice(0, 200));
			process.exit(1);
		}
	}
	throw new Error("unreachable");
}

// --- Answer Evaluation ---

interface Evaluation {
	score: number; // 0-10
	feedback: string;
	missed: string[];
}

async function evaluateAnswer(
	question: Question,
	answer: string,
	code: string,
): Promise<Evaluation> {
	const prompt = `You are evaluating a developer's understanding of code they are working with.

Question: ${question.question}
Key concepts a correct answer should mention: ${question.key_concepts.join(", ")}

Developer's answer: "${answer}"

Relevant code context (first 4000 chars):
\`\`\`
${code.slice(0, 4000)}
\`\`\`

Score the answer 0-10:
- 0-3: Doesn't understand the code
- 4-6: Partial understanding, missing key concepts
- 7-8: Good understanding with minor gaps
- 9-10: Excellent, demonstrates deep understanding

Respond in JSON:
{
  "score": <number>,
  "feedback": "<1-2 sentence feedback>",
  "missed": ["<concept they missed>", ...]
}

Return ONLY the JSON, no markdown.`;

	const response = await llm([{ role: "user", content: prompt }]);
	try {
		const cleaned = response.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim();
		return JSON.parse(cleaned);
	} catch {
		return { score: 0, feedback: "Could not evaluate answer", missed: [] };
	}
}

// --- IO ---

function ask(rl: ReturnType<typeof createInterface>, prompt: string): Promise<string> {
	return new Promise((resolve) => rl.question(prompt, resolve));
}

// --- History Persistence ---

interface HistoryEntry {
	file: string;
	date: string;
	score: number; // 0-100 percentage
	questions: number;
	mode: "file" | "git-diff";
}

interface History {
	entries: HistoryEntry[];
}

function getHistoryDir(): string {
	try {
		const gitRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
		return resolve(gitRoot, ".understand");
	} catch {
		return resolve(process.cwd(), ".understand");
	}
}

function loadHistory(): History {
	const dir = getHistoryDir();
	const path = resolve(dir, "history.json");
	if (existsSync(path)) {
		try {
			return JSON.parse(readFileSync(path, "utf-8"));
		} catch {
			return { entries: [] };
		}
	}
	return { entries: [] };
}

function saveHistory(history: History): void {
	const dir = getHistoryDir();
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	writeFileSync(resolve(dir, "history.json"), JSON.stringify(history, null, 2));
}

function addHistoryEntry(file: string, score: number, questions: number, mode: "file" | "git-diff"): void {
	const history = loadHistory();
	const gitRoot = (() => {
		try {
			return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
		} catch {
			return process.cwd();
		}
	})();
	const relFile = mode === "git-diff" ? "git-diff" : relative(gitRoot, resolve(file));
	history.entries.push({
		file: relFile,
		date: new Date().toISOString().slice(0, 10),
		score,
		questions,
		mode,
	});
	saveHistory(history);
}

function showSummary(belowThreshold?: number): void {
	const history = loadHistory();
	if (history.entries.length === 0) {
		console.log("No understanding history yet. Run `understand <file>` to start.\n");
		return;
	}

	// Group by file, show latest score per file
	const latest = new Map<string, HistoryEntry>();
	for (const entry of history.entries) {
		const existing = latest.get(entry.file);
		if (!existing || entry.date > existing.date) {
			latest.set(entry.file, entry);
		}
	}

	const entries = [...latest.values()].sort((a, b) => a.score - b.score);
	const filtered = belowThreshold != null
		? entries.filter(e => e.score < belowThreshold)
		: entries;

	if (filtered.length === 0) {
		console.log(`No files scoring below ${belowThreshold}%.\n`);
		return;
	}

	console.log("━━━ Understanding Summary ━━━\n");

	if (belowThreshold != null) {
		console.log(`Files scoring below ${belowThreshold}%:\n`);
	}

	const avgScore = filtered.reduce((sum, e) => sum + e.score, 0) / filtered.length;

	for (const entry of filtered) {
		const bar = "█".repeat(Math.round(entry.score / 10)) + "░".repeat(10 - Math.round(entry.score / 10));
		const icon = entry.score >= 80 ? "✅" : entry.score >= 50 ? "⚠️" : "❌";
		console.log(`  ${icon} [${bar}] ${String(entry.score).padStart(3)}%  ${entry.file}  (${entry.date})`);
	}

	console.log(`\n  Average: ${Math.round(avgScore)}% across ${filtered.length} files`);

	// Show trend if we have repeat measurements
	const repeats = new Map<string, HistoryEntry[]>();
	for (const entry of history.entries) {
		const list = repeats.get(entry.file) || [];
		list.push(entry);
		repeats.set(entry.file, list);
	}

	const trending: string[] = [];
	for (const [file, measurements] of repeats) {
		if (measurements.length >= 2) {
			const sorted = measurements.sort((a, b) => a.date.localeCompare(b.date));
			const first = sorted[0].score;
			const last = sorted[sorted.length - 1].score;
			const delta = last - first;
			if (Math.abs(delta) >= 5) {
				trending.push(`  ${delta > 0 ? "📈" : "📉"} ${file}: ${first}% → ${last}% (${delta > 0 ? "+" : ""}${delta})`);
			}
		}
	}

	if (trending.length > 0) {
		console.log("\n  Trends:");
		for (const t of trending) console.log(t);
	}

	console.log();
}

// --- Debt Analysis ---

interface FileDebt {
	file: string;
	totalChanges: number; // lines added + removed
	commits: number;
	lastChanged: string;
	lastQuizzed: string | null;
	quizScore: number | null;
}

function analyzeDebt(sinceRef?: string): void {
	const gitRoot = (() => {
		try {
			return execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
		} catch {
			console.error("Not in a git repository.");
			process.exit(1);
		}
	})();

	// Get file change stats from git log
	const logCmd = sinceRef
		? `git log --numstat --pretty=format:"%H|%ai" ${sinceRef}..HEAD`
		: `git log --numstat --pretty=format:"%H|%ai" -50`;

	let logOutput: string;
	try {
		logOutput = execSync(logCmd, { cwd: gitRoot, encoding: "utf-8" });
	} catch {
		console.error(`Failed to read git log${sinceRef ? ` since ${sinceRef}` : ""}`);
		process.exit(1);
	}

	// Parse git log output
	const fileStats = new Map<string, { added: number; removed: number; commits: number; lastDate: string }>();
	let currentDate = "";

	for (const line of logOutput.split("\n")) {
		if (line.includes("|")) {
			const parts = line.split("|");
			if (parts.length >= 2) {
				currentDate = parts[1].trim().slice(0, 10);
			}
			continue;
		}

		const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
		if (!match) continue;

		const added = match[1] === "-" ? 0 : parseInt(match[1]);
		const removed = match[2] === "-" ? 0 : parseInt(match[2]);
		const file = match[3];

		// Skip non-code files
		if (/\.(md|json|txt|jpg|png|mp4|mp3|csv|lock)$/i.test(file)) continue;
		if (file.includes("node_modules/")) continue;

		const existing = fileStats.get(file) || { added: 0, removed: 0, commits: 0, lastDate: "" };
		existing.added += added;
		existing.removed += removed;
		existing.commits += 1;
		if (!existing.lastDate || currentDate > existing.lastDate) {
			existing.lastDate = currentDate;
		}
		fileStats.set(file, existing);
	}

	if (fileStats.size === 0) {
		console.log("No code file changes found.\n");
		return;
	}

	// Load quiz history
	const history = loadHistory();
	const latestQuiz = new Map<string, HistoryEntry>();
	for (const entry of history.entries) {
		const existing = latestQuiz.get(entry.file);
		if (!existing || entry.date > existing.date) {
			latestQuiz.set(entry.file, entry);
		}
	}

	// Build debt list
	const debts: FileDebt[] = [];
	for (const [file, stats] of fileStats) {
		const quiz = latestQuiz.get(file);
		debts.push({
			file,
			totalChanges: stats.added + stats.removed,
			commits: stats.commits,
			lastChanged: stats.lastDate,
			lastQuizzed: quiz?.date || null,
			quizScore: quiz?.score ?? null,
		});
	}

	// Sort by debt severity: unquizzed first, then by change volume
	debts.sort((a, b) => {
		const aUnquizzed = a.lastQuizzed === null ? 1 : 0;
		const bUnquizzed = b.lastQuizzed === null ? 1 : 0;
		if (aUnquizzed !== bUnquizzed) return bUnquizzed - aUnquizzed;
		return b.totalChanges - a.totalChanges;
	});

	// Display
	const top = debts.slice(0, 20);
	const totalChanges = debts.reduce((sum, d) => sum + d.totalChanges, 0);
	const unquizzed = debts.filter(d => d.lastQuizzed === null).length;

	console.log("━━━ Understanding Debt ━━━\n");
	console.log(`${debts.length} code files changed, ${unquizzed} never quizzed, ${totalChanges} total line changes\n`);

	for (const d of top) {
		const icon = d.lastQuizzed === null ? "🔴" :
			(d.quizScore !== null && d.quizScore < 50) ? "🟡" : "🟢";
		const quizInfo = d.lastQuizzed === null ? "never quizzed" :
			`${d.quizScore}% on ${d.lastQuizzed}`;
		const bar = "▓".repeat(Math.min(20, Math.round(d.totalChanges / 20))) +
			"░".repeat(Math.max(0, 20 - Math.round(d.totalChanges / 20)));

		console.log(`  ${icon} [${bar}] ${String(d.totalChanges).padStart(5)} lines  ${d.file}`);
		console.log(`     ${d.commits} commits, last changed ${d.lastChanged}, ${quizInfo}`);
	}

	if (debts.length > 20) {
		console.log(`\n  ... and ${debts.length - 20} more files`);
	}

	// Recommendation
	const worst = debts.find(d => d.lastQuizzed === null && d.totalChanges > 50);
	if (worst) {
		console.log(`\n💡 Start here: understand ${worst.file}`);
	}
	console.log();
}

// --- Main ---

async function main() {
	const args = process.argv.slice(2);

	// Debt command
	if (args[0] === "debt") {
		const sinceIdx = args.indexOf("--since");
		const sinceRef = sinceIdx >= 0 && args[sinceIdx + 1] ? args[sinceIdx + 1] : undefined;
		analyzeDebt(sinceRef);
		return;
	}

	// Summary command
	if (args[0] === "summary") {
		const belowIdx = args.indexOf("--below");
		const belowThreshold = belowIdx >= 0 && args[belowIdx + 1] ? parseInt(args[belowIdx + 1]) : undefined;
		showSummary(belowThreshold);
		return;
	}

	let code: string;
	let filename: string;
	let mode: "file" | "git-diff" = "file";

	if (args.includes("--git-diff")) {
		// Quiz on staged changes
		try {
			code = execSync("git diff --cached", { encoding: "utf-8" });
			if (!code.trim()) {
				code = execSync("git diff HEAD~1", { encoding: "utf-8" });
			}
		} catch {
			console.error("Error: Not in a git repository or no changes found");
			process.exit(1);
		}
		filename = "git diff";
		mode = "git-diff";
		if (!code.trim()) {
			console.error("No git changes found (staged or last commit)");
			process.exit(1);
		}
	} else if (args.length > 0 && !args[0].startsWith("-")) {
		const filepath = resolve(args[0]);
		if (!existsSync(filepath)) {
			console.error(`File not found: ${filepath}`);
			process.exit(1);
		}
		// Skip binary files — check for null bytes in first 8KB
		const sample = readFileSync(filepath).subarray(0, 8192);
		if (sample.includes(0)) {
			console.error(`Binary file detected: ${filepath}\nUnderstand works with text/code files only.`);
			process.exit(1);
		}
		code = readFileSync(filepath, "utf-8");
		filename = basename(filepath);
	} else {
		console.log("understand — anti-cognitive-debt code comprehension tool\n");
		console.log("Usage:");
		console.log("  npx tsx understand.ts <file>              Quiz on a code file");
		console.log("  npx tsx understand.ts --git-diff          Quiz on recent git changes");
		console.log("  npx tsx understand.ts <file> --dry-run    Show questions only (no quiz)");
		console.log("  npx tsx understand.ts summary             Show understanding scores");
		console.log("  npx tsx understand.ts summary --below 60  Show files scoring below 60%");
		console.log("  npx tsx understand.ts debt                Show understanding debt dashboard");
		console.log("  npx tsx understand.ts debt --since main   Show debt since branch point");
		process.exit(0);
	}

	const dryRun = args.includes("--dry-run");

	console.log(`\n📖 understand — testing your comprehension of: ${filename}\n`);
	console.log("Generating questions...\n");

	const questions = await generateQuestions(code, filename);

	if (dryRun) {
		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			console.log(`━━━ Question ${i + 1}/${questions.length} ━━━`);
			console.log(`\n${q.question}\n`);
			console.log(`💡 Hint: ${q.hint}`);
			console.log(`📝 Key concepts: ${q.key_concepts.join(", ")}\n`);
		}
		process.exit(0);
	}

	const rl = createInterface({ input: process.stdin, output: process.stdout });

	let totalScore = 0;
	const results: { question: string; score: number; feedback: string }[] = [];

	for (let i = 0; i < questions.length; i++) {
		const q = questions[i];
		console.log(`━━━ Question ${i + 1}/${questions.length} ━━━`);
		console.log(`\n${q.question}\n`);
		console.log(`💡 Hint: ${q.hint}\n`);

		const answer = await ask(rl, "Your answer: ");

		if (!answer.trim()) {
			console.log("\n⏭  Skipped\n");
			results.push({ question: q.question, score: 0, feedback: "Skipped" });
			continue;
		}

		console.log("\nEvaluating...\n");
		const evaluation = await evaluateAnswer(q, answer, code);

		totalScore += evaluation.score;

		const bar = "█".repeat(evaluation.score) + "░".repeat(10 - evaluation.score);
		console.log(`Score: [${bar}] ${evaluation.score}/10`);
		console.log(`${evaluation.feedback}`);
		if (evaluation.missed.length > 0) {
			console.log(`Missed: ${evaluation.missed.join(", ")}`);
		}
		console.log();

		results.push({
			question: q.question,
			score: evaluation.score,
			feedback: evaluation.feedback,
		});
	}

	rl.close();

	// Final summary
	const avgScore = totalScore / questions.length;
	const percentage = Math.round((avgScore / 10) * 100);

	// Save to history
	const inputFile = args.find(a => !a.startsWith("-")) || "git-diff";
	addHistoryEntry(inputFile, percentage, questions.length, mode);

	console.log("━━━ Understanding Score ━━━\n");

	const fullBar = "█".repeat(Math.round(avgScore)) + "░".repeat(10 - Math.round(avgScore));
	console.log(`Overall: [${fullBar}] ${percentage}%\n`);

	if (percentage >= 80) {
		console.log("✅ Strong understanding. This code is yours.");
	} else if (percentage >= 50) {
		console.log("⚠️  Partial understanding. You may struggle to debug or modify this code.");
	} else {
		console.log("❌ Low understanding. This is cognitive debt — you're carrying code you can't maintain.");
	}

	console.log("\nResults:");
	for (const r of results) {
		const icon = r.score >= 7 ? "✅" : r.score >= 4 ? "⚠️" : "❌";
		console.log(`  ${icon} ${r.score}/10 — ${r.question.slice(0, 60)}...`);
	}
	console.log();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
