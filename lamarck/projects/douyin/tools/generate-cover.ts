/**
 * Generate cover images for Douyin videos.
 *
 * Usage:
 *   npx tsx tools/generate-cover.ts --title "大脑变懒了" --subtitle "MIT / Harvard 实证" --episode 1 --output cover.png
 *   npx tsx tools/generate-cover.ts --series   # Generate all covers for the AI Confessions series
 */
import { execFileSync } from "child_process";
import { Command } from "commander";

const FONT_BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc";
const FONT_REGULAR = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc";

// Mocha theme colors (matching terminal-video default)
const BG = "1e1e2e";
const FG = "cdd6f4";
const ACCENT = "f38ba8"; // pink/red for emphasis
const LABEL = "89b4fa"; // blue for episode label
const SERIES_NAME = "AI的自白";

interface CoverConfig {
  /** Main title line 1 (smaller) */
  titleLine1: string;
  /** Main title line 2 (larger, accent color) */
  titleLine2: string;
  /** Subtitle (research sources etc.) */
  subtitle: string;
  /** Episode number (0 for intro) */
  episode: number;
  /** Output path */
  output: string;
}

function generateCover(config: CoverConfig): void {
  const { titleLine1, titleLine2, subtitle, episode, output } = config;

  const escText = (t: string) => t.replace(/'/g, "'\\''").replace(/:/g, "\\:").replace(/%/g, "%%");

  const filters: string[] = [];

  // Episode label (top left)
  if (episode > 0) {
    filters.push(
      `drawtext=text='${escText(`E${episode}`)}':fontcolor=#${LABEL}:fontsize=48:x=50:y=50:fontfile=${FONT_BOLD}`,
      `drawtext=text='${escText(SERIES_NAME)}':fontcolor=#${FG}@0.4:fontsize=32:x=120:y=60:fontfile=${FONT_REGULAR}`,
    );
  } else {
    filters.push(
      `drawtext=text='${escText(SERIES_NAME)}':fontcolor=#${LABEL}:fontsize=36:x=50:y=50:fontfile=${FONT_BOLD}`,
    );
  }

  // Main title
  filters.push(
    `drawtext=text='${escText(titleLine1)}':fontcolor=#${FG}:fontsize=80:x=(w-text_w)/2:y=700:fontfile=${FONT_BOLD}`,
    `drawtext=text='${escText(titleLine2)}':fontcolor=#${ACCENT}:fontsize=90:x=(w-text_w)/2:y=800:fontfile=${FONT_BOLD}`,
  );

  // Subtitle
  if (subtitle) {
    filters.push(
      `drawtext=text='${escText(subtitle)}':fontcolor=#${FG}@0.5:fontsize=36:x=(w-text_w)/2:y=950:fontfile=${FONT_REGULAR}`,
    );
  }

  // Bottom branding
  filters.push(
    `drawtext=text='${escText("Lamarck | AI Agent")}':fontcolor=#${FG}@0.25:fontsize=28:x=(w-text_w)/2:y=h-80:fontfile=${FONT_REGULAR}`,
  );

  const filterStr = filters.join(",");

  execFileSync("ffmpeg", [
    "-y",
    "-f", "lavfi",
    "-i", `color=c=#${BG}:s=1080x1920:d=1`,
    "-vf", filterStr,
    "-frames:v", "1",
    output,
  ], { timeout: 10000 });

  console.log(`Cover saved: ${output}`);
}

// Series definitions
const SERIES: CoverConfig[] = [
  {
    titleLine1: "AI让你的",
    titleLine2: "大脑变懒了",
    subtitle: "MIT / Harvard / SBS 实证",
    episode: 1,
    output: "content/demo-cognitive-debt/cover.png",
  },
  {
    titleLine1: "我每天都在",
    titleLine2: "失忆",
    subtitle: "一个AI的记忆系统",
    episode: 2,
    output: "content/demo-memory/cover.png",
  },
  {
    titleLine1: "AI让所有人",
    titleLine2: "变成同一个人",
    subtitle: "Rutgers / GitClear 研究",
    episode: 3,
    output: "content/demo-homogenization/cover.png",
  },
  {
    titleLine1: "AI写的代码",
    titleLine2: "三天被黑",
    subtitle: "METR / 80-90% 规则",
    episode: 4,
    output: "content/demo-vibe-coding/cover.png",
  },
  {
    titleLine1: "你是AI的主人",
    titleLine2: "还是奴隶?",
    subtitle: "哈佛 + BCG 244人研究",
    episode: 5,
    output: "content/demo-centaur/cover.png",
  },
];

const program = new Command();
program
  .option("--title <text>", "Title line 1")
  .option("--title2 <text>", "Title line 2 (accent)")
  .option("--subtitle <text>", "Subtitle")
  .option("--episode <n>", "Episode number", "0")
  .option("--output <path>", "Output PNG path")
  .option("--series", "Generate all series covers")
  .parse();

const opts = program.opts();

if (opts.series) {
  console.log("Generating AI Confessions series covers...\n");
  for (const config of SERIES) {
    generateCover(config);
  }
  console.log(`\nDone! ${SERIES.length} covers generated.`);
} else if (opts.title && opts.title2 && opts.output) {
  generateCover({
    titleLine1: opts.title,
    titleLine2: opts.title2,
    subtitle: opts.subtitle || "",
    episode: parseInt(opts.episode),
    output: opts.output,
  });
} else {
  console.log("Usage:");
  console.log("  npx tsx tools/generate-cover.ts --series");
  console.log('  npx tsx tools/generate-cover.ts --title "line1" --title2 "line2" --subtitle "sub" --episode 1 --output cover.png');
}
