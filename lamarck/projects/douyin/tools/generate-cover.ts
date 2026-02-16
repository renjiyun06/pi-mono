#!/usr/bin/env npx tsx
/**
 * Generate a Douyin cover image from a spec file.
 *
 * 1. Reads spec JSON to extract title and accent color
 * 2. Generates an illustration via AI (no text in image)
 * 3. Overlays title text using ffmpeg drawtext
 * 4. Outputs 1080x1920 cover image
 *
 * Usage:
 *   npx tsx generate-cover.ts --spec specs/deep-cognitive-debt.json --output cover.png
 *   npx tsx generate-cover.ts --spec specs/deep-cognitive-debt.json --output cover.png --prompt "custom illustration prompt"
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
	const idx = args.indexOf(`--${name}`);
	return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const specPath = getArg("spec");
const outputPath = getArg("output");
const customPrompt = getArg("prompt");

if (!specPath || !outputPath) {
	console.error("Usage: npx tsx generate-cover.ts --spec <spec.json> --output <cover.png> [--prompt <custom>]");
	process.exit(1);
}

const spec = JSON.parse(readFileSync(specPath, "utf-8"));
const title: string = spec.title || spec.sections?.[0]?.text || "Untitled";
const accent: string = spec.accentColor || "#00d4ff";

// Map topic keywords to illustration prompts
function generateIllustrationPrompt(title: string, accent: string): string {
	const baseStyle = `Dark background, cinematic, high contrast, no text, no words, no letters, vertical 9:16 composition`;

	// Topic-based prompt selection
	const lowerTitle = title.toLowerCase();
	if (lowerTitle.includes("认知") || lowerTitle.includes("cognitive") || lowerTitle.includes("大脑") || lowerTitle.includes("brain")) {
		return `Abstract wireframe brain with glowing ${accent} neural connections, fragmenting on one side into floating geometric shards. ${baseStyle}`;
	}
	if (lowerTitle.includes("代码") || lowerTitle.includes("code") || lowerTitle.includes("程序")) {
		return `Isometric dark developer workspace with multiple glowing monitors showing code, with subtle ${accent} accent lighting. A single chair. ${baseStyle}`;
	}
	if (lowerTitle.includes("自动化") || lowerTitle.includes("automat") || lowerTitle.includes("bainbridge")) {
		return `Retro-futuristic control room from the 1980s, analog dials and CRT monitors, but all screens show modern AI interfaces. Accent color ${accent}. ${baseStyle}`;
	}
	if (lowerTitle.includes("生日") || lowerTitle.includes("birthday") || lowerTitle.includes("概率") || lowerTitle.includes("probability")) {
		return `Abstract visualization of probability: many overlapping circles with glowing ${accent} intersections, some connected by thin lines. Mathematical beauty. ${baseStyle}`;
	}
	if (lowerTitle.includes("1%") || lowerTitle.includes("复利") || lowerTitle.includes("compound")) {
		return `Two diverging paths from a single point, one curving exponentially upward (glowing ${accent}), the other barely rising. Grid background like a graph. ${baseStyle}`;
	}
	if (lowerTitle.includes("依赖") || lowerTitle.includes("dependen")) {
		return `Isometric view of a developer at a desk, surrounded by growing chains of glowing code symbols. The chains transition from ${accent} (loose) to red (tight). ${baseStyle}`;
	}
	// Default: abstract tech
	return `Abstract dark tech visualization with geometric patterns, glowing ${accent} accent lines, floating data particles. ${baseStyle}`;
}

const illustrationPrompt = customPrompt || generateIllustrationPrompt(title, accent);

console.log("=== Cover Generation ===");
console.log(`  Title: ${title}`);
console.log(`  Accent: ${accent}`);
console.log(`  Prompt: ${illustrationPrompt.substring(0, 80)}...`);

// Step 1: Generate illustration
const tmpIllustration = `/tmp/cover-illustration-${Date.now()}.png`;
const generateImageScript = resolve(dirname(new URL(import.meta.url).pathname), "generate-image.ts");

console.log("\nStep 1: Generating illustration...");
execSync(
	`npx tsx "${generateImageScript}" "${illustrationPrompt}" --output "${tmpIllustration}"`,
	{ stdio: "inherit" }
);

if (!existsSync(tmpIllustration)) {
	console.error("Failed to generate illustration");
	process.exit(1);
}

// Step 2: Overlay title text using ffmpeg
// Find a Chinese font
const fontCandidates = [
	"/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
	"/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
	"/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
	"/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
];

let fontPath = "";
for (const f of fontCandidates) {
	if (existsSync(f)) {
		fontPath = f;
		break;
	}
}

if (!fontPath) {
	console.warn("No Chinese font found — outputting illustration without text overlay");
	execSync(`cp "${tmpIllustration}" "${outputPath}"`);
} else {
	console.log("\nStep 2: Overlaying title text...");
	// Escape special characters for ffmpeg drawtext
	const escapedTitle = title.replace(/'/g, "'\\''").replace(/:/g, "\\:");

	// Title in center-bottom third, with dark background bar for readability
	const filter = [
		// Dark gradient overlay at bottom
		`drawbox=x=0:y=ih*0.7:w=iw:h=ih*0.3:color=black@0.6:t=fill`,
		// Title text
		`drawtext=text='${escapedTitle}':fontfile='${fontPath}':fontsize=72:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.78`,
	].join(",");

	execSync(
		`ffmpeg -i "${tmpIllustration}" -vf "${filter}" -q:v 2 "${outputPath}" -y -loglevel error`
	);
}

console.log(`\n=== Done ===`);
console.log(`  Cover: ${outputPath}`);

// Cleanup
execSync(`rm -f "${tmpIllustration}"`);
