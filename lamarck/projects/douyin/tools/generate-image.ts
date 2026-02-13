/**
 * AI image generation CLI via AI Horde (free, no API key needed).
 *
 * Usage:
 *   npx tsx tools/generate-image.ts "cyberpunk terminal" -o bg.png
 *   npx tsx tools/generate-image.ts "coding workspace dark" --width 1080 --height 1920 -o bg.png
 *   npx tsx tools/generate-image.ts --describe
 */
import { Command } from "commander";
import { generateImage } from "./lib/ai-horde.js";

const program = new Command();
program
  .name("generate-image")
  .description("Generate AI images via AI Horde (free, no auth)")
  .argument("[prompt]", "Image generation prompt")
  .option("-o, --output <path>", "Output path", "generated.png")
  .option("-W, --width <n>", "Output width", "1080")
  .option("-H, --height <n>", "Output height", "1920")
  .option("--describe", "Describe what this tool does")
  .action(async (prompt: string | undefined, opts) => {
    if (opts.describe) {
      console.log(
        "generate-image: Generates images using AI Horde (free Stable Diffusion API).\n" +
          "No API key needed. Max native resolution 576x576 (upscaled via ffmpeg).\n" +
          "Typical wait: 10-60s depending on queue.\n" +
          "Good for: video backgrounds, scene illustrations, tech-themed imagery."
      );
      return;
    }

    if (!prompt) {
      console.error("Error: prompt required. Usage: npx tsx tools/generate-image.ts 'your prompt'");
      process.exit(1);
    }

    await generateImage(
      prompt,
      opts.output,
      Number.parseInt(opts.width),
      Number.parseInt(opts.height),
    );
  });

program.parse();
