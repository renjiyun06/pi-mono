#!/usr/bin/env npx tsx
/**
 * Render a Remotion composition to MP4.
 * 
 * Usage:
 *   npx tsx render.ts <compositionId> <outputPath> [--props '{"key": "value"}']
 * 
 * Examples:
 *   npx tsx render.ts OneMinuteAI /mnt/d/wsl-bridge/test.mp4
 *   npx tsx render.ts DataViz /mnt/d/wsl-bridge/chart.mp4 --props '{"title":"Custom Title"}'
 *   npx tsx render.ts TextReveal /mnt/d/wsl-bridge/quote.mp4 --props '{"text":"Hello World"}'
 * 
 * Available compositions:
 *   - OneMinuteAI: Concept explainer with title + bullet points
 *   - DataViz: Animated bar chart
 *   - TextReveal: Word-by-word text animation
 */

import { execSync } from "child_process";
import { resolve } from "path";

const args = process.argv.slice(2);

if (args.length < 2 || args[0] === "--help") {
	console.log(`Usage: npx tsx render.ts <compositionId> <outputPath> [--props '{}']

Compositions:
  OneMinuteAI  - Concept explainer (title, subtitle, lines[])
  DataViz      - Animated bar chart (title, bars[{label, value}], unit)
  TextReveal   - Text reveal animation (text, attribution)

Options:
  --props JSON  Override default props with custom values
  --quality     low|medium|high (default: high)
`);
	process.exit(0);
}

const compositionId = args[0];
const outputPath = args[1];

let propsArg = "";
const propsIdx = args.indexOf("--props");
if (propsIdx !== -1 && args[propsIdx + 1]) {
	propsArg = `--props '${args[propsIdx + 1]}'`;
}

let crf = "18"; // high quality
const qualityIdx = args.indexOf("--quality");
if (qualityIdx !== -1) {
	const q = args[qualityIdx + 1];
	if (q === "low") crf = "28";
	else if (q === "medium") crf = "23";
}

const entryPoint = resolve(__dirname, "src/index.ts");

const cmd = `npx remotion render ${entryPoint} ${compositionId} ${outputPath} --codec h264 --crf ${crf} ${propsArg}`.trim();

console.log(`Rendering ${compositionId} → ${outputPath}`);
console.log(`Command: ${cmd}`);

try {
	execSync(cmd, { stdio: "inherit", cwd: __dirname });
	console.log(`\nDone: ${outputPath}`);
} catch (e) {
	console.error("Render failed");
	process.exit(1);
}
