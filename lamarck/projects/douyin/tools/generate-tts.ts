#!/usr/bin/env npx tsx
/**
 * Generate TTS audio from a V2 script file.
 *
 * Parses the script markdown for scenes with TTS parameters,
 * generates audio segments via edge-tts, checks durations,
 * and combines into a single file.
 *
 * Usage:
 *   npx tsx tools/generate-tts.ts content/ep01-ai-writes-jokes/script-v2.md [--output-dir /mnt/d/wsl-bridge/ep01-v2-audio]
 *   npx tsx tools/generate-tts.ts --help
 *   npx tsx tools/generate-tts.ts --describe
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import { program } from "commander";

interface Scene {
	number: number;
	title: string;
	voice: string;
	rate: string;
	pitch: string;
	text: string;
}

const VOICE_MAP: Record<string, string> = {
	YunxiaNeural: "zh-CN-YunxiaNeural",
	YunxiNeural: "zh-CN-YunxiNeural",
	YunyangNeural: "zh-CN-YunyangNeural",
	XiaoxiaoNeural: "zh-CN-XiaoxiaoNeural",
};

function parseScript(content: string): Scene[] {
	const scenes: Scene[] = [];
	const scenePattern = /## 场景 (\d+\w?)：(.+?)[\n\r]/g;

	let match: RegExpExecArray | null;
	const sceneStarts: { index: number; number: string; title: string }[] = [];

	while ((match = scenePattern.exec(content)) !== null) {
		sceneStarts.push({
			index: match.index,
			number: match[1],
			title: match[2].trim(),
		});
	}

	for (let i = 0; i < sceneStarts.length; i++) {
		const start = sceneStarts[i];
		const end = i + 1 < sceneStarts.length ? sceneStarts[i + 1].index : content.indexOf("## TTS 参数汇总");
		if (end === -1) continue;

		const block = content.slice(start.index, end);

		// Extract TTS params — take the FIRST TTS line (primary voice for the scene)
		const ttsMatch = block.match(/\*\*TTS\*\*：(\w+),\s*([+-]?\d+%),\s*([+-]?\d+Hz)/);
		if (!ttsMatch) continue;

		const voiceShort = ttsMatch[1];
		const voice = VOICE_MAP[voiceShort] || `zh-CN-${voiceShort}`;
		const rate = ttsMatch[2];
		const pitch = ttsMatch[3];

		// Extract narration text
		const narrationLines: string[] = [];
		const lines = block.split("\n");
		let inNarration = false;

		for (const line of lines) {
			if (line.startsWith("**旁白**：")) {
				narrationLines.push(line.replace("**旁白**：", "").trim());
				inNarration = true;
				continue;
			}
			if (inNarration) {
				if (
					line.startsWith("**") ||
					line.startsWith("## ") ||
					line.startsWith("---")
				) {
					inNarration = false;
					continue;
				}
				if (line.trim()) {
					narrationLines.push(line.trim());
				}
			}
		}

		const text = narrationLines.join("").replace(/\s+/g, "");
		if (!text) continue;

		scenes.push({
			number: parseInt(start.number),
			title: start.title,
			voice,
			rate,
			pitch,
			text,
		});
	}

	return scenes;
}

function generateAudio(scene: Scene, outputPath: string): number {
	const cmd = `edge-tts --voice "${scene.voice}" --rate="${scene.rate}" --pitch="${scene.pitch}" --text "${scene.text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
	execSync(cmd, { stdio: "pipe" });

	// Get duration
	const durationStr = execSync(
		`ffprobe -v error -show_entries format=duration -of csv=p=0 "${outputPath}"`,
		{ encoding: "utf-8" },
	).trim();
	return parseFloat(durationStr);
}

function combineAudio(files: string[], outputPath: string): void {
	const listFile = "/tmp/tts-combine-list.txt";
	const listContent = files.map((f) => `file '${f}'`).join("\n");
	writeFileSync(listFile, listContent);

	execSync(
		`ffmpeg -y -f concat -safe 0 -i "${listFile}" -acodec libmp3lame -q:a 2 "${outputPath}"`,
		{ stdio: "pipe" },
	);

	unlinkSync(listFile);
}

program
	.name("generate-tts")
	.description("Generate TTS audio from a V2 script markdown file")
	.argument("<script-path>", "Path to the script markdown file")
	.option(
		"-o, --output-dir <dir>",
		"Output directory for audio segments",
	)
	.option("--no-combine", "Skip combining segments into a single file")
	.action((scriptPath: string, options: { outputDir?: string; combine: boolean }) => {
		const fullPath = resolve(scriptPath);
		if (!existsSync(fullPath)) {
			console.error(`File not found: ${fullPath}`);
			process.exit(1);
		}

		const content = readFileSync(fullPath, "utf-8");
		const scenes = parseScript(content);

		if (scenes.length === 0) {
			console.error("No scenes with TTS parameters found in script.");
			process.exit(1);
		}

		// Determine output directory
		const scriptDir = dirname(fullPath);
		const scriptName = basename(scriptDir);
		const defaultOutputDir = `/mnt/d/wsl-bridge/${scriptName}-audio`;
		const outputDir = options.outputDir || defaultOutputDir;

		mkdirSync(outputDir, { recursive: true });
		console.log(`Output: ${outputDir}`);
		console.log(`Found ${scenes.length} scenes\n`);

		const audioFiles: string[] = [];
		let totalDuration = 0;

		for (const scene of scenes) {
			const filename = `${String(scene.number).padStart(2, "0")}-${scene.title.replace(/[^\w\u4e00-\u9fff]/g, "-").replace(/-+/g, "-").slice(0, 30)}.mp3`;
			const outputPath = join(outputDir, filename);

			process.stdout.write(`Scene ${scene.number}: ${scene.title} ... `);
			const duration = generateAudio(scene, outputPath);
			totalDuration += duration;
			audioFiles.push(outputPath);
			console.log(`${duration.toFixed(1)}s`);
		}

		console.log(`\nTotal: ${totalDuration.toFixed(1)}s`);

		if (totalDuration > 90) {
			console.log(`⚠️  Over target (70-85s). Consider trimming text.`);
		} else if (totalDuration < 65) {
			console.log(`⚠️  Under target. Consider adding more content.`);
		} else {
			console.log(`✓ Within target range.`);
		}

		if (options.combine && audioFiles.length > 1) {
			const combinedPath = join(
				dirname(outputDir),
				`${scriptName}-full.mp3`,
			);
			process.stdout.write(`\nCombining → ${combinedPath} ... `);
			combineAudio(audioFiles, combinedPath);
			console.log("done");
		}
	});

program.parse();
