/**
 * seedance-generate.ts — Generate video clips via Seedance API (火山方舟 / BytePlus)
 *
 * Usage:
 *   npx tsx seedance-generate.ts --help
 *   npx tsx seedance-generate.ts --describe
 *   npx tsx seedance-generate.ts t2v --prompt "写实风格，蓝天下的雏菊花田" --output out.mp4
 *   npx tsx seedance-generate.ts i2v --prompt "镜头缓慢推进" --image first.png --output out.mp4
 *   npx tsx seedance-generate.ts i2v --prompt "运镜" --image first.png --last-image last.png --output out.mp4
 *   npx tsx seedance-generate.ts batch --storyboard storyboard.json --output-dir clips/
 *
 * Environment:
 *   ARK_API_KEY          — Required. API key from 火山方舟 or BytePlus.
 *   ARK_BASE_URL         — Optional. Default: https://ark.cn-beijing.volces.com/api/v3
 *   SEEDANCE_MODEL       — Optional. Default: doubao-seedance-1-5-pro-251215
 */

import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const DEFAULT_MODEL = "doubao-seedance-1-5-pro-251215";
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 360; // 30 min max wait

function getConfig() {
	const apiKey = process.env.ARK_API_KEY;
	if (!apiKey) {
		console.error("ERROR: ARK_API_KEY environment variable is required.");
		console.error("Get one from: https://console.volcengine.com/ark/region:ark+cn-beijing/apikey");
		console.error("Or BytePlus: https://console.byteplus.com/ark/region:ark+ap-southeast-1/apikey");
		process.exit(1);
	}
	return {
		apiKey,
		baseUrl: process.env.ARK_BASE_URL || DEFAULT_BASE_URL,
		model: process.env.SEEDANCE_MODEL || DEFAULT_MODEL,
	};
}

// ─── API Types ───────────────────────────────────────────────────────────────

interface ContentItem {
	type: "text" | "image_url";
	text?: string;
	image_url?: { url: string };
	role?: "first_frame" | "last_frame" | "reference_image";
}

interface CreateTaskRequest {
	model: string;
	content: ContentItem[];
	ratio?: string;
	duration?: number;
	resolution?: string;
	generate_audio?: boolean;
	watermark?: boolean;
	seed?: number;
	camera_fixed?: boolean;
	draft?: boolean;
	return_last_frame?: boolean;
	callback_url?: string;
	service_tier?: "default" | "flex";
}

interface CreateTaskResponse {
	id: string;
}

interface TaskResult {
	id: string;
	model: string;
	status: "queued" | "running" | "succeeded" | "failed" | "expired" | "cancelled";
	content?: {
		video_url?: string;
		last_frame_url?: string;
	};
	error?: {
		code: string;
		message: string;
	};
	usage?: {
		completion_tokens: number;
		total_tokens: number;
	};
	seed?: number;
	resolution?: string;
	ratio?: string;
	duration?: number;
	framespersecond?: number;
}

// ─── API Client ──────────────────────────────────────────────────────────────

async function createTask(config: ReturnType<typeof getConfig>, request: CreateTaskRequest): Promise<string> {
	const res = await fetch(`${config.baseUrl}/contents/generations/tasks`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.apiKey}`,
		},
		body: JSON.stringify(request),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Create task failed (${res.status}): ${body}`);
	}

	const data = (await res.json()) as CreateTaskResponse;
	return data.id;
}

async function getTask(config: ReturnType<typeof getConfig>, taskId: string): Promise<TaskResult> {
	const res = await fetch(`${config.baseUrl}/contents/generations/tasks/${taskId}`, {
		headers: {
			Authorization: `Bearer ${config.apiKey}`,
		},
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Get task failed (${res.status}): ${body}`);
	}

	return (await res.json()) as TaskResult;
}

async function waitForTask(config: ReturnType<typeof getConfig>, taskId: string): Promise<TaskResult> {
	for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
		const result = await getTask(config, taskId);
		const elapsed = ((i + 1) * POLL_INTERVAL_MS) / 1000;

		if (result.status === "succeeded") {
			console.log(`  ✓ Task succeeded after ${elapsed}s`);
			if (result.usage) {
				console.log(`  Tokens: ${result.usage.total_tokens.toLocaleString()}`);
			}
			return result;
		}

		if (result.status === "failed") {
			throw new Error(`Task failed: ${result.error?.code} — ${result.error?.message}`);
		}

		if (result.status === "expired") {
			throw new Error("Task expired (took too long in queue)");
		}

		if (result.status === "cancelled") {
			throw new Error("Task was cancelled");
		}

		process.stdout.write(`  [${elapsed}s] ${result.status}...\r`);
		await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
	}

	throw new Error(`Task did not complete within ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`);
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Download failed (${res.status})`);

	const buffer = Buffer.from(await res.arrayBuffer());
	const dir = path.dirname(outputPath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(outputPath, buffer);

	const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
	console.log(`  Saved: ${outputPath} (${sizeMB} MB)`);
}

function imageToBase64Url(imagePath: string): string {
	const ext = path.extname(imagePath).toLowerCase().replace(".", "");
	const mime = ext === "jpg" ? "jpeg" : ext;
	const data = fs.readFileSync(imagePath);
	return `data:image/${mime};base64,${data.toString("base64")}`;
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdT2V(opts: {
	prompt: string;
	output: string;
	ratio: string;
	duration: number;
	resolution: string;
	audio: boolean;
	draft: boolean;
	seed: number;
	lastFrame: boolean;
}) {
	const config = getConfig();
	console.log(`Model: ${config.model}`);
	console.log(`Prompt: ${opts.prompt.substring(0, 80)}...`);
	console.log(`Output: ${opts.ratio} ${opts.resolution} ${opts.duration}s ${opts.audio ? "audio" : "silent"} ${opts.draft ? "(draft)" : ""}`);

	const taskId = await createTask(config, {
		model: config.model,
		content: [{ type: "text", text: opts.prompt }],
		ratio: opts.ratio,
		duration: opts.duration,
		resolution: opts.resolution,
		generate_audio: opts.audio,
		watermark: false,
		seed: opts.seed,
		draft: opts.draft,
		return_last_frame: opts.lastFrame,
	});
	console.log(`Task: ${taskId}`);

	const result = await waitForTask(config, taskId);
	if (result.content?.video_url) {
		await downloadVideo(result.content.video_url, opts.output);
	}
	if (result.content?.last_frame_url) {
		const lfPath = opts.output.replace(/\.mp4$/, "-lastframe.png");
		await downloadVideo(result.content.last_frame_url, lfPath);
	}
}

async function cmdI2V(opts: {
	prompt: string;
	image: string;
	lastImage?: string;
	output: string;
	ratio: string;
	duration: number;
	resolution: string;
	audio: boolean;
	draft: boolean;
	seed: number;
	lastFrame: boolean;
}) {
	const config = getConfig();
	console.log(`Model: ${config.model}`);
	console.log(`Image: ${opts.image}${opts.lastImage ? ` → ${opts.lastImage}` : ""}`);
	console.log(`Prompt: ${opts.prompt.substring(0, 80)}...`);

	const content: ContentItem[] = [{ type: "text", text: opts.prompt }];

	// First frame
	const firstUrl = opts.image.startsWith("http") ? opts.image : imageToBase64Url(opts.image);
	content.push({
		type: "image_url",
		image_url: { url: firstUrl },
		...(opts.lastImage ? { role: "first_frame" as const } : {}),
	});

	// Last frame (optional)
	if (opts.lastImage) {
		const lastUrl = opts.lastImage.startsWith("http") ? opts.lastImage : imageToBase64Url(opts.lastImage);
		content.push({
			type: "image_url",
			image_url: { url: lastUrl },
			role: "last_frame",
		});
	}

	const taskId = await createTask(config, {
		model: config.model,
		content,
		ratio: opts.ratio,
		duration: opts.duration,
		resolution: opts.resolution,
		generate_audio: opts.audio,
		watermark: false,
		seed: opts.seed,
		draft: opts.draft,
		return_last_frame: opts.lastFrame,
	});
	console.log(`Task: ${taskId}`);

	const result = await waitForTask(config, taskId);
	if (result.content?.video_url) {
		await downloadVideo(result.content.video_url, opts.output);
	}
	if (result.content?.last_frame_url) {
		const lfPath = opts.output.replace(/\.mp4$/, "-lastframe.png");
		await downloadVideo(result.content.last_frame_url, lfPath);
	}
}

interface StoryboardShot {
	id: string;
	image_prompt: string;
	video_prompt: string;
	image_path?: string; // Pre-generated image to use as first frame
	duration?: number;
}

interface Storyboard {
	title: string;
	ratio: string;
	resolution: string;
	audio: boolean;
	shots: StoryboardShot[];
}

async function cmdBatch(opts: { storyboard: string; outputDir: string; draft: boolean }) {
	const config = getConfig();
	const storyboardDir = path.dirname(path.resolve(opts.storyboard));
	const sb: Storyboard = JSON.parse(fs.readFileSync(opts.storyboard, "utf-8"));

	console.log(`=== ${sb.title} ===`);
	console.log(`Shots: ${sb.shots.length}, ${sb.ratio} ${sb.resolution} ${sb.audio ? "audio" : "silent"}`);

	if (!fs.existsSync(opts.outputDir)) fs.mkdirSync(opts.outputDir, { recursive: true });

	for (const shot of sb.shots) {
		console.log(`\n--- Shot ${shot.id} ---`);
		const outputPath = path.join(opts.outputDir, `${shot.id}.mp4`);

		if (fs.existsSync(outputPath)) {
			console.log(`  Skipping (already exists): ${outputPath}`);
			continue;
		}

		const content: ContentItem[] = [{ type: "text", text: shot.video_prompt }];

		// If pre-generated image exists, use it as first frame
		// Resolve image_path relative to storyboard.json location
		const imagePath = shot.image_path ? path.resolve(storyboardDir, shot.image_path) : null;
		if (imagePath && fs.existsSync(imagePath)) {
			console.log(`  First frame: ${imagePath}`);
			content.push({
				type: "image_url",
				image_url: { url: imageToBase64Url(imagePath) },
			});
		} else {
			console.log(`  Text-to-video (no first frame image)`);
		}

		const taskId = await createTask(config, {
			model: config.model,
			content,
			ratio: sb.ratio,
			duration: shot.duration || 5,
			resolution: sb.resolution,
			generate_audio: sb.audio,
			watermark: false,
			draft: opts.draft,
			return_last_frame: true,
		});
		console.log(`  Task: ${taskId}`);

		const result = await waitForTask(config, taskId);
		if (result.content?.video_url) {
			await downloadVideo(result.content.video_url, outputPath);
		}
		if (result.content?.last_frame_url) {
			const lfPath = path.join(opts.outputDir, `${shot.id}-lastframe.png`);
			await downloadVideo(result.content.last_frame_url, lfPath);
		}
	}

	console.log(`\n=== Done. ${sb.shots.length} clips in ${opts.outputDir} ===`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const program = new Command();

program
	.name("seedance-generate")
	.description("Generate videos via Seedance API (火山方舟 / BytePlus)")
	.version("1.0.0");

program
	.command("t2v")
	.description("Text-to-video generation")
	.requiredOption("-p, --prompt <text>", "Video generation prompt")
	.requiredOption("-o, --output <path>", "Output video path (.mp4)")
	.option("-r, --ratio <ratio>", "Aspect ratio", "9:16")
	.option("-d, --duration <seconds>", "Duration in seconds", "5")
	.option("--resolution <res>", "Resolution: 480p, 720p, 1080p", "1080p")
	.option("--audio", "Generate audio (Seedance 1.5 Pro only)", false)
	.option("--draft", "Draft mode (480p preview, cheaper)", false)
	.option("--seed <n>", "Seed (-1 = random)", "-1")
	.option("--last-frame", "Return last frame image", false)
	.action((opts) =>
		cmdT2V({
			...opts,
			duration: Number.parseInt(opts.duration),
			seed: Number.parseInt(opts.seed),
		})
	);

program
	.command("i2v")
	.description("Image-to-video generation")
	.requiredOption("-p, --prompt <text>", "Video generation prompt")
	.requiredOption("-i, --image <path>", "First frame image (file path or URL)")
	.requiredOption("-o, --output <path>", "Output video path (.mp4)")
	.option("--last-image <path>", "Last frame image (for first+last frame mode)")
	.option("-r, --ratio <ratio>", "Aspect ratio", "adaptive")
	.option("-d, --duration <seconds>", "Duration in seconds", "5")
	.option("--resolution <res>", "Resolution: 480p, 720p, 1080p", "1080p")
	.option("--audio", "Generate audio (Seedance 1.5 Pro only)", false)
	.option("--draft", "Draft mode (480p preview, cheaper)", false)
	.option("--seed <n>", "Seed (-1 = random)", "-1")
	.option("--last-frame", "Return last frame image", false)
	.action((opts) =>
		cmdI2V({
			...opts,
			duration: Number.parseInt(opts.duration),
			seed: Number.parseInt(opts.seed),
		})
	);

program
	.command("batch")
	.description("Batch generate from storyboard JSON")
	.requiredOption("-s, --storyboard <path>", "Storyboard JSON file")
	.requiredOption("-o, --output-dir <dir>", "Output directory for clips")
	.option("--draft", "Draft mode for all shots", false)
	.action(cmdBatch);

program
	.command("describe")
	.description("Describe what this tool does")
	.action(() => {
		console.log(`
seedance-generate — Automated video generation via Seedance API

Supports three modes:
  t2v    Text-to-video: Generate video from a text prompt
  i2v    Image-to-video: Generate video from a first frame image + prompt
  batch  Batch mode: Generate multiple clips from a storyboard JSON file

API: Uses 火山方舟 or BytePlus ModelArk Video Generation API.
Auth: Set ARK_API_KEY environment variable.
Models: Seedance 1.5 Pro (default), 1.0 Pro, 1.0 Pro Fast, 1.0 Lite.

Storyboard JSON format:
{
  "title": "Video title",
  "ratio": "9:16",
  "resolution": "1080p",
  "audio": false,
  "shots": [
    {
      "id": "01",
      "image_prompt": "Prompt for generating the static image (for reference)",
      "video_prompt": "Prompt for video generation",
      "image_path": "path/to/first-frame.png",
      "duration": 5
    }
  ]
}
`);
	});

program.parse();
