#!/usr/bin/env npx tsx
/**
 * Monitor a Douyin blogger for new videos
 * Connects to Chrome via CDP, scrapes video list, inserts new videos to inbox
 */

import { program } from "commander";
import { chromium, Browser, Page } from "playwright";
import { execSync } from "child_process";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";

interface VideoInfo {
  videoId: string;
  title: string;
  url: string;
  cover: string;
}

async function getWebSocketUrl(): Promise<string> {
  const resp = await fetch("http://172.30.144.1:19222/json/version");
  const data = await resp.json();
  return data.webSocketDebuggerUrl;
}

async function extractVideos(page: Page): Promise<VideoInfo[]> {
  return await page.evaluate(() => {
    const videos: {
      videoId: string;
      title: string;
      url: string;
      cover: string;
    }[] = [];
    const items = document.querySelectorAll("li.wqW3g_Kl");

    items.forEach((item) => {
      const link = item.querySelector(
        'a[href*="/video/"]'
      ) as HTMLAnchorElement;
      const img = item.querySelector("img") as HTMLImageElement;

      if (link && link.href) {
        const match = link.href.match(/video\/(\d+)/);
        if (match) {
          videos.push({
            videoId: match[1],
            title: img?.alt || "",
            url: link.href,
            cover: img?.src || "",
          });
        }
      }
    });

    return videos;
  });
}

function getKnownVideoIds(): Set<string> {
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" "SELECT content FROM inbox WHERE source = 'douyin:秋芝2046'" 2>/dev/null`,
      { encoding: "utf-8" }
    );
    const ids = new Set<string>();
    result.split("\n").forEach((line) => {
      try {
        const data = JSON.parse(line);
        if (data.videoId) ids.add(data.videoId);
      } catch {
        // ignore parse errors
      }
    });
    return ids;
  } catch {
    return new Set();
  }
}

function insertToInbox(video: VideoInfo): void {
  const content = JSON.stringify(video).replace(/'/g, "''");
  const sql = `INSERT INTO inbox (source, content) VALUES ('douyin:秋芝2046', '${content}');`;
  execSync(`sqlite3 "${DB_PATH}"`, { input: sql });
  console.log(`[${new Date().toISOString()}] New video: ${video.title.slice(0, 50)}`);
}

async function checkForNewVideos(page: Page, knownIds: Set<string>): Promise<void> {
  const bloggerUrl =
    "https://www.douyin.com/user/MS4wLjABAAAAwbbVuf1W2DdgRe0xCa0oxg1ZIHbzuiTzyjq3NcOVgBuu6qIidYlMYqbL3ZFY2swu";

  await page.goto(bloggerUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('a[href*="/video/"]', { timeout: 30000 });
  await page.waitForTimeout(2000);

  const videos = await extractVideos(page);
  console.log(`[${new Date().toISOString()}] Found ${videos.length} videos`);

  for (const video of videos) {
    if (!knownIds.has(video.videoId)) {
      insertToInbox(video);
      knownIds.add(video.videoId);
    }
  }
}

async function main(): Promise<void> {
  program
    .name("monitor-blogger")
    .description("Monitor 秋芝2046 Douyin page for new videos")
    .option("-i, --interval <seconds>", "Polling interval in seconds", "300")
    .parse();

  const opts = program.opts();
  const interval = parseInt(opts.interval, 10) * 1000;

  console.log(`Starting monitor with interval: ${opts.interval}s`);

  const wsUrl = await getWebSocketUrl();
  const browser = await chromium.connectOverCDP(wsUrl);
  const context = browser.contexts()[0];
  const page = await context.newPage();

  const knownIds = getKnownVideoIds();
  console.log(`Known videos: ${knownIds.size}`);

  // Initial check
  await checkForNewVideos(page, knownIds);

  // Polling loop
  setInterval(async () => {
    try {
      await checkForNewVideos(page, knownIds);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error:`, err);
    }
  }, interval);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
