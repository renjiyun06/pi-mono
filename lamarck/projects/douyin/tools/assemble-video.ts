/**
 * assemble-video.ts — Assemble video clips + voiceover + subtitles into final video
 *
 * Takes a storyboard JSON (with generated clips) and assembles them into a
 * final publishable video with:
 *   - Concatenated clips
 *   - TTS voiceover (edge-tts)
 *   - Burnt-in subtitles (SRT)
 *   - Optional background music
 *
 * Usage:
 *   npx tsx assemble-video.ts --help
 *   npx tsx assemble-video.ts --assembly assembly.json --output final.mp4
 *
 * Assembly JSON format: see --describe for details.
 */

import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync, spawnSync } from "node:child_process";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VoiceLine {
	text: string;
	start?: number; // Override start time (seconds). If omitted, auto-calculated.
}

interface AssemblyClip {
	id: string;
	video: string; // Path to video clip file
	voiceover?: VoiceLine[]; // Voice lines to overlay on this clip
}

interface Assembly {
	title: string;
	clips: AssemblyClip[];
	voice?: string; // edge-tts voice name (default: zh-CN-YunxiNeural)
	bgm?: string; // Path to background music file
	bgm_volume?: number; // BGM volume relative to voiceover (0.0-1.0, default: 0.15)
	output_resolution?: string; // e.g. "1080x1920" (default: match first clip)
	subtitle_style?: string; // ASS style override
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd: string, label?: string): string {
	if (label) console.log(`  [${label}]`);
	try {
		return execSync(cmd, { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 });
	} catch (e: unknown) {
		const err = e as { stderr?: string };
		console.error(`Command failed: ${cmd}`);
		if (err.stderr) console.error(err.stderr.substring(0, 500));
		throw e;
	}
}

function getVideoDuration(file: string): number {
	const out = run(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`);
	return Number.parseFloat(out.trim());
}

function ensureDir(dir: string) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── TTS Generation ─────────────────────────────────────────────────────────

async function generateTTS(
	text: string,
	outputPath: string,
	voice: string,
): Promise<number> {
	// Use Python edge-tts (reliable in WSL, unlike the Node package)
	const escaped = text.replace(/"/g, '\\"').replace(/\$/g, "\\$");
	run(
		`python3 -m edge_tts --voice "${voice}" --text "${escaped}" --write-media "${outputPath}" 2>/dev/null`,
		`TTS: ${text.substring(0, 40)}...`,
	);
	return getVideoDuration(outputPath);
}

// ─── SRT Generation ──────────────────────────────────────────────────────────

function formatSrtTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 1000);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

interface TimedLine {
	text: string;
	start: number;
	end: number;
	audioFile: string;
}

function generateSRT(lines: TimedLine[]): string {
	return lines
		.map(
			(line, i) =>
				`${i + 1}\n${formatSrtTime(line.start)} --> ${formatSrtTime(line.end)}\n${line.text}\n`,
		)
		.join("\n");
}

// ─── Main Assembly ───────────────────────────────────────────────────────────

async function assemble(opts: { assembly: string; output: string; dryRun: boolean }) {
	const assembly: Assembly = JSON.parse(fs.readFileSync(opts.assembly, "utf-8"));
	const baseDir = path.dirname(path.resolve(opts.assembly));
	const tmpDir = path.join(baseDir, ".assemble-tmp");
	ensureDir(tmpDir);

	const voice = assembly.voice || "zh-CN-YunxiNeural";
	const bgmVolume = assembly.bgm_volume ?? 0.15;

	console.log(`=== Assembling: ${assembly.title} ===`);
	console.log(`Clips: ${assembly.clips.length}, Voice: ${voice}`);

	// ── Step 1: Validate all clip files exist ──
	for (const clip of assembly.clips) {
		const videoPath = path.resolve(baseDir, clip.video);
		if (!fs.existsSync(videoPath)) {
			console.error(`ERROR: Clip not found: ${videoPath}`);
			process.exit(1);
		}
	}

	// ── Step 2: Get clip durations and calculate timeline ──
	const clipTimeline: { id: string; videoPath: string; start: number; duration: number }[] = [];
	let totalTime = 0;

	for (const clip of assembly.clips) {
		const videoPath = path.resolve(baseDir, clip.video);
		const duration = getVideoDuration(videoPath);
		clipTimeline.push({ id: clip.id, videoPath, start: totalTime, duration });
		console.log(`  Clip ${clip.id}: ${duration.toFixed(1)}s (starts at ${totalTime.toFixed(1)}s)`);
		totalTime += duration;
	}

	console.log(`  Total duration: ${totalTime.toFixed(1)}s`);

	if (opts.dryRun) {
		console.log("\n[Dry run] Would generate TTS and assemble. Exiting.");
		return;
	}

	// ── Step 3: Generate TTS audio for all voiceover lines ──
	const allTimedLines: TimedLine[] = [];
	let ttsIndex = 0;

	for (let ci = 0; ci < assembly.clips.length; ci++) {
		const clip = assembly.clips[ci];
		const clipInfo = clipTimeline[ci];
		if (!clip.voiceover || clip.voiceover.length === 0) continue;

		let lineOffset = clipInfo.start;
		for (const line of clip.voiceover) {
			const audioFile = path.join(tmpDir, `tts-${String(ttsIndex).padStart(3, "0")}.mp3`);
			const startTime = line.start != null ? clipInfo.start + line.start : lineOffset;
			const audioDuration = await generateTTS(line.text, audioFile, voice);

			allTimedLines.push({
				text: line.text,
				start: startTime,
				end: startTime + audioDuration,
				audioFile,
			});

			lineOffset = startTime + audioDuration + 0.2; // 0.2s gap between lines
			ttsIndex++;
		}
	}

	console.log(`\n  Generated ${allTimedLines.length} TTS segments`);

	// ── Step 4: Generate SRT subtitle file ──
	const srtPath = path.join(tmpDir, "subtitles.srt");
	fs.writeFileSync(srtPath, generateSRT(allTimedLines));
	console.log(`  SRT: ${srtPath}`);

	// ── Step 5: Concatenate video clips ──
	const concatListPath = path.join(tmpDir, "concat.txt");
	const concatLines = clipTimeline.map((c) => `file '${c.videoPath}'`).join("\n");
	fs.writeFileSync(concatListPath, concatLines);

	const concatVideoPath = path.join(tmpDir, "concat.mp4");
	run(
		`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${concatVideoPath}"`,
		"Concatenating clips",
	);

	// ── Step 6: Mix TTS audio into a single track ──
	let mixedAudioPath: string;
	if (allTimedLines.length > 0) {
		// Build complex filter for mixing all TTS segments at correct times
		const inputs = allTimedLines.map((l) => `-i "${l.audioFile}"`).join(" ");
		const delays = allTimedLines
			.map((l, i) => `[${i}]adelay=${Math.round(l.start * 1000)}|${Math.round(l.start * 1000)}[d${i}]`)
			.join(";");
		const mixInputs = allTimedLines.map((_, i) => `[d${i}]`).join("");

		mixedAudioPath = path.join(tmpDir, "voiceover.wav");
		run(
			`ffmpeg -y ${inputs} -filter_complex "${delays};${mixInputs}amix=inputs=${allTimedLines.length}:duration=longest:normalize=0" "${mixedAudioPath}"`,
			"Mixing voiceover",
		);
	} else {
		// No voiceover — create silent audio
		mixedAudioPath = path.join(tmpDir, "voiceover.wav");
		run(
			`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${totalTime.toFixed(1)} "${mixedAudioPath}"`,
			"Creating silent audio",
		);
	}

	// ── Step 7: Add BGM if specified ──
	let finalAudioPath = mixedAudioPath;
	if (assembly.bgm) {
		const bgmPath = path.resolve(baseDir, assembly.bgm);
		if (fs.existsSync(bgmPath)) {
			finalAudioPath = path.join(tmpDir, "final-audio.wav");
			run(
				`ffmpeg -y -i "${mixedAudioPath}" -i "${bgmPath}" -filter_complex "[1]volume=${bgmVolume},aloop=-1:size=44100*60[bgm];[0][bgm]amix=inputs=2:duration=first:normalize=0" "${finalAudioPath}"`,
				"Adding BGM",
			);
		} else {
			console.warn(`  WARNING: BGM file not found: ${bgmPath}`);
		}
	}

	// ── Step 8: Burn subtitles + merge audio ──
	const outputPath = path.resolve(opts.output);
	ensureDir(path.dirname(outputPath));

	// Subtitle style: white text, black outline, bottom center
	const subtitleStyle = assembly.subtitle_style ||
		"FontName=Noto Sans CJK SC,FontSize=18,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1,MarginV=60,Alignment=2";

	run(
		`ffmpeg -y -i "${concatVideoPath}" -i "${finalAudioPath}" ` +
			`-vf "subtitles='${srtPath.replace(/'/g, "\\'")}':force_style='${subtitleStyle}'" ` +
			`-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p ` +
			`-c:a aac -b:a 128k ` +
			`-map 0:v -map 1:a -shortest "${outputPath}"`,
		"Final render",
	);

	const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
	console.log(`\n=== Done: ${outputPath} (${sizeMB} MB, ${totalTime.toFixed(1)}s) ===`);

	// ── Cleanup tmp ──
	// Keep tmp for debugging. User can delete manually.
	console.log(`  Temp files in: ${tmpDir}`);

	// ── Also save SRT next to output ──
	const outputSrtPath = outputPath.replace(/\.mp4$/, ".srt");
	fs.copyFileSync(srtPath, outputSrtPath);
	console.log(`  Subtitles: ${outputSrtPath}`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const program = new Command();

program
	.name("assemble-video")
	.description("Assemble video clips + TTS voiceover + subtitles into final video")
	.version("1.0.0");

program
	.command("run")
	.description("Assemble video from assembly JSON")
	.requiredOption("-a, --assembly <path>", "Assembly JSON file")
	.requiredOption("-o, --output <path>", "Output video path (.mp4)")
	.option("--dry-run", "Validate and show timeline without generating", false)
	.action(assemble);

program
	.command("describe")
	.description("Describe the assembly JSON format")
	.action(() => {
		console.log(`
assemble-video — Final assembly step in the AI video pipeline

Takes generated video clips and combines them with:
  1. TTS voiceover (edge-tts, Python)
  2. Burnt-in SRT subtitles (Chinese)
  3. Optional background music
  4. Proper encoding for Douyin (h264 yuv420p)

Assembly JSON format:
{
  "title": "认知债务",
  "voice": "zh-CN-YunxiNeural",
  "bgm": "path/to/bgm.mp3",         // Optional
  "bgm_volume": 0.15,                // 0.0-1.0
  "clips": [
    {
      "id": "01",
      "video": "clips/01.mp4",       // Relative to assembly JSON location
      "voiceover": [
        { "text": "你有没有想过..." },
        { "text": "当 AI 帮你写完代码...", "start": 2.5 }
      ]
    },
    {
      "id": "02",
      "video": "clips/02.mp4",
      "voiceover": [
        { "text": "MIT 和哈佛的最新研究发现..." }
      ]
    }
  ]
}

Pipeline:
  1. seedance-generate batch → clips/01.mp4, clips/02.mp4, ...
  2. assemble-video run → final.mp4 + final.srt

Voiceover timing:
  - Lines within a clip play sequentially with 0.2s gaps
  - Use "start" (relative to clip start) to override timing
  - TTS duration is auto-detected from generated audio

Requirements:
  - ffmpeg with libx264 and subtitles filter
  - Python edge-tts package: pip install edge-tts
  - Noto Sans CJK font (for Chinese subtitles)
`);
	});

program.parse();
