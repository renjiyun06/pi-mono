#!/usr/bin/env npx tsx
/**
 * Extract audio track from a video file.
 *
 * Outputs the extracted audio file path to stdout.
 */

import { execFile } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { Command } from "commander";

function extractAudio(videoFile: string, outputDir: string, format: string): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(videoFile)) {
			reject(new Error(`File not found: ${videoFile}`));
			return;
		}

		fs.mkdirSync(outputDir, { recursive: true });

		const basename = path.basename(videoFile, path.extname(videoFile));
		const outputFile = path.join(outputDir, `${basename}.${format}`);

		const codecMap: Record<string, string[]> = {
			mp3: ["-acodec", "libmp3lame", "-q:a", "2"],
			wav: ["-acodec", "pcm_s16le"],
			m4a: ["-acodec", "aac", "-q:a", "2"],
		};

		const codecArgs = codecMap[format];
		if (!codecArgs) {
			reject(new Error(`Unsupported format: ${format}. Use: mp3, wav, m4a`));
			return;
		}

		const args = ["-i", videoFile, "-vn", ...codecArgs, outputFile, "-y", "-loglevel", "error"];

		execFile("ffmpeg", args, (err, _stdout, stderr) => {
			if (err) {
				reject(new Error(stderr.trim() || err.message));
				return;
			}
			resolve(outputFile);
		});
	});
}

const program = new Command()
	.name("extract-audio")
	.description("Extract audio track from a video file. Outputs the audio file path to stdout.")
	.argument("<video>", "Video file path")
	.option("-o, --output <dir>", "Output directory (default: same as input file)")
	.option("-f, --format <fmt>", "Audio format: mp3, wav, m4a", "mp3")
	.action(async (videoFile: string, opts: { output?: string; format: string }) => {
		const outputDir = opts.output || path.dirname(videoFile);
		try {
			const filepath = await extractAudio(videoFile, outputDir, opts.format);
			console.log(filepath);
		} catch (err) {
			console.error(`Error: ${err instanceof Error ? err.message : err}`);
			process.exit(1);
		}
	});

program.parse();
