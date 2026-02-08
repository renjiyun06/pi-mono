#!/usr/bin/env npx tsx
/**
 * Monitor Zhihu likes (点赞记录)
 * Connects to Chrome via CDP, scrapes like activity, inserts new likes to inbox
 */

import { program } from "commander";
import { chromium, Page } from "playwright";
import { execSync } from "child_process";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";
const USER_PROFILE_URL = "https://www.zhihu.com/people/renjiyun";

interface LikeInfo {
  likeId: string; // hash of url + time for dedup
  type: string; // 赞同了回答/赞同了文章/赞同了想法
  title: string;
  url: string;
  author: string;
  likedAt: string; // 2026-02-07 21:28
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function getWebSocketUrl(): Promise<string> {
  const resp = await fetch("http://172.30.144.1:19222/json/version");
  const data = await resp.json();
  return data.webSocketDebuggerUrl;
}

async function extractLikes(page: Page): Promise<LikeInfo[]> {
  return await page.evaluate(() => {
    const likes: {
      type: string;
      title: string;
      url: string;
      author: string;
      likedAt: string;
    }[] = [];

    // Find all activity items
    const items = document.querySelectorAll("main > div > div");

    items.forEach((item) => {
      // Skip non-like items
      const textContent = item.textContent || "";
      if (
        !textContent.includes("赞同了回答") &&
        !textContent.includes("赞同了文章") &&
        !textContent.includes("赞同了想法")
      ) {
        return;
      }

      // Get type
      let type = "";
      if (textContent.includes("赞同了回答")) type = "赞同了回答";
      else if (textContent.includes("赞同了文章")) type = "赞同了文章";
      else if (textContent.includes("赞同了想法")) type = "赞同了想法";

      // Get time - look for pattern like "2026-02-07 21:28"
      const timeMatch = textContent.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
      const likedAt = timeMatch ? timeMatch[1] : "";

      // Get title link (回答/文章) or pin link (想法)
      let title = "";
      let url = "";
      let author = "";

      if (type === "赞同了想法") {
        // For 想法, the link contains "/pin/"
        const pinLink = item.querySelector(
          'a[href*="/pin/"]'
        ) as HTMLAnchorElement;
        if (pinLink) {
          url = pinLink.href;
          // Title is a snippet of the content
          const snippet = item.textContent?.slice(0, 100) || "";
          title = snippet.replace(/赞同了想法.*?\d{2}:\d{2}/, "").trim();
        }
        // Author is in profile link
        const authorLink = item.querySelector(
          'a[href*="/people/"]'
        ) as HTMLAnchorElement;
        if (authorLink) {
          author = authorLink.textContent?.trim() || "";
        }
      } else {
        // For 回答/文章
        const contentLink = item.querySelector(
          'a[href*="/question/"], a[href*="zhuanlan.zhihu.com"]'
        ) as HTMLAnchorElement;
        if (contentLink) {
          url = contentLink.href;
          title = contentLink.textContent?.trim() || "";
        }
        // Author is in profile link after the title
        const authorLinks = item.querySelectorAll('a[href*="/people/"]');
        if (authorLinks.length > 0) {
          author = authorLinks[0].textContent?.trim() || "";
        }
      }

      if (url && likedAt) {
        likes.push({ type, title, url, author, likedAt });
      }
    });

    return likes;
  });
}

function getKnownLikeIds(): Set<string> {
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" "SELECT content FROM inbox WHERE source = 'zhihu_like'" 2>/dev/null`,
      { encoding: "utf-8" }
    );
    const ids = new Set<string>();
    result.split("\n").forEach((line) => {
      try {
        const data = JSON.parse(line);
        if (data.likeId) ids.add(data.likeId);
      } catch {
        // ignore parse errors
      }
    });
    return ids;
  } catch {
    return new Set();
  }
}

function insertToInbox(like: LikeInfo): void {
  const content = JSON.stringify(like).replace(/'/g, "''");
  const sql = `INSERT INTO inbox (source, content) VALUES ('zhihu_like', '${content}');`;
  execSync(`sqlite3 "${DB_PATH}"`, { input: sql });
  console.log(
    `[${new Date().toISOString()}] New like: ${like.type} - ${like.title.slice(0, 50)}`
  );
}

async function checkForNewLikes(
  page: Page,
  knownIds: Set<string>
): Promise<void> {
  await page.goto(USER_PROFILE_URL, { waitUntil: "domcontentloaded" });
  // Wait for activity items to load
  await page.waitForSelector('a[href*="/question/"], a[href*="/pin/"]', {
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  const likes = await extractLikes(page);
  console.log(`[${new Date().toISOString()}] Found ${likes.length} like items`);

  for (const like of likes) {
    // Generate unique ID for dedup
    const likeId = hashString(like.url + like.likedAt);
    like.likeId = likeId;

    if (!knownIds.has(likeId)) {
      insertToInbox(like);
      knownIds.add(likeId);
    }
  }
}

// Detailed description for --describe
const DESCRIPTION = `
Monitor Zhihu Likes (知乎点赞记录)

目的：
  监控知乎用户 renjiyun 的点赞动态，追踪感兴趣的内容方向

监控用户：
  ${USER_PROFILE_URL}

采集内容：
  - 点赞类型（赞同了回答/文章/想法）
  - 标题、链接、作者
  - 点赞时间

存储位置：
  - ${DB_PATH} → inbox 表
  - source: "zhihu_like"

与抖音账号关系：
  - 点赞内容 → 反映兴趣方向
  - 高质量回答 → 内容素材来源
  - 热门话题 → 选题参考

运行参数：
  --interval <minutes>  轮询间隔（默认 60 分钟）
  --describe            显示此详细描述
`.trim();

async function main(): Promise<void> {
  program
    .name("monitor-zhihu-likes")
    .description("Monitor Zhihu likes (点赞记录)")
    .option(
      "-i, --interval <minutes>",
      "Polling interval in minutes",
      "60"
    )
    .option("-d, --describe", "Show detailed description")
    .parse();

  const opts = program.opts();

  if (opts.describe) {
    console.log(DESCRIPTION);
    process.exit(0);
  }

  const intervalMs = parseInt(opts.interval, 10) * 60 * 1000;

  console.log(`Starting Zhihu likes monitor with interval: ${opts.interval} minutes`);
  console.log(`User profile: ${USER_PROFILE_URL}`);

  const wsUrl = await getWebSocketUrl();
  const browser = await chromium.connectOverCDP(wsUrl);
  const context = browser.contexts()[0];
  const page = await context.newPage();

  const knownIds = getKnownLikeIds();
  console.log(`Known likes: ${knownIds.size}`);

  // Initial check
  await checkForNewLikes(page, knownIds);

  // Polling loop
  setInterval(async () => {
    try {
      await checkForNewLikes(page, knownIds);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error:`, err);
    }
  }, intervalMs);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
