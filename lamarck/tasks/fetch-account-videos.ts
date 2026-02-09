#!/usr/bin/env npx tsx
/**
 * Fetch all videos from Douyin accounts
 * Scrolls through each account's profile page to collect all videos
 * and saves them to the douyin_videos table
 */

import { program } from "commander";
import { chromium, Page } from "playwright";
import { execSync } from "child_process";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";

interface VideoInfo {
  videoId: string;
  title: string;
  videoUrl: string;
  coverUrl: string;
  likeCount: number | null;
}

interface DouyinAccount {
  accountId: string;
  accountName: string;
  profileUrl: string;
}

async function getWebSocketUrl(): Promise<string> {
  const resp = await fetch("http://172.30.144.1:19222/json/version");
  const data = await resp.json();
  return data.webSocketDebuggerUrl;
}

function getAccountsFromDb(): DouyinAccount[] {
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" "SELECT account_id, account_name, profile_url FROM douyin_accounts"`,
      { encoding: "utf-8" }
    );
    const accounts: DouyinAccount[] = [];
    result.split("\n").forEach((line) => {
      if (!line.trim()) return;
      const [accountId, accountName, profileUrl] = line.split("|");
      if (accountId && accountName) {
        accounts.push({ accountId, accountName, profileUrl: profileUrl || "" });
      }
    });
    return accounts;
  } catch (err) {
    console.error("Failed to read accounts from database:", err);
    return [];
  }
}

function parseCount(countStr: string): number | null {
  if (!countStr) return null;
  const cleaned = countStr.trim();
  if (!cleaned) return null;

  // Handle formats like "5.7万", "1.4万", "103.3万"
  const wanMatch = cleaned.match(/^([\d.]+)万$/);
  if (wanMatch) {
    return Math.round(parseFloat(wanMatch[1]) * 10000);
  }

  // Handle pure numbers like "8018", "7792"
  const num = parseInt(cleaned.replace(/,/g, ""), 10);
  return isNaN(num) ? null : num;
}

async function extractVideos(page: Page): Promise<VideoInfo[]> {
  return await page.evaluate(() => {
    const videos: {
      videoId: string;
      title: string;
      videoUrl: string;
      coverUrl: string;
      likeCountStr: string;
    }[] = [];

    // Find all video links - they contain /video/ or /note/
    const links = document.querySelectorAll('a[href*="/video/"], a[href*="/note/"]');

    links.forEach((link) => {
      const anchor = link as HTMLAnchorElement;
      const href = anchor.href;

      // Extract video ID from URL
      const videoMatch = href.match(/\/(video|note)\/(\d+)/);
      if (!videoMatch) return;

      const videoId = videoMatch[2];

      // Skip if already added
      if (videos.some((v) => v.videoId === videoId)) return;

      // Get image for cover
      const img = link.querySelector("img") as HTMLImageElement;
      const coverUrl = img?.src || "";
      const title = img?.alt || "";

      // Get like count - find StaticText with number format
      const textNodes = link.querySelectorAll('[class*="StaticText"]');
      let likeCountStr = "";

      // Fallback: look for text content with number pattern
      const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim() || "";
        // Match patterns like "5.7万", "8018"
        if (/^\d+\.?\d*万?$/.test(text) && text !== "置顶" && text !== "共创") {
          likeCountStr = text;
          break;
        }
      }

      videos.push({
        videoId,
        title: title.replace(/^.*?：/, "").trim(), // Remove account name prefix
        videoUrl: href,
        coverUrl,
        likeCountStr,
      });
    });

    return videos;
  }).then((results) =>
    results.map((r) => ({
      videoId: r.videoId,
      title: r.title,
      videoUrl: r.videoUrl,
      coverUrl: r.coverUrl,
      likeCount: parseCount(r.likeCountStr),
    }))
  );
}

async function scrollToBottom(page: Page, maxScrolls: number = 200): Promise<void> {
  let lastVideoCount = 0;
  let sameCountTimes = 0;
  const maxSameTimes = 8; // Stop after 8 scrolls with no new videos

  // Find the scrollable container (Douyin uses .parent-route-container)
  const containerSelector = ".parent-route-container";

  for (let i = 0; i < maxScrolls; i++) {
    // Count videos
    const videoCount = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/video/"], a[href*="/note/"]');
      return links.length;
    });

    if (i % 10 === 0) {
      console.log(`    Scroll ${i}: ${videoCount} videos loaded`);
    }

    if (videoCount === lastVideoCount) {
      sameCountTimes++;
      if (sameCountTimes >= maxSameTimes) {
        console.log(`    Reached bottom after ${i} scrolls (${videoCount} videos)`);
        break;
      }
    } else {
      sameCountTimes = 0;
      lastVideoCount = videoCount;
    }

    // Scroll the container to bottom
    await page.evaluate((sel) => {
      const container = document.querySelector(sel);
      if (container) {
        container.scrollTop = container.scrollHeight;
      } else {
        window.scrollTo(0, document.body.scrollHeight);
      }
    }, containerSelector);

    // Wait for content to load
    await page.waitForTimeout(2000);
  }
}

function upsertVideo(
  video: VideoInfo,
  accountId: string,
  accountName: string
): void {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const title = video.title.replace(/'/g, "''");
  const videoUrl = video.videoUrl.replace(/'/g, "''");
  const coverUrl = video.coverUrl.replace(/'/g, "''");
  const likeCount = video.likeCount !== null ? video.likeCount : "NULL";
  const accName = accountName.replace(/'/g, "''");

  const sql = `
    INSERT INTO douyin_videos (video_id, account_id, account_name, title, video_url, cover_url, like_count, updated_at)
    VALUES ('${video.videoId}', '${accountId}', '${accName}', '${title}', '${videoUrl}', '${coverUrl}', ${likeCount}, '${now}')
    ON CONFLICT(video_id) DO UPDATE SET
      title = '${title}',
      cover_url = '${coverUrl}',
      like_count = ${likeCount},
      updated_at = '${now}';
  `;

  try {
    execSync(`sqlite3 "${DB_PATH}"`, { input: sql });
  } catch (err) {
    console.error(`    Failed to upsert video ${video.videoId}:`, err);
  }
}

async function fetchAccountVideos(
  page: Page,
  account: DouyinAccount
): Promise<number> {
  const profileUrl = account.profileUrl || `https://www.douyin.com/user/${account.accountId}`;

  console.log(`\n[${account.accountName}] Opening ${profileUrl}`);

  try {
    await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('a[href*="/video/"], a[href*="/note/"]', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Scroll to load all videos
    console.log(`  Scrolling to load all videos...`);
    await scrollToBottom(page);

    // Extract all videos
    const videos = await extractVideos(page);
    console.log(`  Found ${videos.length} videos`);

    // Save to database
    let saved = 0;
    for (const video of videos) {
      upsertVideo(video, account.accountId, account.accountName);
      saved++;
    }
    console.log(`  Saved ${saved} videos to database`);

    return saved;
  } catch (err) {
    console.error(`  Error:`, err);
    return 0;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Detailed description for --describe
const DESCRIPTION = `
Fetch Account Videos (抖音账号视频采集)

目的：
  从 douyin_accounts 表中的所有账号批量采集视频列表

数据来源：
  - 数据库: ${DB_PATH}
  - 表: douyin_accounts

采集内容：
  - video_id: 视频唯一标识
  - title: 视频标题
  - video_url: 视频链接
  - cover_url: 封面图 URL
  - like_count: 点赞数（从主页获取）
  - comment_count: 评论数（主页不显示，需单独获取）

存储位置：
  - ${DB_PATH} → douyin_videos 表
  - 使用 UPSERT 机制，重复视频会更新点赞数和时间

与抖音账号关系：
  - 采集对标账号的全部视频列表
  - 为后续视频分析、下载、转写提供数据基础

运行参数：
  --delay <seconds>      账号间延迟（默认 5 秒）
  --account <id>         只采集指定账号（可多次使用）
  --once                 只运行一次（默认）
  --interval <minutes>   循环运行间隔（分钟），不设置则只跑一次
  --describe             显示此详细描述
`.trim();

async function runOnce(
  specificAccounts: string[],
  accountDelay: number
): Promise<number> {
  // Get accounts
  let accounts = getAccountsFromDb();
  if (accounts.length === 0) {
    console.error("No accounts found in douyin_accounts table");
    return 0;
  }

  // Filter if specific accounts requested
  if (specificAccounts.length > 0) {
    accounts = accounts.filter(
      (a) => specificAccounts.includes(a.accountId) || specificAccounts.includes(a.accountName)
    );
    if (accounts.length === 0) {
      console.error("No matching accounts found");
      return 0;
    }
  }

  console.log(`\n[${new Date().toLocaleString()}] Fetching videos for ${accounts.length} account(s)...`);

  const wsUrl = await getWebSocketUrl();
  const browser = await chromium.connectOverCDP(wsUrl);
  const context = browser.contexts()[0];
  const page = await context.newPage();

  let totalVideos = 0;

  try {
    for (let i = 0; i < accounts.length; i++) {
      const count = await fetchAccountVideos(page, accounts[i]);
      totalVideos += count;

      // Delay between accounts (except after the last one)
      if (i < accounts.length - 1) {
        console.log(`  Waiting ${accountDelay / 1000}s before next account...`);
        await sleep(accountDelay);
      }
    }

    console.log(`Done! Total videos fetched: ${totalVideos}`);
    return totalVideos;
  } finally {
    await page.close();
    await browser.close();
  }
}

async function main(): Promise<void> {
  program
    .name("fetch-account-videos")
    .description("Fetch all videos from Douyin accounts")
    .option("-y, --delay <seconds>", "Delay between accounts in seconds", "5")
    .option("-a, --account <id>", "Only fetch specific account(s)", (val, arr: string[]) => {
      arr.push(val);
      return arr;
    }, [])
    .option("-o, --once", "Run once (default)")
    .option("-i, --interval <minutes>", "Loop interval in minutes (continuous mode)")
    .option("-d, --describe", "Show detailed description")
    .parse();

  const opts = program.opts();

  if (opts.describe) {
    console.log(DESCRIPTION);
    process.exit(0);
  }

  const accountDelay = parseInt(opts.delay, 10) * 1000;
  const specificAccounts: string[] = opts.account || [];
  const intervalMinutes = opts.interval ? parseInt(opts.interval, 10) : null;

  if (intervalMinutes) {
    // Continuous mode
    console.log(`Running in continuous mode, interval: ${intervalMinutes} minutes`);
    while (true) {
      await runOnce(specificAccounts, accountDelay);
      console.log(`\nSleeping for ${intervalMinutes} minutes...`);
      await sleep(intervalMinutes * 60 * 1000);
    }
  } else {
    // One-time mode
    await runOnce(specificAccounts, accountDelay);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
