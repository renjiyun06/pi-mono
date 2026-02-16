#!/usr/bin/env npx tsx
/**
 * understand — anti-cognitive-debt code comprehension tool
 *
 * Reads a code file, generates understanding questions via LLM,
 * quizzes the developer, and scores their comprehension.
 *
 * Usage:
 *   npx tsx understand.ts <file> [--diff]          Quiz on a file
 *   npx tsx understand.ts --git-diff               Quiz on staged git changes
 *
 * Requires OPENROUTER_API_KEY in environment or ../.env
 */

import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { createInterface } from "readline";
import { resolve, basename } from "path";

// Load .env from repo root
const envPath = resolve("/home/lamarck/pi-mono/.env");
if (existsSync(envPath)) {
	const envContent = readFileSync(envPath, "utf-8");
	for (const line of envContent.split("\n")) {
		const match = line.match(/^([^#=]+)=(.*)$/);
		if (match) process.env[match[1].trim()] = match[2].trim();
	}
}

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
	console.error("Error: OPENROUTER_API_KEY not set");
	process.exit(1);
}

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
			model: "anthropic/claude-sonnet-4",
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
	const prompt = `You are a code comprehension evaluator. Given the following code file, generate exactly 3 understanding questions that test whether the developer truly understands what this code does.

Rules:
- Questions should test UNDERSTANDING, not memorization (don't ask "what is the variable name on line 5")
- Focus on: purpose, control flow, edge cases, design decisions, and potential bugs
- Each question should be answerable in 1-3 sentences
- Include a hint that points the developer in the right direction without giving the answer
- Include key concepts that a correct answer should mention

File: ${filename}

\`\`\`
${code.slice(0, 8000)}
\`\`\`

Respond in JSON format:
[
  {
    "question": "...",
    "hint": "...",
    "key_concepts": ["concept1", "concept2"]
  }
]

Return ONLY the JSON array, no markdown formatting.`;

	const response = await llm([{ role: "user", content: prompt }]);
	try {
		// Strip markdown code fences if present
		const cleaned = response.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim();
		return JSON.parse(cleaned);
	} catch {
		console.error("Failed to parse questions:", response);
		process.exit(1);
	}
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

// --- Main ---

async function main() {
	const args = process.argv.slice(2);

	let code: string;
	let filename: string;

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
		code = readFileSync(filepath, "utf-8");
		filename = basename(filepath);
	} else {
		console.log("understand — anti-cognitive-debt code comprehension tool\n");
		console.log("Usage:");
		console.log("  npx tsx understand.ts <file>            Quiz on a code file");
		console.log("  npx tsx understand.ts --git-diff        Quiz on recent git changes");
		console.log("  npx tsx understand.ts <file> --dry-run  Show questions only (no quiz)");
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
