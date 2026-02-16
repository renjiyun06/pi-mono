#!/usr/bin/env npx tsx
/**
 * Batch render all video specs that haven't been rendered yet.
 * 
 * Usage:
 *   npx tsx render-all.ts [--output-dir dir] [--force]
 * 
 * Options:
 *   --output-dir  Output directory (default: /mnt/d/wsl-bridge/remotion-prototype)
 *   --force       Re-render even if output already exists
 */

import { readdirSync, existsSync, readFileSync } from "fs";
import { join, basename } from "path";
import { execSync } from "child_process";

const specsDir = join(__dirname, "specs");
const args = process.argv.slice(2);
const forceIdx = args.indexOf("--force");
const force = forceIdx !== -1;
const outIdx = args.indexOf("--output-dir");
const outputDir = outIdx !== -1 ? args[outIdx + 1] : "/mnt/d/wsl-bridge/remotion-prototype";

const specs = readdirSync(specsDir)
	.filter(f => f.endsWith(".json") && !f.startsWith("carousel-"))
	.sort();

console.log(`=== Batch Render ===`);
console.log(`Specs: ${specs.length}`);
console.log(`Output: ${outputDir}`);
console.log(`Force: ${force}\n`);

let rendered = 0;
let skipped = 0;
let failed = 0;

for (const specFile of specs) {
	const name = basename(specFile, ".json");
	const outputPath = join(outputDir, `${name}.mp4`);

	if (!force && existsSync(outputPath)) {
		console.log(`  SKIP ${name} (exists)`);
		skipped++;
		continue;
	}

	console.log(`  RENDER ${name}...`);
	try {
		const result = execSync(
			`npx tsx render-with-voice.ts --spec "specs/${specFile}" --output "${outputPath}"`,
			{
				cwd: __dirname,
				stdio: "pipe",
				timeout: 300_000, // 5 min per spec
			}
		).toString();

		// Extract duration from output
		const durationMatch = result.match(/Duration: ([\d.]+)s/);
		const sizeMatch = result.match(/Size: ([\d.]+) MB/);
		console.log(`    Done: ${durationMatch?.[1] || "?"}s, ${sizeMatch?.[1] || "?"}MB`);
		rendered++;
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		console.log(`    FAILED: ${msg.substring(0, 100)}`);
		failed++;
	}
}

console.log(`\n=== Summary ===`);
console.log(`Rendered: ${rendered}`);
console.log(`Skipped: ${skipped}`);
console.log(`Failed: ${failed}`);
