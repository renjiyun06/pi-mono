/**
 * seedream-generate.ts — Generate images via Seedream API (BytePlus ModelArk)
 *
 * Usage:
 *   npx tsx seedream-generate.ts --help
 *   npx tsx seedream-generate.ts --describe
 *   npx tsx seedream-generate.ts t2i --prompt "可爱卡通机器人, 蓝色圆头, kawaii风格" --output avatar.png
 *   npx tsx seedream-generate.ts i2i --prompt "同角色不同角度" --image ref.png --output variant.png
 *   npx tsx seedream-generate.ts batch --config frames.json --output-dir frames/
 *
 * Environment:
 *   ARK_API_KEY          — Required. API key from BytePlus.
 *   ARK_BASE_URL         — Optional. Default: https://ark.ap-southeast.bytepluses.com/api/v3
 *   SEEDREAM_MODEL       — Optional. Default: seedream-4.5
 */

import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = "https://ark.ap-southeast.bytepluses.com/api/v3";
const DEFAULT_MODEL = "seedream-4.5";

function getConfig() {
	const apiKey = process.env.ARK_API_KEY;
	if (!apiKey) {
		console.error("ERROR: ARK_API_KEY environment variable is required.");
		console.error("Get one from: https://console.byteplus.com/ark/region:ark+ap-southeast-1/apikey");
		process.exit(1);
	}
	return {
		apiKey,
		baseUrl: process.env.ARK_BASE_URL || DEFAULT_BASE_URL,
		model: process.env.SEEDREAM_MODEL || DEFAULT_MODEL,
	};
}

// ─── API Types ───────────────────────────────────────────────────────────────

interface ImageGenerationRequest {
	model: string;
	prompt: string;
	image?: string | string[];
	size?: string;
	seed?: number;
	n?: number;
	response_format?: "url" | "b64_json";
	guidance_scale?: number;
	sequential_image_generation?: "auto" | "disabled";
}

interface ImageGenerationResponse {
	created: number;
	data: Array<{
		url?: string;
		b64_json?: string;
		revised_prompt?: string;
		index: number;
	}>;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

// ─── API Functions ───────────────────────────────────────────────────────────

async function generateImage(opts: {
	prompt: string;
	image?: string;
	size?: string;
	seed?: number;
	n?: number;
	model?: string;
}): Promise<ImageGenerationResponse> {
	const config = getConfig();
	const url = `${config.baseUrl}/images/generations`;

	const body: ImageGenerationRequest = {
		model: opts.model || config.model,
		prompt: opts.prompt,
		response_format: "url",
	};

	if (opts.image) {
		if (opts.image.startsWith("http")) {
			body.image = opts.image;
		} else {
			const data = fs.readFileSync(opts.image);
			const ext = path.extname(opts.image).slice(1).toLowerCase();
			const mime = ext === "jpg" ? "jpeg" : ext;
			body.image = `data:image/${mime};base64,${data.toString("base64")}`;
		}
	}

	if (opts.size) body.size = opts.size;
	if (opts.seed !== undefined) body.seed = opts.seed;
	if (opts.n !== undefined) body.n = opts.n;

	console.log(`  Generating image (model: ${body.model}, size: ${body.size || "default"})...`);

	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.apiKey}`,
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const errBody = await res.text();
		throw new Error(`Image generation failed (${res.status}): ${errBody}`);
	}

	return (await res.json()) as ImageGenerationResponse;
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Download failed (${res.status})`);
	const buffer = Buffer.from(await res.arrayBuffer());
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, buffer);
	const kb = (buffer.length / 1024).toFixed(0);
	console.log(`  ✓ Saved ${outputPath} (${kb} KB)`);
}

// ─── Batch Config ────────────────────────────────────────────────────────────

interface BatchFrame {
	id: string;
	prompt: string;
	image?: string;
	size?: string;
	seed?: number;
}

interface BatchConfig {
	model?: string;
	size?: string;
	frames: BatchFrame[];
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const program = new Command();

program
	.name("seedream-generate")
	.description("Generate images via Seedream API (BytePlus ModelArk)")
	.version("1.0.0");

program
	.command("t2i")
	.description("Text-to-image generation")
	.requiredOption("--prompt <text>", "Image prompt")
	.requiredOption("--output <path>", "Output image path")
	.option("--size <size>", "Image size (1K/2K/4K or WxH)", "2K")
	.option("--seed <n>", "Random seed", Number.parseInt)
	.option("--model <id>", "Model ID override")
	.action(async (opts) => {
		console.log("=== Seedream Text-to-Image ===");
		const result = await generateImage({
			prompt: opts.prompt,
			size: opts.size,
			seed: opts.seed,
			model: opts.model,
		});
		if (result.data?.[0]?.url) {
			await downloadImage(result.data[0].url, opts.output);
		} else {
			console.error("No image URL in response:", JSON.stringify(result, null, 2));
			process.exit(1);
		}
		if (result.usage) {
			console.log(`  Tokens: ${result.usage.total_tokens}`);
		}
	});

program
	.command("i2i")
	.description("Image-to-image generation (with reference)")
	.requiredOption("--prompt <text>", "Image prompt")
	.requiredOption("--image <path>", "Reference image (file path or URL)")
	.requiredOption("--output <path>", "Output image path")
	.option("--size <size>", "Image size (1K/2K/4K or WxH)", "2K")
	.option("--seed <n>", "Random seed", Number.parseInt)
	.option("--model <id>", "Model ID override")
	.action(async (opts) => {
		console.log("=== Seedream Image-to-Image ===");
		const result = await generateImage({
			prompt: opts.prompt,
			image: opts.image,
			size: opts.size,
			seed: opts.seed,
			model: opts.model,
		});
		if (result.data?.[0]?.url) {
			await downloadImage(result.data[0].url, opts.output);
		} else {
			console.error("No image URL in response:", JSON.stringify(result, null, 2));
			process.exit(1);
		}
		if (result.usage) {
			console.log(`  Tokens: ${result.usage.total_tokens}`);
		}
	});

program
	.command("batch")
	.description("Batch generate frames from config JSON")
	.requiredOption("--config <path>", "Batch config JSON file")
	.requiredOption("--output-dir <dir>", "Output directory for frames")
	.option("--skip-existing", "Skip frames that already exist", true)
	.action(async (opts) => {
		console.log("=== Seedream Batch Generation ===");
		const configPath = path.resolve(opts.config);
		const config: BatchConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
		const outDir = path.resolve(opts.outputDir);
		fs.mkdirSync(outDir, { recursive: true });

		let generated = 0;
		let skipped = 0;

		for (const frame of config.frames) {
			const outPath = path.join(outDir, `${frame.id}.png`);

			if (opts.skipExisting && fs.existsSync(outPath)) {
				console.log(`  [${frame.id}] Already exists, skipping`);
				skipped++;
				continue;
			}

			console.log(`\n  [${frame.id}] ${frame.prompt.substring(0, 60)}...`);

			try {
				const imagePath = frame.image ? path.resolve(path.dirname(configPath), frame.image) : undefined;
				const result = await generateImage({
					prompt: frame.prompt,
					image: imagePath,
					size: frame.size || config.size || "2K",
					seed: frame.seed,
					model: config.model,
				});

				if (result.data?.[0]?.url) {
					await downloadImage(result.data[0].url, outPath);
					generated++;
				} else {
					console.error(`  [${frame.id}] No image URL in response`);
				}
			} catch (err) {
				console.error(`  [${frame.id}] Error: ${err instanceof Error ? err.message : err}`);
			}
		}

		console.log(`\n=== Done: ${generated} generated, ${skipped} skipped ===`);
	});

program
	.command("describe")
	.description("Describe what this tool does")
	.action(() => {
		console.log(`
seedream-generate — Image generation via Seedream API (BytePlus ModelArk)

Generates high-quality images using ByteDance's Seedream models.
Part of the video production pipeline: generates first-frame images
for Seedance video generation, avatar images for OmniHuman, etc.

Models:
  seedream-4.5     Latest, supports multi-image input, 4K output
  seedream-4.0     Previous generation
  seedream-3.0-t2i Text-to-image only
  seededit-3.0-i2i Image editing
  seedream-5.0-lite Coming Feb 24, 2026

Commands:
  t2i    Text-to-image (pure text prompt → image)
  i2i    Image-to-image (reference image + text → image)
  batch  Batch generate from config JSON

Batch config format:
  {
    "model": "seedream-4.5",
    "size": "2K",
    "frames": [
      { "id": "01", "prompt": "cute robot mascot..." },
      { "id": "02", "prompt": "...", "image": "ref.png" }
    ]
  }

Environment:
  ARK_API_KEY       Required. BytePlus API key.
  ARK_BASE_URL      Optional. Default: https://ark.ap-southeast.bytepluses.com/api/v3
  SEEDREAM_MODEL    Optional. Default: seedream-4.5
		`);
	});

program.parse();
