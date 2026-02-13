/**
 * Text-to-Video tool.
 *
 * Takes a script (text with sections) and produces a video with:
 * - TTS voiceover (Edge TTS)
 * - Text overlay with fade animations
 * - Background: solid color, gradient, or custom image
 *
 * Usage:
 *   npx tsx tools/text-to-video.ts --input script.json --output output.mp4
 *   npx tsx tools/text-to-video.ts --help
 *   npx tsx tools/text-to-video.ts --describe
 */
import { execFile, execFileSync } from "child_process";
import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import { Command } from "commander";

interface ScriptSection {
  /** Text to display on screen */
  displayText: string;
  /** Text for TTS voiceover (can differ from display text) */
  voiceoverText: string;
  /** Duration override in seconds (auto-calculated from TTS if not set) */
  duration?: number;
  /** Background image path (optional, overrides global background for this section) */
  bgImage?: string;
}

type BgStyle =
  | "solid"
  | "gradient"          // vertical gradient using bgColor → bgColorEnd
  | "gradient-shift"    // slowly shifting gradient (animated)
  | "vignette";         // solid with dark vignette edges

interface VideoScript {
  title: string;
  sections: ScriptSection[];
  width?: number;
  height?: number;
  voice?: string;
  /** Primary background color (hex without #) */
  bgColor?: string;
  /** Secondary background color for gradients (hex without #) */
  bgColorEnd?: string;
  /** Background style */
  bgStyle?: BgStyle;
  /** Text color (hex without #) */
  textColor?: string;
  fontSize?: number;
}

const PYTHON_PATH = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";
const FONT_FILE = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc";

async function synthesizeTTS(
  text: string,
  voice: string,
  outputPath: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    execFile(
      PYTHON_PATH,
      ["-m", "edge_tts", "--voice", voice, "--text", text, "--write-media", outputPath],
      { timeout: 30000 },
      (error) => {
        if (error) return reject(error);
        try {
          const result = execFileSync("ffprobe", [
            "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            outputPath,
          ]).toString().trim();
          resolve(parseFloat(result));
        } catch {
          resolve(3);
        }
      }
    );
  });
}

function escapeFFmpegText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "'\\''")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

/** Parse hex color string to RGB components */
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/**
 * Build ffmpeg background source args and any pre-text video filters.
 * Returns [inputArgs, preFilters] where preFilters may be empty.
 */
function buildBackground(
  section: ScriptSection,
  width: number,
  height: number,
  duration: number,
  bgColor: string,
  bgColorEnd: string,
  bgStyle: BgStyle,
): { inputArgs: string[]; preFilters: string[] } {
  // Per-section background image takes priority
  if (section.bgImage) {
    return {
      inputArgs: ["-loop", "1", "-i", section.bgImage],
      preFilters: [
        `scale=${width}:${height}:force_original_aspect_ratio=increase`,
        `crop=${width}:${height}`,
        `eq=brightness=-0.15`, // darken for text readability
      ],
    };
  }

  const c1 = hexToRGB(bgColor);
  const c2 = hexToRGB(bgColorEnd);

  switch (bgStyle) {
    case "gradient": {
      // Static vertical gradient using geq filter
      // Interpolate from c1 (top) to c2 (bottom)
      const rExpr = `${c1.r}+(${c2.r}-${c1.r})*Y/H`;
      const gExpr = `${c1.g}+(${c2.g}-${c1.g})*Y/H`;
      const bExpr = `${c1.b}+(${c2.b}-${c1.b})*Y/H`;
      return {
        inputArgs: [
          "-f", "lavfi",
          "-i", `color=c=black:s=${width}x${height}:d=${duration.toFixed(2)}:r=30`,
        ],
        preFilters: [
          `geq=r='${rExpr}':g='${gExpr}':b='${bExpr}'`,
        ],
      };
    }

    case "gradient-shift": {
      // Animated gradient that slowly breathes over time
      // Mix factor oscillates based on Y position + time
      const mix = `(0.5+0.2*sin(2*PI*Y/H+T*0.5))`;
      const rExpr = `clip(${c1.r}+(${c2.r}-${c1.r})*${mix}\\,0\\,255)`;
      const gExpr = `clip(${c1.g}+(${c2.g}-${c1.g})*${mix}\\,0\\,255)`;
      const bExpr = `clip(${c1.b}+(${c2.b}-${c1.b})*${mix}\\,0\\,255)`;
      return {
        inputArgs: [
          "-f", "lavfi",
          "-i", `color=c=black:s=${width}x${height}:d=${duration.toFixed(2)}:r=30`,
        ],
        preFilters: [
          `geq=r='${rExpr}':g='${gExpr}':b='${bExpr}'`,
        ],
      };
    }

    case "vignette": {
      // Solid color with vignette darkening at edges
      return {
        inputArgs: [
          "-f", "lavfi",
          "-i", `color=c=#${bgColor}:s=${width}x${height}:d=${duration.toFixed(2)}:r=30`,
        ],
        preFilters: [
          `vignette=angle=PI/4:mode=forward`,
        ],
      };
    }

    case "solid":
    default:
      return {
        inputArgs: [
          "-f", "lavfi",
          "-i", `color=c=#${bgColor}:s=${width}x${height}:d=${duration.toFixed(2)}:r=30`,
        ],
        preFilters: [],
      };
  }
}

function buildTextFilters(
  lines: string[],
  fontSize: number,
  textColor: string,
  height: number,
  sectionDuration: number,
): string {
  const fadeIn = 0.5;
  const fadeOut = 0.5;
  const endFadeStart = (sectionDuration - fadeOut).toFixed(2);
  const dur = sectionDuration.toFixed(2);
  // Alpha expression: fade in, hold, fade out
  const alphaExpr =
    `if(lt(t\\,${fadeIn})\\,t/${fadeIn}\\,if(gt(t\\,${endFadeStart})\\,(${dur}-t)/${fadeOut}\\,1))`;

  return lines.flatMap((line, lineIdx) => {
    const yPos = Math.floor(height / 2) - ((lines.length * fontSize * 1.5) / 2) + lineIdx * fontSize * 1.5;
    const escaped = escapeFFmpegText(line);
    return [
      // Shadow
      `drawtext=text='${escaped}':fontcolor=#000000:alpha='${alphaExpr}*0.5':fontsize=${fontSize}:x=(w-text_w)/2+3:y=${yPos}+3:fontfile=${FONT_FILE}`,
      // Text
      `drawtext=text='${escaped}':fontcolor=#${textColor}:alpha='${alphaExpr}':fontsize=${fontSize}:x=(w-text_w)/2:y=${yPos}:fontfile=${FONT_FILE}`,
    ];
  }).join(",");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  // Split on explicit newlines first
  for (const paragraph of text.split("\n")) {
    let remaining = paragraph;
    while (remaining.length > 0) {
      if (remaining.length <= maxCharsPerLine) {
        lines.push(remaining);
        break;
      }
      let breakAt = maxCharsPerLine;
      const punctuation = remaining.slice(0, maxCharsPerLine + 5).search(/[，。！？、；\s]/g);
      if (punctuation > 0 && punctuation <= maxCharsPerLine + 2) {
        breakAt = punctuation + 1;
      }
      lines.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt);
    }
  }
  return lines;
}

async function generateVideo(
  script: VideoScript,
  outputPath: string
): Promise<void> {
  const workDir = join(tmpdir(), `video-${randomBytes(8).toString("hex")}`);
  await mkdir(workDir, { recursive: true });

  const width = script.width || 1080;
  const height = script.height || 1920;
  const voice = script.voice || "zh-CN-XiaoxiaoNeural";
  const bgColor = script.bgColor || "1a1a2e";
  const bgColorEnd = script.bgColorEnd || "16213e";
  const bgStyle = script.bgStyle || "solid";
  const textColor = script.textColor || "ffffff";
  const fontSize = script.fontSize || 48;

  console.log(`Generating video: ${script.title}`);
  console.log(`Dimensions: ${width}x${height}, Voice: ${voice}, BG: ${bgStyle}`);
  console.log(`Sections: ${script.sections.length}`);

  const segmentPaths: string[] = [];
  const maxCharsPerLine = Math.floor(width / (fontSize * 0.7));

  for (let i = 0; i < script.sections.length; i++) {
    const section = script.sections[i];
    console.log(`\n--- Section ${i + 1}/${script.sections.length} ---`);
    console.log(`Display: ${section.displayText.slice(0, 60)}...`);

    // 1. Generate TTS audio
    const audioPath = join(workDir, `section-${i}.mp3`);
    const duration = await synthesizeTTS(section.voiceoverText, voice, audioPath);
    const sectionDuration = section.duration || duration + 0.5;
    console.log(`Audio duration: ${duration.toFixed(1)}s`);

    // 2. Build video segment
    const segmentPath = join(workDir, `segment-${i}.mp4`);
    const lines = wrapText(section.displayText, maxCharsPerLine);

    const { inputArgs, preFilters } = buildBackground(
      section, width, height, sectionDuration, bgColor, bgColorEnd, bgStyle,
    );

    const textFilters = buildTextFilters(lines, fontSize, textColor, height, sectionDuration);
    const allFilters = [...preFilters, textFilters].filter(Boolean).join(",");

    const ffmpegArgs: string[] = [
      "-y",
      ...inputArgs,
      "-i", audioPath,
      "-vf", allFilters || "null",
    ];

    // For background images, need explicit duration
    if (section.bgImage) {
      ffmpegArgs.push("-t", sectionDuration.toFixed(2));
    }

    ffmpegArgs.push(
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-c:a", "aac",
      "-shortest",
      segmentPath,
    );

    await new Promise<void>((resolve, reject) => {
      execFile("ffmpeg", ffmpegArgs, { timeout: 60000 }, (error, _stdout, stderr) => {
        if (error) {
          console.error("[ffmpeg stderr]", stderr?.slice(-500));
          reject(error);
        } else {
          resolve();
        }
      });
    });

    segmentPaths.push(segmentPath);
  }

  // 3. Concatenate segments
  console.log("\n--- Concatenating segments ---");

  if (segmentPaths.length === 1) {
    await new Promise<void>((resolve, reject) => {
      execFile("ffmpeg", ["-y", "-i", segmentPaths[0], "-c", "copy", outputPath],
        { timeout: 60000 }, (error) => { if (error) reject(error); else resolve(); });
    });
  } else {
    const concatFile = join(workDir, "concat.txt");
    const concatContent = segmentPaths.map((p) => `file '${p}'`).join("\n");
    await writeFile(concatFile, concatContent);

    await new Promise<void>((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-y",
          "-f", "concat",
          "-safe", "0",
          "-i", concatFile,
          "-c:v", "libx264",
          "-preset", "fast",
          "-c:a", "aac",
          outputPath,
        ],
        { timeout: 120000 },
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  }

  await rm(workDir, { recursive: true, force: true });
  console.log(`\nVideo saved to: ${outputPath}`);
}

// CLI
const program = new Command();
program
  .name("text-to-video")
  .description("Generate video from script with TTS voiceover")
  .option("-i, --input <path>", "Input script JSON file")
  .option("-o, --output <path>", "Output video path", "output.mp4")
  .option("--describe", "Describe what this tool does")
  .action(async (opts) => {
    if (opts.describe) {
      console.log(
        "text-to-video: Converts a JSON script into a video with TTS voiceover.\n" +
        "Each section gets its own TTS audio and text overlay.\n" +
        "Background styles: solid, gradient, gradient-shift, vignette.\n" +
        "Per-section background images supported via bgImage field.\n" +
        "Requires: ffmpeg, Python edge-tts, fonts-noto-cjk."
      );
      return;
    }

    if (!opts.input) {
      const demoScript: VideoScript = {
        title: "Demo Video",
        bgStyle: "gradient",
        bgColor: "1a1a2e",
        bgColorEnd: "16213e",
        sections: [
          {
            displayText: "你好，欢迎观看",
            voiceoverText: "你好，欢迎观看这个演示视频。",
          },
          {
            displayText: "这是一个AI自动生成的视频",
            voiceoverText: "这是一个由AI完全自动生成的视频，包括配音和画面。",
          },
          {
            displayText: "感谢观看！",
            voiceoverText: "感谢您的观看，我们下期再见！",
          },
        ],
      };

      await generateVideo(demoScript, opts.output);
      return;
    }

    const scriptContent = await readFile(opts.input, "utf-8");
    const script: VideoScript = JSON.parse(scriptContent);
    await generateVideo(script, opts.output);
  });

program.parse();
