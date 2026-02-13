/**
 * Text-to-Video prototype.
 *
 * Takes a script (text with sections) and produces a video with:
 * - TTS voiceover (Edge TTS)
 * - Simple text overlay on solid background
 * - Background music (optional)
 *
 * This is a minimal prototype for testing the pipeline.
 * Production version would use AI-generated images/videos as background.
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
  /** Background image path (optional, overrides bgColor for this section) */
  bgImage?: string;
}

interface VideoScript {
  title: string;
  sections: ScriptSection[];
  /** Video dimensions */
  width?: number;
  height?: number;
  /** TTS voice */
  voice?: string;
  /** Background color (hex) */
  bgColor?: string;
  /** Text color (hex) */
  textColor?: string;
  /** Font size */
  fontSize?: number;
}

const PYTHON_PATH = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";

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
        // Get duration with ffprobe
        try {
          const result = execFileSync("ffprobe", [
            "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            outputPath,
          ]).toString().trim();
          resolve(parseFloat(result));
        } catch {
          resolve(3); // fallback
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
  const textColor = script.textColor || "ffffff";
  const fontSize = script.fontSize || 48;

  console.log(`Generating video: ${script.title}`);
  console.log(`Dimensions: ${width}x${height}, Voice: ${voice}`);
  console.log(`Sections: ${script.sections.length}`);

  const segmentPaths: string[] = [];

  for (let i = 0; i < script.sections.length; i++) {
    const section = script.sections[i];
    console.log(`\n--- Section ${i + 1}/${script.sections.length} ---`);
    console.log(`Display: ${section.displayText.slice(0, 60)}...`);

    // 1. Generate TTS audio
    const audioPath = join(workDir, `section-${i}.mp3`);
    const duration = await synthesizeTTS(section.voiceoverText, voice, audioPath);
    const sectionDuration = section.duration || duration + 0.5; // add small padding
    console.log(`Audio duration: ${duration.toFixed(1)}s`);

    // 2. Generate video segment with text overlay
    const segmentPath = join(workDir, `segment-${i}.mp4`);

    // Wrap display text for multi-line
    const maxCharsPerLine = Math.floor(width / (fontSize * 0.7));
    const lines: string[] = [];
    let remaining = section.displayText;
    while (remaining.length > 0) {
      if (remaining.length <= maxCharsPerLine) {
        lines.push(remaining);
        break;
      }
      // Find a good break point
      let breakAt = maxCharsPerLine;
      const punctuation = remaining.slice(0, maxCharsPerLine + 5).search(/[，。！？、；\s]/g);
      if (punctuation > 0 && punctuation <= maxCharsPerLine + 2) {
        breakAt = punctuation + 1;
      }
      lines.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt);
    }

    // Build text overlay filters with shadow for readability
    const fontFile = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc";
    const drawTextFilters = lines.flatMap((line, lineIdx) => {
      const yPos = Math.floor(height / 2) - ((lines.length * fontSize * 1.5) / 2) + lineIdx * fontSize * 1.5;
      const escaped = escapeFFmpegText(line);
      // Shadow first, then text on top
      return [
        `drawtext=text='${escaped}':fontcolor=#000000@0.5:fontsize=${fontSize}:x=(w-text_w)/2+3:y=${yPos}+3:fontfile=${fontFile}`,
        `drawtext=text='${escaped}':fontcolor=#${textColor}:fontsize=${fontSize}:x=(w-text_w)/2:y=${yPos}:fontfile=${fontFile}`,
      ];
    }).join(",");

    // Build ffmpeg args based on whether we have a background image
    const ffmpegArgs: string[] = ["-y"];

    if (section.bgImage) {
      // Use background image: loop it for the duration, scale/crop to fit
      ffmpegArgs.push(
        "-loop", "1",
        "-i", section.bgImage,
        "-i", audioPath,
        "-vf", [
          `scale=${width}:${height}:force_original_aspect_ratio=increase`,
          `crop=${width}:${height}`,
          // Dark overlay for text readability
          `colorbalance=rs=-0.1:gs=-0.1:bs=-0.1`,
          `eq=brightness=-0.15`,
          drawTextFilters,
        ].filter(Boolean).join(","),
        "-t", sectionDuration.toFixed(2),
      );
    } else {
      // Solid color background
      ffmpegArgs.push(
        "-f", "lavfi",
        "-i", `color=c=#${bgColor}:s=${width}x${height}:d=${sectionDuration}:r=30`,
        "-i", audioPath,
        "-vf", drawTextFilters || "null",
      );
    }

    ffmpegArgs.push(
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-c:a", "aac",
      "-shortest",
      segmentPath,
    );

    await new Promise<void>((resolve, reject) => {
      execFile("ffmpeg", ffmpegArgs, { timeout: 60000 }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    segmentPaths.push(segmentPath);
  }

  // 3. Concatenate all segments
  console.log("\n--- Concatenating segments ---");
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

  // Cleanup
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
        "Each section gets its own TTS audio and text overlay on a solid background.\n" +
        "Segments are concatenated into the final video.\n" +
        "Requires: ffmpeg, Python edge-tts, Chinese fonts."
      );
      return;
    }

    if (!opts.input) {
      // Demo mode: generate a sample video
      const demoScript: VideoScript = {
        title: "Demo Video",
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
