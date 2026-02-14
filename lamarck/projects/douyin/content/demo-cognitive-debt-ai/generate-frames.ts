/**
 * Generate first-frame images for the cognitive debt AI video storyboard
 * using AI Horde (free, no API key needed).
 */
import { generateImage } from "../../tools/lib/ai-horde.ts";
import * as path from "node:path";
import * as fs from "node:fs";

const FRAMES_DIR = path.join(import.meta.dirname!, "frames");

// English prompts for Stable Diffusion (AI Horde)
// These are different from the Chinese storyboard prompts (which are for Seedance)
const frames = [
	{
		id: "01",
		prompt:
			"young asian woman sitting at modern desk, looking at laptop screen with confused expression, slight frown, afternoon warm sunlight from window behind, coffee cup and scattered notes on desk, warm soft illustration style, cream and light brown tones, natural light, medium shot, high quality, detailed face",
	},
	{
		id: "02",
		prompt:
			"overhead view of clean wooden desk, open research papers with highlighted text and colorful sticky notes, pair of glasses, cup of tea with steam, academic but warm atmosphere, soft natural light from above, warm illustration style, cream and light blue tones, high quality, detailed",
	},
	{
		id: "03",
		prompt:
			"conceptual illustration of balance scale, left side has soft glowing human brain, right side has glowing AI chip, brain side rising up becoming lighter, AI side sinking down, warm cream background, clean modern illustration style, warm tones with coral red accent, high quality, no text",
	},
	{
		id: "04",
		prompt:
			"warm illustration of human and friendly robot working side by side at shared desk, human thinking deeply chin on hand, robot processing data on screen, bright tidy workspace with plants and natural light, warm friendly illustration style, cream and sage green tones, high quality, detailed",
	},
	{
		id: "05",
		prompt:
			"cute friendly cartoon robot character, round blue head, small antenna on top, warm smile, pink cheeks, sitting at cozy desk with warm lamp books and small plant, one hand waving hello, kawaii illustration style, warm cream background, soft lighting, high quality, detailed",
	},
];

async function main() {
	if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

	for (const frame of frames) {
		const outputPath = path.join(FRAMES_DIR, `${frame.id}.png`);
		if (fs.existsSync(outputPath)) {
			console.log(`Skipping ${frame.id} (already exists)`);
			continue;
		}
		console.log(`\n=== Frame ${frame.id} ===`);
		try {
			await generateImage(frame.prompt, outputPath, 576, 576);
		} catch (e) {
			console.error(`Failed to generate frame ${frame.id}:`, (e as Error).message);
		}
	}

	console.log("\n=== Done ===");
}

main();
