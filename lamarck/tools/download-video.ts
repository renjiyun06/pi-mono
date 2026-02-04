#!/usr/bin/env npx tsx
/**
 * Download a video from a URL.
 *
 * Douyin videos are downloaded via Playwright + Chrome CDP (requires --cdp).
 * All other platforms use yt-dlp.
 *
 * Outputs the downloaded file path to stdout.
 */

import { execFile } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { Command } from "commander";
import { chromium } from "playwright";

const TOOLS_DIR = import.meta.dirname!;
const BIN_DIR = path.join(TOOLS_DIR, "bin");
const YT_DLP = path.join(BIN_DIR, "yt-dlp");
const COOKIES_DIR = path.join(TOOLS_DIR, "cookies");

// --- Platform detection ---

const DOUYIN_DOMAINS = ["douyin.com", "iesdouyin.com"];

function isDouyin(url: string): boolean {
	return DOUYIN_DOMAINS.some((d) => url.includes(d));
}

// --- yt-dlp download (non-Douyin) ---

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

async function downloadWithYtDlp(url: string, outputDir: string, cookiesFile?: string): Promise<string> {
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

// --- Douyin download (Playwright + CDP) ---

async function connectCDP(cdpUrl: string, timeoutMs = 10000) {
	const ac = new AbortController();
	const timer = setTimeout(() => ac.abort(), timeoutMs);
	try {
		const browser = await chromium.connectOverCDP(cdpUrl, { timeout: timeoutMs });
		return browser;
	} catch (err) {
		if (ac.signal.aborted) {
			throw new Error(`CDP connection timed out after ${timeoutMs / 1000}s: ${cdpUrl}`);
		}
		throw err;
	} finally {
		clearTimeout(timer);
	}
}

async function extractDouyinVideoInfo(url: string, cdpUrl: string): Promise<{ videoUrl: string; title: string; userAgent: string }> {
	console.error("Connecting to Chrome via CDP...");
	const browser = await connectCDP(cdpUrl);

	const context = browser.contexts()[0];
	if (!context) {
		throw new Error("No browser context found. Make sure Chrome has at least one window open.");
	}

	const page = await context.newPage();

	try {
		let videoUrl: string | null = null;

		page.on("response", (response) => {
			const respUrl = response.url();
			const contentType = response.headers()["content-type"] || "";
			if (
				contentType.includes("video") ||
				respUrl.includes("douyinvod") ||
				respUrl.includes("bytevclod") ||
				respUrl.includes("bytecdn")
			) {
				if (!videoUrl) {
					videoUrl = respUrl;
					console.error("Video URL captured from network.");
				}
			}
		});

		console.error(`Opening ${url}...`);
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

		console.error("Waiting for video to load...");
		try {
			await page.waitForSelector("video", { timeout: 15000 });
		} catch {
			// Fall through — try DOM extraction anyway
		}

		// Verify we're still on the requested video page (Douyin redirects invalid URLs)
		const finalUrl = page.url();
		if (!finalUrl.includes("/video/")) {
			throw new Error(`Video not found. Page redirected to: ${finalUrl}`);
		}

		// Give a moment for the video source to populate
		await page.waitForTimeout(2000);

		if (!videoUrl) {
			videoUrl = await page.evaluate(() => {
				const video = document.querySelector("video");
				if (!video) return null;
				const source = video.querySelector("source");
				return video.src || source?.src || null;
			});
		}

		if (!videoUrl) {
			throw new Error("Could not find video URL on the page.");
		}

		const pageTitle = await page.title();
		const title = pageTitle
			.replace(/\s*-\s*抖音.*$/, "")
			.replace(/[\\/:*?"<>|]/g, "_")
			.trim()
			.substring(0, 80) || "douyin_video";

		const userAgent = await page.evaluate(() => navigator.userAgent);

		return { videoUrl, title, userAgent };
	} finally {
		await page.close();
		browser.close().catch(() => {});
		console.error("Browser tab closed.");
	}
}

async function downloadDouyin(url: string, outputDir: string, cdpUrl: string): Promise<string> {
	fs.mkdirSync(outputDir, { recursive: true });

	// Phase 1: extract video URL from browser, then release the tab
	const { videoUrl, title, userAgent } = await extractDouyinVideoInfo(url, cdpUrl);

	// Phase 2: download with Node.js (browser no longer needed)
	const outputPath = path.join(outputDir, `${title}.mp4`);
	console.error("Downloading video...");

	const resp = await fetch(videoUrl, {
		headers: {
			"Referer": "https://www.douyin.com/",
			"User-Agent": userAgent,
		},
	});

	if (!resp.ok) {
		throw new Error(`Download failed: HTTP ${resp.status}`);
	}

	const fileStream = fs.createWriteStream(outputPath);
	const reader = resp.body!.getReader();
	let downloaded = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		fileStream.write(value);
		downloaded += value.length;
		if (downloaded % (1024 * 1024) < value.length) {
			console.error(`  ${(downloaded / 1024 / 1024).toFixed(1)} MB downloaded...`);
		}
	}

	fileStream.end();
	await new Promise<void>((resolve, reject) => {
		fileStream.on("finish", resolve);
		fileStream.on("error", reject);
	});

	console.error(`Saved: ${outputPath} (${(downloaded / 1024 / 1024).toFixed(1)} MB)`);
	return outputPath;
}

// --- CLI ---

const program = new Command()
	.name("download-video")
	.description("Download a video from a URL. Outputs the file path to stdout.")
	.argument("<url>", "Video URL (Douyin, Bilibili, YouTube, etc.)")
	.option("-o, --output <dir>", "Output directory", ".")
	.option("-c, --cookies <file>", "Cookies file in Netscape format (auto-detected per platform)")
	.option("--cdp <url>", "Chrome CDP endpoint (required for Douyin)")
	.addHelpText("after", `
Douyin:
  Requires --cdp pointing to a Chrome instance with an active session.
  Example: download-video https://www.douyin.com/video/xxx --cdp http://192.168.1.4:19222

Other platforms:
  Uses yt-dlp. Cookies auto-detected from lamarck/tools/cookies/:
    bilibili.txt, youtube.txt, twitter.txt, tiktok.txt
`)
	.action(async (url: string, opts: { output: string; cookies?: string; cdp?: string }) => {
		try {
			let filepath: string;

			if (isDouyin(url)) {
				if (!opts.cdp) {
					console.error("Error: Douyin requires --cdp <url> (Chrome CDP endpoint).");
					console.error("Example: --cdp http://192.168.1.4:19222");
					process.exit(1);
				}
				filepath = await downloadDouyin(url, opts.output, opts.cdp);
			} else {
				const cookiesFile = opts.cookies || detectCookies(url);
				filepath = await downloadWithYtDlp(url, opts.output, cookiesFile);
			}

			console.log(filepath);
		} catch (err) {
			console.error(`Error: ${err instanceof Error ? err.message : err}`);
			process.exit(1);
		}
	});

program.parse();
