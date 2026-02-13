/**
 * Batch render all video scripts in the scripts/ directory.
 *
 * Detects script type (terminal vs text-to-video) based on JSON structure
 * and renders each to the output directory.
 *
 * Usage:
 *   npx tsx tools/batch-render.ts [--output-dir ./output]
 *   npx tsx tools/batch-render.ts --describe
 */
import { readdir, readFile, mkdir } from "fs/promises";
import { join, basename } from "path";
import { execFileSync } from "child_process";
import { Command } from "commander";

const SCRIPTS_DIR = join(import.meta.dirname, "..", "scripts");

interface AnyScript {
  title: string;
  sections: Array<{
    lines?: unknown[];
    displayText?: string;
  }>;
}

function isTerminalScript(script: AnyScript): boolean {
  return script.sections.some((s) => Array.isArray(s.lines));
}

async function main(outputDir: string) {
  await mkdir(outputDir, { recursive: true });

  const files = (await readdir(SCRIPTS_DIR)).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} scripts in ${SCRIPTS_DIR}\n`);

  const results: Array<{ file: string; status: string; duration?: string }> = [];

  for (const file of files) {
    const scriptPath = join(SCRIPTS_DIR, file);
    const outputName = basename(file, ".json") + ".mp4";
    const outputPath = join(outputDir, outputName);

    console.log(`=== Rendering: ${file} ===`);

    try {
      const content = await readFile(scriptPath, "utf-8");
      const script: AnyScript = JSON.parse(content);
      const tool = isTerminalScript(script) ? "terminal-video" : "text-to-video";

      console.log(`Type: ${tool}, Title: ${script.title}`);

      const toolPath = join(import.meta.dirname, `${tool}.ts`);
      execFileSync("npx", ["tsx", toolPath, "-i", scriptPath, "-o", outputPath], {
        stdio: "inherit",
        timeout: 600000, // 10 min per video
      });

      // Get duration
      const duration = execFileSync("ffprobe", [
        "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        outputPath,
      ]).toString().trim();

      results.push({ file, status: "OK", duration: `${parseFloat(duration).toFixed(1)}s` });
    } catch (err) {
      console.error(`Failed: ${err}`);
      results.push({ file, status: "FAILED" });
    }

    console.log("");
  }

  // Summary
  console.log("\n=== Batch Render Summary ===");
  console.log(`Output directory: ${outputDir}\n`);
  for (const r of results) {
    const dur = r.duration ? ` (${r.duration})` : "";
    console.log(`  ${r.status === "OK" ? "✓" : "✗"} ${r.file}${dur}`);
  }

  const ok = results.filter((r) => r.status === "OK").length;
  console.log(`\n${ok}/${results.length} videos rendered successfully.`);
}

const program = new Command();
program
  .name("batch-render")
  .description("Batch render all video scripts")
  .option("-o, --output-dir <path>", "Output directory", "./output")
  .option("--describe", "Describe what this tool does")
  .action((opts) => {
    if (opts.describe) {
      console.log(
        "batch-render: Renders all JSON scripts in scripts/ directory.\n" +
        "Auto-detects terminal-video vs text-to-video format.\n" +
        "Outputs MP4 files to the specified directory."
      );
      return;
    }
    main(opts.outputDir);
  });

program.parse();
