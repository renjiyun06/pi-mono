#!/usr/bin/env npx tsx
/**
 * Download Douyin video by video ID or URL.
 *
 * Connects to Chrome via CDP, opens the video page, extracts the video source URL,
 * and downloads it with curl.
 *
 * Outputs the downloaded file path to stdout.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";
import { chromium } from "playwright";

const CDP_HOST = "172.30.144.1";
const CDP_PORT = 19222;
const DEFAULT_OUTPUT_DIR = "/home/lamarck/pi-mono/lamarck/data/videos";

async function getWebSocketUrl(): Promise<string> {
  const resp = await fetch(`http://${CDP_HOST}:${CDP_PORT}/json/version`);
  const data = await resp.json();
  return data.webSocketDebuggerUrl;
}

function extractVideoId(input: string): string {
  const match = input.match(/video\/(\d+)/);
  if (match) return match[1];
  return input.replace(/\D/g, "");
}

async function downloadVideo(videoId: string, outputDir: string): Promise<string> {
  const url = `https://www.douyin.com/video/${videoId}`;
  const outputPath = path.join(outputDir, `${videoId}.mp4`);

  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.error(`[SKIP] ${videoId}.mp4 already exists`);
    return outputPath;
  }

  console.error(`[OPEN] ${url}`);

  const wsUrl = await getWebSocketUrl();
  const browser = await chromium.connectOverCDP(wsUrl);
  const context = browser.contexts()[0];
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for video to load
    await page.waitForSelector("video", { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Get video source URL
    const videoUrl = await page.evaluate(() => {
      const video = document.querySelector("video");
      return video?.currentSrc || "";
    });

    if (!videoUrl) {
      throw new Error(`No video source found for ${videoId}`);
    }

    console.error(`[DOWNLOAD] ${videoId}.mp4`);

    // Download with curl
    execSync(
      `curl -s -o "${outputPath}" "${videoUrl}" -H "Referer: https://www.douyin.com/"`,
      { timeout: 120000 }
    );

    // Verify file
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Download failed for ${videoId}`);
    }

    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.error(`[DONE] ${videoId}.mp4 (${sizeMB}M)`);

    return outputPath;
  } finally {
    await page.close();
    await browser.close();
  }
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("download-douyin-video")
    .description("Download Douyin video by video ID or URL")
    .argument("<video>", "Video ID or full Douyin URL")
    .option("-o, --output <dir>", "Output directory", DEFAULT_OUTPUT_DIR)
    .action(async (video: string, opts: { output: string }) => {
      const videoId = extractVideoId(video);
      if (!videoId) {
        console.error("Invalid video ID or URL");
        process.exit(1);
      }

      // Ensure output directory exists
      fs.mkdirSync(opts.output, { recursive: true });

      try {
        const outputPath = await downloadVideo(videoId, opts.output);
        // Output path to stdout for piping
        console.log(outputPath);
      } catch (err: any) {
        console.error(`[ERROR] ${err.message}`);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

main();
