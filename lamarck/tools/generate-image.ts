#!/usr/bin/env npx tsx
/**
 * Generate images using OpenRouter API.
 *
 * Outputs the image file path to stdout.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";

const DEFAULT_MODEL = "google/gemini-3-pro-image-preview";

interface OpenRouterResponse {
	choices: Array<{
		message: {
			content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
			images?: Array<{
				type: string;
				image_url: { url: string };
			}>;
		};
	}>;
	error?: { message: string };
}

function imageToBase64(filePath: string): { data: string; mimeType: string } {
	const ext = path.extname(filePath).toLowerCase();
	const mimeMap: Record<string, string> = {
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".png": "image/png",
		".gif": "image/gif",
		".webp": "image/webp",
	};
	const mimeType = mimeMap[ext] || "image/png";
	const data = fs.readFileSync(filePath).toString("base64");
	return { data, mimeType };
}

async function generateImage(
	prompt: string,
	model: string,
	apiKey: string,
	referenceImage?: string
): Promise<{ imageData: string; mimeType: string }> {
	// Build message content
	let messageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

	if (referenceImage) {
		// Image-to-image: use array format
		if (!fs.existsSync(referenceImage)) {
			throw new Error(`Reference image not found: ${referenceImage}`);
		}
		const { data, mimeType } = imageToBase64(referenceImage);
		messageContent = [
			{
				type: "image_url",
				image_url: { url: `data:${mimeType};base64,${data}` },
			},
			{ type: "text", text: prompt },
		];
	} else {
		// Text-to-image: use string format
		messageContent = prompt;
	}

	const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			modalities: ["text", "image"],
			messages: [
				{
					role: "user",
					content: messageContent,
				},
			],
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`API error: ${response.status} ${text}`);
	}

	const data = (await response.json()) as OpenRouterResponse;

	if (data.error) {
		throw new Error(`API error: ${data.error.message}`);
	}

	const message = data.choices?.[0]?.message;
	if (!message) {
		throw new Error("No message in response");
	}

	// Check images array first (new format)
	if (message.images && message.images.length > 0) {
		const url = message.images[0].image_url?.url;
		if (url) {
			const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
			if (match) {
				return { mimeType: match[1], imageData: match[2] };
			}
		}
	}

	// Fallback: check content array (old format)
	if (Array.isArray(message.content)) {
		for (const part of message.content) {
			if (part.type === "image_url" && part.image_url?.url) {
				const url = part.image_url.url;
				const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
				if (match) {
					return { mimeType: match[1], imageData: match[2] };
				}
			}
		}
	}

	throw new Error("No image found in response");
}

function getApiKey(): string {
	// Check environment variable
	if (process.env.OPENROUTER_API_KEY) {
		return process.env.OPENROUTER_API_KEY;
	}

	// Check .env file in project root
	const envPath = path.join(import.meta.dirname!, "..", "..", ".env");
	if (fs.existsSync(envPath)) {
		const envContent = fs.readFileSync(envPath, "utf-8");
		const match = envContent.match(/^OPENROUTER_API_KEY=(.+)$/m);
		if (match) {
			return match[1].trim();
		}
	}

	throw new Error("OPENROUTER_API_KEY not found in environment or .env file");
}

const program = new Command()
	.name("generate-image")
	.description("Generate images using OpenRouter API. Outputs image file path to stdout.")
	.argument("<prompt>", "Image generation prompt")
	.option("-m, --model <model>", `Model to use`, DEFAULT_MODEL)
	.option("-r, --reference <image>", "Reference image for image-to-image generation")
	.option("-o, --output <file>", "Output file path (default: auto-generated)")
	.option("-d, --output-dir <dir>", "Output directory (default: current directory)")
	.action(
		async (
			prompt: string,
			opts: { model: string; reference?: string; output?: string; outputDir?: string }
		) => {
			try {
				const apiKey = getApiKey();
				const { imageData, mimeType } = await generateImage(prompt, opts.model, apiKey, opts.reference);

				// Determine output path
				const ext = mimeType.split("/")[1] || "png";
				let outputPath: string;

				if (opts.output) {
					outputPath = opts.output;
				} else {
					const timestamp = Date.now();
					const filename = `image_${timestamp}.${ext}`;
					const dir = opts.outputDir || process.cwd();
					fs.mkdirSync(dir, { recursive: true });
					outputPath = path.join(dir, filename);
				}

				// Write image
				fs.writeFileSync(outputPath, Buffer.from(imageData, "base64"));
				console.log(outputPath);
			} catch (err) {
				console.error(`Error: ${err instanceof Error ? err.message : err}`);
				process.exit(1);
			}
		}
	);

program.parse();
