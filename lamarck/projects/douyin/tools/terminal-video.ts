/**
 * Terminal-style video generator.
 *
 * Creates videos that simulate a terminal/code editor with typing animation.
 * Much more engaging than plain text-on-background for tech content.
 *
 * Features:
 * - Dark terminal background with colored prompt
 * - Character-by-character typing animation
 * - TTS voiceover synchronized with typing
 * - Support for "command" lines (with prompt) and "output" lines (instant appear)
 *
 * Usage:
 *   npx tsx tools/terminal-video.ts --input script.json --output output.mp4
 *   npx tsx tools/terminal-video.ts --describe
 */
import { execFile, execFileSync } from "child_process";
import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import { Command } from "commander";

interface TerminalLine {
  /** "cmd" = typed with prompt, "output" = appears instantly, "comment" = green text, "reveal" = appears with delay (0.4s between lines) */
  type: "cmd" | "output" | "comment" | "reveal";
  /** The text content */
  text: string;
}

interface TerminalSection {
  /** Lines to display in terminal */
  lines: TerminalLine[];
  /** TTS voiceover text (explains what's happening) */
  voiceoverText: string;
  /** Duration override in seconds */
  duration?: number;
  /** Per-section TTS voice override (e.g. "zh-CN-YunxiNeural") */
  voice?: string;
  /** Per-section TTS rate override (e.g. "-5%") */
  rate?: string;
  /** Per-section TTS pitch override (e.g. "+2Hz") */
  pitch?: string;
}

interface TerminalScript {
  title: string;
  sections: TerminalSection[];
  /** TTS voice */
  voice?: string;
  /** Terminal prompt string */
  prompt?: string;
  /** Font size for terminal text */
  fontSize?: number;
  /** Terminal theme name (mocha, nord, dracula, solarized, red) */
  themeName?: string;
  /** Terminal theme colors (overrides themeName) */
  theme?: {
    bg?: string;       // background hex
    fg?: string;       // foreground (output) hex
    prompt?: string;   // prompt color hex
    cmd?: string;      // command text color hex
    comment?: string;  // comment color hex
  };
}

const PYTHON_PATH = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";
const CJK_FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc";
// Use CJK font for everything — it renders ASCII fine and supports Chinese
const FONT = CJK_FONT;

const THEMES: Record<string, typeof DEFAULT_THEME> = {
  mocha: {
    bg: "1e1e2e",      // Catppuccin Mocha base
    fg: "cdd6f4",      // text
    prompt: "89b4fa",   // blue
    cmd: "f5e0dc",      // rosewater
    comment: "a6e3a1",  // green
  },
  nord: {
    bg: "2e3440",      // Nord polar night
    fg: "d8dee9",      // snow storm
    prompt: "88c0d0",   // frost
    cmd: "e5e9f0",      // light
    comment: "a3be8c",  // aurora green
  },
  dracula: {
    bg: "282a36",      // Dracula background
    fg: "f8f8f2",      // foreground
    prompt: "bd93f9",   // purple
    cmd: "f1fa8c",      // yellow
    comment: "50fa7b",  // green
  },
  solarized: {
    bg: "002b36",      // Solarized dark
    fg: "839496",      // base0
    prompt: "268bd2",   // blue
    cmd: "2aa198",      // cyan
    comment: "859900",  // green
  },
  red: {
    bg: "1a1015",      // dark wine
    fg: "e0c4c4",      // warm text
    prompt: "ff6b6b",   // red
    cmd: "ffa07a",      // salmon
    comment: "c9b037",  // gold
  },
};

const DEFAULT_THEME = THEMES.mocha;

async function synthesizeTTS(
  text: string,
  voice: string,
  outputPath: string,
  rate?: string,
  pitch?: string,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = ["-m", "edge_tts", "--voice", voice];
    if (rate) args.push(`--rate=${rate}`);
    if (pitch) args.push(`--pitch=${pitch}`);
    args.push("--text", text, "--write-media", outputPath);
    execFile(
      PYTHON_PATH,
      args,
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
    .replace(/'/g, "\u2019")  // Replace ' with right single quote (avoids filter chain issues)
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/%/g, "%%")
    .replace(/;/g, "\\;");
}

/**
 * Build ffmpeg drawtext filters for terminal-style rendering.
 *
 * For "cmd" lines: characters appear one by one (typing effect)
 * For "output" lines: appear all at once after commands finish
 * For "comment" lines: appear in green
 */
function buildTerminalFilters(
  section: TerminalSection,
  prompt: string,
  fontSize: number,
  theme: typeof DEFAULT_THEME,
  sectionDuration: number,
): string {
  const lineHeight = Math.floor(fontSize * 1.6);
  const leftMargin = 60;
  const topMargin = 200; // Leave room for a title bar area
  const width = 1080;

  // Calculate typing speed: distribute across ~70% of the duration
  const totalCmdChars = section.lines
    .filter((l) => l.type === "cmd")
    .reduce((sum, l) => sum + l.text.length, 0);

  const typingDuration = sectionDuration * 0.65;
  // chars per second (minimum 5 to avoid too-slow typing)
  const charsPerSec = Math.max(5, totalCmdChars / typingDuration);

  const filters: string[] = [];
  let yPos = topMargin;
  let timeOffset = 0.3; // small initial delay

  for (const line of section.lines) {
    if (line.type === "cmd") {
      // Render prompt + command as a single line, appearing at the right time
      const fullLine = `${prompt}${line.text}`;
      const fullEscaped = escapeFFmpegText(fullLine);

      // Show prompt immediately, then command appears with a typing delay
      // For simplicity: prompt appears, then full command appears after typing delay
      const promptEscaped = escapeFFmpegText(prompt);
      filters.push(
        `drawtext=text='${promptEscaped}':fontcolor=#${theme.prompt}:fontsize=${fontSize}:x=${leftMargin}:y=${yPos}:fontfile=${FONT}:enable='gte(t\\,${timeOffset.toFixed(2)})'`
      );

      // Command appears after a typing delay proportional to length
      const typingTime = line.text.length / charsPerSec;
      const cmdAppearTime = timeOffset + typingTime * 0.3; // appear after 30% of typing time (feels like fast typing)
      const cmdEscaped = escapeFFmpegText(line.text);
      const promptWidth = prompt.length * fontSize * 0.6;
      filters.push(
        `drawtext=text='${cmdEscaped}':fontcolor=#${theme.cmd}:fontsize=${fontSize}:x=${leftMargin + promptWidth}:y=${yPos}:fontfile=${FONT}:enable='gte(t\\,${cmdAppearTime.toFixed(2)})'`
      );

      timeOffset += typingTime + 0.3; // gap after command
    } else if (line.type === "output") {
      // Output appears all at once
      const outputEscaped = escapeFFmpegText(line.text);
      filters.push(
        `drawtext=text='${outputEscaped}':fontcolor=#${theme.fg}:fontsize=${fontSize}:x=${leftMargin}:y=${yPos}:fontfile=${FONT}:enable='gte(t\\,${timeOffset.toFixed(2)})'`
      );
      timeOffset += 0.1; // small delay between output lines
    } else if (line.type === "reveal") {
      // Like output but with a longer delay between lines for dramatic effect
      const revealEscaped = escapeFFmpegText(line.text);
      filters.push(
        `drawtext=text='${revealEscaped}':fontcolor=#${theme.fg}:fontsize=${fontSize}:x=${leftMargin}:y=${yPos}:fontfile=${FONT}:enable='gte(t\\,${timeOffset.toFixed(2)})'`
      );
      timeOffset += 0.4; // slower reveal between lines
    } else if (line.type === "comment") {
      const commentEscaped = escapeFFmpegText(line.text);
      filters.push(
        `drawtext=text='${commentEscaped}':fontcolor=#${theme.comment}:fontsize=${fontSize}:x=${leftMargin}:y=${yPos}:fontfile=${FONT}:enable='gte(t\\,${timeOffset.toFixed(2)})'`
      );
      timeOffset += 0.1;
    }

    yPos += lineHeight;
  }

  // Blinking cursor at the end
  const cursorY = yPos;
  filters.push(
    `drawtext=text='▋':fontcolor=#${theme.fg}:fontsize=${fontSize}:x=${leftMargin}:y=${cursorY}:fontfile=${FONT}:enable='gte(t\\,${timeOffset.toFixed(2)})*lt(mod(t\\,1)\\,0.5)'`
  );

  return filters.join(",");
}

async function generateTerminalVideo(
  script: TerminalScript,
  outputPath: string,
): Promise<void> {
  const workDir = join(tmpdir(), `term-${randomBytes(8).toString("hex")}`);
  await mkdir(workDir, { recursive: true });

  const voice = script.voice || "zh-CN-YunxiNeural";
  const prompt = script.prompt || "$ ";
  const fontSize = script.fontSize || 36;
  const baseTheme = script.themeName && THEMES[script.themeName] ? THEMES[script.themeName] : DEFAULT_THEME;
  const theme = { ...baseTheme, ...script.theme };
  const width = 1080;
  const height = 1920;

  console.log(`Generating terminal video: ${script.title}`);
  console.log(`Sections: ${script.sections.length}, Voice: ${voice}`);

  const segmentPaths: string[] = [];
  const sectionTimings: { startSec: number; endSec: number; text: string }[] = [];
  let cumulativeTime = 0;

  for (let i = 0; i < script.sections.length; i++) {
    const section = script.sections[i];
    console.log(`\n--- Section ${i + 1}/${script.sections.length} ---`);

    // Generate TTS
    const audioPath = join(workDir, `section-${i}.mp3`);
    const sectionVoice = section.voice || voice;
    const duration = await synthesizeTTS(section.voiceoverText, sectionVoice, audioPath, section.rate, section.pitch);
    const sectionDuration = section.duration || duration + 1.0;
    console.log(`Audio: ${duration.toFixed(1)}s, Section: ${sectionDuration.toFixed(1)}s`);

    // Record timing for SRT generation
    sectionTimings.push({
      startSec: cumulativeTime,
      endSec: cumulativeTime + sectionDuration,
      text: section.voiceoverText,
    });
    cumulativeTime += sectionDuration;

    // Build terminal display
    const termFilters = buildTerminalFilters(section, prompt, fontSize, theme, sectionDuration);

    // Title bar decoration — dot colors adapt to theme
    const dotRed = theme.prompt === "ff6b6b" ? "ff6b6b" : "f38ba8"; // red theme uses its own red
    const dotYellow = theme.comment === "c9b037" ? "c9b037" : "f9e2af";
    const dotGreen = theme.comment || "a6e3a1";
    const titleBar = [
      // Window dots (red, yellow, green)
      `drawtext=text='●':fontcolor=#${dotRed}:fontsize=28:x=30:y=30:fontfile=${FONT}`,
      `drawtext=text='●':fontcolor=#${dotYellow}:fontsize=28:x=65:y=30:fontfile=${FONT}`,
      `drawtext=text='●':fontcolor=#${dotGreen}:fontsize=28:x=100:y=30:fontfile=${FONT}`,
      // Title
      `drawtext=text='${escapeFFmpegText(script.title)}':fontcolor=#${theme.fg}@0.6:fontsize=24:x=(w-text_w)/2:y=32:fontfile=${FONT}`,
      // Separator line
      `drawtext=text='${escapeFFmpegText("─".repeat(60))}':fontcolor=#${theme.fg}@0.2:fontsize=20:x=20:y=70:fontfile=${FONT}`,
    ].join(",");

    // Bottom progress indicator: "Section 2/5"
    const totalSections = script.sections.length;
    const progressText = `drawtext=text='${escapeFFmpegText(`${i + 1} / ${totalSections}`)}':fontcolor=#${theme.fg}@0.3:fontsize=20:x=(w-text_w)/2:y=h-50:fontfile=${FONT}`;

    // Fade in/out for smooth section transitions (0.3s each)
    const fadeIn = `fade=t=in:st=0:d=0.3`;
    const fadeOut = `fade=t=out:st=${(sectionDuration - 0.3).toFixed(2)}:d=0.3`;
    const allFilters = [titleBar, termFilters, progressText, fadeIn, fadeOut].join(",");

    const segmentPath = join(workDir, `segment-${i}.mp4`);
    const ffmpegArgs = [
      "-y",
      "-f", "lavfi",
      "-i", `color=c=#${theme.bg}:s=${width}x${height}:d=${sectionDuration.toFixed(2)}:r=30`,
      "-i", audioPath,
      "-vf", allFilters,
      "-pix_fmt", "yuv420p",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-af", `afade=t=in:st=0:d=0.2,afade=t=out:st=${(sectionDuration - 0.3).toFixed(2)}:d=0.3`,
      "-c:a", "aac",
      "-shortest",
      segmentPath,
    ];

    await new Promise<void>((resolve, reject) => {
      execFile("ffmpeg", ffmpegArgs, { timeout: 120000 }, (error, _stdout, stderr) => {
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

  // Concatenate
  console.log("\n--- Concatenating segments ---");
  if (segmentPaths.length === 1) {
    await new Promise<void>((resolve, reject) => {
      execFile("ffmpeg", ["-y", "-i", segmentPaths[0], "-c", "copy", outputPath],
        { timeout: 60000 }, (error) => { if (error) reject(error); else resolve(); });
    });
  } else {
    const concatFile = join(workDir, "concat.txt");
    await writeFile(concatFile, segmentPaths.map((p) => `file '${p}'`).join("\n"));
    await new Promise<void>((resolve, reject) => {
      execFile("ffmpeg", [
        "-y", "-f", "concat", "-safe", "0", "-i", concatFile,
        "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "fast", "-c:a", "aac", outputPath,
      ], { timeout: 180000 }, (error) => { if (error) reject(error); else resolve(); });
    });
  }

  // Generate SRT subtitle file alongside the video
  const srtPath = outputPath.replace(/\.[^.]+$/, ".srt");
  const srtContent = sectionTimings.map((t, i) => {
    const formatTime = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
    };
    return `${i + 1}\n${formatTime(t.startSec)} --> ${formatTime(t.endSec)}\n${t.text}\n`;
  }).join("\n");
  await writeFile(srtPath, srtContent);
  console.log(`Subtitles saved to: ${srtPath}`);

  await rm(workDir, { recursive: true, force: true });
  console.log(`\nVideo saved to: ${outputPath}`);
}

/**
 * Generate a static PNG preview of each section (all text visible).
 * Useful for quickly checking layout without rendering full video.
 */
async function generatePreview(
  script: TerminalScript,
  outputBase: string,
): Promise<void> {
  const baseTheme = script.themeName && THEMES[script.themeName] ? THEMES[script.themeName] : DEFAULT_THEME;
  const theme = { ...baseTheme, ...script.theme };
  const prompt = script.prompt || "$ ";
  const fontSize = script.fontSize || 36;
  const width = 1080;
  const height = 1920;

  const outDir = outputBase.replace(/\.[^.]+$/, "");
  await mkdir(outDir, { recursive: true });

  for (let i = 0; i < script.sections.length; i++) {
    const section = script.sections[i];
    // Build filters with all text visible (enable='1')
    const lineHeight = Math.floor(fontSize * 1.6);
    const leftMargin = 60;
    const topMargin = 200;
    const filters: string[] = [];
    let yPos = topMargin;

    // Title bar
    const dotRed = theme.prompt === "ff6b6b" ? "ff6b6b" : "f38ba8";
    const dotYellow = theme.comment === "c9b037" ? "c9b037" : "f9e2af";
    const dotGreen = theme.comment || "a6e3a1";
    filters.push(
      `drawtext=text='${escapeFFmpegText("●")}':fontcolor=#${dotRed}:fontsize=28:x=30:y=30:fontfile=${FONT}`,
      `drawtext=text='${escapeFFmpegText("●")}':fontcolor=#${dotYellow}:fontsize=28:x=65:y=30:fontfile=${FONT}`,
      `drawtext=text='${escapeFFmpegText("●")}':fontcolor=#${dotGreen}:fontsize=28:x=100:y=30:fontfile=${FONT}`,
      `drawtext=text='${escapeFFmpegText(script.title)}':fontcolor=#${theme.fg}@0.6:fontsize=24:x=(w-text_w)/2:y=32:fontfile=${FONT}`,
      `drawtext=text='${escapeFFmpegText("─".repeat(60))}':fontcolor=#${theme.fg}@0.2:fontsize=20:x=20:y=70:fontfile=${FONT}`,
    );

    for (const line of section.lines) {
      const color = line.type === "cmd" ? theme.cmd
        : line.type === "comment" ? theme.comment
        : theme.fg;
      let text = line.text;
      if (line.type === "cmd") {
        // Show prompt
        filters.push(
          `drawtext=text='${escapeFFmpegText(prompt)}':fontcolor=#${theme.prompt}:fontsize=${fontSize}:x=${leftMargin}:y=${yPos}:fontfile=${FONT}`
        );
        const promptWidth = prompt.length * fontSize * 0.6;
        filters.push(
          `drawtext=text='${escapeFFmpegText(text)}':fontcolor=#${color}:fontsize=${fontSize}:x=${leftMargin + promptWidth}:y=${yPos}:fontfile=${FONT}`
        );
      } else {
        filters.push(
          `drawtext=text='${escapeFFmpegText(text)}':fontcolor=#${color}:fontsize=${fontSize}:x=${leftMargin}:y=${yPos}:fontfile=${FONT}`
        );
      }
      yPos += lineHeight;
    }

    // Section indicator
    filters.push(
      `drawtext=text='${escapeFFmpegText(`${i + 1} / ${script.sections.length}`)}':fontcolor=#${theme.fg}@0.3:fontsize=20:x=(w-text_w)/2:y=h-50:fontfile=${FONT}`
    );

    const outPath = join(outDir, `section-${i + 1}.png`);
    await new Promise<void>((resolve, reject) => {
      execFile("ffmpeg", [
        "-y", "-f", "lavfi",
        "-i", `color=c=#${theme.bg}:s=${width}x${height}:d=0.1:r=1`,
        "-vf", filters.join(","),
        "-frames:v", "1",
        outPath,
      ], { timeout: 15000 }, (error) => {
        if (error) reject(error); else resolve();
      });
    });
    console.log(`Preview: ${outPath}`);
  }
  console.log(`\nPreview frames saved to: ${outDir}/`);
}

// CLI
const program = new Command();
program
  .name("terminal-video")
  .description("Generate terminal-style video with typing animation and TTS")
  .option("-i, --input <path>", "Input script JSON file")
  .option("-o, --output <path>", "Output video path", "output.mp4")
  .option("--preview", "Generate a single frame preview (PNG) of each section instead of full video")
  .option("--describe", "Describe what this tool does")
  .action(async (opts) => {
    if (opts.describe) {
      console.log(
        "terminal-video: Creates videos simulating a terminal with typing animation.\n" +
        "Supports command lines (typed char-by-char), output lines (instant), reveal lines (0.4s delay), and comments.\n" +
        "Includes TTS voiceover, terminal title bar, and blinking cursor.\n" +
        `Available themes: ${Object.keys(THEMES).join(", ")} (set via "themeName" in script JSON)\n` +
        "Requires: ffmpeg, Python edge-tts, fonts-noto-cjk."
      );
      return;
    }

    if (!opts.input) {
      // Demo
      const demo: TerminalScript = {
        title: "AI 编程演示",
        sections: [
          {
            lines: [
              { type: "comment", text: "用 Claude Code 创建一个网站" },
              { type: "cmd", text: "claude \"create a landing page\"" },
              { type: "output", text: "Creating a modern landing page..." },
              { type: "output", text: "Creating index.html..." },
              { type: "output", text: "Creating styles.css..." },
              { type: "output", text: "Done! Open index.html to preview." },
            ],
            voiceoverText: "用Claude Code一句话就能创建一个完整的网页。只需要告诉它你想要什么，它就会自动生成所有代码文件。",
          },
        ],
      };
      await generateTerminalVideo(demo, opts.output);
      return;
    }

    const scriptContent = await readFile(opts.input, "utf-8");
    const script: TerminalScript = JSON.parse(scriptContent);

    if (opts.preview) {
      await generatePreview(script, opts.output);
    } else {
      await generateTerminalVideo(script, opts.output);
    }
  });

program.parse();
