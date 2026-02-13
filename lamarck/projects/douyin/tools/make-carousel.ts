/**
 * Generate carousel (图文笔记) images for Douyin.
 *
 * Takes a JSON spec with pages, each having text lines and optional bg prompt.
 * Renders text onto backgrounds using ffmpeg drawtext.
 *
 * Usage:
 *   npx tsx tools/make-carousel.ts --input spec.json --output-dir ./output
 *   npx tsx tools/make-carousel.ts --describe
 */
import { execFileSync } from "child_process";
import { readFile, mkdir } from "fs/promises";
import { join } from "path";
import { Command } from "commander";
import { generateImage } from "./lib/ai-horde.js";

const FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc";
const WIDTH = 1080;
const HEIGHT = 1440; // 3:4 ratio for Douyin carousel

interface TextBlock {
  text: string;
  fontSize?: number;
  color?: string;
  /** "center" | "left" */
  align?: string;
  /** Extra top margin for this block */
  marginTop?: number;
  bold?: boolean;
}

interface CarouselPage {
  /** Text blocks to render */
  blocks: TextBlock[];
  /** AI prompt for background (optional, defaults to solid color) */
  bgPrompt?: string;
  /** Background color hex (used if no bgPrompt) */
  bgColor?: string;
}

interface CarouselSpec {
  pages: CarouselPage[];
  /** Default background color */
  defaultBgColor?: string;
  /** Default text color */
  defaultTextColor?: string;
  /** Default font size */
  defaultFontSize?: number;
}

function escapeFFmpegText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\u2019")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/%/g, "%%")
    .replace(/;/g, "\\;");
}

function renderPage(
  bgPath: string,
  blocks: TextBlock[],
  outputPath: string,
  defaultColor: string,
  defaultFontSize: number,
): void {
  const filters: string[] = [];
  let yPos = 180; // start from top with padding

  for (const block of blocks) {
    const fontSize = block.fontSize || defaultFontSize;
    const color = block.color || defaultColor;
    const align = block.align || "center";
    const marginTop = block.marginTop || 0;
    yPos += marginTop;

    const lines = block.text.split("\n");
    for (const line of lines) {
      if (line.trim() === "") {
        yPos += fontSize * 0.8;
        continue;
      }
      const escaped = escapeFFmpegText(line);
      const xExpr = align === "center" ? "(w-text_w)/2" : "80";

      // Shadow
      filters.push(
        `drawtext=text='${escaped}':fontcolor=#000000@0.6:fontsize=${fontSize}:x=${xExpr}+2:y=${yPos + 2}:fontfile=${FONT}`
      );
      // Text
      filters.push(
        `drawtext=text='${escaped}':fontcolor=#${color}:fontsize=${fontSize}:x=${xExpr}:y=${yPos}:fontfile=${FONT}`
      );
      yPos += Math.floor(fontSize * 1.5);
    }
    yPos += 20; // gap between blocks
  }

  const filterStr = filters.join(",");

  execFileSync("ffmpeg", [
    "-y",
    "-i", bgPath,
    "-vf", filterStr || "null",
    "-frames:v", "1",
    outputPath,
  ]);
}

async function makeCarousel(specPath: string, outputDir: string): Promise<void> {
  const spec: CarouselSpec = JSON.parse(await readFile(specPath, "utf-8"));
  await mkdir(outputDir, { recursive: true });

  const defaultBg = spec.defaultBgColor || "0f0f1a";
  const defaultColor = spec.defaultTextColor || "e8e8e8";
  const defaultFontSize = spec.defaultFontSize || 48;

  console.log(`Generating ${spec.pages.length} carousel pages`);

  for (let i = 0; i < spec.pages.length; i++) {
    const page = spec.pages[i];
    const bgColor = page.bgColor || defaultBg;
    const outputPath = join(outputDir, `page-${String(i + 1).padStart(2, "0")}.png`);

    console.log(`\n--- Page ${i + 1}/${spec.pages.length} ---`);

    let bgPath: string;
    if (page.bgPrompt) {
      bgPath = join(outputDir, `bg-${i}.png`);
      await generateImage(page.bgPrompt, bgPath, WIDTH, HEIGHT);
      // Darken for text readability
      const darkenedPath = join(outputDir, `bg-${i}-dark.png`);
      execFileSync("ffmpeg", [
        "-y", "-i", bgPath,
        "-vf", "eq=brightness=-0.2:saturation=0.8",
        darkenedPath,
      ]);
      bgPath = darkenedPath;
    } else {
      bgPath = join(outputDir, `bg-${i}-solid.png`);
      execFileSync("ffmpeg", [
        "-y", "-f", "lavfi",
        "-i", `color=c=#${bgColor}:s=${WIDTH}x${HEIGHT}:d=1`,
        "-frames:v", "1",
        bgPath,
      ]);
    }

    renderPage(bgPath, page.blocks, outputPath, defaultColor, defaultFontSize);
    console.log(`Saved: ${outputPath}`);
  }

  console.log(`\nDone! ${spec.pages.length} pages in ${outputDir}`);
}

const program = new Command();
program
  .name("make-carousel")
  .description("Generate Douyin carousel (图文笔记) images")
  .option("-i, --input <path>", "Input spec JSON file")
  .option("-o, --output-dir <path>", "Output directory", "./output")
  .option("--describe", "Describe what this tool does")
  .action(async (opts) => {
    if (opts.describe) {
      console.log(
        "make-carousel: Generates multi-page image carousel for Douyin.\n" +
        "Each page can have AI-generated or solid color background.\n" +
        "Text rendered with shadow for readability.\n" +
        "Output: numbered PNG files at 1080x1440 (3:4 ratio)."
      );
      return;
    }
    if (!opts.input) {
      console.error("Error: --input required");
      process.exit(1);
    }
    await makeCarousel(opts.input, opts.outputDir);
  });

program.parse();
