#!/usr/bin/env npx tsx
/**
 * Transcribe audio to text using faster-whisper.
 *
 * Outputs the transcription to stdout (or to a file with -o).
 */

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import { Command } from "commander";

const PYTHON_SCRIPT = `
import sys
from faster_whisper import WhisperModel

audio_file = sys.argv[1]
model_size = sys.argv[2] if len(sys.argv) > 2 else "small"
language = sys.argv[3] if len(sys.argv) > 3 else None
with_timestamps = sys.argv[4] == "1" if len(sys.argv) > 4 else False

model = WhisperModel(model_size, device="cpu", compute_type="int8")
segments, info = model.transcribe(audio_file, language=language, beam_size=5)

def format_time(seconds):
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

for segment in segments:
    text = segment.text.strip()
    if with_timestamps:
        start = format_time(segment.start)
        end = format_time(segment.end)
        print(f"[{start} -> {end}] {text}")
    else:
        print(text)
`;

function transcribe(
	audioFile: string,
	modelSize: string,
	language: string | undefined,
	timestamps: boolean
): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(audioFile)) {
			reject(new Error(`File not found: ${audioFile}`));
			return;
		}

		const args = ["-c", PYTHON_SCRIPT, audioFile, modelSize, language || "", timestamps ? "1" : "0"];

		const proc = spawn("python3", args, { stdio: ["pipe", "pipe", "pipe"] });

		let stdout = "";
		let stderr = "";

		proc.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		proc.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		proc.on("close", (code) => {
			if (code !== 0) {
				reject(new Error(stderr.trim() || `Process exited with code ${code}`));
				return;
			}
			resolve(stdout.trim());
		});

		proc.on("error", (err) => {
			reject(err);
		});
	});
}

const program = new Command()
	.name("transcribe-audio")
	.description("Transcribe audio to text using faster-whisper. Outputs text to stdout.")
	.argument("<audio>", "Audio file path (mp3, wav, m4a, etc.)")
	.option("-m, --model <size>", "Model size: tiny, base, small, medium, large", "small")
	.option("-l, --language <lang>", "Language code (e.g., zh, en). Auto-detect if not specified.")
	.option("-t, --timestamps", "Include timestamps in output")
	.option("-o, --output <file>", "Output file (default: stdout)")
	.action(
		async (
			audioFile: string,
			opts: { model: string; language?: string; timestamps?: boolean; output?: string }
		) => {
			try {
				const text = await transcribe(audioFile, opts.model, opts.language, opts.timestamps ?? false);
				if (opts.output) {
					fs.writeFileSync(opts.output, text);
					console.error(`Written to ${opts.output}`);
				} else {
					console.log(text);
				}
			} catch (err) {
				console.error(`Error: ${err instanceof Error ? err.message : err}`);
				process.exit(1);
			}
		}
	);

program.parse();
