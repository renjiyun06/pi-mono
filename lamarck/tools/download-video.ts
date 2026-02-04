#!/usr/bin/env npx tsx
/**
 * Download a video from a URL.
 *
 * Supports Douyin, Bilibili, YouTube, Twitter/X, and hundreds of other
 * platforms via yt-dlp. Outputs the downloaded file path to stdout.
 */

import { execFile } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { Command } from "commander";

const TOOLS_DIR = import.meta.dirname!;
const BIN_DIR = path.join(TOOLS_DIR, "bin");
const YT_DLP = path.join(BIN_DIR, "yt-dlp");
const COOKIES_DIR = path.join(TOOLS_DIR, "cookies");

async function ensureYtDlp(): Promise<void> {
	if (fs.existsSync(YT_DLP)) return;

	console.error("yt-dlp not found, downloading...");
	fs.mkdirSync(BIN_DIR, { recursive: true });

	// @ts-ignore - CJS module with default export
	const YTDlpWrapModule = await import("yt-dlp-wrap");
	const YTDlpWrap = YTDlpWrapModule.default?.default || YTDlpWrapModule.default;
	await YTDlpWrap.downloadFromGithub(YT_DLP);
	console.error("yt-dlp downloaded successfully.");
}

function detectCookies(url: string): string | undefined {
	const platformMap: Record<string, string[]> = {
		douyin: ["douyin.com", "iesdouyin.com"],
		bilibili: ["bilibili.com"],
		youtube: ["youtube.com", "youtu.be"],
		twitter: ["twitter.com", "x.com"],
		tiktok: ["tiktok.com"],
	};

	for (const [platform, domains] of Object.entries(platformMap)) {
		if (domains.some((d) => url.includes(d))) {
			const cookiePath = path.join(COOKIES_DIR, `${platform}.txt`);
			if (fs.existsSync(cookiePath)) return cookiePath;
		}
	}
	return undefined;
}

async function download(url: string, outputDir: string, cookiesFile?: string): Promise<string> {
	await ensureYtDlp();

	return new Promise((resolve, reject) => {
		fs.mkdirSync(outputDir, { recursive: true });

		const args = [
			"-f", "bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b",
			"--merge-output-format", "mp4",
			"-o", path.join(outputDir, "%(title).80s.%(ext)s"),
			"--no-playlist",
			"--print", "after_move:filepath",
			"--quiet",
		];

		if (cookiesFile) {
			args.push("--cookies", cookiesFile);
		}

		args.push(url);

		execFile(YT_DLP, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
			if (err) {
				reject(new Error(stderr.trim() || err.message));
				return;
			}
			resolve(stdout.trim());
		});
	});
}

const program = new Command()
	.name("download-video")
	.description("Download a video from a URL. Outputs the file path to stdout.")
	.argument("<url>", "Video URL (Douyin, Bilibili, YouTube, etc.)")
	.option("-o, --output <dir>", "Output directory", ".")
	.option("-c, --cookies <file>", "Cookies file in Netscape format (auto-detected per platform)")
	.addHelpText("after", `
Cookies auto-detection:
  Place cookies in lamarck/tools/cookies/ named by platform:
    douyin.txt, bilibili.txt, youtube.txt, twitter.txt, tiktok.txt
`)
	.action(async (url: string, opts: { output: string; cookies?: string }) => {
		const cookiesFile = opts.cookies || detectCookies(url);
		try {
			const filepath = await download(url, opts.output, cookiesFile);
			console.log(filepath);
		} catch (err) {
			console.error(`Error: ${err instanceof Error ? err.message : err}`);
			process.exit(1);
		}
	});

program.parse();
