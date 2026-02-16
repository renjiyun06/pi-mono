#!/usr/bin/env npx tsx
/**
 * generate-image.ts — AI image generation via OpenRouter + Gemini Flash Image
 *
 * Usage:
 *   npx tsx generate-image.ts "prompt text" [--output path.png] [--ratio 9:16]
 *
 * Supported ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9
 * Default: 9:16 (Douyin vertical)
 * Default output: ./generated-image.png
 *
 * Cost: ~$0.04 per image via Gemini 2.5 Flash Image
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VALID_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

function getApiKey(): string {
	const envPath = resolve(__dirname, "../../../../.env");
	const envContent = readFileSync(envPath, "utf-8");
	const match = envContent.match(/^OPENROUTER_API_KEY=(.+)$/m);
	if (!match) throw new Error("OPENROUTER_API_KEY not found in .env");
	return match[1].trim();
}

async function generateImage(prompt: string, ratio: string, outputPath: string): Promise<void> {
	const apiKey = getApiKey();

	console.log(`Generating image...`);
	console.log(`  Prompt: ${prompt.substring(0, 80)}${prompt.length > 80 ? "..." : ""}`);
	console.log(`  Ratio: ${ratio}`);
	console.log(`  Model: google/gemini-2.5-flash-image`);

	const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "google/gemini-2.5-flash-image",
			messages: [{ role: "user", content: prompt }],
			modalities: ["image", "text"],
			image_config: { aspect_ratio: ratio },
		}),
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`API error ${response.status}: ${err}`);
	}

	const data = await response.json();
	const msg = data.choices?.[0]?.message;
	const images = msg?.images || [];

	if (images.length === 0) {
		console.error("No image generated. Response:", msg?.content || "empty");
		process.exit(1);
	}

	const url: string = images[0].image_url.url;
	const [, b64data] = url.split(",", 2);
	const imgBytes = Buffer.from(b64data, "base64");

	writeFileSync(outputPath, imgBytes);
	const cost = data.usage?.cost || 0;
	console.log(`  Saved: ${outputPath} (${(imgBytes.length / 1024).toFixed(0)}KB)`);
	console.log(`  Cost: $${cost.toFixed(4)}`);
}

// Parse args
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
	console.log("Usage: npx tsx generate-image.ts \"prompt\" [--output path.png] [--ratio 9:16]");
	console.log(`Ratios: ${VALID_RATIOS.join(", ")}`);
	process.exit(0);
}

let prompt = "";
let output = "generated-image.png";
let ratio = "9:16";

for (let i = 0; i < args.length; i++) {
	if (args[i] === "--output" && args[i + 1]) {
		output = args[++i];
	} else if (args[i] === "--ratio" && args[i + 1]) {
		ratio = args[++i];
		if (!VALID_RATIOS.includes(ratio)) {
			console.error(`Invalid ratio: ${ratio}. Valid: ${VALID_RATIOS.join(", ")}`);
			process.exit(1);
		}
	} else if (!args[i].startsWith("--")) {
		prompt = args[i];
	}
}

if (!prompt) {
	console.error("No prompt provided");
	process.exit(1);
}

generateImage(prompt, ratio, output).catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
