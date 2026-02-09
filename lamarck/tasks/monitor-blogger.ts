#!/usr/bin/env npx tsx
/**
 * Monitor Douyin bloggers for new videos
 * Connects to Chrome via CDP, scrapes video list, inserts new videos to inbox
 * Reads accounts from douyin_accounts table, monitors all of them in rotation
 */

import { program } from "commander";
import { chromium, Page } from "playwright";
import { execSync } from "child_process";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";
const BASE_URL = "https://www.douyin.com/user/";

interface VideoInfo {
  videoId: string;
  title: string;
  url: string;
  cover: string;
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

function buildProfileUrl(account: DouyinAccount): string {
  if (account.profileUrl && account.profileUrl.startsWith("http")) {
    return account.profileUrl;
  }
  // profile_url is empty or just the user ID part
  return BASE_URL + account.accountId;
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

function getKnownVideoIds(accountName: string): Set<string> {
  const source = `douyin:${accountName}`;
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" "SELECT content FROM inbox WHERE source = '${source}'"`,
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

function insertToInbox(video: VideoInfo, accountName: string): void {
  const source = `douyin:${accountName}`;
  const content = JSON.stringify(video).replace(/'/g, "''");
  const sql = `INSERT INTO inbox (source, content) VALUES ('${source}', '${content}');`;
  execSync(`sqlite3 "${DB_PATH}"`, { input: sql });
  console.log(
    `[${new Date().toISOString()}] [${accountName}] New video: ${video.title.slice(0, 50)}`
  );
}

async function checkAccountForNewVideos(
  page: Page,
  account: DouyinAccount,
  knownIdsCache: Map<string, Set<string>>
): Promise<void> {
  const profileUrl = buildProfileUrl(account);

  // Get or create known IDs set for this account
  let knownIds = knownIdsCache.get(account.accountName);
  if (!knownIds) {
    knownIds = getKnownVideoIds(account.accountName);
    knownIdsCache.set(account.accountName, knownIds);
  }

  try {
    await page.goto(profileUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('a[href*="/video/"]', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const videos = await extractVideos(page);
    console.log(
      `[${new Date().toISOString()}] [${account.accountName}] Found ${videos.length} videos`
    );

    for (const video of videos) {
      if (!knownIds.has(video.videoId)) {
        insertToInbox(video, account.accountName);
        knownIds.add(video.videoId);
      }
    }
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [${account.accountName}] Error:`,
      err
    );
  }
}

async function monitorAllAccounts(
  page: Page,
  accountDelay: number,
  knownIdsCache: Map<string, Set<string>>
): Promise<void> {
  // Re-read accounts from DB each polling cycle (accounts may change)
  const accounts = getAccountsFromDb();
  console.log(
    `[${new Date().toISOString()}] Monitoring ${accounts.length} accounts...`
  );

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    await checkAccountForNewVideos(page, account, knownIdsCache);

    // Delay between accounts (except after the last one)
    if (i < accounts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, accountDelay));
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Detailed description for --describe
const DESCRIPTION = `
Monitor Douyin Bloggers (抖音博主监控)

目的：
  监控 douyin_accounts 表中所有博主的新视频，追踪竞品/对标账号动态

数据来源：
  - 数据库: ${DB_PATH}
  - 表: douyin_accounts (account_id, account_name, profile_url, direction)
  - 每次轮询重新读取，支持动态增删账号

采集内容：
  - 视频 ID、标题、链接
  - 封面图片

存储位置：
  - ${DB_PATH} → inbox 表
  - source: "douyin:<账号名>"

与抖音账号关系：
  - 对标账号 → 学习选题和内容形式
  - 新视频 → 竞品分析参考

运行参数：
  --interval <seconds>   轮询间隔（默认 300 秒）
  --delay <seconds>      账号间延迟（默认 5 秒）
  --describe             显示此详细描述
`.trim();

async function main(): Promise<void> {
  program
    .name("monitor-blogger")
    .description("Monitor Douyin bloggers for new videos")
    .option("-i, --interval <seconds>", "Polling interval in seconds", "300")
    .option("-y, --delay <seconds>", "Delay between accounts in seconds", "5")
    .option("-d, --describe", "Show detailed description")
    .parse();

  const opts = program.opts();

  if (opts.describe) {
    console.log(DESCRIPTION);
    process.exit(0);
  }

  const interval = parseInt(opts.interval, 10) * 1000;
  const accountDelay = parseInt(opts.delay, 10) * 1000;

  // Check accounts exist
  const accounts = getAccountsFromDb();
  if (accounts.length === 0) {
    console.error("No accounts found in douyin_accounts table");
    process.exit(1);
  }

  console.log(`Starting monitor:`);
  console.log(`  - Accounts: ${accounts.length}`);
  console.log(`  - Polling interval: ${opts.interval}s`);
  console.log(`  - Account delay: ${opts.delay}s`);

  const wsUrl = await getWebSocketUrl();
  const browser = await chromium.connectOverCDP(wsUrl);
  const context = browser.contexts()[0];
  const page = await context.newPage();

  // Cache known video IDs per account
  const knownIdsCache = new Map<string, Set<string>>();

  // Initial check
  await monitorAllAccounts(page, accountDelay, knownIdsCache);

  // Polling loop
  while (true) {
    await sleep(interval);
    try {
      await monitorAllAccounts(page, accountDelay, knownIdsCache);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error in polling loop:`, err);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
