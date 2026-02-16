#!/usr/bin/env npx tsx
/**
 * Render a Remotion composition with TTS voiceover.
 * 
 * Takes a JSON spec file, generates TTS audio per section,
 * calculates frame timing from audio durations, renders video
 * with matching timing, then combines video + audio.
 * 
 * Usage:
 *   npx tsx render-with-voice.ts --spec spec.json --output output.mp4
 * 
 * Spec format:
 * {
 *   "composition": "AIInsight",
 *   "voice": "zh-CN-YunxiNeural",
 *   "rate": "-5%",
 *   "sections": [
 *     {"text": "Display text", "narration": "TTS text", "style": "hook"},
 *     {"text": "More text", "narration": "More TTS", "style": "context", "emoji": "🧠"}
 *   ]
 * }
 */

import { execSync, execFileSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

interface SectionSpec {
	text: string;
	narration: string;
	style: "hook" | "context" | "insight" | "takeaway";
	emoji?: string;
}

interface VideoSpec {
	composition: string;
	voice?: string;
	rate?: string;
	authorName?: string;
	backgroundColor?: string;
	accentColor?: string;
	bgm?: string; // Path to background music file (relative to spec dir or absolute)
	bgmVolume?: number; // BGM volume (0-1, default 0.08)
	sections: SectionSpec[];
	// Extra props forwarded to the composition (e.g., title, nodeCount, secondaryColor)
	[key: string]: unknown;
}

function getDuration(filePath: string): number {
	const result = execFileSync("ffprobe", [
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "csv=p=0",
		filePath,
	]).toString().trim();
	return parseFloat(result);
}

async function main() {
	const args = process.argv.slice(2);
	const specIdx = args.indexOf("--spec");
	const outputIdx = args.indexOf("--output");

	if (specIdx === -1 || outputIdx === -1) {
		console.log("Usage: npx tsx render-with-voice.ts --spec spec.json --output output.mp4");
		process.exit(1);
	}

	const specPath = args[specIdx + 1];
	const outputPath = args[outputIdx + 1];
	const spec: VideoSpec = JSON.parse(readFileSync(specPath, "utf-8"));

	const tmpDir = join(dirname(outputPath), ".tmp-render");
	mkdirSync(tmpDir, { recursive: true });

	const voice = spec.voice || "zh-CN-YunxiNeural";
	const rate = spec.rate || "-5%";
	const compositionId = spec.composition || "AIInsight";
	const fps = 30;

	console.log(`=== Render Pipeline ===`);
	console.log(`Composition: ${compositionId}`);
	console.log(`Voice: ${voice}, Rate: ${rate}`);
	console.log(`Sections: ${spec.sections.length}\n`);

	// Step 1: Generate TTS per section
	console.log("Step 1: Generating TTS per section...");
	const sectionDurations: number[] = [];
	const sectionAudioPaths: string[] = [];

	for (let i = 0; i < spec.sections.length; i++) {
		const section = spec.sections[i];
		const audioPath = join(tmpDir, `section-${i}.mp3`);
		sectionAudioPaths.push(audioPath);

		execFileSync("python3", [
			"-m", "edge_tts",
			"--voice", voice,
			`--rate=${rate}`,
			"--text", section.narration,
			"--write-media", audioPath,
		], { stdio: "pipe" });

		const duration = getDuration(audioPath);
		sectionDurations.push(duration);
		console.log(`  Section ${i + 1}: ${duration.toFixed(1)}s — "${section.narration.substring(0, 40)}..."`);
	}

	const totalAudioDuration = sectionDurations.reduce((a, b) => a + b, 0);
	console.log(`  Total audio: ${totalAudioDuration.toFixed(1)}s`);

	// Step 2: Concatenate audio
	console.log("\nStep 2: Concatenating audio...");
	const concatList = join(tmpDir, "concat.txt");
	writeFileSync(concatList, sectionAudioPaths.map(p => `file '${p}'`).join("\n"));

	const fullAudioPath = join(tmpDir, "full-audio.mp3");
	execFileSync("ffmpeg", [
		"-y", "-f", "concat", "-safe", "0",
		"-i", concatList,
		"-c", "copy",
		fullAudioPath,
	], { stdio: "pipe" });

	// Step 3: Build props with frame-accurate timing
	console.log("\nStep 3: Building composition props...");
	const paddingFrames = 6;
	let currentFrame = 0;
	const remotionSections = spec.sections.map((section, i) => {
		const durationFrames = Math.ceil(sectionDurations[i] * fps) + paddingFrames;
		// Forward all section fields except narration (which is TTS-only)
		const { narration: _n, ...sectionProps } = section as Record<string, unknown>;

		// For visual scenes with videoSrc, compute playbackRate to match narration
		let videoPlaybackRate: number | undefined;
		const videoSrc = (sectionProps as Record<string, unknown>).videoSrc as string | undefined;
		if (videoSrc) {
			const videoPath = resolve(__dirname, "public", videoSrc);
			if (existsSync(videoPath)) {
				const clipDuration = getDuration(videoPath);
				const sectionDuration = sectionDurations[i] + paddingFrames / fps;
				// Slow down or speed up clip to fill ~90% of section (leave room for fade)
				const targetDuration = sectionDuration * 0.92;
				videoPlaybackRate = clipDuration / targetDuration;
				// Clamp to reasonable range (0.3x - 2.0x)
				videoPlaybackRate = Math.max(0.3, Math.min(2.0, videoPlaybackRate));
				console.log(`  Visual: ${videoSrc} (${clipDuration.toFixed(1)}s clip → ${sectionDuration.toFixed(1)}s section, rate=${videoPlaybackRate.toFixed(2)})`);
			}
		}

		const result = {
			...sectionProps,
			startFrame: currentFrame,
			durationFrames,
			...(videoPlaybackRate !== undefined ? { videoPlaybackRate } : {}),
		};
		currentFrame += durationFrames;
		return result;
	});

	const totalFrames = currentFrame + 30; // 1s tail

	// Build input props: sections + all other spec fields (title, nodeCount, etc.)
	// This makes the pipeline composition-agnostic — extra props are forwarded.
	const { sections: _sections, voice: _v, rate: _r, composition: _c, bgm: _bgm, bgmVolume: _bgmVol, ...extraProps } = spec as Record<string, unknown>;
	const inputProps = {
		sections: remotionSections,
		authorName: (spec as Record<string, unknown>).authorName || "Lamarck",
		backgroundColor: (spec as Record<string, unknown>).backgroundColor || "#0a0a0a",
		accentColor: (spec as Record<string, unknown>).accentColor || "#00d4ff",
		...extraProps,
	};

	console.log(`  Total frames: ${totalFrames} (${(totalFrames / fps).toFixed(1)}s)`);

	// Step 4: Bundle and render with programmatic API (allows custom duration)
	console.log(`\nStep 4: Bundling...`);
	const entryPoint = resolve(__dirname, "src/index.ts");
	const bundled = await bundle({ entryPoint, webpackOverride: (config) => config });

	console.log(`  Selecting composition ${compositionId}...`);
	const composition = await selectComposition({
		serveUrl: bundled,
		id: compositionId,
		inputProps,
	});

	// Override duration
	composition.durationInFrames = totalFrames;

	const videoOnlyPath = join(tmpDir, "video-only.mp4");
	console.log(`  Rendering ${totalFrames} frames...`);

	await renderMedia({
		composition,
		serveUrl: bundled,
		codec: "h264",
		outputLocation: videoOnlyPath,
		inputProps,
		crf: 18,
		onProgress: ({ progress }) => {
			if (Math.round(progress * 100) % 20 === 0) {
				process.stdout.write(`  ${Math.round(progress * 100)}%\r`);
			}
		},
	});
	console.log(`  Render complete.`);

	// Step 5: Mix BGM if specified, then combine video + audio
	let finalAudioPath = fullAudioPath;

	if (spec.bgm) {
		console.log("\nStep 5a: Mixing BGM...");
		const bgmPath = spec.bgm.startsWith("/")
			? spec.bgm
			: resolve(dirname(specPath), spec.bgm);
		const bgmVolume = spec.bgmVolume ?? 0.08;
		const mixedAudioPath = join(tmpDir, "mixed-audio.mp3");

		execFileSync("ffmpeg", [
			"-y",
			"-i", fullAudioPath,
			"-i", bgmPath,
			"-filter_complex",
			`[0:a]volume=1.0[voice];[1:a]volume=${bgmVolume},afade=t=out:st=${totalAudioDuration - 2}:d=2[bgm];[voice][bgm]amix=inputs=2:duration=first[out]`,
			"-map", "[out]",
			"-ac", "2",
			mixedAudioPath,
		], { stdio: "pipe" });

		finalAudioPath = mixedAudioPath;
		console.log(`  BGM mixed at ${(bgmVolume * 100).toFixed(0)}% volume from: ${bgmPath}`);
	}

	console.log("\nStep 5: Combining video + audio...");
	execFileSync("ffmpeg", [
		"-y",
		"-i", videoOnlyPath,
		"-i", finalAudioPath,
		"-map", "0:v",  // video from Remotion render
		"-map", "1:a",  // audio from TTS (not Remotion's silent audio track)
		"-c:v", "copy",
		"-c:a", "aac",
		"-shortest",
		outputPath,
	], { stdio: "pipe" });

	const finalDuration = getDuration(outputPath);
	const fileSizeBytes = readFileSync(outputPath).length;

	console.log(`\n=== Done ===`);
	console.log(`Output: ${outputPath}`);
	console.log(`Duration: ${finalDuration.toFixed(1)}s`);
	console.log(`Size: ${(fileSizeBytes / 1024 / 1024).toFixed(1)} MB`);

	// Cleanup
	try { execSync(`rm -rf "${tmpDir}"`); } catch { /* ignore */ }
}

main().catch(e => {
	console.error("Pipeline failed:", e.message);
	process.exit(1);
});
