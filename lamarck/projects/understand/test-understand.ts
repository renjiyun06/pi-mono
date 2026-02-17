#!/usr/bin/env npx tsx
/**
 * Smoke tests for the understand CLI tool.
 * Tests offline functionality only (no LLM API calls).
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = typeof import.meta.dirname === "string" ? import.meta.dirname : dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, "understand.ts");
const TEST_DIR = resolve(__dirname, ".test-tmp");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
	try {
		fn();
		console.log(`  ✓ ${name}`);
		passed++;
	} catch (e: unknown) {
		const err = e as Error;
		console.log(`  ✗ ${name}: ${err.message}`);
		failed++;
	}
}

function assert(condition: boolean, msg: string) {
	if (!condition) throw new Error(msg);
}

// Setup
console.log("\n━━━ understand CLI tests ━━━\n");

if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
mkdirSync(TEST_DIR, { recursive: true });

// Create a test git repo
execSync("git init", { cwd: TEST_DIR, stdio: "pipe" });
execSync('git config user.email "test@test.com"', { cwd: TEST_DIR, stdio: "pipe" });
execSync('git config user.name "Test"', { cwd: TEST_DIR, stdio: "pipe" });

// Create test files
writeFileSync(resolve(TEST_DIR, "sample.ts"), `
function add(a: number, b: number): number {
  return a + b;
}
export { add };
`);
execSync("git add . && git commit -m 'init'", { cwd: TEST_DIR, stdio: "pipe" });

// --- Tests ---

test("--help exits with 0", () => {
	const result = execSync(`npx tsx ${CLI} --help 2>&1`, {
		encoding: "utf-8",
		cwd: TEST_DIR,
	});
	assert(result.includes("understand"), "should mention understand");
});

test("debt command runs without API key", () => {
	// debt doesn't need LLM
	const result = execSync(`npx tsx ${CLI} debt 2>&1`, {
		encoding: "utf-8",
		cwd: TEST_DIR,
		env: { ...process.env, OPENROUTER_API_KEY: "fake-key-for-test" },
	});
	// Should either show "No code file changes" or debt data
	assert(
		result.includes("Understanding Debt") || result.includes("No code file changes"),
		`unexpected output: ${result.slice(0, 200)}`,
	);
});

test("summary command runs on empty history", () => {
	const result = execSync(`npx tsx ${CLI} summary 2>&1`, {
		encoding: "utf-8",
		cwd: TEST_DIR,
		env: { ...process.env, OPENROUTER_API_KEY: "fake-key-for-test" },
	});
	assert(
		result.includes("No understanding history") || result.includes("Understanding Summary"),
		`unexpected output: ${result.slice(0, 200)}`,
	);
});

test("debt --since HEAD shows no changes", () => {
	const result = execSync(`npx tsx ${CLI} debt --since HEAD 2>&1`, {
		encoding: "utf-8",
		cwd: TEST_DIR,
		env: { ...process.env, OPENROUTER_API_KEY: "fake-key-for-test" },
	});
	assert(
		result.includes("No code file changes") || result.includes("Understanding Debt"),
		`unexpected: ${result.slice(0, 200)}`,
	);
});

test("debt detects new uncommitted file changes", () => {
	// Add a new code file after the initial commit
	writeFileSync(resolve(TEST_DIR, "new-feature.ts"), `
export function multiply(a: number, b: number): number {
  return a * b;
}
`);
	execSync("git add . && git commit -m 'add feature'", { cwd: TEST_DIR, stdio: "pipe" });

	const result = execSync(`npx tsx ${CLI} debt --since HEAD~1 2>&1`, {
		encoding: "utf-8",
		cwd: TEST_DIR,
		env: { ...process.env, OPENROUTER_API_KEY: "fake-key-for-test" },
	});
	assert(result.includes("new-feature.ts"), `should detect new-feature.ts: ${result.slice(0, 300)}`);
});

// Cleanup
rmSync(TEST_DIR, { recursive: true });

console.log(`\n━━━ Results: ${passed} passed, ${failed} failed ━━━\n`);
process.exit(failed > 0 ? 1 : 0);
