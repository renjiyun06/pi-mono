#!/usr/bin/env npx tsx
/**
 * Process hot videos from database: download + transcribe.
 * Uses Playwright CDP to capture video URLs.
 */

import { chromium, type Browser, type Page } from "playwright";
import { execSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

const CDP_HOST = "172.30.144.1";
const CDP_PORT = 19222;
const PI_MONO = "/home/lamarck/pi-mono";
const VIDEO_DIR = path.join(PI_MONO, "lamarck/data/videos");
const TRANSCRIPT_DIR = path.join(PI_MONO, "lamarck/data/transcripts");
const DB_PATH = path.join(PI_MONO, "lamarck/data/lamarck.db");
const EXTRACT_AUDIO = path.join(PI_MONO, "lamarck/tools/extract-audio.ts");
const TRANSCRIBE = path.join(PI_MONO, "lamarck/tools/transcribe-audio.ts");

interface VideoRecord {
  video_id: string;
  account_id: string;
  title: string;
  like_count: number;
}

interface ProcessResult {
  video_id: string;
  title: string;
  like_count: number;
  success: boolean;
  error?: string;
  video_path?: string;
  transcript_path?: string;
}

async function getWebSocketUrl(): Promise<string> {
  const resp = await fetch(`http://${CDP_HOST}:${CDP_PORT}/json/version`);
  const data = await resp.json();
  return data.webSocketDebuggerUrl;
}

function getHotVideos(limit: number): VideoRecord[] {
  const sql = `
    SELECT video_id, account_id, title, like_count 
    FROM douyin_videos 
    WHERE like_count >= 100000 
      AND (video_path IS NULL OR video_path = '')
    ORDER BY like_count DESC
    LIMIT ${limit};
  `;
  const result = execSync(`sqlite3 -json "${DB_PATH}" "${sql}"`, { encoding: "utf8" });
  return JSON.parse(result || "[]");
}

function updateDatabase(videoId: string, videoPath: string, transcriptPath: string): void {
  const escapedVideoPath = videoPath.replace(/'/g, "''");
  const escapedTranscriptPath = transcriptPath.replace(/'/g, "''");
  const sql = `UPDATE douyin_videos SET video_path = '${escapedVideoPath}', transcript_path = '${escapedTranscriptPath}' WHERE video_id = '${videoId}';`;
  execSync(`sqlite3 "${DB_PATH}" "${sql}"`);
}

async function downloadVideo(
  browser: Browser,
  videoId: string
): Promise<string | null> {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  const outputPath = path.join(VIDEO_DIR, `${videoId}.mp4`);

  // Skip if already exists
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 10000) {
    console.log(`  [SKIP] ${videoId}.mp4 already exists`);
    return outputPath;
  }

  const videoUrl = `https://www.douyin.com/video/${videoId}`;
  console.log(`  [DOWNLOAD] ${videoId}...`);

  const context = browser.contexts()[0];
  const page = await context.newPage();

  try {
    let capturedVideoUrl: string | null = null;

    // Listen for video responses
    page.on("response", async (response) => {
      const url = response.url();
      const contentType = response.headers()["content-type"] || "";
      if (
        (contentType.includes("video") ||
          url.includes("douyinvod") ||
          url.includes("bytevclod") ||
          url.includes("bytecdn")) &&
        !capturedVideoUrl
      ) {
        capturedVideoUrl = url;
        console.log(`  [CAPTURED] Video URL found`);
      }
    });

    await page.goto(videoUrl, { waitUntil: "domcontentloaded" });

    // Wait for video to load (up to 20 seconds)
    for (let i = 0; i < 20 && !capturedVideoUrl; i++) {
      await page.waitForTimeout(1000);
    }

    if (!capturedVideoUrl) {
      // Try to get from video element
      capturedVideoUrl = await page.evaluate(() => {
        const v = document.querySelector("video");
        return v?.src || v?.currentSrc || null;
      });
    }

    if (!capturedVideoUrl) {
      console.error(`  [FAIL] No video URL captured`);
      return null;
    }

    // Download the video
    console.log(`  [FETCH] Downloading...`);
    const resp = await fetch(capturedVideoUrl, {
      headers: {
        Referer: "https://www.douyin.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      },
    });

    if (!resp.ok) {
      console.error(`  [FAIL] Download failed: HTTP ${resp.status}`);
      return null;
    }

    const buffer = await resp.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(1);
    console.log(`  [DONE] ${videoId}.mp4 (${sizeMB} MB)`);
    return outputPath;
  } finally {
    await page.close();
  }
}

async function transcribeVideo(videoPath: string, videoId: string): Promise<string | null> {
  fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true });
  const audioPath = videoPath.replace(".mp4", ".wav");
  const outPath = path.join(TRANSCRIPT_DIR, `${videoId}.txt`);

  // Skip if transcript exists
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
    console.log(`  [SKIP] Transcript already exists`);
    return outPath;
  }

  console.log(`  [EXTRACT] Audio...`);
  try {
    execSync(`npx tsx "${EXTRACT_AUDIO}" "${videoPath}" -f wav`, {
      encoding: "utf8",
      timeout: 120000,
      stdio: ["pipe", "pipe", "inherit"],
    });
  } catch (err: any) {
    console.error(`  [FAIL] Audio extraction failed`);
    return null;
  }

  console.log(`  [TRANSCRIBE] ${videoId}...`);
  try {
    execSync(`npx tsx "${TRANSCRIBE}" "${audioPath}" -o "${outPath}"`, {
      encoding: "utf8",
      timeout: 600000,
      stdio: ["pipe", "pipe", "inherit"],
    });
    console.log(`  [DONE] Transcribed`);

    // Clean up audio file
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    return outPath;
  } catch (err) {
    console.error(`  [FAIL] Transcribe failed`);
    return null;
  }
}

async function main() {
  const limit = parseInt(process.argv[2] || "5", 10);
  console.log(`Processing top ${limit} hot videos...\n`);

  const videos = getHotVideos(limit);
  console.log(`Found ${videos.length} videos to process\n`);

  if (videos.length === 0) {
    console.log("No videos to process.");
    return;
  }

  console.log("Connecting to Chrome...");
  const wsUrl = await getWebSocketUrl();
  const browser = await chromium.connectOverCDP(wsUrl);
  console.log("Connected!\n");

  const results: ProcessResult[] = [];

  try {
    for (const video of videos) {
      console.log(`=== ${video.video_id} ===`);
      console.log(`  Title: ${video.title.slice(0, 50)}...`);
      console.log(`  Likes: ${(video.like_count / 10000).toFixed(1)}万`);

      const result: ProcessResult = {
        video_id: video.video_id,
        title: video.title,
        like_count: video.like_count,
        success: false,
      };

      try {
        // Download
        const videoPath = await downloadVideo(browser, video.video_id);
        if (!videoPath) {
          result.error = "Download failed";
          results.push(result);
          console.log("");
          continue;
        }
        result.video_path = videoPath;

        // Transcribe
        const transcriptPath = await transcribeVideo(videoPath, video.video_id);
        if (!transcriptPath) {
          result.error = "Transcribe failed";
          // Still update video_path in DB
          updateDatabase(video.video_id, videoPath, "");
          results.push(result);
          console.log("");
          continue;
        }
        result.transcript_path = transcriptPath;

        // Update database
        updateDatabase(video.video_id, videoPath, transcriptPath);
        result.success = true;
        console.log(`  [DB] Updated\n`);
      } catch (err: any) {
        result.error = err.message;
        console.error(`  [ERROR] ${err.message}\n`);
      }

      results.push(result);

      // Small delay between videos
      await new Promise((r) => setTimeout(r, 2000));
    }
  } finally {
    await browser.close();
  }

  // Summary
  console.log("\n=== Summary ===");
  const success = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);

  // Write report
  const reportPath = path.join(PI_MONO, "lamarck/tmp/process-hot-videos.md");
  let report = `# Hot Videos Processing Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n`;
  report += `- Total: ${results.length}\n`;
  report += `- Success: ${success}\n`;
  report += `- Failed: ${failed}\n\n`;
  report += `## Results\n\n`;

  for (const r of results) {
    report += `### ${r.video_id}\n`;
    report += `- Title: ${r.title}\n`;
    report += `- Likes: ${(r.like_count / 10000).toFixed(1)}万\n`;
    report += `- Status: ${r.success ? "✓ Success" : "✗ Failed"}\n`;
    if (r.error) report += `- Error: ${r.error}\n`;
    if (r.video_path) report += `- Video: ${r.video_path}\n`;
    if (r.transcript_path) {
      report += `- Transcript: ${r.transcript_path}\n`;
      // Read transcript content
      try {
        const content = fs.readFileSync(r.transcript_path, "utf8").trim();
        if (content) {
          report += `- Content Preview:\n\`\`\`\n${content.slice(0, 500)}${content.length > 500 ? "..." : ""}\n\`\`\`\n`;
        }
      } catch {}
    }
    report += "\n";
  }

  fs.writeFileSync(reportPath, report);
  console.log(`\nReport: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
